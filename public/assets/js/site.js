(function () {
  'use strict';

  // Menu no celular
  var botao = document.querySelector('.menu-botao');
  var menu = document.getElementById('menu-principal');
  if (botao && menu) {
    botao.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      botao.textContent = aberto ? 'Fechar' : 'Menu';
    });
  }

  // Janelas de privacidade (abrem sobre a página; sem JS, o link leva à página /privacidade)
  document.addEventListener('click', function (ev) {
    var link = ev.target.closest('[data-dialogo]');
    if (link) {
      var dlg = document.getElementById(link.getAttribute('data-dialogo'));
      if (dlg && typeof dlg.showModal === 'function') {
        ev.preventDefault();
        document.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); });
        dlg.showModal();
        dlg.scrollTop = 0;
      }
      return;
    }
    if (ev.target.closest('[data-fechar]')) {
      ev.target.closest('dialog').close();
      return;
    }
    if (ev.target.tagName === 'DIALOG') {
      var r = ev.target.getBoundingClientRect();
      if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) {
        ev.target.close();
      }
    }
  });
  // Links dentro das janelas que levam a outra página fecham a janela
  document.querySelectorAll('.dialogo-corpo a[href^="/"]:not([data-dialogo])').forEach(function (a) {
    a.addEventListener('click', function () { var d = a.closest('dialog'); if (d) d.close(); });
  });

  // Aviso de cookies
  var aviso = document.getElementById('aviso-cookies');
  if (aviso && document.cookie.indexOf('sjc_cookies=ok') === -1) {
    aviso.hidden = false;
    document.body.classList.add('com-cookies');
    aviso.querySelector('[data-aceitar-cookies]').addEventListener('click', function () {
      var seguro = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = 'sjc_cookies=ok; Max-Age=31536000; Path=/; SameSite=Lax' + seguro;
      aviso.hidden = true;
      document.body.classList.remove('com-cookies');
    });
  }

  // Data e período só aparecem para agendamento presencial
  var blocoAgenda = document.querySelector('[data-agendamento]');
  if (blocoAgenda) {
    var radios = document.querySelectorAll('input[name="modalidade"]');
    var atualizar = function () {
      var marcado = document.querySelector('input[name="modalidade"]:checked');
      blocoAgenda.hidden = !(marcado && marcado.value === 'Agendamento presencial');
    };
    radios.forEach(function (r) { r.addEventListener('change', atualizar); });
    atualizar();
  }

  // Máscaras simples de CPF e telefone
  var mascaras = {
    cpf: function (v) {
      v = v.replace(/\D/g, '').slice(0, 11);
      return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    },
    tel: function (v) {
      v = v.replace(/\D/g, '').slice(0, 11);
      if (v.length <= 2) return v.length ? '(' + v : v;
      if (v.length <= 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
      if (v.length <= 10) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
      return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
    }
  };
  document.querySelectorAll('[data-mascara]').forEach(function (campo) {
    var fn = mascaras[campo.getAttribute('data-mascara')];
    campo.addEventListener('input', function () { campo.value = fn(campo.value); });
  });

  // Protocolo e código em maiúsculas
  ['c-protocolo', 'c-codigo'].forEach(function (id) {
    var c = document.getElementById(id);
    if (c) c.addEventListener('input', function () { c.value = c.value.toUpperCase(); });
  });

  // Leva o foco para alertas e resultados, para leitores de tela anunciarem
  var foco = document.querySelector('[data-foco]');
  if (foco) foco.focus();

  // Acessibilidade: alto contraste e tamanho da letra (preferência salva neste navegador)
  var raiz = document.documentElement;
  var guardar = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var btContraste = document.querySelector('[data-contraste]');
  if (btContraste) {
    btContraste.setAttribute('aria-pressed', raiz.classList.contains('alto-contraste') ? 'true' : 'false');
    btContraste.addEventListener('click', function () {
      var ativo = raiz.classList.toggle('alto-contraste');
      btContraste.setAttribute('aria-pressed', ativo ? 'true' : 'false');
      guardar('sjc_contraste', ativo ? '1' : '0');
    });
  }
  document.querySelectorAll('[data-fonte]').forEach(function (b) {
    if (b === raiz) return;
    b.addEventListener('click', function () {
      var atual = parseInt(raiz.getAttribute('data-fonte') || '0', 10);
      var novo = Math.max(-1, Math.min(2, atual + parseInt(b.getAttribute('data-fonte'), 10)));
      if (novo) raiz.setAttribute('data-fonte', String(novo)); else raiz.removeAttribute('data-fonte');
      guardar('sjc_fonte', String(novo));
    });
  });

  // Pedido: mostra os documentos obrigatórios do serviço escolhido
  var selServico = document.getElementById('f-pedido-servico');
  var caixaDocs = document.getElementById('docs-servico');
  if (selServico && caixaDocs) {
    var mapa = {};
    try { mapa = JSON.parse(caixaDocs.getAttribute('data-docs') || '{}'); } catch (e) {}
    var mostrar = function () {
      var d = mapa[selServico.value];
      if (!d) { caixaDocs.hidden = true; return; }
      caixaDocs.querySelector('h3').textContent = 'Documentos obrigatórios: ' + d.nome;
      var ul = caixaDocs.querySelector('ul');
      ul.innerHTML = '';
      d.docs.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
      caixaDocs.hidden = false;
    };
    selServico.addEventListener('change', mostrar);
    mostrar();
  }

  var imprimir = document.querySelector('[data-imprimir]');
  if (imprimir) imprimir.addEventListener('click', function () { window.print(); });
})();
