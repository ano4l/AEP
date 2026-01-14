import { NextResponse } from "next/server"
import { createSessionCookie, setSessionCookie } from "@/lib/auth"

export async function POST() {
  try {
    // Return mock admin user for testing
    const mockUser = {
      id: "clx4d6541674484bb0532dbc",
      email: "admin@acetech.com",
      name: "Admin User",
      role: "ADMIN" as const
    }
    
    const payload = {
      userId: mockUser.id,
      role: mockUser.role,
      exp: Date.now() + 1000 * 60 * 60 * 12,
    }

    const cookieValue = createSessionCookie(payload)
    const res = NextResponse.json(mockUser)
    setSessionCookie(res, cookieValue)
    return res
  } catch (error) {
    console.error("Test login error:", error)
    return NextResponse.json({ error: "Test login failed" }, { status: 500 })
  }
}
