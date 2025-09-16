import { format, parseISO } from "date-fns";

function MoodTrendChart({ data = [] }) {
  if (!data.length) {
    return <p className="empty-state">Mood data will appear once entries are submitted.</p>;
  }

  const width = 320;
  const height = 120;
  const padding = 12;
  const maxScore = 5;

  const points = data.map((point, index) => {
    const score = point.score ?? (point.mood ? scoreFromMood(point.mood) : null);
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
    };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="mood-trend">
      <svg viewBox={`0 0 ${width} ${height}`} className="mood-chart" role="img">
        <path d={path} fill="none" stroke="var(--accent-green)" strokeWidth="2" />
        {points.map((point) => (
          <circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="var(--accent-green)"
          />
        ))}
      </svg>
      <div className="mood-legend">
        {points.slice(-4).map((point) => (
          <div key={point.date} className="mood-legend-item">
            <span className="mood-dot" />
            <div>
              <p>{point.label || "—"}</p>
              <small>{format(parseISO(point.date), "MMM d")}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
