import { useState } from "react";
import { COPY, MOODS, say } from "../lib/copy.js";
import { dayKey, dayPart, uid, weekKeys } from "../lib/storage.js";
import { suggestNext } from "../lib/suggest.js";
import { Button, useLuma } from "../ui.jsx";

function Scale({ label, value, onChange, low, high }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span className="label">{label}</span>
      <div className="scale" role="group" aria-label={label}>
        {(label === "Mood" ? MOODS : [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))).map((item) => (
          <button key={item.value} type="button" className={value === item.value ? "on" : ""} onClick={() => onChange(item.value)} aria-pressed={value === item.value}>
            <strong>{item.value}</strong>
            <small>{label === "Mood" ? item.label : item.value === 1 ? low : item.value === 5 ? high : ""}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Today() {
  const { state, update, tone, openBreathe, setTab, startFocus } = useLuma();
  const today = dayKey();
  const existing = state.checkins.find((item) => item.date === today);
  const [mood, setMood] = useState(existing?.mood || 3);
  const [energy, setEnergy] = useState(existing?.energy || 3);
  const [stress, setStress] = useState(existing?.stress || 3);
  const [note, setNote] = useState(existing?.note || "");
  const [saved, setSaved] = useState(false);

  const suggestion = suggestNext({
    checkin: existing,
    tasks: state.tasks,
    habits: state.habits,
    todayKey: today,
    focusAreas: state.profile.focusAreas,
  });

  function saveCheckin() {
    update((current) => {
      const entry = { id: existing?.id || uid(), date: today, mood, energy, stress, note: note.trim() };
      const checkins = current.checkins.filter((item) => item.date !== today);
      return { ...current, checkins: [entry, ...checkins] };
    });
    setSaved(true);
  }

  function runSuggestion() {
    if (suggestion.action === "checkin") {
      document.getElementById("checkin")?.scrollIntoView({ behavior: state.profile.reducedMotion ? "auto" : "smooth", block: "start" });
      return;
    }
    if (suggestion.action === "breathe") openBreathe("box");
    if (suggestion.action === "habit") document.getElementById("today-habits")?.scrollIntoView({ block: "start" });
    if (suggestion.action === "two-minute") startFocus(2, suggestion.taskId);
    if (suggestion.action === "task" || suggestion.action === "focus") setTab(suggestion.action === "task" ? "tasks" : "focus");
    if (suggestion.action === "journal") setTab("journal");
  }

  const week = new Set(weekKeys());
  const name = state.profile.name;

  return (
    <div className="scroll">
      <p className="kicker">{say(COPY.todayKicker, tone)}</p>
      <h1>{name ? `${dayPart()}, ${name}.` : `${dayPart()}.`}</h1>
      <section className="card">
        <h2>{say(COPY.nextHeading, tone)}</h2>
        <h3>{suggestion.title}</h3>
        <p className="muted tiny">{suggestion.detail}</p>
        <Button onClick={runSuggestion}>Do this</Button>
      </section>

      <section className="card" id="checkin">
        <h2>{say(COPY.checkinPrompt, tone)}</h2>
        <Scale label="Mood" value={mood} onChange={setMood} />
        <Scale label="Energy" value={energy} onChange={setEnergy} low="Low" high="High" />
        <Scale label="Stress" value={stress} onChange={setStress} low="Low" high="High" />
        <label className="label" htmlFor="checkin-note">Note, optional</label>
        <input id="checkin-note" className="field" value={note} onChange={(event) => setNote(event.target.value)} placeholder="One line is plenty" />
        <div style={{ height: 10 }} />
        <Button onClick={saveCheckin}>{existing ? "Update check-in" : "Save check-in"}</Button>
        {saved ? <p className="tiny muted">{say(COPY.checkinSaved, tone)}</p> : null}
      </section>

      <section id="today-habits">
        <h2>Today's minimums</h2>
        {state.habits.length === 0 ? <p className="muted">Habits live in More. A minimum version is the point — streaks are not.</p> : null}
        {state.habits.map((habit) => {
          const met = week && Object.entries(habit.logs || {}).filter(([key, value]) => week.has(key) && value).length;
          return (
            <article key={habit.id} className="card">
              <div className="spread">
                <div>
                  <h3>{habit.name}</h3>
                  <p className="tiny muted">{habit.minimum}</p>
                </div>
                <HabitToggle habit={habit} today={today} update={update} />
              </div>
              <p className="tiny muted">{met ? `Minimum met ${met} ${met === 1 ? "day" : "days"} this week.` : say(COPY.habitZero, tone)}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export function HabitToggle({ habit, today, update }) {
  const current = habit.logs?.[today] || "";
  const label = current === "full" ? "Full" : current === "min" ? "Minimum" : "Not yet";
  function cycle() {
    update((state) => ({
      ...state,
      habits: state.habits.map((item) => {
        if (item.id !== habit.id) return item;
        const logs = { ...(item.logs || {}) };
        const next = !logs[today] ? "min" : logs[today] === "min" ? "full" : null;
        if (next) logs[today] = next;
        else delete logs[today];
        return { ...item, logs };
      }),
    }));
  }
  return (
    <button type="button" className={`chip ${current ? "on" : ""}`} onClick={cycle} aria-label={`${habit.name}: ${label}`}>
      {label}
    </button>
  );
}
