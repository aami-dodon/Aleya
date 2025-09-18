import {
  bodyTextClasses,
  bodySmallMutedTextClasses,
  chipBaseClasses,
  mediumHeadingClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentor-profile-heading"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2
              id="mentor-profile-heading"
              className={`${mediumHeadingClasses} text-emerald-900`}
            >
              {mentor.name}
            </h2>
            {expertiseTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
            className={`${secondaryButtonClasses} px-4 py-2 text-sm`}
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {mentor.availability && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800/70">
                Availability
              </h3>
              <p className={bodyTextClasses}>{mentor.availability}</p>
            </div>
          )}

          {mentor.bio && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800/70">
                About
              </h3>
              <p className={`${bodyTextClasses} whitespace-pre-line`}>{mentor.bio}</p>
            </div>
          )}

          {!mentor.availability && !mentor.bio && (
            <p className={bodySmallMutedTextClasses}>
              This mentor hasn&apos;t shared their story yet, but their lantern is lit.
            </p>
          )}
        </div>

        {canRequest && (
          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={`${primaryButtonClasses} px-5 py-2.5 text-sm`}
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
