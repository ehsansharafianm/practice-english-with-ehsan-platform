// Shared top bar for every page: logo, page tabs, the language switch and the light/dark slider.
// Light theme is the default; the choice is remembered on this device.
// To add a new practice tool, add it to PAGES below.
(function () {
  var PAGES = [
    { name: 'Home', path: '' },
    { name: 'Dictation', path: 'dictation/' },
    { name: 'Pronunciation', path: 'pronunciation/' },
    { name: 'Shadowing', path: 'shadowing/' },
    { name: 'Vocabulary', path: 'vocabulary/' }, // words with meanings and pronunciation, and the learner's own library
    { name: 'More soon', path: null } // placeholder for the next tool
  ];

  var KEY = 'pewe-theme';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  root.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');

  // ---- the language being practised: English or Spanish (Spain) ----
  // Every tool reads window.PEWE_L when it starts. Choosing another language reloads the page.
  // A link can also choose it: ?lang=es or ?lang=en.
  var LANG_KEY = 'pewe-lang';
  var LANGS = {
    en: { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', bcp: 'en-US', region: 'US', accent: 'American',
          voiceRe: /^en[-_]US/i, anyVoiceRe: /^en\b/i },
    es: { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', bcp: 'es-ES', region: 'Spain', accent: 'Spanish',
          voiceRe: /^es[-_]ES/i, anyVoiceRe: /^es\b/i }
  };
  var lang = 'en';
  try { lang = localStorage.getItem(LANG_KEY) || 'en'; } catch (e) { /* ignore */ }
  var asked = (location.search.match(/[?&]lang=(en|es)\b/) || [])[1];
  if (asked) { lang = asked; try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ } }
  if (!LANGS[lang]) lang = 'en';
  window.PEWE_LANG = lang;
  window.PEWE_L = LANGS[lang];
  root.setAttribute('data-lang', lang);
  // Storage keys: English keeps the old keys, Spanish adds "-es", so the two never mix.
  window.PEWE_KEY = function (k) { return lang === 'en' ? k : k + '-' + lang; };

  // Site root = folder that holds this script.
  var base = (document.currentScript && document.currentScript.src || '').replace(/site\.js(\?.*)?$/, '');

  // Fill in language words on the page: <span class="L-name">, <span class="L-accent">, the title badge (.L-badge),
  // and Spanish examples in inputs that have data-ph-es="…".
  function fillLang() {
    var L = window.PEWE_L;
    document.querySelectorAll('.L-name').forEach(function (el) { el.textContent = L.name; });
    document.querySelectorAll('.L-accent').forEach(function (el) { el.textContent = L.accent; });
    document.querySelectorAll('.L-badge').forEach(function (el) { el.textContent = L.flag + ' ' + L.name; el.title = 'You are practising ' + L.name + '. Change it at the top right.'; });
    if (lang === 'es') document.querySelectorAll('[data-ph-es]').forEach(function (el) { el.placeholder = el.getAttribute('data-ph-es').replace(/\\n/g, '\n'); });
  }

  // Any button with data-set-lang="en|es" (like the big choice on the home page) changes the language.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-set-lang]');
    if (!b) return;
    var code = b.getAttribute('data-set-lang');
    if (!LANGS[code]) return;
    try { localStorage.setItem(LANG_KEY, code); } catch (err) { /* ignore */ }
    if (code !== lang) location.reload();
  });

  document.addEventListener('DOMContentLoaded', function () {
    fillLang();
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      var on = b.getAttribute('data-set-lang') === lang;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var here = location.href.split('#')[0].split('?')[0].replace(/index\.html$/, '');

    var bar = document.createElement('header');
    bar.className = 'sitebar';

    var brand = document.createElement('a');
    brand.className = 'site-brand';
    brand.href = base;
    brand.innerHTML = '<img src="' + base + 'favicon.svg?v=20261119f" alt="" width="28" height="28"><span>Practice with Ehsan</span>';

    var nav = document.createElement('nav');
    nav.className = 'site-tabs';
    nav.setAttribute('aria-label', 'Pages');
    PAGES.forEach(function (p) {
      if (p.only && p.only !== lang && here !== base + p.path) return; // a tab for one language only
      var el;
      if (p.path === null) {
        el = document.createElement('span');
        el.className = 'site-tab soon';
        el.title = 'More practice tools are coming';
      } else {
        el = document.createElement('a');
        el.className = 'site-tab';
        el.href = base + p.path;
        if (here === base + p.path) { el.classList.add('active'); el.setAttribute('aria-current', 'page'); }
      }
      el.textContent = p.name;
      nav.appendChild(el);
    });

    var sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'theme-switch';
    sw.setAttribute('role', 'switch');
    sw.innerHTML = '<span class="ts-icon ts-sun" aria-hidden="true">☀️</span><span class="ts-icon ts-moon" aria-hidden="true">🌙</span><span class="ts-knob" aria-hidden="true"></span>';
    function paint() {
      var dark = root.getAttribute('data-theme') === 'dark';
      sw.setAttribute('aria-checked', dark ? 'true' : 'false');
      sw.setAttribute('aria-label', 'Dark mode');
      sw.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    sw.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      paint();
    });
    paint();

    // Language switch: English / Español
    var ls = document.createElement('div');
    ls.className = 'lang-switch';
    ls.setAttribute('role', 'group');
    ls.setAttribute('aria-label', 'Language to practise');
    Object.keys(LANGS).forEach(function (code) {
      var L = LANGS[code], b = document.createElement('button');
      b.type = 'button';
      b.className = 'lang-btn' + (code === lang ? ' on' : '');
      b.setAttribute('aria-pressed', code === lang ? 'true' : 'false');
      b.title = 'Practise ' + L.name;
      b.innerHTML = '<span aria-hidden="true">' + L.flag + '</span> ' + L.native;
      b.addEventListener('click', function () {
        if (code === lang) return;
        try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* ignore */ }
        location.href = location.href.replace(/([?&])lang=(en|es)\b&?/, '$1').replace(/[?&]$/, '');
      });
      ls.appendChild(b);
    });

    // Account button + language switch + theme slider live together in the top-right corner, on every page.
    var right = document.createElement('div');
    right.className = 'site-right';
    right.appendChild(sw);
    bar.appendChild(brand);
    bar.appendChild(ls); // its own place in the bar: beside the account button, or on its own row on phones
    bar.appendChild(right);
    bar.appendChild(nav);
    document.body.insertBefore(bar, document.body.firstChild);
    // Let account.js add the Sign in button to this bar.
    // On small screens the tabs scroll sideways: show the current page's tab.
    var act = nav.querySelector('.active');
    if (act && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = act.offsetLeft - nav.offsetLeft - 16;
    window.__peweBar = bar;
    window.__peweBase = base;
    document.dispatchEvent(new CustomEvent('pewe-bar'));
  });
})();
