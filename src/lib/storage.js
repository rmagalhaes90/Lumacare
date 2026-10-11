import { Capacitor } from "@capacitor/core";
import { normalizeCheckin, normalizeHabit } from "./habits.js";

export const STORAGE_KEY = "lumacare-v1";

export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayPart(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function weekKeys(today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dayKey(d);
  });
}

export function emptyState() {
  return {
    version: 1,
    profile: {
      name: "",
      tone: "gentle",
      themeId: "calm",
      reducedMotion: false,
      onboarded: false,
      focusAreas: [],
      keptThemeIds: ["calm"],
      usedBreathIds: [],
      premiumPreview: false,
    },
    checkins: [],
    tasks: [],
    brainDump: [],
    focusSessions: [],
    activeFocus: null,
    habits: [],
    journal: [],
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeState(data) {
  const base = emptyState();
  if (!data || typeof data !== "object") return base;
  const profile = { ...base.profile, ...(data.profile || {}) };
  if (!Array.isArray(profile.focusAreas)) profile.focusAreas = [];
  if (!Array.isArray(profile.keptThemeIds)) profile.keptThemeIds = [profile.themeId || "calm"];
  if (!profile.keptThemeIds.includes(profile.themeId)) profile.keptThemeIds.push(profile.themeId);
  if (!Array.isArray(profile.usedBreathIds)) profile.usedBreathIds = [];
  return {
    ...base,
    ...data,
    profile,
    checkins: asArray(data.checkins).map(normalizeCheckin),
    tasks: asArray(data.tasks),
    brainDump: asArray(data.brainDump),
    focusSessions: asArray(data.focusSessions),
    activeFocus: data.activeFocus || null,
    habits: asArray(data.habits).map(normalizeHabit),
    journal: asArray(data.journal),
  };
}

const NATIVE_FILE = "lumacare-v1.json";
let memory = null;

export async function hydrateState() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const file = await Filesystem.readFile({
      path: NATIVE_FILE,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    memory = normalizeState(JSON.parse(file.data));
  } catch {
    memory = emptyState();
  }
}

export function loadState() {
  if (memory) return memory;
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  memory = state;
  if (Capacitor.isNativePlatform()) {
    import("@capacitor/filesystem")
      .then(({ Filesystem, Directory, Encoding }) =>
        Filesystem.writeFile({
          path: NATIVE_FILE,
          data: JSON.stringify(state),
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        }),
      )
      .catch(() => {});
    return;
  }
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or a full disk — keep the session in memory */
  }
}
