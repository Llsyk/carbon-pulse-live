import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from "recharts";

type Point = {
  month: string;
  pm25: number;
  no2: number;
  co: number;
  o3: number;
  pm10: number;
};

interface EmissionsOverTimeChartProps {
  data: Point[];
}

const COLORS = {
  pm25: "hsl(var(--destructive))",
  no2: "hsl(var(--warning))",
  co: "hsl(var(--primary))",
  o3: "hsl(var(--secondary))",
  pm10: "hsl(var(--accent))",
};

function numberFmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n);
}

function TooltipContent({ active, payload, label }: any) {
  if (active && payload?.length) {
    const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);

    return (
      <div
        style={{
          background: "hsl(var(--card))",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div className="font-medium mb-1">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ color: p.color }}>
            {p.name}: {numberFmt(p.value)}
          </div>
        ))}
        <div className="mt-1 text-sm text-muted-foreground">
          Total: {numberFmt(total)}
        </div>
      </div>
    );
  }
  return null;
}

const EmissionsOverTimeChart = ({ data }: EmissionsOverTimeChartProps) => {
  const safeData =
    Array.isArray(data)
      ? data.map((d) => ({
          month: d.month,
          pm25: d.pm25 ?? 0,
          no2: d.no2 ?? 0,
          co: d.co ?? 0,
          o3: d.o3 ?? 0,
          pm10: d.pm10 ?? 0,
        }))
      : [];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Pollutant Levels Over Time</CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={safeData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              {Object.keys(COLORS).map((key) => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[key]} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS[key]} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" />
            <YAxis width={60} tickFormatter={(v) => numberFmt(v)} />
            <RTooltip content={<TooltipContent />} />
            <Legend />

            <Area type="monotone" dataKey="pm25" name="PM2.5" stroke={COLORS.pm25} fill="url(#fill-pm25)" stackId="1" />
            <Area type="monotone" dataKey="pm10" name="PM10" stroke={COLORS.pm10} fill="url(#fill-pm10)" stackId="1" />
            <Area type="monotone" dataKey="no2" name="NO₂" stroke={COLORS.no2} fill="url(#fill-no2)" stackId="1" />
            <Area type="monotone" dataKey="co" name="CO" stroke={COLORS.co} fill="url(#fill-co)" stackId="1" />
            <Area type="monotone" dataKey="o3" name="O₃" stroke={COLORS.o3} fill="url(#fill-o3)" stackId="1" />

            <Brush height={20} travellerWidth={8} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EmissionsOverTimeChart;
