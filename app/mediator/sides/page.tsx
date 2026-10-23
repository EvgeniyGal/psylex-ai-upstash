import { SidesContent } from "@/components/admin/sides-content";
import { requireSessionUserId } from "@/lib/auth-session";
import { listSideMemberships } from "@/lib/room/list-sides";

export default async function MediatorSidesPage() {
  const userId = await requireSessionUserId();
  const rows = await listSideMemberships({ createdByUserId: userId });

  return <SidesContent rows={rows} />;
}
