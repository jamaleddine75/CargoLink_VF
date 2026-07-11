import { Truck } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#" },
      { label: "Integrations", href: "#" },
      { label: "API", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security", href: "#" },
      { label: "GDPR", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Status", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-14">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                <Truck className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-base text-foreground">CargoLink</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
              The operating system for delivery logistics in Morocco. Trusted by 500+ delivery teams across 45+ cities.
            </p>
            <div className="flex items-center gap-4">
              {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm text-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border py-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CargoLink. All rights reserved.
          </span>
          <span className="text-xs text-muted-foreground">
            Made in Morocco
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
