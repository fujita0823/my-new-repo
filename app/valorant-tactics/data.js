// マップ・エージェントのデータ定義。
// マップ形状は実際のマップ画像ではなく、権利関係を避けるための
// 簡略化した「ブループリント風」概略図(サイト配置やコールアウトの
// おおよその位置関係を表す抽象図)。座標は viewBox 0 0 1000 1000。

const ROLE_COLORS = {
  duelist: '#ff4655',
  initiator: '#53d7b0',
  controller: '#a78bfa',
  sentinel: '#f6c945',
};

const ROLE_LABELS = {
  duelist: 'デュエリスト',
  initiator: 'イニシエーター',
  controller: 'コントローラー',
  sentinel: 'センチネル',
};

function zone(id, label, cx, cy, rx, ry) {
  return { id, label, cx, cy, rx, ry };
}

function spawns() {
  return [
    { side: 'attack', label: 'ATK Spawn', cx: 500, cy: 900, rx: 260, ry: 65 },
    { side: 'defense', label: 'DEF Spawn', cx: 500, cy: 90, rx: 260, ry: 55 },
  ];
}

const VCT_MAPS = [
  {
    id: 'ascent', name: 'Ascent', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 230, 140, 110),
      zone('B', 'B Site', 740, 230, 140, 110),
      zone('mid', 'Mid', 500, 460, 120, 90),
    ],
    callouts: [
      { label: 'Market', x: 150, y: 350 },
      { label: 'Tree', x: 360, y: 340 },
      { label: 'Heaven', x: 770, y: 110 },
      { label: 'Catwalk', x: 640, y: 460 },
    ],
    spawns: spawns(),
  },
  {
    id: 'bind', name: 'Bind', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 220, 140, 110),
      zone('B', 'B Site', 740, 220, 140, 110),
      zone('mid', 'Mid (Hookah)', 500, 470, 110, 90),
    ],
    callouts: [
      { label: 'Showers', x: 190, y: 380 },
      { label: 'Elbow', x: 360, y: 460 },
      { label: 'Lamps', x: 700, y: 400 },
      { label: 'Short', x: 820, y: 330 },
    ],
    spawns: spawns(),
  },
  {
    id: 'haven', name: 'Haven', sites: 3,
    zones: [
      zone('A', 'A Site', 190, 220, 110, 95),
      zone('B', 'B Site', 500, 190, 110, 95),
      zone('C', 'C Site', 810, 220, 110, 95),
      zone('mid', 'Mid', 500, 460, 110, 85),
    ],
    callouts: [
      { label: 'Garden', x: 260, y: 380 },
      { label: 'Long', x: 700, y: 380 },
      { label: 'Sewer', x: 500, y: 620 },
    ],
    spawns: spawns(),
  },
  {
    id: 'split', name: 'Split', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 220, 140, 105),
      zone('B', 'B Site', 740, 220, 140, 105),
      zone('mid', 'Mid', 500, 470, 110, 90),
    ],
    callouts: [
      { label: 'Ramps', x: 220, y: 400 },
      { label: 'Vents', x: 500, y: 350 },
      { label: 'Rock', x: 760, y: 400 },
    ],
    spawns: spawns(),
  },
  {
    id: 'icebox', name: 'Icebox', sites: 2,
    zones: [
      zone('A', 'A Site', 300, 220, 150, 115),
      zone('B', 'B Site', 700, 220, 150, 115),
      zone('mid', 'Mid', 500, 480, 100, 80),
    ],
    callouts: [
      { label: 'Tube', x: 340, y: 400 },
      { label: 'Pipe', x: 660, y: 400 },
      { label: 'Kitchen', x: 500, y: 300 },
    ],
    spawns: spawns(),
  },
  {
    id: 'breeze', name: 'Breeze', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 210, 150, 120),
      zone('B', 'B Site', 740, 210, 150, 120),
      zone('mid', 'Mid (Halls)', 500, 470, 110, 85),
    ],
    callouts: [
      { label: 'Cave', x: 200, y: 400 },
      { label: 'Hall', x: 500, y: 380 },
      { label: 'Pillars', x: 780, y: 400 },
    ],
    spawns: spawns(),
  },
  {
    id: 'fracture', name: 'Fracture', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 200, 140, 105),
      zone('B', 'B Site', 740, 200, 140, 105),
      zone('mid', 'Dish', 500, 460, 120, 95),
    ],
    callouts: [
      { label: 'Arcade', x: 200, y: 400 },
      { label: 'Bridge', x: 500, y: 620 },
      { label: 'Dish', x: 800, y: 400 },
    ],
    spawns: spawns(),
  },
  {
    id: 'pearl', name: 'Pearl', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 220, 140, 110),
      zone('B', 'B Site', 740, 220, 140, 110),
      zone('mid', 'Mid (Market)', 500, 470, 110, 90),
    ],
    callouts: [
      { label: 'Tower', x: 220, y: 380 },
      { label: 'Link', x: 500, y: 350 },
      { label: 'Shops', x: 780, y: 380 },
    ],
    spawns: spawns(),
  },
  {
    id: 'lotus', name: 'Lotus', sites: 3,
    zones: [
      zone('A', 'A Site', 190, 220, 110, 95),
      zone('B', 'B Site', 500, 190, 110, 95),
      zone('C', 'C Site', 810, 220, 110, 95),
      zone('mid', 'Mid (Stone)', 500, 460, 110, 85),
    ],
    callouts: [
      { label: 'Dais', x: 260, y: 400 },
      { label: 'Tunnel', x: 700, y: 400 },
    ],
    spawns: spawns(),
  },
  {
    id: 'sunset', name: 'Sunset', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 220, 140, 110),
      zone('B', 'B Site', 740, 220, 140, 110),
      zone('mid', 'Mid (Marketplace)', 500, 470, 110, 90),
    ],
    callouts: [
      { label: 'Courtyard', x: 220, y: 380 },
      { label: 'Alley', x: 780, y: 380 },
    ],
    spawns: spawns(),
  },
  {
    id: 'abyss', name: 'Abyss', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 220, 140, 110),
      zone('B', 'B Site', 740, 220, 140, 110),
      zone('mid', 'Mid', 500, 470, 110, 90),
    ],
    callouts: [],
    spawns: spawns(),
  },
  {
    id: 'corrode', name: 'Corrode', sites: 2,
    zones: [
      zone('A', 'A Site', 260, 220, 140, 110),
      zone('B', 'B Site', 740, 220, 140, 110),
      zone('mid', 'Mid', 500, 470, 110, 90),
    ],
    callouts: [],
    spawns: spawns(),
  },
];

