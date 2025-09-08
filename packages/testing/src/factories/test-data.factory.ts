import { faker } from '@faker-js/faker'

export interface TestUser {
  id: string
  email: string
  name: string
  address: string
}

export interface TestProject {
  id: string
  name: string
  description: string
  ownerId: string
}

export interface TestDocument {
  id: string
  projectId: string
  title: string
  content: string
  authorId: string
}

export interface TestDataSet {
  user: TestUser
  project: TestProject
  document: TestDocument
  additionalUsers: TestUser[]
  additionalDocuments: TestDocument[]
}

export class TestDataFactory {
  static createTestUser(): TestUser {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      address: faker.finance.ethereumAddress()
    }
  }
  
  static createTestProject(ownerId?: string): TestProject {
    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Project',
      description: faker.lorem.paragraph(),
      ownerId: ownerId || faker.string.uuid()
    }
  }
  
  static createTestDocument(projectId?: string, authorId?: string): TestDocument {
    return {
      id: faker.string.uuid(),
      projectId: projectId || faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      authorId: authorId || faker.string.uuid()
    }
  }
  
  static async createTestProject(): Promise<TestDataSet> {
    const user = this.createTestUser()
    const project = this.createTestProject(user.id)
    const document = this.createTestDocument(project.id, user.id)
    
    const additionalUsers = Array.from({ length: 3 }, () => this.createTestUser())
    const additionalDocuments = Array.from({ length: 5 }, () => 
      this.createTestDocument(project.id, faker.helpers.arrayElement([user.id, ...additionalUsers.map(u => u.id)]))
    )
    
    return {
      user,
      project,
      document,
      additionalUsers,
      additionalDocuments
    }
  }
  
  static createBlockchainTestData() {
    return {
      smartContractData: {
        posts: Array.from({ length: 10 }, () => ({
          id: faker.string.uuid(),
          irysTransactionId: faker.string.hexadecimal({ length: 64 }).slice(2),
          authorAddress: faker.finance.ethereumAddress(),
          content: faker.lorem.paragraph(),
          version: faker.number.int({ min: 1, max: 5 }),
          timestamp: faker.date.recent()
        }))
      },
      irysData: {
        transactions: Array.from({ length: 15 }, () => ({
          id: faker.string.hexadecimal({ length: 64 }).slice(2),
          owner: faker.finance.ethereumAddress(),
          tags: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'table', value: 'posts' },
            { name: 'author-address', value: faker.finance.ethereumAddress() }
          ],
          data: faker.lorem.paragraph()
        }))
      }
    }
  }
  
  static createAITestData() {
    return {
      documents: Array.from({ length: 5 }, () => ({
        id: faker.string.uuid(),
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(5),
        expectedSummary: faker.lorem.paragraph(),
        expectedKeywords: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => faker.lorem.word()),
        expectedEmbedding: Array.from({ length: 1536 }, () => faker.number.float({ min: -1, max: 1 }))
      }))
    }
  }
}