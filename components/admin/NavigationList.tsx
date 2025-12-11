"use client";

import { useDelete, useList, useUpdate } from "@refinedev/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavigationItemRecord } from "@/lib/admin/navigation";

export function NavigationList() {
  const { data, isLoading } = useList<NavigationItemRecord>({ resource: "navigation" });
  const { mutateAsync: updateAsync, isLoading: isUpdating } = useUpdate<NavigationItemRecord>();
  const { mutateAsync: deleteAsync, isLoading: isDeleting } = useDelete<NavigationItemRecord>();
  const [footerSectionsList, setFooterSectionsList] = useState<string[]>([]);
  const [sectionSelections, setSectionSelections] = useState<Record<string, string>>({});
  const links = data?.data ?? [];
  const headerLinks = links.filter((link) => link.showInHeader !== false);
  const footerLinks = links.filter((link) => link.showInFooter);
  const footerSections = footerLinks.reduce<Record<string, NavigationItemRecord[]>>((acc, link) => {
    const sectionName = link.footerSection?.trim() || "Links";
    acc[sectionName] = acc[sectionName] ? [...acc[sectionName], link] : [link];
    return acc;
  }, {});
  const availableForHeader = links.filter((link) => link.showInHeader === false);
  const availableForFooter = links.filter((link) => !link.showInFooter);

  useEffect(() => {
    const keys = Object.keys(footerSections);
    setFooterSectionsList((prev) => {
      const merged = [...prev];
      keys.forEach((key) => {
        if (!merged.includes(key)) merged.push(key);
      });
      return merged;
    });
  }, [links]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLink = async (link: NavigationItemRecord, values: Partial<NavigationItemRecord>) => {
    const { id, updatedAt: _ignore, ...rest } = link;
    await updateAsync({
      resource: "navigation",
      id,
      values: { ...rest, ...values, updatedAt: new Date().toISOString() }
    });
  };

  const handleAddToHeader = async (link: NavigationItemRecord) => {
    await updateLink(link, { showInHeader: true });
  };

  const handleRemoveFromHeader = async (link: NavigationItemRecord) => {
    await updateLink(link, { showInHeader: false });
  };

  const handleAddToFooter = async (link: NavigationItemRecord, section: string) => {
    const sectionName = section.trim() || "Links";
    await updateLink(link, { showInFooter: true, footerSection: sectionName, showInHeader: link.showInHeader !== false });
  };

  const handleRemoveFromFooter = async (link: NavigationItemRecord) => {
    await updateLink(link, { showInFooter: false });
  };

  const handleDelete = async (link: NavigationItemRecord) => {
    const confirmed = window.confirm(`Delete "${link.label}" permanently?`);
    if (!confirmed) return;
    await deleteAsync({ resource: "navigation", id: link.id });
  };

  const handleRenameSection = async (oldName: string, newName: string) => {
    const nextName = newName.trim() || oldName;
    if (nextName === oldName) return;
    setFooterSectionsList((prev) => prev.map((name) => (name === oldName ? nextName : name)));
    const linksInSection = footerSections[oldName] || [];
    await Promise.all(linksInSection.map((link) => updateLink(link, { footerSection: nextName })));
  };

  const handleAddSection = () => {
    setFooterSectionsList((prev) => {
      if (prev.length >= 3) return prev;
      const base = `Section ${prev.length + 1}`;
      let candidate = base;
      let counter = 1;
      while (prev.includes(candidate)) {
        counter += 1;
        candidate = `${base} ${counter}`;
      }
      return [...prev, candidate];
    });
  };

  const handleAddLinkToSection = (section: string, linkId: string) => {
    const targetLink = links.find((link) => link.id === linkId);
    if (!targetLink) return;
    handleAddToFooter(targetLink, section);
    setSectionSelections((prev) => ({ ...prev, [section]: "" }));
  };

  const sectionNames = Array.from(new Set([...footerSectionsList, ...Object.keys(footerSections)]));

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Navigation</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>Manage top navigation and footer links.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 18 }}>Link library</strong>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              Manage titles, destinations, and whether links open in a new tab.
            </span>
          </div>
          <Link className="btn" href="/admin/navigation/new">
            + Create link
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Destination</th>
              <th style={{ width: 80 }}>Order</th>
              <th style={{ width: 120 }}>Opens</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ padding: 18, textAlign: "center" }}>
                  Loading links…
                </td>
              </tr>
            )}
            {!isLoading && links.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 18, textAlign: "center", color: "var(--muted)" }}>
                  No links yet. Create one to control the site nav and footer.
                </td>
              </tr>
            ) : null}
            {!isLoading &&
              links.map((link) => (
                <tr key={link.id}>
                  <td>{link.label}</td>
                  <td style={{ color: "var(--muted)" }}>{link.href}</td>
                  <td>{link.order ?? "—"}</td>
                  <td>{link.isExternal ? "New tab" : "Same tab"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link className="btn secondary" href={`/admin/navigation/${link.id}`}>
                        Edit
                      </Link>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => handleDelete(link)}
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>


      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 18 }}>Top navigation</strong>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              Links shown in the site header. Add or remove chips to control the order set by their numbers.
            </span>
          </div>
        </div>
        <div className="chip-stack">
          <p style={{ margin: "4px 0", color: "var(--muted)" }}>Showing</p>
          <div className="chip-row">
            {isLoading ? (
              <span style={{ color: "var(--muted)" }}>Loading links…</span>
            ) : headerLinks.length ? (
              headerLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="chip"
                  onClick={() => handleRemoveFromHeader(link)}
                  disabled={isUpdating}
                  title="Remove from top navigation"
                >
                  <span>{link.label}</span>
                  <span className="chip-meta">{link.href}</span>
                  <span className="chip-action">Remove</span>
                </button>
              ))
            ) : (
              <span style={{ color: "var(--muted)" }}>No links in the top navigation.</span>
            )}
          </div>
          <p style={{ margin: "10px 0 4px", color: "var(--muted)" }}>Add from your library</p>
          <div className="chip-row">
            {availableForHeader.length ? (
              availableForHeader.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="chip muted"
                  onClick={() => handleAddToHeader(link)}
                  disabled={isUpdating}
                  title="Add to top navigation"
                >
                  <span>{link.label}</span>
                  <span className="chip-meta">{link.href}</span>
                  <span className="chip-action">Add</span>
                </button>
              ))
            ) : (
              <span style={{ color: "var(--muted)" }}>All links are already in the top navigation.</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 18 }}>Footer</strong>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              Arrange footer sections and chips. Click a chip to remove it from the footer.
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn secondary" type="button" onClick={handleAddSection} disabled={sectionNames.length >= 3}>
              + Add section
            </button>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>Max 3 sections</span>
          </div>
        </div>
        <div className="footer-section-grid">
          {isLoading ? (
            <p style={{ color: "var(--muted)" }}>Loading footer sections…</p>
          ) : (
            sectionNames.map((section) => {
              const sectionLinks = footerSections[section] || [];
              const selection = sectionSelections[section] ?? "";
              return (
                <div key={section} className="footer-section-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <input
                      className="input"
                      value={section}
                      onChange={(e) => handleRenameSection(section, e.target.value)}
                      style={{ flex: 1, minWidth: 160 }}
                    />
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{sectionLinks.length} link(s)</span>
                  </div>
                  <div className="chip-row">
                    {sectionLinks.length ? (
                      sectionLinks.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          className="chip"
                          onClick={() => handleRemoveFromFooter(link)}
                          disabled={isUpdating}
                          title="Remove from footer"
                        >
                          <span>{link.label}</span>
                          <span className="chip-meta">{link.isExternal ? "New tab" : "Same tab"}</span>
                          <span className="chip-action">Remove</span>
                        </button>
                      ))
                    ) : (
                      <span style={{ color: "var(--muted)" }}>No links yet. Add one below.</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      className="input"
                      value={selection}
                      onChange={(e) => setSectionSelections((prev) => ({ ...prev, [section]: e.target.value }))}
                      style={{ minWidth: 200 }}
                      disabled={availableForFooter.length === 0 || isUpdating}
                    >
                      <option value="">Select link to add</option>
                      {availableForFooter.map((link) => (
                        <option key={link.id} value={link.id}>
                          {link.label} ({link.isExternal ? "New tab" : "Same tab"})
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => handleAddLinkToSection(section, selection)}
                      disabled={!selection || isUpdating}
                    >
                      Add link
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
