"use client";

import { useList, useOne, useUpdate } from "@refinedev/core";
import { useState } from "react";
import { NavigationForm, type NavigationFormState } from "./NavigationForm";
import type { NavigationItemRecord } from "@/lib/admin/navigation";

export function NavigationEdit({ id }: { id: string }) {
  const { data, isLoading } = useOne<NavigationItemRecord>({ resource: "navigation", id });
  const { data: listData } = useList<NavigationItemRecord>({ resource: "navigation" });
  const { mutateAsync, isLoading: isSaving } = useUpdate<NavigationItemRecord>();
  const [message, setMessage] = useState<string | null>(null);

  if (isLoading || !data?.data) {
    return <p>Loading navigation link…</p>;
  }

  const handleSubmit = async (values: NavigationFormState) => {
    const { id: _ignore, ...payload } = values;
    await mutateAsync({ resource: "navigation", id, values: { ...payload, updatedAt: new Date().toISOString() } });
    setMessage("Saved changes to link");
  };

  const placementLabel =
    data.data.showInHeader !== false && data.data.showInFooter
      ? "Top navigation & footer"
      : data.data.showInHeader !== false
        ? "Top navigation"
        : data.data.showInFooter
          ? "Footer"
          : "Hidden";

  return (
    <NavigationForm
      initialState={{ showInHeader: true, showInFooter: false, ...data.data }}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      backHref="/admin/navigation"
      heading={`Edit ${data.data.label || "link"}`}
      placementNote={`Placement: ${placementLabel}. Manage where links appear from the Navigation page.`}
      submitLabel={{ idle: "Save changes", loading: "Saving…" }}
      message={message}
      allLinks={listData?.data ?? []}
    />
  );
}
