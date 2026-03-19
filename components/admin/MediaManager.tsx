"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { prepareImageFileForUpload } from "@/lib/clientImageUpload";
import { ensureFirebaseDevAuth, getFirebaseApp } from "@/lib/firebaseClient";
import type { MediaRecord } from "@/lib/admin/media";
import { localAuthBypassEnabled } from "@/lib/localAuthBypass";

type MediaFormState = {
  files: File[];
  industry: string;
  type: string;
  alt: string;
  mediaType: "image" | "video";
  featured: boolean;
};

type MediaField = "industry" | "type" | "alt" | "mediaType" | "featured";
type FeaturedFilter = "all" | "featured" | "unfeatured";

const emptyState: MediaFormState = {
  files: [],
  industry: "",
  type: "",
  alt: "",
  mediaType: "image",
  featured: false
};

const formatFileName = (name: string) => (name.length > 10 ? `${name.slice(0, 10)}...` : name);

export function MediaManager() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [form, setForm] = useState<MediaFormState>(emptyState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "masonry">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMediaType, setFilterMediaType] = useState<"all" | "image" | "video">("all");
  const [filterFeatured, setFilterFeatured] = useState<FeaturedFilter>("all");
  const firebaseReady = useMemo(() => Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY), []);

  const loadMedia = async () => {
    if (!firebaseReady) return;
    try {
      const db = getFirestore(getFirebaseApp());
      const mediaRef = collection(db, "media");
      const snapshot = await getDocs(query(mediaRef, orderBy("uploadedAt", "desc")));
      const data: MediaRecord[] = snapshot.docs.map((doc) => {
        const raw = doc.data() as any;
        return {
          id: doc.id,
          name: raw.name,
          url: raw.url,
          industry: Array.isArray(raw.industry) ? raw.industry : (typeof raw.industry === "string" && raw.industry.trim() ? [raw.industry.trim()] : []),
          type: raw.type ?? "",
          uploadedAt: raw.uploadedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
          alt: raw.alt ?? "",
          mediaType: raw.mediaType ?? "image",
          featured: Boolean(raw.featured)
        };
      });
      setItems(data);
    } catch (err: any) {
      console.error("Failed to load media", err);
      setError("Failed to load media");
    }
  };

  useEffect(() => {
    if (localAuthBypassEnabled) {
      setCurrentUser("local-dev");
      return;
    }
    if (!firebaseReady) return;
    const auth = getAuth(getFirebaseApp());
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user?.email ?? user?.uid ?? null);
    });
    return () => unsub();
  }, [firebaseReady]);

  useEffect(() => {
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseReady]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!firebaseReady) {
      setError("Firebase env vars are missing. Configure Firebase to upload media.");
      return;
    }
    if (!currentUser) {
      setError("You must be signed in to upload media.");
      return;
    }
    if (!form.files.length) {
      setError("Choose one or more files to upload.");
      return;
    }
    try {
      setLoading(true);
      await ensureFirebaseDevAuth();
      const app = getFirebaseApp();
      const storage = getStorage(app);
      const db = getFirestore(app);
      const timestamp = Date.now();
      await Promise.all(
        form.files.map(async (file, idx) => {
          const uploadFile = await prepareImageFileForUpload(file);
          const path = `uploads/${timestamp}-${idx}-${uploadFile.name}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, uploadFile);
          const url = await getDownloadURL(storageRef);

          const payload = {
            name: uploadFile.name,
            url,
            industry: form.industry.split(",").map((s) => s.trim()).filter(Boolean),
            type: form.type,
            alt: form.alt || file.name,
            mediaType: form.mediaType ?? (file.type.startsWith("video") ? "video" : "image"),
            uploadedAt: serverTimestamp(),
            featured: form.featured ?? false
          };
          await addDoc(collection(db, "media"), payload);
        })
      );
      setForm(emptyState);
      await loadMedia();
    } catch (err: any) {
      console.error("Upload failed", err);
      setError(err?.message ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = async (id: string, field: MediaField, value: string | boolean | string[]) => {
    if (!firebaseReady) return;
    try {
      await ensureFirebaseDevAuth();
      const db = getFirestore(getFirebaseApp());
      const ref = doc(db, "media", id);
      const normalizedValue = field === "featured" ? Boolean(value) : value;
      await updateDoc(ref, { [field]: normalizedValue });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: normalizedValue } : item))
      );
    } catch (err) {
      console.error("Failed to update media", err);
      setError("Failed to update field");
    }
  };

  const handleTagChange = (id: string, field: "industry" | "type", value: string) => {
    if (field === "industry") {
      const arr = value.split(",").map((s) => s.trim()).filter(Boolean);
      handleFieldChange(id, field, arr);
    } else {
      handleFieldChange(id, field, value);
    }
  };

  const handleMetaChange = (id: string, field: "alt" | "mediaType" | "featured", value: string | boolean) =>
    handleFieldChange(id, field, value);

  const handleDelete = async (id: string) => {
    if (!firebaseReady) return;
    try {
      await ensureFirebaseDevAuth();
      const db = getFirestore(getFirebaseApp());
      await deleteDoc(doc(db, "media", id));
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    } catch (err) {
      console.error("Failed to delete media", err);
      setError("Failed to delete item");
    }
  };

  const industryFilters = useMemo(() => {
    const unique = new Set(items.flatMap((item) => item.industry).filter(Boolean));
    return Array.from(unique).sort();
  }, [items]);

  const typeFilters = useMemo(() => {
    const unique = new Set(items.map((item) => item.type).filter(Boolean));
    return Array.from(unique);
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        [item.name, item.industry.join(" "), item.type, item.alt, item.url]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(query));
      const matchesIndustry = filterIndustry === "all" || item.industry.includes(filterIndustry);
      const matchesType = filterType === "all" || item.type === filterType;
      const matchesMediaType = filterMediaType === "all" || (item.mediaType ?? "image") === filterMediaType;
      const matchesFeatured =
        filterFeatured === "all" ||
        (filterFeatured === "featured" ? Boolean(item.featured) : !Boolean(item.featured));
      return matchesSearch && matchesIndustry && matchesType && matchesMediaType && matchesFeatured;
    });
  }, [items, searchTerm, filterIndustry, filterType, filterMediaType, filterFeatured]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card" style={{ padding: 12 }}>
        <h1 style={{ margin: "0 0 6px" }}>Media</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Upload assets with tags for Industry and Type. Stored in Firebase Storage + Firestore.
        </p>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <form className="grid" style={{ gap: 12 }} onSubmit={handleSubmit}>
          <div className="field-group">
            <label>File</label>
            <input
              className="input"
              type="file"
              multiple
              onChange={(e) => setForm((prev) => ({ ...prev, files: Array.from(e.target.files ?? []) }))}
              required
            />
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div className="field-group">
              <label>Industry</label>
              <input
                className="input"
                value={form.industry}
                onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                placeholder="SaaS, Fintech, etc."
              />
            </div>
            <div className="field-group">
              <label>Type</label>
              <input
                className="input"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                placeholder="Hero image, logo, video"
              />
            </div>
            <div className="field-group">
              <label>Alt text</label>
              <input
                className="input"
                value={form.alt}
                onChange={(e) => setForm((prev) => ({ ...prev, alt: e.target.value }))}
                placeholder="Describe the media"
              />
            </div>
            <div className="field-group">
              <label>Media type</label>
              <select
                value={form.mediaType}
                onChange={(e) => setForm((prev) => ({ ...prev, mediaType: e.target.value as "image" | "video" }))}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="field-group">
              <label>Featured</label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                />
                <span>Mark uploads as featured</span>
              </label>
            </div>
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Uploading…" : "Upload media"}
          </button>
          {error ? <span style={{ color: "var(--accent)" }}>{error}</span> : null}
          {currentUser ? null : (
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              Sign in to upload. Viewing library still works.
            </span>
          )}
          {!firebaseReady ? (
            <span style={{ color: "var(--accent)" }}>
              Firebase env vars missing. Media uploads will not work until configured.
            </span>
          ) : null}
        </form>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Library</h3>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              {filteredItems.length} {filteredItems.length !== items.length ? `of ${items.length} ` : ""}
              items
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div className="btn-group" style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                className={`btn secondary${viewMode === "list" ? " active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
              <button
                type="button"
                className={`btn secondary${viewMode === "masonry" ? " active" : ""}`}
                onClick={() => setViewMode("masonry")}
              >
                Masonry
              </button>
            </div>
          </div>
        </div>
        <div
          className="grid"
          style={{
            gap: 8,
            marginTop: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            alignItems: "center"
          }}
        >
          <input
            className="input"
            style={{ gridColumn: "1 / -1" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, tag, alt, or url"
          />
          <select
            className="input"
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            aria-label="Filter by industry"
          >
            <option value="all">All industries</option>
            {industryFilters.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            {typeFilters.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filterMediaType}
            onChange={(e) => setFilterMediaType(e.target.value as "all" | "image" | "video")}
            aria-label="Filter by media type"
          >
            <option value="all">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <select
            className="input"
            value={filterFeatured}
            onChange={(e) => setFilterFeatured(e.target.value as FeaturedFilter)}
            aria-label="Filter by featured flag"
          >
            <option value="all">All items</option>
            <option value="featured">Featured only</option>
            <option value="unfeatured">Not featured</option>
          </select>
        </div>
        <MediaLibrary
          items={filteredItems}
          viewMode={viewMode}
          onTagChange={handleTagChange}
          onMetaChange={handleMetaChange}
          onDelete={handleDelete}
          onSelectItem={setSelectedId}
        />
      </div>
      {selectedItem ? (
        <MediaModal
          item={selectedItem}
          onClose={() => setSelectedId(null)}
          onTagChange={handleTagChange}
          onMetaChange={handleMetaChange}
          onDelete={(id) => {
            handleDelete(id);
            setSelectedId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function MediaLibrary({
  items,
  viewMode,
  onTagChange,
  onMetaChange,
  onDelete,
  onSelectItem
}: {
  items: MediaRecord[];
  viewMode: "list" | "masonry";
  onTagChange: (id: string, field: "industry" | "type", value: string) => void;
  onMetaChange: (id: string, field: "alt" | "mediaType" | "featured", value: string | boolean) => void;
  onDelete: (id: string) => void;
  onSelectItem: (id: string) => void;
}) {
  if (!items.length) {
    return <p style={{ color: "var(--muted)", marginTop: 12 }}>No media uploaded yet.</p>;
  }

  if (viewMode === "masonry") {
    return (
      <div
        style={{
          marginTop: 12,
          columnCount: 3,
          columnGap: 12,
          width: "100%"
        }}
      >
        {items.map((item) => (
          <article
            key={item.id}
            className="card"
            role="button"
            tabIndex={0}
            onClick={() => onSelectItem(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectItem(item.id);
              }
            }}
            style={{
              breakInside: "avoid",
              marginBottom: 12,
              padding: 8,
              display: "grid",
              gap: 8,
              cursor: "pointer",
              border: "1px solid var(--border)"
            }}
          >
            <MediaThumb item={item} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.name}
              </strong>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>
                {(item.mediaType ?? "image").toUpperCase()}
              </span>
            </div>
          </article>
        ))}
      </div>
    );
  }

  const gridTemplateColumns =
    "120px minmax(140px, 1.1fr) minmax(120px, 0.9fr) minmax(120px, 0.9fr) minmax(180px, 1.2fr) 110px 100px 150px";

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns,
          gap: 8,
          padding: "6px 10px",
          color: "var(--muted)",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.4
        }}
      >
        <span>Preview</span>
        <span>Name</span>
        <span>Industry</span>
        <span>Type</span>
        <span>Alt</span>
        <span>Media</span>
        <span>Featured</span>
        <span style={{ textAlign: "right" }}>Actions</span>
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="card"
          style={{
            padding: "8px 10px",
            border: "1px solid var(--border)",
            display: "grid",
            gap: 8,
            gridTemplateColumns,
            alignItems: "center"
          }}
        >
          <div
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => onSelectItem(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectItem(item.id);
              }
            }}
          >
            <MediaThumb item={item} maxHeight={72} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => onSelectItem(item.id)}
              title={item.name}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                color: "var(--text)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {formatFileName(item.name)}
            </button>
            <span
              style={{
                color: "var(--muted)",
                fontSize: 11,
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "2px 6px"
              }}
            >
              {(item.mediaType ?? "image").toUpperCase()}
            </span>
            {item.featured ? (
              <span
                style={{
                  background: "rgba(255,215,0,0.14)",
                  color: "var(--text)",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 11,
                  border: "1px solid var(--border)"
                }}
              >
                Featured
              </span>
            ) : null}
          </div>
          <input
            className="input"
            value={item.industry.join(", ")}
            onChange={(e) => onTagChange(item.id, "industry", e.target.value)}
            placeholder="Industry"
          />
          <input
            className="input"
            value={item.type}
            onChange={(e) => onTagChange(item.id, "type", e.target.value)}
            placeholder="Type"
          />
          <input
            className="input"
            value={item.alt ?? ""}
            onChange={(e) => onMetaChange(item.id, "alt", e.target.value)}
            placeholder="Alt text"
          />
          <select
            className="input"
            value={item.mediaType ?? "image"}
            onChange={(e) => onMetaChange(item.id, "mediaType", e.target.value)}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={Boolean(item.featured)}
              onChange={(e) => onMetaChange(item.id, "featured", e.target.checked)}
            />
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Yes</span>
          </label>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>
              {new Date(item.uploadedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
            <a className="btn secondary" href={item.url} target="_blank" rel="noreferrer">
              Open
            </a>
            <button className="btn secondary" type="button" onClick={() => onDelete(item.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TagEditor({
  item,
  onTagChange,
  compact
}: {
  item: MediaRecord;
  onTagChange: (id: string, field: "industry" | "type", value: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: compact ? 6 : 8,
        flexWrap: "wrap",
        color: "var(--muted)",
        fontSize: compact ? 12 : 13
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 6 }}>
        <span>Industry</span>
        <input
          className="input"
          style={{ width: compact ? 110 : 120 }}
          value={item.industry}
          onChange={(e) => onTagChange(item.id, "industry", e.target.value)}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 6 }}>
        <span>Type</span>
        <input
          className="input"
          style={{ width: compact ? 110 : 120 }}
          value={item.type}
          onChange={(e) => onTagChange(item.id, "type", e.target.value)}
        />
      </label>
    </div>
  );
}

function MetaEditor({
  item,
  onMetaChange,
  compact
}: {
  item: MediaRecord;
  onMetaChange: (id: string, field: "alt" | "mediaType" | "featured", value: string | boolean) => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: compact ? 6 : 8,
        flexWrap: "wrap",
        color: "var(--muted)",
        fontSize: compact ? 12 : 13
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 6 }}>
        <span>Alt</span>
        <input
          className="input"
          style={{ width: compact ? 140 : 160 }}
          value={item.alt ?? ""}
          onChange={(e) => onMetaChange(item.id, "alt", e.target.value)}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 6 }}>
        <span>Media type</span>
        <select
          className="input"
          style={{ width: compact ? 120 : 140 }}
          value={item.mediaType ?? "image"}
          onChange={(e) => onMetaChange(item.id, "mediaType", e.target.value)}
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 8 }}>
        <input
          type="checkbox"
          checked={Boolean(item.featured)}
          onChange={(e) => onMetaChange(item.id, "featured", e.target.checked)}
        />
        <span>Featured</span>
      </label>
    </div>
  );
}

function Footer({
  item,
  onDelete,
  compact = false
}: {
  item: MediaRecord;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: compact ? 6 : 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ color: "var(--muted)", fontSize: compact ? 12 : 13 }}>
        Uploaded{" "}
        {new Date(item.uploadedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        })}
      </span>
      <a className="btn secondary" href={item.url} target="_blank" rel="noreferrer">
        Open
      </a>
      <button className="btn secondary" type="button" onClick={() => onDelete(item.id)}>
        Delete
      </button>
    </div>
  );
}

