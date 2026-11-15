import { cancelRequests } from './api.js';
import { mountBoard } from './board.js';
import { armRetry, empty, failure, imagesReady, stopTicks } from './ui.js';

const view = document.getElementById('view');
const TITLE = 'Meridian';
let teardown = () => {};
let run = 0;

const part = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// Routes: #/ · #/bounty/<slug> · #/bounty/<slug>/leaderboard · #/u/<handle>
function parse(hash) {
  const path = hash.replace(/^#/, '') || '/';
  let m = /^\/bounty\/([^/]+)\/leaderboard$/.exec(path);
  if (m) return { name: 'leaderboard', slug: part(m[1]) };
  m = /^\/bounty\/([^/]+)$/.exec(path);
  if (m) return { name: 'bounty', slug: part(m[1]) };
  m = /^\/u\/([^/]+)$/.exec(path);
  if (m) return { name: 'profile', handle: part(m[1]) };
  return path === '/' ? { name: 'board' } : { name: 'missing' };
}

function mountMissing(root) {
  root.innerHTML = empty('Page not found', 'There is no page at this address.', '<p><a class="btn" href="#/">back to open bounties</a></p>');
  return () => {};
}

async function mountRoute(route, root) {
  switch (route.name) {
    case 'board':
      return mountBoard(root);
    case 'bounty':
      return (await import('./bounty.js')).mountBounty(root, route.slug);
    case 'leaderboard':
      return (await import('./leaderboard.js')).mountLeaderboard(root, route.slug);
    case 'profile':
      return (await import('./profile.js')).mountProfile(root, route.handle);
    default:
      return mountMissing(root);
  }
}

async function navigate() {
  const id = ++run;
  teardown();
  teardown = () => {};
  cancelRequests();
  stopTicks();
  window.__shotReady = false;
  document.title = TITLE;
  view.innerHTML = '';
  window.scrollTo(0, 0);

  try {
    const done = await mountRoute(parse(location.hash), view);
    if (id !== run) return done?.();
    teardown = done || teardown;
    await imagesReady(view);
  } catch (err) {
    if (id !== run || err.name === 'AbortError') return;
    view.innerHTML = failure(err);
    armRetry(view, err, navigate);
  }
  if (id === run) window.__shotReady = true;
}

document.querySelector('.skip').addEventListener('click', (e) => {
  e.preventDefault();
  view.focus();
});
window.addEventListener('hashchange', navigate);
navigate();
