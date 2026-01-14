import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import CashRequisitionDetail from "@/components/cash-requisitions/CashRequisitionDetail"
import { requireUser } from "@/lib/require-admin"

const formatDateField = (date: Date | string) => {
  if (typeof date === 'string') return date
  return date.toISOString()
}

export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()

  try {
    const requisition = await db.cashRequisition.findUnique({
      where: { id },
      include: {
        preparedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        authorisedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        paidBy: {
          select: {
            id: true,
            name: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as any

    if (!requisition) {
      redirect("/cash-requisitions")
    }

    if (user.role === "EMPLOYEE" && requisition.preparedById !== user.id) {
      redirect("/cash-requisitions")
    }

    if (user.role === "ACCOUNTING") {
      const visibleStatuses = ["ADMIN_APPROVED", "ACCOUNTING_PAID", "CLOSED"]
      if (!visibleStatuses.includes(requisition.status)) {
        redirect("/cash-requisitions")
      }
    }

    return (
      <div className="px-4 py-6 sm:px-0">
        <CashRequisitionDetail 
          requisition={{
            ...requisition,
            adminNotes: requisition.adminNotes ?? undefined,
            authorisedBy: requisition.authorisedBy ?? undefined,
            paidBy: requisition.paidBy ?? undefined,
            rejectedBy: requisition.rejectedBy ?? undefined,
            createdAt: formatDateField(requisition.createdAt),
            updatedAt: formatDateField(requisition.updatedAt),
          }} 
          userRole={user.role} 
          userId={user.id}
        />
      </div>
    )
  } catch (error: any) {
    console.error("Error fetching requisition:", error)
    // If database is unavailable, redirect to list
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      redirect("/cash-requisitions")
    }
    throw error
  }
}

