import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { Package, Home } from 'lucide-react';
import { cn } from "@/lib/utils";
import { injectMapStylesRoutes } from '../maps/mapStyles';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as unknown)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  type: 'PICKUP' | 'DELIVERY' | 'DRIVER' | 'AGENCY';
  status?: string;
  label?: string;
  trackingNumber?: string;
  data?: Record<string, unknown>;
}

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

interface OSRMResponse {
  routes: OSRMRoute[];
  code: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface CoverageGap {
  lat: number;
  lng: number;
  demand: number;
  supply: number;
  radius: number;
}

export interface MapDriver {
  id: string;
  lat: number;
  lng: number;
  label: string;
  status: 'on-time' | 'at-risk' | 'delayed';
  heading?: number;
  color?: string;
  route?: [number, number][];
}

interface CargoMapProps {
  points?: MapPoint[];
  heatmapPoints?: HeatmapPoint[];
  coverageGaps?: CoverageGap[];
  center?: [number, number];
  zoom?: number;
  showRoute?: boolean;
  onPointClick?: (point: MapPoint) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  onRouteUpdate?: (info: { distance: number, duration: number }) => void;
  mode?: 'LIVE' | 'ROUTING' | 'PICKER' | 'ZONES' | 'GLOBAL';
  height?: string;
  className?: string;
  driverPos?: { lat: number; lng: number };
  multiDrivers?: MapDriver[];
  driverHeading?: number;
  followDriver?: boolean;
  activePointId?: string;
  interactive?: boolean;
  theme?: 'light' | 'dark' | 'satellite';
  maxBounds?: [[number, number], [number, number]];
  maxBoundsViscosity?: number;
  onManualInteraction?: () => void;
}

// --- Icons ---
const createDriverIcon = (rotation: number) => {
  const html = renderToStaticMarkup(
    <div
      style={{ width: 48, height: 48, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Direction arrow above car */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: `translateX(-50%) rotate(${rotation}deg)`,
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderBottom: '9px solid #3B82F6',
        filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.7))'
      }} />

      {/* Car body */}
      <div style={{
        transform: `rotate(${rotation}deg)`,
        background: '#2563EB',
        borderRadius: 10,
        width: 36,
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glass shine */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)'
        }} />
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'white', position: 'relative' }}>
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
        </svg>
      </div>
    </div>
  );
  // CSS class handles the subtle pulse ring
  return L.divIcon({ html, iconSize: [48, 56], iconAnchor: [24, 28], className: 'driver-icon-container' });
};

const createGlobalDriverIcon = (label: string, status: string, heading: number = 0) => {
  const colors = {
    'on-time': '#10B981', // Emerald 500
    'at-risk': '#F59E0B', // Amber 500
    'delayed': '#EF4444', // Red 500
  };
  const color = (colors as unknown)[status] || '#3B82F6';

  const html = renderToStaticMarkup(
    <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 32, height: 32,
        backgroundColor: color,
        borderRadius: '50% 50% 50% 0',
        transform: `rotate(${heading - 45}deg)`,
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ 
          transform: `rotate(${-heading + 45}deg)`,
          color: 'white', fontSize: 10, fontWeight: 900 
        }}>
          {label}
        </div>
      </div>
    </div>
  );
  return L.divIcon({ html, iconSize: [40, 40], iconAnchor: [20, 20], className: 'global-driver-icon' });
};

