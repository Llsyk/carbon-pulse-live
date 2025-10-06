import { useState, useEffect } from 'react';
import CurrentLocationMap from '@/components/CurrentLocationMap';
import BrandLogo from '@/components/BrandLogo';
import KPICard from '@/components/KPICard';
import SummaryTile from '@/components/SummaryTile';
import EmissionsOverTimeChart from '@/components/EmissionsOverTimeChart';
import EmissionsByCategoryChart from '@/components/EmissionsByCategoryChart';
import EmissionsByScopeChart from '@/components/EmissionsByScopeChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface Country {
  code: string;
  name: string;
}

interface MetricsData {
  kpi: {
    total: number;
    offsets: number;
    net: number;
  };
  categories: {
    energy: number;
    transport: number;
    waste: number;
  };
  targets: {
    energy: number;
    transport: number;
    waste: number;
  };
  scopes: {
    scope1: number;
    scope2: number;
    scope3: number;
  };
  timeseries: Array<{
    month: string;
    energy: number;
    transport: number;
    waste: number;
  }>;
}

const Index = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load countries and years
  useEffect(() => {
    const loadData = async () => {
      try {
        const [countriesRes, yearsRes] = await Promise.all([
          fetch('/data/countries.json'),
          fetch('/data/years.json'),
        ]);
        const countriesData = await countriesRes.json();
        const yearsData = await yearsRes.json();
        setCountries(countriesData);
        setYears(yearsData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    loadData();
  }, []);

  // Load metrics data when country or year changes
  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/data/metrics/${selectedCountry}/${selectedYear}.json`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          // Fallback to ALL if specific country data not found
          const fallbackResponse = await fetch(`/data/metrics/ALL/${selectedYear}.json`);
          const data = await fallbackResponse.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 300); // Debounce for smooth transitions
      }
    };
    loadMetrics();
  }, [selectedCountry, selectedYear]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Top Row: Map + Logo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[400px] lg:h-[500px]">
            <CurrentLocationMap countryCode={selectedCountry} />
          </div>
          <div className="h-[400px] lg:h-[500px] bg-card rounded-lg border border-border shadow-card">
            <BrandLogo />
          </div>
        </div>

        {/* Controls Row */}
        <div className="bg-card rounded-lg border border-border shadow-card p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="select-country" className="text-sm font-medium text-foreground">
                Country
              </label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger id="select-country" className="w-full">
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
                <SelectTrigger id="select-year" className="w-full">
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

            <Button 
              variant="default" 
              className="sm:w-auto w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Apply'}
            </Button>
          </div>
        </div>

        {/* Analysis Section */}
        {metrics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                id="kpi-total"
                title="Total CO₂ Emissions"
                value={metrics.kpi.total}
                variant="destructive"
              />
              <KPICard
                id="kpi-offsets"
                title="Carbon Offsets"
                value={metrics.kpi.offsets}
                variant="success"
              />
              <KPICard
                id="kpi-net"
                title="Net Impact"
                value={metrics.kpi.net}
                variant="warning"
              />
            </div>

            {/* Summary Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryTile
                title="Energy"
                value={metrics.categories.energy}
                target={metrics.targets.energy}
              />
              <SummaryTile
                title="Transportation"
                value={metrics.categories.transport}
                target={metrics.targets.transport}
              />
              <SummaryTile
                title="Waste"
                value={metrics.categories.waste}
                target={metrics.targets.waste}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <EmissionsOverTimeChart data={metrics.timeseries} />
              </div>
              <EmissionsByCategoryChart data={metrics.categories} />
              <EmissionsByScopeChart data={metrics.scopes} />
            </div>
          </div>
        )}

        {!metrics && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
