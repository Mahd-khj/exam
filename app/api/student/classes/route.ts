// app/api/student/classes/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getClasses,
  createClass,
  deleteClass,
} from "@/backend/controllers/userClassController";

/**
 * GET /api/student/classes
 * Fetch all classes for the logged-in student
 */
export async function GET(request: NextRequest) {
  const result = await getClasses(request);
  return NextResponse.json(result);
}

/**
 * POST /api/student/classes
 * Add a new class record for the student
 */
export async function POST(request: NextRequest) {
  const result = await createClass(request);
  return NextResponse.json(result);
}

/**
 * DELETE /api/student/classes
 * Remove a class record for the student
 */
export async function DELETE(request: NextRequest) {
  const result = await deleteClass(request);
  return NextResponse.json(result);
}
