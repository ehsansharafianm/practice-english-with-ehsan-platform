/* Spanish Vocabulary — Practice with Ehsan
 * Spanish words (Spain) with English meanings, IPA and stress (../spanish.js), a Spain voice, and three ways to learn:
 * Learn (word cards), Flashcards (words you miss come back sooner), Quiz (4 choices).
 * Learners can add their own words; "Suggest meaning" asks the free MyMemory translation API.
 * Guests: saved in this browser. Signed-in students: also saved to their account (es.vocab, see ../account.js).
 */
(() => {
  'use strict';

  const L = window.PEWE_L || { code: 'en' };
  const $ = (id) => document.getElementById(id);
  if (L.code !== 'es') {
    // This page is for Spanish only.
    $('notEs').classList.remove('hidden');
    $('vocabTabs').classList.add('hidden');
    $('vocabMain').classList.add('hidden');
    return;
  }

  const POINTS = 10;
  const MAX_BOX = 5;
  const STORE_KEY = window.PEWE_KEY ? window.PEWE_KEY('vocab-v1') : 'vocab-v1-es';
  let storeKey = STORE_KEY, cloudOK = false, cloudTimer = null;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const plain = (s) => clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, '').trim();
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const show = (...ids) => ids.forEach((id) => $(id).classList.remove('hidden'));
  const hide = (...ids) => ids.forEach((id) => $(id).classList.add('hidden'));

  // ---------- words ----------
  const TOPICS = window.VOCAB_TOPICS || [];
  const BUILT = (window.VOCAB_WORDS || []).map(([topic, es, en]) => ({ es, en, topic }));
  const topicName = (id) => (id === 'mine' ? 'My words' : id === 'all' ? 'All topics' : (TOPICS.find((t) => t.id === id) || {}).name || id);

  // ---------- storage ----------
  // words: { [spanish]: { box, right, wrong, last } }, mine: [{ es, en, added }], days: { date: { tries, correct, score, newWords } }
  function load(key = storeKey) {
    try { const d = JSON.parse(localStorage.getItem(key) || 'null'); if (d) return { words: d.words || {}, mine: d.mine || [], days: d.days || {} }; } catch (e) { /* ignore */ }
    return { words: {}, mine: [], days: {} };
  }
  let db = load();
  function save() {
    try { localStorage.setItem(storeKey, JSON.stringify(db)); } catch (e) { /* ignore */ }
    if (window.PEWE && window.PEWE.user && cloudOK) { clearTimeout(cloudTimer); cloudTimer = setTimeout(flushCloud, 1500); }
  }
  function flushCloud() {
    clearTimeout(cloudTimer); cloudTimer = null;
    if (window.PEWE && window.PEWE.user && cloudOK && window.PEWE.saveVocab) window.PEWE.saveVocab(db).catch((e) => console.warn('Cloud save failed', e));
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && cloudTimer) flushCloud(); });
  function merge(a, b) {
    const out = { words: JSON.parse(JSON.stringify(a.words || {})), mine: (a.mine || []).map((w) => ({ ...w })), days: JSON.parse(JSON.stringify(a.days || {})) };
    Object.entries(b.words || {}).forEach(([k, v]) => {
      const x = out.words[k];
      if (!x || (v.last || 0) > (x.last || 0)) out.words[k] = { ...v, right: Math.max(v.right || 0, (x || {}).right || 0), wrong: Math.max(v.wrong || 0, (x || {}).wrong || 0) };
    });
    (b.mine || []).forEach((w) => { if (!out.mine.some((x) => plain(x.es) === plain(w.es))) out.mine.push({ ...w }); });
    Object.entries(b.days || {}).forEach(([k, v]) => {
      const d = out.days[k] || (out.days[k] = {});
      ['tries', 'correct', 'score', 'newWords'].forEach((f) => { d[f] = Math.max(d[f] || 0, v[f] || 0); });
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
      db = merge(merge((cloud && cloud.vocab) || { words: {}, mine: [], days: {} }, load(storeKey)), load(STORE_KEY));
      try { localStorage.removeItem(STORE_KEY); } catch (err) { /* ignore */ }
      save();
      if (cloudOK) flushCloud();
    } else { storeKey = STORE_KEY; db = load(storeKey); }
    refresh();
  });
  function day() { const k = todayKey(); return db.days[k] || (db.days[k] = { tries: 0, correct: 0, score: 0, newWords: 0 }); }
  function updateChip() { $('chipScore').textContent = (db.days[todayKey()] || {}).score || 0; }
  const stat = (w) => db.words[w.es] || (db.words[w.es] = { box: 0, right: 0, wrong: 0, last: 0 });
  // A word moves up a box when known, back to box 0 when missed. Box 3 or more = learned.
  function mark(w, ok) {
    const s = stat(w), d = day();
    if (!s.last) d.newWords++;
    s.last = Date.now();
    d.tries++;
    if (ok) { s.right++; s.box = Math.min(MAX_BOX, (s.box || 0) + 1); d.correct++; d.score += POINTS; } else { s.wrong++; s.box = 0; }
    save(); updateChip();
  }
  const learned = (w) => ((db.words[w.es] || {}).box || 0) >= 3;
  const allWords = () => BUILT.concat(db.mine.map((m) => ({ es: m.es, en: m.en, topic: 'mine' })));
  const wordsOf = (topic) => (topic === 'all' ? allWords() : allWords().filter((w) => w.topic === topic));

  // ---------- sounds ----------
  const P = window.ES_PRON;
  const tokens = (t) => clean(t).split(' ').map((w) => w.replace(/[^\p{L}]/gu, '')).filter(Boolean);
  const ipaOf = (t) => (P ? '/' + tokens(t).map((w) => P.ipa(w)).join(' ') + '/' : '');
  function sylHtml(t) {
    if (!P) return '';
    return tokens(t).map((w) => {
      const sy = P.syllables(w);
      return sy.map((s) => `<span class="${sy.length > 1 && s.stress ? 'v-stress' : ''}">${esc(sy.length > 1 && s.stress ? s.text.toUpperCase() : s.text)}</span>`).join('<i>·</i>');
    }).join('<i class="gap"> </i>');
  }

  // ---------- voice ----------
  const canSpeak = 'speechSynthesis' in window;
  const NOVELTY = /\b(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox)\b/i;
  function voice() {
    const all = canSpeak ? speechSynthesis.getVoices() : [];
    const good = (v) => (/natural|online|neural/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 1 : 0) - (NOVELTY.test(v.name) ? 5 : 0);
    const es = all.filter((v) => /^es[-_]ES/i.test(v.lang));
    const list = es.length ? es : all.filter((v) => /^es\b/i.test(v.lang));
    return list.sort((a, b) => good(b) - good(a))[0] || null;
  }
  if (canSpeak) { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => {}); }
  function say(text, slow = false) {
    if (!canSpeak || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean(text).replace(/[¿?¡!]/g, ''));
    u.lang = 'es-ES';
    const v = voice(); if (v) u.voice = v;
    u.rate = slow ? 0.6 : 0.9;
    speechSynthesis.speak(u);
  }

  // ---------- say it (speech recognition, Spain Spanish) ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  function hear() {
    return new Promise((resolve) => {
      const r = new SR();
      let alts = [], error = '';
      r.lang = 'es-ES'; r.maxAlternatives = 5; r.interimResults = false; r.continuous = false;
      r.onresult = (e) => { alts = Array.from(e.results[0] || []).map((a) => a.transcript); };
      r.onerror = (e) => { error = e.error; };
      r.onend = () => { rec = null; resolve({ alts, error }); };
      rec = r;
      try { r.start(); } catch (e) { rec = null; resolve({ alts: [], error: 'busy' }); }
    });
  }
  // Right if what was heard has the same words (accents ignored) or sounds the same.
  function saidRight(target, alts) {
    const want = plain(target).split(' ').filter(Boolean);
    const key = (w) => (P ? P.key(w) : w);
    return alts.some((a) => {
      const got = plain(a).split(' ').filter(Boolean);
      if (got.join(' ').includes(want.join(' '))) return true;
      return want.every((w) => got.some((g) => g === w || key(g) === key(w)));
    });
  }
  async function sayIt(btn, out, w) {
    if (!SR) { out.innerHTML = '<p class="feedback wrong">Checking your speech works in Chrome and Edge.</p>'; return; }
    if (rec) { rec.stop(); return; }
    if (canSpeak) speechSynthesis.cancel();
    btn.classList.add('on'); const label = btn.textContent; btn.textContent = '👂';
    out.innerHTML = '<p class="hint">Say it now…</p>';
    const { alts, error } = await hear();
    btn.classList.remove('on'); btn.textContent = label;
    if (!alts.length) {
      out.innerHTML = `<p class="feedback wrong">${error === 'not-allowed' || error === 'service-not-allowed' ? 'Please allow the microphone for this site, then try again.' : 'I did not hear anything. Try again and speak clearly.'}</p>`;
      return;
    }
    const ok = saidRight(w.es, alts);
    mark(w, ok);
    out.innerHTML = ok ? `<p class="feedback right">✓ I heard “${esc(alts[0])}”. +${POINTS}</p>` : `<p class="feedback wrong">✗ I heard “${esc(alts[0])}”. Listen ▶ and try again.</p>`;
    if (curTab === 'learn') renderTopics();
  }

  // ---------- word cards (Learn and My words) ----------
  function cardHtml(w, { del = false } = {}) {
    const s = db.words[w.es] || {};
    const state = learned(w) ? '<span class="w-state ok" title="Learned">✓ learned</span>' : s.last ? '<span class="w-state">learning</span>' : '';
    return `<div class="wcard" data-es="${esc(w.es)}">
      <div class="w-top"><span class="w-es" lang="es">${esc(w.es)}</span>${state}</div>
      <div class="w-en">${esc(w.en)}</div>
      <div class="w-ipa">${esc(ipaOf(w.es))}</div>
      <div class="w-syl" lang="es">${sylHtml(w.es)}</div>
      <div class="w-acts">
        <button type="button" class="btn listen-btn small" data-act="say" title="Listen">▶</button>
        <button type="button" class="btn ghost small" data-act="slow" title="Listen slowly">🐢</button>
        <button type="button" class="btn mic-btn small" data-act="mic" title="Say it">🎙️</button>
        ${del ? '<button type="button" class="del" data-act="del" title="Delete">✕</button>' : ''}
      </div>
      <div class="w-res" aria-live="polite"></div>
    </div>`;
  }
  function onCards(e) {
    const b = e.target.closest('[data-act]'), card = e.target.closest('.wcard');
    if (!b || !card) return;
    const w = allWords().find((x) => x.es === card.dataset.es);
    if (!w) return;
    const act = b.dataset.act;
    if (act === 'say') say(w.es);
    else if (act === 'slow') say(w.es, true);
    else if (act === 'mic') sayIt(b, card.querySelector('.w-res'), w);
    else if (act === 'del') {
      if (!confirm(`Delete “${w.es}” from My words?`)) return;
      db.mine = db.mine.filter((m) => m.es !== w.es); delete db.words[w.es]; save(); renderMine();
    }
  }

  // ---------- Learn ----------
  let topic = TOPICS[0] ? TOPICS[0].id : 'all';
  function renderTopics() {
    const ts = TOPICS.map((t) => ({ ...t, words: BUILT.filter((w) => w.topic === t.id) }));
    if (db.mine.length) ts.push({ id: 'mine', name: 'My words', icon: '⭐', words: wordsOf('mine') });
    $('lTopics').innerHTML = ts.map((t) => {
      const n = t.words.length, k = t.words.filter(learned).length;
      return `<button type="button" class="topic-chip${t.id === topic ? ' on' : ''}" data-topic="${t.id}" aria-pressed="${t.id === topic}">
        <span aria-hidden="true">${t.icon}</span> ${esc(t.name)} <small>${k}/${n}</small></button>`;
    }).join('');
  }
  function renderLearn() {
    renderTopics();
    const q = plain($('lSearch').value);
    const list = q ? allWords().filter((w) => plain(w.es).includes(q) || plain(w.en).includes(q)) : wordsOf(topic);
    $('lCount').textContent = q ? `(${list.length} found)` : `(${allWords().length} words)`;
    $('lGrid').innerHTML = list.map((w) => cardHtml(w)).join('') || '<p class="empty">No words found.</p>';
  }
  $('lTopics').addEventListener('click', (e) => { const b = e.target.closest('[data-topic]'); if (!b) return; topic = b.dataset.topic; $('lSearch').value = ''; renderLearn(); });
  $('lSearch').addEventListener('input', renderLearn);
  $('lGrid').addEventListener('click', onCards);

  // ---------- topic menus ----------
  function fillTopicSelect(sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="all">All topics</option>' + TOPICS.map((t) => `<option value="${t.id}">${t.icon} ${esc(t.name)}</option>`).join('')
      + (db.mine.length ? '<option value="mine">⭐ My words</option>' : '');
    sel.value = [...sel.options].some((o) => o.value === cur) ? cur : (topic || 'all');
  }

  // ---------- Flashcards ----------
  const fc = { queue: [], i: 0, known: 0, missed: [], total: 0 };
  // Words to study first: lower box first, then the ones not seen for longest, a little shuffled.
  const due = (list) => list.map((w) => ({ w, k: ((db.words[w.es] || {}).box || 0) * 10 + Math.random() * 6 - ((Date.now() - ((db.words[w.es] || {}).last || 0)) / 864e5 > 3 ? 4 : 0) }))
    .sort((a, b) => a.k - b.k).map((x) => x.w);
  $('cStart').addEventListener('click', () => {
    const list = wordsOf($('cTopic').value);
    if (!list.length) { $('cMsg').textContent = 'There are no words in this topic yet.'; return; }
    fc.queue = due(list).slice(0, +$('cCount').value);
    Object.assign(fc, { i: 0, known: 0, missed: [], total: fc.queue.length });
    hide('cSetup', 'cDone'); show('cRun');
    cardStep();
  });
  function cardStep() {
    const w = fc.queue[fc.i];
    $('cProgress').textContent = `Card ${Math.min(fc.i + 1, fc.queue.length)} of ${fc.queue.length}`;
    $('cBar').style.width = Math.round((fc.i / fc.queue.length) * 100) + '%';
    $('cFront').innerHTML = `<div class="fc-es" lang="es">${esc(w.es)}</div><div class="w-ipa">${esc(ipaOf(w.es))}</div><div class="w-syl" lang="es">${sylHtml(w.es)}</div>`;
    $('cBack').innerHTML = `<div class="fc-en">${esc(w.en)}</div><div class="muted">${esc(topicName(w.topic))}</div>`;
    hide('cBack', 'cNo', 'cYes'); show('cShow');
    $('cShow').focus();
    say(w.es);
  }
  $('cListen').addEventListener('click', () => say(fc.queue[fc.i].es));
  $('cShow').addEventListener('click', () => { show('cBack', 'cNo', 'cYes'); hide('cShow'); $('cYes').focus(); });
  $('cCard').addEventListener('click', () => { if (!$('cShow').classList.contains('hidden')) $('cShow').click(); });
  function cardAnswer(ok) {
    const w = fc.queue[fc.i];
    mark(w, ok);
    if (ok) fc.known++;
    else {
      if (!fc.missed.includes(w)) fc.missed.push(w);
      if (fc.queue.slice(fc.i + 1).indexOf(w) < 0) fc.queue.splice(Math.min(fc.queue.length, fc.i + 4), 0, w); // see it again soon
    }
    fc.i++;
    if (fc.i >= fc.queue.length) cardsDone(); else cardStep();
  }
  $('cYes').addEventListener('click', () => cardAnswer(true));
  $('cNo').addEventListener('click', () => cardAnswer(false));
  $('cQuit').addEventListener('click', cardsDone);
  function cardsDone() {
    if (canSpeak) speechSynthesis.cancel();
    hide('cRun'); show('cDone');
    $('cSummary').innerHTML = `<div class="big-num">${fc.known}/${fc.total}</div>
      <div class="line">words you knew the first time · today's vocabulary score: <b>${(db.days[todayKey()] || {}).score || 0}</b> points</div>
      ${fc.missed.length ? `<div class="line">To practise again: ${fc.missed.map((w) => `<b lang="es">${esc(w.es)}</b> (${esc(w.en)})`).join(', ')}</div>` : ''}`;
  }
  $('cAgain').addEventListener('click', () => { hide('cDone'); show('cSetup'); fillTopicSelect($('cTopic')); });
  document.addEventListener('keydown', (e) => {
    if (curTab !== 'cards' || $('cRun').classList.contains('hidden') || e.target.matches('input, select, textarea')) return;
    if (e.key === ' ' || e.key === 'Enter') { if (!$('cShow').classList.contains('hidden')) { e.preventDefault(); $('cShow').click(); } }
    else if (e.key === 'ArrowRight' && !$('cYes').classList.contains('hidden')) cardAnswer(true);
    else if (e.key === 'ArrowLeft' && !$('cNo').classList.contains('hidden')) cardAnswer(false);
  });

  // ---------- Quiz ----------
  const qz = { list: [], i: 0, right: 0, missed: [], mode: 'es2en', answered: false };
  $('qStart').addEventListener('click', () => {
    const pool = wordsOf($('qTopic').value);
    if (pool.length < 4) { $('qMsg').textContent = 'A quiz needs at least 4 words in the topic. Pick another topic or add more words.'; return; }
    Object.assign(qz, { list: shuffle(due(pool).slice(0, Math.max(+$('qCount').value * 2, 12))).slice(0, +$('qCount').value), i: 0, right: 0, missed: [], mode: $('qMode').value });
    $('qMsg').textContent = '';
    hide('qSetup', 'qDone'); show('qRun');
    quizStep();
  });
  function options(w) {
    // other answers from the same topic first (harder), then from anywhere
    const same = shuffle(allWords().filter((x) => x.topic === w.topic && x.es !== w.es && x.en !== w.en));
    const other = shuffle(allWords().filter((x) => x.topic !== w.topic && x.es !== w.es && x.en !== w.en));
    const picks = [];
    [...same, ...other].forEach((x) => { if (picks.length < 3 && !picks.some((p) => p.en === x.en || p.es === x.es)) picks.push(x); });
    return shuffle([w, ...picks]);
  }
  function quizStep() {
    const w = qz.list[qz.i];
    qz.answered = false;
    $('qProgress').textContent = `Question ${qz.i + 1} of ${qz.list.length}`;
    $('qBar').style.width = Math.round((qz.i / qz.list.length) * 100) + '%';
    const m = qz.mode;
    $('qPrompt').innerHTML = m === 'en2es' ? `<div class="q-ask">How do you say</div><div class="fc-en">${esc(w.en)}</div><div class="q-ask">in Spanish?</div>`
      : m === 'listen' ? '<div class="q-ask">Listen. What does it mean?</div><div class="fc-es">🔊</div>'
      : `<div class="q-ask">What does it mean?</div><div class="fc-es" lang="es">${esc(w.es)}</div><div class="w-ipa">${esc(ipaOf(w.es))}</div>`;
    $('qListen').classList.toggle('hidden', m === 'en2es');
    $('qOptions').innerHTML = options(w).map((o) => `<button type="button" class="q-opt" data-es="${esc(o.es)}"${m === 'en2es' ? ' lang="es"' : ''}>${esc(m === 'en2es' ? o.es : o.en)}</button>`).join('');
    $('qFeedback').textContent = ''; $('qFeedback').className = 'feedback center';
    hide('qNext');
    if (m !== 'en2es') say(w.es);
  }
  $('qListen').addEventListener('click', () => say(qz.list[qz.i].es));
  $('qOptions').addEventListener('click', (e) => {
    const b = e.target.closest('.q-opt');
    if (!b || qz.answered) return;
    qz.answered = true;
    const w = qz.list[qz.i], ok = b.dataset.es === w.es;
    mark(w, ok);
    if (ok) qz.right++; else qz.missed.push(w);
    $('qOptions').querySelectorAll('.q-opt').forEach((x) => { x.disabled = true; if (x.dataset.es === w.es) x.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    $('qFeedback').className = 'feedback center ' + (ok ? 'right' : 'wrong');
    $('qFeedback').innerHTML = ok ? `✓ Right! <b lang="es">${esc(w.es)}</b> = ${esc(w.en)} · +${POINTS}` : `✗ <b lang="es">${esc(w.es)}</b> means “${esc(w.en)}”.`;
    if (qz.mode === 'en2es' || !ok) say(w.es);
    $('qNext').textContent = qz.i + 1 >= qz.list.length ? 'See results' : 'Next';
    show('qNext'); $('qNext').focus();
    if (ok) { const at = qz.i; setTimeout(() => { if (qz.answered && qz.i === at && qz.i + 1 < qz.list.length && !$('qRun').classList.contains('hidden')) quizNext(); }, 1200); }
  });
  function quizNext() { qz.i++; if (qz.i >= qz.list.length) quizDone(); else quizStep(); }
  $('qNext').addEventListener('click', quizNext);
  $('qQuit').addEventListener('click', quizDone);
  function quizDone() {
    if (canSpeak) speechSynthesis.cancel();
    hide('qRun'); show('qDone');
    const n = Math.max(1, Math.min(qz.i + (qz.answered ? 1 : 0), qz.list.length));
    $('qSummary').innerHTML = `<div class="big-num">${qz.right}/${n}</div>
      <div class="line">${Math.round((qz.right / n) * 100)}% right · today's vocabulary score: <b>${(db.days[todayKey()] || {}).score || 0}</b> points</div>
      ${qz.missed.length ? `<div class="line">To practise again: ${qz.missed.map((w) => `<b lang="es">${esc(w.es)}</b> (${esc(w.en)})`).join(', ')}</div>` : '<div class="line">No mistakes. ¡Muy bien!</div>'}`;
  }
  $('qAgain').addEventListener('click', () => { hide('qDone'); show('qSetup'); fillTopicSelect($('qTopic')); });

  // ---------- My words ----------
  function renderMine() {
    $('mCount').textContent = db.mine.length ? `(${db.mine.length})` : '';
    $('mEmpty').classList.toggle('hidden', db.mine.length > 0);
    $('mGrid').innerHTML = wordsOf('mine').slice().reverse().map((w) => cardHtml(w, { del: true })).join('');
  }
  $('mGrid').addEventListener('click', onCards);
  $('mForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const es = clean($('mEs').value), en = clean($('mEn').value);
    if (!es || !en) return;
    if (allWords().some((w) => plain(w.es) === plain(es))) { $('mMsg').textContent = `“${es}” is already in the word lists.`; return; }
    db.mine.push({ es, en, added: todayKey() });
    save();
    $('mEs').value = ''; $('mEn').value = '';
    $('mMsg').textContent = `Added “${es}”.`;
    renderMine();
    $('mEs').focus();
  });
  $('mSuggest').addEventListener('click', async () => {
    const es = clean($('mEs').value);
    if (!es) { $('mMsg').textContent = 'Write the Spanish word first.'; return; }
    $('mSuggest').disabled = true; $('mMsg').textContent = 'Looking up the meaning…';
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(es)}&langpair=es|en`, { signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json();
      const tr = clean(((j || {}).responseData || {}).translatedText || '');
      if (tr && plain(tr) !== plain(es) && !/MYMEMORY WARNING|INVALID/i.test(tr)) { $('mEn').value = tr; $('mMsg').textContent = 'Suggested meaning added. Check it, then click Add word.'; }
      else $('mMsg').textContent = 'No meaning found. Please write it yourself.';
    } catch (err) { $('mMsg').textContent = 'Could not reach the translation service. Please write the meaning yourself.'; }
    $('mSuggest').disabled = false;
  });
  // Spanish letters for an English keyboard
  {
    const inp = $('mEs');
    const bar = document.createElement('div');
    bar.className = 'accent-keys left';
    bar.innerHTML = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'].map((c) => `<button type="button" tabindex="-1" data-ch="${c}">${c}</button>`).join('');
    bar.addEventListener('mousedown', (e) => e.preventDefault());
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ch]'); if (!b) return;
      const a = inp.selectionStart ?? inp.value.length, z = inp.selectionEnd ?? a;
      inp.value = inp.value.slice(0, a) + b.dataset.ch + inp.value.slice(z);
      inp.setSelectionRange(a + 1, a + 1); inp.focus();
    });
    inp.insertAdjacentElement('afterend', bar);
  }

  // ---------- tabs ----------
  let curTab = 'learn';
  function showTab(name) {
    curTab = name;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
    if (canSpeak) speechSynthesis.cancel();
    if (name === 'learn') renderLearn();
    if (name === 'cards') fillTopicSelect($('cTopic'));
    if (name === 'quiz') fillTopicSelect($('qTopic'));
    if (name === 'mine') renderMine();
  }
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
  function refresh() { updateChip(); showTab(curTab); }
  window.__peweVocabTest = { saidRight, ipaOf, wordsOf, db: () => db }; // for developer checks
  refresh();
})();
