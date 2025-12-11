"use client";

import { useOne, useUpdate } from "@refinedev/core";
import { useState } from "react";
import { ComponentForm, type ComponentFormState } from "./ComponentForm";
import type { ComponentRecord } from "@/lib/admin/components";

export function ComponentEdit({ id }: { id: string }) {
  const { data, isLoading } = useOne<ComponentRecord>({ resource: "components", id });
  const { mutateAsync, isLoading: isSaving } = useUpdate<ComponentRecord>();
  const [message, setMessage] = useState<string | null>(null);

  if (isLoading || !data?.data) {
    return <p>Loading component…</p>;
  }

  const handleSubmit = async (values: ComponentFormState) => {
    const { id: _ignore, ...payload } = values;
    await mutateAsync({ resource: "components", id, values: { ...payload, updatedAt: new Date().toISOString() } });
    setMessage("Saved changes");
  };

  return (
    <ComponentForm
      initialState={data.data}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      backHref="/admin/components"
      submitLabel={{ idle: "Save changes", loading: "Saving…" }}
      message={message}
    />
  );
}
