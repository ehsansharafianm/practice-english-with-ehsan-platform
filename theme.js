// Light theme by default; the button at the top of each page switches between light and dark,
// and the choice is remembered.
(function () {
  var KEY = 'pewe-theme';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  root.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    function paint() {
      var dark = root.getAttribute('data-theme') === 'dark';
      btn.textContent = dark ? '☀️ Light' : '🌙 Dark';
      btn.title = dark ? 'Switch to light background' : 'Switch to dark background';
      btn.setAttribute('aria-label', btn.title);
    }
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      paint();
    });
    paint();
    // Top bar on every page that loads this script.
    var bar = document.createElement('div');
    bar.className = 'topbar';
    bar.appendChild(btn);
    document.body.insertBefore(bar, document.body.firstChild);
  });
})();
