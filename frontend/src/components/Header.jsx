import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import { APP_NAME } from '../lib/constants.js';
import styles from './Header.module.css';

const STEPS = [
  { n: 1, label: 'Pick', path: () => '/' },
  { n: 2, label: 'Timeline', path: (t) => `/timeline/${t}` },
  { n: 3, label: 'Compare', path: (t) => `/compare/${t}` },
  { n: 4, label: 'Prediction', path: (t) => `/prediction/${t}` },
];

/**
 * Shared header.
 * - company: { name, ticker, range } once a company is chosen, else null.
 * - delayLabel: current delay setting, shown in the context line.
 * Steps 2-4 only become links once a company is chosen.
 */
export default function Header({ company = null, delayLabel = null }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo />
          {company ? (
            <>
              <span className={styles.name}>{company.name}</span>
              <span className={styles.context}>
                {company.ticker} · {company.range}
                {delayLabel && ` · Delay ${delayLabel}`}
              </span>
            </>
          ) : (
            <span className={styles.name}>{APP_NAME}</span>
          )}
        </div>

        <nav aria-label="Steps">
          <ol className={styles.steps}>
            {STEPS.map((step) => {
              const label = `${step.n} ${step.label}`;
              if (step.n > 1 && !company) {
                return (
                  <li key={step.n}>
                    <span className={`${styles.step} ${styles.stepDisabled}`} aria-disabled="true">
                      {label}
                    </span>
                  </li>
                );
              }
              return (
                <li key={step.n}>
                  <NavLink
                    to={step.path(company?.ticker)}
                    end
                    className={({ isActive }) => `${styles.step} ${isActive ? styles.stepActive : ''}`}
                  >
                    {label}
                  </NavLink>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </header>
  );
}
