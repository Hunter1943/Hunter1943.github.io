#!/usr/bin/env node

import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;

try {
  ({ chromium } = require('playwright'));
} catch {
  const bundledPlaywrightPath = path.join(
    os.homedir(),
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  );
  ({ chromium } = require(bundledPlaywrightPath));
}

const inputPath = path.resolve(process.argv[2] ?? 'resume/0812.html');
const outputPath = path.resolve(
  process.argv[3] ?? 'output/pdf/resume-0812-single-page.pdf',
);

await fs.access(inputPath);
await fs.mkdir(path.dirname(outputPath), { recursive: true });

async function findChromiumExecutable() {
  const preferredPath = chromium.executablePath();

  try {
    await fs.access(preferredPath);
    return preferredPath;
  } catch {
    const cachePath = path.join(os.homedir(), 'Library/Caches/ms-playwright');
    const entries = await fs.readdir(cachePath);
    const candidates = entries
      .filter((entry) => entry.startsWith('chromium_headless_shell-'))
      .sort()
      .reverse();

    for (const entry of candidates) {
      const executablePath = path.join(
        cachePath,
        entry,
        'chrome-headless-shell-mac-arm64/chrome-headless-shell',
      );

      try {
        await fs.access(executablePath);
        return executablePath;
      } catch {
        // Try the next installed Playwright browser revision.
      }
    }
  }

  throw new Error('No usable Playwright Chromium executable was found.');
}

const browser = await chromium.launch({
  executablePath: await findChromiumExecutable(),
  headless: true,
});

try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 1200 },
    deviceScaleFactor: 1,
  });

  await page.goto(pathToFileURL(inputPath).href, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);

  const { width, height } = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;

    return {
      width: Math.max(root.scrollWidth, body.scrollWidth),
      height: Math.max(root.scrollHeight, body.scrollHeight),
    };
  });

  // One CSS pixel is 1/96 inch. A tiny height allowance avoids a rounding-only
  // second page while keeping the page visually fitted to the resume.
  await page.pdf({
    path: outputPath,
    width: `${width}px`,
    height: `${height + 2}px`,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    preferCSSPageSize: false,
  });

  const pdfInfo = spawnSync('pdfinfo', [outputPath], { encoding: 'utf8' });
  if (pdfInfo.status !== 0) {
    throw new Error('pdfinfo is required to verify the exported page count.');
  }

  const pageCount = Number(pdfInfo.stdout.match(/^Pages:\s+(\d+)$/m)?.[1]);
  if (pageCount !== 1) {
    throw new Error(`Expected one PDF page, but found ${pageCount}.`);
  }

  console.log(`Exported one-page-sized PDF: ${outputPath}`);
  console.log(`Page size: ${width}px x ${height + 2}px`);
  console.log('Verified page count: 1');
} finally {
  await browser.close();
}
