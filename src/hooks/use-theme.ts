"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, updateUserSettings } from "@/lib/storage/db";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use liveQuery only for reading - don't call getOrCreateUserSettings which does writes
  const settings = useLiveQuery(() => db.user_settings.get("default"));

  // Initialize default settings on mount (outside of liveQuery)
  useEffect(() => {
    const initializeSettings = async () => {
      if (!isInitialized) {
        try {
          const existing = await db.user_settings.get("default");
          if (!existing) {
            // Use put instead of add to avoid constraint errors if it already exists
            await db.user_settings.put({
              id: "default",
              theme: "system",
              defaultModels: [],
              preferences: {},
            });
          }
        } catch (error) {
          // If there's an error, settings might already exist, which is fine
          console.log("Settings initialization:", error);
        }
        setIsInitialized(true);
      }
    };

    initializeSettings();
  }, [isInitialized]);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const theme = settings?.theme || "system";
    const effectiveTheme = theme === "system" ? systemTheme : theme;

    const root = document.documentElement;
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings?.theme, systemTheme]);

  const setTheme = async (theme: Theme) => {
    await updateUserSettings({ theme });
  };

  const currentTheme = settings?.theme || "system";
  const effectiveTheme = currentTheme === "system" ? systemTheme : currentTheme;

  return {
    theme: currentTheme,
    effectiveTheme,
    setTheme,
  };
}

