import {
  inputCompactClasses,
  mutedTextClasses,
  secondaryButtonClasses,
  subtleButtonClasses,
} from "../styles/ui";

function SelectOptionsEditor({
  field,
  draftValue,
  onDraftChange,
  onAddOption,
  onOptionChange,
  onOptionCommit,
  onOptionRemove,
}) {
  const labelId = `${field.uiId}-options-label`;
  const hintId = `${field.uiId}-options-hint`;
  const draftInputId = `${field.uiId}-option-draft`;

  return (
    <div className="space-y-3">
      <label
        id={labelId}
        htmlFor={draftInputId}
        className="block text-sm font-semibold text-emerald-900/80"
      >
        Choices
      </label>
      <p id={hintId} className={`${mutedTextClasses} text-xs`}>
        Add each choice individually below and use the button to place it in
        the list.
      </p>
      {field.options.length > 0 && (
        <ul className="space-y-2" aria-labelledby={labelId}>
          {field.options.map((option, optionIndex) => (
            <li
              key={`${field.uiId}-option-${optionIndex}`}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                className={`${inputCompactClasses} flex-1`}
                value={option}
                aria-label={`Choice ${optionIndex + 1}`}
                onChange={(event) =>
                  onOptionChange(optionIndex, event.target.value)
                }
                onBlur={() => onOptionCommit(optionIndex)}
              />
              <button
                type="button"
                className={`${subtleButtonClasses} px-3 py-1 text-xs`}
                onClick={() => onOptionRemove(optionIndex)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          id={draftInputId}
          className={`${inputCompactClasses} flex-1`}
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddOption();
            }
          }}
          placeholder="Add a choice"
          aria-describedby={hintId}
        />
        <button
          type="button"
          className={`${secondaryButtonClasses} px-4 py-2 text-sm`}
          onClick={onAddOption}
          disabled={!draftValue.trim()}
        >
          Add option
        </button>
      </div>
    </div>
  );
}

export default SelectOptionsEditor;
