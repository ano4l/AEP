import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { requireUser } from "@/lib/require-admin"
import { validateFile, generateSecureFilename, scanForMaliciousContent } from "@/lib/file-security"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireUser()
    const userId = user.id

    // Verify task exists and user has access
    const task = await db.task.findUnique({
      where: { id },
    }) as any

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const canManageAll = user.role === "ADMIN" || user.role === "HR"
    if (!canManageAll && task.assigneeId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file security
    const fileValidation = validateFile(file as any)
    if (!fileValidation.valid) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 })
    }

    // Get file buffer for security scanning
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Scan for malicious content
    if (scanForMaliciousContent(buffer)) {
      return NextResponse.json({ error: "File contains malicious content" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "tasks")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate secure filename
    const fileName = generateSecureFilename(file.name)
    const filePath = join(uploadsDir, fileName)

    // Save file
    await writeFile(filePath, buffer)

    // Save attachment record
    const attachment = await db.taskAttachment.create({
      data: {
        taskId: id,
        fileName: file.name,
        filePath: `/uploads/tasks/${fileName}`,
        fileSize: file.size,
        uploadedBy: userId,
      },
    }) as any

    return NextResponse.json(attachment, { status: 201 })
  } catch (error: any) {
    console.error("Error uploading attachment:", error)
    
    // Handle specific error types
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      return NextResponse.json(
        { error: "Database unavailable. Please try again later." },
        { status: 503 }
      )
    }
    if (error?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    // Generic error without exposing internal details
    return NextResponse.json(
      { error: "Failed to upload file. Please try again." },
      { status: 500 }
    )
  }
}

