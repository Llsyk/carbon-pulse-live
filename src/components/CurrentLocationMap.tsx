import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

/** NOTE:
 * You already set Leaflet default marker icons globally in main.tsx:
 * L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
 * So we don't repeat that here to avoid conflicts.
 */

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

interface CurrentLocationMapProps {
  countryCode?: string;
  /** Optional current user location (if you already have it). If not provided,
   * the component just shows the country view. */
  userLocation?: LatLngExpression | null;
}

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

const CurrentLocationMap = ({ countryCode = "ALL", userLocation = null }: CurrentLocationMapProps) => {
  const mapConfig = COUNTRY_COORDS[countryCode] || COUNTRY_COORDS.ALL;

  return (
    <div
      id="map-current-location"
      className="h-full w-full rounded-lg overflow-hidden shadow-card border border-border"
      aria-label="Map showing current location"
    >
      <MapContainer center={mapConfig.center} zoom={mapConfig.zoom} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={mapConfig.center} zoom={mapConfig.zoom} />
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>Your Current Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default CurrentLocationMap;
