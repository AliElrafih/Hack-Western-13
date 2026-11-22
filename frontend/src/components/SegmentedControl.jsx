import styles from './SegmentedControl.module.css';

/**
 * A row of toggle buttons where exactly one is on.
 * options: [{ key, label }]
 */
export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label} id={`seg-${label}`}>
        {label}
      </span>
      <div role="group" aria-labelledby={`seg-${label}`} className={styles.group}>
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={value === o.key}
            className={`${styles.btn} ${value === o.key ? styles.on : ''}`}
            onClick={() => onChange(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
