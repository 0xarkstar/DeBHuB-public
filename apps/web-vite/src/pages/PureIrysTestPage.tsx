import { useState } from 'react';
import { usePureIrys } from '@/contexts/PureIrysContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PureIrysTestPage() {
  const { client, isInitializing, error: clientError } = usePureIrys();

  // Create document state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState('test-project');
  const [tags, setTags] = useState('blockchain,web3');
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Get document state
  const [docIdToGet, setDocIdToGet] = useState('');
  const [isGetting, setIsGetting] = useState(false);
  const [getResult, setGetResult] = useState<any>(null);
  const [getError, setGetError] = useState<string | null>(null);

  // Cache stats
  const [cacheStats, setCacheStats] = useState<any>(null);

  const handleCreateDocument = async () => {
    if (!client || !title || !content) return;

    try {
      setIsCreating(true);
      setCreateError(null);
      setCreateResult(null);

      const docId = await client.createDocument({
        projectId,
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      setCreateResult(docId);
      console.log('✅ Document created:', docId);

      // Clear form
      setTitle('');
      setContent('');
    } catch (err: any) {
      console.error('Failed to create document:', err);
      setCreateError(err.message || 'Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGetDocument = async () => {
    if (!client || !docIdToGet) return;

    try {
      setIsGetting(true);
      setGetError(null);
      setGetResult(null);

      const doc = await client.getDocument(docIdToGet);
      setGetResult(doc);
      console.log('✅ Document retrieved:', doc);
    } catch (err: any) {
      console.error('Failed to get document:', err);
      setGetError(err.message || 'Failed to get document');
    } finally {
      setIsGetting(false);
    }
  };

  const handleGetCacheStats = async () => {
    if (!client) return;

    try {
      const stats = await client.getCacheStats();
      setCacheStats(stats);
      console.log('📊 Cache stats:', stats);
    } catch (err) {
      console.error('Failed to get cache stats:', err);
    }
  };

  const handleClearCache = async () => {
    if (!client) return;

    try {
      await client.clearCache();
      await handleGetCacheStats();
      console.log('🗑️ Cache cleared');
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Initializing Pure Irys Client...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to initialize Pure Irys Client: {clientError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            Please connect your wallet to use Pure Irys BaaS
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pure Irys BaaS Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the world's first blockchain-native BaaS
        </p>
      </div>

      {/* Create Document */}
      <Card>
        <CardHeader>
          <CardTitle>Create Document</CardTitle>
          <CardDescription>
            Create a new document and store it permanently on Irys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Document"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Document content stored permanently on Irys..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="test-project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="blockchain,web3"
              />
            </div>
          </div>

          <Button
            onClick={handleCreateDocument}
            disabled={isCreating || !title || !content}
            className="w-full"
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Creating...' : 'Create Document'}
          </Button>

          {createResult && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Document created!</strong><br />
                Doc ID: <code className="text-xs">{createResult}</code>
              </AlertDescription>
            </Alert>
          )}

          {createError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Get Document */}
      <Card>
        <CardHeader>
          <CardTitle>Get Document</CardTitle>
          <CardDescription>
            Retrieve a document by ID (with caching)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={docIdToGet}
              onChange={(e) => setDocIdToGet(e.target.value)}
              placeholder="Document ID"
              className="flex-1"
            />
            <Button
              onClick={handleGetDocument}
              disabled={isGetting || !docIdToGet}
            >
              {isGetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get
            </Button>
          </div>

          {getResult && (
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(getResult, null, 2)}
              </pre>
            </div>
          )}

          {getError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{getError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cache Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
          <CardDescription>
            IndexedDB cache performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleGetCacheStats} variant="outline">
              Refresh Stats
            </Button>
            <Button onClick={handleClearCache} variant="destructive">
              Clear Cache
            </Button>
          </div>

          {cacheStats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold">{cacheStats.documents}</div>
                <div className="text-sm text-muted-foreground">Documents</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold">{cacheStats.queries}</div>
                <div className="text-sm text-muted-foreground">Queries</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold">{cacheStats.totalSize}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
