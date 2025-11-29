import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Flame, Cloud, AlertTriangle } from "lucide-react";

// Fix Leaflet icon issue with Webpack
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORY_CONFIG = {
  fire: { icon: Flame, color: "destructive", label: "Fire" },
  smoke: { icon: Cloud, color: "default", label: "Smoke" },
  pollution: { icon: AlertTriangle, color: "secondary", label: "Pollution" },
  other: { icon: AlertTriangle, color: "default", label: "Other" },
};

export default function PostLocationMap() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const location = searchParams.get("location") || "Unknown Location";
  const category = searchParams.get("category") as keyof typeof CATEGORY_CONFIG || "other";
  const description = searchParams.get("description") || "";
  const userName = searchParams.get("userName") || "Anonymous";

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!lat || !lng) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-2">Location Not Available</h2>
          <p className="text-muted-foreground mb-4">
            The location coordinates for this post are not available.
          </p>
          <Button onClick={() => navigate("/community")} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </Card>
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[category];
  const CategoryIcon = categoryConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/community")}
            className="mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">Post Location</h1>
                <Badge variant={categoryConfig.color as any}>
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {categoryConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden h-[500px]">
              {mapReady && (
                <MapContainer
                  center={[lat, lng]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold mb-1">{categoryConfig.label} Incident</p>
                        <p className="text-sm text-muted-foreground">{location}</p>
                        {description && (
                          <p className="text-sm mt-2">{description}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              )}
            </Card>
          </div>

          {/* Post Details */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Incident Details</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Reported by
                  </p>
                  <p className="text-base">{userName}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Category
                  </p>
                  <Badge variant={categoryConfig.color as any}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {categoryConfig.label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Location
                  </p>
                  <p className="text-base">{location}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Coordinates
                  </p>
                  <p className="text-sm font-mono">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                </div>

                {description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-base">{description}</p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps?q=${lat},${lng}`,
                    "_blank"
                  );
                }}
              >
                Open in Google Maps
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
