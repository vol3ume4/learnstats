# Classroom Management System - Feature Specification

## Current Status ✅
- [x] Teacher can create classrooms
- [x] Teacher can view classroom list
- [x] Teacher can delete classrooms
- [x] Students can join via invite code
- [x] Teacher can create assignments with topic/pattern selection
- [x] Auto-progression: Easy (3) → Medium (4) → Hard (5)

---

## 🎯 TEACHER FEATURES

### 1. Classroom Management
**Current:** ✅ Basic CRUD
**Missing:**
- [ ] Edit classroom (name, description)
- [ ] Archive/deactivate classroom (instead of delete)
- [ ] View enrolled students list
- [ ] Remove student from classroom
- [ ] Regenerate invite code
- [ ] Classroom statistics dashboard
  - Total students
  - Active students (logged in last 7 days)
  - Average completion rate
  - Most struggled patterns

### 2. Assignment Management
**Current:** ✅ Create assignments with patterns
**Missing:**
- [ ] **View assignment details**
  - Which patterns/difficulties included
  - Due date
  - Student progress overview
- [ ] **Edit assignment**
  - Change title, description, due date
  - Add/remove patterns
  - Cannot edit if students have started
- [ ] **Delete assignment**
  - Soft delete (keep student progress data)
  - Confirmation dialog
- [ ] **Duplicate assignment**
  - Quick way to create similar assignments
- [ ] **Assignment templates**
  - Save common pattern combinations as templates
  - Quick assignment creation from templates

### 3. Student Progress Tracking
**Missing:**
- [ ] **Assignment progress view**
  - List of students with completion %
  - Who hasn't started
  - Who's in progress
  - Who's completed
- [ ] **Individual student view**
  - All assignments for this student
  - Completion status per assignment
  - Time spent
  - Accuracy rate
- [ ] **Pattern-level analytics**
  - Which patterns are students struggling with
  - Average attempts per difficulty
  - Common mistakes (if we track wrong answers)

### 4. Notifications & Communication
**Missing:**
- [ ] Send announcement to classroom
- [ ] Notify students when new assignment is created
- [ ] Remind students of upcoming due dates
- [ ] Message individual student

---

## 👨‍🎓 STUDENT FEATURES

### 1. Classroom View
**Current:** ✅ Can join classroom
**Missing:**
- [ ] **My Classrooms page**
  - List of enrolled classrooms
  - Quick stats per classroom
- [ ] **Classroom detail page**
  - See all assignments for this classroom
  - Teacher info
  - Classmates count

### 2. Assignment View
**Missing:**
- [ ] **Assignments list**
  - Upcoming assignments (sorted by due date)
  - Completed assignments
  - Overdue assignments (highlighted)
- [ ] **Assignment detail page**
  - What patterns/topics to practice
  - Due date countdown
  - Current progress (e.g., "Easy: 3/3, Medium: 1/4, Hard: 0/5")
  - "Start Practice" button → goes to practice page with filtered questions

### 3. Practice Integration
**Current:** ✅ Student can practice any topic/pattern
**Missing:**
- [ ] **Assignment-driven practice**
  - Practice page shows "Working on: [Assignment Name]"
  - Questions filtered to assignment patterns
  - Progress bar shows assignment completion
  - Auto-advance through Easy → Medium → Hard
  - Mark assignment as complete when all done
- [ ] **Assignment completion tracking**
  - Track which questions answered for which assignment
  - Link practice_history to assignments

### 4. Progress & Feedback
**Missing:**
- [ ] **Assignment completion notification**
  - "Congratulations! You completed [Assignment]"
  - Show stats (accuracy, time taken)
- [ ] **Progress dashboard**
  - Assignments completed vs pending
  - Overall accuracy across assignments
  - Patterns mastered

---

## 🗄️ DATABASE CHANGES NEEDED

