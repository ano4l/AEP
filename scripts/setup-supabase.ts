import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database schema...\n')

  try {
    // Create tables using raw SQL
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create enums
        CREATE TYPE user_role AS ENUM ('EMPLOYEE', 'ADMIN', 'ACCOUNTING', 'HR');
        CREATE TYPE requisition_status AS ENUM ('DRAFT', 'SUBMITTED', 'ADMIN_APPROVED', 'REJECTED', 'ACCOUNTING_PAID', 'CLOSED');
        CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');
        CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
        CREATE TYPE notification_type AS ENUM ('REQUISITION_PENDING', 'REQUISITION_APPROVED', 'REQUISITION_REJECTED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMMENT', 'TASK_DUE_SOON', 'LEAVE_PENDING', 'LEAVE_APPROVED', 'LEAVE_REJECTED');
        CREATE TYPE currency AS ENUM ('USD', 'ZWG');
        CREATE TYPE audit_action AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'REQUISITION_SUBMITTED', 'REQUISITION_ADMIN_APPROVED', 'REQUISITION_REJECTED', 'REQUISITION_MARKED_PAID', 'REQUISITION_CLOSED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_OVERRIDE', 'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'BUDGET_OVERRIDE');
        CREATE TYPE leave_category AS ENUM ('ANNUAL', 'SICK', 'UNPAID', 'OTHER');
        CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

        -- Create User table
        CREATE TABLE IF NOT EXISTS "User" (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role user_role DEFAULT 'EMPLOYEE',
          department TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );

        -- Create CashRequisition table
        CREATE TABLE IF NOT EXISTS "CashRequisition" (
          id TEXT PRIMARY KEY,
          "requestDate" TIMESTAMP DEFAULT NOW(),
          payee TEXT NOT NULL,
          customer TEXT,
          details TEXT NOT NULL,
          code TEXT,
          amount DECIMAL(10, 2) NOT NULL,
          currency currency DEFAULT 'USD',
          department TEXT NOT NULL,
          status requisition_status DEFAULT 'DRAFT',
          "preparedById" TEXT NOT NULL REFERENCES "User"(id),
          "authorisedById" TEXT REFERENCES "User"(id),
          "rejectedById" TEXT REFERENCES "User"(id),
          "paidById" TEXT REFERENCES "User"(id),
          "overrideById" TEXT REFERENCES "User"(id),
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );

        -- Create Task table
        CREATE TABLE IF NOT EXISTS "Task" (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status task_status DEFAULT 'TODO',
          priority task_priority DEFAULT 'MEDIUM',
          "dueDate" TIMESTAMP,
          "createdById" TEXT NOT NULL REFERENCES "User"(id),
          "assigneeId" TEXT REFERENCES "User"(id),
          "assignedById" TEXT REFERENCES "User"(id),
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );

        -- Create LeaveRequest table
        CREATE TABLE IF NOT EXISTS "LeaveRequest" (
          id TEXT PRIMARY KEY,
          "startDate" TIMESTAMP NOT NULL,
          "endDate" TIMESTAMP NOT NULL,
          category leave_category NOT NULL,
          status leave_status DEFAULT 'PENDING',
          reason TEXT,
          "requesterId" TEXT NOT NULL REFERENCES "User"(id),
          "approverId" TEXT REFERENCES "User"(id),
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );

        -- Create Notification table
        CREATE TABLE IF NOT EXISTS "Notification" (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL REFERENCES "User"(id),
          type notification_type NOT NULL,
          title TEXT NOT NULL,
          message TEXT,
          "isRead" BOOLEAN DEFAULT FALSE,
          "relatedId" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        );

        -- Create AuditLog table
        CREATE TABLE IF NOT EXISTS "AuditLog" (
          id TEXT PRIMARY KEY,
          "actorId" TEXT REFERENCES "User"(id),
          action audit_action NOT NULL,
          "entityType" TEXT NOT NULL,
          "entityId" TEXT,
          metadata JSONB,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);
        CREATE INDEX IF NOT EXISTS "CashRequisition_preparedById_idx" ON "CashRequisition"("preparedById");
        CREATE INDEX IF NOT EXISTS "CashRequisition_status_idx" ON "CashRequisition"(status);
        CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task"("assigneeId");
        CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"(status);
        CREATE INDEX IF NOT EXISTS "LeaveRequest_requesterId_idx" ON "LeaveRequest"("requesterId");
        CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
        CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
      `
    })

    if (schemaError) {
      console.error('⚠️  Schema setup note:', schemaError.message)
      console.log('This may be expected if tables already exist.\n')
    } else {
      console.log('✅ Database schema created successfully!\n')
    }

    console.log('✅ Supabase database setup complete!')
    console.log('\nNext steps:')
    console.log('1. Verify tables in Supabase dashboard')
    console.log('2. Run: npm run db:seed')
    console.log('3. Start the application: npm run dev')

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupDatabase()
