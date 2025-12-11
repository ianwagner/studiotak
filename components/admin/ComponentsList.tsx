"use client";

import { useList } from "@refinedev/core";
import Link from "next/link";
import type { ComponentRecord } from "@/lib/admin/components";

export function ComponentsList() {
  const { data, isLoading } = useList<ComponentRecord>({ resource: "components" });
  const components = data?.data ?? [];

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Components</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Reusable feature components with icon, copy, and tags for use inside blocks.
          </p>
        </div>
        <Link className="btn" href="/admin/components/new">
          + New component
        </Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Industry</th>
              <th>Type</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ padding: 18, textAlign: "center" }}>
                  Loading components…
                </td>
              </tr>
            )}
            {!isLoading &&
              components.map((component) => (
                <tr key={component.id}>
                  <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {component.icon?.url ? (
                      <img
                        src={component.icon.url}
                        alt={component.icon.alt ?? ""}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.04)"
                        }}
                      />
                    )}
                    {component.title}
                  </td>
                  <td>{component.industry || "—"}</td>
                  <td>{component.type || "—"}</td>
                  <td style={{ color: "var(--muted)" }}>
                    {component.updatedAt
                      ? new Date(component.updatedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <Link className="btn secondary" href={`/admin/components/${component.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
