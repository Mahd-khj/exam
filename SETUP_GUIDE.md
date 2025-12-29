# Exam Schedule Platform - Setup Guide

## 🏗️ Architecture Overview

This is a **monolithic web application** with:
- **Single Next.js project** containing both frontend and backend
- **Single MySQL database** shared by admin and student
- **Modular backend code** organized by functionality (admin/student/shared)
- **Next.js API routes** as the API gateway
- **Role-based access control** (admin vs student)

## 📁 Project Structure

```
exam-schedule-main/
├── app/                          # Next.js App Router (Frontend + API)
│   ├── api/                      # API Routes (already started)
│   │   ├── auth/login/          # ✅ Login endpoint
│   │   └── admin/exams/         # ✅ Admin exam CRUD
│   ├── (auth)/                   # 🚧 Auth pages (to create)
│   ├── (admin)/                  # 🚧 Admin pages (to create)
│   └── (student)/                # 🚧 Student pages (to create)
│
├── backend/                      # Shared Backend Logic
│   ├── models/                   # ✅ Sequelize models
│   ├── modules/                  # ✅ Business logic (COMPLETE!)
│   │   ├── admin/
│   │   │   ├── examService.ts   # ✅ CRUD with clash detection
│   │   │   └── csvService.ts    # ✅ CSV upload & parsing
│   │   ├── student/
│   │   │   └── timetableService.ts # ✅ Personalized timetable
│   │   └── shared/
│   │       └── authService.ts   # ✅ Login/logout
│   ├── middleware/               # ✅ Auth & role guards
│   └── utils/
│       └── clashDetection.ts     # ✅ Clash detection logic
│
└── components/                   # 🚧 React components (to create)
```

## ✅ What's Already Implemented

### Backend Core (100% Complete)
- ✅ All database models
- ✅ Clash detection utility (room, teacher, student conflicts)
- ✅ Authentication & authorization middleware
- ✅ Admin exam service (CRUD with automatic clash detection)
- ✅ CSV upload service (parses and uploads exams)
- ✅ Student timetable service (personalized by course codes)
- ✅ Auth service (login/logout)

### API Routes ✅ COMPLETE
- ✅ `POST /api/auth/login` - User login
- ✅ `POST /api/auth/logout` - User logout
- ✅ `GET /api/admin/exams` - List exams (with filters)
- ✅ `POST /api/admin/exams` - Create exam (with clash detection)
- ✅ `GET /api/admin/exams/[id]` - Get single exam
- ✅ `PUT /api/admin/exams/[id]` - Update exam (with clash detection)
- ✅ `DELETE /api/admin/exams/[id]` - Delete exam
- ✅ `POST /api/admin/upload` - CSV upload endpoint
- ✅ `GET /api/student/timetable` - Get personalized timetable
- ✅ `GET /api/student/courses` - Get available courses

## 🚀 Quick Start

### 1. Environment Setup

Make sure your `.env` file exists in the root directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=examschedulerdb
DB_USER=root
DB_PASS=your_password

PORT=5000
NEXTAUTH_SECRET=your_secret_key
```

### 2. Install Dependencies

```bash
# Root dependencies (Next.js + shared packages)
npm install

# Backend dependencies (if needed)
cd backend && npm install && cd ..
```

### 3. Database Setup

```bash
# Sync database models
npm run db:sync
```

### 4. Run Development Server

```bash
# Start Next.js dev server (includes API routes)
npm run dev
```

The app will be available at `http://localhost:3000`

