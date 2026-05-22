// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import React from "react";

import { requireAppSession } from "@/lib/serverAuth";
import { ConfigurationInitializer } from "../ConfigurationInitializer";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAppSession();
  return (
    <div>
      <ConfigurationInitializer>{children}</ConfigurationInitializer>
    </div>
  );
}
