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
  import ASEANComparisonChart from "@/components/ASEANComparisonChart";
  import ASEANPollutantRadar from "@/components/ASEANPollutantRadar";

  interface Country {
    code: string;
    name: string;
  }

  interface MetricsData {
    kpi?: { total: number; offsets: number; net: number };
    categories?: { energy: number; transport: number; waste: number };
    targets?: { energy: number; transport: number; waste: number };
    scopes?: { scope1: number; scope2: number; scope3: number };

    timeseries?: Array<{
    month: string;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    so2: number;
  }>;

    comparison?: Array<{
      country: string;
      aqi: number;
      pm25: number;
      pm10: number;
      no2: number;
      co: number;
      so2: number;
      o3: number;
    }>;

    historical5days?: Array<{
    date: string;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    so2: number;
  }>;

  yearlyAverages?: {
    pm25: number;
    pm10: number;
    no2: number;
    co: number;
    o3: number;
    so2: number;
  };

  monthly?: Array<{
    month: string;       // ex. "Jan"
    pm25: number;
    pm10: number;
    no2: number;
    co: number;
    o3: number;
    so2: number;
    aqi: number;
  }>;

  }

  interface User{
    id: string;
    name: string;
    email: string;
    health:{
      city?: string;
      country?: string;
      lat?: number;
      lng?: number;
      aqiThreshold?: number;
      notifyBy?: string;
      outings?: string;
    };
  }

  interface AirQuality {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    so2: number;
  }

  export default function Index() {
    const [user, setUser] = useState<User | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>("2024");
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadErr, setLoadErr] = useState<string | null>(null);
    const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
    const [airErr, setAirErr] = useState<string | null>(null);
    const [isAirLoading, setIsAirLoading] = useState(false);
    const isHistorical = selectedYear !== new Date().getFullYear().toString();

    const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
    // Default focus for each country
    MM: { lat: 16.8409, lon: 96.1735 },  // Yangon, Myanmar
    TH: { lat: 13.7563, lon: 100.5018 }, // Bangkok, Thailand
    VN: { lat: 21.0278, lon: 105.8342 }, // Hanoi (example)
    SG: { lat: 1.3521,  lon: 103.8198 }, // Singapore
    MY: { lat: 3.1390,  lon: 101.6869 }, // Kuala Lumpur
    ID: { lat: -6.2088, lon: 106.8456 }, // Jakarta
    PH: { lat: 14.5995, lon: 120.9842 }, // Manila
  };

  const COUNTRY_TO_CITYFILE: Record<string, string> = {
    MM: "yangon",
    TH: "bangkok",
    VN: "hanoi",
    SG: "singapore",
    MY: "kualalumpur",
    ID: "jakarta",
    PH: "manila"
  };

  const effectiveLat =
    selectedCountry !== "ALL" && COUNTRY_COORDS[selectedCountry]
      ? COUNTRY_COORDS[selectedCountry].lat
      : user?.health?.lat;

    const effectiveLng =
      selectedCountry !== "ALL" && COUNTRY_COORDS[selectedCountry]
        ? COUNTRY_COORDS[selectedCountry].lon
        : user?.health?.lng;

    useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    function calculateOpenWeatherAqi(pm25: number, pm10: number, no2: number, o3: number, co: number, so2: number) {
  // Based on typical OpenWeather pollutant thresholds (approx.)
  // Each pollutant maps to a score 1–5, final AQI = max pollutant score.

  const pm25Scale = (v: number) =>
    v <= 12 ? 1 :
    v <= 35 ? 2 :
    v <= 55 ? 3 :
    v <= 150 ? 4 : 5;

  const pm10Scale = (v: number) =>
    v <= 54 ? 1 :
    v <= 154 ? 2 :
    v <= 254 ? 3 :
    v <= 354 ? 4 : 5;

  const no2Scale = (v: number) =>
    v <= 53 ? 1 :
    v <= 100 ? 2 :
    v <= 360 ? 3 :
    v <= 649 ? 4 : 5;

  const o3Scale = (v: number) =>
    v <= 54 ? 1 :
    v <= 70 ? 2 :
    v <= 85 ? 3 :
    v <= 105 ? 4 : 5;

  const coScale = (v: number) =>
    v <= 4.4 ? 1 :
    v <= 9.4 ? 2 :
    v <= 12.4 ? 3 :
    v <= 15.4 ? 4 : 5;

  const so2Scale = (v: number) =>
    v <= 35 ? 1 :
    v <= 75 ? 2 :
    v <= 185 ? 3 :
    v <= 304 ? 4 : 5;

  const scores = [
    pm25Scale(pm25),
    pm10Scale(pm10),
    no2Scale(no2),
    o3Scale(o3),
    coScale(co),
    so2Scale(so2),
  ];

  // OpenWeather uses the highest score as overall AQI
  return Math.max(...scores);
}

   function calculateAvgAqi(months: any[]) {
  if (!months || months.length === 0) return 0;

  const aqiValues = months.map(m =>
    calculateOpenWeatherAqi(
      m.pm25,
      m.pm10,
      m.no2,
      m.o3,
      m.co,
      m.so2
    )
  );

  const avg = aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length;
  return Math.round(avg);
}


    // useEffect(() => {
    //   const loadInit = async () => {
    //     try {
    //       const [countriesRes, yearsRes] = await Promise.all([
    //         fetch("/data/countries.json"),
    //         fetch("/data/years.json"),
    //       ]);
    //       const countriesData = await countriesRes.json();
    //       const yearsData = await yearsRes.json();
    //       setCountries(countriesData);
    //       setYears(yearsData);
    //     } catch (error) {
    //       console.error("Failed to load initial data:", error);
    //       setLoadErr("Could not load filter lists. Please refresh.");
    //     }
    //   };
    //   loadInit();
    // }, []);
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

        // -----------------------------
        // 🔥 DEFAULT COUNTRY FROM USER
        // -----------------------------
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUser(user);

          const COUNTRY_NAME_TO_CODE: Record<string, string> = {
            Myanmar: "MM",
            Thailand: "TH",
            Vietnam: "VN",
            Singapore: "SG",
            Malaysia: "MY",
            Indonesia: "ID",
            Philippines: "PH",
          };

          const userCountry = user?.health?.country;
          if (userCountry && COUNTRY_NAME_TO_CODE[userCountry]) {
            setSelectedCountry(COUNTRY_NAME_TO_CODE[userCountry]);
          }
        }

        // -----------------------------
        // 🔥 DEFAULT YEAR (CURRENT YEAR)
        // -----------------------------
        const currentYear = new Date().getFullYear().toString();
        setSelectedYear(currentYear);

      } catch (error) {
        console.error("Failed to load initial data:", error);
        setLoadErr("Could not load filter lists. Please refresh.");
      }
    };

    loadInit();
  }, []);


    useEffect(() => {
    const lat = effectiveLat;
    const lng = effectiveLng;

    // Only call if we actually have coordinates
    if (lat == null || lng == null) return;

    const fetchAirQuality = async () => {
      setIsAirLoading(true);
      setAirErr(null);

      try {
        const res = await fetch(`http://localhost:5000/api/air/${lat}/${lng}`);

        if (!res.ok) {
          throw new Error("Failed to fetch air quality");
        }

        const data: AirQuality = await res.json();
        setAirQuality(data);
      } catch (err) {
        console.error("Error loading air quality:", err);
        setAirErr("Could not load air quality data.");
        setAirQuality(null);
      } finally {
        setIsAirLoading(false);
      }
    };

    fetchAirQuality();
  }, [effectiveLat, effectiveLng, selectedCountry]);

    const fetchAseanComparison = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/air/asean");
      if (!res.ok) throw new Error("ASEAN data error");
      return await res.json(); // returns array of countries with pollutant values
    } catch (err) {
      console.error("ASEAN comparison load failed", err);
      return null;
    }
  };

  // --- Monthly generation helper ---
  function generateMonthlySeries(air: AirQuality) {
    const base = {
      pm25: air.pm25,
      pm10: air.pm10,
      no2: air.no2,
      co: air.co,
      o3: air.o3,
      so2: air.so2,
    };

    const multipliers = [0.82, 0.88, 0.93, 0.97, 1.0, 1.05, 1.08, 1.12, 1.1, 1.03, 0.95, 0.9];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    return months.map((m, i) => ({
      month: m,
      pm25: Number((base.pm25 * multipliers[i]).toFixed(1)),
      no2:  Number((base.no2  * multipliers[i]).toFixed(1)),
      co:   Number((base.co   * multipliers[i]).toFixed(1)),
      o3:   Number((base.o3   * multipliers[i]).toFixed(1)),
      pm10: Number((base.pm10 * multipliers[i]).toFixed(1)),
      so2:  Number((base.so2  * multipliers[i]).toFixed(1)),
    }));
  }

    const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setLoadErr(null);

      const currentYear = new Date().getFullYear().toString();

      // =====================================================
      // 🔥 1. ALL → Still use ASEAN live API
      // =====================================================
      if (selectedCountry === "ALL") {
        const res = await fetch("http://localhost:5000/api/air/asean");
        const aseanList = await res.json();

        setMetrics({
          comparison: aseanList,
          timeseries: [],
        });

        return;
      }

      // =====================================================
      // 🔥 2. HISTORICAL MODE → Load Local JSON
      // =====================================================
      if (selectedYear !== currentYear) {
  const cityFile = COUNTRY_TO_CITYFILE[selectedCountry];
  const filePath = `/data/${cityFile}-${selectedYear}.json`;

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error("File not found");

    const history = await res.json();

    // Calculate avg AQI (no yearAqi field in JSON)
    const calculateAvgAqi = (months: any[]) => {
      if (!months || months.length === 0) return 0;

      const avg = months.reduce((sum, m) =>
        sum + (m.pm25 + m.pm10) / 2, 0
      ) / months.length;

      return Math.round(avg);
    };

    const avgAqi = calculateAvgAqi(history.monthly);
    const avgPm25 = Math.round(history.monthly.reduce((s,m)=>s+m.pm25,0) / history.monthly.length);
    const avgPm10 = Math.round(history.monthly.reduce((s,m)=>s+m.pm10,0) / history.monthly.length);
    const avgNo2  = Math.round(history.monthly.reduce((s,m)=>s+m.no2 ,0) / history.monthly.length);
    const avgCo   = Math.round(history.monthly.reduce((s,m)=>s+m.co  ,0) / history.monthly.length);
    const avgO3   = Math.round(history.monthly.reduce((s,m)=>s+m.o3  ,0) / history.monthly.length);
    const avgSo2  = Math.round(history.monthly.reduce((s,m)=>s+m.so2 ,0) / history.monthly.length);

    setMetrics({
      kpi: {
        total: avgAqi,   // your AQI calculation
        offsets: 0,
        net: avgAqi,
      },

      yearlyAverages: {
        pm25: avgPm25,
        pm10: avgPm10,
        no2: avgNo2,
        co: avgCo,
        o3: avgO3,
        so2: avgSo2,
      },

      timeseries: history.monthly,
      comparison: [],
    });


    return;

  } catch (err) {
    console.error("Historical file missing:", filePath, err);
    setLoadErr(`No historical data for ${selectedYear}.`);
    setMetrics(null);
    return;
  }
}

      // =====================================================
      // 🔥 3. CURRENT YEAR → Use API (Your existing logic)
      // =====================================================
      let lat = user?.health?.lat ?? null;
      let lon = user?.health?.lng ?? null;

      if (COUNTRY_COORDS[selectedCountry]) {
        lat = COUNTRY_COORDS[selectedCountry].lat;
        lon = COUNTRY_COORDS[selectedCountry].lon;
      }

      const res = await fetch(`http://localhost:5000/api/air/${lat}/${lon}`);
      const air: AirQuality = await res.json();

      setMetrics({
        kpi: {
          total: air.aqi,
          offsets: 0,
          net: air.aqi,
        },
        categories: {
          energy: air.pm25,
          transport: air.no2,
          waste: air.o3,
        },
        scopes: {
          scope1: air.pm10,
          scope2: air.co,
          scope3: air.so2,
        },
        timeseries: generateMonthlySeries(air),
      });
    } catch (err) {
      console.error("Failed to load metrics:", err);
      setLoadErr("Could not load metrics.");
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCountry) return;
    fetchMetrics();
  }, [selectedCountry, selectedYear, user]);

  const handleRetry = () => {
    fetchMetrics();   // try API again
  };

    return (
      <div className="min-h-screen bg-white">
        {/* --- NAVBAR --- */}
        

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* --- TOP ROW: MAP + WELCOME CARD --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map */}
            <div className="w-full h-[420px] lg:h-[500px] rounded-lg border border-border shadow-card overflow-hidden relative z-0 bg-white">
              {/* <CurrentLocationMap
                countryCode={selectedCountry}
                lat={user?.health?.lat}
                lng={user?.health?.lng}
              /> */}
              <CurrentLocationMap
                countryCode={selectedCountry}
                lat={effectiveLat}
                lng={effectiveLng}
              />
            </div>

            {/* Welcome Card */}
            <div
              className="h-[420px] lg:h-[500px] rounded-lg border border-border shadow-card flex flex-col items-center justify-center text-center p-6"
              style={{
                background:
                  "linear-gradient(180deg, hsl(210 80% 97%) 0%, hsl(210 70% 94%) 100%)",
              }}
            >
              <div className="w-56 h-56 mb-4 rounded-xl overflow-hidden border border-blue-200 shadow-md bg-white">
                <BrandLogo />
              </div>
              <h2 className="text-xl font-semibold text-blue-900">
                Welcome to Your Air Quality Map
              </h2>
              <p className="text-sm text-blue-800/80 mt-2 max-w-sm">
                Track AQI and pollutants across ASEAN. Choose filters below or tap
                the map to explore cities and recent trends.
              </p>
              <div className="flex gap-2 mt-6">
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2"
                >
                  <a href="/explorer" className="inline-flex items-center gap-2">
                    <Compass className="h-4 w-4" />
                    Explore Map
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* --- FILTERS --- */}
          <section className="bg-card rounded-lg border border-border shadow-card p-6" aria-labelledby="filters">
            <h2 id="filters" className="sr-only">Filters</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Country */}
              <div className="flex-1 space-y-2">
                <label htmlFor="select-country" className="text-sm font-medium text-foreground">Country</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger id="select-country" className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="flex-1 space-y-2">
                <label htmlFor="select-year" className="text-sm font-medium text-foreground">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="select-year" className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Apply / Retry */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                  onClick={fetchMetrics}
                >
                  {isLoading ? "Loading..." : "Apply"}
                </Button>
                {loadErr && (
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="border-blue-600 text-blue-700 hover:bg-blue-50"
                  >
                    Retry
                  </Button>
                )}
              </div>
            </div>

            {loadErr && (
              <p className="mt-3 text-sm text-destructive" role="alert">{loadErr}</p>
            )}
          </section>

          {/* --- DASHBOARD --- */}
          {metrics ? (
    <section className="space-y-6" aria-labelledby="analysis">
      <h2 id="analysis" className="sr-only">Analysis</h2>

      {/* ========================================================= */}
      {/* 🔥 1. IF "ALL" → SHOW ONLY COMPARISON CHARTS */}
      {/* ========================================================= */}
      {selectedCountry === "ALL" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {metrics.comparison && (
        <ASEANComparisonChart data={metrics.comparison} />
      )}

      {metrics.comparison && (
        <ASEANPollutantRadar data={metrics.comparison} />
      )}

        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* 🔥 2. SINGLE COUNTRY → SHOW KPI CARDS + NORMAL CHARTS    */}
          {/* ========================================================= */}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              id="kpi-aqi"
              title="Average AQI"
              value={
                isHistorical
                  ? metrics?.kpi?.total
                  : airQuality?.aqi
              }
              variant="warning"
              hint="Average Air Quality Index for the selected filters."
            />
            <KPICard
              id="kpi-pm25"
              title="PM2.5 (µg/m³)"
              value={
                isHistorical
                  ? metrics?.yearlyAverages?.pm25
                  : airQuality?.pm25
              }
              variant="destructive"
              hint="Fine particulate matter concentration."
              unit="µg/m³"
            />
            <KPICard
              id="kpi-no2"
              title="NO₂ (ppb)"
              value={
                isHistorical
                  ? metrics?.yearlyAverages?.no2
                  : airQuality?.no2
              }
              variant="default"
              hint="Nitrogen dioxide concentration."
              unit="ppb"
            />
            <KPICard
              id="kpi-pm10"
              title="PM10 (µg/m³)"
              value={
                isHistorical
                  ? metrics?.yearlyAverages?.pm10
                  : airQuality?.pm10
              }
              variant="default"
              hint="PM10 concentration."
              unit="µg/m³"
            />
            <KPICard
              id="kpi-co"
              title="CO (ppb)"
              value={
                isHistorical
                  ? metrics?.yearlyAverages?.co
                  : airQuality?.co
              }
              variant="default"
              hint="Carbon monoxide concentration."
              unit="ppb"
            />
            <KPICard
              id="kpi-o3"
              title="O₃ (ppb)"
              value={
                isHistorical
                  ? metrics?.yearlyAverages?.o3
                  : airQuality?.o3
              }
              variant="default"
              hint="Ozone concentration."
              unit="ppb"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <EmissionsOverTimeChart data={metrics.timeseries} />
            </div>

            {airQuality && !isHistorical && (
              <EmissionsByCategoryChart
                data={[
                { label: "PM2.5", value: airQuality.pm25, unit: "µg/m³" },
                { label: "PM10",  value: airQuality.pm10, unit: "µg/m³" },
                { label: "NO₂",   value: airQuality.no2,  unit: "ppb" },
                { label: "CO",    value: airQuality.co,   unit: "ppb" },
                { label: "O₃",    value: airQuality.o3,   unit: "ppb" },
              ]}
              /> 
            )}

            {!isHistorical && selectedCountry !== "ALL" && metrics?.timeseries && (
              <EmissionsByScopeChart data={metrics.timeseries} />
            )}
          </div>
        </>
      )}

            </section>
          ) : (
            <div className="text-center py-12">
              {isLoading ? (
                <div className="mx-auto h-2 w-40 rounded bg-muted animate-pulse" />
              ) : (
                <p className="text-muted-foreground">
                  Pick filters and click <span className="font-medium">Apply</span> to load air quality insights.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }
