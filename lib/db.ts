import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for user operations (uses RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for system operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ============================================
// ENTERPRISE-LEVEL DATABASE OPERATIONS
// Using Supabase REST API
// ============================================

export const db = {
  // ==========================================
  // USER OPERATIONS
  // ==========================================
  user: {
    async findUnique(args: { where: { id?: string; email?: string }; select?: any }) {
      const { where, select } = args
      let query = supabase.from('User').select(select ? Object.keys(select).join(',') : '*')
      
      if (where.id) query = query.eq('id', where.id)
      if (where.email) query = query.eq('email', where.email)
      
      const { data, error } = await query.single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },

    async findMany(args?: { where?: any; select?: any; orderBy?: any; take?: number }) {
      let query = supabase.from('User').select(args?.select ? Object.keys(args.select).join(',') : '*')
      
      if (args?.where?.role) query = query.eq('role', args.where.role)
      if (args?.where?.status) query = query.eq('status', args.where.status)
      if (args?.where?.department) query = query.eq('department', args.where.department)
      if (args?.orderBy) {
        const key = Object.keys(args.orderBy)[0]
        query = query.order(key, { ascending: args.orderBy[key] === 'asc' })
      }
      if (args?.take) query = query.limit(args.take)
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async create(args: { data: any }) {
      const userData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      // Use admin client to bypass RLS for user registration
      const { data, error } = await supabaseAdmin.from('User').insert([userData]).select().single()
      if (error) throw error
      return data
    },

    async update(args: { where: { id: string }; data: any }) {
      const updateData = { ...args.data, updatedAt: new Date().toISOString() }
      // Use admin client to bypass RLS for user updates (e.g., profile changes)
      const { data, error } = await supabaseAdmin
        .from('User')
        .update(updateData)
        .eq('id', args.where.id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(args: { where: { id: string } }) {
      // Use admin client to bypass RLS for user deletion
      const { error } = await supabaseAdmin.from('User').delete().eq('id', args.where.id)
      if (error) throw error
      return { id: args.where.id }
    },

    async count(args?: { where?: any }) {
      // Use admin client to bypass RLS for user counting
      let query = supabaseAdmin.from('User').select('id', { count: 'exact', head: true })
      if (args?.where?.status) query = query.eq('status', args.where.status)
      if (args?.where?.role) query = query.eq('role', args.where.role)
      const { count, error } = await query
      if (error) throw error
      return count || 0
    }
  },

  // ==========================================
  // CASH REQUISITION OPERATIONS
  // ==========================================
  cashRequisition: {
    async findUnique(args: { where: { id: string }; include?: any }) {
      let selectFields = '*'
      if (args.include?.preparedBy) selectFields += ', preparedBy:User!preparedById(*)'
      if (args.include?.authorisedBy) selectFields += ', authorisedBy:User!authorisedById(*)'
      if (args.include?.attachments) selectFields += ', attachments:RequisitionAttachment(*)'
      
      // Use admin client to bypass RLS for cash requisition retrieval
      const { data, error } = await supabaseAdmin
        .from('CashRequisition')
        .select(selectFields)
        .eq('id', args.where.id)
        .single()
      if (error) throw error
      return data
    },

    async findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }) {
      let selectFields = '*'
      if (args?.include?.preparedBy) selectFields += ', preparedBy:User!preparedById(*)'
      if (args?.include?.authorisedBy) selectFields += ', authorisedBy:User!authorisedById(*)'
      
      // Use admin client to bypass RLS for cash requisition retrieval
      let query = supabaseAdmin.from('CashRequisition').select(selectFields)
      
      if (args?.where?.status) {
        if (args.where.status.in) {
          query = query.in('status', args.where.status.in)
        } else {
          query = query.eq('status', args.where.status)
        }
      }
      if (args?.where?.preparedById) query = query.eq('preparedById', args.where.preparedById)
      if (args?.orderBy) {
        const key = Object.keys(args.orderBy)[0]
        query = query.order(key, { ascending: args.orderBy[key] === 'asc' })
      }
      
      // Pagination support
      if (args?.skip !== undefined && args?.take !== undefined) {
        query = query.range(args.skip, args.skip + args.take - 1)
      } else if (args?.take) {
        query = query.limit(args.take)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async create(args: { data: any }) {
      const reqData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      // Use admin client to bypass RLS for cash requisition creation
      const { data, error } = await supabaseAdmin.from('CashRequisition').insert([reqData]).select().single()
      if (error) throw error
      return data
    },

    async update(args: { where: { id: string }; data: any }) {
      const updateData = { ...args.data, updatedAt: new Date().toISOString() }
      const { data, error } = await supabase
        .from('CashRequisition')
        .update(updateData)
        .eq('id', args.where.id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async count(args?: { where?: any }) {
      let query = supabase.from('CashRequisition').select('id', { count: 'exact', head: true })
      if (args?.where?.status) {
        if (args.where.status.in) {
          query = query.in('status', args.where.status.in)
        } else {
          query = query.eq('status', args.where.status)
        }
      }
      if (args?.where?.preparedById) query = query.eq('preparedById', args.where.preparedById)
      const { count, error } = await query
      if (error) throw error
      return count || 0
    }
  },

  // ==========================================
  // TASK OPERATIONS
  // ==========================================
  task: {
    async findUnique(args: { where: { id: string }; include?: any }) {
      let selectFields = '*'
      if (args.include?.assignee) selectFields += ', assignee:User!assigneeId(*)'
      if (args.include?.creator) selectFields += ', creator:User!createdById(*)'
      if (args.include?.comments) selectFields += ', comments:TaskComment(*)'
      if (args.include?.attachments) selectFields += ', attachments:TaskAttachment(*)'
      if (args.include?.timeEntries) selectFields += ', timeEntries:TimeEntry(*)'
      
      const { data, error } = await supabase
        .from('Task')
        .select(selectFields)
        .eq('id', args.where.id)
        .single()
      if (error) throw error
      return data
    },

    async findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }) {
      let selectFields = '*'
      if (args?.include?.assignee) selectFields += ', assignee:User!assigneeId(*)'
      if (args?.include?.creator) selectFields += ', creator:User!createdById(*)'
      
      let query = supabase.from('Task').select(selectFields)
      
      if (args?.where?.status) {
        if (args.where.status.in) {
          query = query.in('status', args.where.status.in)
        } else {
          query = query.eq('status', args.where.status)
        }
      }
      if (args?.where?.assigneeId) query = query.eq('assigneeId', args.where.assigneeId)
      if (args?.where?.createdById) query = query.eq('createdById', args.where.createdById)
      if (args?.orderBy) {
        const key = Object.keys(args.orderBy)[0]
        query = query.order(key, { ascending: args.orderBy[key] === 'asc' })
      }
      
      // Pagination support
      if (args?.skip !== undefined && args?.take !== undefined) {
        query = query.range(args.skip, args.skip + args.take - 1)
      } else if (args?.take) {
        query = query.limit(args.take)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async create(args: { data: any }) {
      const taskData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      // Use admin client to bypass RLS for task creation
      const { data, error } = await supabaseAdmin.from('Task').insert([taskData]).select().single()
      if (error) throw error
      return data
    },

    async update(args: { where: { id: string }; data: any }) {
      const updateData = { ...args.data, updatedAt: new Date().toISOString() }
      // Use admin client to bypass RLS for task updates
      const { data, error } = await supabaseAdmin
        .from('Task')
        .update(updateData)
        .eq('id', args.where.id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(args: { where: { id: string } }) {
      // Use admin client to bypass RLS for task deletion
      const { error } = await supabaseAdmin.from('Task').delete().eq('id', args.where.id)
      if (error) throw error
      return { id: args.where.id }
    },

    async count(args?: { where?: any }) {
      // Use admin client to bypass RLS for task counting
      let query = supabaseAdmin.from('Task').select('id', { count: 'exact', head: true })
      if (args?.where?.status) {
        if (args.where.status.in) {
          query = query.in('status', args.where.status.in)
        } else {
          query = query.eq('status', args.where.status)
        }
      }
      if (args?.where?.assigneeId) query = query.eq('assigneeId', args.where.assigneeId)
      const { count, error } = await query
      if (error) throw error
      return count || 0
    }
  },

  // ==========================================
  // TASK COMMENT OPERATIONS
  // ==========================================
  taskComment: {
    async findMany(args?: { where?: any; include?: any; orderBy?: any }) {
      let selectFields = '*'
      if (args?.include?.user) selectFields += ', user:User!userId(*)'
      
      let query = supabase.from('TaskComment').select(selectFields)
      
      if (args?.where?.taskId) query = query.eq('taskId', args.where.taskId)
      if (args?.orderBy) {
        const key = Object.keys(args.orderBy)[0]
        query = query.order(key, { ascending: args.orderBy[key] === 'asc' })
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async create(args: { data: any }) {
      const commentData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString()
      }
      const { data, error } = await supabase.from('TaskComment').insert([commentData]).select().single()
      if (error) throw error
      return data
    }
  },

  // ==========================================
  // TASK ATTACHMENT OPERATIONS
  // ==========================================
  taskAttachment: {
    async create(args: { data: any }) {
      const attachmentData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString()
      }
      const { data, error } = await supabase.from('TaskAttachment').insert([attachmentData]).select().single()
      if (error) throw error
      return data
    },

    async findMany(args?: { where?: any }) {
      let query = supabase.from('TaskAttachment').select('*')
      if (args?.where?.taskId) query = query.eq('taskId', args.where.taskId)
      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  },

  // ==========================================
  // TIME ENTRY OPERATIONS
  // ==========================================
  timeEntry: {
    async create(args: { data: any }) {
      const entryData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString()
      }
      const { data, error } = await supabase.from('TimeEntry').insert([entryData]).select().single()
      if (error) throw error
      return data
    },

    async findMany(args?: { where?: any; include?: any }) {
      let selectFields = '*'
      if (args?.include?.user) selectFields += ', user:User!userId(*)'
      
      let query = supabase.from('TimeEntry').select(selectFields)
      if (args?.where?.taskId) query = query.eq('taskId', args.where.taskId)
      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  },

  // ==========================================
  // TASK DEPENDENCY OPERATIONS
  // ==========================================
  taskDependency: {
    async create(args: { data: any }) {
      const depData = {
        id: crypto.randomUUID(),
        ...args.data
      }
      const { data, error } = await supabase.from('TaskDependency').insert([depData]).select().single()
      if (error) throw error
      return data
    },

    async findUnique(args: { where: { taskId_dependsOnTaskId?: { taskId: string; dependsOnTaskId: string }; id?: string } }) {
      let query = supabase.from('TaskDependency').select('*')
      
      if (args.where.taskId_dependsOnTaskId) {
        query = query
          .eq('taskId', args.where.taskId_dependsOnTaskId.taskId)
          .eq('dependsOnTaskId', args.where.taskId_dependsOnTaskId.dependsOnTaskId)
      } else if (args.where.id) {
        query = query.eq('id', args.where.id)
      }
      
      const { data, error } = await query.single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },

    async findMany(args?: { where?: any }) {
      let query = supabase.from('TaskDependency').select('*')
      if (args?.where?.taskId) query = query.eq('taskId', args.where.taskId)
      if (args?.where?.dependsOnId) query = query.eq('dependsOnId', args.where.dependsOnId)
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async delete(args: { where: { taskId_dependsOnTaskId?: { taskId: string; dependsOnTaskId: string }; id?: string } }) {
      let query = supabase.from('TaskDependency').delete()
      
      if (args.where.taskId_dependsOnTaskId) {
        query = query
          .eq('taskId', args.where.taskId_dependsOnTaskId.taskId)
          .eq('dependsOnTaskId', args.where.taskId_dependsOnTaskId.dependsOnTaskId)
      } else if (args.where.id) {
        query = query.eq('id', args.where.id)
      }
      
      const { error } = await query
      if (error) throw error
      return { id: args.where.id || 'deleted' }
    }
  },

  // ==========================================
  // LEAVE REQUEST OPERATIONS
  // ==========================================
  leaveRequest: {
    async findUnique(args: { where: { id: string }; include?: any }) {
      let selectFields = '*'
      if (args.include?.user) selectFields += ', user:User!requesterId(*)'
      if (args.include?.leaveType) selectFields += ', leaveType:LeaveType(*)'
      if (args.include?.approvedBy) selectFields += ', approvedBy:User!approvedById(*)'
      
      // Use admin client to bypass RLS for leave request retrieval
      const { data, error } = await supabaseAdmin
        .from('LeaveRequest')
        .select(selectFields)
        .eq('id', args.where.id)
        .single()
      if (error) throw error
      return data
    },

    async findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }) {
      let selectFields = '*'
      if (args?.include?.user) selectFields += ', user:User!requesterId(*)'
      if (args?.include?.leaveType) selectFields += ', leaveType:LeaveType(*)'
      
      // Use admin client to bypass RLS for leave request retrieval
      let query = supabaseAdmin.from('LeaveRequest').select(selectFields)
      
      if (args?.where?.status) query = query.eq('status', args.where.status)
      if (args?.where?.requesterId) query = query.eq('requesterId', args.where.requesterId)
      if (args?.where?.userId) query = query.eq('requesterId', args.where.userId)
      if (args?.where?.startDate?.gte) {
        const dateStr = args.where.startDate.gte instanceof Date 
          ? args.where.startDate.gte.toISOString() 
          : args.where.startDate.gte
        query = query.gte('startDate', dateStr)
      }
      if (args?.orderBy) {
        const key = Object.keys(args.orderBy)[0]
        query = query.order(key, { ascending: args.orderBy[key] === 'asc' })
      }
      
      // Pagination support
      if (args?.skip !== undefined && args?.take !== undefined) {
        query = query.range(args.skip, args.skip + args.take - 1)
      } else if (args?.take) {
        query = query.limit(args.take)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async create(args: { data: any }) {
      const leaveData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      // Use admin client to bypass RLS for leave request creation
      const { data, error } = await supabaseAdmin.from('LeaveRequest').insert([leaveData]).select().single()
      if (error) throw error
      return data
    },

    async update(args: { where: { id: string }; data: any }) {
      const updateData = { ...args.data, updatedAt: new Date().toISOString() }
      const { data, error } = await supabase
        .from('LeaveRequest')
        .update(updateData)
        .eq('id', args.where.id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async count(args?: { where?: any }) {
      let query = supabase.from('LeaveRequest').select('id', { count: 'exact', head: true })
      if (args?.where?.status) query = query.eq('status', args.where.status)
      if (args?.where?.requesterId) query = query.eq('requesterId', args.where.requesterId)
      if (args?.where?.userId) query = query.eq('requesterId', args.where.userId)
      const { count, error } = await query
      if (error) throw error
      return count || 0
    }
  },

  // ==========================================
  // LEAVE TYPE OPERATIONS
  // ==========================================
  leaveType: {
    async findMany(args?: { where?: any; orderBy?: any }) {
      let query = supabaseAdmin.from('LeaveType').select('*')
      
      if (args?.where?.isActive !== undefined) {
        query = query.eq('isActive', args.where.isActive)
      }
      
      if (args?.orderBy) {
        const key = Object.keys(args.orderBy)[0]
        query = query.order(key, { ascending: args.orderBy[key] === 'asc' })
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async findUnique(args: { where: { id: string } }) {
      const { data, error } = await supabaseAdmin
        .from('LeaveType')
        .select('*')
        .eq('id', args.where.id)
        .single()
      if (error) throw error
      return data
    },
    
    async create(args: { data: any }) {
      const leaveTypeData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const { data, error } = await supabaseAdmin.from('LeaveType').insert([leaveTypeData]).select().single()
      if (error) throw error
      return data
    },
    
    async update(args: { where: { id: string }; data: any }) {
      const updateData = { ...args.data, updatedAt: new Date().toISOString() }
      const { data, error } = await supabaseAdmin
        .from('LeaveType')
        .update(updateData)
        .eq('id', args.where.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  // ==========================================
  // NOTIFICATION OPERATIONS
  // ==========================================
  notification: {
    async findMany(args?: { where?: any; orderBy?: any; take?: number }) {
      let query = supabaseAdmin.from('Notification').select('*')
      
      if (args?.where?.userId) query = query.eq('userId', args.where.userId)
      if (args?.where?.read !== undefined) query = query.eq('read', args.where.read)
      if (args?.orderBy) {
        const key = Object.keys(args.orderBy)[0]
        query = query.order(key, { ascending: args.orderBy[key] === 'asc' })
      }
      if (args?.take) query = query.limit(args.take)
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async findUnique(args: { where: { id: string } }) {
      const { data, error } = await supabaseAdmin
        .from('Notification')
        .select('*')
        .eq('id', args.where.id)
        .single()
      if (error) throw error
      return data
    },

    async create(args: { data: any }) {
      const notifData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString()
      }
      const { data, error } = await supabaseAdmin.from('Notification').insert([notifData]).select().single()
      if (error) throw error
      return data
    },

    async createMany(args: { data: any[] }) {
      const notifications = args.data.map(n => ({
        id: crypto.randomUUID(),
        ...n,
        createdAt: new Date().toISOString()
      }))
      const { data, error } = await supabaseAdmin.from('Notification').insert(notifications).select()
      if (error) throw error
      return { count: data?.length || 0 }
    },

    async update(args: { where: { id: string }; data: any }) {
      const { data, error } = await supabaseAdmin
        .from('Notification')
        .update(args.data)
        .eq('id', args.where.id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async updateMany(args: { where?: any; data: any }) {
      let query = supabaseAdmin.from('Notification').update(args.data)
      if (args.where?.userId) query = query.eq('userId', args.where.userId)
      if (args.where?.read !== undefined) query = query.eq('read', args.where.read)
      const { data, error } = await query.select()
      if (error) throw error
      return { count: data?.length || 0 }
    },

    async count(args?: { where?: any }) {
      let query = supabaseAdmin.from('Notification').select('id', { count: 'exact', head: true })
      if (args?.where?.userId) query = query.eq('userId', args.where.userId)
      if (args?.where?.read !== undefined) query = query.eq('read', args.where.read)
      const { count, error } = await query
      if (error) throw error
      return count || 0
    }
  },

  // ==========================================
  // AUDIT LOG OPERATIONS
  // ==========================================
  auditLog: {
    async create(args: { data: any }) {
      const logData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString()
      }
      const { data, error } = await supabaseAdmin.from('AuditLog').insert([logData]).select().single()
      if (error) throw error
      return data
    },

    async findMany(args?: { where?: any; orderBy?: any; take?: number }) {
      let query = supabaseAdmin.from('AuditLog').select('*')
      if (args?.where?.entityType) query = query.eq('entityType', args.where.entityType)
      if (args?.where?.entityId) query = query.eq('entityId', args.where.entityId)
      if (args?.where?.actorId) query = query.eq('actorId', args.where.actorId)
      if (args?.orderBy) {
        const key = Object.keys(args.orderBy)[0]
        query = query.order(key, { ascending: args.orderBy[key] === 'asc' })
      }
      if (args?.take) query = query.limit(args.take)
      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  },

  // ==========================================
  // REQUISITION ATTACHMENT OPERATIONS
  // ==========================================
  requisitionAttachment: {
    async create(args: { data: any }) {
      const attachmentData = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date().toISOString()
      }
      const { data, error } = await supabase.from('RequisitionAttachment').insert([attachmentData]).select().single()
      if (error) throw error
      return data
    },

    async findMany(args?: { where?: any }) {
      let query = supabase.from('RequisitionAttachment').select('*')
      if (args?.where?.requisitionId) query = query.eq('requisitionId', args.where.requisitionId)
      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  },

  // ==========================================
  // LEGACY HELPER METHODS (for backward compatibility)
  // ==========================================
  async getUser(id: string) {
    // Use admin client to bypass RLS for session validation
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getUserByEmail(email: string) {
    // Use admin client to bypass RLS for authentication
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async createUser(userData: any) {
    return this.user.create({ data: userData })
  },

  async updateUser(id: string, updates: any) {
    // Use admin client to bypass RLS for user updates (e.g., approval/rejection)
    const updateData = { ...updates, updatedAt: new Date().toISOString() }
    const { data, error } = await supabaseAdmin
      .from('User')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getCashRequisitions(filters?: any) {
    return this.cashRequisition.findMany({ where: filters })
  },

  async getCashRequisition(id: string) {
    return this.cashRequisition.findUnique({ where: { id } })
  },

  async createCashRequisition(data: any) {
    return this.cashRequisition.create({ data })
  },

  async getTasks(filters?: any) {
    return this.task.findMany({ where: filters })
  },

  async getTask(id: string) {
    return this.task.findUnique({ where: { id } })
  },

  async getLeaveRequests(filters?: any) {
    return this.leaveRequest.findMany({ where: filters })
  },

  async createAuditLog(log: any) {
    return this.auditLog.create({ data: log })
  },

  async getNotifications(userId: string) {
    return this.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  },

  async createNotification(data: any) {
    return this.notification.create({ data })
  }
}

export default db
