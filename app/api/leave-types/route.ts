import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/require-admin"

export async function GET(request: Request) {
  try {
    await requireUser()
    
    // Fetch leave types from database
    const leaveTypes = await db.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(leaveTypes)
  } catch (error: any) {
    console.error("Error fetching leave types:", error)
    
    if (error?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      // Fallback to hardcoded leave types if database is unavailable
      const fallbackLeaveTypes = [
        { id: "annual", name: "Annual Leave", description: "Yearly vacation days", maxDaysPerYear: 20 },
        { id: "sick", name: "Sick Leave", description: "Medical leave", maxDaysPerYear: 10 },
        { id: "casual", name: "Casual Leave", description: "Short-term casual absence", maxDaysPerYear: 5 },
        { id: "maternity", name: "Maternity Leave", description: "Maternity leave", maxDaysPerYear: 90 },
        { id: "paternity", name: "Paternity Leave", description: "Paternity leave", maxDaysPerYear: 14 },
        { id: "unpaid", name: "Unpaid Leave", description: "Leave without pay", maxDaysPerYear: 0 },
      ]
      return NextResponse.json(fallbackLeaveTypes)
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