const createMarkerIcon = (type: string, number?: string | number, isActive = false) => {
  const isPickup = type === 'PICKUP';
  const bg      = isPickup ? '#06B6D4' : '#F97316';
  const shadow  = isPickup ? 'rgba(6,182,212,0.35)' : 'rgba(249,115,22,0.35)';
  const Icon    = isPickup ? Package : Home;

  const html = renderToStaticMarkup(
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.3s ease' }}>
      {/* Marker body */}
      <div style={{
        width: 44, height: 44,
        borderRadius: 14,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2.5px solid rgba(255,255,255,0.98)',
        boxShadow: `0 4px 14px ${shadow}, 0 2px 6px rgba(0,0,0,0.2)`,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle glass shine */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 55%)'
        }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Icon style={{ width: 18, height: 18, color: 'white' }} />
          {number && <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.9)', marginTop: 1, lineHeight: 1 }}>{number}</span>}
        </div>
      </div>
      {/* Pin tail */}
      <div style={{
        width: 10, height: 10,
        transform: 'rotate(45deg)',
        marginTop: -5,
        background: bg,
        borderRight: '2px solid rgba(255,255,255,0.9)',
        borderBottom: '2px solid rgba(255,255,255,0.9)'
      }} />
    </div>
  );
  return L.divIcon({ html, iconSize: [44, 58], iconAnchor: [22, 58], popupAnchor: [0, -52], className: 'cargo-marker' });
};


// --- Sub-components ---
const MapController = ({ 
  center, 
  zoom, 
  bounds, 
  followDriver, 
  driverPos, 
  targetPos 
}: { 
  center?: L.LatLngExpression, 
  zoom?: number, 
  bounds?: L.LatLngBoundsExpression,
  followDriver?: boolean,
  driverPos?: { lat: number; lng: number },
  targetPos?: MapPoint
}) => {
  const map = useMap();
  const lastPos = useRef<{ lat: number, lng: number } | null>(null);

  // Initial bounds fit
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [80, 80], animate: true, duration: 1.5 });
    }
  }, [bounds, map]);

  // Smart Follow & Auto-Zoom
  useEffect(() => {
    if (!followDriver || !driverPos) return;

    // Calculate dynamic zoom
    let dynamicZoom = zoom || map.getZoom();
    
    if (!zoom && targetPos) {
      const dist = L.latLng(driverPos.lat, driverPos.lng).distanceTo(L.latLng(targetPos.lat, targetPos.lng));
      if (dist < 800) dynamicZoom = 18; // Closer zoom for POV
      else if (dist > 5000) dynamicZoom = 14; 
      else dynamicZoom = 16;
    }

    // Center directly on driver (flat top-down view)
    const targetLatLng: [number, number] = [driverPos.lat, driverPos.lng];

    const distToCenter = map.getCenter().distanceTo(L.latLng(targetLatLng));

    // Smooth transition
    if (distToCenter > 100) {
      map.flyTo(targetLatLng, dynamicZoom, { duration: 1, easeLinearity: 0.25 });
    } else if (distToCenter > 2) {
      map.panTo(targetLatLng, { animate: true, duration: 0.5 });
    }

    lastPos.current = driverPos;
  }, [driverPos, followDriver, targetPos, zoom, map]);

  // Manual Center/Zoom updates
  useEffect(() => {
    if (center && !followDriver) {
      const [lat, lng] = Array.isArray(center) ? center : [ (center as unknown).lat, (center as unknown).lng ];
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
        map.flyTo(center, zoom || map.getZoom(), {
          duration: 1.5
        });
      }
    }
  }, [center, zoom, map, followDriver]);

  return null;
};

const MapInteraction = ({ onInteraction }: { onInteraction: () => void }) => {
  useMapEvents({
    dragstart: () => onInteraction(),
    zoomstart: () => onInteraction(),
  });
  return null;
};

const LocationPicker = ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const EMPTY_POINTS: MapPoint[] = [];
const EMPTY_ROUTE: [number, number][] = [];

