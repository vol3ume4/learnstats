require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkAndSeedQuestions() {
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

        // Find gaps (where count < 30)
        const gaps = result.rows.filter(row => row.question_count < 30);

        if (gaps.length === 0) {
            console.log('✅ All topic-pattern-difficulty combinations have 30 questions!');
            console.log('\n📊 Summary:');
            console.log(`Total combinations: ${result.rows.length}`);
            console.log(`Total questions needed: ${result.rows.length * 30}`);
            console.log(`Questions in database: ${result.rows.reduce((sum, r) => sum + parseInt(r.question_count), 0)}`);
            pool.end();
            return;
        }

        console.log(`📋 Found ${gaps.length} combinations needing questions:\n`);

        // Group gaps by topic for better display
        const gapsByTopic = {};
        gaps.forEach(gap => {
            if (!gapsByTopic[gap.topic_name]) {
                gapsByTopic[gap.topic_name] = [];
            }
            gapsByTopic[gap.topic_name].push(gap);
        });

        // Display summary
        Object.entries(gapsByTopic).forEach(([topic, patterns]) => {
            console.log(`📚 ${topic}:`);
            patterns.forEach(p => {
                const needed = 30 - parseInt(p.question_count);
                console.log(`   ${p.pattern_name} [${p.difficulty}]: ${p.question_count}/30 (need ${needed})`);
            });
            console.log('');
        });

        // Calculate total needed
        const totalNeeded = gaps.reduce((sum, g) => sum + (30 - parseInt(g.question_count)), 0);
        console.log(`\n🎯 Total questions to generate: ${totalNeeded}`);
        console.log(`📦 Batches of 5: ~${Math.ceil(totalNeeded / 5)} API calls\n`);

        // Ask for confirmation
        console.log('⚠️  This will make API calls to Gemini.');
        console.log('💡 Run with --auto flag to start generation automatically.\n');

        if (!process.argv.includes('--auto')) {
            console.log('To start generation, run:');
            console.log('  node scripts/seed-questions-resume.js --auto\n');
            pool.end();
            return;
        }

        // Start generation
        console.log('🚀 Starting question generation...\n');
        await generateMissingQuestions(gaps);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        pool.end();
    }
}

async function generateMissingQuestions(gaps) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let totalGenerated = 0;
    let batchCount = 0;

    for (const gap of gaps) {
        const needed = 30 - parseInt(gap.question_count);
        console.log(`\n📝 ${gap.topic_name} > ${gap.pattern_name} [${gap.difficulty}]`);
        console.log(`   Current: ${gap.question_count}/30, Generating: ${needed}`);

        // Generate in batches of 5
        for (let i = 0; i < needed; i += 5) {
            const batchSize = Math.min(5, needed - i);
            batchCount++;

            try {
                console.log(`   Batch ${Math.floor(i / 5) + 1}: Generating ${batchSize} questions...`);

                const prompt = `Generate ${batchSize} unique statistics questions for:
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
                    console.log(`   ⚠️  Failed to parse JSON, skipping batch`);
                    continue;
                }

                const questions = JSON.parse(jsonMatch[0]);

                // Insert questions
                for (const q of questions) {
                    await pool.query(
                        `INSERT INTO questions (topic_id, pattern_id, difficulty, question, answer, hint_stats, hint_python, is_ai_generated)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
                        [gap.topic_id, gap.pattern_id, gap.difficulty, q.question, q.answer, q.hint_stats, q.hint_python]
                    );
                    totalGenerated++;
                }

                console.log(`   ✅ Added ${questions.length} questions (Total: ${totalGenerated})`);

                // Rate limiting: wait 2 seconds between batches
                if (i + 5 < needed) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

            } catch (error) {
                console.log(`   ❌ Error in batch: ${error.message}`);
                // Continue with next batch
            }
        }
    }

    console.log(`\n\n🎉 Generation complete!`);
    console.log(`📊 Total questions generated: ${totalGenerated}`);
    console.log(`📦 API calls made: ${batchCount}`);
}

checkAndSeedQuestions();