// アビリティ名は参考情報。うろ覚え/最新アップデートで変わっている
// 可能性があるため、マーカー作成時は自由入力でも上書きできる。
const VCT_AGENTS = [
  { id: 'jett', name: 'Jett', role: 'duelist', abilities: ['Cloudburst', 'Updraft', 'Tailwind', 'Blade Storm'] },
  { id: 'phoenix', name: 'Phoenix', role: 'duelist', abilities: ['Curveball', 'Hot Hands', 'Blaze', 'Run It Back'] },
  { id: 'reyna', name: 'Reyna', role: 'duelist', abilities: ['Devour', 'Dismiss', 'Leer', 'Empress'] },
  { id: 'raze', name: 'Raze', role: 'duelist', abilities: ['Boom Bot', 'Blast Pack', 'Paint Shells', 'Showstopper'] },
  { id: 'yoru', name: 'Yoru', role: 'duelist', abilities: ['Fakeout', 'Blindside', 'Gatecrash', 'Dimensional Drift'] },
  { id: 'neon', name: 'Neon', role: 'duelist', abilities: ['Fast Lane', 'Relay Bolt', 'High Gear', 'Overdrive'] },
  { id: 'iso', name: 'Iso', role: 'duelist', abilities: ['Contingency', 'Undercut', 'Double Tap', 'Kill Contract'] },
  { id: 'waylay', name: 'Waylay', role: 'duelist', abilities: ['アビリティ1', 'アビリティ2', 'アビリティ3', 'アルティメット'] },

  { id: 'sova', name: 'Sova', role: 'initiator', abilities: ['Owl Drone', 'Shock Bolt', 'Recon Bolt', "Hunter's Fury"] },
  { id: 'breach', name: 'Breach', role: 'initiator', abilities: ['Aftershock', 'Flashpoint', 'Fault Line', 'Rolling Thunder'] },
  { id: 'skye', name: 'Skye', role: 'initiator', abilities: ['Regrowth', 'Trailblazer', 'Guiding Light', 'Seekers'] },
  { id: 'kayo', name: 'KAY/O', role: 'initiator', abilities: ['FRAG/ment', 'FLASH/drive', 'ZERO/point', 'NULL/cmd'] },
  { id: 'fade', name: 'Fade', role: 'initiator', abilities: ['Prowler', 'Seize', 'Haunt', 'Nightfall'] },
  { id: 'gekko', name: 'Gekko', role: 'initiator', abilities: ['Mosh Pit', 'Wingman', 'Dizzy', 'Thrash'] },
  { id: 'tejo', name: 'Tejo', role: 'initiator', abilities: ['アビリティ1', 'アビリティ2', 'アビリティ3', 'アルティメット'] },

  { id: 'brimstone', name: 'Brimstone', role: 'controller', abilities: ['Incendiary', 'Stim Beacon', 'Sky Smoke', 'Orbital Strike'] },
  { id: 'omen', name: 'Omen', role: 'controller', abilities: ['Paranoia', 'Dark Cover', 'Shrouded Step', 'From the Shadows'] },
  { id: 'viper', name: 'Viper', role: 'controller', abilities: ['Poison Cloud', 'Toxic Screen', 'Snake Bite', "Viper's Pit"] },
  { id: 'astra', name: 'Astra', role: 'controller', abilities: ['Gravity Well', 'Nova Pulse', 'Nebula', 'Cosmic Divide'] },
  { id: 'harbor', name: 'Harbor', role: 'controller', abilities: ['Cascade', 'Cove', 'High Tide', 'Reckoning'] },
  { id: 'clove', name: 'Clove', role: 'controller', abilities: ['Pick-Me-Up', 'Ruse', 'Meddle', 'Not Dead Yet'] },

  { id: 'cypher', name: 'Cypher', role: 'sentinel', abilities: ['Trapwire', 'Cyber Cage', 'Spycam', 'Neural Theft'] },
  { id: 'killjoy', name: 'Killjoy', role: 'sentinel', abilities: ['Nanoswarm', 'Alarmbot', 'Turret', 'Lockdown'] },
  { id: 'sage', name: 'Sage', role: 'sentinel', abilities: ['Slow Orb', 'Healing Orb', 'Barrier Orb', 'Resurrection'] },
  { id: 'chamber', name: 'Chamber', role: 'sentinel', abilities: ['Trademark', 'Headhunter', 'Rendezvous', 'Tour De Force'] },
  { id: 'deadlock', name: 'Deadlock', role: 'sentinel', abilities: ['GravNet', 'Sonic Sensor', 'Barrier Mesh', 'Annihilation'] },
  { id: 'vyse', name: 'Vyse', role: 'sentinel', abilities: ['Razorvine', 'Shear', 'Arc Rose', 'Steel Garden'] },
];
