"use client"

import { useState } from "react"
import Link from "next/link"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import ApprovalWizard from "@/components/shared/ApprovalWizard"

interface CashRequisition {
  id: string
  amount: number
  currency: string
  payee: string
  details: string
  department: string
  status: string
  adminNotes?: string
  createdAt: string
  preparedBy: {
    id: string
    name: string
    email: string
  }
  authorisedBy?: {
    id: string
    name: string
  }
}

interface Props {
  requisition: CashRequisition
  userRole: string
  userId: string
  onUpdate: () => void
}

export default function CashRequisitionCard({ requisition, userRole, userId, onUpdate }: Props) {
  const [showWizard, setShowWizard] = useState(false)
  const [loading, setLoading] = useState(false)

  const statusColors = {
    DRAFT: "bg-slate-100 text-slate-800",
    SUBMITTED: "bg-amber-100 text-amber-800",
    ADMIN_APPROVED: "bg-green-100 text-green-800",
    ACCOUNTING_PAID: "bg-blue-100 text-blue-800",
    CLOSED: "bg-slate-200 text-slate-900",
    REJECTED: "bg-red-100 text-red-800",
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Draft",
      SUBMITTED: "Submitted",
      ADMIN_APPROVED: "Approved",
      ACCOUNTING_PAID: "Paid",
      CLOSED: "Closed",
      REJECTED: "Rejected"
    }
    return labels[status] || status
  }

  const canReview = (userRole === "ADMIN" || userRole === "HR") && requisition.status === "SUBMITTED"
  const canSubmit = userRole === "EMPLOYEE" && requisition.status === "DRAFT" && requisition.preparedBy.id === userId
  const canPay = userRole === "ACCOUNTING" && requisition.status === "ADMIN_APPROVED"
  const canClose = userRole === "ACCOUNTING" && requisition.status === "ACCOUNTING_PAID"

  const doAction = async (path: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cash-requisitions/${requisition.id}/${path}`, { method: "PATCH" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Action failed")
      }
      onUpdate()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-slate-900">{requisition.payee}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[requisition.status as keyof typeof statusColors]
              }`}
            >
              {getStatusLabel(requisition.status)}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {formatCurrency(requisition.amount, requisition.currency)}
          </div>
          <div className="text-sm text-slate-500 space-y-1">
            <p>Prepared by: {requisition.preparedBy.name}</p>
            <p>Date: {formatDateTime(requisition.createdAt)}</p>
            {requisition.status === "ADMIN_APPROVED" && requisition.authorisedBy && (
              <p className="text-xs text-slate-600 mt-1">Approved by {requisition.authorisedBy.name}</p>
            )}
            {requisition.adminNotes && (
              <p className="mt-2 text-slate-700">
                <span className="font-medium">Notes:</span> {requisition.adminNotes}
              </p>
            )}
          </div>
        </div>
        <div className="ml-4 flex space-x-2">
          <Link
            href={`/cash-requisitions/${requisition.id}`}
            className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
          >
            View
          </Link>
          {canSubmit && (
            <button
              onClick={() => doAction("submit")}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-slate-950 hover:bg-slate-900 disabled:opacity-50"
            >
              Submit
            </button>
          )}
          {canPay && (
            <button
              onClick={() => doAction("pay")}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              Mark Paid
            </button>
          )}
          {canClose && (
            <button
              onClick={() => doAction("close")}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-50"
            >
              Close
            </button>
          )}
          {canReview && (
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-amber-500 hover:bg-amber-600"
            >
              Review
            </button>
          )}
        </div>
      </div>

      {showWizard && canReview && (
        <ApprovalWizard
          title="Review Cash Requisition"
          itemType="requisition"
          itemDetails={{
            title: requisition.payee,
            subtitle: `Prepared by ${requisition.preparedBy.name}`,
            amount: formatCurrency(requisition.amount, requisition.currency),
            details: [
              `Details: ${requisition.details}`,
              `Department: ${requisition.department}`,
              `Date: ${formatDateTime(requisition.createdAt)}`,
            ]
          }}
          onApprove={async (notes) => {
            const res = await fetch(`/api/cash-requisitions/${requisition.id}/approve`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adminNotes: notes })
            })
            if (!res.ok) throw new Error("Approval failed")
            onUpdate()
          }}
          onReject={async (reason) => {
            const res = await fetch(`/api/cash-requisitions/${requisition.id}/reject`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adminNotes: reason })
            })
            if (!res.ok) throw new Error("Rejection failed")
            onUpdate()
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}

