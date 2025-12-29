# Exam Schedule Platform - Monolithic Architecture

## Project Structure

```
exam-schedule-main/
├── app/                          # Next.js App Router (Frontend)
│   ├── (auth)/                   # Auth routes group
│   │   └── login/
│   │       └── page.tsx         # Login page (both admin & student)
│   ├── (admin)/                  # Admin routes group
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Admin dashboard
│   │   ├── exams/
│   │   │   ├── page.tsx         # Exam list with CRUD
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Edit exam
│   │   └── upload/
│   │       └── page.tsx         # CSV upload page
│   ├── (student)/                # Student routes group
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Student dashboard
│   │   └── timetable/
│   │       └── page.tsx         # Personalized exam timetable
│   ├── api/                      # Next.js API Routes (API Gateway)
│   │   ├── auth/
│   │   │   └── route.ts         # Login, logout, validate
│   │   ├── admin/
│   │   │   ├── exams/
│   │   │   │   ├── route.ts     # CRUD operations
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # Single exam operations
│   │   │   ├── upload/
│   │   │   │   └── route.ts     # CSV upload handler
│   │   │   └── clash/
│   │   │       └── route.ts     # Clash detection endpoint
│   │   └── student/
│   │       ├── timetable/
│   │       │   └── route.ts     # Get personalized timetable
│   │       └── courses/
│   │           └── route.ts     # Course management
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home/landing page
│   └── globals.css
│
├── backend/                      # Shared Backend Logic
│   ├── db.ts                     # Database connection
│   ├── models/                   # Sequelize models
│   │   ├── User.ts
│   │   ├── Room.ts
│   │   ├── ClassCode.ts
│   │   ├── ExamTable.ts
│   │   └── SessionToken.ts
│   ├── modules/                  # Business Logic Modules
│   │   ├── admin/
│   │   │   ├── examService.ts   # Exam CRUD operations
│   │   │   ├── csvService.ts    # CSV upload & parsing
│   │   │   └── clashService.ts  # Clash detection logic
│   │   ├── student/
│   │   │   └── timetableService.ts # Personalized timetable logic
│   │   └── shared/
│   │       ├── authService.ts   # Authentication logic
│   │       └── validation.ts    # Input validation
│   ├── middleware/
│   │   ├── auth.ts              # Authentication middleware
│   │   └── roleGuard.ts         # Role-based access control
│   └── utils/
│       ├── clashDetection.ts    # Clash detection utility
│       └── csvParser.ts         # CSV parsing utility
│
├── lib/                          # Shared utilities & types
│   ├── api.ts                   # API client functions
│   └── types.ts                 # TypeScript types
│
├── components/                   # React components
│   ├── admin/
│   │   ├── ExamForm.tsx
│   │   ├── ExamList.tsx
│   │   ├── ClashAlert.tsx
│   │   └── CSVUpload.tsx
│   ├── student/
│   │   ├── CourseSelector.tsx
│   │   └── Timetable.tsx
│   └── shared/
│       ├── Layout.tsx
│       ├── Navbar.tsx
│       └── LoginForm.tsx
│
├── .env                          # Environment variables
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture Overview

### Single Database (MySQL)
- Shared by both admin and student
- Admin: Full read/write access
- Student: Read-only access (enforced via middleware)

### Role-Based Access Control
- Authentication via session tokens
- Middleware enforces role-based permissions
- Admin routes protected with `roleGuard`

### Clash Detection
- Automatic detection on CREATE/UPDATE
- Checks: Room conflicts, Teacher conflicts, Student conflicts
- Returns detailed clash information

### CSV Upload
- Admin can upload exam data
- Validates and parses CSV
- Batch creates exam entries with clash detection

