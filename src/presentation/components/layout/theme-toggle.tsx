"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/presentation/contexts/theme-context";
import { Button } from "@/presentation/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en clair" : "Passer en sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
