import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAdminUser } from "@/lib/require-admin"

const approveSchema = z.object({
  adminNotes: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAdminUser()
    const adminId = user.id
    const body = await request.json()
    const { adminNotes } = approveSchema.parse(body)

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
        { error: "Leave request is not pending" },
        { status: 400 }
      )
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        adminId,
        adminNotes,
      },
    }) as any

    // Create notification for the requester
    await db.notification.create({
      data: {
        userId: leave.requesterId,
        type: "LEAVE_APPROVED",
        title: "Leave Request Approved",
        message: `Your leave request for ${leave.days} day(s) has been approved.`,
        relatedId: leave.id,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error approving leave:", error)
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

