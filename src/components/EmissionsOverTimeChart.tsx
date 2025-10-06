import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TimeseriesData {
  month: string;
  energy: number;
  transport: number;
  waste: number;
}

interface EmissionsOverTimeChartProps {
  data: TimeseriesData[];
}

const EmissionsOverTimeChart = ({ data }: EmissionsOverTimeChartProps) => {
  return (
    <Card id="chart-over-time" className="shadow-card">
      <CardHeader>
        <CardTitle>Emissions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="energy" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name="Energy"
            />
            <Line 
              type="monotone" 
              dataKey="transport" 
              stroke="hsl(var(--warning))" 
              strokeWidth={2}
              name="Transport"
            />
            <Line 
              type="monotone" 
              dataKey="waste" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Waste"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EmissionsOverTimeChart;
