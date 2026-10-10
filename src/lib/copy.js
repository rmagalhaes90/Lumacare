export const TONES = [
  { id: "gentle", name: "Gentle", blurb: "Warm and unhurried." },
  { id: "direct", name: "Direct", blurb: "Short and clear." },
  { id: "motivational", name: "Motivational", blurb: "A little lift, still honest." },
  { id: "minimal", name: "Minimal", blurb: "As few words as possible." },
];

export const COPY = {
  todayKicker: {
    gentle: "Small steps. Better days.",
    direct: "One step is enough.",
    motivational: "You don't need a perfect day.",
    minimal: "Small steps.",
  },
  nextHeading: {
    gentle: "A small next step",
    direct: "Next",
    motivational: "Start here",
    minimal: "Next",
  },
  checkinPrompt: {
    gentle: "How are you arriving?",
    direct: "Check in.",
    motivational: "Name the weather, then move.",
    minimal: "Check in",
  },
  checkinSaved: {
    gentle: "Saved. That's enough for this part.",
    direct: "Saved.",
    motivational: "Noted. You've already started.",
    minimal: "Saved.",
  },
  emptyTasks: {
    gentle: "Nothing on the list. Add one thing, or leave it empty.",
    direct: "No open tasks.",
    motivational: "A clear list is a fine place to begin.",
    minimal: "No tasks.",
  },
  focusIdle: {
    gentle: "A short block. Distractions can wait in the parking lot.",
    direct: "Pick a length and start.",
    motivational: "Show up for the block. The result can be messy.",
    minimal: "Pick a length.",
  },
  focusDone: {
    gentle: "You showed up for that block.",
    direct: "Block finished.",
    motivational: "That counted, even if it felt small.",
    minimal: "Done.",
  },
  habitZero: {
    gentle: "No minimums yet this week. The small version still counts.",
    direct: "No minimums logged this week.",
    motivational: "The minimum is a win. It is there whenever you are.",
    minimal: "None this week.",
  },
  journalEmpty: {
    gentle: "A few lines is a full entry.",
    direct: "No entries yet.",
    motivational: "One honest sentence is enough to begin.",
    minimal: "Empty.",
  },
};

export function say(table, tone) {
  return table[tone] || table.gentle;
}

export const FOCUS_AREAS = [
  { id: "start", label: "Getting started" },
  { id: "stress", label: "Stress" },
  { id: "habits", label: "Habits" },
  { id: "focus", label: "Focus" },
  { id: "mood", label: "Mood" },
];

export const TASK_TYPES = [
  { id: "work", label: "Work" },
  { id: "chore", label: "Chore" },
  { id: "creative", label: "Creative" },
  { id: "health", label: "Health" },
  { id: "admin", label: "Admin" },
  { id: "other", label: "Other" },
];

export const MOODS = [
  { value: 1, label: "Heavy" },
  { value: 2, label: "Low" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Bright" },
];

export const JOURNAL_PROMPTS = [
  "What felt heavier than it needed to?",
  "What is one thing you can put down?",
  "Where did you show up in a small way?",
  "What would make the next hour kinder?",
  "What are you avoiding, in one sentence?",
  "What already went okay today?",
];

export function journalPrompt(date = new Date(), shift = 0) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date - start) / 86400000);
  const index = (day + shift) % JOURNAL_PROMPTS.length;
  return JOURNAL_PROMPTS[(index + JOURNAL_PROMPTS.length) % JOURNAL_PROMPTS.length];
}
