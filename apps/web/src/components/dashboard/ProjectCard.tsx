'use client';

import Link from 'next/link';
import { Folder, FileText, Users, Clock, MoreVertical, Globe, Lock, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    documentsCount: number;
    collaboratorsCount: number;
    updatedAt: string;
    owner?: {
      address: string;
    };
  };
  showOwner?: boolean;
}

export function ProjectCard({ project, showOwner = false }: ProjectCardProps) {
  const getVisibilityIcon = () => {
    switch (project.visibility) {
      case 'PUBLIC':
        return <Globe className="h-3.5 w-3.5" />;
      case 'PRIVATE':
        return <Lock className="h-3.5 w-3.5" />;
      case 'UNLISTED':
        return <EyeOff className="h-3.5 w-3.5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/projects/${project.id}`}
                className="hover:underline"
              >
                <h3 className="font-semibold text-base truncate">
                  {project.name}
                </h3>
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  /{project.slug}
                </span>
                <div className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                  project.visibility === 'PUBLIC'
                    ? 'bg-green-100 text-green-700'
                    : project.visibility === 'PRIVATE'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                )}>
                  {getVisibilityIcon()}
                  <span>{project.visibility}</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {project.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No description
          </p>
        )}

        {showOwner && project.owner && (
          <div className="mt-3 text-xs text-muted-foreground">
            Owner: {project.owner.address.slice(0, 6)}...{project.owner.address.slice(-4)}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>{project.documentsCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{project.collaboratorsCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
