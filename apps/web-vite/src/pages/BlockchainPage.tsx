import { WalletGuard } from '@/components/WalletGuard';
import { NetworkStatusCard } from '@/components/blockchain/NetworkStatusCard';
import { ContractList } from '@/components/blockchain/ContractList';
import { SyncMonitor } from '@/components/blockchain/SyncMonitor';

function BlockchainContent() {
  // Mock sync status data (replace with real data from GraphQL)
  const syncStatus = {
    pendingUploads: 2,
    confirmingTransactions: 1,
    completedToday: 45,
    failedTransactions: [
      {
        id: 'tx-failed-1',
        documentTitle: 'Large Media File',
        error: 'Upload timeout after 30s - file size exceeds limit (max 100MB)',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        retryable: false,
      },
    ],
  };

  const handleRetry = (txId: string) => {
    console.log('Retrying transaction:', txId);
    // TODO: Implement retry logic with GraphQL mutation
    alert('Retry functionality will be implemented with backend integration');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Blockchain</h1>
        <p className="text-muted-foreground">
          Monitor IrysVM network status, smart contracts, and synchronization
        </p>
      </div>

      {/* Network Status */}
      <NetworkStatusCard />

      {/* Smart Contracts */}
      <ContractList />

      {/* Sync Monitor */}
      <SyncMonitor status={syncStatus} onRetry={handleRetry} />
    </div>
  );
}

export default function BlockchainPage() {
  return (
    <WalletGuard>
      <BlockchainContent />
    </WalletGuard>
  );
}
