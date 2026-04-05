export const COLS = 22;
export const ROWS = 13;
export const CELL = 44;
export const W = COLS * CELL;
export const H = ROWS * CELL;

export const TOWERS = {
  rifle: { name:"Marksman", cost:100, dmg:28, range:4.5, rate:38, color:"#5b9bd5", icon:"\u2295", desc:"Reliable long-range rifle", bullet:"#8ec4ff", projSize:3 },
  shotgun: { name:"Boomstick", cost:75, dmg:15, range:2.2, rate:20, color:"#e8823a", icon:"\u25CE", desc:"Devastating close spread", bullet:"#ffaa55", splash:1.0, projSize:4 },
  fire: { name:"Inferno", cost:150, dmg:6, range:3, rate:16, color:"#e84040", icon:"\u2668", desc:"Burns the horde alive", bullet:"#ff6633", splash:1.6, dot:6, projSize:5 },
  spike: { name:"Spike Trap", cost:50, dmg:0, range:0, rate:0, color:"#777", icon:"\u2692", desc:"Slows zombies 40%", slow:0.4 },
  tesla: { name:"Arc Pylon", cost:225, dmg:35, range:3.5, rate:48, color:"#00d4ff", icon:"\u26A1", desc:"Chain lightning + stun", bullet:"#00ffff", chain:4, projSize:3 },
  cannon: { name:"Cannon", cost:180, dmg:60, range:4, rate:70, color:"#cc8833", icon:"\u2604", desc:"Massive AOE blast", bullet:"#ffcc44", splash:2.0, projSize:6 },
  freeze: { name:"Cryo Tower", cost:175, dmg:3, range:3.5, rate:28, color:"#88ccff", icon:"\u2744", desc:"Freezes and slows nearby", bullet:"#aaddff", splash:1.5, freezeTime:50, projSize:4 },
};

export const ZOMBIE_DEFS = {
  shambler: { name:"Shambler", hp:100, spd:0.016, reward:10, bodyColor:"#4d6b3d", size:0.55, limbColor:"#3a5530" },
  walker: { name:"Walker", hp:150, spd:0.019, reward:12, bodyColor:"#3d5e3d", size:0.6, limbColor:"#2d4a2d" },
  runner: { name:"Sprinter", hp:80, spd:0.038, reward:14, bodyColor:"#6b4a3a", size:0.48, limbColor:"#5a3a2a" },
  crawler: { name:"Crawler", hp:55, spd:0.025, reward:8, bodyColor:"#7a6a4a", size:0.35, limbColor:"#6a5a3a" },
  brute: { name:"Brute", hp:450, spd:0.012, reward:28, bodyColor:"#2e4a2e", size:0.8, limbColor:"#1e3a1e" },
  spitter: { name:"Bloater", hp:200, spd:0.015, reward:20, bodyColor:"#5a6e3a", size:0.65, limbColor:"#4a5e2a", healer:true },
  armored: { name:"Riot Zombie", hp:650, spd:0.01, reward:35, bodyColor:"#4a4a5a", size:0.75, limbColor:"#3a3a4a", armor:0.3 },
  horde: { name:"Swarm", hp:40, spd:0.032, reward:5, bodyColor:"#5a5a4a", size:0.38, limbColor:"#4a4a3a" },
  charger: { name:"Charger", hp:120, spd:0.02, reward:16, bodyColor:"#7a3a2a", size:0.55, limbColor:"#6a2a1a", charges:true },
  boss: { name:"Abomination", hp:2000, spd:0.008, reward:120, bodyColor:"#1a3322", size:1.1, limbColor:"#0d2216" },
  megaboss: { name:"Leviathan", hp:5500, spd:0.006, reward:300, bodyColor:"#1a1a2a", size:1.3, limbColor:"#0d0d1a", regen:4 },
};

export function dist(x1,y1,x2,y2){ return Math.sqrt((x1-x2)**2+(y1-y2)**2); }
export function lerp(a,b,t){ return a+(b-a)*t; }
export function rnd(a,b){ return a+Math.random()*(b-a); }

let _id = 0;
export const uid = () => ++_id;
export const resetId = () => { _id = 0; };
