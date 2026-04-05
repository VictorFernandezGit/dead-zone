import { useState, useCallback } from "react";
import { LEVELS } from "./levels.js";
import { pickEvents } from "./events.js";
import JourneyMap from "./JourneyMap.jsx";
import TravelEvent from "./TravelEvent.jsx";
import ZombieTD from "./ZombieTD.jsx";

// Game phases: "journey" | "briefing" | "playing" | "level_complete" | "travel_event" | "game_won" | "game_over_journey"
export default function App() {
  const [gamePhase, setGamePhase] = useState("journey");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [survivors, setSurvivors] = useState(4);
  const [totalScore, setTotalScore] = useState(0);
  const [levelStars, setLevelStars] = useState([0, 0, 0, 0, 0]);
  const [carryOverScrap, setCarryOverScrap] = useState(0);
  const [bonusLives, setBonusLives] = useState(0);
  const [usedEventIndices, setUsedEventIndices] = useState([]);

  // Travel event state
  const [currentEvent, setCurrentEvent] = useState(null);

  // Level complete info
  const [levelResult, setLevelResult] = useState(null);

  const handleDepart = useCallback(() => {
    // Go from journey map to playing the level
    setGamePhase("playing");
  }, []);

  const handleVictory = useCallback((result) => {
    // Calculate stars based on lives remaining
    const startingLives = LEVELS[currentLevel].startingLives + bonusLives;
    const pct = result.livesRemaining / startingLives;
    const stars = pct >= 0.75 ? 3 : pct >= 0.4 ? 2 : 1;

    setLevelResult({ ...result, stars });
    setTotalScore(prev => prev + result.score);

    const newStars = [...levelStars];
    newStars[currentLevel] = stars;
    setLevelStars(newStars);

    // Reset bonus lives for next level
    setBonusLives(0);

    setGamePhase("level_complete");
  }, [currentLevel, bonusLives, levelStars]);

  const handleDefeat = useCallback(() => {
    // On defeat, stay on the same level - player can retry from journey map
    setBonusLives(0);
    setGamePhase("game_over_journey");
  }, []);

  const handleLevelCompleteNext = useCallback(() => {
    const nextLevel = currentLevel + 1;

    if (nextLevel >= LEVELS.length) {
      // Game won!
      setGamePhase("game_won");
      return;
    }

    // Pick a travel event
    const events = pickEvents(1, usedEventIndices);
    if (events.length > 0) {
      const { event, index } = events[0];
      setCurrentEvent(event);
      setUsedEventIndices(prev => [...prev, index]);
      setCurrentLevel(nextLevel);
      setGamePhase("travel_event");
    } else {
      // No more events, just advance
      setCurrentLevel(nextLevel);
      setGamePhase("journey");
    }
  }, [currentLevel, usedEventIndices]);

  const handleEventComplete = useCallback((outcome) => {
    // Apply event outcomes
    if (outcome.survivors) setSurvivors(prev => prev + outcome.survivors);
    if (outcome.scrap) setCarryOverScrap(prev => Math.max(0, prev + outcome.scrap));
    if (outcome.bonusLives) setBonusLives(prev => prev + outcome.bonusLives);

    setCurrentEvent(null);
    setGamePhase("journey");
  }, []);

  const handleRetry = useCallback(() => {
    setBonusLives(0);
    setGamePhase("journey");
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentLevel(0);
    setSurvivors(4);
    setTotalScore(0);
    setLevelStars([0, 0, 0, 0, 0]);
    setCarryOverScrap(0);
    setBonusLives(0);
    setUsedEventIndices([]);
    setCurrentEvent(null);
    setLevelResult(null);
    setGamePhase("journey");
  }, []);

  // Journey Map
  if (gamePhase === "journey") {
    return (
      <JourneyMap
        currentLevel={currentLevel}
        levelStars={levelStars}
        survivors={survivors}
        totalScore={totalScore}
        carryOverScrap={carryOverScrap}
        onDepart={handleDepart}
      />
    );
  }

  // Travel Event
  if (gamePhase === "travel_event" && currentEvent) {
    return (
      <TravelEvent
        event={currentEvent}
        onComplete={handleEventComplete}
      />
    );
  }

  // Playing a level
  if (gamePhase === "playing") {
    const level = LEVELS[currentLevel];
    // Apply carry-over scrap and bonus lives
    const config = {
      ...level,
      startingMoney: level.startingMoney + carryOverScrap,
      startingLives: level.startingLives + bonusLives,
    };
    return (
      <ZombieTD
        key={`level-${currentLevel}-${Date.now()}`}
        levelConfig={config}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
      />
    );
  }

  // Level Complete
  if (gamePhase === "level_complete" && levelResult) {
    const stars = levelResult.stars;
    return (
      <div style={{
        width: "100%", minHeight: "100vh",
        background: "linear-gradient(180deg, #080a08, #0d120d, #141a14)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace", color: "#b8b8a0", padding: 16, boxSizing: "border-box",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 80, filter: "drop-shadow(0 0 30px rgba(0,180,0,0.4))" }}>🏆</div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)", color: "#44aa44",
            textShadow: "0 0 25px rgba(0,180,0,0.4)", letterSpacing: 4,
          }}>
            AREA SECURED
          </h1>
          <div style={{ fontSize: 16, color: "#cc8855", marginBottom: 8 }}>
            {LEVELS[currentLevel].name}, {LEVELS[currentLevel].region}
          </div>
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ color: i < stars ? "#ffd700" : "#333028", marginRight: 4 }}>
                {i < stars ? "★" : "☆"}
              </span>
            ))}
          </div>
          <div style={{
            fontSize: 13, marginBottom: 8, display: "flex", gap: 20,
            justifyContent: "center", flexWrap: "wrap",
          }}>
            <span><span style={{ color: "#666" }}>Kills </span><span style={{ color: "#ddd" }}>{levelResult.kills}</span></span>
            <span><span style={{ color: "#666" }}>Score </span><span style={{ color: "#ffd700" }}>{levelResult.score}</span></span>
            <span><span style={{ color: "#666" }}>Lives </span><span style={{ color: "#88aa66" }}>{levelResult.livesRemaining}</span></span>
          </div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 30 }}>
            {currentLevel < LEVELS.length - 1
              ? "The road ahead awaits. Gather your survivors and move out."
              : "The ship is in sight. One final push..."}
          </div>
          <button
            onClick={handleLevelCompleteNext}
            style={{
              background: "linear-gradient(180deg, #aa2222, #882222)",
              color: "#ffddcc", border: "1px solid #cc3333",
              padding: "14px 48px", fontSize: 16, fontWeight: "bold",
              cursor: "pointer", fontFamily: "inherit", letterSpacing: 3,
              borderRadius: 4, textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              boxShadow: "0 0 20px rgba(180,0,0,0.2)",
            }}
            onMouseOver={e => e.target.style.background = "linear-gradient(180deg, #cc3333, #aa2222)"}
            onMouseOut={e => e.target.style.background = "linear-gradient(180deg, #aa2222, #882222)"}
          >
            {currentLevel < LEVELS.length - 1 ? "MOVE OUT" : "BOARD THE SHIP"}
          </button>
        </div>
      </div>
    );
  }

  // Game Over (from journey perspective — can retry)
  if (gamePhase === "game_over_journey") {
    return (
      <div style={{
        width: "100%", minHeight: "100vh",
        background: "linear-gradient(180deg, #080a08, #0d120d, #141a14)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace", color: "#b8b8a0", padding: 16, boxSizing: "border-box",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 80, filter: "drop-shadow(0 0 30px rgba(200,0,0,0.4))" }}>💀</div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)", color: "#cc3333",
            textShadow: "0 0 25px rgba(200,0,0,0.4)", letterSpacing: 4,
          }}>
            OVERRUN
          </h1>
          <div style={{ fontSize: 14, color: "#885544", marginBottom: 8 }}>
            {LEVELS[currentLevel].name}, {LEVELS[currentLevel].region}
          </div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 30 }}>
            The dead reclaim this territory. But the bus still runs. Try again.
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleRetry}
              style={{
                background: "linear-gradient(180deg, #aa2222, #882222)",
                color: "#ffddcc", border: "1px solid #cc3333",
                padding: "12px 44px", fontSize: 16, fontWeight: "bold",
                cursor: "pointer", fontFamily: "inherit", letterSpacing: 3,
                borderRadius: 4,
              }}
              onMouseOver={e => e.target.style.background = "linear-gradient(180deg, #cc3333, #aa2222)"}
              onMouseOut={e => e.target.style.background = "linear-gradient(180deg, #aa2222, #882222)"}
            >
              RETRY
            </button>
            <button
              onClick={handleRestart}
              style={{
                background: "transparent", color: "#665544",
                border: "1px solid #333028", padding: "12px 24px",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                borderRadius: 4,
              }}
            >
              RESTART JOURNEY
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Won!
  if (gamePhase === "game_won") {
    const totalStars = levelStars.reduce((a, b) => a + b, 0);
    return (
      <div style={{
        width: "100%", minHeight: "100vh",
        background: "linear-gradient(180deg, #080a08, #0d120d, #141a14)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace", color: "#b8b8a0", padding: 16, boxSizing: "border-box",
      }}>
        <div style={{ textAlign: "center", maxWidth: 600 }}>
          <div style={{ fontSize: 80, filter: "drop-shadow(0 0 30px rgba(100,180,255,0.4))" }}>🚢</div>
          <h1 style={{
            fontSize: "clamp(28px, 6vw, 52px)", color: "#4488cc",
            textShadow: "0 0 30px rgba(100,180,255,0.4)", letterSpacing: 4, margin: "0 0 8px",
          }}>
            SAFE HARBOR
          </h1>
          <p style={{ color: "#668888", fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
            The MV Southern Cross pulls away from the docks as the dead swarm the pier behind you.
            {survivors} survivors aboard. Australia awaits — the last refuge of the living.
          </p>
          <div style={{
            background: "rgba(20,20,16,0.8)", border: "1px solid #2a2820",
            borderRadius: 8, padding: "16px 24px", marginBottom: 24,
            display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", fontSize: 13,
          }}>
            <span>👥 <b style={{ color: "#ccaa88" }}>{survivors}</b> saved</span>
            <span>★ <b style={{ color: "#ffd700" }}>{totalScore}</b> score</span>
            <span>⭐ <b style={{ color: "#ffd700" }}>{totalStars}</b>/15 stars</span>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {LEVELS.map((lvl, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10 }}>
                <div style={{ color: "#668855" }}>{lvl.name}</div>
                <div style={{ color: "#ffd700" }}>
                  {[...Array(3)].map((_, s) => (
                    <span key={s}>{s < levelStars[i] ? "★" : "☆"}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleRestart}
            style={{
              background: "linear-gradient(180deg, #336699, #224466)",
              color: "#ccddee", border: "1px solid #4488aa",
              padding: "14px 56px", fontSize: 18, fontWeight: "bold",
              cursor: "pointer", fontFamily: "inherit", letterSpacing: 4,
              borderRadius: 4, textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              boxShadow: "0 0 30px rgba(100,180,255,0.15)",
            }}
            onMouseOver={e => e.target.style.background = "linear-gradient(180deg, #4488aa, #336699)"}
            onMouseOut={e => e.target.style.background = "linear-gradient(180deg, #336699, #224466)"}
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
