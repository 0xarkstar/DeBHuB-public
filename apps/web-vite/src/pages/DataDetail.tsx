import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  Copy,
  ExternalLink,
  History,
  Info,
  FileJson,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { usePureIrys } from '@/contexts/PureIrysContext';
import { useDocument, useUpdateDocument } from '@/hooks/usePureIrys';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatData, DataRecord } from '@/lib/data-helpers';

export default function DataDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { client } = usePureIrys();

  const { document, loading, error, refetch } = useDocument(client, id || null);
  const { updateDocument, isUpdating } = useUpdateDocument(client);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [record, setRecord] = useState<DataRecord | null>(null);

  // Format document to DataRecord
  useEffect(() => {
    if (document) {
      const formatted = formatData(document);
      setRecord(formatted);
      setEditedContent(JSON.stringify(formatted.content, null, 2));
    }
  }, [document]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (record) {
      setEditedContent(JSON.stringify(record.content, null, 2));
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      // Validate JSON
      JSON.parse(editedContent);

      const updatePromise = updateDocument(id, {
        content: editedContent,
        changeDescription: 'Updated via Data Console',
      });

      toast.promise(updatePromise, {
        loading: 'Saving changes to blockchain...',
        success: 'Changes saved successfully!',
        error: 'Failed to save changes',
      });

      await updatePromise;
      setIsEditing(false);
      refetch();
    } catch (err) {
      toast.error('Invalid JSON: ' + (err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this record? This cannot be undone.')) {
      return;
    }

    // TODO: Implement delete functionality
    alert('Delete functionality not yet implemented');
  };

  const handleCopyId = () => {
    if (id) {
      navigator.clipboard.writeText(id);
      toast.success('ID copied to clipboard!');
    }
  };

  const handleViewOnIrys = () => {
    if (record?.irysId) {
      window.open(`https://gateway.irys.xyz/${record.irysId}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/data')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Data Browser
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || 'Record not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isOwner = address && record.owner.toLowerCase() === address.toLowerCase();

  // Keyboard shortcuts
  useHotkeys('esc', () => {
    if (isEditing) {
      handleCancel();
    }
  }, [isEditing]);

  useHotkeys('ctrl+s, cmd+s', (e) => {
    e.preventDefault();
    if (isEditing && isOwner) {
      handleSave();
    }
  }, [isEditing, isOwner]);

  useHotkeys('ctrl+e, cmd+e', (e) => {
    e.preventDefault();
    if (!isEditing && isOwner) {
      handleEdit();
    }
  }, [isEditing, isOwner]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/data')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Data Browser
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileJson className="h-8 w-8" />
            Data Record
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {record.docId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCopyId}>
                <Copy className="h-4 w-4 mr-2" />
                Copy ID
              </Button>
              <Button variant="outline" size="sm" onClick={handleViewOnIrys}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Irys
              </Button>
              {isOwner && (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Type</p>
          <Badge variant="outline" className="text-sm">
            {record.type}
          </Badge>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Visibility</p>
          <Badge variant={record.isPublic ? 'default' : 'outline'}>
            {record.isPublic ? 'Public' : 'Private'}
          </Badge>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Size</p>
          <p className="text-sm font-medium">
            {((record.metadata?.size || 0) / 1024).toFixed(2)} KB
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Version</p>
          <p className="text-sm font-medium">v{record.metadata?.version || 1}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">
            <FileJson className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="metadata">
            <Info className="h-4 w-4 mr-2" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
              <p className="text-sm font-medium">JSON Content</p>
              {isEditing && (
                <Badge variant="secondary">Editing Mode</Badge>
              )}
            </div>
            <Editor
              height="500px"
              language="json"
              value={editedContent}
              onChange={(value) => setEditedContent(value || '')}
              theme="vs-dark"
              options={{
                readOnly: !isEditing,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <div className="border rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Document ID</p>
                <p className="font-mono text-sm">{record.docId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Irys Transaction ID</p>
                <p className="font-mono text-sm break-all">{record.irysId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Owner</p>
                <p className="font-mono text-sm">{record.owner}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                <p className="text-sm">
                  {new Date(record.createdAt).toLocaleString()}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(record.createdAt, { addSuffix: true })})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm">
                  {new Date(record.updatedAt).toLocaleString()}
                  <span className="text-muted-foreground ml-2">
                    ({formatDistanceToNow(record.updatedAt, { addSuffix: true })})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Data Size</p>
                <p className="text-sm">{(record.metadata?.size || 0).toLocaleString()} bytes</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {record.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Blockchain Info</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <span className="text-sm">Network</span>
                  <Badge>IrysVM Testnet (Chain ID: 1270)</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <span className="text-sm">Storage</span>
                  <Badge>Irys DataChain (Permanent)</Badge>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Version History</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <Badge>v{record.metadata?.version || 1}</Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Version</p>
                  <p className="text-sm text-muted-foreground">
                    Last updated {formatDistanceToNow(record.updatedAt, { addSuffix: true })}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Version history will be available soon</p>
                <p className="text-xs">All changes are recorded on ProvenanceChain contract</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
