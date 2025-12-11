"use client";

import { useDelete, useOne, useUpdate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageForm, type PageFormState } from "./PageForm";
import type { PageRecord } from "@/lib/admin/pages";

export function PageEdit({ id }: { id: string }) {
  const { data, isLoading } = useOne<PageRecord>({ resource: "pages", id });
  const { mutateAsync, isLoading: isSaving } = useUpdate<PageRecord>();
  const { mutateAsync: deleteAsync, isLoading: isDeleting } = useDelete<PageRecord>();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  if (isLoading || !data?.data) {
    return <p>Loading page…</p>;
  }

  const handleSubmit = async (values: PageFormState) => {
    const { id: _ignore, ...payload } = values;
    await mutateAsync({ resource: "pages", id, values: { ...payload, updatedAt: new Date().toISOString() } });
    setMessage("Saved changes to page");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${data.data.title}" permanently? This cannot be undone.`);
    if (!confirmed) return;
    await deleteAsync({ resource: "pages", id });
    router.push("/admin/pages");
  };

  return (
    <PageForm
      initialState={data.data}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      backHref="/admin/pages"
      submitLabel={{ idle: "Save changes", loading: "Saving…" }}
      message={message}
      onDelete={handleDelete}
      deleteLabel={{ idle: "Delete page", loading: "Deleting…" }}
      isDeleting={isDeleting}
    />
  );
}
