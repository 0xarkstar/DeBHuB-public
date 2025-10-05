import { RefreshCw, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SyncStatus {
  pendingUploads: number;
  confirmingTransactions: number;
  completedToday: number;
  failedTransactions: FailedTransaction[];
}

interface FailedTransaction {
  id: string;
  documentTitle: string;
  error: string;
  timestamp: string;
  retryable: boolean;
}

interface SyncMonitorProps {
  status: SyncStatus;
  onRetry?: (txId: string) => void;
}

export function SyncMonitor({ status, onRetry }: SyncMonitorProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = [
    {
      label: 'Pending Uploads',
      value: status.pendingUploads,
      icon: Clock,
      color: 'text-orange-600 bg-orange-100',
      description: 'Waiting to upload to Irys',
    },
    {
      label: 'Confirming',
      value: status.confirmingTransactions,
      icon: RefreshCw,
      color: 'text-blue-600 bg-blue-100',
      description: 'Broadcasting to IrysVM',
    },
    {
      label: 'Completed Today',
      value: status.completedToday,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
      description: 'Successfully synced',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Real-time Sync Monitor
        </CardTitle>
        <CardDescription>
          Track Irys uploads and blockchain synchronization status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('p-2 rounded-lg', stat.color)}>
                    <Icon className={cn('h-4 w-4', stat.icon === RefreshCw && status.confirmingTransactions > 0 && 'animate-spin')} />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            );
          })}
        </div>

        {/* Failed Transactions */}
        {status.failedTransactions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Failed Transactions</h3>
            </div>
            <div className="space-y-2">
              {status.failedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-900">
                          {tx.documentTitle}
                        </span>
                        <span className="text-xs text-red-600">
                          {formatTimestamp(tx.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-red-700">{tx.error}</p>
                    </div>
                    {tx.retryable && onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(tx.id)}
                        className="ml-3 border-red-300 text-red-700 hover:bg-red-100"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Clear Message */}
        {status.pendingUploads === 0 &&
          status.confirmingTransactions === 0 &&
          status.failedTransactions.length === 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">
                All synced! No pending transactions.
              </p>
              <p className="text-xs text-green-700 mt-1">
                {status.completedToday} transaction{status.completedToday !== 1 ? 's' : ''} completed today
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
