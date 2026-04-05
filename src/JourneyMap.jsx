import { useRef, useEffect } from "react";
import { LEVELS } from "./levels.js";

const MAP_W = 900;
const MAP_H = 500;

// Stop positions on the map (spread across the width)
const STOPS = LEVELS.map((lvl, i) => ({
  x: 80 + (i / (LEVELS.length - 1)) * (MAP_W - 160),
  y: 250 + Math.sin(i * 1.2) * 60 + (i % 2 === 0 ? -20 : 20),
  name: lvl.name,
  region: lvl.region,
}));

export default function JourneyMap({ currentLevel, levelStars, survivors, totalScore, carryOverScrap, onDepart }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let tick = 0;

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, MAP_W, MAP_H);

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, MAP_H);
      bg.addColorStop(0, "#080a08");
      bg.addColorStop(0.5, "#0d120d");
      bg.addColorStop(1, "#141810");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, MAP_W, MAP_H);

      // Distant terrain silhouette
      ctx.fillStyle = "#0e140e";
      ctx.beginPath();
      ctx.moveTo(0, MAP_H);
      for (let x = 0; x <= MAP_W; x += 20) {
        const h = 120 + Math.sin(x * 0.008) * 40 + Math.sin(x * 0.02) * 20 + Math.cos(x * 0.005) * 30;
        ctx.lineTo(x, MAP_H - h);
      }
      ctx.lineTo(MAP_W, MAP_H);
      ctx.fill();

      // Stars in sky
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + 31) % MAP_W;
        const sy = (i * 53 + 17) % (MAP_H * 0.4);
        const flicker = 0.3 + Math.sin(tick * 0.02 + i) * 0.2;
        ctx.fillStyle = `rgba(200,200,180,${flicker})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Title
      ctx.font = "bold 11px 'Courier New', monospace";
      ctx.fillStyle = "#554433";
      ctx.textAlign = "center";
      ctx.fillText("MIDWEST ──────────────────────────────────── EAST COAST", MAP_W / 2, 30);

      // Route line (dotted)
      ctx.strokeStyle = "#332820";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(STOPS[0].x, STOPS[0].y);
      for (let i = 1; i < STOPS.length; i++) {
        ctx.lineTo(STOPS[i].x, STOPS[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Completed route (solid)
      if (currentLevel > 0) {
        ctx.strokeStyle = "#883322";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(180,50,30,0.3)";
        ctx.beginPath();
        ctx.moveTo(STOPS[0].x, STOPS[0].y);
        for (let i = 1; i <= Math.min(currentLevel, STOPS.length - 1); i++) {
          ctx.lineTo(STOPS[i].x, STOPS[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Stop nodes
      for (let i = 0; i < STOPS.length; i++) {
        const stop = STOPS[i];
        const isCompleted = i < currentLevel;
        const isCurrent = i === currentLevel;
        const isLocked = i > currentLevel;

        // Node circle
        const radius = isCurrent ? 14 + Math.sin(tick * 0.05) * 2 : 12;

        if (isCurrent) {
          // Pulsing glow
          ctx.beginPath();
          ctx.arc(stop.x, stop.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,80,40,${0.1 + Math.sin(tick * 0.04) * 0.05})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(stop.x, stop.y, radius, 0, Math.PI * 2);
        if (isCompleted) {
          ctx.fillStyle = "#2a4422";
          ctx.strokeStyle = "#44aa33";
        } else if (isCurrent) {
          ctx.fillStyle = "#3a2218";
          ctx.strokeStyle = "#cc4422";
        } else {
          ctx.fillStyle = "#1a1816";
          ctx.strokeStyle = "#333028";
        }
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner icon
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isCompleted) {
          ctx.fillStyle = "#44aa33";
          ctx.fillText("✓", stop.x, stop.y);
        } else if (isCurrent) {
          ctx.fillStyle = "#cc4422";
          ctx.fillText((i + 1).toString(), stop.x, stop.y);
        } else {
          ctx.fillStyle = "#444038";
          ctx.fillText("?", stop.x, stop.y);
        }

        // Stars for completed levels
        if (isCompleted && levelStars[i] > 0) {
          const stars = levelStars[i];
          const starY = stop.y - 22;
          ctx.font = "9px monospace";
          ctx.textAlign = "center";
          let starStr = "";
          for (let s = 0; s < 3; s++) {
            starStr += s < stars ? "★" : "☆";
          }
          ctx.fillStyle = stars === 3 ? "#ffd700" : stars === 2 ? "#ccaa44" : "#886633";
          ctx.fillText(starStr, stop.x, starY);
        }

        // Location name
        ctx.font = isLocked ? "9px 'Courier New', monospace" : "bold 10px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = isCompleted ? "#668855" : isCurrent ? "#cc8866" : "#443830";
        ctx.fillText(stop.name, stop.x, stop.y + 24);
        ctx.font = "8px 'Courier New', monospace";
        ctx.fillStyle = isCompleted ? "#445533" : isCurrent ? "#885544" : "#332820";
        ctx.fillText(stop.region, stop.x, stop.y + 35);
      }

      // Bus icon at current level
      if (currentLevel < STOPS.length) {
        const busStop = STOPS[currentLevel];
        const busX = busStop.x;
        const busY = busStop.y - 38 + Math.sin(tick * 0.03) * 3;

        // Bus body
        ctx.fillStyle = "#cc8822";
        ctx.beginPath();
        ctx.roundRect(busX - 14, busY - 8, 28, 16, 3);
        ctx.fill();
        ctx.strokeStyle = "#ffaa33";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Windows
        ctx.fillStyle = "#ffdd88";
        for (let w = 0; w < 3; w++) {
          ctx.fillRect(busX - 10 + w * 8, busY - 5, 5, 5);
        }

        // Wheels
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(busX - 8, busY + 8, 3, 0, Math.PI * 2);
        ctx.arc(busX + 8, busY + 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // "BUS" label
        ctx.font = "bold 6px monospace";
        ctx.fillStyle = "#ffdd88";
        ctx.textAlign = "center";
        ctx.fillText("BUS", busX, busY + 1);
      }

      // Ship at the end (if reached last level)
      const endX = STOPS[STOPS.length - 1].x + 50;
      const endY = STOPS[STOPS.length - 1].y - 10;
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      const shipAlpha = currentLevel >= STOPS.length - 1 ? 0.8 : 0.2;
      ctx.globalAlpha = shipAlpha;
      ctx.fillText("🚢", endX, endY);
      ctx.globalAlpha = 1;
      if (currentLevel >= STOPS.length - 1) {
        ctx.font = "8px 'Courier New', monospace";
        ctx.fillStyle = "#668888";
        ctx.fillText("MV Southern Cross", endX, endY + 16);
      }

      // Distance remaining
      const remaining = STOPS.length - currentLevel;
      ctx.font = "9px 'Courier New', monospace";
      ctx.fillStyle = "#443830";
      ctx.textAlign = "right";
      ctx.fillText(`${remaining} stop${remaining !== 1 ? "s" : ""} remaining`, MAP_W - 20, MAP_H - 15);

      // Vignette
      const vig = ctx.createRadialGradient(MAP_W / 2, MAP_H / 2, MAP_W * 0.3, MAP_W / 2, MAP_H / 2, MAP_W * 0.6);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, MAP_W, MAP_H);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [currentLevel, levelStars]);

  const level = currentLevel < LEVELS.length ? LEVELS[currentLevel] : null;

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: "linear-gradient(180deg, #080a08 0%, #0d120d 50%, #141a14 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace", color: "#b8b8a0", padding: 16, boxSizing: "border-box",
    }}>
      <h1 style={{
        fontSize: "clamp(24px, 5vw, 40px)", color: "#bb2222", margin: "0 0 4px",
        letterSpacing: 6, textShadow: "0 0 30px rgba(180,0,0,0.5)", fontWeight: 900,
      }}>
        DEAD ZONE
      </h1>
      <p style={{ color: "#554433", fontSize: 10, letterSpacing: 6, margin: "0 0 16px", textTransform: "uppercase" }}>
        Journey to the Docks
      </p>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: 20, marginBottom: 12, fontSize: 12, flexWrap: "wrap", justifyContent: "center",
      }}>
        <span>👥 <b style={{ color: "#ccaa88" }}>{survivors}</b> <span style={{ color: "#555", fontSize: 10 }}>survivors</span></span>
        <span>🔩 <b style={{ color: "#ffd700" }}>{carryOverScrap}</b> <span style={{ color: "#555", fontSize: 10 }}>scrap</span></span>
        <span>★ <b style={{ color: "#ffd700" }}>{totalScore}</b> <span style={{ color: "#555", fontSize: 10 }}>score</span></span>
      </div>

      {/* Map canvas */}
      <canvas
        ref={canvasRef}
        width={MAP_W}
        height={MAP_H}
        style={{
          width: "100%", maxWidth: MAP_W, display: "block",
          border: "1px solid #1a1816", borderRadius: 6,
        }}
      />

      {/* Current level info + depart button */}
      {level && (
        <div style={{
          maxWidth: 600, width: "100%", marginTop: 16, textAlign: "center",
        }}>
          <div style={{ fontSize: 14, color: "#cc8866", fontWeight: "bold", marginBottom: 4 }}>
            Next Stop: {level.name}, {level.region}
          </div>
          <div style={{ fontSize: 11, color: "#665544", marginBottom: 16 }}>
            {level.waves.length} waves · {level.availableTowers.length} towers available
          </div>
          <button
            onClick={onDepart}
            style={{
              background: "linear-gradient(180deg, #aa2222, #882222)",
              color: "#ffddcc", border: "1px solid #cc3333",
              padding: "14px 56px", fontSize: 16, fontWeight: "bold",
              cursor: "pointer", fontFamily: "inherit", letterSpacing: 4,
              borderRadius: 4, textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              boxShadow: "0 0 30px rgba(180,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            onMouseOver={e => e.target.style.background = "linear-gradient(180deg, #cc3333, #aa2222)"}
            onMouseOut={e => e.target.style.background = "linear-gradient(180deg, #aa2222, #882222)"}
          >
            CONTINUE JOURNEY
          </button>
        </div>
      )}
    </div>
  );
}
