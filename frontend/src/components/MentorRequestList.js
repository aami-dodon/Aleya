import {
  emptyStateClasses,
  getStatusToneClasses,
  primaryButtonCompactClasses,
  requestCardActionsClasses,
  requestCardBodyClasses,
  requestCardClasses,
  requestCardMessageClasses,
  requestCardStatusClasses,
  requestCardTitleClasses,
  requestListClasses,
  secondaryButtonCompactClasses,
} from "../styles/ui";

function MentorRequestList({
  requests = [],
  role,
  onAccept,
  onConfirm,
  onDecline,
  onEnd,
}) {
  if (!requests.length) {
    return (
      <p className={emptyStateClasses}>No mentorship invitations right now—the sky is briefly clear.</p>
    );
  }

  return (
    <ul className={requestListClasses}>
      {requests.map((request) => (
        <li
          key={request.id}
          className={requestCardClasses}
        >
          <div className={requestCardBodyClasses}>
            <h4 className={requestCardTitleClasses}>
              {role === "mentor"
                ? request.journaler.name
                : request.mentor.name}
            </h4>
            <p
              className={`${getStatusToneClasses(
                request.status
              )} ${requestCardStatusClasses}`}
            >
              {formatStatus(request.status)}
            </p>
            {request.message && (
              <p className={requestCardMessageClasses}>
                “{request.message}”
              </p>
            )}
          </div>
          <div className={requestCardActionsClasses}>
            {role === "mentor" && request.status === "pending" && (
              <>
                <button
                  type="button"
                  className={primaryButtonCompactClasses}
                  onClick={() => onAccept(request)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className={secondaryButtonCompactClasses}
                  onClick={() => onDecline(request)}
                >
                  Decline
                </button>
              </>
            )}
            {role === "journaler" && request.status === "mentor_accepted" && (
              <>
                <button
                  type="button"
                  className={primaryButtonCompactClasses}
                  onClick={() => onConfirm(request)}
                >
                  Confirm link
                </button>
                <button
                  type="button"
                  className={secondaryButtonCompactClasses}
                  onClick={() => onDecline(request)}
                >
                  Decline
                </button>
              </>
            )}
            {role === "journaler" &&
              request.status === "confirmed" &&
              typeof onEnd === "function" && (
                <button
                  type="button"
                  className={secondaryButtonCompactClasses}
                  onClick={() => onEnd(request)}
                >
                  End mentorship
                </button>
              )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatStatus(status) {
  switch (status) {
    case "pending":
      return "Awaiting your welcome";
    case "mentor_accepted":
      return "Mentor has accepted";
    case "confirmed":
      return "Bond confirmed";
    case "declined":
      return "Declined";
    case "ended":
      return "Mentorship closed";
    default:
      return status;
  }
}

export default MentorRequestList;
