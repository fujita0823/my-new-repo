"use strict";

const fs = require("fs/promises");
const path = require("path");
const { classify } = require("./classifier");

const MAX_DEPTH = 6;

async function dirSize(fullPath) {
  let total = 0;
  let entries;
  try {
    entries = await fs.readdir(fullPath, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const p = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      total += await dirSize(p);
    } else {
      total += await fileSize(p);
    }
  }
  return total;
}

async function fileSize(p) {
  try {
    const stat = await fs.stat(p);
    return stat.size;
  } catch {
    return 0;
  }
}

/**
 * rootPath 以下を再帰的に走査し、各エントリを分類する。
 * "safe" と "critical" に分類されたフォルダはそれ以上潜らない
 * (safeはまるごと削除対象なので不要、criticalは踏み込みすぎを避けるため)。
 *
 * @param {string} rootPath
 * @param {{onEntry?: (item: object) => void}} [options]
 */
async function scan(rootPath, { onEntry } = {}) {
  const results = [];

  async function walk(currentPath, relParts, depth) {
    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relParts2 = relParts.concat(entry.name);
      const relPath = relParts2.join("/");
      const isDirectory = entry.isDirectory();
      const { category, reason } = classify({ relPath, name: entry.name, isDirectory });
      const sizeBytes = isDirectory ? await dirSize(fullPath) : await fileSize(fullPath);

      const item = { path: fullPath, relPath, name: entry.name, isDirectory, category, reason, sizeBytes };
      results.push(item);
      if (onEntry) onEntry(item);

      if (isDirectory && depth < MAX_DEPTH && category !== "critical" && category !== "safe") {
        await walk(fullPath, relParts2, depth + 1);
      }
    }
  }

  await walk(rootPath, [], 0);
  return results;
}

module.exports = { scan, dirSize };
