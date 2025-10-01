'use client';

import { useState, useEffect } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { Save, History, MessageSquare, Users, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SyncIndicator, SyncStatus } from '@/components/shared/SyncIndicator';
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

export function DocumentEditor({ document, onSave, onPublish }: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [hasChanges, setHasChanges] = useState(false);

  const [updateDocument, { loading: saving }] = useMutation(UPDATE_DOCUMENT);
  const [publishDocument, { loading: publishing }] = useMutation(PUBLISH_DOCUMENT);

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

  const handlePublish = async () => {
    try {
      // Save first if there are changes
      if (hasChanges) {
        await handleSave();
      }

      await publishDocument({
        variables: { id: document.id },
      });

      onPublish?.();
    } catch (error) {
      console.error('Failed to publish document:', error);
    }
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
              onClick={handlePublish}
              disabled={publishing}
              className={cn(
                document.published && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {document.published ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Published
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  {publishing ? 'Publishing...' : 'Publish'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

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
