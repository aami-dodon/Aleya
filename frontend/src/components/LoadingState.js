function LoadingState({ label = "Gathering the morning light", compact = false }) {
  const containerClasses = compact
    ? "flex items-center justify-center text-sm font-medium text-emerald-900/70"
    : "flex min-h-[40vh] items-center justify-center text-sm font-medium text-emerald-900/70";

  return <div className={containerClasses}>{label}…</div>;
}

export default LoadingState;
