import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue in React / Vite / Next.js
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to recenter map when props change
interface MapRecenterProps {
  center: LatLngExpression;
  zoom: number;
}

const MapRecenter = ({ center, zoom }: MapRecenterProps) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

// Default coordinates per country
const COUNTRY_COORDS: Record<string, { center: LatLngExpression; zoom: number }> = {
  ALL: { center: [10, 105], zoom: 5 },
  MM: { center: [21.9162, 95.956], zoom: 6 },
  TH: { center: [15.87, 100.9925], zoom: 6 },
  VN: { center: [14.0583, 108.2772], zoom: 6 },
  SG: { center: [1.3521, 103.8198], zoom: 11 },
  MY: { center: [4.2105, 101.9758], zoom: 6 },
  ID: { center: [-0.7893, 113.9213], zoom: 5 },
  PH: { center: [12.8797, 121.774], zoom: 6 },
  LA: { center: [19.8563, 102.4955], zoom: 6 },
  KH: { center: [12.5657, 104.991], zoom: 6 },
  BN: { center: [4.5353, 114.7277], zoom: 9 },
};

interface CurrentLocationMapProps {
  countryCode?: string;
  lat?: number;
  lng?: number;
}

export default function CurrentLocationMap({
  countryCode = "ALL",
  lat,
  lng,
}: CurrentLocationMapProps) {
  const mapConfig = COUNTRY_COORDS[countryCode] || COUNTRY_COORDS.ALL;

  // Get user location from props first, fallback to localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const userLocation: LatLngExpression | null =
    lat && lng ? [lat, lng] : user?.health?.lat && user?.health?.lng ? [user.health.lat, user.health.lng] : null;

  const zoomLevel = userLocation ? 12 : mapConfig.zoom;

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-card border border-border">
      <MapContainer
        center={userLocation || mapConfig.center}
        zoom={zoomLevel}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={userLocation || mapConfig.center} zoom={zoomLevel} />

        {userLocation && (
          <Marker position={userLocation}>
            <Popup>Your Registered Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
