import { db } from "@/lib/db"
import { requireUser } from "@/lib/require-admin"
import { formatDate } from "@/lib/utils"
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  CalendarIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import Link from "next/link"

export default async function NotificationsPage() {
  const user = await requireUser()
  const userId = user.id

  // Get employee notifications
  let notifications: any[] = []
  let unreadCount = 0

  try {
    notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    unreadCount = notifications.filter(n => !n.read).length
  } catch (error) {
    console.error("Error fetching notifications:", error)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REQUISITION_APPROVED':
      case 'REQUISITION_REJECTED':
        return { icon: CurrencyDollarIcon, color: 'amber' }
      case 'TASK_ASSIGNED':
      case 'TASK_UPDATED':
      case 'TASK_COMPLETED':
        return { icon: BriefcaseIcon, color: 'blue' }
      case 'LEAVE_APPROVED':
      case 'LEAVE_REJECTED':
        return { icon: CalendarIcon, color: 'green' }
      default:
        return { icon: BellIcon, color: 'gray' }
    }
  }

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return 'bg-slate-50 border-slate-200'
    
    switch (type) {
      case 'REQUISITION_APPROVED':
        return 'bg-green-50 border-green-200'
      case 'REQUISITION_REJECTED':
        return 'bg-red-50 border-red-200'
      case 'TASK_ASSIGNED':
        return 'bg-blue-50 border-blue-200'
      case 'LEAVE_APPROVED':
        return 'bg-green-50 border-green-200'
      case 'LEAVE_REJECTED':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  const getPriorityIndicator = (type: string) => {
    switch (type) {
      case 'REQUISITION_REJECTED':
      case 'LEAVE_REJECTED':
        return { icon: ExclamationCircleIcon, color: 'text-red-500' }
      case 'REQUISITION_APPROVED':
      case 'LEAVE_APPROVED':
      case 'TASK_ASSIGNED':
        return { icon: CheckCircleIcon, color: 'text-green-500' }
      default:
        return { icon: InformationCircleIcon, color: 'text-blue-500' }
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Notifications</h1>
            <p className="mt-1 text-sm text-slate-600">
              Stay updated with your latest activities and announcements
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                <BellIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{unreadCount} unread</span>
              </div>
            )}
            <button
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Mark all as read
            </button>
          </div>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{notifications.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <BellIcon className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ExclamationCircleIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Requisitions</p>
                <p className="text-2xl font-bold text-amber-600">
                  {notifications.filter(n => n.type.includes('REQUISITION')).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tasks</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type.includes('TASK')).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BriefcaseIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-950 px-6 py-4">
          <h3 className="text-base font-semibold text-white">All Notifications</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <BellIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No notifications yet</h3>
              <p className="text-sm text-slate-600">
                You're all caught up! We'll notify you when there are updates.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const { icon: Icon, color } = getNotificationIcon(notification.type)
              const { icon: PriorityIcon, color: priorityColor } = getPriorityIndicator(notification.type)
              const bgColor = getNotificationColor(notification.type, notification.read)

              return (
                <div
                  key={notification.id}
                  className={`p-6 ${bgColor} border-l-4 ${
                    notification.read ? 'border-l-transparent' : 'border-l-blue-500'
                  } hover:bg-opacity-80 transition-all duration-200`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <PriorityIcon className={`w-4 h-4 ${priorityColor}`} />
                            <h4 className="text-sm font-semibold text-slate-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>{formatDate(notification.createdAt.toString())}</span>
                            {notification.relatedId && (
                              <Link
                                href={`/notifications/${notification.id}`}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                View details →
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Mark as read"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete notification"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {notifications.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing {Math.min(notifications.length, 50)} of {notifications.length} notifications
              </p>
              <div className="flex items-center gap-2">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Load older notifications
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/cash-requisitions"
            className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
          >
            <CurrencyDollarIcon className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">My Requisitions</p>
              <p className="text-xs text-slate-600">Track fund requests</p>
            </div>
          </Link>

          <Link
            href="/tasks"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <BriefcaseIcon className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">My Tasks</p>
              <p className="text-xs text-slate-600">View assignments</p>
            </div>
          </Link>

          <Link
            href="/leaves"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
          >
            <CalendarIcon className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">My Leaves</p>
              <p className="text-xs text-slate-600">Check leave status</p>
            </div>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
          >
            <BellIcon className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Notification Settings</p>
              <p className="text-xs text-slate-600">Manage preferences</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
