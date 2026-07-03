import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import VanMarker from './VanMarker';
import VanInfoSidebar from './VanInfoSidebar';
import FreezerMarker from './FreezerMarker';
import FreezerInfoSidebar from './FreezerInfoSidebar';
import TrafficToggle from './TrafficToggle';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const IBADAN_CENTER = [7.3964, 3.9167];
const DEFAULT_ZOOM = 14;

function MapController({ selectedVan, vanList }) {
  const map = useMap();

  const selectedPlate = selectedVan?.vehicle_plate_number ?? null;
  const hasVans = vanList.length > 0;

  // Keep refs updated each render so effects can read fresh data
  // without depending on object/array identity (which changes every poll).
  const selectedVanRef = useRef(selectedVan);
  selectedVanRef.current = selectedVan;

  const vanListRef = useRef(vanList);
  vanListRef.current = vanList;

  const didAutoFitRef = useRef(false);

  useEffect(() => {
    // Force a resize after mount to fix tile rendering
    const timer = setTimeout(() => map.invalidateSize(), 200);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  // Fly to the selected van once when the *selection* changes (keyed on the
  // stable plate string), not on every data poll that refreshes coordinates.
  useEffect(() => {
    if (!selectedPlate) return;
    const v = selectedVanRef.current;
    if (v && v.latitude && v.longitude && !(v.latitude === 0 && v.longitude === 0)) {
      map.flyTo([v.latitude, v.longitude], 16, { duration: 1.5 });
    }
  }, [selectedPlate, map]);

  // Auto-Bounds Mode ("Triangulation Radius"): fire once when data first
  // loads and once each time the user deselects — never on a background poll.
  useEffect(() => {
    if (selectedPlate) {
      didAutoFitRef.current = false;
      return;
    }
    if (didAutoFitRef.current || vanListRef.current.length === 0) return;
    didAutoFitRef.current = true;

    const list = vanListRef.current;
    const coords = list.map((v) => [v.latitude, v.longitude]);
    const newBounds = L.latLngBounds(coords);

    // If only 1 van exists, bounds will be a single point, which breaks fitBounds.
    // We manually pad it out so the map doesn't zoom in infinitely.
    if (coords.length === 1) {
      map.flyTo(coords[0], DEFAULT_ZOOM, { duration: 1.5 });
    } else {
      map.fitBounds(newBounds, { padding: [60, 60], animate: true, duration: 1.5 });
    }
  }, [selectedPlate, map, hasVans]);

  useEffect(() => {
    const handleFlyTo = (e) => {
      const van = e.detail;
      if (van && van.latitude && van.longitude) {
        map.flyTo([van.latitude, van.longitude], 18, { duration: 1.0 });
      }
    };
    window.addEventListener('map:flyTo', handleFlyTo);
    return () => window.removeEventListener('map:flyTo', handleFlyTo);
  }, [map]);

  if (!selectedVan && vanList.length > 1) {
    const coords = [];
    vanList.forEach((van) => {
      coords.push([van.latitude, van.longitude]);
    });
    const b = L.latLngBounds(coords);
    const center = b.getCenter();
    let maxRadius = 0;

    coords.forEach((coord) => {
      const dist = center.distanceTo(L.latLng(coord));
      if (dist > maxRadius) maxRadius = dist;
    });

    const radius = maxRadius * 1.1; // 10% padding so vans don't sit exactly on the line

    // Render the visual triangulation radius area
    return (
      <Circle 
        center={center}
        radius={radius === 0 ? 50 : radius}
        pathOptions={{ color: '#4ade80', weight: 2, fillOpacity: 0.05, dashArray: '5, 5' }} 
      />
    );
  }

  return null;
}

export default function MapView({ vans, selectedVan, onSelectVan, freezers, selectedFreezer, onSelectFreezer }) {
  const [trafficOn, setTrafficOn] = useState(false);

  const vanList = Object.values(vans).filter(
    (van) => van.latitude !== 0 && van.longitude !== 0 && van.latitude && van.longitude
  );
  const freezerList = Object.values(freezers || {}).filter(
    (f) => f.latitude !== 0 && f.longitude !== 0 && f.latitude && f.longitude
  );

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100%' }}>
      <MapContainer
        center={IBADAN_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <MapController selectedVan={selectedVan} vanList={vanList} />
        {trafficOn && MAPBOX_TOKEN ? (
          <TileLayer
            url={`https://api.mapbox.com/styles/v1/mapbox/traffic-day-v2/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
            attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            tileSize={512}
            zoomOffset={-1}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {vanList.map((van) => (
          <VanMarker
            key={van.vehicle_plate_number}
            van={van}
            isSelected={selectedVan?.vehicle_plate_number === van.vehicle_plate_number}
            onClick={onSelectVan}
          />
        ))}

        {freezerList.map((freezer) => (
          <FreezerMarker
            key={freezer.device_id}
            freezer={freezer}
            isSelected={selectedFreezer?.device_id === freezer.device_id}
            onClick={onSelectFreezer}
          />
        ))}
      </MapContainer>

      {MAPBOX_TOKEN && (
        <TrafficToggle active={trafficOn} onToggle={() => setTrafficOn((v) => !v)} />
      )}

      {selectedVan && !selectedFreezer && (
        <VanInfoSidebar
          van={selectedVan}
          onClose={() => onSelectVan(null)}
          onViewOnMap={() => window.dispatchEvent(new CustomEvent('map:flyTo', { detail: selectedVan }))}
        />
      )}

      {selectedFreezer && (
        <FreezerInfoSidebar
          freezer={selectedFreezer}
          onClose={() => onSelectFreezer(null)}
          onViewOnMap={() =>
            window.dispatchEvent(
              new CustomEvent('map:flyTo', {
                detail: { latitude: selectedFreezer.latitude, longitude: selectedFreezer.longitude },
              })
            )
          }
        />
      )}
    </div>
  );
}
