import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentCreationChartProps {
  data: Array<{
    date: string;
    documents: number;
  }>;
}

export function DocumentCreationChart({ data }: DocumentCreationChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Creation Rate</CardTitle>
        <CardDescription>
          Number of documents created per day (last 30 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
                label={{ value: 'Documents', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value: number) => [value, 'Documents']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="documents"
                name="Documents Created"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
