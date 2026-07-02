# LedgerX Implementation Notes

## Project Overview
LedgerX is a receipt template system using React, Tailwind CSS, and the Nothing UI design system. The project implements a JSON-driven UI pipeline for template rendering and export, with AI-powered image-to-template generation, template persistence, and record management.

## Architecture Components

### 1. Standard Template Schema
- **Location**: `client/src/lib/templateSchema.js`
- **Purpose**: Defines the standard JSON structure for all templates
- **Key Functions**:
  - `validateTemplate()` - Validates template structure
  - `convertToStandardSchema()` - Converts legacy format to standard schema
  - `convertFromStandardSchema()` - Converts standard schema back to legacy format

**Schema Structure**:
```javascript
{
  width: number,           // Canvas width in pixels
  height: number,          // Canvas height in pixels
  backgroundColor: string, // Canvas background color
  elements: Array<Element>
}
```

**Element Structure**:
```javascript
{
  id: string,              // Unique identifier
  type: 'text' | 'shape' | 'barcode' | 'image',
  content: string,         // Text content or URL
  x: number, y: number,    // Position
  width: number, height: number, // Dimensions
  rotation: number,        // Rotation in degrees
  zIndex: number,          // Stacking order
  fontFamily: string,      // Font family
  fontSize: number,        // Font size
  fontWeight: number,      // Font weight
  color: string,           // Text/fill color
  textAlign: string,       // Text alignment
  lineHeight: number,      // Line height
  isDynamic: boolean,      // Dynamic data flag
  fieldKey: string         // Form data key
}
```

### 2. TemplateRenderer Component
- **Location**: `client/src/components/TemplateRenderer.jsx`
- **Purpose**: Renders templates based on standard schema with dynamic data substitution
- **Props**:
  - `template` - JSON object in standard schema format
  - `formData` - Key-value pairs of dynamic data
- **Features**:
  - Renders relative wrapper matching canvas dimensions
  - Maps over elements array and renders absolutely positioned
  - Substitutes dynamic content from formData using fieldKey
  - Supports text, shape, barcode, and image element types

### 3. ReceiptPreviewNew Component
- **Location**: `client/src/components/ReceiptPreviewNew.jsx`
- **Purpose**: Split-pane layout for form input and live preview
- **Features**:
  - **Left Pane**: Dynamic form generation from template elements
    - Renders input fields for elements with `isDynamic: true`
    - Uses JetBrains Mono font for form inputs
    - Stores values in formData state object
  - **Right Pane**: Live preview with TemplateRenderer
    - Wraps TemplateRenderer in div with `id="export-node"`
    - Real-time updates as form data changes
  - **Export**: PNG export using html2canvas targeting export-node
  - **Optional**: Save to Supabase callback

### 4. Template Studio Export
- **Location**: `client/src/components/deck/TemplateEditor.jsx`
- **Purpose**: Canvas editor with JSON export capability
- **Features**:
  - Added "Save Template JSON" button to toolbar
  - Exports current canvas state in standard schema format
  - Downloads as JSON file for use in receipt preview
- **Integration**: Uses `exportToStandardSchema()` from useTemplate hook

### 5. useTemplate Hook Enhancement
- **Location**: `client/src/hooks/useTemplate.js`
- **Purpose**: Template state management with schema conversion
- **Added Function**: `exportToStandardSchema()` - Converts current template to standard schema format

## Build and Verification Commands

### Development
```bash
cd client
npm run dev
```

### Build
```bash
cd client
npm run build
```

### Production Preview
```bash
cd client
npm run preview
```

## Key Integration Points

1. **Template Studio → Receipt Preview Flow**:
   - Template Studio creates/edits templates
   - "Save Template JSON" exports standard schema
   - Receipt Preview loads JSON and renders with TemplateRenderer
   - Form data substitutes dynamic fields
   - Export captures exact pixel-perfect output

2. **Dynamic Field System**:
   - Template elements marked with `isDynamic: true`
   - `fieldKey` maps to formData keys
   - TemplateRenderer substitutes content: `formData[element.fieldKey]`
   - Falls back to placeholder if no data exists

3. **Export Pipeline**:
   - html2canvas targets `#export-node` div
   - TemplateRenderer ensures pixel-perfect rendering
   - High resolution export (scale: 2)
   - Downloads as PNG file

## Design System Adherence

