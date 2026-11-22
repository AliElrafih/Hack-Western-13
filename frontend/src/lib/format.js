const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2016-03-07" -> Date in UTC, so dates never shift with the viewer's time zone. */
export const parseDay = (s) => new Date(`${s}T00:00:00Z`);

/** "2016-03-07" -> "Mar 7, 2016" */
export function fmtDay(s, { year = true } = {}) {
  const d = parseDay(s);
  const base = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return year ? `${base}, ${d.getUTCFullYear()}` : base;
}

/** Week range: "Mar 6 – Mar 10, 2017" */
export const fmtRange = (start, end) => `${fmtDay(start, { year: false })} – ${fmtDay(end)}`;

/** "2016-04-04" -> "Apr 16" for axis ticks */
export function fmtTick(s) {
  const d = parseDay(s);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

/** Signed number: "+12.3", "−4.0" (true minus sign) */
export function signed(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—';
  const s = Math.abs(n).toFixed(digits);
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s;
}

export const pct = (n, digits = 1) => (n == null ? '—' : `${signed(n, digits)}%`);
export const money = (n) => (n == null ? '—' : `$${n.toFixed(2)}`);
