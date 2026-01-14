"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import CashRequisitionCard from "@/components/cash-requisitions/CashRequisitionCard"

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

type Me = {
  id: string
  role: string
}

export default function CashRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<CashRequisition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        setMe(data.user ?? null)
      } catch {
        setMe(null)
      }
    })()
  }, [])

  useEffect(() => {
    fetchRequisitions()
  }, [filter])

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      const url = filter !== "all" ? `/api/cash-requisitions?status=${filter}` : "/api/cash-requisitions"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch requisitions')
      }
      const data = await response.json()
      setRequisitions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching requisitions:", error)
      setRequisitions([])
    } finally {
      setLoading(false)
    }
  }

  const userRole = me?.role

  const statuses =
    userRole === "ACCOUNTING"
      ? ["all", "ADMIN_APPROVED", "ACCOUNTING_PAID", "CLOSED"]
      : ["all", "DRAFT", "SUBMITTED", "ADMIN_APPROVED", "ACCOUNTING_PAID", "CLOSED", "REJECTED"]

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      all: "All",
      DRAFT: "Draft",
      SUBMITTED: "Submitted",
      ADMIN_APPROVED: "Approved",
      ACCOUNTING_PAID: "Paid",
      CLOSED: "Closed",
      REJECTED: "Rejected"
    }
    return labels[status] || status
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Cash Requisitions</h1>
          <p className="mt-2 text-sm text-slate-600">
            {userRole === "ADMIN" || userRole === "HR" ? "Manage all cash requisitions" : "View and create cash requisitions"}
          </p>
        </div>
        <Link
          href="/cash-requisitions/new"
          className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-950 hover:bg-slate-900 transition-colors"
        >
          New Requisition
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === status
                ? "bg-amber-400 text-slate-950"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Requisitions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-500">Loading...</div>
        </div>
      ) : requisitions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No requisitions found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requisitions.map((requisition) => (
            <CashRequisitionCard
              key={requisition.id}
              requisition={requisition}
              userRole={userRole ?? ""}
              userId={me?.id ?? ""}
              onUpdate={fetchRequisitions}
            />
          ))}
        </div>
      )}
    </div>
  )
}

