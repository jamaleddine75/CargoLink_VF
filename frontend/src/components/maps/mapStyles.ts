// REFINED ROUTE MAP STYLES — Clean, fast, professional navigation UX
export const mapStylesRoutes = `
  /* ===== BASE ===== */
  .leaflet-container {
    background: hsl(var(--background)) !important;
    font-family: inherit;
  }

  /* Smooth tile fade-in (one-shot, no loop) */
  .leaflet-tile-loaded {
    animation: fadeIn 0.3s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ===== POPUPS ===== */
  .premium-map-popup .leaflet-popup-content-wrapper {
    border-radius: 18px !important;
    padding: 0 !important;
    overflow: hidden;
    background: hsl(var(--card) / 0.97) !important;
    box-shadow: 0 12px 40px -8px rgba(0,0,0,0.18), inset 0 1px 0 hsl(var(--border)) !important;
    border: 1px solid hsl(var(--border) / 0.5) !important;
    backdrop-filter: blur(16px);
  }

  .premium-map-popup .leaflet-popup-content {
    margin: 0 !important;
    padding: 14px 18px !important;
  }

  .premium-map-popup .leaflet-popup-close-button {
    color: hsl(var(--muted-foreground)) !important;
    top: 10px !important;
    right: 10px !important;
    font-size: 18px !important;
    width: 22px !important;
    height: 22px !important;
    line-height: 22px !important;
    transition: color 0.2s ease;
  }

  .premium-map-popup .leaflet-popup-close-button:hover {
    color: hsl(var(--primary)) !important;
  }

  .leaflet-popup-tip {
    background: hsl(var(--card)) !important;
  }

  /* ===== TOOLTIPS ===== */
  .leaflet-modern-tooltip {
    background: hsl(var(--card)) !important;
    border: none !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
    border-radius: 10px !important;
    padding: 8px 12px !important;
    font-weight: 700;
    font-size: 12px;
    color: hsl(var(--card-foreground));
  }

  /* ===== DRIVER ICON — subtle pulse only ===== */
  @keyframes driver-subtle-pulse {
    0%   { box-shadow: 0 0 0 0   rgba(59,130,246,0.5); }
    70%  { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
    100% { box-shadow: 0 0 0 0   rgba(59,130,246,0); }
  }

  .driver-icon-container {
    animation: driver-subtle-pulse 2.5s ease-out infinite;
    filter: drop-shadow(0 2px 8px rgba(59,130,246,0.5));
    transition: transform 0.7s cubic-bezier(0.4,0,0.2,1) !important;
    z-index: 1000 !important;
  }

  /* ===== MARKERS — calm, one-shot glow on load ===== */
  .cargo-marker {
    transition: transform 0.2s ease;
    filter: drop-shadow(0 3px 8px rgba(0,0,0,0.2));
  }

  .cargo-marker:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.28));
  }

  /* Pickup: calm green highlight */
  .cargo-marker.pickup {
    filter: drop-shadow(0 2px 8px rgba(16,185,129,0.35));
  }

  /* Delivery: calm red highlight */
  .cargo-marker.delivery {
    filter: drop-shadow(0 2px 8px rgba(239,68,68,0.35));
  }

  /* ===== ACTIVE ROUTE — soft glow, animated dash flow ===== */
  @keyframes flowRoute {
    from { stroke-dashoffset: 40; }
    to   { stroke-dashoffset: 0;  }
  }

  .route-active-glow {
    filter: drop-shadow(0 0 5px rgba(59,130,246,0.6));
    animation: flowRoute 1.8s linear infinite;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: #3B82F6 !important;
    opacity: 0.95;
    stroke-dasharray: 18, 18;
  }

  /* ===== FUTURE ROUTE — muted, static dashed ===== */
  .route-future {
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: #6B7280 !important;
    opacity: 0.45;
    stroke-dasharray: 8, 12;
  }

  /* ===== LEAFLET CONTROLS ===== */
  .leaflet-control-attribution {
    background: rgba(255,255,255,0.8) !important;
    backdrop-filter: blur(6px);
    border-radius: 6px !important;
    font-size: 10px;
  }

  .leaflet-control-zoom {
    box-shadow: 0 4px 16px -4px rgba(0,0,0,0.15) !important;
    border-radius: 12px !important;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.06) !important;
  }

  .leaflet-control-zoom a {
    background: rgba(255,255,255,0.95) !important;
    color: #1f2937 !important;
    border: none !important;
    font-weight: 700;
    width: 36px !important;
    height: 36px !important;
    line-height: 36px !important;
    font-size: 16px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .leaflet-control-zoom a:hover {
    background: #3B82F6 !important;
    color: #fff !important;
  }

  .leaflet-control-zoom a:first-child {
    border-bottom: 1px solid rgba(0,0,0,0.06) !important;
  }

  /* ===== PERSPECTIVE VIEW ===== */
  .map-perspective-view {
    perspective: 1000px;
    transform: perspective(1000px) rotateX(12deg);
    transform-origin: bottom center;
    height: 105% !important;
    margin-top: -2.5%;
    border-radius: 0 !important;
  }

  /* ===== HEATMAP & GAPS ===== */
  @keyframes heatmap-pulse {
    0% { fill-opacity: 0.1; }
    50% { fill-opacity: 0.4; }
    100% { fill-opacity: 0.1; }
  }

  .heatmap-pulse {
    animation: heatmap-pulse 3s ease-in-out infinite;
  }

  @keyframes gap-pulse {
    0% { stroke-width: 1; opacity: 0.4; }
    50% { stroke-width: 3; opacity: 0.8; }
    100% { stroke-width: 1; opacity: 0.4; }
  }

  .gap-pulse {
    animation: gap-pulse 2s ease-in-out infinite;
  }

  .gap-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    pointer-events: none !important;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 640px) {
    .route-active-glow { stroke-width: 5; }
    .route-future      { stroke-width: 3; }
    .map-perspective-view {
      transform: perspective(1000px) rotateX(15deg);
    }
  }
`;

