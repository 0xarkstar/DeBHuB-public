'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Network, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { irysVM } from '@/lib/wagmi';
import { useState, useEffect } from 'react';

interface NetworkStatusProps {
  showSwitchButton?: boolean;
  compact?: boolean;
}

export function NetworkStatus({ showSwitchButton = true, compact = false }: NetworkStatusProps) {
  const [mounted, setMounted] = useState(false);
  const account = useAccount();
  const chainIdHook = useChainId();
  const switchChainHook = useSwitchChain();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe access to wagmi hooks after mount
  const isConnected = mounted ? account.isConnected : false;
  const chainId = mounted ? chainIdHook : undefined;
  const switchChain = mounted ? switchChainHook.switchChain : undefined;

  if (!mounted || !isConnected) {
    return null;
  }

  const isIrysVM = chainId === irysVM.id;

  const switchToIrysVM = () => {
    if (switchChain) {
      switchChain({ chainId: irysVM.id });
    }
  };

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
        isIrysVM
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-orange-50 text-orange-700 border border-orange-200'
      )}>
        {isIrysVM ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <span className="font-medium">
          {isIrysVM ? 'IrysVM' : `Chain ${chainId}`}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      isIrysVM
        ? 'bg-green-50 border-green-200'
        : 'bg-orange-50 border-orange-200'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isIrysVM ? 'bg-green-100' : 'bg-orange-100'
          )}>
            <Network className={cn(
              'h-5 w-5',
              isIrysVM ? 'text-green-600' : 'text-orange-600'
            )} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn(
                'font-semibold',
                isIrysVM ? 'text-green-900' : 'text-orange-900'
              )}>
                {isIrysVM ? 'Connected to IrysVM' : `Wrong Network`}
              </h3>
              {isIrysVM ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
            </div>
            <p className={cn(
              'text-sm mt-0.5',
              isIrysVM ? 'text-green-700' : 'text-orange-700'
            )}>
              {isIrysVM
                ? 'All features available'
                : `Please switch to IrysVM (Chain ID: ${irysVM.id})`
              }
            </p>
          </div>
        </div>

        {!isIrysVM && showSwitchButton && (
          <Button
            size="sm"
            onClick={switchToIrysVM}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Switch Network
          </Button>
        )}
      </div>
    </div>
  );
}
