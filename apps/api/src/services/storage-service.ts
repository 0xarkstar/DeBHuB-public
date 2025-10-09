import { IrysService } from './irys';

/**
 * Storage Service for document assets and file management
 * Implements the document storage structure from the plan
 */
export class StorageService {
  constructor(private irysService: IrysService) {}

  async initialize(): Promise<void> {
    console.log('✅ Storage service initialized');
  }

  async healthCheck(): Promise<boolean> {
    return true; // Basic health check - extend as needed
  }

  /**
   * Document Storage Buckets Implementation
   */
  private buckets = {
    images: {
      public: true,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      cdn: true,
    },
    attachments: {
      public: false,
      maxSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: ['*'],
      encryption: true,
    },
    exports: {
      public: true,
      maxSize: 50 * 1024 * 1024, // 50MB
      ttl: 86400, // 24 hours
      cdn: true,
    },
    themes: {
      public: true,
      maxSize: 1024 * 1024, // 1MB
      allowedTypes: ['text/css', 'application/json'],
    },
    backups: {
      public: false,
      encryption: true,
      versioning: true,
    },
  };

  /**
   * Upload file to specific bucket
   */
  async uploadFile(
    bucket: keyof typeof this.buckets,
    file: UploadFile,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const bucketConfig = this.buckets[bucket];
    
    // Validate file
    this.validateFile(file, bucketConfig);

    // Process file if needed
    const processedFile = await this.processFile(file, bucketConfig, options);

    // Upload to Irys with appropriate tags
    const tags = this.generateTags(bucket, file, options);
    const irysResult = await this.irysService.uploadData(processedFile.data, tags);

    return {
      id: irysResult.id,
      url: this.generateUrl(bucket, irysResult.id, bucketConfig),
      permanentUrl: `https://gateway.irys.xyz/${irysResult.id}`,
      size: processedFile.size,
      type: file.type,
      bucket,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...options.metadata,
      },
    };
  }

  /**
   * Upload document image with optimization
   */
  async uploadDocumentImage(
    projectId: string,
    documentId: string,
    file: UploadFile,
    options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    const optimizedFile = await this.optimizeImage(file, options);
    
    return this.uploadFile('images', optimizedFile, {
      metadata: {
        projectId,
        documentId,
        optimized: true,
        sizes: options.sizes,
      },
    });
  }

  /**
   * Upload document attachment
   */
  async uploadAttachment(
    projectId: string,
    documentId: string,
    file: UploadFile,
    options: AttachmentUploadOptions = {}
  ): Promise<UploadResult> {
    let processedFile = file;
    
    // Encrypt if required
    if (this.buckets.attachments.encryption && options.encrypt !== false) {
      processedFile = await this.encryptFile(file, options.encryptionKey);
    }

    return this.uploadFile('attachments', processedFile, {
      metadata: {
        projectId,
        documentId,
        encrypted: !!options.encryptionKey,
        originalSize: file.size,
      },
    });
  }

  /**
   * Generate export (PDF, EPUB, etc.)
   */
  async uploadExport(
    projectId: string,
    format: 'pdf' | 'epub' | 'html' | 'docx',
    data: Buffer | string,
    metadata: ExportMetadata
  ): Promise<UploadResult> {
    const file: UploadFile = {
      name: `${metadata.title}.${format}`,
      data: typeof data === 'string' ? Buffer.from(data) : data,
      type: this.getMimeType(format),
      size: typeof data === 'string' ? Buffer.byteLength(data) : data.length,
    };

    return this.uploadFile('exports', file, {
      metadata: {
        projectId,
        format,
        exportedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create automatic backup
   */
  async createBackup(
    projectId: string,
    backupData: ProjectBackupData,
    options: BackupOptions = {}
  ): Promise<UploadResult> {
    const backupFile: UploadFile = {
      name: `backup-${projectId}-${Date.now()}.json`,
      data: Buffer.from(JSON.stringify(backupData, null, 2)),
      type: 'application/json',
      size: 0,
    };
    backupFile.size = backupFile.data.length;

    // Encrypt backup data
    const encryptedFile = await this.encryptFile(backupFile, options.encryptionKey);

    return this.uploadFile('backups', encryptedFile, {
      metadata: {
        projectId,
        backupType: options.type || 'full',
        version: backupData.version,
        createdAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string): Promise<FileData | null> {
    try {
      const data = await this.irysService.getData(fileId);
      // Parse metadata from Irys tags if needed
      return {
        id: fileId,
        data,
        // metadata would be extracted from Irys tags
      };
    } catch (error) {
      console.error('Error fetching file:', error);
      return null;
    }
  }

  /**
   * Delete file (add deletion marker)
   */
  async deleteFile(fileId: string, reason?: string): Promise<boolean> {
    // Since Irys data is permanent, we create a deletion marker
    const deletionMarker = {
      type: 'deletion',
      targetId: fileId,
      deletedAt: new Date().toISOString(),
      reason,
    };

    try {
      await this.irysService.uploadData(JSON.stringify(deletionMarker), [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Entity-Type', value: 'deletion' },
        { name: 'Target-Id', value: fileId },
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private validateFile(file: UploadFile, bucketConfig: any): void {
    // Size validation
    if (bucketConfig.maxSize && file.size > bucketConfig.maxSize) {
      throw new Error(`File size ${file.size} exceeds limit ${bucketConfig.maxSize}`);
    }

    // Type validation
    if (bucketConfig.allowedTypes && 
        !bucketConfig.allowedTypes.includes('*') && 
        !bucketConfig.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
  }

  private async processFile(
    file: UploadFile, 
    bucketConfig: any, 
    options: UploadOptions
  ): Promise<UploadFile> {
    let processedFile = { ...file };

    // Image optimization for image bucket
    if (bucketConfig === this.buckets.images && file.type.startsWith('image/')) {
      processedFile = await this.optimizeImage(file, options as ImageUploadOptions);
    }

    return processedFile;
  }

  private generateTags(
    bucket: string, 
    file: UploadFile, 
    options: UploadOptions
  ): Array<{ name: string; value: string }> {
    const tags = [
      { name: 'Content-Type', value: file.type },
      { name: 'Entity-Type', value: 'file' },
      { name: 'Bucket', value: bucket },
      { name: 'Filename', value: file.name },
      { name: 'Size', value: file.size.toString() },
      { name: 'Uploaded-At', value: new Date().toISOString() },
    ];

    // Add metadata as tags
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        tags.push({ name: key, value: String(value) });
      });
    }

    return tags;
  }

  private generateUrl(bucket: string, irysId: string, bucketConfig: any): string {
    if (bucketConfig.cdn) {
      return `https://cdn.irysbook.io/${bucket}/${irysId}`;
    }
    return `https://gateway.irys.xyz/${irysId}`;
  }

  private async optimizeImage(
    file: UploadFile, 
    options: ImageUploadOptions
  ): Promise<UploadFile> {
    // Placeholder for image optimization
    // In production, use sharp, jimp, or similar libraries
    console.log(`Optimizing image ${file.name} with options:`, options);
    return file;
  }

  private async encryptFile(
    file: UploadFile, 
    encryptionKey?: string
  ): Promise<UploadFile> {
    if (!encryptionKey) return file;
    
    // Placeholder for encryption
    // In production, use proper encryption libraries
    console.log(`Encrypting file ${file.name}`);
    return file;
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      epub: 'application/epub+zip',
      html: 'text/html',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}

// Type definitions
export interface UploadFile {
  name: string;
  data: Buffer;
  type: string;
  size: number;
}

export interface UploadOptions {
  metadata?: Record<string, any>;
}

export interface ImageUploadOptions extends UploadOptions {
  optimize?: boolean;
  quality?: number;
  sizes?: number[];
  formats?: string[];
}

export interface AttachmentUploadOptions extends UploadOptions {
  encrypt?: boolean;
  encryptionKey?: string;
}

export interface ExportMetadata {
  title: string;
  author?: string;
  version?: string;
  pages?: number;
}

export interface BackupOptions {
  type?: 'full' | 'incremental';
  encryptionKey?: string;
}

export interface ProjectBackupData {
  version: string;
  projectId: string;
  documents: any[];
  settings: any;
  collaborators: any[];
  createdAt: string;
}

export interface UploadResult {
  id: string;
  url: string;
  permanentUrl: string;
  size: number;
  type: string;
  bucket: string;
  metadata: Record<string, any>;
  receipt?: any;
}

export interface FileData {
  id: string;
  data: any;
  metadata?: Record<string, any>;
}