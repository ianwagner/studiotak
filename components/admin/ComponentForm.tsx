"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, getDocs, getFirestore, limit, query, serverTimestamp } from "firebase/firestore";
import { prepareImageFileForUpload } from "@/lib/clientImageUpload";
import { ensureFirebaseDevAuth, getFirebaseApp } from "@/lib/firebaseClient";
import type { ComponentRecord } from "@/lib/admin/components";
import type { Route } from "next";
import Link from "next/link";
import { MediaSelect, type MediaOption } from "./MediaSelect";
import { localAuthBypassEnabled } from "@/lib/localAuthBypass";

export type ComponentFormState = Omit<ComponentRecord, "id" | "updatedAt"> & { id?: string };

type ComponentFormProps = {
  initialState: ComponentFormState;
  onSubmit: (values: ComponentFormState) => Promise<void>;
  isSubmitting: boolean;
  backHref: Route;
  heading?: string;
  intro?: string;
  submitLabel: { idle: string; loading: string };
  message?: string | null;
};

export function ComponentForm({
  initialState,
  onSubmit,
  isSubmitting,
  backHref,
  heading = "Component",
  intro = "Reusable feature component with icon, copy, and tags.",
  submitLabel,
  message
}: ComponentFormProps) {
  const [formState, setFormState] = useState<ComponentFormState>(initialState);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const firebaseReady = useMemo(() => Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY), []);

  const fetchMediaOptions = useMemo(
    () => async () => {
      if (!firebaseReady) return;
      try {
        const db = getFirestore(getFirebaseApp());
        const mediaRef = collection(db, "media");
        const q = query(mediaRef, limit(100));
        const snapshot = await getDocs(q);
        const options: MediaOption[] = snapshot.docs
          .map((doc) => {
            const data = doc.data() as any;
            if (!data?.url) return null;
            return {
              id: doc.id,
              name: data.name ?? data.alt ?? doc.id,
              url: data.url,
              mediaType: data.mediaType ?? data.type ?? "image"
            };
          })
          .filter(Boolean) as MediaOption[];
        setMediaOptions(options);
      } catch (err) {
        console.error("Failed to load media options", err);
      }
    },
    [firebaseReady]
  );

  useEffect(() => {
    fetchMediaOptions();
  }, [fetchMediaOptions]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit({ ...formState, kind: "feature" });
  };

  const handleIconUpload = async (file: File) => {
    setUploadError(null);
    if (!firebaseReady) {
      setUploadError("Configure Firebase to upload icons.");
      return;
    }
    try {
      setUploading(true);
      await ensureFirebaseDevAuth();
      const app = getFirebaseApp();
      if (!localAuthBypassEnabled) {
        const auth = getAuth(app);
        if (!auth.currentUser) {
          setUploadError("Sign in to upload icons.");
          return;
        }
      }
      const storage = getStorage(app);
      const db = getFirestore(app);
      const uploadFile = await prepareImageFileForUpload(file);
      const path = `component-icons/${Date.now()}-${uploadFile.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, uploadFile);
      const url = await getDownloadURL(storageRef);
      const mediaPayload = { url, alt: file.name, type: "image" as const };
      setFormState((prev) => ({ ...prev, icon: mediaPayload }));

      await addDoc(collection(db, "media"), {
        name: uploadFile.name,
        url,
        industry: formState.industry ?? "",
        type: formState.type ?? "",
        alt: file.name,
        mediaType: "image",
        uploadedAt: serverTimestamp()
      });
      await fetchMediaOptions();
    } catch (err: any) {
      console.error("Icon upload failed", err);
      setUploadError(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Component</p>
          <h1 style={{ margin: 0 }}>{heading}</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>{intro}</p>
        </div>
        <Link className="btn secondary" href={backHref}>
          ← Back to list
        </Link>
      </div>

      <form className="grid" style={{ gap: 12 }} onSubmit={handleSubmit}>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>Component type: Feature (only type enabled for now).</span>
        <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div className="field-group">
            <label>Title</label>
            <input
              className="input"
              value={formState.title}
              onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Feature title"
              required
            />
          </div>
          <div className="field-group">
            <label>Industry tag</label>
            <input
              className="input"
              value={formState.industry ?? ""}
              onChange={(e) => setFormState((prev) => ({ ...prev, industry: e.target.value }))}
              placeholder="SaaS, Fintech…"
            />
          </div>
          <div className="field-group">
            <label>Type tag</label>
            <input
              className="input"
              value={formState.type ?? ""}
              onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value }))}
              placeholder="Feature, Benefit"
            />
          </div>
          <div className="field-group">
            <label>Media fit</label>
            <select
              value={formState.mediaFit ?? "cover"}
              onChange={(e) => setFormState((prev) => ({ ...prev, mediaFit: e.target.value as "cover" | "contain" }))}
            >
              <option value="cover">Fill (cover)</option>
              <option value="contain">Fit (contain)</option>
            </select>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
              Choose how the media should scale inside cards that use this component.
            </p>
          </div>
        </div>
        <div className="field-group">
          <label>Copy</label>
          <textarea
            rows={3}
            value={formState.body}
            onChange={(e) => setFormState((prev) => ({ ...prev, body: e.target.value }))}
            placeholder="Short description for this component"
            required
          />
        </div>

        <div className="card" style={{ padding: 12, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>Icon</strong>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Upload a small square icon (PNG/SVG).</p>
            </div>
            {formState.icon?.url ? (
              <img
                src={formState.icon.url}
                alt={formState.icon.alt ?? ""}
                style={{ width: 48, height: 48, borderRadius: 8, border: "1px solid var(--border)", objectFit: "cover" }}
              />
            ) : null}
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
            <input
              className="input"
              value={formState.icon?.url ?? ""}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  icon: { url: e.target.value, alt: prev.icon?.alt ?? "", type: prev.icon?.type ?? "image" }
                }))
              }
              placeholder="https://…"
            />
            <input
              className="input"
              value={formState.icon?.alt ?? ""}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  icon: { url: prev.icon?.url ?? "", alt: e.target.value, type: prev.icon?.type ?? "image" }
                }))
              }
              placeholder="Alt text"
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className="btn secondary"
              disabled={!firebaseReady}
              onClick={() => {
                setMediaSearch("");
                setMediaModalOpen(true);
              }}
            >
              Choose from media
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={uploading}
              onClick={() => document.getElementById("upload-component-icon")?.click()}
            >
              {uploading ? "Uploading…" : "Upload icon"}
            </button>
            <input
              id="upload-component-icon"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleIconUpload(file);
              }}
            />
            {formState.icon?.url ? (
              <button
                type="button"
                className="btn secondary"
                onClick={() => setFormState((prev) => ({ ...prev, icon: undefined }))}
              >
                Remove
              </button>
            ) : null}
            {uploadError ? <span style={{ color: "var(--accent)", fontSize: 13 }}>{uploadError}</span> : null}
          </div>
          {!firebaseReady ? (
            <span style={{ color: "var(--accent)", fontSize: 13 }}>Firebase env vars missing. Uploads will be disabled.</span>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? submitLabel.loading : submitLabel.idle}
          </button>
          {message ? <span style={{ color: "var(--accent)" }}>{message}</span> : null}
        </div>
      </form>

      {mediaModalOpen ? (
        <MediaSelect
          options={mediaOptions}
          value={formState.icon?.url ?? ""}
          search={mediaSearch}
          filterType="image"
          onSearch={setMediaSearch}
          onSelect={(url, mediaType, name) => {
            setFormState((prev) => ({
              ...prev,
              icon: { url, alt: prev.icon?.alt || name || "", type: mediaType ?? "image" }
            }));
            setMediaModalOpen(false);
          }}
          onClose={() => setMediaModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
