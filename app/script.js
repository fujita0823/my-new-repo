const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const STORAGE_KEY = "theme";

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

const saved = localStorage.getItem(STORAGE_KEY);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(saved || (prefersDark ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
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

  function accentColors() {
    const styles = getComputedStyle(root);
    return {
      dot: styles.getPropertyValue("--accent").trim(),
      line: styles.getPropertyValue("--accent-4").trim(),
    };
  }

  function step() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    const { dot: dotColor, line: lineColor } = accentColors();

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

    ctx.strokeStyle = lineColor;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 110) {
          ctx.globalAlpha = (1 - dist / 110) * 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = dotColor;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
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

function makeLiquid(el) {
  const MAX_DIST = 44;
  let pointerId = null;
  let startX = 0;
  let startY = 0;

  function applyDeform(dx, dy) {
    const dist = Math.min(Math.hypot(dx, dy), MAX_DIST);
    const angle = Math.atan2(dy, dx);
    const stretch = dist / MAX_DIST;
    const sx = 1 + stretch * 0.4;
    const sy = 1 - stretch * 0.28;
    const followX = dx * 0.35;
    const followY = dy * 0.35;
    el.style.transform =
      `translate(${followX}px, ${followY}px) rotate(${angle}rad) scale(${sx}, ${sy}) rotate(${-angle}rad)`;
    const radiusShift = 50 + stretch * 30;
    el.style.borderRadius = `${radiusShift}% ${100 - radiusShift}% ${radiusShift}% ${100 - radiusShift}% / ${100 - radiusShift}% ${radiusShift}% ${100 - radiusShift}% ${radiusShift}%`;
  }

  function reset() {
    pointerId = null;
    el.classList.remove("liquid-active");
    el.style.transform = "";
    el.style.borderRadius = "";
  }

  el.addEventListener("pointerdown", (e) => {
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    el.classList.add("liquid-active");
    el.setPointerCapture(pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (pointerId === null || e.pointerId !== pointerId) return;
    applyDeform(e.clientX - startX, e.clientY - startY);
  });

  el.addEventListener("pointerup", (e) => {
    if (e.pointerId !== pointerId) return;
    reset();
  });
  el.addEventListener("pointercancel", reset);
}

document.querySelectorAll(".liquid-btn").forEach(makeLiquid);

const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in-view"));
}

function burstConfetti(x, y) {
  const styles = getComputedStyle(root);
  const colors = ["--accent", "--accent-2", "--accent-3", "--accent-4"].map((name) =>
    styles.getPropertyValue(name).trim()
  );
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 220;
    piece.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * dist + 220}px`);
    piece.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    piece.style.background = colors[i % colors.length];
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    document.body.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

let waveCount = 0;
const waveBtn = document.getElementById("wave-btn");
const waveCountEl = document.getElementById("wave-count");
if (waveBtn) {
  waveBtn.addEventListener("click", () => {
    waveCount += 1;
    waveCountEl.textContent = `${waveCount} 回 振られました`;
    const rect = waveBtn.getBoundingClientRect();
    burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
