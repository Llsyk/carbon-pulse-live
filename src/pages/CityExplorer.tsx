import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
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

/** ---------------- Demo data: ASEAN-10 (unchanged) ---------------- */
const ASEAN_CITIES: City[] = [
  { id: "YGN", name: "Yangon", country: "Myanmar", lat: 16.8661, lng: 96.1951,
    metrics: { aqi: 128, pm25: 42, no2: 25, o3: 31, target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 38, no2: 22, o3: 28 },{ month: "Feb", pm25: 41, no2: 24, o3: 30 },
                    { month: "Mar", pm25: 44, no2: 25, o3: 33 },{ month: "Apr", pm25: 46, no2: 26, o3: 31 },
                    { month: "May", pm25: 42, no2: 25, o3: 29 },{ month: "Jun", pm25: 39, no2: 23, o3: 27 } ] } },
  { id: "BKK", name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018,
    metrics: { aqi: 103, pm25: 31, no2: 27, o3: 35, target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 28, no2: 24, o3: 30 },{ month: "Feb", pm25: 30, no2: 25, o3: 32 },
                    { month: "Mar", pm25: 33, no2: 27, o3: 36 },{ month: "Apr", pm25: 32, no2: 26, o3: 35 },
                    { month: "May", pm25: 30, no2: 27, o3: 34 },{ month: "Jun", pm25: 29, no2: 26, o3: 33 } ] } },
  { id: "JKT", name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456,
    metrics: { aqi: 142, pm25: 54, no2: 29, o3: 28, target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 49, no2: 27, o3: 26 },{ month: "Feb", pm25: 52, no2: 28, o3: 27 },
                    { month: "Mar", pm25: 55, no2: 30, o3: 29 },{ month: "Apr", pm25: 57, no2: 31, o3: 28 },
                    { month: "May", pm25: 53, no2: 29, o3: 27 },{ month: "Jun", pm25: 51, no2: 28, o3: 28 } ] } },
  { id: "HAN", name: "Hanoi", country: "Vietnam", lat: 21.0278, lng: 105.8342,
    metrics: { aqi: 156, pm25: 62, no2: 33, o3: 24, target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 55, no2: 29, o3: 22 },{ month: "Feb", pm25: 58, no2: 30, o3: 23 },
                    { month: "Mar", pm25: 63, no2: 32, o3: 24 },{ month: "Apr", pm25: 66, no2: 33, o3: 25 },
                    { month: "May", pm25: 61, no2: 32, o3: 24 },{ month: "Jun", pm25: 59, no2: 31, o3: 23 } ] } },
  { id: "MNL", name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842,
    metrics: { aqi: 118, pm25: 39, no2: 26, o3: 37, target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 34, no2: 22, o3: 35 },{ month: "Feb", pm25: 36, no2: 24, o3: 36 },
                    { month: "Mar", pm25: 40, no2: 26, o3: 38 },{ month: "Apr", pm25: 41, no2: 27, o3: 37 },
                    { month: "May", pm25: 39, no2: 26, o3: 36 },{ month: "Jun", pm25: 37, no2: 25, o3: 35 } ] } },
  { id: "KUL", name: "Kuala Lumpur", country: "Malaysia", lat: 3.139, lng: 101.6869,
    metrics: { aqi: 92, pm25: 24, no2: 21, o3: 32, target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 22, no2: 19, o3: 30 },{ month: "Feb", pm25: 23, no2: 20, o3: 31 },
                    { month: "Mar", pm25: 25, no2: 21, o3: 33 },{ month: "Apr", pm25: 24, no2: 21, o3: 32 },
                    { month: "May", pm25: 23, no2: 20, o3: 31 },{ month: "Jun", pm25: 22, no2: 19, o3: 30 } ] } },
  { id: "SGP", name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198,
    metrics: { aqi: 71, pm25: 18, no2: 17, o3: 28, target: { pm25: 15, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 16, no2: 15, o3: 26 },{ month: "Feb", pm25: 17, no2: 16, o3: 27 },
                    { month: "Mar", pm25: 19, no2: 17, o3: 29 },{ month: "Apr", pm25: 20, no2: 17, o3: 28 },
                    { month: "May", pm25: 18, no2: 16, o3: 28 },{ month: "Jun", pm25: 17, no2: 16, o3: 27 } ] } },
  { id: "PNH", name: "Phnom Penh", country: "Cambodia", lat: 11.5564, lng: 104.9282,
    metrics: { aqi: 109, pm25: 33, no2: 23, o3: 34, target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 29, no2: 21, o3: 32 },{ month: "Feb", pm25: 31, no2: 22, o3: 33 },
                    { month: "Mar", pm25: 34, no2: 23, o3: 35 },{ month: "Apr", pm25: 35, no2: 24, o3: 34 },
                    { month: "May", pm25: 33, no2: 23, o3: 34 },{ month: "Jun", pm25: 32, no2: 22, o3: 33 } ] } },
  { id: "VTE", name: "Vientiane", country: "Laos", lat: 17.9757, lng: 102.6331,
    metrics: { aqi: 97, pm25: 27, no2: 18, o3: 29, target: { pm25: 25, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 24, no2: 16, o3: 27 },{ month: "Feb", pm25: 26, no2: 17, o3: 28 },
                    { month: "Mar", pm25: 28, no2: 18, o3: 30 },{ month: "Apr", pm25: 29, no2: 19, o3: 29 },
                    { month: "May", pm25: 27, no2: 18, o3: 29 },{ month: "Jun", pm25: 26, no2: 17, o3: 28 } ] } },
  { id: "BSB", name: "Bandar Seri Begawan", country: "Brunei", lat: 4.9031, lng: 114.9398,
    metrics: { aqi: 65, pm25: 16, no2: 14, o3: 26, target: { pm25: 15, no2: 40, o3: 60 },
      timeseries: [ { month: "Jan", pm25: 14, no2: 12, o3: 24 },{ month: "Feb", pm25: 15, no2: 13, o3: 25 },
                    { month: "Mar", pm25: 16, no2: 14, o3: 26 },{ month: "Apr", pm25: 17, no2: 14, o3: 26 },
                    { month: "May", pm25: 16, no2: 14, o3: 26 },{ month: "Jun", pm25: 15, no2: 13, o3: 25 } ] } },
];

