/**
 * Integration test for Pure Irys Vector DB
 * Tests VectorClient with mock embeddings
 */

import { ethers } from "ethers";
import { PureIrysClient } from "./dist/PureIrysClient.js";

async function testVectorDB() {
  console.log("🧪 Starting Vector DB Integration Test\n");

  try {
    // 1. Setup client with mock embeddings (no OpenAI key)
    console.log("1️⃣ Setting up PureIrysClient with mock embeddings...");
    const provider = new ethers.JsonRpcProvider(
      "https://testnet-rpc.irys.xyz/v1/execution-rpc"
    );

    // Use a test wallet (don't use in production!)
    const privateKey = process.env.TEST_PRIVATE_KEY ||
      "0x" + "1".repeat(64); // Dummy key for testing
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`   Wallet address: ${signer.address}`);

    const client = new PureIrysClient(signer, {
      // No AI config - will use mock embeddings
      cache: {
        enabled: true,
        ttl: 5 * 60 * 1000
      }
    });

    console.log("   ✅ Client created\n");

    // 2. Initialize client
    console.log("2️⃣ Initializing client...");
    try {
      await client.init();
      console.log("   ✅ Client initialized\n");
    } catch (err) {
      console.warn("   ⚠️  Initialization warning:", err.message);
      console.log("   Continuing with limited functionality...\n");
    }

    // 3. Check Vector DB availability
    console.log("3️⃣ Checking Vector DB availability...");
    const isAvailable = client.isVectorDBAvailable();
    console.log(`   Vector DB available: ${isAvailable ? "✅ YES" : "❌ NO"}`);

    if (!isAvailable) {
      console.log("\n⚠️  Vector DB not available. This could be because:");
      console.log("   - VectorRegistry contract address not configured");
      console.log("   - Contract not accessible on network");
      console.log("   - Initialization failed");
      return;
    }
    console.log();

    // 4. Test creating document vectors (mock mode)
    console.log("4️⃣ Testing vector creation with mock embeddings...");
    const testDocs = [
      { id: "doc-1", content: "Blockchain technology enables decentralized applications" },
      { id: "doc-2", content: "Artificial intelligence transforms data analysis" },
      { id: "doc-3", content: "Smart contracts automate blockchain transactions" }
    ];

    for (const doc of testDocs) {
      try {
        console.log(`   Creating vector for ${doc.id}...`);
        await client.createDocumentVector(doc.id, doc.content, {
          test: true,
          category: "technology"
        });
        console.log(`   ✅ ${doc.id} vector created`);
      } catch (err) {
        console.error(`   ❌ Failed to create vector for ${doc.id}:`, err.message);
      }
    }
    console.log();

    // 5. Test semantic search
    console.log("5️⃣ Testing semantic search...");
    try {
      const searchQuery = "decentralized blockchain systems";
      console.log(`   Query: "${searchQuery}"`);

      const results = await client.semanticSearch(searchQuery, {
        limit: 5,
        threshold: 0.5
      });

      console.log(`   ✅ Found ${results.length} results:`);
      results.forEach((result, i) => {
        console.log(`      ${i + 1}. ${result.docId} (similarity: ${result.similarity.toFixed(3)})`);
      });
    } catch (err) {
      console.error(`   ❌ Search failed:`, err.message);
    }
    console.log();

    // 6. Test similar documents
    console.log("6️⃣ Testing similar document discovery...");
    try {
      const similar = await client.findSimilarDocuments("doc-1", { limit: 3 });
      console.log(`   ✅ Found ${similar.length} similar documents to doc-1:`);
      similar.forEach((result, i) => {
        console.log(`      ${i + 1}. ${result.docId} (similarity: ${result.similarity.toFixed(3)})`);
      });
    } catch (err) {
      console.error(`   ❌ Similar docs search failed:`, err.message);
    }
    console.log();

    // 7. Test Q&A
    console.log("7️⃣ Testing RAG Question-Answer...");
    try {
      const question = "What is blockchain used for?";
      console.log(`   Question: "${question}"`);

      const answer = await client.askQuestion(question, {
        maxContext: 2
      });

      console.log(`   ✅ Answer generated:`);
      console.log(`      "${answer.answer}"`);
      console.log(`      Confidence: ${(answer.confidence * 100).toFixed(1)}%`);
      console.log(`      Method: ${answer.method}`);
      console.log(`      Sources: ${answer.sources.length} documents`);
    } catch (err) {
      console.error(`   ❌ Q&A failed:`, err.message);
    }
    console.log();

    // 8. Test document suggestions
    console.log("8️⃣ Testing document suggestions...");
    try {
      const content = "Smart contracts are self-executing programs on blockchain";
      console.log(`   Content: "${content}"`);

      const suggestions = await client.getDocumentSuggestions(content, {
        limit: 3
      });

      console.log(`   ✅ Found ${suggestions.length} suggested documents:`);
      suggestions.forEach((suggestion, i) => {
        console.log(`      ${i + 1}. ${suggestion.docId} (relevance: ${suggestion.relevance.toFixed(3)})`);
      });
    } catch (err) {
      console.error(`   ❌ Suggestions failed:`, err.message);
    }
    console.log();

    // 9. Test cache stats
    console.log("9️⃣ Checking cache statistics...");
    try {
      const stats = await client.getCacheStats();
      console.log(`   ✅ Cache stats:`);
      console.log(`      Total entries: ${stats.totalEntries}`);
      console.log(`      Documents cached: ${stats.documentCount}`);
      console.log(`      Queries cached: ${stats.queryCount}`);
      console.log(`      Size estimate: ${(stats.sizeEstimate / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.error(`   ❌ Cache stats failed:`, err.message);
    }
    console.log();

    console.log("✅ Vector DB Integration Test Complete!\n");

  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Run test
testVectorDB().catch(console.error);