function MediaThumb({ item, maxHeight }: { item: MediaRecord; maxHeight?: number }) {
  const isVideo =
    (item.mediaType ?? "image") === "video" || /\.(mp4|mov|webm|ogg)$/i.test(item.url);
  const hasTags = Boolean(item.industry || item.type);
  const showOverlay = hasTags || item.featured;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        maxHeight: maxHeight ? `${maxHeight}px` : undefined
      }}
    >
      {showOverlay ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "flex-start",
            padding: "8px 8px 18px",
            background: "linear-gradient(180deg, rgba(0,0,0,0.45), transparent)"
          }}
        >
          {item.featured ? (
            <span
              style={{
                background: "linear-gradient(135deg, #ffd166, #fca311)",
                color: "#1a1a1a",
                borderRadius: 999,
                padding: "3px 8px",
                fontSize: 12,
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
              }}
            >
              Featured
            </span>
          ) : null}
          {item.industry.length > 0 ? item.industry.map((tag) => (
            <span
              key={tag}
              style={{
                background: "rgba(255,255,255,0.9)",
                color: "var(--text)",
                borderRadius: 999,
                padding: "3px 8px",
                fontSize: 12,
                border: "1px solid var(--border)"
              }}
            >
              {tag}
            </span>
          )) : null}
          {item.type ? (
            <span
              style={{
                background: "rgba(255,255,255,0.9)",
                color: "var(--text)",
                borderRadius: 999,
                padding: "3px 8px",
                fontSize: 12,
                border: "1px solid var(--border)"
              }}
            >
              {item.type}
            </span>
          ) : null}
        </div>
      ) : null}
      {isVideo ? (
        <video
          src={item.url}
          muted
          playsInline
          loop
          style={{
            width: "100%",
            height: "auto",
            display: "block"
          }}
        />
      ) : (
        <img
          src={item.url}
          alt={item.alt ?? item.name}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            objectFit: "contain"
          }}
        />
      )}
    </div>
  );
}

