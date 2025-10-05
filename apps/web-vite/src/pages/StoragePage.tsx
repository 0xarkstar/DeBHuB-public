import { useState } from 'react';
import { Database, HardDrive } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { cn } from '@/lib/utils';
import { WalletGuard } from '@/components/WalletGuard';
import { StorageOverview } from '@/components/storage/StorageOverview';
import { IrysTransactionList } from '@/components/storage/IrysTransactionList';
import { SyncControls } from '@/components/storage/SyncControls';

// TODO: Move these to @/lib/graphql/queries.ts
const GET_STORAGE_STATS = gql`
  query GetStorageStats {
    storageStats {
      totalSize
      totalCost
      transactionCount
      avgCostPerGB
      transactions {
        id
        irysId
        documentTitle
        timestamp
        size
        cost
      }
      cache {
        cachedDocuments
        totalDocuments
        hitRate
        lastSync
      }
    }
  }
`;

const FORCE_SYNC = gql`
  mutation ForceSync {
    forceSync {
      success
      syncedDocuments
    }
  }
`;

const REBUILD_CACHE = gql`
  mutation RebuildCache {
    rebuildCache {
      success
      rebuiltDocuments
    }
  }
`;

type Tab = 'irys' | 'cache';

function StorageContent() {
  const [activeTab, setActiveTab] = useState<Tab>('irys');

  const { data, loading, error, refetch } = useQuery(GET_STORAGE_STATS);
  const [forceSync] = useMutation(FORCE_SYNC);
  const [rebuildCache] = useMutation(REBUILD_CACHE);

  const handleForceSync = async () => {
    try {
      await forceSync();
      await refetch();
      alert('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    }
  };

  const handleRebuildCache = async () => {
    try {
      await rebuildCache();
      await refetch();
      alert('Cache rebuilt successfully');
    } catch (error) {
      console.error('Cache rebuild failed:', error);
      alert('Cache rebuild failed. Please try again.');
    }
  };

  const tabs = [
    { id: 'irys', label: 'Irys Storage', icon: Database },
    { id: 'cache', label: 'PostgreSQL Cache', icon: HardDrive },
  ] as const;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Storage</h1>
          <p className="text-muted-foreground">
            Manage your permanent storage and cache
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Storage</h1>
          <p className="text-muted-foreground">
            Manage your permanent storage and cache
          </p>
        </div>
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <p className="text-red-600 mb-2">Failed to load storage statistics</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // Mock data for development (remove when backend is ready)
  const storageData = data?.storageStats || {
    totalSize: 48476160000, // ~45 GB in bytes
    totalCost: 125.50,
    transactionCount: 234,
    avgCostPerGB: 2.78,
    transactions: [
      {
        id: '1',
        irysId: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
        documentTitle: 'Project Documentation',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        size: 2457600, // 2.4 MB
        cost: 0.0523,
      },
      {
        id: '2',
        irysId: 'def456ghi789jkl012mno345pqr678stu901vwx234yz567abc',
        documentTitle: 'API Reference',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        size: 1843200, // 1.8 MB
        cost: 0.0392,
      },
      {
        id: '3',
        irysId: 'ghi789jkl012mno345pqr678stu901vwx234yz567abc123def',
        documentTitle: 'Getting Started Guide',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        size: 524288, // 512 KB
        cost: 0.0111,
      },
    ],
    cache: {
      cachedDocuments: 148,
      totalDocuments: 150,
      hitRate: 98.7,
      lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Storage</h1>
        <p className="text-muted-foreground">
          Monitor your Irys permanent storage and PostgreSQL query cache
        </p>
      </div>

      {/* Overview */}
      <StorageOverview
        totalSize={storageData.totalSize}
        totalCost={storageData.totalCost}
        transactionCount={storageData.transactionCount}
        avgCostPerGB={storageData.avgCostPerGB}
      />

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-2 pb-3 border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'irys' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Permanent URLs</h2>
              <p className="text-sm text-muted-foreground mb-4">
                All documents permanently stored on Irys DataChain. These links will never expire.
              </p>
              <IrysTransactionList transactions={storageData.transactions} />
            </div>
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Query Layer Statistics</h2>
              <p className="text-sm text-muted-foreground mb-4">
                PostgreSQL cache improves query performance by storing frequently accessed documents.
              </p>
              <SyncControls
                stats={storageData.cache}
                onForceSync={handleForceSync}
                onRebuildCache={handleRebuildCache}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoragePage() {
  return (
    <WalletGuard>
      <StorageContent />
    </WalletGuard>
  );
}
