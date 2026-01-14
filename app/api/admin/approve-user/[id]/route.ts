import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdminSession } from "@/lib/auth"

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin session
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { action } = approvalSchema.parse(body)

    // Get the user to approve/reject
    const user = await db.getUser(userId) as any
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.status !== "PENDING") {
      return NextResponse.json(
        { error: "User is not in pending status" },
        { status: 400 }
      )
    }

    // Update user status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    const updatedUser = await db.updateUser(userId, {
      status: newStatus,
    })

    // Try to create audit log (non-blocking)
    try {
      await db.createAuditLog({
        actorId: session.userId,
        action: action === 'approve' ? "USER_APPROVED" : "USER_REJECTED",
        entityType: "User",
        entityId: userId,
        metadata: {
          userEmail: user.email,
          userName: user.name,
          previousStatus: "PENDING",
          newStatus,
        },
        userAgent: request.headers.get("user-agent") || undefined,
      })
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError)
      // Continue anyway - audit log is not critical
    }

    // Try to create notification (non-blocking)
    try {
      await db.createNotification({
        id: crypto.randomUUID(),
        userId: userId,
        type: action === 'approve' ? "ACCOUNT_APPROVED" : "ACCOUNT_REJECTED",
        title: action === 'approve' ? "Account Approved" : "Account Rejected",
        message: action === 'approve' 
          ? "Your account has been approved. You can now log in to the system."
          : "Your account registration has been rejected. Please contact an administrator for more information.",
        metadata: {
          action,
          approvedBy: session.userId,
        },
        read: false,
        createdAt: new Date().toISOString(),
      })
    } catch (notifError) {
      console.error("Failed to create notification:", notifError)
      // Continue anyway - notification is not critical
    }

    return NextResponse.json({
      message: `User ${action}d successfully`,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error approving/rejecting user:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid request data" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to process approval request" },
      { status: 500 }
    )
  }
}
