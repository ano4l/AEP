import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireUser } from "@/lib/require-admin"

const createLeaveSchema = z.object({
  leaveTypeId: z.string().min(1).max(100),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1).max(1000),
})

export async function GET(request: Request) {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const leaveTypeId = searchParams.get("leaveTypeId")
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (leaveTypeId) {
      where.leaveTypeId = leaveTypeId
    }

    if (user.role !== "ADMIN" && user.role !== "HR") {
      where.requesterId = user.id
    }

    const leaves = await db.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }) as any
    
    const total = await db.leaveRequest.count({ where })

    return NextResponse.json({
      data: leaves,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    })
  } catch (error: any) {
    console.error("Error fetching leaves:", error)
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
    const userId = user.id
    const body = await request.json()
    const validatedData = createLeaveSchema.parse(body)

    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    // Calculate number of days (excluding weekends)
    let days = 0
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        days++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const leaveType = await db.leaveType.findUnique({
      where: { id: validatedData.leaveTypeId },
    }) as any

    if (!leaveType || !leaveType.active) {
      return NextResponse.json({ error: "Invalid leave type" }, { status: 400 })
    }

    const leave = await db.leaveRequest.create({
      data: {
        userId,
        leaveTypeId: validatedData.leaveTypeId,
        startDate,
        endDate,
        days,
        reason: validatedData.reason,
        status: "PENDING",
      },
    }) as any

    // Create notification for admins
    const reviewers = await db.user.findMany({
      where: { role: { in: ["ADMIN", "HR"] } },
    }) as any[]

    await db.notification.createMany({
      data: reviewers.map((reviewer) => ({
        userId: reviewer.id,
        type: "LEAVE_PENDING",
        title: "New Leave Request",
        message: `${user.name} submitted a leave request for ${days} day(s)`,
        relatedId: leave.id,
      })),
    })

    return NextResponse.json(leave, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating leave request:", error)
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

