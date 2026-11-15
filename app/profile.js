import { fetchView } from './api.js';
import { count, date, money, num, shortAddress } from './format.js';
import { esc } from './ui.js';

const enc = encodeURIComponent;
const profilePath = (handle) => `/profiles/${enc(handle)}`;
const SOLUTIONS_SHOWN = 12;

const str = (v) => (typeof v === 'string' ? v : '');

const stat = (label, value) => `<div class="card"><span class="label">${label}</span><span class="big">${value}</span></div>`;

const recordHtml = (r = {}) => `<div class="record">
  ${stat('entered', count(r.competitions_entered))}
  ${stat('placed', count(r.competitions_placed))}
  ${stat('won', count(r.competitions_won))}
  ${stat('prize earned', money(r.prize_usd ?? 0, { cents: true }))}
</div>`;

const avatarHtml = (p) => {
  const src = p.avatar?.url_small || p.avatar?.url;
  if (src) return `<img class="avatar" src="${esc(src)}" alt="" width="72" height="72" crossorigin="anonymous">`;
  return `<div class="avatar avatar-fallback" aria-hidden="true">${esc((p.handle || '?')[0].toUpperCase())}</div>`;
};

const identity = (p) => {
  const bits = [];
  if (str(p.x)) bits.push(`x @${esc(p.x)}`);
  if (str(p.github_login)) bits.push(`github ${esc(p.github_login)}`);
  if (p.wallet?.address) {
    const short = `<span class="mono">${esc(shortAddress(p.wallet.address))}</span>`;
    const explorer = /^https:\/\//.test(p.wallet.explorer_url || '') ? ` <a href="${esc(p.wallet.explorer_url)}" rel="noopener">explorer ↗</a>` : '';
    bits.push(`wallet ${short}${explorer}`);
  }
  return bits.length ? `<p class="meta">${bits.join(' · ')}</p>` : '';
};

const solutionsHtml = (list = []) => {
  if (!list.length) return '<p class="muted">no solutions yet</p>';
  const items = list
    .slice(0, SOLUTIONS_SHOWN)
    .map((s) => {
      const slug = s.competition?.slug;
      const name = esc(s.title || 'untitled');
      const title = slug ? `<a href="#/bounty/${enc(slug)}">${name}</a>` : name;
      const right = num(s.prize_usd) ? money(s.prize_usd, { cents: true }) : typeof s.placement === 'number' ? `#${s.placement}` : '—';
      return `<li><span>${title}<span class="meta">${esc(s.competition?.title || '')}</span></span><span class="mono">${right}</span></li>`;
    })
    .join('');
  const more = list.length > SOLUTIONS_SHOWN ? `<p class="note-line">showing ${SOLUTIONS_SHOWN} of ${count(list.length)} solutions</p>` : '';
  return `<ul class="solutions">${items}</ul>${more}`;
};

const payoutsHtml = (list = []) => {
  if (!list.length) return '<p class="muted">nothing paid out yet</p>';
  const rows = list
    .map((p) => `<tr><td>${esc(p.title || p.competition?.title || '—')}</td><td class="num">${money(p.amount_usd ?? p.prize_usd, { cents: true })}</td></tr>`)
    .join('');
  return `<div class="table-wrap"><table><thead><tr><th>bounty</th><th class="num">paid</th></tr></thead><tbody>${rows}</tbody></table></div>`;
};

const page = (p) => `
<header class="profile-head">
  ${avatarHtml(p)}
  <div>
    <h1>${esc(str(p.display_name) || p.handle)}</h1>
    <p class="meta mono">@${esc(p.handle)}${p.joined_at ? ` · joined ${date(p.joined_at)}` : ''}</p>
    ${str(p.bio) ? `<p class="lede">${esc(p.bio)}</p>` : ''}
    ${identity(p)}
  </div>
</header>
${recordHtml(p.record ?? {})}
<div class="layout">
  <section class="panel"><h2>Recent solutions</h2>${solutionsHtml(p.solutions ?? [])}</section>
  <aside class="rail"><section class="panel"><h2>Payouts</h2>${payoutsHtml(p.payouts ?? [])}</section></aside>
</div>`;

export async function mountProfile(root, handle) {
  root.innerHTML = '<div class="panel skel-block"></div>';
  await fetchView(profilePath(handle), (p) => {
    document.title = `Meridian — ${str(p.display_name) || p.handle || handle}`;
    root.innerHTML = page(p);
  });
}
