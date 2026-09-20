# 🌾 Chakkibook — Enterprise Mill Management & AI Co-Pilot System

> **Live Repository**: [https://github.com/krshforever/chakkibook](https://github.com/krshforever/chakkibook)  
> **Tech Stack**: React 19 • Vite / Esbuild • Zustand • HSL CSS Tokens • Lucide Icons • i18n • jsPDF

---

## 📖 Overview
**Chakkibook** is an enterprise-grade digital register and intelligent mill co-pilot tailored for Atta Chakki (flour mill) and Spellar (mustard oil expeller) owners across rural and semi-urban India.

Designed with a **Vercel-grade light mode aesthetic**, **100% SVG Lucide React icons** (zero emojis), and **48px+ ergonomic touch targets**, Chakkibook provides a friction-free experience for mill operators and village elders.

---

## ✨ Core Features
- **Executive Hero KPI Banner**: Real-time revenue (*Kul Kamai*), volume (*Pisai/Pirai kg*), and outstanding dues (*Baki Udhar*) with period-over-period percentage badges.
- **Multi-Village Command Center (`GaonSelector`)**: 1-tap horizontal pill bar for filtering live queues, debtor accounts, and village metrics.
- **Friction-Free Order Entry Engine**: 4-mode switcher (*Chakki Grinding*, *Spellar Pressing*, *Khari Sale*, *Owner Stock*), 1-tap primary grain cards (*Gehun*, *Bajra*, *Makka*, *Chana*, *Multigrain*), and auto-calculated kadda deductions.
- **Kisan Khata & Ledger**: 1-tap customer detail sheets, running balance timeline, printable PDF statements (`jsPDF`), and 3-tier WhatsApp payment reminder builder.
- **Collapsible Settings Accordion**: Categorized collapsible cards for grain/kadda rates, spellar pressing fees, shop info, team permissions, machine maintenance logs, and data backups.
- **Chakki AI Co-Pilot**: Deep natural language command parser (*"Ramesh Kumar 50kg gehun pisai bori jama karo"*), simulated voice mic input, smart predictive insights, and 1-tap undo action execution.
- **3-Tier i18n Localization**: Seamless toggling between `Hinglish`, `Pure Hindi` (शुद्ध हिंदी), and `English`.

---

## 🛠️ Quick Start & Build Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Bundle production build
node ./node_modules/esbuild/bin/esbuild src/main.jsx --bundle --format=esm --outfile=dist/assets/index-DyW3pNuF.js --loader:.jsx=jsx --loader:.js=jsx --define:process.env.NODE_ENV='"production"' --define:import.meta.env='{}' && cp dist/assets/index-DyW3pNuF.css dist/assets/index-DClZrqE3.css

# Serve static build
npx http-server dist -p 8080
```

---

## 👤 Author
Developed with ❤️ for flour mill & oil expeller operators across India by **Krish Tiwari & Team**.
