"use client";

import { useCreate, useList } from "@refinedev/core";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NavigationForm, type NavigationFormState } from "./NavigationForm";
import type { NavigationItemRecord } from "@/lib/admin/navigation";

export function NavigationCreate() {
  const { data } = useList<NavigationItemRecord>({ resource: "navigation" });
  const existingCount = data?.data?.length ?? 0;
  const allLinks = data?.data ?? [];
  const { mutateAsync, isLoading } = useCreate<NavigationFormState>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const placementTarget = searchParams.get("target") === "footer" ? "footer" : "header";

  const defaultState: NavigationFormState = useMemo(
    () => ({
      id: undefined,
      label: "New link",
      href: "#",
      order: existingCount + 1,
      isExternal: false,
      showInHeader: placementTarget !== "footer",
      showInFooter: placementTarget === "footer",
      footerSection: placementTarget === "footer" ? "Links" : ""
    }),
    [existingCount, placementTarget]
  );

  const handleSubmit = async (values: NavigationFormState) => {
    const { id: _ignore, ...payload } = values;
    const result = await mutateAsync({
      resource: "navigation",
      values: { ...payload, updatedAt: new Date().toISOString() }
    });
    const newId = result?.data?.id;
    if (newId) {
      router.push(`/admin/navigation/${newId}`);
    } else {
      router.push("/admin/navigation");
    }
  };

  return (
    <NavigationForm
      key={existingCount}
      initialState={defaultState}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      backHref="/admin/navigation"
      heading={placementTarget === "footer" ? "Create footer link" : "Create top navigation link"}
      intro={
        placementTarget === "footer"
          ? "Add a link that will appear in the site footer."
          : "Add a link that will appear in the top navigation."
      }
      placementNote={
        placementTarget === "footer"
          ? "This link will be placed in the footer. Use the Navigation page to add it to the header if needed."
          : "This link will be placed in the top navigation. Use the Navigation page to add it to the footer if needed."
      }
      submitLabel={{ idle: "Create link", loading: "Creating…" }}
      allLinks={allLinks}
    />
  );
}
