import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { getMockUser } from "@/lib/mock-auth"
import { TESTING_MODE } from "@/lib/testing-mode"

type User = {
  id: string
  email: string
  name: string
  role: "ADMIN" | "EMPLOYEE" | "ACCOUNTING" | "HR"
  department: string
  password: string
  status: string
  createdAt: string
  updatedAt: string
}

export async function requireAdminUser(): Promise<User> {
  if (TESTING_MODE) {
    return getMockUser() as User
  }
  
  const user = await requireUserWithRoles(["ADMIN"])

  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN")
  }

  return user
}

export async function requireUser(): Promise<User> {
  if (TESTING_MODE) {
    return getMockUser("admin") as User
  }
  
  const session = await requireSession()

  const user = await db.getUser(session.userId)

  if (!user) {
    throw new Error("UNAUTHENTICATED")
  }
  return user as unknown as User
}

export async function requireUserWithRoles(roles: Array<"ADMIN" | "EMPLOYEE" | "ACCOUNTING" | "HR">): Promise<User> {
  if (TESTING_MODE) {
    // Choose the appropriate mock user based on required roles
    let context: "admin" | "employee" = "employee"
    
    if (roles.includes("ADMIN")) {
      context = "admin"
    } else if (roles.includes("EMPLOYEE")) {
      context = "employee"
    }
    
    const user = getMockUser(context)
    if (!roles.includes(user.role as any)) {
      throw new Error("FORBIDDEN")
    }
    return user as User
  }
  
  const user = await requireUser()
  if (!roles.includes(user.role as any)) {
    throw new Error("FORBIDDEN")
  }
  return user
}
