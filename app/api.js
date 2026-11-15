const BASE = 'https://make.fun/api';
const FRESH_MS = 60_000;
const inflight = new Map();
let controller = new AbortController();

export class ApiError extends Error {
  constructor(status, retryAfter) {
    super(`make.fun answered ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function cancelRequests() {
  controller.abort();
  controller = new AbortController();
  inflight.clear();
}

export function peek(path) {
  try {
    return JSON.parse(sessionStorage.getItem(`mf:v1:${path}`));
  } catch {
    return null;
  }
}

function save(path, record) {
  try {
    sessionStorage.setItem(`mf:v1:${path}`, JSON.stringify(record));
  } catch {
    // storage full or disabled: the page still works, just uncached
  }
}

async function download(path, cached) {
  const headers = { Accept: 'application/json' };
  if (cached?.etag) headers['If-None-Match'] = cached.etag;
  const res = await fetch(BASE + path, { headers, signal: controller.signal });
  if (res.status === 304 && cached) {
    save(path, { ...cached, at: Date.now() });
    return cached.data;
  }
  if (!res.ok) throw new ApiError(res.status, Number(res.headers.get('Retry-After')) || 0);
  const data = await res.json();
  save(path, { at: Date.now(), etag: res.headers.get('ETag'), data });
  return data;
}

export function get(path, { force = false } = {}) {
  const cached = peek(path);
  if (!force && cached && Date.now() - cached.at < FRESH_MS) return Promise.resolve(cached.data);
  if (!inflight.has(path)) {
    const pending = download(path, force ? null : cached).finally(() => {
      if (inflight.get(path) === pending) inflight.delete(path);
    });
    inflight.set(path, pending);
  }
  return inflight.get(path);
}

export async function fetchView(path, paint) {
  const cached = peek(path);
  if (cached) paint(cached.data);
  const data = await get(path);
  if (!cached || Date.now() - cached.at >= FRESH_MS) paint(data);
  return data;
}
