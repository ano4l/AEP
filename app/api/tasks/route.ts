import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireUser, requireUserWithRoles } from "@/lib/require-admin"
import { TESTING_MODE, getMockData } from "@/lib/testing-mode"
import { sanitizeError, isValidationError, formatValidationErrors } from "@/lib/error-handler"

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().max(100).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    if (TESTING_MODE) {
      const mockTasks = getMockData('tasks')
      return NextResponse.json(mockTasks)
    }

    const user = await requireUser()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const assigneeId = searchParams.get("assigneeId")
    const priority = searchParams.get("priority")

    const where: any = {}

    const canManageAll = user.role === "ADMIN" || user.role === "HR"
    if (!canManageAll) {
      where.assigneeId = user.id
    } else if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    const tasks = await db.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }) as any

    return NextResponse.json(tasks)
  } catch (error: any) {
    console.error("Error fetching tasks:", error)
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
    const user = await requireUser() // Allow any authenticated user to create tasks
    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    const task = await db.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        assigneeId: validatedData.assigneeId,
        assignedById: validatedData.assigneeId ? user.id : null,
        createdById: user.id,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) as any : null,
        status: "TODO",
      },
    }) as any

    // Create notification for assignee if assigned
    if (validatedData.assigneeId && validatedData.assigneeId !== user.id) {
      await db.notification.create({
        data: {
          userId: validatedData.assigneeId,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `You have been assigned a new task: ${validatedData.title}`,
          relatedId: task.id,
        },
      })
    }

    if (validatedData.assigneeId) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "TASK_ASSIGNED",
          entityType: "Task",
          entityId: task.id,
          metadata: { assigneeId: validatedData.assigneeId },
          userAgent: request.headers.get("user-agent"),
        },
      })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: formatValidationErrors(error) },
        { status: 400 }
      )
    }
    if ((error as any)?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((error as any)?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const sanitized = sanitizeError(error, 'TASK_CREATE');
    return NextResponse.json(sanitized, { status: 500 })
  }
}

