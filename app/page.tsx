import Portal from "./portal";
import { applySafeLatestPortalSync } from "./sync-20260824-safe";
import { applyEmailMonthSync } from "./sync-email-month-20260824";
import { applySubmissionSync20260824 } from "./sync-submissions-20260824";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    await applySafeLatestPortalSync();
    await applyEmailMonthSync();
    await applySubmissionSync20260824();
  } catch (error) {
    console.error("EPC operational sync failed", error);
  }
  return <Portal />;
}
