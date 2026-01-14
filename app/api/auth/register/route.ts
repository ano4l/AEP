import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { registerRateLimiter, getRateLimitIdentifier } from "@/lib/rate-limit"

// Validation schema with strong password requirements
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  department: z.string().min(1, 'Department is required').max(100),
})

export async function POST(request: Request) {
  try {
    // Rate limiting disabled for testing
    // const identifier = getRateLimitIdentifier(request);
    // const { allowed, remaining, resetTime } = registerRateLimiter.check(identifier);
    
    // if (!allowed) {
    //   const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    //   return NextResponse.json(
    //     { error: "Too many registration attempts. Please try again later." },
    //     { 
    //       status: 429,
    //       headers: {
    //         'Retry-After': retryAfter.toString(),
    //         'X-RateLimit-Remaining': '0',
    //         'X-RateLimit-Reset': new Date(resetTime).toISOString()
    //       }
    //     }
    //   );
    // }

    const body = await request.json()
    const { name, email, password, department } = registerSchema.parse(body)

    const userAgent = request.headers.get("user-agent")

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email) as any
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with PENDING status
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password: hashedPassword,
      role: "EMPLOYEE", // Default role for new registrations
      department,
      status: "PENDING", // Custom field for approval status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const user = await db.createUser(newUser)

    // Create audit log for registration
    await db.createAuditLog({
      actorId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      metadata: { 
        email, 
        department, 
        status: "PENDING",
        requiresApproval: true 
      },
      userAgent,
    })

    // Create notification for admins - use a simple approach for now
    // In a real implementation, you might have a dedicated getAdmins method
    // For now, we'll skip admin notifications and focus on the core registration
    console.log(`New user registered: ${name} (${email}) from ${department} - pending approval`)

    return NextResponse.json({
      message: "Registration successful. Your account is pending admin approval.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        status: "PENDING",
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    )
  }
}
