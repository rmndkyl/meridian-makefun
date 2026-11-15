import { get, peek } from './api.js';
import { compactMoney, money, count, clock, num, countdown } from './format.js';
import { esc, skeletonRows, empty, failure, armRetry, startTicks, stopTicks } from './ui.js';

const PATH = '/competitions?status=open&limit=24&activity=times';
const DAY_MS = 86_400_000;

const potOf = (b) => num(b.potUsd) ?? num(b.rewardAmount) ?? 0;
const deadlineOf = (b) => Date.parse(b.deadline) || Infinity;
const SORTS = {
  pot: (a, b) => potOf(b) - potOf(a),
  closing: (a, b) => deadlineOf(a) - deadlineOf(b),
  newest: (a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0),
  entries: (a, b) => (num(b.submissionCount) ?? 0) - (num(a.submissionCount) ?? 0),
};
const haystack = (b) => [b.title, b.summary, b.category, ...(b.skills || [])].join(' ').toLowerCase();

const row = (b) => `<li class="row"><a class="row-link" href="#/bounty/${esc(b.slug)}">
  <span class="cell main"><span class="title">${esc(b.title)}</span><span class="meta">${esc(b.category || 'bounty')}${b.sponsor?.name ? ` · ${esc(b.sponsor.name)}` : ''}</span></span>
  <span class="cell reward"><span class="label">reward</span><span class="mono strong">${compactMoney(potOf(b))}</span></span>
  <span class="cell entry"><span class="label">entry</span><span class="mono">${num(b.entryFeeUsd) ? money(b.entryFeeUsd, { cents: true }) : 'free'}</span></span>
  <span class="cell closes"><span class="label">closes</span><span class="mono" data-deadline="${esc(b.deadline)}">${countdown(b.deadline).text}</span></span>
  <span class="cell entries"><span class="label">entries</span><span class="mono">${count(b.submissionCount)}</span></span>
</a></li>`;

const shell = () => `
<section class="hero">
  <p class="eyebrow">make.fun · open bounties</p>
  <h1>Open bounties</h1>
  <p class="lede">Reward, entry fee, time left and entries for every open bounty. Press / to search.</p>
</section>
<section class="stats" aria-label="Summary">
  <div class="stat"><span class="label">live pot</span><span class="mono big" data-stat="pot">—</span></div>
  <div class="stat"><span class="label">open bounties</span><span class="mono big" data-stat="open">—</span></div>
  <div class="stat"><span class="label">closing within 24h</span><span class="mono big" data-stat="soon">—</span></div>
</section>
<section class="toolbar">
  <input type="search" data-q placeholder="Search title, summary or skill" aria-label="Search bounties" autocomplete="off">
  <div class="chips" data-chips role="group" aria-label="Category"></div>
  <label class="sort">sort <select data-sort>
    <option value="pot">pot</option><option value="closing">closing</option><option value="newest">newest</option><option value="entries">entries</option>
  </select></label>
</section>
<p class="count mono" data-count aria-live="polite">&nbsp;</p>
<ul class="rows" data-rows aria-label="Open bounties">${skeletonRows(8)}</ul>
<div class="more" data-more></div>
<footer class="foot"><span class="mono" data-stamp>live from make.fun/api</span><button class="btn ghost" type="button" data-refresh>refresh</button></footer>`;

export async function mountBoard(root) {
  root.innerHTML = shell();
  const $ = (sel) => root.querySelector(sel);
  const state = { items: [], next: null, q: '', cat: '', sort: 'pot', stamp: '' };
  const qInput = $('[data-q]');

  const visible = () => {
    const q = state.q.trim().toLowerCase();
    return state.items
      .filter((b) => !state.cat || b.category === state.cat)
      .filter((b) => !q || haystack(b).includes(q))
      .sort(SORTS[state.sort]);
  };

  const paintStats = () => {
    const soon = state.items.filter((b) => {
      const left = deadlineOf(b) - Date.now();
      return left > 0 && left < DAY_MS;
    }).length;
    const pot = state.items.reduce((sum, b) => sum + potOf(b), 0);
    $('[data-stat="pot"]').textContent = compactMoney(pot);
    $('[data-stat="open"]').textContent = `${count(state.items.length)}${state.next ? '+' : ''}`;
    $('[data-stat="soon"]').textContent = count(soon);
  };

  const paintChips = () => {
    const cats = [...new Set(state.items.map((b) => b.category).filter(Boolean))].sort();
    $('[data-chips]').innerHTML = ['', ...cats]
      .map((c) => `<button type="button" class="chip" aria-pressed="${state.cat === c}" data-cat="${esc(c)}">${esc(c || 'all')}</button>`)
      .join('');
  };

  const paintRows = () => {
    const list = visible();
    $('[data-rows]').innerHTML = list.length
      ? list.map(row).join('')
      : `<li class="state-row">${empty('No bounties match', 'Try another word or clear the category.', '<button class="btn" type="button" data-clear>clear filters</button>')}</li>`;
    $('[data-count]').textContent = `${count(list.length)} shown of ${count(state.items.length)} loaded${state.next ? ' · more on make.fun' : ''}`;
    $('[data-more]').innerHTML = state.next
      ? '<button class="btn" type="button" data-more-btn>load 24 more</button>'
      : '<p class="muted">End of the open list.</p>';
    startTicks(root);
  };

  const paintAll = () => {
    paintStats();
    paintChips();
    paintRows();
  };

  const load = async ({ force = false } = {}) => {
    const page = await get(PATH, { force });
    state.items = page.items ?? [];
    state.next = page.next_cursor ?? null;
    state.stamp = clock();
    $('[data-stamp]').textContent = `live from make.fun/api · updated ${state.stamp}`;
    paintAll();
  };

  const onInput = () => {
    state.q = qInput.value;
    paintRows();
  };
  const onSort = (e) => {
    state.sort = e.target.value;
    paintRows();
  };
  const onKey = (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) {
      e.preventDefault();
      qInput.focus();
    } else if (e.key === 'Escape' && document.activeElement === qInput && qInput.value) {
      qInput.value = '';
      onInput();
    }
  };
  const onClick = async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.cat !== undefined) {
      state.cat = t.dataset.cat;
      paintChips();
      paintRows();
    } else if (t.hasAttribute('data-clear')) {
      state.cat = '';
      state.q = '';
      qInput.value = '';
      paintChips();
      paintRows();
    } else if (t.hasAttribute('data-refresh')) {
      t.disabled = true;
      await load({ force: true }).catch(() => {});
      t.disabled = false;
    } else if (t.hasAttribute('data-more-btn')) {
      t.disabled = true;
      const page = await get(`${PATH}&cursor=${encodeURIComponent(state.next)}`).catch(() => null);
      if (!page) return (t.disabled = false);
      state.items = state.items.concat(page.items ?? []);
      state.next = page.next_cursor ?? null;
      paintAll();
    }
  };

  qInput.addEventListener('input', onInput);
  $('[data-sort]').addEventListener('change', onSort);
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  const cached = peek(PATH);
  if (cached) {
    state.items = cached.data.items ?? [];
    state.next = cached.data.next_cursor ?? null;
    paintAll();
  }
  const teardown = () => {
    stopTicks();
    root.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
  try {
    await load();
  } catch (err) {
    if (err.name === 'AbortError') return teardown;
    if (!cached) {
      $('[data-rows]').innerHTML = `<li class="state-row">${failure(err)}</li>`;
      armRetry($('[data-rows]'), err, () => load().catch(() => {}));
    }
  }

  return teardown;
}
