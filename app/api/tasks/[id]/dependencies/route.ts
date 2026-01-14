import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireUserWithRoles } from "@/lib/require-admin"

const createDependencySchema = z.object({
  dependsOnTaskId: z.string(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireUserWithRoles(["ADMIN", "HR"])
    const body = await request.json()
    const { dependsOnTaskId } = createDependencySchema.parse(body)

    // Prevent self-dependency
    if (id === dependsOnTaskId) {
      return NextResponse.json(
        { error: "Task cannot depend on itself" },
        { status: 400 }
      )
    }

    // Verify both tasks exist
    const [task, dependsOnTask] = await Promise.all([
      db.task.findUnique({ where: { id } }),
      db.task.findUnique({ where: { id: dependsOnTaskId } }),
    ])

    if (!task || !dependsOnTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if dependency already exists
    const existing = await db.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId: id,
          dependsOnTaskId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Dependency already exists" },
        { status: 400 }
      )
    }

    const dependency = await db.taskDependency.create({
      data: {
        taskId: id,
        dependsOnTaskId,
      },
    }) as any

    return NextResponse.json(dependency, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating dependency:", error)
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
    const { searchParams } = new URL(request.url)
    const dependsOnTaskId = searchParams.get("dependsOnTaskId")

    if (!dependsOnTaskId) {
      return NextResponse.json(
        { error: "dependsOnTaskId is required" },
        { status: 400 }
      )
    }

    await db.taskDependency.delete({
      where: {
        taskId_dependsOnTaskId: {
          taskId: id,
          dependsOnTaskId,
        },
      },
    })

    return NextResponse.json({ message: "Dependency removed successfully" })
  } catch (error: any) {
    console.error("Error deleting dependency:", error)
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

