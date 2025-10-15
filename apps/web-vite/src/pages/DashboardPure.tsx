import { Plus, Search, Wallet, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConnectWallet } from '@/components/ConnectWallet';
import { usePureIrys } from '@/contexts/PureIrysContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Dashboard using Pure Irys Client
 * Zero backend, pure blockchain
 */

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  documentsCount: number;
  collaboratorsCount: number;
  updatedAt: string;
  owner: {
    address: string;
  };
  storage: {
    irysGB: number;
    monthlyCostUSD: number;
  };
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { client, isInitializing, error: clientError } = usePureIrys();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch projects when client is ready
  useEffect(() => {
    if (!client) return;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Search for projects owned by the user or public projects
        const searchOptions = isConnected && address
          ? { owner: address, limit: 50 }
          : { tags: ['type:project', 'visibility:public'], limit: 50 };

        const documents = await client.searchDocuments(searchOptions);

        // Convert documents to projects
        const projectList = documents
          .filter(doc => doc.tags.includes('type:project'))
          .map(doc => {
            try {
              const content = JSON.parse(doc.content);
              const visibility = doc.isPublic ? 'PUBLIC' : 'PRIVATE';
              const project: Project = {
                id: doc.docId,
                name: content.name || 'Untitled Project',
                slug: content.slug || doc.docId.slice(0, 8),
                description: content.description || '',
                visibility: visibility as 'PUBLIC' | 'PRIVATE' | 'UNLISTED',
                documentsCount: 0, // TODO: count documents
                collaboratorsCount: 1,
                updatedAt: new Date(doc.updatedAt).toISOString(),
                owner: {
                  address: doc.owner
                },
                storage: {
                  irysGB: 0.01,
                  monthlyCostUSD: 0.0
                },
                syncStatus: 'synced'
              };
              return project;
            } catch {
              return null;
            }
          })
          .filter((p): p is Project => p !== null);

        setProjects(projectList);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [client, isConnected, address]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show initialization state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Initializing Pure Irys Client...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (clientError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to initialize Pure Irys Client: {clientError.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Not connected view - show public projects
  if (!isConnected) {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-3">Welcome to DeBHuB</h2>
            <p className="text-lg mb-2 text-indigo-100">
              World's First Pure Irys BaaS Platform
            </p>
            <p className="text-sm mb-6 text-indigo-200">
              Zero backend. Zero database. Pure blockchain. Powered by Irys DataChain.
            </p>
            <div className="flex items-center gap-4">
              <ConnectWallet />
              <p className="text-sm text-indigo-200">
                Connect to create your own projects
              </p>
            </div>
          </div>
        </div>

        {/* Public Projects Section */}
        <div>
          <div className="mb-4">
            <h3 className="text-2xl font-bold mb-2">Public Projects</h3>
            <p className="text-muted-foreground">
              Browse publicly available documentation projects
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search public projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load public projects: {error.message}
              </AlertDescription>
            </Alert>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No public projects found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'Try adjusting your search query' : 'Be the first to create a public project!'}
              </p>
              <ConnectWallet />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} readOnly />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Connected view - show user's projects
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Projects</h1>
        <p className="text-muted-foreground">
          Manage your documentation projects on Pure Irys BaaS
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button asChild>
          <Link to="/projects/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load projects: {error.message}
          </AlertDescription>
        </Alert>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first project to get started'
            }
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link to="/projects/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPure() {
  return <DashboardContent />;
}
