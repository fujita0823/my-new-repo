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

const canvas = document.getElementById("particles");
if (canvas) {
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const pointer = { x: null, y: null };
  let particles = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * DPR;
    canvas.height = rect.height * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function spawn() {
    const rect = canvas.getBoundingClientRect();
    const count = Math.max(24, Math.floor((rect.width * rect.height) / 9000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function step() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    const dotColor = isDark() ? "rgba(139,147,255,0.9)" : "rgba(88,101,242,0.8)";
    const lineColor = isDark() ? "139,147,255" : "88,101,242";

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > rect.width) p.vx *= -1;
      if (p.y < 0 || p.y > rect.height) p.vy *= -1;

      if (pointer.x !== null) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 90 && dist > 0.01) {
          const force = (90 - dist) / 90;
          p.vx += (dx / dist) * force * 0.6;
          p.vy += (dy / dist) * force * 0.6;
        }
      }
      p.vx *= 0.98;
      p.vy *= 0.98;
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 110) {
          ctx.strokeStyle = `rgba(${lineColor},${(1 - dist / 110) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = dotColor;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  function setPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
  }

  canvas.addEventListener("pointermove", (e) => setPointer(e.clientX, e.clientY));
  canvas.addEventListener("pointerleave", () => {
    pointer.x = null;
    pointer.y = null;
  });

  window.addEventListener("resize", () => {
    resize();
    spawn();
  });

  resize();
  spawn();
  requestAnimationFrame(step);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
