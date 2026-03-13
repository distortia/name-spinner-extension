const DEFAULT_NAMES = [];

const STORAGE_KEY = 'nameList';
const HISTORY_KEY = 'winnerHistory';
const STATS_KEY = 'pickCounts';
const LIST_COLLAPSED_KEY = 'namesListCollapsed';
const HISTORY_SIZE = 5;
const SCROLLER_VIEWPORT_HEIGHT = 80;
const SCROLLER_ITEM_HEIGHT = 44;
const SCROLLER_REPEAT = 10;

const CONFETTI_COLORS = ['#e53935', '#ff9800', '#ffeb3b', '#43a047', '#2196f3', '#9c27b0', '#ffd700', '#00bcd4'];

const nameInput = document.getElementById('name-input');
const addBtn = document.getElementById('add-btn');
const nameListEl = document.getElementById('name-list');
const emptyMsg = document.getElementById('empty-msg');
const scrollerStrip = document.getElementById('scroller-strip');
const spinBtn = document.getElementById('spin-btn');
const leverBtn = document.getElementById('lever-btn');
const resultEl = document.getElementById('result');
const winnerHistoryEl = document.getElementById('winner-history');
const winnerHistoryListEl = document.getElementById('winner-history-list');
const statsEl = document.getElementById('stats');
const statsListEl = document.getElementById('stats-list');
const confettiContainer = document.getElementById('confetti-container');
const importPanel = document.getElementById('import-panel');
const importBtn = document.getElementById('import-btn');
const importTextarea = document.getElementById('import-textarea');
const importReplaceBtn = document.getElementById('import-replace-btn');
const importCancelBtn = document.getElementById('import-cancel-btn');
const tabSlot = document.getElementById('tab-slot');
const tabBattle = document.getElementById('tab-battle');
const tabHunt = document.getElementById('tab-hunt');
const tabPlinko = document.getElementById('tab-plinko');
const panelSlot = document.getElementById('panel-slot');
const panelBattle = document.getElementById('panel-battle');
const panelHunt = document.getElementById('panel-hunt');
const panelPlinko = document.getElementById('panel-plinko');
const battleCanvas = document.getElementById('battle-canvas');
const battleBtn = document.getElementById('battle-btn');
const battleLegend = document.getElementById('battle-legend');
const huntCanvas = document.getElementById('hunt-canvas');
const huntBtn = document.getElementById('hunt-btn');
const plinkoCanvas = document.getElementById('plinko-canvas');
const plinkoBtn = document.getElementById('plinko-btn');
const listCollapseBtn = document.getElementById('list-collapse-btn');
const listSection = document.querySelector('.list-section');
const clearHistoryBtn = document.getElementById('clear-history-btn');

let nameList = [];
let winnerHistory = [];
let pickCounts = {};
let isSpinning = false;
let isBattling = false;
let isHunting = false;
let isPlinkoRunning = false;
let huntAnimationId = null;
let battleAnimationId = null;
let plinkoAnimationId = null;
let currentMode = 'slot';

function renderScroller(names) {
  scrollerStrip.innerHTML = '';
  scrollerStrip.classList.remove('spinning');
  scrollerStrip.style.transform = 'translateY(0)';

  if (names.length === 0) return;

  for (let r = 0; r < SCROLLER_REPEAT; r++) {
    names.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'scroller-item';
      item.textContent = name;
      scrollerStrip.appendChild(item);
    });
  }
}

function renderList() {
  nameListEl.innerHTML = '';
  nameList.forEach((name, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = name;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeName(i));
    li.appendChild(span);
    li.appendChild(removeBtn);
    nameListEl.appendChild(li);
  });

  const empty = nameList.length === 0;
  emptyMsg.classList.toggle('hidden', !empty);
  spinBtn.disabled = empty;
  leverBtn.disabled = empty;
  battleBtn.disabled = empty;
  huntBtn.disabled = empty;
  plinkoBtn.disabled = empty;
  resultEl.classList.add('hidden');

  renderScroller(nameList);
  renderHistory(winnerHistory);
  renderStats(pickCounts);
  const hasHistoryOrStats = winnerHistory.length > 0 || Object.keys(pickCounts).some((k) => pickCounts[k] > 0);
  clearHistoryBtn.classList.toggle('hidden', !hasHistoryOrStats);
}

function renderHistory(history) {
  winnerHistoryListEl.innerHTML = '';
  winnerHistoryEl.classList.toggle('hidden', !history || history.length === 0);
  if (!history || history.length === 0) return;
  const text = history.join(' • ');
  winnerHistoryListEl.textContent = text;
}

