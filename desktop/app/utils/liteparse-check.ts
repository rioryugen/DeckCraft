// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import path from "path";
import { baseDir } from "./constants";

export function getLiteParseRunnerPath(): string {
  return path.join(baseDir, "resources", "document-extraction", "liteparse_runner.mjs");
}
