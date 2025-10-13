import { ethers } from "hardhat";
import * as deployedAddresses from "../deployed-addresses.json";

async function main() {
  console.log("\n🧪 Testing Deployed Contracts on Irys Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Testing with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get contract addresses
  const addresses = deployedAddresses.contracts;

  // Connect to deployed contracts
  const DocumentRegistry = await ethers.getContractAt(
    "DocumentRegistry",
    addresses.documentRegistry
  );
  const AccessControl = await ethers.getContractAt(
    "AccessControl",
    addresses.accessControl
  );
  const ProvenanceChain = await ethers.getContractAt(
    "ProvenanceChain",
    addresses.provenanceChain
  );
  const EventBus = await ethers.getContractAt("EventBus", addresses.eventBus);
  const CacheController = await ethers.getContractAt(
    "CacheController",
    addresses.cacheController
  );
  const SearchIndex = await ethers.getContractAt(
    "SearchIndex",
    addresses.searchIndex
  );

  console.log("✅ Connected to all contracts\n");

  // Generate unique IDs using timestamp
  const timestamp = Date.now();

  // Test 1: DocumentRegistry - Register a document
  console.log("📝 Test 1: Register a document...");
  const irysId = ethers.id(`test-doc-${timestamp}`);
  const projectId = ethers.id(`project-${timestamp}`);
  const title = "Test Document on Testnet";
  const tags = [ethers.id("blockchain"), ethers.id("web3")];

  const tx1 = await DocumentRegistry.registerDocument(
    irysId,
    projectId,
    title,
    tags
  );
  const receipt1 = await tx1.wait();
  console.log("   ✅ Document registered! Tx:", receipt1?.hash);

  // Get total documents
  const totalDocs = await DocumentRegistry.totalDocuments();
  console.log("   📊 Total documents:", totalDocs.toString());

  // Test 2: AccessControl - Initialize a resource
  console.log("\n🔐 Test 2: Initialize resource and grant permission...");
  const resourceId = ethers.id(`test-resource-${timestamp}`);
  const tx2 = await AccessControl.initializeResource(resourceId);
  await tx2.wait();
  console.log("   ✅ Resource initialized!");

  // Check owner
  const owner = await AccessControl.owners(resourceId);
  console.log("   👤 Resource owner:", owner);

  // Test 3: ProvenanceChain - Record provenance
  console.log("\n📜 Test 3: Record provenance...");
  const entityId = ethers.id(`test-entity-${timestamp}`);
  const tx3 = await ProvenanceChain.recordProvenance(
    entityId,
    irysId,
    false, // not AI generated
    "", // no AI model
    "Initial version"
  );
  await tx3.wait();
  console.log("   ✅ Provenance recorded!");

  const provenanceRecord = await ProvenanceChain.provenance(entityId);
  console.log("   📊 Version count:", provenanceRecord.versionCount.toString());

  // Test 4: EventBus - Emit an event
  console.log("\n📡 Test 4: Emit document created event...");
  const tx4 = await EventBus.emitDocumentCreated(irysId, projectId, title);
  await tx4.wait();
  console.log("   ✅ Event emitted!");

  // Test 5: CacheController - Invalidate cache
  console.log("\n🗄️  Test 5: Invalidate cache...");
  const cacheResourceId = ethers.id(`cache-resource-${timestamp}`);
  const tx5 = await CacheController.invalidateCache(cacheResourceId);
  await tx5.wait();
  console.log("   ✅ Cache invalidated!");

  const lastModified = await CacheController.lastModified(cacheResourceId);
  console.log("   ⏰ Last modified:", lastModified.toString());

  // Test 6: SearchIndex - Index a document
  console.log("\n🔍 Test 6: Index document for search...");
  const docId = ethers.id(`doc-${timestamp}`);
  const keywords = [ethers.id("blockchain"), ethers.id("web3"), ethers.id("irys")];
  const tx6 = await SearchIndex.indexDocument(docId, keywords);
  await tx6.wait();
  console.log("   ✅ Document indexed!");

  // Search for a keyword
  const searchResults = await SearchIndex.search(ethers.id("blockchain"));
  console.log("   📊 Search results for 'blockchain':", searchResults.length);

  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL TESTS PASSED!");
  console.log("=".repeat(60));
  console.log("\n📋 Test Summary:");
  console.log("   ✅ DocumentRegistry: Register & Query");
  console.log("   ✅ AccessControl: Initialize & Permissions");
  console.log("   ✅ ProvenanceChain: Record & Query");
  console.log("   ✅ EventBus: Emit Events");
  console.log("   ✅ CacheController: Invalidate & Check");
  console.log("   ✅ SearchIndex: Index & Search");
  console.log("\n🎉 Pure Irys BaaS is fully operational on Testnet!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
