"use client";

import Link from "next/link";
import { useState } from "react";
import { prepareImageDataUrl } from "@/lib/clientImageUpload";
import type { NavigationItemRecord } from "@/lib/admin/navigation";
import type { Route } from "next";

export type NavigationFormState = Omit<NavigationItemRecord, "id" | "updatedAt"> & { id?: string };

type NavigationFormProps = {
  initialState: NavigationFormState;
  onSubmit: (values: NavigationFormState) => Promise<void>;
  isSubmitting: boolean;
  backHref: Route;
  heading?: string;
  intro?: string;
  placementNote?: string;
  submitLabel: { idle: string; loading: string };
  message?: string | null;
  allLinks?: NavigationItemRecord[];
};

export function NavigationForm({
  initialState,
  onSubmit,
  isSubmitting,
  backHref,
  heading = "Navigation link",
  intro = "Manage links that render in the site header or footer.",
  placementNote,
  submitLabel,
  message,
  allLinks = []
}: NavigationFormProps) {
  const [formState, setFormState] = useState<NavigationFormState>({
    ...initialState,
    showInHeader: initialState.showInHeader ?? true,
    showInFooter: initialState.showInFooter ?? false,
    footerSection: initialState.footerSection ?? "",
    parentId: initialState.parentId ?? "",
    icon: initialState.icon ?? ""
  });

  const parentOptions = allLinks.filter((link) => link.id !== initialState.id && !link.parentId);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const orderValue = Number(formState.order);
    await onSubmit({
      ...formState,
      order: Number.isFinite(orderValue) ? orderValue : 0,
      isExternal: Boolean(formState.isExternal),
      showInHeader: formState.showInHeader !== false,
      showInFooter: Boolean(formState.showInFooter),
      footerSection: formState.footerSection?.trim() || "",
      parentId: formState.parentId?.trim() || "",
      icon: formState.icon?.trim() || ""
    });
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Navigation</p>
          <h1 style={{ margin: 0 }}>{heading}</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>{intro}</p>
        </div>
        <Link className="btn secondary" href={backHref}>
          ← Back to navigation
        </Link>
      </div>

      <form className="grid" style={{ gap: 12 }} onSubmit={handleSubmit}>
        <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className="field-group">
            <label>Label</label>
            <input
              className="input"
              required
              value={formState.label}
              onChange={(e) => setFormState((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Link label"
            />
          </div>
          <div className="field-group">
            <label>Href</label>
            <input
              className="input"
              required
              value={formState.href}
              onChange={(e) => setFormState((prev) => ({ ...prev, href: e.target.value }))}
              placeholder="/work, #contact, https://…"
            />
          </div>
          <div className="field-group">
            <label>Order</label>
            <input
              className="input"
              type="number"
              value={formState.order}
              onChange={(e) => setFormState((prev) => ({ ...prev, order: Number(e.target.value) }))}
              placeholder="1"
              min={0}
            />
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>Lower numbers appear first.</p>
          </div>
          <div className="field-group">
            <label>Footer section title</label>
            <input
              className="input"
              value={formState.footerSection ?? ""}
              onChange={(e) => setFormState((prev) => ({ ...prev, footerSection: e.target.value }))}
              placeholder="Services, Company, Resources…"
            />
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
              Group footer links into columns by giving them the same section title.
            </p>
          </div>
          <div className="field-group">
            <label>Icon</label>
            <div className="grid" style={{ gap: 8 }}>
              <input
                className="input"
                value={formState.icon ?? ""}
                onChange={(e) => setFormState((prev) => ({ ...prev, icon: e.target.value }))}
                placeholder="Paste an image URL or upload below"
              />
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void prepareImageDataUrl(file)
                    .then((result) => {
                      setFormState((prev) => ({ ...prev, icon: result }));
                    })
                    .catch((error) => {
                      console.error("Failed to prepare navigation icon", error);
                    });
                }}
              />
              {formState.icon ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={formState.icon} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
                  <button className="btn secondary" type="button" onClick={() => setFormState((prev) => ({ ...prev, icon: "" }))}>
                    Remove icon
                  </button>
                </div>
              ) : null}
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                Optional. Upload or paste a URL; it will appear to the left of the link text.
              </p>
            </div>
          </div>
          <div className="field-group">
            <label>Parent link (optional)</label>
            <select
              className="input"
              value={formState.parentId ?? ""}
              onChange={(e) => setFormState((prev) => ({ ...prev, parentId: e.target.value }))}
            >
              <option value="">No parent (top-level link)</option>
              {parentOptions.map((link) => (
                <option key={link.id} value={link.id}>
                  {link.label}
                </option>
              ))}
            </select>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
              Set this link as a child of another top-level link to create parent/sub-links.
            </p>
          </div>
        </div>

        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={Boolean(formState.isExternal)}
            onChange={(e) => setFormState((prev) => ({ ...prev, isExternal: e.target.checked }))}
          />
          Open in a new tab
        </label>
        {placementNote ? (
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>{placementNote}</p>
        ) : null}

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? submitLabel.loading : submitLabel.idle}
          </button>
          {message ? <span style={{ color: "var(--accent)" }}>{message}</span> : null}
        </div>
      </form>
    </div>
  );
}
