import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

const FIELD_TYPES = [
  { value: "textarea", label: "Paragraph" },
  { value: "select", label: "Select" },
  { value: "text", label: "Short text" },
  { value: "number", label: "Number" },
];

function FormBuilderPage() {
  const { token, user } = useAuth();
  const [forms, setForms] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [formDraft, setFormDraft] = useState({
    title: "",
    description: "",
    fields: [createField()],
  });
  const [assignment, setAssignment] = useState({ menteeId: "", formId: "" });

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const formsRes = await apiClient.get("/forms", token);
      setForms(formsRes.forms || []);
      if (user.role === "mentor") {
        const menteesRes = await apiClient.get("/mentors/mentees", token);
        setMentees(menteesRes.mentees || []);
      }
      setMessage(null);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user.role]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFieldChange = (index, key, value) => {
    setFormDraft((prev) => {
      const updated = [...prev.fields];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, fields: updated };
    });
  };

  const addField = () => {
    setFormDraft((prev) => ({ ...prev, fields: [...prev.fields, createField()] }));
  };

  const removeField = (index) => {
    setFormDraft((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateForm = async (event) => {
    event.preventDefault();
    await apiClient.post("/forms", formDraft, token);
    setMessage("Form created successfully.");
    setFormDraft({ title: "", description: "", fields: [createField()] });
    load();
  };

  const assignForm = async (event) => {
    event.preventDefault();
    if (!assignment.menteeId || !assignment.formId) return;
    await apiClient.post(
      `/forms/${assignment.formId}/assign`,
      { journalerId: Number(assignment.menteeId) },
      token
    );
    setMessage("Form assigned to mentee.");
  };

  if (loading) {
    return <LoadingState label="Preparing forms" />;
  }

  return (
    <div className="dashboard-page">
      {message && <p className="info-text">{message}</p>}
      <SectionCard
        title="Create a reflective form"
        subtitle="Craft prompts that resonate with the people you support"
      >
        <form className="form-builder" onSubmit={handleCreateForm}>
          <label>
            Title
            <input
              type="text"
              value={formDraft.title}
              onChange={(event) =>
                setFormDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={formDraft.description}
              onChange={(event) =>
                setFormDraft((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </label>

          {formDraft.fields.map((field, index) => (
            <div className="builder-field" key={index}>
              <div className="builder-row">
                <label>
                  Label
                  <input
                    type="text"
                    value={field.label}
                    onChange={(event) =>
                      handleFieldChange(index, "label", event.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  Type
                  <select
                    value={field.fieldType}
                    onChange={(event) =>
                      handleFieldChange(index, "fieldType", event.target.value)
                    }
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) =>
                      handleFieldChange(index, "required", event.target.checked)
                    }
                  />
                  Required
                </label>
              </div>
              <label>
                Helper text
                <input
                  type="text"
                  value={field.helperText}
                  onChange={(event) =>
                    handleFieldChange(index, "helperText", event.target.value)
                  }
                />
              </label>
              {field.fieldType === "select" && (
                <label>
                  Options (comma separated)
                  <input
                    type="text"
                    value={field.options.join(", ")}
                    onChange={(event) =>
                      handleFieldChange(index, "options", event.target.value.split(",").map((opt) => opt.trim()).filter(Boolean))
                    }
                  />
                </label>
              )}
              {formDraft.fields.length > 1 && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => removeField(index)}
                >
                  Remove field
                </button>
              )}
            </div>
          ))}
          <div className="builder-actions">
            <button type="button" className="ghost-button" onClick={addField}>
              Add another field
            </button>
            <button type="submit" className="primary-button">
              Save form
            </button>
          </div>
        </form>
      </SectionCard>

      {user.role === "mentor" && (
        <SectionCard
          title="Assign a form"
          subtitle="Give your mentees tailored prompts after the link is confirmed"
        >
          <form className="inline-form" onSubmit={assignForm}>
            <select
              value={assignment.menteeId}
              onChange={(event) =>
                setAssignment((prev) => ({ ...prev, menteeId: event.target.value }))
              }
              required
            >
              <option value="">Choose mentee</option>
              {mentees.map((mentee) => (
                <option key={mentee.id} value={mentee.id}>
                  {mentee.name}
                </option>
              ))}
            </select>
            <select
              value={assignment.formId}
              onChange={(event) =>
                setAssignment((prev) => ({ ...prev, formId: event.target.value }))
              }
              required
            >
              <option value="">Choose form</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title}
                </option>
              ))}
            </select>
            <button type="submit" className="primary-button">
              Assign
            </button>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Available forms" subtitle="See what journalers can access">
        {forms.length ? (
          <ul className="history-list">
            {forms.map((form) => (
              <li key={form.id}>
                <div>
                  <strong>{form.title}</strong>
                  <p>{form.description}</p>
                </div>
                <span className="chip chip-small">{form.visibility}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No forms available yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

function createField() {
  return {
    label: "",
    fieldType: "textarea",
    required: false,
    helperText: "",
    options: [],
  };
}

export default FormBuilderPage;
