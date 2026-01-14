"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import AdminApprovalPanel from "./AdminApprovalPanel"

interface CashRequisition {
  id: string
  amount: number
  currency: string
  payee: string
  details: string
  customer?: string | null
  code?: string | null
  department: string
  status: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  preparedBy: {
    id: string
    name: string
    email: string
  }
  authorisedBy?: {
    id: string
    name: string
  }
  paidBy?: {
    id: string
    name: string
  } | null
  rejectedBy?: {
    id: string
    name: string
  } | null
}

interface Props {
  requisition: CashRequisition
  userRole: string
  userId: string
}

export default function CashRequisitionDetail({ requisition, userRole, userId }: Props) {
  const router = useRouter()
  const [showApproval, setShowApproval] = useState(false)
  const [loading, setLoading] = useState(false)

  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    ADMIN_APPROVED: "bg-green-100 text-green-800",
    ACCOUNTING_PAID: "bg-blue-100 text-blue-800",
    CLOSED: "bg-gray-200 text-gray-900",
    REJECTED: "bg-red-100 text-red-800",
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
      handleUpdate()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:text-blue-500 mb-4"
        >
          ← Back to Requisitions
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Cash Requisition Details</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{requisition.payee}</h2>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[requisition.status as keyof typeof statusColors]
              }`}
            >
              {requisition.status}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-6">
            {formatCurrency(requisition.amount, requisition.currency)}
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Prepared By</dt>
            <dd className="mt-1 text-sm text-gray-900">{requisition.preparedBy.name}</dd>
            <dd className="text-sm text-gray-500">{requisition.preparedBy.email}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Department</dt>
            <dd className="mt-1 text-sm text-gray-900">{requisition.department}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Details</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{requisition.details}</dd>
          </div>

          {(requisition.customer || requisition.code) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">{requisition.customer || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{requisition.code || "-"}</dd>
              </div>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDateTime(requisition.createdAt)}</dd>
          </div>

          {requisition.authorisedBy && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Authorised By</dt>
              <dd className="mt-1 text-sm text-gray-900">{requisition.authorisedBy.name}</dd>
            </div>
          )}

          {requisition.paidBy && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Paid By</dt>
              <dd className="mt-1 text-sm text-gray-900">{requisition.paidBy.name}</dd>
            </div>
          )}

          {requisition.rejectedBy && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Rejected By</dt>
              <dd className="mt-1 text-sm text-gray-900">{requisition.rejectedBy.name}</dd>
            </div>
          )}

          {requisition.adminNotes && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Admin Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{requisition.adminNotes}</dd>
            </div>
          )}
        </div>

        {(canSubmit || canPay || canClose || canReview) && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                {canSubmit && (
                  <button
                    onClick={() => doAction("submit")}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                  >
                    Submit
                  </button>
                )}
                {canPay && (
                  <button
                    onClick={() => doAction("pay")}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark Paid
                  </button>
                )}
                {canClose && (
                  <button
                    onClick={() => doAction("close")}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-50"
                  >
                    Close
                  </button>
                )}
                {canReview && (
                  <button
                    onClick={() => setShowApproval((v) => !v)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {showApproval ? "Hide Review" : "Review"}
                  </button>
                )}
              </div>

              {showApproval && canReview && (
                <AdminApprovalPanel
                  requisitionId={requisition.id}
                  onSuccess={() => {
                    setShowApproval(false)
                    handleUpdate()
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

