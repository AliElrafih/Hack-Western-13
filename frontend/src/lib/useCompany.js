import { useJson } from './useJson.js';

/** Look up one company from companies.json, shaped for the Header. */
export function useCompany(ticker) {
  const { data, loading, error, retry } = useJson('companies.json');
  const c = data?.find((x) => x.ticker === ticker) ?? null;
  const company = c ? { name: c.name, ticker: c.ticker, range: c.range?.label ?? '' } : null;
  return { company, raw: c, loading, error, retry };
}
