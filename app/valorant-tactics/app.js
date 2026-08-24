// VALORANT 戦術ボード。
// 依存ライブラリなしのバニラJS。data.js のマップ/エージェント定義を使い、
// SVG上にトークン・マーカー・矢印・テキストを配置してラウンドプランを組み立てる。

const STORAGE_DRAFT = 'vt_draft_v1';
const STORAGE_SAVED = 'vt_saved_strats_v1';
const PALETTE = [
  { id: 'white', hex: '#f4f4f5' },
  { id: 'red', hex: '#ef4444' },
  { id: 'cyan', hex: '#22d3ee' },
  { id: 'yellow', hex: '#eab308' },
  { id: 'violet', hex: '#7c5cff' },
];

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function getMap(id) { return VCT_MAPS.find((m) => m.id === id) || VCT_MAPS[0]; }
function getAgent(id) { return VCT_AGENTS.find((a) => a.id === id); }

function emptyStep(name) {
  return { id: uid('step'), name, tokens: [], markers: [], strokes: [], texts: [] };
}
function createStrat(mapId) {
  return { id: uid('strat'), name: '無題のストラット', mapId, steps: [emptyStep('ステップ1')] };
}

const state = {
  strat: null,
  activeStep: 0,
  mode: 'select', // select | arrow | marker | text | eraser
  side: 'attack',
  placingAgent: null, // { agentId }
  color: PALETTE[0].hex,
  history: [],
  future: [],
  playTimer: null,
};

function activeStep() {
  return state.strat.steps[state.activeStep];
}

// ---------- 永続化 ----------

function encodeStrat(strat) {
  const bytes = new TextEncoder().encode(JSON.stringify(strat));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeStrat(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

let autosaveTimer = null;
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_DRAFT, JSON.stringify({ strat: state.strat, activeStep: state.activeStep }));
  }, 350);
}

function loadSavedList() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_SAVED) || '[]');
  } catch (e) {
    return [];
  }
}
function persistSavedList(list) {
  localStorage.setItem(STORAGE_SAVED, JSON.stringify(list));
}

function saveCurrentAs() {
  const name = prompt('保存名を入力してください', state.strat.name || '無題のストラット');
  if (!name) return;
  state.strat.name = name;
  const list = loadSavedList();
  const idx = list.findIndex((s) => s.id === state.strat.id);
  const record = { ...clone(state.strat), updatedAt: Date.now() };
  if (idx >= 0) list[idx] = record; else list.push(record);
  persistSavedList(list);
  renderSavedList();
  renderTopbar();
  scheduleAutosave();
}

function loadStrat(strat) {
  state.strat = clone(strat);
  state.activeStep = 0;
  state.history = [];
  state.future = [];
  state.placingAgent = null;
  state.mode = 'select';
  renderAll();
  scheduleAutosave();
}

function deleteSaved(id) {
  if (!confirm('このストラットを削除しますか?')) return;
  persistSavedList(loadSavedList().filter((s) => s.id !== id));
  renderSavedList();
}

// ---------- 履歴(undo/redo) ----------

function pushHistory() {
  state.history.push(clone(activeStep()));
  if (state.history.length > 40) state.history.shift();
  state.future = [];
}
function undo() {
  if (!state.history.length) return;
  state.future.push(clone(activeStep()));
  state.strat.steps[state.activeStep] = state.history.pop();
  renderBoardContent();
  scheduleAutosave();
}
function redo() {
  if (!state.future.length) return;
  state.history.push(clone(activeStep()));
  state.strat.steps[state.activeStep] = state.future.pop();
  renderBoardContent();
  scheduleAutosave();
}

// ---------- ジオメトリ ----------

function toSvgPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const m = svg.getScreenCTM().inverse();
  const p = pt.matrixTransform(m);
  return { x: Math.min(1000, Math.max(0, p.x)), y: Math.min(1000, Math.max(0, p.y)) };
}
function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// ---------- 描画: マップ背景 ----------

