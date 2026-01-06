# Exam Scheduler Web Application

## Overview
The **Exam Scheduler** is a web-based application designed to manage university exam schedules efficiently. It allows administrators to create and manage exams while ensuring scheduling conflicts are detected and prevented. Students can log in to view and build their personal exam schedules in a clear and structured way.

This project was developed as a **two-person academic project** and focuses on correctness, clarity, and practical system design.

---

## System Architecture
The application follows a **hybrid full-stack architecture**:

- **Next.js (App Router)** for the frontend and routing
- A **custom backend layer** for business logic, validation, and database access
- A shared API layer connecting the frontend and backend

This structure improves maintainability and reflects real-world system design practices.

---

## Admin Interface

The admin interface is divided into **three main sections**.

### Dashboard (Exam Overview)
The admin dashboard provides a time-based overview of exams:

- **Past exams**  
  Exams from **one day before** the current date

- **Current and upcoming exams**  
  Exams scheduled for **today and the next two days**

This allows administrators to quickly review recent exams and prepare for upcoming ones.

---

### Upload Page (Bulk Exam Upload)
Admins can upload exam data in bulk using spreadsheet files.

#### Supported file types
- CSV (`.csv`)
- Excel (`.xls`, `.xlsx`)

Uploaded files typically contain:
- Class code
- Date
- Start time
- End time
- Classroom

#### Clash handling during upload
- Each exam is validated before being added
- If an uploaded exam **clashes with an existing exam**, it will **not be added**
- A warning is shown identifying the **class code** that caused the conflict

Rejected exams can later be added manually using the **Create Exam** page.

---

### Create / Edit Exam Page
Admins can manually create or update exams.

Before saving, the system checks for clashes based on:
- **Exam time**
- **Classroom**

If a clash is detected:
- The exam will not be saved
- It is recommended to **change the classroom**
- Time or class adjustments may also be made

This ensures that only valid schedules are stored.

---

## Student Dashboard

The student dashboard provides multiple synchronized views of the exam schedule.

### Views
- **Schedule Grid**  
  A visual grid showing exams by date and time

- **Exam List**  
  A list view of all exams in the student’s schedule

- **Search**  
  Allows students to search for exams using class codes

When an exam is added through search:
- It appears **both in the grid and the list**
- All views remain synchronized

---

### Clash Handling for Students
- Clashes are detected **based on time only**
- If an exam overlaps with another exam:
  - The student cannot add it
  - No manual override is allowed

This prevents students from creating invalid schedules.

---

## Schedule Download
Students can download their exam schedule:

- Generated based on the current student schedule
- Displayed as **5 days per page**
- Additional pages are created automatically if needed

---

## User Roles & Access Control
The system supports two roles:
- `admin`
- `student`

Access control is enforced using middleware:
- Admin-only routes are protected
- Students can only access their own data

---

## Creating an Admin Account
Newly registered users are created with the `student` role by default.

To create an **admin** account, the role must be updated directly in the database.

Example (MySQL):

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';

### Excel Sheet Format (Bulk Exam Upload)

When uploading exams using a spreadsheet file, the Excel or CSV file **must** follow the structure below.

#### Required Columns
The file must contain the following columns in the **first row**:

| Column Name | Description |
|------------|-------------|
| `courseCode` | Unique course or class code |
| `date` | Exam date in `YYYY-MM-DD` format |
| `startTime` | Exam start time |
| `endTime` | Exam end time |
| `room` | Classroom or exam room |

#### Date Format
- The `date` column **must** use the format:  
  `YYYY-MM-DD` (example: `2025-06-14`)
- Other date formats are not supported

#### Time Format
- `startTime` and `endTime` should be provided in 24-hour format  
  Example: `09:00`, `13:30`

#### General Rules
- Use **one sheet only**
- Do not leave empty rows between records
- Do not merge cells
- Ensure column names match exactly
- Each row represents **one exam**

#### Example

| courseCode | date       | startTime | endTime | room  |
|------------|------------|-----------|---------|-------|
| CS101      | 2025-06-14 | 09:00     | 11:00   | A101  |
| MA202      | 2025-06-15 | 13:00     | 15:00   | B204  |
# exam-senior-project
