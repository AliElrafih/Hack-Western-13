import { createContext, useContext, useMemo, useState } from 'react';

/**
 * The delay setting is shared across the whole app (timeline, comparison,
 * prediction), so it lives in context rather than in one screen.
 * "Delay" = how many weeks the sentiment line is shifted ahead of the stock.
 */
export const DELAYS = [
  { key: '1W', weeks: 1, label: '1 week', short: '1 WEEK' },
  { key: '2W', weeks: 2, label: '2 weeks', short: '2 WEEKS' },
  { key: '1M', weeks: 4, label: '1 month', short: '1 MONTH' },
];

const DelayContext = createContext(null);

export function DelayProvider({ children }) {
  const [key, setKey] = useState('2W');
  const value = useMemo(() => {
    const d = DELAYS.find((x) => x.key === key);
    return { delay: d, setDelay: setKey };
  }, [key]);
  return <DelayContext.Provider value={value}>{children}</DelayContext.Provider>;
}

export function useDelay() {
  const ctx = useContext(DelayContext);
  if (!ctx) throw new Error('useDelay must be used inside <DelayProvider>');
  return ctx;
}
