import { fmtRange, fmtDay, pct, signed } from '../../lib/format.js';
import Skeleton from '../Skeleton.jsx';
import styles from './WeekPanel.module.css';

/**
 * Detail panel for the selected week: Gemini summary, top products,
 * example reviews, review count, and how the stock moved over the
 * selected delay afterwards.
 */
export default function WeekPanel({ week, details, detailsLoading, stockAfter, delay, onPrev, onNext, onClose }) {
  if (!week) {
    return (
      <aside className={`${styles.panel} ${styles.empty}`} aria-label="Week details">
        <p className={styles.prompt}>Click any week on the chart to see what customers were saying.</p>
      </aside>
    );
  }

  const noReviews = week.review_count === 0;

  return (
    <aside className={styles.panel} aria-labelledby="week-heading">
      <div className={styles.head}>
        <div className={styles.headText}>
          <span className={styles.kicker}>Selected week</span>
          <h2 id="week-heading" className={styles.title}>
            {fmtRange(week.start, week.end)}
          </h2>
        </div>
        <div className={styles.headBtns}>
          <button type="button" className={styles.iconBtn} onClick={onPrev} disabled={!onPrev} aria-label="Previous week">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M9 2L4 7l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={styles.iconBtn} onClick={onNext} disabled={!onNext} aria-label="Next week">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M5 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close week panel">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {week.low_data && !noReviews && (
        <span className={styles.lowBadge}>Low data · {week.review_count} reviews</span>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Sentiment</span>
          <span className={styles.statVal} style={{ color: 'var(--sentiment)', opacity: week.low_data ? 0.6 : 1 }}>
            {noReviews ? '—' : signed(week.sentiment)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Stock after</span>
          <span className={styles.statVal}>{pct(stockAfter)}</span>
          <span className={styles.statSub}>next {delay.label}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Reviews</span>
          <span className={styles.statVal}>{week.review_count}</span>
        </div>
      </div>

      {noReviews ? (
        <div className={styles.noReviews}>
          <p className={styles.noTitle}>No reviews this week</p>
          <p className={styles.noBody}>Nobody reviewed a product in this week. Try a nearby week.</p>
        </div>
      ) : detailsLoading ? (
        <div className={styles.section}>
          <Skeleton width="90%" />
          <Skeleton width="75%" />
          <Skeleton width="60%" />
        </div>
      ) : (
        details && (
          <>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>What customers said · Gemini</h3>
              <p className={styles.summary}>{details.summary}</p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Most-reviewed products</h3>
              <ul className={styles.products}>
                {details.products.map((p) => (
                  <li key={p.name} className={styles.product}>
                    <span>
                      {p.name} <span className={styles.productCount}>· {p.reviews}</span>
                    </span>
                    <span className={styles.productSent}>{signed(p.sentiment)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Example reviews</h3>
              {details.examples.map((ex, i) => (
                <blockquote key={i} className={styles.review}>
                  <p className={styles.reviewText}>{ex.text}</p>
                  <span className={styles.reviewMeta}>
                    {ex.product} · {fmtDay(ex.date)} · {ex.stars}★
                  </span>
                </blockquote>
              ))}
            </section>
          </>
        )
      )}
    </aside>
  );
}
