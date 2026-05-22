// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { NextResponse } from "next/server";
import { readUserConfigFile } from "@/lib/user-config-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const userConfigPath = process.env.USER_CONFIG_PATH;
  let fileDisabled: string | undefined;
  if (userConfigPath) {
    try {
      const parsed = readUserConfigFile<{ DISABLE_ANONYMOUS_TRACKING?: string }>(
        userConfigPath
      );
      fileDisabled = parsed?.DISABLE_ANONYMOUS_TRACKING;
    } catch {
      fileDisabled = undefined;
    }
  }
  const envDisabled =
    process.env.DISABLE_ANONYMOUS_TRACKING === "true" ||
    process.env.DISABLE_ANONYMOUS_TRACKING === "True";
  const isDisabled =
    envDisabled ||
    fileDisabled === "true" ||
    fileDisabled === "True";
  const telemetryEnabled = !isDisabled;
  return NextResponse.json({ telemetryEnabled });
}

