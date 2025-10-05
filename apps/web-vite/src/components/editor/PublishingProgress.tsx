import { Upload, Send, Database, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PublishingStage = 'uploading' | 'broadcasting' | 'syncing' | 'completed';

interface PublishingProgressProps {
  stage: PublishingStage;
}

export function PublishingProgress({ stage }: PublishingProgressProps) {
  const stages = [
    {
      id: 'uploading' as PublishingStage,
      label: 'Uploading to Irys',
      description: 'Uploading your document to permanent storage...',
      icon: Upload,
    },
    {
      id: 'broadcasting' as PublishingStage,
      label: 'Broadcasting to IrysVM',
      description: 'Submitting transaction to blockchain...',
      icon: Send,
    },
    {
      id: 'syncing' as PublishingStage,
      label: 'Syncing to PostgreSQL',
      description: 'Updating query cache for fast access...',
      icon: Database,
    },
    {
      id: 'completed' as PublishingStage,
      label: 'Published Successfully',
      description: 'Your document is now permanently stored!',
      icon: CheckCircle,
    },
  ];

  const currentStageIndex = stages.findIndex((s) => s.id === stage);

  return (
    <Card className="border-2 border-purple-200">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-purple-900 mb-1">
              Publishing to Irys
            </h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your document
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {stages.map((stageItem, index) => {
              const Icon = stageItem.icon;
              const isActive = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              const isPending = index > currentStageIndex;

              return (
                <div key={stageItem.id} className="relative">
                  {/* Connector Line */}
                  {index < stages.length - 1 && (
                    <div
                      className={cn(
                        'absolute left-6 top-12 w-0.5 h-8',
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      )}
                    />
                  )}

                  {/* Stage Item */}
                  <div
                    className={cn(
                      'flex items-start gap-4 p-3 rounded-lg transition-colors',
                      isActive && 'bg-purple-50 border border-purple-200',
                      isCompleted && 'bg-green-50 border border-green-200',
                      isPending && 'bg-gray-50 border border-gray-200'
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'p-2 rounded-full flex-shrink-0',
                        isActive && 'bg-purple-600',
                        isCompleted && 'bg-green-600',
                        isPending && 'bg-gray-300'
                      )}
                    >
                      {isActive ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            (isActive || isCompleted) && 'text-white',
                            isPending && 'text-gray-500'
                          )}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <h4
                        className={cn(
                          'font-semibold',
                          isActive && 'text-purple-900',
                          isCompleted && 'text-green-900',
                          isPending && 'text-gray-500'
                        )}
                      >
                        {stageItem.label}
                      </h4>
                      <p
                        className={cn(
                          'text-sm mt-0.5',
                          isActive && 'text-purple-700',
                          isCompleted && 'text-green-700',
                          isPending && 'text-gray-400'
                        )}
                      >
                        {stageItem.description}
                      </p>
                    </div>

                    {/* Status Indicator */}
                    {isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              This process usually takes 10-30 seconds
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
