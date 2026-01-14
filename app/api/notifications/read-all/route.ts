import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdminUser } from "@/lib/require-admin"

export async function PATCH() {
  try {
    const user = await requireAdminUser()
    const userId = user.id

    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })

    return NextResponse.json({ message: "All notifications marked as read" })
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error)
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      )
    }
    if (error?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Internal server error", message: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}

