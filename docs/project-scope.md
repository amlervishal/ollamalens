# Multi-Modal WebUI - Project Scope

## Project Overview
A lightweight, local-first web application similar to OpenWebUI that enables multi-modal interactions with multiple LLM models simultaneously. The application allows users to send one prompt and compare responses from selected models, primarily using Ollama with support for limited cloud models.

## Core Features

### 1. Multi-Model Comparison
- Single prompt input
- Select multiple models from available Ollama models
- **Side-by-side comparison view** (exactly like OpenWebUI) - all model responses displayed in columns
- Support for both local Ollama models and limited cloud models

### 2. Multi-Modal Support
- Text input
- Image upload and processing
- Audio input (if supported by models)
- File attachments (document processing)

### 3. Model Management
- Discover and list available Ollama models locally
- Connect to Ollama server (local instance)
- Support for limited cloud model integrations
- Model selection interface

### 4. Chat History
- **Storage Strategy**: IndexedDB (local-first, browser-based storage)
- **Storage Size Analysis** (text-only):
  - Average message: ~200-500 characters (~0.5KB per message)
  - Average conversation: 20-50 messages (~10-25KB per conversation)
  - Estimated per user (100 conversations): ~1-2.5MB
  - **Total for 4 users: ~4-10MB** (well within IndexedDB capacity)
- **Storage Implementation**:
  - **IndexedDB** (primary storage)
    - Browser-based NoSQL database
    - Large storage capacity (typically 50% of disk space, GBs available)
    - Automatic persistence (survives browser restarts)
    - Fast queries with indexing support
    - Works completely offline
    - No server/database setup required
    - Privacy-focused (data stored locally in browser)
- Export/Import functionality for chat history (JSON format)
- Search and filter chat history

### 5. Progressive Web App (PWA)
- Installable on any device
- Offline capabilities where possible
- Service worker for caching
- App manifest
- Works on mobile, tablet, desktop

### 6. User Interface
- Simple, clean UI (not complex)
- Responsive design
- Component library: shadcn/ui (to be created as reference library)
- Dark/light mode support

## Technical Stack Recommendations

### Frontend Framework
- **Next.js** (confirmed for Vercel deployment)
  - App Router for routing
  - Server Components where beneficial
  - API routes for Ollama proxy

### UI Framework
- React
- shadcn/ui components (custom library to be created)
- Tailwind CSS for styling

### State Management
- Zustand or React Context (lightweight)
- React Query/SWR for server state (Ollama API calls)

### Storage & Database
- **IndexedDB** (Browser-based NoSQL database)
  - Chat history storage
  - User preferences/settings
  - Automatic persistence
  - Large storage capacity (GBs)
- **IndexedDB Library**: Dexie.js (recommended wrapper for easier API)
- Export/Import: JSON file format for backup and portability

### PWA Support
- next-pwa (if Next.js) or workbox
- Service worker for offline support
- Web App Manifest

### Ollama Integration
- REST API client for Ollama
- WebSocket support for streaming responses
- Error handling for connection issues

## Project Setup

### Initialization Command
Initialize the project using shadcn CLI with Next.js template:
```bash
npx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=mira&baseColor=neutral&theme=neutral&iconLibrary=lucide&font=figtree&menuAccent=subtle&menuColor=default&radius=default&template=next" --template next
```

**Configuration Details**:
- Base: Radix UI
- Style: Mira
- Base Color: Neutral
- Theme: Neutral
- Icon Library: Lucide
- Font: Figtree
- Menu Accent: Subtle
- Menu Color: Default
- Radius: Default
- Template: Next.js

### PWA Setup
- Add PWA support after initial setup (if available in shadcn template)
- If not included, configure manually using:
  - `next-pwa` package for Next.js
  - Service worker configuration
  - Web App Manifest
  - App icons (multiple sizes for PWA)

## Architecture

### Project Structure (Skeleton)
```
multi-modal-webui/
├── app/                          # Next.js app directory (if using Next.js)
│   ├── (routes)/                # Route groups
│   ├── api/                     # API routes (Ollama proxy)
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components (reference library)
│   ├── chat/                    # Chat-related components
│   ├── model-selector/          # Model selection UI
│   └── comparison/              # Response comparison views
├── lib/                         # Utilities and helpers
│   ├── ollama/                  # Ollama client
│   ├── storage/                 # IndexedDB storage utilities
│   └── utils/                   # General utilities
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript types
├── public/                      # Static assets
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # PWA icons
├── styles/                      # Global styles
└── config/                      # Configuration files
```

## Data Storage Strategy

### Chat History Storage (IndexedDB Schema)
```typescript
// IndexedDB Database Structure (using Dexie.js)
Database: 'MultiModalWebUI'

Stores:
chats
  - id (string, primary key)
  - title (string)
  - createdAt (number, timestamp)
  - updatedAt (number, timestamp)
  - indexes: ['createdAt', 'updatedAt', 'title']

messages
  - id (string, primary key)
  - chatId (string, indexed)
  - role (string) -- 'user' or 'assistant'
  - content (string)
  - model (string, nullable) -- model name if assistant message
  - createdAt (number, timestamp)
  - orderIndex (number) -- message order in conversation
  - indexes: ['chatId', 'createdAt', 'orderIndex']

user_settings
  - id (string, primary key)
  - theme (string)
  - defaultModels (array)
  - preferences (object)
```

