export const primaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:translate-y-0 disabled:opacity-60";

export const secondaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white/70 px-6 py-3.5 text-base font-semibold text-emerald-700 shadow-sm shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:translate-y-0 disabled:opacity-60";

export const subtleButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:translate-y-0 disabled:opacity-60";

export const inputClasses =
  "mt-2 w-full rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-base text-emerald-900 shadow-sm transition placeholder:text-emerald-900/40 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100";

export const inputCompactClasses =
  "w-full rounded-2xl border border-emerald-100 bg-white/90 px-4 py-2.5 text-sm text-emerald-900 shadow-sm transition placeholder:text-emerald-900/40 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100";

export const textareaClasses =
  "mt-2 w-full rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-base text-emerald-900 shadow-sm transition placeholder:text-emerald-900/40 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100";

export const selectClasses =
  "mt-2 w-full rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-base text-emerald-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100";

export const selectCompactClasses =
  "w-full rounded-2xl border border-emerald-100 bg-white/90 px-4 py-2.5 text-sm text-emerald-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100";

export const checkboxClasses =
  "h-5 w-5 rounded-md border-emerald-200 text-emerald-600 focus:ring-emerald-500";

export const infoTextClasses = "text-sm text-emerald-900/70";
export const mutedTextClasses = "text-sm text-emerald-900/60";
export const emptyStateClasses =
  "rounded-2xl border border-emerald-100 bg-white/60 p-6 text-center text-sm font-medium text-emerald-900/70";

export const chipBaseClasses =
  "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700";

export const badgeBaseClasses =
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide";

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

export const tableHeaderClasses =
  "grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 text-sm font-semibold text-emerald-900/70";

export const tableRowClasses =
  "grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3 text-sm text-emerald-900";

export const cardContainerClasses =
  "rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-lg shadow-emerald-900/10 backdrop-blur";

export const sectionTitleClasses = "text-2xl font-semibold text-emerald-950";
export const sectionSubtitleClasses = "mt-1 text-sm text-emerald-900/70";
