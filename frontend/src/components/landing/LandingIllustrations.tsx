import React from "react";

type Props = {
  className?: string;
  size?: number;
};

// Brand Colors
const BLUE = "#2563EB";
const ORANGE = "#EA580C";
const SLATE_BORDER = "#E2E8F0";
const SLATE_BG = "#F8FAFC";
const TEXT_MUTED = "#64748B";

/* ============================================================
   1. Shared SVG Definitions
   ============================================================ */
function SharedDefs() {
  return (
    <defs>
      <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={BLUE} />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={ORANGE} />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      <pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
      </pattern>
    </defs>
  );
}

/* ============================================================
   2. MoroccoMap (Supported Cities Delivery Network Map)
   ============================================================ */
export function MoroccoMap({ className, size }: Props) {
  const w = 500;
  const h = 400;
  return (
    <svg
      className={className}
      width={size ?? w}
      height={size ? (size * h) / w : h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <SharedDefs />
      {/* Background Dot Pattern */}
      <rect width={w} height={h} fill="url(#dotGrid)" rx="8" />

      {/* Network Lines */}
      {/* Tanger (120, 280) - Tetouan (220, 220) */}
      <line x1="120" y1="280" x2="220" y2="220" stroke={BLUE} strokeWidth="2" strokeDasharray="4 4" />
      {/* Tetouan (220, 220) - Fnideq (290, 120) */}
      <line x1="220" y1="220" x2="290" y2="120" stroke={BLUE} strokeWidth="2" strokeDasharray="4 4" />
      {/* Fnideq (290, 120) - Mdiq (270, 170) */}
      <line x1="290" y1="120" x2="270" y2="170" stroke={BLUE} strokeWidth="2" strokeDasharray="4 4" />
      {/* Tetouan (220, 220) - Chaouen (320, 310) */}
      <line x1="220" y1="220" x2="320" y2="310" stroke={BLUE} strokeWidth="2" strokeDasharray="4 4" />

      {/* Node: Tanger */}
      <circle cx="120" cy="280" r="8" fill={BLUE} />
      <circle cx="120" cy="280" r="14" stroke={BLUE} strokeWidth="1" strokeOpacity="0.4" />
      <text x="120" y="305" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Tanger</text>

      {/* Node: Tetouan */}
      <circle cx="220" cy="220" r="8" fill={BLUE} />
      <circle cx="220" cy="220" r="14" stroke={BLUE} strokeWidth="1" strokeOpacity="0.4" />
      <text x="220" y="245" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Tetouan</text>

      {/* Node: Fnideq */}
      <circle cx="290" cy="120" r="8" fill={BLUE} />
      <circle cx="290" cy="120" r="14" stroke={BLUE} strokeWidth="1" strokeOpacity="0.4" />
      <text x="290" y="105" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Fnideq</text>

      {/* Node: Mdiq */}
      <circle cx="270" cy="170" r="8" fill={BLUE} />
      <circle cx="270" cy="170" r="14" stroke={BLUE} strokeWidth="1" strokeOpacity="0.4" />
      <text x="295" y="174" textAnchor="start" fill="#0F172A" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Mdiq</text>

      {/* Node: Chaouen */}
      <circle cx="320" cy="310" r="8" fill={BLUE} />
      <circle cx="320" cy="310" r="14" stroke={BLUE} strokeWidth="1" strokeOpacity="0.4" />
      <text x="320" y="335" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Chaouen</text>

      {/* Status Overlay */}
      <rect x="20" y="20" width="130" height="60" rx="6" fill="#FFFFFF" stroke={SLATE_BORDER} strokeWidth="1" />
      <circle cx="35" cy="40" r="4" fill="#22C55E" />
      <text x="48" y="44" fill="#0F172A" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Northern Hub</text>
      <text x="35" y="65" fill={TEXT_MUTED} fontSize="8" fontFamily="sans-serif">5 Regions Active</text>
    </svg>
  );
}

/* ============================================================
   3. RouteOptimization (Automated Dispatch Routing Map)
   ============================================================ */
export function RouteOptimization({ className, size }: Props) {
  const w = 400;
  const h = 300;
  return (
    <svg
      className={className}
      width={size ?? w}
      height={size ? (size * h) / w : h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <SharedDefs />
      <rect width={w} height={h} fill={SLATE_BG} rx="8" stroke={SLATE_BORDER} strokeWidth="1" />
      
      {/* Route Path lines */}
      <path d="M 60,200 Q 140,80 220,180 T 340,100" stroke={SLATE_BORDER} strokeWidth="4" strokeLinecap="round" />
      <path d="M 60,200 Q 140,80 220,180 T 340,100" stroke={BLUE} strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />

      {/* Origin Node */}
      <circle cx="60" cy="200" r="6" fill={BLUE} />
      <circle cx="60" cy="200" r="10" stroke={BLUE} strokeWidth="1" strokeOpacity="0.4" />
      <text x="60" y="225" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Pickup</text>

      {/* Stop Node */}
      <circle cx="220" cy="180" r="5" fill="#EF4444" />
      <text x="220" y="165" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Agency</text>

      {/* Target Node */}
      <circle cx="340" cy="100" r="6" fill={ORANGE} />
      <circle cx="340" cy="100" r="10" stroke={ORANGE} strokeWidth="1" strokeOpacity="0.4" />
      <text x="340" y="85" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Destination</text>

      {/* Vehicle Indicator */}
      <rect x="140" y="110" width="36" height="18" rx="4" fill="#0F172A" />
      <text x="158" y="122" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Transit</text>
    </svg>
  );
}

/* ============================================================
   4. QRScannerIllustration (Courier QR Proof of Delivery)
   ============================================================ */
export function QRScannerIllustration({ className, size }: Props) {
  const w = 300;
  const h = 300;
  return (
    <svg
      className={className}
      width={size ?? w}
      height={size ? (size * h) / w : h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <SharedDefs />
      <rect width={w} height={h} fill={SLATE_BG} rx="8" stroke={SLATE_BORDER} strokeWidth="1" />

      {/* QR Code Graphic */}
      <rect x="90" y="90" width="120" height="120" rx="8" fill="#FFFFFF" stroke={SLATE_BORDER} strokeWidth="2" />
      {/* Outer anchors */}
      <rect x="105" y="105" width="25" height="25" fill="#0F172A" />
      <rect x="110" y="110" width="15" height="15" fill="#FFFFFF" />
      <rect x="170" y="105" width="25" height="25" fill="#0F172A" />
      <rect x="175" y="110" width="15" height="15" fill="#FFFFFF" />
      <rect x="105" y="170" width="25" height="25" fill="#0F172A" />
      <rect x="110" y="175" width="15" height="15" fill="#FFFFFF" />
      {/* Dotted fills */}
      <rect x="145" y="105" width="15" height="15" fill="#0F172A" />
      <rect x="170" y="145" width="25" height="15" fill="#0F172A" />
      <rect x="145" y="170" width="15" height="25" fill="#0F172A" />
      <rect x="170" y="170" width="15" height="15" fill="#0F172A" />

      {/* Laser Scan Line */}
      <line x1="80" y1="150" x2="220" y2="150" stroke={ORANGE} strokeWidth="3" />
      <line x1="80" y1="150" x2="220" y2="150" stroke={ORANGE} strokeWidth="8" strokeOpacity="0.15" />

      {/* Frame brackets */}
      <path d="M 75,95 L 75,75 L 95,75" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
      <path d="M 225,95 L 225,75 L 205,75" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
      <path d="M 75,205 L 75,225 L 95,225" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
      <path d="M 225,205 L 225,225 L 205,225" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ============================================================
   5. SecureEscrowIllustration (Financial & Payments Protection)
   ============================================================ */
export function SecureEscrowIllustration({ className, size }: Props) {
  const w = 300;
  const h = 300;
  return (
    <svg
      className={className}
      width={size ?? w}
      height={size ? (size * h) / w : h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <SharedDefs />
      <rect width={w} height={h} fill={SLATE_BG} rx="8" stroke={SLATE_BORDER} strokeWidth="1" />

      {/* Lock Shield Icon */}
      <path d="M 150,80 C 180,80 200,90 200,90 L 200,160 C 200,200 150,225 150,225 C 150,225 100,200 100,160 L 100,90 C 100,90 120,80 150,80 Z" fill="#FFFFFF" stroke={BLUE} strokeWidth="4" />
      
      {/* Keyhole */}
      <circle cx="150" cy="135" r="8" fill={BLUE} />
      <path d="M 147,143 L 153,143 L 156,165 L 144,165 Z" fill={BLUE} />

      {/* Check Badge */}
      <circle cx="210" cy="200" r="22" fill="#22C55E" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M 199,200 L 206,207 L 220,193" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================================================
   6. DriverVerificationIllustration (Driver Registration vetting)
   ============================================================ */
export function DriverVerificationIllustration({ className, size }: Props) {
  const w = 300;
  const h = 300;
  return (
    <svg
      className={className}
      width={size ?? w}
      height={size ? (size * h) / w : h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={w} height={h} fill={SLATE_BG} rx="8" stroke={SLATE_BORDER} strokeWidth="1" />

      {/* Document layout */}
      <rect x="70" y="60" width="160" height="180" rx="8" fill="#FFFFFF" stroke={SLATE_BORDER} strokeWidth="2" />
      
      {/* Header Profile Photo */}
      <rect x="90" y="80" width="35" height="35" rx="4" fill={SLATE_BG} stroke={SLATE_BORDER} strokeWidth="1" />
      <circle cx="1075" cy="92" r="5" fill={TEXT_MUTED} />
      <path d="M 93,115 C 93,105 102,105 107,105 C 112,105 121,105 121,115 Z" fill={TEXT_MUTED} />

      {/* Text placeholder lines */}
      <line x1="140" y1="85" x2="210" y2="85" stroke={SLATE_BORDER} strokeWidth="4" strokeLinecap="round" />
      <line x1="140" y1="98" x2="190" y2="98" stroke={SLATE_BORDER} strokeWidth="4" strokeLinecap="round" />
      <line x1="90" y1="140" x2="210" y2="140" stroke={SLATE_BORDER} strokeWidth="2" strokeLinecap="round" />
      <line x1="90" y1="155" x2="180" y2="155" stroke={SLATE_BORDER} strokeWidth="2" strokeLinecap="round" />
      <line x1="90" y1="170" x2="200" y2="170" stroke={SLATE_BORDER} strokeWidth="2" strokeLinecap="round" />

      {/* Stamp / Check */}
      <rect x="150" y="190" width="60" height="24" rx="4" fill="#22C55E" />
      <text x="180" y="205" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">VERIFIED</text>
    </svg>
  );
}

/* ============================================================
   7. Legacy/Compat Exports (Maps to the requests from original pages)
   ============================================================ */
export function HeroIllustration({ className, size }: Props) {
  return <RouteOptimization className={className} size={size} />;
}
export function DashboardMockup({ className, size }: Props) {
  return <MoroccoMap className={className} size={size} />;
}
export function DriverIllustration({ className, size }: Props) {
  return <DriverVerificationIllustration className={className} size={size} />;
}
export function CustomerIllustration({ className, size }: Props) {
  return <SecureEscrowIllustration className={className} size={size} />;
}
export function AgencyIllustration({ className, size }: Props) {
  return <RouteOptimization className={className} size={size} />;
}
export function FleetIllustration({ className, size }: Props) {
  return <RouteOptimization className={className} size={size} />;
}
export function AIIllustration({ className, size }: Props) {
  return <RouteOptimization className={className} size={size} />;
}
export function MobileMockup({ className, size }: Props) {
  return <QRScannerIllustration className={className} size={size} />;
}
export function TrackingIllustration({ className, size }: Props) {
  return <QRScannerIllustration className={className} size={size} />;
}
export function NotificationsIllustration({ className, size }: Props) {
  return <SecureEscrowIllustration className={className} size={size} />;
}
