import { useState } from "react";
import { COPY, MOODS, say } from "../lib/copy.js";
import { ACTIVITIES, affirmation, CALMER_DAY, FEELINGS, nextStarters, readCheckin, ROUTINE_TIMES } from "../lib/habits.js";
import { canAddHabit, FREE_HABIT_LIMIT } from "../lib/gating.js";
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

const CHECKIN_STEPS = ["mood", "feeling", "energy", "stress", "day"];

export function Today() {
  const { state, update, tone, isPremium, openPaywall } = useLuma();
  const today = dayKey();
  const existing = state.checkins.find((item) => item.date === today);
  const [phase, setPhase] = useState(existing ? "settled" : "mood");
  const [mood, setMood] = useState(existing?.mood ?? null);
  const [energy, setEnergy] = useState(existing?.energy ?? null);
  const [stress, setStress] = useState(existing?.stress ?? null);
  const [note, setNote] = useState(existing?.note || "");
  const [feeling, setFeeling] = useState(existing?.feeling || "");
  const [activities, setActivities] = useState(existing?.activities || []);
  const [showAll, setShowAll] = useState(false);

  const name = state.profile.name;
  const nextHabit = state.habits.find((habit) => !habit.logs?.[today]);
  const routineReady = state.habits.length > 0;

  function persist(nextPhase) {
    if (mood == null && nextPhase === "settled" && !existing) {
      setPhase("settled");
      return;
    }
    update((current) => {
      const prior = current.checkins.find((item) => item.date === today);
      const entry = {
        id: prior?.id || uid(),
        date: today,
        ...(mood != null ? { mood } : {}),
        ...(energy != null ? { energy } : {}),
        ...(stress != null ? { stress } : {}),
        note: note.trim(),
        feeling,
        activities,
      };
      if (entry.mood == null && !prior) return current;
      return {
        ...current,
        checkins: [entry, ...current.checkins.filter((item) => item.date !== today)],
      };
    });
    setPhase(nextPhase);
  }

  function goNext() {
    const index = CHECKIN_STEPS.indexOf(phase);
    persist(index === -1 || index === CHECKIN_STEPS.length - 1 ? "settled" : CHECKIN_STEPS[index + 1]);
  }

  function goBack() {
    const index = CHECKIN_STEPS.indexOf(phase);
    if (index > 0) setPhase(CHECKIN_STEPS[index - 1]);
  }

  function toggleActivity(id) {
    setActivities((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function addCalmerDay() {
    const room = isPremium ? CALMER_DAY.length : Math.max(0, FREE_HABIT_LIMIT - state.habits.length);
    const adding = nextStarters(state.habits, CALMER_DAY, room);
    if (!adding.length) {
      if (!canAddHabit(state.habits, isPremium)) openPaywall();
      return;
    }
    update((current) => ({
      ...current,
      profile: { ...current.profile, declinedRoutine: false },
      habits: [
        ...current.habits,
        ...adding.map((item) => ({ ...item, id: uid(), createdAt: Date.now(), logs: {} })),
      ],
    }));
  }

  function declineRoutine() {
    update((current) => ({ ...current, profile: { ...current.profile, declinedRoutine: true } }));
  }

  const savedCheckin = existing || (phase === "settled" && mood != null ? { mood, energy, stress, feeling, activities } : null);

  return (
    <div className="scroll">
      <p className="kicker">{say(COPY.todayKicker, tone)}</p>
      <h1>{name ? `${dayPart()}, ${name}.` : `${dayPart()}.`}</h1>
      <p className="lede">{say(COPY.welcome, tone)}</p>

      {phase !== "settled" ? (
        <section key={phase} className="card step stack" id="checkin" aria-live="polite">
          {phase === "mood" ? (
            <>
              <h2>{say(COPY.checkinPrompt, tone)}</h2>
              <p className="tiny muted">One answer is a complete check-in.</p>
              <Scale label="Mood" value={mood} onChange={(value) => { setMood(value); setFeeling(""); }} />
            </>
          ) : null}
          {phase === "feeling" ? (
            <>
              <h2>A closer word, if one fits.</h2>
              <div className="chips" aria-label="A closer word">
                {(FEELINGS[mood] || FEELINGS[3]).map((word) => (
                  <button key={word} type="button" className={`chip ${feeling === word ? "on" : ""}`} onClick={() => setFeeling(feeling === word ? "" : word)}>{word}</button>
                ))}
              </div>
            </>
          ) : null}
          {phase === "energy" ? (
            <>
              <h2>How is your energy?</h2>
              <Scale label="Energy" value={energy} onChange={setEnergy} low="Low" high="High" />
            </>
          ) : null}
          {phase === "stress" ? (
            <>
              <h2>And stress?</h2>
              <Scale label="Stress" value={stress} onChange={setStress} low="Low" high="High" />
            </>
          ) : null}
          {phase === "day" ? (
            <>
              <h2>Was any of this part of the day?</h2>
              <div className="chips">
                {ACTIVITIES.map((item) => (
                  <button key={item.id} type="button" className={`chip ${activities.includes(item.id) ? "on" : ""}`} onClick={() => toggleActivity(item.id)} aria-pressed={activities.includes(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="label" htmlFor="checkin-note">A line, if you want</label>
              <input id="checkin-note" className="field" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" />
            </>
          ) : null}
          <Button onClick={goNext} disabled={phase === "mood" && mood == null}>
            {phase === "day" ? "That's enough" : "Continue"}
          </Button>
          <div className="row">
            {phase !== "mood" ? <button type="button" className="btn ghost" onClick={goBack}>Back</button> : null}
            {phase !== "day" ? <button type="button" className="btn ghost" onClick={() => persist("settled")}>That's enough</button> : null}
          </div>
        </section>
      ) : (
        <RoutineToday
          state={state}
          today={today}
          name={name}
          savedCheckin={savedCheckin}
          nextHabit={nextHabit}
          routineReady={routineReady}
          showAll={showAll}
          setShowAll={setShowAll}
          update={update}
          onCreate={addCalmerDay}
          onDecline={declineRoutine}
          onAdjust={() => setPhase("mood")}
        />
      )}
    </div>
  );
}

function RoutineToday({ state, today, name, savedCheckin, nextHabit, routineReady, showAll, setShowAll, update, onCreate, onDecline, onAdjust }) {
  const suggestion = suggestNext({
    checkin: savedCheckin,
    tasks: state.tasks,
    habits: state.habits,
    todayKey: today,
    focusAreas: state.profile.focusAreas,
  });
  const routineDone = routineReady && !nextHabit;

  return (
    <>
      {savedCheckin ? (
        <section className="card step">
          <p className="note">{affirmation({ name, mood: savedCheckin.mood, feeling: savedCheckin.feeling })}</p>
          <p className="tiny muted">{readCheckin(savedCheckin)}</p>
          <button type="button" className="btn ghost" onClick={onAdjust}>Adjust this check-in</button>
        </section>
      ) : (
        <section className="card step">
          <p className="note">{name ? `${name}, you can begin whenever you are ready.` : "You can begin whenever you are ready."}</p>
          <Button onClick={onAdjust}>A one-question check-in</Button>
        </section>
      )}

      {!routineReady && !state.profile.declinedRoutine ? (
        <section className="card step stack" id="today-habits">
          <h2>A routine, when you want one</h2>
          <p className="tiny">Three small versions: a minute of daylight, one glass of water, and putting the phone down at night. You would follow them one at a time.</p>
          <Button onClick={onCreate}>Create this routine</Button>
          <button type="button" className="btn ghost" onClick={onDecline}>Not today</button>
        </section>
      ) : null}

      {!routineReady && state.profile.declinedRoutine ? (
        <section className="card step" id="today-habits">
          <p className="tiny muted">A routine can wait.</p>
          <button type="button" className="btn ghost" onClick={onCreate}>Create one when you want</button>
        </section>
      ) : null}

      {routineReady ? (
        <section className="card step stack" id="today-habits">
          <h2>{routineDone ? "Your routine is kept." : "Your routine is here."}</h2>
          {routineDone ? (
            <p>You met today's minimums. That is the whole routine.</p>
          ) : (
            <>
              <p className="tiny muted">Only the next minimum. The others can wait.</p>
              <div className="spread">
                <div>
                  <h3>{nextHabit.name}</h3>
                  <p className="tiny muted">{nextHabit.minimum}</p>
                  {nextHabit.cue ? <p className="tiny">{nextHabit.cue}</p> : null}
                </div>
                <HabitToggle habit={nextHabit} today={today} update={update} />
              </div>
            </>
          )}
          <button type="button" className="btn ghost" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Hide the rest" : "See the whole routine"}
          </button>
          {showAll ? state.habits.map((habit) => (
            <article key={habit.id}>
              <div className="spread">
                <div>
                  <strong>{habit.name}</strong>
                  <div className="tiny muted">{ROUTINE_TIMES.find((slot) => slot.id === (habit.when || "anytime"))?.label} · {habit.minimum}</div>
                </div>
                <HabitToggle habit={habit} today={today} update={update} />
              </div>
              <WeekDots habit={habit} />
            </article>
          )) : null}
        </section>
      ) : null}

      {routineDone && suggestion.action !== "habit" && suggestion.action !== "habit-min" ? (
        <p className="tiny muted">{suggestion.detail}</p>
      ) : null}
    </>
  );
}

export function WeekDots({ habit }) {
  const keys = weekKeys();
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="dots" aria-label="This week">
      {keys.map((key, index) => {
        const value = habit.logs?.[key];
        const kind = value === "full" ? "full" : value === "min" ? "min" : "";
        return <span key={key} className={`dot ${kind}`} title={names[index]} />;
      })}
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
