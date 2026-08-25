// This is a self-contained canvas tool originally authored as JSX. Its
// drawing parameter objects are intentionally dynamic, so TypeScript should
// not infer a fixed schema for each generated pattern layer.
// @ts-nocheck

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getPublicMediaUploadMetadata } from "@/lib/clientImageUpload";
import { ensureFirebaseDevAuth, getFirebaseApp } from "@/lib/firebaseClient";

const W = 2400, H = 1260, CX = W / 2, CY = H / 2;
const BRAND_ORANGE = [255, 112, 11];
const FONT_TITLE = "'Rubik', sans-serif";
const FONT_MONO = "'Rubik Mono One', sans-serif";

// ── PRNG ─────────────────────────────────────────────────────
function hashSeed(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return h >>> 0; }
function mulberry32(seed) {
  let s = seed | 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rR = (rng, a, b) => a + rng() * (b - a);
const rI = (rng, a, b) => Math.floor(rR(rng, a, b + 1));
const rP = (rng, a) => a[Math.floor(rng() * a.length)];

// ── Color ────────────────────────────────────────────────────
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h, s, l = (mx + mn) / 2;
  if (mx === mn) h = s = 0; else { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6; else if (mx === g) h = ((b - r) / d + 2) / 6; else h = ((r - g) / d + 4) / 6; }
  return [h * 360, s * 100, l * 100];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return Math.round(255 * Math.max(0, Math.min(1, l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))).toString(16).padStart(2, "0"); };
  return `#${f(0)}${f(8)}${f(4)}`;
}
// Parse hex to {r,g,b}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function genPalette(rng, spread) {
  const [bH, bS, bL] = rgbToHsl(...BRAND_ORANGE);
  const dir = rng() > .5 ? 1 : -1, mode = rng();
  const c = [hslToHex(bH, bS, bL)];
  if (mode < .33) { for (let i = 1; i <= 4; i++) c.push(hslToHex(bH + dir * i * (15 + spread * 12), bS + (rng() - .5) * 20, bL + (rng() - .5) * 25)); }
  else if (mode < .66) { for (let i = 1; i <= 4; i++) { const d = i % 2 === 0 ? 1 : -1; c.push(hslToHex(bH + d * Math.ceil(i / 2) * (20 + spread * 15), bS + (rng() - .5) * 15, bL + rng() * 20 - 5)); } }
  else { c.push(hslToHex(bH - 15, bS, bL + 10)); c.push(hslToHex(bH + 180 + (rng() - .5) * spread * 40, bS * .7, bL * .8)); c.push(hslToHex(bH + 160 + (rng() - .5) * spread * 30, bS * .5, bL + 15)); c.push(hslToHex(bH + 30, bS * .9, bL + 20)); }
  return c;
}

// ── Gradient builder ─────────────────────────────────────────
// Creates a canvas gradient from color1 → color2 based on layer position
function makeGradient(ctx, color, colors, gradAngle, ox, oy, radius) {
  const a = (gradAngle || 0) * Math.PI / 180;
  const dx = Math.cos(a) * radius, dy = Math.sin(a) * radius;
  const g = ctx.createLinearGradient(ox - dx, oy - dy, ox + dx, oy + dy);
  const { r, g: gr, b } = hexToRgb(color);
  // Fade from full color to transparent
  g.addColorStop(0, `rgba(${r},${gr},${b},1)`);
  g.addColorStop(0.5, `rgba(${r},${gr},${b},0.7)`);
  g.addColorStop(1, `rgba(${r},${gr},${b},0.15)`);
  return g;
}

// ── Drawing: pattern primitives with gradient support ─────────
function drawGuilloche(ctx, { R, r, p, ox, oy, lw, color, opacity, rotation, density, thickness, gradAngle, colors }) {
  const steps = Math.round(4000 * Math.max(.5, density)), rev = Math.abs(Math.round(R / r));
  ctx.save(); ctx.translate(ox, oy); ctx.rotate(rotation * Math.PI / 180); ctx.translate(-ox, -oy);
  ctx.beginPath();
  const grad = makeGradient(ctx, color, colors, gradAngle, ox, oy, R);
  ctx.strokeStyle = grad;
  ctx.lineWidth = (lw * thickness) / Math.sqrt(density); ctx.globalAlpha = opacity;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * rev;
    const x = ox + (R - r) * Math.cos(t) + p * Math.cos(((R - r) / r) * t);
    const y = oy + (R - r) * Math.sin(t) + p * Math.sin(((R - r) / r) * t);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.restore();
}

function drawMoire(ctx, { ox, oy, count, spacing, angle, lw, color, opacity, length, density, thickness, gradAngle, colors }) {
  const n = Math.round(count * density), sp = spacing / density;
  ctx.save(); ctx.translate(ox, oy); ctx.rotate(angle * Math.PI / 180);
  const grad = makeGradient(ctx, color, colors, (gradAngle || 0) - angle, 0, 0, length / 2);
  ctx.strokeStyle = grad;
  ctx.lineWidth = (lw * thickness) / Math.sqrt(density); ctx.globalAlpha = opacity;
  const half = (n * sp) / 2;
  for (let i = 0; i < n; i++) { const off = i * sp - half; ctx.beginPath(); ctx.moveTo(-length / 2, off); ctx.lineTo(length / 2, off); ctx.stroke(); }
  ctx.restore();
}

