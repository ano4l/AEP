"use client"

import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  creator: {
    id: string
    name: string
  }
  assignee?: {
    id: string
    name: string
  }
  _count: {
    comments: number
    attachments: number
    timeTrackings: number
  }
}

interface Props {
  task: Task
  onUpdate: () => void
  compact?: boolean
}

export default function TaskCard({ task, compact = false }: Props) {
  const statusColors = {
    TODO: "bg-slate-100 text-slate-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }

  const priorityColors = {
    LOW: "text-slate-600",
    MEDIUM: "text-blue-600",
    HIGH: "text-orange-600",
    URGENT: "text-red-600",
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"

  if (compact) {
    return (
      <Link href={`/tasks/${task.id}`}>
        <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-slate-900 text-sm">{task.title}</h4>
            <span className={`text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
              {task.priority}
            </span>
          </div>
          {task.dueDate && (
            <p className={`text-xs ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
              Due: {formatDate(task.dueDate)}
            </p>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-slate-900 mb-1">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[task.status as keyof typeof statusColors]
              }`}
            >
              {task.status.replace("_", " ")}
            </span>
            <span className={`text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
              {task.priority}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-4">
            {task.assignee && (
              <span>Assigned to: {task.assignee.name}</span>
            )}
            {task.dueDate && (
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                Due: {formatDate(task.dueDate)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {task._count?.comments > 0 && (
              <span>{task._count.comments} comments</span>
            )}
            {task._count?.attachments > 0 && (
              <span>{task._count.attachments} files</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

