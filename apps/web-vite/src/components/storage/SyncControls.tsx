import { useState } from 'react';
import { RefreshCw, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CacheStats {
  cachedDocuments: number;
  totalDocuments: number;
  hitRate: number; // percentage
  lastSync: string;
}

interface SyncControlsProps {
  stats: CacheStats;
  onForceSync: () => Promise<void>;
  onRebuildCache: () => Promise<void>;
}

export function SyncControls({ stats, onForceSync, onRebuildCache }: SyncControlsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await onForceSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRebuildCache = async () => {
    if (!confirm('This will rebuild the entire cache. Continue?')) return;

    setIsRebuilding(true);
    try {
      await onRebuildCache();
    } finally {
      setIsRebuilding(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const getCacheStatus = () => {
    const percentage = (stats.cachedDocuments / stats.totalDocuments) * 100;
    if (percentage === 100) return { status: 'healthy', icon: CheckCircle, color: 'text-green-600' };
    if (percentage >= 90) return { status: 'good', icon: CheckCircle, color: 'text-blue-600' };
    return { status: 'degraded', icon: AlertTriangle, color: 'text-orange-600' };
  };

  const cacheStatus = getCacheStatus();
  const StatusIcon = cacheStatus.icon;

  return (
    <div className="space-y-4">
      {/* Cache Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cache Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <StatusIcon className={cn('h-5 w-5', cacheStatus.color)} />
              <div>
                <div className="text-2xl font-bold">
                  {stats.cachedDocuments}/{stats.totalDocuments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Documents cached
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.hitRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Query efficiency
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {formatDate(stats.lastSync)}
                </div>
                <p className="text-xs text-muted-foreground">
                  PostgreSQL sync
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync Controls</CardTitle>
          <CardDescription>
            Force synchronization or rebuild the cache if you experience data inconsistencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium mb-1">Force Re-sync</h4>
              <p className="text-sm text-muted-foreground">
                Synchronize all documents from Irys to PostgreSQL cache. This will update existing cached data.
              </p>
            </div>
            <Button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="ml-4"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Force Sync
                </>
              )}
            </Button>
          </div>

          <div className="flex items-start justify-between p-4 border rounded-lg border-orange-200 bg-orange-50/50">
            <div className="flex-1">
              <h4 className="font-medium mb-1 text-orange-900">Rebuild Cache</h4>
              <p className="text-sm text-orange-700">
                Clear and rebuild the entire PostgreSQL cache from Irys. Use this only if you experience major data inconsistencies.
              </p>
            </div>
            <Button
              onClick={handleRebuildCache}
              disabled={isRebuilding}
              variant="outline"
              className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {isRebuilding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Rebuilding...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Rebuild Cache
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
