"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { effectiveTheme } = useTheme();

  // This component ensures theme is applied before render
  // The actual theme logic is in useTheme hook
  return <>{children}</>;
}

