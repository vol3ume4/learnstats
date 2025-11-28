require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function testSingleTopic() {
    try {
        console.log('🧪 Testing question generation for ONE topic...\n');

        // Get first topic with a pattern that needs questions
        const result = await pool.query(`
      SELECT 
        t.id as topic_id, t.name as topic_name,
        p.id as pattern_id, p.pattern as pattern_name,
        'Easy' as difficulty,
        COUNT(q.id) as question_count
      FROM topics t
      JOIN patterns p ON p.topic_id = t.id
      LEFT JOIN questions q ON q.topic_id = t.id AND q.pattern_id = p.id AND q.difficulty = 'Easy'
      GROUP BY t.id, t.name, p.id, p.pattern
      HAVING COUNT(q.id) < 5
      LIMIT 1
    `);

        if (result.rows.length === 0) {
            console.log('✅ No topics need questions!');
            return;
        }

        const target = result.rows[0];
        const needed = 5 - parseInt(target.question_count);

        console.log(`📚 Topic: ${target.topic_name}`);
        console.log(`📝 Pattern: ${target.pattern_name}`);
        console.log(`🎯 Difficulty: ${target.difficulty}`);
        console.log(`📊 Current: ${target.question_count}/5, Need: ${needed}\n`);

        // Generate questions
        console.log('🤖 Calling Gemini API...');
        const prompt = `Generate ${needed} unique statistics questions for:
Topic: ${target.topic_name}
Pattern: ${target.pattern_name}
Difficulty: ${target.difficulty}

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Full question text",
    "answer": "Detailed answer",
    "hint_stats": "Statistical hint",
    "hint_python": "Python hint"
  }
]`;

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        console.log('✅ Got response from Gemini\n');

        // Parse JSON
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.log('❌ Failed to parse JSON from response');
            console.log('Response:', text.substring(0, 500));
            return;
        }

        const questions = JSON.parse(jsonMatch[0]);
        console.log(`📦 Parsed ${questions.length} questions\n`);

        // Insert into database
        console.log('💾 Inserting into database...');
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            await pool.query(
                `INSERT INTO questions (
          topic_id, pattern_id, difficulty, 
          question_text, correct_answer, solution,
          hint_stats, hint_python, source
        )
        VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'ai_generated')`,
                [target.topic_id, target.pattern_id, target.difficulty, q.question, q.answer, q.hint_stats, q.hint_python]
            );
            console.log(`  ✓ Inserted question ${i + 1}/${questions.length}`);
        }

        console.log('\n🎉 Success! Test completed.');
        console.log('\nSample question:');
        console.log(`Q: ${questions[0].question.substring(0, 100)}...`);
        console.log(`A: ${questions[0].answer.substring(0, 100)}...`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) {
            console.error('\nStack:', error.stack.split('\n').slice(0, 3).join('\n'));
        }
    } finally {
        await pool.end();
    }
}

testSingleTopic();
