import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { RegisterServiceWorker } from "./register-sw";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multi-Modal WebUI",
  description: "Local-first multi-modal web application for interacting with multiple LLM models",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <Providers>{children}</Providers>
          <RegisterServiceWorker />
        </ThemeProvider>
      </body>
    </html>
  );
}
