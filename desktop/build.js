// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

const builder = require("electron-builder")
const fs = require("fs")
const path = require("path")

// AfterPack hook: set executable permissions on macOS; no-op on Windows
const afterPack = async (context) => {
  if (context.electronPlatformName === "darwin") {
    const appPath = context.appOutDir
    const appBundleName = `${context.packager.appInfo.productFilename}.app`
    const resourcesRoot = path.join(
      appPath,
      appBundleName,
      "Contents",
      "Resources",
      "app",
      "resources"
    )
    const fastapiPath = path.join(resourcesRoot, "fastapi", "fastapi")
    const exportPyDir = path.join(resourcesRoot, "export", "py")
    const converterCandidates = [
      `convert-${process.platform}-${process.arch}`,
      `convert-${process.platform}`,
      "convert",
    ]

    console.log("Setting executable permissions for FastAPI binary...")
    console.log("FastAPI path:", fastapiPath)

    if (fs.existsSync(fastapiPath)) {
      fs.chmodSync(fastapiPath, 0o755)
      console.log("✓ Execute permissions set for FastAPI")
    } else {
      console.warn("⚠ FastAPI binary not found at:", fastapiPath)
    }

    console.log("Setting executable permissions for export converter binary...")
    let converterFound = false
    for (const candidate of converterCandidates) {
      const candidatePath = path.join(exportPyDir, candidate)
      if (fs.existsSync(candidatePath)) {
        fs.chmodSync(candidatePath, 0o755)
        console.log("✓ Execute permissions set for converter:", candidatePath)
        converterFound = true
      }
    }
    if (!converterFound) {
      console.warn("⚠ No converter binary found in:", exportPyDir)
    }

    const fastapiDir = path.join(resourcesRoot, "fastapi")
    if (fs.existsSync(fastapiDir)) {
      console.log("FastAPI directory contents:", fs.readdirSync(fastapiDir))
    }

    if (fs.existsSync(exportPyDir)) {
      console.log("Export py directory contents:", fs.readdirSync(exportPyDir))
    }
  }
}

const config = {
  appId: "DeckCraftAI.DeckCraft",
  asar: false,
  copyright: "Copyright © 2026 DeckCraft",
  directories: {
    output: "dist",
    buildResources: "build",
  },
  files: [
    "resources",
    "app_dist",
    "node_modules",
    "NOTICE"
  ],
  afterPack,
  mac: {
    artifactName: "DeckCraft-${version}.${ext}",
    target: ["dmg"],
    category: "public.app-category.productivity",
    icon: "resources/ui/assets/images/DeckCraft_short_filled.png",
  },
  linux: {
    artifactName: "DeckCraft-${version}.${ext}",
    target: ["AppImage", "deb"],
    icon: "build/icons",
  },
  deb: {
    afterInstall: "build/after-install.tpl",
    recommends: ["libreoffice"],
  },
  win: {
    target: ["nsis", "appx"],
    icon: "build/icon.ico",
    artifactName: "DeckCraft-${version}.${ext}",
    executableName: "DeckCraft",
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    installerIcon: "build/icon.ico",
    uninstallerIcon: "build/icon.ico",
    installerHeaderIcon: "build/icon.ico",
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "DeckCraft",
    uninstallDisplayName: "DeckCraft",
  },
  appx: {
    identityName: "DeckCraftAI.DeckCraft",
    publisher: "CN=8A2C57B5-F1C6-473A-93EE-2E9B72134341",
    publisherDisplayName: "DeckCraft Inc.",
    applicationId: "DeckCraftAI.DeckCraft",
  },
}

builder.build({ config })