"use client";

import { useCreate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { ComponentForm, type ComponentFormState } from "./ComponentForm";

const defaultComponent: ComponentFormState = {
  id: undefined,
  kind: "feature",
  title: "New feature",
  body: "",
  icon: { url: "", alt: "", type: "image" },
  industry: "",
  type: ""
};

export function ComponentCreate() {
  const { mutateAsync, isLoading } = useCreate<ComponentFormState>();
  const router = useRouter();

  const handleSubmit = async (values: ComponentFormState) => {
    const { id: _ignore, ...payload } = values;
    const result = await mutateAsync({
      resource: "components",
      values: { ...payload, updatedAt: new Date().toISOString() }
    });
    const newId = result?.data?.id;
    if (newId) {
      router.push(`/admin/components/${newId}`);
    } else {
      router.push("/admin/components");
    }
  };

  return (
    <ComponentForm
      initialState={defaultComponent}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      backHref="/admin/components"
      heading="Create component"
      intro="Reusable feature component with icon, copy, and tags."
      submitLabel={{ idle: "Create component", loading: "Creating…" }}
    />
  );
}
