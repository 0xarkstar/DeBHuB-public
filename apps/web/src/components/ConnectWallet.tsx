'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Button } from './ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
import { irysVM } from '@/lib/wagmi';
import { useState, useEffect } from 'react';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isWrongNetwork = isConnected && chainId !== irysVM.id;

  // Check auth status from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('authToken');
      setIsAuthenticated(!!authToken);
    }
  }, []);

  const handleAuthenticate = async () => {
    if (!address || !window.ethereum) return;

    setIsAuthenticating(true);
    try {
      const timestamp = Date.now();
      const message = `Sign this message to authenticate with IrysBase.\n\nAddress: ${address}\nTimestamp: ${timestamp}`;

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      const authToken = Buffer.from(
        JSON.stringify({ address, signature, message, timestamp })
      ).toString('base64');

      localStorage.setItem('authToken', authToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to authenticate:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: irysVM.id });
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal}>
                    Connect Wallet
                  </Button>
                );
              }

              if (isWrongNetwork) {
                return (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSwitchNetwork}
                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Switch to IrysVM
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAccountModal}
                    >
                      {account.displayName}
                    </Button>
                  </div>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  {!isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAuthenticate}
                      disabled={isAuthenticating}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
                    </Button>
                  )}

                  <Button
                    variant={chain.unsupported ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={openChainModal}
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 8,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 16, height: 16 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openAccountModal}
                  >
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}