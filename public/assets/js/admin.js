(function () {
  'use strict';
  // Confirma antes de desativar um usuário
  document.querySelectorAll('form input[name="acao"][value="alternar"]').forEach(function (campo) {
    var form = campo.form;
    form.addEventListener('submit', function (ev) {
      var txt = form.querySelector('button').textContent.trim();
      if (txt === 'Desativar' && !window.confirm('Desativar o acesso deste usuário?')) ev.preventDefault();
    });
  });
  document.querySelectorAll('form[data-confirmar]').forEach(function (f) {
    f.addEventListener('submit', function (ev) { if (!window.confirm(f.getAttribute('data-confirmar'))) ev.preventDefault(); });
  });
})();
