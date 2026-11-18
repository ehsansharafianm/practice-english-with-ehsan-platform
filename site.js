// Shared top bar for every page: logo, page tabs, and the light/dark slider.
// Light theme is the default; the choice is remembered on this device.
// To add a new practice tool, add it to PAGES below.
(function () {
  var PAGES = [
    { name: 'Home', path: '' },
    { name: 'Dictation', path: 'dictation/' },
    { name: 'Pronunciation', path: 'pronunciation/' },
    { name: 'More soon', path: null } // placeholder for the next tool
  ];

  var KEY = 'pewe-theme';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  root.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');

  // Site root = folder that holds this script.
  var base = (document.currentScript && document.currentScript.src || '').replace(/site\.js(\?.*)?$/, '');

  document.addEventListener('DOMContentLoaded', function () {
    var here = location.href.split('#')[0].split('?')[0].replace(/index\.html$/, '');

    var bar = document.createElement('header');
    bar.className = 'sitebar';

    var brand = document.createElement('a');
    brand.className = 'site-brand';
    brand.href = base;
    brand.innerHTML = '<img src="' + base + 'favicon.svg" alt="" width="28" height="28"><span>Practice English with Ehsan Platform</span>';

    var nav = document.createElement('nav');
    nav.className = 'site-tabs';
    nav.setAttribute('aria-label', 'Pages');
    PAGES.forEach(function (p) {
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

    bar.appendChild(brand);
    bar.appendChild(nav);
    bar.appendChild(sw);
    document.body.insertBefore(bar, document.body.firstChild);
    // Let account.js add the Sign in button to this bar.
    window.__peweBar = bar;
    window.__peweBase = base;
    document.dispatchEvent(new CustomEvent('pewe-bar'));
  });
})();
