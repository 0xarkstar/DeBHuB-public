import { useQuery } from '@apollo/client';
import { Plus, Search, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GET_MY_PROJECTS, GET_PUBLIC_PROJECTS } from '@/lib/graphql/queries';
import { ConnectWallet } from '@/components/ConnectWallet';

function DashboardContent() {
  const { isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's projects if connected, otherwise fetch public projects
  const { data, loading, error } = useQuery(
    isConnected ? GET_MY_PROJECTS : GET_PUBLIC_PROJECTS,
    {
      variables: { limit: 50, offset: 0 },
    }
  );

  const projects = data?.myProjects || data?.publicProjects || [];

  // Add mock storage data for projects (until backend implements storage metrics)
  const projectsWithStorage = projects.map((project: any, index: number) => {
    // Only add storage data if not already present from backend
    if (project.storage && project.syncStatus !== undefined) {
      return project;
    }

    // Mock storage metrics based on document count
    const baseGB = Math.max(0.01, project.documentsCount * 0.15); // ~150MB per doc
    const variation = (index % 5) * 0.1; // Add some variation
    const irysGB = parseFloat((baseGB + variation).toFixed(2));
    const monthlyCostUSD = parseFloat((irysGB * 2.5).toFixed(2)); // ~$2.50/GB

    const syncStatuses = ['synced', 'pending', 'conflict'] as const;
    const syncStatus = syncStatuses[index % 3];

    return {
      ...project,
      storage: { irysGB, monthlyCostUSD },
      syncStatus,
    };
  });

  const filteredProjects = projectsWithStorage.filter((project: any) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-3">Welcome to IrysBase</h2>
            <p className="text-lg mb-6 text-indigo-100">
              Explore decentralized documentation projects powered by Irys permanent storage
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
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-red-600 mb-2">Failed to load public projects</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
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
              {filteredProjects.map((project: any) => (
                <ProjectCard key={project.id} project={project} readOnly />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Projects</h1>
        <p className="text-muted-foreground">
          Manage your documentation projects on IrysBase
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
        <div className="text-center py-12">
          <p className="text-red-600 mb-2">Failed to load projects</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
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
          {filteredProjects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  // Remove WalletGuard to allow read-only access
  return <DashboardContent />;
}
