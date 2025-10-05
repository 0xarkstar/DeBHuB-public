import { Network, CheckCircle, Activity, Fuel, Wallet } from 'lucide-react';
import { useAccount, useBlockNumber, useBalance } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { irysVM } from '@/lib/wagmi';
import { useState, useEffect } from 'react';

export function NetworkStatusCard() {
  const [mounted, setMounted] = useState(false);
  const account = useAccount();
  const { data: blockNumber } = useBlockNumber({ chainId: irysVM.id, watch: true });
  const { data: balance } = useBalance({ address: account.address, chainId: irysVM.id });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = account.isConnected;
  const chainId = account.chainId;
  const isCorrectChain = chainId === irysVM.id;

  const stats = [
    {
      label: 'Network',
      value: isCorrectChain ? 'IrysVM' : `Chain ${chainId || 'N/A'}`,
      icon: Network,
      status: isCorrectChain ? 'success' : 'warning',
    },
    {
      label: 'Chain ID',
      value: irysVM.id.toString(),
      icon: Activity,
      status: 'info',
    },
    {
      label: 'Block Height',
      value: blockNumber ? blockNumber.toLocaleString() : 'Loading...',
      icon: CheckCircle,
      status: 'info',
    },
    {
      label: 'Wallet Balance',
      value: balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'N/A',
      icon: Wallet,
      status: 'info',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          IrysVM Network Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', getStatusColor(stat.status))}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <span className="text-sm font-bold">{stat.value}</span>
              </div>
            );
          })}

          {/* RPC Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                RPC Status
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold">Connected</span>
            </div>
          </div>

          {/* Gas Price - Mock data for now */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Fuel className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Gas Price
              </span>
            </div>
            <span className="text-sm font-bold">~0.1 gwei</span>
          </div>
        </div>

        {!isConnected && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">
              Connect your wallet to see live network data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
