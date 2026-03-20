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

export const seedComponents: ComponentRecord[] = [
  {
    id: "L3NooCAAw9IW98SknUkX",
    kind: "feature",
    type: "Step",
    icon: {
      url: "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/component-icons%2F1765588131158-Frame%2013.webp?alt=media&token=3a37b229-5fd7-4eb9-8c6c-fccc107aa1e9",
      alt: "Frame 13.png",
      type: "image",
    },
    body: "We take care to work from your voice and visual language. Context stays with the work, round after round.",
    title: "Your brand, carried through",
  },
  {
    id: "O0RItZf6VrRu2c5sToOp",
    kind: "feature",
    title: "Launch and Learn",
    body: "Launch fast with export ready ads. Share performance insights so the Campfire team can refine what works and improve each round.",
    type: "Step",
    icon: {
      url: "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/component-icons%2F1765588179599-Frame%2015.webp?alt=media&token=073b8767-4392-41e1-b352-9bad15417d14",
      alt: "Frame 15.png",
      type: "image",
    },
  },
  {
    id: "feature-design-systems",
    kind: "feature",
    type: "Feature",
    mediaFit: "cover",
    icon: {
      alt: "Design systems icon",
      type: "image",
      url: "https://via.placeholder.com/64x64?text=DS",
    },
    industry: "SaaS",
    body: "Token-driven systems with responsive, animated components.",
    title: "Design systems",
  },
  {
    id: "feature-launch",
    kind: "feature",
    type: "Feature",
    mediaFit: "cover",
    icon: {
      alt: "Launch icon",
      type: "image",
      url: "https://via.placeholder.com/64x64?text=GO",
    },
    industry: "Growth",
    body: "CMS schemas, QA scripts, and rollout playbooks for marketing.",
    title: "Launch ops",
  },
  {
    id: "feature-motion",
    kind: "feature",
    type: "Feature",
    mediaFit: "cover",
    icon: {
      alt: "Motion icon",
      type: "image",
      url: "https://via.placeholder.com/64x64?text=FX",
    },
    industry: "Product",
    body: "Choreographed interactions tested in the browser early.",
    title: "Motion-led UX",
  },
  {
    id: "p3OufBybGhJfiLa9q73K",
    kind: "feature",
    title: "Review and Approve Creative",
    body: "Review your ads inside Campfire\u2019s streamlined approval system. Leave comments, request edits, and approve creative in one place so nothing slows down your momentum.",
    type: "Step",
    icon: {
      url: "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/component-icons%2F1765588148514-Frame%2014.webp?alt=media&token=37767185-8bcb-475c-bcb1-17ac199e10df",
      alt: "Frame 14.png",
      type: "image",
    },
  },
  {
    id: "pNO61TjszP44YMwzkwP3",
    kind: "feature",
    type: "Step",
    mediaFit: "contain",
    icon: {
      url: "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/component-icons%2F1765587517229-Frame%2012.webp?alt=media&token=cc1a2b2c-7e05-46bf-b185-eb784c93cb76",
      alt: "Frame 12.png",
      type: "image",
    },
    body: "We begin in Campfire with everything in one place. Direction, assets, and notes, so getting started feels easy.",
    title: "A simple start",
  }
];

