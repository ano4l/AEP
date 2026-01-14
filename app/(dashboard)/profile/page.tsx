import { db } from "@/lib/db"
import { requireUser } from "@/lib/require-admin"
import { formatDate } from "@/lib/utils"
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  BuildingOfficeIcon, 
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import Link from "next/link"

export default async function ProfilePage() {
  const user = await requireUser()
  const userId = user.id

  // Get employee statistics and data
  let stats = {
    totalRequisitions: 0,
    approvedRequisitions: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalLeaves: 0,
    approvedLeaves: 0,
    joinDate: new Date(),
  }

  let recentActivity: any[] = []

  try {
    // Get user's detailed information and statistics
    const [
      requisitions,
      tasks,
      leaves,
      userWithDetails
    ] = await Promise.all([
      db.cashRequisition.findMany({
        where: { preparedById: userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }) as Promise<any[]>,
      db.task.findMany({
        where: { assigneeId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }) as Promise<any[]>,
      db.leaveRequest.findMany({
        where: { requesterId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }) as Promise<any[]>,
      db.getUser(userId) as Promise<any>
    ])

    if (userWithDetails) {
      stats.totalRequisitions = requisitions.length
      stats.approvedRequisitions = requisitions.filter(r => r.status === 'ADMIN_APPROVED').length
      stats.totalTasks = tasks.length
      stats.completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
      stats.totalLeaves = leaves.length
      stats.approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length
      stats.joinDate = userWithDetails.createdAt
    }

    // Combine recent activity
    recentActivity = [
      ...requisitions.map(r => ({
        id: r.id,
        type: 'requisition',
        title: `Requisition for ${r.payee}`,
        subtitle: `${r.amount} USD`,
        status: r.status,
        date: r.createdAt,
        icon: CurrencyDollarIcon,
        color: 'amber'
      })),
      ...tasks.map(t => ({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: `Due ${formatDate(t.dueDate.toString())}`,
        status: t.status,
        date: t.createdAt,
        icon: BriefcaseIcon,
        color: 'blue'
      })),
      ...leaves.map(l => ({
        id: l.id,
        type: 'leave',
        title: `${l.leaveType?.name} Leave`,
        subtitle: `${l.days} day(s)`,
        status: l.status,
        date: l.createdAt,
        icon: CalendarIcon,
        color: 'green'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  } catch (error) {
    console.error("Error fetching profile data:", error)
  }

  const taskCompletionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'admin_approved':
        return 'bg-green-100 text-green-700'
      case 'pending':
      case 'submitted':
      case 'todo':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1).toLowerCase()
  }

  return (
    <div className="animate-fade-in">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserCircleIcon className="w-16 h-16 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-indigo-100">
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>{user.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span>{user.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Joined {formatDate(stats.joinDate.toString())}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <EnvelopeIcon className="w-4 h-4 text-indigo-200" />
                  <span className="text-indigo-200">{user.email}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/profile/edit"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-indigo-900 bg-white hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all transform hover:scale-105 border border-white/30"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-slate-950 mb-6">Performance Overview</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-amber-600">{stats.approvedRequisitions}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Approved Requisitions</p>
            <p className="text-xs text-slate-500 mt-1">of {stats.totalRequisitions} total</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">{taskCompletionRate}%</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Task Completion</p>
            <p className="text-xs text-slate-500 mt-1">{stats.completedTasks}/{stats.totalTasks} tasks</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.approvedLeaves}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Approved Leaves</p>
            <p className="text-xs text-slate-500 mt-1">of {stats.totalLeaves} requests</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">{Math.floor((Date.now() - stats.joinDate.getTime()) / (1000 * 60 * 60 * 24))}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Days with Company</p>
            <p className="text-xs text-slate-500 mt-1">Since joining</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-950 px-6 py-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-${activity.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 text-${activity.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {activity.subtitle}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-500">
                            {formatDate(activity.date.toString())}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(activity.status)}`}
                          >
                            {getStatusText(activity.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {recentActivity.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link
                  href="/activity"
                  className="flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View all activity →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-950 px-6 py-4">
            <h3 className="text-base font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link
                href="/cash-requisitions/new"
                className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
              >
                <CurrencyDollarIcon className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">New Requisition</p>
                  <p className="text-xs text-slate-600">Request funds for expenses</p>
                </div>
              </Link>

              <Link
                href="/leaves/new"
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
              >
                <CalendarIcon className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Request Leave</p>
                  <p className="text-xs text-slate-600">Apply for time off</p>
                </div>
              </Link>

              <Link
                href="/tasks"
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">View Tasks</p>
                  <p className="text-xs text-slate-600">Manage your assignments</p>
                </div>
              </Link>

              <Link
                href="/notifications"
                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
              >
                <ChartBarIcon className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-600">Check for updates</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
