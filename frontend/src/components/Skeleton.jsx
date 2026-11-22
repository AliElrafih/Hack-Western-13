import styles from './Skeleton.module.css';

/** Grey placeholder block shaped like the content it stands in for. No spinners. */
export default function Skeleton({ width = '100%', height = 16, radius = 6, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
