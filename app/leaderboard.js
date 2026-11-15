import { fetchView } from './api.js';
import { cellValue, count, num } from './format.js';
import { empty, esc } from './ui.js';

const SHOWN = 200;
const enc = encodeURIComponent;
const boardPath = (slug) => `/competitions/${enc(slug)}/leaderboard?rows=first`;

const rowHtml = (e, cols, rankKey) => {
  const dim = e.prize_eligible === false ? ' class="dim"' : '';
  const prize = (num(e.prize_rank) ?? 99) <= 3 ? '<span class="prize-dot" title="prize place"></span>' : '';
  const who = e.handle ? `<a href="#/u/${enc(e.handle)}">${esc(e.handle)}</a>` : '<span class="muted">unnamed</span>';
  const title = e.title ? `<span class="note">${esc(e.title)}</span>` : '';
  const values = cols.map((c) => `<td class="num">${esc(cellValue(e, c.key, rankKey))}</td>`).join('');
  return `<tr${dim}><td class="num">${prize}${esc(e.rank ?? '')}</td><td>${who}${title}</td>${values}</tr>`;
};

const page = (slug, data) => {
  const cols = (data.columns ?? []).filter((c) => !c.hidden);
  const rows = [...(data.entries ?? []), ...(data.rest ?? [])];
  const title = data.competition?.title || slug;
  const head = `<th class="num">rank</th><th>entry</th>${cols.map((c) => `<th class="num">${esc(c.title)}</th>`).join('')}`;
  const body = rows.length
    ? `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows.slice(0, SHOWN).map((e) => rowHtml(e, cols, data.rank_key)).join('')}</tbody></table></div>
       <p class="note-line">showing first ${count(Math.min(rows.length, SHOWN))} of ${count(rows.length)} entries in make.fun's first response (rows=first). Only that page is read here.</p>`
    : empty('No ranked entries yet', 'The leaderboard fills in as entries are judged.');
  return `
<nav class="crumbs"><a href="#/bounty/${enc(slug)}">← ${esc(title)}</a></nav>
<header class="bounty-head"><h1>Leaderboard</h1><p class="lede">${esc(data.title || '')}</p></header>
<section class="panel">${body}</section>`;
};

export async function mountLeaderboard(root, slug) {
  root.innerHTML = '<div class="panel skel-block"></div>';
  await fetchView(boardPath(slug), (data) => {
    document.title = `Meridian — ${data.competition?.title || slug} · leaderboard`;
    root.innerHTML = page(slug, data);
  });
}
