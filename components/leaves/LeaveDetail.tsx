"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDate, formatDateTime } from "@/lib/utils"

interface LeaveRequest {
  id: string
  leaveType: {
    id: string
    name: string
  }
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  admin?: {
    id: string
    name: string
  }
}

interface Props {
  leave: LeaveRequest
  userRole: string
}

export default function LeaveDetail({ leave, userRole }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this leave request?")) return
    try {
      setLoading(true)
      const response = await fetch(`/api/leaves/${leave.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (response.ok) {
        router.push("/leaves")
      }
    } catch (error) {
      console.error("Error approving leave:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return
    try {
      setLoading(true)
      const response = await fetch(`/api/leaves/${leave.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: reason }),
      })
      if (response.ok) {
        router.push("/leaves")
      }
    } catch (error) {
      console.error("Error rejecting leave:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return
    try {
      setLoading(true)
      const response = await fetch(`/api/leaves/${leave.id}/cancel`, {
        method: "PATCH",
      })
      if (response.ok) {
        router.push("/leaves")
      }
    } catch (error) {
      console.error("Error cancelling leave:", error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {leave.leaveType.name}
            </h2>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                statusColors[leave.status as keyof typeof statusColors] || statusColors.PENDING
              }`}
            >
              {leave.status}
            </span>
          </div>
          {userRole === "ADMIN" && leave.status === "PENDING" && (
            <div className="flex space-x-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
          {leave.status === "PENDING" && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Start Date</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(leave.startDate)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">End Date</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(leave.endDate)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Duration</label>
            <p className="mt-1 text-sm text-gray-900">{leave.days} day(s)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Requested By</label>
            <p className="mt-1 text-sm text-gray-900">{leave.user.name}</p>
            <p className="mt-1 text-xs text-gray-500">{leave.user.email}</p>
          </div>
          {leave.admin && (
            <div>
              <label className="text-sm font-medium text-gray-500">Approved By</label>
              <p className="mt-1 text-sm text-gray-900">{leave.admin.name}</p>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">Reason</label>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{leave.reason}</p>
        </div>

        {leave.adminNotes && (
          <div>
            <label className="text-sm font-medium text-gray-500">Admin Notes</label>
            <p className="mt-1 text-sm text-red-600 whitespace-pre-wrap">{leave.adminNotes}</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>Created: {formatDateTime(leave.createdAt)}</p>
            <p>Last Updated: {formatDateTime(leave.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

