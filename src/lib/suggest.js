export function suggestNext({ checkin, tasks = [], habits = [], todayKey, focusAreas = [] }) {
  if (!checkin) {
    return {
      id: "checkin",
      title: "A ten-second check-in",
      detail: "Mood, energy, and stress. The rest of today leans on this.",
      action: "checkin",
    };
  }

  if (checkin.stress >= 4) {
    return {
      id: "breathe",
      title: "One round of breathing",
      detail: "Stress is high. Settle first, then pick a tiny task.",
      action: "breathe",
    };
  }

  if (checkin.energy <= 2) {
    const habit = habits.find((item) => !item.logs?.[todayKey]);
    if (habit) {
      return {
        id: "habit-min",
        title: habit.minimum || habit.name,
        detail: "Energy is low. The minimum version is the whole goal.",
        action: "habit",
        habitId: habit.id,
      };
    }
    const task = tasks.find((item) => item.status !== "done");
    if (task) {
      return {
        id: "two-minute",
        title: `Two minutes on “${task.title}”`,
        detail: "You can stop when the timer ends.",
        action: "two-minute",
        taskId: task.id,
      };
    }
  }

  const open = tasks.find((item) => item.status !== "done");
  if (open && (checkin.energy >= 3 || focusAreas.includes("start") || focusAreas.includes("focus"))) {
    return {
      id: "task",
      title: open.title,
      detail: "Touch this one next. Break it down if it sticks.",
      action: "task",
      taskId: open.id,
    };
  }

  const pendingHabit = habits.find((item) => !item.logs?.[todayKey]);
  if (pendingHabit) {
    return {
      id: "habit",
      title: pendingHabit.name,
      detail: pendingHabit.minimum ? `Minimum: ${pendingHabit.minimum}` : "The small version counts.",
      action: "habit",
      habitId: pendingHabit.id,
    };
  }

  if (focusAreas.includes("mood") || focusAreas.includes("stress")) {
    return {
      id: "journal",
      title: "A few lines in the journal",
      detail: "Nothing to optimize. Put the day somewhere.",
      action: "journal",
    };
  }

  return {
    id: "focus",
    title: "A short focus block",
    detail: "Ten quiet minutes, with a place to park distractions.",
    action: "focus",
  };
}
