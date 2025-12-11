"use client";

import { useEffect, useRef } from "react";

let activeShifts = 0;
let storedTheme: "light" | "dark" | null = null;
let transitionTimer: number | null = null;
let applyFrame: number | null = null;
let revertTimer: number | null = null;
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
  if (applyFrame !== null) {
    cancelAnimationFrame(applyFrame);
  }
  applyFrame = window.requestAnimationFrame(() => {
    root.setAttribute("data-theme", theme);
    currentTheme = theme;
    applyFrame = null;
  });
};

const applyDarkMode = () => {
  const root = document.documentElement;
  if (!root) return;
  if (revertTimer !== null) {
    clearTimeout(revertTimer);
    revertTimer = null;
  }
  getStoredTheme();
  activeShifts += 1;
  applyTheme("dark");
};

const releaseDarkMode = () => {
  const root = document.documentElement;
  if (!root) return;
  activeShifts = Math.max(0, activeShifts - 1);
  if (activeShifts === 0) {
    if (applyFrame !== null) {
      cancelAnimationFrame(applyFrame);
      applyFrame = null;
    }
    if (revertTimer !== null) {
      clearTimeout(revertTimer);
    }
    const nextTheme = getStoredTheme();
    revertTimer = window.setTimeout(() => {
      applyTheme(nextTheme);
      const delay = 520;
      transitionTimer = window.setTimeout(() => {
        root.classList.remove("theme-transition");
        storedTheme = null;
        currentTheme = root.getAttribute("data-theme") as "light" | "dark" | null;
        transitionTimer = null;
      }, delay);
      revertTimer = null;
    }, 120);
  }
};

/**
 * Toggles the global dark theme while `active` is true.
 * Multiple callers are reference-counted, and the original theme is restored when all release.
 */
export function useDarkModeShift(enabled: boolean, active: boolean) {
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      if (appliedRef.current) {
        releaseDarkMode();
        appliedRef.current = false;
      }
      return;
    }

    if (active && !appliedRef.current) {
      applyDarkMode();
      appliedRef.current = true;
    } else if (!active && appliedRef.current) {
      releaseDarkMode();
      appliedRef.current = false;
    }

    return () => {
      if (appliedRef.current) {
        releaseDarkMode();
        appliedRef.current = false;
      }
    };
  }, [enabled, active]);
}
