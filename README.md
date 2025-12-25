# OllamaLens 🔍

> **Compare AI models side-by-side** - Your local multi-modal Ollama interface with intelligent response evaluation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

A lightweight, **privacy-first**, local web application that enables multi-modal interactions with multiple Ollama models simultaneously. Compare responses from different LLMs side-by-side with intelligent evaluation, highlighting, and Text-to-Speech capabilities—all running completely offline on your own machine.

---

## 📖 Overview

**OllamaLens** transforms how you interact with large language models by allowing you to:

- **Send one prompt** to multiple Ollama models at once
- **Compare responses side-by-side** in a clean, intuitive interface
- **Evaluate responses automatically** using AI-powered comparison metrics (accuracy, completeness, clarity, and more)
- **Highlight key differences** between responses to spot strengths and weaknesses
- **Process multi-modal content** including images, PDFs, and documents
- **Keep your data private** - everything runs locally in your browser with no cloud dependency
- **Work offline** - Progressive Web App (PWA) with full offline support
- **Listen to responses** - Built-in Text-to-Speech with Piper TTS integration

### Why OllamaLens?

In the age of multiple AI models, choosing the right model for your task is challenging. OllamaLens helps you:

✅ **Experiment faster** - Test multiple models without switching contexts  
✅ **Make informed decisions** - See which model performs best for your specific use case  
✅ **Learn model strengths** - Understand each model's capabilities through comparison  
✅ **Save time** - No need to repeat prompts across different interfaces  
✅ **Maintain privacy** - Your prompts and data never leave your machine  
✅ **Stay organized** - Chat history stored locally in IndexedDB with export/import  

---

## 🎯 Use Cases

### For Individuals

#### 1. **Research & Learning**
- Compare how different models explain complex topics (e.g., quantum physics, machine learning concepts)
- Evaluate factual accuracy across models by checking consistency
- Get multiple perspectives on subjective questions

#### 2. **Content Creation**
- Generate blog post outlines from multiple models and pick the best structure
- Compare creative writing styles (storytelling, poetry, scripts)
- Evaluate tone and clarity for different audiences

#### 3. **Problem Solving**
- Get coding solutions from multiple models and compare approaches
- Troubleshoot technical issues with diverse debugging strategies
- Compare step-by-step guides for DIY projects or tutorials

#### 4. **Language & Translation**
- Compare translations across models for accuracy and naturalness
- Evaluate grammar corrections and writing improvements
- Get multiple paraphrasing options

#### 5. **Decision Making**
- Compare pros/cons analysis from different AI perspectives
- Evaluate recommendations for products, services, or strategies
- Get diverse viewpoints on ethical or philosophical questions

### For Developers

#### 1. **Model Benchmarking**
- Test prompt engineering techniques across multiple models
- Compare response quality, speed, and consistency
- Identify the best model for specific tasks in your application

#### 2. **Prompt Development**
- Iterate on prompt design and instantly see how different models respond
- Test edge cases and robustness across model families
- Optimize prompts for specific output formats (JSON, XML, code)

#### 3. **Integration Testing**
- Validate multi-modal capabilities (image + text prompts)
- Test file processing and document understanding
- Compare API response structures and formats

#### 4. **AI Application Development**
- Prototype chatbots and AI features locally before deployment
- Test conversation flows and context handling
- Evaluate model outputs for your specific domain

#### 5. **Cost Optimization**
- Identify smaller, faster models that meet your quality requirements
- Compare local models to find the best performance/resource balance
- Reduce dependency on expensive cloud APIs

#### 6. **Education & Demonstration**
- Teach students about LLM capabilities and limitations
- Demonstrate AI model differences in workshops or presentations
- Create comparative examples for documentation

---

## ✨ Key Features

### Multi-Model Comparison
- **Parallel inference**: Send one prompt to multiple Ollama models simultaneously
- **Side-by-side view**: Compare responses in clean, organized columns
- **Individual regeneration**: Regenerate responses for specific models without affecting others
- **Copy responses**: One-click copy for any model's output

### Intelligent Response Evaluation
- **Automated scoring**: AI-powered evaluation across 8 dimensions:
  - Accuracy & Correctness
  - Completeness & Coverage
  - Clarity & Readability
  - Relevance & Focus
  - Depth & Insight
  - Structure & Organization
  - Conciseness & Efficiency
  - Tone & Professionalism
- **Visual highlights**: See differences between responses with color-coded highlighting
- **Similarity analysis**: Identify unique insights and common patterns
- **Grading summaries**: Quick overview of each model's strengths

### Multi-Modal Support
- **Text prompts**: Rich text input with markdown preview
- **Image upload**: Send images to vision-capable models (base64 encoding)
- **File attachments**: Process PDFs, documents, and other files
- **Attachment preview**: Review files before sending
- **Multi-modal history**: Images and files stored in chat history

### Text-to-Speech (TTS)
- **Piper TTS integration**: High-quality offline speech synthesis
- **Multiple voices**: Choose from various voice models
- **Web Speech API fallback**: Browser-native TTS as backup
- **Response playback**: Listen to any model response

