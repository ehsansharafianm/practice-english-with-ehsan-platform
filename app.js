/* Dictation Practice — English with Ehsan
 * All data is stored in this browser (localStorage).
 */
(() => {
  'use strict';

  const TRIES_PER_NEW_WORD = 10;
  const POINTS_PER_CORRECT = 10;
  const STORE_KEY = 'dictation-practice-v1';

  // ---------- storage ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        return { words: d.words || [], days: d.days || {} };
      }
    } catch (e) { /* ignore */ }
    return { words: [], days: {} };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
  }
  let db = load();

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const norm = (s) => s.replace(/[‘’]/g, "'").trim().replace(/\s+/g, ' ').toLowerCase();
  const pct = (c, t) => (t ? Math.round((c / t) * 100) : 0);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function day() {
    const k = todayKey();
    if (!db.days[k]) db.days[k] = { tries: 0, correct: 0, score: 0, newWords: 0 };
    return db.days[k];
  }
  function record(word, ok) {
    const d = day();
    d.tries++;
    if (ok) { d.correct++; d.score += POINTS_PER_CORRECT; }
    if (word) {
      word.tries = (word.tries || 0) + 1;
      if (ok) word.correct = (word.correct || 0) + 1;
      word.last = Date.now();
    }
    save();
    updateChip();
  }
  function updateChip() { $('chipScore').textContent = (db.days[todayKey()] || {}).score || 0; }

  // ---------- speech ----------
  const canSpeak = 'speechSynthesis' in window;
  function speak(text) {
    if (!canSpeak || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.8;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang && x.lang.startsWith('en'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }
  if (!canSpeak) {
    ['learnSpeak', 'reviewSpeak'].forEach((id) => $(id).classList.add('hidden'));
  }

  // ---------- live colouring while typing ----------
  function liveColour(input, target) {
    input.classList.remove('right', 'wrong', 'ok', 'no');
    const v = norm(input.value);
    if (!v) return;
    input.classList.add(norm(target).startsWith(v) ? 'ok' : 'no');
  }

  // ---------- tabs ----------
  function showTab(name) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
    if (name === 'library') renderLibrary();
    if (name === 'today') renderToday();
    if (name === 'review') $('reviewEmpty').classList.toggle('hidden', db.words.length > 0);
  }
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.goto)));

  function show(...ids) { ids.forEach((id) => $(id).classList.remove('hidden')); }
  function hide(...ids) { ids.forEach((id) => $(id).classList.add('hidden')); }

  // =====================================================
  // NEW WORD: practise 10 times, then add to the library
  // =====================================================
  const learn = { text: '', note: '', hide: false, results: [], waiting: false };

  $('learnForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('newWord').value.trim().replace(/\s+/g, ' ');
    if (!text) return;
    learn.text = text;
    learn.note = $('newNote').value.trim();
    learn.hide = $('learnHide').checked;
    learn.results = [];
    learn.waiting = false;
    hide('learnSetup', 'learnDone');
    show('learnRun');
    $('learnTarget').textContent = learn.hide ? '•'.repeat(Math.min(text.length, 14)) : text;
    $('learnTarget').classList.toggle('masked', learn.hide);
    $('learnNote').textContent = learn.note;
    renderLearnStep();
    speak(text);
  });

  function renderLearnStep() {
    const n = learn.results.length;
    $('learnCounter').textContent = `Try ${Math.min(n + 1, TRIES_PER_NEW_WORD)} of ${TRIES_PER_NEW_WORD}`;
    const dots = [];
    for (let i = 0; i < TRIES_PER_NEW_WORD; i++) {
      const r = learn.results[i];
      dots.push(`<span class="dot ${r === true ? 'right' : r === false ? 'wrong' : i === n ? 'current' : ''}"></span>`);
    }
    $('learnDots').innerHTML = dots.join('');
    const inp = $('learnInput');
    inp.value = '';
    inp.className = 'answer';
    inp.disabled = false;
    $('learnFeedback').textContent = '';
    $('learnFeedback').className = 'feedback';
    $('learnCheck').textContent = 'Check';
    inp.focus();
  }

  function learnCheck() {
    const inp = $('learnInput');
    if (learn.waiting) { // move to next try
      learn.waiting = false;
      if (learn.results.length >= TRIES_PER_NEW_WORD) return finishLearn();
      return renderLearnStep();
    }
    if (!inp.value.trim()) return;
    const ok = norm(inp.value) === norm(learn.text);
    learn.results.push(ok);
    record(null, ok);
    inp.classList.remove('ok', 'no');
    inp.classList.add(ok ? 'right' : 'wrong');
    inp.disabled = true;
    const fb = $('learnFeedback');
    fb.className = 'feedback ' + (ok ? 'right' : 'wrong');
    fb.textContent = ok ? '✓ Correct!' : `✗ Not quite — it is "${learn.text}"`;
    learn.waiting = true;
    $('learnCheck').textContent = learn.results.length >= TRIES_PER_NEW_WORD ? 'Finish' : 'Next';
    // update dots
    renderDotsOnly();
    $('learnCheck').focus();
    if (ok) setTimeout(() => { if (learn.waiting && learn.results.length < TRIES_PER_NEW_WORD) learnCheck(); }, 700);
  }
  function renderDotsOnly() {
    const dots = [];
    for (let i = 0; i < TRIES_PER_NEW_WORD; i++) {
      const r = learn.results[i];
      dots.push(`<span class="dot ${r === true ? 'right' : r === false ? 'wrong' : ''}"></span>`);
    }
    $('learnDots').innerHTML = dots.join('');
  }

  function finishLearn() {
    const correct = learn.results.filter(Boolean).length;
    const existing = db.words.find((w) => norm(w.text) === norm(learn.text));
    let word = existing;
    if (!word) {
      word = { id: uid(), text: learn.text, note: learn.note, added: todayKey(), tries: 0, correct: 0 };
      db.words.push(word);
      day().newWords++;
    } else if (learn.note) {
      word.note = learn.note;
    }
    word.tries += TRIES_PER_NEW_WORD;
    word.correct += correct;
    word.last = Date.now();
    save();
    hide('learnRun');
    show('learnDone');
    $('learnSummary').innerHTML = `
      <div class="big-num">${correct}/${TRIES_PER_NEW_WORD}</div>
      <div class="line"><b>${esc(learn.text)}</b> — ${pct(correct, TRIES_PER_NEW_WORD)}% correct</div>
      <div class="line muted">${existing ? 'This word was already in the library; its stats were updated.' : 'Saved to the library.'}</div>`;
    $('newWord').value = '';
    $('newNote').value = '';
  }

  $('learnCheck').addEventListener('click', learnCheck);
  $('learnInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); learnCheck(); } });
  $('learnCheck').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); learnCheck(); } });
  $('learnInput').addEventListener('input', () => liveColour($('learnInput'), learn.text));
  $('learnSpeak').addEventListener('click', () => speak(learn.text));
  $('learnQuit').addEventListener('click', () => {
    if (!confirm('Cancel this word? It will not be added to the library.')) return;
    hide('learnRun'); show('learnSetup');
  });
  $('learnAgain').addEventListener('click', () => { hide('learnDone'); show('learnSetup'); $('newWord').focus(); });

  // =====================================================
  // REVIEW: practise previous words, then show accuracy
  // =====================================================
  const review = { queue: [], i: 0, correct: 0, missed: [], showWord: false, waiting: false, hinted: false };

  function pickWords(count) {
    // Weaker and less-practised words get a better chance to appear.
    const scored = db.words.map((w) => {
      const acc = w.tries ? w.correct / w.tries : 0;
      const weight = (1 - acc) + 1 / (1 + (w.tries || 0)) + Math.random();
      return { w, weight };
    });
    scored.sort((a, b) => b.weight - a.weight);
    const n = count === 'all' ? scored.length : Math.min(Number(count), scored.length);
    const chosen = scored.slice(0, n).map((x) => x.w);
    for (let i = chosen.length - 1; i > 0; i--) { // shuffle
      const j = Math.floor(Math.random() * (i + 1));
      [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
    }
    return chosen;
  }

  $('reviewForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!db.words.length) { show('reviewEmpty'); return; }
    review.queue = pickWords($('reviewCount').value);
    review.i = 0; review.correct = 0; review.missed = [];
    review.showWord = $('reviewShow').checked;
    hide('reviewSetup', 'reviewDone');
    show('reviewRun');
    renderReviewStep();
  });

  function current() { return review.queue[review.i]; }

  function renderReviewStep() {
    const w = current();
    review.waiting = false;
    review.hinted = false;
    $('reviewCounter').textContent = `Word ${review.i + 1} of ${review.queue.length}`;
    $('reviewBar').style.width = pct(review.i, review.queue.length) + '%';
    const t = $('reviewTarget');
    t.textContent = review.showWord ? w.text : '•'.repeat(Math.min(w.text.length, 14));
    t.classList.toggle('masked', !review.showWord);
    $('reviewNote').textContent = w.note || '';
    const inp = $('reviewInput');
    inp.value = ''; inp.className = 'answer'; inp.disabled = false;
    $('reviewFeedback').textContent = ''; $('reviewFeedback').className = 'feedback';
    $('reviewCheck').textContent = 'Check';
    $('reviewHint').disabled = review.showWord;
    inp.focus();
    speak(w.text);
  }

  function reviewCheck() {
    if (review.waiting) {
      review.i++;
      if (review.i >= review.queue.length) return finishReview();
      return renderReviewStep();
    }
    const inp = $('reviewInput');
    if (!inp.value.trim()) return;
    const w = current();
    const ok = norm(inp.value) === norm(w.text);
    record(w, ok);
    if (ok) review.correct++; else review.missed.push(w.text);
    inp.classList.remove('ok', 'no');
    inp.classList.add(ok ? 'right' : 'wrong');
    inp.disabled = true;
    const fb = $('reviewFeedback');
    fb.className = 'feedback ' + (ok ? 'right' : 'wrong');
    fb.textContent = ok ? '✓ Correct!' : `✗ The answer is "${w.text}"`;
    if (!ok) { $('reviewTarget').textContent = w.text; $('reviewTarget').classList.remove('masked'); }
    review.waiting = true;
    $('reviewCheck').textContent = review.i + 1 >= review.queue.length ? 'Finish' : 'Next';
    $('reviewCheck').focus();
  }

  function finishReview() {
    const total = review.queue.length;
    const d = db.days[todayKey()] || { tries: 0, correct: 0, score: 0 };
    hide('reviewRun');
    show('reviewDone');
    $('reviewSummary').innerHTML = `
      <div class="big-num">${pct(review.correct, total)}%</div>
      <div class="line">Accuracy this round: <b>${review.correct}</b> of <b>${total}</b> correct (+${review.correct * POINTS_PER_CORRECT} pts)</div>
      <div class="line">Today's total score: <b>${d.score}</b> pts · today's accuracy ${pct(d.correct, d.tries)}%</div>
      ${review.missed.length ? `<div class="missed"><div class="muted">Practise these again:</div>${review.missed.map((m) => `<span>${esc(m)}</span>`).join('')}</div>` : '<div class="line">Perfect round! 🎉</div>'}`;
  }

  $('reviewCheck').addEventListener('click', reviewCheck);
  $('reviewInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); reviewCheck(); } });
  $('reviewCheck').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); reviewCheck(); } });
  $('reviewInput').addEventListener('input', () => { if (review.showWord || review.hinted) liveColour($('reviewInput'), current().text); });
  $('reviewSpeak').addEventListener('click', () => current() && speak(current().text));
  $('reviewHint').addEventListener('click', () => {
    const w = current(); if (!w || review.waiting) return;
    review.hinted = true;
    const t = $('reviewTarget');
    t.textContent = w.text[0] + ' ' + '_ '.repeat(w.text.length - 1).trim();
    t.classList.remove('masked');
    $('reviewInput').focus();
  });
  $('reviewQuit').addEventListener('click', () => {
    if (review.i === 0 && !review.waiting) { hide('reviewRun'); show('reviewSetup'); return; }
    review.queue = review.queue.slice(0, review.i + (review.waiting ? 1 : 0));
    finishReview();
  });
  $('reviewAgain').addEventListener('click', () => { hide('reviewDone'); show('reviewSetup'); });

  // =====================================================
  // LIBRARY
  // =====================================================
  function renderLibrary() {
    const q = norm($('libSearch').value || '');
    const list = db.words
      .filter((w) => !q || norm(w.text).includes(q) || norm(w.note || '').includes(q))
      .sort((a, b) => a.text.localeCompare(b.text));
    $('libCount').textContent = `(${db.words.length})`;
    $('libEmpty').classList.toggle('hidden', db.words.length > 0);
    $('libTable').classList.toggle('hidden', db.words.length === 0);
    $('libTable').querySelector('tbody').innerHTML = list.map((w) => {
      const a = pct(w.correct, w.tries);
      return `<tr>
        <td><div class="w">${esc(w.text)}</div>${w.note ? `<div class="n">${esc(w.note)}</div>` : ''}</td>
        <td class="${a >= 80 ? 'acc-good' : 'acc-bad'}">${w.tries ? a + '%' : '–'}</td>
        <td>${w.tries || 0}</td>
        <td>${esc(w.added || '')}</td>
        <td><button class="del" data-id="${w.id}" title="Delete">✕</button></td>
      </tr>`;
    }).join('');
  }
  $('libSearch').addEventListener('input', renderLibrary);
  $('libTable').addEventListener('click', (e) => {
    const b = e.target.closest('.del'); if (!b) return;
    const w = db.words.find((x) => x.id === b.dataset.id);
    if (!w || !confirm(`Delete "${w.text}" from the library?`)) return;
    db.words = db.words.filter((x) => x.id !== w.id);
    save(); renderLibrary();
  });

  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dictation-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.words)) throw new Error('bad file');
      let added = 0;
      data.words.forEach((w) => {
        if (!w || typeof w.text !== 'string') return;
        if (db.words.some((x) => norm(x.text) === norm(w.text))) return;
        db.words.push({ id: uid(), text: w.text, note: w.note || '', added: w.added || todayKey(), tries: w.tries || 0, correct: w.correct || 0 });
        added++;
      });
      Object.entries(data.days || {}).forEach(([k, v]) => { if (!db.days[k]) db.days[k] = v; });
      save(); renderLibrary(); updateChip();
      alert(`Imported ${added} new word(s).`);
    } catch (err) {
      alert('That file could not be read. Please choose a backup made with Export.');
    }
    e.target.value = '';
  });

  // =====================================================
  // TODAY
  // =====================================================
  function renderToday() {
    const d = db.days[todayKey()] || { tries: 0, correct: 0, score: 0, newWords: 0 };
    $('tScore').textContent = d.score;
    $('tAcc').textContent = d.tries ? pct(d.correct, d.tries) + '%' : '–';
    $('tTries').textContent = d.tries;
    $('tNew').textContent = d.newWords || 0;

    const rows = [];
    const max = Math.max(1, ...Object.values(db.days).map((x) => x.score || 0));
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const x = db.days[k] || { score: 0, tries: 0, correct: 0 };
      const label = dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      rows.push(`<div class="hrow"><span>${label}</span><div class="hbar"><div style="width:${(x.score / max) * 100}%"></div></div><span class="hval">${x.score} pts</span></div>`);
    }
    $('history').innerHTML = rows.join('');
  }

  // init
  if (canSpeak) window.speechSynthesis.getVoices();
  updateChip();
})();