// Inject styles (idempotent)
export const injectMapStylesRoutes = () => {
  if (typeof document !== 'undefined' && !document.getElementById('map-styles-routes')) {
    const style = document.createElement('style');
    style.id = 'map-styles-routes';
    style.innerHTML = mapStylesRoutes;
    document.head.appendChild(style);
  }
};

// Backward compatibility aliases
export const injectMapStyles = injectMapStylesRoutes;
export const mapStyles = mapStylesRoutes;

// BLACK & WHITE MINIMALIST STYLES (for RoutingMap, LocationPickerMap, LiveMap_new)
export const mapStylesMinimal = `
  /* ===== LEAFLET BASE STYLES ===== */
  .leaflet-container {
    background: hsl(var(--card)) !important;
    font-family: inherit;
    position: relative;
  }

  /* ===== TILE LAYER STYLING ===== */
  .leaflet-tile {
    filter: grayscale(100%) brightness(1.1) contrast(1.1);
  }

  .leaflet-tile-loaded {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0.8; }
    to { opacity: 1; }
  }

  /* ===== POPUP STYLES (Minimal Theme Colors) ===== */
  .premium-map-popup .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    padding: 0 !important;
    overflow: hidden;
    background: hsl(var(--card)) !important;
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 hsl(var(--border)) !important;
    border: 1px solid hsl(var(--border)) !important;
  }

  .premium-map-popup .leaflet-popup-content {
    margin: 0 !important;
    padding: 14px 16px !important;
    color: hsl(var(--card-foreground));
    font-weight: 500;
  }

  .premium-map-popup .leaflet-popup-close-button {
    color: hsl(var(--muted-foreground)) !important;
    top: 8px !important;
    right: 8px !important;
    font-size: 18px !important;
    width: 24px !important;
    height: 24px !important;
    line-height: 24px !important;
    transition: all 0.2s ease;
  }

  .premium-map-popup .leaflet-popup-close-button:hover {
    color: hsl(var(--primary)) !important;
  }

  .leaflet-popup-tip {
    background: hsl(var(--card)) !important;
    border-top-color: hsl(var(--card)) !important;
  }

  /* ===== TOOLTIP STYLES ===== */
  .leaflet-modern-tooltip {
    background: hsl(var(--secondary)) !important;
    border: none !important;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2) !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
    font-weight: 600;
    font-size: 12px;
    color: hsl(var(--secondary-foreground));
  }

  .leaflet-modern-tooltip::before {
    border-top-color: hsl(var(--secondary)) !important;
  }

  .leaflet-modern-tooltip::after {
    border-top-color: hsl(var(--secondary)) !important;
  }

  /* ===== MARKER ANIMATIONS ===== */
  .minimal-pin {
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
    transition: filter 0.3s ease;
  }

  .minimal-pin:hover {
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
  }

  /* ===== DRIVER ICON ANIMATION ===== */
  @keyframes driver-pulse-minimal {
    0% {
      box-shadow: 0 0 0 0 hsl(var(--foreground) / 0.4);
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      box-shadow: 0 0 0 12px hsl(var(--foreground) / 0);
    }
    100% {
      box-shadow: 0 0 0 0 hsl(var(--foreground) / 0);
      transform: scale(1);
    }
  }

  .driver-icon {
    animation: driver-pulse-minimal 2.5s ease-out infinite;
    filter: drop-shadow(0 0 12px hsl(var(--foreground) / 0.3))
            drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  /* ===== POLYLINE (ROUTE) ANIMATION ===== */
  @keyframes polyline-draw-minimal {
    from {
      stroke-dasharray: 1500;
      stroke-dashoffset: 1500;
      opacity: 0.3;
    }
    to {
      stroke-dasharray: 1500;
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }

  @keyframes route-glow-minimal {
    0%, 100% {
      filter: drop-shadow(0 0 4px hsl(var(--foreground) / 0.3));
    }
    50% {
      filter: drop-shadow(0 0 8px hsl(var(--foreground) / 0.5));
    }
  }

  .route-polyline {
    animation: polyline-draw-minimal 2.5s ease-out forwards, 
              route-glow-minimal 2s ease-in-out infinite 0.5s;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: hsl(var(--foreground));
    stroke-width: 4;
    opacity: 0.9;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
  }

  /* Route line variants */
  .route-line-pickup {
    stroke: hsl(var(--secondary)) !important;
    stroke-width: 4 !important;
    opacity: 0.85 !important;
  }

  .route-line-delivery {
    stroke: hsl(var(--foreground)) !important;
    stroke-width: 4 !important;
    opacity: 0.9 !important;
  }

  .route-line-all {
    stroke: hsl(var(--muted)) !important;
    stroke-width: 4 !important;
    opacity: 0.85 !important;
  }

  /* ===== ANIMATED ROUTE LINES ===== */
  .route-line-animated {
    animation: polyline-draw-minimal 2.5s ease-out forwards;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .route-line-dash {
    stroke-dasharray: 8, 8;
    animation: dash-animation 20s linear infinite;
  }

  @keyframes dash-animation {
    to {
      stroke-dashoffset: -16;
    }
  }

  /* ===== DESTINATION MARKER PULSE ===== */
  @keyframes pulse-destination-minimal {
    0% {
      r: 18px;
      opacity: 1;
      stroke-width: 2;
    }
    50% {
      r: 32px;
      opacity: 0.2;
      stroke-width: 1;
    }
    100% {
      r: 18px;
      opacity: 1;
      stroke-width: 2;
    }
  }

  @keyframes marker-glow-minimal {
    0%, 100% {
      filter: drop-shadow(0 0 6px hsl(var(--foreground) / 0.3));
    }
    50% {
      filter: drop-shadow(0 0 12px hsl(var(--foreground) / 0.5));
    }
  }

  .destination-pulse {
    animation: pulse-destination-minimal 2s ease-in-out infinite;
  }

  .destination-pulse-secondary {
    animation: pulse-destination-minimal 2.5s ease-in-out infinite;
    animation-delay: 0.3s;
  }

  .delivery-marker {
    animation: marker-glow-minimal 1.8s ease-in-out infinite;
  }

  .pickup-marker {
    animation: marker-glow-minimal 1.8s ease-in-out infinite;
  }

  /* ===== STOP NUMBER BADGES ===== */
  .stop-number-badge {
    font-weight: 900;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    border: 2px solid hsl(var(--foreground));
    box-shadow: 0 0 0 2px hsl(var(--card));
    background: hsl(var(--foreground));
    color: hsl(var(--card));
    border-radius: 50%;
    width: 44px;
    height: 44px;
  }

  .stop-number-badge.pickup-stop {
    background: hsl(var(--secondary));
    border-color: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
  }

  .stop-number-badge.delivery-stop {
    background: hsl(var(--foreground));
    border-color: hsl(var(--foreground));
    color: hsl(var(--card));
  }

  .stop-number-badge.current-stop {
    animation: badge-pulse-minimal 1.5s ease-in-out infinite;
    background: hsl(var(--primary));
    border-color: hsl(var(--primary));
  }

  @keyframes badge-pulse-minimal {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 2px hsl(var(--card)), 0 0 0 4px hsl(var(--primary));
    }
    50% {
      transform: scale(1.08);
      box-shadow: 0 0 0 2px hsl(var(--card)), 0 0 0 6px hsl(var(--primary));
    }
  }

  /* ===== ZOOM CONTROLS ===== */
  .leaflet-control-zoom {
    background: hsl(var(--card)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  }

  .leaflet-control-zoom a {
    background: hsl(var(--card)) !important;
    color: hsl(var(--card-foreground)) !important;
    border: none !important;
    font-size: 18px !important;
    font-weight: 600;
    width: 38px !important;
    height: 38px !important;
    line-height: 38px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .leaflet-control-zoom a:hover {
    background: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }

  .leaflet-control-zoom a:first-child {
    border-radius: 8px 8px 0 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .leaflet-control-zoom a:last-child {
    border-radius: 0 0 8px 8px;
  }

  /* ===== RESPONSIVE ADJUSTMENTS ===== */
  @media (max-width: 640px) {
    .stop-number-badge {
      font-size: 14px;
      width: 40px;
      height: 40px;
    }

    .leaflet-control-zoom a {
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 16px !important;
    }

    .route-polyline {
      stroke-width: 3;
    }

    .route-line-pickup {
      stroke-width: 3 !important;
    }

    .route-line-delivery {
      stroke-width: 3 !important;
    }

    .route-line-all {
      stroke-width: 3 !important;
    }
  }
`;

// Inject minimal styles into document
export const injectMapStylesMinimal = () => {
  if (typeof document !== 'undefined' && !document.getElementById('map-styles-minimal')) {
    const style = document.createElement('style');
    style.id = 'map-styles-minimal';
    style.innerHTML = mapStylesMinimal;
    document.head.appendChild(style);
  }
};
