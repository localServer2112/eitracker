import { useMemo, useState } from 'react';
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import freezerImg from '../assets/freezer.svg';

export default function FreezerMarker({ freezer, isSelected, onClick }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoom: () => setZoom(map.getZoom()),
  });

  const icon = useMemo(() => {
    const scaleFactor = Math.pow(1.2, zoom - 14);
    const size = Math.max(20, Math.floor(40 * scaleFactor));
    const anchor = Math.floor(size / 2);
    const safeId = String(freezer.device_id).replace(/\W/g, '');

    return L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
          <img
            id="freezer-img-${safeId}"
            src="${freezerImg}"
            style="width:100%;height:100%;object-fit:contain;"
          />
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [anchor, anchor],
      popupAnchor: [0, -anchor],
    });
  }, [freezer.device_id, zoom]);

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
              backgroundColor: freezer.status === 'online' || freezer.status === 'attention' ? '#22c55e' : '#ef4444',
              display: 'inline-block',
            }}
          />
          {freezer.device_id}
        </span>
      </Tooltip>
    </Marker>
  );
}
