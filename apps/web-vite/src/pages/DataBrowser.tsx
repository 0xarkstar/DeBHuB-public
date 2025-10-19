import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Search,
  Plus,
  Download,
  Trash2,
  Filter,
  RefreshCw,
  Database,
  Keyboard,
} from 'lucide-react';
import { toast } from 'sonner';

import { usePureIrys } from '@/contexts/PureIrysContext';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConnectWallet } from '@/components/ConnectWallet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import {
  DataRecord,
  formatData,
  matchesSearch,
  sortData,
  exportToCsv,
  exportToJson,
  downloadFile,
  getDataStats,
} from '@/lib/data-helpers';

export default function DataBrowser() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { client, isInitializing, error: clientError } = usePureIrys();

  // State
  const [allData, setAllData] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine'>('all');
  const [sortField, setSortField] = useState<keyof DataRecord>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Load all data
  useEffect(() => {
    if (!client) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📊 Loading all data from Irys...');

        // Search for all documents (no filters)
        const documents = await client.searchDocuments({
          limit: 1000, // Load up to 1000 records
        });

        console.log(`✅ Loaded ${documents.length} records`);

        // Convert to DataRecord format
        const records = documents.map(formatData);
        setAllData(records);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [client]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = allData;

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(d => d.type === typeFilter);
    }

    // Owner filter
    if (ownerFilter === 'mine' && address) {
      result = result.filter(d => d.owner.toLowerCase() === address.toLowerCase());
    }

    // Search filter
    if (searchQuery) {
      result = result.filter(d => matchesSearch(d, searchQuery));
    }

    // Sort
    result = sortData(result, sortField, sortOrder);

    return result;
  }, [allData, typeFilter, ownerFilter, searchQuery, sortField, sortOrder, address]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => getDataStats(allData), [allData]);

  // Handlers
  const handleRowClick = (record: DataRecord) => {
    navigate(`/data/${record.docId}`);
  };

  const handleSort = (field: keyof DataRecord, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleRefresh = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    try {
      const documents = await client.searchDocuments({ limit: 1000 });
      const records = documents.map(formatData);
      setAllData(records);
      setSelectedIds([]);
      toast.success(`Refreshed! Loaded ${records.length} records`);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const handleExport = useCallback((format: 'csv' | 'json') => {
    const data = selectedIds.length > 0
      ? filteredData.filter(d => selectedIds.includes(d.docId))
      : filteredData;

    if (format === 'csv') {
      const csv = exportToCsv(data);
      downloadFile(csv, 'data-export.csv', 'text/csv');
      toast.success(`Exported ${data.length} records as CSV`);
    } else {
      const json = exportToJson(data);
      downloadFile(json, 'data-export.json', 'application/json');
      toast.success(`Exported ${data.length} records as JSON`);
    }
  }, [selectedIds, filteredData]);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} records? This cannot be undone.`)) return;

    // TODO: Implement bulk delete
    alert('Bulk delete not yet implemented');
  };

  // Keyboard shortcuts
  useHotkeys('ctrl+n, cmd+n', (e) => {
    e.preventDefault();
    navigate('/data/create');
    toast.info('Opening Create Data page');
  }, [navigate]);

  useHotkeys('ctrl+r, cmd+r', (e) => {
    e.preventDefault();
    handleRefresh();
  }, [handleRefresh]);

  useHotkeys('ctrl+f, cmd+f', (e) => {
    e.preventDefault();
    document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  });

  useHotkeys('ctrl+e, cmd+e', (e) => {
    e.preventDefault();
    if (filteredData.length > 0) {
      handleExport('json');
    }
  }, [filteredData, handleExport]);

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Initializing Pure Irys Client...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (clientError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to initialize Pure Irys Client: {clientError.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
          <div className="max-w-2xl">
            <Database className="h-12 w-12 mb-4" />
            <h2 className="text-3xl font-bold mb-3">Data Management Console</h2>
            <p className="text-lg mb-2 text-blue-100">
              Supabase-style data browser for Pure Irys BaaS
            </p>
            <p className="text-sm mb-6 text-blue-200">
              View, edit, and manage all your blockchain-stored data in one place.
            </p>
            <ConnectWallet />
          </div>
        </div>

        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Connect Wallet to Browse Data</h3>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view and manage your stored data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="h-8 w-8" />
          Data Browser
        </h1>
        <p className="text-muted-foreground">
          View and manage all data stored on Irys DataChain
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Records</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Projects</p>
          <p className="text-2xl font-bold">{stats.byType.project || 0}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Documents</p>
          <p className="text-2xl font-bold">{stats.byType.document || 0}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Vectors</p>
          <p className="text-2xl font-bold">{stats.byType.vector || 0}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Custom</p>
          <p className="text-2xl font-bold">{stats.byType.custom || 0}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, tags, content..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="vector">Vectors</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        {/* Owner Filter */}
        <Select value={ownerFilter} onValueChange={(v: 'all' | 'mine') => { setOwnerFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Data</SelectItem>
            <SelectItem value="mine">My Data Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={filteredData.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              {selectedIds.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export Selected ({selectedIds.length})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.length})
            </Button>
          )}

          <Button size="sm" onClick={() => navigate('/data/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Data
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedData.length} of {filteredData.length} records
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedData}
        loading={loading}
        selectedIds={selectedIds}
        onRowClick={handleRowClick}
        onSelect={setSelectedIds}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
      />

      {/* Pagination */}
      {filteredData.length > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {Math.ceil(filteredData.length / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= Math.ceil(filteredData.length / pageSize)}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
