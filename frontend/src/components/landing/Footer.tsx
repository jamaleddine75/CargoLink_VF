import { Link } from "react-router-dom";
import { Truck } from "lucide-react";

const footerLinks = {
  Portals: [
    { label: "Client Login", href: "/login" },
    { label: "Driver Partner Login", href: "/login" },
    { label: "Agency Portal", href: "/login" },
    { label: "Register Account", href: "/register" },
  ],
  "Supported Regions": [
    { label: "Tanger Central Hub", href: "#cities" },
    { label: "Tetouan Agency", href: "#cities" },
    { label: "Fnideq Agency", href: "#cities" },
    { label: "Mdiq Agency", href: "#cities" },
    { label: "Chaouen Agency", href: "#cities" },
  ],
  Platform: [
    { label: "Shipment Tracking", href: "#tracking" },
    { label: "Features Bento Grid", href: "#features" },
    { label: "Delivery Workflow", href: "#workflow" },
    { label: "FAQ Guide", href: "#faq" },
  ],
  Company: [
    { label: "Platform Overview", href: "#about" },
    { label: "Security & COD Escrow", href: "#security" },
    { label: "System Status", href: "#stats" },
  ],
};

const Footer = () => {
  return (
    <footer id="footer" className="border-t border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo + description */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                CargoLink
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vetted delivery logistics and COD settlement tracking for Northern Morocco.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CargoLink. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60">
            <span>Morocco Logistics Network</span>
            <span>•</span>
            <span>Secure COD Escrow Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
