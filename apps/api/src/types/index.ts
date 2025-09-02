export interface Post {
  id: string;
  content: string;
  authorAddress: string;
  timestamp: string;
}

export interface Context {
  authorAddress?: string;
  signature?: string;
}

export interface IrysTag {
  name: string;
  value: string;
}

export interface IrysTransaction {
  id: string;
  tags: IrysTag[];
  timestamp: number;
}