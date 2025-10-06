import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import KPICard from "@/components/KPICard";
import SummaryTile from "@/components/SummaryTile";

/** ---------------- Types ---------------- */
type Status = "normal" | "moderate" | "bad" | "worst";

type City = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  metrics: {
    aqi: number;           // overall AQI
    pm25: number;          // µg/m³
    no2: number;           // ppb
    o3: number;            // ppb
    target: { pm25: number; no2: number; o3: number };
    timeseries: { month: string; pm25: number; no2: number; o3: number }[];
  };
};

/** ---------------- Demo data: ASEAN-10 ----------------
 * (Feel free to replace with API-fed values later)
 */
const ASEAN_CITIES: City[] = [
  // Myanmar
  {
    id: "YGN", name: "Yangon", country: "Myanmar", lat: 16.8661, lng: 96.1951,
    metrics: {
      aqi: 128, pm25: 42, no2: 25, o3: 31,
      target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 38, no2: 22, o3: 28 },
        { month: "Feb", pm25: 41, no2: 24, o3: 30 },
        { month: "Mar", pm25: 44, no2: 25, o3: 33 },
        { month: "Apr", pm25: 46, no2: 26, o3: 31 },
        { month: "May", pm25: 42, no2: 25, o3: 29 },
        { month: "Jun", pm25: 39, no2: 23, o3: 27 },
      ],
    },
  },
  // Thailand
  {
    id: "BKK", name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018,
    metrics: {
      aqi: 103, pm25: 31, no2: 27, o3: 35,
      target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 28, no2: 24, o3: 30 },
        { month: "Feb", pm25: 30, no2: 25, o3: 32 },
        { month: "Mar", pm25: 33, no2: 27, o3: 36 },
        { month: "Apr", pm25: 32, no2: 26, o3: 35 },
        { month: "May", pm25: 30, no2: 27, o3: 34 },
        { month: "Jun", pm25: 29, no2: 26, o3: 33 },
      ],
    },
  },
  // Indonesia
  {
    id: "JKT", name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456,
    metrics: {
      aqi: 142, pm25: 54, no2: 29, o3: 28,
      target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 49, no2: 27, o3: 26 },
        { month: "Feb", pm25: 52, no2: 28, o3: 27 },
        { month: "Mar", pm25: 55, no2: 30, o3: 29 },
        { month: "Apr", pm25: 57, no2: 31, o3: 28 },
        { month: "May", pm25: 53, no2: 29, o3: 27 },
        { month: "Jun", pm25: 51, no2: 28, o3: 28 },
      ],
    },
  },
  // Vietnam
  {
    id: "HAN", name: "Hanoi", country: "Vietnam", lat: 21.0278, lng: 105.8342,
    metrics: {
      aqi: 156, pm25: 62, no2: 33, o3: 24,
      target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 55, no2: 29, o3: 22 },
        { month: "Feb", pm25: 58, no2: 30, o3: 23 },
        { month: "Mar", pm25: 63, no2: 32, o3: 24 },
        { month: "Apr", pm25: 66, no2: 33, o3: 25 },
        { month: "May", pm25: 61, no2: 32, o3: 24 },
        { month: "Jun", pm25: 59, no2: 31, o3: 23 },
      ],
    },
  },
  // Philippines
  {
    id: "MNL", name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842,
    metrics: {
      aqi: 118, pm25: 39, no2: 26, o3: 37,
      target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 34, no2: 22, o3: 35 },
        { month: "Feb", pm25: 36, no2: 24, o3: 36 },
        { month: "Mar", pm25: 40, no2: 26, o3: 38 },
        { month: "Apr", pm25: 41, no2: 27, o3: 37 },
        { month: "May", pm25: 39, no2: 26, o3: 36 },
        { month: "Jun", pm25: 37, no2: 25, o3: 35 },
      ],
    },
  },
  // Malaysia
  {
    id: "KUL", name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869,
    metrics: {
      aqi: 92, pm25: 24, no2: 21, o3: 32,
      target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 22, no2: 19, o3: 30 },
        { month: "Feb", pm25: 23, no2: 20, o3: 31 },
        { month: "Mar", pm25: 25, no2: 21, o3: 33 },
        { month: "Apr", pm25: 24, no2: 21, o3: 32 },
        { month: "May", pm25: 23, no2: 20, o3: 31 },
        { month: "Jun", pm25: 22, no2: 19, o3: 30 },
      ],
    },
  },
  // Singapore
  {
    id: "SGP", name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198,
    metrics: {
      aqi: 71, pm25: 18, no2: 17, o3: 28,
      target: { pm25: 15, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 16, no2: 15, o3: 26 },
        { month: "Feb", pm25: 17, no2: 16, o3: 27 },
        { month: "Mar", pm25: 19, no2: 17, o3: 29 },
        { month: "Apr", pm25: 20, no2: 17, o3: 28 },
        { month: "May", pm25: 18, no2: 16, o3: 28 },
        { month: "Jun", pm25: 17, no2: 16, o3: 27 },
      ],
    },
  },
  // Cambodia
  {
    id: "PNH", name: "Phnom Penh", country: "Cambodia", lat: 11.5564, lng: 104.9282,
    metrics: {
      aqi: 109, pm25: 33, no2: 23, o3: 34,
      target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 29, no2: 21, o3: 32 },
        { month: "Feb", pm25: 31, no2: 22, o3: 33 },
        { month: "Mar", pm25: 34, no2: 23, o3: 35 },
        { month: "Apr", pm25: 35, no2: 24, o3: 34 },
        { month: "May", pm25: 33, no2: 23, o3: 34 },
        { month: "Jun", pm25: 32, no2: 22, o3: 33 },
      ],
    },
  },
  // Laos
  {
    id: "VTE", name: "Vientiane", country: "Laos", lat: 17.9757, lng: 102.6331,
    metrics: {
      aqi: 97, pm25: 27, no2: 18, o3: 29,
      target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 24, no2: 16, o3: 27 },
        { month: "Feb", pm25: 26, no2: 17, o3: 28 },
        { month: "Mar", pm25: 28, no2: 18, o3: 30 },
        { month: "Apr", pm25: 29, no2: 19, o3: 29 },
        { month: "May", pm25: 27, no2: 18, o3: 29 },
        { month: "Jun", pm25: 26, no2: 17, o3: 28 },
      ],
    },
  },
  // Brunei
  {
    id: "BSB", name: "Bandar Seri Begawan", country: "Brunei", lat: 4.9031, lng: 114.9398,
    metrics: {
      aqi: 65, pm25: 16, no2: 14, o3: 26,
      target: { pm25: 15, no2: 40, o3: 60 },
      timeseries: [
        { month: "Jan", pm25: 14, no2: 12, o3: 24 },
        { month: "Feb", pm25: 15, no2: 13, o3: 25 },
        { month: "Mar", pm25: 16, no2: 14, o3: 26 },
        { month: "Apr", pm25: 17, no2: 14, o3: 26 },
        { month: "May", pm25: 16, no2: 14, o3: 26 },
        { month: "Jun", pm25: 15, no2: 13, o3: 25 },
      ],
    },
  },
];

