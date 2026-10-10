import assert from "node:assert/strict";
import test from "node:test";
import { suggestBreakdown } from "../src/lib/breakdown.js";
import { phaseAt } from "../src/lib/breathe.js";
import { canAddHabit, canUseBreath, canUseTheme, FREE_HABIT_LIMIT } from "../src/lib/gating.js";
import { buildInsights, decorateInsights } from "../src/lib/insights.js";
import { suggestNext } from "../src/lib/suggest.js";
import { normalizeState } from "../src/lib/storage.js";

test("breakdown returns three steps for known and unknown types", () => {
  for (const type of ["work", "chore", "creative", "health", "admin", "nope"]) {
    const steps = suggestBreakdown({ type, title: "Write the note" });
    assert.equal(steps.length, 3);
    assert.ok(steps.every((step) => step.length > 8));
  }
});

test("habit, theme, and breath gates keep what someone already has", () => {
  assert.equal(canAddHabit([1, 2], false), true);
  assert.equal(canAddHabit([1, 2, 3], false), false);
  assert.equal(canAddHabit(Array.from({ length: FREE_HABIT_LIMIT + 2 }), true), true);
  assert.equal(canUseTheme("dusk", { keptThemeIds: ["calm"] }, false), false);
  assert.equal(canUseTheme("dusk", { keptThemeIds: ["dusk"] }, false), true);
  assert.equal(canUseTheme("midnight", { keptThemeIds: [] }, false), true);
  assert.equal(canUseBreath("sigh", { usedBreathIds: [] }, false), false);
  assert.equal(canUseBreath("sigh", { usedBreathIds: ["sigh"] }, false), true);
  assert.equal(canUseBreath("box", { usedBreathIds: [] }, false), true);
});

test("suggestions follow stress, energy, and an open task", () => {
  assert.equal(suggestNext({ checkin: null }).action, "checkin");
  assert.equal(suggestNext({ checkin: { stress: 5, energy: 4 }, tasks: [], habits: [] }).action, "breathe");
  const low = suggestNext({
    checkin: { stress: 2, energy: 1 },
    habits: [{ id: "h1", name: "Water", minimum: "One sip", logs: {} }],
    todayKey: "2026-10-10",
  });
  assert.equal(low.action, "habit");
  const task = suggestNext({
    checkin: { stress: 1, energy: 4 },
    tasks: [{ id: "t1", title: "Email Sam", status: "open" }],
    habits: [],
    focusAreas: [],
  });
  assert.equal(task.id, "task");
});

test("free insights keep the first pattern visible", () => {
  const insights = buildInsights({ checkins: [], tasks: [], habits: [], focusSessions: [], journal: [] }, new Date("2026-10-10"));
  assert.ok(insights.length > 1);
  const decorated = decorateInsights(insights, false, 1);
  assert.equal(decorated[0].locked, false);
  assert.equal(decorated[1].locked, true);
  assert.ok(decorateInsights(insights, true).every((item) => item.locked === false));
});

test("breath timing finishes after the full cycle", () => {
  const breath = {
    rounds: 2,
    phases: [
      { name: "Inhale", seconds: 4, scale: 1 },
      { name: "Exhale", seconds: 4, scale: 0.7 },
    ],
  };
  assert.equal(phaseAt(breath, 0).phase.name, "Inhale");
  assert.equal(phaseAt(breath, 5).phase.name, "Exhale");
  assert.equal(phaseAt(breath, 16).done, true);
});

test("normalize keeps partial saves usable", () => {
  const state = normalizeState({ profile: { name: "Ada", themeId: "dusk" }, tasks: [{ id: "1" }] });
  assert.equal(state.profile.name, "Ada");
  assert.ok(state.profile.keptThemeIds.includes("dusk"));
  assert.deepEqual(state.journal, []);
  assert.equal(state.tasks.length, 1);
});
