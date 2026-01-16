import { NextResponse } from 'next/server'
// Use build-safe import during build time
const supabaseAdmin = process.env.NEXT_PHASE === 'phase-production-build' ? 
  require("@/lib/db-build-safe").supabaseAdmin : 
  require("@/lib/db").supabaseAdmin

export async function GET() {
  try {
    // Skip database check during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        status: 'healthy',
        database: 'skipped-during-build',
        responseTime: '0ms',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: 'build',
      })
    }

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
          error: error.message,
          timestamp: new Date().toISOString(),
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
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
