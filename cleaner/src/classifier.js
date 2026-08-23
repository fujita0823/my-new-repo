"use strict";

// パスの断片(フォルダ名の並び)と拡張子から、ゲーマー向けのファイル/フォルダ分類を行う。
// 拡張子だけで判断せず、Steamライブラリの構造(steamapps/common/<game> など)を
// 手がかりにすることで、単純な拡張子マッチより誤爆を減らすのが狙い。

const SAVE_NAME_RE = /^(save|saves|savegame|savegames|savedata|profile|profiles|savefiles)$/i;
const CRITICAL_TOP_RE = /^(windows|system32|program files|program files \(x86\)|common files|programdata)$/i;
const SHADER_CACHE_RE = /(dxcache|d3dscache|glcache|shadercache)/i;
const REDIST_FOLDER_RE = /^_commonredist$/i;
const REDIST_FILE_RE = /^(vcredist|dxsetup|directx_\w+|oalinst|dotnetfx|vc_redist|physx).*\.(exe|msi)$/i;
const CRASH_DIR_RE = /^(crashdumps?|crash_dumps?|crashreports?)$/i;
const JUNK_EXT_RE = /\.(tmp|log|dmp|old|bak)$/i;

function segmentsOf(relPath) {
  return relPath.split(/[\\/]+/).filter(Boolean);
}

/**
 * @param {{relPath: string, name: string, isDirectory: boolean}} entry
 * @returns {{category: "critical"|"uninstall"|"safe"|"unknown", reason: string}}
 */
function classify({ relPath, name, isDirectory }) {
  const segs = segmentsOf(relPath).map((s) => s.toLowerCase());
  const lowerName = name.toLowerCase();

  // --- critical: 絶対に触らない ---
  if (SAVE_NAME_RE.test(lowerName)) {
    return { category: "critical", reason: "セーブデータの可能性が高いフォルダ名のため保護しています" };
  }
  if (segs.some((s) => CRITICAL_TOP_RE.test(s))) {
    return { category: "critical", reason: "OS/システムに関わる領域のため保護しています" };
  }
  if (lowerName === "steam.exe" || lowerName === "libraryfolders.vdf") {
    return { category: "critical", reason: "Steam本体の重要ファイルです" };
  }

  // --- uninstall: ゲーム本体そのもの。ランチャーのアンインストーラーに任せる ---
  const commonIdx = segs.indexOf("common");
  if (
    isDirectory &&
    commonIdx !== -1 &&
    segs[commonIdx - 1] === "steamapps" &&
    segs.length === commonIdx + 2
  ) {
    return {
      category: "uninstall",
      reason: "Steamのゲーム本体フォルダです。手動削除ではなくSteamのアンインストール機能を使ってください",
    };
  }

  // --- safe: 既知のジャンク。自動削除の対象候補 ---
  if (isDirectory && REDIST_FOLDER_RE.test(lowerName)) {
    return { category: "safe", reason: "DirectX/VC++などの再配布インストーラー置き場。インストール後は不要です" };
  }
  if (isDirectory && CRASH_DIR_RE.test(lowerName)) {
    return { category: "safe", reason: "クラッシュ時のダンプファイル置き場です" };
  }
  if (SHADER_CACHE_RE.test(lowerName)) {
    return { category: "safe", reason: "シェーダーキャッシュ。次回起動時に自動で再生成されます" };
  }
  if (segs.includes("steamapps") && (segs.includes("downloading") || segs.includes("temp"))) {
    return { category: "safe", reason: "Steamのダウンロード中/一時ファイルです" };
  }
  if (!isDirectory && REDIST_FILE_RE.test(lowerName)) {
    return { category: "safe", reason: "ゲームに同梱された再配布パッケージ本体です。インストール後は不要です" };
  }
  // 拡張子だけでは判断しない: steamapps 配下など、ゲーム関連と分かっている
  // 場所にある場合に限って一時/ログ/バックアップ拡張子を安全とみなす
  const inKnownGameArea = segs.includes("steamapps") || segs.includes("common");
  if (!isDirectory && inKnownGameArea && JUNK_EXT_RE.test(lowerName)) {
    return { category: "safe", reason: "ゲーム関連の一時ファイル/ログ/バックアップファイルです" };
  }

  return { category: "unknown", reason: "自動判定できませんでした。内容を確認してから判断してください" };
}

module.exports = { classify };
