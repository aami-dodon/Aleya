import { useMemo, useState } from "react";
import {
  chipBaseClasses,
  tagInputChipClasses,
  tagInputContainerClasses,
  tagInputEntryClasses,
  tagInputFieldClasses,
  tagInputGroupClasses,
  tagInputLabelClasses,
  tagInputRemoveButtonClasses,
  tagInputSuggestionClasses,
  tagInputSuggestionsContainerClasses,
} from "../styles/ui";
import { parseExpertise } from "../utils/expertise";

function normaliseSuggestion(item) {
  if (!item) {
    return "";
  }

  if (typeof item === "string") {
    return item;
  }

  if (typeof item === "object") {
    if (typeof item.label === "string") {
      return item.label;
    }
    if (typeof item.value === "string") {
      return item.value;
    }
  }

  return String(item);
}

function TagInput({
  value = [],
  onChange,
  placeholder = "Add a tag and press Enter",
  suggestions = [],
  allowCustom = true,
}) {
  const [inputValue, setInputValue] = useState("");

  const tags = useMemo(() => parseExpertise(value), [value]);

  const normalizedSuggestions = useMemo(() => {
    if (!Array.isArray(suggestions)) {
      return [];
    }

    return parseExpertise(suggestions.map((item) => normaliseSuggestion(item)));
  }, [suggestions]);

  const availableSuggestions = useMemo(() => {
    const tagSet = new Set(tags.map((tag) => tag.toLowerCase()));
    return normalizedSuggestions.filter(
      (item) => !tagSet.has(item.toLowerCase())
    );
  }, [normalizedSuggestions, tags]);

  const matchingSuggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return availableSuggestions
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 10);
  }, [availableSuggestions, inputValue]);

  const topSuggestions = useMemo(() => {
    const matches = new Set(matchingSuggestions.map((item) => item.toLowerCase()));
    const results = [];

    for (const suggestion of availableSuggestions) {
      const normalized = suggestion.toLowerCase();
      if (inputValue.trim() && matches.has(normalized)) {
        continue;
      }

      results.push(suggestion);

      if (results.length >= 10) {
        break;
      }
    }

    return results;
  }, [availableSuggestions, matchingSuggestions, inputValue]);

  const emitChange = (nextTags) => {
    if (typeof onChange === "function") {
      onChange(nextTags);
    }
  };

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) {
      return;
    }
    const normalized = trimmed.toLowerCase();
    const suggestionMatch = availableSuggestions.find(
      (item) => item.toLowerCase() === normalized
    );
    const finalTag = suggestionMatch || trimmed;
    const exists = tags.some((existing) => existing.toLowerCase() === normalized);
    if (exists) {
      setInputValue("");
      return;
    }
    emitChange([...tags, finalTag]);
    setInputValue("");
  };

  const removeTag = (tag) => {
    emitChange(tags.filter((item) => item !== tag));
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (allowCustom) {
        addTag(inputValue);
      }
    } else if (event.key === "Backspace" && !inputValue) {
      emitChange(tags.slice(0, -1));
    }
  };

  return (
    <div className={tagInputContainerClasses}>
      <div className={tagInputFieldClasses}>
        {tags.map((tag) => (
          <span key={tag} className={`${chipBaseClasses} ${tagInputChipClasses}`}>
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className={tagInputRemoveButtonClasses}
              aria-label={`Remove ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className={tagInputEntryClasses}
          placeholder={placeholder}
        />
      </div>
      {(matchingSuggestions.length > 0 || topSuggestions.length > 0) && (
        <div className={tagInputSuggestionsContainerClasses}>
          {matchingSuggestions.length > 0 && (
            <div className={tagInputGroupClasses}>
              <span className={tagInputLabelClasses}>
                Matching expertise:
              </span>
              {matchingSuggestions.map((suggestion) => (
                <button
                  key={`match-${suggestion}`}
                  type="button"
                  className={`${chipBaseClasses} ${tagInputSuggestionClasses}`}
                  onClick={() => addTag(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {topSuggestions.length > 0 && (
            <div className={tagInputGroupClasses}>
              <span className={tagInputLabelClasses}>
                Popular expertise:
              </span>
              {topSuggestions.map((suggestion) => (
                <button
                  key={`top-${suggestion}`}
                  type="button"
                  className={`${chipBaseClasses} ${tagInputSuggestionClasses}`}
                  onClick={() => addTag(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TagInput;
