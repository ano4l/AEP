# 🛣️ IMPLEMENTATION ROADMAP - PRE-DEPLOYMENT

**Timeline**: 1-2 weeks to production  
**Priority**: Critical fixes first, then enhancements  
**Team Capacity**: Estimated 40-60 hours of work

---

## 🎯 CRITICAL FIXES (MUST DO)

### **1. Fix Task Operations RLS Issue** ⭐⭐⭐
**Status**: NOT STARTED  
**Effort**: 30 minutes  
**Impact**: HIGH - Tasks won't work in production

#### Problem
Task create/update operations use regular `supabase` client instead of `supabaseAdmin`, causing RLS policy violations.

#### Solution
```typescript
// File: lib/db.ts
// Lines: 234-256

// BEFORE
async create(args: { data: any }) {
  const taskData = { ... }
  const { data, error } = await supabase.from('Task').insert([taskData])
  // ...
}

// AFTER
async create(args: { data: any }) {
  const taskData = { ... }
  const { data, error } = await supabaseAdmin.from('Task').insert([taskData])
  // ...
}

// Also fix update() and delete() methods
```

#### Testing
```bash
# Test task creation
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","priority":"HIGH"}'

# Verify task appears in database
```

#### Checklist
- [ ] Update task.create() to use supabaseAdmin
- [ ] Update task.update() to use supabaseAdmin
- [ ] Update task.delete() to use supabaseAdmin
- [ ] Test task CRUD operations
- [ ] Verify RLS policies still work for regular users

---

### **2. Implement Pagination** ⭐⭐⭐
**Status**: NOT STARTED  
**Effort**: 2 hours  
**Impact**: HIGH - Performance with large datasets

#### Problem
List endpoints return all records, causing performance issues with large datasets.

#### Solution

**Step 1: Update API Endpoints**

```typescript
// File: app/api/tasks/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")
  
  const tasks = await db.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  })
  
  const total = await db.task.count({ where })
  
  return NextResponse.json({
    data: tasks,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total
    }
  })
}
```

**Step 2: Update Database Methods**

```typescript
// File: lib/db.ts
async findMany(args?: { 
  where?: any
  orderBy?: any
  take?: number
  skip?: number  // ADD THIS
}) {
  let query = supabaseAdmin.from('Task').select(selectFields)
  
  if (args?.take) query = query.limit(args.take)
  if (args?.skip) query = query.range(args.skip, args.skip + args.take - 1)
  
  const { data, error } = await query
  return data || []
}
```

**Step 3: Update Frontend**

```typescript
// File: components/tasks/TaskList.tsx
const [page, setPage] = useState(0)
const limit = 20

const fetchTasks = async () => {
  const response = await fetch(
    `/api/tasks?limit=${limit}&offset=${page * limit}`
  )
  const { data, pagination } = await response.json()
  setTasks(data)
  setTotal(pagination.total)
}
```

#### Endpoints to Update
- [ ] `GET /api/tasks` - Add limit/offset
- [ ] `GET /api/leaves` - Add limit/offset
- [ ] `GET /api/cash-requisitions` - Add limit/offset
- [ ] `GET /api/notifications` - Add limit/offset

#### Testing
```bash
# Test pagination
curl "http://localhost:3000/api/tasks?limit=10&offset=0"
curl "http://localhost:3000/api/tasks?limit=10&offset=10"

# Verify hasMore flag
```

---

### **3. Add Request Logging Middleware** ⭐⭐⭐
**Status**: NOT STARTED  
**Effort**: 3 hours  
**Impact**: HIGH - Audit trail and compliance

#### Problem
No logging of API requests for audit trail or debugging.

#### Solution

**Step 1: Create Logging Utility**

```typescript
// File: lib/request-logger.ts
import { NextRequest } from 'next/server'

export interface RequestLog {
  timestamp: string
  method: string
  path: string
  userId?: string
  status: number
  duration: number
  userAgent?: string
  ip?: string
}

const logs: RequestLog[] = []

export function logRequest(log: RequestLog) {
  logs.push(log)
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, DataDog, etc.
    console.log(JSON.stringify(log))
  }
}

export function getLogs(filter?: { userId?: string; path?: string }) {
  return logs.filter(log => {
    if (filter?.userId && log.userId !== filter.userId) return false
    if (filter?.path && !log.path.includes(filter.path)) return false
    return true
  })
}
```

