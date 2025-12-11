"use client";

import { motion } from "framer-motion";
import type { CSSProperties, PropsWithChildren } from "react";
import { animationPresets, defaultAnimationPreset } from "./animationPresets";

export function AnimatedSection({
  children,
  index = 0,
  className,
  style,
  animated = true
}: PropsWithChildren<{ index?: number; className?: string; style?: CSSProperties; animated?: boolean }>) {
  const preset = animationPresets[defaultAnimationPreset];

  if (!animated) {
    return (
      <section className={`card${className ? ` ${className}` : ""}`} style={style}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      className={`card${className ? ` ${className}` : ""}`}
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
      <h2 style={{ margin: 0, fontSize: 32 }}>{title}</h2>
      {kicker ? (
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 16 }}>{kicker}</p>
      ) : null}
    </header>
  );
}

export function Pill({ children }: PropsWithChildren) {
  return (
    <span
      style={{
        padding: 0,
        borderRadius: 0,
        background: "transparent",
        border: "none",
        fontSize: 14,
        color: "var(--muted)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        fontWeight: 600
      }}
    >
      {children}
    </span>
  );
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
      <span style={{ color: "var(--muted)", fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
    </motion.div>
  );
}
