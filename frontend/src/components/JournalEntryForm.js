import { useEffect, useMemo, useState } from "react";

const DEFAULT_SHARING = "private";
const SHARING_OPTIONS = [
  { value: "private", label: "Keep private" },
  { value: "mood", label: "Share mood only" },
  { value: "summary", label: "Share summary" },
  { value: "full", label: "Share full entry" },
];

function JournalEntryForm({ form, onSubmit, submitting, defaultSharing }) {
  const [sharing, setSharing] = useState(defaultSharing || DEFAULT_SHARING);
  const [values, setValues] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    setSharing(defaultSharing || DEFAULT_SHARING);
  }, [defaultSharing]);

  useEffect(() => {
    if (form) {
      const initial = {};
      form.fields.forEach((field) => {
        const key = field.id ?? field.label;
        initial[key] = "";
      });
      setValues(initial);
    }
  }, [form]);

  const canSubmit = useMemo(() => {
    if (!form) return false;
    return form.fields.every((field) => {
      if (!field.required) return true;
      const key = field.id ?? field.label;
      const value = values[key];
      return value !== null && value !== undefined && String(value).trim() !== "";
    });
  }, [form, values]);

  if (!form) {
    return <p className="empty-state">Select a form to start journaling.</p>;
  }

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field.id ?? field.label]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please complete all required fields.");
      return;
    }

    setError(null);
    const responses = {};
    form.fields.forEach((field) => {
      const key = field.id ?? field.label;
      responses[key] = values[key];
    });

    onSubmit({
      formId: form.id,
      responses,
      sharedLevel: sharing,
    });
  };

  return (
    <form className="journal-form" onSubmit={handleSubmit}>
      <h3>{form.title}</h3>
      {form.description && <p className="form-description">{form.description}</p>}
      {form.fields.map((field) => (
        <div className="form-field" key={field.id ?? field.label}>
          <label>
            <span>
              {field.label}
              {field.required && <span className="required">*</span>}
            </span>
            {renderField(field, values[field.id ?? field.label] || "", (value) =>
              handleChange(field, value)
            )}
          </label>
          {field.helperText && (
            <small className="helper-text">{field.helperText}</small>
          )}
        </div>
      ))}
      <div className="form-field">
        <label htmlFor="sharing">Sharing preference</label>
        <select
          id="sharing"
          value={sharing}
          onChange={(event) => setSharing(event.target.value)}
        >
          {SHARING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <small className="helper-text">
          Control what mentors can see when you submit entries.
        </small>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="primary-button" disabled={!canSubmit || submitting}>
        {submitting ? "Saving..." : "Save entry"}
      </button>
    </form>
  );
}

function renderField(field, value, onChange) {
  const commonProps = {
    value,
    onChange: (event) => onChange(event.target.value),
    required: field.required,
  };

  switch (field.fieldType) {
    case "textarea":
      return <textarea rows={4} {...commonProps} />;
    case "select":
      return (
        <select {...commonProps}>
          <option value="">Select...</option>
          {(field.options || []).map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    case "number":
      return <input type="number" {...commonProps} />;
    default:
      return <input type="text" {...commonProps} />;
  }
}

export default JournalEntryForm;
