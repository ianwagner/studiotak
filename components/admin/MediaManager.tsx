"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type MediaField = "industry" | "type" | "alt" | "mediaType" | "featured" | "status";
type FeaturedFilter = "all" | "featured" | "unfeatured";
type StatusFilter = "all" | "published" | "draft";

const emptyState: MediaFormState = {
  files: [],
  industry: "",
  type: "",
  alt: "",
  mediaType: "image",
  featured: false
};

const formatFileName = (name: string) => (name.length > 10 ? `${name.slice(0, 10)}...` : name);

/* ─── Pill styles ────────────────────────────────────────────── */
const pillBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  borderRadius: 999,
  fontSize: 12,
  padding: "3px 10px",
  border: "1px solid var(--border)",
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  lineHeight: 1.4,
};

const pillInactive: React.CSSProperties = {
  ...pillBase,
  background: "var(--muted-surface)",
  color: "var(--text)",
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: "var(--accent)",
  color: "#fff",
  borderColor: "var(--accent)",
};

const tagPillSmall: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  borderRadius: 999,
  fontSize: 11,
  padding: "2px 8px",
  background: "var(--muted-surface)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  whiteSpace: "nowrap",
};

const statusPublished: React.CSSProperties = {
  ...pillBase,
  background: "rgba(34,197,94,0.12)",
  color: "#16a34a",
  borderColor: "rgba(34,197,94,0.3)",
  fontSize: 11,
  padding: "2px 8px",
};

const statusDraft: React.CSSProperties = {
  ...pillBase,
  background: "rgba(245,213,101,0.2)",
  color: "#92700c",
  borderColor: "rgba(245,213,101,0.4)",
  fontSize: 11,
  padding: "2px 8px",
};

