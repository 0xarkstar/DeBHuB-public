export interface DocumentMetadata {
  id: string;
  title: string;
  version: number;
  isPublic: boolean;
  tags?: string[];
  contentType?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProgrammableDocument {
  id: string;
  irysId: string;
  permanentUrl: string;
  proof: any;
  timestamp: number;
}

export interface QueryFilters {
  [key: string]: string | string[];
}

export interface QueryResult {
  id: string;
  tags: Array<{ name: string; value: string }>;
  data: {
    size: number;
    type: string;
  };
  timestamp: number;
}

export interface ProgrammableRule {
  event: string;
  condition?: string;
  action: string;
}

export interface ProgrammableRuleSet {
  triggers: ProgrammableRule[];
  access: {
    public: 'none' | 'read' | 'write';
    collaborators: 'none' | 'read' | 'write';
    owner: 'admin';
  };
}

export interface UploadOptions {
  tags?: Array<{ name: string; value: string }>;
  target?: string;
  anchor?: string;
}

export interface UploadResult {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  receipt: any;
}

export interface IrysBalance {
  balance: string;
  unit: string;
  winc: string;
}

export interface FundingResult {
  id: string;
  quantity: string;
  reward: string;
  target: string;
}