import styles from './Footer.module.css';

/** Always-visible disclaimer, required on every screen. */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>Research tool, not financial advice. Built at Hack Western 13.</p>
    </footer>
  );
}
