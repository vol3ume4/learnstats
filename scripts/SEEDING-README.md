# Question Seeding System

Automated background question generation with pause/resume capability.

## Quick Start

### Windows (Easiest)
```bash
# Start generation
scripts\seed-control.bat start

# Check progress
scripts\seed-control.bat status

# Pause
scripts\seed-control.bat pause

# Resume
scripts\seed-control.bat resume

# Reset and start over
scripts\seed-control.bat reset
```

### Manual Control
```bash
# Check what needs to be generated
node scripts/seed-questions-bg.js

# Start generation
node scripts/seed-questions-bg.js --auto

# Pause (in another terminal)
echo. > scripts/seed-pause.flag

# Resume
del scripts\seed-pause.flag
node scripts/seed-questions-bg.js --auto

# Reset progress
del scripts\seed-progress.json
```

## How It Works

1. **State Persistence**: Progress saved in `scripts/seed-progress.json`
2. **Pause/Resume**: Create `scripts/seed-pause.flag` to pause gracefully
3. **Background Friendly**: Runs independently, can be stopped/started anytime
4. **Rate Limited**: 2-second delay between batches (gentle on Gemini API)
5. **Batch Size**: Generates 5 questions at a time

## Files

- `seed-questions-bg.js` - Main background seeding script
- `seed-control.bat` - Windows control script
- `seed-progress.json` - Current progress (auto-created)
- `seed-pause.flag` - Pause signal (create to pause)
- `seed-output.log` - Output log (when using control script)

## Progress Tracking

The script shows:
- Current combination being processed
- Questions generated so far
- Estimated time remaining
- Batch count

## Goal

Generate 30 questions for each:
- Topic × Pattern × Difficulty combination
- Total: ~6,000 questions
- Estimated time: 40-60 minutes (with 2s delays)

## Tips

- Run overnight for uninterrupted generation
- Check `seed-output.log` for detailed progress
- Pause before system shutdown to save progress
- Resume anytime - picks up exactly where it left off
