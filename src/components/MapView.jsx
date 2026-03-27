import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import VanMarker from './VanMarker';
import VanInfoSidebar from './VanInfoSidebar';

const IBADAN_CENTER = [7.3964, 3.9167];
const DEFAULT_ZOOM = 14;

function MapController({ selectedVan, vanList }) {
  const map = useMap();
  const [bounds, setBounds] = useState(null);

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

  useEffect(() => {
    if (selectedVan && selectedVan.latitude && selectedVan.longitude && 
        !(selectedVan.latitude === 0 && selectedVan.longitude === 0)) {
      // Zoom into specific van
      map.flyTo([selectedVan.latitude, selectedVan.longitude], 16, {
        duration: 1.5,
      });
      setBounds(null); // Clear the bounds visualization
    } else if (!selectedVan && vanList && vanList.length > 0) {
      // Auto-Bounds Mode ("Triangulation Radius")
      const coords = vanList.map(v => [v.latitude, v.longitude]);
      const newBounds = L.latLngBounds(coords);
      
      // If only 1 van exists, bounds will be a single point, which breaks fitBounds.
      // We manually pad it out so the map doesn't zoom in infinitely.
      if (coords.length === 1) {
        map.flyTo(coords[0], DEFAULT_ZOOM, { duration: 1.5 });
      } else {
        map.fitBounds(newBounds, { padding: [60, 60], animate: true, duration: 1.5 });
      }
      
      setBounds(newBounds);
    }
  }, [selectedVan, vanList, map]);

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

  if (bounds && vanList.length > 1 && !selectedVan) {
    const center = bounds.getCenter();
    let maxRadius = 0;
    
    vanList.forEach(van => {
      const dist = center.distanceTo(L.latLng([van.latitude, van.longitude]));
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

export default function MapView({ vans, selectedVan, onSelectVan }) {
  // Filter out vans with 0.0 coordinates (default GPS values before lock)
  const vanList = Object.values(vans).filter(
    (van) => van.latitude !== 0 && van.longitude !== 0 && van.latitude && van.longitude
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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vanList.map((van) => (
          <VanMarker
            key={van.vehicle_plate_number}
            van={van}
            isSelected={selectedVan?.vehicle_plate_number === van.vehicle_plate_number}
            onClick={onSelectVan}
          />
        ))}
      </MapContainer>

      {selectedVan && (
        <VanInfoSidebar 
          van={selectedVan} 
          onClose={() => onSelectVan(null)} 
          onViewOnMap={() => window.dispatchEvent(new CustomEvent('map:flyTo', { detail: selectedVan }))}
        />
      )}
    </div>
  );
}
