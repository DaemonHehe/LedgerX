# Project Brief: LedgerX

## Overview
LedgerX is a full-stack workspace for creating, editing, and exporting polished ledger-style templates and receipt layouts. The product now centers on a template-first experience that feels like Canva or Figma, helping users start from a curated design and then customize it quickly.

## Product Direction
- Rebrand the app experience around LedgerX rather than the earlier receipt-generator naming.
- Make template selection the primary entry point, with a polished gallery experience that highlights ready-made layouts first.
- Move the product toward a strict JSON-driven template pipeline so templates are portable, reusable, and export-safe.
- Provide a flexible template editor where users can add, position, and style elements on a canvas.
- Support a lightweight workspace flow for template selection, editing, and export.
- Keep the experience fast, local-first, and friendly for early-stage product testing.

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS plus custom CSS variables
- Nothing UI-inspired styling with black/white palette and red accents
- react-moveable and react-selecto for canvas interaction
- html2canvas for export-to-image workflows
- Supabase auth and API integration

### Backend
- Node.js with Express
- Supabase PostgreSQL for persisted data
- Supabase Auth for user sessions
- Supabase Storage for image assets

## Core Features

### 1. LedgerX Workspace
- Main control panel for template-driven document creation
- Navigation between workspace, sales dashboard, deck editor, and account pages
- Local and remote template support
- Template-first landing experience with blank-canvas as an alternative path

### 2. Template Studio
- Canvas-based editor for building custom layouts
- Add text, images, shapes, barcodes, lines, QR codes, tables, prices, dates, and logos
- Drag, resize, rotate, and select elements
- Inline text editing and keyboard delete support
- Selection toolbar with static/dynamic field toggles
- Template gallery with search, curated cards, and receipt-style previews
- Welcome flow and picker experience designed to feel approachable and modern
- Save templates in a strict JSON schema that includes canvas dimensions, background color, and an ordered elements array
- Export the current canvas through a renderer that mirrors the final preview exactly

### 3. Export & Preview
- Preview templates and generated layouts in-app
- Render templates through a reusable TemplateRenderer component that uses absolute positioning and dynamic field replacement
- Support a split-pane receipt workflow with a form on the left and a live preview on the right
- Export the live preview as a PNG using html2canvas and a dedicated export node
- Support dynamic field placeholders inside templates and fallback text when form data is not yet provided

### 4. Authentication & Persistence
- Sign in, sign up, password reset, and account profile flows
- Session persistence and protected API usage
- Local storage fallback for editor state while backend connectivity is unavailable

### 5. Sales Dashboard
- View saved records in a grid-based dashboard
- Support for receipt-style data and persisted records from the API layer

## Architecture

### Client-Server Model
- Client: React SPA served by Vite
- Server: Express API with Supabase-backed persistence
- Database: PostgreSQL via Supabase
- Storage: Supabase Storage buckets

### Authentication Flow
1. Client authenticates through Supabase Auth
2. Access tokens are attached to API requests via the auth fetch wrapper
3. The server validates the token and scopes requests to the current user

## Design System
- Monochrome base palette with red accent highlights
- Sharp edges, minimal shadows, and structured layouts
- 20px grid pattern and restrained UI chrome
- Typography centered around Inter and JetBrains Mono

## Environment & Setup

### Prerequisites
- Node.js 18+
- Supabase project
- Git

### Run locally
```bash
cd client
npm install
npm run dev
```

```bash
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
- Rebranded the visible product experience to LedgerX and updated the navigation labels to match
- Reworked the template experience into a full template-first gallery inspired by Canva/Figma-style flows
- Added distinct receipt-style preview cards so templates feel visually different from one another
- Improved the template picker and blank-canvas entry points for faster first-use onboarding
- Enhanced canvas interactions with selection, editing, and delete support
- Introduced a JSON-driven template architecture with a standard schema for canvas dimensions, backgrounds, and elements
- Added a reusable TemplateRenderer component for previewing and exporting templates from the same source of truth
- Added a split-pane preview workflow that binds dynamic fields to a live form and exports the preview as an image
- Added a local-dev auth bypass for browser testing when the backend is unavailable

## Project Structure
```text
RG/
├── client/                 # React frontend
├── server/                 # Express backend
├── PROJECT_BRIEF.md        # This document
```

## Future Enhancements

### Potential Features
- Row Level Security (RLS) on Supabase tables
- Receipt templates library
- Bulk receipt import/export
- Advanced canvas editing (layers, groups)
- Real-time collaboration on decks
- Receipt sharing via public links
- Analytics dashboard
- Multi-language support

### Technical Improvements
- Add comprehensive test suite
- Implement CI/CD pipeline
- Add monitoring and logging
- Optimize bundle size
- Add service worker for offline support
- Implement caching strategy

## License
Private project

## Contact
For questions or issues, contact the development team.