function drawRings(ctx, { ox, oy, count, spacing, lw, color, opacity, startR, density, thickness, gradAngle, colors }) {
  const n = Math.round(count * density), sp = spacing / density;
  ctx.save();
  const maxR = startR + n * sp;
  const grad = makeGradient(ctx, color, colors, gradAngle, ox, oy, maxR);
  ctx.strokeStyle = grad;
  ctx.lineWidth = (lw * thickness) / Math.sqrt(density); ctx.globalAlpha = opacity;
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(ox, oy, startR + i * sp, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

function drawWaves(ctx, { ox, oy, count, amp, freq, phase, lw, color, opacity, width, spacing, density, thickness, gradAngle, colors }) {
  const n = Math.round(count * density), sp = spacing / density;
  ctx.save();
  const grad = makeGradient(ctx, color, colors, gradAngle, ox, oy, width / 2);
  ctx.strokeStyle = grad;
  ctx.lineWidth = (lw * thickness) / Math.sqrt(density); ctx.globalAlpha = opacity;
  for (let w = 0; w < n; w++) {
    const yOff = oy + (w - n / 2) * sp; ctx.beginPath();
    for (let x = 0; x <= width; x += 2) {
      const px = ox - width / 2 + x, py = yOff + Math.sin((x / width) * freq * Math.PI * 2 + phase + w * .3) * amp;
      x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ── Drawing: currency texture elements ───────────────────────

// Border frame
function drawBorderFrame(ctx, { inset, rings, spacing, lw, color, opacity, thickness, cornerSize }) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw * thickness; ctx.globalAlpha = opacity;
  for (let i = 0; i < rings; i++) {
    const d = inset + i * spacing; ctx.beginPath();
    ctx.roundRect(d, d, W - d * 2, H - d * 2, cornerSize || 0); ctx.stroke();
  }
  ctx.restore();
}

// Corner ornament
function drawCornerOrnaments(ctx, { size, lw, color, opacity, thickness, density }) {
  const corners = [[0, 0, 0], [W, 0, Math.PI / 2], [W, H, Math.PI], [0, H, Math.PI * 1.5]];
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw * thickness; ctx.globalAlpha = opacity;
  for (const [cx, cy, rot] of corners) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const n = Math.round(12 * density);
    for (let i = 1; i <= n; i++) { const r = (i / n) * size; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI / 2); ctx.stroke(); }
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}

// Step-and-repeat micro icons (tiny, barely visible)
function drawMicroIcons(ctx, { icon, spacing, size, angle, lw, color, opacity, thickness }) {
  ctx.save();
  ctx.translate(CX, CY); ctx.rotate(angle * Math.PI / 180); ctx.translate(-CX, -CY);
  ctx.strokeStyle = color; ctx.lineWidth = lw * thickness; ctx.globalAlpha = opacity;

  const cols = Math.ceil(W / spacing) + 4, rows = Math.ceil(H / spacing) + 4;
  const offX = -spacing * 2, offY = -spacing * 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offX + c * spacing + (r % 2 === 0 ? 0 : spacing / 2);
      const y = offY + r * spacing;
      ctx.save(); ctx.translate(x, y);
      const s = size;

      if (icon === "flame") {
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.bezierCurveTo(-s * .3, -s * .5, -s * .55, s * .1, -s * .45, s * .4);
        ctx.bezierCurveTo(-s * .3, s * .7, 0, s * .9, 0, s * .9);
        ctx.bezierCurveTo(0, s * .9, s * .3, s * .7, s * .45, s * .4);
        ctx.bezierCurveTo(s * .55, s * .1, s * .3, -s * .5, 0, -s);
        ctx.stroke();
      } else if (icon === "target") {
        ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, s * .5, 0, Math.PI * 2); ctx.stroke();
      } else if (icon === "diamond") {
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .6, 0); ctx.lineTo(0, s); ctx.lineTo(-s * .6, 0); ctx.closePath(); ctx.stroke();
      } else if (icon === "star") {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a1 = (i * 72 - 90) * Math.PI / 180, a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
          ctx.lineTo(Math.cos(a1) * s, Math.sin(a1) * s);
          ctx.lineTo(Math.cos(a2) * s * .4, Math.sin(a2) * s * .4);
        }
        ctx.closePath(); ctx.stroke();
      } else if (icon === "hex") {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; i === 0 ? ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s) : ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); }
        ctx.closePath(); ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

