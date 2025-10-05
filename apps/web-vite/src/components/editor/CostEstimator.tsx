import { DollarSign, HardDrive, AlertTriangle, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useBalance, useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CostEstimatorProps {
  contentSize: number; // in bytes
  onCostCalculated?: (cost: number) => void;
}

export function CostEstimator({ contentSize, onCostCalculated }: CostEstimatorProps) {
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cost calculation: ~$2.50 per GB on Irys
  // This is a simplified calculation - actual cost may vary
  const COST_PER_GB = 2.5; // USD
  const sizeInGB = contentSize / (1024 * 1024 * 1024);
  const estimatedCost = sizeInGB * COST_PER_GB;

  // Notify parent of cost calculation
  useEffect(() => {
    if (onCostCalculated) {
      onCostCalculated(estimatedCost);
    }
  }, [estimatedCost, onCostCalculated]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const walletBalance = mounted && balance ? parseFloat(balance.formatted) : 0;
  const hasInsufficientBalance = estimatedCost > 0 && walletBalance < estimatedCost * 0.01; // Very rough ETH conversion

  return (
    <Card className={cn(
      'border-2',
      hasInsufficientBalance ? 'border-orange-300 bg-orange-50' : 'border-purple-200 bg-purple-50'
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Storage Cost Estimate</h3>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Size */}
            <div className="flex items-center gap-2 p-2 bg-white rounded border">
              <div className="p-1.5 rounded bg-blue-100">
                <HardDrive className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Size</div>
                <div className="text-sm font-bold">{formatSize(contentSize)}</div>
              </div>
            </div>

            {/* Cost */}
            <div className="flex items-center gap-2 p-2 bg-white rounded border">
              <div className="p-1.5 rounded bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cost</div>
                <div className="text-sm font-bold">{formatCurrency(estimatedCost)}</div>
              </div>
            </div>
          </div>

          {/* Balance Warning */}
          {mounted && hasInsufficientBalance && (
            <div className="flex items-start gap-2 p-3 bg-orange-100 border border-orange-300 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-xs text-orange-800">
                <p className="font-semibold mb-1">Insufficient balance</p>
                <p>Your wallet balance may be too low. Please fund your wallet before publishing.</p>
              </div>
            </div>
          )}

          {/* Balance Display */}
          {mounted && balance && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                <span>Wallet Balance:</span>
              </div>
              <span className="font-mono">
                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </span>
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-purple-700">
            ⛓️ This will permanently store your document on Irys DataChain
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