**Step 2: Update Middleware**

```typescript
// File: middleware.ts
import { logRequest } from '@/lib/request-logger'

export function middleware(request: NextRequest) {
  const startTime = Date.now()
  const path = request.nextUrl.pathname
  const method = request.method
  
  // Continue with existing middleware logic
  const response = NextResponse.next()
  
  // Log after response
  const duration = Date.now() - startTime
  logRequest({
    timestamp: new Date().toISOString(),
    method,
    path,
    status: response.status,
    duration,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || undefined,
  })
  
  return response
}
```

**Step 3: Add Logging Endpoint**

```typescript
// File: app/api/admin/logs/route.ts
import { requireAdminSession } from '@/lib/auth'
import { getLogs } from '@/lib/request-logger'

export async function GET(request: Request) {
  await requireAdminSession()
  
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const path = searchParams.get('path')
  
  const logs = getLogs({ userId: userId || undefined, path: path || undefined })
  
  return NextResponse.json(logs)
}
```

#### Testing
```bash
# Make some API calls
curl http://localhost:3000/api/tasks

# Check logs
curl http://localhost:3000/api/admin/logs
```

---

### **4. Add Health Check Endpoint** ⭐⭐⭐
**Status**: NOT STARTED  
**Effort**: 1 hour  
**Impact**: MEDIUM - Deployment verification

#### Solution

```typescript
// File: app/api/health/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Check database connectivity
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'disconnected',
          error: error.message
        },
        { status: 503 }
      )
    }
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0'
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error?.message || 'Unknown error'
      },
      { status: 503 }
    )
  }
}
```

#### Testing
```bash
# Check health
curl http://localhost:3000/api/health

# Expected response
{
  "status": "healthy",
  "database": "connected",
  "responseTime": "45ms",
  "timestamp": "2026-01-16T08:41:00Z",
  "version": "1.0.0"
}
```

---

## 📋 HIGH PRIORITY FEATURES (SHOULD DO)

### **5. Database-Driven Leave Types** ⭐⭐
**Status**: NOT STARTED  
**Effort**: 3 hours  
**Impact**: MEDIUM - Scalability

#### Problem
Leave types are hardcoded, cannot be managed without code changes.

#### Solution

**Step 1: Create Database Table**

```sql
CREATE TABLE LeaveType (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  maxDaysPerYear INT DEFAULT 20,
  requiresApproval BOOLEAN DEFAULT true,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

INSERT INTO LeaveType (name, description, maxDaysPerYear) VALUES
('Annual Leave', 'Yearly vacation days', 20),
('Sick Leave', 'Medical leave', 10),
('Casual Leave', 'Casual absence', 5),
('Maternity Leave', 'Maternity leave', 90),
('Paternity Leave', 'Paternity leave', 14),
('Unpaid Leave', 'Unpaid absence', 0);
```

**Step 2: Update Database Operations**

```typescript
// File: lib/db.ts
leaveType: {
  async findMany() {
    const { data, error } = await supabaseAdmin
      .from('LeaveType')
      .select('*')
      .eq('isActive', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },
  
  async create(args: { data: any }) {
    const { data, error } = await supabaseAdmin
      .from('LeaveType')
      .insert([args.data])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
```

**Step 3: Update API Endpoint**

```typescript
// File: app/api/leave-types/route.ts
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const leaveTypes = await db.leaveType.findMany()
    return NextResponse.json(leaveTypes)
  } catch (error: any) {
    console.error('Error fetching leave types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leave types' },
      { status: 500 }
    )
  }
}
```

---

### **6. Enhanced Error Handling** ⭐⭐
**Status**: PARTIALLY DONE  
**Effort**: 2 hours  
**Impact**: MEDIUM - Better debugging

#### Problem
Inconsistent error responses across endpoints.

#### Solution
Use the standardized error handler already created:

```typescript
// File: lib/error-handler.ts (already exists)
import { handleApiError } from '@/lib/error-handler'

// In API endpoints:
export async function GET(request: Request) {
  try {
    // ... logic
  } catch (error: any) {
    return handleApiError(error, 'TASK_FETCH', userId)
  }
}
```

