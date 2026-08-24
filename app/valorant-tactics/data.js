// マップ・エージェントのデータ定義。
// マップ形状は実際のマップ画像ではなく、権利関係を避けるための
// 簡略化した「ブループリント」(サイト/ミッドの矩形と、主要な
// 通路(コネクター)のおおよその位置関係を表す抽象図)。
// 座標は viewBox 0 0 1000 1000。

const ROLE_COLORS = {
  duelist: '#f97316',
  initiator: '#22c55e',
  controller: '#eab308',
  sentinel: '#38bdf8',
};

const ROLE_LABELS = {
  duelist: 'デュエリスト',
  initiator: 'イニシエーター',
  controller: 'コントローラー',
  sentinel: 'センチネル',
};

// 汎用アイコン(生成AIやゲーム内アセットではなく、シンプルな幾何学
// 図形として自作したロールバッジ)。24x24 viewBox。
const ROLE_ICON_PATHS = {
  duelist: 'M12 3 L21 20 H3 Z',
  initiator: 'M12 12 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M12 12 m-2.4 0 a2.4 2.4 0 1 0 4.8 0 a2.4 2.4 0 1 0 -4.8 0',
  controller: 'M6.8 17 a4 4 0 0 1 .3 -7.98 A5.6 5.6 0 0 1 18 10.2 a3.6 3.6 0 0 1 -1 7.06 Z',
  sentinel: 'M12 2.4 L20 5.4 V11 C20 16.2 16.6 20.3 12 21.9 C7.4 20.3 4 16.2 4 11 V5.4 Z',
};

function siteRect(id, label, x, y, w, h) {
  return { id, label, x, y, w, h };
}
function midRect(label, x, y, w, h) {
  return { id: 'mid', label, x, y, w, h };
}
function corridor(label, x, y, w, h) {
  return { label, x, y, w, h };
}
function spawns() {
  return [
    { side: 'attack', label: 'ATK SPAWN', x: 150, y: 850, w: 700, h: 100 },
    { side: 'defense', label: 'DEF SPAWN', x: 150, y: 55, w: 700, h: 90 },
  ];
}

