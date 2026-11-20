/* Shadowing Practice — Practice English with Ehsan Platform
 * The learner adds a sentence (typed or said), listens to an American voice, then repeats it.
 * The page checks the words (browser speech recognition, Chrome/Edge), the melody at the end of the
 * sentence (pitch from the recording), how lively the voice is, and the speed. Everything except the
 * speech recognition runs in the browser.
 * Guests: saved in this browser. Signed-in students: also saved to their account (field "shad").
 * A sentence with fav: true is one of the learner's favorites (the ⭐ Favorites tab).
 */
(() => {
  'use strict';

  const MAX_WORDS = 20;
  const POINTS = 10;          // per try with a match of 80% or more
  const STORE_KEY = 'shadowing-v1';
  let storeKey = STORE_KEY;
  let cloudOK = false;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const clean = (s) => String(s || '').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

  // ---------- storage ----------
  function load(key = storeKey) {
    try { const d = JSON.parse(localStorage.getItem(key) || 'null'); if (d) return { sentences: d.sentences || [], days: d.days || {} }; } catch (e) { /* ignore */ }
    return { sentences: [], days: {} };
  }
  let db = load();
  let cloudTimer = null;
  function save() {
    try { localStorage.setItem(storeKey, JSON.stringify(db)); } catch (e) { /* ignore */ }
    if (window.PEWE && window.PEWE.user && cloudOK) { clearTimeout(cloudTimer); cloudTimer = setTimeout(flushCloud, 1500); }
  }
  function flushCloud() {
    clearTimeout(cloudTimer); cloudTimer = null;
    if (window.PEWE && window.PEWE.user && cloudOK && window.PEWE.saveShad) window.PEWE.saveShad(db).catch((e) => console.warn('Cloud save failed', e));
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && cloudTimer) flushCloud(); });
  const key = (t) => clean(t).toLowerCase().replace(/[^a-z0-9' ]/g, '');
  function merge(a, b) {
    const out = { sentences: (a.sentences || []).map((s) => ({ ...s })), days: JSON.parse(JSON.stringify(a.days || {})) };
    (b.sentences || []).forEach((s) => {
      const x = out.sentences.find((y) => key(y.text) === key(s.text));
      if (!x) out.sentences.push({ ...s });
      else { if (s.fav) x.fav = true; x.tries = Math.max(x.tries || 0, s.tries || 0); x.best = Math.max(x.best || 0, s.best || 0); if ((s.lastAt || 0) > (x.lastAt || 0)) { x.last = s.last; x.lastAt = s.lastAt; } }
    });
    Object.entries(b.days || {}).forEach(([k, v]) => {
      const d = out.days[k] || (out.days[k] = {});
      ['tries', 'correct', 'score', 'newWords', 'sum'].forEach((f) => { d[f] = Math.max(d[f] || 0, v[f] || 0); });
    });
    return out;
  }
  document.addEventListener('pewe-auth', async (e) => {
    const user = e.detail.user;
    clearTimeout(cloudTimer); cloudOK = false;
    if (user) {
      storeKey = STORE_KEY + ':' + user.uid;
      let cloud = null;
      try { cloud = await window.PEWE.load(); cloudOK = true; } catch (err) { console.warn('Could not load account data', err); }
      db = merge(merge((cloud && cloud.shad) || { sentences: [], days: {} }, load(storeKey)), load(STORE_KEY));
      try { localStorage.removeItem(STORE_KEY); } catch (err) { /* ignore */ }
      save();
      if (cloudOK) flushCloud();
    } else { storeKey = STORE_KEY; db = load(storeKey); }
    refresh();
  });
  function day() { const k = todayKey(); return db.days[k] || (db.days[k] = { tries: 0, correct: 0, score: 0, newWords: 0, sum: 0 }); }
  function updateChip() { $('chipScore').textContent = (db.days[todayKey()] || {}).score || 0; }
  const findSentence = (t) => db.sentences.find((s) => key(s.text) === key(t));

  // ---------- words, stress and the expected melody ----------
  const FUNCTION = new Set(('a an the and or but if so as at by for from in into of off on onto out over to up with about than then that this these those ' +
    'there here is are was were be been being am do does did have has had will would shall should can could may might must ' +
    'i you he she it we they me him her us them my your his its our their it\'s i\'m you\'re he\'s she\'s we\'re they\'re ' +
    'i\'ll you\'ll we\'ll i\'ve you\'ve we\'ve i\'d you\'d a.m. p.m. just').split(' '));
  const WH = new Set(['what', 'where', 'when', 'why', 'who', 'whom', 'whose', 'which', 'how']);
  const AUX = new Set(['do', 'does', 'did', 'is', 'are', 'was', 'were', 'am', 'can', 'could', 'will', 'would', 'should', 'shall', 'have', 'has', 'had', 'may', 'might', 'must',
    "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't", "can't", "couldn't", "won't", "wouldn't", "shouldn't", "haven't", "hasn't"]);
  const core = (w) => w.toLowerCase().replace(/[‘’]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
  const wordsOf = (t) => clean(t).split(' ').filter((w) => core(w));
  function expectedTune(text) {
    const t = clean(text), first = core(t.split(' ')[0] || '');
    if (/\?\s*$/.test(t)) {
      if (WH.has(first)) return { end: 'fall', why: 'This is a <b>wh- question</b> (what, where, how…): the voice <b>falls</b> at the end ↘.' };
      return { end: 'rise', why: AUX.has(first) ? 'This is a <b>yes/no question</b>: the voice <b>rises</b> at the end ↗.' : 'This is a question: the voice <b>rises</b> at the end ↗.' };
    }
    if (/[,;:]\s*$/.test(t) || !/[.!?]["'”’)\]]*\s*$/.test(t)) return { end: 'rise', soft: true, why: 'This part continues the sentence: keep your voice <b>up</b> (or a small rise ↗). Don\'t let it fall yet.' };
    if (/!\s*$/.test(t)) return { end: 'fall', why: 'This is an exclamation: strong stress, and the voice <b>falls</b> at the end ↘.' };
    return { end: 'fall', why: 'This is a <b>statement</b>: the voice <b>falls</b> at the end ↘.' };
  }
  function sentenceHtml(text) {
    const tune = expectedTune(text);
    const toks = clean(text).split(' ');
    let pos = 0;
    const src = clean(text);
    return toks.map((w, i) => {
      const start = src.indexOf(w, pos); pos = start + w.length;
      const c = core(w);
      const content = c && !FUNCTION.has(c);
      const comma = /,$/.test(w) && i < toks.length - 1 ? '<span class="tune-arrow small" title="Small rise: the sentence goes on">↗</span>' : '';
      const end = i === toks.length - 1 ? `<span class="tune-arrow" title="${tune.end === 'rise' ? 'Rise' : 'Fall'} at the end">${tune.end === 'rise' ? '↗' : '↘'}</span>` : '';
      return `<span class="sw${content ? ' content' : ''}" data-s="${start}" data-e="${start + w.length}">${esc(w)}</span>${comma}${end}`;
    }).join(' ');
  }

  // ---------- voices ----------
  const canSpeak = 'speechSynthesis' in window;
  const FEMALE = /\b(female|woman|zira|aria|jenny|michelle|ana|emma|ava|allison|samantha|susan|joanna|salli|ivy|kendra|nancy|sara|jane|amber|ashley|cora|elizabeth|monica|google us english)\b/i;
  const quality = (v) => (/natural|online|neural/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 1 : 0);
  const VOICE_KEY = 'pewe-shadow-voice';
  function usVoices() { return canSpeak ? speechSynthesis.getVoices().filter((v) => /^en[-_]US/i.test(v.lang)).sort((a, b) => quality(b) - quality(a) || a.name.localeCompare(b.name)) : []; }
  const label = (v) => v.name.replace(/^(Microsoft|Google)\s+/, '').replace(/\s*-\s*English.*$/, '').replace(/\s*\(.*\)\s*$/, '') + (FEMALE.test(v.name) ? ' (woman)' : ' (man)') + (quality(v) >= 3 ? ' ★ natural' : '');
  function fillVoices() {
    const sel = $('voiceSel'), list = usVoices();
    let saved = ''; try { saved = localStorage.getItem(VOICE_KEY) || ''; } catch (e) { /* ignore */ }
    const cur = sel.value || saved;
    sel.innerHTML = list.map((v) => `<option value="${esc(v.name)}">${esc(label(v))}</option>`).join('') || '<option value="">Default voice</option>';
    if (list.some((v) => v.name === cur)) sel.value = cur;
    const natural = list.some((v) => quality(v) >= 3);
    $('voiceNote').innerHTML = !canSpeak ? 'This browser cannot read sentences aloud. Try Microsoft Edge or Chrome.'
      : natural ? 'Voices marked ★ are natural voices with the most human-like intonation.'
      : 'Tip: for the most natural American voices and intonation, open this page in <b>Microsoft Edge</b>. It has free natural voices (Aria, Jenny, Guy, Andrew…).';
  }
  if (canSpeak) { speechSynthesis.addEventListener('voiceschanged', fillVoices); speechSynthesis.getVoices(); }
  $('voiceSel').addEventListener('change', () => { try { localStorage.setItem(VOICE_KEY, $('voiceSel').value); } catch (e) { /* ignore */ } });

  // Reads the sentence, lighting up each word as it is spoken. Resolves when the voice has finished.
  function speak(text, box = '#sShow') {
    return new Promise((resolve) => {
      if (!canSpeak || !text) return resolve(0);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean(text));
      const v = usVoices().find((x) => x.name === $('voiceSel').value) || usVoices()[0];
      if (v) u.voice = v;
      u.lang = 'en-US';
      u.rate = $('slowBox').checked ? 0.7 : 0.95;
      const spans = [...document.querySelectorAll(box + ' .sw')];
      const mark = (i) => spans.forEach((s) => s.classList.toggle('now', +s.dataset.s <= i && i < +s.dataset.e));
      u.onboundary = (e) => { if (e.name === 'word' || e.name === undefined) mark(e.charIndex); };
      const t0 = performance.now();
      let done = false;
      const end = () => { if (done) return; done = true; spans.forEach((s) => s.classList.remove('now')); resolve((performance.now() - t0) / 1000); };
      u.onend = end; u.onerror = end;
      speechSynthesis.speak(u);
      setTimeout(end, 30000);
    });
  }

  // ---------- microphone: recognition + recording ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  let mic = null;
  function micMessage(error) {
    return {
      'not-allowed': 'Please allow the microphone for this site (click the lock icon in the address bar), then try again.',
      'service-not-allowed': 'Please allow the microphone for this site, then try again.',
      'no-speech': 'I did not hear anything. Try again and speak clearly.',
      'audio-capture': 'No microphone found.',
      network: 'Checking your speech needs an internet connection.'
    }[error] || '';
  }
  // Records once (and recognises, when the browser can). maxSec stops it in any case.
  function listenOnce(maxSec, { record = true } = {}) {
    return new Promise(async (resolve) => {
      let stream = null, rec = null, chunks = [], heard = '', error = '', audio = null;
      let recDone = !(record && canRecord), recogDone = !SR, finished = false, recog = null, timer = null;
      const finish = () => {
        if (finished || !recDone || !recogDone) return;
        finished = true; mic = null; clearTimeout(timer);
        if (stream) stream.getTracks().forEach((t) => t.stop());
        resolve({ heard, audio, error });
      };
      const stopAll = () => {
        try { if (recog) recog.stop(); } catch (e) { /* ignore */ }
        try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) { recDone = true; }
        finish();
      };
      if (record && canRecord) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: false, noiseSuppression: true, echoCancellation: true } });
          rec = new MediaRecorder(stream);
          rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
          rec.onstop = () => { if (chunks.length) audio = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); recDone = true; finish(); };
          rec.start();
        } catch (e) { return resolve({ heard: '', audio: null, error: 'not-allowed' }); }
      }
      if (SR) {
        recog = new SR();
        recog.lang = 'en-US'; recog.interimResults = false; recog.continuous = false; recog.maxAlternatives = 1;
        recog.onresult = (e) => { heard = Array.from(e.results).map((r) => r[0].transcript).join(' '); };
        recog.onerror = (e) => { error = e.error; };
        recog.onend = () => { recogDone = true; try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) { recDone = true; } finish(); };
        try { recog.start(); } catch (e) { recogDone = true; }
      }
      timer = setTimeout(stopAll, maxSec * 1000);
      mic = { stop: stopAll };
    });
  }

  // ---------- add a sentence ----------
  function countWords() {
    const n = wordsOf($('sText').value).length;
    $('sCount').textContent = n;
    $('sCount').parentElement.classList.toggle('over', n > MAX_WORDS);
  }
  $('sMax').textContent = MAX_WORDS;
  $('sText').addEventListener('input', () => { countWords(); $('sMsg').classList.add('hidden'); });
  function tidy(t) {
    t = clean(t);
    if (!t) return t;
    t = t[0].toUpperCase() + t.slice(1);
    if (!/[.?!]$/.test(t)) {
      const first = core(t.split(' ')[0]);
      t += WH.has(first) || AUX.has(first) ? '?' : '.';
    }
    return t;
  }
  function message(html) { $('sMsg').innerHTML = html; $('sMsg').classList.remove('hidden'); }
  $('sForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = clean($('sText').value);
    const n = wordsOf(raw).length;
    if (!n) return message('Please type a sentence first.');
    if (n > MAX_WORDS) return message(`Please keep it to ${MAX_WORDS} words or fewer (now ${n}). Shorter sentences are easier to shadow well.`);
    if (n < 2) return message('Please type a whole sentence. For single words, use the Pronunciation page.');
    const text = tidy(raw);
    $('sText').value = text; countWords();
    $('sMsg').classList.add('hidden');
    let s = findSentence(text);
    if (!s) { s = { id: uid(), text, added: todayKey(), tries: 0, best: 0, last: null }; db.sentences.push(s); day().newWords++; save(); updateChip(); }
    open(s);
  });
  let sayBusy = false;
  $('sSay').addEventListener('click', async () => {
    if (!SR) return message('Saying a sentence works in Chrome and Edge. Please type it instead.');
    if (sayBusy) { if (mic) mic.stop(); return; }
    sayBusy = true;
    if (canSpeak) speechSynthesis.cancel();
    const btn = $('sSay');
    btn.classList.add('on'); btn.textContent = '👂 Listening… (click to stop)';
    $('sMsg').classList.add('hidden');
    const r = await listenOnce(20, { record: false });
    sayBusy = false;
    btn.classList.remove('on'); btn.textContent = '🎙️ Say a sentence';
    if (!r.heard) return message(esc(micMessage(r.error) || 'I could not catch a sentence. Try again, or type it.'));
    const words = wordsOf(r.heard).slice(0, MAX_WORDS).join(' ');
    $('sText').value = tidy(words); countWords();
    message(`🎙️ I heard: <b>${esc(tidy(words))}</b><br><span class="muted">Check the text and fix it if needed. The end mark (. or ?) decides the melody. Then click “Add sentence”.</span>
      <div class="row" style="margin-top:8px"><button type="button" class="btn primary small" id="sUseHeard">✓ Yes, add it</button>
      <button type="button" class="btn ghost small" id="sSayAgain">🎙️ Say it again</button></div>`);
    $('sUseHeard').onclick = () => $('sForm').requestSubmit();
    $('sSayAgain').onclick = () => $('sSay').click();
  });

  // ---------- shadowing ----------
  let cur = null, queue = [], lastAudio = null;
  function open(s, { fromQueue = false } = {}) {
    cur = s;
    if (!fromQueue) queue = [];
    $('shadow').classList.remove('hidden');
    $('voiceSlotOne').appendChild($('voiceBox'));
    $('sShow').innerHTML = sentenceHtml(s.text);
    const tune = expectedTune(s.text);
    $('sTune').innerHTML = `${tune.why} <b>Bold</b> words carry the stress: say them a little louder, longer and higher.`;
    $('sResult').innerHTML = ''; $('sStatus').textContent = '';
    $('sMine').classList.add('hidden');
    $('sNext').classList.toggle('hidden', !queue.length);
    favButton();
    fillVoices();
    $('shadow').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('sListen').addEventListener('click', () => { if (cur) speak(cur.text); });
  let running = false;
  $('sGo').addEventListener('click', async () => {
    if (!cur) return;
    if (running) { if (mic) mic.stop(); if (canSpeak) speechSynthesis.cancel(); return; }
    if (!SR && !canRecord) { $('sStatus').textContent = 'Recording is not supported in this browser. Try Chrome or Edge.'; return; }
    running = true;
    const go = $('sGo');
    go.classList.add('on');
    $('sResult').innerHTML = ''; $('sMine').classList.add('hidden');
    const along = $('alongBox').checked;
    const est = Math.max(2, wordsOf(cur.text).length * 0.45 * ($('slowBox').checked ? 1.4 : 1));
    let r;
    if (along) {
      go.textContent = '🗣️ Speak along now… (click to stop)';
      $('sStatus').textContent = 'Speak together with the voice.';
      const p = listenOnce(est * 2 + 6);
      await speak(cur.text);
      setTimeout(() => { if (mic) mic.stop(); }, 1500);
      r = await p;
      $('tDoneSpeak').classList.add('hidden');
    } else {
      go.textContent = '👂 Listen…';
      $('sStatus').textContent = 'Listen to the voice…';
      const modelSec = await speak(cur.text);
      go.textContent = '🎙️ Your turn! (click to stop)';
      $('sStatus').innerHTML = '<b>Your turn:</b> say the sentence now, the same way.';
      r = await listenOnce(Math.max(modelSec, est) * 2 + 4);
    }
    running = false;
    go.classList.remove('on'); go.textContent = '🔁 Listen, then repeat again';
    $('sStatus').textContent = '';
    if (lastAudio) URL.revokeObjectURL(lastAudio);
    lastAudio = r.audio;
    $('sMine').classList.toggle('hidden', !r.audio);
    if (r.error && !r.heard && micMessage(r.error)) { $('sResult').innerHTML = `<p class="feedback wrong">${esc(micMessage(r.error))}</p>`; return; }
    $('sStatus').textContent = 'Checking…';
    let a = null;
    if (r.audio) { try { a = await analyse(r.audio); } catch (e) { console.warn('Analysis failed', e); } }
    $('sStatus').textContent = '';
    $('sResult').innerHTML = (await scoreTry(cur, r.heard, a, !!SR)).html;
  });
  let audioEl = null;
  $('sMine').addEventListener('click', () => { if (!lastAudio) return; if (audioEl) audioEl.pause(); audioEl = new Audio(lastAudio); audioEl.play().catch(() => {}); });
  $('sNext').addEventListener('click', () => { const s = queue.shift(); if (s) open(s, { fromQueue: true }); });
  // ☆ / ★ on the shadowing card. The sentence must be in My sentences to be a favorite.
  function favButton() {
    const on = !!(cur && cur.fav);
    $('sFav').textContent = on ? '★ In favorites' : '☆ Add to favorites';
    $('sFav').classList.toggle('on-fav', on);
  }
  $('sFav').addEventListener('click', () => {
    if (!cur) return;
    let s = findSentence(cur.text);
    if (!s) { s = { id: uid(), text: cur.text, added: todayKey(), tries: 0, best: 0, last: null }; db.sentences.push(s); day().newWords++; }
    s.fav = !s.fav; cur = s;
    save(); favButton();
  });

  // ---------- comparing the words ----------
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const EXPAND = { "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "it's": 'it is', "that's": 'that is', "he's": 'he is', "she's": 'she is',
    "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', 'cannot': 'can not', "won't": 'will not', "isn't": 'is not', "aren't": 'are not',
    "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "i've": 'i have', "you've": 'you have', "we've": 'we have', "i'd": 'i would', "let's": 'let us', "what's": 'what is', "where's": 'where is' };
  // each target word -> list of comparable tokens
  function normToks(text) {
    return wordsOf(text).map((w) => {
      let c = core(w);
      if (/^\d+$/.test(c) && +c < NUM.length) c = NUM[+c];
      return (EXPAND[c] || c).split(' ');
    });
  }
  function compareWords(target, heard) {
    const T = normToks(target), H = normToks(heard).flat();
    const flat = [], owner = [];
    T.forEach((parts, i) => parts.forEach((p) => { flat.push(p); owner.push(i); }));
    // longest common subsequence
    const n = flat.length, m = H.length, L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = flat[i] === H[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const hit = new Array(n).fill(false);
    let i = 0, j = 0;
    while (i < n && j < m) { if (flat[i] === H[j]) { hit[i] = true; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    const ok = T.map(() => true);
    hit.forEach((h, k) => { if (!h) ok[owner[k]] = false; });
    const used = new Array(m).fill(false);
    { let a = 0, b = 0; while (a < n && b < m) { if (flat[a] === H[b]) { used[b] = true; a++; b++; } else if (L[a + 1][b] >= L[a][b + 1]) a++; else b++; } }
    return { ok, extra: Math.max(0, m - L[0][0]), unused: H.filter((h, k) => !used[k]) };
  }
  // Words that sound the same count as right ("sea" heard as "see"), using the Pronunciation page's US dictionary.
  const shards = {};
  async function sounds(word) {
    const w = word.toLowerCase(), k = w[0] >= 'a' && w[0] <= 'z' ? w[0] : '0';
    if (!shards[k]) shards[k] = fetch('../pronunciation/data/' + k + '.txt').then((r) => (r.ok ? r.text() : '')).catch(() => '').then((t) => {
      const m = new Map(); t.split(String.fromCharCode(10)).forEach((line) => { const i = line.indexOf(String.fromCharCode(9)); if (i > 0) m.set(line.slice(0, i), line.slice(i + 1).split(';').map((v) => v.replace(/[.\d]/g, '').replace(/ +/g, ' ').trim())); });
      return m;
    });
    return (await shards[k]).get(w) || [];
  }
  async function fixHomophones(target, cmp) {
    const toks = wordsOf(target);
    for (let i = 0; i < toks.length; i++) {
      if (cmp.ok[i] || !cmp.unused.length) continue;
      const a = await sounds(core(toks[i]));
      if (!a.length) continue;
      for (let j = 0; j < cmp.unused.length; j++) {
        const b = await sounds(cmp.unused[j]);
        if (b.some((x) => a.includes(x))) { cmp.ok[i] = true; cmp.unused.splice(j, 1); cmp.extra = Math.max(0, cmp.extra - 1); break; }
      }
    }
    return cmp;
  }

  // ---------- voice analysis: melody (pitch), liveliness, speed ----------
  async function decode(url) {
    const buf = await (await fetch(url)).arrayBuffer();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    try { return await ctx.decodeAudioData(buf); } finally { if (ctx.close) ctx.close(); }
  }
  function toMono16k(ab) {
    const step = Math.max(1, Math.round(ab.sampleRate / 16000)), sr = ab.sampleRate / step;
    const n = Math.floor(ab.length / step), x = new Float32Array(n), ch = ab.numberOfChannels;
    for (let c = 0; c < ch; c++) { const d = ab.getChannelData(c); for (let i = 0; i < n; i++) { let s = 0; for (let k = 0; k < step; k++) s += d[i * step + k] || 0; x[i] += s / step / ch; } }
    return { x, sr };
  }
  function pitchOf(x, start, len, sr) {
    const minLag = Math.floor(sr / 400), maxLag = Math.floor(sr / 70);
    if (start + len + maxLag >= x.length) return 0;
    let e0 = 0; for (let i = 0; i < len; i++) e0 += x[start + i] * x[start + i];
    if (e0 <= 1e-9) return 0;
    let best = 0, bestLag = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let c = 0, e1 = 0;
      for (let i = 0; i < len; i++) { const b = x[start + i + lag]; c += x[start + i] * b; e1 += b * b; }
      const r = c / Math.sqrt(e0 * e1 || 1);
      if (r > best) { best = r; bestLag = lag; }
    }
    return best > 0.5 ? sr / bestLag : 0;
  }
  function analyseSignal(x, sr) {
    const hop = Math.round(sr * 0.02), win = Math.round(sr * 0.04);
    const F = Math.max(0, Math.floor((x.length - win - Math.floor(sr / 70)) / hop));
    const rms = new Float32Array(F);
    for (let f = 0; f < F; f++) { let s = 0; for (let i = 0; i < win; i++) { const t = x[f * hop + i]; s += t * t; } rms[f] = Math.sqrt(s / win); }
    let max = 0; rms.forEach((t) => { if (t > max) max = t; });
    if (max < 0.003) return { quiet: true };
    let a = 0, b = F - 1;
    while (a < F && rms[a] < max * 0.08) a++;
    while (b > a && rms[b] < max * 0.08) b--;
    if (b - a < 10) return { quiet: true };
    const pts = [];
    for (let f = a; f <= b; f++) if (rms[f] > max * 0.12) { const p = pitchOf(x, f * hop, win, sr); if (p) pts.push({ t: (f - a) * hop / sr, hz: p }); }
    if (pts.length < 8) return { quiet: false, seconds: (b - a) * hop / sr, pts: [], noPitch: true };
    const hz = pts.map((p) => p.hz).sort((u, v) => u - v), med = hz[Math.floor(hz.length / 2)];
    let st = pts.map((p) => ({ t: p.t, s: 12 * Math.log2(p.hz / med) })).filter((p) => Math.abs(p.s) < 9); // drop octave errors
    st = st.map((p, i) => { const w = st.slice(Math.max(0, i - 2), i + 3).map((q) => q.s).sort((u, v) => u - v); return { t: p.t, s: w[Math.floor(w.length / 2)] }; });
    const mean = st.reduce((p, q) => p + q.s, 0) / st.length;
    const range = Math.sqrt(st.reduce((p, q) => p + (q.s - mean) * (q.s - mean), 0) / st.length);
    // melody at the end: the last voiced stretch (about the last word), and the step into it
    const runs = [];
    st.forEach((p, i) => { if (!i || p.t - st[i - 1].t > 0.07) runs.push([]); runs[runs.length - 1].push(p); });
    let last = runs.pop() || [];
    let prev = runs.pop() || [];
    if (last.length < 5 && prev.length) { last = prev.concat(last); prev = runs.pop() || []; }
    const avg = (arr) => arr.reduce((p, q) => p + q.s, 0) / arr.length;
    const n3 = Math.max(2, Math.min(4, Math.floor(last.length / 3)));
    const inside = avg(last.slice(-n3)) - avg(last.slice(0, n3));
    const step = prev.length >= 2 ? avg(last.slice(0, n3)) - avg(prev.slice(-n3)) : 0;
    const endMove = inside + 0.5 * step;
    const end = inside > 1 ? 'rise' : inside < -1 ? 'fall' : endMove > 1.5 ? 'rise' : endMove < -1.5 ? 'fall' : 'level';
    return { seconds: (b - a) * hop / sr, pts: st, range, endMove, end };
  }
  async function analyse(url) { const { x, sr } = toMono16k(await decode(url)); return analyseSignal(x, sr); }
  window.__peweShadowTest = { analyse, compareWords, expectedTune }; // for developer checks

  let markerN = 0;
  function contourSvg(a, want) {
    const mid = 'ah' + (++markerN);
    const W = 600, H = 120, P = 10;
    const tMax = a.pts[a.pts.length - 1].t || 1;
    const x = (t) => P + (W - 2 * P - 40) * (t / tMax), y = (s) => H / 2 - Math.max(-8, Math.min(8, s)) * (H / 2 - P) / 8;
    const segs = []; let curSeg = [];
    a.pts.forEach((p, i) => { if (i && p.t - a.pts[i - 1].t > 0.12) { segs.push(curSeg); curSeg = []; } curSeg.push(`${x(p.t).toFixed(1)},${y(p.s).toFixed(1)}`); });
    segs.push(curSeg);
    const ex = W - 30, ok = a.end === want;
    const arrow = want === 'rise' ? `M${ex - 14},${H / 2 + 18} L${ex + 10},${H / 2 - 18}` : `M${ex - 14},${H / 2 - 18} L${ex + 10},${H / 2 + 18}`;
    return `<svg class="contour" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Your voice's melody from start to end">
      <line x1="${P}" x2="${W - 40}" y1="${H / 2}" y2="${H / 2}" class="c-mid"/>
      ${segs.filter((s) => s.length > 1).map((s) => `<polyline points="${s.join(' ')}" class="c-line"/>`).join('')}
      <path d="${arrow}" class="c-want${ok ? ' ok' : ''}" marker-end="url(#${mid})"/>
      <defs><marker id="${mid}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="c-head${ok ? ' ok' : ''}"/></marker></defs>
    </svg>`;
  }

  async function scoreTry(s, heard, a, haveSR) {
    const tune = expectedTune(s.text);
    const toks = wordsOf(s.text);
    const tips = [];
    let score = 0, parts = 0;
    let wordsHtml = '';
    if (haveSR) {
      const cmp = await fixHomophones(s.text, compareWords(s.text, heard || ''));
      const got = cmp.ok.filter(Boolean).length;
      parts += 5; score += 5 * (got / toks.length) * (cmp.extra > 2 ? 0.9 : 1);
      wordsHtml = `<div class="s-show small">${toks.map((w, i) => `<span class="sw ${cmp.ok[i] ? 'hit' : 'miss'}">${esc(w)}</span>`).join(' ')}</div>
        <p class="hint">I heard: “${esc(heard || '…')}”</p>`;
      const missed = toks.filter((w, i) => !cmp.ok[i]).map(core);
      if (!heard) tips.push('I could not understand the sentence. Listen again, then say it a bit slower and clearer.');
      else if (missed.length) {
        tips.push(`Words I did not hear clearly: ${missed.map((w) => `<b>${esc(w)}</b>`).join(', ')}.`);
        if (missed.some((w) => FUNCTION.has(w))) tips.push('Small words (to, the, a, of…) are short and quick in English, but they are still said. Link them to the next word.');
      } else tips.push('✓ All the words were clear.');
    }
    let chart = '';
    if (a && a.quiet) tips.push('Your recording was very quiet. Move closer to the microphone and speak up.');
    else if (a && a.noPitch) tips.push('I could not follow your voice melody. Speak a bit louder, in a quiet place.');
    else if (a) {
      parts += 3;
      const endOk = a.end === tune.end || (tune.soft && a.end === 'level');
      score += 3 * (endOk ? 1 : a.end === 'level' ? 0.4 : 0);
      if (endOk) tips.push(tune.soft ? '✓ Good: your voice stayed up, so the sentence sounds unfinished, as it should.' : `✓ Good melody at the end: your voice ${tune.end === 'rise' ? 'rose ↗' : 'fell ↘'}, as it should.`);
      else if (tune.soft) tips.push('Your voice fell here ↘, so it sounds like the end. This part goes on: keep your voice <b>up</b>.');
      else if (tune.end === 'fall') tips.push(a.end === 'rise' ? 'Your voice went <b>up</b> at the end ↗. In this sentence it should go <b>down</b> ↘ on the last stressed word, to sound finished and sure.' : 'Your voice stayed <b>flat</b> at the end. Let it <b>fall</b> ↘ on the last stressed word.');
      else tips.push(a.end === 'fall' ? 'Your voice went <b>down</b> at the end ↘. For a yes/no question, let it go <b>up</b> ↗ on the last word.' : 'Your voice stayed <b>flat</b> at the end. For this question, let it go <b>up</b> ↗ on the last word.');
      if (a.range < 1.6) tips.push('Your voice sounds quite <b>flat</b>. American English goes up and down more: make the <b>bold</b> words higher and louder.');
      parts += 2;
      const wps = toks.length / Math.max(0.5, a.seconds);
      if (wps < 1.5) { score += 1; tips.push('You spoke quite <b>slowly</b>. Try to keep up with the voice and link the words together.'); }
      else if (wps > 5) { score += 1; tips.push('You spoke very <b>fast</b>. Slow down a little and give the bold words more time.'); }
      else score += 2;
      chart = `<div class="contour-wrap">${contourSvg(a, tune.end)}</div>
        <p class="hint sc-key">Your voice melody, from start to end (up = higher). The arrow shows how the end should go: ${tune.end === 'rise' ? 'up ↗' : 'down ↘'}.</p>`;
    }
    const pct = parts ? Math.round((score / parts) * 100) : null;
    if (pct !== null) {
      s.tries = (s.tries || 0) + 1; s.best = Math.max(s.best || 0, pct); s.last = pct; s.lastAt = Date.now();
      const d = day(); d.tries++; d.sum = (d.sum || 0) + pct;
      if (pct >= 80) { d.correct++; d.score += POINTS; }
      save(); updateChip();
    }
    const cls = pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low';
    return { pct, html: `
      ${pct !== null ? `<div class="pscore ${cls}"><span class="pscore-num">${pct}%</span><span class="pscore-lbl">match with the model${pct >= 80 ? ' · +10 points' : ''}</span></div>` : ''}
      ${wordsHtml}${chart}
      ${tips.length ? `<ul class="ptips">${tips.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
      ${!haveSR ? '<p class="hint">Word checking works in Chrome and Edge. Here you can still compare your melody and play back your voice.</p>' : ''}` };
  }


  // =====================================================
  // SHADOW A TEXT: paste or import a text; the page goes through it sentence by sentence on its own:
  // read the sentence, record the learner, score it, then move on to the next one.
  // =====================================================
  const MAX_TEXT_SENTENCES = 60;
  const ABBR = /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|U\.S|U\.K|a\.m|p\.m|No)\.$/i;
  // Split a text into sentences; long ones (more than MAX_WORDS) are cut at commas, or into even parts.
  function splitText(text) {
    const out = [];
    String(text || '').replace(/\r/g, '').split(/\n\s*\n|\n(?=\s*[-•*\d]+[.)]?\s)/).forEach((para) => {
      const flat = clean(para.replace(/\n/g, ' '));
      if (!flat) return;
      let buf = '';
      flat.split(' ').forEach((w) => {
        buf = buf ? buf + ' ' + w : w;
        if (/[.!?]["'”’)\]]*$/.test(w) && !ABBR.test(w.replace(/["'”’)\]]+$/, ''))) { out.push(buf); buf = ''; }
      });
      if (buf) out.push(buf);
    });
    const pieces = [];
    const cut = (s) => {
      const ws = s.split(' ');
      if (wordsOf(s).length <= MAX_WORDS) { pieces.push(s); return; }
      // the comma nearest the middle, keeping both halves at least 3 words
      let best = -1, bestD = Infinity;
      ws.forEach((w, i) => { if (/[,;:]$/.test(w) && i >= 2 && i <= ws.length - 4) { const d = Math.abs(i - ws.length / 2); if (d < bestD) { bestD = d; best = i; } } });
      if (best < 0) { const parts = Math.ceil(ws.length / 15), size = Math.ceil(ws.length / parts); for (let i = 0; i < ws.length; i += size) pieces.push(ws.slice(i, i + size).join(' ')); return; }
      cut(ws.slice(0, best + 1).join(' ')); cut(ws.slice(best + 1).join(' '));
    };
    out.forEach(cut);
    // very short bits (one word) join the one before
    const merged = [];
    pieces.forEach((p) => { if (wordsOf(p).length < 2 && merged.length) merged[merged.length - 1] += ' ' + p; else if (wordsOf(p).length) merged.push(p); });
    return merged;
  }
  function updateTextCount() {
    const n = splitText($('tText').value).length;
    $('tCount').textContent = n ? `${n} sentence${n === 1 ? '' : 's'}${n > MAX_TEXT_SENTENCES ? ` — only the first ${MAX_TEXT_SENTENCES} will be used` : ''}` : '';
  }
  $('tText').addEventListener('input', updateTextCount);
  $('tFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 200000) { $('tMsg').textContent = 'This file is too big. Please use a shorter text (a page or two).'; return; }
    $('tText').value = (await f.text()).replace(/\r/g, '').trim();
    $('tMsg').textContent = $('tText').value ? `Loaded “${f.name}”.` : 'This file has no text in it.';
    updateTextCount();
  });

  const run = { list: [], i: 0, active: false, paused: false, stopping: false, wait: null, results: [] };
  // Score table: one row per sentence with its own buttons; click a row to open its analysis.
  function rowsHtml(tag) {
    return run.list.map((t, k) => {
      const r = run.results[k], now = k === run.i && run.active;
      const cls = r == null ? '' : r.pct === null ? 'muted' : r.pct >= 80 ? 'acc-good' : 'acc-bad';
      const val = r == null ? (now ? '…' : '') : r.pct === null ? 'skipped' : r.pct + '%';
      const open = run.open === k && r && r.html;
      return `<tr class="${now ? 'sel' : ''}${open ? ' open' : ''}" data-k="${k}" title="${r && r.html ? 'Click to see the analysis' : ''}">
        <td>${k + 1}</td><td class="s-text">${esc(t)}${r && r.html ? ` <span class="muted">${open ? '▴' : '▾'}</span>` : ''}</td><td class="${cls}">${val}</td>
        <td class="row-acts">
          <button type="button" class="btn ghost small" data-act="listen" title="Listen to the voice">▶</button>
          <button type="button" class="btn ghost small" data-act="me" title="Hear my voice"${r && r.audio ? '' : ' disabled'}>🎧</button>
          <button type="button" class="btn ghost small" data-act="again" title="Repeat this sentence">🔁</button>
        </td></tr>${open ? `<tr class="row-detail"><td colspan="4">${r.html.replace(/ah(\d+)/g, 'ah$1' + tag)}</td></tr>` : ''}`;
    }).join('');
  }
  function renderRun() {
    $('tTable').querySelector('tbody').innerHTML = rowsHtml('run');
    const sum = $('tSumBody'); if (sum) sum.innerHTML = rowsHtml('sum');
    $('tProgress').textContent = `Sentence ${Math.min(run.i + 1, run.list.length)} of ${run.list.length}`;
    $('tBar').style.width = Math.round((run.results.filter((x) => x).length / run.list.length) * 100) + '%';
    $('tPause').textContent = run.paused ? '▶ Resume' : '⏸ Pause';
  }
  function playAudio(url) { if (!url) return; if (audioEl) audioEl.pause(); audioEl = new Audio(url); audioEl.play().catch(() => {}); }
  // Practise sentence k again: during a run it jumps there; after the run it does just that one, then returns to the results.
  function redoSentence(k) {
    run.results[k] = null; run.open = null;
    if (!run.active) {
      Object.assign(run, { active: true, paused: false, only: true, i: k });
      $('tDone').classList.add('hidden'); $('tRun').classList.remove('hidden');
      $('voiceSlotText').appendChild($('voiceBox'));
      loop(); return;
    }
    if (run.paused) { run.i = k; run.paused = false; loop(); return; }
    run.i = k;
    if (run.phase === 'wait') { run.redo = true; wake(); }
    else { run.redoNow = true; if (canSpeak) speechSynthesis.cancel(); if (mic) mic.stop(); }
  }
  function onRows(e) {
    const tr = e.target.closest('tr[data-k]');
    if (!tr) return;
    const k = +tr.dataset.k, btn = e.target.closest('[data-act]');
    if (btn) {
      if (btn.dataset.act === 'listen') speak(run.list[k], '#none');
      else if (btn.dataset.act === 'me') playAudio((run.results[k] || {}).audio);
      else redoSentence(k);
      return;
    }
    if (run.results[k] && run.results[k].html) { run.open = run.open === k ? null : k; renderRun(); }
  }
  // waits that a button can cut short
  function sleep(ms) { return new Promise((res) => { run.wake = () => { clearTimeout(run.wait); run.wake = null; res(); }; run.wait = setTimeout(run.wake, ms); }); }
  const wake = () => { if (run.wake) run.wake(); };

  $('tStart').addEventListener('click', () => {
    let list = splitText($('tText').value);
    if (!list.length) { $('tMsg').textContent = 'Please paste or import a text first.'; return; }
    if (!SR && !canRecord) { $('tMsg').textContent = 'Recording is not supported in this browser. Try Chrome or Edge.'; return; }
    list = list.slice(0, MAX_TEXT_SENTENCES);
    Object.assign(run, { list, i: 0, active: true, paused: false, only: false, open: null, results: [] });
    $('tMsg').textContent = '';
    $('tSetup').classList.add('hidden'); $('tDone').classList.add('hidden'); $('tRun').classList.remove('hidden');
    $('voiceSlotText').appendChild($('voiceBox'));
    fillVoices();
    loop();
  });
  async function loop() {
    if (run.looping) return;
    run.looping = true;
    try { await loopBody(); } finally { run.looping = false; }
  }
  async function loopBody() {
    while (run.active && run.i < run.list.length) {
      while (!run.only && run.i < run.list.length && run.results[run.i]) run.i++; // already done: go on
      if (run.i >= run.list.length) break;
      if (run.paused) { renderRun(); $('tStatus').innerHTML = 'Paused. Click <b>Resume</b> to go on.'; return; }
      const text = run.list[run.i];
      renderRun();
      $('tShow').innerHTML = sentenceHtml(text);
      $('tTune').innerHTML = expectedTune(text).why;
      $('tResult').innerHTML = '';
      run.phase = 'try';
      const t = await shadowOnce(text, '#tShow', (html) => { $('tStatus').innerHTML = html; });
      if (!run.active) return;
      if (run.redoNow) { run.redoNow = false; continue; }
      if (t.fatal) { $('tStatus').innerHTML = ''; $('tResult').innerHTML = `<p class="feedback wrong">${esc(t.fatal)}</p>`; run.paused = true; renderRun(); return; }
      if (t.skipped) { run.results[run.i] = { pct: null }; $('tStatus').textContent = 'Skipped.'; }
      else {
        let s = $('tSave').checked ? findSentence(text) : null;
        if ($('tSave').checked && !s) { s = { id: uid(), text: /[.!?,;:]$/.test(text) ? text : text + '.', added: todayKey(), tries: 0, best: 0, last: null }; db.sentences.push(s); day().newWords++; }
        const res = await scoreTry(s || { text }, t.heard, t.a, !!SR);
        run.results[run.i] = { pct: res.pct, audio: t.audio, html: res.html };
        $('tResult').innerHTML = res.html;
        $('tStatus').textContent = '';
      }
      if (run.only) { run.only = false; run.i = run.list.length; finishRun(); return; }
      run.i++;
      renderRun();
      if (run.i >= run.list.length || !run.active) break;
      // short break to read the result, then the next sentence starts by itself
      run.phase = 'wait';
      $('tProgress').textContent = `Sentence ${run.i} of ${run.list.length} done`;
      const secs = +$('tGap').value;
      for (let k = secs; k > 0 && run.active && !run.paused && !run.redo; k--) { $('tStatus').innerHTML = `Next sentence in <b>${k}</b>…`; await sleep(1000); }
      run.redo = false;
    }
    if (run.active) finishRun();
  }
  // One try at a sentence: read it, record the learner, analyse. Shared by the text mode.
  async function shadowOnce(text, box, status) {
    const along = $('alongBox').checked;
    const est = Math.max(2, wordsOf(text).length * 0.45 * ($('slowBox').checked ? 1.4 : 1));
    let r;
    if (along) {
      status('🗣️ <b>Speak along</b> with the voice now.');
      $('tDoneSpeak').classList.remove('hidden');
      const p = listenOnce(est * 2 + 6);
      await speak(text, box);
      setTimeout(() => { if (mic) mic.stop(); }, 1500);
      r = await p;
      $('tDoneSpeak').classList.add('hidden');
    } else {
      status('👂 Listen…');
      const modelSec = await speak(text, box);
      if (!run.active || run.skipNow || run.redoNow) { run.skipNow = false; return { skipped: true }; }
      status('🎙️ <b>Your turn:</b> say it now, the same way.');
      $('tDoneSpeak').classList.remove('hidden');
      r = await listenOnce(Math.max(modelSec, est) * 2 + 4);
      $('tDoneSpeak').classList.add('hidden');
    }
    if (run.skipNow || run.redoNow) { run.skipNow = false; return { skipped: true }; }
    if (r.error === 'not-allowed' || r.error === 'service-not-allowed' || r.error === 'audio-capture') return { fatal: micMessage(r.error) };
    if (!r.heard && !r.audio) return { skipped: true };
    status('Checking…');
    let a = null;
    if (r.audio) { try { a = await analyse(r.audio); } catch (e) { console.warn('Analysis failed', e); } }
    if (!r.heard && a && a.quiet) return { skipped: true };
    return { heard: r.heard, a, audio: r.audio };
  }
  $('tPause').addEventListener('click', () => {
    if (!run.active) return;
    run.paused = !run.paused;
    renderRun();
    if (!run.paused) loop();
    else if (run.phase === 'wait') wake();
    else $('tStatus').innerHTML = 'Pausing after this sentence…';
  });
  $('tAgain').addEventListener('click', () => {
    if (!run.active) return;
    if (run.phase === 'wait' || run.paused) {
      // repeat the sentence that was just scored
      if (run.i > 0) { run.i--; run.results[run.i] = null; }
      run.redo = true; wake();
      if (run.paused) { run.paused = false; loop(); }
    } else {
      // start the current sentence again
      run.redoNow = true;
      if (canSpeak) speechSynthesis.cancel();
      if (mic) mic.stop();
    }
  });
  $('tSkip').addEventListener('click', () => {
    if (!run.active) return;
    if (run.phase === 'wait') { wake(); return; }
    run.skipNow = true;
    if (canSpeak) speechSynthesis.cancel();
    if (mic) mic.stop();
  });
  $('tStop').addEventListener('click', () => {
    run.active = false;
    wake();
    if (canSpeak) speechSynthesis.cancel();
    if (mic) mic.stop();
    finishRun();
  });
  $('tTable').addEventListener('click', onRows);
  $('tDoneSpeak').addEventListener('click', () => { if (mic) mic.stop(); });
  function finishRun() {
    run.active = false; run.only = false;
    $('tDoneSpeak').classList.add('hidden');
    flushCloud();
    $('tRun').classList.add('hidden'); $('tDone').classList.remove('hidden');
    const done = run.results.map((r, k) => ({ r, k })).filter((x) => x.r && x.r.pct !== null);
    const avg = done.length ? Math.round(done.reduce((p, x) => p + x.r.pct, 0) / done.length) : null;
    const weak = done.filter((x) => x.r.pct < 80);
    $('tSummary').innerHTML = `
      <div class="big-num">${avg === null ? '–' : avg + '%'}</div>
      <div class="line">Average match over ${done.length} sentence${done.length === 1 ? '' : 's'}${run.list.length > done.length ? ` (of ${run.list.length})` : ''}.</div>
      <div class="line">${done.filter((x) => x.r.pct >= 80).length} sentence(s) at 80% or more · today's shadowing score: <b>${(db.days[todayKey()] || {}).score || 0}</b> points.</div>
      <div class="table-wrap" style="margin-top:12px"><table class="click-rows score-rows"><thead><tr><th>#</th><th>Sentence</th><th>Match</th><th></th></tr></thead>
      <tbody id="tSumBody">${rowsHtml('sum')}</tbody></table></div>
      <p class="hint">Click a sentence to see its analysis and melody chart. ▶ the voice · 🎧 your voice · 🔁 practise it again.</p>`;
    $('tSumBody').onclick = onRows;
    $('tWeak').classList.toggle('hidden', !weak.length);
    $('tWeak').textContent = `Practise the ${weak.length} sentence${weak.length === 1 ? '' : 's'} under 80% again`;
    $('tWeak').onclick = () => {
      Object.assign(run, { list: weak.map((x) => run.list[x.k]), i: 0, active: true, paused: false, only: false, open: null, results: [] });
      $('tDone').classList.add('hidden'); $('tRun').classList.remove('hidden');
      loop();
    };
  }
  $('tNew').addEventListener('click', () => { $('tDone').classList.add('hidden'); $('tSetup').classList.remove('hidden'); });
  window.__peweShadowTest.splitText = splitText;

  // ---------- my sentences ----------
  function showTab(name) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
    if (name === 'list') renderList();
    if (name === 'fav') renderFav();
    if (name === 'text') updateTextCount();
  }
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
  function renderList() {
    const q = key($('lSearch').value);
    const list = db.sentences.filter((s) => !q || key(s.text).includes(q)).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0) || String(b.added).localeCompare(String(a.added)));
    $('lCount').textContent = `(${db.sentences.length})`;
    $('lEmpty').classList.toggle('hidden', db.sentences.length > 0);
    $('lPractise').classList.toggle('hidden', !db.sentences.length);
    const cell = (v) => (v === null || v === undefined || (!v && v !== 0) ? '<td class="muted">–</td>' : `<td class="${v >= 80 ? 'acc-good' : 'acc-bad'}">${v}%</td>`);
    $('lTable').querySelector('tbody').innerHTML = list.map((s) => `<tr data-id="${esc(s.id)}" tabindex="0"><td><div class="w s-text">${esc(s.text)}</div></td>
      ${s.tries ? cell(s.best) : '<td class="muted">–</td>'}${s.tries ? cell(s.last) : '<td class="muted">–</td>'}<td>${s.tries || 0}</td>
      <td class="nowrap">${starBtn(s)}<button class="del" type="button" data-del="${esc(s.id)}" title="Delete">✕</button></td></tr>`).join('');
    const d = db.days[todayKey()] || {};
    $('tScore').textContent = d.score || 0;
    $('tAvg').textContent = d.tries ? Math.round((d.sum || 0) / d.tries) + '%' : '–';
    $('tTries').textContent = d.tries || 0;
    $('tNew').textContent = d.newWords || 0;
  }
  $('lSearch').addEventListener('input', renderList);
  $('lTable').addEventListener('click', (e) => {
    if (toggleStar(e)) { renderList(); return; }
    const del = e.target.closest('[data-del]');
    if (del) {
      const s = db.sentences.find((x) => x.id === del.dataset.del);
      if (s && confirm(`Delete this sentence?\n\n${s.text}`)) { db.sentences = db.sentences.filter((x) => x !== s); save(); renderList(); }
      return;
    }
    const tr = e.target.closest('tr[data-id]');
    if (tr) { const s = db.sentences.find((x) => x.id === tr.dataset.id); if (s) { showTab('practise'); $('sText').value = s.text; countWords(); open(s); } }
  });
  $('lTable').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('tr[data-id]')) e.target.click(); });
  $('lPractise').addEventListener('click', () => {
    if (!db.sentences.length) return;
    queue = db.sentences.map((s) => ({ s, k: (s.tries ? (s.best || 0) / 100 : -1) + Math.random() * 0.3 })).sort((a, b) => a.k - b.k).map((x) => x.s);
    const first = queue.shift();
    showTab('practise'); $('sText').value = first.text; countWords();
    open(first, { fromQueue: true });
  });

  // ---------- favorites ----------
  const starBtn = (s) => `<button class="star${s.fav ? ' on' : ''}" type="button" data-star="${esc(s.id)}" title="${s.fav ? 'Remove from favorites' : 'Add to favorites'}" aria-pressed="${!!s.fav}">${s.fav ? '★' : '☆'}</button>`;
  // Handles a click on a ☆/★ button in a table. Returns true when it was one.
  function toggleStar(e) {
    const b = e.target.closest('[data-star]');
    if (!b) return false;
    const s = db.sentences.find((x) => x.id === b.dataset.star);
    if (s) { s.fav = !s.fav; save(); if (cur === s) favButton(); }
    return true;
  }
  const favs = () => db.sentences.filter((s) => s.fav);
  function renderFav() {
    const q = key($('fSearch').value), all = favs();
    // keep the order they were added in, so the learner's own list stays as they wrote it
    const list = all.filter((s) => !q || key(s.text).includes(q));
    $('fCount').textContent = `(${all.length})`;
    $('fEmpty').classList.toggle('hidden', all.length > 0);
    $('fPractise').classList.toggle('hidden', !all.length);
    const cell = (s, v) => (!s.tries || v === null || v === undefined ? '<td class="muted">–</td>' : `<td class="${v >= 80 ? 'acc-good' : 'acc-bad'}">${v}%</td>`);
    $('fTable').querySelector('tbody').innerHTML = list.map((s) => `<tr data-id="${esc(s.id)}" tabindex="0"><td><div class="w s-text">${esc(s.text)}</div></td>
      ${cell(s, s.best)}${cell(s, s.last)}<td>${s.tries || 0}</td><td>${starBtn(s)}</td></tr>`).join('');
  }
  $('fSearch').addEventListener('input', renderFav);
  $('fAdd').addEventListener('click', () => {
    // one sentence per line; a line with several sentences or more than 20 words is split
    const parts = $('fText').value.replace(/\r/g, '').split('\n').flatMap((line) => splitText(line)).map(tidy).filter((t) => wordsOf(t).length >= 2);
    if (!parts.length) { $('fMsg').textContent = 'Please type or paste at least one sentence (two words or more).'; return; }
    let added = 0, already = 0;
    parts.forEach((text) => {
      let s = findSentence(text);
      if (!s) { s = { id: uid(), text, added: todayKey(), tries: 0, best: 0, last: null }; db.sentences.push(s); day().newWords++; }
      if (s.fav) already++; else { s.fav = true; added++; }
    });
    save(); updateChip();
    $('fText').value = '';
    $('fMsg').textContent = `Added ${added} sentence${added === 1 ? '' : 's'} to your favorites.` + (already ? ` ${already} ${already === 1 ? 'was' : 'were'} already there.` : '');
    renderFav();
  });
  $('fTable').addEventListener('click', (e) => {
    if (toggleStar(e)) { renderFav(); return; }
    const tr = e.target.closest('tr[data-id]');
    if (tr) { const s = db.sentences.find((x) => x.id === tr.dataset.id); if (s) { showTab('practise'); $('sText').value = s.text; countWords(); open(s); } }
  });
  $('fTable').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('tr[data-id]')) e.target.click(); });
  $('fPractise').addEventListener('click', () => {
    const all = favs();
    if (!all.length) return;
    queue = all.map((s) => ({ s, k: (s.tries ? (s.best || 0) / 100 : -1) + Math.random() * 0.3 })).sort((a, b) => a.k - b.k).map((x) => x.s);
    const first = queue.shift();
    showTab('practise'); $('sText').value = first.text; countWords();
    open(first, { fromQueue: true });
  });

  function refresh() {
    updateChip();
    if ($('tab-list').classList.contains('active')) renderList();
    if ($('tab-fav').classList.contains('active')) renderFav();
    if (cur) { cur = findSentence(cur.text) || cur; favButton(); }
  }
  if (!SR) $('sSay').classList.add('hidden');
  fillVoices();
  countWords();
  refresh();
})();
