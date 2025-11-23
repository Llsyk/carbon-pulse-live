import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryItem {
  label: string;   // "PM2.5", "PM10", "NO₂", "CO", "O₃"
  value: number;   // raw value from API
  unit: string;    // "µg/m³", "ppb", etc.
}

interface Props {
  data: CategoryItem[];
}

const COLORS = [
  "#EF4444", // PM2.5  – red
  "#F59E0B", // PM10   – orange/yellow
  "#3B82F6", // NO₂    – blue
  "#81920eff", // CO     – brown
  "#166534", // O₃     – dark green
];

// You can tweak these to get a nicer balance
const NORMALIZATION_LIMITS: Record<string, number> = {
  "PM2.5": 75,    // µg/m³
  "PM10": 150,    // µg/m³
  "NO₂": 200,     // ppb
  "CO": 1000,     // ppb (or your preferred scale)
  "O₃": 200,      // ppb
};

const EmissionsByCategoryChart = ({ data }: Props) => {
  // Coerce to numbers, normalize, and attach colors
  const normalizedData = data
    .map((item) => ({
      ...item,
      raw: Number(item.value ?? 0),
    }))
    .map((item, idx) => {
      const limit = NORMALIZATION_LIMITS[item.label] ?? 1;
      const normalized =
        limit > 0 && Number.isFinite(item.raw) ? item.raw / limit : 0;

      return {
        name: item.label,
        value: normalized,          // used by pie for size
        rawValue: item.raw,         // shown in tooltip
        unit: item.unit ?? "",
        color: COLORS[idx % COLORS.length],
      };
    });

  const total = Math.max(
    normalizedData.reduce((sum, item) => sum + item.value, 0),
    1
  );

  return (
    <Card id="chart-by-category" className="shadow-card">
      <CardHeader>
        <CardTitle>Pollutants by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={normalizedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) =>
                `${name}: ${((value / total) * 100).toFixed(1)}%`
              }
              outerRadius={90}
              dataKey="value"
            >
              {normalizedData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(_value, _name, payload) => {
                const p = payload as any;
                const raw = p?.payload?.rawValue;
                const unit = p?.payload?.unit;
                if (typeof raw === "number") {
                  return [`${raw.toFixed(2)} ${unit}`, "Value"];
                }
                return ["N/A", "Value"];
              }}
              labelFormatter={(label) => `Pollutant: ${label}`}
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
