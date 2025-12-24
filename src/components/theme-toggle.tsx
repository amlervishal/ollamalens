"use client";

import { useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Single button showing current theme */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        title={`Theme: ${theme}`}
      >
        {getIcon()}
      </Button>

      {/* Expanded options on hover */}
      {isHovered && (
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-background border rounded-md shadow-lg p-1 animate-in fade-in-0 zoom-in-95 duration-200">
          <Button
            variant={theme === "light" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setTheme("light");
              setIsHovered(false);
            }}
            title="Light mode"
          >
            <Sun className="h-4 w-4" />
          </Button>
          <Button
            variant={theme === "system" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setTheme("system");
              setIsHovered(false);
            }}
            title="System theme"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setTheme("dark");
              setIsHovered(false);
            }}
            title="Dark mode"
          >
            <Moon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

