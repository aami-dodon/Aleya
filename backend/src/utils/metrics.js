const { getMoodScore } = require("./mood");

function calculateStreak(entries) {
  if (!Array.isArray(entries) || !entries.length) {
    return 0;
  }

  const dates = new Set(entries.map((entry) => entry.entry_date));
  const today = new Date();
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    const target = new Date(today);
    target.setDate(today.getDate() - offset);
    const key = target.toISOString().slice(0, 10);

    if (dates.has(key)) {
      streak += 1;
    } else if (offset === 0) {
      // first day without an entry breaks the streak only if today has no entry
      continue;
    } else {
      break;
    }
  }

  return streak;
}

function calculateAverageMood(entries) {
  if (!Array.isArray(entries) || !entries.length) {
    return null;
  }

  const scores = entries
    .map((entry) => getMoodScore(entry.mood))
    .filter((score) => typeof score === "number");

  if (!scores.length) {
    return null;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Number((total / scores.length).toFixed(2));
}

function buildMoodTrend(entries, limit = 14) {
  if (!Array.isArray(entries) || !entries.length) {
    return [];
  }

  const recent = [...entries]
    .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))
    .slice(-limit);

  return recent.map((entry) => ({
    date: entry.entry_date,
    mood: entry.mood,
    score: getMoodScore(entry.mood),
  }));
}

function buildWellbeingTrend(
  entries,
  { fieldMatchers = [], valueMap = {}, limit = 14 } = {}
) {
  if (!Array.isArray(entries) || !entries.length) {
    return [];
  }

  const normalizedMatchers = fieldMatchers
    .map((matcher) => matcher?.toString().toLowerCase())
    .filter(Boolean);

  const normalizedValueMap = Object.entries(valueMap).reduce((acc, [key, config]) => {
    if (!key) {
      return acc;
    }

    const normalizedKey = key.toString().toLowerCase();
    acc[normalizedKey] = {
      score: Number(config?.score) || null,
      label: config?.label || key,
    };
    return acc;
  }, {});

  const recent = [...entries]
    .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))
    .slice(-limit);

  return recent
    .map((entry) => {
      if (!normalizedMatchers.length) {
        return null;
      }

      const responses = Array.isArray(entry.responses) ? entry.responses : [];

      const match = responses.find((response) => {
        const label = response?.label?.toString().toLowerCase();
        if (!label) {
          return false;
        }

        return normalizedMatchers.some((matcher) => label.includes(matcher));
      });

      if (!match || match.value === null || match.value === undefined) {
        return null;
      }

      const value = Array.isArray(match.value) ? match.value[0] : match.value;

      if (value === null || value === undefined) {
        return null;
      }

      const normalizedValue = value.toString().trim();
      if (!normalizedValue) {
        return null;
      }

      const valueConfig = normalizedValueMap[normalizedValue.toLowerCase()];
      if (!valueConfig || valueConfig.score === null) {
        return null;
      }

      return {
        date: entry.entry_date,
        mood: valueConfig.label,
        score: valueConfig.score,
      };
    })
    .filter(Boolean);
}

function extractResponseText(responses = []) {
  if (!Array.isArray(responses)) {
    return String(responses || "");
  }

  return responses
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      if (typeof item.value === "string") {
        return item.value;
      }

      if (Array.isArray(item.value)) {
        return item.value.join(" ");
      }

      return "";
    })
    .join(" ");
}

function detectCrisisKeywords(responses, summary = "") {
  const text = `${extractResponseText(responses)} ${summary}`.toLowerCase();
  const keywords = [
    "harm",
    "hopeless",
    "suicidal",
    "end it",
    "worthless",
    "panic",
    "overwhelmed",
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

module.exports = {
  calculateStreak,
  calculateAverageMood,
  buildMoodTrend,
  buildWellbeingTrend,
  detectCrisisKeywords,
  extractResponseText,
};
