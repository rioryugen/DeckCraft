#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const appDistDir = path.join(repoRoot, "app_dist");
const packageJson = require(path.join(repoRoot, "package.json"));

function walkFiles(dir, predicate, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, results);
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function resolveSentryCli() {
  if (process.env.SENTRY_CLI_BIN) {
    return process.env.SENTRY_CLI_BIN;
  }

  const localBinary = path.join(
    repoRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "sentry-cli.cmd" : "sentry-cli",
  );

  if (fs.existsSync(localBinary)) {
    return localBinary;
  }

  return "sentry-cli";
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`Failed to run ${command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const sourceMaps = walkFiles(appDistDir, (file) => file.endsWith(".js.map"));

if (sourceMaps.length === 0) {
  console.error(
    "No Electron sourcemaps found in app_dist. Run `npm run build:ts` before uploading.",
  );
  process.exit(1);
}

const release =
  process.env.SENTRY_RELEASE || `DeckCraft-electron@${packageJson.version}`;
const urlPrefix = process.env.SENTRY_URL_PREFIX || "app:///app_dist";
const sentryCli = resolveSentryCli();

const globalArgs = [];
if (process.env.SENTRY_ORG) {
  globalArgs.push("--org", process.env.SENTRY_ORG);
}
if (process.env.SENTRY_PROJECT) {
  globalArgs.push("--project", process.env.SENTRY_PROJECT);
}

const uploadArgs = [
  ...globalArgs,
  "sourcemaps",
  "upload",
  appDistDir,
  "--release",
  release,
  "--url-prefix",
  urlPrefix,
  "--rewrite",
  "--validate",
];

if (process.env.SENTRY_DIST) {
  uploadArgs.push("--dist", process.env.SENTRY_DIST);
}

run(sentryCli, uploadArgs);
