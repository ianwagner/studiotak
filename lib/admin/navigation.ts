import type { Timestamp } from "firebase/firestore";

export type NavigationItemRecord = {
  id: string;
  label: string;
  href: string;
  order: number;
  isExternal?: boolean;
  showInHeader?: boolean;
  showInFooter?: boolean;
  footerSection?: string;
  parentId?: string;
  icon?: string;
  updatedAt?: string;
};

export const seedNavigation: NavigationItemRecord[] = [
  {
    id: "nav-capabilities",
    label: "Capabilities",
    href: "#capabilities",
    order: 1,
    isExternal: false,
    showInHeader: true,
    showInFooter: true,
    footerSection: "Services",
    parentId: "",
    icon: "",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "nav-process",
    label: "Process",
    href: "#process",
    order: 2,
    isExternal: false,
    showInHeader: true,
    showInFooter: false,
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "nav-contact",
    label: "Contact",
    href: "#contact",
    order: 3,
    isExternal: false,
    showInHeader: true,
    showInFooter: true,
    footerSection: "Connect",
    parentId: "",
    icon: "",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "nav-campfire",
    label: "Campfire",
    href: "/campfire",
    order: 4,
    isExternal: false,
    showInHeader: false,
    showInFooter: true,
    footerSection: "Campfire",
    parentId: "",
    icon: "",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "nav-campfire-brands",
    label: "Brands",
    href: "/campfire/brands",
    order: 5,
    isExternal: false,
    showInHeader: false,
    showInFooter: true,
    footerSection: "Campfire",
    parentId: "nav-campfire",
    icon: "",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "nav-campfire-growth",
    label: "Growth Teams",
    href: "/campfire/growth",
    order: 6,
    isExternal: false,
    showInHeader: false,
    showInFooter: true,
    footerSection: "Campfire",
    parentId: "nav-campfire",
    icon: "",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "nav-campfire-agencies",
    label: "Agencies",
    href: "/campfire/agencies",
    order: 7,
    isExternal: false,
    showInHeader: false,
    showInFooter: true,
    footerSection: "Campfire",
    parentId: "nav-campfire",
    icon: "",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
];

const toDateString = (value: string | Timestamp | undefined): string | undefined => {
  if (!value) return value;
  // Firebase Timestamps have a toDate() helper.
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return value as string;
};

export const normalizeNavigationShape = (item: any): NavigationItemRecord => {
  if (!item) return item;
  const orderValue = Number(item.order);
  return {
    id: item.id,
    label: item.label ?? "",
    href: item.href ?? "#",
    order: Number.isFinite(orderValue) ? orderValue : 0,
    isExternal: Boolean(item.isExternal),
    showInHeader: item.showInHeader ?? true,
    showInFooter: Boolean(item.showInFooter),
    footerSection: item.footerSection ?? "",
    parentId: item.parentId ?? "",
    icon: item.icon ?? "",
    updatedAt: toDateString(item.updatedAt)
  };
};
