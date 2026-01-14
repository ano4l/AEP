import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUserWithRoles } from "@/lib/require-admin"

export async function GET() {
  try {
    await requireUserWithRoles(["ADMIN", "HR"])

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("Error fetching users:", error)
    // Return empty array if database is unavailable
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      return NextResponse.json([])
    }
    if (error?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Internal server error", message: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}

