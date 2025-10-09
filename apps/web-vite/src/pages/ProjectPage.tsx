import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Users,
  Settings,
  BarChart3,
  Plus,
  FolderOpen,
  Globe,
  Lock,
  EyeOff
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject, useDocuments } from '@/lib/irys-hooks';
import { cn } from '@/lib/utils';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projectSlug = id!; // Now using slug instead of ID

  // Fetch project by slug
  const { data: project, loading: projectLoading } = useProject(projectSlug);

  // Fetch project documents
  const { data: documents, loading: documentsLoading } = useDocuments(
    project?.entityId || null
  );

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-6">
          The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild>
          <Link to="/">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const getVisibilityIcon = () => {
    switch (project.visibility.toLowerCase()) {
      case 'public':
        return Globe;
      case 'private':
        return Lock;
      case 'unlisted':
        return EyeOff;
      default:
        return Globe;
    }
  };

  const VisibilityIcon = getVisibilityIcon();

  // Calculate metrics from project data
  const documentsCount = documents?.length || 0;
  const collaboratorsCount = project.collaborators?.length || 0;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 rounded-lg border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>/{project.slug}</span>
                <span>•</span>
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded',
                  project.visibility.toLowerCase() === 'public'
                    ? 'bg-green-100 text-green-700'
                    : project.visibility.toLowerCase() === 'private'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                )}>
                  <VisibilityIcon className="h-3.5 w-3.5" />
                  <span className="capitalize">{project.visibility}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/projects/${projectSlug}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/projects/${projectSlug}/documents/new`}>
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Link>
            </Button>
          </div>
        </div>

        {project.description && (
          <p className="text-muted-foreground max-w-3xl">
            {project.description}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to={`/projects/${projectSlug}/documents`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Documents</p>
                  <p className="text-sm text-muted-foreground">
                    {documentsCount} total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${projectSlug}/collaborators`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Team</p>
                  <p className="text-sm text-muted-foreground">
                    {collaboratorsCount} members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${projectSlug}/analytics`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    View insights
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${projectSlug}/settings`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Configure
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Documents & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Documents</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/projects/${projectSlug}/documents`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : !documents || documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">
                  No documents yet
                </p>
                <Button size="sm" asChild>
                  <Link to={`/projects/${projectSlug}/documents/new`}>
                    Create Document
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 10).map((doc: any) => (
                  <Link
                    key={doc.entityId}
                    to={`/documents/${doc.entityId}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.path}</p>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                      v{doc.version}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Irys Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permanent Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-green-900">Irys Network</p>
                  <p className="text-sm text-green-700">All data permanently stored</p>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents</span>
                  <span className="font-medium">{documentsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage Cost</span>
                  <span className="font-medium">$0.00/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-600">Synced</span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/blockchain">
                  View on Irys
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
