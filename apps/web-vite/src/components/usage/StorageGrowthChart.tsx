import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StorageGrowthChartProps {
  data: Array<{
    date: string;
    storageGB: number;
  }>;
}

export function StorageGrowthChart({ data }: StorageGrowthChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Growth</CardTitle>
        <CardDescription>
          Total storage usage over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                label={{ value: 'Storage (GB)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value: number) => [`${value.toFixed(2)} GB`, 'Storage']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="storageGB"
                name="Storage (GB)"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
