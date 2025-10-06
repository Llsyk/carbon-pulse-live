import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapRecenterProps {
  center: LatLngExpression;
  zoom: number;
}

const MapRecenter = ({ center, zoom }: MapRecenterProps) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface CurrentLocationMapProps {
  countryCode?: string;
}

const COUNTRY_COORDS: Record<string, { center: LatLngExpression; zoom: number }> = {
  ALL: { center: [10, 105], zoom: 5 },
  MM: { center: [21.9162, 95.9560], zoom: 6 },
  TH: { center: [15.8700, 100.9925], zoom: 6 },
  VN: { center: [14.0583, 108.2772], zoom: 6 },
  SG: { center: [1.3521, 103.8198], zoom: 11 },
  MY: { center: [4.2105, 101.9758], zoom: 6 },
  ID: { center: [-0.7893, 113.9213], zoom: 5 },
  PH: { center: [12.8797, 121.7740], zoom: 6 },
};

const CurrentLocationMap = ({ countryCode = 'ALL' }: CurrentLocationMapProps) => {
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mapConfig = COUNTRY_COORDS[countryCode] || COUNTRY_COORDS.ALL;

  useEffect(() => {
    if ('geolocation' in navigator && !permissionDenied) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          setPermissionDenied(true);
        }
      );
    }
  }, [permissionDenied]);

  return (
    <div id="map-current-location" className="h-full w-full rounded-lg overflow-hidden shadow-card border border-border">
      <MapContainer
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
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
