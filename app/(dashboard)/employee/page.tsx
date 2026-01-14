import { db } from "@/lib/db"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { requireUser } from "@/lib/require-admin"
import { TESTING_MODE, getMockData } from "@/lib/testing-mode"

// Import icons for better UI
import { 
  BriefcaseIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  UserCircleIcon,
  BellIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

export default async function EmployeeDashboardPage() {
  const user = await requireUser()
  const userId = user.id

  // Get employee-specific statistics
  let stats = {
    myRequisitions: 0,
    pendingRequisitions: 0,
    approvedRequisitions: 0,
    totalRequisitionAmount: 0,
    myTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    myLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalLeaveDays: 0,
    upcomingLeaves: 0,
  }
  let recentRequisitions: any[] = []
  let recentTasks: any[] = []
  let recentLeaves: any[] = []
  let upcomingLeavesList: any[] = []

  if (TESTING_MODE) {
    // Use mock data for testing
    const mockReqs = getMockData('requisitions')
    const mockTasks = getMockData('tasks')
    const mockLeaves = getMockData('leaves')
    
    stats.myRequisitions = mockReqs.length
    stats.pendingRequisitions = mockReqs.filter((r: any) => ['DRAFT', 'SUBMITTED'].includes(r.status)).length
    stats.approvedRequisitions = mockReqs.filter((r: any) => r.status === 'ADMIN_APPROVED').length
    stats.totalRequisitionAmount = mockReqs.reduce((sum: number, r: any) => sum + r.amount, 0)
    stats.myTasks = mockTasks.length
    stats.pendingTasks = mockTasks.filter((t: any) => ['TODO', 'IN_PROGRESS'].includes(t.status)).length
    stats.completedTasks = mockTasks.filter((t: any) => t.status === 'COMPLETED').length
    stats.myLeaves = mockLeaves.length
    stats.pendingLeaves = mockLeaves.filter((l: any) => l.status === 'PENDING').length
    stats.approvedLeaves = mockLeaves.filter((l: any) => l.status === 'APPROVED').length
    stats.totalLeaveDays = mockLeaves
      .filter((l: any) => l.status === 'APPROVED')
      .reduce((sum: number, l: any) => sum + l.days, 0)
    
    recentRequisitions = mockReqs.slice(0, 5)
    recentTasks = mockTasks.slice(0, 5)
    recentLeaves = mockLeaves.slice(0, 5)
    upcomingLeavesList = []
  } else {
    try {
      const [
        myReqs,
        pendingReqs,
        approvedReqs,
        myReqsData,
        myT,
        pendingT,
        completedT,
        myL,
        pendingL,
        approvedL,
        myLeavesData,
        upcomingL,
      ] = await Promise.all([
        db.cashRequisition.count({ where: { preparedById: userId } }),
        db.cashRequisition.count({ 
          where: { preparedById: userId, status: { in: ["DRAFT", "SUBMITTED"] } }
        }),
        db.cashRequisition.count({ 
          where: { preparedById: userId, status: "ADMIN_APPROVED" }
        }),
        db.cashRequisition.findMany({ 
          where: { preparedById: userId },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { preparedBy: { select: { name: true, email: true } } }
        }),
        db.task.count({ where: { assigneeId: userId } }),
        db.task.count({
          where: {
            assigneeId: userId,
            status: { in: ["TODO", "IN_PROGRESS"] },
          },
        }),
        db.task.count({
          where: {
            assigneeId: userId,
            status: "COMPLETED",
          },
        }),
        db.leaveRequest.count({ where: { userId } }),
        db.leaveRequest.count({ where: { userId, status: "PENDING" } }),
        db.leaveRequest.count({
          where: { userId, status: "APPROVED" },
        }),
        db.leaveRequest.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { leaveType: { select: { name: true } }, user: { select: { name: true, email: true } } },
        }),
        db.leaveRequest.findMany({
          where: {
            userId,
            status: "APPROVED",
            startDate: { gte: new Date() },
          },
          take: 3,
          orderBy: { startDate: "asc" },
          include: { leaveType: { select: { name: true } } },
        }),
      ])

      stats.myRequisitions = myReqs
      stats.pendingRequisitions = pendingReqs
      stats.approvedRequisitions = approvedReqs
      stats.totalRequisitionAmount = myReqsData.reduce((sum: number, r: any) => sum + r.amount, 0)
      stats.myTasks = myT
      stats.pendingTasks = pendingT
      stats.completedTasks = completedT
      stats.myLeaves = myL
      stats.pendingLeaves = pendingL
      stats.approvedLeaves = approvedL
      stats.totalLeaveDays = myLeavesData
        .filter((l: any) => l.status === "APPROVED")
        .reduce((sum: number, l: any) => sum + l.days, 0)
      stats.upcomingLeaves = upcomingL.length

      recentRequisitions = myReqsData
      recentTasks = await db.task.findMany({
        where: { assigneeId: userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          creator: { select: { name: true } },
          assignee: { select: { name: true } },
        },
      })
      recentLeaves = myLeavesData
      upcomingLeavesList = upcomingL
    } catch (error) {
      console.error("Database connection error:", error)
    }
  }

  const taskCompletionRate =
    stats.myTasks > 0
      ? Math.round((stats.completedTasks / stats.myTasks) * 100)
      : 0

  return (
    <div className="animate-fade-in">
      {/* Enhanced Header with Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserCircleIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back, {user.name}!
                </h1>
                <p className="mt-1 text-blue-100">
                  {user.department} Department • Employee Portal
                </p>
                <p className="text-sm text-blue-200 mt-2">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/cash-requisitions/new"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-blue-900 bg-white hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
              >
                <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                New Requisition
              </Link>
              <Link
                href="/leaves/new"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all transform hover:scale-105 border border-white/30"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Request Leave
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Quick Actions</h2>
            <p className="text-sm text-slate-600 mt-1">Access your most frequently used features</p>
          </div>
          <Link href="/profile" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            <UserCircleIcon className="w-4 h-4" />
            View Profile
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Create Requisition */}
          <Link href="/cash-requisitions/new" className="block group">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-400 flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-amber-900" />
                  </div>
                  {stats.pendingRequisitions > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      {stats.pendingRequisitions}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Requisitions</h3>
                  <p className="text-3xl font-bold text-amber-600 mb-3">{stats.myRequisitions}</p>
                  <p className="text-sm text-slate-600 mb-4">Total requests submitted</p>
                </div>
                <div className="flex items-center text-sm font-medium text-amber-700 group-hover:text-amber-800 transition-colors">
                  <span>Request funds</span>
                  <ArrowTrendingUpIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Request Leave */}
          <Link href="/leaves/new" className="block group">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-400 flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-green-900" />
                  </div>
                  {stats.pendingLeaves > 0 && (
                    <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      {stats.pendingLeaves}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Leave</h3>
                  <p className="text-3xl font-bold text-green-600 mb-3">{stats.totalLeaveDays}</p>
                  <p className="text-sm text-slate-600 mb-4">Days approved this year</p>
                </div>
                <div className="flex items-center text-sm font-medium text-green-700 group-hover:text-green-800 transition-colors">
                  <span>Request leave</span>
                  <CalendarIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* My Tasks */}
          <Link href="/tasks" className="block group">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-400 flex items-center justify-center">
                    <BriefcaseIcon className="w-6 h-6 text-blue-900" />
                  </div>
                  {stats.pendingTasks > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      {stats.pendingTasks}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Tasks</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-3">{taskCompletionRate}%</p>
                  <p className="text-sm text-slate-600 mb-4">{stats.completedTasks} of {stats.myTasks} completed</p>
                  <div className="mb-4">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${taskCompletionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm font-medium text-blue-700 group-hover:text-blue-800 transition-colors">
                  <span>View tasks</span>
                  <CheckCircleIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Notifications */}
          <Link href="/notifications" className="block group">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-400 flex items-center justify-center">
                    <BellIcon className="w-6 h-6 text-purple-900" />
                  </div>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    3
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Notifications</h3>
                  <p className="text-3xl font-bold text-purple-600 mb-3">3</p>
                  <p className="text-sm text-slate-600 mb-4">New updates waiting</p>
                </div>
                <div className="flex items-center text-sm font-medium text-purple-700 group-hover:text-purple-800 transition-colors">
                  <span>View all</span>
                  <BellIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="mb-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-950">My Overview</h2>
          <p className="text-sm text-slate-600 mt-1">Your performance and activity summary</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-600">Total Requisitions</p>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-950 mb-2">{stats.myRequisitions}</div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Total value</p>
              <p className="text-sm font-medium text-amber-600">{formatCurrency(stats.totalRequisitionAmount, "USD")}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-600">Approved Requisitions</p>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-950 mb-2">{stats.approvedRequisitions}</div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-sm font-medium text-green-600">Ready for payment</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-600">Leave Requests</p>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-950 mb-2">{stats.myLeaves}</div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Days approved</p>
              <p className="text-sm font-medium text-blue-600">{stats.totalLeaveDays}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-600">Completed Tasks</p>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-950 mb-2">{stats.completedTasks}</div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Completion rate</p>
              <p className="text-sm font-medium text-purple-600">{taskCompletionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Leave */}
      {upcomingLeavesList.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-950 mb-6">Upcoming Leave</h2>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="space-y-3">
                {upcomingLeavesList.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-slate-900">
                        {leave.leaveType?.name}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatDate(leave.startDate.toString())} - {formatDate(leave.endDate.toString())} ({leave.days} days)
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Approved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Grid */}
      <div className="mb-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-950">Recent Activity</h2>
          <p className="text-sm text-slate-600 mt-1">Your latest requisitions, tasks, and leave requests</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Requisitions */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="bg-slate-950 px-6 py-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <CurrencyDollarIcon className="w-4 h-4" />
                My Requisitions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentRequisitions.length === 0 ? (
                  <div className="text-center py-8">
                    <CurrencyDollarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-3">No requisitions yet</p>
                    <Link
                      href="/cash-requisitions/new"
                      className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                    >
                      Create your first requisition →
                    </Link>
                  </div>
                ) : (
                  recentRequisitions.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {req.payee}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-medium">{formatCurrency(req.amount, req.currency)}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(req.createdAt.toString())}</span>
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
                            : req.status === "SUBMITTED"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {recentRequisitions.length > 0 && (
                <Link
                  href="/cash-requisitions"
                  className="mt-5 flex items-center justify-center text-sm font-medium text-amber-600 hover:text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  View all requisitions →
                </Link>
              )}
            </div>
          </div>

        {/* Recent Tasks */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="bg-slate-950 px-6 py-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4" />
                My Tasks
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <BriefcaseIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-3">No tasks assigned yet</p>
                  </div>
                ) : (
                  recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          By {task.creator.name}
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
                  ))
                )}
              </div>
              {recentTasks.length > 0 && (
                <Link
                  href="/tasks"
                  className="mt-5 flex items-center justify-center text-sm font-medium text-amber-600 hover:text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  View all tasks →
                </Link>
              )}
            </div>
          </div>

          {/* Recent Leaves */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="bg-slate-950 px-6 py-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                My Leave Requests
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentLeaves.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-3">No leave requests yet</p>
                    <Link
                      href="/leaves/new"
                      className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                    >
                      Request leave →
                    </Link>
                  </div>
                ) : (
                  recentLeaves.slice(0, 3).map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {leave.leaveType?.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {leave.days} day(s) • {formatDate(leave.createdAt.toString())}
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
                  ))
                )}
              </div>
              {recentLeaves.length > 0 && (
                <Link
                  href="/leaves"
                  className="mt-5 flex items-center justify-center text-sm font-medium text-amber-600 hover:text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  View all leaves →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