/* ─── Main component ─────────────────────────────────────────── */
export function MediaManager() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [form, setForm] = useState<MediaFormState>(emptyState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "masonry">("masonry");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndustryTags, setActiveIndustryTags] = useState<Set<string>>(new Set());
  const [tagFilterMode, setTagFilterMode] = useState<"or" | "and">("or");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMediaType, setFilterMediaType] = useState<"all" | "image" | "video">("all");
  const [filterFeatured, setFilterFeatured] = useState<FeaturedFilter>("all");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [migrating, setMigrating] = useState(false);
  const firebaseReady = useMemo(() => Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY), []);

  const needsStatusMigration = useMemo(
    () => items.length > 0 && items.some((item) => !item.status),
    [items]
  );

  const migrateStatuses = async () => {
    if (!firebaseReady) return;
    try {
      setMigrating(true);
      await ensureFirebaseDevAuth();
      const db = getFirestore(getFirebaseApp());
      const toUpdate = items.filter((item) => !item.status);
      await Promise.all(
        toUpdate.map((item) => updateDoc(doc(db, "media", item.id), { status: "published" }))
      );
      setItems((prev) =>
        prev.map((item) => (!item.status ? { ...item, status: "published" as const } : item))
      );
    } catch (err) {
      console.error("Status migration failed", err);
      setError("Failed to migrate statuses");
    } finally {
      setMigrating(false);
    }
  };

  const loadMedia = async () => {
    if (!firebaseReady) return;
    try {
      const db = getFirestore(getFirebaseApp());
      const mediaRef = collection(db, "media");
      const snapshot = await getDocs(query(mediaRef, orderBy("uploadedAt", "desc")));
      const data: MediaRecord[] = snapshot.docs.map((d) => {
        const raw = d.data() as any;
        return {
          id: d.id,
          name: raw.name,
          url: raw.url,
          industry: Array.isArray(raw.industry) ? raw.industry : (typeof raw.industry === "string" && raw.industry.trim() ? [raw.industry.trim()] : []),
          type: raw.type ?? "",
          uploadedAt: raw.uploadedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
          alt: raw.alt ?? "",
          mediaType: raw.mediaType ?? "image",
          featured: Boolean(raw.featured),
          status: raw.status || undefined,
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
            featured: form.featured ?? false,
            status: "draft" as const,
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
      const docRef = doc(db, "media", id);
      const normalizedValue = field === "featured" ? Boolean(value) : value;
      await updateDoc(docRef, { [field]: normalizedValue });
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

  const handleIndustryTagsUpdate = (id: string, tags: string[]) => {
    handleFieldChange(id, "industry", tags);
  };

  const handleStatusToggle = (id: string, current: MediaRecord["status"]) => {
    const next = current === "published" ? "draft" : "published";
    handleFieldChange(id, "status", next);
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

  /* ─── Computed ─────────────────────────────────────────────── */

  const industryTagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.industry) {
        if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);

  const typeFilters = useMemo(() => {
    const unique = new Set(items.map((item) => item.type).filter(Boolean));
    return Array.from(unique);
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        [item.name, item.industry.join(" "), item.type, item.alt, item.url]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q));
      const matchesIndustry =
        activeIndustryTags.size === 0 ||
        (tagFilterMode === "or"
          ? item.industry.some((tag) => activeIndustryTags.has(tag))
          : Array.from(activeIndustryTags).every((tag) => item.industry.includes(tag)));
      const matchesType = filterType === "all" || item.type === filterType;
      const matchesMediaType = filterMediaType === "all" || (item.mediaType ?? "image") === filterMediaType;
      const matchesFeatured =
        filterFeatured === "all" ||
        (filterFeatured === "featured" ? Boolean(item.featured) : !Boolean(item.featured));
      const matchesStatus =
        filterStatus === "all" || (item.status ?? "draft") === filterStatus;
      return matchesSearch && matchesIndustry && matchesType && matchesMediaType && matchesFeatured && matchesStatus;
    });
  }, [items, searchTerm, activeIndustryTags, tagFilterMode, filterType, filterMediaType, filterFeatured, filterStatus]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const clearAllFilters = () => {
    setSearchTerm("");
    setActiveIndustryTags(new Set());
    setFilterType("all");
    setFilterMediaType("all");
    setFilterFeatured("all");
    setFilterStatus("all");
  };

  const toggleIndustryTag = (tag: string) => {
    setActiveIndustryTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    activeIndustryTags.size > 0 ||
    filterType !== "all" ||
    filterMediaType !== "all" ||
    filterFeatured !== "all" ||
    filterStatus !== "all";

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
                placeholder="Example, Logo, etc."
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
        {/* Header */}
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
                className={`btn secondary${viewMode === "masonry" ? " active" : ""}`}
                onClick={() => setViewMode("masonry")}
              >
                Masonry
              </button>
              <button
                type="button"
                className={`btn secondary${viewMode === "list" ? " active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Migration banner */}
        {needsStatusMigration ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "rgba(245,213,101,0.15)",
              border: "1px solid rgba(245,213,101,0.4)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text)" }}>
              {items.filter((i) => !i.status).length} assets have no publish status.
              Set them all to <strong>Published</strong> so they stay visible on the site.
            </span>
            <button
              className="btn"
              type="button"
              disabled={migrating}
              onClick={migrateStatuses}
              style={{ flexShrink: 0 }}
            >
              {migrating ? "Migrating…" : "Publish all"}
            </button>
          </div>
        ) : null}

        {/* Search */}
        <div style={{ marginTop: 10 }}>
          <input
            className="input"
            style={{ width: "100%" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, tag, alt, or url"
          />
        </div>

        {/* Tag pills */}
        {industryTagCounts.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, alignItems: "center" }}>
            {industryTagCounts.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                style={activeIndustryTags.has(tag) ? pillActive : pillInactive}
                onClick={() => toggleIndustryTag(tag)}
              >
                {tag} <span style={{ opacity: 0.7 }}>({count})</span>
              </button>
            ))}
            {activeIndustryTags.size > 1 ? (
              <div className="btn-group" style={{ display: "flex", gap: 2, marginLeft: 4 }}>
                <button
                  type="button"
                  style={{
                    ...pillBase,
                    background: tagFilterMode === "or" ? "var(--text)" : "var(--muted-surface)",
                    color: tagFilterMode === "or" ? "#fff" : "var(--muted)",
                    borderColor: tagFilterMode === "or" ? "var(--text)" : "var(--border)",
                    fontSize: 11,
                    padding: "2px 8px",
                  }}
                  onClick={() => setTagFilterMode("or")}
                >
                  OR
                </button>
                <button
                  type="button"
                  style={{
                    ...pillBase,
                    background: tagFilterMode === "and" ? "var(--text)" : "var(--muted-surface)",
                    color: tagFilterMode === "and" ? "#fff" : "var(--muted)",
                    borderColor: tagFilterMode === "and" ? "var(--text)" : "var(--border)",
                    fontSize: 11,
                    padding: "2px 8px",
                  }}
                  onClick={() => setTagFilterMode("and")}
                >
                  AND
                </button>
              </div>
            ) : null}
            {activeIndustryTags.size > 0 ? (
              <button
                type="button"
                onClick={() => setActiveIndustryTags(new Set())}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "2px 6px",
                  textDecoration: "underline",
                }}
              >
                Clear tags
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Dropdown filters */}
        <div
          className="grid"
          style={{
            gap: 8,
            marginTop: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            alignItems: "center"
          }}
        >
          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
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
          allItemsCount={items.length}
          viewMode={viewMode}
          hasActiveFilters={hasActiveFilters}
          onTagChange={handleTagChange}
          onIndustryTagsUpdate={handleIndustryTagsUpdate}
          onStatusToggle={handleStatusToggle}
          onMetaChange={handleMetaChange}
          onDelete={handleDelete}
          onSelectItem={setSelectedId}
          onClearFilters={clearAllFilters}
        />
      </div>
      {selectedItem ? (
        <MediaModal
          item={selectedItem}
          onClose={() => setSelectedId(null)}
          onTagChange={handleTagChange}
          onIndustryTagsUpdate={handleIndustryTagsUpdate}
          onStatusToggle={handleStatusToggle}
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

/* ─── InlineTagEditor ────────────────────────────────────────── */
function InlineTagEditor({
  tags,
  onUpdate,
}: {
  tags: string[];
  onUpdate: (newTags: string[]) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const addTag = () => {
    const val = newTag.trim();
    if (val && !tags.includes(val)) {
      onUpdate([...tags, val]);
    }
    setNewTag("");
    setIsAdding(false);
  };

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {tags.map((tag) => (
        <span key={tag} style={tagPillSmall}>
          {tag}
          <button
            type="button"
            onClick={() => onUpdate(tags.filter((t) => t !== tag))}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 11,
              lineHeight: 1,
            }}
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      {isAdding ? (
        <input
          ref={inputRef}
          className="input"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTag(); }
            if (e.key === "Escape") { setNewTag(""); setIsAdding(false); }
          }}
          onBlur={addTag}
          style={{ width: 80, fontSize: 11, padding: "2px 6px", borderRadius: 8 }}
          placeholder="Tag…"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          style={{
            ...tagPillSmall,
            cursor: "pointer",
            color: "var(--muted)",
            background: "transparent",
            borderStyle: "dashed",
          }}
          aria-label="Add tag"
        >
          +
        </button>
      )}
    </div>
  );
}

/* ─── StatusPill ──────────────────────────────────────────────── */
function StatusPill({
  status,
  onClick,
}: {
  status: MediaRecord["status"];
  onClick: () => void;
}) {
  const isPublished = status === "published";
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={isPublished ? statusPublished : statusDraft}
    >
      {isPublished ? "Published" : "Draft"}
    </button>
  );
}

/* ─── MediaLibrary ───────────────────────────────────────────── */
function MediaLibrary({
  items,
  allItemsCount,
  viewMode,
  hasActiveFilters,
  onTagChange,
  onIndustryTagsUpdate,
  onStatusToggle,
  onMetaChange,
  onDelete,
  onSelectItem,
  onClearFilters,
}: {
  items: MediaRecord[];
  allItemsCount: number;
  viewMode: "list" | "masonry";
  hasActiveFilters: boolean;
  onTagChange: (id: string, field: "industry" | "type", value: string) => void;
  onIndustryTagsUpdate: (id: string, tags: string[]) => void;
  onStatusToggle: (id: string, current: MediaRecord["status"]) => void;
  onMetaChange: (id: string, field: "alt" | "mediaType" | "featured", value: string | boolean) => void;
  onDelete: (id: string) => void;
  onSelectItem: (id: string) => void;
  onClearFilters: () => void;
}) {
  if (!items.length) {
    const isEmpty = allItemsCount === 0;
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
        <div style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>
          {isEmpty ? "No media uploaded yet" : "No matches"}
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 14 }}>
          {isEmpty
            ? "Upload your first asset using the form above."
            : "No media items match your current filters."}
        </p>
        {!isEmpty && hasActiveFilters ? (
          <button className="btn secondary" type="button" onClick={onClearFilters}>
            Clear all filters
          </button>
        ) : null}
      </div>
    );
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
              gap: 6,
              cursor: "pointer",
              border: "1px solid var(--border)"
            }}
          >
            <MediaThumb item={item} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <strong style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {item.name}
              </strong>
              <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>
                  {(item.mediaType ?? "image").toUpperCase()}
                </span>
                <StatusPill
                  status={item.status ?? "draft"}
                  onClick={() => onStatusToggle(item.id, item.status ?? "draft")}
                />
              </div>
            </div>
            <InlineTagEditor
              tags={item.industry}
              onUpdate={(tags) => onIndustryTagsUpdate(item.id, tags)}
            />
          </article>
        ))}
      </div>
    );
  }

  const gridTemplateColumns =
    "120px minmax(140px, 1.1fr) minmax(120px, 0.9fr) minmax(100px, 0.7fr) 80px minmax(160px, 1fr) 110px 100px 150px";

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
        <span>Status</span>
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
          <InlineTagEditor
            tags={item.industry}
            onUpdate={(tags) => onIndustryTagsUpdate(item.id, tags)}
          />
          <input
            className="input"
            value={item.type}
            onChange={(e) => onTagChange(item.id, "type", e.target.value)}
            placeholder="Type"
            style={{ fontSize: 13 }}
          />
          <StatusPill
            status={item.status ?? "draft"}
            onClick={() => onStatusToggle(item.id, item.status ?? "draft")}
          />
          <input
            className="input"
            value={item.alt ?? ""}
            onChange={(e) => onMetaChange(item.id, "alt", e.target.value)}
            placeholder="Alt text"
            style={{ fontSize: 13 }}
          />
          <select
            className="input"
            value={item.mediaType ?? "image"}
            onChange={(e) => onMetaChange(item.id, "mediaType", e.target.value)}
            style={{ fontSize: 13 }}
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

/* ─── MediaThumb ─────────────────────────────────────────────── */
function MediaThumb({ item, maxHeight }: { item: MediaRecord; maxHeight?: number }) {
  const isVideo =
    (item.mediaType ?? "image") === "video" || /\.(mp4|mov|webm|ogg)$/i.test(item.url);
  const hasTags = Boolean(item.industry?.length || item.type);
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

/* ─── MediaModal ─────────────────────────────────────────────── */
function MediaModal({
  item,
  onClose,
  onTagChange,
  onIndustryTagsUpdate,
  onStatusToggle,
  onMetaChange,
  onDelete
}: {
  item: MediaRecord;
  onClose: () => void;
  onTagChange: (id: string, field: "industry" | "type", value: string) => void;
  onIndustryTagsUpdate: (id: string, tags: string[]) => void;
  onStatusToggle: (id: string, current: MediaRecord["status"]) => void;
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>{item.name}</h3>
            <StatusPill
              status={item.status ?? "draft"}
              onClick={() => onStatusToggle(item.id, item.status ?? "draft")}
            />
            {item.featured ? (
              <span
                style={{
                  background: "rgba(255,215,0,0.1)",
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  padding: "3px 8px",
                  fontSize: 12,
                  color: "var(--text)"
                }}
              >
                Featured
              </span>
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
          <div style={{ display: "grid", gap: 12 }}>
            <div className="field-group">
              <label style={{ color: "var(--muted)", fontSize: 13 }}>Industry tags</label>
              <InlineTagEditor
                tags={item.industry}
                onUpdate={(tags) => onIndustryTagsUpdate(item.id, tags)}
              />
            </div>
            <div className="field-group">
              <label style={{ color: "var(--muted)", fontSize: 13 }}>Type</label>
              <input
                className="input"
                value={item.type}
                onChange={(e) => onTagChange(item.id, "type", e.target.value)}
                placeholder="Example, Logo, etc."
              />
            </div>
            <div className="field-group">
              <label style={{ color: "var(--muted)", fontSize: 13 }}>Alt text</label>
              <input
                className="input"
                value={item.alt ?? ""}
                onChange={(e) => onMetaChange(item.id, "alt", e.target.value)}
                placeholder="Describe the media"
              />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 13 }}>
                <span>Media type</span>
                <select
                  className="input"
                  style={{ width: 120 }}
                  value={item.mediaType ?? "image"}
                  onChange={(e) => onMetaChange(item.id, "mediaType", e.target.value)}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={Boolean(item.featured)}
                  onChange={(e) => onMetaChange(item.id, "featured", e.target.checked)}
                />
                <span>Featured</span>
              </label>
            </div>
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
