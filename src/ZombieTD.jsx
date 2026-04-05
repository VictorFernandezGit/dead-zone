import { useState, useEffect, useCallback, useRef } from "react";
import * as Tone from "tone";

const COLS = 22;
const ROWS = 13;
const CELL = 44;
const W = COLS * CELL;
const H = ROWS * CELL;

const PATH_POINTS = [
  [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],
  [6,7],[7,7],[8,7],[9,7],[10,7],[10,6],[10,5],[10,4],[10,3],[10,2],
  [11,2],[12,2],[13,2],[14,2],[15,2],[15,3],[15,4],[15,5],[15,6],[15,7],
  [15,8],[15,9],[15,10],[16,10],[17,10],[18,10],[19,10],[20,10],[21,10],
];
const PATH_SET = new Set(PATH_POINTS.map(([c,r])=>`${c},${r}`));

const TOWERS = {
  rifle: { name:"Marksman", cost:100, dmg:28, range:4.5, rate:38, color:"#5b9bd5", icon:"⊕", desc:"Reliable long-range rifle", bullet:"#8ec4ff", projSize:3 },
  shotgun: { name:"Boomstick", cost:75, dmg:15, range:2.2, rate:20, color:"#e8823a", icon:"◎", desc:"Devastating close spread", bullet:"#ffaa55", splash:1.0, projSize:4 },
  fire: { name:"Inferno", cost:150, dmg:6, range:3, rate:16, color:"#e84040", icon:"♨", desc:"Burns the horde alive", bullet:"#ff6633", splash:1.6, dot:6, projSize:5 },
  spike: { name:"Spike Trap", cost:50, dmg:0, range:0, rate:0, color:"#777", icon:"⚒", desc:"Slows zombies 40%", slow:0.4 },
  tesla: { name:"Arc Pylon", cost:225, dmg:35, range:3.5, rate:48, color:"#00d4ff", icon:"⚡", desc:"Chain lightning + stun", bullet:"#00ffff", chain:4, projSize:3 },
  cannon: { name:"Cannon", cost:180, dmg:60, range:4, rate:70, color:"#cc8833", icon:"☄", desc:"Massive AOE blast", bullet:"#ffcc44", splash:2.0, projSize:6 },
  freeze: { name:"Cryo Tower", cost:175, dmg:3, range:3.5, rate:28, color:"#88ccff", icon:"❄", desc:"Freezes and slows nearby", bullet:"#aaddff", splash:1.5, freezeTime:50, projSize:4 },
};