#### Endpoints to Update
- [ ] All task endpoints
- [ ] All leave endpoints
- [ ] All requisition endpoints
- [ ] All notification endpoints

---

### **7. Rate Limiting Expansion** ⭐⭐
**Status**: PARTIALLY DONE  
**Effort**: 2 hours  
**Impact**: MEDIUM - Security

#### Problem
Rate limiting only on auth endpoints, needed on all endpoints.

#### Solution

```typescript
// File: lib/rate-limit.ts (update existing)
export function createRateLimiter(options: {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: Request) => string
}) {
  const store = new Map<string, { count: number; resetTime: number }>()
  
  return async (request: Request) => {
    const key = options.keyGenerator?.(request) || 
                request.headers.get('x-forwarded-for') || 'unknown'
    
    const now = Date.now()
    const record = store.get(key)
    
    if (!record || now > record.resetTime) {
      store.set(key, { count: 1, resetTime: now + options.windowMs })
      return { allowed: true }
    }
    
    if (record.count >= options.maxRequests) {
      return { allowed: false, retryAfter: record.resetTime - now }
    }
    
    record.count++
    return { allowed: true }
  }
}
```

#### Apply to Endpoints
```typescript
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100
})

export async function GET(request: Request) {
  const { allowed, retryAfter } = await apiLimiter(request)
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }
  
  // ... rest of logic
}
```

---

## 📚 DOCUMENTATION (SHOULD DO)

### **8. Deployment Guide** ⭐⭐
**Status**: NOT STARTED  
**Effort**: 2 hours

Create comprehensive deployment guide covering:
- Prerequisites and requirements
- Environment setup
- Database migration
- Secrets management
- Deployment process
- Verification steps
- Rollback procedure
- Monitoring setup

### **9. API Documentation** ⭐⭐
**Status**: NOT STARTED  
**Effort**: 3 hours

Generate OpenAPI/Swagger documentation:
- All endpoints documented
- Request/response examples
- Error codes explained
- Authentication details
- Rate limiting info

---

## 🎁 NICE-TO-HAVE FEATURES (COULD DO)

### **10. Two-Factor Authentication** ⭐
**Effort**: 4 hours  
**Impact**: Security enhancement for admin users

### **11. Email Notifications** ⭐
**Effort**: 3 hours  
**Impact**: Better user engagement

### **12. Dashboard Analytics** ⭐
**Effort**: 5 hours  
**Impact**: Better visibility into system usage

### **13. Advanced Audit Logging** ⭐
**Effort**: 4 hours  
**Impact**: Compliance and security

---

## 📊 IMPLEMENTATION SCHEDULE

### **Week 1: Critical Fixes**
```
Monday:
  - Fix task RLS issues (30 min)
  - Implement pagination (2 hours)
  - Add request logging (3 hours)

Tuesday:
  - Add health check (1 hour)
  - Testing and QA (4 hours)

Wednesday-Friday:
  - Database-driven leave types (3 hours)
  - Enhanced error handling (2 hours)
  - Rate limiting expansion (2 hours)
  - Testing and fixes (6 hours)
```

### **Week 2: Documentation & Deployment**
```
Monday-Tuesday:
  - Deployment guide (2 hours)
  - API documentation (3 hours)
  - Final testing (4 hours)

Wednesday:
  - Staging deployment
  - Smoke testing

Thursday-Friday:
  - Production deployment
  - Monitoring setup
  - Support
```

---

## ✅ VERIFICATION CHECKLIST

After each implementation:

- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation updated

---

## 🚨 ROLLBACK PLAN

If issues occur after deployment:

1. **Immediate**: Revert to previous version
2. **Notify**: Alert team and users
3. **Investigate**: Identify root cause
4. **Fix**: Implement fix in development
5. **Test**: Comprehensive testing
6. **Redeploy**: Deploy fixed version

---

## 📞 ESCALATION

**Critical Issues** (Immediate):
- Contact: Development Lead
- Response Time: < 30 minutes

**High Priority** (Within 4 hours):
- Contact: Team Lead
- Response Time: < 4 hours

**Medium Priority** (Within 24 hours):
- Contact: Project Manager
- Response Time: < 24 hours

---

**Status**: Ready to start implementation  
**Next Step**: Assign tasks to team members and begin Week 1 fixes
