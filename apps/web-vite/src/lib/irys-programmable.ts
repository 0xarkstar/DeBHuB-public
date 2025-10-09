/**
 * Irys Programmable Data Client
 * Enables data with embedded logic, smart contract validation, and provenance tracking
 */

import { ethers } from 'ethers';

// Contract ABIs (minimal - for type safety)
const DOCUMENT_ACCESS_ABI = [
  'function registerDocument(bytes32 docId) public',
  'function canRead(bytes32 docId, address user) public view returns (bool)',
  'function canEdit(bytes32 docId, address user) public view returns (bool)',
  'function readDocumentData(bytes32 docId) public returns (bytes memory)',
  'function grantEditorAccess(bytes32 docId, address user) public',
  'function grantReaderAccess(bytes32 docId, address user) public',
  'function revokeEditorAccess(bytes32 docId, address user) public',
  'function revokeReaderAccess(bytes32 docId, address user) public',
  'function setPublic(bytes32 docId, bool isPublic) public',
  'function getOwner(bytes32 docId) public view returns (address)',
  'event DocumentRegistered(bytes32 indexed docId, address indexed owner)',
  'event AccessGranted(bytes32 indexed docId, address indexed user, string role)'
];

const PROJECT_GOVERNANCE_ABI = [
  'function createProject(bytes32 projectId, bool requiresApproval) public',
  'function canEdit(bytes32 projectId, address user) public view returns (bool)',
  'function addCollaborator(bytes32 projectId, address collaborator) public',
  'function removeCollaborator(bytes32 projectId, address collaborator) public',
  'function requestToJoin(bytes32 projectId) public',
  'function leaveProject(bytes32 projectId) public',
  'function updateProject(bytes32 projectId) public',
  'function getProject(bytes32 projectId) public view returns (address owner, uint256 collaboratorCount, bool requiresApproval)',
  'function isCollaborator(bytes32 projectId, address user) public view returns (bool)',
  'event ProjectCreated(bytes32 indexed projectId, address indexed owner)',
  'event CollaboratorAdded(bytes32 indexed projectId, address indexed collaborator)'
];

const PROVENANCE_TRACKER_ABI = [
  'function recordProvenance(bytes32 entityId, address author, bool aiGenerated, string memory aiModel) public',
  'function addVersion(bytes32 entityId, bytes32 versionId, string memory changeDescription) public',
  'function getProvenance(bytes32 entityId) public view returns (address originalAuthor, uint256 createdAt, uint256 versionCount, bool aiGenerated, string memory aiModel)',
  'function getVersionHistory(bytes32 entityId) public view returns (bytes32[] memory)',
  'function getModification(bytes32 entityId, uint256 versionNumber) public view returns (address modifier, uint256 timestamp, bytes32 previousVersionId, bytes32 newVersionId, string memory changeDescription)',
  'function isAIGenerated(bytes32 entityId) public view returns (bool)',
  'function getLatestVersion(bytes32 entityId) public view returns (bytes32)',
  'event ProvenanceRecorded(bytes32 indexed entityId, address indexed author, bool aiGenerated, string aiModel)',
  'event VersionAdded(bytes32 indexed entityId, bytes32 indexed versionId, uint256 versionNumber, address indexed modifier)'
];

export interface ProgrammableDataConfig {
  contractAddresses: {
    documentAccess: string;
    projectGovernance: string;
    provenanceTracker: string;
  };
  rpcUrl: string;
  chainId: number;
}

export interface ProgrammableLogic {
  accessControl?: boolean;
  provenance?: boolean;
  governance?: boolean;
  aiGenerated?: boolean;
  aiModel?: string;
}

export interface ProvenanceInfo {
  originalAuthor: string;
  createdAt: number;
  versionCount: number;
  aiGenerated: boolean;
  aiModel: string;
}

export interface AccessPermissions {
  owner: string;
  canRead: boolean;
  canEdit: boolean;
  isPublic: boolean;
}

/**
 * Programmable Irys Client
 * Bridges Irys permanent storage with IrysVM smart contracts
 */
export class ProgrammableIrysClient {
  private uploader: any;
  private signer: ethers.Signer;

  // Contract instances
  private documentAccessContract: ethers.Contract;
  private projectGovernanceContract: ethers.Contract;
  private provenanceTrackerContract: ethers.Contract;

  constructor(
    uploader: any,
    signer: ethers.Signer,
    config: ProgrammableDataConfig
  ) {
    this.uploader = uploader;
    this.signer = signer;

    // Initialize contract instances
    this.documentAccessContract = new ethers.Contract(
      config.contractAddresses.documentAccess,
      DOCUMENT_ACCESS_ABI,
      signer
    );

    this.projectGovernanceContract = new ethers.Contract(
      config.contractAddresses.projectGovernance,
      PROJECT_GOVERNANCE_ABI,
      signer
    );

    this.provenanceTrackerContract = new ethers.Contract(
      config.contractAddresses.provenanceTracker,
      PROVENANCE_TRACKER_ABI,
      signer
    );
  }

