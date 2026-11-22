import styles from './ErrorState.module.css';

/** Shown when a data file fails to load. */
export default function ErrorState({ file, onRetry }) {
  return (
    <div role="alert" className={styles.box}>
      <div className={styles.copy}>
        <p className={styles.title}>Couldn't load {file}</p>
        <p className={styles.body}>Check that the data files are in public/data, then try again.</p>
      </div>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
