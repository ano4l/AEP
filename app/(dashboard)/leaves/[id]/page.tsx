import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import LeaveDetail from "@/components/leaves/LeaveDetail"
import { requireUser } from "@/lib/require-admin"

export default async function LeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()

  try {
    const leave = await db.leaveRequest.findUnique({
      where: { id },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as any

    if (!leave) {
      redirect("/leaves")
    }

    if (user.role !== "ADMIN" && user.role !== "HR" && leave.userId !== user.id) {
      redirect("/leaves")
    }

    // Handle dates that might already be strings (from mock data) or Date objects (from database)
    const formatDateField = (date: Date | string) => {
      if (typeof date === 'string') return date
      return date.toISOString()
    }

    return (
      <div className="px-4 py-6 sm:px-0">
        <LeaveDetail 
          leave={{
            ...leave,
            adminNotes: leave.adminNotes ?? undefined,
            admin: leave.admin ?? undefined,
            startDate: formatDateField(leave.startDate),
            endDate: formatDateField(leave.endDate),
            createdAt: formatDateField(leave.createdAt),
            updatedAt: formatDateField(leave.updatedAt),
            leaveType: leave.leaveType,
            user: leave.user,
          }} 
          userRole={user.role} 
        />
      </div>
    )
  } catch (error: any) {
    console.error("Error fetching leave:", error)
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      redirect("/leaves")
    }
    throw error
  }
}