/** ---------------- Map bounds (ASEAN region) ---------------- */
const mapBounds: [[number, number], [number, number]] = [
  [-12, 92],  // SW
  [25, 135],  // NE
];

/** ---------------- Helpers ---------------- */
function getStatusFromAQI(aqi: number): Status {
  if (aqi <= 50) return "normal";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "bad";
  return "worst";
}

const statusLabel: Record<Status, string> = {
  normal: "Normal",
  moderate: "Moderate",
  bad: "Bad",
  worst: "Worst",
};

// Tailwind color system for tones (applied to wrappers)
const toneClasses: Record<Status, { ring: string; bg: string; text: string; chip: string; marker: { stroke: string; fill: string } }> = {
  normal:   { ring: "ring-emerald-300", bg: "bg-emerald-50", text: "text-emerald-800", chip: "bg-emerald-100 text-emerald-800",
              marker: { stroke: "hsl(142 70% 30%)", fill: "hsl(142 70% 42%)" } },
  moderate: { ring: "ring-amber-300",   bg: "bg-amber-50",   text: "text-amber-800",   chip: "bg-amber-100 text-amber-800",
              marker: { stroke: "hsl(38 90% 38%)",  fill: "hsl(38 90% 50%)" } },
  bad:      { ring: "ring-orange-300",  bg: "bg-orange-50",  text: "text-orange-800",  chip: "bg-orange-100 text-orange-800",
              marker: { stroke: "hsl(24 90% 38%)",  fill: "hsl(24 90% 49%)" } },
  worst:    { ring: "ring-rose-300",    bg: "bg-rose-50",    text: "text-rose-800",    chip: "bg-rose-100 text-rose-800",
              marker: { stroke: "hsl(0 80% 38%)",   fill: "hsl(0 80% 46%)" } },
};

/** Small sparkline for the right column (no external lib) */
function Sparkline({ series, color = "hsl(142 60% 40%)" }:{
  series: number[];
  color?: string;
}) {
  const points = useMemo(() => {
    const w = 180, h = 48, pad = 4;
    const max = Math.max(...series), min = Math.min(...series);
    const span = Math.max(1, max - min);
    return series.map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (series.length - 1);
      const y = h - pad - ((v - min) * (h - pad * 2)) / span;
      return `${x},${y}`;
    }).join(" ");
  }, [series]);

  return (
    <svg width={180} height={48} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} />
    </svg>
  );
}

