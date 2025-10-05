import { CheckCircle, Copy, ExternalLink, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PermanentLinkSuccessProps {
  irysId: string;
  documentTitle: string;
  onClose?: () => void;
}

export function PermanentLinkSuccess({
  irysId,
  documentTitle,
  onClose,
}: PermanentLinkSuccessProps) {
  const [copied, setCopied] = useState(false);

  const permanentUrl = `https://gateway.irys.xyz/${irysId}`;
  const explorerUrl = `https://explorer.irys.xyz/tx/${irysId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(permanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: documentTitle,
          text: `Check out my document on Irys: ${documentTitle}`,
          url: permanentUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              Published Successfully!
            </h3>
            <p className="text-sm text-green-700">
              Your document is now permanently stored on Irys DataChain
            </p>
          </div>

          {/* Document Info */}
          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Document</p>
                <p className="font-semibold">{documentTitle || 'Untitled'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Irys Transaction ID</p>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                  {irysId}
                </code>
              </div>
            </div>
          </div>

          {/* Permanent Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Permanent Link (Never Expires)
            </label>
            <div className="flex gap-2">
              <Input
                value={permanentUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => window.open(explorerUrl, '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Features */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs font-semibold text-purple-900 mb-2">
              ✨ Your document is now:
            </p>
            <ul className="space-y-1 text-xs text-purple-700">
              <li>✓ Permanently stored on Irys DataChain</li>
              <li>✓ Accessible via permanent URL forever</li>
              <li>✓ Immutable and tamper-proof</li>
              <li>✓ Verifiable on blockchain explorer</li>
            </ul>
          </div>

          {/* Close Button */}
          {onClose && (
            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
