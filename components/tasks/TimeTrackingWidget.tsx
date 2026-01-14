"use client"

import { useState } from "react"
import { formatDate, formatDuration } from "@/lib/utils"

interface TimeTracking {
  id: string
  duration: number
  date: string
  notes?: string
  user: {
    id: string
    name: string
  }
}

interface Props {
  taskId: string
  timeTrackings: TimeTracking[]
  onUpdate: () => void
}

export default function TimeTrackingWidget({ taskId, timeTrackings, onUpdate }: Props) {
  const [duration, setDuration] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const totalTime = timeTrackings.reduce((sum, tt) => sum + tt.duration, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const minutes = parseInt(duration)
    if (!minutes || minutes <= 0) {
      setError("Please enter a valid duration in minutes")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/tasks/${taskId}/time-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: minutes,
          date,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to log time")
      }

      setDuration("")
      setNotes("")
      onUpdate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">Total Time Tracked</p>
        <p className="text-2xl font-bold text-blue-900">{formatDuration(totalTime)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration (minutes) *
            </label>
            <input
              type="number"
              id="duration"
              min="1"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date *
            </label>
            <input
              type="date"
              id="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="What did you work on?"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Logging..." : "Log Time"}
        </button>
      </form>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Time Log</h4>
        <div className="space-y-2">
          {timeTrackings.length === 0 ? (
            <p className="text-gray-500 text-sm">No time entries yet</p>
          ) : (
            timeTrackings.map((tt) => (
              <div key={tt.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDuration(tt.duration)}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(tt.date)} • {tt.user.name}
                  </p>
                  {tt.notes && (
                    <p className="text-xs text-gray-600 mt-1">{tt.notes}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