const VCT_MAPS = [
  {
    id: 'ascent', name: 'Ascent', sites: 2,
    zones: [
      siteRect('A', 'A Site', 110, 150, 250, 190),
      siteRect('B', 'B Site', 640, 150, 250, 190),
      midRect('Mid', 380, 430, 240, 170),
    ],
    corridors: [
      corridor('Market', 280, 340, 100, 100),
      corridor('Catwalk', 640, 340, 100, 100),
      corridor('Heaven', 580, 170, 60, 160),
      corridor('Nest', 800, 300, 80, 80),
    ],
    spawns: spawns(),
  },
  {
    id: 'bind', name: 'Bind', sites: 2,
    zones: [
      siteRect('A', 'A Site', 110, 150, 250, 190),
      siteRect('B', 'B Site', 640, 150, 250, 190),
      midRect('Hookah', 380, 430, 240, 170),
    ],
    corridors: [
      corridor('Showers', 190, 350, 90, 90),
      corridor('Short', 350, 260, 80, 80),
      corridor('Elbow', 660, 360, 90, 90),
      corridor('Lamps', 780, 300, 80, 80),
      corridor('Garden', 660, 220, 80, 70),
    ],
    spawns: spawns(),
  },
  {
    id: 'haven', name: 'Haven', sites: 3,
    zones: [
      siteRect('A', 'A Site', 70, 150, 210, 170),
      siteRect('B', 'B Site', 395, 120, 210, 170),
      siteRect('C', 'C Site', 720, 150, 210, 170),
      midRect('Mid', 350, 440, 300, 150),
    ],
    corridors: [
      corridor('Garden', 250, 330, 90, 100),
      corridor('Long', 660, 330, 90, 100),
      corridor('Sewer', 380, 620, 240, 70),
      corridor('A Short', 130, 330, 70, 80),
    ],
    spawns: spawns(),
  },
  {
    id: 'split', name: 'Split', sites: 2,
    zones: [
      siteRect('A', 'A Site', 110, 140, 250, 190),
      siteRect('B', 'B Site', 640, 140, 250, 190),
      midRect('Mid', 380, 430, 240, 170),
    ],
    corridors: [
      corridor('Vents', 330, 330, 90, 100),
      corridor('Ramps', 600, 330, 90, 100),
      corridor('Rock', 470, 380, 60, 60),
    ],
    spawns: spawns(),
  },
  {
    id: 'icebox', name: 'Icebox', sites: 2,
    zones: [
      siteRect('A', 'A Site', 100, 140, 260, 200),
      siteRect('B', 'B Site', 640, 140, 260, 200),
      midRect('Kitchen', 380, 430, 240, 170),
    ],
    corridors: [
      corridor('Tube', 320, 350, 90, 90),
      corridor('Pipe', 610, 350, 90, 90),
      corridor('Yellow', 760, 220, 80, 70),
    ],
    spawns: spawns(),
  },
  {
    id: 'breeze', name: 'Breeze', sites: 2,
    zones: [
      siteRect('A', 'A Site', 100, 140, 260, 210),
      siteRect('B', 'B Site', 640, 140, 260, 210),
      midRect('Halls', 380, 430, 240, 160),
    ],
    corridors: [
      corridor('Cave', 240, 360, 80, 90),
      corridor('Pillars', 700, 360, 80, 90),
    ],
    spawns: spawns(),
  },
  {
    id: 'fracture', name: 'Fracture', sites: 2,
    zones: [
      siteRect('A', 'A Site', 110, 130, 250, 180),
      siteRect('B', 'B Site', 640, 130, 250, 180),
      midRect('Dish', 380, 420, 240, 170),
    ],
    corridors: [
      corridor('Arcade', 200, 340, 90, 90),
      corridor('Bridge', 420, 620, 180, 70),
      corridor('Ropes', 720, 340, 90, 90),
    ],
    spawns: spawns(),
  },
  {
    id: 'pearl', name: 'Pearl', sites: 2,
    zones: [
      siteRect('A', 'A Site', 110, 150, 250, 190),
      siteRect('B', 'B Site', 640, 150, 250, 190),
      midRect('Market', 380, 430, 240, 170),
    ],
    corridors: [
      corridor('Tower', 260, 350, 90, 90),
      corridor('Link', 660, 350, 90, 90),
    ],
    spawns: spawns(),
  },
  {
    id: 'lotus', name: 'Lotus', sites: 3,
    zones: [
      siteRect('A', 'A Site', 70, 150, 210, 170),
      siteRect('B', 'B Site', 395, 120, 210, 170),
      siteRect('C', 'C Site', 720, 150, 210, 170),
      midRect('Mid', 350, 440, 300, 150),
    ],
    corridors: [
      corridor('Dais', 250, 340, 90, 90),
      corridor('Tunnel', 660, 340, 90, 90),
    ],
    spawns: spawns(),
  },
  {
    id: 'sunset', name: 'Sunset', sites: 2,
    zones: [
      siteRect('A', 'A Site', 110, 150, 250, 190),
      siteRect('B', 'B Site', 640, 150, 250, 190),
      midRect('Marketplace', 380, 430, 240, 170),
    ],
    corridors: [
      corridor('Courtyard', 250, 350, 90, 90),
      corridor('Alley', 660, 350, 90, 90),
    ],
    spawns: spawns(),
  },
  {
    id: 'abyss', name: 'Abyss', sites: 2,
    zones: [
      siteRect('A', 'A Site', 110, 150, 250, 190),
      siteRect('B', 'B Site', 640, 150, 250, 190),
      midRect('Mid', 380, 430, 240, 170),
    ],
    corridors: [
      corridor('Mid Connector A', 300, 350, 90, 90),
      corridor('Mid Connector B', 620, 350, 90, 90),
    ],
    spawns: spawns(),
  },
  {
    id: 'corrode', name: 'Corrode', sites: 2,
    zones: [
      siteRect('A', 'A Site', 110, 150, 250, 190),
      siteRect('B', 'B Site', 640, 150, 250, 190),
      midRect('Mid', 380, 430, 240, 170),
    ],
    corridors: [
      corridor('Mid Connector A', 300, 350, 90, 90),
      corridor('Mid Connector B', 620, 350, 90, 90),
    ],
    spawns: spawns(),
  },
];

