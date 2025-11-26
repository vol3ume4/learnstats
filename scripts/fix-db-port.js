const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    if (content.includes(':5432')) {
        const newContent = content.replace(':5432', ':6543');
        fs.writeFileSync(envPath, newContent);
        console.log('✅ Successfully updated DATABASE_URL port from 5432 to 6543 in .env.local');
    } else if (content.includes(':6543')) {
        console.log('ℹ️ .env.local is already using port 6543.');
    } else {
        console.log('⚠️ Could not find port 5432 in DATABASE_URL. Please check manually.');
    }
} catch (err) {
    console.error('❌ Error updating .env.local:', err.message);
}
