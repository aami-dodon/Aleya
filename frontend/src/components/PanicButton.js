import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  dangerButtonClasses,
  secondaryButtonClasses,
  selectCompactClasses,
  textareaClasses,
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
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
      setError(err.message || "Unable to load mentors.");
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
      setError("Select a mentor to contact.");
      return;
    }
    if (!message.trim()) {
      setError("Add a brief note before sending.");
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
          ? `SOS alert sent to ${target.name}.`
          : "SOS alert sent successfully."
      );
      setMessage("");
    } catch (err) {
      setError(err.message || "Failed to send SOS alert.");
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
        className={`${dangerButtonClasses} px-4 py-2 text-sm`}
        onClick={openDialog}
      >
        SOS
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-emerald-950/40 px-4 py-6 sm:px-6 sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-dialog-heading"
          onClick={closeDialog}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="max-h-[min(85vh,40rem)] overflow-y-auto p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2
                    id="sos-dialog-heading"
                    className="text-xl font-semibold text-emerald-900"
                >
                  Request urgent support
                </h2>
                <p className={bodySmallMutedTextClasses}>
                  Choose a mentor you are linked with and share why you need immediate help.
                </p>
              </div>
              <button
                type="button"
                className={`${secondaryButtonClasses} px-4 py-2 text-sm`}
                onClick={closeDialog}
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {loading && (
                <p className={bodySmallMutedTextClasses}>Loading mentors…</p>
              )}

              {!loading && !hasContacts && !error && (
                <p className={bodySmallMutedTextClasses}>
                  You are not linked with any mentors yet. Invite a mentor to enable SOS alerts.
                </p>
              )}

              {hasContacts && (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className={bodySmallStrongTextClasses} htmlFor="sos-mentor">
                      Contact
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

                  <div className="space-y-2">
                    <label className={bodySmallStrongTextClasses} htmlFor="sos-message">
                      What do they need to know?
                    </label>
                    <textarea
                      id="sos-message"
                      className={textareaClasses}
                      rows={4}
                      placeholder="Share context so they know how to help right away."
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      disabled={sending}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-rose-600">{error}</p>
                  )}

                  {success && (
                    <p className="text-sm text-emerald-600">{success}</p>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
                      onClick={closeDialog}
                      disabled={sending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`${dangerButtonClasses} px-5 py-2.5 text-sm`}
                      disabled={sending}
                    >
                      {sending ? "Sending…" : "Send SOS alert"}
                    </button>
                  </div>
                </form>
              )}

              {error && !hasContacts && (
                <p className="text-sm text-rose-600">{error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PanicButton;
