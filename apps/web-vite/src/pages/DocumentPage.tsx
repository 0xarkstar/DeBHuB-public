import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { Button } from '@/components/ui/button';
import { useDocument, useProjectById } from '@/lib/irys-hooks';

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = id!;

  const { data: document, loading, error, refetch } = useDocument(documentId);

  // Fetch project info for back link (using projectId which is the entityId)
  const { data: project } = useProjectById(document?.projectId || null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-6">
            {error?.message || "The document you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Button asChild>
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={project ? `/projects/${project.slug}` : '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {project ? `Back to ${project.name}` : 'Back to Dashboard'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <DocumentEditor
        document={{
          id: document.entityId,
          title: document.title,
          content: document.content,
          path: document.path,
          published: !document.deleted,
          irysId: document.irysId
        }}
        onSave={() => refetch()}
        onPublish={() => refetch()}
      />
    </div>
  );
}
