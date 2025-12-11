import { PageEdit } from "@/components/admin/PageEdit";

export const dynamic = "force-dynamic";

export default function PageEditPage({ params }: { params: { id: string } }) {
  return <PageEdit id={params.id} />;
}
