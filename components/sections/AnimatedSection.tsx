"use client";

import { motion } from "framer-motion";
import type { CSSProperties, PropsWithChildren } from "react";
import { animationPresets, defaultAnimationPreset } from "./animationPresets";

export function AnimatedSection({
  children,
  index = 0,
  className,
  style,
  animated = true,
  variant = "card"
}: PropsWithChildren<{
  index?: number;
  className?: string;
  style?: CSSProperties;
  animated?: boolean;
  variant?: "card" | "plain";
}>) {
  const preset = animationPresets[defaultAnimationPreset];
  const baseClass = variant === "card" ? "card" : "";
  const composedClassName = [baseClass, className].filter(Boolean).join(" ");

  if (!animated) {
    return (
      <section className={composedClassName} style={style}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      className={composedClassName}
      style={style}
      variants={preset.item}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={index}
    >
      {children}
    </motion.section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  kicker,
  align = "left"
}: {
  eyebrow?: string;
  title: string;
  kicker?: string;
  align?: "left" | "center";
}) {
  return (
    <header
      style={{
        display: "grid",
        gap: 8,
        textAlign: align,
        justifyItems: align === "center" ? "center" : "start"
      }}
    >
      {eyebrow ? <span className="tag">{eyebrow}</span> : null}
      <h2
        style={{
          margin: 0,
          maxWidth: "22ch",
          fontFamily: "var(--font-secondary)",
          fontSize: "var(--font-size-title-3xl)",
          fontStyle: "normal",
          fontWeight: 300,
          letterSpacing: 0,
          lineHeight: 0.95,
          textTransform: "none"
        }}
      >
        {title}
      </h2>
      {kicker ? (
        <p style={{ margin: 0, maxWidth: "58ch", color: "var(--muted)", fontSize: "var(--font-size-body)" }}>{kicker}</p>
      ) : null}
    </header>
  );
}

export function Pill({ children }: PropsWithChildren) {
  return <span className="tag">{children}</span>;
}

export function Stat({ label, value }: { label: string; value: string }) {
  const preset = animationPresets[defaultAnimationPreset];

  return (
    <motion.div
      variants={preset.item}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={Math.random() * 2}
      style={{
        padding: "16px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        display: "grid",
        gap: 8
      }}
    >
      <span style={{ color: "var(--muted)", fontSize: "var(--font-size-label)" }}>{label}</span>
      <span style={{ fontSize: "var(--font-size-title-md)", fontWeight: 700 }}>{value}</span>
    </motion.div>
  );
}
