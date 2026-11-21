/* Caption helper for Practice with Sharaf (Cloudflare Worker).
 *
 * The website cannot read YouTube captions itself (the browser blocks it), so it asks this helper:
 *   GET /captions?v=<YouTube link or video id>&lang=en|es   (default en)
 * Answer (JSON):
 *   { id, title, lang, auto, words: [{ t, d, w }] }   t = start (seconds), d = length (seconds), w = text
 *   or { error: "no-captions" | "not-found" | "blocked" | "bad-link" | "failed", message }
 *
 * Captions in the asked language only (English or Spanish). Captions written by people are preferred over automatic ones.
 * This uses YouTube's own (unofficial) player address, the same one the YouTube Android app uses,
 * so it can stop working if YouTube changes it. The website then falls back to pasting the transcript.
 */

const ALLOWED_ORIGINS = [
  'https://ehsansharafianm.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
];

const ANDROID = { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 34, hl: 'en', gl: 'US' };
const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const json = (body, status = 200, extra = {}) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', ...extra } });

    if (url.pathname === '/' || url.pathname === '/health') return json({ ok: true, service: 'captions' });
    if (url.pathname !== '/captions') return json({ error: 'not-found', message: 'Unknown address.' }, 404);

    const id = videoId(url.searchParams.get('v') || '');
    const lang = LANGS[url.searchParams.get('lang')] ? url.searchParams.get('lang') : 'en';
    if (!id) return json({ error: 'bad-link', message: 'This does not look like a YouTube link.' }, 400);

    // Same video again within a day: answer from Cloudflare's cache.
    const cache = caches.default;
    const cacheKey = new Request(`https://captions.cache/${lang}/${id}`);
    const hit = await cache.match(cacheKey);
    if (hit) return json(await hit.json(), 200, { 'X-Cache': 'hit' });

    try {
      const result = await getCaptions(id, lang);
      if (result.error) return json(result, result.error === 'not-found' ? 404 : 422);
      ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(result), { headers: { 'Cache-Control': 'max-age=86400' } })));
      return json(result);
    } catch (e) {
      return json({ error: 'failed', message: 'Could not get the captions right now. Please paste the transcript instead.', detail: String(e && e.message || e) }, 502);
    }
  }
};

// Accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID, or the bare 11-character id.
export function videoId(s) {
  s = String(s).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let u;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s); } catch (e) { return ''; }
  const host = u.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id = '';
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/) || [])[1] || '';
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
}

async function playerResponse(id) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': ANDROID_UA, 'Accept-Language': 'en-US,en;q=0.9' },
    body: JSON.stringify({ context: { client: ANDROID }, videoId: id, contentCheckOk: true, racyCheckOk: true })
  });
  if (!res.ok) throw new Error('player ' + res.status);
  return res.json();
}

const LANGS = { en: { name: 'English', best: /^en(-US)?$/i }, es: { name: 'Spanish', best: /^es(-ES)?$/i } };

