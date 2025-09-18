import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  checkboxClasses,
  dangerButtonClasses,
  emptyStateClasses,
  infoTextClasses,
  inputClasses,
  inputCompactClasses,
  mutedTextClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  selectCompactClasses,
  subtleButtonClasses,
  textareaClasses,
  chipBaseClasses,
  tableHeaderClasses,
  tableRowClasses,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const isAdmin = user.role === "admin";
  const isMentor = user.role === "mentor";

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

  const creatorOptions = useMemo(() => {
    const names = new Set();

    forms.forEach((form) => {
      if (form.creatorName) {
        names.add(form.creatorName);
      }
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [forms]);

  const filteredForms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return forms.filter((form) => {
      if (visibilityFilter !== "all" && form.visibility !== visibilityFilter) {
        return false;
      }

      if (creatorFilter !== "all") {
        const creatorName = form.creatorName || "";
        if (!creatorName || creatorName !== creatorFilter) {
          return false;
        }
      }

      if (normalizedSearch) {
        const searchSpace = [form.title, form.description];

        if (Array.isArray(form.mentees)) {
          form.mentees.forEach((mentee) => {
            if (mentee?.name) {
              searchSpace.push(mentee.name);
            }
          });
        }

        const haystack = searchSpace
          .filter((value) => Boolean(value && value.length))
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [forms, searchTerm, visibilityFilter, creatorFilter]);

  const filtersApplied =
    searchTerm.trim().length > 0 ||
    visibilityFilter !== "all" ||
    creatorFilter !== "all";

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setVisibilityFilter("all");
    setCreatorFilter("all");
  }, []);

  const handleDeleteForm = useCallback(
    async (formId) => {
      if (!token) return;

      try {
        await apiClient.del(`/admin/forms/${formId}`, token);
        await load();
        setMessage("Form deleted successfully.");
      } catch (err) {
        setMessage(err.message);
      }
    },
    [load, token]
  );

  const handleRemoveAssignment = useCallback(
    async (formId, menteeId) => {
      if (!token) return;

      try {
        await apiClient.del(`/forms/${formId}/assign/${menteeId}`, token);
        await load();
        setMessage("Mentee unassigned from form.");
      } catch (err) {
        setMessage(err.message);
      }
    },
    [load, token]
  );

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
    try {
      await apiClient.post("/forms", formDraft, token);
      setFormDraft({ title: "", description: "", fields: [createField()] });
      await load();
      setMessage("Form created successfully.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const assignForm = async (event) => {
    event.preventDefault();
    if (!assignment.menteeId || !assignment.formId) return;
    try {
      await apiClient.post(
        `/forms/${assignment.formId}/assign`,
        { journalerId: Number(assignment.menteeId) },
        token
      );
      await load();
      setAssignment({ menteeId: "", formId: "" });
      setMessage("Form assigned to mentee.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const sectionCardTitle = isAdmin ? "Form Management" : "Available forms";
  const sectionCardSubtitle = isAdmin
    ? "Steward templates, visibilities, and journaler links"
    : "See what journalers can access";

  if (loading) {
    return <LoadingState label="Preparing forms" />;
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      {message && <p className={infoTextClasses}>{message}</p>}
      {!isAdmin && (
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
      )}

      {isMentor && (
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

      <SectionCard title={sectionCardTitle} subtitle={sectionCardSubtitle}>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <label className="sr-only" htmlFor="form-search">
              Search forms or journalers
            </label>
            <input
              id="form-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search forms or journalers"
              className={`${inputCompactClasses} w-full sm:w-64`}
            />
            <label className="sr-only" htmlFor="form-visibility-filter">
              Filter forms by visibility
            </label>
            <select
              id="form-visibility-filter"
              className={`${selectCompactClasses} w-full sm:w-44`}
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value)}
            >
              <option value="all">All visibility</option>
              <option value="default">Default</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
            <label className="sr-only" htmlFor="form-creator-filter">
              Filter forms by creator
            </label>
            <select
              id="form-creator-filter"
              className={`${selectCompactClasses} w-full sm:w-44`}
              value={creatorFilter}
              onChange={(event) => setCreatorFilter(event.target.value)}
            >
              <option value="all">All creators</option>
              {creatorOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${subtleButtonClasses} px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={handleClearFilters}
              disabled={!filtersApplied}
            >
              Clear filters
            </button>
          </div>
        )}

        {filteredForms.length ? (
          <div className="space-y-3">
            <div
              className={`${tableHeaderClasses} md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] md:px-4`}
            >
              <span>Title</span>
              <span>Visibility</span>
              <span>Assignments</span>
              <span className="md:text-right">Actions</span>
            </div>
            {filteredForms.map((form) => {
              const mentees = Array.isArray(form.mentees)
                ? form.mentees.filter((mentee) => mentee && mentee.id)
                : [];

              return (
                <div
                  key={form.id}
                  className={`${tableRowClasses} md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto]`}
                >
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-emerald-900">
                      {form.title}
                    </p>
                    {form.description && (
                      <p className="text-sm text-emerald-900/70">{form.description}</p>
                    )}
                    {isAdmin && (
                      <p className={`${mutedTextClasses} text-sm`}>
                        Created by {form.creatorName || "Unknown creator"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:block">
                    <span className={chipBaseClasses}>{form.visibility}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-900 md:hidden">
                      Assigned mentees
                    </p>
                    {mentees.length ? (
                      <ul className="flex flex-wrap gap-2">
                        {mentees.map((mentee) => (
                          <li key={mentee.id} className="flex items-center gap-2">
                            <span className={chipBaseClasses}>{mentee.name}</span>
                            <button
                              type="button"
                              className={`${subtleButtonClasses} px-3 py-1 text-xs`}
                              onClick={() => handleRemoveAssignment(form.id, mentee.id)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`${mutedTextClasses} text-sm`}>
                        No mentees linked yet.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          className={`${dangerButtonClasses} w-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 md:w-auto`}
                          disabled={form.is_default}
                          onClick={() => handleDeleteForm(form.id)}
                        >
                          Delete form
                        </button>
                        {form.is_default && (
                          <p className={`${mutedTextClasses} text-xs md:text-right`}>
                            Default forms cannot be removed.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
