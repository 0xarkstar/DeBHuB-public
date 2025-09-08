import { ethers } from 'hardhat'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

interface DeploymentInfo {
  network: string
  chainId: number
  contracts: {
    [key: string]: {
      address: string
      transactionHash: string
      blockNumber: number
      abi: any[]
    }
  }
  timestamp: string
}

async function main() {
  console.log(chalk.blue('🚀 Starting IrysBase contracts deployment...'))
  
  // 네트워크 정보 확인
  const network = await ethers.provider.getNetwork()
  console.log(chalk.yellow(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`))
  
  // 배포자 정보
  const [deployer] = await ethers.getSigners()
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log(chalk.yellow(`💰 Deployer: ${deployer.address}`))
  console.log(chalk.yellow(`💸 Balance: ${ethers.formatEther(balance)} ETH`))
  
  // 배포 정보 저장
  const deployment: DeploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contracts: {},
    timestamp: new Date().toISOString()
  }
  
  try {
    // 1. AuthRoles 컨트랙트 배포
    console.log(chalk.blue('\n📝 Deploying AuthRoles...'))
    const AuthRoles = await ethers.getContractFactory('AuthRoles')
    const authRoles = await AuthRoles.deploy()
    await authRoles.waitForDeployment()
    const authRolesAddress = await authRoles.getAddress()
    
    console.log(chalk.green(`✅ AuthRoles deployed at: ${authRolesAddress}`))
    
    deployment.contracts.AuthRoles = {
      address: authRolesAddress,
      transactionHash: authRoles.deploymentTransaction()?.hash || '',
      blockNumber: authRoles.deploymentTransaction()?.blockNumber || 0,
      abi: JSON.parse(AuthRoles.interface.formatJson())
    }
    
    // 2. IrysBaseCore 컨트랙트 배포 (프로그래머블 데이터 지원)
    console.log(chalk.blue('\n📝 Deploying IrysBaseCore...'))
    
    const IrysBaseCore = await ethers.getContractFactory('IrysBaseCore')
    const irysBaseCore = await IrysBaseCore.deploy(authRolesAddress)
    await irysBaseCore.waitForDeployment()
    const irysCoreAddress = await irysBaseCore.getAddress()
    
    console.log(chalk.green(`✅ IrysBaseCore deployed at: ${irysCoreAddress}`))
    
    deployment.contracts.IrysBaseCore = {
      address: irysCoreAddress,
      transactionHash: irysBaseCore.deploymentTransaction()?.hash || '',
      blockNumber: irysBaseCore.deploymentTransaction()?.blockNumber || 0,
      abi: JSON.parse(IrysBaseCore.interface.formatJson())
    }
    
    // 3. Posts 컨트랙트 배포
    console.log(chalk.blue('\n📝 Deploying Posts...'))
    
    const Posts = await ethers.getContractFactory('Posts')
    const posts = await Posts.deploy(authRolesAddress)
    await posts.waitForDeployment()
    const postsAddress = await posts.getAddress()
    
    console.log(chalk.green(`✅ Posts deployed at: ${postsAddress}`))
    
    deployment.contracts.Posts = {
      address: postsAddress,
      transactionHash: posts.deploymentTransaction()?.hash || '',
      blockNumber: posts.deploymentTransaction()?.blockNumber || 0,
      abi: JSON.parse(Posts.interface.formatJson())
    }
    
    // 4. 초기 설정
    console.log(chalk.blue('\n⚙️ Configuring contracts...'))
    
    // AuthRoles에 관리자 권한 부여
    await authRoles.grantRole(
      await authRoles.DEFAULT_ADMIN_ROLE(),
      deployer.address
    )
    console.log(chalk.green('✅ Admin role granted'))
    
    // IrysBaseCore 초기화 (if initialize function exists)
    try {
      await irysBaseCore.initialize()
      console.log(chalk.green('✅ IrysBaseCore initialized'))
    } catch (error) {
      console.log(chalk.yellow('ℹ️ IrysBaseCore initialize function not found or already initialized'))
    }
    
    // 5. 배포 정보 저장
    const deploymentPath = path.join(process.cwd(), 'deployed-contracts.json')
    fs.writeFileSync(
      deploymentPath,
      JSON.stringify(deployment, null, 2)
    )
    
    console.log(chalk.green(`\n✅ Deployment info saved to: ${deploymentPath}`))
    
    // 6. TypeScript 타입 생성
    console.log(chalk.blue('\n📝 Generating TypeScript types...'))
    
    const typesContent = `
// Auto-generated contract types
export const CONTRACT_ADDRESSES = {
  AuthRoles: '${deployment.contracts.AuthRoles.address}',
  IrysBaseCore: '${deployment.contracts.IrysBaseCore.address}',
  Posts: '${deployment.contracts.Posts.address}'
} as const

export const DEPLOYMENT_INFO = ${JSON.stringify(deployment, null, 2)} as const
`
    
    const typesDir = path.join(process.cwd(), 'packages/contracts/src')
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true })
    }
    
    const typesPath = path.join(typesDir, 'addresses.ts')
    fs.writeFileSync(typesPath, typesContent)
    
    console.log(chalk.green('✅ TypeScript types generated'))
    
    // 7. 프론트엔드 설정 업데이트
    const frontendConfig = {
      NEXT_PUBLIC_AUTH_ROLES_ADDRESS: deployment.contracts.AuthRoles.address,
      NEXT_PUBLIC_IRYS_BASE_CORE_ADDRESS: deployment.contracts.IrysBaseCore.address,
      NEXT_PUBLIC_POSTS_ADDRESS: deployment.contracts.Posts.address,
      NEXT_PUBLIC_CHAIN_ID: deployment.chainId.toString()
    }
    
    const frontendEnvPath = path.join(process.cwd(), 'apps/web/.env.local')
    let updatedEnv = ''
    
    if (fs.existsSync(frontendEnvPath)) {
      updatedEnv = fs.readFileSync(frontendEnvPath, 'utf-8')
    }
    
    Object.entries(frontendConfig).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (regex.test(updatedEnv)) {
        updatedEnv = updatedEnv.replace(regex, `${key}=${value}`)
      } else {
        updatedEnv += `\n${key}=${value}`
      }
    })
    
    fs.writeFileSync(frontendEnvPath, updatedEnv.trim())
    
    console.log(chalk.green('✅ Frontend configuration updated'))
    
    // 성공 메시지
    console.log(chalk.green.bold('\n🎉 Deployment successful!'))
    console.log(chalk.cyan('\n📋 Contract Addresses:'))
    console.log(chalk.white(`   AuthRoles: ${deployment.contracts.AuthRoles.address}`))
    console.log(chalk.white(`   IrysBaseCore: ${deployment.contracts.IrysBaseCore.address}`))
    console.log(chalk.white(`   Posts: ${deployment.contracts.Posts.address}`))
    
  } catch (error) {
    console.error(chalk.red('❌ Deployment failed:'), error)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })