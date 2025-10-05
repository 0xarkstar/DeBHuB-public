
import { useState, useEffect } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { Save, History, MessageSquare, Users, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SyncIndicator, SyncStatus } from '@/components/shared/SyncIndicator';
import { CostEstimator } from './CostEstimator';
import { PublishConfirmationModal } from './PublishConfirmationModal';
import { PublishingProgress } from './PublishingProgress';
import { PermanentLinkSuccess } from './PermanentLinkSuccess';
import { UPDATE_DOCUMENT, PUBLISH_DOCUMENT } from '@/lib/graphql/mutations';
import { DOCUMENT_UPDATED } from '@/lib/graphql/subscriptions';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  document: {
    id: string;
    title: string;
    content: string;
    path: string;
    published: boolean;
    irysId?: string | null;
  };
  onSave?: () => void;
  onPublish?: () => void;
}

type PublishingStage = 'uploading' | 'broadcasting' | 'syncing' | 'completed';

export function DocumentEditor({ document, onSave, onPublish }: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [hasChanges, setHasChanges] = useState(false);

  // Publishing flow states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingStage, setPublishingStage] = useState<PublishingStage>('uploading');
  const [publishedIrysId, setPublishedIrysId] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const [updateDocument, { loading: saving }] = useMutation(UPDATE_DOCUMENT);
  const [publishDocument] = useMutation(PUBLISH_DOCUMENT);

  // Subscribe to document updates
  useSubscription(DOCUMENT_UPDATED, {
    variables: { documentId: document.id },
    onData: ({ data }) => {
      const update = data.data?.documentUpdated;
      if (update && update.type === 'CONTENT_CHANGED') {
        // Handle real-time updates from other users
        console.log('Document updated by another user:', update);
      }
    },
  });

  // Track changes
  useEffect(() => {
    const hasChanged = title !== document.title || content !== document.content;
    setHasChanges(hasChanged);
    if (hasChanged && syncStatus === 'synced') {
      setSyncStatus('pending');
    }
  }, [title, content, document.title, document.content, syncStatus]);

  const handleSave = async () => {
    try {
      setSyncStatus('syncing');
      await updateDocument({
        variables: {
          input: {
            id: document.id,
            title,
            content,
          },
        },
      });
      setSyncStatus('synced');
      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error('Failed to save document:', error);
      setSyncStatus('conflict');
    }
  };

  const handlePublishClick = () => {
    setShowPublishModal(true);
  };

  const handlePublishConfirm = async () => {
    try {
      // Save first if there are changes
      if (hasChanges) {
        await handleSave();
      }

      setShowPublishModal(false);
      setIsPublishing(true);

      // Simulate publishing stages
      setPublishingStage('uploading');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setPublishingStage('broadcasting');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setPublishingStage('syncing');
      const { data } = await publishDocument({
        variables: { id: document.id },
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      setPublishingStage('completed');

      // Mock Irys ID (replace with real data from mutation)
      const irysId = data?.publishDocument?.irysId || 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';
      setPublishedIrysId(irysId);

      onPublish?.();
    } catch (error) {
      console.error('Failed to publish document:', error);
      setIsPublishing(false);
      alert('Publishing failed. Please try again.');
    }
  };

  const handlePublishingClose = () => {
    setIsPublishing(false);
    setPublishedIrysId(null);
    setPublishingStage('uploading');
  };

  // Auto-save
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [title, content, hasChanges]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4 flex-1">
            <SyncIndicator status={syncStatus} />
            {document.irysId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                  Stored on Irys
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>

            <Button
              variant="outline"
              size="sm"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>

            <Button
              variant="outline"
              size="sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </Button>

            <Button
              variant="outline"
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button
              size="sm"
              onClick={handlePublishClick}
              disabled={document.published || isPublishing}
              className={cn(
                document.published && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {document.published ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Published to Irys
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Publish to Irys
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Publishing Modals */}
      <PublishConfirmationModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublishConfirm}
        documentTitle={title}
        contentSize={new Blob([content]).size}
        estimatedCost={estimatedCost}
      />

      {/* Publishing Progress Overlay */}
      {isPublishing && !publishedIrysId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <PublishingProgress stage={publishingStage} />
          </div>
        </div>
      )}

      {/* Success Screen Overlay */}
      {publishedIrysId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <PermanentLinkSuccess
              irysId={publishedIrysId}
              documentTitle={title}
              onClose={handlePublishingClose}
            />
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title..."
            className="text-4xl font-bold border-none focus-visible:ring-0 px-0 h-auto py-0"
          />

          {/* Path */}
          <div className="text-sm text-muted-foreground">
            Path: {document.path}
          </div>

          {/* Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your document..."
            className="min-h-[600px] border-none focus-visible:ring-0 px-0 resize-none text-base leading-relaxed"
          />

          {/* Cost Estimator */}
          {!document.published && (
            <CostEstimator
              contentSize={new Blob([content]).size}
              onCostCalculated={setEstimatedCost}
            />
          )}

          {/* Metadata */}
          <div className="pt-8 border-t text-sm text-muted-foreground space-y-2">
            <div>
              <strong>Document ID:</strong> {document.id}
            </div>
            {document.irysId && (
              <div>
                <strong>Irys ID:</strong>{' '}
                <a
                  href={`https://gateway.irys.xyz/${document.irysId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {document.irysId}
                </a>
              </div>
            )}
            <div>
              <strong>Status:</strong>{' '}
              <span className={cn(
                'px-2 py-0.5 rounded text-xs',
                document.published
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              )}>
                {document.published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
