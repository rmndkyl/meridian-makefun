import { countdown } from './format.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const chip = (label, attrs = '') => `<span class="chip"${attrs}>${esc(label)}</span>`;

export const pill = (tone, label) => `<span class="pill ${esc(tone)}">${esc(label)}</span>`;

export const skeletonRows = (n) =>
  Array.from({ length: n }, () => '<li class="row skel" aria-hidden="true"><span></span><span></span><span></span><span></span></li>').join('');

export function empty(title, body, action = '') {
  return `<div class="state"><h2>${esc(title)}</h2><p class="muted">${esc(body)}</p>${action}</div>`;
}

export function failure(err) {
  const wait = err?.retryAfter || 0;
  let msg = 'Could not reach make.fun.';
  if (err?.status === 429) msg = `make.fun is rate limiting this browser${wait ? `, retry in ${wait}s` : ''}.`;
  else if (err?.status) msg = `make.fun answered with HTTP ${err.status}.`;
  return `<div class="state error"><h2>Could not load this page</h2><p class="muted">${esc(msg)}</p><button class="btn" type="button" data-retry>retry</button></div>`;
}

export function armRetry(root, err, retry) {
  const btn = root.querySelector('[data-retry]');
  if (!btn) return;
  btn.addEventListener('click', retry);
  if (err?.retryAfter > 0) {
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, err.retryAfter * 1000);
  }
}

export const imagesReady = (root) =>
  Promise.all([...root.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((done) => {
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  }))));

let timer = 0;

export function startTicks(root) {
  stopTicks();
  const paint = () => {
    for (const node of root.querySelectorAll('[data-deadline]')) {
      const c = countdown(node.dataset.deadline);
      node.textContent = c.text;
      node.dataset.tone = c.tone;
    }
  };
  paint();
  timer = setInterval(paint, 1000);
}

export function stopTicks() {
  clearInterval(timer);
  timer = 0;
}
