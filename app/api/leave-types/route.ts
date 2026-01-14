import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/require-admin"

export async function GET(request: Request) {
  try {
    await requireUser()

    // Return hardcoded leave types for now
    // In production, these should come from the database
    const leaveTypes = [
      { id: "annual", name: "Annual Leave" },
      { id: "sick", name: "Sick Leave" },
      { id: "maternity", name: "Maternity Leave" },
      { id: "paternity", name: "Paternity Leave" },
      { id: "unpaid", name: "Unpaid Leave" },
      { id: "compassionate", name: "Compassionate Leave" },
      { id: "study", name: "Study Leave" },
    ]

    return NextResponse.json(leaveTypes)
  } catch (error: any) {
    console.error("Error fetching leave types:", error)
    // Return default leave types on error
    return NextResponse.json([
      { id: "annual", name: "Annual Leave" },
      { id: "sick", name: "Sick Leave" },
    ])
  }
}