### New Tables
```sql
-- Track which questions were answered for which assignment
CREATE TABLE assignment_question_attempts (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id),
  student_id UUID REFERENCES auth.users(id),
  pattern_id INTEGER REFERENCES patterns(id),
  difficulty VARCHAR(10),
  question_id INTEGER REFERENCES questions(id),
  attempt_id INTEGER REFERENCES practice_history(id),
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Track overall assignment completion
CREATE TABLE assignment_student_progress (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id),
  student_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  is_complete BOOLEAN DEFAULT false,
  UNIQUE(assignment_id, student_id)
);
```

### Schema Updates
```sql
-- Add status to assignments
ALTER TABLE assignments ADD COLUMN status VARCHAR(20) DEFAULT 'active';
-- 'draft', 'active', 'archived'

-- Add notification preferences
ALTER TABLE classrooms ADD COLUMN notify_on_new_assignment BOOLEAN DEFAULT true;
```

---

## 📋 PROPOSED IMPLEMENTATION PHASES

### **Phase 1: Core Assignment Workflow** (Highest Priority)
**Goal:** Students can see and complete assignments

1. **Student: My Classrooms Page** (`/student/classrooms`)
   - List enrolled classrooms
   - Click to view classroom detail

2. **Student: Classroom Detail Page** (`/student/classroom/[id]`)
   - Show assignments for this classroom
   - Status badges (Not Started, In Progress, Completed, Overdue)
   - "Start Practice" button

3. **Student: Assignment-Driven Practice**
   - Modify practice page to accept `?assignmentId=X`
   - Filter questions to assignment patterns
   - Track progress per assignment
   - Show progress bar
   - Mark complete when done

4. **Teacher: View Assignment Details**
   - Click assignment to see details
   - List of patterns included
   - Student progress table (name, status, completion %)

### **Phase 2: Assignment Management** (Medium Priority)
1. Edit assignment (if no students started)
2. Delete assignment (soft delete)
3. Duplicate assignment
4. Archive classroom

### **Phase 3: Analytics & Insights** (Lower Priority)
1. Classroom statistics dashboard
2. Pattern-level analytics
3. Individual student progress view
4. Export reports (CSV)

### **Phase 4: Communication** (Optional)
1. Announcements
2. Email notifications
3. Due date reminders

---

## 🎨 UI/UX IMPROVEMENTS

### Teacher Dashboard
```
┌─────────────────────────────────────────┐
│ My Classrooms                     [+ Create] │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Statistics 101                      │ │
│ │ Code: ABC123  |  24 students       │ │
│ │ 3 active assignments               │ │
│ │ [Manage] [View Students] [Archive] │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Student Dashboard
```
┌─────────────────────────────────────────┐
│ My Classrooms                            │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Statistics 101                      │ │
│ │ 2 pending assignments  |  1 overdue │ │
│ │ [View Assignments]                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Assignment Card (Student View)
```
┌─────────────────────────────────────────┐
│ Week 1: Introduction to Data            │
│ Due: Nov 30, 2025 (2 days left)        │
│                                         │
│ Progress: ████████░░░░ 60%             │
│ Easy: 3/3 ✓  Medium: 2/4  Hard: 0/5   │
│                                         │
│ [Continue Practice]                     │
└─────────────────────────────────────────┘
```

---

## ❓ QUESTIONS FOR YOU

1. **Phase 1 Priority:** Should we start with Phase 1 (student assignment workflow)?
   
2. **Progress Tracking:** Should we track:
   - Just completion (yes/no)?
   - OR detailed attempts (which questions, accuracy, time)?

3. **Assignment Editing:** Should teachers be able to edit assignments after students start?
   - Option A: No editing once started (safer)
   - Option B: Allow editing but notify students of changes

4. **Notifications:** Do you want email notifications or just in-app?

5. **Grading:** Should assignments have grades/scores, or just completion status?

6. **Due Dates:** What happens after due date?
   - Students can still complete (just marked late)?
   - OR locked (cannot submit)?

---

## 🚀 RECOMMENDATION

**Start with Phase 1** - this gives you a complete, usable classroom system:
- Students can see their assignments
- Students can practice with assignment context
- Teachers can see who's completed what
- Clean, focused implementation

Then we can add Phase 2-4 features based on actual usage feedback.

**Agree?**
