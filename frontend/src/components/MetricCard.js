import {
  metricCardClasses,
  metricCardDescriptionClasses,
  metricCardDetailsClasses,
  metricCardLabelClasses,
  metricCardValueClasses,
} from "../styles/ui";

function MetricCard({ title, value, description, children }) {
  return (
    <div className={metricCardClasses}>
      <span className={metricCardLabelClasses}>{title}</span>
      <div className={metricCardValueClasses}>{value}</div>
      {description && (
        <p className={metricCardDescriptionClasses}>{description}</p>
      )}
      {children && <div className={metricCardDetailsClasses}>{children}</div>}
    </div>
  );
}

export default MetricCard;
