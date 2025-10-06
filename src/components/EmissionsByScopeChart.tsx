import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ScopesData {
  scope1: number;
  scope2: number;
  scope3: number;
}

interface EmissionsByScopeChartProps {
  data: ScopesData;
}

const COLORS = {
  scope1: 'hsl(var(--destructive))',
  scope2: 'hsl(var(--warning))',
  scope3: 'hsl(var(--accent))',
};

const EmissionsByScopeChart = ({ data }: EmissionsByScopeChartProps) => {
  const chartData = [
    { name: 'Scope 1', value: data.scope1 * 100, color: COLORS.scope1 },
    { name: 'Scope 2', value: data.scope2 * 100, color: COLORS.scope2 },
    { name: 'Scope 3', value: data.scope3 * 100, color: COLORS.scope3 },
  ];

  return (
    <Card id="chart-by-scope" className="shadow-card">
      <CardHeader>
        <CardTitle>Emissions by Scope</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EmissionsByScopeChart;
