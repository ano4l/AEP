import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireUserWithRoles } from "@/lib/require-admin"

const rejectSchema = z.object({
  adminNotes: z.string().min(1, "Rejection reason is required"),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireUserWithRoles(["ADMIN", "HR"])
    const body = await request.json()
    const { adminNotes } = rejectSchema.parse(body)

    const requisition = await db.cashRequisition.findUnique({
      where: { id },
    }) as any

    if (!requisition) {
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      )
    }

    if (requisition.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Requisition is not submitted" },
        { status: 400 }
      )
    }

    const updated = await db.cashRequisition.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedById: user.id,
        rejectedAt: new Date() as any,
        adminNotes,
      },
    }) as any

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "REQUISITION_REJECTED",
        entityType: "CashRequisition",
        entityId: updated.id,
        metadata: { adminNotes },
        userAgent: request.headers.get("user-agent"),
      },
    })

    // Create notification for the requester
    await db.notification.create({
      data: {
        userId: requisition.preparedById,
        type: "REQUISITION_REJECTED",
        title: "Cash Requisition Rejected",
        message: `Your cash requisition for ${requisition.amount} ${requisition.currency} has been rejected. Reason: ${adminNotes}`,
        relatedId: requisition.id,
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
    console.error("Error rejecting requisition:", error)
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

