import Portal from "./portal";
import { applySafeLatestPortalSync } from "./sync-20260824-safe";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    await applySafeLatestPortalSync();
  } catch (error) {
    console.error("EPC operational sync failed", error);
  }
  return <Portal />;
}
