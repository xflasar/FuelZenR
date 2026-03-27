'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon paths for Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const createCustomClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="bg-blue-700 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center border-2 border-white shadow-lg text-sm">${count}</div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(40, 40, true),
  });
};

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ center, zoom = 12 }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

interface MapProps {
  stations: any[];
  mapCenter: [number, number];
  searchLat?: number;
  searchLon?: number;
  onMapClick: (lat: number, lon: number) => void;
  onStationSelect: (station: any) => void;
  routeGeometry?: [number, number][]; // Array of lat/lon points for the path
}

export default function Map({ stations, mapCenter, searchLat, searchLon, onMapClick, onStationSelect, routeGeometry }: MapProps) {
  return (
    <MapContainer center={mapCenter} zoom={12} className="w-full h-full z-0">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      
      <MapController center={mapCenter} />
      <MapClickHandler onMapClick={onMapClick} />

      {searchLat !== undefined && searchLon !== undefined && (
        <Marker position={[searchLat, searchLon]} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {/* Draw the road path */}
      {routeGeometry && routeGeometry.length > 0 && (
        <Polyline positions={routeGeometry} color="blue" weight={5} opacity={0.7} />
      )}

      <MarkerClusterGroup 
        chunkedLoading
        maxClusterRadius={40}
        disableClusteringAtZoom={14}
        iconCreateFunction={createCustomClusterIcon}
      >
        {stations.map((station) => (
          <Marker 
            key={station.id} 
            position={[station.lat, station.lon]} 
            icon={icon}
            eventHandlers={{
              click: () => onStationSelect(station)
            }}
          >
            <Popup>
              <strong>{station.name}</strong><br />
              {station.operator}<br />
              <span className="font-bold text-green-600">{station.price.toFixed(2)} {station.currency || 'Kč'}</span><br />
              {station.distance ? `~${station.distance.toFixed(2)} km (Straight)` : ''}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}