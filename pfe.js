const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaTruck, FaExclamationTriangle, FaQuestionCircle, FaLightbulb,
  FaLayerGroup, FaCogs, FaUserShield, FaBuilding, FaMotorcycle,
  FaBoxOpen, FaChartBar, FaRocket, FaGraduationCap, FaCheckCircle,
  FaMobileAlt, FaMapMarkedAlt, FaWallet, FaBell, FaShieldAlt,
  FaCode, FaDatabase, FaServer, FaSyncAlt, FaChevronRight
} = require("react-icons/fa");

// ─── PALETTE ───────────────────────────────────────────────────────────────
const C = {
  navy:      "1B2A4A",
  navyDark:  "0F1D35",
  navyLight: "2C3E63",
  ice:       "D6E4F7",
  iceLight:  "EBF3FB",
  white:     "FFFFFF",
  accent:    "2F80ED",
  accentAlt: "56A3F0",
  gray:      "6B7280",
  grayLight: "E8EFF7",
  text:      "1B2A4A",
  muted:     "4A5568",
};

// ─── ICON HELPER ────────────────────────────────────────────────────────────
async function iconPng(IconComp, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ─── LAYOUT HELPERS ─────────────────────────────────────────────────────────
const makeShadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 45, opacity: 0.12 });
const makeCard = (x, y, w, h) => ({ x, y, w, h, fill: { color: C.white }, rectRadius: 0.1, shadow: makeShadow() });

function addHeader(slide, title, subtitle, dark = false) {
  // Header bar
  slide.addShape("rect", { x: 0, y: 0, w: 10, h: 1.05, fill: { color: dark ? C.navyDark : C.navy } });
  // Title
  slide.addText(title, {
    x: 0.45, y: 0.08, w: 8.5, h: 0.55, margin: 0,
    fontSize: 26, bold: true, color: C.white, fontFace: "Calibri", valign: "middle"
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.45, y: 0.62, w: 8.5, h: 0.35, margin: 0,
      fontSize: 13, color: C.ice, fontFace: "Calibri", italic: true, valign: "top"
    });
  }
}

