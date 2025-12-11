import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import "./admin.css";

export const metadata: Metadata = {
  title: "Studio Tak Admin",
  description: "Control panel for marketing pages built with Refine."
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
