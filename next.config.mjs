/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: PWA support with next-pwa will be configured in Phase 4
  // For now, the manifest.json is in place for basic PWA functionality
  // Service worker will be added when next-pwa compatibility with Next.js 16 is resolved
  
  // Support WebAssembly for ONNX Runtime (Piper TTS)
  // Using webpack config for WebAssembly support
  // Run with: npm run dev -- --webpack (or use Turbopack if it supports WASM)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }
    return config;
  },
  
  // Add empty turbopack config to silence the warning
  // Note: WebAssembly support may require using webpack instead
  turbopack: {},
};

export default nextConfig;

