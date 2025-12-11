"use client";

import { useDelete, useList } from "@refinedev/core";
import Link from "next/link";
import type { PageRecord } from "@/lib/admin/pages";

export function PagesList() {
  const { data, isLoading } = useList<PageRecord>({ resource: "pages" });
  const { mutateAsync: deleteAsync, isLoading: isDeleting } = useDelete<PageRecord>();
  const pages = data?.data ?? [];

  const getPrimaryHeroTitle = (page: PageRecord) =>
    (page.blocks ?? []).find((block) => block.type === "hero" || block.type === "thirds")?.title ?? "—";

  const handleDelete = async (page: PageRecord) => {
    const confirmed = window.confirm(`Delete "${page.title}" permanently? This cannot be undone.`);
    if (!confirmed) return;
    await deleteAsync({ resource: "pages", id: page.id });
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Pages</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>Manage page slugs, block order, and CTA targets.</p>
        </div>
        <Link className="btn" href="/admin/pages/new">
          + New page
        </Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Primary block</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ padding: 18, textAlign: "center" }}>
                  Loading pages…
                </td>
              </tr>
            )}
            {!isLoading &&
              pages.map((page) => (
                <tr key={page.id}>
                  <td>{page.title}</td>
                  <td><code>{page.slug}</code></td>
                  <td>
                    <span className={`badge ${page.status === "draft" ? "draft" : ""}`}>
                      {page.status === "draft" ? "Draft" : "Published"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{getPrimaryHeroTitle(page)}</td>
                  <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link className="btn secondary" href={`/admin/pages/${page.id}`}>
                      Edit
                    </Link>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => handleDelete(page)}
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
