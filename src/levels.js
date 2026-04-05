// Each level defines: name, region, briefing, path, waves, theme, starting resources, available towers

export const LEVELS = [
  // ===== LEVEL 1: Farmland, Iowa =====
  {
    name: "Farmland",
    region: "Iowa",
    briefing: "The bus rolls to a stop at an abandoned farmstead. Open fields, a couple of barns, and a long dirt road stretching into the corn. The dead have been shambling through the countryside — slow, stupid, but relentless. Set up defenses along the road. This should be manageable.",
    intel: "Expect shamblers and crawlers. Nothing too fast, nothing too tough.",
    startingMoney: 250,
    startingLives: 20,
    availableTowers: ["rifle", "shotgun", "spike"],
    theme: {
      sky: ["#0d1210", "#1a1e16"],
      path: ["#2d261c", "#241f16"],
      ground: [18, 28, 14],
    },
    path: [
      [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],
      [6,7],[7,7],[8,7],[9,7],[10,7],[10,6],[10,5],[10,4],[10,3],[10,2],
      [11,2],[12,2],[13,2],[14,2],[15,2],[15,3],[15,4],[15,5],[15,6],[15,7],
      [15,8],[15,9],[15,10],[16,10],[17,10],[18,10],[19,10],[20,10],[21,10],
    ],
    waves: generateLevelWaves(1),
  },

  // ===== LEVEL 2: Small Town, Indiana =====
  {
    name: "Small Town",
    region: "Indiana",
    briefing: "A once-quiet main street, now littered with overturned cars and shattered windows. The dead here are more organized — brutes smash through barricades and chargers rush your lines. The town's L-shaped layout gives you a natural chokepoint if you use it.",
    intel: "New threat: Brutes (heavy HP) and Chargers (speed bursts). Bring firepower.",
    startingMoney: 275,
    startingLives: 20,
    availableTowers: ["rifle", "shotgun", "spike", "cannon"],
    theme: {
      sky: ["#0e100e", "#181c16"],
      path: ["#302820", "#28221a"],
      ground: [20, 26, 16],
    },
    path: [
      [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],
      [10,5],[10,4],[10,3],[10,2],[10,1],
      [11,1],[12,1],[13,1],[14,1],[15,1],[16,1],
      [16,2],[16,3],[16,4],[16,5],[16,6],[16,7],[16,8],
      [15,8],[14,8],[13,8],[12,8],[11,8],[10,8],
      [10,9],[10,10],[10,11],
      [11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[18,11],[19,11],[20,11],[21,11],
    ],
    waves: generateLevelWaves(2),
  },

  // ===== LEVEL 3: Suburbs, Ohio =====
  {
    name: "Suburbs",
    region: "Ohio",
    briefing: "Cookie-cutter houses, white picket fences — all splattered red. The suburban streets wind in a figure-8, and the dead pour from every cul-de-sac. Armored riot zombies from the local PD, and bloaters that heal the horde. This is where it gets real.",
    intel: "New threat: Riot Zombies (30% armor) and Bloaters (heal nearby dead). Burn them.",
    startingMoney: 300,
    startingLives: 18,
    availableTowers: ["rifle", "shotgun", "spike", "cannon", "fire"],
    theme: {
      sky: ["#100e10", "#1a161a"],
      path: ["#2a2428", "#221e22"],
      ground: [22, 24, 18],
    },
    path: [
      [0,3],[1,3],[2,3],[3,3],[4,3],
      [4,4],[4,5],[4,6],[4,7],
      [5,7],[6,7],[7,7],[8,7],
      [8,6],[8,5],[8,4],[8,3],[8,2],[8,1],
      [9,1],[10,1],[11,1],[12,1],[13,1],
      [13,2],[13,3],[13,4],[13,5],[13,6],[13,7],
      [14,7],[15,7],[16,7],[17,7],
      [17,8],[17,9],[17,10],
      [16,10],[15,10],[14,10],[13,10],[12,10],[11,10],[10,10],
      [10,11],[10,12],
      [11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],[19,12],[20,12],[21,12],
    ],
    waves: generateLevelWaves(3),
  },

  // ===== LEVEL 4: Highway Bridge, Pennsylvania =====
  {
    name: "Highway Bridge",
    region: "Pennsylvania",
    briefing: "A narrow highway bridge spanning a river gorge. Abandoned vehicles form natural barricades, but the dead are coming in massive numbers. The bridge switchbacks through stalled traffic. Chokepoints are tight — perfect for crowd control, but one breach and you're done.",
    intel: "Massive hordes incoming. Tight lanes, huge numbers. Freeze them or lose.",
    startingMoney: 325,
    startingLives: 15,
    availableTowers: ["rifle", "shotgun", "spike", "cannon", "fire", "freeze"],
    theme: {
      sky: ["#0a0c12", "#141820"],
      path: ["#2c2c30", "#242428"],
      ground: [16, 20, 22],
    },
    path: [
      [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
      [10,2],[10,3],
      [9,3],[8,3],[7,3],[6,3],[5,3],[4,3],[3,3],[2,3],
      [2,4],[2,5],
      [3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],
      [10,6],[10,7],
      [9,7],[8,7],[7,7],[6,7],[5,7],[4,7],[3,7],[2,7],
      [2,8],[2,9],
      [3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
      [11,10],[11,11],
      [12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[18,11],[19,11],[20,11],[21,11],
    ],
    waves: generateLevelWaves(4),
  },

  // ===== LEVEL 5: The Docks, New Jersey =====
  {
    name: "The Docks",
    region: "New Jersey",
    briefing: "You can see the ship. The MV Southern Cross, engines running, waiting at the industrial port. But the docks are overrun — the dead flood in from two directions through the warehouses. Hold the line until the ship is ready to depart. This is the final stand.",
    intel: "TWO entry points. Everything you've faced, plus the Leviathan. Full arsenal deployed. Survive 20 waves.",
    startingMoney: 400,
    startingLives: 15,
    availableTowers: ["rifle", "shotgun", "spike", "cannon", "fire", "freeze", "tesla"],
    theme: {
      sky: ["#080a10", "#12141e"],
      path: ["#262830", "#202228"],
      ground: [14, 18, 24],
    },
    // Two entry paths that converge
    path: [
      [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
      [6,4],[6,5],[6,6],[6,7],
      [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
      [15,8],[15,9],[15,10],
      [16,10],[17,10],[18,10],[19,10],[20,10],[21,10],
    ],
    path2: [
      [0,10],[1,10],[2,10],[3,10],[4,10],
      [4,9],[4,8],[4,7],[4,6],[4,5],
      [5,5],[6,5],
    ],
    waves: generateLevelWaves(5),
  },
];

function generateLevelWaves(level) {
  const waves = [];

  if (level === 1) {
    // 10 waves — easy tutorial, only shamblers + crawlers
    const defs = [
      [{ type:"shambler", count:6 }],
      [{ type:"shambler", count:8 },{ type:"crawler", count:3 }],
      [{ type:"shambler", count:10 },{ type:"crawler", count:5 }],
      [{ type:"walker", count:6 },{ type:"crawler", count:6 }],
      [{ type:"walker", count:8 },{ type:"shambler", count:6 },{ type:"crawler", count:4 }],
      [{ type:"walker", count:10 },{ type:"crawler", count:8 }],
      [{ type:"walker", count:12 },{ type:"shambler", count:8 }],
      [{ type:"walker", count:10 },{ type:"crawler", count:8 },{ type:"horde", count:8 }],
      [{ type:"walker", count:14 },{ type:"horde", count:12 }],
      [{ type:"walker", count:15 },{ type:"shambler", count:10 },{ type:"horde", count:15 }],
    ];
    for (let i = 0; i < defs.length; i++) {
      waves.push({ groups: defs[i], delay: Math.max(12, 26 - i), hpMult: 1 + i * 0.08 });
    }
  }

  else if (level === 2) {
    // 12 waves — introduces brutes + chargers
    const defs = [
      [{ type:"shambler", count:8 },{ type:"crawler", count:4 }],
      [{ type:"walker", count:8 },{ type:"runner", count:4 }],
      [{ type:"walker", count:10 },{ type:"runner", count:6 },{ type:"horde", count:6 }],
      [{ type:"brute", count:2 },{ type:"walker", count:8 }],
      [{ type:"runner", count:10 },{ type:"charger", count:4 }],
      [{ type:"brute", count:3 },{ type:"charger", count:6 },{ type:"horde", count:10 }],
      [{ type:"walker", count:12 },{ type:"brute", count:4 },{ type:"runner", count:8 }],
      [{ type:"charger", count:8 },{ type:"horde", count:15 }],
      [{ type:"brute", count:5 },{ type:"charger", count:8 },{ type:"runner", count:10 }],
      [{ type:"horde", count:25 },{ type:"brute", count:4 }],
      [{ type:"brute", count:6 },{ type:"charger", count:10 },{ type:"runner", count:12 }],
      [{ type:"boss", count:1 },{ type:"brute", count:4 },{ type:"charger", count:6 },{ type:"horde", count:15 }],
    ];
    for (let i = 0; i < defs.length; i++) {
      waves.push({ groups: defs[i], delay: Math.max(10, 24 - i), hpMult: 1 + i * 0.1 });
    }
  }

  else if (level === 3) {
    // 14 waves — introduces armored + bloaters
    const defs = [
      [{ type:"walker", count:10 },{ type:"runner", count:5 }],
      [{ type:"brute", count:3 },{ type:"charger", count:5 },{ type:"horde", count:8 }],
      [{ type:"armored", count:2 },{ type:"walker", count:10 }],
      [{ type:"spitter", count:3 },{ type:"brute", count:4 },{ type:"horde", count:10 }],
      [{ type:"runner", count:12 },{ type:"charger", count:8 },{ type:"armored", count:2 }],
      [{ type:"armored", count:4 },{ type:"spitter", count:4 },{ type:"walker", count:10 }],
      [{ type:"horde", count:25 },{ type:"brute", count:5 },{ type:"spitter", count:3 }],
      [{ type:"charger", count:10 },{ type:"armored", count:4 },{ type:"runner", count:10 }],
      [{ type:"boss", count:1 },{ type:"armored", count:4 },{ type:"brute", count:4 }],
      [{ type:"spitter", count:6 },{ type:"armored", count:6 },{ type:"horde", count:20 }],
      [{ type:"runner", count:15 },{ type:"charger", count:10 },{ type:"brute", count:6 }],
      [{ type:"armored", count:8 },{ type:"spitter", count:5 },{ type:"horde", count:25 }],
      [{ type:"boss", count:2 },{ type:"armored", count:6 },{ type:"charger", count:8 }],
      [{ type:"boss", count:2 },{ type:"armored", count:8 },{ type:"spitter", count:6 },{ type:"horde", count:30 }],
    ];
    for (let i = 0; i < defs.length; i++) {
      waves.push({ groups: defs[i], delay: Math.max(9, 22 - i), hpMult: 1 + i * 0.11 });
    }
  }

  else if (level === 4) {
    // 16 waves — massive hordes, tight chokepoints
    const defs = [
      [{ type:"horde", count:20 },{ type:"walker", count:8 }],
      [{ type:"runner", count:12 },{ type:"charger", count:6 }],
      [{ type:"brute", count:5 },{ type:"armored", count:3 },{ type:"horde", count:15 }],
      [{ type:"charger", count:10 },{ type:"horde", count:25 }],
      [{ type:"armored", count:5 },{ type:"spitter", count:4 },{ type:"brute", count:5 }],
      [{ type:"horde", count:35 },{ type:"runner", count:12 }],
      [{ type:"boss", count:1 },{ type:"armored", count:6 },{ type:"charger", count:8 }],
      [{ type:"brute", count:8 },{ type:"spitter", count:5 },{ type:"horde", count:25 }],
      [{ type:"runner", count:20 },{ type:"charger", count:12 },{ type:"armored", count:4 }],
      [{ type:"horde", count:40 },{ type:"armored", count:6 }],
      [{ type:"boss", count:2 },{ type:"brute", count:8 },{ type:"spitter", count:5 }],
      [{ type:"charger", count:15 },{ type:"horde", count:30 },{ type:"armored", count:8 }],
      [{ type:"armored", count:10 },{ type:"brute", count:10 },{ type:"runner", count:15 }],
      [{ type:"boss", count:2 },{ type:"horde", count:40 },{ type:"spitter", count:6 }],
      [{ type:"boss", count:3 },{ type:"armored", count:10 },{ type:"charger", count:12 }],
      [{ type:"boss", count:3 },{ type:"armored", count:12 },{ type:"horde", count:45 },{ type:"brute", count:8 }],
    ];
    for (let i = 0; i < defs.length; i++) {
      waves.push({ groups: defs[i], delay: Math.max(8, 20 - i * 0.8), hpMult: 1 + i * 0.12 });
    }
  }

  else if (level === 5) {
    // 20 waves — the final stand, everything + Leviathan boss
    const defs = [
      [{ type:"walker", count:12 },{ type:"runner", count:8 }],
      [{ type:"brute", count:4 },{ type:"charger", count:8 },{ type:"horde", count:12 }],
      [{ type:"armored", count:4 },{ type:"spitter", count:4 },{ type:"walker", count:10 }],
      [{ type:"horde", count:30 },{ type:"runner", count:12 }],
      [{ type:"boss", count:1 },{ type:"armored", count:6 },{ type:"brute", count:5 }],
      [{ type:"charger", count:12 },{ type:"horde", count:25 },{ type:"spitter", count:5 }],
      [{ type:"armored", count:8 },{ type:"brute", count:8 },{ type:"runner", count:15 }],
      [{ type:"boss", count:2 },{ type:"horde", count:30 },{ type:"charger", count:10 }],
      [{ type:"horde", count:40 },{ type:"armored", count:8 },{ type:"spitter", count:6 }],
      [{ type:"boss", count:2 },{ type:"brute", count:10 },{ type:"runner", count:20 }],
      [{ type:"armored", count:10 },{ type:"charger", count:15 },{ type:"horde", count:35 }],
      [{ type:"boss", count:3 },{ type:"spitter", count:8 },{ type:"brute", count:8 }],
      [{ type:"horde", count:50 },{ type:"armored", count:10 },{ type:"runner", count:15 }],
      [{ type:"boss", count:3 },{ type:"charger", count:15 },{ type:"horde", count:30 }],
      [{ type:"armored", count:12 },{ type:"brute", count:12 },{ type:"spitter", count:8 }],
      [{ type:"boss", count:4 },{ type:"horde", count:40 },{ type:"armored", count:10 }],
      [{ type:"horde", count:50 },{ type:"charger", count:20 },{ type:"brute", count:10 }],
      [{ type:"boss", count:4 },{ type:"armored", count:14 },{ type:"spitter", count:8 },{ type:"runner", count:15 }],
      [{ type:"boss", count:4 },{ type:"brute", count:15 },{ type:"armored", count:15 },{ type:"horde", count:50 }],
      [{ type:"megaboss", count:1 },{ type:"boss", count:4 },{ type:"armored", count:15 },{ type:"brute", count:12 },{ type:"horde", count:50 }],
    ];
    for (let i = 0; i < defs.length; i++) {
      waves.push({ groups: defs[i], delay: Math.max(7, 20 - i * 0.7), hpMult: 1 + i * 0.13 });
    }
  }

  return waves;
}
