# Project Brief: LedgerX

## Overview
LedgerX is a full-stack workspace for creating, editing, and exporting polished ledger-style templates and receipt layouts. The product centers on a template-first experience (similar to Canva or Figma) with AI-powered template generation, database persistence for templates and receipts, and a dynamic Sales Dashboard.

## Product Direction
- Rebrand the app experience around LedgerX rather than the earlier receipt-generator naming.
- Make template selection the primary entry point, with a polished gallery experience that highlights ready-made layouts first.
- Move the product toward a strict JSON-driven template pipeline so templates are portable, reusable, and export-safe.
- Provide a flexible template editor where users can add, position, and style elements on a canvas.
- Support AI-powered image-to-template conversion to bootstrap template creation.
- Integrate database persistence for both templates and completed receipt records.
- Support a lightweight workspace flow for template selection, editing, and export.
- Keep the experience fast, local-first, and friendly for early-stage product testing.

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS plus semantic custom CSS variables (Nothing UI theme with real-time light/dark mode toggling)
- react-moveable and react-selecto for canvas interaction
- html2canvas for export-to-image workflows
- ag-grid-react for the Sales Dashboard
- Supabase auth and API integration

### Backend
- Node.js with Express
- Supabase PostgreSQL for persisted data
- Supabase Auth for user sessions
- Supabase Storage for image assets
- Multer for handling file/image uploads
- OpenAI API (GPT-4o) for AI receipt analysis

## Core Features

### 1. LedgerX Workspace
- Main control panel for template-driven document creation
- Navigation between workspace, template gallery, sales dashboard, deck editor, and account pages
- Welcome flow and picker experience designed to feel approachable and modern

### 2. Template Gallery
- Fetches and displays all user-scoped templates from the database
- Visual cards displaying template name, element count, and creation date
- "Edit Template" and "Use Template" entry points for fast onboarding and editing
- Search functionality for filtering templates

### 3. Template Studio
- Canvas-based editor for building custom layouts (400px default width)
- Add text, images, shapes, barcodes, lines, QR codes, tables, prices, dates, and logos
- Drag, resize, rotate, and select elements
- Inline text editing and keyboard delete support
- Selection toolbar with static/dynamic field toggles
- Save templates directly to the database via standard JSON schema (supporting insert and update flows)

### 4. AI Image-to-Template Generator
- "Import Receipt from Image" feature in the Template Studio toolbar
- Uploads a physical receipt image (via `POST /api/templates/analyze`)
- OpenAI GPT-4o analyzes the layout and extracts dimensions, coordinates, font sizes, text contents, and dynamic variables
- Converts GPT-4o response to standard template elements and injects them directly into the canvas editor state

### 5. Export & Preview (Split-Pane Receipt Flow)
- Preview templates and generated layouts in-app via a dedicated route (`/preview/:id`)
- Reusable `TemplateRenderer` component using absolute positioning and dynamic field replacement
- Split-pane workspace:
  - **Left Pane**: Dynamic form generation based on template elements marked as `isDynamic: true`
  - **Right Pane**: Live preview that updates in real-time as the user inputs form data
- Export functionality capturing the exact layout via html2canvas (high resolution, scale: 2)
- Simultaneously saves the receipt data to the database (`/api/receipts`) upon clicking the "Export PNG" button, triggering a success toast notification

### 6. Sales Dashboard
- Polished, grid-based dashboard using `ag-grid-react` styled in accordance with Nothing UI design guidelines
- Standard columns: Date Created, Template Name
- Flattens JSONB `form_data` into dynamic, sortable, and filterable columns (e.g. customer name, date, total amount)
- Styled with JetBrains Mono cell text and monochrome header backgrounds

### 7. Authentication & Persistence
- Sign in, sign up, password reset, and account profile flows
- Row Level Security (RLS) on Supabase database tables scoped to authenticated users
- Local storage fallback for editor state while backend connectivity is offline

## Architecture

### Client-Server Model
- Client: React SPA served by Vite
- Server: Express API with Supabase-backed persistence
- Database: PostgreSQL via Supabase (tables: `templates`, `receipts`)
- AI Engine: OpenAI GPT-4o API for multimodal image layout parsing

### Database Schema

#### `templates` Table
Stores user templates as standard JSON configurations.
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schema_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `receipts` Table
Stores completed receipt forms generated from templates.
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Standard Template Schema (`client/src/lib/templateSchema.js`)
All templates are standardized to ensure portability and render safety:
- **Canvas Schema**:
  ```json
  {
    "width": 400,
    "height": number,
    "backgroundColor": "string",
    "elements": []
  }
  ```
