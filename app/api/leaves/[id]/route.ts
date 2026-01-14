import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdminUser } from "@/lib/require-admin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireAdminUser()

    const leave = await db.leaveRequest.findUnique({
      where: { id },
    }) as any

    if (!leave) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(leave)
  } catch (error: any) {
    console.error("Error fetching leave:", error)
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      )
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