function renderStats(counts) {
  statsListEl.innerHTML = '';
  const namesWithCounts = nameList.filter((name) => (counts[name] || 0) > 0);
  statsEl.classList.toggle('hidden', namesWithCounts.length === 0);
  if (namesWithCounts.length === 0) return;
  const sorted = [...namesWithCounts].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  sorted.forEach((name) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = name;
    const countSpan = document.createElement('span');
    countSpan.className = 'stats-count';
    countSpan.textContent = String(counts[name] || 0);
    li.appendChild(span);
    li.appendChild(countSpan);
    statsListEl.appendChild(li);
  });
}

function triggerConfetti() {
  confettiContainer.innerHTML = '';
  const popup = document.querySelector('.popup');
  const rect = popup ? popup.getBoundingClientRect() : document.body.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const pieceCount = 50;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const angle = (Math.PI * 2 * i) / pieceCount + Math.random() * 0.5;
    const dist = 60 + Math.random() * 80;
    
    const tx = Math.cos(angle) * dist * (Math.random() > 0.5 ? 1 : -1);
    const ty = Math.sin(angle) * dist + Math.random() * 40;
    piece.style.left = `${centerX}px`;
    piece.style.top = `${centerY}px`;
    piece.style.setProperty('--tx', `${tx}px`);
    piece.style.setProperty('--ty', `${ty}px`);
    piece.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = piece.style.width;
    confettiContainer.appendChild(piece);
  }
  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 2500);
}

function declareWinner(winnerName) {
  winnerHistory = [winnerName, ...winnerHistory].slice(0, HISTORY_SIZE);
  pickCounts[winnerName] = (pickCounts[winnerName] || 0) + 1;
  chrome.storage.local.set(
    { [HISTORY_KEY]: winnerHistory, [STATS_KEY]: pickCounts },
    () => {
      if (chrome.runtime.lastError) return;
      renderHistory(winnerHistory);
      renderStats(pickCounts);
    }
  );
  triggerConfetti();
  resultEl.innerHTML = '';
  const label = document.createElement('span');
  label.className = 'result-label';
  label.textContent = 'Selected: ';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'winner-name';
  nameSpan.textContent = winnerName;
  function addSparkles(count) {
    const container = document.createElement('span');
    container.className = 'sparkles';
    container.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.style.setProperty('--i', i);
      container.appendChild(s);
    }
    return container;
  }
  resultEl.appendChild(label);
  resultEl.appendChild(addSparkles(4));
  resultEl.appendChild(nameSpan);
  resultEl.appendChild(addSparkles(4));
  resultEl.classList.remove('hidden');
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  resultEl.setAttribute('tabindex', '-1');
  resultEl.focus();
}

function removeName(index) {
  if (isSpinning || isBattling || isHunting || isPlinkoRunning) return;
  nameList.splice(index, 1);
  saveAndRender();
}

function addName() {
  const raw = nameInput.value.trim();
  if (!raw) return;
  const newNames = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  if (newNames.length === 0) return;
  nameList.push(...newNames);
  nameInput.value = '';
  saveAndRender();
}

