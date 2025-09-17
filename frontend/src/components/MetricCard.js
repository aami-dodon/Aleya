function MetricCard({ title, value, description, children }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/70 p-5 shadow-inner shadow-emerald-900/5">
      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-900/60">
        {title}
      </span>
      <div className="mt-3 text-3xl font-bold text-emerald-900">{value}</div>
      {description && (
        <p className="mt-2 text-sm text-emerald-900/70">{description}</p>
      )}
      {children && <div className="mt-4 text-sm text-emerald-900/70">{children}</div>}
    </div>
  );
}

export default MetricCard;