/** ---------------- Map bounds (ASEAN region) ---------------- */
const mapBounds: [[number, number], [number, number]] = [
  [-12, 92],  // SW
  [25, 135],  // NE
];

/** ---------------- Helpers ---------------- */
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

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

/** Simple client-side prediction (no backend change)
 * - Peak hours (07–09 & 18–20): +15% PM2.5/NO2, +10% AQI, -5% O3.
 * - Day scenarios: 1=baseline; 2=+10% all; 3=+25% PM2.5/NO2, +15% AQI.
 */
function predictCity(base: City, day: number, timeHHMM: string): City {
  const [hhStr] = timeHHMM.split(":");
  const hour = Number(hhStr || 0);
  const peak = (hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 20);

  const dayFactorAQI = day === 1 ? 1.0 : day === 2 ? 1.10 : 1.15;
  const dayFactorPMNO = day === 1 ? 1.0 : day === 2 ? 1.10 : 1.25;
  const dayFactorO3 = day === 1 ? 1.0 : day === 2 ? 1.05 : 1.10;

  const aqi = Math.round(clamp(base.metrics.aqi * dayFactorAQI * (peak ? 1.10 : 1.0), 0, 500));
  const pm25 = Math.round(base.metrics.pm25 * dayFactorPMNO * (peak ? 1.15 : 1.0));
  const no2  = Math.round(base.metrics.no2  * dayFactorPMNO * (peak ? 1.15 : 1.0));
  const o3   = Math.round(base.metrics.o3   * dayFactorO3  * (peak ? 0.95 : 1.0));

  // Scale timeseries similarly (light touch; keeps trend shape)
  const timeseries = base.metrics.timeseries.map(t => ({
    month: t.month,
    pm25: Math.round(t.pm25 * dayFactorPMNO * (peak ? 1.08 : 1.0)),
    no2:  Math.round(t.no2  * dayFactorPMNO * (peak ? 1.08 : 1.0)),
    o3:   Math.round(t.o3   * dayFactorO3  * (peak ? 0.97 : 1.0)),
  }));

  return {
    ...base,
    metrics: {
      ...base.metrics,
      aqi,
      pm25,
      no2,
      o3,
      timeseries,
    },
  };
}

