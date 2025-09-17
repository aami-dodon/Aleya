import { useEffect, useMemo, useState } from "react";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  emptyStateClasses,
  formLabelClasses,
  infoTextClasses,
  inputClasses,
  mediumHeadingClasses,
  primaryButtonClasses,
  selectClasses,
  textareaClasses,
} from "../styles/ui";

const DEFAULT_SHARING = "private";
const SHARING_OPTIONS = [
  { value: "private", label: "Keep private" },
  { value: "mood", label: "Share mood only" },
  { value: "summary", label: "Share summary" },
  { value: "full", label: "Share full entry" },
];

function JournalEntryForm({
  form,
  onSubmit,
  submitting,
  defaultSharing,
  statusMessage,
  statusVariant = "info",
}) {
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
    return <p className={emptyStateClasses}>Select a form to start journaling.</p>;
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
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <h3 className={`${mediumHeadingClasses} text-emerald-900`}>
          {form.title}
        </h3>
        {form.description && (
          <p className={infoTextClasses}>{form.description}</p>
        )}
      </div>
      {form.fields.map((field) => (
        <div className="space-y-2" key={field.id ?? field.label}>
          <label className={`block ${formLabelClasses}`}>
            <span>
              {field.label}
              {field.required && <span className="ml-1 text-rose-500">*</span>}
            </span>
            {renderField(field, values[field.id ?? field.label] || "", (value) =>
              handleChange(field, value)
            )}
          </label>
          {field.helperText && (
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/60`}>
              {field.helperText}
            </p>
          )}
        </div>
      ))}
      <div className="space-y-2">
        <label htmlFor="sharing" className={`block ${formLabelClasses}`}>
          Sharing preference
        </label>
        <select
          id="sharing"
          className={selectClasses}
          value={sharing}
          onChange={(event) => setSharing(event.target.value)}
        >
          {SHARING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className={`${bodySmallMutedTextClasses} text-emerald-900/60`}>
          Control what mentors can see when you submit entries.
        </p>
      </div>
      {error && (
        <p
          className={`rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 ${bodySmallStrongTextClasses} text-rose-600`}
        >
          {error}
        </p>
      )}
      {statusMessage && (
        <p
          className={`rounded-2xl px-4 py-3 ${bodySmallStrongTextClasses} ${
            statusVariant === "success"
              ? "border border-emerald-100 bg-emerald-50/80 text-emerald-700"
              : "border border-emerald-100 bg-white/80 text-emerald-900/70"
          }`}
        >
          {statusMessage}
        </p>
      )}
      <button
        type="submit"
        className={`${primaryButtonClasses} w-full`}
        disabled={!canSubmit || submitting}
      >
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
      return <textarea rows={4} className={textareaClasses} {...commonProps} />;
    case "select":
      return (
        <select className={selectClasses} {...commonProps}>
          <option value="">Select...</option>
          {(field.options || []).map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    case "number":
      return <input type="number" className={inputClasses} {...commonProps} />;
    default:
      return <input type="text" className={inputClasses} {...commonProps} />;
  }
}

export default JournalEntryForm;
