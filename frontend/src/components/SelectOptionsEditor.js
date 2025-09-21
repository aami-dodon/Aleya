import {
  inputCompactClasses,
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
  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-emerald-900/80">
        Options
      </span>
      {field.options.length > 0 && (
        <ul className="space-y-2">
          {field.options.map((option, optionIndex) => (
            <li
              key={`${field.uiId}-option-${optionIndex}`}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                className={`${inputCompactClasses} flex-1`}
                value={option}
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