// エージェント名・アビリティ名は sunkenintime/icarus (OSSのVALORANT戦術
// デスクトップアプリ, lib/const/agents.dart) に事実データとして記載されて
// いた現行ロースターを出典とする。Veto / Miks は本ツールの従来データには
// 存在しなかった直近追加のエージェント。
const VCT_AGENTS = [
  { id: 'jett', name: 'Jett', role: 'duelist', abilities: ['Cloudburst', 'Updraft', 'Tailwind', 'Blade Storm'] },
  { id: 'raze', name: 'Raze', role: 'duelist', abilities: ['Boom Bot', 'Blast Pack', 'Paint Shells', 'Showstopper'] },
  { id: 'phoenix', name: 'Phoenix', role: 'duelist', abilities: ['Blaze', 'Hot Hands', 'Curveball', 'Run It Back'] },
  { id: 'yoru', name: 'Yoru', role: 'duelist', abilities: ['Fakeout', 'Blindside', 'Gatecrash', 'Dimensional Drift'] },
  { id: 'neon', name: 'Neon', role: 'duelist', abilities: ['Fast Lane', 'Relay Bolt', 'High Gear', 'Overdrive'] },
  { id: 'reyna', name: 'Reyna', role: 'duelist', abilities: ['Leer', 'Devour', 'Dismiss', 'Empress'] },
  { id: 'iso', name: 'Iso', role: 'duelist', abilities: ['Contingency', 'Undercut', 'Double Tap', 'Kill Contract'] },
  { id: 'waylay', name: 'Waylay', role: 'duelist', abilities: ['Saturate', 'Lightspeed', 'Refract', 'Convergent Paths'] },

  { id: 'breach', name: 'Breach', role: 'initiator', abilities: ['Aftershock', 'Flashpoint', 'Fault Line', 'Rolling Thunder'] },
  { id: 'sova', name: 'Sova', role: 'initiator', abilities: ['Owl Drone', 'Shock Bolt', 'Recon Bolt', "Hunter's Fury"] },
  { id: 'skye', name: 'Skye', role: 'initiator', abilities: ['Regrowth', 'Trailblazer', 'Guiding Light', 'Seekers'] },
  { id: 'kayo', name: 'KAY/O', role: 'initiator', abilities: ['FRAG/ment', 'FLASH/drive', 'ZERO/point', 'NULL/cmd'] },
  { id: 'fade', name: 'Fade', role: 'initiator', abilities: ['Prowler', 'Seize', 'Haunt', 'Nightfall'] },
  { id: 'gekko', name: 'Gekko', role: 'initiator', abilities: ['Mosh Pit', 'Wingman', 'Dizzy', 'Thrash'] },
  { id: 'tejo', name: 'Tejo', role: 'initiator', abilities: ['Stealth Drone', 'Special Delivery', 'Guided Salvo', 'Armageddon'] },

  { id: 'astra', name: 'Astra', role: 'controller', abilities: ['Gravity Well', 'Nova Pulse', 'Nebula/Dissipate', 'Cosmic Divide'] },
  { id: 'viper', name: 'Viper', role: 'controller', abilities: ['Snake Bite', 'Poison Cloud', 'Toxic Screen', "Viper's Pit"] },
  { id: 'brimstone', name: 'Brimstone', role: 'controller', abilities: ['Stim Beacon', 'Incendiary', 'Sky Smoke', 'Orbital Strike'] },
  { id: 'omen', name: 'Omen', role: 'controller', abilities: ['Shrouded Step', 'Paranoia', 'Dark Cover', 'From the Shadows'] },
  { id: 'clove', name: 'Clove', role: 'controller', abilities: ['Pick-Me-Up', 'Meddle', 'Ruse', 'Not Dead Yet'] },
  { id: 'harbor', name: 'Harbor', role: 'controller', abilities: ['Storm Surge', 'High Tide', 'Cove', 'Reckoning'] },
  { id: 'miks', name: 'Miks', role: 'controller', abilities: ['M-pulse Concuss', 'M-pulse Healing', 'Harmonize', 'Waveform', 'Bassquake'] },

  { id: 'killjoy', name: 'Killjoy', role: 'sentinel', abilities: ['Nanoswarm', 'Alarmbot', 'Turret', 'Lockdown'] },
  { id: 'cypher', name: 'Cypher', role: 'sentinel', abilities: ['Trapwire', 'Cyber Cage', 'Spycam', 'Neural Theft'] },
  { id: 'chamber', name: 'Chamber', role: 'sentinel', abilities: ['Trademark', 'Headhunter', 'Rendezvous', 'Tour De Force'] },
  { id: 'sage', name: 'Sage', role: 'sentinel', abilities: ['Barrier Orb', 'Slow Orb', 'Healing Orb', 'Resurrection'] },
  { id: 'deadlock', name: 'Deadlock', role: 'sentinel', abilities: ['Barrier Mesh', 'Sonic Sensor', 'GravNet', 'Annihilation'] },
  { id: 'vyse', name: 'Vyse', role: 'sentinel', abilities: ['Razorvine', 'Shear', 'Arc Rose', 'Steel Garden'] },
  { id: 'veto', name: 'Veto', role: 'sentinel', abilities: ['Crosscut', 'Chokehold', 'Interceptor', 'Evolution'] },
];
