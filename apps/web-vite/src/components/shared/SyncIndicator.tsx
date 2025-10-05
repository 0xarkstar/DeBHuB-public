
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'syncing';

interface SyncIndicatorProps {
  status: SyncStatus;
  lastSync?: Date | string;
  showDetails?: boolean;
  className?: string;
}

export function SyncIndicator({
  status,
  lastSync,
  showDetails = false,
  className
}: SyncIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Synced',
          description: 'Data synchronized with Irys'
        };
      case 'pending':
        return {
          icon: RefreshCw,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          label: 'Pending',
          description: 'Sync in progress'
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Syncing',
          description: 'Uploading to Irys...'
        };
      case 'conflict':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Conflict',
          description: 'Sync conflict detected'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isAnimating = status === 'syncing' || status === 'pending';

  const formatLastSync = (date?: Date | string) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!showDetails) {
    return (
      <div className={cn('inline-flex items-center gap-1.5', className)}>
        <Icon
          className={cn(
            'h-4 w-4',
            config.color,
            isAnimating && 'animate-spin'
          )}
        />
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border',
      config.bg,
      config.border,
      className
    )}>
      <Icon
        className={cn(
          'h-5 w-5 mt-0.5',
          config.color,
          isAnimating && 'animate-spin'
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={cn('text-sm font-semibold', config.color)}>
            {config.label}
          </p>
          {lastSync && (
            <span className={cn('text-xs', config.color, 'opacity-75')}>
              {formatLastSync(lastSync)}
            </span>
          )}
        </div>
        <p className={cn('text-xs mt-0.5', config.color, 'opacity-90')}>
          {config.description}
        </p>
      </div>
    </div>
  );
}
