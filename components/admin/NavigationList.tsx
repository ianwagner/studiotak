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
  const sortedLinks = [...links].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label));
  const linkById = new Map(sortedLinks.map((link) => [link.id, link]));
  const headerLinks = sortedLinks.filter((link) => link.showInHeader !== false);
  const headerChildrenByParent = headerLinks
    .filter((link) => link.parentId)
    .reduce<Record<string, NavigationItemRecord[]>>((acc, link) => {
      const parentId = link.parentId as string;
      acc[parentId] = acc[parentId] ? [...acc[parentId], link] : [link];
      return acc;
    }, {});
  const headerTopLevelLinks = headerLinks.filter((link) => !link.parentId);
  const footerLinks = sortedLinks.filter((link) => link.showInFooter);
  const footerChildrenByParent = footerLinks
    .filter((link) => link.parentId)
    .reduce<Record<string, NavigationItemRecord[]>>((acc, link) => {
      const parentId = link.parentId as string;
      acc[parentId] = acc[parentId] ? [...acc[parentId], link] : [link];
      return acc;
    }, {});
  const footerParentLinks = footerLinks.filter((link) => !link.parentId);
  const footerSections = footerParentLinks.reduce<Record<string, NavigationItemRecord[]>>((acc, link) => {
    const sectionName = link.footerSection?.trim() || "Links";
    acc[sectionName] = acc[sectionName] ? [...acc[sectionName], link] : [link];
    return acc;
  }, {});
  const availableForHeader = sortedLinks.filter((link) => link.showInHeader === false);
  const availableForFooter = sortedLinks.filter((link) => !link.showInFooter);

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
  const getParentLabel = (link: NavigationItemRecord) => {
    if (!link.parentId) return "Top level";
    return linkById.get(link.parentId)?.label ?? "Missing parent";
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Navigation</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>Manage top navigation and footer links.</p>
        </div>
      </div>

      <div className="card">
        <div className="admin-card-header">
          <strong style={{ fontSize: 18 }}>Link library</strong>
          <Link className="btn" href="/admin/navigation/new">
            + Create link
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Destination</th>
              <th>Parent</th>
              <th>Placement</th>
              <th style={{ width: 80 }}>Order</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} style={{ padding: 18, textAlign: "center" }}>
                  Loading links…
                </td>
              </tr>
            )}
            {!isLoading && links.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 18, textAlign: "center", color: "var(--muted)" }}>
                  No links yet. Create one to control the site nav and footer.
                </td>
              </tr>
            ) : null}
            {!isLoading &&
              sortedLinks.map((link) => (
                <tr key={link.id}>
                  <td>
                    <div className="nav-admin-link-label">
                      {link.icon ? <img src={link.icon} alt="" aria-hidden /> : null}
                      <span>{link.label}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{link.href}</td>
                  <td style={{ color: link.parentId ? "var(--text)" : "var(--muted)" }}>{getParentLabel(link)}</td>
                  <td>
                    <div className="nav-admin-placement">
                      {link.showInHeader !== false ? <span className="badge">Header</span> : null}
                      {link.showInFooter ? <span className="badge draft">Footer</span> : null}
                      {link.showInHeader === false && !link.showInFooter ? <span className="badge neutral">Hidden</span> : null}
                      {link.isExternal ? <span className="badge neutral">New tab</span> : null}
                    </div>
                  </td>
                  <td>{link.order ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link className="btn secondary" href={`/admin/navigation/${link.id}`}>
                        Edit
                      </Link>
                      <button
                        className="btn danger"
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
        <div className="admin-card-header">
          <strong style={{ fontSize: 18 }}>Top navigation</strong>
        </div>
        <div className="nav-admin-browser">
          <div className="nav-admin-browser-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="nav-admin-header-preview">
            {isLoading ? (
              <span style={{ color: "var(--muted)" }}>Loading links…</span>
            ) : headerTopLevelLinks.length ? (
              headerTopLevelLinks.map((link) => {
                const children = headerChildrenByParent[link.id] ?? [];
                return (
                  <div key={link.id} className="nav-admin-tree-node">
                    <button
                      type="button"
                      className="nav-admin-nav-pill"
                      onClick={() => handleRemoveFromHeader(link)}
                      disabled={isUpdating}
                      title="Remove from top navigation"
                    >
                      {link.icon ? <img src={link.icon} alt="" aria-hidden /> : null}
                      <span>{link.label}</span>
                      {children.length ? <span className="nav-admin-count">{children.length}</span> : null}
                    </button>
                    {children.length ? (
                      <div className="nav-admin-child-menu">
                        {children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            className="nav-admin-child-row"
                            onClick={() => handleRemoveFromHeader(child)}
                            disabled={isUpdating}
                            title="Remove from top navigation"
                          >
                            {child.icon ? <img src={child.icon} alt="" aria-hidden /> : null}
                            <span>{child.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <span style={{ color: "var(--muted)" }}>No links in the top navigation.</span>
            )}
          </div>
        </div>
        {availableForHeader.length ? (
          <div className="nav-admin-add-row">
            {availableForHeader.map((link) => (
              <button
                key={link.id}
                type="button"
                className="chip muted"
                onClick={() => handleAddToHeader(link)}
                disabled={isUpdating}
                title="Add to top navigation"
              >
                <span>{link.label}</span>
                <span className="chip-action">Add</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card">
        <div className="admin-card-header">
          <strong style={{ fontSize: 18 }}>Footer</strong>
          <div className="nav-admin-actions">
            <button className="btn secondary" type="button" onClick={handleAddSection} disabled={sectionNames.length >= 3}>
              + Add section
            </button>
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
                  <div className="nav-admin-footer-section-head">
                    <input
                      className="input"
                      value={section}
                      onChange={(e) => handleRenameSection(section, e.target.value)}
                      style={{ flex: 1, minWidth: 160 }}
                    />
                    <span className="nav-admin-count">{sectionLinks.length}</span>
                  </div>
                  <div className="nav-admin-footer-list">
                    {sectionLinks.length ? (
                      sectionLinks.map((link) => {
                        const children = footerChildrenByParent[link.id] ?? [];
                        return (
                          <div key={link.id} className="nav-admin-footer-parent">
                            <button
                              type="button"
                              className="nav-admin-footer-link"
                              onClick={() => handleRemoveFromFooter(link)}
                              disabled={isUpdating}
                              title="Remove from footer"
                            >
                              {link.icon ? <img src={link.icon} alt="" aria-hidden /> : null}
                              <span>{link.label}</span>
                            </button>
                            {children.length ? (
                              <div className="nav-admin-footer-children">
                                {children.map((child) => (
                                  <button
                                    key={child.id}
                                    type="button"
                                    className="nav-admin-footer-child"
                                    onClick={() => handleRemoveFromFooter(child)}
                                    disabled={isUpdating}
                                    title="Remove from footer"
                                  >
                                    {child.icon ? <img src={child.icon} alt="" aria-hidden /> : null}
                                    <span>{child.label}</span>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ color: "var(--muted)" }}>No links yet. Add one below.</span>
                    )}
                  </div>
                  <div className="nav-admin-add-control">
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