function addFooter(slide, pres, num) {
  slide.addShape("rect", { x: 0, y: 5.35, w: 10, h: 0.275, fill: { color: C.navyDark } });
  slide.addText("CargoLink — PFE 2025-2026", {
    x: 0.3, y: 5.35, w: 5, h: 0.275, margin: 0,
    fontSize: 9, color: C.ice, fontFace: "Calibri", valign: "middle"
  });
  slide.addText(`${num} / 17`, {
    x: 8.5, y: 5.35, w: 1.2, h: 0.275, margin: 0,
    fontSize: 9, color: C.ice, fontFace: "Calibri", align: "right", valign: "middle"
  });
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "CargoLink - PFE 2025-2026";

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 1 — TITRE
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    // Big decorative circle
    s.addShape("ellipse", { x: 6.8, y: -1.2, w: 5.5, h: 5.5, fill: { color: C.navyLight, transparency: 55 } });
    s.addShape("ellipse", { x: 7.5, y: -0.5, w: 3.8, h: 3.8, fill: { color: C.accent, transparency: 82 } });

    const truckIcon = await iconPng(FaTruck, "#" + C.accent, 512);
    s.addImage({ data: truckIcon, x: 0.5, y: 0.85, w: 1.1, h: 1.1 });

    s.addText("CargoLink", {
      x: 1.8, y: 0.75, w: 7, h: 1.0, margin: 0,
      fontSize: 52, bold: true, color: C.white, fontFace: "Calibri"
    });
    s.addText("Plateforme intelligente de gestion logistique multi-acteurs", {
      x: 0.5, y: 1.85, w: 9, h: 0.7, margin: 0,
      fontSize: 18, color: C.ice, fontFace: "Calibri", italic: true
    });

    // Divider
    s.addShape("rect", { x: 0.5, y: 2.7, w: 4.5, h: 0.04, fill: { color: C.accent } });

    // Team
    s.addText("Projet de Fin d'Études — 2025-2026", {
      x: 0.5, y: 2.85, w: 9, h: 0.45, margin: 0,
      fontSize: 14, color: C.accentAlt, fontFace: "Calibri"
    });
    s.addText("Encadrant : [Nom de l'encadrant]", {
      x: 0.5, y: 3.3, w: 9, h: 0.4, margin: 0,
      fontSize: 13, color: C.ice, fontFace: "Calibri"
    });

    // Role tags
    const roles = ["Admin", "Agence", "Livreur", "Client"];
    roles.forEach((r, i) => {
      s.addShape("roundRect", { x: 0.5 + i * 2.3, y: 3.85, w: 2.1, h: 0.45, fill: { color: C.accent, transparency: 70 }, rectRadius: 0.1 });
      s.addText(r, {
        x: 0.5 + i * 2.3, y: 3.85, w: 2.1, h: 0.45, margin: 0,
        fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle"
      });
    });

    // Stack
    s.addText("React 18  ·  TypeScript  ·  Java 21  ·  Spring Boot  ·  PostgreSQL", {
      x: 0.5, y: 4.55, w: 9, h: 0.35, margin: 0,
      fontSize: 11, color: C.gray, fontFace: "Calibri"
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 2 — PROBLEMATIQUE
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "La logistique fragmentée", "Problématique");
    addFooter(s, pres, 2);

    const icon = await iconPng(FaExclamationTriangle, "#" + C.accent, 256);
    s.addImage({ data: icon, x: 0.45, y: 1.2, w: 0.55, h: 0.55 });

    // Problem cards — 2x2 grid
    const problems = [
      { title: "Gestion manuelle", desc: "Les agences utilisent Excel, WhatsApp ou des appels pour coordonner les livraisons" },
      { title: "Zéro visibilité client", desc: "Aucun suivi en temps réel — le client ne sait pas où est son colis" },
      { title: "Livreurs déconnectés", desc: "Missions transmises par appel ou SMS, sans optimisation des routes" },
      { title: "Finances opaques", desc: "Pas de traçabilité centralisée entre la plateforme, les agences et les livreurs" },
    ];

    const cols = [0.4, 5.2];
    const rows = [1.85, 3.55];
    for (let i = 0; i < 4; i++) {
      const cx = cols[i % 2], cy = rows[Math.floor(i / 2)];
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(cx, cy, 4.5, 1.45), rectRadius: 0.1 });
      s.addShape("rect", { x: cx, y: cy, w: 0.22, h: 1.45, fill: { color: C.accent }, rectRadius: 0 });
      s.addText(problems[i].title, {
        x: cx + 0.35, y: cy + 0.12, w: 4.05, h: 0.42, margin: 0,
        fontSize: 14, bold: true, color: C.text, fontFace: "Calibri"
      });
      s.addText(problems[i].desc, {
        x: cx + 0.35, y: cy + 0.55, w: 4.05, h: 0.78, margin: 0,
        fontSize: 12, color: C.muted, fontFace: "Calibri", valign: "top"
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 3 — QUESTIONS
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Questions directrices", "Trois défis à résoudre");
    addFooter(s, pres, 3);

    const icon = await iconPng(FaQuestionCircle, "#" + C.accent, 256);
    s.addImage({ data: icon, x: 0.45, y: 1.2, w: 0.55, h: 0.55 });

    const qs = [
      { q: "Comment centraliser la gestion des commandes de plusieurs agences en temps réel ?" },
      { q: "Comment offrir au client un suivi transparent et instantané de sa livraison ?" },
      { q: "Comment automatiser les flux financiers entre plateforme, agences et livreurs ?" },
    ];

    qs.forEach((item, i) => {
      const y = 1.3 + i * 1.28;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(0.4, y, 9.2, 1.1), rectRadius: 0.1 });
      s.addShape("ellipse", { x: 0.52, y: y + 0.22, w: 0.65, h: 0.65, fill: { color: C.navy } });
      s.addText(String(i + 1), {
        x: 0.52, y: y + 0.22, w: 0.65, h: 0.65, margin: 0,
        fontSize: 18, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle"
      });
      s.addText(item.q, {
        x: 1.35, y: y + 0.12, w: 8.1, h: 0.85, margin: 0,
        fontSize: 15, color: C.text, fontFace: "Calibri", valign: "middle"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 4 — SOLUTION
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    addHeader(s, "Notre solution — CargoLink", "Une plateforme, quatre rôles, un hub central", true);
    addFooter(s, pres, 4);

    // Central hub
    s.addShape("ellipse", { x: 3.8, y: 1.65, w: 2.4, h: 2.4, fill: { color: C.accent } });
    s.addText("CargoLink", {
      x: 3.8, y: 1.65, w: 2.4, h: 2.4, margin: 0,
      fontSize: 16, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle"
    });

    // 4 actors
    const actors = [
      { label: "Admin Global", sub: "Supervise tout", icon: FaUserShield, x: 0.3, y: 1.9 },
      { label: "Admin Agence", sub: "Pilote l'agence", icon: FaBuilding, x: 7.1, y: 1.9 },
      { label: "Livreur", sub: "Exécute les missions", icon: FaMotorcycle, x: 0.3, y: 3.55 },
      { label: "Client", sub: "Commande & suit", icon: FaBoxOpen, x: 7.1, y: 3.55 },
    ];

    // Connector lines to center
    const lineProps = [
      { x: 1.85, y: 2.5, w: 1.95, h: 0 },
      { x: 6.2, y: 2.5, w: 1.95, h: 0 },
      { x: 1.85, y: 4.15, w: 1.95, h: 0 },
      { x: 6.2, y: 4.15, w: 1.95, h: 0 },
    ];
    lineProps.forEach(lp => {
      s.addShape(pres.shapes.LINE, { ...lp, line: { color: C.accentAlt, width: 1.5, dashType: "dash" } });
    });

    for (const a of actors) {
      const ic = await iconPng(a.icon, "#" + C.accent, 256);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: a.x, y: a.y, w: 2.55, h: 1.2,
        fill: { color: C.navyLight }, rectRadius: 0.1,
        shadow: makeShadow()
      });
      s.addImage({ data: ic, x: a.x + 0.15, y: a.y + 0.28, w: 0.48, h: 0.48 });
      s.addText(a.label, {
        x: a.x + 0.72, y: a.y + 0.1, w: 1.7, h: 0.5, margin: 0,
        fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", valign: "bottom"
      });
      s.addText(a.sub, {
        x: a.x + 0.72, y: a.y + 0.62, w: 1.7, h: 0.45, margin: 0,
        fontSize: 11, color: C.ice, fontFace: "Calibri", valign: "top"
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 5 — STACK TECHNIQUE
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Stack technique", "Technologies utilisées");
    addFooter(s, pres, 5);

    const cols = [
      {
        title: "Frontend", icon: FaCode, color: "2F80ED",
        items: ["React 18 + Vite", "TypeScript", "106 pages / rôle", "WebSocket client"]
      },
      {
        title: "Backend", icon: FaServer, color: "1B2A4A",
        items: ["Java 21", "Spring Boot 3", "Spring Security + JWT", "25+ controllers REST", "WebSocket STOMP"]
      },
      {
        title: "Infra & Data", icon: FaDatabase, color: "0F1D35",
        items: ["PostgreSQL 14", "Flyway migrations", "GitHub Actions CI/CD", "3 pipelines (build, test, deploy)"]
      },
    ];

    for (let i = 0; i < 3; i++) {
      const col = cols[i];
      const x = 0.35 + i * 3.22;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(x, 1.15, 3.0, 4.0), rectRadius: 0.1 });
      s.addShape("rect", { x, y: 1.15, w: 3.0, h: 0.62, fill: { color: col.color }, rectRadius: 0 });

      const ic = await iconPng(col.icon, "#FFFFFF", 256);
      s.addImage({ data: ic, x: x + 0.18, y: 1.22, w: 0.42, h: 0.42 });
      s.addText(col.title, {
        x: x + 0.7, y: 1.22, w: 2.2, h: 0.48, margin: 0,
        fontSize: 16, bold: true, color: C.white, fontFace: "Calibri", valign: "middle"
      });

      col.items.forEach((item, j) => {
        const iy = 1.95 + j * 0.68;
        s.addShape("ellipse", { x: x + 0.22, y: iy + 0.08, w: 0.22, h: 0.22, fill: { color: col.color } });
        s.addText(item, {
          x: x + 0.55, y: iy, w: 2.35, h: 0.45, margin: 0,
          fontSize: 12, color: C.text, fontFace: "Calibri", valign: "middle"
        });
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 6 — ARCHITECTURE
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Architecture logicielle", "Organisation des couches backend & frontend");
    addFooter(s, pres, 6);

    // Backend layers
    const layers = [
      { label: "Controller (REST API)", color: C.accent },
      { label: "Service (Logique métier)", color: C.navy },
      { label: "Repository (JPA)", color: C.navyLight },
      { label: "Entity (Domaine)", color: C.navyDark },
    ];

    s.addText("Backend", { x: 0.45, y: 1.25, w: 4.2, h: 0.38, margin: 0, fontSize: 14, bold: true, color: C.navy, fontFace: "Calibri" });
    layers.forEach((l, i) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.45 + i * 0.15, y: 1.68 + i * 0.7, w: 4.1 - i * 0.3, h: 0.55,
        fill: { color: l.color }, rectRadius: 0.07
      });
      s.addText(l.label, {
        x: 0.45 + i * 0.15, y: 1.68 + i * 0.7, w: 4.1 - i * 0.3, h: 0.55, margin: 0,
        fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle"
      });
    });

    // Arrow
    s.addText("JWT + Rôles\n(ADMIN / AGENCY_ADMIN\nDRIVER / CLIENT)", {
      x: 0.45, y: 4.55, w: 4.2, h: 0.65, margin: 0,
      fontSize: 10, color: C.muted, fontFace: "Calibri", italic: true
    });

    // Divider
    s.addShape(pres.shapes.LINE, { x: 5.1, y: 1.2, w: 0, h: 3.9, line: { color: C.grayLight, width: 1 } });

    // Frontend
    s.addText("Frontend", { x: 5.35, y: 1.25, w: 4.2, h: 0.38, margin: 0, fontSize: 14, bold: true, color: C.navy, fontFace: "Calibri" });
    const frontItems = [
      { label: "/admin — Dashboard, agences, finances", icon: FaUserShield },
      { label: "/agency — Ops, livreurs, commandes", icon: FaBuilding },
      { label: "/driver — Missions, carte, wallet", icon: FaMotorcycle },
      { label: "/client — Commandes, suivi live", icon: FaBoxOpen },
    ];
    for (let i = 0; i < 4; i++) {
      const ic = await iconPng(frontItems[i].icon, "#" + C.accent, 200);
      const y = 1.68 + i * 0.78;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 5.35, y, w: 4.25, h: 0.6,
        fill: { color: C.white }, rectRadius: 0.07, shadow: makeShadow()
      });
      s.addImage({ data: ic, x: 5.5, y: y + 0.1, w: 0.38, h: 0.38 });
      s.addText(frontItems[i].label, {
        x: 6.0, y, w: 3.5, h: 0.6, margin: 0,
        fontSize: 12, color: C.text, fontFace: "Calibri", valign: "middle"
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 7 — MODULE ADMIN
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Module Admin global", "Supervision complète de la plateforme");
    addFooter(s, pres, 7);

    const adminIcon = await iconPng(FaUserShield, "#" + C.white, 256);
    s.addShape("ellipse", { x: 8.3, y: 1.0, w: 1.4, h: 1.4, fill: { color: C.navy } });
    s.addImage({ data: adminIcon, x: 8.45, y: 1.15, w: 1.1, h: 1.1 });

    const items = [
      "Dashboard KPIs temps réel : commandes, revenus, agences actives",
      "Création d'agences via wizard multi-étapes (5 écrans guidés)",
      "Carte live globale : positions de tous les livreurs en simultané",
      "Gestion financière : wallets, virements, réconciliation",
      "Administration des utilisateurs, rôles, tarification et régions",
      "Audit log complet et historique de sécurité",
    ];

    items.forEach((item, i) => {
      const y = 1.3 + i * 0.65;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(0.4, y, 7.7, 0.55), rectRadius: 0.08 });
      s.addShape("rect", { x: 0.4, y, w: 0.22, h: 0.55, fill: { color: C.accent } });
      s.addText(item, {
        x: 0.75, y, w: 7.25, h: 0.55, margin: 0,
        fontSize: 12.5, color: C.text, fontFace: "Calibri", valign: "middle"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 8 — MODULE AGENCE
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Module Agence", "Gestion opérationnelle & financière");
    addFooter(s, pres, 8);

    const agIcon = await iconPng(FaBuilding, "#" + C.white, 256);
    s.addShape("ellipse", { x: 8.3, y: 1.0, w: 1.4, h: 1.4, fill: { color: C.navy } });
    s.addImage({ data: agIcon, x: 8.45, y: 1.15, w: 1.1, h: 1.1 });

    const items = [
      "Dashboard unifié : Live Ops (missions en cours) + KPIs agence",
      "Gestion livreurs : profils, shifts, badges, sanctions disciplinaires",
      "Création & suivi des commandes + optimisation de routes",
      "Gestion clients de l'agence & carnet d'adresses partagé",
      "Wallet agence : solde, transactions, demandes de virement",
      "Réconciliation financière et facturation inter-agences",
    ];

    items.forEach((item, i) => {
      const y = 1.3 + i * 0.65;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(0.4, y, 7.7, 0.55), rectRadius: 0.08 });
      s.addShape("rect", { x: 0.4, y, w: 0.22, h: 0.55, fill: { color: C.navyLight } });
      s.addText(item, {
        x: 0.75, y, w: 7.25, h: 0.55, margin: 0,
        fontSize: 12.5, color: C.text, fontFace: "Calibri", valign: "middle"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 9 — MODULE LIVREUR
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Module Livreur", "Interface mobile-first pour les chauffeurs");
    addFooter(s, pres, 9);

    const icons = [FaMapMarkedAlt, FaBell, FaMobileAlt, FaWallet, FaShieldAlt, FaSyncAlt];
    const items = [
      "Navigation GPS + optimisation de route en temps réel",
      "Réception et acceptation des missions instantanément",
      "Flux de livraison : scan QR + preuve photo/signature",
      "Wallet livreur : gains, historique, demande de retrait",
      "Déclaration d'incidents et signalements en direct",
      "Dashboard shifts : statut, missions du jour, performance",
    ];

    for (let i = 0; i < 6; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.4 + col * 4.85, y = 1.3 + row * 1.38;
      const ic = await iconPng(icons[i], "#" + C.accent, 200);

      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(x, y, 4.55, 1.18), rectRadius: 0.1 });
      s.addImage({ data: ic, x: x + 0.2, y: y + 0.25, w: 0.48, h: 0.48 });
      s.addText(items[i], {
        x: x + 0.82, y: y + 0.1, w: 3.6, h: 1.0, margin: 0,
        fontSize: 12.5, color: C.text, fontFace: "Calibri", valign: "middle"
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 10 — MODULE CLIENT
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Module Client", "Expérience de commande & suivi transparent");
    addFooter(s, pres, 10);

    const clientIcon = await iconPng(FaBoxOpen, "#" + C.white, 256);
    s.addShape("ellipse", { x: 8.3, y: 1.0, w: 1.4, h: 1.4, fill: { color: C.navy } });
    s.addImage({ data: clientIcon, x: 8.45, y: 1.15, w: 1.1, h: 1.1 });

    const items = [
      "Inscription self-service et gestion du profil client",
      "Création de commandes avec carnet d'adresses sauvegardé",
      "Suivi en temps réel sur carte interactive (WebSocket)",
      "Historique complet des commandes et détails",
      "Wallet client : solde, paiement, recharges",
      "Ouverture d'incidents et support client intégré",
    ];

    items.forEach((item, i) => {
      const y = 1.3 + i * 0.65;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(0.4, y, 7.7, 0.55), rectRadius: 0.08 });
      s.addShape("rect", { x: 0.4, y, w: 0.22, h: 0.55, fill: { color: C.navyDark } });
      s.addText(item, {
        x: 0.75, y, w: 7.25, h: 0.55, margin: 0,
        fontSize: 12.5, color: C.text, fontFace: "Calibri", valign: "middle"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 11 — DEMO
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    addHeader(s, "Démonstration live", "Scénario complet de bout en bout", true);
    addFooter(s, pres, 11);

    const steps = [
      { num: "1", label: "Login Admin", desc: "Dashboard global + carte live" },
      { num: "2", label: "Login Agence", desc: "Créer une commande client" },
      { num: "3", label: "Login Livreur", desc: "Accepter + voir route optimisée" },
      { num: "4", label: "Login Client", desc: "Suivi temps réel sur carte" },
      { num: "5", label: "Retour Admin", desc: "Wallet agence mis à jour" },
    ];

    steps.forEach((step, i) => {
      const y = 1.3 + i * 0.78;
      s.addShape("ellipse", { x: 0.4, y: y + 0.08, w: 0.58, h: 0.58, fill: { color: C.accent } });
      s.addText(step.num, {
        x: 0.4, y: y + 0.08, w: 0.58, h: 0.58, margin: 0,
        fontSize: 16, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle"
      });

      if (i < steps.length - 1) {
        s.addShape(pres.shapes.LINE, { x: 0.685, y: y + 0.66, w: 0, h: 0.2, line: { color: C.accentAlt, width: 1.5 } });
      }

      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 1.15, y, w: 7.85, h: 0.62,
        fill: { color: C.navyLight }, rectRadius: 0.08
      });
      s.addText(step.label, {
        x: 1.35, y, w: 3.2, h: 0.62, margin: 0,
        fontSize: 15, bold: true, color: C.white, fontFace: "Calibri", valign: "middle"
      });
      s.addText(`→  ${step.desc}`, {
        x: 4.6, y, w: 4.2, h: 0.62, margin: 0,
        fontSize: 13, color: C.ice, fontFace: "Calibri", valign: "middle", italic: true
      });
    });

    // Tip
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.4, y: 5.05, w: 9.2, h: 0.25,
      fill: { color: C.accent, transparency: 80 }, rectRadius: 0.06
    });
    s.addText("💡  Conseil : 2 navigateurs côte à côte pour montrer la synchronisation temps réel", {
      x: 0.5, y: 5.05, w: 9.0, h: 0.25, margin: 0,
      fontSize: 10.5, color: C.ice, fontFace: "Calibri", italic: true, valign: "middle"
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 12 — RÉSULTATS / CHIFFRES
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Ce que nous avons livré", "En chiffres");
    addFooter(s, pres, 12);

    const stats = [
      { num: "25+", label: "Controllers REST", sub: "API documentée Swagger" },
      { num: "4", label: "Rôles distincts", sub: "Interfaces dédiées par acteur" },
      { num: "106", label: "Pages frontend", sub: "React + TypeScript" },
      { num: "3", label: "Pipelines CI/CD", sub: "GitHub Actions" },
      { num: "JWT", label: "Authentification", sub: "Spring Security multi-rôle" },
      { num: "WS", label: "Temps réel", sub: "WebSocket STOMP" },
    ];

    const cols2 = [0.35, 3.6, 6.85];
    const rows2 = [1.2, 3.0];
    for (let i = 0; i < 6; i++) {
      const x = cols2[i % 3], y = rows2[Math.floor(i / 3)];
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(x, y, 3.0, 1.6), rectRadius: 0.1 });
      s.addText(stats[i].num, {
        x, y: y + 0.12, w: 3.0, h: 0.75, margin: 0,
        fontSize: 38, bold: true, color: C.navy, fontFace: "Calibri", align: "center"
      });
      s.addText(stats[i].label, {
        x, y: y + 0.85, w: 3.0, h: 0.38, margin: 0,
        fontSize: 13, bold: true, color: C.text, fontFace: "Calibri", align: "center"
      });
      s.addText(stats[i].sub, {
        x, y: y + 1.2, w: 3.0, h: 0.32, margin: 0,
        fontSize: 11, color: C.muted, fontFace: "Calibri", align: "center"
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 13 — DIFFICULTÉS
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Défis & solutions", "Ce que nous avons surmonté");
    addFooter(s, pres, 13);

    const items = [
      { prob: "Sécurité multi-rôle", sol: "@PreAuthorize + JWT par rôle (ADMIN, AGENCY, DRIVER, CLIENT)" },
      { prob: "Temps réel", sol: "WebSocket STOMP avec gestion des connexions actives et reconnexion" },
      { prob: "Optimisation de routes", sol: "Controller dédié RouteOptimisationController avec algorithme TSP" },
      { prob: "Gestion financière", sol: "Wallet distinct par acteur + réconciliation automatique" },
      { prob: "Proof of delivery", sol: "Scan QR code + capture photo + signature (UnifiedProof)" },
    ];

    items.forEach((item, i) => {
      const y = 1.25 + i * 0.78;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(0.4, y, 9.2, 0.65), rectRadius: 0.08 });
      // Problem side
      s.addShape("rect", { x: 0.4, y, w: 3.2, h: 0.65, fill: { color: C.navy, transparency: 5 }, rectRadius: 0 });
      s.addText(item.prob, {
        x: 0.55, y, w: 2.95, h: 0.65, margin: 0,
        fontSize: 12.5, bold: true, color: C.white, fontFace: "Calibri", valign: "middle"
      });
      // Arrow
      s.addText("→", {
        x: 3.6, y, w: 0.5, h: 0.65, margin: 0,
        fontSize: 20, color: C.accent, fontFace: "Calibri", align: "center", valign: "middle"
      });
      // Solution side
      s.addText(item.sol, {
        x: 4.2, y, w: 5.3, h: 0.65, margin: 0,
        fontSize: 12, color: C.muted, fontFace: "Calibri", valign: "middle"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 14 — PERSPECTIVES
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Perspectives & améliorations", "Ce qui vient ensuite");
    addFooter(s, pres, 14);

    const rocketIcon = await iconPng(FaRocket, "#" + C.white, 256);
    s.addShape("ellipse", { x: 8.3, y: 1.0, w: 1.4, h: 1.4, fill: { color: C.accent } });
    s.addImage({ data: rocketIcon, x: 8.45, y: 1.15, w: 1.1, h: 1.1 });

    const persp = [
      { title: "Application mobile native", desc: "React Native pour les livreurs — offline-first" },
      { title: "Intelligence artificielle", desc: "Prédiction de délais + affectation automatique des livreurs" },
      { title: "Paiement intégré", desc: "PayPal, Stripe, paiement à la livraison" },
      { title: "Multi-langue", desc: "i18n complet : arabe, français, anglais" },
      { title: "Analytics avancés", desc: "Rapports exportables PDF/Excel pour les agences" },
      { title: "Déploiement cloud", desc: "Containerisation Docker + orchestration Kubernetes" },
    ];

    for (let i = 0; i < 6; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.4 + col * 4.85, y = 1.25 + row * 1.28;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(x, y, 4.55, 1.1), rectRadius: 0.1 });
      s.addShape("ellipse", { x: x + 0.2, y: y + 0.28, w: 0.52, h: 0.52, fill: { color: C.navy } });
      s.addText(String(i + 1), {
        x: x + 0.2, y: y + 0.28, w: 0.52, h: 0.52, margin: 0,
        fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle"
      });
      s.addText(persp[i].title, {
        x: x + 0.85, y: y + 0.08, w: 3.55, h: 0.42, margin: 0,
        fontSize: 13, bold: true, color: C.text, fontFace: "Calibri"
      });
      s.addText(persp[i].desc, {
        x: x + 0.85, y: y + 0.52, w: 3.55, h: 0.5, margin: 0,
        fontSize: 11.5, color: C.muted, fontFace: "Calibri"
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 15 — APPRENTISSAGES
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.iceLight };
    addHeader(s, "Ce que ce projet nous a appris", "Compétences acquises");
    addFooter(s, pres, 15);

    const gradIcon = await iconPng(FaGraduationCap, "#" + C.white, 256);
    s.addShape("ellipse", { x: 8.3, y: 1.0, w: 1.4, h: 1.4, fill: { color: C.navy } });
    s.addImage({ data: gradIcon, x: 8.45, y: 1.15, w: 1.1, h: 1.1 });

    const lessons = [
      "Concevoir une architecture logicielle scalable dès la phase de conception",
      "Travailler en équipe avec Git branching, pull requests et code review",
      "Penser l'expérience utilisateur pour des profils métiers très différents",
      "Gérer la complexité croissante grâce à CI/CD, migrations et tests",
      "Intégrer des fonctionnalités temps réel dans une app full-stack",
    ];

    const checkIcon = await iconPng(FaCheckCircle, "#" + C.accent, 200);
    lessons.forEach((lesson, i) => {
      const y = 1.32 + i * 0.75;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { ...makeCard(0.4, y, 7.7, 0.62), rectRadius: 0.08 });
      s.addImage({ data: checkIcon, x: 0.6, y: y + 0.14, w: 0.38, h: 0.38 });
      s.addText(lesson, {
        x: 1.12, y, w: 6.85, h: 0.62, margin: 0,
        fontSize: 13, color: C.text, fontFace: "Calibri", valign: "middle"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 16 — CONCLUSION
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    addHeader(s, "Conclusion", "CargoLink — Un produit livrable", true);
    addFooter(s, pres, 16);

    const truckIcon = await iconPng(FaTruck, "#" + C.accent, 512);
    s.addImage({ data: truckIcon, x: 7.8, y: 1.5, w: 1.8, h: 1.8 });

    s.addText(
      "CargoLink répond concrètement aux trois questions posées :\n" +
      "une plateforme unifiée, un suivi transparent et des flux financiers automatisés.\n" +
      "Nous avons livré un système fonctionnel, sécurisé et extensible.",
      {
        x: 0.5, y: 1.3, w: 7.1, h: 1.7, margin: 0,
        fontSize: 16, color: C.ice, fontFace: "Calibri", lineSpacingMultiple: 1.5
      }
    );

    // 3 checks
    const checks = [
      { label: "Centralisation multi-agences", done: true },
      { label: "Suivi client temps réel", done: true },
      { label: "Flux financiers automatisés", done: true },
    ];
    const checkIcon = await iconPng(FaCheckCircle, "#" + C.accent, 200);
    checks.forEach((c, i) => {
      s.addImage({ data: checkIcon, x: 0.5, y: 3.28 + i * 0.62, w: 0.38, h: 0.38 });
      s.addText(c.label, {
        x: 1.05, y: 3.22 + i * 0.62, w: 5.5, h: 0.52, margin: 0,
        fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", valign: "middle"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 17 — QUESTIONS
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    addFooter(s, pres, 17);
    // Big decorative circle
    s.addShape("ellipse", { x: 6.5, y: -1.5, w: 6.5, h: 6.5, fill: { color: C.navyLight, transparency: 60 } });

    s.addText("Merci pour", {
      x: 0.5, y: 0.7, w: 9, h: 0.9, margin: 0,
      fontSize: 48, color: C.ice, fontFace: "Cambria", italic: true
    });
    s.addText("votre attention", {
      x: 0.5, y: 1.55, w: 9, h: 1.0, margin: 0,
      fontSize: 54, bold: true, color: C.white, fontFace: "Calibri"
    });

    s.addShape("rect", { x: 0.5, y: 2.72, w: 3.5, h: 0.05, fill: { color: C.accent } });

    s.addText("Nous sommes disponibles pour toute question.", {
      x: 0.5, y: 2.92, w: 9, h: 0.55, margin: 0,
      fontSize: 16, color: C.ice, fontFace: "Calibri", italic: true
    });

    // Prep tips
    const tips = [
      "Pourquoi Spring Boot vs Node.js ?",
      "Comment gérez-vous la sécurité ?",
      "Quelle différence Admin vs Agency Admin ?",
      "Le système est-il scalable ?",
    ];
    s.addText("Questions anticipées :", {
      x: 0.5, y: 3.65, w: 9, h: 0.4, margin: 0,
      fontSize: 13, bold: true, color: C.accentAlt, fontFace: "Calibri"
    });
    tips.forEach((tip, i) => {
      s.addText(`${i + 1}.  ${tip}`, {
        x: 0.7, y: 4.08 + i * 0.3, w: 8.6, h: 0.3, margin: 0,
        fontSize: 12, color: C.ice, fontFace: "Calibri"
      });
    });
  }

  await pres.writeFile({ fileName: "./CargoLink_PFE.pptx" });
  console.log("✅ Done");
}

main().catch(e => { console.error(e); process.exit(1); });