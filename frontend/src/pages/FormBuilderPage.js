import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import SelectOptionsEditor from "../components/SelectOptionsEditor";
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

let nextFieldId = 0;

const FIELD_TYPES = [
  { value: "textarea", label: "Paragraph" },
  { value: "select", label: "Select" },
  { value: "text", label: "Short text" },
  { value: "number", label: "Number" },
];

function FormBuilderPage() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsString = searchParams.toString();
  const [forms, setForms] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [formDraft, setFormDraft] = useState(() => createEmptyDraft());
  const [optionDrafts, setOptionDrafts] = useState({});
  const [assignment, setAssignment] = useState({ menteeId: "", formId: "" });
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");
  const [visibilityFilter, setVisibilityFilter] = useState(() => {
    const param = searchParams.get("visibility") || "all";
    const allowed = new Set(["all", "default", "mentor", "admin"]);
    return allowed.has(param) ? param : "all";
  });
  const [creatorFilter, setCreatorFilter] = useState(
    () => searchParams.get("creator") || "all"
  );
  const [creatorIdFilter, setCreatorIdFilter] = useState(
    () => searchParams.get("creatorId") || ""
  );
  const isAdmin = user.role === "admin";
  const isMentor = user.role === "mentor";
  const [editingFormId, setEditingFormId] = useState(null);
  const adminTableGridTemplate =
    "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.5fr) auto";
  const isEditing = editingFormId !== null;

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

  const editingForm = useMemo(() => {
    if (!editingFormId) {
      return null;
    }

    return forms.find((form) => form.id === editingFormId) || null;
  }, [editingFormId, forms]);

  const resetFormDraft = useCallback(() => {
    setFormDraft(createEmptyDraft());
    setOptionDrafts({});
    setEditingFormId(null);
  }, [setFormDraft, setOptionDrafts, setEditingFormId]);

  const beginEditingForm = useCallback(
    (form) => {
      const nextFields = Array.isArray(form.fields) && form.fields.length
        ? form.fields.map((field) => {
            const options = parseFieldOptions(field.options);

            return {
              uiId: `field-${nextFieldId++}`,
              label: field.label || "",
              fieldType: field.fieldType || "textarea",
              required: Boolean(field.required),
              helperText: field.helperText || "",
              options,
            };
          })
        : [createField()];

      setFormDraft({
        title: form.title || "",
        description: form.description || "",
        fields: nextFields,
      });
      setOptionDrafts({});
      setEditingFormId(form.id);
      setMessage(`Editing "${form.title}".`);
    },
    [setFormDraft, setOptionDrafts, setEditingFormId, setMessage]
  );

  const handleCancelEdit = useCallback(() => {
    resetFormDraft();
    setMessage(null);
  }, [resetFormDraft, setMessage]);

  useEffect(() => {
    const nextSearch = searchParams.get("q") || "";
    if (nextSearch !== searchTerm) {
      setSearchTerm(nextSearch);
    }

    const nextVisibility = searchParams.get("visibility") || "all";
    const allowedVisibility = new Set(["all", "default", "mentor", "admin"]);
    const normalizedVisibility = allowedVisibility.has(nextVisibility)
      ? nextVisibility
      : "all";
    if (normalizedVisibility !== visibilityFilter) {
      setVisibilityFilter(normalizedVisibility);
    }

    const nextCreator = searchParams.get("creator") || "all";
    if (nextCreator !== creatorFilter) {
      setCreatorFilter(nextCreator);
    }

    const nextCreatorId = searchParams.get("creatorId") || "";
    if (nextCreatorId !== creatorIdFilter) {
      setCreatorIdFilter(nextCreatorId);
    }
  }, [
    creatorFilter,
    creatorIdFilter,
    paramsString,
    searchParams,
    searchTerm,
    visibilityFilter,
  ]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const nextParams = new URLSearchParams();

    if (normalizedSearch) {
      nextParams.set("q", normalizedSearch);
    }

    if (visibilityFilter !== "all") {
      nextParams.set("visibility", visibilityFilter);
    }

    if (creatorIdFilter) {
      nextParams.set("creatorId", creatorIdFilter);
      if (creatorFilter && creatorFilter !== "all") {
        nextParams.set("creator", creatorFilter);
      }
    } else if (creatorFilter !== "all") {
      nextParams.set("creator", creatorFilter);
    }

    const nextString = nextParams.toString();
    if (nextString !== paramsString) {
      setSearchParams(nextParams);
    }
  }, [
    creatorFilter,
    creatorIdFilter,
    paramsString,
    searchTerm,
    setSearchParams,
    visibilityFilter,
  ]);

  useEffect(() => {
    if (!creatorIdFilter) {
      return;
    }

    if (!forms.length) {
      return;
    }

    const match = forms.find(
      (form) => String(form.created_by) === creatorIdFilter
    );

    if (match) {
      const label = match.creatorName || "Unknown creator";
      if (label !== creatorFilter) {
        setCreatorFilter(label);
      }
    } else if (creatorFilter !== "Unknown creator") {
      setCreatorFilter("Unknown creator");
    }
  }, [creatorFilter, creatorIdFilter, forms]);

  const creatorOptions = useMemo(() => {
    const names = new Set();

    forms.forEach((form) => {
      if (form.creatorName) {
        names.add(form.creatorName);
      } else {
        names.add("Unknown creator");
      }
    });

    if (creatorFilter !== "all" && creatorFilter) {
      names.add(creatorFilter);
    }

    return Array.from(names)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [creatorFilter, forms]);

  const filteredForms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return forms.filter((form) => {
      if (visibilityFilter !== "all" && form.visibility !== visibilityFilter) {
        return false;
      }

      if (creatorIdFilter) {
        if (String(form.created_by) !== creatorIdFilter) {
          return false;
        }
      } else if (creatorFilter !== "all") {
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
  }, [forms, searchTerm, visibilityFilter, creatorFilter, creatorIdFilter]);

  const filtersApplied =
    searchTerm.trim().length > 0 ||
    visibilityFilter !== "all" ||
    creatorFilter !== "all" ||
    Boolean(creatorIdFilter);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setVisibilityFilter("all");
    setCreatorFilter("all");
    setCreatorIdFilter("");
  }, []);

  const handleDeleteForm = useCallback(
    async (form) => {
      if (!token) return;

      const endpoint =
        user.role === "admin" ? `/admin/forms/${form.id}` : `/forms/${form.id}`;

      try {
        await apiClient.del(endpoint, token);
        if (editingFormId === form.id) {
          resetFormDraft();
        }
        await load();
        setMessage("Form deleted successfully.");
      } catch (err) {
        setMessage(err.message);
      }
    },
    [editingFormId, load, resetFormDraft, token, user.role]
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

  useEffect(() => {
    setOptionDrafts((prev) => {
      const next = {};
      let changed = false;

      formDraft.fields.forEach((field) => {
        if (!(field.uiId in prev)) {
          changed = true;
        }
        next[field.uiId] = prev[field.uiId] || "";
      });

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [formDraft.fields]);

  const handleFieldChange = (index, key, value) => {
    setFormDraft((prev) => {
      const updated = [...prev.fields];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, fields: updated };
    });
  };

  const setOptionDraftValue = (fieldId, value) => {
    setOptionDrafts((prev) => ({ ...prev, [fieldId]: value }));
  };

  const addSelectOption = (index) => {
    const field = formDraft.fields[index];
    const pendingValue = (optionDrafts[field.uiId] || "").trim();

    if (!pendingValue) {
      return;
    }

    const nextOptions = normalizeOptionList([...field.options, pendingValue]);
    handleFieldChange(index, "options", nextOptions);
    setOptionDraftValue(field.uiId, "");
  };

  const updateSelectOption = (fieldIndex, optionIndex, value) => {
    const field = formDraft.fields[fieldIndex];
    const nextOptions = [...field.options];
    nextOptions[optionIndex] = value;
    handleFieldChange(fieldIndex, "options", nextOptions);
  };

  const commitSelectOption = (fieldIndex, optionIndex) => {
    const field = formDraft.fields[fieldIndex];
    const nextOptions = normalizeOptionList(field.options);

    if (nextOptions.length !== field.options.length) {
      handleFieldChange(fieldIndex, "options", nextOptions);
    } else if (nextOptions[optionIndex] !== field.options[optionIndex]) {
      handleFieldChange(fieldIndex, "options", nextOptions);
    }
  };

  const removeSelectOption = (fieldIndex, optionIndex) => {
    const field = formDraft.fields[fieldIndex];
    const nextOptions = field.options.filter((_, idx) => idx !== optionIndex);
    handleFieldChange(fieldIndex, "options", nextOptions);
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

  const handleSubmitForm = async (event) => {
    event.preventDefault();
    if (!token) return;

    const payload = {
      title: formDraft.title,
      description: formDraft.description,
      fields: formDraft.fields.map((field) => ({
        label: field.label,
        fieldType: field.fieldType,
        required: field.required,
        helperText: field.helperText,
        options:
          field.fieldType === "select"
            ? normalizeOptionList(field.options)
            : [],
      })),
    };

    const successMessage = isEditing
      ? "Form updated successfully."
      : "Form created successfully.";

    try {
      if (isEditing && editingFormId) {
        await apiClient.put(`/forms/${editingFormId}`, payload, token);
      } else {
        await apiClient.post("/forms", payload, token);
      }

      resetFormDraft();
      await load();
      setMessage(successMessage);
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

  const builderTitle = isEditing
    ? "Update a reflective form"
    : "Create a reflective form";
  const builderSubtitle = isEditing
    ? `Refresh the prompts${
        editingForm ? ` for "${editingForm.title}"` : ""
      } so your mentees continue to bloom.`
    : "Craft prompts that resonate with the people you support";
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
        <SectionCard title={builderTitle} subtitle={builderSubtitle}>
          <form className="space-y-6" onSubmit={handleSubmitForm}>
            {isEditing && (
              <div className="space-y-2 rounded-2xl border border-dashed border-emerald-200 bg-white/60 p-5">
                <p className="text-sm font-semibold text-emerald-900">
                  Updating "{editingForm?.title || "your form"}"
                </p>
                <p className={`${mutedTextClasses} text-sm`}>
                  Changes bloom immediately for every journaler linked to this
                  form.
                </p>
              </div>
            )}
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
                  <SelectOptionsEditor
                    field={field}
                    draftValue={optionDrafts[field.uiId] || ""}
                    onDraftChange={(value) =>
                      setOptionDraftValue(field.uiId, value)
                    }
                    onAddOption={() => addSelectOption(index)}
                    onOptionChange={(optionIndex, value) =>
                      updateSelectOption(index, optionIndex, value)
                    }
                    onOptionCommit={(optionIndex) =>
                      commitSelectOption(index, optionIndex)
                    }
                    onOptionRemove={(optionIndex) =>
                      removeSelectOption(index, optionIndex)
                    }
                  />
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
              <div className="flex w-full flex-col gap-3 md:ml-auto md:w-auto md:flex-row">
                {isEditing && (
                  <button
                    type="button"
                    className={`${subtleButtonClasses} w-full px-5 py-2.5 text-sm md:w-auto`}
                    onClick={handleCancelEdit}
                  >
                    Cancel editing
                  </button>
                )}
                <button
                  type="submit"
                  className={`${primaryButtonClasses} w-full md:w-auto`}
                >
                  {isEditing ? "Update form" : "Save form"}
                </button>
              </div>
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
              onChange={(event) => {
                setCreatorIdFilter("");
                setCreatorFilter(event.target.value);
              }}
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
              className={`${tableHeaderClasses} md:px-4`}
              style={{ "--table-grid": adminTableGridTemplate }}
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
              const canMentorManage =
                isMentor && Number(form.created_by) === Number(user.id);
              const canManageOwnForm = canMentorManage && !form.is_default;

              return (
                <div
                  key={form.id}
                  className={tableRowClasses}
                  style={{ "--table-grid": adminTableGridTemplate }}
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
                          onClick={() => handleDeleteForm(form)}
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
                    {canMentorManage && (
                      <>
                        <button
                          type="button"
                          className={`${secondaryButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                          onClick={() => beginEditingForm(form)}
                          disabled={!canManageOwnForm}
                        >
                          Edit form
                        </button>
                        <button
                          type="button"
                          className={`${dangerButtonClasses} w-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 md:w-auto`}
                          onClick={() => handleDeleteForm(form)}
                          disabled={!canManageOwnForm}
                        >
                          Delete form
                        </button>
                        {!canManageOwnForm && (
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

function normalizeOptionList(options) {
  return options
    .map((option) => {
      if (typeof option === "string") {
        return option.trim();
      }

      if (option && typeof option === "object") {
        const value = option.value ?? option.label ?? "";
        if (typeof value === "string") {
          return value.trim();
        }
        return String(value ?? "").trim();
      }

      return String(option ?? "").trim();
    })
    .filter(Boolean);
}

function parseFieldOptions(value) {
  if (Array.isArray(value)) {
    return normalizeOptionList(value);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeOptionList(parsed);
      }
    } catch (error) {
      const segments = value.split(/[\n,]/);
      return normalizeOptionList(segments);
    }
  }

  return [];
}

function createField() {
  return {
    uiId: `field-${nextFieldId++}`,
    label: "",
    fieldType: "textarea",
    required: false,
    helperText: "",
    options: [],
  };
}

function createEmptyDraft() {
  return {
    title: "",
    description: "",
    fields: [createField()],
  };
}

export default FormBuilderPage;
