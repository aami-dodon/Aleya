export function parseExpertise(value) {
  if (!value) {
    return [];
  }

  const rawValues = Array.isArray(value)
    ? value
    : String(value)
        .split(/[,\n;]+/)
        .map((item) => item.trim());

  const seen = new Set();

  return rawValues
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
}

export function formatExpertise(values) {
  if (!values) {
    return "";
  }

  const tags = Array.isArray(values) ? values : parseExpertise(values);
  if (!tags.length) {
    return "";
  }

  return tags
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}
