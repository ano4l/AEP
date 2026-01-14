"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import ApprovalWizard from "@/components/shared/ApprovalWizard"

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
  onUpdate: () => void
}

export default function LeaveCard({ leave, userRole, onUpdate }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return
    try {
      setLoading(true)
      const response = await fetch(`/api/leaves/${leave.id}/cancel`, {
        method: "PATCH",
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Error cancelling leave:", error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-slate-100 text-slate-800",
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {leave.leaveType.name}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[leave.status as keyof typeof statusColors] || statusColors.PENDING
              }`}
            >
              {leave.status}
            </span>
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            <p>
              <span className="font-medium">Period:</span> {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
            </p>
            <p>
              <span className="font-medium">Duration:</span> {leave.days} day(s)
            </p>
            <p>
              <span className="font-medium">Requested by:</span> {leave.user.name}
            </p>
            {leave.reason && (
              <p>
                <span className="font-medium">Reason:</span> {leave.reason}
              </p>
            )}
            {leave.adminNotes && (
              <p className="text-red-600">
                <span className="font-medium">Admin Notes:</span> {leave.adminNotes}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-2 ml-4">
          <Link
            href={`/leaves/${leave.id}`}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            View Details
          </Link>
          {userRole === "ADMIN" && leave.status === "PENDING" && (
            <button
              onClick={() => setShowWizard(true)}
              className="text-sm px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
            >
              Review
            </button>
          )}
        </div>
      </div>

      {showWizard && userRole === "ADMIN" && leave.status === "PENDING" && (
        <ApprovalWizard
          title="Review Leave Request"
          itemType="leave"
          itemDetails={{
            title: leave.leaveType.name,
            subtitle: `Requested by ${leave.user.name}`,
            details: [
              `Duration: ${leave.days} day(s)`,
              `Period: ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`,
              `Reason: ${leave.reason}`,
            ]
          }}
          onApprove={async (notes) => {
            const response = await fetch(`/api/leaves/${leave.id}/approve`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adminNotes: notes }),
            })
            if (!response.ok) throw new Error("Approval failed")
            onUpdate()
          }}
          onReject={async (reason) => {
            const response = await fetch(`/api/leaves/${leave.id}/reject`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adminNotes: reason }),
            })
            if (!response.ok) throw new Error("Rejection failed")
            onUpdate()
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}

