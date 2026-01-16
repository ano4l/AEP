import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireUserWithRoles } from "@/lib/require-admin"

const approveSchema = z.object({
  adminNotes: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip database operations during build time
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
      (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_URL)
    
    if (isBuildTime) {
      return NextResponse.json({ message: "Build mode - operation skipped" })
    }

    const { id } = await params
    const user = await requireUserWithRoles(["ADMIN", "HR"])
    const body = await request.json()
    const { adminNotes } = approveSchema.parse(body)

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
        status: "ADMIN_APPROVED",
        authorisedById: user.id,
        adminNotes,
      },
    }) as any

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "REQUISITION_ADMIN_APPROVED",
        entityType: "CashRequisition",
        entityId: updated.id,
        metadata: { adminNotes: adminNotes ?? null },
        userAgent: request.headers.get("user-agent"),
      },
    })

    // Create notification for the requester
    await db.notification.create({
      data: {
        userId: requisition.preparedById,
        type: "REQUISITION_APPROVED",
        title: "Cash Requisition Approved",
        message: `Your cash requisition for ${requisition.amount} ${requisition.currency} has been approved.`,
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
    console.error("Error approving requisition:", error)
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

