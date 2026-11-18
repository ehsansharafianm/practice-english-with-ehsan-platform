// Teacher dashboard: lists every student's scores. Only works for accounts listed in the
// Firestore "teachers" collection (the database rules enforce this, not this page).
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (c, t) => (t ? Math.round((c / t) * 100) : 0);
const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lastDays = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return keyOf(d); });

let students = [];
let openId = null;

function message(html) {
  $('tMsg').innerHTML = html;
  $('tMsg').classList.remove('hidden');
  $('tBoard').classList.add('hidden');
}

function sum(days, keys) {
  const t = { tries: 0, correct: 0, score: 0 };
  (keys || Object.keys(days || {})).forEach((k) => {
    const d = (days || {})[k];
    if (d) { t.tries += d.tries || 0; t.correct += d.correct || 0; t.score += d.score || 0; }
  });
  return t;
}

function ago(date) {
  if (!date) return '–';
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  if (s < 86400 * 7) return Math.floor(s / 86400) + ' days ago';
  return date.toLocaleDateString();
}

async function loadBoard() {
  $('tMsg').innerHTML = '<p class="muted">Loading students…</p>';
  try {
    students = await window.PEWE.listStudents();
  } catch (e) {
    console.error(e);
    return message('<h2>Could not load students</h2><p class="hint">Check your internet connection and that the Firestore rules are published, then refresh.</p>');
  }
  students.sort((a, b) => (b.lastActive?.getTime() || 0) - (a.lastActive?.getTime() || 0));
  $('tMsg').classList.add('hidden');
  $('tBoard').classList.remove('hidden');
  render();
  if (openId) showStudent(openId);
}

function render() {
  const today = keyOf(new Date());
  const week = lastDays(7);
  const q = ($('tSearch').value || '').toLowerCase();
  const list = students.filter((s) => !q || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));

  $('tCount').textContent = `(${students.length})`;
  const activeToday = students.filter((s) => (s.days || {})[today]?.tries || ((s.pron || {}).days || {})[today]?.tries || ((s.shad || {}).days || {})[today]?.tries).length;
  const classWeek = students.reduce((a, s) => { const t = sum({ ...s.days }, week); const p = sum((s.pron || {}).days, week); t.tries += p.tries; t.correct += p.correct; t.score += p.score; const q = sum((s.shad || {}).days, week); t.tries += q.tries; t.correct += q.correct; t.score += q.score; a.tries += t.tries; a.correct += t.correct; a.score += t.score; return a; }, { tries: 0, correct: 0, score: 0 });
  $('tClass').innerHTML = `
    <div class="stat"><div class="stat-val">${students.length}</div><div class="stat-lbl">Students</div></div>
    <div class="stat"><div class="stat-val">${activeToday}</div><div class="stat-lbl">Practised today</div></div>
    <div class="stat"><div class="stat-val">${classWeek.score}</div><div class="stat-lbl">Class points, 7 days</div></div>
    <div class="stat"><div class="stat-val">${classWeek.tries ? pct(classWeek.correct, classWeek.tries) + '%' : '–'}</div><div class="stat-lbl">Class accuracy, 7 days</div></div>`;

  $('tTable').querySelector('tbody').innerHTML = list.length ? list.map((s) => {
    const t = (s.days || {})[today] || {};
    const w = sum(s.days, week);
    const all = sum(s.days);
    const acc = pct(all.correct, all.tries);
    const pw = sum((s.pron || {}).days, week);
    const sw = sum((s.shad || {}).days, week);
    return `<tr data-id="${esc(s.id)}" class="${s.id === openId ? 'sel' : ''}" tabindex="0">
      <td><div class="w">${esc(s.name || 'Student')}</div><div class="n">${esc(s.email)}</div></td>
      <td>${esc(ago(s.lastActive))}</td>
      <td>${t.tries ? `${t.score || 0} pts · ${pct(t.correct, t.tries)}%` : '–'}</td>
      <td>${w.score} pts</td>
      <td class="${all.tries ? (acc >= 80 ? 'acc-good' : 'acc-bad') : ''}">${all.tries ? acc + '%' : '–'}</td>
      <td>${(s.words || []).length}</td>
      <td>${pw.score} pts · ${((s.pron || {}).words || []).length} words</td>
      <td>${sw.score} pts · ${((s.shad || {}).sentences || []).length} sentences</td>
    </tr>`;
  }).join('') : '<tr><td colspan="8" class="muted">No students yet. Share the website link; students appear here after they sign in.</td></tr>';
}

