import { useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { fmtRange, fmtTick, fmtDay, money, pct, signed } from '../../lib/format.js';
import styles from './TimelineChart.module.css';

const MONO = "'JetBrains Mono', ui-monospace, monospace";

const C = {
  stock: '#f5f7fa',
  sentiment: '#ffb547',
  market: '#6e7d91',
  stars: '#c49bff',
  grid: '#161c25',
  axis: '#b9c3d0',
  earnings: '#3b4757',
};

/**
 * rows: prepared weekly rows (see Timeline.jsx)
 * vsMarket: plot LOGI and NASDAQ indexed to 100 instead of LOGI's price
 */
export default function TimelineChart({ rows, ticks, earningsWeeks, selected, onSelect, vsMarket, showStars, delay }) {
  // The one cinematic moment in the app: lines draw in on first load only.
  // After that every toggle redraws instantly.
  const [animate, setAnimate] = useState(true);

  const handleClick = (state) => {
    const label = state?.activeLabel;
    const idx = state?.activeIndex ?? state?.activeTooltipIndex;
    const week = label ?? rows[Number(idx)]?.week;
    if (week) onSelect(week);
  };

  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height={440}>
        <ComposedChart data={rows} margin={{ top: 28, right: 8, bottom: 4, left: 8 }} onClick={handleClick} style={{ cursor: 'pointer' }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis
            dataKey="week"
            ticks={ticks}
            tickFormatter={fmtTick}
            tick={{ fill: C.axis, fontSize: 12, fontFamily: MONO }}
            tickLine={false}
            axisLine={{ stroke: '#2a3340' }}
            interval={0}
          />
          <YAxis
            yAxisId="price"
            domain={['auto', 'auto']}
            tickFormatter={(v) => (vsMarket ? Math.round(v) : `$${Math.round(v)}`)}
            tick={{ fill: C.axis, fontSize: 12, fontFamily: MONO }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <YAxis
            yAxisId="sent"
            orientation="right"
            domain={[-100, 100]}
            ticks={[-100, -50, 0, 50, 100]}
            tickFormatter={(v) => signed(v, 0)}
            tick={{ fill: C.sentiment, fontSize: 12, fontFamily: MONO }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <ReferenceLine yAxisId="sent" y={0} stroke="#2a3340" strokeDasharray="4 6" />

          {earningsWeeks.map((w) => (
            <ReferenceLine
              key={w}
              yAxisId="price"
              x={w}
              stroke={C.earnings}
              strokeDasharray="2 4"
              label={{ value: 'ER', position: 'top', fill: C.axis, fontSize: 11, fontFamily: MONO }}
            />
          ))}

          {selected && <ReferenceLine yAxisId="price" x={selected} stroke={C.sentiment} strokeWidth={2} />}

          {vsMarket && (
            <Line
              yAxisId="price"
              dataKey="marketVal"
              stroke={C.market}
              strokeWidth={2}
              strokeDasharray="6 5"
              dot={false}
              isAnimationActive={false}
              name="NASDAQ"
            />
          )}

          {showStars && (
            <Line
              yAxisId="sent"
              dataKey="starsVal"
              stroke={C.stars}
              strokeWidth={2}
              strokeDasharray="1 5"
              strokeLinecap="round"
              dot={false}
              isAnimationActive={false}
              connectNulls
              name="Stars"
            />
          )}

          {/* Faded dashed line under everything: shows through where weeks are low-data. */}
          <Line
            yAxisId="sent"
            dataKey="sentAll"
            stroke={C.sentiment}
            strokeOpacity={0.45}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={<LowDataDot />}
            activeDot={false}
            isAnimationActive={animate}
            animationBegin={700}
            animationDuration={900}
            connectNulls
          />
          {/* Solid line only where the week has enough reviews. */}
          <Line
            yAxisId="sent"
            dataKey="sentSolid"
            stroke={C.sentiment}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: C.sentiment, stroke: '#07090c', strokeWidth: 2 }}
            isAnimationActive={animate}
            animationBegin={700}
            animationDuration={900}
            name="Sentiment"
          />
          <Line
            yAxisId="price"
            dataKey="stockVal"
            stroke={C.stock}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: C.stock, stroke: '#07090c', strokeWidth: 2 }}
            isAnimationActive={animate}
            animationDuration={1400}
            animationEasing="ease-out"
            onAnimationEnd={() => setAnimate(false)}
            name="Stock"
          />

          <Tooltip
            content={<WeekTooltip vsMarket={vsMarket} delay={delay} />}
            cursor={{ stroke: '#2a3340', strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function LowDataDot({ cx, cy, payload }) {
  if (!payload?.srcLow || cx == null || cy == null) return <g />;
  return <circle cx={cx} cy={cy} r={4} fill="#07090c" stroke="#ffb547" strokeOpacity={0.7} strokeWidth={1.5} />;
}

function WeekTooltip({ active, payload, vsMarket, delay }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className={styles.tip}>
      <span className={styles.tipDate}>{fmtRange(r.start, r.end)}</span>
      <div className={styles.tipRow}>
        <span style={{ color: C.stock }}>Stock</span>
        <span className={styles.tipVal}>
          {money(r.close)} · {pct(r.pct_change)}
        </span>
      </div>
      {vsMarket && (
        <div className={styles.tipRow}>
          <span className={styles.tipMarket}>NASDAQ</span>
          <span className={styles.tipVal}>{pct(r.market_pct_change)}</span>
        </div>
      )}
      <div className={styles.tipRow}>
        <span style={{ color: C.sentiment }}>Sentiment</span>
        <span className={styles.tipVal}>{r.sentAll == null ? '—' : signed(r.sentAll)}</span>
      </div>
      <div className={styles.tipRow}>
        <span className={styles.tipMuted}>Reviews</span>
        <span className={styles.tipVal}>
          {r.srcReviews ?? '—'}
          {r.srcLow && <span className={styles.tipLow}> LOW</span>}
        </span>
      </div>
      {r.srcWeek && delay.weeks > 0 && (
        <span className={styles.tipNote}>Sentiment from reviews in the week of {fmtDay(r.srcWeek, { year: false })}</span>
      )}
    </div>
  );
}
