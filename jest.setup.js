import '@testing-library/jest-dom'
import '@testing-library/user-event'

// Mock the database module
const mockDb = {
  getUser: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  getCashRequisitions: jest.fn(),
  getCashRequisition: jest.fn(),
  createCashRequisition: jest.fn(),
  getTasks: jest.fn(),
  getTask: jest.fn(),
  getLeaveRequests: jest.fn(),
  createAuditLog: jest.fn(),
  getNotifications: jest.fn(),
  createNotification: jest.fn(),
}

jest.mock('@/lib/db', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  },
  db: mockDb,
}))

// Make the mock available in tests
global.mockDb = mockDb

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js auth
jest.mock('@/lib/auth', () => ({
  requireUser: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'EMPLOYEE',
  })),
  createSessionCookie: jest.fn(() => 'test-cookie'),
  setSessionCookie: jest.fn(),
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_TESTING_MODE = 'false'
