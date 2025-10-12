import { FileCode, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SmartContract {
  name: string;
  address: string;
  description: string;
  verified: boolean;
}

const contracts: SmartContract[] = [
  {
    name: 'Project Registry',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
    description: 'Manages project creation and ownership',
    verified: true,
  },
  {
    name: 'Document Controller',
    address: '0x123d35Cc6634C0532925a3b844Bc9e7595f0bEb3',
    description: 'Handles document publishing and version control',
    verified: true,
  },
  {
    name: 'Access Control',
    address: '0x456d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
    description: 'Role-based permissions and collaborator management',
    verified: true,
  },
];

export function ContractList() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getExplorerUrl = (address: string) => {
    return `https://explorer.irys.xyz/address/${address}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          Deployed Smart Contracts
        </CardTitle>
        <CardDescription>
          Core contracts deployed on IrysVM for the DeBHuB platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contracts.map((contract, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{contract.name}</h4>
                    {contract.verified && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {contract.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {contract.address}
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyAddress(contract.address)}
                >
                  {copiedAddress === contract.address ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Address
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(contract.address), '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Explorer
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> These contracts are immutable and control core platform functionality.
            All transactions are publicly verifiable on the IrysVM blockchain.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
