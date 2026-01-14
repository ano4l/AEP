import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireUser, requireUserWithRoles } from "@/lib/require-admin"

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().nullable().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireUser()

    const task = await db.task.findUnique({
      where: { id },
    }) as any

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const canManageAll = user.role === "ADMIN" || user.role === "HR"
    if (!canManageAll && task.assigneeId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(task)
  } catch (error: any) {
    console.error("Error fetching task:", error)
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireUser()
    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    const task = await db.task.findUnique({
      where: { id },
    }) as any

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const canManageAll = user.role === "ADMIN" || user.role === "HR"
    const isAssignee = task.assigneeId === user.id
    if (!canManageAll && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!canManageAll) {
      const attemptedOtherField =
        validatedData.title !== undefined ||
        validatedData.description !== undefined ||
        validatedData.assigneeId !== undefined ||
        validatedData.priority !== undefined ||
        validatedData.dueDate !== undefined

      if (attemptedOtherField) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.assigneeId !== undefined) {
      updateData.assigneeId = validatedData.assigneeId
      updateData.assignedById = validatedData.assigneeId ? user.id : null
    }
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }

    const updated = await db.task.update({
      where: { id },
      data: updateData,
    }) as any

    // Create notifications for status changes or assignment changes
    if (validatedData.status && validatedData.status !== task.status) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "TASK_STATUS_CHANGED",
          entityType: "Task",
          entityId: task.id,
          metadata: { from: task.status, to: validatedData.status },
          userAgent: request.headers.get("user-agent"),
        },
      })

      await db.notification.create({
        data: {
          userId: task.creatorId,
          type: "TASK_UPDATED",
          title: "Task Status Updated",
          message: `Task "${task.title}" status changed to ${validatedData.status}`,
          relatedId: task.id,
        },
      })
    }

    if (validatedData.assigneeId && validatedData.assigneeId !== task.assigneeId) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "TASK_ASSIGNED",
          entityType: "Task",
          entityId: task.id,
          metadata: { from: task.assigneeId ?? null, to: validatedData.assigneeId },
          userAgent: request.headers.get("user-agent"),
        },
      })

      await db.notification.create({
        data: {
          userId: validatedData.assigneeId,
          type: "TASK_ASSIGNED",
          title: "Task Assigned",
          message: `You have been assigned to task: ${task.title}`,
          relatedId: task.id,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error updating task:", error)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireUserWithRoles(["ADMIN", "HR"])

    const task = await db.task.findUnique({
      where: { id },
    }) as any

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await db.task.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting task:", error)
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

