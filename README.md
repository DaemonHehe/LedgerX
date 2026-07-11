<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/receipt.svg" alt="LedgerX Logo" width="100" />
  
  # LedgerX
  **The ultimate template-first workspace for designing, generating, and managing ledger-style receipts.**
  
  <br />

  ![React](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react)
  ![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
  ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs)
  ![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
  ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai)
  ![Stripe](https://img.shields.io/badge/Stripe-Embedded%20Checkout-008CDD?style=for-the-badge&logo=stripe)

</div>

---

## 📖 Overview

LedgerX is a full-stack, end-to-end receipt generator and layout editor designed to look and feel like a modern, professional workspace. 
Heavily inspired by the **"Nothing OS"** design language, the app features a strict monochrome aesthetic with sharp edges, technical mono-fonts, and high-contrast red accents. 

With LedgerX, users can visually design JSON-driven templates, import physical receipts using **OpenAI GPT-4o vision models**, and effortlessly fill out forms to export pixel-perfect PNGs.

## ✨ Core Features

- 🎨 **Canvas Template Studio**: A Figma-like drag-and-drop editor allowing you to place text, tables, barcodes, and images exactly where you want them.
- 🤖 **AI Image-to-Template**: Upload a picture of a physical receipt, and GPT-4o will instantly recreate it as a fully editable digital template in the Studio.
- 📝 **Dynamic Split-Pane Preview**: As you design a template, dynamic variables (e.g., `{{customer_name}}`) instantly generate a functional input form. 
- 📊 **Sales Dashboard**: Every exported receipt is automatically saved to your ledger and displayed in an interactive, filterable data grid using `ag-grid-react`.
- 💳 **Stripe Embedded Checkout**: Frictionless in-app subscription flow built with `@stripe/react-stripe-js` to upgrade to the Pro workspace.
- 🌗 **True Dark Mode**: Real-time CSS-variable driven theme toggling without ever reloading the application.
- 🔒 **Supabase Auth & RLS**: Fully secure, user-scoped persistence for all templates and receipt records.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v4, Framer Motion, Lucide React |
| **Canvas Engine** | react-moveable, react-selecto, html2canvas |
| **Backend** | Node.js, Express, Supabase (PostgreSQL) |
| **Integrations** | OpenAI (GPT-4o), Stripe SDK |
| **Testing** | Playwright (E2E) |

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/LedgerX.git
cd LedgerX
```

### 2. Install dependencies
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 3. Environment Variables
You will need to set up two `.env` files.

**`client/.env`**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_1_MONTH=price_...
VITE_STRIPE_PRICE_3_MONTH=price_...
VITE_STRIPE_PRICE_6_MONTH=price_...
```

**`server/.env`**
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
```

### 4. Database Setup (Supabase)
Run the provided SQL migrations inside your Supabase SQL Editor in chronological order (located in `server/migrations/`):
1. `002_ledgerx_tables.sql`
2. `003_example_templates.sql`
3. `005_dashboard_analytics.sql`
4. `006_master_plan_v2.sql`

*Optional: Seed the database with example templates by running `node server/scripts/seedExampleTemplates.mjs`.*

### 5. Run the Application
Start the development servers:
```bash
# Terminal 1 (Backend)
cd server
npm run dev

# Terminal 2 (Frontend)
cd client
npm run dev
```

Visit `http://localhost:5173` to explore the workspace!

## 🧪 Testing

LedgerX includes a robust End-to-End testing suite using **Playwright**, completely mocking the Supabase and Stripe backends for lightning-fast deterministic testing.

```bash
cd tests
npx playwright test
```

## 📐 Architecture Note: JSON Template Pipeline
To ensure strict portability, all visual layouts in LedgerX are compiled down into a standardized JSON Schema. This allows templates to be safely serialized into the database, instantly loaded into the live preview renderer, or dynamically manipulated by the AI layout engine without brittle CSS or HTML injection.

## 🤝 Contributing
Contributions are welcome! Please ensure your code adheres to the "Nothing UI" minimalist design system guidelines found in the `AGENTS.md` and `PROJECT_BRIEF.md` documentation.

---
*LedgerX - Precision documentation. Modern execution.*