function MediaModal({
  item,
  onClose,
  onTagChange,
  onMetaChange,
  onDelete
}: {
  item: MediaRecord;
  onClose: () => void;
  onTagChange: (id: string, field: "industry" | "type", value: string) => void;
  onMetaChange: (id: string, field: "alt" | "mediaType" | "featured", value: string | boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 80,
        padding: 16
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1000px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          padding: 16,
          display: "grid",
          gap: 12,
          border: "1px solid var(--border)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <h3 style={{ margin: 0 }}>{item.name}</h3>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{item.url}</span>
            {item.featured ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                  background: "rgba(255,215,0,0.1)",
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontSize: 12
                }}
              >
                <span style={{ color: "var(--text)" }}>Featured</span>
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn secondary" type="button" onClick={onClose}>
              Close
            </button>
            <a className="btn secondary" href={item.url} target="_blank" rel="noreferrer">
              Open
            </a>
          </div>
        </div>
        <div
          className="grid"
          style={{
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            alignItems: "start"
          }}
        >
          <MediaThumb item={item} />
          <div style={{ display: "grid", gap: 10 }}>
            <TagEditor item={item} onTagChange={onTagChange} />
            <MetaEditor item={item} onMetaChange={onMetaChange} />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                Uploaded{" "}
                {new Date(item.uploadedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
              <button className="btn secondary" type="button" onClick={() => onDelete(item.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
