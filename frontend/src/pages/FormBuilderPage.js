import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  checkboxClasses,
  chipBaseClasses,
  emptyStateClasses,
  infoTextClasses,
  inputClasses,
  inputCompactClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  selectCompactClasses,
  textareaClasses,
} from "../styles/ui";

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
    <div className="flex w-full flex-1 flex-col gap-8">
      {message && <p className={infoTextClasses}>{message}</p>}
      <SectionCard
        title="Create a reflective form"
        subtitle="Craft prompts that resonate with the people you support"
      >
        <form className="space-y-6" onSubmit={handleCreateForm}>
          <label className="block text-sm font-semibold text-emerald-900/80">
            Title
            <input
              type="text"
              className={inputClasses}
              value={formDraft.title}
              onChange={(event) =>
                setFormDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              required
            />
          </label>
          <label className="block text-sm font-semibold text-emerald-900/80">
            Description
            <textarea
              className={textareaClasses}
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
            <div
              className="space-y-4 rounded-2xl border border-dashed border-emerald-200 bg-white/60 p-5"
              key={index}
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
                <label className="block text-sm font-semibold text-emerald-900/80">
                  Label
                  <input
                    type="text"
                    className={inputCompactClasses}
                    value={field.label}
                    onChange={(event) =>
                      handleFieldChange(index, "label", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-emerald-900/80">
                  Type
                  <select
                    className={selectCompactClasses}
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
                <label className="flex items-center gap-2 text-sm font-semibold text-emerald-900/80">
                  <input
                    type="checkbox"
                    className={checkboxClasses}
                    checked={field.required}
                    onChange={(event) =>
                      handleFieldChange(index, "required", event.target.checked)
                    }
                  />
                  Required
                </label>
              </div>
              <label className="block text-sm font-semibold text-emerald-900/80">
                Helper text
                <input
                  type="text"
                  className={inputCompactClasses}
                  value={field.helperText}
                  onChange={(event) =>
                    handleFieldChange(index, "helperText", event.target.value)
                  }
                />
              </label>
              {field.fieldType === "select" && (
                <label className="block text-sm font-semibold text-emerald-900/80">
                  Options (comma separated)
                  <input
                    type="text"
                    className={inputCompactClasses}
                    value={field.options.join(", ")}
                    onChange={(event) =>
                      handleFieldChange(
                        index,
                        "options",
                        event.target
                          .value.split(",")
                          .map((opt) => opt.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </label>
              )}
              {formDraft.fields.length > 1 && (
                <button
                  type="button"
                  className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
                  onClick={() => removeField(index)}
                >
                  Remove field
                </button>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
              onClick={addField}
            >
              Add another field
            </button>
            <button type="submit" className={`${primaryButtonClasses} w-full md:w-auto`}>
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
          <form
            className="flex flex-wrap items-center gap-3"
            onSubmit={assignForm}
          >
            <select
              className={`${selectCompactClasses} w-full sm:w-56`}
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
              className={`${selectCompactClasses} w-full sm:w-56`}
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
            <button
              type="submit"
              className={`${primaryButtonClasses} px-5 py-2.5 text-sm`}
            >
              Assign
            </button>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Available forms" subtitle="See what journalers can access">
        {forms.length ? (
          <ul className="grid gap-4">
            {forms.map((form) => (
              <li
                key={form.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-5"
              >
                <div className="space-y-2">
                  <p className="text-base font-semibold text-emerald-900">
                    {form.title}
                  </p>
                  {form.description && (
                    <p className="text-sm text-emerald-900/70">{form.description}</p>
                  )}
                </div>
                <span className={chipBaseClasses}>{form.visibility}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={emptyStateClasses}>No forms available yet.</p>
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
