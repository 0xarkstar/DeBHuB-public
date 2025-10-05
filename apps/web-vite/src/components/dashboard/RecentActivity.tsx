
import { FileText, GitBranch, MessageSquare, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ActivityType = 'DOCUMENT_CREATED' | 'VERSION_CREATED' | 'COMMENT_ADDED';

interface Activity {
  type: ActivityType;
  timestamp: string;
  userId: string;
  description: string;
  metadata?: Record<string, any>;
}

interface RecentActivityProps {
  activities: Activity[];
  limit?: number;
}

export function RecentActivity({ activities, limit = 10 }: RecentActivityProps) {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'DOCUMENT_CREATED':
        return FileText;
      case 'VERSION_CREATED':
        return GitBranch;
      case 'COMMENT_ADDED':
        return MessageSquare;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'DOCUMENT_CREATED':
        return 'text-blue-600 bg-blue-50';
      case 'VERSION_CREATED':
        return 'text-purple-600 bg-purple-50';
      case 'COMMENT_ADDED':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const displayActivities = activities.slice(0, limit);

  if (displayActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No recent activity
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div
                key={`${activity.type}-${activity.timestamp}-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {activity.userId.slice(0, 6)}...{activity.userId.slice(-4)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
