'use client';

import { CheckCircle, Clock, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type TxStage = 'submitting' | 'confirming' | 'finalized';

interface TxProgressProps {
  stage: TxStage;
  txHash?: string;
  explorerUrl?: string;
  className?: string;
}

const stages = [
  { key: 'submitting', label: 'Submitting' },
  { key: 'confirming', label: 'Confirming' },
  { key: 'finalized', label: 'Finalized' }
] as const;

export function TxProgress({
  stage,
  txHash,
  explorerUrl,
  className
}: TxProgressProps) {
  const currentStageIndex = stages.findIndex(s => s.key === stage);

  const getStageStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {stages.map((s, index) => {
          const status = getStageStatus(index);
          const isLast = index === stages.length - 1;

          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {/* Icon */}
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                  status === 'completed' && 'bg-green-500 border-green-500',
                  status === 'current' && 'bg-blue-500 border-blue-500',
                  status === 'upcoming' && 'bg-gray-100 border-gray-300'
                )}>
                  {status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                  {status === 'current' && (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  )}
                  {status === 'upcoming' && (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  'text-xs font-medium mt-2',
                  status === 'completed' && 'text-green-600',
                  status === 'current' && 'text-blue-600',
                  status === 'upcoming' && 'text-gray-400'
                )}>
                  {s.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className={cn(
                  'flex-1 h-0.5 mx-4 transition-all',
                  index < currentStageIndex ? 'bg-green-500' : 'bg-gray-300'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Transaction Details */}
      {txHash && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-1">Transaction Hash</p>
              <p className="text-sm font-mono text-gray-900 truncate">
                {txHash}
              </p>
            </div>
            {explorerUrl && (
              <Button
                size="sm"
                variant="outline"
                asChild
                className="ml-3"
              >
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <span>View</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {stage === 'submitting' && 'Submitting transaction to IrysVM...'}
          {stage === 'confirming' && 'Waiting for blockchain confirmation...'}
          {stage === 'finalized' && 'Transaction completed successfully!'}
        </p>
      </div>
    </div>
  );
}
