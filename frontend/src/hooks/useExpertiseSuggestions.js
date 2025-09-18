import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import { parseExpertise } from "../utils/expertise";

function normalizeSuggestion(item) {
  if (!item) {
    return "";
  }

  if (typeof item === "string") {
    return item;
  }

  if (typeof item === "object") {
    if (typeof item.label === "string" && item.label.trim()) {
      return item.label;
    }
    if (typeof item.value === "string") {
      return item.value;
    }
  }

  return String(item);
}

export function useExpertiseSuggestions({ limit = 50 } = {}) {
  const [rawSuggestions, setRawSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestSuggestions = useCallback(async () => {
    const params = new URLSearchParams();
    if (limit) {
      params.set("limit", String(limit));
    }

    const query = params.toString();
    const path = query ? `/auth/expertise?${query}` : "/auth/expertise";
    const response = await apiClient.get(path);
    return Array.isArray(response?.expertise) ? response.expertise : [];
  }, [limit]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const expertise = await requestSuggestions();
      setRawSuggestions(expertise);
      return expertise;
    } catch (err) {
      setError(err);
      setRawSuggestions([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [requestSuggestions]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const expertise = await requestSuggestions();
        if (!isMounted) {
          return;
        }
        setRawSuggestions(expertise);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err);
        setRawSuggestions([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [requestSuggestions]);

  const suggestions = useMemo(() => {
    const normalized = rawSuggestions.map((item) => normalizeSuggestion(item));
    return parseExpertise(normalized);
  }, [rawSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refresh,
  };
}

export default useExpertiseSuggestions;
