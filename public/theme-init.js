(function () {
  var t = 'light';
  try {
    localStorage.removeItem('portfolio-theme'); // old saved choice that used to override the system
    var o = sessionStorage.getItem('portfolio-theme-override');
    if (o === 'light' || o === 'dark') t = o;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
})();
