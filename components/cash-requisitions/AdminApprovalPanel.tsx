"use client"

import { useState } from "react"

interface Props {
  requisitionId: string
  onSuccess: () => void
}

export default function AdminApprovalPanel({ requisitionId, onSuccess }: Props) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleApprove = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/cash-requisitions/${requisitionId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes || undefined }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to approve requisition")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      setError("Rejection reason is required")
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/cash-requisitions/${requisitionId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to reject requisition")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (action === null) {
    return (
      <div className="space-y-3">
        <div className="flex space-x-3">
          <button
            onClick={() => setAction("approve")}
            className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => setAction("reject")}
            className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          {action === "approve" ? "Notes (optional)" : "Rejection Reason (required)"}
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder={action === "approve" ? "Add any notes..." : "Explain why this requisition is being rejected..."}
        />
      </div>
      <div className="flex space-x-3">
        <button
          onClick={action === "approve" ? handleApprove : handleReject}
          disabled={loading || (action === "reject" && !notes.trim())}
          className={`flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            action === "approve"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } disabled:opacity-50`}
        >
          {loading ? "Processing..." : action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
        </button>
        <button
          onClick={() => {
            setAction(null)
            setNotes("")
            setError("")
          }}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

