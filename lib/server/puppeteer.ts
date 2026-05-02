import fs from "node:fs";
import puppeteer from "puppeteer";

function isExistingFile(filePath: string | undefined | null): filePath is string {
  return typeof filePath === "string" && filePath.length > 0 && fs.existsSync(filePath);
}

function findWindowsChromeLikeExecutable(): string | undefined {
  const programFiles = process.env.PROGRAMFILES;
  const programFilesX86 = process.env["PROGRAMFILES(X86)"];
  const localAppData = process.env.LOCALAPPDATA;

  const candidates = [
    programFiles ? `${programFiles}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    programFilesX86 ? `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    programFiles ? `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe` : undefined,
    programFilesX86 ? `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe` : undefined,
    localAppData ? `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe` : undefined,
  ];

  return candidates.find((candidate) => isExistingFile(candidate));
}

function findMacChromeLikeExecutable(): string | undefined {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];

  return candidates.find((candidate) => isExistingFile(candidate));
}

function findLinuxChromeLikeExecutable(): string | undefined {
  const candidates = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "/usr/bin/microsoft-edge",
    "/usr/bin/microsoft-edge-stable",
  ];

  return candidates.find((candidate) => isExistingFile(candidate));
}

export function resolvePuppeteerExecutablePath(): string | undefined {
  const envExecutable = process.env.PUPPETEER_EXECUTABLE_PATH
    ?? process.env.CHROME_EXECUTABLE_PATH
    ?? process.env.CHROME_PATH;

  if (isExistingFile(envExecutable)) {
    return envExecutable;
  }

  let bundledPath: string | undefined;
  try {
    bundledPath = puppeteer.executablePath();
  } catch {
    bundledPath = undefined;
  }

  if (isExistingFile(bundledPath)) {
    return bundledPath;
  }

  switch (process.platform) {
    case "win32":
      return findWindowsChromeLikeExecutable();
    case "darwin":
      return findMacChromeLikeExecutable();
    default:
      return findLinuxChromeLikeExecutable();
  }
}

export async function launchPuppeteer(
  options: Parameters<typeof puppeteer.launch>[0] = {},
) {
  const executablePath = resolvePuppeteerExecutablePath();

  return puppeteer.launch({
    ...options,
    ...(executablePath ? { executablePath } : {}),
  });
}