- **Nothing UI**: Sharp edges, monochrome styling
- **Colors**: `--bg-secondary` (#f5f5f5), black (#000000), white (#ffffff)
- **Typography**: Inter for UI, JetBrains Mono for data/numbers
- **Borders**: Sharp 1px borders, no rounded corners
- **Layout**: Grid-based, strict alignment

## Dependencies

- `html2canvas` - PNG export functionality
- `react-moveable` - Canvas element manipulation
- `lucide-react` - Icon components
- `@supabase/supabase-js` - Backend integration
- `react-router-dom` - Navigation
- `openai` - AI-powered image analysis (backend)
- `multer` - File upload handling (backend, already installed)

## AI Image-to-Template Generation

### Backend Implementation
- **Location**: `server/server.js`
- **Route**: `POST /api/templates/analyze`
- **Authentication**: Protected by `requireAuth` middleware
- **Features**:
  - Accepts image upload via multer (max 5MB, field name: `image`)
  - Converts buffer to base64 Data URI
  - Calls OpenAI GPT-4o with JSON response format
  - Returns structured template JSON with canvas dimensions and elements

**System Prompt**:
```
You are an expert UI layout engine. Analyze this physical receipt image and convert it into a digital template JSON schema. The canvas width should be 400. Estimate the canvas height based on the content. Map every piece of text into the 'elements' array. Return ONLY a JSON object matching this schema: { canvas: { width: 400, height: number, backgroundColor: '#ffffff' }, elements: [ { id: 'el_uuid', type: 'text', content: 'string', x: number, y: number, fontSize: number, isDynamic: boolean, fieldKey: 'string_if_dynamic' } ] }. Estimate X and Y coordinates to replicate the visual layout. If a text field represents a variable (customer name, date, specific item prices, total amount), set isDynamic: true and assign a snake_case fieldKey. If it is static (store name, headers, 'Thank You'), set isDynamic: false.
```

### Frontend Implementation
- **Location**: `client/src/components/ImportImageButton.jsx`
- **Integration**: Added to TemplateEditor toolbar
- **Features**:
  - "Import Receipt from Image" button with Nothing UI styling
  - Sharp edges, outlined, hover state with accent color
  - Uses Camera and Upload icons from lucide-react
  - Loading state with JetBrains Mono font: `> analyzing_layout...`
  - Calls `/api/templates/analyze` endpoint
  - Converts AI response to template format
  - Automatically injects into Template Studio state

**Response Format Conversion**:
```javascript
{
  title: 'Imported Receipt Template',
  background: data.canvas.backgroundColor,
  elements: data.elements.map(el => ({
    id: el.id,
    type: el.type,
    x: el.x,
    y: el.y,
    width: 200,  // Default, adjustable
    height: 30,  // Default, adjustable
    rotation: 0,
    zIndex: index,
    isDynamic: el.isDynamic,
    formFieldType: el.isDynamic ? el.fieldKey : null,
    placeholderText: el.isDynamic ? `{{${el.fieldKey}}}` : null,
    props: {
      text: el.content,
      fontSize: el.fontSize,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 400,
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.4,
    },
  }))
}
```

### State Injection
- **Location**: `client/src/components/deck/TemplateEditor.jsx`
- **Function**: `handleAnalysisComplete`
- **Process**:
  1. User uploads receipt image
  2. OpenAI analyzes and returns template JSON
  3. ImportImageButton converts response format
  4. Calls `applyTemplate()` to inject into useTemplate state
  5. Canvas instantly populates with AI-generated layout
  6. User can interact, adjust alignment, and save as new template

### Environment Configuration
- **Server**: Add `OPENAI_API_KEY` to `.env` file
- **Example**: `OPENAI_API_KEY=sk-your-api-key-here`
- **Required**: OpenAI API key with GPT-4o access
- **Server Dependencies**: `npm install openai multer` (multer already installed)

## AI Generation Flow

1. **User Action**: Click "Import Receipt from Image" in Template Studio
2. **File Selection**: Hidden file input opens (accept="image/*")
3. **Upload**: Image sent to `/api/templates/analyze` with auth token
4. **AI Processing**: OpenAI GPT-4o analyzes receipt structure
5. **Response**: JSON with canvas dimensions and positioned elements
6. **Conversion**: Response converted to internal template format
7. **State Injection**: Template applied to canvas via `applyTemplate()`
8. **User Interaction**: Canvas populates, user can edit and save

## Design System Compliance

- **Button Styling**: Sharp edges (0px radius), outlined button
- **Loading State**: JetBrains Mono font, `> analyzing_layout...` text
- **Icons**: Camera (upload), Upload (action indicator)
- **Hover State**: --accent-red color transition
- **Integration**: Seamless toolbar integration in Template Studio

## Phase 1: Template Persistence

### Database Schema
- **Location**: `server/migrations/002_ledgerx_tables.sql`
- **Tables**: `templates`, `receipts`
- **Features**: User scoping, RLS policies, automatic timestamps

**Templates Table**:
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

**Receipts Table**:
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Backend API Routes
- **Location**: `server/server.js`
- **Authentication**: Protected by `requireAuth` middleware

**Templates CRUD**:
- `GET /api/templates` - Fetch all templates for authenticated user
- `POST /api/templates` - Create new template (name, schema_json)
- `PUT /api/templates/:id` - Update existing template
- `DELETE /api/templates/:id` - Delete template

**Receipts CRUD**:
- `GET /api/receipts` - Fetch all receipts with template names joined
- `POST /api/receipts` - Create new receipt record (template_id, form_data)
- `DELETE /api/receipts/:id` - Delete receipt record

### Frontend: Template Gallery
- **Location**: `client/src/components/TemplateGallery.jsx`
- **Route**: `/templates` (integrated with `/deck` route)
- **Features**:
  - Fetches templates from `GET /api/templates`
  - Displays grid of template cards with Nothing UI styling
  - Shows template name, element count, and creation date
  - "Edit Template" button routes to Canvas Editor
  - "Use Template" button routes to Receipt Preview
  - Sharp borders, hover states with --accent-red
  - Search functionality for filtering templates

**Nothing UI Styling**:
```css
.template-card {
  border: 1px solid var(--line);
  border-radius: 0;
  transition: border-color 0.15s ease;
}
.template-card:hover {
  border-color: var(--accent-red);
}
```

### Canvas Editor Database Integration
- **Location**: `client/src/components/deck/TemplateEditor.jsx`
- **Update**: "Save Template JSON" button now saves to database
- **Functionality**:
  - Converts template to standard schema using `convertToStandardSchema()`
  - POST to `/api/templates` for new templates
  - PUT to `/api/templates/:id` for existing templates
  - Updates template ID after creation for subsequent saves
  - Uses `applyTemplate()` to update state with saved template

## Phase 2: Record Persistence

### Receipt Generation & Saving
- **Location**: `client/src/components/ReceiptPreviewNew.jsx`
- **Trigger**: Export PNG button click
- **Functionality**:
  - Captures receipt via html2canvas as before
  - Simultaneously sends POST to `/api/receipts`
  - Payload: `{ template_id, form_data }`
  - Shows success toast: "Receipt generated and saved to ledger."
  - Toast styling: Sharp-edged, black background, white text

**Export Flow**:
1. User fills dynamic form fields
2. Clicks "Export PNG" button
3. html2canvas captures receipt as PNG
4. PNG downloads to user's device
5. Receipt data saved to database via API
6. Success toast notification appears

### Sales Dashboard
- **Location**: `client/src/components/SalesDashboard.jsx`
- **Data Source**: `GET /api/receipts` (joins template names)
- **Grid**: ag-grid-react with Nothing UI styling
- **Features**:
  - Standard columns: Date Created, Template Name
  - Dynamic columns from form_data
  - Data flattening utility for common keys
  - JetBrains Mono font for cell data
  - Monochrome header backgrounds
  - Sharp borders (0px radius)

**Data Flattening Utility**:
```javascript
function flattenFormData(receipts) {
  // Extract common keys: customer_name, total_amount, date
  // Prioritize common fields, then add remaining form_data keys
  // Generate dynamic column definitions
}
```

**Nothing UI ag-grid Styling**:
```css
.ledgerx-grid .ag-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--line);
}
.ledgerx-grid .ag-cell {
  font-family: 'JetBrains Mono', monospace;
  border-right: 1px solid var(--line);
}
.ledgerx-grid .ag-row:hover {
  background: var(--bg-secondary);
}
```

### Frontend Routing
- **Location**: `client/src/App.jsx`
- **New Route**: `/preview/:id` - ReceiptPreviewNew component
- **Template Loading**: Fetches template from database, converts schema
- **Navigation**: Template Gallery → Preview → Export & Save

## Complete Flow

### Template Creation Flow
1. User navigates to Template Gallery
2. Clicks "Create blank canvas" or "Import Receipt from Image"
3. Canvas Editor opens with new or AI-generated template
4. User designs template with elements
5. Clicks "Save Template JSON" → saves to database
6. Template appears in Template Gallery

### Receipt Generation Flow
1. User selects template from Template Gallery
2. Clicks "Use Template" → routes to `/preview/:id`
3. ReceiptPreviewNew loads template with dynamic form
4. User fills dynamic fields (customer name, date, amounts)
5. Clicks "Export PNG"
6. Receipt captured as PNG and downloaded
7. Receipt data saved to database
8. Success toast appears
9. Record appears in Sales Dashboard

### Dashboard Viewing Flow
1. User navigates to Sales Dashboard
2. ag-grid loads all receipt records
3. Standard columns show date and template name
4. Dynamic columns show form_data fields
5. User can sort, filter, and paginate records
6. All data displayed in Nothing UI style

## Environment Setup

### Database Migration
```bash
# Apply migration to Supabase
psql -h your-project.supabase.co -U postgres -d postgres -f server/migrations/002_ledgerx_tables.sql
```

### Backend Environment
- Ensure `OPENAI_API_KEY` is set in server `.env`
- Server runs on port 3000 (configurable via PORT env var)
- Supabase credentials required for database operations

### Frontend Environment
- `VITE_API_BASE_URL` points to backend server
- Default: `http://localhost:3000`
- No additional configuration required
