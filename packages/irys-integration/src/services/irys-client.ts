// Irys SDK 초기화
import Irys from '@irys/sdk'
import WebUploader from '@irys/web-upload'
import WebUploadEthereum from '@irys/web-upload-ethereum'
import { ethers } from 'ethers'
import { IRYS_TESTNET_CONFIG, getIrysConfig } from '../config/testnet.config'
import { 
  DocumentMetadata, 
  UploadOptions, 
  UploadResult, 
  IrysBalance, 
  FundingResult 
} from '../types'

export class IrysTestnetClient {
  private client: Irys | null = null
  private webUpload: typeof WebUploader | null = null
  private provider: ethers.Provider | null = null
  private wallet: ethers.Wallet | null = null
  private config = getIrysConfig(process.env.NODE_ENV as any)
  
  async initialize(privateKey: string): Promise<IrysTestnetClient> {
    try {
      // Provider 설정
      this.provider = new ethers.JsonRpcProvider(this.config.network.rpcUrl)
      
      // Wallet 생성
      this.wallet = new ethers.Wallet(privateKey, this.provider)
      
      // Irys Client 초기화 - Updated for latest SDK
      this.client = new Irys({
        network: 'testnet',
        token: 'ethereum',
        key: privateKey,
        config: {
          providerUrl: this.config.network.rpcUrl
        }
      })
      
      // Web Upload 초기화 (브라우저 환경)
      if (typeof window !== 'undefined') {
        this.webUpload = new WebUploadEthereum({
          url: this.config.storage.gateway,
          wallet: { rpcUrl: this.config.network.rpcUrl }
        })
      }
      
      // Client ready check
      if (this.client) {
        await this.client.ready()
        console.log(`Connected to Irys Testnet. Address: ${this.wallet.address}`)
      }
      
      return this
    } catch (error) {
      console.error('Failed to initialize Irys client:', error)
      throw new Error(`Irys client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // 펀딩 확인 및 자동 충전
  async ensureFunding(minBalance = 0.1): Promise<void> {
    if (!this.client) throw new Error('Client not initialized')
    
    try {
      const balance = await this.client.getLoadedBalance()
      const minRequired = this.client.utils.toAtomic(minBalance)
      
      if (balance.lt(minRequired)) {
        const fundAmount = ethers.parseEther(minBalance.toString()) - ethers.getBigInt(balance.toString())
        await this.client.fund(fundAmount.toString())
        console.log(`Funded ${ethers.formatEther(fundAmount)} to Irys`)
      }
    } catch (error) {
      console.error('Failed to ensure funding:', error)
      throw error
    }
  }
  
  // 잔액 조회
  async getBalance(): Promise<IrysBalance> {
    if (!this.client) throw new Error('Client not initialized')
    
    try {
      const balance = await this.client.getLoadedBalance()
      const balanceInEther = this.client.utils.fromAtomic(balance)
      
      return {
        balance: balanceInEther.toString(),
        unit: 'ETH',
        winc: balance.toString()
      }
    } catch (error) {
      console.error('Failed to get balance:', error)
      throw error
    }
  }
  
  // 데이터 업로드
  async upload(
    data: string | Buffer, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.client) throw new Error('Client not initialized')
    
    try {
      // 펀딩 확인
      await this.ensureFunding()
      
      // 데이터 준비
      const dataToUpload = typeof data === 'string' ? Buffer.from(data) : data
      
      // 기본 태그 설정
      const tags = [
        { name: 'App-Name', value: 'DeBHuB' },
        { name: 'Version', value: '2.0.0' },
        { name: 'Content-Type', value: 'application/json' },
        ...(options.tags || [])
      ]
      
      // 업로드 실행
      const result = await this.client.upload(dataToUpload, {
        tags,
        ...(options.target && { target: options.target }),
        ...(options.anchor && { anchor: options.anchor })
      })
      
      return {
        id: result.id,
        timestamp: result.timestamp,
        version: result.version,
        size: dataToUpload.length,
        receipt: result
      }
    } catch (error) {
      console.error('Failed to upload data:', error)
      throw error
    }
  }
  
  // 문서 업로드 (메타데이터 포함)
  async uploadDocument(
    content: string,
    metadata: DocumentMetadata
  ): Promise<UploadResult> {
    const documentData = {
      content,
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString()
      }
    }
    
    const tags = [
      { name: 'Document-Id', value: metadata.id },
      { name: 'Title', value: metadata.title },
      { name: 'Version', value: metadata.version.toString() },
      { name: 'Public', value: metadata.isPublic.toString() },
      ...(metadata.author ? [{ name: 'Author', value: metadata.author }] : []),
      ...(metadata.tags || []).map(tag => ({ name: 'Tag', value: tag }))
    ]
    
    return this.upload(JSON.stringify(documentData), { tags })
  }
  
  // 배치 업로드
  async batchUpload(
    items: Array<{ data: string | Buffer; options?: UploadOptions }>
  ): Promise<UploadResult[]> {
    if (!this.client) throw new Error('Client not initialized')
    
    const { batchSize } = this.config.performance
    const results: UploadResult[] = []
    
    // 배치별로 처리
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      
      const batchPromises = batch.map(item => 
        this.upload(item.data, item.options)
      )
      
      try {
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      } catch (error) {
        console.error(`Batch upload failed for batch starting at index ${i}:`, error)
        throw error
      }
    }
    
    return results
  }
  
  // 데이터 조회
  async getData(transactionId: string): Promise<Buffer> {
    if (!this.client) throw new Error('Client not initialized')
    
    try {
      const response = await fetch(`${this.config.storage.gateway}/${transactionId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Failed to get data:', error)
      throw error
    }
  }
  
  // GraphQL 쿼리
  async queryTransactions(query: string, variables: any = {}): Promise<any> {
    try {
      const response = await fetch(`${this.config.storage.gateway}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables
        })
      })
      
      if (!response.ok) {
        throw new Error(`GraphQL query failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('GraphQL query failed:', error)
      throw error
    }
  }
  
  // 가격 계산
  async getPrice(bytes: number): Promise<string> {
    if (!this.client) throw new Error('Client not initialized')
    
    try {
      const price = await this.client.getPrice(bytes)
      return this.client.utils.fromAtomic(price).toString()
    } catch (error) {
      console.error('Failed to get price:', error)
      throw error
    }
  }
  
  // 클라이언트 상태 확인
  isReady(): boolean {
    return this.client !== null && this.wallet !== null
  }
  
  // 클라이언트 정리
  async cleanup(): Promise<void> {
    this.client = null
    this.webUpload = null
    this.provider = null
    this.wallet = null
  }
  
  // 네트워크 정보
  getNetworkInfo() {
    return {
      ...this.config.network,
      isConnected: this.isReady(),
      walletAddress: this.wallet?.address
    }
  }
}