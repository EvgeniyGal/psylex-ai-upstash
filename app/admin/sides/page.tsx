import { SidesContent } from "@/components/admin/sides-content";
import { listSideMemberships } from "@/lib/room/list-sides";

export default async function AdminSidesPage() {
  const rows = await listSideMemberships();

  return <SidesContent rows={rows} showTabs />;
}
