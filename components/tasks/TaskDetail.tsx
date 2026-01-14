"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDate, formatDateTime, formatDuration } from "@/lib/utils"
import TaskComments from "./TaskComments"
import TaskAttachments from "./TaskAttachments"
import TimeTrackingWidget from "./TimeTrackingWidget"
import TaskDependencies from "./TaskDependencies"
import TaskEditForm from "./TaskEditForm"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  comments: any[]
  attachments: any[]
  dependencies: any[]
  dependents: any[]
  timeTrackings: any[]
}

interface Props {
  task: Task
  userId: string
  userRole: string
}

export default function TaskDetail({ task: initialTask, userId, userRole }: Props) {
  const router = useRouter()
  const [task, setTask] = useState(initialTask)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<"comments" | "attachments" | "time" | "dependencies">("comments")

  const canManageAll = userRole === "ADMIN" || userRole === "HR"
  const isAssignee = task.assignee?.id === userId
  const canChangeStatus = canManageAll || isAssignee

  const statusColors = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }

  const priorityColors = {
    LOW: "text-gray-600",
    MEDIUM: "text-blue-600",
    HIGH: "text-orange-600",
    URGENT: "text-red-600",
  }

  const handleUpdate = async () => {
    router.refresh()
    const response = await fetch(`/api/tasks/${task.id}`)
    if (response.ok) {
      const updated = await response.json()
      setTask(updated)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        handleUpdate()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const totalTime = task.timeTrackings?.reduce((sum, tt) => sum + tt.duration, 0) || 0
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:text-blue-500 mb-4"
        >
          ← Back to Tasks
        </button>
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
          <div className="flex space-x-2">
            {canManageAll && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {isEditing ? "Cancel Edit" : "Edit"}
              </button>
            )}
            {canChangeStatus && task.status !== "COMPLETED" && (
              <button
                onClick={() => handleStatusChange("COMPLETED")}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        <TaskEditForm
          task={task}
          onSuccess={() => {
            setIsEditing(false)
            handleUpdate()
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{task.title}</h2>
                  <div className="flex space-x-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[task.status as keyof typeof statusColors]
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                    <span className={`text-sm font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created by:</span>
                  <span className="text-gray-900">{task.creator.name}</span>
                </div>
                {task.assignee && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned to:</span>
                    <span className="text-gray-900">{task.assignee.name}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due date:</span>
                    <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-900"}>
                      {formatDateTime(task.dueDate)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Total time tracked:</span>
                  <span className="text-gray-900">{formatDuration(totalTime)}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b">
                <nav className="flex -mb-px">
                  {[
                    { id: "comments", label: `Comments (${task.comments?.length || 0})` },
                    { id: "attachments", label: `Attachments (${task.attachments?.length || 0})` },
                    { id: "time", label: "Time Tracking" },
                    ...(canManageAll ? [{ id: "dependencies", label: "Dependencies" }] : []),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "comments" && (
                  <TaskComments taskId={task.id} comments={task.comments || []} onUpdate={handleUpdate} />
                )}
                {activeTab === "attachments" && (
                  <TaskAttachments taskId={task.id} attachments={task.attachments || []} onUpdate={handleUpdate} />
                )}
                {activeTab === "time" && (
                  <TimeTrackingWidget taskId={task.id} timeTrackings={task.timeTrackings || []} onUpdate={handleUpdate} />
                )}
                {canManageAll && activeTab === "dependencies" && (
                  <TaskDependencies
                    taskId={task.id}
                    dependencies={task.dependencies || []}
                    dependents={task.dependents || []}
                    onUpdate={handleUpdate}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              {canChangeStatus ? (
                <div className="space-y-2">
                  {task.status !== "TODO" && (
                    <button
                      onClick={() => handleStatusChange("TODO")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      Mark as Todo
                    </button>
                  )}
                  {task.status !== "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange("IN_PROGRESS")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      Mark as In Progress
                    </button>
                  )}
                  {task.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleStatusChange("COMPLETED")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No actions available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

