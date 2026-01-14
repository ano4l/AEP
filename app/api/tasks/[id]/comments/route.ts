import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireUser } from "@/lib/require-admin"

const createCommentSchema = z.object({
  content: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireUser()
    const userId = user.id
    const body = await request.json()
    const { content } = createCommentSchema.parse(body)

    // Verify task exists and user has access
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

    const comment = await db.taskComment.create({
      data: {
        taskId: id,
        userId,
        content,
      },
    }) as any

    // Notify task creator and assignee (if different from commenter)
    const notifyUserIds = [task.creatorId]
    if (task.assigneeId && task.assigneeId !== userId && task.assigneeId !== task.creatorId) {
      notifyUserIds.push(task.assigneeId)
    }

    await db.notification.createMany({
      data: notifyUserIds
        .filter((id) => id !== userId)
        .map((notifyUserId) => ({
          userId: notifyUserId,
          type: "TASK_COMMENT",
          title: "New Comment on Task",
          message: `${user.name} commented on task: ${task.title}`,
          relatedId: task.id,
        })),
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating comment:", error)
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

