import { useState } from "react";
import { Trash2 } from "lucide-react";
import { COPY, journalPrompt, say } from "../lib/copy.js";
import { dayKey, uid } from "../lib/storage.js";
import { Button, useLuma } from "../ui.jsx";

export function Journal() {
  const { state, update, tone } = useLuma();
  const [shift, setShift] = useState(0);
  const [body, setBody] = useState("");
  const prompt = journalPrompt(new Date(), shift);

  function save() {
    const text = body.trim();
    if (!text) return;
    update((current) => ({
      ...current,
      journal: [{ id: uid(), createdAt: Date.now(), prompt, body: text }, ...current.journal],
    }));
    setBody("");
  }

  return (
    <div className="scroll">
      <p className="kicker">Journal</p>
      <h1>Private by default.</h1>
      <div className="card stack">
        <p>{prompt}</p>
        <button type="button" className="btn ghost" onClick={() => setShift((value) => value + 1)}>Another prompt</button>
        <label className="label" htmlFor="journal-body">Entry</label>
        <textarea id="journal-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="A sentence counts." />
        <Button onClick={save}>Save entry</Button>
      </div>
      {state.journal.length === 0 ? <p className="muted">{say(COPY.journalEmpty, tone)}</p> : null}
      {state.journal.map((entry) => (
        <article key={entry.id} className="card">
          <div className="spread">
            <p className="tiny muted">{dayKey(new Date(entry.createdAt))} · {entry.prompt}</p>
            <button type="button" className="icon-btn" aria-label="Delete entry" onClick={() => update((current) => ({ ...current, journal: current.journal.filter((item) => item.id !== entry.id) }))}>
              <Trash2 size={16} />
            </button>
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{entry.body}</p>
        </article>
      ))}
    </div>
  );
}
