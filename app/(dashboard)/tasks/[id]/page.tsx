import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import TaskDetail from "@/components/tasks/TaskDetail"
import { requireUser } from "@/lib/require-admin"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const userId = user.id

  const task = await db.task.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      dependencies: {
        include: {
          dependsOnTask: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
      dependents: {
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
      timeTrackings: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { date: "desc" },
      },
    },
  }) as any

  if (!task) {
    notFound()
  }

  const canManageAll = user.role === "ADMIN" || user.role === "HR"
  if (!canManageAll && task.assigneeId !== user.id) {
    redirect("/tasks")
  }

  // Handle dates that might already be strings (from mock data) or Date objects (from database)
  const formatDateField = (date: Date | string | null | undefined) => {
    if (!date) return undefined
    if (typeof date === 'string') return date
    return date.toISOString()
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <TaskDetail 
        task={{
          ...task,
          description: task.description ?? undefined,
          assignee: task.assignee ?? undefined,
          dueDate: formatDateField(task.dueDate),
          createdAt: formatDateField(task.createdAt) || new Date().toISOString(),
          updatedAt: formatDateField(task.updatedAt) || new Date().toISOString(),
          comments: (task.comments || []).map((c: any) => ({
            ...c,
            createdAt: formatDateField(c.createdAt) || new Date().toISOString(),
            updatedAt: formatDateField(c.updatedAt) || new Date().toISOString(),
          })),
          attachments: (task.attachments || []).map((a: any) => ({
            ...a,
            createdAt: formatDateField(a.createdAt) || new Date().toISOString(),
          })),
          timeTrackings: (task.timeTrackings || []).map((t: any) => ({
            ...t,
            date: formatDateField(t.date) || new Date().toISOString(),
            createdAt: formatDateField(t.createdAt) || new Date().toISOString(),
          })),
        }} 
        userId={userId} 
        userRole={user.role} 
      />
    </div>
  )
}

