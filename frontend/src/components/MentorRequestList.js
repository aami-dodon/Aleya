function MentorRequestList({
  requests = [],
  role,
  onAccept,
  onConfirm,
  onDecline,
}) {
  if (!requests.length) {
    return <p className="empty-state">No mentorship requests at the moment.</p>;
  }

  return (
    <ul className="request-list">
      {requests.map((request) => (
        <li key={request.id} className="request-item">
          <div>
            <h4>
              {role === "mentor"
                ? request.journaler.name
                : request.mentor.name}
            </h4>
            <p className={`status status-${request.status}`}>
              {formatStatus(request.status)}
            </p>
            {request.message && <p className="request-message">“{request.message}”</p>}
          </div>
          <div className="request-actions">
            {role === "mentor" && request.status === "pending" && (
              <>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => onAccept(request)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="ghost-button"
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
                  className="primary-button"
                  onClick={() => onConfirm(request)}
                >
                  Confirm link
                </button>
                <button
                  type="button"
                  className="ghost-button"
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
