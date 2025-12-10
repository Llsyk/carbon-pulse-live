import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ASEANComparisonChart({ data }) {
  return (
    <div className="p-4 rounded-2xl bg-card shadow">
      <h3 className="text-lg font-semibold mb-4">ASEAN AQI Comparison</h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="country_name"
              angle={-25}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              label={{
                value: "AQI",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" }
              }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="aqi" fill="#f59e0b" name="AQI" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
