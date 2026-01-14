"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import TaskForm from "@/components/tasks/TaskForm"

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        const role = data?.user?.role
        if (role !== "ADMIN" && role !== "HR") {
          router.replace("/tasks")
        }
      } catch {
        router.replace("/tasks")
      }
    })()
  }, [router])

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
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create task")
      }

      router.push("/tasks")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Task</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new task
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="max-w-3xl">
        <TaskForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}

