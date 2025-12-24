# Quick Piper TTS Setup for Human-Like Voice

Browser TTS has limitations - even with the best voices, it can sound robotic. **Piper TTS** provides much more human-like, natural speech quality.

## Quick Setup (5 minutes)

### Step 1: Install ONNX Runtime WASM files

```bash
# Make sure you're in the project directory
cd /Users/vishal/work/multi-modal-webui

# Install dependencies (if not already done)
npm install

# Create wasm directory
mkdir -p public/wasm

# Copy ONNX Runtime WASM files
cp node_modules/onnxruntime-web/dist/*.wasm public/wasm/ 2>/dev/null || echo "WASM files will be loaded from CDN"
cp node_modules/onnxruntime-web/dist/*.js public/wasm/ 2>/dev/null || echo "JS files will be loaded from CDN"
```

### Step 2: Restart the dev server

```bash
npm run dev
```

### Step 3: Use Piper TTS

The app will automatically try to use Piper TTS when available. To manually enable:

1. Open browser console (F12)
2. Check if ONNX Runtime loaded successfully
3. The app will automatically download and use Piper voices

## Alternative: Use Better Browser Voices

If you can't set up Piper TTS right now, try these browser voice improvements:

1. **On macOS**: The app should automatically use "Samantha" or "Alex" voices
2. **On Windows**: Look for "Microsoft Zira" or "Microsoft David" 
3. **On Chrome**: May have "Google US English" voices

The app now:
- ✅ Automatically selects the best available voice
- ✅ Preprocesses text for more natural speech
- ✅ Uses optimized rate/pitch settings
- ✅ Handles punctuation and pauses better

## Voice Quality Comparison

- **Browser TTS**: ⭐⭐⭐ (Good, but can sound robotic)
- **Piper TTS**: ⭐⭐⭐⭐⭐ (Very human-like, natural)

## Troubleshooting

If Piper TTS doesn't work:
- Check browser console for errors
- Ensure `onnxruntime-web` is installed: `npm install onnxruntime-web`
- WASM files should be in `public/wasm/` directory
- The app will automatically fall back to browser TTS

## Next Steps

Once Piper TTS is set up, voices will be downloaded automatically (12-50 MB each) and cached in your browser for offline use. The quality improvement is significant!

