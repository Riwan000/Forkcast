# Product Requirements Document (PRD v2.2)
## Project: Forkcast — Multi-Tenant AI-First Collaborative Dining Platform
**Brand:** Forkcast (`forkcast.in`)  
**Status:** Approved & Revised (v2.2 — Brand & UI/UX Spec Added)  
**Tech Stack:** Python (Backend) + React (Frontend)  
**Target:** Local MVP & Interactive Multi-Tenant Demo  
**Repository:** `c:\Users\LEGION\Desktop\Projects\restaurant_menu_optimiser`

---

## 1. Executive Summary & Product Vision

### 1.1 The Problem
Traditional café dining experiences and restaurant tech suffer from three core bottlenecks:
1. **Onboarding Friction for Café Owners:** Digital menu tools require hours of manual typing, categorizing, and pricing. Most café owners abandon setup before completing it.
2. **Menu Paralysis & Group Ordering Chaos:** When 3–6 people sit at a table, negotiating varied dietary preferences (veg, non-veg, dairy-free, spice preferences) within a budget leads to awkward delays.
3. **Bill Splitting & Waiter Miscommunication:** Modifications ("make it mild", "swap fries for salad") get lost, and computing per-person splits at the end of the meal is frustrating.

### 1.2 The Forkcast Solution
> **"Turn any café menu into an AI collaborative dining room in 90 seconds."**

**Forkcast** is a self-serve, multi-tenant AI dining platform:
* **For Café Owners:** An **AI Ingestion Agent** transforms a photo or text of a paper menu into a digitized, allergen-tagged, spice-rated AI Menu with auto-generated printable Table QR codes.
* **For Diners:** When guests scan Table 12, they enter a **Collaborative Table Room** (WhatsApp-style group chat) with an **Ambient AI Concierge** that listens to group banter, balances diets and budgets, updates a shared cart, calculates live per-person bill splits, and lets the Table Captain transmit orders directly to the kitchen.
* **For Staff:** A live, real-time **Kitchen Dashboard** showing orders with exact guest attribution and special notes.

### 1.3 Brand Identity & Visual Design System

#### Brand Mascot & Logo
* **Mascot Concept:** Hand-drawn line art of an anthropomorphic **Fork & Knife** conversing with each other, featuring smiling faces and speech bubbles (`...`).
* **Symbolism:** Represents **Food + Conversation** — friends chatting at a dining table while the Ambient AI listens in.
* **Tone:** Friendly, social, approachable, and modern café-tech. **Strictly free of romantic, dating, or heart motifs.**

#### Color Palette Tokens
| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#5b0000` | Signature Oxblood Maroon app background. |
| **Header & Bar Base** | `#430000` | Elevated dark maroon for top bar and navigation tabs. |
| **Typography & Text** | `#FFFFFF` | **100% Pure White for ALL writings**, titles, messages, prices, and split amounts. |
| **Secondary Hints** | `rgba(255, 255, 255, 0.80)` | Muted timestamps, item notes, and budget subtitles. |
| **Glassmorphic Cards** | `rgba(255, 255, 255, 0.09)` | Frosted white message bubbles, dish cards, and order shelves. |
| **Structural Borders** | `rgba(255, 255, 255, 0.22)` | Hairline dividers and card outlines. |
| **Primary Action CTAs** | `#FFFFFF` bg / `#5b0000` text | High-contrast solid white buttons (`[+ Add to Cart]`, `[Send Order to Kitchen]`). |

#### Typography Stack
* **Main / Primary Font:** `Patrick Hand` — Brand wordmark, headings, dish names, table roster labels, and mascot dialog (mirrors the friendly, hand-drawn fork & knife linework).
* **Secondary / Interface Font:** `Space Grotesk` — UI buttons, navigation tabs, numeric prices, live bill-split math, and timestamps (crisp, high-precision modern tech readability).

---

## 2. Technology Stack & Architecture

