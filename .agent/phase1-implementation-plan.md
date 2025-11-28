# Phase 1 Implementation Plan
## Core Assignment Workflow for Students

### 📋 Requirements Summary
- ✅ Track completion using existing streak/level system
- ✅ Teachers can ADD/DELETE patterns, extend due dates (no other edits)
- ✅ Email + in-app notifications for students
- ✅ Completion status only (no grades)
- ✅ Late submissions allowed (marked as late)

---

## 🗄️ Database Changes

### 1. Create Assignment Progress Tracking Table
```sql
CREATE TABLE assignment_student_progress (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  is_complete BOOLEAN DEFAULT false,
  is_late BOOLEAN DEFAULT false,
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_assignment_progress_student ON assignment_student_progress(student_id);
CREATE INDEX idx_assignment_progress_assignment ON assignment_student_progress(assignment_id);
```

### 2. Add Email Column to Profiles (if not exists)
```sql
-- Check if we need this
ALTER TABLE profiles ADD COLUMN email TEXT;
```

### 3. Add Status to Assignments
```sql
ALTER TABLE assignments ADD COLUMN status VARCHAR(20) DEFAULT 'active';
-- Values: 'draft', 'active', 'archived'
```

---

## 🎯 Implementation Steps

### Step 1: Database Setup
**Files to create:**
- `scripts/create-assignment-progress-table.js`
- `scripts/update-assignments-schema.js`

### Step 2: Student - My Classrooms Page
**New files:**
- `app/student/classrooms/page.js`
- `app/student/classrooms/ClassroomsClient.js`

**API needed:**
- `app/api/student/my-classrooms/route.js` (GET)
  - Returns classrooms student is enrolled in
  - Include assignment counts

**Features:**
- List of enrolled classrooms
- Show: classroom name, teacher, student count, assignment count
- Click to go to classroom detail

### Step 3: Student - Classroom Detail Page
**New files:**
- `app/student/classroom/[id]/page.js`
- `app/student/classroom/[id]/ClassroomDetailClient.js`

**API needed:**
- `app/api/student/classroom-assignments/route.js` (GET)
  - Takes classroomId
  - Returns assignments for this classroom
  - Include student's progress for each assignment

**Features:**
- Classroom info (name, teacher, invite code)
- List of assignments with:
  - Title, description, due date
  - Status badge: "Not Started", "In Progress", "Completed", "Overdue"
  - Progress bar (based on pattern completion)
  - "Start Practice" / "Continue Practice" button

### Step 4: Assignment-Driven Practice
**Modify existing:**
- `app/student/page.js` (main practice page)

**Changes:**
- Accept URL param: `?assignmentId=X`
- If assignmentId present:
  - Show "Working on: [Assignment Name]" banner
  - Filter topic/pattern picker to only show assignment patterns
  - Track which assignment this practice session is for
  - Show assignment progress in sidebar
  - Auto-mark assignment complete when all patterns done

**API updates:**
- `app/api/student/save-attempt/route.js`
  - Add optional `assignmentId` parameter
  - Update assignment progress when patterns completed

### Step 5: Assignment Progress Calculation
**New API:**
- `app/api/student/assignment-progress/route.js` (GET, POST)
  - GET: Calculate current progress for an assignment
  - POST: Mark assignment as started/completed

**Logic:**
- For each pattern in assignment:
  - Check if student has completed the streak for Easy, Medium, Hard
  - Easy: 3 correct in a row
  - Medium: 4 correct in a row (unlocked after Easy)
  - Hard: 5 correct in a row (unlocked after Medium)
- Assignment complete when ALL patterns at ALL levels are done
- Check if completed after due date → mark as late

### Step 6: Teacher - View Assignment Progress
**Modify existing:**
- `app/teacher/classroom/[id]/ClassroomDetailClient.js`

**Changes:**
- Make assignment cards clickable
- Create assignment detail view (modal or new page)

**New component:**
- `AssignmentProgressView.js`
  - Shows list of students
  - Columns: Name, Status, Progress %, Started Date, Completed Date
  - Filter: All / Not Started / In Progress / Completed / Late

**API needed:**
- `app/api/teacher/assignment-progress/route.js` (GET)
  - Takes assignmentId
  - Returns all students in classroom with their progress

### Step 7: Teacher - Edit Assignment
**Modify existing:**
- `app/teacher/classroom/[id]/ClassroomDetailClient.js`

**Features:**
- "Edit" button on assignment cards
- Modal similar to create, but:
  - Can ADD patterns (checkbox them)
  - Can REMOVE patterns (uncheck them)
  - Can extend due date (date picker, only future dates)
  - Cannot change title/description (or make read-only)
  - Show warning: "X students have started this assignment"

**API update:**
- `app/api/teacher/assignments/route.js` (PUT)
  - Validate: can only add/remove patterns, extend due date
  - Log changes for audit trail

### Step 8: Notifications (Basic)
**In-app only for Phase 1, email in Phase 2**

