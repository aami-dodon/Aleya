import {
  bodySmallMutedTextClasses,
  bodyTextClasses,
  chipBaseClasses,
  dialogActionsClasses,
  dialogBackdropClasses,
  dialogBodyClasses,
  dialogCloseClasses,
  dialogHeaderClasses,
  dialogHeadingGroupClasses,
  dialogPanelClasses,
  dialogSectionClasses,
  dialogSectionTitleClasses,
  dialogTitleClasses,
  mentorDialogChipsClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  buttonPadSmClasses,
  textPreLineClasses,
} from "../styles/ui";
import { parseExpertise } from "../utils/expertise";

function MentorProfileDialog({ mentor, onClose, onRequest, canRequest }) {
  if (!mentor) return null;

  const expertiseTags = parseExpertise(mentor.expertise);

  const handleRequest = () => {
    if (typeof onRequest === "function") {
      onRequest(mentor);
    }
  };

  return (
    <div
      className={dialogBackdropClasses}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentor-profile-heading"
      onClick={onClose}
    >
      <div
        className={dialogPanelClasses}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={dialogHeaderClasses}>
          <div className={dialogHeadingGroupClasses}>
            <h2 id="mentor-profile-heading" className={dialogTitleClasses}>
              {mentor.name}
            </h2>
            {expertiseTags.length > 0 && (
              <div className={mentorDialogChipsClasses}>
                {expertiseTags.map((tag) => (
                  <span key={tag} className={chipBaseClasses}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {mentor.email && (
              <p className={bodySmallMutedTextClasses}>{mentor.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${secondaryButtonClasses} ${dialogCloseClasses}`}
          >
            Close
          </button>
        </div>

        <div className={dialogBodyClasses}>
          {mentor.availability && (
            <div className={dialogSectionClasses}>
              <h3 className={dialogSectionTitleClasses}>
                Availability
              </h3>
              <p className={bodyTextClasses}>{mentor.availability}</p>
            </div>
          )}

          {mentor.bio && (
            <div className={dialogSectionClasses}>
              <h3 className={dialogSectionTitleClasses}>
                About
              </h3>
              <p className={`${bodyTextClasses} ${textPreLineClasses}`}>{mentor.bio}</p>
            </div>
          )}

          {!mentor.availability && !mentor.bio && (
            <p className={bodySmallMutedTextClasses}>
              This mentor hasn&apos;t shared their story yet, but their lantern is lit.
            </p>
          )}
        </div>

        {canRequest && (
          <div className={dialogActionsClasses}>
            <button
              type="button"
              className={`${primaryButtonClasses} ${buttonPadSmClasses}`}
              onClick={handleRequest}
            >
              Request mentorship
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MentorProfileDialog;
