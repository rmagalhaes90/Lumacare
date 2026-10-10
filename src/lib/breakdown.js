const TEMPLATES = {
  work: [
    "Open the document and nothing else.",
    "Write the next rough line. It does not have to stay.",
    "Stop at a pause and note where to resume.",
  ],
  chore: [
    "Put the supplies where you will see them.",
    "Do the smallest visible patch.",
    "Choose a stopping point before it becomes the whole room.",
  ],
  creative: [
    "Set out the materials and sit down.",
    "Make a bad first version for two minutes.",
    "Save it somewhere you can find tomorrow.",
  ],
  health: [
    "Change into whatever makes starting easier.",
    "Do the easy version, not the ideal one.",
    "Stop while it still feels possible to repeat.",
  ],
  admin: [
    "Open the form, the inbox, or the bill.",
    "Complete only the first required field, or the smallest payment.",
    "File it so it can leave your head.",
  ],
  other: [
    "Name the first physical action out loud.",
    "Do only that action.",
    "Write the following action, then stop.",
  ],
};

export const RESISTANCE = [
  {
    id: "big",
    label: "It feels too big",
    reply: "Shrink it to the first action. You are not agreeing to finish.",
  },
  {
    id: "boring",
    label: "It's boring",
    reply: "Boring can be two minutes. Set a timer and stop when it ends.",
  },
  {
    id: "unclear",
    label: "I don't know how",
    reply: "The next step is only to look at it and write the first question.",
  },
  {
    id: "tired",
    label: "I'm tired",
    reply: "Use the minimum. A tired day still counts when the step is small enough.",
  },
  {
    id: "afraid",
    label: "I might do it badly",
    reply: "A rough pass is the job. Quality can be a later task.",
  },
  {
    id: "start",
    label: "I can't get started",
    reply: "Start the two-minute timer. Starting is the whole assignment.",
  },
];

export function suggestBreakdown(task) {
  const type = TEMPLATES[task?.type] ? task.type : "other";
  return TEMPLATES[type].map((text) => text);
}
