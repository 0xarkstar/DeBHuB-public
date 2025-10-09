import { useState } from 'react';
import { Button } from './ui/button';
import { useWallet } from '@/lib/irys-hooks';

export function ConnectWallet() {
  const { connected, address, loading, connect, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  if (connected && address) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button variant="outline" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleConnect} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
