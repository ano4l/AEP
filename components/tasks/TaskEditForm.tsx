"use client"

import { useState, useEffect } from "react"
import TaskForm from "./TaskForm"

interface Task {
  id: string
  title: string
  description?: string
  assigneeId?: string
  priority: string
  dueDate?: string
}

interface Props {
  task: Task
  onSuccess: () => void
  onCancel: () => void
}

export default function TaskEditForm({ task, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (data: {
    title: string
    description?: string
    assigneeId?: string
    priority: string
    dueDate?: string
  }) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update task")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <TaskForm
        onSubmit={handleSubmit}
        loading={loading}
        initialData={{
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId || undefined,
          priority: task.priority,
          dueDate: task.dueDate || undefined,
        }}
      />
    </div>
  )
}

