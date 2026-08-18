"use client";

import { motion } from "framer-motion";
import type { SlackIntegrationBlock } from "@/lib/admin/pages";

const SlackLogo = ({ size = 48, title }: { size?: number; title?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 127 127"
    xmlns="http://www.w3.org/2000/svg"
    role={title ? "img" : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A" />
    <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0" />
    <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D" />
    <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E" />
  </svg>
);

export const SlackIntegrationBlockSection = ({ block, index }: { block: SlackIntegrationBlock; index: number }) => (
  <motion.section
    key={block.id ?? index}
    data-slack-integration-section
    data-slack-integration-theme={block.enableDarkModeOnScroll ? "dark" : undefined}
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.18 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <style>{`
      [data-slack-integration-section] {
        width: 100%;
        max-width: var(--max-width);
        margin: 0 auto;
        padding: clamp(24px, 4vw, 48px) var(--section-px);
      }
      [data-slack-integration-content] {
        display: grid;
        justify-items: center;
        gap: 8px;
        box-sizing: border-box;
        width: 100%;
        max-width: 920px;
        margin: 0 auto;
        padding: clamp(28px, 5vw, 52px);
        border: 1px solid var(--border-color-default);
        border-radius: 24px;
        background: var(--surface-card);
        box-shadow: 0 18px 46px rgba(27, 24, 23, .08);
        text-align: center;
      }
      [data-slack-integration-content] h2 {
        max-width: 22ch;
        margin: 0;
        color: var(--text);
        font-family: var(--font-secondary);
        font-size: var(--font-size-title-3xl);
        font-style: normal;
        font-weight: 300;
        letter-spacing: 0;
        line-height: 1.06;
        text-transform: none;
      }
      [data-slack-integration-content] p {
        max-width: 58ch;
        margin: 0;
        color: var(--muted);
        font-size: var(--font-size-body);
        line-height: 1.55;
        text-transform: none;
      }
      [data-slack-integration-mark] {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        margin-bottom: 4px;
      }
      [data-slack-integration-mark] svg {
        display: block;
      }
      [data-slack-integration-section][data-slack-integration-theme="dark"] [data-slack-integration-content] {
        border-color: rgba(255, 255, 255, .14);
        background: #121218;
        box-shadow: 0 18px 46px rgba(0, 0, 0, .32);
      }
      [data-slack-integration-section][data-slack-integration-theme="dark"] [data-slack-integration-content] h2 {
        color: #f6f6f1;
      }
      [data-slack-integration-section][data-slack-integration-theme="dark"] [data-slack-integration-content] p {
        color: #b3b3c2;
      }
      :root[data-theme="dark"] [data-slack-integration-content] {
        box-shadow: 0 18px 46px rgba(0, 0, 0, .32);
      }
    `}</style>
    <div data-slack-integration-content>
      <div data-slack-integration-mark>
        <SlackLogo title="Slack" size={40} />
      </div>
      {block.eyebrow ? <span className="tag">{block.eyebrow}</span> : null}
      <h2>{block.heading}</h2>
      <p>{block.body}</p>
    </div>
  </motion.section>
);
