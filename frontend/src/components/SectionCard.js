function SectionCard({ title, subtitle, action, children, icon }) {
  return (
    <section className="section-card">
      <div className="section-card-header">
        <div>
          <h2>
            {icon && <span className="section-icon">{icon}</span>}
            {title}
          </h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="section-action">{action}</div>}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

export default SectionCard;
