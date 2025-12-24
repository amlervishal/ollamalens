# Piper TTS Setup Guide

This guide explains how to set up Piper TTS for high-quality, on-device text-to-speech in your browser.

## Overview

Piper TTS provides significantly better voice quality than browser's built-in Web Speech API. However, it requires some setup:

1. **ONNX Runtime WebAssembly** - For running the neural TTS models
2. **Voice Models** - Pre-trained voice models (12-50 MB each)
3. **Phonemization** - Text-to-phoneme conversion (currently using simplified approach)

## Installation

### Step 1: Install ONNX Runtime WebAssembly

```bash
npm install onnxruntime-web
```

### Step 2: Copy ONNX Runtime WASM Files

ONNX Runtime requires WebAssembly files to be served from your public directory. Copy the WASM files:

```bash
# Create wasm directory in public folder
mkdir -p public/wasm

# Copy ONNX Runtime WASM files
# The files should be in node_modules/onnxruntime-web/dist/
cp node_modules/onnxruntime-web/dist/*.wasm public/wasm/
cp node_modules/onnxruntime-web/dist/*.js public/wasm/
```

Alternatively, you can configure Next.js to serve WASM files properly in `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
```

### Step 3: Update Piper TTS Implementation

The current implementation has a placeholder for phonemization. For production use, you'll need to:

1. **Option A: Use espeak-ng via WebAssembly**
   - Compile espeak-ng to WebAssembly
   - Use it for proper phonemization

2. **Option B: Use a phonemization service**
   - Call a local API endpoint that runs espeak-ng
   - Or use a JavaScript phonemization library

3. **Option C: Use pre-phonemized text**
   - Pre-process text server-side with espeak-ng
   - Send phonemes directly to Piper

## Current Status

⚠️ **Note**: The current implementation includes a simplified phonemization that may not produce optimal results. For best quality, proper espeak-ng phonemization is required.

## Usage

The application will automatically:
1. Try to use Piper TTS if a voice is loaded
2. Fall back to browser Web Speech API if Piper is unavailable
3. Show voice selection UI when Piper TTS is available

## Voice Models

Voice models are downloaded from Hugging Face and cached in the browser. Available voices:

- **en_US-lessac-medium** (12 MB) - Medium quality, fast
- **en_US-lessac-high** (50 MB) - High quality, slower
- **en_US-amy-medium** (12 MB) - Alternative voice

Models are downloaded once and cached for offline use.

## Troubleshooting

### ONNX Runtime not loading
- Ensure WASM files are in `public/wasm/`
- Check browser console for errors
- Verify `onnxruntime-web` is installed

### Voice models not downloading
- Check network connectivity
- Verify Hugging Face URLs are accessible
- Check browser cache storage limits

### Poor voice quality
- Ensure proper phonemization is implemented
- Try a higher quality voice model
- Check that the model loaded correctly

## Alternative: Use Browser TTS

If Piper TTS setup is too complex, the application will automatically fall back to browser's Web Speech API, which works immediately but with lower quality.

## Future Improvements

- [ ] Proper espeak-ng phonemization via WebAssembly
- [ ] More voice models and languages
- [ ] Voice preview functionality
- [ ] Custom voice settings (speed, pitch, etc.)

