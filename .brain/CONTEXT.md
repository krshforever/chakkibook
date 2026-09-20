# Chakkibook — Enterprise Mill Management System Context & Architecture

> **Last Updated**: 2026-09-20  
> **Repository**: [git@github.com:krshforever/chakkibook.git](git@github.com:krshforever/chakkibook.git)  
> **Branch**: `main` (Latest commit pushed to GitHub)  
> **Dev Server**: Running on `http://localhost:8080` via static preview build (`dist/`).

---

## 1. Project Overview & Target Audience
**Chakkibook** is an enterprise-grade digital register and mill co-pilot tailored for Atta Chakki (flour mill) and Spellar (mustard oil expeller) owners in rural and semi-urban India.

- **Primary Persona**: Mill operators and village elders who primarily use platforms like WhatsApp, YouTube, and Facebook.
- **Design Philosophy**: Zero visual clutter, Vercel-grade clean light mode aesthetic, 100% SVG Lucide React icons (**ZERO emojis**), ergonomic 48px+ touch targets, and full safe-area insets (`env(safe-area-inset)`).
- **Localization**: 3-tier language engine supporting:
  1. `hinglish` — Conversational Romanized Hindi/English (Default).
  2. `hi` — Pure Devanagari Hindi (शुद्ध हिंदी).
  3. `en` — Formal English.

---

## 2. Key Modules & Technical Architecture

### A. Dashboard Command Center (`src/pages/Dashboard.jsx`)
- **Executive Hero KPI Banner**: Live revenue (*Kul Kamai*), volume (*Pisai/Pirai kg*), and outstanding dues (*Baki Udhar*) with period-over-period percentage badges.
- **AI Smart Insights Carousel**: Dynamic recommendations engine highlighting peak milling windows, uncollected dues alerts, and pickup surges.
- **Integrated GaonSelector**: 1-tap horizontal pill bar for multi-village filtering across live queue and dues summary.
- **Pending Bori Queue**: High-contrast cards with 48px tactile green `Done` completion buttons.

### B. Kisan Khata & Ledger (`src/pages/Khata.jsx`)
- **Village Dues Hero Banner**: Highlights top debtors, total dues across villages, and average customer debt.
- **1-Tap Customer Detail Sheet**: Running balance timeline computing chronological credit & payment entries (`formatDateStr`).
- **Defensive Error Guards**: All string operations (`.toLowerCase()`, `.trim()`, `.includes()`, `.substring()`) guarded against nulls, numbers, or undefined fields to prevent runtime exceptions.
- **PDF & WhatsApp Generators**:
  - `generatePDFStatement`: Generates formal PDF ledgers via `jsPDF`.
  - `WhatsApp Reminder Builder`: 3-tier customizable templates (*Polite*, *Urgent*, *Detailed*).

### C. Collapsible Settings & Admin (`src/pages/Settings.jsx`)
- **Collapsible Accordion Cards**: All settings groups wrapped in toggleable accordion cards with category Lucide React icons (`ChevronDown` / `ChevronUp`).
- **Configurable Kadda & Rates**: Primary grain rates (*Gehun*, *Bajra*, *Makka*, *Chana*) and flour deduction base (*Kadda Per 40kg / 1 Mann*).
- **Spellar Rates**: Pirai pressing fee (₹/kg), Khali selling rate (₹/kg), and Mustard Oil selling rate (₹/Litre).
- **Machine Maintenance & Electricity Log**: Motor temperature, belt tension, stone wear percentage (%), electricity meter units (kWh), and generator diesel consumption log.
- **Confirmation Logout Modal**: Account protection requiring user confirmation before terminating session.

### D. Chakki AI Co-Pilot (`src/components/AIAgentWidget.jsx` & `src/services/aiAgent.js`)
- **Backdrop Sheet Overlay**: 85vh drawer with 12px backdrop blur.
- **Natural Language Command Parser**:
  - *"Ramesh Kumar 50kg gehun pisai bori jama karo"* → Adds bori entry.
  - *"Sunita Devi se 500 rupaye jama payment record karo"* → Records payment.
  - *"Aaj ki kul kamai aur pisai batao"* → Generates business summary.
- **Predictive Insights Engine**: Warns on uncollected boris >24h old, high-risk customer balances >= ₹500, and optimal milling windows.
- **State Change Cards with Undo Support**: `undoAIAction` capability to safely reverse AI actions.

---

## 3. Technology Stack & Build Pipelines
- **Frontend Core**: React 19, Vite / Esbuild, Zustand (`src/store/useStore.js`).
- **Styling**: Vanilla CSS custom properties (`src/index.css`) with HSL tokens, glassmorphism, and spring cubic-bezier transitions.
- **Icons**: `lucide-react` (100% SVG, strictly zero emojis).
- **PDF Generation**: `jspdf`.
- **Backend / Storage**: Firebase Firestore & LocalStorage fallback store.

---

## 4. Build & Deployment Commands
```bash
# Production Bundle Build
node ./node_modules/esbuild/bin/esbuild src/main.jsx --bundle --format=esm --outfile=dist/assets/index-DyW3pNuF.js --loader:.jsx=jsx --loader:.js=jsx --define:process.env.NODE_ENV='"production"' --define:import.meta.env='{}' && cp dist/assets/index-DyW3pNuF.css dist/assets/index-DClZrqE3.css

# Local Preview Server
npx http-server dist -p 8080
```

---

## 5. Recent Commit History
- `bbc75f2`: `fix: resolve Kisan Khata crash caused by unsafe string and property accessors on customer/village records`
- `dfc0012`: `feat: collapsible settings cards with icons, deep Chakki AI co-pilot, and Vercel-grade light mode UI polish`
