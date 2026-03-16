import { useMemo, useState, useEffect, useRef } from 'react';
import { Marker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import vanActiveImg from '../assets/van-active.png';
import vanDefaultImg from '../assets/van-default.png';

function calculateBearing(startLat, startLng, destLat, destLng) {
  const toRad = (degree) => (degree * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const startLatRad = toRad(startLat);
  const startLngRad = toRad(startLng);
  const destLatRad = toRad(destLat);
  const destLngRad = toRad(destLng);

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  let brng = Math.atan2(y, x);
  return (toDeg(brng) + 360) % 360;
}

function useSmoothMarker(targetPosition, vanId, durationMs = 800) {
  const [currentPosition, setCurrentPosition] = useState(targetPosition);
  const startPositionRef = useRef(targetPosition);
  const targetPositionRef = useRef(targetPosition);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  const currentRotationRef = useRef(0);

  useEffect(() => {
    // If the target hasn't changed, do nothing
    if (
      targetPosition[0] === targetPositionRef.current[0] &&
      targetPosition[1] === targetPositionRef.current[1]
    ) {
      return;
    }

    const startLat = targetPositionRef.current[0];
    const startLng = targetPositionRef.current[1];
    const endLat = targetPosition[0];
    const endLng = targetPosition[1];

    if (startLat !== endLat || startLng !== endLng) {
      let newBearing = calculateBearing(startLat, startLng, endLat, endLng);
      
      if (!isNaN(newBearing)) {
        let currentRotation = currentRotationRef.current;
        
        // Shortest path to avoid 360 spin
        let delta = newBearing - (currentRotation % 360);
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        let targetRotation = currentRotation + delta;

        currentRotationRef.current = targetRotation;

        // Apply rotation to the specific van image
        const safeId = String(vanId).replace(/\W/g, '');
        const imgTarget = document.getElementById(`van-img-${safeId}`);
        if (imgTarget) {
          imgTarget.style.transform = `rotate(${targetRotation}deg)`;
        }
      }
    }

    // Set up new animation
    startPositionRef.current = currentPosition;
    targetPositionRef.current = targetPosition;
    startTimeRef.current = performance.now();

    const animate = (time) => {
      let elapsed = time - startTimeRef.current;
      if (elapsed > durationMs) elapsed = durationMs;

      // Simple ease-out quad
      const progress = elapsed / durationMs;
      const easeOut = progress * (2 - progress);

      const [sLat, sLng] = startPositionRef.current;
      const [eLat, eLng] = targetPositionRef.current;

      const newLat = sLat + (eLat - sLat) * easeOut;
      const newLng = sLng + (eLng - sLng) * easeOut;

      setCurrentPosition([newLat, newLng]);

      if (elapsed < durationMs) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetPosition[0], targetPosition[1], durationMs, vanId]); 
  // only trigger when the actual coordinates change

  return { position: currentPosition, rotationRef: currentRotationRef };
}

export default function VanMarker({ van, isSelected, onClick }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoom: () => {
      setZoom(map.getZoom());
    },
  });

  const { position: animatedPosition, rotationRef } = useSmoothMarker([van.latitude, van.longitude], van.vehicle_plate_number);

  const icon = useMemo(() => {
    const isOnline = van.status === 'online' || van.status === 'attention';
    const scaleFactor = Math.pow(1.2, zoom - 14);
    const size = Math.max(20, Math.floor(40 * scaleFactor));
    const anchor = Math.floor(size / 2);
    const safeId = String(van.vehicle_plate_number).replace(/\W/g, '');

    return L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
          <img 
            id="van-img-${safeId}" 
            src="${isOnline ? vanActiveImg : vanDefaultImg}" 
            style="width: 100%; height: 100%; transition: transform 0.8s ease-out; transform-origin: center; transform: rotate(${rotationRef.current}deg);" 
          />
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [anchor, anchor],
      popupAnchor: [0, -anchor],
    });
  }, [van.status, zoom, van.vehicle_plate_number, rotationRef]);

  if (!van.latitude || !van.longitude) return null;

  return (
    <Marker
      position={animatedPosition}
      icon={icon}
      eventHandlers={{ click: () => onClick(van) }}
    >
      <Tooltip
        direction="right"
        offset={[icon.options.iconAnchor[0] * 0.7, -icon.options.iconAnchor[1]]}
        permanent
        className="van-plate-tooltip"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: van.status === 'online' ? '#22c55e' : van.status === 'attention' ? '#f59e0b' : '#ef4444',
              display: 'inline-block',
            }}
          />
          {van.vehicle_plate_number}
        </span>
      </Tooltip>
    </Marker>
  );
}
