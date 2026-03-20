"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

let activeShifts = 0;
let storedTheme: "light" | "dark" | null = null;
let transitionTimer: number | null = null;
let currentTheme: "light" | "dark" | null = null;

const readBaseTheme = (): "light" | "dark" => {
  const root = document.documentElement;
  if (!root) return "light";
  const baseAttr = root.getAttribute("data-base-theme");
  if (baseAttr === "light" || baseAttr === "dark") return baseAttr;
  const attrTheme = root.getAttribute("data-theme");
  if (attrTheme === "light" || attrTheme === "dark") return attrTheme;
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

const getStoredTheme = (): "light" | "dark" => {
  if (storedTheme === null) {
    storedTheme = readBaseTheme();
    document.documentElement?.setAttribute("data-base-theme", storedTheme);
  }
  return storedTheme;
};

const ensureTransitionClass = () => {
  const root = document.documentElement;
  if (!root) return;
  if (transitionTimer) {
    clearTimeout(transitionTimer);
    transitionTimer = null;
  }
  root.classList.add("theme-transition");
};

const applyTheme = (theme: "light" | "dark") => {
  const root = document.documentElement;
  if (!root) return;
  if (root.getAttribute("data-theme") === theme && currentTheme === theme) return;

  ensureTransitionClass();
  root.setAttribute("data-theme", theme);
  currentTheme = theme;
};

const applyDarkMode = () => {
  getStoredTheme();
  activeShifts += 1;
  applyTheme("dark");
};

const releaseDarkMode = () => {
  const root = document.documentElement;
  if (!root) return;
  activeShifts = Math.max(0, activeShifts - 1);
  if (activeShifts === 0) {
    const nextTheme = getStoredTheme();
    applyTheme(nextTheme);
    transitionTimer = window.setTimeout(() => {
      root.classList.remove("theme-transition");
      storedTheme = null;
      currentTheme = root.getAttribute("data-theme") as "light" | "dark" | null;
      transitionTimer = null;
    }, 550);
  }
};

/**
 * Toggles the global dark theme while `active` is true.
 * Multiple callers are reference-counted, and the original theme is restored when all release.
 *
 * Uses useLayoutEffect so theme changes apply before the browser paints,
 * preventing visible flashes during React strict mode or rapid state changes.
 * Deactivation is debounced to prevent flicker from scroll boundary toggling.
 */
export function useDarkModeShift(enabled: boolean, active: boolean) {
  const appliedRef = useRef(false);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // useLayoutEffect fires synchronously before paint — no visible intermediate states.
  // Intentionally no cleanup return: cleanup would fire on every dep change and in
  // strict mode, causing release→reapply flashes. Unmount cleanup is handled separately.
  useLayoutEffect(() => {
    if (!enabled) {
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      if (appliedRef.current) {
        releaseDarkMode();
        appliedRef.current = false;
      }
      return;
    }

    if (active) {
      // Activate immediately, cancel any pending release
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      if (!appliedRef.current) {
        applyDarkMode();
        appliedRef.current = true;
      }
    } else if (appliedRef.current && !releaseTimerRef.current) {
      // Debounce deactivation — prevents flicker from brief "not visible" blips
      releaseTimerRef.current = setTimeout(() => {
        releaseTimerRef.current = null;
        if (appliedRef.current) {
          releaseDarkMode();
          appliedRef.current = false;
        }
      }, 250);
    }
  }, [enabled, active]);

  // Separate unmount-only cleanup
  useEffect(() => {
    return () => {
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      if (appliedRef.current) {
        releaseDarkMode();
        appliedRef.current = false;
      }
    };
  }, []);
}
