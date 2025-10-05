import { Database, HardDrive, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StorageOverviewProps {
  totalSize: number; // in bytes
  totalCost: number; // in USD
  transactionCount: number;
  avgCostPerGB: number;
}

export function StorageOverview({
  totalSize,
  totalCost,
  transactionCount,
  avgCostPerGB,
}: StorageOverviewProps) {
  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Storage on Irys',
      value: `${formatSize(totalSize)} GB`,
      icon: Database,
      description: 'Permanent storage used',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Lifetime Cost',
      value: formatCurrency(totalCost),
      icon: DollarSign,
      description: 'Total spent on storage',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Irys Transactions',
      value: transactionCount.toLocaleString(),
      icon: Activity,
      description: 'Total uploads to Irys',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Average Cost per GB',
      value: formatCurrency(avgCostPerGB),
      icon: HardDrive,
      description: 'Cost efficiency',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