async function getCaptions(id, lang = 'en') {
  const L = LANGS[lang];
  const p = await playerResponse(id);
  const status = (p.playabilityStatus || {}).status;
  if (status === 'ERROR') return { error: 'not-found', message: 'This video was not found. Check the link.' };
  if (status === 'LOGIN_REQUIRED' && !p.captions) return { error: 'blocked', message: 'YouTube did not allow the captions to be read right now. Please paste the transcript instead.' };
  const tracks = (((p.captions || {}).playerCaptionsTracklistRenderer || {}).captionTracks) || [];
  const en = tracks.filter((t) => new RegExp('^' + lang + '\\b', 'i').test(t.languageCode || ''));
  if (!en.length) {
    return tracks.length
      ? { error: 'no-captions', none: false, message: `This video has captions, but not in ${L.name}.` }
      : { error: 'no-captions', none: true, message: 'YouTube has no captions for this video, not even automatic ones, so there are no sentences to find. This often happens with Shorts and short clips.' };
  }
  // people-made captions first, then automatic ones; en-US / es-ES before other kinds of the language
  const score = (t) => (t.kind === 'asr' ? 0 : 10) + (L.best.test(t.languageCode) ? 2 : 0);
  const track = en.sort((a, b) => score(b) - score(a))[0];
  const base = track.baseUrl.replace(/&fmt=[^&]*/g, '');
  const get = async (fmt) => {
    const res = await fetch(base + (fmt ? '&fmt=' + fmt : ''), { headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' } });
    return res.ok ? (await res.text()).trim() : '';
  };
  // json3 first; YouTube sometimes sends it empty, so then try again and fall back to the srv3 (XML) format
  let words = [];
  let text = await get('json3');
  if (!text) text = await get('json3');
  if (text) words = wordsFromJson3(JSON.parse(text));
  else {
    const xml = (await get('srv3')) || (await get(''));
    if (!xml) return { error: 'blocked', message: 'YouTube did not send the captions right now. Please paste the transcript instead.' };
    words = wordsFromXml(xml);
  }
  if (!words.length) return { error: 'no-captions', message: 'The captions of this video are empty.' };
  return {
    id,
    title: ((p.videoDetails || {}).title) || '',
    lang: track.languageCode,
    auto: track.kind === 'asr',
    words
  };
}

// json3: events with segs. Automatic captions give one seg per word with its own time (tOffsetMs);
// people-made captions give one seg per line. Either way, return small pieces with start times.
function wordsFromJson3(data) {
  const out = [];
  (data.events || []).forEach((ev) => {
    if (!ev.segs || ev.tStartMs === undefined) return;
    const start = ev.tStartMs / 1000, dur = (ev.dDurationMs || 0) / 1000;
    const segs = ev.segs.filter((s) => s.utf8 && s.utf8 !== '\n');
    segs.forEach((s, i) => {
      const w = s.utf8.replace(/\s+/g, ' ').trim();
      if (!w) return;
      const t = start + (s.tOffsetMs || 0) / 1000;
      const next = segs[i + 1];
      const end = next && next.tOffsetMs !== undefined ? start + next.tOffsetMs / 1000 : start + dur;
      out.push({ t: round(t), d: round(Math.max(0.05, end - t)), w: decode(w) });
    });
  });
  return out;
}
// srv3: <p t="ms" d="ms">text or <s t="offset ms">word</s>…</p>; the older format: <text start="s" dur="s">text</text>
function wordsFromXml(xml) {
  const out = [];
  const ps = [...xml.matchAll(/<p\b[^>]*\bt="(\d+)"[^>]*?(?:\bd="(\d+)")?[^>]*>([\s\S]*?)<\/p>/g)];
  ps.forEach(([, t, d, body]) => {
    const start = +t / 1000, dur = (+d || 0) / 1000;
    const segs = [...body.matchAll(/<s\b[^>]*?(?:\bt="(\d+)")?[^>]*>([\s\S]*?)<\/s>/g)];
    if (!segs.length) {
      const w = decode(body.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (w) out.push({ t: round(start), d: round(Math.max(0.05, dur)), w });
      return;
    }
    segs.forEach(([, off, txt], i) => {
      const w = decode(txt.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
      if (!w) return;
      const s = start + (+off || 0) / 1000;
      const nx = segs[i + 1] && segs[i + 1][1] !== undefined ? start + +segs[i + 1][1] / 1000 : start + dur;
      out.push({ t: round(s), d: round(Math.max(0.05, nx - s)), w });
    });
  });
  if (!out.length) {
    [...xml.matchAll(/<text\b[^>]*\bstart="([\d.]+)"[^>]*?(?:\bdur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g)].forEach(([, st, du, txt]) => {
      const w = decode(decode(txt)).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (w) out.push({ t: round(+st), d: round(Math.max(0.05, +du || 2)), w });
    });
  }
  return out;
}
const round = (x) => Math.round(x * 100) / 100;
function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
