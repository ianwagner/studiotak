"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { AdFrameworkBlock } from "@/lib/admin/pages";

const frameworkAccents = [
  { color: "var(--ai-color)", soft: "var(--ai-color-15)" },
  { color: "var(--reject-color)", soft: "var(--reject-color-10)" },
  { color: "var(--accent-color)", soft: "var(--accent-color-10)" },
  { color: "var(--approve-color)", soft: "var(--approve-color-10)" }
];

export const AdFrameworkBlockSection = ({ block, index }: { block: AdFrameworkBlock; index: number }) => {
  const principles = block.principles?.filter(Boolean) ?? [];
  const items = block.items ?? [];

  return (
    <motion.section
      key={block.id ?? index}
      data-ad-framework-section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } }
      }}
      style={{
        width: "100%",
        maxWidth: "var(--max-width)",
        marginLeft: "auto",
        marginRight: "auto",
        padding: "clamp(56px, 8vh, 96px) var(--page-pad, 24px)"
      }}
    >
      <style>{`
        [data-ad-framework-section] {
          --framework-panel: var(--surface);
          --framework-outline: var(--border);
        }
        [data-ad-framework-heading] {
          display: grid;
          gap: 8px;
          justify-items: center;
          text-align: center;
        }
        [data-ad-framework-eyebrow] {
          color: var(--accent);
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: var(--eyebrow-letter-spacing);
          line-height: 1.2;
          text-transform: uppercase;
        }
        [data-ad-framework-heading] h2 {
          max-width: 22ch;
          margin: 0;
          color: var(--text);
          font-family: var(--font-secondary, Georgia, serif);
          font-size: var(--font-size-title-3xl);
          font-weight: 300;
          letter-spacing: 0;
          line-height: 1.06;
          text-transform: none;
        }
        [data-ad-framework-heading] p {
          max-width: 58ch;
          margin: 0;
          color: var(--muted);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: var(--font-size-body);
          text-transform: none;
        }
        [data-ad-framework-principles] {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
        }
        [data-ad-framework-principle] {
          padding: 6px 9px;
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--muted);
          background: color-mix(in srgb, var(--surface) 76%, transparent);
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1;
        }
        [data-ad-framework-grid] {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        [data-ad-framework-board] {
          padding: 14px;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-xl);
          background: color-mix(in srgb, var(--surface) 86%, var(--muted-surface));
          box-shadow: var(--shadow-sm);
        }
        [data-ad-framework-card] {
          position: relative;
          display: flex;
          min-height: 210px;
          flex-direction: column;
          padding: 16px;
          border: 1px solid color-mix(in srgb, var(--framework-accent) 36%, var(--framework-outline));
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--surface) 74%, var(--framework-accent-soft));
          box-shadow: var(--shadow-xs);
        }
        [data-ad-framework-card-top] {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        [data-ad-framework-label] {
          color: var(--framework-accent);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0;
        }
        [data-ad-framework-card] h3 {
          margin: 0;
          color: var(--text);
          font-family: var(--font-secondary, Georgia, serif);
          font-size: clamp(21px, 2vw, 27px);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.03em;
          text-transform: none !important;
        }
        [data-ad-framework-card] p {
          margin: 8px 0 0;
          color: var(--muted);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 13px;
          line-height: 1.45;
        }
        [data-ad-framework-examples] {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: auto;
          padding-top: 14px;
        }
        [data-ad-framework-example] {
          padding: 4px 6px;
          border: 1px solid color-mix(in srgb, var(--framework-accent) 24%, transparent);
          border-radius: var(--radius-sm);
          color: var(--framework-accent);
          background: var(--framework-accent-soft);
          font-family: var(--font-primary, system-ui, sans-serif);
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
        }
        @media (max-width: 960px) {
          [data-ad-framework-grid] {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          [data-ad-framework-board] {
            padding: 10px;
          }
          [data-ad-framework-card] {
            min-height: 196px;
          }
        }
        @media (max-width: 560px) {
          [data-ad-framework-grid] {
            grid-template-columns: 1fr;
          }
          [data-ad-framework-card] {
            min-height: 0;
          }
        }
      `}</style>

      <div className="grid" style={{ gap: 20 }}>
        <div className="grid" style={{ gap: 12, justifyItems: "center" }}>
          <header data-ad-framework-heading>
            {block.eyebrow ? <span data-ad-framework-eyebrow>{block.eyebrow}</span> : null}
            <h2>{block.heading ?? "A framework for ads that learn"}</h2>
            {block.body ? <p>{block.body}</p> : null}
          </header>
          {principles.length ? (
            <div data-ad-framework-principles>
              {principles.map((principle) => (
                <span key={principle} data-ad-framework-principle>
                  {principle}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div data-ad-framework-board>
          <div data-ad-framework-grid>
            {items.map((item, itemIndex) => (
              <motion.article
                key={`${item.title}-${itemIndex}`}
                data-ad-framework-card
                style={
                  {
                    "--framework-accent": frameworkAccents[itemIndex % frameworkAccents.length].color,
                    "--framework-accent-soft": frameworkAccents[itemIndex % frameworkAccents.length].soft
                  } as CSSProperties
                }
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
                }}
              >
                <div data-ad-framework-card-top>
                  <span data-ad-framework-label>{item.label}</span>
                </div>
                <h3>{item.title}</h3>
                {item.description ? <p>{item.description}</p> : null}
                {item.examples?.length ? (
                  <div data-ad-framework-examples>
                    {item.examples.map((example) => (
                      <span key={example} data-ad-framework-example>
                        {example}
                      </span>
                    ))}
                  </div>
                ) : null}
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};
