// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { NextResponse } from "next/server";
import { readUserConfigFile } from "@/lib/user-config-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const userConfigPath = process.env.USER_CONFIG_PATH;

  let keyFromFile = "";
  if (userConfigPath) {
    try {
      const cfg = readUserConfigFile<{ OPENAI_API_KEY?: string }>(userConfigPath);
      keyFromFile = cfg?.OPENAI_API_KEY || "";
    } catch {
      keyFromFile = "";
    }
  }
  const keyFromEnv = process.env.OPENAI_API_KEY || "";
  const hasKey = Boolean((keyFromFile || keyFromEnv).trim());

  return NextResponse.json({ hasKey });
}
