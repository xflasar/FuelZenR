'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-200">Loading Map...</div> });

export default function FuelExplorer() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([49.3, 16.5]); 
  const [searchLat, setSearchLat] = useState<number | undefined>(undefined); 
  const [searchLon, setSearchLon] = useState<number | undefined>(undefined);
  
  const [radius, setRadius] = useState(15);
  const [type, setType] = useState('Natural 95');
  const [sortBy, setSortBy] = useState('price');
  const [searchQuery, setSearchQuery] = useState('');

  // Routing State
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const fetchStations = async () => {
    setLoading(true);
    setSelectedStation(null);
    setRouteGeometry([]);
    setRoadDistance(null);

    try {
      const payload: any = { type, sortBy };
      if (searchLat !== undefined && searchLon !== undefined) {
        payload.lat = searchLat;
        payload.lon = searchLon;
        payload.radius = radius;
      }

      const res = await fetch('fuelzenr/api/fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) setStations(await res.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Fetch actual road path using OSRM
  const calculateRoute = async (station: any) => {
    if (searchLat === undefined || searchLon === undefined) {
      alert("Please set your location first to calculate a route.");
      return;
    }

    setSelectedStation(station);
    setRouteLoading(true);
    setMapCenter([station.lat, station.lon]); // Pan to station

    try {
      // OSRM requires coordinates in longitude, latitude order
      const url = `https://router.project-osrm.org/route/v1/driving/${searchLon},${searchLat};${station.lon},${station.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRoadDistance(route.distance / 1000); // Convert meters to km
        
        // Convert GeoJSON [lon, lat] back to Leaflet [lat, lon]
        const leafletCoords = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        setRouteGeometry(leafletCoords);
      }
    } catch (err) {
      console.error("Routing error:", err);
    }
    setRouteLoading(false);
  };

  const locateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setSearchLat(latitude);
        setSearchLon(longitude);
        setMapCenter([latitude, longitude]);
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSearchLat(lat);
        setSearchLon(lon);
        setMapCenter([lat, lon]);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    setSearchLat(lat);
    setSearchLon(lon);
    setMapCenter([lat, lon]);
  };

  const clearLocation = () => {
    setSearchLat(undefined);
    setSearchLon(undefined);
    setSearchQuery('');
    setSelectedStation(null);
    setRouteGeometry([]);
  };

  useEffect(() => {
    fetchStations();
  }, [type, searchLat, searchLon, radius, sortBy]);

  return (
    <div className="flex flex-col md:flex-row flex-grow h-[calc(100vh-64px)] overflow-hidden">
      {/* LEFT SIDE: Controls and Station List */}
      <div className="w-full md:w-[30%] bg-white border-r flex flex-col h-[50vh] md:h-full">
        <div className="p-4 border-b bg-slate-50 space-y-4 shadow-sm z-10">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text" 
              placeholder="City, Street, or Zip..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow p-2 border rounded text-sm"
            />
            <button type="submit" className="bg-slate-800 text-white px-3 py-2 rounded text-sm hover:bg-slate-700">
              Search
            </button>
          </form>

          <div className="flex justify-between items-center">
            <div className="space-x-2">
              <button onClick={locateMe} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                📍 GPS
              </button>
              {searchLat !== undefined && (
                <button onClick={clearLocation} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <select value={type} onChange={(e) => setType(e.target.value)} className="p-2 border rounded">
              <option value="Natural 95">Natural 95</option>
              <option value="Diesel">Diesel</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 border rounded">
              <option value="price">Sort: Price</option>
              {searchLat !== undefined && <option value="distance">Sort: Distance</option>}
            </select>
          </div>
          
          {searchLat !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap text-gray-700">Radius: {radius}km</span>
              <input 
                type="range" min="1" max="100" value={radius} 
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
        
        <div className="overflow-y-auto flex-grow p-4 space-y-3 bg-slate-100">
          {loading ? (
            <p className="text-gray-500 text-center text-sm">Fetching prices...</p>
          ) : stations.map((station) => (
            <div 
              key={station.id} 
              onClick={() => calculateRoute(station)}
              className={`p-3 border rounded shadow-sm transition cursor-pointer ${
                selectedStation?.id === station.id ? 'bg-blue-50 border-blue-400' : 'bg-white hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-800 leading-tight">{station.name}</h3>
                <span className="font-bold ml-2 whitespace-nowrap"
                style={{ color: station.color }}>{station.price.toFixed(2)} Kč</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{station.addressStreet}</p>
              <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border">
                  {station.operator}
                </span>
                {selectedStation?.id === station.id && roadDistance !== null ? (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                    🚗 {roadDistance.toFixed(1)} km (Road)
                  </span>
                ) : station.distance ? (
                  <span className="text-xs font-medium text-blue-600">
                    ✈️ {station.distance.toFixed(1)} km (Straight)
                  </span>
                ) : null}

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Map */}
      <div className="w-full md:w-[70%] h-[50vh] md:h-full relative z-0">
        <Map 
          stations={stations} 
          mapCenter={mapCenter} 
          searchLat={searchLat}
          searchLon={searchLon}
          onMapClick={handleMapClick}
          onStationSelect={calculateRoute}
          routeGeometry={routeGeometry}
        />
      </div>
    </div>
  );
}