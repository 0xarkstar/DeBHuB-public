import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanupTestData(): Promise<void> {
  try {
    console.log('🧹 Starting test data cleanup...')
    
    // Delete in correct order to respect foreign key constraints
    await prisma.comment?.deleteMany({
      where: {
        post: {
          authorId: {
            contains: 'test-'
          }
        }
      }
    })
    
    await prisma.post?.deleteMany({
      where: {
        authorId: {
          contains: 'test-'
        }
      }
    })
    
    await prisma.document?.deleteMany({
      where: {
        OR: [
          { authorId: { contains: 'test-' } },
          { title: { contains: 'Test Document' } },
          { title: { contains: 'Performance Test' } }
        ]
      }
    })
    
    await prisma.project?.deleteMany({
      where: {
        OR: [
          { ownerId: { contains: 'test-' } },
          { name: { contains: 'Test Project' } },
          { name: { contains: 'My Test Project' } }
        ]
      }
    })
    
    await prisma.user?.deleteMany({
      where: {
        OR: [
          { id: { contains: 'test-' } },
          { email: { contains: 'test@' } }
        ]
      }
    })
    
    await prisma.workflow?.deleteMany({
      where: {
        name: {
          contains: 'test'
        }
      }
    })
    
    console.log('✅ Test data cleanup completed')
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error)
  }
}

export async function setupTestDatabase(): Promise<void> {
  try {
    console.log('🔧 Setting up test database...')
    
    // Ensure database connection
    await prisma.$connect()
    
    // Run any necessary test-specific setup
    console.log('✅ Test database setup completed')
  } catch (error) {
    console.error('❌ Test database setup failed:', error)
    throw error
  }
}

export async function teardownTestDatabase(): Promise<void> {
  try {
    await cleanupTestData()
    await prisma.$disconnect()
    console.log('✅ Test database teardown completed')
  } catch (error) {
    console.error('❌ Test database teardown failed:', error)
  }
}

export function createTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/irysbase_test'
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6380'
  
  console.log('🧪 Test environment configured')
}

export async function waitForServices(): Promise<void> {
  const maxRetries = 30
  const delay = 1000
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database is ready')
      return
    } catch (error) {
      console.log(`⏳ Waiting for database... (${i + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Database is not available after maximum retries')
}