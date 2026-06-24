import { Truck } from "lucide-react";

const footerLinks = [
  { title: "Product", links: ["Features", "Pricing", "Integrations", "API", "Changelog"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
];

const Footer = () => {
  return (
    <footer className="border-t border-border py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2.5 font-display text-lg font-bold text-foreground mb-4">
              <div className="w-8 h-8 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md">
                <Truck className="w-4 h-4 text-primary-foreground" />
              </div>
              CargoLink
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The all-in-one delivery management platform. Trusted by 8,500+ couriers and growing.
            </p>
          </div>
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-bold text-foreground text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CargoLink. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            {["Twitter", "LinkedIn", "GitHub"].map((s) => (
              <a key={s} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
