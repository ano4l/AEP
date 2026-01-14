import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "acetech_session"
const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true'

function base64UrlDecodeToString(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4))
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/") + pad
  return Buffer.from(normalized, "base64").toString("utf8")
}

type SessionPayload = {
  userId: string
  role: "ADMIN" | "EMPLOYEE" | "ACCOUNTING" | "HR"
  exp: number
}

function parseSession(cookie: string | undefined): SessionPayload | null {
  if (!cookie) return null
  const [data] = cookie.split(".")
  if (!data) return null
  
  try {
    const parsed = JSON.parse(base64UrlDecodeToString(data)) as SessionPayload
    if (!parsed.role || !parsed.exp || Date.now() > parsed.exp) return null
    return parsed
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  // Skip ALL middleware in testing mode - allow everything
  if (TESTING_MODE) {
    console.log('🧪 Testing mode: bypassing all middleware checks');
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Allow auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Allow login page
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next()
  }

  // Define protected routes
  const isProtectedApi = pathname.startsWith("/api/")
  const isProtectedPage = 
    pathname === "/" || 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/employee") ||
    pathname.startsWith("/tasks") || 
    pathname.startsWith("/cash-requisitions") || 
    pathname.startsWith("/leaves") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/help")

  if (!isProtectedApi && !isProtectedPage) {
    return NextResponse.next()
  }

  // Check session
  const cookie = request.cookies.get(COOKIE_NAME)?.value
  const session = parseSession(cookie)
  
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    if (pathname !== "/login") {
      url.searchParams.set("next", pathname)
    }
    return NextResponse.redirect(url)
  }

  const { role } = session

  // Role-based route protection
  // Admin dashboard - only ADMIN and HR
  if (pathname.startsWith("/dashboard") && role !== "ADMIN" && role !== "HR") {
    const url = request.nextUrl.clone()
    url.pathname = "/employee"
    return NextResponse.redirect(url)
  }

  // Employee dashboard - only EMPLOYEE
  if (pathname.startsWith("/employee") && role !== "EMPLOYEE") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Root redirect based on role
  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = role === "EMPLOYEE" ? "/employee" : "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
