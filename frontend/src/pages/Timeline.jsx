import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import TimelineChart from '../components/timeline/TimelineChart.jsx';
import WeekPanel from '../components/timeline/WeekPanel.jsx';
import { useJson } from '../lib/useJson.js';
import { useCompany } from '../lib/useCompany.js';
import { DELAYS, useDelay } from '../lib/delay.jsx';
import { parseDay } from '../lib/format.js';
import styles from './Timeline.module.css';

export default function Timeline() {
  const { ticker } = useParams();
  const { company } = useCompany(ticker);
  const { delay, setDelay } = useDelay();

  const weeksReq = useJson('weeks.json');
  const detailsReq = useJson('week_details.json');
  const earningsReq = useJson('earnings.json');

  const [vsMarket, setVsMarket] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [selected, setSelected] = useState(null);

  const weeks = weeksReq.data;

  // Shift sentiment ahead by the delay: the stock in week i is paired with
  // reviews from week i - delay. Stock and NASDAQ are indexed to 100 when compared.
  const rows = useMemo(() => {
    if (!weeks) return [];
    const base = weeks[0];
    return weeks.map((w, i) => {
      const src = weeks[i - delay.weeks];
      const s = src ? src.sentiment : null;
      return {
        ...w,
        stockVal: vsMarket ? (w.close / base.close) * 100 : w.close,
        marketVal: vsMarket ? (w.market_close / base.market_close) * 100 : null,
        sentAll: s,
        sentSolid: src && !src.low_data ? s : null,
        starsVal: src ? ((src.avg_stars - 3) / 2) * 100 : null, // 1-5 stars mapped onto -100..+100
        srcWeek: src?.week ?? null,
        srcReviews: src?.review_count ?? null,
        srcLow: !!src?.low_data,
      };
    });
  }, [weeks, delay.weeks, vsMarket]);

  // One tick per quarter: first week of Jan, Apr, Jul, Oct.
  const ticks = useMemo(() => {
    if (!weeks) return [];
    const seen = new Set();
    return weeks
      .filter((w) => {
        const d = parseDay(w.start);
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        if (d.getUTCMonth() % 3 !== 0 || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((w) => w.week);
  }, [weeks]);

  // Snap each earnings date to the week it falls in.
  const earningsWeeks = useMemo(() => {
    if (!weeks || !earningsReq.data) return [];
    return earningsReq.data
      .map(({ date }) => {
        const t = parseDay(date).getTime();
        return weeks.find((w) => t >= parseDay(w.start).getTime() && t < parseDay(w.start).getTime() + 7 * 86400000)?.week;
      })
      .filter(Boolean);
  }, [weeks, earningsReq.data]);

  const selIdx = weeks && selected ? weeks.findIndex((w) => w.week === selected) : -1;
  const selWeek = selIdx >= 0 ? weeks[selIdx] : null;
  const after = selIdx >= 0 ? weeks[selIdx + delay.weeks] : null;
  const stockAfter = selWeek && after ? ((after.close - selWeek.close) / selWeek.close) * 100 : null;

  return (
    <Layout company={company} delayLabel={delay.label}>
      <div className={styles.page}>
        <section className={styles.controls} aria-label="Chart controls">
          <div className={styles.controlGroup}>
            <SegmentedControl
              label="Delay (sentiment shifted ahead)"
              options={DELAYS.map((d) => ({ key: d.key, label: d.short }))}
              value={delay.key}
              onChange={setDelay}
            />
            <SegmentedControl
              label="Compare against"
              options={[
                { key: 'alone', label: `${ticker} alone` },
                { key: 'market', label: 'vs NASDAQ' },
              ]}
              value={vsMarket ? 'market' : 'alone'}
              onChange={(k) => setVsMarket(k === 'market')}
            />
            <label className={styles.check}>
              <input type="checkbox" checked={showStars} onChange={(e) => setShowStars(e.target.checked)} />
              Star-rating line
            </label>
          </div>
          <Link to={`/compare/${ticker}`} className={styles.compareBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <rect x="2" y="3" width="5" height="12" rx="1.5" fill="none" stroke="var(--window-a)" strokeWidth="2" />
              <rect x="11" y="3" width="5" height="12" rx="1.5" fill="none" stroke="var(--window-b)" strokeWidth="2" />
            </svg>
            Compare two windows
          </Link>
        </section>

        <div className={styles.body}>
          <section className={styles.chartPanel} aria-labelledby="chart-heading">
            <div className={styles.chartHead}>
              <h1 id="chart-heading" className={styles.chartTitle}>
                Stock vs customer sentiment, weekly
              </h1>
              <Legend vsMarket={vsMarket} showStars={showStars} />
            </div>

            {weeksReq.error ? (
              <ErrorState file="weeks.json" onRetry={weeksReq.retry} />
            ) : weeksReq.loading ? (
              <Skeleton height={440} radius={10} />
            ) : (
              <TimelineChart
                rows={rows}
                ticks={ticks}
                earningsWeeks={earningsWeeks}
                selected={selected}
                onSelect={setSelected}
                vsMarket={vsMarket}
                showStars={showStars}
                delay={delay}
              />
            )}

            <p className={styles.hint}>
              {vsMarket ? 'Left axis: price indexed to 100 at Jan 2016. ' : 'Left axis: weekly close (Adj Close). '}
              Right axis: sentiment −100 to +100. ER = earnings report. Click a week for details.
            </p>
          </section>

          <div className={styles.side}>
            <WeekPanel
              week={selWeek}
              details={detailsReq.data?.[selected]}
              detailsLoading={detailsReq.loading}
              stockAfter={stockAfter}
              delay={delay}
              onPrev={selIdx > 0 ? () => setSelected(weeks[selIdx - 1].week) : null}
              onNext={weeks && selIdx >= 0 && selIdx < weeks.length - 1 ? () => setSelected(weeks[selIdx + 1].week) : null}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Legend({ vsMarket, showStars }) {
  return (
    <ul className={styles.legend} aria-label="Legend">
      <li>
        <span className={styles.swatch} style={{ borderTopColor: 'var(--stock)' }} />
        Stock
      </li>
      <li>
        <span className={styles.swatch} style={{ borderTopColor: 'var(--sentiment)' }} />
        Sentiment
      </li>
      {vsMarket && (
        <li>
          <span className={styles.swatch} style={{ borderTopColor: 'var(--market)', borderTopStyle: 'dashed' }} />
          NASDAQ
        </li>
      )}
      {showStars && (
        <li>
          <span className={styles.swatch} style={{ borderTopColor: 'var(--stars)', borderTopStyle: 'dotted' }} />
          Stars
        </li>
      )}
      <li>
        <span className={styles.swatch} style={{ borderTopColor: 'rgba(255,181,71,0.5)', borderTopStyle: 'dashed' }} />
        Low data
      </li>
    </ul>
  );
}