/** Legend overlay */
function Legend() {
  const items: { label: string; tone: Status }[] = [
    { label: "Normal (0–50)", tone: "normal" },
    { label: "Moderate (51–100)", tone: "moderate" },
    { label: "Bad (101–150)", tone: "bad" },
    { label: "Worst (151+)", tone: "worst" },
  ];
  return (
    <div className="absolute top-12 left-3 z-[1000] rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow border mt-7">
      <div className="text-xs font-medium mb-1">AQI Legend</div>
      <div className="flex flex-col gap-1 mt-7">
        {items.map(({ label, tone }) => (
          <div key={tone} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: toneClasses[tone].marker.fill }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CityExplorer() {
  const [selected, setSelected] = useState<City | null>(ASEAN_CITIES[0]);

  const selectedStatus: Status | null = selected ? getStatusFromAQI(selected.metrics.aqi) : null;
  const tone = selectedStatus ? toneClasses[selectedStatus] : toneClasses["normal"];

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column — Map */}
      
      <div className="relative rounded-lg  shadow-card overflow-hidden mt-7 ml-5">
         <h1 className="text-xl md:text-2xl font-semibold text-[hsl(150_30%_12%)]">
    ASEAN Capitals Explorer 
  </h1>
        <div className="h-[520px]">
           
          <MapContainer
            bounds={mapBounds}
            scrollWheelZoom={true}
            className="h-full w-full rounded-lg mt-10"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {ASEAN_CITIES.map((c) => {
              const s = getStatusFromAQI(c.metrics.aqi);
              const m = toneClasses[s].marker;
              return (
                <CircleMarker
                  key={c.id}
                  center={[c.lat, c.lng]}
                  radius={10}
                  pathOptions={{
                    color: m.stroke,
                    fillColor: m.fill,
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => setSelected(c) }}
                >
                  <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                    <div className="text-xs">
                      <div className="font-medium">{c.name}</div>
                      <div className="opacity-80">{c.country}</div>
                      <div className="mt-1">AQI: <b>{c.metrics.aqi}</b> ({statusLabel[s]})</div>
                      <div>PM2.5: {c.metrics.pm25} µg/m³</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <Legend />
        </div>
      </div>

      {/* Right column — Details panel */}
      <div className={`rounded-lg border shadow-card p-5 ring-2 mt-7 mr-5 ${tone.ring} ${tone.bg}`}>
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${tone.text}`}>{selected.name}</h2>
                <p className="text-sm text-muted-foreground">{selected.country}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${tone.chip} border-black/5`}>
                {statusLabel[selectedStatus!]}
              </span>
            </div>

            {/* KPI row (AQI) — wrapped with tone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-xl p-0.5 ring-1 ${tone.ring}`}>
                <div className={`rounded-xl ${tone.bg}`}>
                  <KPICard
                    id="aqi"
                    title="City AQI"
                    value={selected.metrics.aqi}
                    unit="AQI"
                    // If your KPICard supports variant/className, also pass them:
                    // variant={selectedStatus}
                    // className={`${tone.text}`}
                  />
                </div>
              </div>
            </div>

            {/* Targets / progress — colorized wrappers per pollutant status against target */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "PM2.5", value: selected.metrics.pm25, target: selected.metrics.target.pm25, unit: "µg/m³" },
                { key: "NO₂",   value: selected.metrics.no2,   target: selected.metrics.target.no2,   unit: "ppb" },
                { key: "O₃",    value: selected.metrics.o3,    target: selected.metrics.target.o3,    unit: "ppb" },
              ].map(({ key, value, target, unit }) => {
                // status vs target: if <= target → normal; within 20% → moderate; within 50% → bad; above → worst
                const ratio = value / target;
                const st: Status = ratio <= 1 ? "normal" : ratio <= 1.2 ? "moderate" : ratio <= 1.5 ? "bad" : "worst";
                const t = toneClasses[st];
                return (
                  <div key={key} className={`rounded-xl p-0.5 ring-1 ${t.ring}`}>
                    <div className={`rounded-xl ${t.bg}`}>
                      <SummaryTile
                        title={key}
                        value={value}
                        target={target}
                        unit={unit}
                        // If SummaryTile supports styling:
                        // className={`${t.text}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini trends */}
            <div className="rounded-lg border bg-white p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Monthly Trend</h3>
              <div className="flex gap-6 items-end">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">PM2.5</div>
                  <Sparkline
                    series={selected.metrics.timeseries.map(t => t.pm25)}
                    color="hsl(0 70% 50%)"   // red
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">NO₂</div>
                  <Sparkline
                    series={selected.metrics.timeseries.map(t => t.no2)}
                    color="hsl(142 60% 40%)" // green
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">O₃</div>
                  <Sparkline
                    series={selected.metrics.timeseries.map(t => t.o3)}
                    color="hsl(210 70% 45%)" // blue
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Click a city marker to view air-pollution details.</p>
        )}
      </div>
    </div>
  );
}
