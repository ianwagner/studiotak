import { ComponentEdit } from "@/components/admin/ComponentEdit";

export const dynamic = "force-dynamic";

export default function ComponentEditPage({ params }: { params: { id: string } }) {
  return <ComponentEdit id={params.id} />;
}
