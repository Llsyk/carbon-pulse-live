import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ASEANPollutantRadarProps {
  data: {
    country: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    co: number;
    so2: number;
    o3: number;
  }[];
}

export default function ASEANPollutantRadar({ data }: ASEANPollutantRadarProps) {
  const pollutants = ["pm25", "pm10", "no2", "co", "so2", "o3"];

  // 🔥 1. Find max value for each pollutant (across all countries)
  const maxValues: Record<string, number> = {};
  pollutants.forEach((p) => {
    maxValues[p] = Math.max(...data.map((c) => c[p]));
  });

  // 🔥 2. Create radar-friendly normalized dataset (0–100)
  const radarData = pollutants.map((p) => {
    const row: any = { pollutant: p.toUpperCase() };

    data.forEach((country) => {
      row[country.country] = (country[p] / maxValues[p]) * 100; // scale to 0–100
    });

    return row;
  });

  const colors = [
    "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
    "#6366f1", "#ec4899", "#14b8a6", "#a855f7",
    "#22c55e", "#e11d48", "#0ea5e9"
  ];

  return (
    <div className="p-4 rounded-2xl bg-card shadow">
      <h3 className="text-lg font-semibold mb-4">ASEAN Pollutant Comparison (Scaled)</h3>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius={160} data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="pollutant" />

            <PolarRadiusAxis angle={90} domain={[0, 100]} />

            <Tooltip />
            <Legend />

            {data.map((country, idx) => (
              <Radar
                key={country.country}
                dataKey={country.country}
                stroke={colors[idx % colors.length]}
                fill={colors[idx % colors.length]}
                fillOpacity={0.35}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