const ZOMBIE_DEFS = {
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

function generateWaves(count) {
  const waves = [];
  for (let i = 0; i < count; i++) {
    const groups = [];
    if (i === 0) {
      groups.push({ type:"shambler", count:8 });
    } else if (i === 1) {
      groups.push({ type:"shambler", count:10 });
      groups.push({ type:"crawler", count:5 });
    } else if (i === 2) {
      groups.push({ type:"walker", count:8 });
      groups.push({ type:"crawler", count:6 });
      groups.push({ type:"runner", count:3 });
    } else if (i === 3) {
      groups.push({ type:"walker", count:10 });
      groups.push({ type:"runner", count:6 });
      groups.push({ type:"horde", count:8 });
    } else if (i === 4) {
      groups.push({ type:"walker", count:8 });
      groups.push({ type:"runner", count:8 });
      groups.push({ type:"brute", count:2 });
      groups.push({ type:"horde", count:10 });
    } else if (i === 5) {
      groups.push({ type:"runner", count:12 });
      groups.push({ type:"brute", count:3 });
      groups.push({ type:"charger", count:5 });
    } else if (i === 6) {
      groups.push({ type:"walker", count:12 });
      groups.push({ type:"brute", count:4 });
      groups.push({ type:"spitter", count:4 });
      groups.push({ type:"horde", count:12 });
    } else if (i === 7) {
      groups.push({ type:"runner", count:15 });
      groups.push({ type:"charger", count:8 });
      groups.push({ type:"brute", count:3 });
      groups.push({ type:"armored", count:2 });
    } else if (i === 8) {
      groups.push({ type:"armored", count:4 });
      groups.push({ type:"brute", count:5 });
      groups.push({ type:"horde", count:20 });
      groups.push({ type:"spitter", count:3 });
    } else if (i === 9) {
      groups.push({ type:"boss", count:1 });
      groups.push({ type:"brute", count:6 });
      groups.push({ type:"runner", count:12 });
      groups.push({ type:"armored", count:3 });
    } else if (i === 10) {
      groups.push({ type:"armored", count:6 });
      groups.push({ type:"charger", count:10 });
      groups.push({ type:"horde", count:25 });
      groups.push({ type:"spitter", count:5 });
    } else if (i === 11) {
      groups.push({ type:"runner", count:20 });
      groups.push({ type:"brute", count:8 });
      groups.push({ type:"armored", count:5 });
      groups.push({ type:"charger", count:8 });
    } else if (i === 12) {
      groups.push({ type:"horde", count:35 });
      groups.push({ type:"armored", count:6 });
      groups.push({ type:"brute", count:6 });
      groups.push({ type:"spitter", count:6 });
    } else if (i === 13) {
      groups.push({ type:"boss", count:2 });
      groups.push({ type:"armored", count:8 });
      groups.push({ type:"runner", count:15 });
      groups.push({ type:"horde", count:20 });
    } else if (i === 14) {
      groups.push({ type:"charger", count:15 });
      groups.push({ type:"brute", count:10 });
      groups.push({ type:"armored", count:8 });
      groups.push({ type:"horde", count:30 });
    } else if (i === 15) {
      groups.push({ type:"boss", count:2 });
      groups.push({ type:"armored", count:10 });
      groups.push({ type:"brute", count:10 });
      groups.push({ type:"runner", count:20 });
      groups.push({ type:"spitter", count:8 });
    } else if (i === 16) {
      groups.push({ type:"horde", count:50 });
      groups.push({ type:"charger", count:15 });
      groups.push({ type:"armored", count:8 });
      groups.push({ type:"brute", count:8 });
    } else if (i === 17) {
      groups.push({ type:"boss", count:3 });
      groups.push({ type:"armored", count:12 });
      groups.push({ type:"runner", count:20 });
      groups.push({ type:"horde", count:30 });
    } else if (i === 18) {
      groups.push({ type:"boss", count:3 });
      groups.push({ type:"brute", count:15 });
      groups.push({ type:"armored", count:15 });
      groups.push({ type:"charger", count:20 });
      groups.push({ type:"horde", count:40 });
    } else {
      groups.push({ type:"megaboss", count:1 });
      groups.push({ type:"boss", count:4 });
      groups.push({ type:"armored", count:15 });
      groups.push({ type:"brute", count:12 });
      groups.push({ type:"horde", count:50 });
      groups.push({ type:"charger", count:15 });
    }
    const hpMult = 1 + i * 0.12;
    const delay = Math.max(8, 28 - i * 1.2);
    waves.push({ groups, delay: Math.round(delay), hpMult });
  }
  return waves;
}

const TOTAL_WAVES = 20;
const WAVES = generateWaves(TOTAL_WAVES);

function dist(x1,y1,x2,y2){ return Math.sqrt((x1-x2)**2+(y1-y2)**2); }
function lerp(a,b,t){ return a+(b-a)*t; }
function rnd(a,b){ return a+Math.random()*(b-a); }

let _id = 0;
const uid = () => ++_id;

// ========== SOUND ENGINE ==========
class SoundEngine {
  constructor() {
    this.ready = false;
    this.muted = false;
  }
  async init() {
    if (this.ready) return;
    try {
      await Tone.start();
      this.masterVol = new Tone.Volume(-8).toDestination();
      
      // Ambient drone
      this.ambientSynth = new Tone.FMSynth({
        oscillator: { type: "sine" },
        envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
        modulation: { type: "sine" },
        modulationEnvelope: { attack: 3, decay: 2, sustain: 0.6, release: 4 },
      }).connect(new Tone.Volume(-28).connect(new Tone.Reverb({ decay: 8, wet: 0.7 }).connect(this.masterVol)));
      
      // Rifle shot
      this.rifleSynth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
      }).connect(new Tone.Filter(3000, "bandpass").connect(new Tone.Volume(-16).connect(this.masterVol)));
      
      // Shotgun
      this.shotgunSynth = new Tone.NoiseSynth({
        noise: { type: "brown" },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
      }).connect(new Tone.Filter(1500, "lowpass").connect(new Tone.Volume(-12).connect(this.masterVol)));
      
      // Explosion / cannon
      this.explosionSynth = new Tone.MembraneSynth({
        pitchDecay: 0.08, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
      }).connect(new Tone.Distortion(0.4).connect(new Tone.Volume(-14).connect(this.masterVol)));
      
      // Tesla zap
      this.zapSynth = new Tone.FMSynth({
        harmonicity: 8, modulationIndex: 20,
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
        modulation: { type: "square" },
      }).connect(new Tone.Volume(-18).connect(this.masterVol));
      
      // Fire whoosh
      this.fireSynth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0 },
      }).connect(new Tone.Filter(2000, "lowpass").connect(new Tone.Volume(-18).connect(this.masterVol)));
      
      // Freeze
      this.freezeSynth = new Tone.MetalSynth({
        frequency: 400, envelope: { attack: 0.001, decay: 0.25, release: 0.1 },
        harmonicity: 12, modulationIndex: 8, resonance: 2000, octaves: 1,
      }).connect(new Tone.Volume(-22).connect(this.masterVol));
      
      // Zombie death
      this.deathSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05, octaves: 4, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      }).connect(new Tone.Volume(-16).connect(this.masterVol));
      
      // Place tower
      this.placeSynth = new Tone.MetalSynth({
        frequency: 200, envelope: { attack: 0.001, decay: 0.15, release: 0.05 },
        harmonicity: 5.1, modulationIndex: 16, resonance: 3000, octaves: 0.5,
      }).connect(new Tone.Volume(-20).connect(this.masterVol));
      
      // Wave start horn
      this.hornSynth = new Tone.FMSynth({
        harmonicity: 2, modulationIndex: 3,
        envelope: { attack: 0.1, decay: 0.4, sustain: 0.3, release: 0.5 },
      }).connect(new Tone.Reverb({ decay: 3, wet: 0.5 }).connect(new Tone.Volume(-14).connect(this.masterVol)));
      
      // Breach alarm
      this.alarmSynth = new Tone.FMSynth({
        harmonicity: 4, modulationIndex: 10,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 },
      }).connect(new Tone.Volume(-16).connect(this.masterVol));
      
      // Game over
      this.gameOverSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.05, decay: 1.5, sustain: 0, release: 1 },
      }).connect(new Tone.Reverb({ decay: 5, wet: 0.6 }).connect(new Tone.Volume(-12).connect(this.masterVol)));
      
      // Victory fanfare
      this.victorySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1 },
      }).connect(new Tone.Reverb({ decay: 4, wet: 0.5 }).connect(new Tone.Volume(-12).connect(this.masterVol)));

      // Zombie groan
      this.groanSynth = new Tone.FMSynth({
        harmonicity: 1.5, modulationIndex: 5,
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.3, decay: 0.6, sustain: 0.2, release: 0.4 },
        modulation: { type: "sine" },
      }).connect(new Tone.Filter(600, "lowpass").connect(new Tone.Reverb({ decay: 2, wet: 0.4 }).connect(new Tone.Volume(-26).connect(this.masterVol))));
      
      this.ready = true;
    } catch(e) { console.warn("Audio init failed:", e); }
  }
  
  play(type) {
    if (!this.ready || this.muted) return;
    try {
      const now = Tone.now();
      switch(type) {
        case "rifle": this.rifleSynth.triggerAttackRelease("16n", now); break;
        case "shotgun": this.shotgunSynth.triggerAttackRelease("8n", now); break;
        case "explosion": this.explosionSynth.triggerAttackRelease("C1", "8n", now); break;
        case "cannon": this.explosionSynth.triggerAttackRelease("G0", "4n", now); break;
        case "zap": this.zapSynth.triggerAttackRelease("C5", "16n", now); break;
        case "fire": this.fireSynth.triggerAttackRelease("8n", now); break;
        case "freeze": this.freezeSynth.triggerAttackRelease("16n", now); break;
        case "death": this.deathSynth.triggerAttackRelease("E1", "16n", now); break;
        case "bigdeath": this.deathSynth.triggerAttackRelease("C1", "8n", now); break;
        case "place": this.placeSynth.triggerAttackRelease("16n", now); break;
        case "sell": this.placeSynth.triggerAttackRelease("32n", now); break;
        case "wavestart":
          this.hornSynth.triggerAttackRelease("D3", "4n", now);
          this.hornSynth.triggerAttackRelease("A3", "4n", now + 0.3);
          break;
        case "breach":
          this.alarmSynth.triggerAttackRelease("A4", "16n", now);
          this.alarmSynth.triggerAttackRelease("E4", "16n", now + 0.1);
          break;
        case "gameover":
          this.gameOverSynth.triggerAttackRelease(["D2","A2","F2"], "2n", now);
          break;
        case "victory":
          this.victorySynth.triggerAttackRelease(["C4","E4","G4"], "8n", now);
          this.victorySynth.triggerAttackRelease(["E4","G4","C5"], "8n", now + 0.25);
          this.victorySynth.triggerAttackRelease(["G4","C5","E5"], "4n", now + 0.5);
          break;
        case "groan":
          this.groanSynth.triggerAttackRelease(rnd(55,85), "8n", now);
          break;
        case "ambientstart":
          this.ambientSynth.triggerAttack("C1", now);
          break;
        case "ambientstop":
          this.ambientSynth.triggerRelease(now);
          break;
      }
    } catch(e) {}
  }
  
  toggle() { this.muted = !this.muted; return this.muted; }
}

const sfx = new SoundEngine();

