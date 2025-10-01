'use client';

import { FileText, GitBranch, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Metric {
  label: string;
  value: number;
  icon: typeof FileText;
  color: string;
  bgColor: string;
  change?: number;
}

interface MetricsOverviewProps {
  metrics: {
    totalDocuments: number;
    publishedDocuments: number;
    draftDocuments: number;
    totalVersions: number;
    totalComments: number;
    totalCollaborators: number;
  };
  className?: string;
}

export function MetricsOverview({ metrics, className }: MetricsOverviewProps) {
  const metricCards: Metric[] = [
    {
      label: 'Total Documents',
      value: metrics.totalDocuments,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Published',
      value: metrics.publishedDocuments,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Drafts',
      value: metrics.draftDocuments,
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Versions',
      value: metrics.totalVersions,
      icon: GitBranch,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Comments',
      value: metrics.totalComments,
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      label: 'Collaborators',
      value: metrics.totalCollaborators,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {metricCards.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card key={metric.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {metric.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">
                      {metric.value.toLocaleString()}
                    </p>
                    {metric.change !== undefined && (
                      <div className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        <TrendingUp className={cn(
                          'h-3 w-3',
                          metric.change < 0 && 'rotate-180'
                        )} />
                        <span>
                          {Math.abs(metric.change)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn('p-3 rounded-lg', metric.bgColor)}>
                  <Icon className={cn('h-6 w-6', metric.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
