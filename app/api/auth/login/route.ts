import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { createSessionCookie, setSessionCookie } from "@/lib/auth"
import { TESTING_MODE } from "@/lib/testing-mode"
import { loginRateLimiter, getRateLimitIdentifier } from "@/lib/rate-limit"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    // Rate limiting check
    if (!TESTING_MODE) {
      const identifier = getRateLimitIdentifier(request);
      const { allowed, remaining, resetTime } = loginRateLimiter.check(identifier);
      
      if (!allowed) {
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          { 
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(resetTime).toISOString()
            }
          }
        );
      }
    }

    if (TESTING_MODE) {
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
        exp: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
      }

      const cookieValue = createSessionCookie(payload)
      const res = NextResponse.json(mockUser)
      setSessionCookie(res, cookieValue)
      return res
    }

    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const userAgent = request.headers.get("user-agent")

    const user = await db.getUserByEmail(email) as any

    if (!user) {
      await db.createAuditLog({
        action: "LOGIN_FAILURE",
        entityType: "User",
        entityId: null,
        metadata: { email },
        userAgent,
      })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      await db.createAuditLog({
        actorId: user.id,
        action: "LOGIN_FAILURE",
        entityType: "User",
        entityId: user.id,
        metadata: { email },
        userAgent,
      })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if user account is approved
    if (user.status === "PENDING") {
      await db.createAuditLog({
        actorId: user.id,
        action: "LOGIN_BLOCKED_PENDING",
        entityType: "User",
        entityId: user.id,
        metadata: { email, status: "PENDING" },
        userAgent,
      })
      return NextResponse.json({ 
        error: "Your account is pending admin approval. Please wait for an administrator to review your registration." 
      }, { status: 403 })
    }

    if (user.status === "REJECTED") {
      await db.createAuditLog({
        actorId: user.id,
        action: "LOGIN_BLOCKED_REJECTED",
        entityType: "User",
        entityId: user.id,
        metadata: { email, status: "REJECTED" },
        userAgent,
      })
      return NextResponse.json({ 
        error: "Your account registration has been rejected. Please contact an administrator for more information." 
      }, { status: 403 })
    }

    await db.createAuditLog({
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      metadata: { email },
      userAgent,
    })

    const payload = {
      userId: user.id,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
    }

    const cookieValue = createSessionCookie(payload)
    const res = NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role })
    setSessionCookie(res, cookieValue)
    return res
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 })
    }
    console.error("Login error:", error)
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
