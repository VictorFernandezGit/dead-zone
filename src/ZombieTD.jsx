import { useState, useEffect, useCallback, useRef } from "react";
import { COLS, ROWS, CELL, W, H, TOWERS, ZOMBIE_DEFS, dist, lerp, rnd, uid, resetId } from "./constants.js";
import { sfx } from "./sounds.js";
import { generateTerrain, drawZombie, drawTower } from "./renderers.js";

export default function ZombieTD({ levelConfig, onVictory, onDefeat }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const terrainRef = useRef(null);
  const [sel, setSel] = useState(null);
  const [money, setMoney] = useState(levelConfig.startingMoney);
  const [lives, setLives] = useState(levelConfig.startingLives);
  const [wave, setWave] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const [state, setState] = useState("briefing");
  const [kills, setKills] = useState(0);
  const [hover, setHover] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [info, setInfo] = useState(null);
  const [score, setScore] = useState(0);
  const [muted, setMuted] = useState(false);

  const TOTAL_WAVES = levelConfig.waves.length;
  const PATH_POINTS = levelConfig.path;
  const PATH_SET = new Set(PATH_POINTS.map(([c,r]) => `${c},${r}`));

  // For level 5 dual-path support
  const PATH2_POINTS = levelConfig.path2 || null;
  const PATH2_SET = PATH2_POINTS ? new Set(PATH2_POINTS.map(([c,r]) => `${c},${r}`)) : null;
  const COMBINED_PATH_SET = new Set([...PATH_SET, ...(PATH2_SET || [])]);

  // Available towers for this level
  const availableTowers = {};
  for (const key of levelConfig.availableTowers) {
    availableTowers[key] = TOWERS[key];
  }

  const theme = levelConfig.theme;

  const initAudio = async () => {
    await sfx.init();
  };

  const init = useCallback(async () => {
    resetId();
    await initAudio();
    terrainRef.current = generateTerrain(COMBINED_PATH_SET, PATH_POINTS);
    gRef.current = {
      towers:[], zombies:[], bullets:[], particles:[], effects:[],
      spawnQueue:[], spawnTimer:0, money:levelConfig.startingMoney, lives:levelConfig.startingLives,
      wave:0, kills:0, waveActive:false, tick:0, score:0, bloodStains:[], shake:0, ambientParticles:[],
      groanTimer:0, lastShotSound:0,
    };
    for (let i=0;i<20;i++) {
      gRef.current.ambientParticles.push({
        x:rnd(0,W), y:rnd(0,H), vx:rnd(-0.15,0.15), vy:rnd(-0.08,0.08), s:rnd(30,80), a:rnd(0.02,0.06)
      });
    }
    setMoney(levelConfig.startingMoney); setLives(levelConfig.startingLives); setWave(0); setWaveActive(false);
    setKills(0); setState("playing"); setSel(null); setSpeed(1); setScore(0);
    sfx.play("ambientstart");
  }, [levelConfig]);

  const startWave = useCallback(() => {
    const g = gRef.current;
    if (!g||g.waveActive||g.wave>=TOTAL_WAVES) return;
    const w = levelConfig.waves[g.wave];
    const queue = [];
    for (const gr of w.groups) for (let i=0;i<gr.count;i++) queue.push({ type:gr.type, hpMult:w.hpMult });
    for (let i=queue.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]; }

    // For dual-path levels, mark some zombies to use path2
    if (PATH2_POINTS) {
      for (let i = 0; i < queue.length; i++) {
        queue[i].usePath2 = Math.random() < 0.4; // 40% use the second path
      }
    }

    g.spawnQueue = queue; g.spawnTimer = 0; g.spawnDelay = w.delay;
    g.waveActive = true; setWaveActive(true);
    sfx.play("wavestart");
  }, [levelConfig, TOTAL_WAVES]);

  const placeTower = useCallback((col, row) => {
    const g = gRef.current;
    if (!g||!sel) return;
    if (COMBINED_PATH_SET.has(`${col},${row}`)||col<0||col>=COLS||row<0||row>=ROWS) return;
    if (g.towers.find(t=>t.col===col&&t.row===row)) return;
    const td = TOWERS[sel];
    if (g.money<td.cost) return;
    g.money -= td.cost; setMoney(g.money);
    g.towers.push({ id:uid(), type:sel, col, row, x:col*CELL+CELL/2, y:row*CELL+CELL/2, cooldown:0, ...td, targetAngle:0 });
    sfx.play("place");
  }, [sel, COMBINED_PATH_SET]);

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
            const usePath2 = info.usePath2 && PATH2_POINTS;
            const spawnPath = usePath2 ? PATH2_POINTS : PATH_POINTS;
            g.zombies.push({
              id:uid(), type:info.type, hp:scaledHp, maxHp:scaledHp,
              pathIdx:0, pathProg:0,
              x:spawnPath[0][0]*CELL+CELL/2, y:spawnPath[0][1]*CELL+CELL/2,
              speed:zd.spd*rnd(0.9,1.1), reward:zd.reward, bodyColor:zd.bodyColor,
              limbColor:zd.limbColor, size:zd.size, dot:0, dotTimer:0, slowTimer:0, stunTimer:0, freezeTimer:0,
              armor:zd.armor||0, healer:zd.healer||false, charges:zd.charges||false, regen:zd.regen||0,
              charging:false, chargeTimer:0,
              pathPoints: spawnPath,
            });
            g.spawnTimer = g.spawnDelay;
          }
        }

        // Move zombies
        for (const z of g.zombies) {
          if (z.stunTimer>0) { z.stunTimer--; continue; }
          if (z.regen>0 && z.hp<z.maxHp) z.hp = Math.min(z.maxHp, z.hp + z.regen);
          if (z.healer) {
            for (const oz of g.zombies) {
              if (oz.id!==z.id && !oz.dead && oz.hp<oz.maxHp && dist(z.x,z.y,oz.x,oz.y)<CELL*2.5) {
                oz.hp = Math.min(oz.maxHp, oz.hp + 1);
              }
            }
          }
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
          const zPath = z.pathPoints;
          while (z.pathProg>=1 && z.pathIdx<zPath.length-2) { z.pathProg-=1; z.pathIdx++; }
          if (z.pathIdx<zPath.length-1) {
            const [cx,cy]=zPath[z.pathIdx];
            const [nx,ny]=zPath[Math.min(z.pathIdx+1,zPath.length-1)];
            z.x=lerp(cx*CELL+CELL/2,nx*CELL+CELL/2,z.pathProg);
            z.y=lerp(cy*CELL+CELL/2,ny*CELL+CELL/2,z.pathProg);
          }

          // Path2 zombies merge into main path when they reach the end of path2
          if (z.pathPoints === PATH2_POINTS && z.pathIdx >= PATH2_POINTS.length - 2 && z.pathProg >= 1) {
            // Find the merge point in main path
            const lastP2 = PATH2_POINTS[PATH2_POINTS.length - 1];
            let mergeIdx = PATH_POINTS.findIndex(([c,r]) => c === lastP2[0] && r === lastP2[1]);
            if (mergeIdx >= 0) {
              z.pathPoints = PATH_POINTS;
              z.pathIdx = mergeIdx;
              z.pathProg = 0;
            } else {
              // If no merge point, they just reached the end
              z.dead=true; g.lives--; setLives(g.lives);
              g.effects.push({type:"breach",x:z.x,y:z.y,timer:35});
              g.shake=10; sfx.play("breach");
            }
          }
          // Main path zombies reaching the end
          else if (z.pathPoints === PATH_POINTS && z.pathIdx>=PATH_POINTS.length-2 && z.pathProg>=1) {
            z.dead=true; g.lives--; setLives(g.lives);
            g.effects.push({type:"breach",x:z.x,y:z.y,timer:35});
            g.shake=10; sfx.play("breach");
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
          if(g.wave>=TOTAL_WAVES){
            setState("victory");
            sfx.play("ambientstop");sfx.play("victory");
            if (onVictory) onVictory({ score: g.score, kills: g.kills, livesRemaining: g.lives });
          }
        }
        if(g.lives<=0){
          setState("gameover");
          sfx.play("ambientstop");sfx.play("gameover");
          if (onDefeat) onDefeat({ score: g.score, kills: g.kills });
        }
      }

      // === RENDER ===
      ctx.save();
      if(g.shake>0)ctx.translate(rnd(-g.shake,g.shake),rnd(-g.shake,g.shake));

      const skyG=ctx.createLinearGradient(0,0,0,H);
      skyG.addColorStop(0,theme.sky[0]);skyG.addColorStop(1,theme.sky[1]);
      ctx.fillStyle=skyG;ctx.fillRect(0,0,W,H);

      for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){
        const x=c*CELL,y=r*CELL;
        if(COMBINED_PATH_SET.has(`${c},${r}`)){
          const pg=ctx.createLinearGradient(x,y,x,y+CELL);pg.addColorStop(0,theme.path[0]);pg.addColorStop(1,theme.path[1]);
          ctx.fillStyle=pg;ctx.fillRect(x,y,CELL,CELL);
          ctx.strokeStyle="rgba(50,42,30,0.3)";ctx.lineWidth=0.5;ctx.strokeRect(x+0.5,y+0.5,CELL-1,CELL-1);
        }else{
          const [gr,gg,gb]=theme.ground;
          const n=((c*7+r*13)%5);
          ctx.fillStyle=`rgb(${gr+n*2},${gg+n*3},${gb+n})`;ctx.fillRect(x,y,CELL,CELL);
        }
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

      // Entry/exit markers
      ctx.fillStyle="#cc3333";ctx.font="bold 9px monospace";ctx.textAlign="center";
      ctx.fillText("\u25C4 ENTRY",PATH_POINTS[0][0]*CELL+CELL/2,PATH_POINTS[0][1]*CELL-5);
      if (PATH2_POINTS) {
        ctx.fillStyle="#cc6633";
        ctx.fillText("\u25C4 ENTRY 2",PATH2_POINTS[0][0]*CELL+CELL/2,PATH2_POINTS[0][1]*CELL-5);
      }
      const lp=PATH_POINTS[PATH_POINTS.length-1];
      ctx.fillStyle="#33cc33";ctx.fillText("EXIT \u25BA",lp[0]*CELL+CELL/2,lp[1]*CELL-5);

      if(hover&&sel){
        const[hc,hr]=hover;
        const isP=COMBINED_PATH_SET.has(`${hc},${hr}`);const occ=g.towers.find(t=>t.col===hc&&t.row===hr);
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
        if(e.type==="death"){const p=1-e.timer/30;ctx.font=`${14+p*12}px serif`;ctx.textAlign="center";ctx.globalAlpha=e.timer/30;ctx.fillStyle="#ff3333";ctx.fillText("\u2620",e.x,e.y-p*20);ctx.globalAlpha=1;}
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
  },[state,hover,sel,speed,levelConfig]);

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

  // Briefing screen
  if(state==="briefing"){
    return(
      <div style={{width:"100%",minHeight:"100vh",background:"linear-gradient(180deg,#080a08 0%,#0d120d 50%,#141a14 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#b8b8a0",padding:16,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",maxWidth:640}}>
          <div style={{fontSize:10,color:"#554433",letterSpacing:6,marginBottom:8,textTransform:"uppercase"}}>Incoming Transmission</div>
          <h1 style={{fontSize:"clamp(24px,5vw,40px)",color:"#cc8855",margin:"0 0 4px",letterSpacing:4,textShadow:"0 0 20px rgba(200,130,60,0.3)",fontWeight:900}}>
            {levelConfig.name}, {levelConfig.region}
          </h1>
          <div style={{background:"rgba(20,20,16,0.8)",border:"1px solid #2a2820",borderRadius:8,padding:"18px 22px",marginBottom:16,textAlign:"left",fontSize:13,lineHeight:1.9,backdropFilter:"blur(4px)"}}>
            <p style={{color:"#883322",fontWeight:"bold",marginTop:0,fontSize:14,letterSpacing:2}}>SITUATION REPORT</p>
            <p style={{margin:0,color:"#998877"}}>{levelConfig.briefing}</p>
          </div>
          <div style={{background:"rgba(20,20,16,0.6)",border:"1px solid #222018",borderRadius:6,padding:"12px 18px",marginBottom:20,textAlign:"left",fontSize:12,lineHeight:1.7}}>
            <p style={{color:"#885533",fontWeight:"bold",marginTop:0,fontSize:11,letterSpacing:2}}>INTEL</p>
            <p style={{margin:0,color:"#776655"}}>{levelConfig.intel}</p>
            <p style={{margin:"8px 0 0",color:"#555",fontSize:10}}>{TOTAL_WAVES} waves · {levelConfig.startingLives} lives · {levelConfig.startingMoney} scrap · {levelConfig.availableTowers.length} towers</p>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:24}}>
            {Object.entries(availableTowers).map(([k,t])=>(
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
            DEPLOY DEFENSES
          </button>
        </div>
      </div>
    );
  }

  if(state==="gameover"){
    return(
      <div style={{width:"100%",minHeight:"100vh",background:"linear-gradient(180deg,#080a08,#0d120d,#141a14)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#b8b8a0",padding:16,boxSizing:"border-box"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:80,filter:"drop-shadow(0 0 30px rgba(200,0,0,0.4))"}}>💀</div>
          <h1 style={{fontSize:"clamp(28px,5vw,48px)",color:"#cc3333",textShadow:"0 0 25px rgba(200,0,0,0.4)",letterSpacing:4}}>OVERRUN</h1>
          <div style={{fontSize:14,marginBottom:8,display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>
            <span><span style={{color:"#666"}}>Waves </span><span style={{color:"#ddd"}}>{wave}/{TOTAL_WAVES}</span></span>
            <span><span style={{color:"#666"}}>Kills </span><span style={{color:"#ddd"}}>{kills}</span></span>
            <span><span style={{color:"#666"}}>Score </span><span style={{color:"#ffd700"}}>{score}</span></span>
          </div>
          <div style={{fontSize:11,color:"#555",marginBottom:30}}>The dead consume everything.</div>
          <button onClick={init} style={{background:"linear-gradient(180deg,#aa2222,#882222)",color:"#ffddcc",border:"1px solid #cc3333",padding:"12px 44px",fontSize:16,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",letterSpacing:3,borderRadius:4}}>
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // Victory screen is now handled by the parent via onVictory callback
  // but we still show a brief "victory" state before the callback fires
  if(state==="victory"){
    return(
      <div style={{width:"100%",minHeight:"100vh",background:"linear-gradient(180deg,#080a08,#0d120d,#141a14)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#b8b8a0",padding:16,boxSizing:"border-box"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:80,filter:"drop-shadow(0 0 30px rgba(0,180,0,0.4))"}}>🏆</div>
          <h1 style={{fontSize:"clamp(28px,5vw,48px)",color:"#44aa44",textShadow:"0 0 25px rgba(0,180,0,0.4)",letterSpacing:4}}>AREA SECURED</h1>
          <div style={{fontSize:14,marginBottom:8,display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>
            <span><span style={{color:"#666"}}>Waves </span><span style={{color:"#ddd"}}>{wave}/{TOTAL_WAVES}</span></span>
            <span><span style={{color:"#666"}}>Kills </span><span style={{color:"#ddd"}}>{kills}</span></span>
            <span><span style={{color:"#666"}}>Score </span><span style={{color:"#ffd700"}}>{score}</span></span>
          </div>
          <div style={{fontSize:12,color:"#668855",marginBottom:8}}>
            Lives remaining: {lives} → {lives >= 15 ? "★★★" : lives >= 8 ? "★★" : "★"}
          </div>
          <div style={{fontSize:11,color:"#555",marginBottom:30}}>The road ahead awaits.</div>
        </div>
      </div>
    );
  }

  return(
    <div style={{width:"100%",minHeight:"100vh",background:"#080a08",fontFamily:"'Courier New',monospace",color:"#b8b8a0",display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 0",boxSizing:"border-box"}}>
      <div style={{width:"100%",maxWidth:W,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 10px",boxSizing:"border-box",flexWrap:"wrap",gap:4,background:"linear-gradient(180deg,#151512,#111110)",borderBottom:"1px solid #2a2820",borderRadius:"6px 6px 0 0"}}>
        <div style={{display:"flex",gap:14,alignItems:"center",fontSize:12}}>
          <span>🔩 <b style={{color:"#ffd700"}}>{money}</b></span>
          <span style={{color:lives<=6?"#ff4444":"#cc8888"}}>❤️ <b>{lives}</b><span style={{color:"#444",fontSize:10}}>/{levelConfig.startingLives}</span></span>
          <span>☠ <b>{kills}</b></span>
          <span style={{color:"#ffd700",fontSize:10}}>★{score}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",fontSize:11}}>
          <span style={{color:"#665544"}}>Wave {wave+1}/{TOTAL_WAVES}</span>
          <span style={{color:"#443322",fontSize:9}}>{levelConfig.name}</span>
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
        {Object.entries(availableTowers).map(([k,t])=>{
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
