import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { useJson } from '../lib/useJson.js';
import styles from './PickCompany.module.css';

export default function PickCompany() {
  const { data: companies, loading, error, retry } = useJson('companies.json');

  return (
    <Layout>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 className={styles.headline}>
            Hear what customers say <span className={styles.accent}>before the stock does.</span>
          </h1>
          <p className={styles.subline}>
            Gemini reads thousands of Amazon reviews and lines customer sentiment up against the stock price, week
            by week.
          </p>
        </div>
        <HeroPreview />
      </section>

      <section aria-labelledby="pick-heading" className={styles.pick}>
        <h2 id="pick-heading" className={styles.pickHeading}>
          Pick a company
        </h2>

        {error ? (
          <ErrorState file="companies.json" onRetry={retry} />
        ) : (
          <ul className={styles.list} aria-busy={loading}>
            {loading
              ? [0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)
              : companies.map((c) => (c.status === 'live' ? <LiveRow key={c.ticker} c={c} /> : <SoonRow key={c.ticker} c={c} />))}
          </ul>
        )}
      </section>
    </Layout>
  );
}

function LiveRow({ c }) {
  return (
    <li className={styles.item}>
      <Link to={`/timeline/${c.ticker}`} className={`${styles.row} ${styles.rowLive}`}>
        <span className={styles.ticker}>{c.ticker}</span>
        <span className={styles.what}>
          <span className={styles.name}>{c.name}</span>
          <span className={styles.sells}>{c.sells}</span>
        </span>
        <span className={styles.range}>{c.range.label}</span>
        <span className={styles.cta}>
          Open timeline
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </li>
  );
}

function SoonRow({ c }) {
  return (
    <li className={styles.item}>
      <div className={`${styles.row} ${styles.rowSoon}`} aria-disabled="true">
        <span className={styles.ticker}>{c.ticker}</span>
        <span className={styles.what}>
          <span className={styles.name}>{c.name}</span>
          <span className={styles.sells}>{c.sells}</span>
        </span>
        <span className={styles.range}>Data not loaded</span>
        <span className={styles.soonBadge}>Coming soon</span>
      </div>
    </li>
  );
}

function SkeletonRow() {
  return (
    <li className={styles.item}>
      <div className={styles.row}>
        <Skeleton width={90} height={28} />
        <span className={styles.what}>
          <Skeleton width={140} height={18} />
          <Skeleton width={220} height={14} />
        </span>
        <Skeleton width={150} height={14} />
        <Skeleton width={150} height={44} radius={10} />
      </div>
    </li>
  );
}

/** Small static illustration of the idea: stock (white) and sentiment (amber) on one chart. */
function HeroPreview() {
  return (
    <figure className={styles.preview}>
      <svg viewBox="0 0 340 150" width="100%" height="150" role="img" aria-label="Example chart with a stock line and a customer sentiment line">
        <line x1="0" y1="75" x2="340" y2="75" stroke="var(--line)" strokeDasharray="3 5" />
        <polyline
          points="0,120 40,112 80,118 120,96 160,100 200,78 240,84 280,58 340,46"
          fill="none"
          stroke="var(--stock)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polyline
          points="0,96 40,80 80,92 120,64 160,74 200,50 240,62 280,38 340,30"
          fill="none"
          stroke="var(--sentiment)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      <figcaption className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: 'var(--stock)' }} />
          Stock
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: 'var(--sentiment)' }} />
          Customer sentiment
        </span>
      </figcaption>
    </figure>
  );
}
