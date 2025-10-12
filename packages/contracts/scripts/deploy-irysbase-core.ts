import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying DeBHuBCore to Irys Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy DeBHuBCore
  console.log("Deploying DeBHuBCore...");
  const DeBHuBCore = await ethers.getContractFactory("DeBHuBCore");
  
  const irysBaseCore = await DeBHuBCore.deploy();
  await irysBaseCore.waitForDeployment();
  
  const contractAddress = await irysBaseCore.getAddress();
  console.log("✅ DeBHuBCore deployed to:", contractAddress);

  // Verify deployment by calling a read function
  try {
    const totalDocuments = await irysBaseCore.getTotalDocuments();
    console.log("Initial document count:", totalDocuments.toString());
  } catch (error) {
    console.log("Warning: Could not verify deployment:", error);
  }

  // Save deployment information
  const deploymentInfo = {
    network: "irys-testnet",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    transactionHash: irysBaseCore.deploymentTransaction()?.hash
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentPath = path.join(deploymentsDir, "irys-testnet.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📄 Deployment info saved to:", deploymentPath);
  
  // Log important information
  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: Irys Testnet (Chain ID: 1270)`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Gas Used: ${irysBaseCore.deploymentTransaction()?.gasLimit || 'N/A'}`);
  console.log("=".repeat(50));
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("You can now interact with your contract using the address above.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });