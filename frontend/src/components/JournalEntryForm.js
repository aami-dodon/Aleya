import { useEffect, useMemo, useState } from "react";
import {
  emptyStateClasses,
  formLabelClasses,
  infoTextClasses,
  inputClasses,
  mediumHeadingClasses,
  primaryButtonClasses,
  subtleButtonClasses,
  selectClasses,
  textareaClasses,
  formStackClasses,
  formSectionClasses,
  formHelperClasses,
  formRequiredClasses,
  formStatusClasses,
  formStatusErrorClasses,
  formStatusInfoClasses,
  formStatusSuccessClasses,
  formActionsClasses,
  buttonResponsiveClasses,
  stackSmClasses,
} from "../styles/ui";

const DEFAULT_SHARING = "private";
const SHARING_OPTIONS = [
  { value: "private", label: "Keep in my private sanctuary" },
  { value: "mood", label: "Share mood only" },
  { value: "summary", label: "Share summary" },
  { value: "full", label: "Share the full reflection" },
];

function JournalEntryForm({
  form,
  onSubmit,
  submitting,
  defaultSharing,
  initialSharing,
  initialValues = null,
  statusMessage,
  statusVariant = "info",
  submitLabel = "Save entry",
  onCancel,
}) {
  const [sharing, setSharing] = useState(
    initialSharing || defaultSharing || DEFAULT_SHARING
  );
  const [values, setValues] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    setSharing(initialSharing || defaultSharing || DEFAULT_SHARING);
  }, [defaultSharing, initialSharing]);

  useEffect(() => {
    if (form) {
      const initial = {};
      const seededValues = initialValues || {};
      form.fields.forEach((field) => {
        const key = field.id ?? field.label;
        const rawValue =
          seededValues[key] ??
          seededValues[field.id] ??
          seededValues[field.label];
        initial[key] = rawValue ?? "";
      });
      setValues(initial);
    }
  }, [form, initialValues]);

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
    return <p className={emptyStateClasses}>Select a form to begin today’s reflection.</p>;
  }

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field.id ?? field.label]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please complete each required prompt.");
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
    <form className={formStackClasses} onSubmit={handleSubmit}>
      <div className={stackSmClasses}>
        <h3 className={`${mediumHeadingClasses} text-emerald-900`}>
          {form.title}
        </h3>
        {form.description && (
          <p className={infoTextClasses}>{form.description}</p>
        )}
      </div>
      {form.fields.map((field) => (
        <div className={formSectionClasses} key={field.id ?? field.label}>
          <label className={formLabelClasses}>
            <span>
              {field.label}
              {field.required && <span className={formRequiredClasses}>*</span>}
            </span>
            {renderField(field, values[field.id ?? field.label] || "", (value) =>
              handleChange(field, value)
            )}
          </label>
          {field.helperText && (
            <p className={formHelperClasses}>
              {field.helperText}
            </p>
          )}
        </div>
      ))}
      <div className={formSectionClasses}>
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
        <p className={formHelperClasses}>
          Decide how much of this entry your mentors can see.
        </p>
      </div>
      {error && (
        <p
          className={`${formStatusClasses} ${formStatusErrorClasses}`}
        >
          {error}
        </p>
      )}
      {statusMessage && (
        <p
          className={`${formStatusClasses} ${
            statusVariant === "success"
              ? formStatusSuccessClasses
              : formStatusInfoClasses
          }`}
        >
          {statusMessage}
        </p>
      )}
      <div className={formActionsClasses}>
        <button
          type="submit"
          className={`${primaryButtonClasses} ${buttonResponsiveClasses}`}
          disabled={!canSubmit || submitting}
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className={`${subtleButtonClasses} ${buttonResponsiveClasses}`}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
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
