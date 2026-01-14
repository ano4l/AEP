import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/require-admin"

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const userId = user.id
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const where: any = { userId }
    if (unreadOnly) {
      where.read = false
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const unreadCount = await db.notification.count({
      where: { userId, read: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error: any) {
    console.error("Error fetching notifications:", error)
    // Return empty data gracefully for any error
    // This prevents notification errors from breaking the UI
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

