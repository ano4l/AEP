import { NextResponse } from "next/server"

export function handleApiError(error: any, defaultMessage = "Internal server error") {
  console.error("API Error:", error)

  // Database connection errors
  if (error?.code === 'P1001' || error?.message?.includes("Can't reach database")) {
    return NextResponse.json(
      { error: "Database unavailable", message: "Cannot connect to database server" },
      { status: 503 }
    )
  }

  // Prisma validation errors
  if (error?.code === 'P2002') {
    return NextResponse.json(
      { error: "Duplicate entry", message: error?.meta?.target || "Record already exists" },
      { status: 409 }
    )
  }

  if (error?.code === 'P2025') {
    return NextResponse.json(
      { error: "Not found", message: "Record not found" },
      { status: 404 }
    )
  }

  // Return empty data for GET requests when DB is unavailable
  if (error?.code === 'P1001') {
    return null // Signal to return empty data
  }

  // Default error
  return NextResponse.json(
    { error: defaultMessage, message: error?.message || "Unknown error" },
    { status: 500 }
  )
}

export function handleDatabaseError(error: any, fallback: any) {
  if (error?.code === 'P1001' || error?.message?.includes("Can't reach database")) {
    return fallback
  }
  throw error
}

