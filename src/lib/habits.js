export const ROUTINE_TIMES = [
  { id: "morning", label: "Morning" },
  { id: "day", label: "Day" },
  { id: "evening", label: "Evening" },
  { id: "anytime", label: "Anytime" },
];

export const ACTIVITIES = [
  { id: "sleep", label: "Slept" },
  { id: "outside", label: "Outside" },
  { id: "moved", label: "Moved" },
  { id: "people", label: "People" },
  { id: "screens", label: "Screens" },
  { id: "food", label: "Ate" },
  { id: "focus", label: "Focused" },
  { id: "rest", label: "Rested" },
];

export const FEELINGS = {
  1: ["Heavy", "Flat", "Tender"],
  2: ["Low", "Restless", "Tired"],
  3: ["Okay", "Steady", "Quiet"],
  4: ["Good", "Clear", "Warm"],
  5: ["Bright", "Light", "Open"],
};

export const STARTER_HABITS = [
  {
    name: "Daylight",
    minimum: "Step outside for one minute",
    full: "Ten minutes of outdoor light",
    when: "morning",
    cue: "After I get up",
    why: "Outdoor light gives the day a start that does not depend on feeling motivated.",
  },
  {
    name: "Water",
    minimum: "Drink one glass",
    full: "Keep a bottle where you can see it",
    when: "morning",
    cue: "After the kettle or the fridge",
    why: "The glass is the habit. Anything more is extra.",
  },
  {
    name: "One stretch",
    minimum: "Reach overhead once",
    full: "A few easy minutes of moving",
    when: "day",
    cue: "After I stand up from a chair",
    why: "A tiny movement is easier to repeat than a workout you keep postponing.",
  },
  {
    name: "One page",
    minimum: "Read a single page",
    full: "Read until you want to stop",
    when: "evening",
    cue: "After I sit down at night",
    why: "One page still counts. The point is opening the book.",
  },
  {
    name: "Phone down",
    minimum: "Put the phone in another room for two minutes",
    full: "Leave it there while you wind down",
    when: "evening",
    cue: "After I plug it in",
    why: "The cue is the charger. You are not trying to become a different person first.",
  },
  {
    name: "One surface",
    minimum: "Clear one small surface",
    full: "Put away what you can see from where you sit",
    when: "anytime",
    cue: "After I notice the clutter",
    why: "A finished corner is easier to feel than a finished house.",
  },
];

export const CALMER_DAY = ["Daylight", "Water", "Phone down"];

const TIMES = new Set(ROUTINE_TIMES.map((item) => item.id));

export function normalizeHabit(habit) {
  return {
    ...habit,
    when: TIMES.has(habit?.when) ? habit.when : "anytime",
    cue: habit?.cue || "",
    why: habit?.why || "",
    full: habit?.full || "",
    logs: habit?.logs && typeof habit.logs === "object" ? habit.logs : {},
  };
}

export function normalizeCheckin(entry) {
  const activities = Array.isArray(entry?.activities)
    ? entry.activities.filter((id) => ACTIVITIES.some((item) => item.id === id))
    : [];
  return { ...entry, activities, feeling: entry?.feeling || "" };
}

export function startersNamed(names) {
  return STARTER_HABITS.filter((item) => names.includes(item.name));
}

export function nextStarters(habits, names, room) {
  const owned = new Set((habits || []).map((habit) => habit.name));
  return startersNamed(names).filter((item) => !owned.has(item.name)).slice(0, Math.max(0, room));
}

export function readCheckin({ mood, energy, stress, activities = [] }) {
  if (stress >= 4) return "Stress is the loudest signal. A short breath is a reasonable first move.";
  if (energy != null && energy <= 2) return "Energy is low. The minimum version of a habit is the whole assignment.";
  if (activities.includes("outside")) return "You already got outside. That can be enough of a win for today.";
  if (mood >= 4 && energy >= 4) return "There is some room today. One real focus block will fit.";
  if (mood == null) return "You can stop here. Coming back later still counts.";
  return "Noted. Nothing else is required.";
}

export function affirmation({ name, mood, feeling }) {
  const who = name ? `${name}, ` : "";
  if (feeling) return `${who}“${feeling}” is a true enough word. You do not have to fix it.`;
  if (mood != null && mood <= 2) return `${who}heavy days are allowed here. You are still welcome.`;
  if (mood != null && mood >= 4) return `${who}there is some light today. Use as much or as little as you want.`;
  return `${who}you named it. That is a steady place to stand.`;
}
