import { useState } from "react";
import { Lock } from "lucide-react";
import { HabitToggle } from "./Today.jsx";
import { BREATHS } from "../lib/breathe.js";
import { TONES } from "../lib/copy.js";
import { exportBackup } from "../lib/backup.js";
import { FREE_HABIT_LIMIT, canAddHabit, canUseBreath, canUseTheme } from "../lib/gating.js";
import { decorateInsights, buildInsights } from "../lib/insights.js";
import { manageSubscriptionUrl, openExternal } from "../lib/purchases.js";
import { dayKey, uid } from "../lib/storage.js";
import { THEMES } from "../lib/themes.js";
import { Button, useLuma } from "../ui.jsx";

export function More() {
  const {
    state, update, isPremium, purchasesReady, openPaywall, openBreathe, setTab, restore,
  } = useLuma();
  const [name, setName] = useState("");
  const [minimum, setMinimum] = useState("");
  const [full, setFull] = useState("");
  const [backupNote, setBackupNote] = useState("");
  const [restoreNote, setRestoreNote] = useState("");
  const insights = decorateInsights(buildInsights(state), isPremium);
  const today = dayKey();

  function addHabit() {
    if (!name.trim() || !minimum.trim()) return;
    if (!canAddHabit(state.habits, isPremium)) {
      openPaywall();
      return;
    }
    update((current) => ({
      ...current,
      habits: [...current.habits, { id: uid(), name: name.trim(), minimum: minimum.trim(), full: full.trim(), createdAt: Date.now(), logs: {} }],
    }));
    setName("");
    setMinimum("");
    setFull("");
  }

  function chooseTheme(themeId) {
    if (!canUseTheme(themeId, state.profile, isPremium)) {
      openPaywall();
      return;
    }
    update((current) => ({
      ...current,
      profile: {
        ...current.profile,
        themeId,
        keptThemeIds: Array.from(new Set([...(current.profile.keptThemeIds || []), themeId])),
      },
    }));
  }

  async function onBackup() {
    setBackupNote("");
    try {
      await exportBackup(state);
      setBackupNote("Backup ready. Keep the file somewhere you control.");
    } catch (error) {
      setBackupNote(error?.message || "The backup didn't finish.");
    }
  }

  return (
    <div className="scroll">
      <p className="kicker">More</p>
      <h1>{isPremium ? "LumaCare+ is on." : "Your pace, your data."}</h1>

      <section className="card stack">
        <h2>LumaCare+</h2>
        <p className="tiny muted">Free keeps the tools that get you unstuck. Plus adds room: habits, themes, breathing, and insights.</p>
        {isPremium && purchasesReady ? (
          <Button variant="secondary" onClick={() => openExternal(manageSubscriptionUrl())}>Manage subscription</Button>
        ) : (
          <Button onClick={openPaywall}>{isPremium ? "Plus is previewing" : "See LumaCare+"}</Button>
        )}
        <Button variant="ghost" onClick={async () => {
          setRestoreNote("");
          const result = await restore();
          setRestoreNote(result?.message || (result?.isPremium ? "Restored." : "No active subscription found."));
        }}>Restore purchases</Button>
        {restoreNote ? <p className="tiny muted">{restoreNote}</p> : null}
        {!purchasesReady ? (
          <label className="spread">
            <span className="tiny">Preview Plus on this device. This is not a purchase.</span>
            <button
              type="button"
              className={`switch ${state.profile.premiumPreview ? "on" : ""}`}
              role="switch"
              aria-checked={state.profile.premiumPreview}
              onClick={() => update((current) => ({
                ...current,
                profile: { ...current.profile, premiumPreview: !current.profile.premiumPreview },
              }))}
            >
              <i />
            </button>
          </label>
        ) : null}
      </section>

      <section className="card stack">
        <h2>Habits</h2>
        <p className="tiny muted">Free includes {FREE_HABIT_LIMIT}. The minimum is the success. You have {state.habits.length}.</p>
        <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Habit name" aria-label="Habit name" />
        <input className="field" value={minimum} onChange={(event) => setMinimum(event.target.value)} placeholder="Minimum version" aria-label="Minimum version" />
        <input className="field" value={full} onChange={(event) => setFull(event.target.value)} placeholder="Full version, optional" aria-label="Full version" />
        <Button onClick={addHabit}>{canAddHabit(state.habits, isPremium) ? "Add habit" : "Unlock more habits"}</Button>
        {state.habits.map((habit) => (
          <div key={habit.id} className="spread">
            <div>
              <strong>{habit.name}</strong>
              <div className="tiny muted">{habit.minimum}{habit.full ? ` · Full: ${habit.full}` : ""}</div>
            </div>
            <span className="row">
              <HabitToggle habit={habit} today={today} update={update} />
              <button type="button" className="chip" onClick={() => update((current) => ({ ...current, habits: current.habits.filter((item) => item.id !== habit.id) }))}>Remove</button>
            </span>
          </div>
        ))}
      </section>

      <section className="card stack">
        <h2>Breathing</h2>
        {BREATHS.map((breath) => {
          const allowed = canUseBreath(breath.id, state.profile, isPremium);
          return (
            <button key={breath.id} type="button" className="plan" onClick={() => (allowed ? openBreathe(breath.id) : openPaywall())}>
              <span className="spread">
                <strong>{breath.name}</strong>
                {allowed ? null : <Lock size={16} aria-label="Plus" />}
              </span>
              <span className="tiny">{breath.summary}</span>
            </button>
          );
        })}
      </section>

      <section className="card stack">
        <h2>Insights</h2>
        {insights.map((item) => (
          <article key={item.id}>
            <h3>{item.title}</h3>
            {item.locked ? (
              <button type="button" className="btn ghost" onClick={openPaywall}>See this pattern with LumaCare+</button>
            ) : (
              <p className="tiny">{item.body}</p>
            )}
          </article>
        ))}
      </section>

      <section className="card stack">
        <h2>Appearance</h2>
        <div className="swatches">
          {THEMES.map((theme) => {
            const allowed = canUseTheme(theme.id, state.profile, isPremium);
            return (
              <button key={theme.id} type="button" className={`swatch ${state.profile.themeId === theme.id ? "on" : ""}`} style={{ background: theme.bg, color: theme.ink }} onClick={() => chooseTheme(theme.id)}>
                <strong>{theme.name}</strong>
                {allowed ? null : <Lock size={14} />}
              </button>
            );
          })}
        </div>
        <div className="chips">
          {TONES.map((item) => (
            <button key={item.id} type="button" className={`chip ${state.profile.tone === item.id ? "on" : ""}`} onClick={() => update((current) => ({ ...current, profile: { ...current.profile, tone: item.id } }))}>
              {item.name}
            </button>
          ))}
        </div>
        <label className="spread">
          <span>Reduced motion</span>
          <button
            type="button"
            className={`switch ${state.profile.reducedMotion ? "on" : ""}`}
            role="switch"
            aria-checked={state.profile.reducedMotion}
            onClick={() => update((current) => ({ ...current, profile: { ...current.profile, reducedMotion: !current.profile.reducedMotion } }))}
          >
            <i />
          </button>
        </label>
      </section>

      <section className="card stack">
        <h2>Privacy and data</h2>
        <p className="tiny">
          Tasks, mood, journal, habits, and focus notes stay in local storage on this device. LumaCare does not run its own server and does not include analytics.
          If you subscribe, the app contacts RevenueCat to check purchase status. That call does not include your journal or tasks.
        </p>
        <Button variant="secondary" onClick={onBackup}>Download backup</Button>
        {backupNote ? <p className="tiny muted">{backupNote}</p> : null}
        <button type="button" className="btn ghost" onClick={() => update((current) => ({ ...current, profile: { ...current.profile, onboarded: false } }))}>
          Show the introduction again
        </button>
        <button type="button" className="btn ghost" onClick={() => setTab("today")}>Back to today</button>
      </section>

      <p className="tiny muted">
        LumaCare supports personal organization and general wellbeing. It is not a medical device and does not provide diagnosis, treatment, or emergency support.
      </p>
    </div>
  );
}
