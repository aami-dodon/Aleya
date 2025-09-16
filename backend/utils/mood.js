const MOOD_OPTIONS = [
  { value: "happy", label: "Happy" },
  { value: "loved", label: "Loved" },
  { value: "proud", label: "Proud" },
  { value: "relaxed", label: "Relaxed" },
  { value: "tired", label: "Tired" },
  { value: "anxious", label: "Anxious" },
  { value: "angry", label: "Angry" },
  { value: "sad", label: "Sad" },
];

const MOOD_SCORES = {
  happy: 5,
  loved: 5,
  proud: 4,
  relaxed: 4,
  tired: 2,
  anxious: 1,
  angry: 1,
  sad: 1,
};

function normalizeMood(value) {
  if (!value && value !== 0) {
    return null;
  }

  return value.toString().trim().toLowerCase();
}

function getMoodScore(mood) {
  const normalized = normalizeMood(mood);
  if (!normalized) return null;

  return MOOD_SCORES[normalized] ?? null;
}

function describeMood(score) {
  if (score === null || Number.isNaN(score)) {
    return {
      tone: "unknown",
      message: "No mood data yet",
    };
  }

  if (score >= 4.5) {
    return {
      tone: "flourishing",
      message: "You're thriving emotionally. Celebrate and keep nourishing your routines.",
    };
  }

  if (score >= 3.5) {
    return {
      tone: "steady",
      message: "Emotions are balanced. Continue checking in with yourself.",
    };
  }

  if (score >= 2.5) {
    return {
      tone: "wavering",
      message: "Energy is dipping. Reflect on what support or rest you need.",
    };
  }

  return {
    tone: "tender",
    message: "This season feels heavy. Consider reaching out to your mentor or a trusted friend.",
  };
}

module.exports = {
  MOOD_OPTIONS,
  MOOD_SCORES,
  normalizeMood,
  getMoodScore,
  describeMood,
};