### Backend: Python
* **Framework:** **FastAPI** (asynchronous, high performance, native OpenAPI documentation).
* **Real-time Sync:** **WebSockets** / **Server-Sent Events (SSE)** for zero-latency multi-device table synchronization and live kitchen order streaming.
* **AI & Optimization Engines:** 
  * `onboarding_agent.py`: Menu OCR & AI schema enrichment (allergens, spice tags, vegan/veg inference).
  * `ambient_ai.py`: Ambient group banter parsing, peer tag suppressor (`@Friend` vs `@AI`), and dietary context extraction.
  * `recommender.py`: Multi-objective budget and dietary constraint optimizer.
  * `bill_splitter.py`: Real-time individual + shared item financial allocation.
* **Data Storage:** Multi-tenant JSON file/SQLite store isolated per café slug (`data/cafes/:slug/`).

### Frontend: React
* **Build Tool & Runtime:** **Vite + React** (lightning-fast HMR, modular component architecture).
* **Styling:** **Tailwind CSS** or custom modern café styling (mobile-first for Table Room, desktop/tablet-optimized for Kitchen & Onboarding).
* **Core React Surfaces:**
  1. **Café Onboarder (`/onboard`):** Multi-step wizard to upload menu photos/text, review parsed dishes in an interactive grid, and download printable table QR sheets.
  2. **Table Room (`/:slug/table/:id`):** WhatsApp-style mobile chat feed, live table roster, inline interactive dish cards, sticky budget meter, shared collaborative cart, live bill-split modal, and Table Captain checkout control.
  3. **Kitchen Live Board (`/:slug/kitchen`):** Real-time ticket board with sound chimes, guest-level dish attribution, modifier callouts, and order status stepper.

---

## 3. Platform Architecture & Multi-Tenant Routing

```
                         FORKCAST PLATFORM (forkcast.in)
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   CAFÉ OWNER ONBOARDING     CUSTOMER TABLE ROOM       STAFF KITCHEN DESK
   (React: /onboard)        (React: /:slug/table/:id) (React: /:slug/kitchen)
            │                         │                         │
            ▼                         ▼                         ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                  PYTHON BACKEND (FastAPI)                  │
   │  - REST Endpoints (Café Setup, Menu Update, Order CRUD)     │
   │  - WebSocket / SSE Channels (Table Room Sync & Kitchen Pipe)│
   │  - AI Engines: Onboarding, Ambient AI, Recommender, Split   │
   └──────────────────────────────┬──────────────────────────────┘
                                  ▼
                        MULTI-TENANT STORAGE
                        data/cafes/:cafeslug/
                        ├── profile.json (name, tables, currency)
                        ├── menu.json (dishes, prices, allergens)
                        └── active_orders.json (live tickets)
```

---

## 4. The 3 Surfaces & Functional Requirements

### Surface 1: ☕ Café Owner Self-Service Onboarding (`/onboard`)

| Feature ID | Feature Name | Description |
| :--- | :--- | :--- |
| **O-1** | **Café Profile Setup** | Owner enters Café Name (e.g. *"Third Wave Brew"*), generated slug (`thirdwave`), table count (e.g. 15), and currency (`₹`). |
| **O-2** | **Zero-Effort Menu Ingestion** | Supports raw text paste, image photo upload, or PDF. |
| **O-3** | **AI Menu Ingestion & Enrichment Agent** | The AI agent parses the raw input into structured JSON and enriches it: <br>• Detects categories (Brews, Starters, Mains, Desserts).<br>• Identifies prices and names.<br>• Auto-tags `Veg`, `Non-Veg`, `Vegan`, `Gluten-Free`.<br>• Infers allergens (`Dairy`, `Nuts`, `Soy`) and spice levels (`🌶️`).<br>• Adds mouthwatering 1-line descriptions. |
| **O-4** | **Interactive Review & Edit** | React data table/grid where owner can edit parsed dishes, adjust prices, or toggle availability before publishing. |
| **O-5** | **Instant Asset & QR Generation** | One-click generation of printable Table QR Cards (`Table 1` to `Table N`), Customer URL, and Staff Kitchen Link. |

---

### Surface 2: 🧑 Customer Collaborative Table Room (`/:slug/table/:table_id`)

