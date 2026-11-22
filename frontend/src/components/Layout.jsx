import Header from './Header.jsx';
import Footer from './Footer.jsx';
import styles from './Layout.module.css';

/** Page frame: header, main content, disclaimer footer. */
export default function Layout({ company, delayLabel, children }) {
  return (
    <div className={styles.page}>
      <Header company={company} delayLabel={delayLabel} />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
