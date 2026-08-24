import Portal from "./portal";
import { applySafeLatestPortalSync } from "./sync-20260824-safe";
import { applyEmailMonthSync } from "./sync-email-month-20260824";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    await applySafeLatestPortalSync();
    await applyEmailMonthSync();
  } catch (error) {
    console.error("EPC operational sync failed", error);
  }
  return <Portal />;
}
