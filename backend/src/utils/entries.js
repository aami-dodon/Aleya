const LEVELS = ["private", "mood", "summary", "full"];

function normalizeLevel(level) {
  if (!level) return "private";
  const normalized = level.toString().toLowerCase();
  return LEVELS.includes(normalized) ? normalized : "private";
}

function resolveSharedLevel(entryLevel, maxLevel) {
  const normalizedEntry = normalizeLevel(entryLevel);
  if (!maxLevel) {
    return normalizedEntry;
  }

  const normalizedMax = normalizeLevel(maxLevel);
  const entryIndex = LEVELS.indexOf(normalizedEntry);
  const maxIndex = LEVELS.indexOf(normalizedMax);

  if (entryIndex === -1) {
    return "private";
  }

  if (maxIndex === -1) {
    return normalizedEntry;
  }

  return LEVELS[Math.min(entryIndex, maxIndex)];
}

function shapeEntryForMentor(entry, options = {}) {
  if (!entry) {
    return null;
  }

  const { maxLevel } = options;
  const sharedLevel = resolveSharedLevel(entry.sharedLevel, maxLevel);

  const shaped = {
    id: entry.id,
    formId: entry.formId,
    entryDate: entry.entryDate,
    mood: entry.mood,
    sharedLevel,
    summary: null,
    responses: [],
    formTitle: entry.formTitle,
  };

  if (sharedLevel === "private") {
    shaped.mood = null;
    return shaped;
  }

  if (sharedLevel === "mood") {
    return shaped;
  }

  if (sharedLevel === "summary") {
    shaped.summary = entry.summary || null;
    return shaped;
  }

  if (sharedLevel === "full") {
    shaped.summary = entry.summary || null;
    shaped.responses = Array.isArray(entry.responses) ? entry.responses : [];
    return shaped;
  }

  return shaped;
}

module.exports = {
  shapeEntryForMentor,
  resolveSharedLevel,
};
