# Multi-Modal WebUI

A lightweight, local-first web application similar to OpenWebUI that enables multi-modal interactions with multiple LLM models simultaneously. Compare responses from different models side-by-side.

## Features

- **Multi-Model Comparison**: Send one prompt and compare responses from multiple Ollama models side-by-side
- **Multi-Modal Support**: 
  - Text input with rich formatting
  - Image upload and processing (sent to Ollama as base64)
  - File attachments (PDFs, documents, etc.)
  - Preview attachments before sending
- **Local-First**: Chat history stored in browser IndexedDB (no server required)
- **PWA Ready**: Progressive Web App with offline capabilities, installable
- **Theme Support**: Dark, light, and system theme with persistent preferences
- **Modern UI**: Built with Next.js, React, Tailwind CSS, and shadcn/ui

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui (Mira style)
- **State Management**: Zustand, React Query
- **Storage**: IndexedDB (Dexie.js)
- **Font**: Figtree
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ (tested with v25.2.1)
- Ollama installed and running locally (default: `http://localhost:11434`)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
multi-modal-webui/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes (Ollama proxy)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── chat/             # Chat components
│   │   ├── model-selector/   # Model selection UI
│   │   └── comparison/       # Response comparison views
│   ├── lib/                  # Utilities
│   │   ├── ollama/           # Ollama client
│   │   └── storage/          # IndexedDB storage
│   ├── hooks/                # Custom React hooks
│   └── types/                # TypeScript types
├── public/                   # Static assets
│   └── manifest.json         # PWA manifest
└── docs/                     # Documentation
```

## Configuration

### Ollama Server URL

The default Ollama server URL is `http://localhost:11434`. To change it, update the `DEFAULT_OLLAMA_URL` in `src/lib/ollama/client.ts` or configure it through the UI (to be implemented).

### Theme

The app supports three theme modes:
- **Light**: Light theme
- **Dark**: Dark theme  
- **System**: Automatically follows your system preference

Theme preference is saved in IndexedDB and persists across sessions. Toggle themes using the buttons in the header.

### PWA Installation

The app is installable as a Progressive Web App. When visiting the site, you'll see an install prompt (on supported browsers). You can also install manually:
- **Chrome/Edge**: Click the install icon in the address bar
- **Safari (iOS)**: Tap Share → Add to Home Screen
- **Firefox**: Click the menu → Install

## Development Status

### ✅ Phase 1: Foundation (Completed)
- [x] Next.js project initialized with TypeScript
- [x] shadcn/ui configured (Mira style, Figtree font)
- [x] PWA manifest created
- [x] Project structure set up
- [x] IndexedDB schema with Dexie.js
- [x] Ollama client library
- [x] API routes for Ollama proxy
- [x] React Query setup

### ✅ Phase 2: Core Features (Completed)
- [x] Chat interface with input area
- [x] Model selection UI with multi-select
- [x] Multi-model side-by-side comparison view
- [x] Chat history sidebar with create/delete
- [x] JSON export/import functionality
- [x] Automatic chat creation on first message
- [x] Response copying functionality

### ✅ Phase 3: Multi-Modal (Completed)
- [x] Image upload and processing
- [x] File attachment support
- [x] Multi-modal prompt handling (images sent to Ollama)
- [x] Attachment preview in chat input
- [x] Display images and files in chat messages
- [x] Storage support for multi-modal content

### ✅ Phase 4: PWA & Polish (Completed)
- [x] PWA manifest
- [x] Service worker for offline support
- [x] Theme support (dark/light/system)
- [x] Theme toggle component in header
- [x] Install prompt component
- [x] Offline indicator
- [x] Service worker registration

### 📋 Phase 3: Multi-Modal (Planned)
- [ ] Image upload and processing
- [ ] File attachment support
- [ ] Multi-modal prompt handling

### 📋 Phase 4: PWA & Polish (Planned)
- [ ] Service worker optimization
- [ ] Offline support
- [ ] Install prompts
- [ ] Theme support (dark/light)

## Storage

Chat history is stored locally in the browser using IndexedDB (via Dexie.js). This means:
- No server-side database required
- Data persists across browser sessions
- Complete privacy (data never leaves your device)
- Export/import functionality for backups
- Multi-modal content (images, files) stored as base64 in IndexedDB

**Note**: Images and files are stored as base64-encoded data. Large files will increase storage usage. IndexedDB can handle GBs of data, but be mindful of browser storage limits.

## License

MIT (to be added)
