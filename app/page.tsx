import Portal from "./portal";
import { applyLatestPortalSync } from "./sync-20260824";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    await applyLatestPortalSync();
  } catch (error) {
    console.error("EPC operational sync failed", error);
  }
  return <Portal />;
}
