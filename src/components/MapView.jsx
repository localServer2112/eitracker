import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import VanMarker from './VanMarker';
import VanInfoSidebar from './VanInfoSidebar';

const IBADAN_CENTER = [7.3964, 3.9167];
const DEFAULT_ZOOM = 14;

function MapController({ selectedVan }) {
  const map = useMap();

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
      map.flyTo([selectedVan.latitude, selectedVan.longitude], 16, {
        duration: 1.5,
      });
    }
  }, [selectedVan, map]);

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
        <MapController selectedVan={selectedVan} />
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
