import { AlertTriangle, HardDrive, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PublishConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentTitle: string;
  contentSize: number;
  estimatedCost: number;
  isPublishing?: boolean;
}

export function PublishConfirmationModal({
  open,
  onClose,
  onConfirm,
  documentTitle,
  contentSize,
  estimatedCost,
  isPublishing = false,
}: PublishConfirmationModalProps) {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            Publish to Permanent Storage
          </DialogTitle>
          <DialogDescription>
            This will permanently store your document on Irys DataChain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Document:</span>
              <span className="font-medium">{documentTitle || 'Untitled'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{formatSize(contentSize)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Cost:</span>
              <span className="font-bold text-green-600">{formatCurrency(estimatedCost)}</span>
            </div>
          </div>

          {/* Warning Box */}
          <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-orange-900">
                  ⚠️ This action is PERMANENT and cannot be undone
                </p>
                <ul className="list-disc list-inside space-y-1 text-orange-800 text-xs">
                  <li>Your document will be stored forever on Irys</li>
                  <li>The permanent link will never expire</li>
                  <li>Content cannot be edited or deleted</li>
                  <li>You will be charged for the storage</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">What you get:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <HardDrive className="h-3 w-3 text-purple-600" />
                <span>Permanent storage</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Lock className="h-3 w-3 text-purple-600" />
                <span>Immutable record</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPublishing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isPublishing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Publishing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Confirm & Sign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
