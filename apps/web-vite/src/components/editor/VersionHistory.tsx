
import { useQuery, useMutation } from '@apollo/client';
import { History, RotateCcw, ExternalLink, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GET_DOCUMENT_HISTORY } from '@/lib/graphql/queries';
import { REVERT_TO_VERSION } from '@/lib/graphql/mutations';
import { cn } from '@/lib/utils';

interface VersionHistoryProps {
  documentId: string;
  onRevert?: () => void;
}

export function VersionHistory({ documentId, onRevert }: VersionHistoryProps) {
  const { data, loading, refetch } = useQuery(GET_DOCUMENT_HISTORY, {
    variables: { documentId },
  });

  const [revertToVersion, { loading: reverting }] = useMutation(REVERT_TO_VERSION);

  const handleRevert = async (versionId: string) => {
    if (!confirm('Are you sure you want to revert to this version?')) {
      return;
    }

    try {
      await revertToVersion({
        variables: {
          documentId,
          versionId,
        },
      });
      onRevert?.();
      refetch();
    } catch (error) {
      console.error('Failed to revert version:', error);
    }
  };

  const versions = data?.documentHistory || [];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No version history yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History ({versions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.map((version: any, index: number) => {
            const isLatest = index === 0;

            return (
              <div
                key={version.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  isLatest ? 'bg-primary/5 border-primary/20' : 'bg-background hover:bg-muted/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        'text-sm font-semibold',
                        isLatest && 'text-primary'
                      )}>
                        Version {version.versionNumber}
                      </span>
                      {isLatest && (
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                          Current
                        </span>
                      )}
                    </div>

                    {version.message && (
                      <p className="text-sm mb-2">{version.message}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {version.author.address.slice(0, 6)}...{version.author.address.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(version.createdAt)}</span>
                      </div>
                    </div>

                    {version.irysId && (
                      <div className="mt-2">
                        <a
                          href={`https://gateway.irys.xyz/${version.irysId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <span>View on Irys</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {!isLatest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevert(version.id)}
                      disabled={reverting}
                      className="ml-3"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" />
                      Revert
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
