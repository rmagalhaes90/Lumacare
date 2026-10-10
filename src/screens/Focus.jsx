import { useEffect, useState } from "react";
import { COPY, say } from "../lib/copy.js";
import { uid } from "../lib/storage.js";
import { Button, useLuma } from "../ui.jsx";

const LENGTHS = [2, 10, 25, 45];

function format(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function remainingMs(active, now = Date.now()) {
  if (!active) return 0;
  if (active.pausedRemainingMs != null) return active.pausedRemainingMs;
  return Math.max(0, active.endsAt - now);
}

export function Focus() {
  const { state, update, tone, startFocus } = useLuma();
  const active = state.activeFocus;
  const [now, setNow] = useState(Date.now());
  const [length, setLength] = useState(10);
  const [note, setNote] = useState("");
  const [banner, setBanner] = useState("");

  useEffect(() => {
    if (!active || active.pausedRemainingMs != null) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);

  const left = remainingMs(active, now);
  const task = state.tasks.find((item) => item.id === active?.taskId);

  function park() {
    const text = note.trim();
    if (!text || !active) return;
    update((current) => ({
      ...current,
      activeFocus: current.activeFocus
        ? { ...current.activeFocus, distractions: [...(current.activeFocus.distractions || []), text] }
        : current.activeFocus,
    }));
    setNote("");
  }

  function pauseOrResume() {
    update((current) => {
      const run = current.activeFocus;
      if (!run) return current;
      if (run.pausedRemainingMs != null) {
        return { ...current, activeFocus: { ...run, pausedRemainingMs: null, endsAt: Date.now() + run.pausedRemainingMs } };
      }
      return { ...current, activeFocus: { ...run, pausedRemainingMs: Math.max(0, run.endsAt - Date.now()), endsAt: null } };
    });
  }

  function finish(completed) {
    update((current) => {
      if (!current.activeFocus) return current;
      const session = {
        id: current.activeFocus.id || uid(),
        startedAt: current.activeFocus.startedAt,
        endedAt: Date.now(),
        durationMin: current.activeFocus.durationMin,
        taskId: current.activeFocus.taskId,
        distractions: current.activeFocus.distractions || [],
        completed,
        filed: false,
      };
      return { ...current, activeFocus: null, focusSessions: [session, ...current.focusSessions] };
    });
    setBanner(say(COPY.focusDone, tone));
  }

  function fileDistractions(session) {
    update((current) => ({
      ...current,
      brainDump: [
        ...session.distractions.map((text) => ({ id: uid(), text, createdAt: Date.now() })),
        ...current.brainDump,
      ],
      focusSessions: current.focusSessions.map((item) => (item.id === session.id ? { ...item, filed: true } : item)),
    }));
  }

  return (
    <div className="scroll">
      <p className="kicker">Focus</p>
      <h1>{active ? format(left) : "A quiet block."}</h1>
      {active ? (
        <div className="card stack">
          <p className="tiny muted">{task ? task.title : `${active.durationMin} minutes`}</p>
          <div className="row">
            <Button onClick={pauseOrResume}>{active.pausedRemainingMs != null ? "Resume" : "Pause"}</Button>
            <Button variant="ghost" onClick={() => finish(false)}>End</Button>
          </div>
          <label className="label" htmlFor="distract">Park a distraction</label>
          <input id="distract" className="field" value={note} onChange={(event) => setNote(event.target.value)} placeholder="It can wait" onKeyDown={(event) => { if (event.key === "Enter") park(); }} />
          <Button variant="secondary" onClick={park}>Park it</Button>
          {(active.distractions || []).map((item) => <p key={item} className="tiny muted">{item}</p>)}
        </div>
      ) : (
        <div className="card stack">
          <p className="tiny">{say(COPY.focusIdle, tone)}</p>
          <div className="chips">
            {LENGTHS.map((minutes) => (
              <button key={minutes} type="button" className={`chip ${length === minutes ? "on" : ""}`} onClick={() => setLength(minutes)}>
                {minutes} min
              </button>
            ))}
          </div>
          <Button onClick={() => startFocus(length)}>Start</Button>
          {banner ? <p className="tiny muted">{banner}</p> : null}
        </div>
      )}
      {state.focusSessions.slice(0, 6).map((session) => (
        <article key={session.id} className="card">
          <h3>{session.durationMin} min {session.completed ? "finished" : "ended early"}</h3>
          {session.distractions?.length && !session.filed ? (
            <Button variant="ghost" onClick={() => fileDistractions(session)}>Send distractions to brain dump</Button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