function showStudent(id) {
  const s = students.find((x) => x.id === id);
  if (!s) return;
  openId = id;
  render();
  const days = lastDays(14);
  const words = [...(s.words || [])].sort((a, b) => pct(a.correct, a.tries) - pct(b.correct, b.tries) || (b.tries || 0) - (a.tries || 0));
  const all = sum(s.days);
  const pacc = (w) => { const t = (w.sayTries || 0) + (w.stressTries || 0); return t ? ((w.sayOk || 0) + (w.stressOk || 0)) / t : 2; };
  const pron = [...((s.pron || {}).words || [])].sort((a, b) => pacc(a) - pacc(b));
  const pAll = sum((s.pron || {}).days);
  const shad = [...((s.shad || {}).sentences || [])].sort((a, b) => (a.tries ? a.best || 0 : 101) - (b.tries ? b.best || 0 : 101));
  const sAll = sum((s.shad || {}).days);
  const el = $('tDetail');
  el.innerHTML = `
    <div class="lib-head">
      <h2>${esc(s.name || 'Student')} <span class="muted">${esc(s.email)}</span></h2>
      <button class="btn ghost small" type="button" id="tClose">Close</button>
    </div>
    <p class="hint">Total: ${all.score} points · ${all.tries} tries · ${all.tries ? pct(all.correct, all.tries) + '% accuracy' : 'no practice yet'} · ${words.length} words · Pronunciation: ${pAll.score} points, ${pAll.tries ? pct(pAll.correct, pAll.tries) + '% right' : 'no practice yet'} · Shadowing: ${sAll.score} points, ${sAll.tries} tries</p>
    <h3 class="sub-h">Last 14 days</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Day</th><th>Score</th><th>Tries</th><th>Accuracy</th><th>New words</th><th>Pronunciation</th><th>Shadowing</th></tr></thead>
      <tbody>${days.map((k) => {
        const d = (s.days || {})[k] || {};
        const label = new Date(k + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const pd = (((s.pron || {}).days || {})[k] || {});
        const sd = (((s.shad || {}).days || {})[k] || {});
        return `<tr class="${d.tries || pd.tries || sd.tries ? '' : 'dim'}"><td>${label}</td><td>${d.score || 0}</td><td>${d.tries || 0}</td><td>${d.tries ? pct(d.correct, d.tries) + '%' : '–'}</td><td>${d.newWords || 0}</td><td>${(((s.pron || {}).days || {})[k] || {}).score || 0} pts</td><td>${(((s.shad || {}).days || {})[k] || {}).score || 0} pts</td></tr>`;
      }).join('')}</tbody>
    </table></div>
    <h3 class="sub-h">Words (weakest first)</h3>
    ${words.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Word</th><th>Accuracy</th><th>Tries</th><th>Added</th></tr></thead>
      <tbody>${words.map((w) => {
        const a = pct(w.correct, w.tries);
        return `<tr><td><div class="w">${esc(w.text)}</div>${w.note ? `<div class="n">${esc(w.note)}</div>` : ''}</td>
          <td class="${w.tries ? (a >= 80 ? 'acc-good' : 'acc-bad') : ''}">${w.tries ? a + '%' : '–'}</td><td>${w.tries || 0}</td><td>${esc(w.added || '')}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<p class="muted">No words yet.</p>'}
    <h3 class="sub-h">Pronunciation words (weakest first)</h3>
    ${pron.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Word</th><th>Saying</th><th>Stress</th><th>Added</th></tr></thead>
      <tbody>${pron.map((w) => {
        const cell = (ok, t) => (t ? `<td class="${pct(ok, t) >= 80 ? 'acc-good' : 'acc-bad'}">${pct(ok, t)}% <span class="muted">(${t})</span></td>` : '<td>–</td>');
        return `<tr><td><div class="w">${esc(w.text)}</div></td>${cell(w.sayOk, w.sayTries)}${cell(w.stressOk, w.stressTries)}<td>${esc(w.added || '')}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<p class="muted">No pronunciation words yet.</p>'}
    <h3 class="sub-h">Shadowing sentences (weakest first)</h3>
    ${shad.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Sentence</th><th>Best</th><th>Last</th><th>Tries</th><th>Added</th></tr></thead>
      <tbody>${shad.map((x) => {
        const c = (v) => (x.tries ? `<td class="${v >= 80 ? 'acc-good' : 'acc-bad'}">${v || 0}%</td>` : '<td>–</td>');
        return `<tr><td><div class="w">${esc(x.text)}</div></td>${c(x.best)}${c(x.last)}<td>${x.tries || 0}</td><td>${esc(x.added || '')}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<p class="muted">No shadowing sentences yet.</p>'}`;
  el.classList.remove('hidden');
  $('tClose').onclick = () => { openId = null; el.classList.add('hidden'); render(); };
}

$('tTable').addEventListener('click', (e) => { const tr = e.target.closest('tr[data-id]'); if (tr) { showStudent(tr.dataset.id); $('tDetail').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
$('tTable').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const tr = e.target.closest('tr[data-id]'); if (tr) showStudent(tr.dataset.id); } });
$('tSearch').addEventListener('input', render);
$('tRefresh').addEventListener('click', loadBoard);

function onAuth() {
  const P = window.PEWE;
  if (!P || !P.ready) return;
  if (!P.enabled) return message('<h2>Accounts are not set up yet</h2><p class="hint">Add the Firebase settings to <code>firebase-config.js</code> to turn on student accounts.</p>');
  if (!P.user) {
    message('<h2>Teacher sign-in</h2><p class="hint">Sign in with your teacher account to see your students\' scores.</p><button class="btn primary" type="button" id="tSignIn">Sign in</button>');
    $('tSignIn').onclick = () => P.openSignIn();
    return;
  }
  if (!P.isTeacher) {
    return message(`<h2>This page is for the teacher</h2>
      <p class="hint">You are signed in as <b>${esc(P.user.email)}</b>, which is not a teacher account.</p>
      <p class="hint">Teacher setup: in the Firebase console open <b>Firestore Database</b>, start a collection named <code>teachers</code>,
      and add a document whose ID is your user ID: <code>${esc(P.user.uid)}</code> (no fields needed). Then refresh this page.</p>`);
  }
  loadBoard();
}
document.addEventListener('pewe-auth', onAuth);
onAuth();
