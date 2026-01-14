import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUserWithRoles } from "@/lib/require-admin"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireUserWithRoles(["ACCOUNTING"])

    const requisition = await db.cashRequisition.findUnique({
      where: { id },
    }) as any

    if (!requisition) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    if (requisition.status !== "ACCOUNTING_PAID") {
      return NextResponse.json(
        { error: "Only paid requisitions can be closed" },
        { status: 400 }
      )
    }

    const updated = await db.cashRequisition.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAt: new Date() as any,
      },
    }) as any

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "REQUISITION_CLOSED",
        entityType: "CashRequisition",
        entityId: updated.id,
        metadata: { from: requisition.status, to: updated.status },
        userAgent: request.headers.get("user-agent"),
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error closing requisition:", error)
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
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
  return NextResponse.json(
    { error: "Internal server error", message: "Unknown error" },
    { status: 500 }
  )
}
