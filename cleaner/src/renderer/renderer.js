"use strict";

const pickBtn = document.getElementById("pick-btn");
const scanBtn = document.getElementById("scan-btn");
const rootPathEl = document.getElementById("root-path");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const summaryEl = document.getElementById("summary");
const safeTotalEl = document.getElementById("safe-total");
const trashBtn = document.getElementById("trash-btn");

const modal = document.getElementById("confirm-modal");
const confirmSummary = document.getElementById("confirm-summary");
const confirmList = document.getElementById("confirm-list");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmOk = document.getElementById("confirm-ok");

const CATEGORY_META = {
  safe: { title: "🟢 安全に削除できる", tag: "safe", checkable: true },
  uninstall: { title: "🟡 アンインストーラーでの削除を推奨", tag: "uninstall", checkable: false },
  critical: { title: "🔴 触ってはいけない重要ファイル", tag: "critical", checkable: false },
  unknown: { title: "❔ 自動判定できなかったもの(手動で確認)", tag: "unknown", checkable: false },
};

let selectedRoot = null;
let lastResults = [];
const checkedPaths = new Set();

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

pickBtn.addEventListener("click", async () => {
  const folder = await window.cleanerAPI.pickFolder();
  if (!folder) return;
  selectedRoot = folder;
  rootPathEl.textContent = folder;
  scanBtn.disabled = false;
});

scanBtn.addEventListener("click", async () => {
  if (!selectedRoot) return;
  resultsEl.innerHTML = "";
  summaryEl.classList.add("hidden");
  checkedPaths.clear();
  scanBtn.disabled = true;
  pickBtn.disabled = true;

  let count = 0;
  window.cleanerAPI.onProgress(() => {
    count += 1;
    statusEl.textContent = `スキャン中… ${count}件確認済み`;
  });

  lastResults = await window.cleanerAPI.scanFolder(selectedRoot);
  statusEl.textContent = `スキャン完了: ${lastResults.length}件`;
  scanBtn.disabled = false;
  pickBtn.disabled = false;
  render();
});

function render() {
  resultsEl.innerHTML = "";
  const byCategory = { safe: [], uninstall: [], critical: [], unknown: [] };
  for (const item of lastResults) {
    byCategory[item.category].push(item);
  }
  for (const [key, meta] of Object.entries(CATEGORY_META)) {
    const items = byCategory[key].sort((a, b) => b.sizeBytes - a.sizeBytes);
    if (items.length === 0) continue;

    const block = document.createElement("div");
    block.className = "category-block";
    const heading = document.createElement("h2");
    heading.textContent = `${meta.title} (${items.length}件)`;
    block.appendChild(heading);

    for (const item of items) {
      block.appendChild(renderRow(item, meta));
    }
    resultsEl.appendChild(block);
  }

  if (byCategory.safe.length > 0) {
    checkedPaths.clear();
    byCategory.safe.forEach((item) => checkedPaths.add(item.path));
    updateSummary();
    summaryEl.classList.remove("hidden");
  }
}

function renderRow(item, meta) {
  const row = document.createElement("div");
  row.className = "item-row";

  if (meta.checkable) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) checkedPaths.add(item.path);
      else checkedPaths.delete(item.path);
      updateSummary();
    });
    row.appendChild(checkbox);
  }

  const nameWrap = document.createElement("div");
  nameWrap.className = "name";
  const nameLine = document.createElement("div");
  nameLine.textContent = item.name;
  const relLine = document.createElement("span");
  relLine.className = "rel-path";
  relLine.textContent = item.relPath;
  nameWrap.appendChild(nameLine);
  nameWrap.appendChild(relLine);
  row.appendChild(nameWrap);

  const tag = document.createElement("span");
  tag.className = `tag ${meta.tag}`;
  tag.textContent = meta.tag;
  row.appendChild(tag);

  const reason = document.createElement("span");
  reason.className = "reason";
  reason.textContent = item.reason;
  row.appendChild(reason);

  const size = document.createElement("span");
  size.className = "size";
  size.textContent = formatBytes(item.sizeBytes);
  row.appendChild(size);

  return row;
}

function updateSummary() {
  const total = lastResults
    .filter((item) => checkedPaths.has(item.path))
    .reduce((sum, item) => sum + item.sizeBytes, 0);
  safeTotalEl.textContent = formatBytes(total);
  trashBtn.disabled = checkedPaths.size === 0;
}

trashBtn.addEventListener("click", () => {
  const items = lastResults.filter((item) => checkedPaths.has(item.path));
  if (items.length === 0) return;

  const total = items.reduce((sum, item) => sum + item.sizeBytes, 0);
  confirmSummary.textContent = `${items.length}件・合計 ${formatBytes(total)} をゴミ箱に移動します。`;
  confirmList.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = `${item.relPath} (${formatBytes(item.sizeBytes)})`;
    confirmList.appendChild(li);
  }
  modal.classList.remove("hidden");
});

confirmCancel.addEventListener("click", () => {
  modal.classList.add("hidden");
});

confirmOk.addEventListener("click", async () => {
  const paths = [...checkedPaths];
  confirmOk.disabled = true;
  const { errors } = await window.cleanerAPI.trashItems(paths);
  confirmOk.disabled = false;
  modal.classList.add("hidden");

  if (errors.length > 0) {
    statusEl.textContent = `一部失敗しました(${errors.length}件)。詳しくはコンソールを確認してください。`;
    console.error(errors);
  } else {
    statusEl.textContent = `${paths.length}件をゴミ箱に移動しました。`;
  }

  lastResults = lastResults.filter((item) => !checkedPaths.has(item.path));
  render();
});