**Note**: For a true monolithic setup, you can use Next.js API routes (which is what we've started). If you want to keep the Express backend running separately, use `npm run dev:backend` in another terminal.

## 📝 How It Works

### Clash Detection

When an admin creates or updates an exam:

1. **Before saving**: The system automatically checks for:
   - **Room conflicts**: Same room at overlapping time on same date
   - **Teacher conflicts**: Same teacher at overlapping time on same date
   - **Student conflicts**: Students enrolled in multiple courses with overlapping exams

2. **If clashes found**: Returns detailed conflict information (HTTP 409)
3. **If no clashes**: Exam is created/updated successfully

### CSV Upload Format

Admin can upload exams via CSV with these columns:

| Column | Required | Format | Example |
|--------|----------|--------|---------|
| `courseCode` | Yes | String | CS101 |
| `date` | Yes | YYYY-MM-DD or DD/MM/YYYY | 2024-12-15 |
| `startTime` | Yes | HH:MM or HH:MM:SS | 09:00 |
| `endTime` | Yes | HH:MM or HH:MM:SS | 11:00 |
| `room` | Yes | String | Room A101 |
| `day` | No | Auto-calculated | Monday |
| `courseName` | No | String | Introduction to CS |

### Role-Based Access

- **Admin**: Full CRUD access to exams, can upload CSV, detects clashes
- **Student**: Read-only access, can view personalized timetable by course codes

## 🔨 Next Steps to Complete

### 1. ✅ API Routes - COMPLETE!

All API endpoints have been implemented:
- ✅ `app/api/admin/exams/[id]/route.ts` - GET, PUT, DELETE single exam
- ✅ `app/api/admin/upload/route.ts` - POST CSV upload
- ✅ `app/api/student/timetable/route.ts` - GET personalized timetable
- ✅ `app/api/student/courses/route.ts` - GET available courses
- ✅ `app/api/auth/logout/route.ts` - POST logout

### 2. Create Frontend Pages

Follow the structure in `PROJECT_STRUCTURE.md`:

- Login page (`app/(auth)/login/page.tsx`)
- Admin dashboard (`app/(admin)/dashboard/page.tsx`)
- Admin exam management (`app/(admin)/exams/page.tsx`)
- CSV upload page (`app/(admin)/upload/page.tsx`)
- Student dashboard (`app/(student)/dashboard/page.tsx`)
- Student timetable (`app/(student)/timetable/page.tsx`)

### 3. Create React Components

Organize components by feature:
- `components/shared/` - Layout, Navbar, LoginForm
- `components/admin/` - ExamForm, ExamList, CSVUpload, ClashAlert
- `components/student/` - CourseSelector, Timetable

## 🧪 Testing the Backend

You can test the API endpoints using curl or Postman:

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Create Exam (requires admin token)
```bash
curl -X POST http://localhost:3000/api/admin/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "day": "Monday",
    "date": "2024-12-15",
    "startTime": "09:00:00",
    "endTime": "11:00:00",
    "classCodeId": 1,
    "roomId": 1
  }'
```

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `backend/utils/clashDetection.ts` | Core clash detection logic |
| `backend/modules/admin/examService.ts` | Exam CRUD operations |
| `backend/modules/admin/csvService.ts` | CSV parsing and upload |
| `backend/modules/student/timetableService.ts` | Student timetable logic |
| `backend/middleware/roleGuard.ts` | Role-based access control |
| `IMPLEMENTATION_STATUS.md` | Detailed status of all features |

## 🐛 Troubleshooting

### Database Connection Issues
- Check `.env` file has correct database credentials
- Ensure MySQL is running
- Verify database exists: `CREATE DATABASE examschedulerdb;`

### Import Errors
- Make sure `tsconfig.json` has `"@/*": ["./*"]` in paths
- Restart TypeScript server in your IDE

### API Route Not Found
- Ensure file is in `app/api/` directory
- File must be named `route.ts`
- Restart Next.js dev server

## 📖 Additional Resources

- See `PROJECT_STRUCTURE.md` for detailed file organization
- See `IMPLEMENTATION_STATUS.md` for feature completion status
- All business logic is in `backend/modules/` - fully implemented and ready to use!

---

**You're ready to build!** The backend logic is complete - now just wire up the API routes and frontend pages! 🚀