/** Small sparkline (unchanged) */
function Sparkline({ series, color = "hsl(142 60% 40%)" }:{
  series: number[]; color?: string;
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
    <div className="absolute top-24 left-4 z-[1000] rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow border">
      <div className="text-xs font-medium mb-1">AQI Legend</div>
      <div className="flex flex-col gap-1">
        {items.map(({ label, tone }) => (
          <div key={tone} className="flex items-center gap-2 text-xs">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: toneClasses[tone].marker.fill }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Controls overlay: Title + Time + Day + Apply */
/** Controls overlay: Title + Time + Day + Apply (moved to top-right) */
function Controls({
  formTime, setFormTime, formDay, setFormDay, onApply,
}: {
  formTime: string;
  setFormTime: (v: string) => void;
  formDay: string;
  setFormDay: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-stretch">
      <div className="rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow border">
        <h1 className="text-base md:text-lg font-semibold">
          Air Pollution — ASEAN Cities
        </h1>
      </div>
      <div className="rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow border flex flex-wrap justify-end items-center gap-3">
        <label className="text-sm text-neutral-700">
          Time
          <input
            type="time"
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
            className="ml-2 rounded border px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm text-neutral-700">
          Day
          <select
            value={formDay}
            onChange={(e) => setFormDay(e.target.value)}
            className="ml-2 rounded border px-2 py-1 text-sm"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </label>
        <button
          onClick={onApply}
          className="ml-1 rounded-md border px-3 py-1.5 text-sm font-medium bg-[hsl(150_45%_92%)] hover:bg-[hsl(150_45%_88%)]"
        >
          Apply
        </button>
      </div>
    </div>
  );
}


/** Recommended actions (same as you asked earlier) */
function getAQIAction(status: Status) {
  switch (status) {
    case "normal":   return "Air quality is good. Maintain current measures; encourage active transport and outdoor activities.";
    case "moderate": return "Sensitive groups should limit prolonged outdoor exertion; reduce vehicle idling and dust-generating works.";
    case "bad":      return "Limit outdoor activities; recommend masks for all (prefer N95 for PM2.5); consider traffic and construction restrictions.";
    case "worst":    return "Stay indoors with filtration; mandate N95 masks outdoors; suspend outdoor events; issue public health alerts.";
  }
}
function getPollutantAlerts(city: City) {
  const alerts: string[] = [];
  const rules = [
    { key: "PM2.5", value: city.metrics.pm25, target: city.metrics.target.pm25, unit: "µg/m³" },
    { key: "NO₂",   value: city.metrics.no2,   target: city.metrics.target.no2,   unit: "ppb" },
    { key: "O₃",    value: city.metrics.o3,    target: city.metrics.target.o3,    unit: "ppb" },
  ];
  rules.forEach(({ key, value, target, unit }) => {
    const ratio = value / target;
    if (ratio > 1.5) alerts.push(`${key} is ${value} ${unit} (>1.5× target) — enforce strict controls and increase public guidance.`);
    else if (ratio > 1.2) alerts.push(`${key} is ${value} ${unit} (>1.2× target) — tighten controls; advise sensitive groups.`);
  });
  return alerts;
}

/** -------- Modal (uses predicted city) -------- */
function DetailsModal({ city, onClose }: { city: City; onClose: () => void }) {
  const selectedStatus = getStatusFromAQI(city.metrics.aqi);
  const tone = toneClasses[selectedStatus];
  const aqiAction = getAQIAction(selectedStatus);
  const pollutantAlerts = getPollutantAlerts(city);

  return (
    <div className="fixed inset-0 z-[2000]">
      <button aria-label="Close details" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`
          absolute inset-y-6 right-6
          w-[92vw] sm:w-[640px] md:w-[720px]
          max-h-[calc(100vh-3rem)]
          rounded-xl border shadow-xl ring-2 overflow-hidden
          ${tone.ring} ${tone.bg}
        `}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-xl font-semibold ${tone.text}`}>{city.name}</h2>
                <span className={`text-base md:text-lg px-2.5 py-1 rounded-full border ${tone.chip} border-black/5`}>
                  {statusLabel[selectedStatus]}
                </span>
              </div>
              <button
                onClick={onClose}
                className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white hover:bg-neutral-50 text-neutral-600"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{city.country}</p>

            {/* KPI + Recommended Action */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <div className={`rounded-xl p-0.5 ring-1 ${tone.ring}`}>
                <div className={`rounded-xl ${tone.bg} h-full`}>
                  <KPICard id="aqi" title="City AQI" value={city.metrics.aqi} unit="AQI" />
                </div>
              </div>
              <div className="md:col-span-2 rounded-xl border bg-white p-3">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Recommended action</div>
                <p className="text-sm leading-5">{aqiAction}</p>
                {pollutantAlerts.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {pollutantAlerts.map((msg, i) => (
                      <li key={i} className="pl-4 relative">
                        <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-neutral-400" />
                        {msg}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Targets / progress */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "PM2.5", value: city.metrics.pm25, target: city.metrics.target.pm25, unit: "µg/m³" },
                { key: "NO₂",   value: city.metrics.no2,   target: city.metrics.target.no2,   unit: "ppb" },
                { key: "O₃",    value: city.metrics.o3,    target: city.metrics.target.o3,    unit: "ppb" },
              ].map(({ key, value, target, unit }) => {
                const ratio = value / target;
                const st: Status = ratio <= 1 ? "normal" : ratio <= 1.2 ? "moderate" : ratio <= 1.5 ? "bad" : "worst";
                const t = toneClasses[st];
                return (
                  <div key={key} className={`rounded-xl p-0.5 ring-1 ${t.ring}`}>
                    <div className={`rounded-xl ${t.bg}`}>
                      <SummaryTile title={key} value={value} target={target} unit={unit} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini trends */}
            <div className="mt-4 rounded-lg border bg-white p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Monthly Trend</h3>
              <div className="flex gap-6 items-end">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">PM2.5</div>
                  <Sparkline series={city.metrics.timeseries.map(t => t.pm25)} color="hsl(0 70% 50%)" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">NO₂</div>
                  <Sparkline series={city.metrics.timeseries.map(t => t.no2)} color="hsl(142 60% 40%)" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">O₃</div>
                  <Sparkline series={city.metrics.timeseries.map(t => t.o3)} color="hsl(210 70% 45%)" />
                </div>
              </div>
            </div>

          </div>{/* /p-5 */}
        </div>{/* /scroll */}
      </div>
    </div>
  );
}

/** ---------------- FULLSCREEN MAP + PREDICTION + MODAL ---------------- */
export default function CityExplorer() {
  // UI controls (pending) and applied prediction parameters
  const [formTime, setFormTime] = useState<string>("08:00");
  const [formDay, setFormDay] = useState<string>("1");
  const [appliedTime, setAppliedTime] = useState<string>("08:00");
  const [appliedDay, setAppliedDay] = useState<number>(1);

  // Selection stores just the id; we read from predicted list
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Compute predicted cities when "Apply" changes parameters
  const predictedCities: City[] = useMemo(() => {
    const dayNum = Number(appliedDay);
    return ASEAN_CITIES.map(c => predictCity(c, dayNum, appliedTime));
  }, [appliedDay, appliedTime]);

  const selectedCity = useMemo(
    () => predictedCities.find(c => c.id === selectedId) || null,
    [predictedCities, selectedId]
  );

  const onApply = () => {
    setAppliedTime(formTime || "00:00");
    setAppliedDay(Number(formDay) as 1 | 2 | 3);
    // if a city is open, keep it in sync with new predictions
    setSelectedId(prev => prev); // no-op, but clarifies intent
  };

  return (
    <div className="fixed inset-0">
      {/* Controls + Title */}
      <Controls
        formTime={formTime}
        setFormTime={setFormTime}
        formDay={formDay}
        setFormDay={setFormDay}
        onApply={onApply}
      />

      {/* Legend */}
      <Legend />

      {/* Map */}
      <MapContainer bounds={mapBounds} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {predictedCities.map((c) => {
          const s = getStatusFromAQI(c.metrics.aqi);
          const m = toneClasses[s].marker;
          return (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lng]}
              radius={10}
              pathOptions={{ color: m.stroke, fillColor: m.fill, fillOpacity: 0.9, weight: 2 }}
              eventHandlers={{ click: () => setSelectedId(c.id) }}
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

      {/* Modal (predicted city) */}
      {selectedCity && <DetailsModal city={selectedCity} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
