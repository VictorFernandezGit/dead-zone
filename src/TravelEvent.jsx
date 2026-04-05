import { useState } from "react";

export default function TravelEvent({ event, onComplete }) {
  const [chosen, setChosen] = useState(null);

  const handleChoice = (choice) => {
    setChosen(choice);
  };

  const handleContinue = () => {
    onComplete(chosen.outcome);
  };

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: "linear-gradient(180deg, #080a08 0%, #0d120d 50%, #141a14 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace", color: "#b8b8a0", padding: 16, boxSizing: "border-box",
    }}>
      <div style={{ textAlign: "center", maxWidth: 540 }}>
        {/* Road event header */}
        <div style={{ fontSize: 10, color: "#554433", letterSpacing: 6, marginBottom: 8, textTransform: "uppercase" }}>
          Road Event
        </div>

        {/* Event emoji */}
        <div style={{ fontSize: 56, marginBottom: 12, filter: "drop-shadow(0 0 15px rgba(200,150,50,0.2))" }}>
          {event.emoji}
        </div>

        {/* Event text */}
        <div style={{
          background: "rgba(20,20,16,0.8)", border: "1px solid #2a2820",
          borderRadius: 8, padding: "18px 22px", marginBottom: 20,
          fontSize: 14, lineHeight: 1.8, color: "#998877",
          backdropFilter: "blur(4px)", textAlign: "left",
        }}>
          {event.text}
        </div>

        {!chosen ? (
          /* Choices */
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {event.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                style={{
                  background: "rgba(30,25,20,0.9)",
                  border: "1px solid #443322",
                  color: "#ccaa88", padding: "12px 28px",
                  fontSize: 13, fontWeight: "bold", cursor: "pointer",
                  fontFamily: "inherit", borderRadius: 4,
                  letterSpacing: 1, minWidth: 160,
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseOver={e => { e.target.style.borderColor = "#885533"; e.target.style.background = "rgba(50,35,25,0.9)"; }}
                onMouseOut={e => { e.target.style.borderColor = "#443322"; e.target.style.background = "rgba(30,25,20,0.9)"; }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : (
          /* Outcome */
          <div>
            <div style={{
              background: "rgba(20,20,16,0.8)", border: `1px solid ${
                chosen.outcome.type === "good" ? "#335522" :
                chosen.outcome.type === "bad" ? "#553322" :
                chosen.outcome.type === "risky" ? "#554422" : "#333028"
              }`,
              borderRadius: 8, padding: "16px 20px", marginBottom: 16,
              fontSize: 13, lineHeight: 1.7, textAlign: "left",
              color: chosen.outcome.type === "good" ? "#88aa66" :
                     chosen.outcome.type === "bad" ? "#cc8866" :
                     chosen.outcome.type === "risky" ? "#ccaa55" : "#998877",
            }}>
              {chosen.outcome.message}
            </div>

            {/* Outcome effects */}
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 20, fontSize: 12 }}>
              {chosen.outcome.survivors > 0 && (
                <span style={{ color: "#88aa66" }}>+{chosen.outcome.survivors} survivor{chosen.outcome.survivors > 1 ? "s" : ""}</span>
              )}
              {chosen.outcome.scrap > 0 && (
                <span style={{ color: "#ffd700" }}>+{chosen.outcome.scrap} scrap</span>
              )}
              {chosen.outcome.scrap < 0 && (
                <span style={{ color: "#cc4444" }}>{chosen.outcome.scrap} scrap</span>
              )}
              {chosen.outcome.bonusLives > 0 && (
                <span style={{ color: "#88aa66" }}>+{chosen.outcome.bonusLives} lives next level</span>
              )}
              {chosen.outcome.bonusLives < 0 && (
                <span style={{ color: "#cc4444" }}>{chosen.outcome.bonusLives} lives next level</span>
              )}
            </div>

            <button
              onClick={handleContinue}
              style={{
                background: "linear-gradient(180deg, #aa2222, #882222)",
                color: "#ffddcc", border: "1px solid #cc3333",
                padding: "12px 44px", fontSize: 14, fontWeight: "bold",
                cursor: "pointer", fontFamily: "inherit", letterSpacing: 3,
                borderRadius: 4, textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                boxShadow: "0 0 20px rgba(180,0,0,0.2)",
              }}
              onMouseOver={e => e.target.style.background = "linear-gradient(180deg, #cc3333, #aa2222)"}
              onMouseOut={e => e.target.style.background = "linear-gradient(180deg, #aa2222, #882222)"}
            >
              PRESS ON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
