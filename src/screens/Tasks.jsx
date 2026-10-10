import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { RESISTANCE, suggestBreakdown } from "../lib/breakdown.js";
import { COPY, TASK_TYPES, say } from "../lib/copy.js";
import { uid } from "../lib/storage.js";
import { Button, Sheet, useLuma } from "../ui.jsx";

export function Tasks() {
  const { state, update, tone, startFocus } = useLuma();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("other");
  const [dump, setDump] = useState("");
  const [stuckId, setStuckId] = useState(null);
  const [showDone, setShowDone] = useState(false);
  const open = state.tasks.filter((task) => task.status !== "done");
  const done = state.tasks.filter((task) => task.status === "done");
  const stuck = state.tasks.find((task) => task.id === stuckId);

  function addTask() {
    const text = title.trim();
    if (!text) return;
    update((current) => ({
      ...current,
      tasks: [{ id: uid(), title: text, type, status: "open", createdAt: Date.now(), steps: [], resistance: null }, ...current.tasks],
    }));
    setTitle("");
  }

  function addDump() {
    const text = dump.trim();
    if (!text) return;
    update((current) => ({
      ...current,
      brainDump: [{ id: uid(), text, createdAt: Date.now() }, ...current.brainDump],
    }));
    setDump("");
  }

  function patchTask(id, fn) {
    update((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? fn(task) : task)),
    }));
  }

  return (
    <div className="scroll">
      <p className="kicker">Tasks</p>
      <h1>Make it smaller.</h1>
      <div className="card stack">
        <label className="label" htmlFor="task-title">Add a task</label>
        <input id="task-title" className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs a start?" onKeyDown={(event) => { if (event.key === "Enter") addTask(); }} />
        <div className="chips">
          {TASK_TYPES.map((item) => (
            <button key={item.id} type="button" className={`chip ${type === item.id ? "on" : ""}`} onClick={() => setType(item.id)}>{item.label}</button>
          ))}
        </div>
        <Button onClick={addTask}>Add</Button>
      </div>

      {open.length === 0 ? <p className="muted">{say(COPY.emptyTasks, tone)}</p> : null}
      {open.map((task) => (
        <article key={task.id} className="card">
          <div className="spread">
            <h3>{task.title}</h3>
            <span className="tiny muted">{TASK_TYPES.find((item) => item.id === task.type)?.label}</span>
          </div>
          {task.steps?.map((step) => (
            <div key={step.id} className="step-line">
              <button
                type="button"
                className={`check ${step.done ? "on" : ""}`}
                aria-label={step.done ? "Mark step open" : "Mark step done"}
                onClick={() => patchTask(task.id, (item) => ({
                  ...item,
                  steps: item.steps.map((entry) => (entry.id === step.id ? { ...entry, done: !entry.done } : entry)),
                }))}
              >
                {step.done ? <Check size={14} /> : null}
              </button>
              <span className="tiny" style={{ textDecoration: step.done ? "line-through" : "none" }}>{step.text}</span>
            </div>
          ))}
          <div className="chips" style={{ marginTop: 8 }}>
            <button type="button" className="chip" onClick={() => patchTask(task.id, (item) => ({ ...item, status: "done", doneAt: Date.now() }))}>Done</button>
            <button type="button" className="chip" onClick={() => setStuckId(task.id)}>I'm stuck</button>
            <button
              type="button"
              className="chip"
              onClick={() => patchTask(task.id, (item) => ({
                ...item,
                steps: suggestBreakdown(item).map((text) => ({ id: uid(), text, done: false })),
              }))}
            >
              Break it down
            </button>
            <button type="button" className="chip" onClick={() => startFocus(2, task.id)}>Two minutes</button>
            <button type="button" className="icon-btn" aria-label={`Remove ${task.title}`} onClick={() => update((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id) }))}>
              <Trash2 size={16} />
            </button>
          </div>
        </article>
      ))}

      <section className="card stack">
        <h2>Brain dump</h2>
        <p className="tiny muted">Park thoughts here. Promote one when it deserves a task.</p>
        <input className="field" value={dump} onChange={(event) => setDump(event.target.value)} placeholder="Drop it here" aria-label="Brain dump" onKeyDown={(event) => { if (event.key === "Enter") addDump(); }} />
        <Button variant="secondary" onClick={addDump}>Park it</Button>
        {state.brainDump.map((item) => (
          <div key={item.id} className="spread">
            <span className="tiny">{item.text}</span>
            <span className="row">
              <button type="button" className="chip" onClick={() => update((current) => ({
                ...current,
                tasks: [{ id: uid(), title: item.text, type: "other", status: "open", createdAt: Date.now(), steps: [], resistance: null }, ...current.tasks],
                brainDump: current.brainDump.filter((entry) => entry.id !== item.id),
              }))}>Make a task</button>
              <button type="button" className="icon-btn" aria-label="Remove note" onClick={() => update((current) => ({ ...current, brainDump: current.brainDump.filter((entry) => entry.id !== item.id) }))}>
                <Trash2 size={16} />
              </button>
            </span>
          </div>
        ))}
      </section>

      {done.length ? (
        <button type="button" className="btn ghost" onClick={() => setShowDone((value) => !value)}>
          {showDone ? "Hide" : "Show"} {done.length} finished
        </button>
      ) : null}
      {showDone ? done.map((task) => <p key={task.id} className="tiny muted">{task.title}</p>) : null}

      {stuck ? (
        <Sheet title="Resistance check" onClose={() => setStuckId(null)}>
          <p className="tiny muted">{stuck.title}</p>
          <div className="stack">
            {RESISTANCE.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`plan ${stuck.resistance === item.id ? "on" : ""}`}
                onClick={() => patchTask(stuck.id, (task) => ({ ...task, resistance: item.id }))}
              >
                <strong>{item.label}</strong>
                {stuck.resistance === item.id ? <span className="tiny">{item.reply}</span> : null}
              </button>
            ))}
            <Button onClick={() => { setStuckId(null); startFocus(2, stuck.id); }}>Start two minutes</Button>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}
