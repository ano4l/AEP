import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSessionFromRequestCookie } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const jar = await cookies()
    const raw = jar.get("acetech_session")?.value
    const session = getSessionFromRequestCookie(raw)
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await db.getUser(session.userId) as any

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Auth me error:", error)
    return NextResponse.json({ user: null })
  }
}
