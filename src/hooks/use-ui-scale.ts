import { useState, useEffect, useCallback } from "react";

/**
 * Global UI Scale System
 *
 * Manages three scale states (small / default / large) that affect
 * the entire application by modifying the root font-size via a CSS
 * custom property (--app-scale).
 *
 * Since Tailwind sizing is rem-based, changing the root font-size
 * cascades through ALL typography, spacing, padding, and layout
 * automatically — no component-level changes needed.
 *
 * Scale values:
 *   small   → 0.875 (root ~14px, everything ~12.5% smaller)
 *   default → 1.0   (root  16px, standard)
 *   large   → 1.125 (root ~18px, everything ~12.5% larger)
 */

export type UIScaleLevel = "xsmall" | "small" | "default" | "large";

const STORAGE_KEY = "ui-scale";

const SCALE_VALUES: Record<UIScaleLevel, number> = {
  xsmall: 0.70,
  small: 0.875,
  default: 1,
  large: 1.125,
};

/** Read the stored scale from localStorage (returns "default" if missing/invalid) */
function getStoredScale(): UIScaleLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in SCALE_VALUES) return stored as UIScaleLevel;
  } catch {
    // localStorage may be unavailable (e.g. in incognito on some browsers)
  }
  return "default";
}

/** Apply the scale to the <html> element's CSS custom property */
function applyScale(level: UIScaleLevel) {
  const value = SCALE_VALUES[level];
  document.documentElement.style.setProperty("--app-scale", String(value));
  document.documentElement.setAttribute("data-scale", level);
}

export function useUIScale() {
  const [scale, setScaleState] = useState<UIScaleLevel>(getStoredScale);

  // Apply scale on mount and whenever it changes
  useEffect(() => {
    applyScale(scale);
  }, [scale]);

  const setScale = useCallback((level: UIScaleLevel) => {
    setScaleState(level);
    applyScale(level);
    try {
      localStorage.setItem(STORAGE_KEY, level);
    } catch {
      // silently fail if localStorage is unavailable
    }
  }, []);

  const decrease = useCallback(() => {
    if (scale === "large") setScale("default");
    else if (scale === "default") setScale("small");
    else if (scale === "small") setScale("xsmall");
  }, [scale, setScale]);

  const reset = useCallback(() => {
    setScale("default");
  }, [setScale]);

  const increase = useCallback(() => {
    if (scale === "xsmall") setScale("small");
    else if (scale === "small") setScale("default");
    else if (scale === "default") setScale("large");
  }, [scale, setScale]);

  return {
    scale,
    setScale,
    decrease,
    reset,
    increase,
    isXSmall: scale === "xsmall",
    isSmall: scale === "small",
    isDefault: scale === "default",
    isLarge: scale === "large",
  };
}
