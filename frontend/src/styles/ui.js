export const primaryButtonClasses = "btn-primary";
export const secondaryButtonClasses = "btn-secondary";
export const subtleButtonClasses = "btn-subtle";
export const iconButtonClasses = "icon-button";

export const inputClasses = "form-input";
export const inputCompactClasses = "form-input-compact";
export const textareaClasses = "form-textarea";
export const selectClasses = "form-select";
export const selectCompactClasses = "form-select-compact";
export const checkboxClasses = "form-checkbox";

export const infoTextClasses = "text-info";
export const mutedTextClasses = "text-muted";
export const emptyStateClasses = "empty-state";

export const chipBaseClasses = "chip-base";
export const badgeBaseClasses = "badge-base";

export const tableHeaderClasses = "table-header";
export const tableRowClasses = "table-row";
export const cardContainerClasses = "card-container";
export const sectionTitleClasses = "section-title";
export const sectionSubtitleClasses = "section-subtitle";

export const displayTextClasses = "text-display";
export const largeHeadingClasses = "text-heading-lg";
export const mediumHeadingClasses = "text-heading-md";
export const smallHeadingClasses = "text-heading-sm";
export const xSmallHeadingClasses = "text-heading-xs";
export const leadTextClasses = "text-body-lg";
export const bodyTextClasses = "text-body";
export const bodyStrongTextClasses = "text-body-strong";
export const bodyMutedTextClasses = "text-body-muted";
export const bodySmallTextClasses = "text-body-sm";
export const bodySmallStrongTextClasses = "text-body-sm-strong";
export const bodySmallMutedTextClasses = "text-body-sm-muted";
export const eyebrowTextClasses = "text-eyebrow";
export const captionTextClasses = "text-caption";
export const formLabelClasses = "form-label";

const moodClassMap = {
  happy: "bg-emerald-100 text-emerald-700",
  loved: "bg-pink-100 text-pink-700",
  proud: "bg-amber-100 text-amber-700",
  relaxed: "bg-teal-100 text-teal-700",
  tired: "bg-slate-200 text-slate-700",
  anxious: "bg-rose-100 text-rose-700",
  angry: "bg-rose-100 text-rose-700",
  sad: "bg-sky-100 text-sky-700",
  neutral: "bg-emerald-100 text-emerald-700",
};

export function getMoodBadgeClasses(mood) {
  const key = mood?.toString().toLowerCase();
  const tone = moodClassMap[key] || moodClassMap.neutral;
  return `${badgeBaseClasses} ${tone}`.trim();
}

const shareClassMap = {
  private: "bg-slate-100 text-slate-600",
  mood: "bg-sky-100 text-sky-700",
  summary: "bg-amber-100 text-amber-700",
  full: "bg-emerald-100 text-emerald-700",
};

export function getShareChipClasses(level = "default") {
  const tone = shareClassMap[level] || "bg-emerald-50 text-emerald-700";
  return `${chipBaseClasses} ${tone}`.trim();
}

export function getStatusToneClasses(status) {
  switch (status) {
    case "mentor_accepted":
      return "text-amber-600";
    case "confirmed":
      return "text-emerald-600";
    case "declined":
      return "text-rose-600";
    default:
      return "text-emerald-900/70";
  }
}
