import { useEffect, useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle, Network, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { irysVM } from '@/lib/wagmi';
import { toast } from 'react-hot-toast';

export function NetworkGuard() {
  const [mounted, setMounted] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const account = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-switch on mount if wrong network
  useEffect(() => {
    if (!mounted || !account.isConnected) return;

    const isWrongNetwork = chainId !== irysVM.id;

    if (isWrongNetwork) {
      // Show warning toast
      toast.error(
        `Wrong network detected (Chain ${chainId}). Please switch to IrysVM Testnet.`,
        {
          duration: 5000,
          icon: '⚠️',
        }
      );

      // Auto-switch after 2 seconds
      const timer = setTimeout(() => {
        handleSwitchNetwork();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [mounted, account.isConnected, chainId]);

  const handleSwitchNetwork = async () => {
    if (!switchChain) return;

    setIsSwitching(true);
    try {
      await switchChain({ chainId: irysVM.id });
      toast.success('Successfully switched to IrysVM Testnet!', {
        icon: '✅',
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network. Please switch manually in MetaMask.', {
        duration: 6000,
      });
    } finally {
      setIsSwitching(false);
    }
  };

  if (!mounted || !account.isConnected) {
    return null;
  }

  const isWrongNetwork = chainId !== irysVM.id;

  if (!isWrongNetwork) {
    return null;
  }

  // Full-screen blocking modal for wrong network
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center space-y-6">
        {/* Warning Icon */}
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Wrong Network Detected
          </h2>
          <p className="text-gray-600">
            You're currently connected to <strong>Chain {chainId}</strong>
          </p>
        </div>

        {/* Message */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Network className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">
                IrysVM Testnet Required
              </p>
              <p className="text-sm text-gray-700">
                This application requires IrysVM Testnet (Chain ID: {irysVM.id}) to function properly.
              </p>
            </div>
          </div>

          <div className="pl-8 text-sm text-gray-600 space-y-1">
            <p>• <strong>Network:</strong> {irysVM.name}</p>
            <p>• <strong>Chain ID:</strong> {irysVM.id}</p>
            <p>• <strong>Currency:</strong> {irysVM.nativeCurrency.symbol}</p>
            <p>• <strong>RPC:</strong> {irysVM.rpcUrls.default.http[0]}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700"
          >
            {isSwitching ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Switching Network...
              </>
            ) : (
              <>
                <Network className="h-5 w-5 mr-2" />
                Switch to IrysVM Testnet
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500">
            By clicking the button above, MetaMask will prompt you to switch networks.
            If the network is not in your wallet, it will be added automatically.
          </p>
        </div>

        {/* Help Text */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Need help?</strong> Check the{' '}
            <a
              href="/docs/network-setup"
              className="text-orange-600 hover:text-orange-700 underline"
            >
              network setup guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
