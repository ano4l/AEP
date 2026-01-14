import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdminSession } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/db"

export async function GET(request: Request) {
  try {
    // Require admin session
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch pending users from database
    const { data: pendingUsers, error } = await supabaseAdmin
      .from('User')
      .select('id, name, email, department, status, createdAt')
      .eq('status', 'PENDING')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    return NextResponse.json({
      users: pendingUsers || [],
      count: pendingUsers?.length || 0,
    })
  } catch (error) {
    console.error("Error fetching pending users:", error)
    return NextResponse.json(
      { error: "Failed to fetch pending users" },
      { status: 500 }
    )
  }
}
