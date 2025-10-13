import { expect } from "chai";
import { ethers } from "hardhat";
import { AccessControl } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AccessControl", function () {
  let accessControl: AccessControl;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let resourceId: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AccessControl = await ethers.getContractFactory("AccessControl");
    accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();

    // Initialize a resource
    resourceId = ethers.id("test-resource");
    await accessControl.initializeResource(resourceId);
  });

  describe("Resource Initialization", function () {
    it("Should initialize resource with owner", async function () {
      const resourceOwner = await accessControl.owners(resourceId);
      expect(resourceOwner).to.equal(owner.address);
    });

    it("Should set owner permission", async function () {
      const permission = await accessControl.getPermission(resourceId, owner.address);
      expect(permission).to.equal(4); // OWNER
    });

    it("Should fail if resource already initialized", async function () {
      await expect(
        accessControl.initializeResource(resourceId)
      ).to.be.revertedWith("Resource already initialized");
    });
  });

  describe("Permission Management", function () {
    it("Should grant READ permission", async function () {
      await accessControl.grantPermission(resourceId, user1.address, 1); // READ

      const permission = await accessControl.getPermission(resourceId, user1.address);
      expect(permission).to.equal(1);
    });

    it("Should grant WRITE permission", async function () {
      await accessControl.grantPermission(resourceId, user1.address, 2); // WRITE

      const canWrite = await accessControl.canWrite(resourceId, user1.address);
      expect(canWrite).to.be.true;
    });

    it("Should grant ADMIN permission (owner only)", async function () {
      await accessControl.grantPermission(resourceId, user1.address, 3); // ADMIN

      const isAdmin = await accessControl.isAdmin(resourceId, user1.address);
      expect(isAdmin).to.be.true;
    });

    it("Should fail to grant ADMIN if not owner", async function () {
      // Give user1 admin permission first
      await accessControl.grantPermission(resourceId, user1.address, 3);

      // user1 tries to grant admin to user2 (should fail)
      await expect(
        accessControl.connect(user1).grantPermission(resourceId, user2.address, 3)
      ).to.be.revertedWith("Only owner can grant ADMIN");
    });

    it("Should fail to grant OWNER permission", async function () {
      await expect(
        accessControl.grantPermission(resourceId, user1.address, 4) // OWNER
      ).to.be.revertedWith("Cannot grant OWNER permission");
    });

    it("Should emit PermissionGranted event", async function () {
      await expect(
        accessControl.grantPermission(resourceId, user1.address, 1)
      ).to.emit(accessControl, "PermissionGranted")
        .withArgs(resourceId, user1.address, 1);
    });
  });

  describe("Permission Revocation", function () {
    beforeEach(async function () {
      await accessControl.grantPermission(resourceId, user1.address, 2); // WRITE
    });

    it("Should revoke permission", async function () {
      await accessControl.revokePermission(resourceId, user1.address);

      const permission = await accessControl.getPermission(resourceId, user1.address);
      expect(permission).to.equal(0); // NONE
    });

    it("Should not allow revoking owner permission", async function () {
      await expect(
        accessControl.revokePermission(resourceId, owner.address)
      ).to.be.revertedWith("Cannot revoke owner permission");
    });

    it("Should emit PermissionRevoked event", async function () {
      await expect(
        accessControl.revokePermission(resourceId, user1.address)
      ).to.emit(accessControl, "PermissionRevoked")
        .withArgs(resourceId, user1.address);
    });
  });

  describe("Ownership Transfer", function () {
    it("Should transfer ownership", async function () {
      await accessControl.transferOwnership(resourceId, user1.address);

      const newOwner = await accessControl.owners(resourceId);
      expect(newOwner).to.equal(user1.address);
    });

    it("Should update permissions after transfer", async function () {
      await accessControl.transferOwnership(resourceId, user1.address);

      const newOwnerPerm = await accessControl.getPermission(resourceId, user1.address);
      expect(newOwnerPerm).to.equal(4); // OWNER

      const oldOwnerPerm = await accessControl.getPermission(resourceId, owner.address);
      expect(oldOwnerPerm).to.equal(3); // ADMIN
    });

    it("Should fail if not owner", async function () {
      await expect(
        accessControl.connect(user1).transferOwnership(resourceId, user2.address)
      ).to.be.revertedWith("Not resource owner");
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(
        accessControl.transferOwnership(resourceId, user1.address)
      ).to.emit(accessControl, "OwnershipTransferred")
        .withArgs(resourceId, owner.address, user1.address);
    });
  });

  describe("Public Resources", function () {
    it("Should set resource to public", async function () {
      await accessControl.setPublic(resourceId, true);

      const isPublic = await accessControl.isPublic(resourceId);
      expect(isPublic).to.be.true;
    });

    it("Should allow anyone to read public resources", async function () {
      await accessControl.setPublic(resourceId, true);

      const canRead = await accessControl.canRead(resourceId, user1.address);
      expect(canRead).to.be.true;
    });

    it("Should emit PublicStatusChanged event", async function () {
      await expect(
        accessControl.setPublic(resourceId, true)
      ).to.emit(accessControl, "PublicStatusChanged")
        .withArgs(resourceId, true);
    });
  });

  describe("Permission Checks", function () {
    beforeEach(async function () {
      await accessControl.grantPermission(resourceId, user1.address, 2); // WRITE
    });

    it("Should check READ permission", async function () {
      const canRead = await accessControl.canRead(resourceId, user1.address);
      expect(canRead).to.be.true;
    });

    it("Should check WRITE permission", async function () {
      const canWrite = await accessControl.canWrite(resourceId, user1.address);
      expect(canWrite).to.be.true;
    });

    it("Should fail if no permission", async function () {
      const canRead = await accessControl.canRead(resourceId, user2.address);
      expect(canRead).to.be.false;
    });

    it("Owner should always have access", async function () {
      const canRead = await accessControl.canRead(resourceId, owner.address);
      const canWrite = await accessControl.canWrite(resourceId, owner.address);
      const isAdmin = await accessControl.isAdmin(resourceId, owner.address);

      expect(canRead).to.be.true;
      expect(canWrite).to.be.true;
      expect(isAdmin).to.be.true;
    });
  });

  describe("Batch Operations", function () {
    it("Should grant permissions to multiple users", async function () {
      const users = [user1.address, user2.address];

      await accessControl.batchGrantPermission(resourceId, users, 1); // READ

      const perm1 = await accessControl.getPermission(resourceId, user1.address);
      const perm2 = await accessControl.getPermission(resourceId, user2.address);

      expect(perm1).to.equal(1);
      expect(perm2).to.equal(1);
    });
  });

  describe("Collaborator Management", function () {
    it("Should track collaborators", async function () {
      await accessControl.grantPermission(resourceId, user1.address, 2);
      await accessControl.grantPermission(resourceId, user2.address, 1);

      const collaborators = await accessControl.getCollaborators(resourceId);
      expect(collaborators.length).to.equal(2);
      expect(collaborators).to.include(user1.address);
      expect(collaborators).to.include(user2.address);
    });

    it("Should get collaborator count", async function () {
      await accessControl.grantPermission(resourceId, user1.address, 2);
      await accessControl.grantPermission(resourceId, user2.address, 1);

      const count = await accessControl.getCollaboratorCount(resourceId);
      expect(count).to.equal(2n);
    });

    it("Should remove from collaborators on revoke", async function () {
      await accessControl.grantPermission(resourceId, user1.address, 2);
      await accessControl.revokePermission(resourceId, user1.address);

      const collaborators = await accessControl.getCollaborators(resourceId);
      expect(collaborators.length).to.equal(0);
    });
  });
});