// --- Main Component ---
const CargoMap: React.FC<CargoMapProps> = ({
  points = EMPTY_POINTS,
  heatmapPoints = EMPTY_POINTS as unknown,
  coverageGaps = EMPTY_POINTS as unknown,
  center,
  zoom = 13,
  showRoute = false,
  onPointClick,
  onLocationSelect,
  mode = 'LIVE',
  height = '100%',
  className,
  driverPos,
  multiDrivers = [],
  driverHeading = 0,
  followDriver,
  activePointId,
  interactive = true,
  theme = 'light',
  onRouteUpdate,
  maxBounds,
  maxBoundsViscosity = 1.0,
  onManualInteraction
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center || [35.7595, -5.8340]); // Default to Tanger
  const [activeRoutePath, setActiveRoutePath] = useState<[number, number][]>(EMPTY_ROUTE);
  const [futureRoutePath, setFutureRoutePath] = useState<[number, number][]>(EMPTY_ROUTE);

  useEffect(() => {
    injectMapStylesRoutes();
  }, []);

  // Calculate bounds if points provided
  const bounds = useMemo(() => {
    if (points.length === 0 && !driverPos) return undefined;
    const b = L.latLngBounds([]);
    points.forEach(p => {
      if (p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng)) {
        b.extend([p.lat, p.lng]);
      }
    });
    if (driverPos && driverPos.lat != null && driverPos.lng != null && !isNaN(driverPos.lat) && !isNaN(driverPos.lng)) {
      b.extend([driverPos.lat, driverPos.lng]);
    }
    return b.isValid() ? b : undefined;
  }, [points, driverPos]);

  // Handle route fetching — tracks both position AND active target to re-route correctly
  const lastRoutedPos = useRef<{ lat: number, lng: number } | null>(null);
  const lastActivePointId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const dp = driverPos;
    if (!showRoute || !dp || isNaN(dp.lat) || isNaN(dp.lng)) {
      if (activeRoutePath.length > 0) setActiveRoutePath(EMPTY_ROUTE);
      if (futureRoutePath.length > 0) setFutureRoutePath(EMPTY_ROUTE);
      return;
    }

    const fetchRoute = async () => {
      // Find the active target point based on activePointId
      const activeTarget = points.find(p => p.id === activePointId);
      
      if (!activeTarget || activeTarget.lat == null || activeTarget.lng == null || isNaN(activeTarget.lat) || isNaN(activeTarget.lng)) {
        if (activeRoutePath.length > 0) setActiveRoutePath(EMPTY_ROUTE);
        if (futureRoutePath.length > 0) setFutureRoutePath(EMPTY_ROUTE);
        return;
      }

      // Re-route if: target changed, or driver moved >30m since last route
      const targetChanged = lastActivePointId.current !== activePointId;
      const distSinceLastRoute = lastRoutedPos.current 
        ? L.latLng(dp.lat, dp.lng).distanceTo(L.latLng(lastRoutedPos.current.lat, lastRoutedPos.current.lng))
        : 999;

      if (!targetChanged && distSinceLastRoute < 30 && activeRoutePath.length > 0) return;

      // OSRM format: longitude,latitude
      const activeWaypoints = [
        `${dp.lng},${dp.lat}`,
        `${activeTarget.lng},${activeTarget.lat}`
      ];

      lastActivePointId.current = activePointId;

      try {
        const controller = new AbortController();
        const signal = controller.signal;
        const fetchTimeout = setTimeout(() => controller.abort(), 8000);

        // 1. Fetch Active Route (Driver -> Active Target)
        try {
          const activeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${activeWaypoints.join(';')}?overview=full&geometries=geojson`, { signal });
          const activeData: OSRMResponse = await activeRes.json();
          
          if (activeData.routes && activeData.routes[0]) {
            const path = activeData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
            setActiveRoutePath(path);
            lastRoutedPos.current = dp;
            
            if (onRouteUpdate) {
              onRouteUpdate({
                distance: activeData.routes[0].distance,
                duration: activeData.routes[0].duration
              });
            }
          } else {
            throw new Error('No route found');
          }
        } catch (activeErr) {
          console.warn('Active route fetch failed, using fallback:', activeErr);
          // Fallback to straight line
          setActiveRoutePath([[dp.lat, dp.lng], [activeTarget.lat, activeTarget.lng]]);
        }

        // 2. Fetch Future Route (if heading to pickup and delivery exists)
        if (activeTarget.type === 'PICKUP') {
          const deliveryTarget = points.find(p => p.type === 'DELIVERY');
          if (deliveryTarget && deliveryTarget.lat != null && deliveryTarget.lng != null && !isNaN(deliveryTarget.lat) && !isNaN(deliveryTarget.lng)) {
            const futureWaypoints = [
              `${activeTarget.lng},${activeTarget.lat}`,
              `${deliveryTarget.lng},${deliveryTarget.lat}`
            ];
            try {
              const futureRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${futureWaypoints.join(';')}?overview=full&geometries=geojson`, { signal });
              const futureData: OSRMResponse = await futureRes.json();
              if (futureData.routes && futureData.routes[0]) {
                const fPath = futureData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
                setFutureRoutePath(fPath);
              }
            } catch (futureErr) {
              console.warn('Future route fetch failed:', futureErr);
              setFutureRoutePath([[activeTarget.lat, activeTarget.lng], [deliveryTarget.lat, deliveryTarget.lng]]);
            }
          }
        } else {
          if (futureRoutePath.length > 0) setFutureRoutePath(EMPTY_ROUTE);
        }

        clearTimeout(fetchTimeout);
      } catch (e) {
        console.error('Route service unavailable:', e);
      }
    };

    const timer = setTimeout(fetchRoute, 300);
    return () => clearTimeout(timer);
  }, [points, driverPos, activePointId, showRoute]);

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-border/50 shadow-inner transition-all duration-1000", 
        theme === 'dark' ? 'bg-[#111]' : 'bg-slate-100', 
        className
      )} 
      style={{ height }}
    >
      <MapContainer 
        center={mapCenter as L.LatLngExpression} 
        zoom={zoom}
        minZoom={8}
        maxBounds={maxBounds || [[27.0, -14.0], [37.0, -1.0]] as L.LatLngBoundsExpression}
        maxBoundsViscosity={maxBoundsViscosity}
        scrollWheelZoom={interactive}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url={theme === 'satellite'
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : theme === 'dark' 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />
        
        <MapController 
          center={center}
          bounds={bounds} 
          followDriver={followDriver} 
          driverPos={driverPos} 
          targetPos={points.find(p => p.id === activePointId)}
          zoom={zoom}
        />

        {onManualInteraction && (
          <MapInteraction onInteraction={onManualInteraction} />
        )}
        
        {mode === 'PICKER' && onLocationSelect && (
          <LocationPicker onSelect={onLocationSelect} />
        )}

        {/* Future Segment (Pickup -> Delivery) */}
        {showRoute && futureRoutePath.length > 0 && (
          <Polyline 
            positions={futureRoutePath} 
            pathOptions={{ 
              color: '#6B7280', 
              weight: 4, 
              opacity: 0.45, 
              dashArray: '8, 12',
              lineJoin: 'round',
              lineCap: 'round',
              className: 'route-future'
            }} 
          />
        )}

        {/* Segmented Active Route (Uber Style dual-layer) */}
        {showRoute && activeRoutePath.length > 0 && (
          <>
            {/* Shadow casing for contrast on any map theme */}
            <Polyline 
              positions={activeRoutePath} 
              pathOptions={{ 
                color: '#000000', 
                weight: 12, 
                opacity: 0.25, 
                lineJoin: 'round',
                lineCap: 'round'
              }} 
            />
            {/* Main blue navigation line */}
            <Polyline 
              positions={activeRoutePath} 
              pathOptions={{ 
            color: '#0EA5E9',
                weight: 6, 
                opacity: 1, 
                lineJoin: 'round',
                lineCap: 'round',
                className: 'route-active-glow'
              }} 
            />
          </>
        )}

        {/* Markers */}
        {points
          .filter(point => point.lat != null && point.lng != null && !isNaN(point.lat) && !isNaN(point.lng))
          .map((point, idx) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={createMarkerIcon(point.type, point.label || (idx + 1), activePointId === point.id)}
            draggable={mode === 'PICKER'}
            eventHandlers={{
              click: () => onPointClick?.(point),
              dragend: (e) => {
                if (mode === 'PICKER' && onLocationSelect) {
                  const marker = e.target;
                  if (marker) {
                    const position = marker.getLatLng();
                    onLocationSelect(position.lat, position.lng);
                  }
                }
              }
            }}
          >
            <Popup className="premium-map-popup">
              <div className="p-1">
                <p className="font-black text-sm mb-1">{point.label || `Point ${idx + 1}`}</p>
                {point.trackingNumber && <p className="text-[10px] font-bold text-muted-foreground uppercase">{point.trackingNumber}</p>}
                <p className="text-[10px] font-medium mt-2">{point.type}</p>
              </div>
            </Popup>
            <Tooltip permanent={false} direction="top" className="leaflet-modern-tooltip">
              {point.label || point.type}
            </Tooltip>
          </Marker>
        ))}

        {/* Driver Marker (Single POV) */}
        {driverPos && driverPos.lat != null && driverPos.lng != null && !isNaN(driverPos.lat) && !isNaN(driverPos.lng) && (
          <Marker position={[driverPos.lat, driverPos.lng]} icon={createDriverIcon(driverHeading)}>
            <Popup className="premium-map-popup">
              <div className="p-1">
                <p className="font-black text-sm">Votre Position</p>
                <p className="text-[10px] text-muted-foreground">En direct</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Global Drivers (Monitoring) */}
        {mode === 'GLOBAL' && multiDrivers.map((driver) => (
          <React.Fragment key={driver.id}>
            {driver.route && (
              <Polyline 
                positions={driver.route}
                pathOptions={{
                  color: driver.color || '#3B82F6',
                  weight: 4,
                  opacity: 0.6,
                  lineJoin: 'round',
                  lineCap: 'round'
                }}
              />
            )}
            <Marker 
              position={[driver.lat, driver.lng]} 
              icon={createGlobalDriverIcon(driver.label, driver.status, driver.heading)}
              eventHandlers={{
                click: () => onPointClick?.({ id: driver.id, lat: driver.lat, lng: driver.lng, type: 'DRIVER', label: driver.label } as unknown)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} className="leaflet-modern-tooltip backdrop-blur-md bg-[#020617]/80 border-white/10">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    driver.status === 'on-time' ? "bg-emerald-500" : driver.status === 'at-risk' ? "bg-amber-500" : "bg-rose-500"
                  )} />
                  <span className="font-black uppercase tracking-widest">{driver.label}</span>
                </div>
              </Tooltip>
            </Marker>
          </React.Fragment>
        ))}

        {/* Heatmap Layer (Simulated with Circles for performance/compatibility) */}
        {mode === 'ZONES' && heatmapPoints.map((p, i) => (
          <Circle
            key={`heat-${i}`}
            center={[p.lat, p.lng]}
            radius={300}
            pathOptions={{
              fillColor: '#ef4444',
              fillOpacity: Math.min(0.6, p.intensity * 0.1),
              color: 'transparent',
              className: 'heatmap-pulse'
            }}
          />
        ))}

        {/* Coverage Gaps Layer */}
        {mode === 'ZONES' && coverageGaps.map((gap, i) => (
          <Circle
            key={`gap-${i}`}
            center={[gap.lat, gap.lng]}
            radius={gap.radius}
            pathOptions={{
              fillColor: '#f59e0b',
              fillOpacity: 0.3,
              color: '#f59e0b',
              weight: 2,
              dashArray: '5, 10',
              className: 'gap-pulse'
            }}
          >
            <Tooltip permanent={true} direction="center" className="gap-tooltip">
              <div className="text-[10px] font-black uppercase text-amber-600">
                Gap: {gap.demand - gap.supply} Units
              </div>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
};

export default CargoMap;
