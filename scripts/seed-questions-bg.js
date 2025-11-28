require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const STATE_FILE = path.join(__dirname, 'seed-progress.json');
const PAUSE_FILE = path.join(__dirname, 'seed-pause.flag');
const TARGET_QUESTIONS = 5; // Changed from 30 to 5

// Load or initialize state
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return {
    currentIndex: 0,
    totalGenerated: 0,
    batchCount: 0,
    startTime: Date.now(),
    lastUpdate: Date.now()
  };
}

// Save state
function saveState(state) {
  state.lastUpdate = Date.now();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Check if pause requested
function isPauseRequested() {
  return fs.existsSync(PAUSE_FILE);
}

// Remove pause flag
function clearPause() {
  if (fs.existsSync(PAUSE_FILE)) {
    fs.unlinkSync(PAUSE_FILE);
  }
}

async function checkAndSeedQuestions() {
  let state = loadState();

  try {
    console.log('🔍 Checking question coverage...\n');

    // Get all topic-pattern-difficulty combinations
    const query = `
      SELECT 
        t.id as topic_id,
        t.name as topic_name,
        p.id as pattern_id,
        p.pattern as pattern_name,
        d.difficulty,
        COUNT(q.id) as question_count
      FROM topics t
      CROSS JOIN patterns p
      CROSS JOIN (
        SELECT 'Easy' as difficulty
        UNION SELECT 'Medium'
        UNION SELECT 'Hard'
      ) d
      LEFT JOIN questions q ON 
        q.topic_id = t.id AND 
        q.pattern_id = p.id AND 
        q.difficulty = d.difficulty
      WHERE p.topic_id = t.id
      GROUP BY t.id, t.name, p.id, p.pattern, d.difficulty
      ORDER BY t.id, p.id, d.difficulty
    `;

    const result = await pool.query(query);

    // Find gaps (where count < TARGET_QUESTIONS)
    const gaps = result.rows.filter(row => row.question_count < TARGET_QUESTIONS);

    if (gaps.length === 0) {
      console.log(`✅ All topic-pattern-difficulty combinations have at least ${TARGET_QUESTIONS} questions!`);
      console.log('\n📊 Summary:');
      console.log(`Total combinations: ${result.rows.length}`);
      console.log(`Minimum questions needed: ${result.rows.length * TARGET_QUESTIONS}`);
      console.log(`Questions in database: ${result.rows.reduce((sum, r) => sum + parseInt(r.question_count), 0)}`);

      // Clean up state file
      if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
      }
      return;
    }

    // Calculate progress
    const totalNeeded = gaps.reduce((sum, g) => sum + (TARGET_QUESTIONS - parseInt(g.question_count)), 0);
    const completed = state.currentIndex;
    const remaining = gaps.length - completed;

    console.log(`📋 Progress: ${completed}/${gaps.length} combinations (${Math.round(completed / gaps.length * 100)}%)`);
    console.log(`🎯 Questions remaining: ~${totalNeeded - state.totalGenerated}`);
    console.log(`📦 Batches completed: ${state.batchCount}\n`);

    if (completed > 0) {
      const elapsed = Date.now() - state.startTime;
      const avgTimePerCombo = elapsed / completed;
      const estimatedRemaining = (avgTimePerCombo * remaining) / 1000 / 60;
      console.log(`⏱️  Estimated time remaining: ~${Math.round(estimatedRemaining)} minutes\n`);
    }

    if (!process.argv.includes('--auto')) {
      console.log('Commands:');
      console.log('  node scripts/seed-questions-bg.js --auto     # Start/Resume generation');
      console.log('  touch scripts/seed-pause.flag                # Pause (will stop after current batch)');
      console.log('  rm scripts/seed-pause.flag                   # Clear pause flag');
      console.log('  rm scripts/seed-progress.json                # Reset progress\n');
      return;
    }

    // Clear any existing pause flag
    clearPause();

    // Start/Resume generation
    console.log('🚀 Starting generation...\n');
    console.log('💡 To pause: Create file "scripts/seed-pause.flag"\n');
    await generateMissingQuestions(gaps, state);

  } catch (error) {
    console.error('❌ Error:', error);
    saveState(state);
  } finally {
    await pool.end();
  }
}

async function generateMissingQuestions(gaps, state) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Start from where we left off
  for (let gapIndex = state.currentIndex; gapIndex < gaps.length; gapIndex++) {
    const gap = gaps[gapIndex];
    const needed = TARGET_QUESTIONS - parseInt(gap.question_count);

    console.log(`\n[${gapIndex + 1}/${gaps.length}] 📝 ${gap.topic_name} > ${gap.pattern_name} [${gap.difficulty}]`);
    console.log(`   Current: ${gap.question_count}/${TARGET_QUESTIONS}, Generating: ${needed}`);

    // Check for pause request before starting
    if (isPauseRequested()) {
      console.log('\n\n⏸️  PAUSE REQUESTED - Saving progress...');
      state.currentIndex = gapIndex;
      saveState(state);
      console.log(`✅ Progress saved. Resume with: node scripts/seed-questions-bg.js --auto`);
      console.log(`📊 Generated ${state.totalGenerated} questions in ${state.batchCount} batches`);
      return;
    }

    state.batchCount++;

    try {
      console.log(`   Generating ${needed} questions...`);

      const prompt = `Generate ${needed} unique statistics questions for:
Topic: ${gap.topic_name}
Pattern: ${gap.pattern_name}
Difficulty: ${gap.difficulty}

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Full question text with all context",
    "answer": "Detailed answer with step-by-step solution",
    "hint_stats": "Statistical concept hint",
    "hint_python": "Python/code implementation hint"
  }
]

Make questions practical, clear, and progressively challenging for ${gap.difficulty} level.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log(`   ⚠️  Failed to parse JSON, skipping`);
        continue;
      }

      // Sanitize JSON - remove control characters
      const sanitized = jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, '');
      const questions = JSON.parse(sanitized);

      // Insert questions
      for (const q of questions) {
        await pool.query(
          `INSERT INTO questions (
              topic_id, pattern_id, difficulty, 
              question_text, correct_answer, solution,
              hint_stats, hint_python, source
            )
             VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'ai_generated')`,
          [gap.topic_id, gap.pattern_id, gap.difficulty, q.question, q.answer, q.hint_stats, q.hint_python]
        );
        state.totalGenerated++;
      }

      console.log(`   ✅ Added ${questions.length} questions (Total: ${state.totalGenerated})`);

      // Save progress after each combination
      state.currentIndex = gapIndex + 1;
      saveState(state);

      // Rate limiting: wait 2 seconds between combinations
      if (gapIndex + 1 < gaps.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      // Continue with next combination
    }
  }

  // All done!
  console.log(`\n\n🎉 Generation complete!`);
  console.log(`📊 Total questions generated: ${state.totalGenerated}`);
  console.log(`📦 API calls made: ${state.batchCount}`);
  console.log(`⏱️  Total time: ${Math.round((Date.now() - state.startTime) / 1000 / 60)} minutes`);

  // Clean up state file
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}

checkAndSeedQuestions();
