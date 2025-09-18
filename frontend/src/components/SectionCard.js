import {
  cardContainerClasses,
  sectionSubtitleClasses,
  sectionTitleClasses,
} from "../styles/ui";

function SectionCard({
  title,
  subtitle,
  action,
  children,
  icon,
  sectionRef,
  titleRef,
  titleProps = {},
}) {
  const showHeaderText = Boolean(title || subtitle || icon);
  const showHeader = showHeaderText || Boolean(action);
  const { className: titleClassName = "", ...restTitleProps } = titleProps;
  const headingClassName = [sectionTitleClasses, titleClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={sectionRef} className={`${cardContainerClasses} w-full`}>
      {showHeader && (
        <div
          className={`flex flex-wrap items-center gap-4 ${
            showHeaderText ? "justify-between" : "justify-end"
          }`}
        >
          {showHeaderText && (
            <div className="space-y-1">
              <h2 ref={titleRef} className={headingClassName} {...restTitleProps}>
                {icon && (
                  <span className="mr-2 inline-flex items-center">{icon}</span>
                )}
                {title}
              </h2>
              {subtitle && <p className={sectionSubtitleClasses}>{subtitle}</p>}
            </div>
          )}
          {action && <div className="flex items-center gap-3">{action}</div>}
        </div>
      )}
      <div className={`${showHeader ? "mt-6" : ""} space-y-4`}>{children}</div>
    </section>
  );
}

export default SectionCard;
