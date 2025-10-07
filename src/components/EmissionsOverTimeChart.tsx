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
  energy: number;
  transport: number;
  waste: number;
};

interface EmissionsOverTimeChartProps {
  data: Point[];
}

const COLORS = {
  energy: "hsl(var(--destructive))",
  transport: "hsl(var(--warning))",
  waste: "hsl(var(--primary))",
};

function numberFmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

// Tooltip content — simple and clear
function TooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    const items = payload
      .filter((p) => p && p.value != null)
      .map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {numberFmt(p.value as number)}
        </div>
      ));
    const total = payload.reduce((acc, p) => acc + (Number(p?.value) || 0), 0);
    return (
      <div
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 8,
          padding: "8px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div className="font-medium mb-1">{label}</div>
        {items}
        <div className="mt-1 text-sm text-muted-foreground">Total: {numberFmt(total)}</div>
      </div>
    );
  }
  return null;
}

const EmissionsOverTimeChart = ({ data }: EmissionsOverTimeChartProps) => {
  // Defensive: ensure numeric values and non-empty data
  const safeData: Point[] =
    Array.isArray(data) && data.length
      ? data.map((d) => ({
          month: d.month ?? "",
          energy: Number.isFinite(d.energy) ? d.energy : 0,
          transport: Number.isFinite(d.transport) ? d.transport : 0,
          waste: Number.isFinite(d.waste) ? d.waste : 0,
        }))
      : [];

  const hasAnyData =
    safeData.length > 0 &&
    safeData.some((d) => (d.energy || d.transport || d.waste) > 0);

  return (
    <Card id="chart-over-time" className="shadow-card">
      <CardHeader>
        <CardTitle>Emissions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAnyData ? (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={safeData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.energy} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.energy} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillTransport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.transport} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.transport} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillWaste" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.waste} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.waste} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tickMargin={8} />
              <YAxis
                tickFormatter={(v) => numberFmt(v as number)}
                width={70}
              />
              <RTooltip content={<TooltipContent />} />
              <Legend />

              {/* stacked areas */}
              <Area
                type="monotone"
                dataKey="energy"
                name="Energy"
                stroke={COLORS.energy}
                fill="url(#fillEnergy)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="transport"
                name="Transport"
                stroke={COLORS.transport}
                fill="url(#fillTransport)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="waste"
                name="Waste"
                stroke={COLORS.waste}
                fill="url(#fillWaste)"
                stackId="1"
              />

              {/* allows horizontal scrubbing if you have many months */}
              <Brush height={20} travellerWidth={8} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[340px] flex items-center justify-center text-sm text-muted-foreground">
            No time series data available for the selected filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmissionsOverTimeChart;
