// Type definitions for the application
export type UserRole = "ADMIN" | "EMPLOYEE" | "HR" | "ACCOUNTING"

export type RequisitionStatus = 
  | "DRAFT"
  | "SUBMITTED"
  | "ADMIN_APPROVED"
  | "ACCOUNTING_PAID"
  | "REJECTED"
  | "CLOSED"

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

export type NotificationType = 
  | "TASK_ASSIGNED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_PENDING"
  | "REQUISITION_PENDING"
  | "REQUISITION_APPROVED"
  | "REQUISITION_REJECTED"
  | "ACCOUNT_APPROVED"
  | "ACCOUNT_REJECTED"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}

