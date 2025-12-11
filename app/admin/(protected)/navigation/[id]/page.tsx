import { NavigationEdit } from "@/components/admin/NavigationEdit";

export const dynamic = "force-dynamic";

export default function NavigationEditPage({ params }: { params: { id: string } }) {
  return <NavigationEdit id={params.id} />;
}