function generateTerrain() {
  const deco = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (PATH_SET.has(`${c},${r}`)) {
        for (let i = 0; i < 2; i++) {
          if (Math.random() < 0.3) deco.push({ type:"rubble", x:c*CELL+rnd(4,CELL-4), y:r*CELL+rnd(4,CELL-4), s:rnd(1,3), c:`rgba(60,50,35,${rnd(0.3,0.6)})` });
        }
        if (Math.random()<0.08) deco.push({ type:"crack", x:c*CELL+rnd(8,CELL-8), y:r*CELL+rnd(8,CELL-8), rot:rnd(0,Math.PI*2) });
      } else {
        for (let i = 0; i < 3; i++) {
          if (Math.random()<0.35) deco.push({ type:"grass", x:c*CELL+rnd(2,CELL-2), y:r*CELL+rnd(2,CELL-2), h:rnd(3,8), c:`rgba(${30+Math.floor(rnd(0,25))},${50+Math.floor(rnd(0,30))},${20+Math.floor(rnd(0,15))},${rnd(0.4,0.8)})` });
        }
        if (Math.random()<0.04) deco.push({ type:"rock", x:c*CELL+rnd(6,CELL-6), y:r*CELL+rnd(6,CELL-6), s:rnd(3,7), c:`rgba(${50+Math.floor(rnd(0,30))},${45+Math.floor(rnd(0,25))},${40+Math.floor(rnd(0,20))},${rnd(0.5,0.8)})` });
        if (Math.random()<0.02) deco.push({ type:"stump", x:c*CELL+rnd(10,CELL-10), y:r*CELL+rnd(10,CELL-10), s:rnd(4,8) });
      }
    }
  }
  for (let i = 0; i < 8; i++) {
    const pi = Math.floor(rnd(0, PATH_POINTS.length));
    const [pc, pr] = PATH_POINTS[pi];
    deco.push({ type:"bloodstain", x:pc*CELL+rnd(5,CELL-5), y:pr*CELL+rnd(5,CELL-5), s:rnd(4,12), a:rnd(0.05,0.15) });
  }
  return deco;
}

