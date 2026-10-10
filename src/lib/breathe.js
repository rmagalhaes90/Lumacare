export const BREATHS = [
  {
    id: "box",
    name: "Box breathing",
    summary: "Even sides. Useful when stress is loud.",
    rounds: 4,
    phases: [
      { name: "Inhale", seconds: 4, scale: 1 },
      { name: "Hold", seconds: 4, scale: 1 },
      { name: "Exhale", seconds: 4, scale: 0.72 },
      { name: "Hold", seconds: 4, scale: 0.72 },
    ],
  },
  {
    id: "relax478",
    name: "4-7-8",
    summary: "A longer exhale for winding down.",
    rounds: 4,
    phases: [
      { name: "Inhale", seconds: 4, scale: 1 },
      { name: "Hold", seconds: 7, scale: 1 },
      { name: "Exhale", seconds: 8, scale: 0.68 },
    ],
  },
  {
    id: "sigh",
    name: "Physiological sigh",
    summary: "Two inhales, then a long exhale.",
    rounds: 5,
    phases: [
      { name: "Inhale", seconds: 2, scale: 0.88 },
      { name: "Sip more air", seconds: 1, scale: 1 },
      { name: "Exhale slowly", seconds: 6, scale: 0.66 },
    ],
  },
  {
    id: "coherent",
    name: "Coherent breathing",
    summary: "Five seconds in, five seconds out.",
    rounds: 6,
    phases: [
      { name: "Inhale", seconds: 5, scale: 1 },
      { name: "Exhale", seconds: 5, scale: 0.72 },
    ],
  },
];

export function breathById(id) {
  return BREATHS.find((item) => item.id === id) || BREATHS[0];
}

export function phaseAt(breath, elapsedSeconds) {
  const cycle = breath.phases.reduce((sum, phase) => sum + phase.seconds, 0);
  const total = cycle * breath.rounds;
  if (elapsedSeconds >= total) {
    return { done: true, round: breath.rounds, phase: breath.phases[breath.phases.length - 1], index: breath.phases.length - 1 };
  }
  const into = elapsedSeconds % cycle;
  let cursor = 0;
  for (let index = 0; index < breath.phases.length; index++) {
    const phase = breath.phases[index];
    if (into < cursor + phase.seconds) {
      return {
        done: false,
        round: Math.floor(elapsedSeconds / cycle) + 1,
        phase,
        index,
      };
    }
    cursor += phase.seconds;
  }
  return { done: false, round: 1, phase: breath.phases[0], index: 0 };
}