function renderMap() {
  const layer = document.getElementById('map-layer');
  layer.innerHTML = '';
  const map = getMap(state.strat.mapId);

  layer.appendChild(svgEl('rect', { x: 0, y: 0, width: 1000, height: 1000, fill: 'var(--board-bg)', rx: 18 }));
  layer.appendChild(svgEl('rect', {
    x: 20, y: 20, width: 960, height: 960, rx: 12, class: 'map-outline',
  }));

  map.spawns.forEach((s) => {
    layer.appendChild(svgEl('rect', {
      x: s.x, y: s.y, width: s.w, height: s.h, rx: 10,
      class: `map-spawn map-spawn-${s.side}`,
    }));
    const label = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2, class: 'map-spawn-label' });
    label.textContent = s.label;
    layer.appendChild(label);
  });

  (map.corridors || []).forEach((c) => {
    layer.appendChild(svgEl('rect', {
      x: c.x, y: c.y, width: c.w, height: c.h, rx: 8, class: 'map-corridor',
    }));
    const label = svgEl('text', { x: c.x + c.w / 2, y: c.y + c.h / 2, class: 'map-corridor-label' });
    label.textContent = c.label;
    layer.appendChild(label);
  });

  map.zones.forEach((z) => {
    layer.appendChild(svgEl('rect', {
      x: z.x, y: z.y, width: z.w, height: z.h, rx: 10, class: 'map-zone',
    }));
    const label = svgEl('text', { x: z.x + z.w / 2, y: z.y + z.h / 2, class: 'map-zone-label' });
    label.textContent = z.label;
    layer.appendChild(label);
  });
}

// ---------- 描画: トークン/マーカー/矢印/テキスト ----------

function agentAbbrev(agent) {
  const letters = agent.name.replace(/[^A-Za-z]/g, '');
  return (letters.slice(0, 2) || agent.name.slice(0, 2)).toUpperCase();
}