**New table:**
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API:**
- `app/api/student/notifications/route.js` (GET, PUT)
  - GET: Fetch unread notifications
  - PUT: Mark as read

**Trigger notifications when:**
- New assignment created → notify all students in classroom
- Assignment due date approaching (1 day before)
- Assignment completed → notify teacher

**UI:**
- Bell icon in student header
- Badge with unread count
- Dropdown with recent notifications

---

## 📁 File Structure

```
app/
├── student/
│   ├── classrooms/
│   │   ├── page.js
│   │   └── ClassroomsClient.js
│   ├── classroom/
│   │   └── [id]/
│   │       ├── page.js
│   │       └── ClassroomDetailClient.js
│   └── page.js (modify for assignment mode)
├── teacher/
│   └── classroom/
│       └── [id]/
│           ├── ClassroomDetailClient.js (modify)
│           └── AssignmentProgressView.js (new)
├── api/
│   ├── student/
│   │   ├── my-classrooms/route.js
│   │   ├── classroom-assignments/route.js
│   │   ├── assignment-progress/route.js
│   │   └── notifications/route.js
│   └── teacher/
│       ├── assignment-progress/route.js
│       └── assignments/route.js (modify PUT)
└── components/
    └── NotificationBell.js (new)

scripts/
├── create-assignment-progress-table.js
├── create-notifications-table.js
└── update-assignments-schema.js
```

---

## 🎨 UI Mockups

### Student: My Classrooms
```
┌─────────────────────────────────────────┐
│ 🏫 My Classrooms                        │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Statistics 101                      │ │
│ │ Teacher: Prof. Smith                │ │
│ │ 24 students  •  3 assignments       │ │
│ │ [View Assignments →]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Data Science Basics                 │ │
│ │ Teacher: Dr. Johnson                │ │
│ │ 18 students  •  5 assignments       │ │
│ │ [View Assignments →]                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Student: Classroom Assignments
```
┌─────────────────────────────────────────┐
│ ← Back to Classrooms                    │
│                                         │
│ Statistics 101                          │
│ Invite Code: ABC123  •  24 students    │
├─────────────────────────────────────────┤
│ Assignments                             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Week 1: Introduction to Data        │ │
│ │ Due: Nov 30, 2025 (2 days left) ⏰  │ │
│ │                                     │ │
│ │ Progress: ████████░░░░ 60%         │ │
│ │ Easy: 3/3 ✓  Medium: 2/4  Hard: 0/5│ │
│ │                                     │ │
│ │ [Continue Practice →]               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Week 2: Probability Basics          │ │
│ │ Due: Dec 7, 2025 (9 days left)     │ │
│ │                                     │ │
│ │ Not Started                         │ │
│ │                                     │ │
│ │ [Start Practice →]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Week 0: Warm-up                     │ │
│ │ Due: Nov 25, 2025 (OVERDUE) 🔴     │ │
│ │                                     │ │
│ │ Completed (Late) ✓                  │ │
│ │ Completed on: Nov 27, 2025          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Teacher: Assignment Progress View
```
┌─────────────────────────────────────────┐
│ Week 1: Introduction to Data            │
│ Due: Nov 30, 2025                       │
│                                         │
│ 4 patterns • Easy (3) → Medium (4) → Hard (5) │
├─────────────────────────────────────────┤
│ Student Progress                        │
│                                         │
│ Filter: [All ▼] [Not Started] [In Progress] [Completed] │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Name          Status      Progress  │ │
│ ├─────────────────────────────────────┤ │
│ │ Alice Smith   Completed   100% ✓   │ │
│ │ Bob Jones     In Progress  60%     │ │
│ │ Carol White   Not Started  0%      │ │
│ │ Dave Brown    Completed    100% 🔴 │ │
│ │               (Late)                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Summary: 2 completed, 1 in progress, 1 not started │
└─────────────────────────────────────────┘
```

---

## ⚙️ Implementation Order

1. ✅ **Database setup** (30 min)
   - Run migration scripts
   - Test tables created

2. ✅ **Student APIs** (2 hours)
   - my-classrooms
   - classroom-assignments
   - assignment-progress

3. ✅ **Student UI - Classrooms List** (1 hour)
   - Page + client component
   - Connect to API

4. ✅ **Student UI - Classroom Detail** (2 hours)
   - Assignment cards
   - Progress calculation
   - Status badges

5. ✅ **Assignment-Driven Practice** (3 hours)
   - Modify practice page
   - Filter patterns
   - Track progress
   - Auto-complete logic

6. ✅ **Teacher - Assignment Progress View** (2 hours)
   - API
   - UI component
   - Student list with progress

7. ✅ **Teacher - Edit Assignment** (1.5 hours)
   - Modal UI
   - API update
   - Validation

8. ✅ **Notifications** (2 hours)
   - Table + API
   - Bell icon component
   - Trigger on assignment create

**Total: ~14 hours of focused work**

---

## 🚀 Ready to Start?

I'll implement this step-by-step. Should I:
1. Start with database setup?
2. Or would you like to review/modify anything first?
