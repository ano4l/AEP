"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import LeaveCard from "@/components/leaves/LeaveCard"

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

type LeaveTypeOption = {
  id: string
  name: string
}

type Me = {
  role: string
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [leaveTypeId, setLeaveTypeId] = useState<string>("all")
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([])
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
    ;(async () => {
      try {
        const res = await fetch("/api/leave-types")
        if (!res.ok) {
          throw new Error('Failed to fetch leave types')
        }
        const data = await res.json()
        setLeaveTypes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching leave types:', error)
        setLeaveTypes([])
      }
    })()
  }, [])

  useEffect(() => {
    fetchLeaves()
  }, [filter, leaveTypeId])

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== "all") params.append("status", filter)
      if (leaveTypeId !== "all") params.append("leaveTypeId", leaveTypeId)
      const url = params.toString() ? `/api/leaves?${params}` : "/api/leaves"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch leaves')
      }
      const data = await response.json()
      setLeaves(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching leaves:", error)
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }

  const userRole = me?.role

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Leave Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            {userRole === "ADMIN" || userRole === "HR" ? "Manage all leave requests" : "View and request leaves"}
          </p>
        </div>
        <Link
          href="/leaves/new"
          className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-950 hover:bg-slate-900 transition-colors"
        >
          Request Leave
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        <div className="flex space-x-2">
          {["all", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === status
                  ? "bg-amber-400 text-slate-950"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <select
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        >
          <option value="all">All Types</option>
          {Array.isArray(leaveTypes) && leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Leaves List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-500">Loading...</div>
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No leave requests found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {leaves.map((leave) => (
            <LeaveCard
              key={leave.id}
              leave={leave}
              userRole={userRole ?? ""}
              onUpdate={fetchLeaves}
            />
          ))}
        </div>
      )}
    </div>
  )
}