function drawZombie(ctx, z, tick) {
  const s = CELL * z.size * 0.42;
  const wobble = Math.sin(tick * z.speed * 8 + z.id) * 3;
  const limbSwing = Math.sin(tick * z.speed * 12 + z.id) * 0.4;
  ctx.save();
  ctx.translate(z.x, z.y);
  ctx.beginPath();
  ctx.ellipse(0, s*0.9, s*1.1, s*0.3, 0, 0, Math.PI*2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();
  const legC = z.limbColor;
  ctx.strokeStyle = legC; ctx.lineWidth = Math.max(2, s*0.35); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-s*0.25, s*0.3); ctx.lineTo(-s*0.3+Math.sin(limbSwing)*4, s*0.9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s*0.25, s*0.3); ctx.lineTo(s*0.3-Math.sin(limbSwing)*4, s*0.9); ctx.stroke();
  ctx.lineWidth = Math.max(1.5, s*0.28);
  ctx.beginPath(); ctx.moveTo(-s*0.5, -s*0.1); ctx.quadraticCurveTo(-s*0.8, -s*0.5+wobble*0.3, -s*0.6+Math.cos(limbSwing)*5, -s*0.7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s*0.5, -s*0.1); ctx.quadraticCurveTo(s*0.8, -s*0.3-wobble*0.3, s*0.7-Math.cos(limbSwing)*5, -s*0.6); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, s*0.55, s*0.65, 0, 0, Math.PI*2);
  const bg = ctx.createRadialGradient(0,-s*0.1,0,0,0,s*0.7);
  if (z.stunTimer>0) { bg.addColorStop(0,"#44ccff"); bg.addColorStop(1,"#0088aa"); }
  else if (z.freezeTimer>0) { bg.addColorStop(0,"#aaddff"); bg.addColorStop(1,"#6699cc"); }
  else { bg.addColorStop(0,z.bodyColor); bg.addColorStop(1,z.limbColor); }
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1; ctx.stroke();
  // Armor plates
  if (z.armor) {
    ctx.fillStyle = "rgba(100,100,120,0.5)";
    ctx.fillRect(-s*0.4, -s*0.3, s*0.8, s*0.5);
    ctx.strokeStyle = "rgba(140,140,160,0.4)"; ctx.lineWidth = 0.8;
    ctx.strokeRect(-s*0.4, -s*0.3, s*0.8, s*0.5);
  }
  // Charger glow
  if (z.charges && z.charging) {
    ctx.beginPath(); ctx.arc(0, 0, s*1.2, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,80,30,${0.15+Math.sin(tick*0.3)*0.1})`; ctx.fill();
  }
  // Healer aura
  if (z.healer) {
    ctx.beginPath(); ctx.arc(0, 0, s*1.5, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(80,220,80,${0.2+Math.sin(tick*0.1)*0.1})`; ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (z.size>0.45) {
    ctx.fillStyle = "rgba(120,20,20,0.4)";
    ctx.beginPath(); ctx.arc(s*0.2, s*0.1, s*0.12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-s*0.35, -s*0.15, s*0.08, 0, Math.PI*2); ctx.fill();
  }
  const headS = s*0.42, headY = -s*0.55;
  ctx.beginPath(); ctx.arc(wobble*0.15, headY, headS, 0, Math.PI*2);
  ctx.fillStyle = z.bodyColor; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 0.8; ctx.stroke();
  const eyeGlow = z.type==="boss"||z.type==="megaboss"?"#ff2200":z.charges?"#ff6600":"#ccdd33";
  const eyeSize = headS*0.28;
  ctx.shadowBlur = z.type==="boss"||z.type==="megaboss"?10:4;
  ctx.shadowColor = eyeGlow; ctx.fillStyle = eyeGlow;
  ctx.beginPath(); ctx.arc(wobble*0.15-headS*0.3,headY-headS*0.1,eyeSize,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(wobble*0.15+headS*0.3,headY-headS*0.1,eyeSize,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(wobble*0.15-headS*0.3,headY-headS*0.1,eyeSize*0.45,0,Math.PI*2);
  ctx.arc(wobble*0.15+headS*0.3,headY-headS*0.1,eyeSize*0.45,0,Math.PI*2);
  ctx.fill();
  ctx.beginPath(); ctx.arc(wobble*0.15,headY+headS*0.35,headS*0.3,0,Math.PI);
  ctx.fillStyle = "#2a0a0a"; ctx.fill();
  if (z.type==="boss"||z.type==="megaboss") {
    ctx.strokeStyle = z.type==="megaboss"?"#660022":"#443322"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-headS*0.6,headY-headS*0.6); ctx.lineTo(-headS*0.3,headY-headS*1.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(headS*0.6,headY-headS*0.6); ctx.lineTo(headS*0.3,headY-headS*1.3); ctx.stroke();
    if (z.type==="megaboss") {
      ctx.beginPath(); ctx.moveTo(0,headY-headS*0.8); ctx.lineTo(0,headY-headS*1.5); ctx.stroke();
    }
  }
  if (z.dot>0) {
    for (let i=0;i<3;i++) {
      ctx.beginPath(); ctx.arc(rnd(-s,s),rnd(-s,s*0.5),rnd(1.5,3.5),0,Math.PI*2);
      ctx.fillStyle=`rgba(255,${Math.floor(rnd(80,180))},0,${rnd(0.4,0.8)})`; ctx.fill();
    }
  }
  ctx.restore();
  if (z.hp < z.maxHp) {
    const barW=CELL*z.size*0.9, barH=3.5, bx=z.x-barW/2, by=z.y-s*1.4;
    ctx.fillStyle="#1a0000"; ctx.fillRect(bx-0.5,by-0.5,barW+1,barH+1);
    const pct=z.hp/z.maxHp;
    ctx.fillStyle=pct>0.6?"#44aa33":pct>0.3?"#ccaa22":"#cc2222";
    ctx.fillRect(bx,by,barW*pct,barH);
    ctx.strokeStyle="rgba(0,0,0,0.3)"; ctx.lineWidth=0.5;
    for(let i=1;i<5;i++){const sx=bx+(barW/5)*i;ctx.beginPath();ctx.moveTo(sx,by);ctx.lineTo(sx,by+barH);ctx.stroke();}
  }
}

function drawTower(ctx, t) {
  const cx=t.x, cy=t.y, s=CELL*0.42;
  ctx.fillStyle="#2a2a2a";
  ctx.beginPath(); ctx.roundRect(cx-s,cy-s,s*2,s*2,4); ctx.fill();
  ctx.fillStyle="#333";
  ctx.beginPath(); ctx.roundRect(cx-s+2,cy-s+2,s*2-4,s*2-4,3); ctx.fill();
  const grad=ctx.createRadialGradient(cx,cy-2,0,cx,cy,s*0.9);
  grad.addColorStop(0,t.color); grad.addColorStop(1,`${t.color}88`);
  ctx.fillStyle=grad;
  ctx.beginPath(); ctx.roundRect(cx-s+5,cy-s+5,s*2-10,s*2-10,3); ctx.fill();
  ctx.font=`bold ${Math.floor(s*1.1)}px monospace`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.shadowBlur=6; ctx.shadowColor=t.color;
  ctx.fillText(t.icon,cx,cy); ctx.shadowBlur=0;
  if (t.targetAngle!==undefined && t.type!=="spike") {
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(t.targetAngle);
    ctx.strokeStyle=t.color; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(s*0.5,0); ctx.lineTo(s*0.9,0); ctx.stroke();
    ctx.restore();
  }
  if (t.cooldown>0 && t.rate>0) {
    const pct=t.cooldown/t.rate;
    ctx.beginPath(); ctx.arc(cx,cy,s+1,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-pct));
    ctx.strokeStyle=`${t.color}44`; ctx.lineWidth=1.5; ctx.stroke();
  }
}

export default function ZombieTD() {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const terrainRef = useRef(null);
  const [sel, setSel] = useState(null);
  const [money, setMoney] = useState(200);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const [state, setState] = useState("menu");
  const [kills, setKills] = useState(0);
  const [hover, setHover] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [info, setInfo] = useState(null);
  const [score, setScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const initAudio = async () => {
    await sfx.init();
    setAudioReady(true);
  };

  const init = useCallback(async () => {
    _id = 0;
    await initAudio();
    terrainRef.current = generateTerrain();
    gRef.current = {
      towers:[], zombies:[], bullets:[], particles:[], effects:[],
      spawnQueue:[], spawnTimer:0, money:200, lives:20, wave:0, kills:0,
      waveActive:false, tick:0, score:0, bloodStains:[], shake:0, ambientParticles:[],
      groanTimer:0, lastShotSound:0,
    };
    for (let i=0;i<20;i++) {
      gRef.current.ambientParticles.push({
        x:rnd(0,W), y:rnd(0,H), vx:rnd(-0.15,0.15), vy:rnd(-0.08,0.08), s:rnd(30,80), a:rnd(0.02,0.06)
      });
    }
    setMoney(200); setLives(20); setWave(0); setWaveActive(false);
    setKills(0); setState("playing"); setSel(null); setSpeed(1); setScore(0);
    sfx.play("ambientstart");
  }, []);

  const startWave = useCallback(() => {
    const g = gRef.current;
    if (!g||g.waveActive||g.wave>=TOTAL_WAVES) return;
    const w = WAVES[g.wave];
    const queue = [];
    for (const gr of w.groups) for (let i=0;i<gr.count;i++) queue.push({ type:gr.type, hpMult:w.hpMult });
    for (let i=queue.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]; }
    g.spawnQueue = queue; g.spawnTimer = 0; g.spawnDelay = w.delay;
    g.waveActive = true; setWaveActive(true);
    sfx.play("wavestart");
  }, []);

  const placeTower = useCallback((col, row) => {
    const g = gRef.current;
    if (!g||!sel) return;
    if (PATH_SET.has(`${col},${row}`)||col<0||col>=COLS||row<0||row>=ROWS) return;
    if (g.towers.find(t=>t.col===col&&t.row===row)) return;
    const td = TOWERS[sel];
    if (g.money<td.cost) return;
    g.money -= td.cost; setMoney(g.money);
    g.towers.push({ id:uid(), type:sel, col, row, x:col*CELL+CELL/2, y:row*CELL+CELL/2, cooldown:0, ...td, targetAngle:0 });
    sfx.play("place");
  }, [sel]);

  const addP = (g,x,y,type,count) => {
    for(let i=0;i<count;i++){
      if(type==="blood") g.particles.push({x,y,vx:rnd(-2.5,2.5),vy:rnd(-3,0.5),life:rnd(20,45),maxLife:45,s:rnd(1.5,4),color:`rgba(${120+Math.floor(rnd(0,60))},${Math.floor(rnd(0,20))},${Math.floor(rnd(0,15))},`,gravity:0.12});
      else if(type==="spark") g.particles.push({x,y,vx:rnd(-3,3),vy:rnd(-3,3),life:rnd(8,18),maxLife:18,s:rnd(1,2.5),color:"rgba(255,255,150,",gravity:0});
      else if(type==="smoke") g.particles.push({x,y,vx:rnd(-0.5,0.5),vy:rnd(-1.5,-0.3),life:rnd(25,50),maxLife:50,s:rnd(3,8),color:"rgba(60,60,60,",gravity:-0.02});
      else if(type==="ice") g.particles.push({x,y,vx:rnd(-1.5,1.5),vy:rnd(-2,0.5),life:rnd(15,30),maxLife:30,s:rnd(2,4),color:"rgba(180,220,255,",gravity:0.05});
    }
  };

  useEffect(() => {
    if (state !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const terrain = terrainRef.current || [];

    const tick = () => {
      const g = gRef.current; if (!g) return;

      for (let sp=0;sp<speed;sp++) {
        g.tick++;
        if (g.shake>0) g.shake--;

        // Zombie groans
        g.groanTimer--;
        if (g.groanTimer<=0 && g.zombies.length>0) {
          sfx.play("groan");
          g.groanTimer = Math.floor(rnd(80,200));
        }

        // Spawn
        if (g.spawnQueue.length>0) {
          g.spawnTimer--;
          if (g.spawnTimer<=0) {
            const info=g.spawnQueue.shift();
            const zd=ZOMBIE_DEFS[info.type];
            const scaledHp=Math.floor(zd.hp*info.hpMult);
            g.zombies.push({
              id:uid(), type:info.type, hp:scaledHp, maxHp:scaledHp,
              pathIdx:0, pathProg:0, x:PATH_POINTS[0][0]*CELL+CELL/2, y:PATH_POINTS[0][1]*CELL+CELL/2,
              speed:zd.spd*rnd(0.9,1.1), reward:zd.reward, bodyColor:zd.bodyColor,
              limbColor:zd.limbColor, size:zd.size, dot:0, dotTimer:0, slowTimer:0, stunTimer:0, freezeTimer:0,
              armor:zd.armor||0, healer:zd.healer||false, charges:zd.charges||false, regen:zd.regen||0,
              charging:false, chargeTimer:0,
            });
            g.spawnTimer = g.spawnDelay;
          }
        }

        // Move zombies
        for (const z of g.zombies) {
          if (z.stunTimer>0) { z.stunTimer--; continue; }
          
          // Regen
          if (z.regen>0 && z.hp<z.maxHp) z.hp = Math.min(z.maxHp, z.hp + z.regen);
          
          // Healer: heal nearby zombies
          if (z.healer) {
            for (const oz of g.zombies) {
              if (oz.id!==z.id && !oz.dead && oz.hp<oz.maxHp && dist(z.x,z.y,oz.x,oz.y)<CELL*2.5) {
                oz.hp = Math.min(oz.maxHp, oz.hp + 1);
              }
            }
          }
          
          // Charger ability: periodic speed burst
          if (z.charges) {
            z.chargeTimer++;
            if (z.chargeTimer > 120 && !z.charging) { z.charging = true; z.chargeTimer = 0; }
            if (z.charging && z.chargeTimer > 40) { z.charging = false; z.chargeTimer = 0; }
          }
          
          let spd = z.speed;
          if (z.charging) spd *= 2.8;
          if (z.slowTimer>0) { spd *= 0.6; z.slowTimer--; }
          if (z.freezeTimer>0) { spd *= 0.3; z.freezeTimer--; }
          for (const t of g.towers) { if (t.type==="spike" && dist(z.x,z.y,t.x,t.y)<CELL*1.1) spd *= 0.6; }
          z.pathProg += spd;
          while (z.pathProg>=1 && z.pathIdx<PATH_POINTS.length-2) { z.pathProg-=1; z.pathIdx++; }
          if (z.pathIdx<PATH_POINTS.length-1) {
            const [cx,cy]=PATH_POINTS[z.pathIdx];
            const [nx,ny]=PATH_POINTS[Math.min(z.pathIdx+1,PATH_POINTS.length-1)];
            z.x=lerp(cx*CELL+CELL/2,nx*CELL+CELL/2,z.pathProg);
            z.y=lerp(cy*CELL+CELL/2,ny*CELL+CELL/2,z.pathProg);
          }
          if (z.pathIdx>=PATH_POINTS.length-2 && z.pathProg>=1) {
            z.dead=true; g.lives--; setLives(g.lives);
            g.effects.push({type:"breach",x:z.x,y:z.y,timer:35});
            g.shake=10;
            sfx.play("breach");
          }
          if (z.dot>0) { z.dotTimer++; if (z.dotTimer%8===0) { z.hp-=z.dot; addP(g,z.x+rnd(-6,6),z.y+rnd(-6,6),"smoke",1); } }
        }

        // Towers
        for (const t of g.towers) {
          if (t.type==="spike") continue;
          if (t.cooldown>0) { t.cooldown--; continue; }
          let target=null, bestProg=-1;
          for (const z of g.zombies) {
            if (z.dead) continue;
            const d=dist(t.x,t.y,z.x,z.y)/CELL;
            if (d<=t.range) { const prog=z.pathIdx+z.pathProg; if(prog>bestProg){bestProg=prog;target=z;} }
          }
          if (target) {
            t.cooldown=t.rate;
            t.targetAngle=Math.atan2(target.y-t.y,target.x-t.x);
            g.bullets.push({
              id:uid(),x:t.x,y:t.y,tx:target.x,ty:target.y,targetId:target.id,
              damage:t.dmg,speed:7,color:t.bullet,splash:t.splash||0,dot:t.dot||0,
              chain:t.chain||0,towerType:t.type,projSize:t.projSize||3,freezeTime:t.freezeTime||0
            });
            addP(g,t.x,t.y,"spark",2);
            // Sound (throttled)
            if (g.tick - g.lastShotSound > 4) {
              g.lastShotSound = g.tick;
              if (t.type==="rifle") sfx.play("rifle");
              else if (t.type==="shotgun") sfx.play("shotgun");
              else if (t.type==="cannon") sfx.play("cannon");
              else if (t.type==="tesla") sfx.play("zap");
              else if (t.type==="fire") sfx.play("fire");
              else if (t.type==="freeze") sfx.play("freeze");
              else sfx.play("rifle");
            }
          }
        }

        // Bullets
        for (const b of g.bullets) {
          const tgt=g.zombies.find(z=>z.id===b.targetId&&!z.dead);
          if(tgt){b.tx=tgt.x;b.ty=tgt.y;}
          const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.sqrt(dx*dx+dy*dy);
          if (d<b.speed) {
            b.hit=true;
            const applyDmg=(z,dmgMult)=>{
              let dmg = b.damage * dmgMult;
              if (z.armor) dmg *= (1 - z.armor);
              z.hp -= dmg;
              if(b.dot) z.dot=b.dot;
              if(b.freezeTime) z.freezeTimer=Math.max(z.freezeTimer,b.freezeTime);
              if(z.hp<=0&&!z.dead){
                z.dead=true; g.money+=z.reward; g.kills++; g.score+=z.reward*2;
                setMoney(g.money); setKills(g.kills); setScore(g.score);
                addP(g,z.x,z.y,"blood",8);
                g.bloodStains.push({x:z.x,y:z.y,s:rnd(5,12+z.size*8),a:rnd(0.08,0.2)});
                g.effects.push({type:"death",x:z.x,y:z.y,timer:30,sz:z.size});
                if(z.size>=0.8){g.shake=5;sfx.play("bigdeath");}else{sfx.play("death");}
              }
            };
            if(tgt&&!tgt.dead)applyDmg(tgt,1);
            if(b.splash>0){
              for(const z of g.zombies){if(z.dead||z.id===b.targetId)continue;if(dist(b.tx,b.ty,z.x,z.y)/CELL<b.splash)applyDmg(z,0.5);}
              g.effects.push({type:"explosion",x:b.tx,y:b.ty,timer:22,radius:b.splash*CELL,color:b.color});
              addP(g,b.tx,b.ty,b.freezeTime?"ice":"smoke",5);
              if(b.splash>=2.0) sfx.play("explosion");
            }
            if(b.chain>0){
              let lx=b.tx,ly=b.ty;const chained=new Set([b.targetId]);
              for(let i=0;i<b.chain;i++){
                let cl=null,cd=999;
                for(const z of g.zombies){if(z.dead||chained.has(z.id))continue;const dd=dist(lx,ly,z.x,z.y);if(dd<cd&&dd<CELL*3.5){cd=dd;cl=z;}}
                if(cl){cl.stunTimer=18;chained.add(cl.id);applyDmg(cl,0.55);g.effects.push({type:"chain",x1:lx,y1:ly,x2:cl.x,y2:cl.y,timer:12});lx=cl.x;ly=cl.y;}
              }
            }
          } else { b.x+=(dx/d)*b.speed; b.y+=(dy/d)*b.speed; }
        }

        // Particles
        for(const p of g.particles){p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.life--;}
        for(const a of g.ambientParticles){a.x+=a.vx;a.y+=a.vy;if(a.x<-a.s)a.x=W+a.s;if(a.x>W+a.s)a.x=-a.s;if(a.y<-a.s)a.y=H+a.s;if(a.y>H+a.s)a.y=-a.s;}

        g.zombies=g.zombies.filter(z=>!z.dead);
        g.bullets=g.bullets.filter(b=>!b.hit);
        g.particles=g.particles.filter(p=>p.life>0);
        g.effects=g.effects.filter(e=>{e.timer--;return e.timer>0;});
        if(g.bloodStains.length>60)g.bloodStains.splice(0,g.bloodStains.length-60);

        if(g.waveActive&&g.spawnQueue.length===0&&g.zombies.length===0){
          g.wave++; g.waveActive=false;
          g.money+=20+g.wave*8;
          setWave(g.wave);setWaveActive(false);setMoney(g.money);
          if(g.wave>=TOTAL_WAVES){setState("victory");sfx.play("ambientstop");sfx.play("victory");}
        }
        if(g.lives<=0){setState("gameover");sfx.play("ambientstop");sfx.play("gameover");}
      }

      // === RENDER ===
      ctx.save();
      if(g.shake>0)ctx.translate(rnd(-g.shake,g.shake),rnd(-g.shake,g.shake));
      const skyG=ctx.createLinearGradient(0,0,0,H);
      skyG.addColorStop(0,"#0d1210");skyG.addColorStop(1,"#1a1e16");
      ctx.fillStyle=skyG;ctx.fillRect(0,0,W,H);

      for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){
        const x=c*CELL,y=r*CELL;
        if(PATH_SET.has(`${c},${r}`)){
          const pg=ctx.createLinearGradient(x,y,x,y+CELL);pg.addColorStop(0,"#2d261c");pg.addColorStop(1,"#241f16");
          ctx.fillStyle=pg;ctx.fillRect(x,y,CELL,CELL);
          ctx.strokeStyle="rgba(50,42,30,0.3)";ctx.lineWidth=0.5;ctx.strokeRect(x+0.5,y+0.5,CELL-1,CELL-1);
        }else{const n=((c*7+r*13)%5);ctx.fillStyle=`rgb(${18+n*2},${28+n*3},${14+n})`;ctx.fillRect(x,y,CELL,CELL);}
      }}

      for(const d of terrain){
        if(d.type==="grass"){ctx.strokeStyle=d.c;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+rnd(-2,2),d.y-d.h);ctx.stroke();}
        else if(d.type==="rock"){ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(d.x,d.y,d.s,0,Math.PI*2);ctx.fill();}
        else if(d.type==="rubble"){ctx.fillStyle=d.c;ctx.fillRect(d.x,d.y,d.s,d.s*0.7);}
        else if(d.type==="crack"){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.strokeStyle="rgba(20,18,12,0.4)";ctx.lineWidth=0.6;ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(0,2);ctx.lineTo(6,-1);ctx.stroke();ctx.restore();}
        else if(d.type==="bloodstain"){ctx.beginPath();ctx.arc(d.x,d.y,d.s,0,Math.PI*2);ctx.fillStyle=`rgba(80,15,10,${d.a})`;ctx.fill();}
        else if(d.type==="stump"){ctx.fillStyle="rgba(50,35,20,0.5)";ctx.beginPath();ctx.arc(d.x,d.y,d.s,0,Math.PI*2);ctx.fill();}
      }

      for(const bs of g.bloodStains){ctx.beginPath();ctx.arc(bs.x,bs.y,bs.s,0,Math.PI*2);ctx.fillStyle=`rgba(90,15,10,${bs.a})`;ctx.fill();}

      ctx.fillStyle="#cc3333";ctx.font="bold 9px monospace";ctx.textAlign="center";
      ctx.fillText("◄ ENTRY",PATH_POINTS[0][0]*CELL+CELL/2,PATH_POINTS[0][1]*CELL-5);
      const lp=PATH_POINTS[PATH_POINTS.length-1];
      ctx.fillStyle="#33cc33";ctx.fillText("EXIT ►",lp[0]*CELL+CELL/2,lp[1]*CELL-5);

      if(hover&&sel){
        const[hc,hr]=hover;
        const isP=PATH_SET.has(`${hc},${hr}`);const occ=g.towers.find(t=>t.col===hc&&t.row===hr);
        const can=!isP&&!occ&&hc>=0&&hc<COLS&&hr>=0&&hr<ROWS&&g.money>=TOWERS[sel].cost;
        ctx.fillStyle=can?"rgba(0,255,0,0.1)":"rgba(255,0,0,0.1)";
        ctx.fillRect(hc*CELL,hr*CELL,CELL,CELL);
        ctx.strokeStyle=can?"rgba(0,255,0,0.4)":"rgba(255,0,0,0.4)";
        ctx.lineWidth=1.5;ctx.strokeRect(hc*CELL,hr*CELL,CELL,CELL);
        if(can&&TOWERS[sel].range>0){
          ctx.beginPath();ctx.arc(hc*CELL+CELL/2,hr*CELL+CELL/2,TOWERS[sel].range*CELL,0,Math.PI*2);
          ctx.strokeStyle=`${TOWERS[sel].color}33`;ctx.lineWidth=1;ctx.stroke();
          ctx.fillStyle=`${TOWERS[sel].color}08`;ctx.fill();
        }
      }

      for(const e of g.effects){
        if(e.type==="explosion"){const p=e.timer/22;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(1.2-p),0,Math.PI*2);const eg=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.radius*(1.2-p));eg.addColorStop(0,`rgba(255,200,50,${p*0.5})`);eg.addColorStop(0.5,`rgba(255,100,20,${p*0.3})`);eg.addColorStop(1,"rgba(255,50,0,0)");ctx.fillStyle=eg;ctx.fill();}
        if(e.type==="chain"){ctx.beginPath();ctx.moveTo(e.x1,e.y1);const mx=(e.x1+e.x2)/2+(Math.sin(g.tick*0.5))*15,my=(e.y1+e.y2)/2+(Math.cos(g.tick*0.5))*15;ctx.quadraticCurveTo(mx,my,e.x2,e.y2);ctx.strokeStyle=`rgba(0,220,255,${e.timer/12})`;ctx.lineWidth=2.5;ctx.stroke();ctx.strokeStyle=`rgba(255,255,255,${e.timer/24})`;ctx.lineWidth=1;ctx.stroke();}
      }

      for(const t of g.towers)drawTower(ctx,t);
      const sorted=[...g.zombies].sort((a,b)=>a.y-b.y);
      for(const z of sorted)drawZombie(ctx,z,g.tick);

      for(const b of g.bullets){
        const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.sqrt(dx*dx+dy*dy)||1;
        ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-(dx/d)*12,b.y-(dy/d)*12);
        ctx.strokeStyle=b.color+"66";ctx.lineWidth=b.projSize*0.6;ctx.stroke();
        ctx.beginPath();ctx.arc(b.x,b.y,b.projSize,0,Math.PI*2);
        ctx.fillStyle=b.color;ctx.shadowBlur=6;ctx.shadowColor=b.color;ctx.fill();ctx.shadowBlur=0;
      }

      for(const p of g.particles){ctx.beginPath();ctx.arc(p.x,p.y,p.s*(p.life/p.maxLife),0,Math.PI*2);ctx.fillStyle=p.color+(p.life/p.maxLife).toFixed(2)+")";ctx.fill();}

      for(const e of g.effects){
        if(e.type==="death"){const p=1-e.timer/30;ctx.font=`${14+p*12}px serif`;ctx.textAlign="center";ctx.globalAlpha=e.timer/30;ctx.fillStyle="#ff3333";ctx.fillText("☠",e.x,e.y-p*20);ctx.globalAlpha=1;}
        if(e.type==="breach"){ctx.fillStyle=`rgba(255,0,0,${(e.timer/35)*0.25})`;ctx.fillRect(0,0,W,H);}
      }

      for(const a of g.ambientParticles){ctx.beginPath();ctx.arc(a.x,a.y,a.s,0,Math.PI*2);ctx.fillStyle=`rgba(100,110,90,${a.a})`;ctx.fill();}

      const vig=ctx.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.75);
      vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.4)");
      ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
      ctx.restore();
      animId=requestAnimationFrame(tick);
    };
    animId=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(animId);};
  },[state,hover,sel,speed]);

  const handleClick=(e)=>{
    if(state!=="playing")return;
    const rect=canvasRef.current.getBoundingClientRect();
    const sx=W/rect.width,sy=H/rect.height;
    const col=Math.floor((e.clientX-rect.left)*sx/CELL),row=Math.floor((e.clientY-rect.top)*sy/CELL);
    if(sel){placeTower(col,row);}
    else{const g=gRef.current;const t=g?.towers.find(t=>t.col===col&&t.row===row);setInfo(t||null);}
  };
  const handleMove=(e)=>{
    const rect=canvasRef.current.getBoundingClientRect();
    const sx=W/rect.width,sy=H/rect.height;
    setHover([Math.floor((e.clientX-rect.left)*sx/CELL),Math.floor((e.clientY-rect.top)*sy/CELL)]);
  };
  const sellTower=(t)=>{
    const g=gRef.current;if(!g)return;
    g.money+=Math.floor(TOWERS[t.type].cost*0.6);
    g.towers=g.towers.filter(tw=>tw.id!==t.id);
    setMoney(g.money);setInfo(null);sfx.play("sell");
  };
  const toggleMute=()=>{const m=sfx.toggle();setMuted(m);};

  if(state==="menu"){
    return(
      <div style={{width:"100%",minHeight:"100vh",background:"linear-gradient(180deg,#080a08 0%,#0d120d 50%,#141a14 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#b8b8a0",padding:16,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",maxWidth:640}}>
          <div style={{fontSize:70,filter:"drop-shadow(0 0 20px rgba(200,0,0,0.4))",marginBottom:4}}>🧟‍♂️</div>
          <h1 style={{fontSize:"clamp(32px,6vw,56px)",color:"#bb2222",margin:0,letterSpacing:6,textShadow:"0 0 30px rgba(180,0,0,0.5), 0 2px 0 #440000",fontWeight:900}}>DEAD ZONE</h1>
          <p style={{color:"#554433",fontSize:11,letterSpacing:8,margin:"2px 0 28px",textTransform:"uppercase"}}>Survive the Horde</p>
          <div style={{background:"rgba(20,20,16,0.8)",border:"1px solid #2a2820",borderRadius:8,padding:"18px 22px",marginBottom:24,textAlign:"left",fontSize:13,lineHeight:1.9,backdropFilter:"blur(4px)"}}>
            <p style={{color:"#883322",fontWeight:"bold",marginTop:0,fontSize:14,letterSpacing:2}}>SITUATION REPORT</p>
            <p style={{margin:0,color:"#998877"}}>The perimeter is gone. 20 lives stand between humanity and extinction. Zombies are <span style={{color:"#cc4444"}}>fast, armored, and relentless</span>. Chargers will rush your defenses. Bloaters heal the horde. The Leviathan regenerates. Place towers wisely — scrap is scarce.</p>
            <p style={{margin:"10px 0 0",color:"#776655",fontSize:11}}>🔊 Full sound effects — turn up your volume!</p>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:28}}>
            {Object.entries(TOWERS).map(([k,t])=>(
              <div key={k} style={{background:"rgba(20,20,16,0.9)",border:"1px solid #2a2820",borderRadius:6,padding:"8px 10px",fontSize:11,width:85,textAlign:"center"}}>
                <div style={{fontSize:22,filter:`drop-shadow(0 0 4px ${t.color}44)`}}>{t.icon}</div>
                <div style={{color:t.color,fontWeight:"bold",fontSize:10}}>{t.name}</div>
                <div style={{color:"#665544",fontSize:10}}>{t.cost} scrap</div>
              </div>
            ))}
          </div>
          <button onClick={init} style={{background:"linear-gradient(180deg,#aa2222,#882222)",color:"#ffddcc",border:"1px solid #cc3333",padding:"14px 56px",fontSize:18,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",letterSpacing:4,borderRadius:4,textShadow:"0 1px 2px rgba(0,0,0,0.5)",boxShadow:"0 0 30px rgba(180,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"}}
            onMouseOver={e=>e.target.style.background="linear-gradient(180deg,#cc3333,#aa2222)"}
            onMouseOut={e=>e.target.style.background="linear-gradient(180deg,#aa2222,#882222)"}>
            SURVIVE
          </button>
        </div>
      </div>
    );
  }

  if(state==="gameover"||state==="victory"){
    return(
      <div style={{width:"100%",minHeight:"100vh",background:"linear-gradient(180deg,#080a08,#0d120d,#141a14)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#b8b8a0",padding:16,boxSizing:"border-box"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:80,filter:`drop-shadow(0 0 30px ${state==="victory"?"rgba(0,180,0,0.4)":"rgba(200,0,0,0.4)"})`}}>{state==="victory"?"🏆":"💀"}</div>
          <h1 style={{fontSize:"clamp(28px,5vw,48px)",color:state==="victory"?"#44aa44":"#cc3333",textShadow:`0 0 25px ${state==="victory"?"rgba(0,180,0,0.4)":"rgba(200,0,0,0.4)"}`,letterSpacing:4}}>
            {state==="victory"?"AREA SECURED":"OVERRUN"}
          </h1>
          <div style={{fontSize:14,marginBottom:8,display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>
            <span><span style={{color:"#666"}}>Waves </span><span style={{color:"#ddd"}}>{wave}/{TOTAL_WAVES}</span></span>
            <span><span style={{color:"#666"}}>Kills </span><span style={{color:"#ddd"}}>{kills}</span></span>
            <span><span style={{color:"#666"}}>Score </span><span style={{color:"#ffd700"}}>{score}</span></span>
          </div>
          <div style={{fontSize:11,color:"#555",marginBottom:30}}>
            {state==="victory"?"Against all odds, the supply line holds.":"The dead consume everything."}
          </div>
          <button onClick={init} style={{background:"linear-gradient(180deg,#aa2222,#882222)",color:"#ffddcc",border:"1px solid #cc3333",padding:"12px 44px",fontSize:16,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",letterSpacing:3,borderRadius:4}}>
            {state==="victory"?"PLAY AGAIN":"TRY AGAIN"}
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={{width:"100%",minHeight:"100vh",background:"#080a08",fontFamily:"'Courier New',monospace",color:"#b8b8a0",display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 0",boxSizing:"border-box"}}>
      <div style={{width:"100%",maxWidth:W,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 10px",boxSizing:"border-box",flexWrap:"wrap",gap:4,background:"linear-gradient(180deg,#151512,#111110)",borderBottom:"1px solid #2a2820",borderRadius:"6px 6px 0 0"}}>
        <div style={{display:"flex",gap:14,alignItems:"center",fontSize:12}}>
          <span>🔩 <b style={{color:"#ffd700"}}>{money}</b></span>
          <span style={{color:lives<=6?"#ff4444":"#cc8888"}}>❤️ <b>{lives}</b><span style={{color:"#444",fontSize:10}}>/20</span></span>
          <span>☠ <b>{kills}</b></span>
          <span style={{color:"#ffd700",fontSize:10}}>★{score}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",fontSize:11}}>
          <span style={{color:"#665544"}}>Wave {wave+1}/{TOTAL_WAVES}</span>
          <button onClick={toggleMute} style={{background:"#1a1a16",border:"1px solid #333",color:muted?"#ff4444":"#44aa44",padding:"2px 6px",cursor:"pointer",fontSize:10,fontFamily:"inherit",borderRadius:3}}>
            {muted?"🔇":"🔊"}
          </button>
          <button onClick={()=>setSpeed(speed===1?2:speed===2?3:1)} style={{background:"#1a1a16",border:"1px solid #333",color:speed>1?"#ffd700":"#777",padding:"2px 7px",cursor:"pointer",fontSize:10,fontFamily:"inherit",borderRadius:3}}>{speed}x</button>
          {!waveActive&&wave<TOTAL_WAVES&&(
            <button onClick={startWave} style={{background:"linear-gradient(180deg,#aa2222,#882222)",color:"#ffeedd",border:"1px solid #cc3333",padding:"4px 14px",cursor:"pointer",fontWeight:"bold",fontSize:11,fontFamily:"inherit",borderRadius:3,animation:"pulse 1.5s infinite",boxShadow:"0 0 12px rgba(180,0,0,0.2)"}}>
              SEND WAVE
            </button>
          )}
          {waveActive&&<span style={{color:"#aa3333",fontSize:10,animation:"pulse 1s infinite"}}>⚠ INCOMING</span>}
        </div>
      </div>

      <div style={{position:"relative",width:"100%",maxWidth:W}}>
        <canvas ref={canvasRef} width={W} height={H}
          onClick={handleClick} onMouseMove={handleMove} onMouseLeave={()=>setHover(null)}
          style={{width:"100%",display:"block",cursor:sel?"crosshair":"pointer",border:"1px solid #1a1816"}}/>
        {info&&(
          <div style={{position:"absolute",top:8,right:8,background:"rgba(16,16,14,0.95)",border:"1px solid #2a2820",borderRadius:6,padding:12,fontSize:11,minWidth:130,zIndex:10}}>
            <div style={{fontSize:20,textAlign:"center",filter:`drop-shadow(0 0 4px ${info.color}44)`}}>{info.icon}</div>
            <div style={{color:info.color,fontWeight:"bold",textAlign:"center",fontSize:12}}>{info.name}</div>
            {info.dmg>0&&<div style={{color:"#776655",marginTop:6}}>DMG: <span style={{color:"#ccbbaa"}}>{info.dmg}</span></div>}
            {info.range>0&&<div style={{color:"#776655"}}>RNG: <span style={{color:"#ccbbaa"}}>{info.range}</span></div>}
            <button onClick={()=>sellTower(info)} style={{width:"100%",marginTop:8,padding:"5px 0",background:"rgba(80,20,20,0.5)",color:"#ff9988",border:"1px solid #442222",cursor:"pointer",fontSize:10,fontFamily:"inherit",borderRadius:3}}>
              SELL ({Math.floor(TOWERS[info.type].cost*0.6)} 🔩)
            </button>
            <button onClick={()=>setInfo(null)} style={{width:"100%",marginTop:3,padding:"3px 0",background:"transparent",color:"#555",border:"none",cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>close</button>
          </div>
        )}
      </div>

      <div style={{width:"100%",maxWidth:W,display:"flex",gap:3,padding:"5px 3px",boxSizing:"border-box",overflowX:"auto",background:"linear-gradient(180deg,#111110,#151512)",borderTop:"1px solid #2a2820",marginTop:4,borderRadius:"0 0 6px 6px"}}>
        {Object.entries(TOWERS).map(([k,t])=>{
          const canAfford=money>=t.cost;const isSel=sel===k;
          return(
            <button key={k} onClick={()=>{setSel(isSel?null:k);setInfo(null);}} style={{
              flex:"1 0 auto",minWidth:65,padding:"5px 4px 3px",
              background:isSel?"rgba(40,30,20,0.8)":"rgba(18,18,14,0.8)",
              border:`1.5px solid ${isSel?t.color:"#222220"}`,borderRadius:4,
              cursor:canAfford?"pointer":"not-allowed",opacity:canAfford?1:0.35,
              fontFamily:"inherit",textAlign:"center",transition:"border-color 0.15s"
            }}>
              <div style={{fontSize:16,filter:isSel?`drop-shadow(0 0 6px ${t.color}66)`:"none"}}>{t.icon}</div>
              <div style={{fontSize:9,color:t.color,fontWeight:"bold"}}>{t.name}</div>
              <div style={{fontSize:9,color:"#665544"}}>{t.cost}🔩</div>
            </button>
          );
        })}
      </div>

      {sel&&(
        <div style={{width:"100%",maxWidth:W,fontSize:10,color:"#665544",padding:"3px 10px",textAlign:"center",boxSizing:"border-box"}}>
          <span style={{color:TOWERS[sel].color}}>{TOWERS[sel].name}</span>
          {" — "}{TOWERS[sel].desc}
          {" · "}<span onClick={()=>setSel(null)} style={{color:"#883322",cursor:"pointer",textDecoration:"underline"}}>Cancel</span>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.65}}`}</style>
    </div>
  );
}
