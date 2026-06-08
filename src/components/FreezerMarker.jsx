import { useMemo, useState } from 'react';
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export default function FreezerMarker({ freezer, isSelected, onClick }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoom: () => setZoom(map.getZoom()),
  });

  const icon = useMemo(() => {
    const isOnline = freezer.status === 'online' || freezer.status === 'attention';
    const scaleFactor = Math.pow(1.2, zoom - 14);
    const size = Math.max(20, Math.floor(36 * scaleFactor));
    const anchor = Math.floor(size / 2);
    const color = isOnline ? '#06b6d4' : '#6b7280';
    const bgColor = isOnline ? 'rgba(6,182,212,0.15)' : 'rgba(107,114,128,0.15)';
    const borderColor = isSelected ? '#ffffff' : color;
    const safeId = String(freezer.device_id).replace(/\W/g, '');

    return L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div id="freezer-marker-${safeId}" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
          <svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="32" height="32" rx="8" fill="${bgColor}" stroke="${borderColor}" stroke-width="${isSelected ? 2.5 : 1.5}"/>
            <text x="18" y="24" text-anchor="middle" font-size="17" fill="${color}">❄</text>
          </svg>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [anchor, anchor],
      popupAnchor: [0, -anchor],
    });
  }, [freezer.status, freezer.device_id, zoom, isSelected]);

  if (!freezer.latitude || !freezer.longitude) return null;

  return (
    <Marker
      position={[freezer.latitude, freezer.longitude]}
      icon={icon}
      eventHandlers={{ click: () => onClick(freezer) }}
    >
      <Tooltip
        direction="right"
        offset={[icon.options.iconAnchor[0] * 0.7, -icon.options.iconAnchor[1]]}
        permanent
        className="van-plate-tooltip"
      >
        <span className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg px-2.5 py-1 rounded-md text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap ring-1 ring-black/5">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: freezer.status === 'online' ? '#06b6d4' : '#ef4444',
              display: 'inline-block',
            }}
          />
          {freezer.device_id}
        </span>
      </Tooltip>
    </Marker>
  );
}