function renderBoardContent() {
  const layer = document.getElementById('content-layer');
  layer.innerHTML = '';
  const step = activeStep();
  const svg = document.getElementById('board-svg');

  // 矢印(ストローク)
  step.strokes.forEach((s) => {
    const g = svgEl('g', { class: 'stroke-group' });
    const hit = svgEl('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: 'stroke-hit' });
    const line = svgEl('line', {
      x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, stroke: s.color, class: 'stroke-line',
      'marker-end': `url(#arrowhead-${colorId(s.color)})`,
    });
    g.appendChild(hit);
    g.appendChild(line);
    layer.appendChild(g);

    hit.addEventListener('pointerdown', (evt) => {
      if (state.mode === 'eraser') {
        evt.stopPropagation();
        pushHistory();
        step.strokes = step.strokes.filter((x) => x.id !== s.id);
        renderBoardContent();
        scheduleAutosave();
        return;
      }
      if (state.mode !== 'select') return;
      evt.stopPropagation();
      pushHistory();
      const start = toSvgPoint(svg, evt);
      const orig = { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 };
      const move = (e) => {
        const p = toSvgPoint(svg, e);
        const dx = p.x - start.x, dy = p.y - start.y;
        s.x1 = orig.x1 + dx; s.y1 = orig.y1 + dy;
        s.x2 = orig.x2 + dx; s.y2 = orig.y2 + dy;
        renderBoardContent();
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        scheduleAutosave();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    [['x1', 'y1'], ['x2', 'y2']].forEach(([xk, yk]) => {
      const handle = svgEl('circle', { cx: s[xk], cy: s[yk], r: 6, class: 'stroke-handle' });
      layer.appendChild(handle);
      handle.addEventListener('pointerdown', (evt) => {
        if (state.mode !== 'select') return;
        evt.stopPropagation();
        pushHistory();
        const move = (e) => {
          const p = toSvgPoint(svg, e);
          s[xk] = p.x; s[yk] = p.y;
          renderBoardContent();
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          scheduleAutosave();
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      });
    });
  });

  // マーカー(アビリティ/メモ): 点 / コーン(スモーク等の範囲) / ウォール(壁)
  step.markers.forEach((m) => {
    if (m.kind === 'cone') { renderConeMarker(layer, svg, m); return; }
    if (m.kind === 'wall') { renderWallMarker(layer, svg, m); return; }
    renderPointMarker(layer, m);
  });

  // テキストラベル
  step.texts.forEach((t) => {
    const g = svgEl('g', { class: 'text-el', transform: `translate(${t.x},${t.y})` });
    const bg = svgEl('rect', { x: -4, y: -16, width: Math.max(24, t.text.length * 8.5 + 8), height: 22, rx: 6, class: 'text-bg' });
    const txt = svgEl('text', { x: 0, y: 0, fill: t.color, class: 'text-label' });
    txt.textContent = t.text;
    g.appendChild(bg);
    g.appendChild(txt);
    layer.appendChild(g);
    attachDrag(g, t, () => renderBoardContent());
    g.addEventListener('dblclick', (evt) => {
      evt.stopPropagation();
      const next = prompt('テキストを編集', t.text);
      if (next != null) {
        pushHistory();
        t.text = next;
        renderBoardContent();
        scheduleAutosave();
      }
    });
  });

  // エージェントトークン
  step.tokens.forEach((tok) => {
    const agent = getAgent(tok.agentId);
    if (!agent) return;
    const g = svgEl('g', { class: 'token-el', transform: `translate(${tok.x},${tok.y})` });
    g.appendChild(svgEl('circle', {
      r: 22, class: `token-circle token-${tok.side}`, fill: ROLE_COLORS[agent.role],
    }));
    const txt = svgEl('text', { x: 0, y: 6, class: 'token-label' });
    txt.textContent = agentAbbrev(agent);
    g.appendChild(txt);
    const title = svgEl('title', {});
    title.textContent = `${agent.name}(${tok.side === 'attack' ? 'ATK' : 'DEF'})`;
    g.appendChild(title);
    layer.appendChild(g);
    attachDrag(g, tok, () => renderBoardContent());
  });
}

function colorId(hex) {
  const found = PALETTE.find((p) => p.hex === hex);
  return found ? found.id : 'white';
}

function conePathD(cx, cy, angleDeg, spreadDeg, radius) {
  const a1 = (angleDeg - spreadDeg / 2) * Math.PI / 180;
  const a2 = (angleDeg + spreadDeg / 2) * Math.PI / 180;
  const x1 = cx + radius * Math.cos(a1), y1 = cy + radius * Math.sin(a1);
  const x2 = cx + radius * Math.cos(a2), y2 = cy + radius * Math.sin(a2);
  const largeArc = spreadDeg > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`;
}

function renderPointMarker(layer, m) {
  const g = svgEl('g', { class: 'marker-el', transform: `translate(${m.x},${m.y})` });
  g.appendChild(svgEl('circle', { r: 10, class: 'marker-shape', fill: m.color }));
  g.appendChild(svgEl('circle', { r: 3.5, fill: '#0b0b0d' }));
  const title = svgEl('title', {});
  title.textContent = m.label;
  g.appendChild(title);
  layer.appendChild(g);
  attachDrag(g, m, () => renderBoardContent());
}

function renderConeMarker(layer, svg, m) {
  const angle = m.angle ?? 0;
  const spread = m.spread ?? 50;
  const radius = m.radius ?? 110;
  const g = svgEl('g', { class: 'cone-el' });

  const path = svgEl('path', { d: conePathD(m.x, m.y, angle, spread, radius), class: 'cone-shape', fill: m.color, stroke: m.color });
  const title = svgEl('title', {});
  title.textContent = m.label;
  path.appendChild(title);
  g.appendChild(path);

  const origin = svgEl('circle', { cx: m.x, cy: m.y, r: 7, class: 'cone-origin' });
  g.appendChild(origin);

  const rad = angle * Math.PI / 180;
  const tip = svgEl('circle', { cx: m.x + radius * Math.cos(rad), cy: m.y + radius * Math.sin(rad), r: 7, class: 'cone-handle' });
  g.appendChild(tip);
  layer.appendChild(g);

  const startTranslate = (evt) => {
    if (state.mode === 'eraser') {
      evt.stopPropagation();
      pushHistory();
      removeItem(m.id);
      renderBoardContent();
      scheduleAutosave();
      return;
    }
    if (state.mode !== 'select') return;
    evt.stopPropagation();
    pushHistory();
    const start = toSvgPoint(svg, evt);
    const orig = { x: m.x, y: m.y };
    const move = (e) => {
      const p = toSvgPoint(svg, e);
      m.x = orig.x + (p.x - start.x);
      m.y = orig.y + (p.y - start.y);
      renderBoardContent();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      scheduleAutosave();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  path.addEventListener('pointerdown', startTranslate);
  origin.addEventListener('pointerdown', startTranslate);

  tip.addEventListener('pointerdown', (evt) => {
    if (state.mode === 'eraser') {
      evt.stopPropagation();
      pushHistory();
      removeItem(m.id);
      renderBoardContent();
      scheduleAutosave();
      return;
    }
    if (state.mode !== 'select') return;
    evt.stopPropagation();
    pushHistory();
    const move = (e) => {
      const p = toSvgPoint(svg, e);
      const dx = p.x - m.x, dy = p.y - m.y;
      m.angle = Math.atan2(dy, dx) * 180 / Math.PI;
      m.radius = Math.max(30, Math.min(400, Math.hypot(dx, dy)));
      renderBoardContent();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      scheduleAutosave();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

function renderWallMarker(layer, svg, m) {
  const g = svgEl('g', { class: 'wall-el' });
  const hit = svgEl('line', { x1: m.x, y1: m.y, x2: m.x2, y2: m.y2, class: 'wall-hit' });
  const line = svgEl('line', { x1: m.x, y1: m.y, x2: m.x2, y2: m.y2, stroke: m.color, class: 'wall-line' });
  const title = svgEl('title', {});
  title.textContent = m.label;
  line.appendChild(title);
  g.appendChild(hit);
  g.appendChild(line);
  layer.appendChild(g);

  hit.addEventListener('pointerdown', (evt) => {
    if (state.mode === 'eraser') {
      evt.stopPropagation();
      pushHistory();
      removeItem(m.id);
      renderBoardContent();
      scheduleAutosave();
      return;
    }
    if (state.mode !== 'select') return;
    evt.stopPropagation();
    pushHistory();
    const start = toSvgPoint(svg, evt);
    const orig = { x: m.x, y: m.y, x2: m.x2, y2: m.y2 };
    const move = (e) => {
      const p = toSvgPoint(svg, e);
      const dx = p.x - start.x, dy = p.y - start.y;
      m.x = orig.x + dx; m.y = orig.y + dy;
      m.x2 = orig.x2 + dx; m.y2 = orig.y2 + dy;
      renderBoardContent();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      scheduleAutosave();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });

  [['x', 'y'], ['x2', 'y2']].forEach(([xk, yk]) => {
    const handle = svgEl('circle', { cx: m[xk], cy: m[yk], r: 6, class: 'stroke-handle' });
    layer.appendChild(handle);
    handle.addEventListener('pointerdown', (evt) => {
      if (state.mode !== 'select') return;
      evt.stopPropagation();
      pushHistory();
      const move = (e) => {
        const p = toSvgPoint(svg, e);
        m[xk] = p.x; m[yk] = p.y;
        renderBoardContent();
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        scheduleAutosave();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  });
}

function attachDrag(el, item, rerender) {
  el.addEventListener('pointerdown', (evt) => {
    const svg = document.getElementById('board-svg');
    if (state.mode === 'eraser') {
      evt.stopPropagation();
      pushHistory();
      removeItem(item.id);
      renderBoardContent();
      scheduleAutosave();
      return;
    }
    if (state.mode !== 'select') return;
    evt.stopPropagation();
    pushHistory();
    const move = (e) => {
      const p = toSvgPoint(svg, e);
      item.x = p.x; item.y = p.y;
      rerender();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      scheduleAutosave();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

function removeItem(id) {
  const step = activeStep();
  step.tokens = step.tokens.filter((x) => x.id !== id);
  step.markers = step.markers.filter((x) => x.id !== id);
  step.texts = step.texts.filter((x) => x.id !== id);
  step.strokes = step.strokes.filter((x) => x.id !== id);
}

// ---------- 背景クリックの振る舞い(配置・矢印描画開始) ----------

let drawingArrow = null;

function initBoardInteraction() {
  const svg = document.getElementById('board-svg');
  const bg = document.getElementById('board-bg-hit');

  bg.addEventListener('pointerdown', (evt) => {
    const p = toSvgPoint(svg, evt);

    if (state.placingAgent) {
      pushHistory();
      activeStep().tokens.push({ id: uid('tok'), agentId: state.placingAgent.agentId, side: state.side, x: p.x, y: p.y });
      state.placingAgent = null;
      renderAgentPalette();
      renderBoardContent();
      scheduleAutosave();
      return;
    }

    if (state.mode === 'marker') {
      openMarkerModal(p);
      return;
    }

    if (state.mode === 'text') {
      const txt = prompt('テキストを入力してください');
      if (txt) {
        pushHistory();
        activeStep().texts.push({ id: uid('txt'), x: p.x, y: p.y, text: txt, color: state.color });
        renderBoardContent();
        scheduleAutosave();
      }
      return;
    }

    if (state.mode === 'arrow') {
      pushHistory();
      const stroke = { id: uid('arw'), x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: state.color };
      activeStep().strokes.push(stroke);
      drawingArrow = stroke;
      renderBoardContent();

      const move = (e) => {
        const q = toSvgPoint(svg, e);
        stroke.x2 = q.x; stroke.y2 = q.y;
        renderBoardContent();
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        const dist = Math.hypot(stroke.x2 - stroke.x1, stroke.y2 - stroke.y1);
        if (dist < 12) {
          activeStep().strokes = activeStep().strokes.filter((s) => s.id !== stroke.id);
          renderBoardContent();
        }
        drawingArrow = null;
        scheduleAutosave();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    }
  });
}

// ---------- マーカー作成モーダル ----------

function openMarkerModal(point) {
  const backdrop = document.getElementById('modal-backdrop');
  const box = document.getElementById('modal-box');
  box.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = 'マーカーを追加';
  box.appendChild(title);

  let kind = 'point';
  const kindTabs = document.createElement('div');
  kindTabs.className = 'marker-kind-tabs';
  const kindDefs = [
    { id: 'point', label: '点(メモ)' },
    { id: 'cone', label: 'コーン(範囲)' },
    { id: 'wall', label: 'ウォール(壁)' },
  ];
  kindDefs.forEach((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = k.label;
    b.className = k.id === kind ? 'active' : '';
    b.addEventListener('click', () => {
      kind = k.id;
      kindTabs.querySelectorAll('button').forEach((btn) => btn.classList.toggle('active', btn === b));
    });
    kindTabs.appendChild(b);
  });
  box.appendChild(labeled('種類', kindTabs));

  const agentSelect = document.createElement('select');
  agentSelect.appendChild(new Option('(エージェント指定なし)', ''));
  const groups = {};
  VCT_AGENTS.forEach((a) => {
    if (!groups[a.role]) {
      groups[a.role] = document.createElement('optgroup');
      groups[a.role].label = ROLE_LABELS[a.role];
      agentSelect.appendChild(groups[a.role]);
    }
    groups[a.role].appendChild(new Option(a.name, a.id));
  });
  box.appendChild(labeled('エージェント', agentSelect));

  const abilitySelect = document.createElement('select');
  box.appendChild(labeled('アビリティ', abilitySelect));

  function refreshAbilities() {
    abilitySelect.innerHTML = '';
    const agent = getAgent(agentSelect.value);
    if (!agent) {
      abilitySelect.appendChild(new Option('—', ''));
      abilitySelect.disabled = true;
      return;
    }
    abilitySelect.disabled = false;
    agent.abilities.forEach((ab) => abilitySelect.appendChild(new Option(ab, ab)));
  }
  agentSelect.addEventListener('change', refreshAbilities);
  refreshAbilities();

  const customInput = document.createElement('input');
  customInput.type = 'text';
  customInput.placeholder = '例: スモークで視界を切る / カスタムラインナップ名';
  box.appendChild(labeled('メモ(自由入力・優先されます)', customInput));

  const btnRow = document.createElement('div');
  btnRow.className = 'modal-actions';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'キャンセル';
  cancelBtn.className = 'btn';
  cancelBtn.addEventListener('click', closeModal);
  const okBtn = document.createElement('button');
  okBtn.textContent = '追加';
  okBtn.className = 'btn btn-primary';
  okBtn.addEventListener('click', () => {
    const agent = getAgent(agentSelect.value);
    const label = customInput.value.trim() || (agent ? `${agent.name} - ${abilitySelect.value}` : 'メモ');
    const color = agent ? ROLE_COLORS[agent.role] : state.color;
    const base = { id: uid('mk'), kind, x: point.x, y: point.y, label, color, agentId: agent ? agent.id : null };
    const marker = kind === 'cone'
      ? { ...base, angle: -90, spread: 50, radius: 130 }
      : kind === 'wall'
        ? { ...base, x2: point.x + 140, y2: point.y }
        : base;
    pushHistory();
    activeStep().markers.push(marker);
    renderBoardContent();
    scheduleAutosave();
    closeModal();
  });
  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(okBtn);
  box.appendChild(btnRow);

  backdrop.classList.remove('hidden');
}
function labeled(text, el) {
  const wrap = document.createElement('label');
  wrap.className = 'modal-field';
  const span = document.createElement('span');
  span.textContent = text;
  wrap.appendChild(span);
  wrap.appendChild(el);
  return wrap;
}
function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
}

// ---------- 共有リンク ----------

function openShareModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const box = document.getElementById('modal-box');
  box.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = '共有リンク';
  box.appendChild(title);
  const desc = document.createElement('p');
  desc.className = 'modal-desc';
  desc.textContent = 'このリンクを開いた人のブラウザに、今の内容がそのまま読み込まれます(サーバー保存はしていません。リアルタイム共同編集ではなく、開いた側で自由に編集できるコピーです)。';
  box.appendChild(desc);

  const url = `${location.origin}${location.pathname}#s=${encodeStrat(state.strat)}`;
  const input = document.createElement('input');
  input.type = 'text';
  input.readOnly = true;
  input.value = url;
  input.className = 'share-url';
  box.appendChild(input);

  const btnRow = document.createElement('div');
  btnRow.className = 'modal-actions';
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'コピー';
  copyBtn.className = 'btn btn-primary';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyBtn.textContent = 'コピーしました';
    } catch (e) {
      input.select();
      document.execCommand('copy');
      copyBtn.textContent = 'コピーしました';
    }
    setTimeout(() => { copyBtn.textContent = 'コピー'; }, 1500);
  });
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '閉じる';
  closeBtn.className = 'btn';
  closeBtn.addEventListener('click', closeModal);
  btnRow.appendChild(closeBtn);
  btnRow.appendChild(copyBtn);
  box.appendChild(btnRow);

  backdrop.classList.remove('hidden');
  input.select();
}

// ---------- エクスポート/インポート ----------

function exportJSON() {
  const blob = new Blob([JSON.stringify(state.strat, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.strat.name || 'strat'}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSONFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.steps || !Array.isArray(data.steps)) throw new Error('invalid');
      data.id = uid('strat');
      loadStrat(data);
    } catch (e) {
      alert('読み込みに失敗しました。ファイル形式を確認してください。');
    }
  };
  reader.readAsText(file);
}

// ---------- ステップ(ラウンド進行)管理 ----------

function renderSteps() {
  const wrap = document.getElementById('step-list');
  wrap.innerHTML = '';
  state.strat.steps.forEach((step, i) => {
    const chip = document.createElement('button');
    chip.className = 'step-chip' + (i === state.activeStep ? ' active' : '');
    chip.textContent = step.name;
    chip.addEventListener('click', () => {
      stopPlayback();
      state.activeStep = i;
      state.history = []; state.future = [];
      renderSteps();
      renderBoardContent();
    });
    chip.addEventListener('dblclick', () => {
      const name = prompt('ステップ名を編集', step.name);
      if (name) { step.name = name; renderSteps(); scheduleAutosave(); }
    });
    wrap.appendChild(chip);
  });
}

function addStep(duplicate) {
  const n = state.strat.steps.length + 1;
  const step = duplicate ? { ...clone(activeStep()), id: uid('step'), name: `${activeStep().name} コピー` } : emptyStep(`ステップ${n}`);
  state.strat.steps.push(step);
  state.activeStep = state.strat.steps.length - 1;
  state.history = []; state.future = [];
  renderSteps();
  renderBoardContent();
  scheduleAutosave();
}
function removeStep() {
  if (state.strat.steps.length <= 1) { alert('最後のステップは削除できません。'); return; }
  if (!confirm('このステップを削除しますか?')) return;
  state.strat.steps.splice(state.activeStep, 1);
  state.activeStep = Math.max(0, state.activeStep - 1);
  state.history = []; state.future = [];
  renderSteps();
  renderBoardContent();
  scheduleAutosave();
}
function moveStep(dir) {
  const i = state.activeStep;
  const j = i + dir;
  if (j < 0 || j >= state.strat.steps.length) return;
  const steps = state.strat.steps;
  [steps[i], steps[j]] = [steps[j], steps[i]];
  state.activeStep = j;
  renderSteps();
  scheduleAutosave();
}

let playing = false;
function togglePlayback() {
  if (playing) { stopPlayback(); return; }
  playing = true;
  document.getElementById('btn-play').textContent = '⏸ 停止';
  state.playTimer = setInterval(() => {
    state.activeStep = (state.activeStep + 1) % state.strat.steps.length;
    renderSteps();
    renderBoardContent();
  }, 2200);
}
function stopPlayback() {
  playing = false;
  clearTimeout(state.playTimer);
  clearInterval(state.playTimer);
  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '▶ 自動再生';
}

// ---------- サイドバー: エージェント / 保存済み一覧 ----------

let agentSearchQuery = '';

function roleIconSvg(role) {
  return `<svg class="role-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ROLE_ICON_PATHS[role]}"/></svg>`;
}

function renderAgentPalette() {
  const wrap = document.getElementById('agent-palette');
  wrap.innerHTML = '';
  const q = agentSearchQuery.trim().toLowerCase();
  ['duelist', 'initiator', 'controller', 'sentinel'].forEach((role) => {
    const agents = VCT_AGENTS.filter((a) => a.role === role && a.name.toLowerCase().includes(q));
    const section = document.createElement('div');
    section.className = 'agent-role-section' + (agents.length ? '' : ' empty');
    const h = document.createElement('h4');
    h.textContent = ROLE_LABELS[role];
    h.style.color = ROLE_COLORS[role];
    section.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'agent-grid';
    agents.forEach((a) => {
      const chip = document.createElement('button');
      chip.className = 'agent-chip' + (state.placingAgent && state.placingAgent.agentId === a.id ? ' selected' : '');
      chip.style.setProperty('--role-color', ROLE_COLORS[role]);
      chip.innerHTML = `${roleIconSvg(role)}<span>${a.name}</span>`;
      chip.title = `クリックしてマップに配置(${state.side === 'attack' ? 'ATK' : 'DEF'})`;
      chip.addEventListener('click', () => {
        state.placingAgent = { agentId: a.id };
        renderAgentPalette();
      });
      grid.appendChild(chip);
    });
    section.appendChild(grid);
    wrap.appendChild(section);
  });
}

function renderSavedList() {
  const wrap = document.getElementById('saved-list');
  wrap.innerHTML = '';
  const list = loadSavedList().sort((a, b) => b.updatedAt - a.updatedAt);
  if (!list.length) {
    const p = document.createElement('p');
    p.className = 'muted small';
    p.textContent = '保存済みストラットはまだありません。';
    wrap.appendChild(p);
    return;
  }
  list.forEach((s) => {
    const row = document.createElement('div');
    row.className = 'saved-row';
    const info = document.createElement('div');
    info.className = 'saved-info';
    info.innerHTML = `<strong>${escapeHtml(s.name)}</strong><span class="muted small">${getMap(s.mapId).name} · ${new Date(s.updatedAt).toLocaleString('ja-JP')}</span>`;
    info.addEventListener('click', () => loadStrat(s));
    const del = document.createElement('button');
    del.className = 'icon-btn';
    del.textContent = '✕';
    del.title = '削除';
    del.addEventListener('click', (e) => { e.stopPropagation(); deleteSaved(s.id); });
    row.appendChild(info);
    row.appendChild(del);
    wrap.appendChild(row);
  });
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- トップバー / ツールバー ----------

function renderTopbar() {
  document.getElementById('strat-name-input').value = state.strat.name;
  document.getElementById('map-select').value = state.strat.mapId;
}

function renderColorPalette() {
  const wrap = document.getElementById('color-palette');
  wrap.innerHTML = '';
  PALETTE.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'color-swatch' + (state.color === c.hex ? ' active' : '');
    b.style.background = c.hex;
    b.addEventListener('click', () => {
      state.color = c.hex;
      renderColorPalette();
    });
    wrap.appendChild(b);
  });
}

