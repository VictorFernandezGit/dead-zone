import { CELL, ROWS, COLS, rnd } from "./constants.js";

export function generateTerrain(pathSet, pathPoints) {
  const deco = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (pathSet.has(`${c},${r}`)) {
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
    const pi = Math.floor(rnd(0, pathPoints.length));
    const [pc, pr] = pathPoints[pi];
    deco.push({ type:"bloodstain", x:pc*CELL+rnd(5,CELL-5), y:pr*CELL+rnd(5,CELL-5), s:rnd(4,12), a:rnd(0.05,0.15) });
  }
  return deco;
}

export function drawZombie(ctx, z, tick) {
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
  if (z.armor) {
    ctx.fillStyle = "rgba(100,100,120,0.5)";
    ctx.fillRect(-s*0.4, -s*0.3, s*0.8, s*0.5);
    ctx.strokeStyle = "rgba(140,140,160,0.4)"; ctx.lineWidth = 0.8;
    ctx.strokeRect(-s*0.4, -s*0.3, s*0.8, s*0.5);
  }
  if (z.charges && z.charging) {
    ctx.beginPath(); ctx.arc(0, 0, s*1.2, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,80,30,${0.15+Math.sin(tick*0.3)*0.1})`; ctx.fill();
  }
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

export function drawTower(ctx, t) {
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
