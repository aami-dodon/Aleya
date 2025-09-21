import {
  cardContainerClasses,
  sectionSubtitleClasses,
  sectionTitleClasses,
  sectionCardActionsClasses,
  sectionCardContentClasses,
  sectionCardContentOffsetClasses,
  sectionCardHeaderBetweenClasses,
  sectionCardHeaderClasses,
  sectionCardHeaderEndClasses,
  sectionCardHeadingGroupClasses,
  sectionCardIconClasses,
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
  const headerAlignmentClass = showHeaderText
    ? sectionCardHeaderBetweenClasses
    : sectionCardHeaderEndClasses;
  const headerClasses = `${sectionCardHeaderClasses} ${headerAlignmentClass}`.trim();
  const contentClasses = [
    sectionCardContentClasses,
    showHeader ? sectionCardContentOffsetClasses : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={sectionRef} className={`${cardContainerClasses} w-full`}>
      {showHeader && (
        <div className={headerClasses}>
          {showHeaderText && (
            <div className={sectionCardHeadingGroupClasses}>
              <h2 ref={titleRef} className={headingClassName} {...restTitleProps}>
                {icon && (
                  <span className={sectionCardIconClasses}>{icon}</span>
                )}
                {title}
              </h2>
              {subtitle && <p className={sectionSubtitleClasses}>{subtitle}</p>}
            </div>
          )}
          {action && <div className={sectionCardActionsClasses}>{action}</div>}
        </div>
      )}
      <div className={contentClasses}>{children}</div>
    </section>
  );
}

export default SectionCard;