function parseImportedNames(text) {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function openImportPanel() {
  importPanel.classList.remove('hidden');
  importTextarea.value = '';
  importTextarea.focus();
}

function closeImportPanel() {
  importPanel.classList.add('hidden');
  importTextarea.value = '';
  importBtn.focus();
}

function applyImport() {
  const names = parseImportedNames( importTextarea.value );
  if (names.length === 0) return;
  nameList = names;
  chrome.storage.local.set({ [STORAGE_KEY]: nameList }, () => {
    if (chrome.runtime.lastError) return;
    renderList();
    closeImportPanel();
  });
}

function saveAndRender() {
  chrome.storage.local.set({ [STORAGE_KEY]: nameList }, () => {
    if (chrome.runtime.lastError) return;
    renderList();
  });
}

function clearHistoryAndStats() {
  winnerHistory = [];
  pickCounts = {};
  chrome.storage.local.set(
    { [HISTORY_KEY]: winnerHistory, [STATS_KEY]: pickCounts },
    () => {
      if (chrome.runtime.lastError) return;
      renderHistory(winnerHistory);
      renderStats(pickCounts);
      clearHistoryBtn.classList.add('hidden');
    }
  );
}

function setMode(mode) {
  if (mode !== 'hunt' && isHunting && huntAnimationId != null) {
    cancelAnimationFrame(huntAnimationId);
    huntAnimationId = null;
    isHunting = false;
    huntBtn.disabled = nameList.length === 0;
  }
  if (mode !== 'battle' && isBattling && battleAnimationId != null) {
    cancelAnimationFrame(battleAnimationId);
    battleAnimationId = null;
    isBattling = false;
    battleBtn.disabled = nameList.length === 0;
  }
  if (mode !== 'plinko' && isPlinkoRunning && plinkoAnimationId != null) {
    cancelAnimationFrame(plinkoAnimationId);
    plinkoAnimationId = null;
    isPlinkoRunning = false;
    plinkoBtn.disabled = nameList.length === 0;
  }
  currentMode = mode;
  tabSlot.setAttribute('aria-selected', mode === 'slot' ? 'true' : 'false');
  tabBattle.setAttribute('aria-selected', mode === 'battle' ? 'true' : 'false');
  tabHunt.setAttribute('aria-selected', mode === 'hunt' ? 'true' : 'false');
  tabPlinko.setAttribute('aria-selected', mode === 'plinko' ? 'true' : 'false');
  panelSlot.classList.toggle('hidden', mode !== 'slot');
  panelBattle.classList.toggle('hidden', mode !== 'battle');
  panelHunt.classList.toggle('hidden', mode !== 'hunt');
  panelPlinko.classList.toggle('hidden', mode !== 'plinko');
  panelBattle.setAttribute('aria-hidden', mode !== 'battle');
  panelHunt.setAttribute('aria-hidden', mode !== 'hunt');
  panelPlinko.setAttribute('aria-hidden', mode !== 'plinko');
}

const BATTLE_COLORS = ['#e53935', '#ff9800', '#ffeb3b', '#43a047', '#2196f3', '#9c27b0', '#00bcd4', '#795548'];
const ARENA_WIDTH = 320;
const ARENA_HEIGHT = 200;
const FRICTION = 0.998;
const CENTER_GRAVITY = 0.04;
const DEAD_ZONE_RADIUS = 50;
const REPULSION_RADIUS = 22;
const REPULSION_STRENGTH = 0.06;
const MAX_INITIAL_SPEED = 1.2;
const BOUNCE_MULTIPLIER = 1.5;
const BATTLE_TOP_MIN_R = 10;
const BATTLE_TOP_MAX_R = 22;

function runBattle() {
  if (isBattling || nameList.length === 0) return;
  isBattling = true;
  battleBtn.disabled = true;
  resultEl.classList.add('hidden');

  const ctx = battleCanvas.getContext('2d');
  const W = ARENA_WIDTH;
  const H = ARENA_HEIGHT;
  const n = nameList.length;
  const radius = Math.max(BATTLE_TOP_MIN_R, Math.min(BATTLE_TOP_MAX_R, Math.min(W, H) / (2 * (n + 2))));

  const tops = nameList.map((name, i) => {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.3;
    const dist = Math.min(W, H) * 0.25;
    return {
      name,
      x: W / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
      y: H / 2 + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 2 * MAX_INITIAL_SPEED,
      vy: (Math.random() - 0.5) * 2 * MAX_INITIAL_SPEED,
      angle: Math.random() * Math.PI * 2,
      angleSpeed: (Math.random() - 0.5) * 0.3,
      radius,
      color: BATTLE_COLORS[i % BATTLE_COLORS.length],
      eliminated: false,
    };
  });

  battleLegend.innerHTML = '';
  tops.forEach((t) => {
    const item = document.createElement('span');
    item.className = 'battle-legend-item';
    const swatch = document.createElement('span');
    swatch.className = 'battle-legend-swatch';
    swatch.style.background = t.color;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'battle-legend-name';
    nameSpan.textContent = t.name;
    item.appendChild(swatch);
    item.appendChild(nameSpan);
    battleLegend.appendChild(item);
  });

  battleAnimationId = null;

  function eliminate(i) {
    tops[i].eliminated = true;
  }

  function drawArena() {
    const cx = W / 2;
    const cy = H / 2;
    const pad = 4;

    // Dark gradient floor (lighter in center)
    const floorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    floorGrad.addColorStop(0, '#2a2a2e');
    floorGrad.addColorStop(0.5, '#1e1e22');
    floorGrad.addColorStop(1, '#141418');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 0, W, H);

    // Concentric ring pattern (arena circles)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let r = 40; r < Math.min(W, H) / 2 - 10; r += 28) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Inner "battle ring" border (gold/amber)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 72, 58, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer arena edge (double line)
    ctx.strokeStyle = 'rgba(80, 80, 90, 0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
    ctx.strokeStyle = 'rgba(180, 180, 190, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 2, pad + 2, W - pad * 2 - 4, H - pad * 2 - 4);

    // Corner accents
    const cornerLen = 18;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 2;
    [[pad, pad], [W - pad, pad], [W - pad, H - pad], [pad, H - pad]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (x < cx ? cornerLen : -cornerLen), y);
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + (y < cy ? cornerLen : -cornerLen));
      ctx.stroke();
    });
  }

  function draw() {
    drawArena();

    tops.forEach((t) => {
      if (t.eliminated) return;
      ctx.save();
      ctx.translate(t.x, t.y);
      // Shadow under top
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(2, 3, t.radius * 0.9, t.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(t.angle);
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.rotate(-t.angle);
      const label = t.name.length > 6 ? t.name.slice(0, 5) + '\u2026' : t.name;
      ctx.font = `${Math.max(9, Math.min(12, t.radius))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeText(label, 0, 0);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  }

  const cx = W / 2;
  const cy = H / 2;

  function step() {
    tops.forEach((t) => {
      if (t.eliminated) return;
      const dx = cx - t.x;
      const dy = cy - t.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < REPULSION_RADIUS) {
        t.vx -= (dx / dist) * REPULSION_STRENGTH;
        t.vy -= (dy / dist) * REPULSION_STRENGTH;
      } else if (dist > DEAD_ZONE_RADIUS) {
        t.vx += (dx / dist) * CENTER_GRAVITY;
        t.vy += (dy / dist) * CENTER_GRAVITY;
      }
      t.x += t.vx;
      t.y += t.vy;
      t.vx *= FRICTION;
      t.vy *= FRICTION;
      t.angle += t.angleSpeed;
      if (t.x - t.radius < 0 || t.x + t.radius > W || t.y - t.radius < 0 || t.y + t.radius > H) {
        t.eliminated = true;
      }
    });

    for (let i = 0; i < tops.length; i++) {
      if (tops[i].eliminated) continue;
      for (let j = i + 1; j < tops.length; j++) {
        if (tops[j].eliminated) continue;
        const a = tops[i];
        const b = tops[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1e-6;
        const minDist = a.radius + b.radius;
        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          a.x -= (overlap / 2) * nx;
          a.y -= (overlap / 2) * ny;
          b.x += (overlap / 2) * nx;
          b.y += (overlap / 2) * ny;
          const v1n = a.vx * nx + a.vy * ny;
          const v2n = b.vx * nx + b.vy * ny;
          const impulse = (v2n - v1n) * BOUNCE_MULTIPLIER;
          a.vx += impulse * nx;
          a.vy += impulse * ny;
          b.vx -= impulse * nx;
          b.vy -= impulse * ny;
        }
      }
    }

    draw();
    const remaining = tops.filter((t) => !t.eliminated);
    if (remaining.length <= 1) {
      cancelAnimationFrame(battleAnimationId);
      battleAnimationId = null;
      isBattling = false;
      battleBtn.disabled = nameList.length === 0;
      const winner = remaining.length === 1 ? remaining[0] : tops[Math.floor(Math.random() * tops.length)];
      declareWinner(winner.name);
      return;
    }
    battleAnimationId = requestAnimationFrame(step);
  }

  draw();
  battleAnimationId = requestAnimationFrame(step);
}

const HUNT_DURATION_MS = 10000;
const HUNT_WIDTH = 320;
const HUNT_HEIGHT = 200;
const HUNT_DUCK_RADIUS = 16;
const HUNT_DUCK_SPEED = 1.4;
const HUNT_BOB_AMPLITUDE = 0.4;
const HUNT_DUCK_COLORS = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#DEB887'];
const AIM_LEAD_MS = 400;
const HOLD_AFTER_HIT_MS = 220;
const CROSSHAIR_WANDER_SPEED = 0.028;
const CROSSHAIR_AIM_SPEED = 0.1;
const CROSSHAIR_WANDER_RECHOOSE_MS = 900;

function runHunt() {
  if (isHunting || nameList.length === 0) return;
  const n = nameList.length;
  if (n === 1) {
    declareWinner(nameList[0]);
    return;
  }
  isHunting = true;
  huntBtn.disabled = true;
  resultEl.classList.add('hidden');

  const ctx = huntCanvas.getContext('2d');
  const W = HUNT_WIDTH;
  const H = HUNT_HEIGHT;
  const startTime = performance.now();
  const intervalMs = HUNT_DURATION_MS / (n - 1);
  let nextEliminationTime = intervalMs;

  const ducks = nameList.map((name, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const spacingX = W / 5;
    const spacingY = H / (Math.ceil(n / 4) + 1);
    return {
      name,
      x: spacingX * (col + 1) + (Math.random() - 0.5) * 20,
      y: spacingY * (row + 1) + (Math.random() - 0.5) * 15,
      vx: (Math.random() > 0.5 ? 1 : -1) * (HUNT_DUCK_SPEED + Math.random() * 0.5),
      vy: (Math.random() - 0.5) * HUNT_BOB_AMPLITUDE,
      radius: HUNT_DUCK_RADIUS,
      color: HUNT_DUCK_COLORS[i % HUNT_DUCK_COLORS.length],
      eliminated: false,
      bobPhase: Math.random() * Math.PI * 2,
    };
  });

  let crosshairX = W / 2;
  let crosshairY = H / 2;
  let crosshairWanderTarget = { x: W * 0.3 + Math.random() * W * 0.4, y: H * 0.3 + Math.random() * H * 0.4 };
  let crosshairWanderRechooseAt = performance.now() + CROSSHAIR_WANDER_RECHOOSE_MS;
  let crosshairAimTarget = null;
  let crosshairHoldUntil = 0;
  let nextAimTime = nextEliminationTime - AIM_LEAD_MS;
  huntAnimationId = null;

  function drawCrosshair(x, y) {
    const size = 14;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.stroke();
    ctx.strokeStyle = '#c00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawSkyAndGrass() {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(0.7, '#B0E0E6');
    skyGrad.addColorStop(1, '#98D982');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5a8c3a';
    ctx.fillRect(0, H * 0.75, W, H * 0.25);
    ctx.fillStyle = '#4a7c2a';
    ctx.fillRect(0, H * 0.85, W, H * 0.15);
  }

  function drawFoliageAndTrees() {
    const grassTop = H * 0.75;
    const grassBottom = H;

    function drawTree(x, scale) {
      const trunkW = 8 * scale;
      const trunkH = 45 * scale;
      const trunkTop = grassBottom - trunkH;
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(x - trunkW / 2, trunkTop, trunkW, trunkH);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - trunkW / 2, trunkTop, trunkW, trunkH);
      const foliageY = trunkTop - 5;
      const r = 28 * scale;
      ctx.fillStyle = '#2d5a27';
      ctx.beginPath();
      ctx.arc(x, foliageY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d7a35';
      ctx.beginPath();
      ctx.arc(x - r * 0.3, foliageY + r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(x + r * 0.25, foliageY - r * 0.1, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, foliageY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawBush(x, y, w, h) {
      ctx.fillStyle = '#3d6b2d';
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a7c3a';
      ctx.beginPath();
      ctx.ellipse(x - w * 0.2, y, w * 0.6, h * 0.8, 0, 0, Math.PI * 2);
      ctx.ellipse(x + w * 0.25, y - h * 0.1, w * 0.5, h * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawTree(45, 1);
    drawTree(275, 0.9);
    drawTree(155, 0.65);
    drawBush(95, grassTop + 22, 32, 18);
    drawBush(225, grassTop + 28, 28, 16);
    drawBush(300, grassBottom - 12, 22, 12);
    drawBush(18, grassBottom - 15, 20, 11);
  }

  function drawDuck(d) {
    if (d.eliminated) return;
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.vx < 0) ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 4, d.radius * 0.8, d.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, d.radius * 0.9, d.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(d.radius * 0.6, -d.radius * 0.2, d.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(d.radius * 0.85, -d.radius * 0.15);
    ctx.lineTo(d.radius * 1.35, -d.radius * 0.1);
    ctx.lineTo(d.radius * 0.9, d.radius * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.stroke();
    if (d.vx < 0) ctx.scale(-1, 1);
    const label = d.name.length > 8 ? d.name.slice(0, 7) + '\u2026' : d.name;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(label, 0, d.radius * 0.75);
    ctx.restore();
  }

  function step() {
    const now = performance.now();
    const elapsed = now - startTime;
    const remaining = ducks.filter((d) => !d.eliminated);

    if (elapsed >= nextAimTime && !crosshairAimTarget && crosshairHoldUntil < now && remaining.length > 1) {
      crosshairAimTarget = remaining[Math.floor(Math.random() * remaining.length)];
    }
    if (elapsed >= nextEliminationTime && crosshairAimTarget) {
      const victim = crosshairAimTarget;
      victim.eliminated = true;
      crosshairX = victim.x;
      crosshairY = victim.y;
      crosshairHoldUntil = now + HOLD_AFTER_HIT_MS;
      crosshairAimTarget = null;
      crosshairWanderTarget = {
        x: 20 + Math.random() * (W - 40),
        y: 20 + Math.random() * (H - 40),
      };
      crosshairWanderRechooseAt = now + CROSSHAIR_WANDER_RECHOOSE_MS;
      nextEliminationTime += intervalMs;
      nextAimTime = nextEliminationTime - AIM_LEAD_MS;
    }

    if (crosshairHoldUntil < now) {
      if (crosshairAimTarget) {
        crosshairX += (crosshairAimTarget.x - crosshairX) * CROSSHAIR_AIM_SPEED;
        crosshairY += (crosshairAimTarget.y - crosshairY) * CROSSHAIR_AIM_SPEED;
      } else {
        crosshairX += (crosshairWanderTarget.x - crosshairX) * CROSSHAIR_WANDER_SPEED;
        crosshairY += (crosshairWanderTarget.y - crosshairY) * CROSSHAIR_WANDER_SPEED;
        if (now >= crosshairWanderRechooseAt) {
          crosshairWanderTarget = {
            x: 20 + Math.random() * (W - 40),
            y: 20 + Math.random() * (H - 40),
          };
          crosshairWanderRechooseAt = now + CROSSHAIR_WANDER_RECHOOSE_MS;
        }
      }
    }

    ducks.forEach((d) => {
      if (d.eliminated) return;
      d.x += d.vx;
      d.y += d.vy;
      d.bobPhase += 0.05;
      d.vy = Math.sin(d.bobPhase) * HUNT_BOB_AMPLITUDE;
      if (d.x - d.radius < 0) {
        d.x = d.radius;
        d.vx = -d.vx;
      }
      if (d.x + d.radius > W) {
        d.x = W - d.radius;
        d.vx = -d.vx;
      }
      if (d.y - d.radius < 0) {
        d.y = d.radius;
        d.vy = -d.vy;
      }
      if (d.y + d.radius > H) {
        d.y = H - d.radius;
        d.vy = -d.vy;
      }
    });

    drawSkyAndGrass();
    drawFoliageAndTrees();
    ducks.forEach(drawDuck);
    drawCrosshair(crosshairX, crosshairY);

    if (remaining.length <= 1) {
      cancelAnimationFrame(huntAnimationId);
      huntAnimationId = null;
      isHunting = false;
      huntBtn.disabled = nameList.length === 0;
      const winner = remaining.length === 1 ? remaining[0] : ducks[Math.floor(Math.random() * ducks.length)];
      declareWinner(winner.name);
      return;
    }
    huntAnimationId = requestAnimationFrame(step);
  }

  drawSkyAndGrass();
  drawFoliageAndTrees();
  ducks.forEach(drawDuck);
  drawCrosshair(crosshairX, crosshairY);
  huntAnimationId = requestAnimationFrame(step);
}

const PLINKO_WIDTH = 320;
const PLINKO_HEIGHT = 280;
const PLINKO_PEG_TOP = 18;
const PLINKO_NUM_PEG_ROWS = 8;
const PLINKO_PEG_RADIUS = 5;
const PLINKO_BALL_RADIUS = 7;
const PLINKO_BUCKET_TOP = 210;
const PLINKO_BUCKET_HEIGHT = 70;
const PLINKO_DROP_MS = 400;
const PLINKO_GRAVITY = 0.11;
const PLINKO_BOUNCE_DAMP = 0.64;
const PLINKO_PEG_KICK = 1.7;
const PLINKO_WALL_BOUNCE = 0.4;
const PLINKO_PEG_COLOR = '#ffd700';
const PLINKO_BALL_COLOR = '#e53935';
const PLINKO_BUCKET_COLORS = ['#1a73e8', '#43a047', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#e91e63', '#3f51b5'];

function runPlinko() {
  if (isPlinkoRunning || nameList.length === 0) return;
  const n = nameList.length;
  if (n === 1) {
    declareWinner(nameList[0]);
    return;
  }
  isPlinkoRunning = true;
  plinkoBtn.disabled = true;
  resultEl.classList.add('hidden');

  const bucketNames = [...nameList];
  for (let i = bucketNames.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bucketNames[i], bucketNames[j]] = [bucketNames[j], bucketNames[i]];
  }

  const ctx = plinkoCanvas.getContext('2d');
  const W = PLINKO_WIDTH;
  const H = PLINKO_HEIGHT;
  const numPegRows = PLINKO_NUM_PEG_ROWS;
  const pegRowSpacing = (PLINKO_BUCKET_TOP - 22 - PLINKO_PEG_TOP) / (numPegRows - 1);

  const pegJitterX = 14;
  const pegJitterY = 4;
  const pegPositions = [];
  for (let r = 0; r < numPegRows; r++) {
    const rowWidth = W / (r + 1);
    for (let c = 0; c <= r; c++) {
      const baseX = (c + 0.5) * rowWidth;
      const baseY = PLINKO_PEG_TOP + r * pegRowSpacing;
      const x = Math.max(PLINKO_PEG_RADIUS + 2, Math.min(W - PLINKO_PEG_RADIUS - 2, baseX + (Math.random() - 0.5) * 2 * pegJitterX));
      const y = baseY + (Math.random() - 0.5) * 2 * pegJitterY;
      pegPositions.push({ x, y });
    }
  }

  const lastPegY = PLINKO_PEG_TOP + (numPegRows - 1) * pegRowSpacing + pegJitterY;
  const bucketW = W / n;
  const bucketCenterY = PLINKO_BUCKET_TOP + PLINKO_BUCKET_HEIGHT / 2;

  let ball = {
    x: W / 2,
    y: PLINKO_BALL_RADIUS + 2,
    vx: 0,
    vy: 0,
  };
  let lastHitPeg = null;
  let phase = 'bouncing';
  let dropStartTime = 0;
  let dropStartX = 0;
  let dropStartY = 0;
  let winnerBucketIndex = 0;
  plinkoAnimationId = null;

  function drawBoard() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(0.7, '#1a1a2e');
    grad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    pegPositions.forEach((p) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(p.x + 1, p.y + 1, PLINKO_PEG_RADIUS + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PLINKO_PEG_COLOR;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLINKO_PEG_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const bucketW = W / n;
    for (let s = 0; s < n; s++) {
      const left = s * bucketW;
      const color = PLINKO_BUCKET_COLORS[s % PLINKO_BUCKET_COLORS.length];
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(left + 2, PLINKO_BUCKET_TOP + 2, bucketW - 2, PLINKO_BUCKET_HEIGHT - 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(left, PLINKO_BUCKET_TOP, bucketW - 2, PLINKO_BUCKET_HEIGHT - 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(left, PLINKO_BUCKET_TOP, bucketW - 2, PLINKO_BUCKET_HEIGHT - 2);
      const label = bucketNames[s].length > 8 ? bucketNames[s].slice(0, 7) + '\u2026' : bucketNames[s];
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(label, left + bucketW / 2 - 1, PLINKO_BUCKET_TOP + PLINKO_BUCKET_HEIGHT / 2 - 1);
    }
  }

  function drawBall(ballX, ballY) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(ballX + 2, ballY + 2, PLINKO_BALL_RADIUS + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PLINKO_BALL_COLOR;
    ctx.beginPath();
    ctx.arc(ballX, ballY, PLINKO_BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function step() {
    if (phase === 'dropping') {
      const elapsed = performance.now() - dropStartTime;
      const t = Math.min(1, elapsed / PLINKO_DROP_MS);
      const ease = 1 - (1 - t) * (1 - t);
      const ballX = dropStartX + (bucketW * (winnerBucketIndex + 0.5) - dropStartX) * ease;
      const ballY = dropStartY + (bucketCenterY - dropStartY) * ease;
      drawBoard();
      drawBall(ballX, ballY);
      if (t >= 1) {
        cancelAnimationFrame(plinkoAnimationId);
        plinkoAnimationId = null;
        isPlinkoRunning = false;
        plinkoBtn.disabled = nameList.length === 0;
        declareWinner(bucketNames[winnerBucketIndex]);
        return;
      }
      plinkoAnimationId = requestAnimationFrame(step);
      return;
    }

    ball.vy += PLINKO_GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;

    const totalR = PLINKO_PEG_RADIUS + PLINKO_BALL_RADIUS;
    pegPositions.forEach((peg, idx) => {
      if (idx === lastHitPeg) return;
      const dx = ball.x - peg.x;
      const dy = ball.y - peg.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      if (d < totalR) {
        lastHitPeg = idx;
        const nx = dx / d;
        const ny = dy / d;
        ball.x = peg.x + nx * totalR;
        ball.y = peg.y + ny * totalR;
        const vn = ball.vx * nx + ball.vy * ny;
        ball.vx = (ball.vx - 2 * vn * nx) * PLINKO_BOUNCE_DAMP;
        ball.vy = (ball.vy - 2 * vn * ny) * PLINKO_BOUNCE_DAMP;
        const kick = (Math.random() > 0.5 ? 1 : -1) * PLINKO_PEG_KICK * (0.6 + Math.random() * 0.9);
        ball.vx += kick;
      }
    });
    if (lastHitPeg !== null) {
      const peg = pegPositions[lastHitPeg];
      if (Math.hypot(ball.x - peg.x, ball.y - peg.y) > totalR + 2) lastHitPeg = null;
    }

    if (ball.x - PLINKO_BALL_RADIUS < 0) {
      ball.x = PLINKO_BALL_RADIUS;
      ball.vx = -ball.vx * PLINKO_WALL_BOUNCE;
    }
    if (ball.x + PLINKO_BALL_RADIUS > W) {
      ball.x = W - PLINKO_BALL_RADIUS;
      ball.vx = -ball.vx * PLINKO_WALL_BOUNCE;
    }

    if (ball.y > lastPegY + 12) {
      winnerBucketIndex = Math.max(0, Math.min(n - 1, Math.floor(ball.x / bucketW)));
      phase = 'dropping';
      dropStartTime = performance.now();
      dropStartX = ball.x;
      dropStartY = ball.y;
    }

    drawBoard();
    drawBall(ball.x, ball.y);
    plinkoAnimationId = requestAnimationFrame(step);
  }

  drawBoard();
  drawBall(ball.x, ball.y);
  plinkoAnimationId = requestAnimationFrame(step);
}

function applyListCollapsed(collapsed) {
  if (collapsed) {
    listSection.classList.add('collapsed');
    listCollapseBtn.setAttribute('aria-expanded', 'false');
    listCollapseBtn.setAttribute('aria-label', 'Expand names list');
  } else {
    listSection.classList.remove('collapsed');
    listCollapseBtn.setAttribute('aria-expanded', 'true');
    listCollapseBtn.setAttribute('aria-label', 'Collapse names list');
  }
}

function loadAndRender() {
  chrome.storage.local.get([STORAGE_KEY, HISTORY_KEY, STATS_KEY, LIST_COLLAPSED_KEY], (data) => {
    if (chrome.runtime.lastError) return;
    winnerHistory = Array.isArray(data[HISTORY_KEY]) ? data[HISTORY_KEY] : [];
    pickCounts = data[STATS_KEY] && typeof data[STATS_KEY] === 'object' ? data[STATS_KEY] : {};
    const stored = data[STORAGE_KEY];
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      nameList = [...DEFAULT_NAMES];
      chrome.storage.local.set({ [STORAGE_KEY]: nameList }, () => {
        if (chrome.runtime.lastError) return;
        renderList();
      });
    } else {
      nameList = stored;
      renderList();
    }
    applyListCollapsed(data[LIST_COLLAPSED_KEY] === true);
  });
}

function spin() {
  if (isSpinning || nameList.length === 0) return;
  isSpinning = true;
  spinBtn.disabled = true;
  leverBtn.disabled = true;
  leverBtn.classList.add('pulling');
  resultEl.classList.add('hidden');

  const n = nameList.length;
  const winnerIndex = Math.floor(Math.random() * n);
  const midRepetition = Math.floor(SCROLLER_REPEAT / 2);
  const targetItemIndex = midRepetition * n + winnerIndex;
  const finalTranslateY = targetItemIndex * SCROLLER_ITEM_HEIGHT + SCROLLER_ITEM_HEIGHT / 2 - SCROLLER_VIEWPORT_HEIGHT / 2;

  scrollerStrip.style.transition = 'none';
  scrollerStrip.style.transform = 'translateY(0)';
  scrollerStrip.offsetHeight;
  scrollerStrip.style.transition = 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)';
  scrollerStrip.classList.add('spinning');
  scrollerStrip.style.transform = `translateY(-${finalTranslateY}px)`;

  setTimeout(() => {
    isSpinning = false;
    spinBtn.disabled = nameList.length === 0;
    leverBtn.disabled = nameList.length === 0;
    leverBtn.classList.remove('pulling');
    const winnerName = nameList[winnerIndex];
    declareWinner(winnerName);
  }, 3100);
}

addBtn.addEventListener('click', addName);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addName();
});
tabSlot.addEventListener('click', () => setMode('slot'));
tabBattle.addEventListener('click', () => setMode('battle'));
tabHunt.addEventListener('click', () => setMode('hunt'));
tabPlinko.addEventListener('click', () => setMode('plinko'));
spinBtn.addEventListener('click', spin);
leverBtn.addEventListener('click', spin);
battleBtn.addEventListener('click', runBattle);
huntBtn.addEventListener('click', runHunt);
plinkoBtn.addEventListener('click', runPlinko);
listCollapseBtn.addEventListener('click', () => {
  const isCollapsed = listSection.classList.toggle('collapsed');
  listCollapseBtn.setAttribute('aria-expanded', !isCollapsed);
  listCollapseBtn.setAttribute('aria-label', isCollapsed ? 'Expand names list' : 'Collapse names list');
  chrome.storage.local.set({ [LIST_COLLAPSED_KEY]: isCollapsed }, () => {
    if (chrome.runtime.lastError) return;
  });
});
importBtn.addEventListener('click', openImportPanel);
importReplaceBtn.addEventListener('click', applyImport);
importCancelBtn.addEventListener('click', closeImportPanel);
importTextarea.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeImportPanel();
});
clearHistoryBtn.addEventListener('click', clearHistoryAndStats);

loadAndRender();
