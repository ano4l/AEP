import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireUser } from "@/lib/require-admin"

const createRequisitionSchema = z.object({
  payee: z.string().min(1).max(200),
  amount: z.number().positive().max(10000000), // $10M limit
  currency: z.enum(["USD", "ZWG"]).default("USD"),
  details: z.string().min(1).max(2000),
  customer: z.string().max(200).optional(),
  code: z.string().max(50).optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}
    if (status) where.status = status

    if (user.role === "EMPLOYEE") {
      where.preparedById = user.id
    }

    if (user.role === "ACCOUNTING") {
      where.status = {
        in: ["ADMIN_APPROVED", "ACCOUNTING_PAID", "CLOSED"],
      }
    }

    const requisitions = await db.cashRequisition.findMany({
      where,
      include: { preparedBy: true, authorisedBy: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }) as any
    
    const total = await db.cashRequisition.count({ where })

    return NextResponse.json({
      data: requisitions,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    })
  } catch (error: any) {
    console.error("Error fetching requisitions:", error)
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

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const validatedData = createRequisitionSchema.parse(body)

    if (user.role !== "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const requisition = await db.cashRequisition.create({
      data: {
        preparedById: user.id,
        department: user.department,
        requestDate: new Date() as any,
        payee: validatedData.payee,
        amount: validatedData.amount,
        currency: validatedData.currency,
        details: validatedData.details,
        customer: validatedData.customer,
        code: validatedData.code,
        status: "DRAFT",
      },
    }) as any

    return NextResponse.json(requisition, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating requisition:", error)
    if ((error as any)?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((error as any)?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

