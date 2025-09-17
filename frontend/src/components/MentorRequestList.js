import {
  emptyStateClasses,
  getStatusToneClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
} from "../styles/ui";

function MentorRequestList({
  requests = [],
  role,
  onAccept,
  onConfirm,
  onDecline,
}) {
  if (!requests.length) {
    return (
      <p className={emptyStateClasses}>No mentorship requests at the moment.</p>
    );
  }

  return (
    <ul className="grid gap-4">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-white/70 p-5"
        >
          <div className="space-y-1 text-emerald-900">
            <h4 className="text-base font-semibold">
              {role === "mentor"
                ? request.journaler.name
                : request.mentor.name}
            </h4>
            <p className={`${getStatusToneClasses(request.status)} text-sm`}>
              {formatStatus(request.status)}
            </p>
            {request.message && (
              <p className="text-sm text-emerald-900/70">“{request.message}”</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {role === "mentor" && request.status === "pending" && (
              <>
                <button
                  type="button"
                  className={`${primaryButtonClasses} px-5 py-2.5 text-sm`}
                  onClick={() => onAccept(request)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
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
                  className={`${primaryButtonClasses} px-5 py-2.5 text-sm`}
                  onClick={() => onConfirm(request)}
                >
                  Confirm link
                </button>
                <button
                  type="button"
                  className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
                  onClick={() => onDecline(request)}
                >
                  Decline
                </button>
              </>
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
      return "Awaiting response";
    case "mentor_accepted":
      return "Mentor accepted";
    case "confirmed":
      return "Linked";
    case "declined":
      return "Declined";
    default:
      return status;
  }
}

export default MentorRequestList;
