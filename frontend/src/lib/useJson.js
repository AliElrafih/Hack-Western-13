import { useCallback, useEffect, useState } from 'react';

/**
 * Load a static JSON file from /public/data.
 * Returns { data, error, loading, retry } so every screen can show
 * a skeleton while loading and an error state with a retry button.
 */
export function useJson(file) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, error: null, loading: true });

    fetch(`${import.meta.env.BASE_URL}data/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, error, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [file, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