- **Element Schema**:
  ```json
  {
    "id": "string",
    "type": "text | shape | barcode | image | table",
    "content": "string",
    "x": number,
    "y": number,
    "width": number,
    "height": number,
    "rotation": number,
    "zIndex": number,
    "fontFamily": "string",
    "fontSize": number,
    "fontWeight": number,
    "color": "string",
    "textAlign": "string",
    "lineHeight": number,
    "isDynamic": boolean,
    "fieldKey": "string"
  }
  ```
- Handles two-way conversion between the internal canvas legacy format and the standard schema format.

## Environment & Setup

### Prerequisites
- Node.js 18+
- Supabase project
- OpenAI API Key (configured in server `.env` as `OPENAI_API_KEY`)
- Stripe API Keys (configured in server `.env` as `STRIPE_SECRET_KEY` and client `.env` as `VITE_STRIPE_PUBLISHABLE_KEY`)
- Stripe Price IDs (configured in client `.env` as `VITE_STRIPE_PRICE_1_MONTH`, etc.)
- Git

### Run locally
```bash
# Start Client
cd client
npm install
npm run dev

# Start Server
cd server
npm install
npm run dev
```

### Build
```bash
cd client
npm run build
```

## Recent Changes
- **Database Schema & RLS**: Applied migrations defining `templates` and `receipts` tables with RLS policies scoped to authenticated users.
- **Backend persistence API**: Implemented CRUD API endpoints in Express (`GET /POST/PUT/DELETE /api/templates` and `GET/POST/DELETE /api/receipts`).
- **AI Image-to-Template Parsing**: Set up backend multimodal route (`POST /api/templates/analyze`) using OpenAI GPT-4o, converting receipts into structured coordinate JSON.
- **Import Receipt Component**: Implemented `ImportImageButton` in Template Studio with Nothing UI styling, a hidden file input, and status text.
- **Template Gallery**: Replaced static placeholders with a database-backed grid gallery displaying user-scoped receipts and template configurations.
- **Receipt Preview & Persistence Link**: Connected the split-pane live preview route (`/preview/:id`) to auto-save record payloads to `/api/receipts` when the user exports the receipt.
- **Legacy Template Compatibility**: Fixed schema parsing (`mapTemplateToLegacy`) in `App.jsx` and `templateSchema.js` to ensure legacy unstyled tables default to hidden total rows and `'none'` borders instead of forcefully injecting red grid styles.
- **Table Styling Controls**: Added explicit dropdowns in the `PropertiesPanel` (`TemplateStudio`) for Table Style, Show Total Row, and Total Style, empowering users to toggle these on legacy and new tables dynamically.
- **AI Image Import Refinement**: Updated the frontend `ImportImageButton` to respect the dynamically calculated canvas height returned by the OpenAI parser, preventing elements from being cut off at the default 620px height.
- **Responsive Total Row Alignment**: Updated `TemplateRenderer` logic so the "TOTAL" label spans across all columns except the final amount column, preventing text truncation in narrow receipt formats.
- **Nothing UI Refresh & Theme Toggle**: Refactored the entire application to use semantic Tailwind variables tied to a pure monochrome light/dark theme system. Implemented a real-time dark/light mode toggle in the `GlassNav`.
- **ag-Grid Upgrade**: Migrated the `SalesDashboard` to `ag-theme-quartz` with a `MutationObserver` to automatically flip to `ag-theme-quartz-dark` during theme switches.
- **Dashboard Robustness & Error Handling**: Built a `safeParseFormData` pipeline to gracefully render corrupted or legacy JSON payloads without crashing. Added automated currency formatting, a polished Empty State UI, and responsive column fitting (`autoSizeStrategy`). Expanded backend validation to limit `form_data` payload sizes.
- **End-to-End Testing Suite**: Integrated and stabilized Playwright for comprehensive E2E testing. 12/12 tests passing across Auth, Template Gallery, Wizard, Canvas Editor, Receipt Preview, and Sales Dashboard. Fixed `ag-grid` React integration issues by converting `dashboardColumns.js` to `.jsx`.
- **Database Idempotency**: Refactored backend PostgreSQL migration scripts (`005_dashboard_analytics.sql` and `006_master_plan_v2.sql`) to be fully idempotent, preventing schema crash loops using `IF NOT EXISTS` and `DO $$` blocks for ENUMs and constraints.
- **Stripe Embedded Checkout**: Integrated Stripe subscription checkout directly into the frontend using `@stripe/react-stripe-js` (`ui_mode: 'embedded_page'`). Added a local fallback endpoint (`verify-session`) to manually trigger database updates for the `user_subscriptions` table in local development environments where Stripe Webhooks are inaccessible.

## Future Enhancements

### Potential Features
- Advanced canvas editing (layers, groups, guidelines)
- Bulk receipt import/export
- Receipt sharing via public links
- Analytics dashboard showing sales trends and total counts
- Multi-language support

### Technical Improvements
- Add comprehensive unit and integration test suites
- Implement caching strategy for remote templates
- Optimize export pipeline to handle larger layouts or PDF formats
