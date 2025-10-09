/**
 * Programmable IrysDatabase
 * Extends IrysDatabase with Programmable Data features:
 * - On-chain access control
 * - Provenance tracking
 * - Project governance
 * - Smart contract validation
 */

import { IrysDatabase } from './irys-database';
import {
  ProgrammableIrysClient,
  ProgrammableDataConfig,
  ProgrammableLogic,
  createProgrammableClient
} from './irys-programmable';
import type { ProjectInput, DocumentInput, Document } from './irys-types';
import { ethers } from 'ethers';

export class ProgrammableIrysDatabase extends IrysDatabase {
  private programmableClient: ProgrammableIrysClient | null = null;

  /**
   * Initialize programmable features with smart contract addresses
   */
  async initProgrammable(
    signer: ethers.Signer,
    config: ProgrammableDataConfig
  ): Promise<void> {
    // Get uploader from parent class
    const uploader = (this as any).uploader;
    if (!uploader) {
      throw new Error('Wallet not connected. Call connectWallet() first.');
    }

    // Create programmable client
    this.programmableClient = await createProgrammableClient(
      uploader,
      signer,
      config
    );

    console.log('✅ Programmable features initialized');
  }

  /**
   * Create project with programmable features
   */
  async createProjectProgrammable(
    input: ProjectInput,
    options: {
      enableAccessControl?: boolean;
      enableProvenance?: boolean;
      enableGovernance?: boolean;
      requiresApproval?: boolean;
    } = {}
  ): Promise<Document> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized. Call initProgrammable() first.');
    }

    // Create project using parent class method
    const project = await this.createProject(input);

    // Add programmable features
    const logic: ProgrammableLogic = {
      accessControl: options.enableAccessControl !== false, // default true
      provenance: options.enableProvenance !== false, // default true
      governance: options.enableGovernance !== false, // default true
      aiGenerated: false
    };

    // Register with smart contracts
    try {
      await this.programmableClient.uploadProgrammable(
        project,
        logic,
        this.createProjectTags(project)
      );

      console.log(`🎯 Project created with programmable features: ${project.entityId}`);
    } catch (error) {
      console.error('Failed to register programmable features:', error);
      // Project is still created, just without programmable features
    }

    return project as any; // Type assertion for compatibility
  }

  /**
   * Create document with programmable features
   */
  async createDocumentProgrammable(
    input: DocumentInput,
    options: {
      enableAccessControl?: boolean;
      enableProvenance?: boolean;
      aiGenerated?: boolean;
      aiModel?: string;
    } = {}
  ): Promise<Document> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized. Call initProgrammable() first.');
    }

    // Create document using parent class method
    const document = await this.createDocument(input);

    // Add programmable features
    const logic: ProgrammableLogic = {
      accessControl: options.enableAccessControl !== false, // default true
      provenance: options.enableProvenance !== false, // default true
      governance: false, // Documents don't need governance
      aiGenerated: options.aiGenerated || false,
      aiModel: options.aiModel
    };

    // Register with smart contracts
    try {
      await this.programmableClient.uploadProgrammable(
        document,
        logic,
        this.createDocumentTags(document)
      );

      console.log(`📝 Document created with programmable features: ${document.entityId}`);
    } catch (error) {
      console.error('Failed to register programmable features:', error);
    }

    return document;
  }

  /**
   * Update document with provenance tracking
   */
  async updateDocumentProgrammable(
    entityId: string,
    content: string,
    changeDescription: string
  ): Promise<Document> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    // Update document using parent class
    const updatedDoc = await this.updateDocument(entityId, { content });

    // Track version in provenance
    try {
      await this.programmableClient.addVersion(
        entityId,
        updatedDoc.irysId,
        changeDescription
      );

      console.log(`📝 Document updated with provenance: ${entityId} → ${updatedDoc.irysId}`);
    } catch (error) {
      console.error('Failed to track version:', error);
    }

    return updatedDoc;
  }

  /**
   * Grant editor access to a document
   */
  async grantDocumentAccess(
    documentId: string,
    userAddress: string,
    role: 'editor' | 'reader' = 'reader'
  ): Promise<void> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    // Get the document to find its Irys ID
    const document = await this.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Grant access via smart contract
    if (role === 'editor') {
      await this.programmableClient.grantEditorAccess(document.irysId, userAddress);
    } else {
      await this.programmableClient.grantReaderAccess(document.irysId, userAddress);
    }

    console.log(`✅ ${role} access granted to ${userAddress} for document ${documentId}`);
  }

  /**
   * Revoke editor access from a document
   */
  async revokeDocumentAccess(
    documentId: string,
    userAddress: string,
    role: 'editor' | 'reader' = 'reader'
  ): Promise<void> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    const document = await this.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (role === 'editor') {
      await this.programmableClient.revokeEditorAccess(document.irysId, userAddress);
    } else {
      // TODO: Add revokeReaderAccess to programmable client
      console.warn('Revoking reader access not yet implemented');
    }

    console.log(`❌ ${role} access revoked from ${userAddress} for document ${documentId}`);
  }

  /**
   * Set document visibility
   */
  async setDocumentPublic(documentId: string, isPublic: boolean): Promise<void> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    const document = await this.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    await this.programmableClient.setDocumentPublic(document.irysId, isPublic);

    console.log(`🔓 Document ${documentId} visibility set to ${isPublic ? 'public' : 'private'}`);
  }

  /**
   * Check user permissions for a document
   */
  async checkDocumentPermissions(documentId: string, userAddress?: string) {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    const document = await this.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    return await this.programmableClient.checkPermissions(document.irysId, userAddress);
  }

  /**
   * Add collaborator to a project
   */
  async addProjectCollaborator(projectId: string, collaboratorAddress: string): Promise<void> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    await this.programmableClient.addCollaborator(project.irysId, collaboratorAddress);

    console.log(`👥 Collaborator ${collaboratorAddress} added to project ${projectId}`);
  }

  /**
   * Remove collaborator from a project
   */
  async removeProjectCollaborator(projectId: string, collaboratorAddress: string): Promise<void> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    await this.programmableClient.removeCollaborator(project.irysId, collaboratorAddress);

    console.log(`👥 Collaborator ${collaboratorAddress} removed from project ${projectId}`);
  }

  /**
   * Check if user can edit a project
   */
  async canEditProject(projectId: string, userAddress?: string): Promise<boolean> {
    if (!this.programmableClient) {
      return false;
    }

    const project = await this.getProjectById(projectId);
    if (!project) {
      return false;
    }

    return await this.programmableClient.canEditProject(project.irysId, userAddress);
  }

  /**
   * Get provenance information for any entity
   */
  async getProvenance(entityId: string) {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    // Try to get entity to find its Irys ID
    let irysId: string | null = null;

    // Try document first
    const document = await this.getDocument(entityId);
    if (document) {
      irysId = document.irysId;
    } else {
      // Try project
      const project = await this.getProjectById(entityId);
      if (project) {
        irysId = project.irysId;
      }
    }

    if (!irysId) {
      throw new Error('Entity not found');
    }

    return await this.programmableClient.getProvenance(irysId);
  }

  /**
   * Get version history for any entity
   */
  async getVersionHistory(entityId: string): Promise<string[]> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    // Find Irys ID
    const document = await this.getDocument(entityId);
    const irysId = document ? document.irysId : entityId;

    return await this.programmableClient.getVersionHistory(irysId);
  }

  /**
   * Read programmable data with access control validation
   */
  async readProgrammable(irysId: string, userAddress?: string): Promise<any> {
    if (!this.programmableClient) {
      throw new Error('Programmable features not initialized.');
    }

    return await this.programmableClient.readProgrammable(irysId, userAddress);
  }

  // ====== Helper Methods ======

  private createProjectTags(project: any): Array<{ name: string; value: string }> {
    return [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'project' },
      { name: 'Entity-ID', value: project.entityId },
      { name: 'Owner', value: project.owner }
    ];
  }

  private createDocumentTags(document: any): Array<{ name: string; value: string }> {
    return [
      { name: 'App-Name', value: 'IrysBase' },
      { name: 'Entity-Type', value: 'document' },
      { name: 'Entity-ID', value: document.entityId },
      { name: 'Project-ID', value: document.projectId },
      { name: 'Owner', value: document.owner }
    ];
  }
}

/**
 * Singleton instance
 */
let programmableDatabaseInstance: ProgrammableIrysDatabase | null = null;

/**
 * Get singleton instance
 */
export function getProgrammableDatabase(): ProgrammableIrysDatabase {
  if (!programmableDatabaseInstance) {
    programmableDatabaseInstance = new ProgrammableIrysDatabase();
  }
  return programmableDatabaseInstance;
}
