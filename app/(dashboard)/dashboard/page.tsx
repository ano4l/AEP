import { db } from "@/lib/db"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { requireUser } from "@/lib/require-admin"
import { TESTING_MODE, getMockData } from "@/lib/testing-mode"

export default async function DashboardPage() {
  const user = await requireUser()
  const userId = user.id
  const userRole = user.role

  // Get comprehensive statistics with error handling
  let stats = {
    pendingRequisitions: 0,
    myRequisitions: 0,
    totalRequisitionAmount: 0,
    myTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    pendingLeaves: 0,
    myLeaves: 0,
    approvedLeaves: 0,
    totalLeaveDays: 0,
  }
  let recentRequisitions: any[] = []
  let recentTasks: any[] = []
  let recentLeaves: any[] = []
  let upcomingLeaves: any[] = []

  if (TESTING_MODE) {
    // Use mock data for testing
    const mockReqs = getMockData('requisitions')
    const mockTasks = getMockData('tasks')
    const mockLeaves = getMockData('leaves')
    
    stats.pendingRequisitions = mockReqs.filter((r: any) => r.status === 'SUBMITTED').length
    stats.myRequisitions = mockReqs.length
    stats.totalRequisitionAmount = mockReqs.reduce((sum: number, r: any) => sum + r.amount, 0)
    stats.myTasks = mockTasks.length
    stats.pendingTasks = mockTasks.filter((t: any) => t.status === 'TODO').length
    stats.completedTasks = mockTasks.filter((t: any) => t.status === 'COMPLETED').length
    stats.pendingLeaves = mockLeaves.filter((l: any) => l.status === 'PENDING').length
    stats.myLeaves = mockLeaves.length
    stats.approvedLeaves = mockLeaves.filter((l: any) => l.status === 'APPROVED').length
    stats.totalLeaveDays = mockLeaves
      .filter((l: any) => l.status === 'APPROVED')
      .reduce((sum: number, l: any) => sum + l.days, 0)
    
    recentRequisitions = mockReqs.slice(0, 5)
    recentTasks = mockTasks.slice(0, 5)
    recentLeaves = mockLeaves.slice(0, 5)
    upcomingLeaves = []
  } else {
    try {
      // Use Supabase for all database operations
      const [
        allReqs,
        myReqs,
        allTasks,
        allLeaves,
      ] = await Promise.all([
        db.cashRequisition.findMany({ orderBy: { createdAt: 'desc' } }) as Promise<any[]>,
        db.cashRequisition.findMany({ 
          where: { preparedById: userId },
          orderBy: { createdAt: 'desc' }
        }) as Promise<any[]>,
        db.task.findMany({ orderBy: { createdAt: 'desc' } }) as Promise<any[]>,
        db.leaveRequest.findMany({ orderBy: { createdAt: 'desc' } }) as Promise<any[]>,
      ])

      // Calculate statistics
      stats.pendingRequisitions = allReqs.filter(r => r.status === 'SUBMITTED').length
      stats.myRequisitions = myReqs.length
      stats.totalRequisitionAmount = myReqs.reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
      stats.myTasks = allTasks.filter(t => t.assigneeId === userId).length
      stats.pendingTasks = allTasks.filter(t => 
        t.assigneeId === userId && ['TODO', 'IN_PROGRESS'].includes(t.status)
      ).length
      stats.completedTasks = allTasks.filter(t => 
        t.assigneeId === userId && t.status === 'COMPLETED'
      ).length
      stats.pendingLeaves = allLeaves.filter(l => l.status === 'PENDING').length
      stats.myLeaves = allLeaves.filter(l => l.requesterId === userId).length
      stats.approvedLeaves = allLeaves.filter(l => 
        l.requesterId === userId && l.status === 'APPROVED'
      ).length
      stats.totalLeaveDays = allLeaves
        .filter(l => l.requesterId === userId && l.status === 'APPROVED')
        .reduce((sum: number, l: any) => sum + (l.days || 0), 0)

      // Get recent items for display
      recentRequisitions = (userRole === "ADMIN" || userRole === "HR" 
        ? allReqs 
        : myReqs
      ).slice(0, 5)

      recentTasks = allTasks
        .filter(t => t.assigneeId === userId)
        .slice(0, 5)

      recentLeaves = (userRole === "ADMIN" || userRole === "HR" 
        ? allLeaves 
        : allLeaves.filter(l => l.requesterId === userId)
      ).slice(0, 5)

      const today = new Date()
      upcomingLeaves = allLeaves
        .filter(l => 
          l.requesterId === userId && 
          l.status === 'APPROVED' && 
          new Date(l.startDate) >= today
        )
        .slice(0, 3)

    } catch (error) {
      console.error("Dashboard data error:", error)
    }
  }

  const taskCompletionRate =
    stats.myTasks > 0
      ? Math.round((stats.completedTasks / stats.myTasks) * 100)
      : 0

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              {userRole === "ADMIN" || userRole === "HR" ? "Admin Dashboard" : "Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-semibold text-slate-900">{user.name}</span>
            </p>
          </div>
          {(userRole === "ADMIN" || userRole === "HR") && (
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tasks/new"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-slate-950 bg-amber-400 hover:bg-amber-500 transition-colors"
              >
                Assign Task
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Admin Action Items - Only for Admin/HR */}
      {(userRole === "ADMIN" || userRole === "HR") && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-950 mb-6">Pending Approvals</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Pending Requisitions */}
            <Link href="/cash-requisitions?status=SUBMITTED" className="block group">
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border-2 border-amber-400 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Requisitions to Review</h3>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm">
                    Action Required
                  </span>
                </div>
                <p className="text-5xl font-bold text-slate-950 mb-3">{stats.pendingRequisitions}</p>
                <div className="flex items-center text-sm text-slate-600 group-hover:text-amber-600 transition-colors">
                  <span>Click to review</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Pending Leave Requests */}
            <Link href="/leaves?status=PENDING" className="block group">
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border-2 border-amber-400 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Leave Requests</h3>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm">
                    Action Required
                  </span>
                </div>
                <p className="text-5xl font-bold text-slate-950 mb-3">{stats.pendingLeaves}</p>
                <div className="flex items-center text-sm text-slate-600 group-hover:text-amber-600 transition-colors">
                  <span>Click to approve</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Active Tasks */}
            <Link href="/tasks" className="block group">
              <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Active Tasks</h3>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-700">{stats.pendingTasks}</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-950 mb-2">{taskCompletionRate}%</p>
                <div className="mb-3">
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${taskCompletionRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  <span>Completion rate</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Overview Statistics */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-slate-950 mb-6">Overview</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <p className="text-sm font-semibold text-slate-600 mb-3">Total Requisitions</p>
            <div className="text-3xl font-bold text-slate-950 mb-2">{stats.myRequisitions}</div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-amber-600">{formatCurrency(stats.totalRequisitionAmount, "USD")}</p>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <p className="text-sm font-semibold text-slate-600 mb-3">My Tasks</p>
            <div className="text-3xl font-bold text-slate-950 mb-3">{stats.myTasks}</div>
            <div className="mb-2">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${taskCompletionRate}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-600">{taskCompletionRate}% completed</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <p className="text-sm font-semibold text-slate-600 mb-3">Leave Requests</p>
            <div className="text-3xl font-bold text-slate-950 mb-2">{stats.myLeaves}</div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">{stats.totalLeaveDays} days approved</p>
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <p className="text-sm font-semibold text-slate-600 mb-3">Completed Tasks</p>
            <div className="text-3xl font-bold text-slate-950 mb-2">{stats.completedTasks}</div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Done</p>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Requisitions */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-950 px-6 py-4">
            <h3 className="text-base font-semibold text-white">
              Recent Requisitions
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentRequisitions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No requisitions yet</p>
                </div>
              ) : (
                recentRequisitions.map((req) => (
                  <Link
                    key={req.id}
                    href={`/cash-requisitions/${req.id}`}
                    className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {req.payee}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-medium">{formatCurrency(req.amount, req.currency)}</span>
                        </p>
                      </div>
                      <span
                        className={`ml-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          req.status === "ADMIN_APPROVED"
                            ? "bg-green-100 text-green-700"
                            : req.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : req.status === "ACCOUNTING_PAID"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/cash-requisitions"
              className="mt-5 flex items-center justify-center text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              View all requisitions →
            </Link>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-950 px-6 py-4">
            <h3 className="text-base font-semibold text-white">
              Recent Tasks
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No tasks yet</p>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {task.title}
                        </p>
                      </div>
                      <span
                        className={`ml-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          task.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : task.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/tasks"
              className="mt-5 flex items-center justify-center text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              View all tasks →
            </Link>
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-950 px-6 py-4">
            <h3 className="text-base font-semibold text-white">
              Leave Requests
            </h3>
          </div>
          <div className="p-6">
            {upcomingLeaves.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-medium text-slate-600 mb-3 uppercase">Upcoming</p>
                <div className="space-y-2">
                  {upcomingLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <p className="text-xs font-medium text-slate-900">
                        {formatDate(leave.startDate)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{leave.days} day(s)</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {upcomingLeaves.length > 0 && <p className="text-xs font-medium text-slate-600 uppercase">Recent</p>}
              {recentLeaves.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No leave requests yet</p>
                </div>
              ) : (
                recentLeaves.slice(0, 3).map((leave) => (
                  <Link
                    key={leave.id}
                    href={`/leaves/${leave.id}`}
                    className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {leave.days} day(s)
                        </p>
                      </div>
                      <span
                        className={`ml-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          leave.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : leave.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : leave.status === "CANCELLED"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/leaves"
              className="mt-5 flex items-center justify-center text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              View all leaves →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
