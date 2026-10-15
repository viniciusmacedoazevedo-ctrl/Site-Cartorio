// Executa antes da página aparecer: marca JS ativo e aplica preferências de acessibilidade salvas.
(function () {
  var h = document.documentElement;
  h.classList.add('js');
  try {
    if (localStorage.getItem('sjc_contraste') === '1') h.classList.add('alto-contraste');
    var f = parseInt(localStorage.getItem('sjc_fonte') || '0', 10);
    if (f) h.setAttribute('data-fonte', String(f));
  } catch (e) {}
})();
