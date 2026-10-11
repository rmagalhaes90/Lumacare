import { useEffect, useState } from "react";
import { breathById, phaseAt } from "../lib/breathe.js";
import { canUseBreath } from "../lib/gating.js";
import { haptic } from "../native.js";
import { Button, useLuma } from "../ui.jsx";

export function Breathe() {
  const { breathId, closeBreathe, state, update, isPremium, openPaywall } = useLuma();
  const breath = breathById(breathId);
  const allowed = canUseBreath(breath.id, state.profile, isPremium);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [phaseIndex, setPhaseIndex] = useState(-1);

  useEffect(() => {
    if (!startedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [startedAt]);

  const elapsed = startedAt ? (now - startedAt) / 1000 : 0;
  const place = startedAt ? phaseAt(breath, elapsed) : null;

  useEffect(() => {
    if (!place || place.done) return;
    if (place.index !== phaseIndex) {
      setPhaseIndex(place.index);
      if (!state.profile.reducedMotion) haptic("light");
    }
  }, [place, phaseIndex, state.profile.reducedMotion]);

  function begin() {
    if (!allowed) {
      openPaywall();
      return;
    }
    update((current) => {
      const used = current.profile.usedBreathIds || [];
      if (used.includes(breath.id)) return current;
      return { ...current, profile: { ...current.profile, usedBreathIds: [...used, breath.id] } };
    });
    setStartedAt(Date.now());
    setPhaseIndex(-1);
  }

  const scale = place?.phase?.scale ?? 0.72;

  return (
    <div className="overlay breathe" role="dialog" aria-modal="true" aria-label={breath.name}>
      <div className="breathe-screen">
        <div className="spread">
          <div>
            <p className="kicker">Breathe</p>
            <h2 style={{ margin: 0 }}>{breath.name}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={closeBreathe} aria-label="Close">×</button>
        </div>
        <div className="orb-wrap">
          <div
            className="orb"
            style={{
              transform: `scale(${startedAt && !place?.done ? scale : 0.72})`,
              transition: state.profile.reducedMotion || !place ? "none" : `transform ${place.phase.seconds}s linear`,
            }}
          />
        </div>
        <h1 style={{ textAlign: "center" }}>{place?.done ? "That's the round." : place?.phase?.name || "Ready when you are."}</h1>
        <p className="tiny muted" style={{ textAlign: "center" }}>
          {place && !place.done ? `Round ${place.round} of ${breath.rounds}` : breath.summary}
        </p>
        <Button className="full" onClick={place?.done ? () => setStartedAt(null) : startedAt ? closeBreathe : begin}>
          {place?.done ? "Again" : startedAt ? "Stop" : allowed ? "Begin" : "Unlock with LumaCare+"}
        </Button>
      </div>
    </div>
  );
}
