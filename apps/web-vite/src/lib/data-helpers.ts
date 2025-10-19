/**
 * Data Management Console - Helper Functions
 * Utility functions for data formatting, filtering, and export
 */

export interface DataRecord {
  docId: string;
  type: 'project' | 'document' | 'vector' | 'custom';
  owner: string;
  tags: string[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  content: any;
  irysId: string;
  metadata?: {
    size?: number;
    version?: number;
  };
}

/**
 * Infer data type from tags
 */
export function inferType(tags: string[]): DataRecord['type'] {
  if (tags.some(t => t.startsWith('type:project'))) return 'project';
  if (tags.some(t => t.startsWith('type:document') || t.startsWith('type:doc'))) return 'document';
  if (tags.some(t => t.startsWith('type:vector'))) return 'vector';
  return 'custom';
}

/**
 * Format document from PureIrys to DataRecord
 */
export function formatData(doc: any): DataRecord {
  let parsedContent = doc.content;
  try {
    parsedContent = typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content;
  } catch {
    parsedContent = { raw: doc.content };
  }

  return {
    docId: doc.docId,
    type: inferType(doc.tags || []),
    owner: doc.owner,
    tags: doc.tags || [],
    isPublic: doc.isPublic ?? false,
    createdAt: doc.createdAt || Date.now(),
    updatedAt: doc.updatedAt || Date.now(),
    content: parsedContent,
    irysId: doc.irysId || '',
    metadata: {
      size: JSON.stringify(doc.content).length,
      version: doc.version || 1,
    },
  };
}

/**
 * Export data to CSV format
 */
export function exportToCsv(data: DataRecord[]): string {
  const headers = ['ID', 'Type', 'Owner', 'Public', 'Created', 'Updated', 'Tags'];
  const rows = data.map(d => [
    d.docId,
    d.type,
    d.owner.slice(0, 10) + '...',
    d.isPublic ? 'Yes' : 'No',
    new Date(d.createdAt).toISOString(),
    new Date(d.updatedAt).toISOString(),
    d.tags.join('; ')
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

/**
 * Export data to JSON format
 */
export function exportToJson(data: DataRecord[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Match search query against data record
 */
export function matchesSearch(record: DataRecord, query: string): boolean {
  const lowerQuery = query.toLowerCase();

  return (
    record.docId.toLowerCase().includes(lowerQuery) ||
    record.type.toLowerCase().includes(lowerQuery) ||
    record.owner.toLowerCase().includes(lowerQuery) ||
    record.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    JSON.stringify(record.content).toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort data records
 */
export function sortData(
  data: DataRecord[],
  field: keyof DataRecord,
  order: 'asc' | 'desc'
): DataRecord[] {
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === bVal) return 0;

    const comparison = aVal < bVal ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Group data by type
 */
export function groupByType(data: DataRecord[]): Record<string, number> {
  return data.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get data statistics
 */
export function getDataStats(data: DataRecord[]) {
  const grouped = groupByType(data);
  const totalSize = data.reduce((sum, d) => sum + (d.metadata?.size || 0), 0);

  return {
    total: data.length,
    byType: grouped,
    totalSize,
    public: data.filter(d => d.isPublic).length,
    private: data.filter(d => !d.isPublic).length,
  };
}

/**
 * Filter data by date range
 */
export function filterByDateRange(
  data: DataRecord[],
  range: 'today' | 'week' | 'month' | 'all'
): DataRecord[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const cutoff = {
    today: now - day,
    week: now - 7 * day,
    month: now - 30 * day,
    all: 0,
  }[range];

  return data.filter(d => d.createdAt >= cutoff);
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
