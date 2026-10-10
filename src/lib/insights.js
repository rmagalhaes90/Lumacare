import { ACTIVITIES } from "./habits.js";
import { dayKey, weekKeys } from "./storage.js";

function activityInsight(checkins) {
  const ranked = ACTIVITIES.map((activity) => {
    const withIt = checkins.filter((item) => item.activities?.includes(activity.id));
    const without = checkins.filter((item) => !item.activities?.includes(activity.id));
    if (withIt.length < 2 || without.length < 2) return null;
    const avg = (list) => list.reduce((sum, item) => sum + Number(item.mood || 0), 0) / list.length;
    return { activity, delta: avg(withIt) - avg(without) };
  }).filter(Boolean).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const best = ranked[0];
  if (!best || Math.abs(best.delta) < 0.4) {
    const any = checkins.some((item) => item.activities?.length);
    return {
      id: "activities",
      title: "What you tagged",
      body: any
        ? "Tags are collecting. A pattern appears once the same activity shows up on both lighter and heavier days."
        : "On a check-in, tag a few parts of the day — outside, sleep, people. This will compare them with your mood, and it stays on this device.",
    };
  }
  const direction = best.delta > 0 ? "a little lighter" : "a little heavier";
  return {
    id: "activities",
    title: "What travels with your mood",
    body: `Days tagged ${best.activity.label} averaged ${direction} than days without that tag. That is a pattern in your notes, not a rule.`,
  };
}

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
    activityInsight(checkins),
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
