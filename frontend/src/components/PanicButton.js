import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  dangerButtonClasses,
  secondaryButtonClasses,
  selectCompactClasses,
  textareaClasses,
  bodySmallMutedTextClasses,
  buttonPadSmClasses,
  buttonPadXsClasses,
  dialogActionsInlineClasses,
  dialogBackdropClasses,
  dialogBodyClasses,
  dialogFieldClasses,
  dialogFieldLabelClasses,
  dialogFormClasses,
  dialogHeaderClasses,
  dialogHeadingGroupClasses,
  dialogMessagesErrorClasses,
  dialogMessagesSuccessClasses,
  dialogPanelScrollClasses,
  dialogPanelWideClasses,
  dialogSubtitleClasses,
  dialogTitleCompactClasses,
  dialogCloseClasses,
} from "../styles/ui";

function PanicButton() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);

  const canUseSOS = user?.role === "journaler" && Boolean(token);

  const resetState = useCallback(() => {
    setSelectedMentor("");
    setMessage("");
    setError(null);
    setSuccess(null);
  }, []);

  const openDialog = () => {
    if (!canUseSOS) {
      return;
    }
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetState();
  };

  const loadContacts = useCallback(async () => {
    if (!canUseSOS) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/mentors/support-network", token);
      setContacts(response.mentors || []);
    } catch (err) {
      setError(err.message || "Unable to reach your circle of mentors.");
    } finally {
      setLoading(false);
    }
  }, [canUseSOS, token]);

  useEffect(() => {
    if (isOpen && !contacts.length && !loading) {
      loadContacts();
    }
  }, [isOpen, contacts.length, loading, loadContacts]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedMentor) {
      setError("Choose a mentor to receive your flare.");
      return;
    }
    if (!message.trim()) {
      setError("Add a brief note so your mentor knows how to arrive.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const target = contacts.find((contact) => String(contact.id) === selectedMentor);
      await apiClient.post(
        "/mentors/panic-alerts",
        {
          mentorId: Number(selectedMentor),
          message: message.trim(),
        },
        token
      );
      setSuccess(
        target?.name
          ? `Aleya has carried your SOS to ${target.name}.`
          : "Aleya has carried your SOS."
      );
      setMessage("");
    } catch (err) {
      setError(err.message || "Aleya could not send the SOS. Try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  const hasContacts = useMemo(() => contacts.length > 0, [contacts.length]);

  if (!canUseSOS) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={`${dangerButtonClasses} ${buttonPadXsClasses}`}
        onClick={openDialog}
      >
        SOS
      </button>

      {isOpen && (
        <div
          className={dialogBackdropClasses}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-dialog-heading"
          onClick={closeDialog}
        >
          <div
            className={dialogPanelWideClasses}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={dialogPanelScrollClasses}>
              <div className={dialogHeaderClasses}>
                <div className={dialogHeadingGroupClasses}>
                  <h2 id="sos-dialog-heading" className={dialogTitleCompactClasses}>
                    Send a flare for support
                  </h2>
                  <p className={dialogSubtitleClasses}>
                    Choose a linked mentor and share why you need immediate care so they can arrive prepared.
                  </p>
                </div>
                <button
                  type="button"
                  className={`${secondaryButtonClasses} ${dialogCloseClasses}`}
                  onClick={closeDialog}
                >
                  Close
                </button>
              </div>

              <div className={dialogBodyClasses}>
                {loading && (
                  <p className={bodySmallMutedTextClasses}>Calling your mentors…</p>
                )}

                {!loading && !hasContacts && !error && (
                  <p className={bodySmallMutedTextClasses}>
                    You are not yet linked with mentors. Invite one to activate this SOS lantern.
                  </p>
                )}

                {hasContacts && (
                  <form className={dialogFormClasses} onSubmit={handleSubmit}>
                    <div className={dialogFieldClasses}>
                      <label className={dialogFieldLabelClasses} htmlFor="sos-mentor">
                        Reach out to
                      </label>
                      <select
                        id="sos-mentor"
                        className={selectCompactClasses}
                        value={selectedMentor}
                        onChange={(event) => setSelectedMentor(event.target.value)}
                        disabled={sending}
                      >
                        <option value="">Select a mentor</option>
                        {contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name || contact.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={dialogFieldClasses}>
                      <label className={dialogFieldLabelClasses} htmlFor="sos-message">
                        What do they need to know?
                      </label>
                      <textarea
                        id="sos-message"
                        className={textareaClasses}
                        rows={4}
                        placeholder="Share context so they can meet you right away."
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        disabled={sending}
                      />
                    </div>

                    {error && (
                      <p className={dialogMessagesErrorClasses}>{error}</p>
                    )}

                    {success && (
                      <p className={dialogMessagesSuccessClasses}>{success}</p>
                    )}

                    <div className={dialogActionsInlineClasses}>
                      <button
                        type="button"
                        className={`${secondaryButtonClasses} ${buttonPadSmClasses}`}
                        onClick={closeDialog}
                        disabled={sending}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`${dangerButtonClasses} ${buttonPadSmClasses}`}
                        disabled={sending}
                      >
                        {sending ? "Sending…" : "Send SOS lantern"}
                      </button>
                    </div>
                  </form>
                )}

                {error && !hasContacts && (
                  <p className={dialogMessagesErrorClasses}>{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PanicButton;
