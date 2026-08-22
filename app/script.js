const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const STORAGE_KEY = "theme";

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️ ライト" : "🌙 ダーク";
}

const saved = localStorage.getItem(STORAGE_KEY);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(saved || (prefersDark ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
});

let count = 0;
const countEl = document.getElementById("count");
document.getElementById("inc").addEventListener("click", () => {
  count += 1;
  countEl.textContent = count;
});
document.getElementById("dec").addEventListener("click", () => {
  count -= 1;
  countEl.textContent = count;
});
