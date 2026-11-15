const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('en-US');
const dayFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function num(v) {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

export function money(v, { cents = false } = {}) {
  const n = num(v);
  if (n === null) return '—';
  return (cents ? usdCents : usdWhole).format(n);
}

export function compactMoney(v) {
  const n = num(v);
  if (n === null) return '—';
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}m`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

export function count(v) {
  const n = num(v);
  return n === null ? '—' : integer.format(n);
}

export function countdown(deadline, now = Date.now()) {
  const end = Date.parse(deadline);
  if (!Number.isFinite(end)) return { text: '—', tone: 'none' };
  const ms = end - now;
  if (ms <= 0) return { text: 'closed', tone: 'ended' };
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  let text;
  if (d > 0) text = `${d}d ${h}h`;
  else if (h > 0) text = `${h}h ${String(m).padStart(2, '0')}m`;
  else text = `${m}m ${String(s).padStart(2, '0')}s`;
  const tone = ms < HOUR ? 'hot' : ms < DAY ? 'soon' : 'ok';
  return { text, tone };
}

export function date(iso) {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? dayFmt.format(t) : '—';
}

export function clock(ts = Date.now()) {
  return `${new Date(ts).toISOString().slice(11, 16)} UTC`;
}

export function cellValue(entry, key, rankKey) {
  if (entry.display && typeof entry.display === 'object') return entry.display[key] ?? entry.values?.[key] ?? '—';
  if (key === rankKey) return entry.display ?? entry.value ?? '—';
  if (key === 'judge_low') return entry.interval?.low ?? '—';
  if (key === 'judge_high') return entry.interval?.high ?? '—';
  return '—';
}

export function shortAddress(a) {
  return a && a.length > 12 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a || '';
}
