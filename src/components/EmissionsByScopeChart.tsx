import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Last5DaysPollutantsChart({ data }) {
  if (!data || data.length === 0)
    return <div>No historical data available.</div>;

  // Generate last 5 days dates because API doesn't give timestamps
  const formattedData = data.map((d, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (data.length - 1 - i));

    return {
      ...d,
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })
    };
  });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Pollutant Levels — Last 10 Days</CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={formattedData}>
          <XAxis dataKey="date" />
          <YAxis
            label={{
              value: "µg/m³",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" }
            }}
          />
          <Tooltip />
          <Legend />

          <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#ff6384" />
          <Line type="monotone" dataKey="pm10" name="PM10" stroke="#36a2eb" />
          <Line type="monotone" dataKey="no2"  name="NO₂"  stroke="#ffce56" />
          <Line type="monotone" dataKey="o3"   name="O₃"   stroke="#4bc0c0" />
          <Line type="monotone" dataKey="co"   name="CO"   stroke="#9966ff" />
          <Line type="monotone" dataKey="so2"  name="SO₂"  stroke="#ff9f40" />
        </LineChart>

        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
