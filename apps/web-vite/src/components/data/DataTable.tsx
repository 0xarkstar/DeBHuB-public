import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataRecord } from '@/lib/data-helpers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface DataTableProps {
  data: DataRecord[];
  loading?: boolean;
  selectedIds?: string[];
  onRowClick?: (record: DataRecord) => void;
  onSelect?: (ids: string[]) => void;
  onDelete?: (id: string) => void;
  onSort?: (field: keyof DataRecord, order: 'asc' | 'desc') => void;
  sortField?: keyof DataRecord;
  sortOrder?: 'asc' | 'desc';
}

export function DataTable({
  data,
  loading = false,
  selectedIds = [],
  onRowClick,
  onSelect,
  onDelete,
  onSort,
  sortField,
  sortOrder,
}: DataTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (onSelect) {
      onSelect(checked ? data.map(d => d.docId) : []);
    }
  };

  const handleSelectRow = (docId: string, checked: boolean) => {
    if (onSelect) {
      if (checked) {
        onSelect([...selectedIds, docId]);
      } else {
        onSelect(selectedIds.filter(id => id !== docId));
      }
    }
  };

  const handleSort = (field: keyof DataRecord) => {
    if (onSort) {
      const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(field, newOrder);
    }
  };

  const SortIcon = ({ field }: { field: keyof DataRecord }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline" />
    ) : (
      <ChevronDown className="h-4 w-4 inline" />
    );
  };

  const getTypeColor = (type: string) => {
    const colors = {
      project: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      document: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      vector: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type as keyof typeof colors] || colors.custom;
  };

  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No data found
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              {onSelect && (
                <th className="px-4 py-3 text-left w-12">
                  <Checkbox
                    checked={selectedIds.length === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              <th
                className="px-4 py-3 text-left font-medium text-sm cursor-pointer hover:bg-muted"
                onClick={() => handleSort('type')}
              >
                Type <SortIcon field="type" />
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-sm cursor-pointer hover:bg-muted"
                onClick={() => handleSort('docId')}
              >
                ID <SortIcon field="docId" />
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-sm cursor-pointer hover:bg-muted"
                onClick={() => handleSort('owner')}
              >
                Owner <SortIcon field="owner" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm">
                Tags
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm">
                Visibility
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-sm cursor-pointer hover:bg-muted"
                onClick={() => handleSort('createdAt')}
              >
                Created <SortIcon field="createdAt" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm w-12">
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((record) => (
              <tr
                key={record.docId}
                className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredRow(record.docId)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onRowClick?.(record)}
              >
                {onSelect && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(record.docId)}
                      onCheckedChange={(checked) =>
                        handleSelectRow(record.docId, checked as boolean)
                      }
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <Badge variant="outline" className={getTypeColor(record.type)}>
                    {record.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {record.docId.slice(0, 16)}...
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {record.owner.slice(0, 6)}...{record.owner.slice(-4)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap max-w-md">
                    {record.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {record.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{record.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={record.isPublic ? 'default' : 'outline'}>
                    {record.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDistanceToNow(record.createdAt, { addSuffix: true })}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={hoveredRow === record.docId ? 'opacity-100' : 'opacity-0'}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onRowClick?.(record)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRowClick?.(record)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(record.docId);
                        toast.success('ID copied to clipboard!');
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy ID
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open(`https://gateway.irys.xyz/${record.irysId}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Irys
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete?.(record.docId)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
