import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import CurrentLocationMap from "@/components/CurrentLocationMap";
import BrandLogo from "@/components/BrandLogo";
import KPICard from "@/components/KPICard";
import SummaryTile from "@/components/SummaryTile";
import EmissionsOverTimeChart from "@/components/EmissionsOverTimeChart";
import EmissionsByCategoryChart from "@/components/EmissionsByCategoryChart";
import EmissionsByScopeChart from "@/components/EmissionsByScopeChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

interface Country {
  code: string;
  name: string;
}

interface MetricsData {
  kpi: { total: number; offsets: number; net: number };
  categories: { energy: number; transport: number; waste: number };
  targets: { energy: number; transport: number; waste: number };
  scopes: { scope1: number; scope2: number; scope3: number };
  timeseries: Array<{ month: string; energy: number; transport: number; waste: number }>;
}

export default function Index() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // Load countries and years
  useEffect(() => {
    const loadInit = async () => {
      try {
        const [countriesRes, yearsRes] = await Promise.all([
          fetch("/data/countries.json"),
          fetch("/data/years.json"),
        ]);
        const countriesData = await countriesRes.json();
        const yearsData = await yearsRes.json();
        setCountries(countriesData);
        setYears(yearsData);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setLoadErr("Could not load filter lists. Please refresh.");
      }
    };
    loadInit();
  }, []);

  const fetchMetrics = useCallback(
    async (country: string, year: string) => {
      setIsLoading(true);
      setLoadErr(null);
      try {
        const response = await fetch(`/data/metrics/${country}/${year}.json`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          const fallback = await fetch(`/data/metrics/ALL/${year}.json`);
          if (!fallback.ok) throw new Error("Fallback fetch failed");
          const data = await fallback.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Failed to load metrics:", error);
        setLoadErr("Could not load metrics for the selected filters.");
        setMetrics(null);
      } finally {
        setTimeout(() => setIsLoading(false), 250);
      }
    },
    []
  );

  useEffect(() => {
    fetchMetrics(selectedCountry, selectedYear);
  }, [selectedCountry, selectedYear, fetchMetrics]);

  const handleRetry = () => fetchMetrics(selectedCountry, selectedYear);

  return (
    <div className="min-h-screen bg-white">
      {/* --- GREEN NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-green-600 text-white shadow-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="font-semibold text-lg tracking-wide">
            🌿 Sustainability KPI Dashboard
          </h1>
          <div className="flex gap-3">
            <Button asChild variant="secondary" className="bg-white text-green-700 hover:bg-green-50">
              <a href="/">Home</a>
            </Button>
            <Button asChild variant="secondary" className="bg-white text-green-700 hover:bg-green-50">
              <a href="/explorer">Map</a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* --- TOP ROW: MAP + SIMPLE WELCOME CARD --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="h-[420px] lg:h-[500px] rounded-lg border border-border shadow-card overflow-hidden">
            <CurrentLocationMap countryCode={selectedCountry} />
          </div>

          {/* Simple Welcome Card */}
          <div
            className="h-[420px] lg:h-[500px] rounded-lg border border-border shadow-card flex flex-col items-center justify-center text-center p-6"
            style={{
              background:
                "linear-gradient(180deg, hsl(140 55% 96%) 0%, hsl(140 40% 92%) 100%)",
            }}
          >
            {/* Large Brand Image */}
            <div className="w-56 h-56 mb-4 rounded-xl overflow-hidden border border-green-200 shadow-md bg-white">
              <BrandLogo />
            </div>

            {/* Simple Text */}
            <h2 className="text-xl font-semibold text-green-900">
              Welcome to Your Sustainability Dashboard
            </h2>
            <p className="text-sm text-green-800/80 mt-2 max-w-sm">
              Explore environmental performance and progress across ASEAN countries.
              Choose filters below or view detailed city-level data.
            </p>

            {/* Explore Map Button */}
            <Button
              asChild
              className="mt-6 bg-green-600 hover:bg-green-700 text-white rounded-full px-5 py-2"
            >
              <a href="/explorer" className="inline-flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Explore Map
              </a>
            </Button>
          </div>
        </div>

        {/* --- FILTER CONTROLS --- */}
        <section
          className="bg-card rounded-lg border border-border shadow-card p-6"
          aria-labelledby="filters"
        >
          <h2 id="filters" className="sr-only">
            Filters
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="select-country" className="text-sm font-medium text-foreground">
                Country
              </label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger id="select-country" className="w-full" aria-label="Select country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <label htmlFor="select-year" className="text-sm font-medium text-foreground">
                Year
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="select-year" className="w-full" aria-label="Select year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
                onClick={() => fetchMetrics(selectedCountry, selectedYear)}
                aria-label="Apply filters"
              >
                {isLoading ? "Loading..." : "Apply"}
              </Button>
              {loadErr && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="border-green-600 text-green-700 hover:bg-green-50"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>

          {loadErr && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {loadErr}
            </p>
          )}
        </section>

        {/* --- MAIN DASHBOARD --- */}
        {metrics ? (
          <section className="space-y-6" aria-labelledby="analysis">
            <h2 id="analysis" className="sr-only">Analysis</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                id="kpi-total"
                title="Total CO₂ Emissions"
                value={metrics.kpi.total}
                variant="destructive"
                hint="Gross emissions before offsets."
              />
              <KPICard
                id="kpi-offsets"
                title="Carbon Offsets"
                value={metrics.kpi.offsets}
                variant="success"
                hint="Offsets purchased/applied."
              />
              <KPICard
                id="kpi-net"
                title="Net Impact"
                value={metrics.kpi.net}
                variant="warning"
                hint="Total emissions minus offsets."
              />
            </div>

            {/* Summary Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryTile title="Energy" value={metrics.categories.energy} target={metrics.targets.energy} />
              <SummaryTile title="Transportation" value={metrics.categories.transport} target={metrics.targets.transport} />
              <SummaryTile title="Waste" value={metrics.categories.waste} target={metrics.targets.waste} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <EmissionsOverTimeChart data={metrics.timeseries} />
              </div>
              <EmissionsByCategoryChart data={metrics.categories} />
              <EmissionsByScopeChart data={metrics.scopes} />
            </div>
          </section>
        ) : (
          <div className="text-center py-12">
            {isLoading ? (
              <div className="mx-auto h-2 w-40 rounded bg-muted animate-pulse" />
            ) : (
              <p className="text-muted-foreground">
                Pick filters and click <span className="font-medium">Apply</span> to load insights.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
