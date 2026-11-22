// Writes MOCK data files to public/data so the UI can be built before the
// Python pipeline exists. Every value here is invented. Replace these files
// with the real ones from the pipeline; keep the same field names.
//
//   node scripts/make-mock-data.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');

// Small seeded random so the mock is the same every run.
let seed = 42;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const round = (x, p = 2) => Math.round(x * 10 ** p) / 10 ** p;

const PRODUCTS = [
  'MX Master wireless mouse',
  'M330 Silent mouse',
  'K380 Bluetooth keyboard',
  'C920 HD webcam',
  'G502 gaming mouse',
  'G430 gaming headset',
  'Z313 speakers',
  'Harmony remote',
];

const weeks = [];
const details = {};
let close = 14.6;
let market = 4990;
const first = new Date('2016-01-04T00:00:00Z'); // a Monday

for (let i = 0; i < 104; i++) {
  const start = addDays(first, i * 7);
  const end = addDays(start, 4);

  const prevClose = close;
  const prevMarket = market;
  close = Math.max(8, close * (1 + 0.0085 + (rand() - 0.5) * 0.07));
  market = market * (1 + 0.0035 + (rand() - 0.5) * 0.03);

  const sentiment = Math.max(-100, Math.min(100, 28 + 30 * Math.sin(i / 8 + 0.6) + 12 * Math.sin(i / 2.7) + (rand() - 0.5) * 18));
  const lowData = [0, 1, 26, 51, 52, 77, 102].includes(i);
  const reviews = lowData ? 4 + Math.floor(rand() * 10) : 380 + Math.floor(rand() * 260);
  const stars = Math.max(1, Math.min(5, 3.9 + sentiment / 140 + (rand() - 0.5) * 0.3));

  const id = iso(start);
  weeks.push({
    week: id,
    start: id,
    end: iso(end),
    close: round(close),
    pct_change: round(((close - prevClose) / prevClose) * 100),
    market_close: round(market),
    market_pct_change: round(((market - prevMarket) / prevMarket) * 100),
    sentiment: round(sentiment, 1),
    avg_stars: round(stars),
    review_count: reviews,
    low_data: lowData,
  });

  const picks = [...PRODUCTS].sort(() => rand() - 0.5).slice(0, 3);
  details[id] = {
    summary: `[Mock] Gemini summary for the week of ${id}. Replace with the pipeline output.`,
    products: picks.map((name) => ({
      name,
      reviews: lowData ? 1 + Math.floor(rand() * 3) : 30 + Math.floor(rand() * 90),
      sentiment: round(sentiment + (rand() - 0.5) * 40, 1),
    })),
    examples: picks.map((product, k) => ({
      product,
      date: iso(addDays(start, k)),
      stars: 1 + Math.floor(rand() * 5),
      text: '[Mock review text for layout testing.]',
    })),
  };
}

// Approximate quarterly earnings dates for the mock (Logitech reports late Jan/Apr/Jul/Oct).
const earnings = [
  '2016-01-26', '2016-04-26', '2016-07-26', '2016-10-25',
  '2017-01-24', '2017-04-25', '2017-07-25', '2017-10-24',
].map((date) => ({ date }));

writeFileSync(join(out, 'weeks.json'), JSON.stringify(weeks, null, 2));
writeFileSync(join(out, 'week_details.json'), JSON.stringify(details, null, 2));
writeFileSync(join(out, 'earnings.json'), JSON.stringify(earnings, null, 2));
console.log(`Wrote ${weeks.length} mock weeks to ${out}`);
