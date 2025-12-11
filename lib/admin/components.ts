import type { BlockMedia } from "./pages";

export type ComponentKind = "feature";

export type ComponentRecord = {
  id: string;
  kind: ComponentKind;
  title: string;
  body: string;
  icon?: BlockMedia;
  industry?: string;
  type?: string;
  mediaFit?: "cover" | "contain";
  updatedAt?: string;
};

export const seedComponents: ComponentRecord[] = [
  {
    id: "feature-design-systems",
    kind: "feature",
    title: "Design systems",
    body: "Token-driven systems with responsive, animated components.",
    industry: "SaaS",
    type: "Feature",
    icon: { url: "https://via.placeholder.com/64x64?text=DS", alt: "Design systems icon" },
    mediaFit: "cover",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "feature-motion",
    kind: "feature",
    title: "Motion-led UX",
    body: "Choreographed interactions tested in the browser early.",
    industry: "Product",
    type: "Feature",
    icon: { url: "https://via.placeholder.com/64x64?text=FX", alt: "Motion icon" },
    mediaFit: "cover",
    updatedAt: "2024-01-02T00:00:00.000Z"
  },
  {
    id: "feature-launch",
    kind: "feature",
    title: "Launch ops",
    body: "CMS schemas, QA scripts, and rollout playbooks for marketing.",
    industry: "Growth",
    type: "Feature",
    icon: { url: "https://via.placeholder.com/64x64?text=GO", alt: "Launch icon" },
    mediaFit: "cover",
    updatedAt: "2024-01-03T00:00:00.000Z"
  }
];

export const normalizeComponentShape = (component: any): ComponentRecord => {
  if (!component) return component;
  const updatedAt =
    component.updatedAt && typeof component.updatedAt.toDate === "function"
      ? component.updatedAt.toDate().toISOString()
      : component.updatedAt;
  const { id, kind, title, body, icon, industry, type } = component;
  return {
    id,
    kind: (kind as ComponentKind) ?? "feature",
    title,
    body,
    icon,
    industry,
    type,
    updatedAt
  };
};
