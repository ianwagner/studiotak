"use client";

import { useEffect, useRef } from "react";

type GhostArticleContentProps = {
  html: string;
};

/**
 * React intentionally leaves scripts inserted through `dangerouslySetInnerHTML`
 * inert. Replacing each one with a freshly created script lets trusted Ghost
 * embeds run after the article has mounted.
 */
export function GhostArticleContent({ html }: GhostArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.querySelectorAll("script").forEach((script) => {
      // Effects are invoked twice in development Strict Mode. Do not initialize
      // an embed again after its replacement script has already run.
      if (script.dataset.ghostScriptExecuted === "true") return;

      const executableScript = document.createElement("script");
      Array.from(script.attributes).forEach(({ name, value }) => {
        executableScript.setAttribute(name, value);
      });
      executableScript.dataset.ghostScriptExecuted = "true";
      executableScript.textContent = script.textContent;
      script.replaceWith(executableScript);
    });
  }, [html]);

  return <div ref={contentRef} className="ghost-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
