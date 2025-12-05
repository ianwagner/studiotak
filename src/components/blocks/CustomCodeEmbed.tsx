'use client';

import { useEffect, useRef } from "react";

type CustomCodeEmbedProps = {
  code?: string | null;
};

export function CustomCodeEmbed({ code }: CustomCodeEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (!code) {
      return;
    }

    container.innerHTML = code;

    const scripts = Array.from(container.querySelectorAll<HTMLScriptElement>("script"));

    scripts.forEach((script) => {
      const replacement = document.createElement("script");

      Array.from(script.attributes).forEach((attr) => {
        replacement.setAttribute(attr.name, attr.value);
      });

      if (script.src) {
        replacement.src = script.src;
      } else {
        replacement.text = script.textContent ?? "";
      }

      script.parentNode?.replaceChild(replacement, script);
    });

    return () => {
      container.innerHTML = "";
    };
  }, [code]);

  return <div ref={containerRef} className="h-full w-full" />;
}
