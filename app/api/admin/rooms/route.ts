import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/middleware/roleGuard";
import Room from "@/backend/models/Room";
import { initializeDatabase } from "@/backend/db-init";

// GET - Get all rooms
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    await initializeDatabase();
    const rooms = await Room.findAll({
      attributes: ["id", "name", "capacity"],
      order: [["name", "ASC"]],
    });

    return NextResponse.json({
      success: true,
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
      })),
    });
  } catch (error: any) {
    console.error("Get rooms error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}









