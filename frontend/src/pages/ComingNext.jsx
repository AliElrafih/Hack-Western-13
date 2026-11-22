import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useJson } from '../lib/useJson.js';
import styles from './ComingNext.module.css';

/** Temporary page for screens 2-4 until they're built. Keeps the header and routing working. */
export default function ComingNext({ screen }) {
  const { ticker } = useParams();
  const { data: companies } = useJson('companies.json');
  const c = companies?.find((x) => x.ticker === ticker);
  const company = c ? { name: c.name, ticker: c.ticker, range: c.range?.label ?? '' } : null;

  return (
    <Layout company={company} delayLabel="2 weeks">
      <section className={styles.box}>
        <h1 className={styles.title}>{screen}</h1>
        <p className={styles.body}>This screen is next on the build list.</p>
        <Link to="/" className={styles.back}>
          Back to companies
        </Link>
      </section>
    </Layout>
  );
}
