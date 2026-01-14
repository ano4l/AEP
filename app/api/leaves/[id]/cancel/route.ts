import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdminUser } from "@/lib/require-admin"

export async function PATCH(
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

    if (leave.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending leave requests can be cancelled" },
        { status: 400 }
      )
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    }) as any

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error cancelling leave:", error)
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

