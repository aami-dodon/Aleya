import { format, parseISO } from "date-fns";
import {
  emptyStateClasses,
  moodChartContainerClasses,
  moodChartLegendClasses,
  moodChartLegendCopyClasses,
  moodChartLegendDateClasses,
  moodChartLegendDotClasses,
  moodChartLegendItemClasses,
  moodChartLegendLabelClasses,
  moodChartVisualClasses,
} from "../styles/ui";

const MOOD_COLORS = {
  happy: "#2f855a",
  loved: "#d53f8c",
  proud: "#b7791f",
  relaxed: "#2c7a7b",
  tired: "#4a5568",
  anxious: "#c53030",
  angry: "#c53030",
  sad: "#2b6cb0",
};

function MoodTrendChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className={emptyStateClasses}>
        Mood data will appear once entries are submitted.
      </p>
    );
  }

  const width = 320;
  const height = 120;
  const padding = 12;
  const maxScore = 5;

  const points = data.map((point, index) => {
    const score = point.score ?? (point.mood ? scoreFromMood(point.mood) : null);
    const color = colorFromMood(point.mood, score);
    const x =
      data.length === 1
        ? width / 2
        : padding + (index / (data.length - 1)) * (width - padding * 2);
    const normalizedScore = typeof score === "number" ? score : maxScore / 2;
    const y =
      height - padding - (normalizedScore / maxScore) * (height - padding * 2);
    return {
      x,
      y,
      score: normalizedScore,
      label: point.mood,
      date: point.date,
      color,
    };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  return (
    <div className={moodChartContainerClasses}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={moodChartVisualClasses}
        role="img"
      >
        <path d={path} fill="none" stroke="#047857" strokeWidth="2" />
        {points.map((point) => (
          <circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={point.color}
          />
        ))}
      </svg>
      <div className={moodChartLegendClasses}>
        {points.slice(-4).map((point) => (
          <div key={point.date} className={moodChartLegendItemClasses}>
            <span
              className={moodChartLegendDotClasses}
              style={{ background: point.color }}
            />
            <div className={moodChartLegendCopyClasses}>
              <p className={moodChartLegendLabelClasses}>
                {point.label || "—"}
              </p>
              <p className={moodChartLegendDateClasses}>
                {format(parseISO(point.date), "MMM d")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function colorFromMood(mood, score) {
  const normalized = mood?.toString().trim().toLowerCase();
  if (normalized && MOOD_COLORS[normalized]) {
    return MOOD_COLORS[normalized];
  }

  if (typeof score === "number") {
    if (score >= 4.5) {
      return "#2f855a";
    }
    if (score >= 3.5) {
      return "#38a169";
    }
    if (score >= 2.5) {
      return "#b7791f";
    }
    return "#c53030";
  }

  return "#047857";
}

function scoreFromMood(mood) {
  const map = {
    happy: 5,
    loved: 5,
    proud: 4,
    relaxed: 4,
    tired: 2,
    anxious: 1,
    angry: 1,
    sad: 1,
  };

  return map[mood?.toLowerCase()] ?? 3;
}

export default MoodTrendChart;
