"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import TaskCard from "@/components/tasks/TaskCard"

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [meRole, setMeRole] = useState<string | null>(null)
  const [view, setView] = useState<"list" | "board">("list")
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        setMeRole(data?.user?.role ?? null)
      } catch {
        setMeRole(null)
      }
    })()
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [filters])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.priority !== "all") params.append("priority", filters.priority)
      
      const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const data = await response.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Tasks</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage and track your tasks
          </p>
        </div>
        {(meRole === "ADMIN" || meRole === "HR") && (
          <Link
            href="/tasks/new"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-950 hover:bg-slate-900 transition-colors"
          >
            New Task
          </Link>
        )}
      </div>

      {/* View Toggle and Filters */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              view === "list"
                ? "bg-amber-400 text-slate-950"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView("board")}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              view === "board"
                ? "bg-amber-400 text-slate-950"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            Board
          </button>
        </div>
        <div className="flex space-x-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          >
            <option value="all">All Status</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          >
            <option value="all">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-500">Loading...</div>
        </div>
      ) : view === "board" ? (
        <TaskBoard tasks={tasks} onUpdate={fetchTasks} />
      ) : (
        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No tasks found</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function TaskBoard({ tasks, onUpdate }: { tasks: Task[]; onUpdate: () => void }) {
  const columns = [
    { id: "TODO", title: "Todo" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "COMPLETED", title: "Completed" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id)
        return (
          <div key={column.id} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              {column.title} ({columnTasks.length})
            </h3>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={onUpdate} compact />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

