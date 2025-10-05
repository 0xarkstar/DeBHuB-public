import { BarChart3, DollarSign, FileText, HardDrive, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StorageGrowthChart } from '@/components/usage/StorageGrowthChart';
import { DocumentCreationChart } from '@/components/usage/DocumentCreationChart';
import { CostTrendsChart } from '@/components/usage/CostTrendsChart';

// Generate mock chart data for last 30 days
const generateMockChartData = () => {
  const days = 30;
  const storageData = [];
  const documentData = [];
  const costData = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString();

    // Storage grows over time with some variation
    const baseStorage = 80 + ((days - i) * 1.5);
    const storageVariation = Math.random() * 5;

    // Document creation varies by day
    const baseDocuments = 8 + Math.floor(Math.random() * 15);

    // Cost increases with storage
    const baseCost = 8 + ((days - i) * 0.15);
    const costVariation = Math.random() * 2;

    storageData.push({
      date: dateStr,
      storageGB: parseFloat((baseStorage + storageVariation).toFixed(2)),
    });

    documentData.push({
      date: dateStr,
      documents: baseDocuments,
    });

    costData.push({
      date: dateStr,
      cost: parseFloat((baseCost + costVariation).toFixed(2)),
    });
  }

  return { storageData, documentData, costData };
};

export default function UsagePage() {
  // Generate mock chart data
  const { storageData, documentData, costData } = generateMockChartData();

  // Mock data for development
  const mockData = {
    overview: {
      totalDocuments: 347,
      totalStorageGB: 125.8,
      totalTransactions: 892,
      monthlyCostUSD: 314.50,
    },
    projects: [
      {
        id: '1',
        name: 'Product Documentation',
        documentsCount: 145,
        storageGB: 52.3,
        monthlyCostUSD: 130.75,
        lastUpdated: '2025-10-05T14:30:00Z',
      },
      {
        id: '2',
        name: 'API Reference',
        documentsCount: 89,
        storageGB: 34.1,
        monthlyCostUSD: 85.25,
        lastUpdated: '2025-10-04T09:15:00Z',
      },
      {
        id: '3',
        name: 'Internal Wiki',
        documentsCount: 78,
        storageGB: 28.7,
        monthlyCostUSD: 71.75,
        lastUpdated: '2025-10-03T16:45:00Z',
      },
      {
        id: '4',
        name: 'User Guides',
        documentsCount: 35,
        storageGB: 10.7,
        monthlyCostUSD: 26.75,
        lastUpdated: '2025-10-02T11:20:00Z',
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        date: '2025-10-06T08:30:00Z',
        type: 'PUBLISH',
        document: 'Getting Started Guide',
        irysId: 'abc123def456ghi789',
        cost: 0.05,
        status: 'COMPLETED',
      },
      {
        id: 'tx-2',
        date: '2025-10-05T15:45:00Z',
        type: 'PUBLISH',
        document: 'API Endpoints Reference',
        irysId: 'def456ghi789jkl012',
        cost: 0.12,
        status: 'COMPLETED',
      },
      {
        id: 'tx-3',
        date: '2025-10-05T10:20:00Z',
        type: 'SYNC',
        document: 'Architecture Overview',
        irysId: 'ghi789jkl012mno345',
        cost: 0.08,
        status: 'COMPLETED',
      },
      {
        id: 'tx-4',
        date: '2025-10-04T14:10:00Z',
        type: 'PUBLISH',
        document: 'Installation Instructions',
        irysId: 'jkl012mno345pqr678',
        cost: 0.03,
        status: 'FAILED',
      },
      {
        id: 'tx-5',
        date: '2025-10-04T09:30:00Z',
        type: 'PUBLISH',
        document: 'Troubleshooting Guide',
        irysId: 'mno345pqr678stu901',
        cost: 0.07,
        status: 'COMPLETED',
      },
    ],
  };

  // Temporarily disable real query until backend is ready
  const loading = false;
  const data = null;

  const usageData = data || mockData;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting usage report as ${format.toUpperCase()}`);
    // TODO: Implement export functionality
    alert(`Export as ${format.toUpperCase()} - Coming soon!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Usage & Analytics</h1>
          <p className="text-muted-foreground">
            Track your storage usage, costs, and transaction history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              {loading ? <Skeleton className="h-9 w-20" /> : usageData.overview.totalDocuments.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Storage</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <HardDrive className="h-6 w-6 text-purple-600" />
              {loading ? <Skeleton className="h-9 w-20" /> : `${usageData.overview.totalStorageGB.toFixed(1)} GB`}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-green-600" />
              {loading ? <Skeleton className="h-9 w-20" /> : usageData.overview.totalTransactions.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monthly Cost</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              {loading ? <Skeleton className="h-9 w-20" /> : formatCurrency(usageData.overview.monthlyCostUSD)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <StorageGrowthChart data={storageData} />
        </div>
        <DocumentCreationChart data={documentData} />
        <CostTrendsChart data={costData} />
      </div>

      {/* Per-Project Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Storage by Project</CardTitle>
          <CardDescription>
            View storage usage and costs for each project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Project Name</th>
                    <th className="pb-3 font-medium text-right">Documents</th>
                    <th className="pb-3 font-medium text-right">Storage (GB)</th>
                    <th className="pb-3 font-medium text-right">Monthly Cost</th>
                    <th className="pb-3 font-medium text-right">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="py-3 text-right">
                          <Skeleton className="h-4 w-12 ml-auto" />
                        </td>
                        <td className="py-3 text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </td>
                        <td className="py-3 text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </td>
                        <td className="py-3 text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    usageData.projects.map((project: any) => (
                      <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 font-medium">{project.name}</td>
                        <td className="py-3 text-right text-muted-foreground">
                          {project.documentsCount}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {project.storageGB.toFixed(1)} GB
                        </td>
                        <td className="py-3 text-right font-medium text-green-600">
                          {formatCurrency(project.monthlyCostUSD)}
                        </td>
                        <td className="py-3 text-right text-sm text-muted-foreground">
                          {formatDate(project.lastUpdated)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {!loading && (
                  <tfoot>
                    <tr className="font-semibold">
                      <td className="pt-3">Total</td>
                      <td className="pt-3 text-right">
                        {usageData.projects.reduce((sum: number, p: any) => sum + p.documentsCount, 0)}
                      </td>
                      <td className="pt-3 text-right">
                        {usageData.projects.reduce((sum: number, p: any) => sum + p.storageGB, 0).toFixed(1)} GB
                      </td>
                      <td className="pt-3 text-right text-green-600">
                        {formatCurrency(usageData.projects.reduce((sum: number, p: any) => sum + p.monthlyCostUSD, 0))}
                      </td>
                      <td className="pt-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            View your recent Irys publishing and sync transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Document</th>
                  <th className="pb-3 font-medium">Irys TX ID</th>
                  <th className="pb-3 font-medium text-right">Cost</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </td>
                      <td className="py-3 text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  usageData.transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 text-sm text-muted-foreground">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          tx.type === 'PUBLISH'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 font-medium">{tx.document}</td>
                      <td className="py-3">
                        <a
                          href={`https://gateway.irys.xyz/${tx.irysId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm font-mono"
                        >
                          {tx.irysId.slice(0, 8)}...{tx.irysId.slice(-6)}
                        </a>
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {formatCurrency(tx.cost)}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          tx.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : tx.status === 'PENDING'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