| Feature ID | Feature Name | Description |
| :--- | :--- | :--- |
| **C-1** | **Zero-Friction Join & Roster** | Diners scan Table 12 $\rightarrow$ Enter First Name. First diner becomes **Table Captain**. Live header shows: `🟢 Table 12: Aryan (Captain), Priya, Rohan`. |
| **C-2** | **Ambient AI Chat Feed** | WhatsApp-style table group chat. Ambient AI reads group intent and chimes in with dish suggestions, dietary filters, and budget updates. |
| **C-3** | **Peer Tag Suppression** | When friends tag each other (`@Rohan`, `@Priya`), the AI **stays silent** to preserve natural banter, but silently updates dietary context (`Priya: Vegetarian`). Responds when tagged `@AI` or asked food queries. |
| **C-4** | **Hybrid Visual Dish Cards** | Inline interactive cards (photo, price, spice `🌶️`, allergens, and `[+ Add to Cart]`). |
| **C-5** | **Collaborative Live Cart** | Synced across all phones. Displays item ownership: `Chicken Tikka (Added by Rohan)`. |
| **C-6** | **Live Shared Budget Meter** | Sticky header meter tracking group spend against target budget: `₹1,650 / ₹2,000 Spent`. |
| **C-7** | **Live Per-Person Bill Splitter** | Real-time bill split modal showing each person's exact share (personal items + equal fraction of shared appetizers/desserts). |
| **C-8** | **Table Captain Checkout Authority** | Only the **Table Captain** has the active `[Send Order to Kitchen]` button. Other members see `[Order Ready - Waiting for Captain]`. |

---

### Surface 3: 👨‍🍳 Staff / Kitchen Live Dashboard (`/:slug/kitchen`)

| Feature ID | Feature Name | Description |
| :--- | :--- | :--- |
| **K-1** | **Live Ticket Stream** | Real-time incoming table orders with sound alerts. |
| **K-2** | **Guest & Item Attribution** | Ticket header: `TABLE 12 • 4 Guests (Captain: Aryan)`. Every dish displays who ordered it and their custom notes: `• Chicken Tikka ×1 [Rohan - Mild]`. |
| **K-3** | **Shared Items Grouping** | Highlights shared dishes (e.g. `Classic Brownie ×1 [Shared - Serve at end]`). |
| **K-4** | **Order Lifecycle Actions** | Step controls: `[Accept Order]` $\rightarrow$ `[Preparing]` $\rightarrow$ `[Served]`. |

---

## 5. Repository Structure (Python + React)

```
restaurant_menu_optimiser/
├── docs/
│   └── AI_MENU_PRD.md            # Master PRD v2.2
├── backend/                      # Python (FastAPI)
│   ├── app/
│   │   ├── main.py               # FastAPI application & router mounting
│   │   ├── config.py             # App configurations & environment keys
│   │   ├── models.py             # Pydantic schemas (Menu, Order, TableRoom)
│   │   ├── services/
│   │   │   ├── onboarding_agent.py # AI menu digitization & enrichment
│   │   │   ├── ambient_ai.py     # Ambient chat engine & peer tag filter
│   │   │   ├── recommender.py    # Group & budget constraint solver
│   │   │   ├── bill_splitter.py  # Per-person bill math
│   │   │   └── qr_service.py     # Table QR generator
│   │   └── routers/
│   │       ├── cafes.py          # /api/cafes (onboarding, profile)
│   │       ├── menu.py           # /api/cafes/{slug}/menu
│   │       ├── room.py           # /api/cafes/{slug}/room (WebSockets/SSE)
│   │       └── orders.py         # /api/cafes/{slug}/orders (Kitchen feed)
│   ├── data/
│   │   └── cafes/                # Multi-tenant data files
│   └── requirements.txt
├── frontend/                     # React (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── OnboardingPage.jsx # Café setup & menu review wizard
│   │   │   ├── TableRoomPage.jsx  # Multi-user mobile table chat & cart
│   │   │   ├── KitchenPage.jsx    # Real-time kitchen ticket board
│   │   │   └── QRPrintPage.jsx    # Printable table QR cards
│   │   ├── components/
│   │   │   ├── ChatFeed.jsx       # WhatsApp-style chat bubbles & mentions
│   │   │   ├── DishCard.jsx       # Inline visual dish cards
│   │   │   ├── SharedCart.jsx     # Live collaborative table cart
│   │   │   ├── BillSplitModal.jsx # Per-person share breakdown
│   │   │   └── TableRoster.jsx    # Active table members bar
│   │   ├── services/
│   │   │   └── api.js             # API & WebSocket client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```
