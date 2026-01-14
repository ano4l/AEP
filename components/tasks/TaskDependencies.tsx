"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Dependency {
  id: string
  dependsOnTask: {
    id: string
    title: string
    status: string
  }
}

interface Dependent {
  id: string
  task: {
    id: string
    title: string
    status: string
  }
}

interface Task {
  id: string
  title: string
  status: string
}

interface Props {
  taskId: string
  dependencies: Dependency[]
  dependents: Dependent[]
  onUpdate: () => void
}

export default function TaskDependencies({ taskId, dependencies, dependents, onUpdate }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      if (response.ok) {
        const data = await response.json()
        // Filter out current task and already added dependencies
        const filtered = data.filter(
          (t: Task) =>
            t.id !== taskId &&
            !dependencies.some((d) => d.dependsOnTask.id === t.id)
        )
        setTasks(filtered)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const handleAddDependency = async () => {
    if (!selectedTaskId) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dependsOnTaskId: selectedTaskId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add dependency")
      }

      setSelectedTaskId("")
      fetchTasks()
      onUpdate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDependency = async (dependsOnTaskId: string) => {
    if (!confirm("Remove this dependency?")) return

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/dependencies?dependsOnTaskId=${dependsOnTaskId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        fetchTasks()
        onUpdate()
      }
    } catch (error) {
      console.error("Error removing dependency:", error)
    }
  }

  const statusColors = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">This task depends on:</h4>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div className="space-y-2 mb-4">
          {dependencies.length === 0 ? (
            <p className="text-gray-500 text-sm">No dependencies</p>
          ) : (
            dependencies.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <Link
                  href={`/tasks/${dep.dependsOnTask.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {dep.dependsOnTask.title}
                </Link>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      statusColors[dep.dependsOnTask.status as keyof typeof statusColors]
                    }`}
                  >
                    {dep.dependsOnTask.status}
                  </span>
                  <button
                    onClick={() => handleRemoveDependency(dep.dependsOnTask.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a task...</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddDependency}
            disabled={loading || !selectedTaskId}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Tasks that depend on this:</h4>
        <div className="space-y-2">
          {dependents.length === 0 ? (
            <p className="text-gray-500 text-sm">No dependents</p>
          ) : (
            dependents.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <Link
                  href={`/tasks/${dep.task.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {dep.task.title}
                </Link>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    statusColors[dep.task.status as keyof typeof statusColors]
                  }`}
                >
                  {dep.task.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

