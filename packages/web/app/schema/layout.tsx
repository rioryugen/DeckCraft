// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import type { ReactNode } from "react";

import { requireAppSession } from "@/lib/serverAuth";

/**
 * /schema is outside the (presentation-generator) group; same session gate as the main app.
 */
export default async function SchemaLayout({ children }: { children: ReactNode }) {
  await requireAppSession();
  return <>{children}</>;
}
