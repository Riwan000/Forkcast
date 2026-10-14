# FORKCAST

> **Less Order-Taking. More Hospitality.**  
> An AI-first collaborative café ordering web application empowering waitstaff to deliver genuine hospitality by automating group ordering, dietary queries, and real-time bill splitting.

---

## Features

- **Zero-Friction Table Onboarding**: Guests scan the table QR code on their own mobile devices to join the live table room—no app downloads required.
- **Ambient AI Concierge**: Automatically answers dietary inquiries, suggests personalized dishes within a set table budget, and suppresses off-topic banter.
- **Collaborative Shared Cart**: Real-time group cart where guests can see who ordered what, mark shared plates, and specify custom chef notes.
- **Instant Automated Bill-Split**: Automatically divides personal dishes and equally distributes shared appetizers/desserts per guest in real time.
- **Hand-Drawn Artisanal Aesthetic**: Signature sketched ink on deep maroon (`#430000`) with ambient procedural topography, living character illustrations, and paper-textured UI components.
- **Trilingual Support**: Seamless toggle between **English**, **العربية (Arabic - RTL)**, and **മലയാളം (Malayalam)**.

---

## Tech Stack

- **Frontend Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Architecture**: [shadcn/ui](https://ui.shadcn.com/) conventions & path aliases (`@/*`)
- **Graphics & Topography**: Custom WebGL heightfields, Canvas pixel manipulation, and hand-drawn SVG assets

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm`, `yarn`, or `pnpm`

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd restaurant_menu_optimiser
   ```

2. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## Project Structure

```
restaurant_menu_optimiser/
├── .gitignore               # Root git ignore rules (archives, node_modules, envs)
├── README.md                # Project documentation
└── frontend/
    ├── .gitignore           # Frontend-specific git ignore rules
    ├── components.json      # shadcn configuration
    ├── index.html           # Main HTML entry point
    ├── jsconfig.json        # Path alias mapping (@/*)
    ├── package.json         # Dependencies and scripts
    ├── vite.config.js       # Vite configuration with @ path alias
    └── src/
        ├── App.jsx          # Core landing page & table room interactive experience
        ├── cafeData.js      # Outdoor café sketch illustration data
        ├── hospitalityData.js# Waiter illustration asset data
        ├── logoData.js      # Forkcast logo asset data
        ├── main.jsx         # React application root
        ├── index.css        # Global CSS, brand palette, and sketch utility classes
        ├── translations.js  # Trilingual dictionary (EN / AR / ML)
        ├── components/
        │   └── ui/
        │       ├── topo-field.tsx # Procedural WebGL culinary topography background
        │       ├── topo-field.jsx # JSX version of TopoField
        │       ├── demo.tsx       # TopoField demo component
        │       └── demo.jsx       # JSX version of demo
        └── lib/
            └── utils.js     # Tailwind class merge helper (cn)
```

---

## License

Private & Proprietary. All rights reserved © 2026 FORKCAST.
