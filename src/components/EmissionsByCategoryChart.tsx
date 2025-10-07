import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoriesData {
  energy: number;
  transport: number;
  waste: number;
}
interface Props { data: CategoriesData; }

const COLORS = {
  energy: "hsl(var(--destructive))",
  transport: "hsl(var(--warning))",
  waste: "hsl(var(--primary))",
};

const EmissionsByCategoryChart = ({ data }: Props) => {
  const total = Math.max(data.energy + data.transport + data.waste, 1);
  const chartData = [
    { name: "Energy", value: data.energy, color: COLORS.energy },
    { name: "Transport", value: data.transport, color: COLORS.transport },
    { name: "Waste", value: data.waste, color: COLORS.waste },
  ];

  return (
    <Card id="chart-by-category" className="shadow-card">
      <CardHeader><CardTitle>Emissions by Category</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${Math.round((value / total) * 100)}%`}
              outerRadius={90}
              dataKey="value"
            >
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EmissionsByCategoryChart;
