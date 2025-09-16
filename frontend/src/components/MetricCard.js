function MetricCard({ title, value, description, children, tone = "default" }) {
  return (
    <div className={`metric-card metric-card-${tone}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">{value}</div>
      {description && <p className="metric-description">{description}</p>}
      {children && <div className="metric-children">{children}</div>}
    </div>
  );
}

export default MetricCard;
