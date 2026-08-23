"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { scan } = require("../src/scanner");
const { classify } = require("../src/classifier");

async function makeFile(p, content = "x") {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content);
}

test("classifies a mock steam library correctly", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cleaner-test-"));

  // ゲーム本体
  await makeFile(path.join(root, "steamapps/common/CoolGame/game.exe"));
  await makeFile(path.join(root, "steamapps/common/CoolGame/_CommonRedist/vcredist_x64.exe"));
  await makeFile(path.join(root, "steamapps/common/CoolGame/Saves/slot1.sav"));
  await makeFile(path.join(root, "steamapps/common/CoolGame/DXCache/shader1.bin"));

  // Steamのダウンロード中/一時ファイル
  await makeFile(path.join(root, "steamapps/downloading/12345/partial.bin"));
  await makeFile(path.join(root, "steamapps/temp/leftover.tmp"));

  const results = await scan(root);
  const byRel = Object.fromEntries(results.map((r) => [r.relPath, r]));

  assert.equal(byRel["steamapps/common/CoolGame"].category, "uninstall");
  assert.equal(byRel["steamapps/common/CoolGame/_CommonRedist"].category, "safe");
  assert.equal(byRel["steamapps/common/CoolGame/Saves"].category, "critical");
  assert.equal(byRel["steamapps/common/CoolGame/DXCache"].category, "safe");
  assert.equal(byRel["steamapps/downloading"].category, "safe");
  assert.equal(byRel["steamapps/temp"].category, "safe");

  // safe / critical フォルダの中身は個別にリストされない(潜らないため)
  assert.equal(byRel["steamapps/common/CoolGame/_CommonRedist/vcredist_x64.exe"], undefined);
  assert.equal(byRel["steamapps/common/CoolGame/Saves/slot1.sav"], undefined);

  await fs.rm(root, { recursive: true, force: true });
});

test("unknown files inside a game folder are listed but not auto-selected", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cleaner-test-"));
  await makeFile(path.join(root, "steamapps/common/CoolGame/readme.txt"));

  const results = await scan(root);
  const byRel = Object.fromEntries(results.map((r) => [r.relPath, r]));

  assert.equal(byRel["steamapps/common/CoolGame/readme.txt"].category, "unknown");

  await fs.rm(root, { recursive: true, force: true });
});

test("classify: windows system paths are always critical regardless of extension", () => {
  const result = classify({
    relPath: "Windows/System32/config.tmp",
    name: "config.tmp",
    isDirectory: false,
  });
  assert.equal(result.category, "critical");
});

test("classify: same extension outside a known root is left as unknown, not auto-deleted", () => {
  const result = classify({
    relPath: "Documents/notes.tmp",
    name: "notes.tmp",
    isDirectory: false,
  });
  // steamapps 配下ではないため safe とはみなさない(拡張子だけで判断しない)
  assert.equal(result.category, "unknown");
});
