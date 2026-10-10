import { dayKey, weekKeys } from "./storage.js";

function daysBack(today, count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return dayKey(date);
  });
}

export function buildInsights(state, today = new Date()) {
  const recent = new Set(daysBack(today, 7));
  const checkins = (state.checkins || []).filter((item) => recent.has(item.date));
  const tasks = state.tasks || [];
  const done = tasks.filter((task) => task.status === "done" && task.doneAt && recent.has(dayKey(new Date(task.doneAt))));
  const sessions = (state.focusSessions || []).filter((session) => session.endedAt && recent.has(dayKey(new Date(session.endedAt))));
  const focusMin = sessions.reduce((sum, session) => sum + (session.durationMin || 0), 0);
  const week = new Set(weekKeys(today));
  const habitDays = (state.habits || []).reduce((sum, habit) => {
    return sum + Object.entries(habit.logs || {}).filter(([key, value]) => week.has(key) && (value === "min" || value === "full")).length;
  }, 0);
  const journalCount = (state.journal || []).filter((entry) => recent.has(dayKey(new Date(entry.createdAt)))).length;

  const avg = (key) => {
    if (!checkins.length) return null;
    return checkins.reduce((sum, item) => sum + Number(item[key] || 0), 0) / checkins.length;
  };
  const energy = avg("energy");
  const stress = avg("stress");

  return [
    {
      id: "checkin",
      title: "Check-in rhythm",
      body: checkins.length
        ? `You checked in ${checkins.length} ${checkins.length === 1 ? "day" : "days"} in the last week. That is the pattern everything else hangs on.`
        : "No check-ins in the last week yet. One today is enough to start a rhythm.",
    },
    {
      id: "energy",
      title: "Energy and stress",
      body:
        energy == null
          ? "Once a few check-ins exist, this will show whether energy or stress is the louder one."
          : `Average energy ${energy.toFixed(1)} and stress ${stress.toFixed(1)} over recent check-ins. ${
              stress >= energy ? "On louder days, breathe before you pick a task." : "Energy has been keeping up. A real focus block will fit."
            }`,
    },
    {
      id: "tasks",
      title: "Tasks you touched",
      body: done.length
        ? `${done.length} ${done.length === 1 ? "task" : "tasks"} marked done in the last week. Open ones are still allowed to stay small.`
        : "No tasks marked done this week. A two-minute start still counts as touching the work.",
    },
    {
      id: "focus",
      title: "Focus time",
      body: focusMin
        ? `${focusMin} planned minutes across ${sessions.length} ${sessions.length === 1 ? "block" : "blocks"} this week.`
        : "No focus blocks logged this week. Ten minutes is a full session.",
    },
    {
      id: "habits",
      title: "Minimums met",
      body: habitDays
        ? `Your habits met their minimum ${habitDays} ${habitDays === 1 ? "time" : "times"} this week. Full versions are optional.`
        : "No habit minimums logged this week. Missing a day does not erase the ones you do meet.",
    },
    {
      id: "journal",
      title: "Journal",
      body: journalCount
        ? `${journalCount} ${journalCount === 1 ? "entry" : "entries"} in the last week. They stay on this device.`
        : "No journal entries this week. A prompt is waiting, and a sentence is enough.",
    },
  ];
}

export function decorateInsights(insights, isPremium, limit = 1) {
  return insights.map((item, index) => ({
    ...item,
    locked: !isPremium && index >= limit,
  }));
}
