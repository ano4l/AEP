import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/require-admin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireUser()

    const requisition = await db.cashRequisition.findUnique({
      where: { id },
    }) as any

    if (!requisition) {
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      )
    }

    if (user.role === "EMPLOYEE" && requisition.preparedById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (user.role === "ACCOUNTING") {
      const visibleStatuses = ["ADMIN_APPROVED", "ACCOUNTING_PAID", "CLOSED"]
      if (!visibleStatuses.includes(requisition.status)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json(requisition)
  } catch (error: any) {
    console.error("Error fetching requisition:", error)
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

