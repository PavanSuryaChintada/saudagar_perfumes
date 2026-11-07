// Applies the saved light/dark choice before the app mounts (no flash). Kept as a file so the CSP needs no inline scripts.
(function () {
  try {
    var t = localStorage.getItem('saudagar_theme_mode');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
