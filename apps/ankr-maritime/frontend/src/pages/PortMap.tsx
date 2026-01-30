import { useEffect, useRef, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const PORTS_QUERY = gql`
  query PortsForMap {
    ports {
      id
      unlocode
      name
      country
      latitude
      longitude
    }
  }
`;

export function PortMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedPort, setSelectedPort] = useState<Record<string, unknown> | null>(null);
  const { data } = useQuery(PORTS_QUERY);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [72.8, 18.9], // Mumbai
      zoom: 2.5,
    });

    map.current.addControl(new maplibregl.NavigationControl());

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add port markers when data loads
  useEffect(() => {
    if (!map.current || !data?.ports) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.port-marker');
    existingMarkers.forEach((m) => m.remove());

    for (const port of data.ports) {
      if (port.latitude == null || port.longitude == null) continue;

      const el = document.createElement('div');
      el.className = 'port-marker';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '2px solid #1e40af';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        setSelectedPort(port);
        map.current?.flyTo({
          center: [port.longitude, port.latitude],
          zoom: 8,
          duration: 1500,
        });
      });

      new maplibregl.Marker({ element: el })
        .setLngLat([port.longitude, port.latitude])
        .addTo(map.current);
    }
  }, [data]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-maritime-800 border-b border-maritime-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Port Map</h1>
          <p className="text-maritime-400 text-xs">{data?.ports?.length ?? 0} ports | OSS Maps (MapLibre + OpenStreetMap)</p>
        </div>
        {selectedPort && (
          <div className="bg-maritime-900 border border-maritime-600 rounded-md px-4 py-2">
            <p className="text-white text-sm font-medium">{selectedPort.name as string}</p>
            <p className="text-maritime-400 text-xs">{selectedPort.unlocode as string} | {selectedPort.country as string}</p>
          </div>
        )}
      </div>
      <div ref={mapContainer} className="flex-1" />
    </div>
  );
}