  /**
   * Upload data with programmable features
   */
  async uploadProgrammable<T>(
    data: T,
    logic: ProgrammableLogic,
    tags: Array<{ name: string; value: string }>
  ): Promise<{
    irysId: string;
    txHash?: string;
  }> {
    // 1. Upload to Irys permanent ledger (ledgerId 0)
    const receipt = await this.uploader.upload(JSON.stringify(data), { tags });
    const irysId = receipt.id;

    console.log(`📦 Data uploaded to Irys: ${irysId}`);

    // Convert Irys ID to bytes32 for smart contracts
    const entityIdBytes = this.stringToBytes32(irysId);

    // 2. Record provenance if enabled
    if (logic.provenance) {
      await this.recordProvenanceOnChain(
        entityIdBytes,
        logic.aiGenerated || false,
        logic.aiModel || ''
      );
    }

    // 3. Set up access control if enabled
    if (logic.accessControl) {
      await this.setupAccessControlOnChain(entityIdBytes);
    }

    // 4. Initialize governance if enabled
    if (logic.governance) {
      await this.initializeGovernanceOnChain(entityIdBytes);
    }

    return { irysId };
  }

  /**
   * Read programmable data with access validation
   */
  async readProgrammable(irysId: string, userAddress?: string): Promise<any> {
    const entityIdBytes = this.stringToBytes32(irysId);
    const address = userAddress || (await this.signer.getAddress());

    // Check read permission
    const canRead = await this.documentAccessContract.canRead(entityIdBytes, address);

    if (!canRead) {
      throw new Error('Access denied: No read permission for this document');
    }

    // For now, we read from Irys gateway directly
    // In production, would use ProgrammableData precompile via smart contract
    const response = await fetch(`https://gateway.irys.xyz/${irysId}`);
    const data = await response.json();

    console.log(`📖 Data read with access validation: ${irysId}`);

    return data;
  }

  /**
   * Grant editor access to a document
   */
  async grantEditorAccess(irysId: string, userAddress: string): Promise<ethers.ContractTransactionReceipt | null> {
    const docIdBytes = this.stringToBytes32(irysId);

    const tx = await this.documentAccessContract.grantEditorAccess(docIdBytes, userAddress);
    const receipt = await tx.wait();

    console.log(`✅ Editor access granted to ${userAddress} for document ${irysId}`);

    return receipt;
  }

  /**
   * Grant reader access to a document
   */
  async grantReaderAccess(irysId: string, userAddress: string): Promise<ethers.ContractTransactionReceipt | null> {
    const docIdBytes = this.stringToBytes32(irysId);

    const tx = await this.documentAccessContract.grantReaderAccess(docIdBytes, userAddress);
    const receipt = await tx.wait();

    console.log(`✅ Reader access granted to ${userAddress} for document ${irysId}`);

    return receipt;
  }

  /**
   * Revoke editor access from a document
   */
  async revokeEditorAccess(irysId: string, userAddress: string): Promise<ethers.ContractTransactionReceipt | null> {
    const docIdBytes = this.stringToBytes32(irysId);

    const tx = await this.documentAccessContract.revokeEditorAccess(docIdBytes, userAddress);
    const receipt = await tx.wait();

    console.log(`❌ Editor access revoked from ${userAddress} for document ${irysId}`);

    return receipt;
  }

  /**
   * Set document public/private visibility
   */
  async setDocumentPublic(irysId: string, isPublic: boolean): Promise<ethers.ContractTransactionReceipt | null> {
    const docIdBytes = this.stringToBytes32(irysId);

    const tx = await this.documentAccessContract.setPublic(docIdBytes, isPublic);
    const receipt = await tx.wait();

    console.log(`🔓 Document ${irysId} visibility set to ${isPublic ? 'public' : 'private'}`);

    return receipt;
  }

  /**
   * Check user permissions for a document
   */
  async checkPermissions(irysId: string, userAddress?: string): Promise<AccessPermissions> {
    const docIdBytes = this.stringToBytes32(irysId);
    const address = userAddress || (await this.signer.getAddress());

    const [canRead, canEdit, owner] = await Promise.all([
      this.documentAccessContract.canRead(docIdBytes, address),
      this.documentAccessContract.canEdit(docIdBytes, address),
      this.documentAccessContract.getOwner(docIdBytes)
    ]);

    return {
      owner,
      canRead,
      canEdit,
      isPublic: canRead && owner !== address // Simplified check
    };
  }