function setMode(mode) {
  state.mode = mode;
  state.placingAgent = null;
  document.querySelectorAll('.tool-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('board-svg').classList.toggle('mode-eraser', mode === 'eraser');
  document.getElementById('board-svg').classList.toggle('mode-draw', mode === 'arrow' || mode === 'marker' || mode === 'text');
  renderAgentPalette();
}

// ---------- 初期化 ----------

function populateMapSelect() {
  const sel = document.getElementById('map-select');
  sel.innerHTML = '';
  VCT_MAPS.forEach((m) => sel.appendChild(new Option(m.name, m.id)));
}

function renderAll() {
  renderTopbar();
  renderMap();
  renderBoardContent();
  renderSteps();
  renderAgentPalette();
  renderSavedList();
  renderColorPalette();
}

function init() {
  populateMapSelect();

  const hash = location.hash;
  if (hash.startsWith('#s=')) {
    try {
      const data = decodeStrat(hash.slice(3));
      data.id = uid('strat');
      state.strat = data;
      history.replaceState(null, '', location.pathname + location.search);
    } catch (e) {
      console.error('共有リンクの読み込みに失敗しました', e);
    }
  }
  if (!state.strat) {
    try {
      const draft = JSON.parse(localStorage.getItem(STORAGE_DRAFT) || 'null');
      if (draft && draft.strat) {
        state.strat = draft.strat;
        state.activeStep = Math.min(draft.activeStep || 0, draft.strat.steps.length - 1);
      }
    } catch (e) { /* noop */ }
  }
  if (!state.strat) state.strat = createStrat('ascent');

  initBoardInteraction();
  renderAll();
  setMode('select');

  document.getElementById('strat-name-input').addEventListener('change', (e) => {
    state.strat.name = e.target.value || '無題のストラット';
    scheduleAutosave();
  });
  document.getElementById('map-select').addEventListener('change', (e) => {
    state.strat.mapId = e.target.value;
    renderMap();
    scheduleAutosave();
  });
  document.getElementById('btn-new').addEventListener('click', () => {
    if (!confirm('新しいストラットを作成しますか?(保存していない変更は失われます)')) return;
    loadStrat(createStrat(state.strat.mapId));
  });
  document.getElementById('btn-save').addEventListener('click', saveCurrentAs);
  document.getElementById('btn-export').addEventListener('click', exportJSON);
  document.getElementById('btn-share').addEventListener('click', openShareModal);
  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importJSONFile(file);
    e.target.value = '';
  });

  document.querySelectorAll('.tool-btn').forEach((b) => {
    b.addEventListener('click', () => setMode(b.dataset.mode));
  });
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);

  document.querySelectorAll('.side-toggle-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.side = b.dataset.side;
      document.querySelectorAll('.side-toggle-btn').forEach((x) => x.classList.toggle('active', x === b));
      renderAgentPalette();
    });
  });
  document.getElementById('agent-search').addEventListener('input', (e) => {
    agentSearchQuery = e.target.value;
    renderAgentPalette();
  });

  document.getElementById('btn-add-step').addEventListener('click', () => addStep(false));
  document.getElementById('btn-dup-step').addEventListener('click', () => addStep(true));
  document.getElementById('btn-del-step').addEventListener('click', removeStep);
  document.getElementById('btn-step-left').addEventListener('click', () => moveStep(-1));
  document.getElementById('btn-step-right').addEventListener('click', () => moveStep(1));
  document.getElementById('btn-play').addEventListener('click', togglePlayback);

  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); state.placingAgent = null; renderAgentPalette(); }
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
  });
}

document.addEventListener('DOMContentLoaded', init);