### Privacy & Local-First
- **No cloud dependency**: Everything runs in your browser
- **IndexedDB storage**: Chat history stored locally (no server required)
- **Complete privacy**: Your data never leaves your device
- **Export/Import**: Backup chats as JSON files
- **Offline capable**: Full PWA support for offline usage

### Modern UI/UX
- **Clean interface**: Built with shadcn/ui (Mira style)
- **Dark/Light themes**: System theme detection with manual override
- **Responsive design**: Works on desktop, tablet, and mobile
- **Installable**: Progressive Web App (PWA) - install like a native app
- **Fast & lightweight**: Optimized performance with React 19 and Next.js 16

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (tested with v25.2.1) - [Download here](https://nodejs.org/)
- **Ollama** installed and running locally - [Get Ollama](https://ollama.ai/)
- At least **2 Ollama models** installed for comparison

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/amlervishal/ollamalens.git
cd ollamalens
```

2. **Install dependencies**
```bash
npm install
```

3. **Ensure Ollama is running**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
ollama serve
```

4. **Pull some Ollama models** (if you haven't already)
```bash
ollama pull llama3.2
ollama pull mistral
ollama pull gemma2
ollama pull qwen2.5
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - The app will automatically detect your installed Ollama models

### Build for Production

```bash
npm run build
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### PWA Installation

Install OllamaLens as a standalone app:
- **Chrome/Edge**: Click the install icon (⊕) in the address bar
- **Safari (iOS)**: Tap Share → Add to Home Screen
- **Firefox**: Menu → Install

---

## 📱 Usage Guide

### Basic Workflow

1. **Select Models**: Click the model selector in the sidebar and choose 2+ models to compare
2. **Enter Prompt**: Type your question or prompt in the input area at the bottom
3. **Send**: Press Enter or click Send - all selected models will respond simultaneously
4. **Compare**: Review responses side-by-side in the comparison view
5. **Evaluate** (Optional): Click "Evaluate All" to get AI-powered scoring and analysis
6. **Highlight** (Optional): Click "Analyze Highlights" to see differences color-coded

### Advanced Features

#### Multi-Modal Prompts
- Click the 📎 attachment icon to upload images or files
- Images are sent to vision-capable models (e.g., llava, bakllava)
- Preview attachments before sending

#### Response Evaluation
- **Evaluate All**: Analyzes all responses and provides scores across 8 dimensions
- **Analyze Highlights**: Identifies unique content and highlights differences
- **Toggle Highlights**: Show/hide highlighted sections

#### Text-to-Speech
- Click the 🔊 speaker icon on any response to hear it read aloud
- Configure TTS voice in settings (coming soon)

#### Chat Management
- **New Chat**: Click the + button in the sidebar
- **Chat History**: Expand the "History" section to view past conversations
- **Export/Import**: Save chats as JSON for backup or sharing

---

## 🤝 Contributing

**We welcome contributions!** OllamaLens is an open-source project, and we'd love your help making it better.

### How to Contribute

1. **Report Issues**: Found a bug or have a feature request? [Open an issue](https://github.com/amlervishal/ollamalens/issues)
2. **Suggest Improvements**: Have ideas for better UX, new features, or optimizations? We'd love to hear them!
3. **Submit Pull Requests**: 
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/amazing-feature`)
   - Commit your changes (`git commit -m 'Add amazing feature'`)
   - Push to the branch (`git push origin feature/amazing-feature`)
   - Open a Pull Request

### Areas We Need Help

- 🎨 **UI/UX Design**: Improve the interface, add animations, enhance accessibility
- 🧪 **Testing**: Write unit tests, integration tests, E2E tests
- 📚 **Documentation**: Improve guides, add tutorials, create video walkthroughs
- 🌐 **Internationalization**: Add support for more languages
- 🔧 **Features**: Implement items from our roadmap (see Future Development)
- 🐛 **Bug Fixes**: Help squash bugs and improve stability
- ⚡ **Performance**: Optimize rendering, reduce bundle size, improve loading times

### Development Guidelines

- Follow the existing code style (TypeScript + ESLint)
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly

---

## 🔮 Future Development

### Planned Features

- 🏆 **Judge LLM System**: Automatic judge model assignment based on prompt analysis, comprehensive evaluation with detailed explanations, and final synthesized response combining the best parts from all models
- 🔗 **Model Chaining**: Use output from one model as input to another
- 📊 **Analytics Dashboard**: Visualize model performance over time
- 🔌 **Plugin System**: Extend functionality with custom plugins
- ☁️ **Cloud Model Support**: Optional integration with OpenAI, Anthropic, Google APIs
- 🎙️ **Speech-to-Text**: Voice input for prompts
- 📝 **Prompt Library**: Save and share reusable prompts
- 👥 **Collaboration**: Share chat sessions with others
- 🔍 **Advanced Search**: Full-text search across all chats
- 📈 **Model Statistics**: Track token usage, response times, and quality metrics

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://reactjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Component Library**: [shadcn/ui](https://ui.shadcn.com/) (Mira style)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/), [React Query](https://tanstack.com/query)
- **Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [Dexie.js](https://dexie.org/)
- **Font**: [Figtree](https://fonts.google.com/specimen/Figtree) from Google Fonts
- **Icons**: [Lucide React](https://lucide.dev/)
- **PWA**: [next-pwa](https://github.com/shadowwalker/next-pwa)
- **TTS**: [Piper TTS](https://github.com/rhasspy/piper) (offline), Web Speech API (fallback)
- **LLM Client**: Custom Ollama REST API client

---

## 📂 Project Structure

```
ollamalens/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes (Ollama proxy, evaluation)
│   │   │   ├── ollama/        # Ollama API endpoints
│   │   │   └── evaluation/    # Response evaluation endpoint
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Main chat interface
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── chat/             # Chat-related components
│   │   │   ├── chat-history.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── chat-messages.tsx
│   │   │   └── evaluation-controls.tsx
│   │   ├── comparison/       # Response comparison views
│   │   │   ├── comparison-view.tsx
│   │   │   ├── evaluation-display.tsx
│   │   │   └── highlighted-content.tsx
│   │   ├── model-selector/   # Model selection UI
│   │   ├── tts/              # Text-to-speech components
│   │   └── theme-toggle.tsx  # Dark/light mode toggle
│   ├── hooks/                # Custom React hooks
│   │   ├── use-chats.ts      # Chat management
│   │   ├── use-models.ts     # Model fetching
│   │   ├── use-send-message.ts
│   │   ├── use-response-evaluation.ts
│   │   ├── use-text-to-speech.ts
│   │   └── use-hybrid-tts.ts
│   ├── lib/                  # Utilities and libraries
│   │   ├── ollama/           # Ollama client
│   │   ├── storage/          # IndexedDB utilities
│   │   ├── tts/              # Piper TTS integration
│   │   └── utils/            # Helper functions
│   ├── store/                # Zustand stores
│   │   └── chat-store.ts     # Global chat state
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # App icons
├── docs/                     # Documentation
└── package.json
```

---

## 🗄️ Storage & Privacy

### Local-First Architecture

OllamaLens is designed with **privacy and data ownership** as core principles:

- **All data stored locally**: Chat history, settings, and preferences are stored in your browser's IndexedDB
- **No cloud servers**: No data is ever sent to external servers (except to your local Ollama instance)
- **No tracking**: No analytics, no telemetry, no tracking scripts
- **No accounts required**: Use the app instantly without sign-up
- **Portable data**: Export your chats as JSON files anytime
- **Multi-modal storage**: Images and files stored as base64 in IndexedDB

### Storage Capacity

- **Text-only chats**: ~4-10MB for hundreds of conversations
- **With images/files**: IndexedDB can handle GBs of data
- **Browser limits**: Typically 50% of available disk space
- **No server costs**: Everything runs in your browser

### Backup & Restore

- Export chats to JSON files for backup
- Import JSON files to restore or transfer chats between devices
- Manual sync across devices (automatic sync planned for future)

---

## 🔧 Configuration

### Ollama Server

Default Ollama URL: `http://localhost:11434`

To change it, edit `src/lib/ollama/client.ts`:

```typescript
export const DEFAULT_OLLAMA_URL = "http://your-ollama-server:11434";
```

Or set via environment variable (coming soon):
```bash
NEXT_PUBLIC_OLLAMA_URL=http://your-server:11434
```

### Piper TTS Setup

For offline text-to-speech, install Piper TTS:

1. Download Piper from [GitHub](https://github.com/rhasspy/piper)
2. Follow setup instructions in `PIPER_TTS_SETUP.md`
3. Configure voice models in the app settings

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) - For making local LLMs accessible
- [shadcn/ui](https://ui.shadcn.com/) - For the beautiful component library
- [Next.js](https://nextjs.org/) - For the amazing React framework
- [Piper TTS](https://github.com/rhasspy/piper) - For high-quality offline speech synthesis
- The open-source community for inspiration and support

---

## 🔗 Links

- **GitHub**: [github.com/amlervishal/ollamalens](https://github.com/amlervishal/ollamalens)
- **Issues**: [Report bugs or request features](https://github.com/amlervishal/ollamalens/issues)
- **Discussions**: [Join the community](https://github.com/amlervishal/ollamalens/discussions)
- **Ollama**: [ollama.ai](https://ollama.ai/)

---

## 📧 Support

Need help? Have questions?

- 📖 Check the [documentation](docs/)
- 💬 Start a [discussion](https://github.com/amlervishal/ollamalens/discussions)
- 🐛 Report a [bug](https://github.com/amlervishal/ollamalens/issues)
- ⭐ Star the project if you find it useful!

---

<div align="center">

**Made with ❤️ for the AI community**

If OllamaLens helps you, consider giving it a ⭐ on GitHub!

</div>
