import { useState } from "react";
import { FOCUS_AREAS, TONES } from "../lib/copy.js";
import { THEMES } from "../lib/themes.js";
import { Button } from "../ui.jsx";
import { useLuma } from "../ui.jsx";

export function Onboarding() {
  const { update } = useLuma();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [areas, setAreas] = useState([]);
  const [tone, setTone] = useState("gentle");
  const [themeId, setThemeId] = useState("calm");

  function toggleArea(id) {
    setAreas((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function finish() {
    update((state) => ({
      ...state,
      profile: {
        ...state.profile,
        name: name.trim(),
        tone,
        themeId,
        focusAreas: areas,
        onboarded: true,
        keptThemeIds: Array.from(new Set([...(state.profile.keptThemeIds || []), themeId, "calm"])),
      },
    }));
  }

  return (
    <div className="scroll">
      <p className="kicker">LumaCare</p>
      {step === 0 && (
        <>
          <h1>Small steps. Better days.</h1>
          <p className="lede">A private companion for getting unstuck. Nothing here leaves this device, except a purchase check if you subscribe later.</p>
          <label className="label" htmlFor="name">What should we call you? Optional.</label>
          <input id="name" className="field" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
        </>
      )}
      {step === 1 && (
        <>
          <h1>What should we help with?</h1>
          <p className="lede">Pick any. This only tunes the suggestion on Today.</p>
          <div className="chips">
            {FOCUS_AREAS.map((area) => (
              <button key={area.id} type="button" className={`chip ${areas.includes(area.id) ? "on" : ""}`} onClick={() => toggleArea(area.id)}>
                {area.label}
              </button>
            ))}
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h1>How should it sound?</h1>
          <div className="stack" style={{ marginTop: 16 }}>
            {TONES.map((item) => (
              <button key={item.id} type="button" className={`plan ${tone === item.id ? "on" : ""}`} onClick={() => setTone(item.id)}>
                <strong>{item.name}</strong>
                <span className="tiny">{item.blurb}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <h1>Pick a theme.</h1>
          <p className="lede">The one you choose now stays yours, even on the free plan. Extra themes can wait.</p>
          <div className="swatches">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`swatch ${themeId === theme.id ? "on" : ""}`}
                style={{ background: theme.bg, color: theme.ink }}
                onClick={() => setThemeId(theme.id)}
              >
                <strong>{theme.name}</strong>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="row" style={{ marginTop: 22 }}>
        {step > 0 ? <Button variant="ghost" onClick={() => setStep((value) => value - 1)}>Back</Button> : null}
        {step < 3 ? (
          <Button className="full" onClick={() => setStep((value) => value + 1)}>Continue</Button>
        ) : (
          <Button className="full" onClick={finish}>Start</Button>
        )}
      </div>
    </div>
  );
}
