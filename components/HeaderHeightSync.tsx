"use client";

import { useLayoutEffect } from "react";

export function HeaderHeightSync() {
  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;

    const syncHeight = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height > 0) document.documentElement.style.setProperty("--header-height", `${height}px`);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  return null;
}
