import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { TESTING_MODE } from "./testing-mode"

const SESSION_COOKIE_NAME = "acetech_session"

export type SessionUser = {
  id: string
  email: string
  name: string
  role: "ADMIN" | "EMPLOYEE" | "ACCOUNTING" | "HR"
}

type SessionPayload = {
  userId: string
  role: SessionUser["role"]
  exp: number
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable")
  }
  return secret
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4))
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/") + pad
  return Buffer.from(normalized, "base64")
}

function sign(data: string, secret: string): string {
  return base64UrlEncode(crypto.createHmac("sha256", secret).update(data).digest())
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export function createSessionCookie(payload: SessionPayload): string {
  const secret = getAuthSecret()
  const data = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(data, secret)
  return `${data}.${signature}`
}

export function parseSessionCookie(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) return null
  const parts = cookieValue.split(".")
  if (parts.length !== 2) return null

  const [data, signature] = parts
  const secret = getAuthSecret()
  const expectedSignature = sign(data, secret)
  if (!timingSafeEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(base64UrlDecode(data).toString("utf8")) as SessionPayload
    if (!payload?.userId || !payload?.role || !payload?.exp) return null
    
    // Add buffer time to prevent race conditions (5 minutes)
    const currentTime = Date.now()
    const expiryTime = payload.exp
    const bufferTime = 5 * 60 * 1000 // 5 minutes
    
    if (currentTime > expiryTime) return null
    if (currentTime + bufferTime >= expiryTime) {
      // Session is about to expire, return null to force re-auth
      return null
    }
    
    return payload
  } catch {
    return null
  }
}

export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await requireSession()
  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN")
  }
  return session
}

export async function requireSession(): Promise<SessionPayload> {
  if (TESTING_MODE) {
    // Return mock session for testing
    return {
      userId: "clx4d6541674484bb0532dbc",
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    }
  }

  const jar = await cookies()
  const raw = jar.get(SESSION_COOKIE_NAME)?.value
  const session = parseSessionCookie(raw)
  if (!session) {
    throw new Error("UNAUTHENTICATED")
  }
  return session
}

export function setSessionCookie(response: NextResponse, cookieValue: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: 0,
  })
}

export function getSessionFromRequestCookie(rawCookie: string | undefined): SessionPayload | null {
  return parseSessionCookie(rawCookie)
}