### Why IndexedDB?
- **Local-first**: Data stored in browser, no server required
- **Large capacity**: Typically 50% of disk space (GBs available)
- **Automatic persistence**: Data survives browser restarts
- **Fast queries**: Indexed queries for efficient search and filtering
- **Offline support**: Works completely offline (perfect for PWA)
- **Privacy-focused**: Data never leaves user's device
- **No setup**: No database server or cloud service configuration needed
- **Cost-effective**: No cloud storage costs

### Storage Size Breakdown
- **Text-only chats**: ~4-10MB total for 4 users (very lightweight)
- **With images**: If adding image support later, storage needs will increase, but IndexedDB can handle GBs
- **Capacity**: IndexedDB can store GBs of data (typically 50% of available disk space)
- **Recommendation**: IndexedDB provides ample storage for local-first approach

### Backup/Export
- Export to JSON file (from IndexedDB)
- Import from JSON file (to IndexedDB)
- User-controlled backup and restore
- Portable data format (JSON)

## Key Functionalities

### 1. Ollama Connection
- Connect to Ollama instance (assumes Ollama is already running)
- Default connection: http://localhost:11434
- Detect available models via `/api/tags`
- Handle connection errors gracefully
- Support custom Ollama server URL configuration

### 2. Prompt Processing
- Single prompt input (text, images, files)
- Send to selected models simultaneously
- Stream responses (if supported)
- Display responses as they arrive
- Error handling per model

### 3. Response Comparison
- **Side-by-side view** (exactly like OpenWebUI)
  - All selected model responses displayed in columns
  - Scrollable columns for long responses
  - Equal column widths or auto-sizing
- Copy individual responses
- Regenerate individual responses
- Save comparison to chat history

### 4. Chat Management
- Create new chat
- List all chats
- Open chat from history
- Delete chat
- Search chats
- Export chat
- Clear all chats

## Development Phases

### Phase 1: Foundation
- [ ] Initialize project with shadcn CLI (Next.js template)
- [ ] Configure PWA support (next-pwa if not included)
- [ ] Basic routing
- [ ] Ollama client integration
- [ ] Model discovery and listing
- [ ] Basic UI layout

### Phase 2: Core Features
- [ ] Chat interface
- [ ] Single model response (proof of concept)
- [ ] Multi-model side-by-side comparison
- [ ] IndexedDB setup and chat storage
- [ ] Chat history management
- [ ] JSON export/import functionality

### Phase 3: Multi-Modal
- [ ] Image upload and processing
- [ ] File attachment support
- [ ] Multi-modal prompt handling

### Phase 4: PWA & Polish
- [ ] PWA manifest
- [ ] Service worker
- [ ] Offline support
- [ ] Install prompts
- [ ] shadcn/ui component library
- [ ] Theme support (dark/light)

### Phase 5: Optimization & Deployment
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Testing
- [ ] Vercel deployment setup
- [ ] Documentation
- [ ] Open source preparation (LICENSE, README)

## Deployment Considerations

### Vercel Deployment
- Next.js deployment on Vercel
- Environment variables for configuration:
  - Ollama server URL (if needed for proxy)
- API routes for Ollama proxy (if needed for CORS)
- Client-side IndexedDB (no server-side storage required)

### PWA Requirements
- HTTPS (required for PWA)
- Manifest file
- Service worker
- App icons (multiple sizes)
- Display mode: standalone or fullscreen

## Limitations & Considerations

1. **Ollama Dependency**: Assumes Ollama is already installed and running (not part of this project)
2. **CORS**: May need proxy for Ollama API if accessed from different origin
3. **Storage**: IndexedDB provides GBs of storage capacity; sufficient for text-only chats and images/files
4. **Cloud Models**: Limited integration (API keys, rate limits)
5. **Browser Compatibility**: PWA features and IndexedDB support vary by browser (modern browsers fully support)
6. **Data Portability**: Data stored locally in browser; users can export to JSON for backup/portability
7. **Multi-device**: No automatic sync across devices (local-first approach); users can manually export/import JSON files

## Open Source Preparation

- MIT or Apache 2.0 License
- Comprehensive README
- Contribution guidelines
- Setup instructions
- Architecture documentation
- Demo/screenshots

## Next Steps

1. Initialize project using shadcn CLI with Next.js template
2. Configure PWA support (if not included in template)
3. Set up IndexedDB with Dexie.js for chat storage
4. Implement Ollama client and model discovery
5. Create basic chat interface with side-by-side comparison
6. Implement IndexedDB storage for chat history
7. Build multi-model comparison feature (side-by-side view like OpenWebUI)
8. Add JSON export/import functionality for chat backup

---

**Note**: This is a living document. Update as requirements evolve.

