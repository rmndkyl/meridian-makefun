import { fetchView, get } from './api.js';
import { prose } from './prose.js';
import { cellValue, count, countdown, date, money, num } from './format.js';
import { chip, esc, pill, startTicks } from './ui.js';

const enc = encodeURIComponent;
const detailPath = (slug) => `/competitions/${enc(slug)}?submissions=summary`;
const boardPath = (slug) => `/competitions/${enc(slug)}/leaderboard?rows=first`;

const feeOf = (b) => (num(b.entryFeeUsd) ? money(b.entryFeeUsd, { cents: true }) : 'free');
const placesOf = (b) => b.rewardsNow?.length || Object.keys(b.rewards || {}).length;

const skeleton = () =>
  '<div class="layout"><div class="stack"><div class="panel skel-block"></div></div><aside class="rail panel skel-block"></aside></div>';

const rewardsPanel = (b) => {
  if (!b.rewardsNow?.length) return '<p class="muted">No prize places listed yet.</p>';
  const rows = b.rewardsNow
    .map((r) => {
      const fee = num(r.feeShareUsd);
      const note = fee ? `<span class="note">incl. ${money(fee, { cents: true })} from entry fees</span>` : '';
      return `<tr><td class="num">${esc(r.place)}</td><td class="num">${money(r.baseUsd, { cents: true })}</td><td class="num">${money(r.amountUsd, { cents: true })}${note}</td></tr>`;
    })
    .join('');
  return `<div class="table-wrap"><table><thead><tr><th>place</th><th class="num">base</th><th class="num">paid</th></tr></thead><tbody>${rows}</tbody></table></div>`;
};

const page = (b) => `
<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">board</a> / ${esc(b.slug)}</nav>
<header class="bounty-head">
  <div>${pill(b.status || 'unknown', b.status || 'unknown')}<span class="sponsor">${esc(b.sponsor?.name || 'make.fun')}${b.sponsor?.isVerified ? ' · verified' : ''}</span></div>
  <h1>${esc(b.title)}</h1>
  ${b.summary ? `<p class="lede">${esc(b.summary)}</p>` : ''}
</header>
<div class="layout">
  <div class="stack">
    <section class="panel"><h2>Rewards</h2>${rewardsPanel(b)}</section>
    <section class="panel"><h2>Description</h2>
      <div class="prose">${prose(b.description)}</div>
      ${Array.isArray(b.skills) && b.skills.length ? `<div class="skills">${b.skills.map((s) => chip(s)).join('')}</div>` : ''}
      <p class="note-line"><a href="https://make.fun/bounty/${enc(b.slug)}" rel="noopener">Read the full rules on make.fun ↗</a></p>
    </section>
  </div>
  <aside class="rail" data-rail></aside>
</div>`;

const boardList = (lb) => {
  if (lb === null) return '<p class="muted">loading ranked entries…</p>';
  if (lb.failed) return '<p class="muted">The leaderboard could not be loaded.</p>';
  const rows = (lb.entries ?? []).slice(0, 8);
  if (!rows.length) return '<p class="muted">no ranked entries yet</p>';
  const key = lb.columns?.[0]?.key;
  const items = rows
    .map((e) => {
      const who = e.handle ? `<a href="#/u/${enc(e.handle)}">${esc(e.handle)}</a>` : esc(e.title || 'entry');
      return `<li><span><span class="mono">${esc(e.rank ?? '')}</span> ${who}</span><span class="mono">${esc(cellValue(e, key))}</span></li>`;
    })
    .join('');
  return `<ol class="lb-mini">${items}</ol>`;
};

const railHtml = (b, lb) => `
<section class="panel"><h2>Leaderboard</h2>${boardList(lb)}
  <p class="note-line"><a href="#/bounty/${enc(b.slug)}/leaderboard">Full leaderboard →</a></p>
</section>
<section class="panel"><h2>Details</h2>
  <dl class="dl">
    <dt>published</dt><dd>${date(b.publishedAt)}</dd>
    <dt>deadline</dt><dd>${date(b.deadline)} · <span data-deadline="${esc(b.deadline)}">${countdown(b.deadline).text}</span></dd>
    <dt>entries</dt><dd>${count(b.submissionCount)}</dd>
    <dt>entry fee</dt><dd>${feeOf(b)}</dd>
    <dt>prize places</dt><dd>${count(placesOf(b))}</dd>
    <dt>harness</dt><dd>${esc(b.harnessKind || '—')}</dd>
  </dl>
</section>`;

export async function mountBounty(root, slug) {
  root.dataset.bounty = slug;
  root.innerHTML = skeleton();
  let bounty = null;
  let board = null;

  const paintRail = () => {
    const rail = root.querySelector('[data-rail]');
    if (!rail || !bounty || root.dataset.bounty !== slug) return;
    rail.innerHTML = railHtml(bounty, board);
    startTicks(root);
  };

  const paintPage = (b) => {
    bounty = b;
    document.title = `Meridian — ${b.title || slug}`;
    root.innerHTML = page(b);
    paintRail();
  };

  const ranked = get(boardPath(slug))
    .then((d) => {
      board = d;
    })
    .catch(() => {
      board = { failed: true };
    })
    .then(paintRail);

  await fetchView(detailPath(slug), paintPage);
  await ranked;
}