// Step-and-repeat text pattern
function drawTextRepeat(ctx, { text, fontSize, spacing, angle, color, opacity, font }) {
  ctx.save();
  ctx.translate(CX, CY); ctx.rotate(angle * Math.PI / 180); ctx.translate(-CX, -CY);
  ctx.fillStyle = color; ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px ${font || FONT_MONO}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  const cols = Math.ceil(W / spacing.x) + 4, rows = Math.ceil(H / spacing.y) + 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -spacing.x * 2 + c * spacing.x + (r % 2 === 0 ? 0 : spacing.x / 2);
      const y = -spacing.y * 2 + r * spacing.y;
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

// Title text that flows along a path (ghosted, part of the pattern)
function drawFlowingTitle(ctx, { text, ox, oy, radius, startAngle, fontSize, color, opacity, font }) {
  if (!text) return;
  ctx.save();
  ctx.fillStyle = color; ctx.globalAlpha = opacity;
  ctx.font = `700 ${fontSize}px ${font || FONT_TITLE}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  const chars = text.split("");
  const totalAngle = chars.length * (fontSize * 0.6) / radius;
  let currentAngle = startAngle - totalAngle / 2;

  for (const ch of chars) {
    const charAngle = (ctx.measureText(ch).width * 0.9) / radius;
    const x = ox + Math.cos(currentAngle) * radius;
    const y = oy + Math.sin(currentAngle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(currentAngle + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    currentAngle += charAngle;
  }
  ctx.restore();
}

// ── Composition generation ───────────────────────────────────
const PRIMES = [23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
const MICRO_ICONS = ["flame", "target", "diamond", "star", "hex"];

function generatePattern(seed, spread) {
  const rng = mulberry32(hashSeed(seed));
  const colors = genPalette(rng, spread);
  const [bH] = rgbToHsl(...BRAND_ORANGE);
  const bgDark = hslToHex(bH + (rng() - .5) * 30, 20 + rng() * 25, 3 + rng() * 5);
  const bgLight = hslToHex(bH + (rng() - .5) * 20, 5 + rng() * 10, 93 + rng() * 5);

  const comp = rng();
  const layers = [];
  const ornaments = [];

  // Each layer gets a gradient angle
  const gA = () => rR(rng, 0, 360);

  // ── Border frame (always) ──
  const fStyle = rng();
  if (fStyle < .5) {
    ornaments.push({ type: "border", inset: 32, rings: rI(rng, 2, 4), spacing: rR(rng, 6, 12), lw: rR(rng, 0.5, 1.0), colorIdx: 0, opacity: rR(rng, 0.2, 0.35), cornerSize: rR(rng, 0, 24) });
  } else {
    ornaments.push({ type: "border", inset: 24, rings: 2, spacing: 8, lw: rR(rng, 0.5, 0.8), colorIdx: 0, opacity: rR(rng, 0.15, 0.25), cornerSize: 0 });
    ornaments.push({ type: "border", inset: 56, rings: 1, spacing: 0, lw: rR(rng, 0.4, 0.7), colorIdx: 1, opacity: rR(rng, 0.12, 0.2), cornerSize: 0 });
  }
  ornaments.push({ type: "corners", size: rR(rng, 100, 200), lw: rR(rng, 0.5, 0.8), colorIdx: rI(rng, 0, 3), opacity: rR(rng, 0.12, 0.22) });

  // ── Step-and-repeat micro icons (1-2 layers, very subtle) ──
  const numIconLayers = rI(rng, 1, 2);
  for (let i = 0; i < numIconLayers; i++) {
    ornaments.push({
      type: "microIcons", icon: rP(rng, MICRO_ICONS),
      spacing: rR(rng, 100, 180), size: rR(rng, 8, 16),
      angle: rR(rng, -25, 25), lw: rR(rng, 0.5, 1.0),
      colorIdx: rI(rng, 0, 4), opacity: rR(rng, 0.04, 0.10),
    });
  }

  // ── Step-and-repeat text ──
  // studiotak.co
  ornaments.push({
    type: "textRepeat", text: "STUDIOTAK.CO",
    fontSize: rR(rng, 14, 22), spacing: { x: rR(rng, 240, 360), y: rR(rng, 60, 100) },
    angle: rR(rng, -15, 15), colorIdx: rI(rng, 0, 3), opacity: rR(rng, 0.04, 0.09),
    font: FONT_MONO,
  });
  // CAMPFIRE or other brand text
  if (rng() < 0.6) {
    ornaments.push({
      type: "textRepeat", text: "CAMPFIRE",
      fontSize: rR(rng, 10, 16), spacing: { x: rR(rng, 160, 260), y: rR(rng, 50, 80) },
      angle: rR(rng, -20, 20) + (rng() > .5 ? 0 : 90), colorIdx: rI(rng, 0, 3), opacity: rR(rng, 0.03, 0.07),
      font: FONT_MONO,
    });
  }

  // ── Flowing title (ghosted arc text, part of the pattern) ──
  ornaments.push({
    type: "flowTitle",
    radius: rR(rng, 400, 700), startAngle: rR(rng, -Math.PI, Math.PI),
    fontSize: rR(rng, 36, 60), colorIdx: rI(rng, 0, 2), opacity: rR(rng, 0.06, 0.14),
  });
  // Second arc at different radius
  if (rng() < 0.7) {
    ornaments.push({
      type: "flowTitle",
      radius: rR(rng, 300, 560), startAngle: rR(rng, -Math.PI, Math.PI),
      fontSize: rR(rng, 28, 44), colorIdx: rI(rng, 1, 3), opacity: rR(rng, 0.04, 0.10),
    });
  }

  // ── Flowing studiotak.co arc ──
  ornaments.push({
    type: "flowUrl",
    radius: rR(rng, 360, 640), startAngle: rR(rng, -Math.PI, Math.PI),
    fontSize: rR(rng, 20, 32), colorIdx: 0, opacity: rR(rng, 0.06, 0.12),
  });

  // ── Pattern layers (composition-based, all values at 2x canvas) ──
  if (comp < 0.3) {
    // CENTERED
    const fX = CX, fY = CY, heroR = rR(rng, 480, 680);
    layers.push({ type: "guilloche", role: "hero", R: heroR, r: rP(rng, PRIMES), p: rR(rng, 160, 320), lw: rR(rng, 0.7, 1.2), colorIdx: 0, opacity: rR(rng, 0.5, 0.7), rotation: rR(rng, 0, 360), ox: fX, oy: fY, gradAngle: gA() });
    layers.push({ type: "guilloche", role: "support", R: heroR * rR(rng, 0.6, 0.85), r: rP(rng, PRIMES), p: rR(rng, 100, 240), lw: rR(rng, 0.4, 0.8), colorIdx: 1, opacity: rR(rng, 0.25, 0.4), rotation: rR(rng, 0, 360), ox: fX, oy: fY, gradAngle: gA() });
    layers.push({ type: "rings", role: "structure", count: rI(rng, 30, 60), spacing: rR(rng, 10, 20), lw: rR(rng, 0.3, 0.6), colorIdx: 2, opacity: rR(rng, 0.12, 0.22), startR: rR(rng, 20, 80), ox: fX, oy: fY, gradAngle: gA() });
    const mA = rR(rng, 20, 70);
    layers.push({ type: "moire", role: "texture", count: rI(rng, 60, 120), spacing: rR(rng, 8, 16), angle: mA, lw: rR(rng, 0.2, 0.4), colorIdx: 3, opacity: rR(rng, 0.08, 0.16), length: 3200, ox: CX, oy: CY, gradAngle: gA() });
    layers.push({ type: "moire", role: "texture", count: rI(rng, 60, 120), spacing: rR(rng, 8, 16), angle: mA + rR(rng, 30, 60), lw: rR(rng, 0.2, 0.4), colorIdx: 0, opacity: rR(rng, 0.06, 0.12), length: 3200, ox: CX, oy: CY, gradAngle: gA() });

  } else if (comp < 0.6) {
    // OFFSET FOCAL
    const side = rng() > .5 ? 1 : -1;
    const fX = CX + side * rR(rng, 240, 440), fY = CY + rR(rng, -120, 120), heroR = rR(rng, 440, 640);
    layers.push({ type: "guilloche", role: "hero", R: heroR, r: rP(rng, PRIMES), p: rR(rng, 180, 320), lw: rR(rng, 0.7, 1.2), colorIdx: 0, opacity: rR(rng, 0.5, 0.65), rotation: rR(rng, 0, 360), ox: fX, oy: fY, gradAngle: gA() });
    layers.push({ type: "waves", role: "structure", count: rI(rng, 20, 40), amp: rR(rng, 40, 100), freq: rR(rng, 2, 5), phase: rR(rng, 0, Math.PI * 2), lw: rR(rng, 0.4, 0.7), colorIdx: 1, opacity: rR(rng, 0.15, 0.3), width: 3200, spacing: rR(rng, 20, 36), ox: CX, oy: fY, gradAngle: gA() });
    layers.push({ type: "guilloche", role: "support", R: heroR * rR(rng, 0.5, 0.7), r: rP(rng, PRIMES), p: rR(rng, 80, 200), lw: rR(rng, 0.4, 0.7), colorIdx: 2, opacity: rR(rng, 0.2, 0.35), rotation: rR(rng, 0, 360), ox: fX - side * rR(rng, 60, 160), oy: fY + rR(rng, -60, 60), gradAngle: gA() });
    layers.push({ type: "moire", role: "texture", count: rI(rng, 80, 140), spacing: rR(rng, 6, 12), angle: rR(rng, -20, 20), lw: rR(rng, 0.2, 0.4), colorIdx: 3, opacity: rR(rng, 0.06, 0.14), length: 3200, ox: CX, oy: CY, gradAngle: gA() });

  } else if (comp < 0.85) {
    // DUAL FOCAL
    const sp2 = rR(rng, 400, 760);
    const fX1 = CX - sp2 / 2, fX2 = CX + sp2 / 2, fY1 = CY + rR(rng, -80, 80), fY2 = CY + rR(rng, -80, 80);
    layers.push({ type: "guilloche", role: "hero", R: rR(rng, 400, 560), r: rP(rng, PRIMES), p: rR(rng, 140, 280), lw: rR(rng, 0.6, 1.0), colorIdx: 0, opacity: rR(rng, 0.45, 0.6), rotation: rR(rng, 0, 360), ox: fX1, oy: fY1, gradAngle: gA() });
    layers.push({ type: "guilloche", role: "hero", R: rR(rng, 400, 560), r: rP(rng, PRIMES), p: rR(rng, 140, 280), lw: rR(rng, 0.6, 1.0), colorIdx: 1, opacity: rR(rng, 0.4, 0.55), rotation: rR(rng, 0, 360), ox: fX2, oy: fY2, gradAngle: gA() });
    layers.push({ type: "rings", role: "structure", count: rI(rng, 35, 55), spacing: rR(rng, 12, 24), lw: rR(rng, 0.2, 0.5), colorIdx: 2, opacity: rR(rng, 0.1, 0.2), startR: rR(rng, 40, 100), ox: CX, oy: (fY1 + fY2) / 2, gradAngle: gA() });
    const a = rR(rng, 30, 60);
    layers.push({ type: "moire", role: "texture", count: rI(rng, 70, 110), spacing: rR(rng, 8, 14), angle: a, lw: rR(rng, 0.2, 0.4), colorIdx: 3, opacity: rR(rng, 0.07, 0.13), length: 3200, ox: CX, oy: CY, gradAngle: gA() });
    layers.push({ type: "moire", role: "texture", count: rI(rng, 70, 110), spacing: rR(rng, 8, 14), angle: -a, lw: rR(rng, 0.2, 0.4), colorIdx: 0, opacity: rR(rng, 0.05, 0.1), length: 3200, ox: CX, oy: CY, gradAngle: gA() });

  } else {
    // RADIAL BURST
    const fX = CX + rR(rng, -160, 160), fY = CY + rR(rng, -80, 80);
    layers.push({ type: "guilloche", role: "hero", R: rR(rng, 360, 520), r: rP(rng, PRIMES.slice(0, 6)), p: rR(rng, 200, 360), lw: rR(rng, 0.5, 1.0), colorIdx: 0, opacity: rR(rng, 0.5, 0.65), rotation: rR(rng, 0, 360), ox: fX, oy: fY, gradAngle: gA() });
    layers.push({ type: "rings", role: "structure", count: rI(rng, 50, 80), spacing: rR(rng, 8, 14), lw: rR(rng, 0.2, 0.4), colorIdx: 1, opacity: rR(rng, 0.12, 0.22), startR: 16, ox: fX, oy: fY, gradAngle: gA() });
    layers.push({ type: "waves", role: "structure", count: rI(rng, 25, 45), amp: rR(rng, 60, 120), freq: rR(rng, 3, 7), phase: rR(rng, 0, Math.PI * 2), lw: rR(rng, 0.3, 0.6), colorIdx: 2, opacity: rR(rng, 0.15, 0.28), width: 3200, spacing: rR(rng, 16, 28), ox: fX, oy: fY, gradAngle: gA() });
    layers.push({ type: "guilloche", role: "support", R: rR(rng, 240, 360), r: rP(rng, PRIMES), p: rR(rng, 100, 200), lw: rR(rng, 0.3, 0.6), colorIdx: 3, opacity: rR(rng, 0.2, 0.35), rotation: rR(rng, 0, 360), ox: fX, oy: fY, gradAngle: gA() });
    layers.push({ type: "moire", role: "texture", count: rI(rng, 60, 100), spacing: rR(rng, 8, 16), angle: rR(rng, 0, 180), lw: rR(rng, 0.15, 0.35), colorIdx: 0, opacity: rR(rng, 0.05, 0.1), length: 3200, ox: CX, oy: CY, gradAngle: gA() });
  }

  const order = { texture: 0, structure: 1, support: 2, hero: 3 };
  layers.sort((a, b) => (order[a.role] || 0) - (order[b.role] || 0));
  return { bgDark, bgLight, colors, layers, ornaments };
}

// ── Render ────────────────────────────────────────────────────
function renderCanvas(canvas, pattern, density, thickness, darkMode, title, subtitle) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = darkMode ? pattern.bgDark : pattern.bgLight;
  ctx.fillRect(0, 0, W, H);

  // Pattern layers (with gradients)
  for (const l of pattern.layers) {
    const color = pattern.colors[l.colorIdx] || pattern.colors[0];
    const p = { ...l, color, density, thickness, colors: pattern.colors };
    if (l.type === "guilloche") drawGuilloche(ctx, p);
    else if (l.type === "moire") drawMoire(ctx, p);
    else if (l.type === "rings") drawRings(ctx, p);
    else if (l.type === "waves") drawWaves(ctx, p);
  }

  // Ornaments
  for (const o of pattern.ornaments) {
    const color = pattern.colors[o.colorIdx] || pattern.colors[0];
    if (o.type === "border") drawBorderFrame(ctx, { ...o, color, thickness });
    else if (o.type === "corners") drawCornerOrnaments(ctx, { ...o, color, thickness, density });
    else if (o.type === "microIcons") drawMicroIcons(ctx, { ...o, color, thickness });
    else if (o.type === "textRepeat") drawTextRepeat(ctx, { ...o, color });
    else if (o.type === "flowTitle" && title) {
      // Anchor flowing title to center of composition
      drawFlowingTitle(ctx, { ...o, text: title.toUpperCase(), ox: CX, oy: CY, color, font: FONT_TITLE });
    }
    else if (o.type === "flowUrl") {
      drawFlowingTitle(ctx, { ...o, text: "STUDIOTAK.CO", ox: CX, oy: CY, color, font: FONT_MONO });
    }
  }

  // Vignette
  if (darkMode) {
    const vg = ctx.createRadialGradient(CX, CY, 160, CX, CY, 1440);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  } else {
    const bgHex = pattern.bgLight;
    const { r: br, g: bg2, b: bb } = hexToRgb(bgHex);
    const vg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 1800);
    vg.addColorStop(0, `rgba(${br},${bg2},${bb},0)`);
    vg.addColorStop(0.3, `rgba(${br},${bg2},${bb},0)`);
    vg.addColorStop(0.55, `rgba(${br},${bg2},${bb},0.15)`);
    vg.addColorStop(0.75, `rgba(${br},${bg2},${bb},0.4)`);
    vg.addColorStop(0.9, `rgba(${br},${bg2},${bb},0.7)`);
    vg.addColorStop(1, `rgba(${br},${bg2},${bb},0.85)`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  // ── Main title text ──
  const textColor = darkMode ? "#ffffff" : "#111111";
  const shadowCol = darkMode ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
  const safeW = H;

  if (title) {
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = shadowCol; ctx.shadowBlur = darkMode ? 70 : 50; ctx.shadowOffsetY = darkMode ? 8 : 4;
    let fs = 104; const maxW = safeW - 160; const words = title.split(" ");
    const wrap = (sz) => { ctx.font = `700 ${sz}px ${FONT_TITLE}`; const lines = []; let cur = "";
      for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
      if (cur) lines.push(cur); return lines; };
    let lines = wrap(fs); while (lines.length > 4 && fs > 56) { fs -= 8; lines = wrap(fs); }
    const lh = fs * 1.2, totalH = lines.length * lh;
    const startY = CY - totalH / 2 + lh / 2 - (subtitle ? 40 : 0);

    if (!darkMode) {
      const { r: br, g: bg2, b: bb } = hexToRgb(pattern.bgLight);
      const tg = ctx.createRadialGradient(CX, CY - (subtitle ? 20 : 0), 0, CX, CY - (subtitle ? 20 : 0), 700);
      tg.addColorStop(0, `rgba(${br},${bg2},${bb},0.6)`);
      tg.addColorStop(0.6, `rgba(${br},${bg2},${bb},0.35)`);
      tg.addColorStop(1, `rgba(${br},${bg2},${bb},0)`);
      ctx.fillStyle = tg;
      ctx.fillRect(0, 0, W, H);
      ctx.shadowColor = "transparent";
    }

    ctx.fillStyle = textColor;
    lines.forEach((line, i) => ctx.fillText(line, CX, startY + i * lh));

    if (subtitle) {
      ctx.shadowBlur = darkMode ? 30 : 20;
      ctx.font = `400 28px ${FONT_MONO}`;
      ctx.fillStyle = pattern.colors[0]; ctx.globalAlpha = 0.9;
      ctx.letterSpacing = "4px";
      ctx.fillText(subtitle, CX, startY + totalH + 56);
    }
    ctx.restore();
  }

}

// ── Load fonts ───────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    if (document.getElementById("guilloche-fonts")) return;
    const link = document.createElement("link");
    link.id = "guilloche-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&family=Rubik+Mono+One&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ── Component ────────────────────────────────────────────────
export default function GuillocheHeroGenerator() {
  useFonts();
  const canvasRef = useRef(null);
  const [seed, setSeed] = useState("meta-ads-scaling");
  const [title, setTitle] = useState("How to Scale Meta Ads Without Burning Budget");
  const [subtitle, setSubtitle] = useState("STUDIO TAK");
  const [density, setDensity] = useState(1);
  const [thickness, setThickness] = useState(2.5);
  const [spread, setSpread] = useState(1);
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const pattern = useMemo(() => generatePattern(seed, spread), [seed, spread]);

  // Wait for fonts then render
  useEffect(() => {
    const check = () => {
      if (document.fonts && document.fonts.check(`700 20px ${FONT_TITLE}`)) {
        setFontsLoaded(true);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  }, []);

  useEffect(() => {
    renderCanvas(canvasRef.current, pattern, density, thickness, darkMode, title, subtitle);
  }, [pattern, title, subtitle, density, thickness, darkMode, fontsLoaded]);

  const randomize = () => { let s = ""; const c = "abcdefghijklmnopqrstuvwxyz0123456789"; for (let i = 0; i < 12; i++) s += c[Math.floor(Math.random() * c.length)]; setSeed(s); };
  const [exportUrl, setExportUrl] = useState(null);
  const [savingToMedia, setSavingToMedia] = useState(false);
  const [mediaMessage, setMediaMessage] = useState(null);

  const getPngFile = () =>
    new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error("The image is still loading. Try again in a moment."));
        return;
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not create the image file."));
          return;
        }
        const fileStem = (title || seed || "guilloche-hero")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60) || "guilloche-hero";
        resolve(new File([blob], `${fileStem}-${Date.now()}.png`, { type: "image/png" }));
      }, "image/png");
    });

  const handleExport = () => {
    const c = canvasRef.current; if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      // Try programmatic download
      const a = document.createElement("a");
      a.download = `hero-${seed}-${darkMode ? "dark" : "light"}-${Date.now()}.png`;
      a.href = url;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); }, 100);
    }, "image/png");
  };

  const handleSaveToMedia = async () => {
    setMediaMessage(null);
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setMediaMessage({ type: "error", text: "Firebase is not configured, so this image cannot be saved to the media library." });
      return;
    }

    try {
      setSavingToMedia(true);
      const file = await getPngFile();
      await ensureFirebaseDevAuth();
      const app = getFirebaseApp();
      const storageRef = ref(getStorage(app), `uploads/guilloche/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file, getPublicMediaUploadMetadata(file));
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(getFirestore(app), "media"), {
        name: file.name,
        url,
        industry: [],
        type: "Guilloché hero",
        alt: title ? `Guilloché hero: ${title}` : "Guilloché hero image",
        mediaType: "image",
        uploadedAt: serverTimestamp(),
        featured: false,
        status: "draft"
      });
      setMediaMessage({ type: "success", text: "Saved to Media as a draft." });
    } catch (error) {
      console.error("Failed to save guilloché image to media", error);
      setMediaMessage({ type: "error", text: error?.message || "Could not save this image to Media." });
    } finally {
      setSavingToMedia(false);
    }
  };

  const save = () => setHistory(p => [...p, { seed, density, thickness, spread, darkMode, title, subtitle, thumb: canvasRef.current?.toDataURL("image/png", 0.3) }]);
  const load = (s) => { setSeed(s.seed); setDensity(s.density); setThickness(s.thickness ?? 2.5); setSpread(s.spread); setDarkMode(s.darkMode ?? true); setTitle(s.title); setSubtitle(s.subtitle); };

  const accent = pattern.colors[0];
  const ui = darkMode;
  const uiBg = ui ? "#111" : "#f5f5f5", uiPanel = ui ? "#1a1a1a" : "#fff", uiBorder = ui ? "#222" : "#e0e0e0";
  const uiText = ui ? "#eee" : "#222", uiMuted = ui ? "#888" : "#777", uiDim = ui ? "#555" : "#aaa";
  const uiInputBg = ui ? "#111" : "#f9f9f9", uiInputBorder = ui ? "#333" : "#ddd", uiChip = ui ? "#222" : "#eee";

  const sS = { width: "100%", accentColor: accent, height: "4px", cursor: "pointer" };
  const lS = { fontSize: 12, color: uiMuted, display: "block", marginBottom: 4, fontFamily: FONT_TITLE };
  const iS = { width: "100%", background: uiInputBg, border: `1px solid ${uiInputBorder}`, borderRadius: 6, color: uiText, padding: "10px 12px", fontSize: 14, boxSizing: "border-box", fontFamily: FONT_TITLE };

  return (
    <div style={{ background: uiBg, minHeight: "100vh", color: uiText, fontFamily: FONT_TITLE }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-.02em" }}>Guilloché Hero Generator</h1>
            <span style={{ fontSize: 12, color: uiDim, background: uiChip, padding: "3px 8px", borderRadius: 4, fontFamily: FONT_MONO }}>v5</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: uiChip, color: uiMuted, border: `1px solid ${uiBorder}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_TITLE }}>
              <span style={{ fontSize: 16 }}>{darkMode ? "\u263E" : "\u2600"}</span>{darkMode ? "Dark" : "Light"}
            </button>
            <button onClick={save} style={{ background: uiChip, color: uiMuted, border: `1px solid ${uiBorder}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: FONT_TITLE }}>Save version</button>
            <button onClick={handleSaveToMedia} disabled={savingToMedia} style={{ background: uiChip, color: uiText, border: `1px solid ${uiBorder}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: savingToMedia ? "wait" : "pointer", fontFamily: FONT_TITLE, opacity: savingToMedia ? 0.65 : 1 }}>{savingToMedia ? "Saving…" : "Save to Media"}</button>
            <button onClick={handleExport} style={{ background: accent, color: "#000", border: "none", borderRadius: 6, padding: "6px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT_TITLE }}>Export 2400×1260</button>
          </div>
        </div>

        <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${uiBorder}`, marginBottom: exportUrl ? 8 : 20 }}>
          <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        {exportUrl && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <a
              href={exportUrl}
              download={`hero-${seed}-${darkMode ? "dark" : "light"}.png`}
              style={{ fontSize: 12, color: accent, fontFamily: FONT_MONO, textDecoration: "none", borderBottom: `1px solid ${accent}` }}
            >
              Download PNG (2400×1260)
            </a>
            <span style={{ fontSize: 11, color: uiDim }}>Click here or right-click → Save As</span>
            <button onClick={() => setExportUrl(null)} style={{ background: "none", border: "none", color: uiDim, fontSize: 14, cursor: "pointer", marginLeft: "auto" }}>&#x2715;</button>
          </div>
        )}
        {mediaMessage && (
          <div style={{ marginBottom: 16, fontSize: 12, color: mediaMessage.type === "error" ? "#dc2626" : accent, fontFamily: FONT_MONO }}>
            {mediaMessage.text}{mediaMessage.type === "success" ? <>{" "}<a href="/admin/media" style={{ color: "inherit" }}>Open Media</a></> : null}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: uiPanel, borderRadius: 8, padding: 20, border: `1px solid ${uiBorder}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: uiMuted, margin: "0 0 16px", fontFamily: FONT_MONO }}>Seed</h3>
            <label style={lS}>Pattern Seed</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Type anything..." style={{ ...iS, flex: 1 }} />
              <button onClick={randomize} style={{ background: uiChip, color: uiMuted, border: `1px solid ${uiBorder}`, borderRadius: 6, padding: "0 14px", fontSize: 18, cursor: "pointer", flexShrink: 0 }} title="Random">&#x21BB;</button>
            </div>
            <p style={{ fontSize: 11, color: uiDim, margin: "0 0 20px", lineHeight: 1.5 }}>Each seed creates a unique composition. Title text flows into the pattern.</p>
            <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: uiMuted, margin: "0 0 12px", fontFamily: FONT_MONO }}>Content</h3>
            <label style={lS}>Article Title</label>
            <textarea value={title} onChange={e => setTitle(e.target.value)} rows={3} style={{ ...iS, resize: "vertical", marginBottom: 12 }} />
            <label style={lS}>Subtitle</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} style={iS} />
          </div>

          <div style={{ background: uiPanel, borderRadius: 8, padding: 20, border: `1px solid ${uiBorder}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: uiMuted, margin: "0 0 16px", fontFamily: FONT_MONO }}>Pattern</h3>
            {[
              ["Density", density, setDensity, 0.3, 3, 0.05, 2],
              ["Line Thickness", thickness, setThickness, 0.2, 8, 0.1, 1],
              ["Color Spread", spread, setSpread, 0, 3, 0.05, 2],
            ].map(([label, val, set, min, max, step, dec]) => (
              <div key={label} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, color: uiMuted }}>{label}</label>
                  <span style={{ fontSize: 12, color: uiDim, fontFamily: FONT_MONO }}>{val.toFixed(dec)}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(Number(e.target.value))} style={sS} />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: uiMuted, display: "block", marginBottom: 8 }}>Palette</label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {pattern.colors.map((c, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <div style={{ width: i === 0 ? 40 : 32, height: i === 0 ? 40 : 32, borderRadius: 6, background: c, border: i === 0 ? `2px solid ${accent}` : `2px solid ${uiBorder}` }} />
                    {i === 0 && <span style={{ position: "absolute", bottom: -13, left: 0, right: 0, textAlign: "center", fontSize: 9, color: uiDim, fontFamily: FONT_MONO }}>anchor</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: uiMuted, display: "block", marginBottom: 8 }}>Layers ({pattern.layers.length})</label>
              <div style={{ fontSize: 11, lineHeight: 2, display: "flex", flexWrap: "wrap", gap: "4px 6px" }}>
                {pattern.layers.map((l, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: uiChip, padding: "2px 8px", borderRadius: 4, border: l.role === "hero" ? `1px solid ${accent}` : "1px solid transparent" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: pattern.colors[l.colorIdx], display: "inline-block" }} />
                    <span style={{ color: l.role === "hero" ? accent : uiMuted, fontSize: 10, fontFamily: FONT_MONO }}>{l.role}</span>
                    <span style={{ color: uiDim, fontSize: 10 }}>{l.type}</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: uiMuted, display: "block", marginBottom: 8 }}>Texture ({pattern.ornaments.length})</label>
              <div style={{ fontSize: 11, lineHeight: 2, display: "flex", flexWrap: "wrap", gap: "4px 6px" }}>
                {pattern.ornaments.map((o, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: uiChip, padding: "2px 8px", borderRadius: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: pattern.colors[o.colorIdx] || accent, display: "inline-block" }} />
                    <span style={{ color: uiMuted, fontSize: 10 }}>{o.type === "microIcons" ? o.icon : o.type === "textRepeat" ? o.text : o.type === "flowTitle" ? "title arc" : o.type === "flowUrl" ? "url arc" : o.type}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: uiMuted, margin: "0 0 12px", fontFamily: FONT_MONO }}>Saved</h3>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
              {history.map((s, i) => (
                <button key={i} onClick={() => load(s)} style={{ background: uiPanel, border: `1px solid ${uiBorder}`, borderRadius: 8, padding: 0, cursor: "pointer", flexShrink: 0, overflow: "hidden", width: 180, textAlign: "left", fontFamily: FONT_TITLE }}>
                  {s.thumb && <img src={s.thumb} alt="" style={{ width: 180, height: 94, objectFit: "cover", display: "block" }} />}
                  <div style={{ padding: "6px 10px" }}>
                    <div style={{ fontSize: 11, color: uiMuted, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.seed}</div>
                    <div style={{ fontSize: 10, color: uiDim, fontFamily: FONT_MONO }}>{s.darkMode ? "drk" : "lgt"} t:{s.thickness?.toFixed(1)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11, color: uiDim, marginTop: 16, textAlign: "right", fontFamily: FONT_MONO }}>2400×1260 (2x) · #FF700B · Rubik + Rubik Mono One · studiotak.co</p>
      </div>
    </div>
  );
}
