"use client";

import { useEffect, useState } from "react";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { migrateUploadedAssetsToWebp, type AssetMigrationSummary } from "@/lib/assetMigration";
import { getPublicMediaUploadMetadata, prepareImageFileForUpload } from "@/lib/clientImageUpload";
import { ensureFirebaseDevAuth, getFirebaseApp } from "@/lib/firebaseClient";
import {
  getSiteSettings,
  saveSiteSettings,
  seedSiteSettings,
  type SiteSettings,
  siteSettingsFirebaseReady
} from "@/lib/siteSettings";

type AssetKey = "faviconUrl" | "touchIconUrl" | "logoUrl" | "footerLogoUrl" | "notFoundIconUrl";

const assetCopy: Record<AssetKey, { label: string; helper: string }> = {
  faviconUrl: {
    label: "Favicon",
    helper: "Ideal: 32x32 .ico or .png."
  },
  touchIconUrl: {
    label: "Touch icon",
    helper: "Apple touch icon or PWA icon, typically 180x180 PNG."
  },
  logoUrl: {
    label: "Logo",
    helper: "Transparent PNG or SVG, used in the header and metadata."
  },
  footerLogoUrl: {
    label: "Footer logo",
    helper: "Optional alternate logo for the footer. Transparent PNG or SVG works best."
  },
  notFoundIconUrl: {
    label: "404 icon",
    helper: "Optional illustration for the 404 page. SVG or transparent PNG works best."
  }
};

export function SiteSettingsForm() {
  const [form, setForm] = useState<SiteSettings>(seedSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Partial<Record<AssetKey, boolean>>>({});
  const [migratingAssets, setMigratingAssets] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<string | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationSummary, setMigrationSummary] = useState<AssetMigrationSummary | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSiteSettings();
        setForm(settings);
      } catch (err) {
        console.error(err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpload = async (key: AssetKey, file: File | null) => {
    if (!file) return;
    if (!siteSettingsFirebaseReady) {
      setError("Configure Firebase env vars to upload assets.");
      return;
    }
    setError(null);
    setMessage(null);
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      await ensureFirebaseDevAuth();
      const app = getFirebaseApp();
      const storage = getStorage(app);
      const uploadFile = await prepareImageFileForUpload(file, {
        preserveOriginalFormat: key === "faviconUrl" || key === "touchIconUrl"
      });
      const storageRef = ref(storage, `site-settings/${key}-${Date.now()}-${uploadFile.name}`);
      await uploadBytes(storageRef, uploadFile, getPublicMediaUploadMetadata(uploadFile));
      const url = await getDownloadURL(storageRef);
      const saved = await saveSiteSettings({ ...form, [key]: url });
      setForm(saved);
      setMessage(`${assetCopy[key].label} uploaded & saved`);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Check Firebase Storage permissions.");
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!siteSettingsFirebaseReady) {
      setError("Configure Firebase env vars to save settings.");
      return;
    }
    await ensureFirebaseDevAuth();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await saveSiteSettings(form);
      setForm(saved);
      setMessage(siteSettingsFirebaseReady ? "Saved settings" : "Saved locally (Firebase not configured)");
    } catch (err) {
      console.error(err);
      setError("Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAssetMigration = async () => {
    if (!siteSettingsFirebaseReady) {
      setMigrationError("Configure Firebase env vars to migrate uploaded assets.");
      return;
    }

    setMigratingAssets(true);
    setMigrationError(null);
    setMigrationSummary(null);
    setMigrationProgress("Starting asset migration…");
    setMessage(null);
    setError(null);

    try {
      const summary = await migrateUploadedAssetsToWebp({
        onProgress: setMigrationProgress
      });
      const settings = await getSiteSettings();
      setForm(settings);
      setMigrationSummary(summary);
      setMigrationProgress("Asset migration complete.");
      setMessage("Existing uploaded images were backfilled to WebP where safe.");
    } catch (err: any) {
      console.error(err);
      setMigrationError(err?.message ?? "Asset migration failed.");
    } finally {
      setMigratingAssets(false);
    }
  };

  if (loading) {
    return <p>Loading settings…</p>;
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card" style={{ padding: 12 }}>
        <h1 style={{ margin: "0 0 6px" }}>Site settings</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Manage global assets used across the site. Upload files directly to Firebase from here.
        </p>
        {!siteSettingsFirebaseReady ? (
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
            Firebase env vars missing—uploads and saves are disabled until configured.
          </p>
        ) : null}
      </div>

      <div className="card" style={{ padding: 12 }}>
        <form className="grid" style={{ gap: 12 }} onSubmit={handleSubmit}>
          {message ? <div style={{ color: "var(--accent)" }}>{message}</div> : null}
          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}

          {(Object.keys(assetCopy) as AssetKey[]).map((key) => (
            <div className="field-group" key={key}>
              <label>{assetCopy[key].label}</label>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{assetCopy[key].helper}</p>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  className="input"
                  type="file"
                  accept={
                    key === "logoUrl" || key === "footerLogoUrl" || key === "notFoundIconUrl"
                      ? "image/*,image/svg+xml"
                      : "image/*"
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    void handleUpload(key, file);
                    e.target.value = "";
                  }}
                  disabled={uploading[key]}
                />
                {uploading[key] ? <span style={{ color: "var(--muted)" }}>Uploading…</span> : null}
                {form[key] ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img
                      src={form[key]}
                      alt={`${assetCopy[key].label} preview`}
                      style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid var(--border)" }}
                    />
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>Preview</span>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </button>
            {form.updatedAt ? (
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Last updated {form.updatedAt}</span>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 12, display: "grid", gap: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Backfill existing uploads to WebP</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Sets long-lived cache headers on existing Firebase-hosted assets, rewrites convertible images to WebP, updates Firestore
            references, and leaves favicon / touch icon formats alone for compatibility.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={handleAssetMigration} disabled={migratingAssets || !siteSettingsFirebaseReady}>
            {migratingAssets ? "Migrating…" : "Run asset migration"}
          </button>
          {migrationProgress ? <span style={{ color: "var(--muted)", fontSize: 13 }}>{migrationProgress}</span> : null}
        </div>

        {migrationError ? <div style={{ color: "var(--danger)" }}>{migrationError}</div> : null}

        {migrationSummary ? (
          <div className="grid" style={{ gap: 8 }}>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Storage assets scanned: {migrationSummary.scannedStorageAssets} | migrated: {migrationSummary.migratedStorageAssets} |
              skipped: {migrationSummary.skippedStorageAssets} | failed: {migrationSummary.failedStorageAssets}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Cache headers updated: {migrationSummary.cacheMetadataUpdated} | failed: {migrationSummary.cacheMetadataFailed}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Documents updated: site settings {migrationSummary.updatedDocuments.siteSettings}, media{" "}
              {migrationSummary.updatedDocuments.media}, pages {migrationSummary.updatedDocuments.pages}, components{" "}
              {migrationSummary.updatedDocuments.components}, navigation {migrationSummary.updatedDocuments.navigation}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Inline navigation icons converted: {migrationSummary.convertedNavigationIcons}
            </div>
            {migrationSummary.failures.length ? (
              <details>
                <summary style={{ cursor: "pointer" }}>Migration failures ({migrationSummary.failures.length})</summary>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                  {migrationSummary.failures.map((failure) => (
                    <li key={failure} style={{ color: "var(--danger)", fontSize: 13 }}>
                      {failure}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
