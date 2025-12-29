# API Routes - Completion Summary

## ✅ All API Routes Complete!

All Next.js API routes have been successfully implemented and are ready to use.

## 📋 Complete API Endpoint List

### Authentication Routes

#### `POST /api/auth/login`
- **File**: `app/api/auth/login/route.ts`
- **Description**: User login endpoint
- **Auth**: None (public)
- **Request Body**: `{ email: string, password: string }`
- **Response**: `{ success: boolean, token?: string, expiresAt?: Date, user?: {...}, error?: string }`

#### `POST /api/auth/logout`
- **File**: `app/api/auth/logout/route.ts`
- **Description**: User logout endpoint (invalidates session token)
- **Auth**: Bearer token required
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean, message?: string }`

---

### Admin Routes

#### `GET /api/admin/exams`
- **File**: `app/api/admin/exams/route.ts`
- **Description**: List all exams with optional filters
- **Auth**: Admin only
- **Query Parameters**:
  - `search` (optional): Search by course code or title
  - `date` (optional): Filter by date (YYYY-MM-DD)
  - `roomId` (optional): Filter by room ID
- **Response**: `{ success: boolean, exams: [...] }`

#### `POST /api/admin/exams`
- **File**: `app/api/admin/exams/route.ts`
- **Description**: Create new exam entry with automatic clash detection
- **Auth**: Admin only
- **Request Body**: 
  ```json
  {
    "title": "string (optional)",
    "day": "string (optional, auto-calculated from date)",
    "date": "string (required, YYYY-MM-DD)",
    "startTime": "string (required, HH:MM:SS)",
    "endTime": "string (required, HH:MM:SS)",
    "classCodeId": "number (required)",
    "roomId": "number (required)",
    "userId": "number (optional)"
  }
  ```
- **Response Success**: `{ success: true, message: string, exam: {...} }` (201)
- **Response Clash**: `{ success: false, message: string, clashes: [...] }` (409)

#### `GET /api/admin/exams/[id]`
- **File**: `app/api/admin/exams/[id]/route.ts`
- **Description**: Get single exam by ID
- **Auth**: Admin only
- **Path Parameters**: `id` (number)
- **Response**: `{ success: boolean, exam: {...} }`

#### `PUT /api/admin/exams/[id]`
- **File**: `app/api/admin/exams/[id]/route.ts`
- **Description**: Update exam entry with automatic clash detection
- **Auth**: Admin only
- **Path Parameters**: `id` (number)
- **Request Body**: Partial exam data (same structure as POST)
- **Response Success**: `{ success: true, message: string, exam: {...} }`
- **Response Clash**: `{ success: false, message: string, clashes: [...] }` (409)

#### `DELETE /api/admin/exams/[id]`
- **File**: `app/api/admin/exams/[id]/route.ts`
- **Description**: Delete exam entry
- **Auth**: Admin only
- **Path Parameters**: `id` (number)
- **Response**: `{ success: boolean, message: string }`

#### `POST /api/admin/upload`
- **File**: `app/api/admin/upload/route.ts`
- **Description**: Upload exams from CSV file
- **Auth**: Admin only
- **Request**: FormData with `file` field containing CSV file
- **CSV Format**: 
  - Columns: `courseCode`, `date`, `startTime`, `endTime`, `room` (required)
  - Optional: `courseName`
  - Note: `day` is automatically calculated from `date` if not provided
- **Response**: 
  ```json
  {
    "success": true,
    "message": "string",
    "result": {
      "success": 0,
      "failed": 0,
      "errors": [...]
    }
  }
  ```

---

### Student Routes

#### `GET /api/student/timetable`
- **File**: `app/api/student/timetable/route.ts`
- **Description**: Get personalized exam timetable for student
- **Auth**: Student only
- **Query Parameters**:
  - `courseCodes` (required): Comma-separated course codes or JSON array
    - Example: `?courseCodes=CS101,CS102,MATH201`
    - Or: `?courseCodes=["CS101","CS102","MATH201"]`
- **Response**: `{ success: boolean, timetable: [...], courseCodes: [...] }`

#### `GET /api/student/courses`
- **File**: `app/api/student/courses/route.ts`
- **Description**: Get all available course codes
- **Auth**: Student only
- **Response**: `{ success: boolean, courses: [{ id: number, code: string }] }`

---

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <token_from_login>
```

Tokens are obtained from the `/api/auth/login` endpoint and expire after 7 days.

## 🚨 Error Responses

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (clash detected on exam create/update)
- `500` - Internal Server Error

## 🧪 Testing

### Example: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Example: Create Exam (requires token)
```bash
curl -X POST http://localhost:3000/api/admin/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2024-12-15",
    "startTime": "09:00:00",
    "endTime": "11:00:00",
    "classCodeId": 1,
    "roomId": 1
  }'
```

### Example: Get Student Timetable
```bash
curl -X GET "http://localhost:3000/api/student/timetable?courseCodes=CS101,CS102" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Implementation Status

- ✅ All API routes implemented
- ✅ Authentication & authorization middleware integrated
- ✅ Clash detection integrated into create/update endpoints
- ✅ CSV upload functionality complete
- ✅ Error handling implemented
- ✅ TypeScript types defined

**Next Steps**: Create frontend pages and components to consume these API endpoints!
