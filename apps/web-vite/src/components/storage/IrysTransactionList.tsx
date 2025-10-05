import { useState } from 'react';
import { ExternalLink, Copy, Check, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface IrysTransaction {
  id: string;
  irysId: string;
  documentTitle: string;
  timestamp: string;
  size: number; // in bytes
  cost: number; // in USD
}

interface IrysTransactionListProps {
  transactions: IrysTransaction[];
}

export function IrysTransactionList({ transactions }: IrysTransactionListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.irysId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermanentUrl = (irysId: string): string => {
    return `https://gateway.irys.xyz/${irysId}`;
  };

  const getExplorerUrl = (irysId: string): string => {
    return `https://explorer.irys.xyz/tx/${irysId}`;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by document or Irys ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Irys Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No transactions found' : 'No Irys transactions yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tx.documentTitle}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {tx.irysId.slice(0, 12)}...{tx.irysId.slice(-8)}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tx.timestamp)}
                  </TableCell>
                  <TableCell className="text-sm">{formatSize(tx.size)}</TableCell>
                  <TableCell className="text-sm font-medium">
                    ${tx.cost.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(getPermanentUrl(tx.irysId), tx.id)}
                        title="Copy permanent link"
                      >
                        {copiedId === tx.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(tx.irysId), '_blank')}
                        title="View on Irys Explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
