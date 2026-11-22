import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useCompany } from '../lib/useCompany.js';
import { useDelay } from '../lib/delay.jsx';
import styles from './ComingNext.module.css';

/** Temporary page for screens not built yet. Keeps the header and routing working. */
export default function ComingNext({ screen }) {
  const { ticker } = useParams();
  const { company } = useCompany(ticker);
  const { delay } = useDelay();

  return (
    <Layout company={company} delayLabel={delay.label}>
      <section className={styles.box}>
        <h1 className={styles.title}>{screen}</h1>
        <p className={styles.body}>This screen is next on the build list.</p>
        <Link to={`/timeline/${ticker}`} className={styles.back}>
          Back to the timeline
        </Link>
      </section>
    </Layout>
  );
}
