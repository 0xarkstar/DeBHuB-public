import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying VectorRegistry to Irys Testnet...");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  // Deploy VectorRegistry
  console.log("\n📦 Deploying VectorRegistry...");
  const VectorRegistry = await ethers.getContractFactory("VectorRegistry");
  const vectorRegistry = await VectorRegistry.deploy();

  await vectorRegistry.waitForDeployment();
  const address = await vectorRegistry.getAddress();

  console.log(`✅ VectorRegistry deployed to: ${address}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const stats = await vectorRegistry.getStatistics();
  console.log(`📊 Initial stats - Total vectors: ${stats[0]}, Active: ${stats[1]}, Clusters: ${stats[2]}`);

  // Save deployment info
  const deploymentInfo = {
    network: "irys-testnet",
    chainId: 1270,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      VectorRegistry: address,
    },
  };

  console.log("\n📋 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log(`\n📝 Next steps:`);
  console.log(`1. Update packages/pure-irys-client/src/contracts/addresses.ts`);
  console.log(`2. Add: vectorRegistry: "${address}",`);
  console.log(`3. Rebuild pure-irys-client package`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
