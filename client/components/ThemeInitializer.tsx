"use client";

import { useTheme } from "@/hooks/useTheme";

/**
 * Mounts the theme effect on every page so the `.dark` class is applied from
 * localStorage/system preference regardless of which route is active.
 * Renders nothing — side-effects only.
 */
export function ThemeInitializer() {
  useTheme();
  return null;
}