  /**
   * Add a new version with provenance tracking
   */
  async addVersion(
    entityId: string,
    newVersionId: string,
    changeDescription: string
  ): Promise<ethers.ContractTransactionReceipt | null> {
    const entityIdBytes = this.stringToBytes32(entityId);
    const versionIdBytes = this.stringToBytes32(newVersionId);

    const tx = await this.provenanceTrackerContract.addVersion(
      entityIdBytes,
      versionIdBytes,
      changeDescription
    );
    const receipt = await tx.wait();

    console.log(`📝 Version added: ${newVersionId} for entity ${entityId}`);

    return receipt;
  }

  /**
   * Get provenance information
   */
  async getProvenance(entityId: string): Promise<ProvenanceInfo> {
    const entityIdBytes = this.stringToBytes32(entityId);

    const [originalAuthor, createdAt, versionCount, aiGenerated, aiModel] =
      await this.provenanceTrackerContract.getProvenance(entityIdBytes);

    return {
      originalAuthor,
      createdAt: Number(createdAt),
      versionCount: Number(versionCount),
      aiGenerated,
      aiModel
    };
  }

  /**
   * Get complete version history
   */
  async getVersionHistory(entityId: string): Promise<string[]> {
    const entityIdBytes = this.stringToBytes32(entityId);

    const versionBytes = await this.provenanceTrackerContract.getVersionHistory(entityIdBytes);

    // Convert bytes32[] back to strings
    return versionBytes.map((v: string) => this.bytes32ToString(v));
  }

  /**
   * Add collaborator to a project
   */
  async addCollaborator(projectId: string, collaboratorAddress: string): Promise<ethers.ContractTransactionReceipt | null> {
    const projectIdBytes = this.stringToBytes32(projectId);

    const tx = await this.projectGovernanceContract.addCollaborator(
      projectIdBytes,
      collaboratorAddress
    );
    const receipt = await tx.wait();

    console.log(`👥 Collaborator ${collaboratorAddress} added to project ${projectId}`);

    return receipt;
  }

  /**
   * Remove collaborator from a project
   */
  async removeCollaborator(projectId: string, collaboratorAddress: string): Promise<ethers.ContractTransactionReceipt | null> {
    const projectIdBytes = this.stringToBytes32(projectId);

    const tx = await this.projectGovernanceContract.removeCollaborator(
      projectIdBytes,
      collaboratorAddress
    );
    const receipt = await tx.wait();

    console.log(`👥 Collaborator ${collaboratorAddress} removed from project ${projectId}`);

    return receipt;
  }

  /**
   * Check if user can edit a project
   */
  async canEditProject(projectId: string, userAddress?: string): Promise<boolean> {
    const projectIdBytes = this.stringToBytes32(projectId);
    const address = userAddress || (await this.signer.getAddress());

    return await this.projectGovernanceContract.canEdit(projectIdBytes, address);
  }

  // ====== Private Helper Methods ======

  /**
   * Record provenance on-chain
   */
  private async recordProvenanceOnChain(
    entityIdBytes: string,
    aiGenerated: boolean,
    aiModel: string
  ): Promise<void> {
    const author = await this.signer.getAddress();

    const tx = await this.provenanceTrackerContract.recordProvenance(
      entityIdBytes,
      author,
      aiGenerated,
      aiModel
    );

    await tx.wait();

    console.log(`🔍 Provenance recorded for entity ${this.bytes32ToString(entityIdBytes)}`);
  }

  /**
   * Setup access control on-chain
   */
  private async setupAccessControlOnChain(entityIdBytes: string): Promise<void> {
    const tx = await this.documentAccessContract.registerDocument(entityIdBytes);
    await tx.wait();

    console.log(`🔒 Access control set up for document ${this.bytes32ToString(entityIdBytes)}`);
  }

  /**
   * Initialize governance on-chain
   */
  private async initializeGovernanceOnChain(entityIdBytes: string): Promise<void> {
    // Projects require approval by default
    const requiresApproval = true;

    const tx = await this.projectGovernanceContract.createProject(
      entityIdBytes,
      requiresApproval
    );
    await tx.wait();

    console.log(`🏛️ Governance initialized for project ${this.bytes32ToString(entityIdBytes)}`);
  }

  /**
   * Convert string to bytes32 (for Solidity compatibility)
   */
  private stringToBytes32(str: string): string {
    // Take first 31 bytes of the string and pad to 32 bytes
    const truncated = str.substring(0, 31);
    return ethers.encodeBytes32String(truncated);
  }

  /**
   * Convert bytes32 back to string
   */
  private bytes32ToString(bytes32: string): string {
    return ethers.decodeBytes32String(bytes32);
  }
}

/**
 * Factory function to create ProgrammableIrysClient
 */
export async function createProgrammableClient(
  uploader: any,
  signer: ethers.Signer,
  config: ProgrammableDataConfig
): Promise<ProgrammableIrysClient> {
  return new ProgrammableIrysClient(uploader, signer, config);
}
