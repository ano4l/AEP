"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import NotificationCenter from "@/components/shared/NotificationCenter"
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  BriefcaseIcon, 
  CalendarIcon, 
  UserCircleIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

type User = {
  id: string
  email: string
  name: string
  role: "ADMIN" | "EMPLOYEE" | "ACCOUNTING" | "HR"
  department: string
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  const isAdmin = user?.role === "ADMIN" || user?.role === "HR"
  const isEmployee = user?.role === "EMPLOYEE"
  const isAccounting = user?.role === "ACCOUNTING"

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const adminNavLinks = [
    { href: "/dashboard", label: "Admin Dashboard", icon: HomeIcon },
    { href: "/admin/pending-users", label: "Pending Users", icon: UserGroupIcon },
    { href: "/cash-requisitions", label: "Requisitions", icon: CurrencyDollarIcon },
    { href: "/tasks", label: "Tasks", icon: BriefcaseIcon },
    { href: "/leaves", label: "Leaves", icon: CalendarIcon },
  ]

  const employeeNavLinks = [
    { href: "/employee", label: "Dashboard", icon: HomeIcon },
    { href: "/cash-requisitions", label: "My Requisitions", icon: CurrencyDollarIcon },
    { href: "/tasks", label: "My Tasks", icon: BriefcaseIcon },
    { href: "/leaves", label: "My Leaves", icon: CalendarIcon },
    { href: "/profile", label: "Profile", icon: UserCircleIcon },
  ]

  const accountingNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { href: "/cash-requisitions", label: "Requisitions", icon: CurrencyDollarIcon },
  ]

  const navLinks = isAdmin ? adminNavLinks : isAccounting ? accountingNavLinks : employeeNavLinks

  const getUserInitials = () => {
    if (!user?.name) return "??"
    const names = user.name.split(" ")
    return names.map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const getRoleLabel = () => {
    switch (user?.role) {
      case "ADMIN": return "Administrator"
      case "HR": return "HR Manager"
      case "ACCOUNTING": return "Accounting"
      case "EMPLOYEE": return "Employee"
      default: return "User"
    }
  }

  if (loading) {
    return (
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-slate-900">AceTech</span>
            </div>
            <div className="text-sm text-slate-500">Loading...</div>
          </div>
        </div>
      </nav>
    )
  }

  if (!user) {
    return null
  }

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href={isAdmin ? "/dashboard" : "/employee"} 
              className="flex items-center space-x-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-slate-900">AceTech</span>
                <p className="text-xs text-slate-500 -mt-1">{isAdmin ? "Admin Portal" : "Employee Portal"}</p>
              </div>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive(link.href)
                        ? "text-white bg-amber-500"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Actions for Employees */}
            {isEmployee && (
              <div className="hidden lg:flex items-center space-x-2">
                <Link
                  href="/cash-requisitions/new"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors whitespace-nowrap"
                >
                  <CurrencyDollarIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  New Req
                </Link>
                <Link
                  href="/leaves/new"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors whitespace-nowrap"
                >
                  <CalendarIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  Leave
                </Link>
              </div>
            )}
            
            <NotificationCenter />
            
            {/* User Profile */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">{getUserInitials()}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500 leading-tight">{getRoleLabel()}</p>
              </div>
            </div>

            {/* Help and Logout */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/help"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Help"
                aria-label="Help"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-white bg-amber-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-label={link.label}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile quick actions for employees */}
            {isEmployee && (
              <div className="px-2 py-3 border-t border-gray-200">
                <div className="space-y-2">
                  <Link
                    href="/cash-requisitions/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors"
                    aria-label="New Cash Requisition"
                  >
                    <CurrencyDollarIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">New Requisition</span>
                  </Link>
                  <Link
                    href="/leaves/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                    aria-label="New Leave Request"
                  >
                    <CalendarIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Leave Request</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Mobile user section */}
            <div className="px-2 py-3 border-t border-gray-200">
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Help"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Help</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full text-left"
                  aria-label="Logout"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

