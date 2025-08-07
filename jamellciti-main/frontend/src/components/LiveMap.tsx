import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore } from '../stores/appStore';
import { getEventColor, getEventIcon, getEventLabel } from '../utils/eventColors';
import type { Cluster, EventType } from '../types';
import { MapPin, Plus, Layers, Info } from 'lucide-react';

export const LiveMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, maplibregl.Marker>>({});
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const { clusters, isConnected } = useAppStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles'
          }
        ]
      },
      center: [-112.0796, 33.4543], // Phoenix downtown center
      zoom: 13,
      minZoom: 10,
      maxZoom: 18
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    console.log('🗺️ Map initialized');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when clusters change
  useEffect(() => {
    if (!map.current) return;

    const currentClusters = Object.values(clusters);
    
    // Remove markers that no longer exist
    Object.keys(markers.current).forEach(clusterId => {
      if (!clusters[clusterId]) {
        markers.current[clusterId].remove();
        delete markers.current[clusterId];
      }
    });

    // Add or update markers
    currentClusters.forEach(cluster => {
      const existingMarker = markers.current[cluster.id];
      
      if (existingMarker) {
        // Update existing marker
        updateMarker(existingMarker, cluster);
      } else {
        // Create new marker
        createMarker(cluster);
      }
    });

    console.log(`🗺️ Updated ${currentClusters.length} markers on map`);
  }, [clusters]);

  const createMarker = (cluster: Cluster) => {
    if (!map.current) return;

    const color = getEventColor(cluster.type as EventType);
    const icon = getEventIcon(cluster.type as EventType);
    
    // Create marker element
    const el = document.createElement('div');
    el.className = 'cluster-marker';
    el.style.cssText = `
      width: 40px;
      height: 40px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      position: relative;
    `;

    // Add icon and count
    el.innerHTML = `
      <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        ${icon}
      </span>
      ${cluster.count > 1 ? `
        <span style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff4d4f;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        ">
          ${cluster.count}
        </span>
      ` : ''}
    `;

    // Add hover effects
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.1)';
      el.style.zIndex = '1000';
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
      el.style.zIndex = '1';
    });

    // Create marker and add to map
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([cluster.lon, cluster.lat])
      .addTo(map.current!);

    // Add click handler
    el.addEventListener('click', () => {
      setSelectedCluster(cluster);
      
      // Fly to marker
      map.current?.flyTo({
        center: [cluster.lon, cluster.lat],
        zoom: 16,
        duration: 1000
      });
    });

    markers.current[cluster.id] = marker;
  };

  const updateMarker = (marker: maplibregl.Marker, cluster: Cluster) => {
    // Update marker position
    marker.setLngLat([cluster.lon, cluster.lat]);
    
    // Update marker appearance
    const el = marker.getElement();
    const color = getEventColor(cluster.type as EventType);
    const icon = getEventIcon(cluster.type as EventType);
    
    el.style.backgroundColor = color;
    el.innerHTML = `
      <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        ${icon}
      </span>
      ${cluster.count > 1 ? `
        <span style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff4d4f;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        ">
          ${cluster.count}
        </span>
      ` : ''}
    `;
  };

  const eventTypes: EventType[] = ['pothole', 'storm_drain_clog', 'near_miss', 'litter_dumping', 'ada_obstruction'];

  return (
    <div className="h-full relative">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Connection Status */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Live Updates' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Legend Toggle */}
      <div className="absolute bottom-20 left-4 z-10">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Toggle Legend"
        >
          <Layers size={20} />
        </button>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-32 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center uppercase tracking-wide">
            <MapPin size={16} className="mr-2" />
            EVENT TYPES
          </h3>
          <div className="space-y-2">
            {eventTypes.map(type => (
              <div key={type} className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-sm"
                  style={{ backgroundColor: getEventColor(type) }}
                >
                  {getEventIcon(type)}
                </div>
                <span className="text-sm text-gray-700 font-medium uppercase tracking-wide">
                  {getEventLabel(type)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              NUMBERS ON MARKERS INDICATE CLUSTERED EVENTS
            </p>
          </div>
        </div>
      )}

      {/* Cluster Details Popup */}
      {selectedCluster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div
                    className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white"
                    style={{ backgroundColor: getEventColor(selectedCluster.type as EventType) }}
                  >
                    {getEventIcon(selectedCluster.type as EventType)}
                  </div>
                  {getEventLabel(selectedCluster.type as EventType)}
                </h3>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Severity</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedCluster.severity}/5
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Events</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedCluster.count}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedCluster.lat.toFixed(4)}, {selectedCluster.lon.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {selectedCluster.type === 'near_miss' && (
                  <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center">
                    <Plus size={16} className="mr-2" />
                    Create Work Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Info size={16} />
          <span>{Object.keys(clusters).length} active clusters</span>
        </div>
      </div>
    </div>
  );
};