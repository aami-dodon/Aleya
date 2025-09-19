const {
  describeMood,
  getMoodScore,
  normalizeMood,
  MOOD_SCORES,
} = require("../../src/utils/mood");

describe("normalizeMood", () => {
  test("returns null when value is undefined", () => {
    expect(normalizeMood(undefined)).toBeNull();
  });

  test("trims and lowercases mood values", () => {
    expect(normalizeMood(" Happy ")).toBe("happy");
  });
});

describe("getMoodScore", () => {
  test("returns null when mood is not recognized", () => {
    expect(getMoodScore("mystified")).toBeNull();
  });

  test("returns known scores", () => {
    Object.entries(MOOD_SCORES).forEach(([mood, score]) => {
      expect(getMoodScore(mood)).toBe(score);
    });
  });
});

describe("describeMood", () => {
  test("falls back when score is null", () => {
    expect(describeMood(null)).toEqual({
      tone: "unknown",
      message: "No mood data yet",
    });
  });

  test.each([
    [4.8, "flourishing"],
    [3.8, "steady"],
    [2.8, "wavering"],
    [1.5, "tender"],
  ])("maps %s to %s tone", (score, tone) => {
    expect(describeMood(score).tone).toBe(tone);
  });
});
