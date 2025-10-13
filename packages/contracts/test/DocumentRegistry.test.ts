import { expect } from "chai";
import { ethers } from "hardhat";
import { DocumentRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DocumentRegistry", function () {
  let registry: DocumentRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
    registry = await DocumentRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Document Registration", function () {
    it("Should register a new document", async function () {
      const irysId = ethers.encodeBytes32String("test-irys-id");
      const projectId = ethers.encodeBytes32String("project-1");
      const title = "Test Document";
      const tags = [ethers.id("blockchain"), ethers.id("web3")];

      const tx = await registry.registerDocument(irysId, projectId, title, tags);
      const receipt = await tx.wait();

      // Find DocumentRegistered event
      const event = receipt?.logs.find(
        (log: any) => {
          try {
            const parsed = registry.interface.parseLog(log);
            return parsed?.name === "DocumentRegistered";
          } catch {
            return false;
          }
        }
      );

      expect(event).to.not.be.undefined;
    });

    it("Should fail with empty title", async function () {
      const irysId = ethers.encodeBytes32String("test-irys-id");
      const projectId = ethers.encodeBytes32String("project-1");

      await expect(
        registry.registerDocument(irysId, projectId, "", [])
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should fail with invalid Irys ID", async function () {
      const irysId = ethers.ZeroHash;
      const projectId = ethers.encodeBytes32String("project-1");

      await expect(
        registry.registerDocument(irysId, projectId, "Test", [])
      ).to.be.revertedWith("Invalid Irys ID");
    });

    it("Should increment total documents counter", async function () {
      const irysId = ethers.encodeBytes32String("test-irys-id");
      const projectId = ethers.encodeBytes32String("project-1");

      await registry.registerDocument(irysId, projectId, "Test Doc", []);

      const total = await registry.totalDocuments();
      expect(total).to.equal(1n);
    });
  });

  describe("Document Queries", function () {
    let docId: string;

    beforeEach(async function () {
      const irysId = ethers.encodeBytes32String("test-irys-id");
      const projectId = ethers.encodeBytes32String("project-1");
      const title = "Test Document";
      const tags = [ethers.id("blockchain")];

      const tx = await registry.registerDocument(irysId, projectId, title, tags);
      const receipt = await tx.wait();

      // Extract docId from event
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = registry.interface.parseLog(event);
        docId = parsed?.args[0];
      }
    });

    it("Should retrieve document by ID", async function () {
      const doc = await registry.getDocument(docId);

      expect(doc.title).to.equal("Test Document");
      expect(doc.owner).to.equal(owner.address);
      expect(doc.status).to.equal(0); // draft
    });

    it("Should get documents by owner", async function () {
      const docs = await registry.getDocumentsByOwner(owner.address);
      expect(docs.length).to.equal(1);
      expect(docs[0]).to.equal(docId);
    });

    it("Should get documents by project", async function () {
      const projectId = ethers.encodeBytes32String("project-1");
      const docs = await registry.getDocumentsByProject(projectId);

      expect(docs.length).to.equal(1);
      expect(docs[0]).to.equal(docId);
    });

    it("Should get documents by tag", async function () {
      const tagHash = ethers.id("blockchain");
      const docs = await registry.getDocumentsByTag(tagHash);

      expect(docs.length).to.equal(1);
      expect(docs[0]).to.equal(docId);
    });

    it("Should check if document exists", async function () {
      const exists = await registry.isDocumentExists(docId);
      expect(exists).to.be.true;

      const notExists = await registry.isDocumentExists(ethers.ZeroHash);
      expect(notExists).to.be.false;
    });
  });

  describe("Document Updates", function () {
    let docId: string;

    beforeEach(async function () {
      const irysId = ethers.encodeBytes32String("test-irys-id");
      const projectId = ethers.encodeBytes32String("project-1");

      const tx = await registry.registerDocument(irysId, projectId, "Original Title", []);
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = registry.interface.parseLog(event);
        docId = parsed?.args[0];
      }
    });

    it("Should update document title", async function () {
      const newIrysId = ethers.encodeBytes32String("new-irys-id");
      const newTitle = "Updated Title";

      await registry.updateDocument(docId, newIrysId, newTitle);

      const doc = await registry.getDocument(docId);
      expect(doc.title).to.equal(newTitle);
    });

    it("Should fail if not owner", async function () {
      const newIrysId = ethers.encodeBytes32String("new-irys-id");

      await expect(
        registry.connect(user1).updateDocument(docId, newIrysId, "New Title")
      ).to.be.revertedWith("Not document owner");
    });

    it("Should emit DocumentUpdated event", async function () {
      const newIrysId = ethers.encodeBytes32String("new-irys-id");

      await expect(
        registry.updateDocument(docId, newIrysId, "New Title")
      ).to.emit(registry, "DocumentUpdated");
    });
  });

  describe("Document Status", function () {
    let docId: string;

    beforeEach(async function () {
      const irysId = ethers.encodeBytes32String("test-irys-id");
      const projectId = ethers.encodeBytes32String("project-1");

      const tx = await registry.registerDocument(irysId, projectId, "Test Doc", []);
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = registry.interface.parseLog(event);
        docId = parsed?.args[0];
      }
    });

    it("Should change document status", async function () {
      await registry.setDocumentStatus(docId, 1); // published

      const doc = await registry.getDocument(docId);
      expect(doc.status).to.equal(1);
    });

    it("Should update published counter", async function () {
      await registry.setDocumentStatus(docId, 1); // published

      const total = await registry.totalPublishedDocuments();
      expect(total).to.equal(1n);
    });

    it("Should fail with invalid status", async function () {
      await expect(
        registry.setDocumentStatus(docId, 5)
      ).to.be.revertedWith("Invalid status");
    });

    it("Should emit StatusChanged event", async function () {
      await expect(
        registry.setDocumentStatus(docId, 1)
      ).to.emit(registry, "DocumentStatusChanged")
        .withArgs(docId, 0, 1);
    });
  });

  describe("Document Visibility", function () {
    let docId: string;

    beforeEach(async function () {
      const irysId = ethers.encodeBytes32String("test-irys-id");
      const projectId = ethers.encodeBytes32String("project-1");

      const tx = await registry.registerDocument(irysId, projectId, "Test Doc", []);
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = registry.interface.parseLog(event);
        docId = parsed?.args[0];
      }
    });

    it("Should set document to public", async function () {
      await registry.setDocumentVisibility(docId, true);

      const doc = await registry.getDocument(docId);
      expect(doc.isPublic).to.be.true;
    });

    it("Should fail if not owner", async function () {
      await expect(
        registry.connect(user1).setDocumentVisibility(docId, true)
      ).to.be.revertedWith("Not document owner");
    });
  });

  describe("View Counter", function () {
    let docId: string;

    beforeEach(async function () {
      const irysId = ethers.encodeBytes32String("test-irys-id");
      const projectId = ethers.encodeBytes32String("project-1");

      const tx = await registry.registerDocument(irysId, projectId, "Test Doc", []);
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = registry.interface.parseLog(event);
        docId = parsed?.args[0];
      }
    });

    it("Should increment view count", async function () {
      await registry.incrementViewCount(docId);

      const doc = await registry.getDocument(docId);
      expect(doc.viewCount).to.equal(1n);
    });

    it("Should emit DocumentViewed event", async function () {
      await expect(
        registry.incrementViewCount(docId)
      ).to.emit(registry, "DocumentViewed")
        .withArgs(docId, owner.address);
    });
  });

  describe("Pagination", function () {
    beforeEach(async function () {
      // Create 5 documents
      for (let i = 0; i < 5; i++) {
        const irysId = ethers.encodeBytes32String(`irys-id-${i}`);
        const projectId = ethers.encodeBytes32String("project-1");
        await registry.registerDocument(irysId, projectId, `Doc ${i}`, []);
      }
    });

    it("Should paginate documents", async function () {
      const page1 = await registry.getDocumentsByOwnerPaginated(owner.address, 0, 2);
      expect(page1.length).to.equal(2);

      const page2 = await registry.getDocumentsByOwnerPaginated(owner.address, 2, 2);
      expect(page2.length).to.equal(2);

      const page3 = await registry.getDocumentsByOwnerPaginated(owner.address, 4, 2);
      expect(page3.length).to.equal(1);
    });

    it("Should return empty array if offset exceeds total", async function () {
      const result = await registry.getDocumentsByOwnerPaginated(owner.address, 10, 2);
      expect(result.length).to.equal(0);
    });
  });

  describe("Statistics", function () {
    it("Should return correct statistics", async function () {
      // Create documents with different statuses
      const irysId1 = ethers.encodeBytes32String("irys-id-1");
      const irysId2 = ethers.encodeBytes32String("irys-id-2");
      const projectId = ethers.encodeBytes32String("project-1");

      const tx1 = await registry.registerDocument(irysId1, projectId, "Doc 1", []);
      const receipt1 = await tx1.wait();
      const event1 = receipt1?.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });
      const docId1 = event1 ? registry.interface.parseLog(event1)?.args[0] : null;

      await registry.registerDocument(irysId2, projectId, "Doc 2", []);

      // Publish first document
      if (docId1) {
        await registry.setDocumentStatus(docId1, 1);
      }

      const stats = await registry.getStatistics();
      expect(stats.total).to.equal(2n);
      expect(stats.published).to.equal(1n);
    });
  });
});
