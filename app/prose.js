import { esc } from './ui.js';

const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

export function prose(md = '') {
  const out = [];
  let list = null;
  let code = null;
  for (const line of String(md).split('\n')) {
    if (code !== null) {
      if (line.trim().startsWith('```')) {
        out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
        code = null;
      } else code.push(line);
      continue;
    }
    if (line.trim().startsWith('```')) {
      list = null;
      code = [];
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (heading) {
      list = null;
      const level = Math.min(heading[1].length + 2, 5);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (bullet) {
      if (!list) {
        list = [];
        out.push(list);
      }
      list.push(`<li>${inline(bullet[1])}</li>`);
    } else if (line.trim()) {
      list = null;
      out.push(`<p>${inline(line)}</p>`);
    } else {
      list = null;
    }
  }
  if (code !== null) out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
  return out.map((b) => (Array.isArray(b) ? `<ul>${b.join('')}</ul>` : b)).join('');
}
