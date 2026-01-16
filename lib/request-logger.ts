// Request logging utility for audit trail and monitoring
import { NextRequest } from 'next/server'

export interface RequestLog {
  timestamp: string
  method: string
  path: string
  userId?: string
  userRole?: string
  status?: number
  duration?: number
  userAgent?: string
  ip?: string
  error?: string
}

// In-memory storage (in production, send to logging service)
const logs: RequestLog[] = []
const MAX_LOGS = 10000 // Keep last 10k logs in memory

export function logRequest(log: RequestLog) {
  // Add to in-memory storage
  logs.push(log)
  
  // Keep only last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs.shift()
  }
  
  // In production, send to logging service (Sentry, DataDog, CloudWatch, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Format for structured logging
    const logEntry = {
      level: log.error ? 'error' : 'info',
      timestamp: log.timestamp,
      message: `${log.method} ${log.path}`,
      context: {
        method: log.method,
        path: log.path,
        userId: log.userId,
        userRole: log.userRole,
        status: log.status,
        duration: log.duration,
        userAgent: log.userAgent,
        ip: log.ip,
        error: log.error,
      }
    }
    
    // Send to logging service
    console.log(JSON.stringify(logEntry))
    
    // TODO: Integrate with external logging service
    // Example: sendToDataDog(logEntry)
    // Example: sendToSentry(logEntry)
  } else {
    // Development logging
    const statusColor = log.status && log.status >= 400 ? '\x1b[31m' : '\x1b[32m'
    const reset = '\x1b[0m'
    console.log(
      `${statusColor}${log.method}${reset} ${log.path} - ${log.status || 'pending'} (${log.duration || 0}ms)`
    )
  }
}

export function getLogs(filter?: {
  userId?: string
  path?: string
  method?: string
  status?: number
  startDate?: Date
  endDate?: Date
  limit?: number
}): RequestLog[] {
  let filtered = [...logs]
  
  if (filter?.userId) {
    filtered = filtered.filter(log => log.userId === filter.userId)
  }
  
  if (filter?.path) {
    filtered = filtered.filter(log => log.path.includes(filter.path!))
  }
  
  if (filter?.method) {
    filtered = filtered.filter(log => log.method === filter.method)
  }
  
  if (filter?.status) {
    filtered = filtered.filter(log => log.status === filter.status)
  }
  
  if (filter?.startDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= filter.startDate!)
  }
  
  if (filter?.endDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) <= filter.endDate!)
  }
  
  // Sort by timestamp descending (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  // Apply limit
  if (filter?.limit) {
    filtered = filtered.slice(0, filter.limit)
  }
  
  return filtered
}

export function getLogStats() {
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  
  const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() > oneHourAgo)
  const dailyLogs = logs.filter(log => new Date(log.timestamp).getTime() > oneDayAgo)
  
  const errorLogs = recentLogs.filter(log => log.status && log.status >= 400)
  
  return {
    total: logs.length,
    lastHour: recentLogs.length,
    lastDay: dailyLogs.length,
    errors: errorLogs.length,
    avgDuration: recentLogs.length > 0
      ? recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / recentLogs.length
      : 0,
    topPaths: getTopPaths(recentLogs, 10),
    topUsers: getTopUsers(recentLogs, 10),
  }
}

function getTopPaths(logs: RequestLog[], limit: number) {
  const pathCounts = new Map<string, number>()
  
  logs.forEach(log => {
    const count = pathCounts.get(log.path) || 0
    pathCounts.set(log.path, count + 1)
  })
  
  return Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }))
}

function getTopUsers(logs: RequestLog[], limit: number) {
  const userCounts = new Map<string, number>()
  
  logs.forEach(log => {
    if (log.userId) {
      const count = userCounts.get(log.userId) || 0
      userCounts.set(log.userId, count + 1)
    }
  })
  
  return Array.from(userCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId, count]) => ({ userId, count }))
}

export function clearLogs() {
  logs.length = 0
}
