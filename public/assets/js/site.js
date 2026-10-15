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

  // Calendário do agendamento: monta a partir da lista de dias úteis do servidor.
  // Sábados, domingos e feriados ficam desativados; o <select> continua sendo o campo enviado.
  var selData = document.querySelector('[data-agendamento] select[name="data_preferida"]');
  if (selData) {
    var caixaAg = selData.closest('[data-agendamento]');
    var feriados = {};
    try { feriados = JSON.parse(caixaAg.getAttribute('data-feriados') || '{}'); } catch (e) {}
    var livres = {};
    var datas = [];
    Array.prototype.forEach.call(selData.options, function (o) {
      if (o.value) { livres[o.value] = o.textContent; datas.push(o.value); }
    });
    if (datas.length) {
      var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      var SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
      var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
      var deIso = function (t) { var p = t.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
      var primeira = deIso(datas[0]);
      var ultima = deIso(datas[datas.length - 1]);
      var mesVisto = selData.value ? deIso(selData.value) : primeira;
      mesVisto = new Date(mesVisto.getFullYear(), mesVisto.getMonth(), 1);

      var label = caixaAg.querySelector('label[for="' + selData.id + '"]');
      if (label && !label.id) label.id = selData.id + '-rotulo';

      var cal = document.createElement('div');
      cal.className = 'calendario';
      cal.setAttribute('role', 'group');
      if (label) cal.setAttribute('aria-labelledby', label.id);
      cal.innerHTML =
        '<div class="calendario-topo">' +
          '<button type="button" class="calendario-nav" data-mes="-1" aria-label="Mês anterior">‹</button>' +
          '<p class="calendario-mes" aria-live="polite"></p>' +
          '<button type="button" class="calendario-nav" data-mes="1" aria-label="Próximo mês">›</button>' +
        '</div>' +
        '<table class="calendario-grade" role="grid"><thead><tr>' +
          ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(function (l, i) { return '<th scope="col" abbr="' + SEMANA[i] + '">' + l + '</th>'; }).join('') +
        '</tr></thead><tbody></tbody></table>' +
        '<p class="calendario-escolha" aria-live="polite"></p>' +
        '<p class="calendario-legenda"><span><i class="calendario-chip calendario-chip-livre"></i>disponível</span><span><i class="calendario-chip calendario-chip-feriado"></i>feriado</span><span><i class="calendario-chip calendario-chip-fechado"></i>sem atendimento</span></p>';
      selData.hidden = true;
      selData.insertAdjacentElement('afterend', cal);
      var corpo = cal.querySelector('tbody');
      var titulo = cal.querySelector('.calendario-mes');
      var escolha = cal.querySelector('.calendario-escolha');
      var navAnt = cal.querySelector('[data-mes="-1"]');
      var navProx = cal.querySelector('[data-mes="1"]');

      var mostrarEscolha = function () {
        if (selData.value && livres[selData.value]) {
          escolha.innerHTML = 'Data escolhida: <strong></strong> <button type="button" class="botao-texto calendario-limpar">Sem preferência</button>';
          escolha.querySelector('strong').textContent = livres[selData.value];
        } else {
          escolha.textContent = 'Nenhuma data escolhida (sem preferência).';
        }
      };

      var desenhar = function (focar) {
        var nomeMes = MESES[mesVisto.getMonth()];
        titulo.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) + ' de ' + mesVisto.getFullYear();
        navAnt.disabled = mesVisto <= new Date(primeira.getFullYear(), primeira.getMonth(), 1);
        navProx.disabled = mesVisto >= new Date(ultima.getFullYear(), ultima.getMonth(), 1);
        corpo.innerHTML = '';
        var d = new Date(mesVisto);
        d.setDate(1 - d.getDay());
        var alvoFoco = null;
        for (var semana = 0; semana < 6; semana++) {
          var tr = document.createElement('tr');
          for (var i = 0; i < 7; i++) {
            var td = document.createElement('td');
            if (d.getMonth() === mesVisto.getMonth()) {
              var chave = iso(d);
              var b = document.createElement('button');
              b.type = 'button';
              b.textContent = d.getDate();
              b.setAttribute('data-data', chave);
              var nomeDia = SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()];
              if (livres[chave]) {
                b.className = 'calendario-dia';
                b.setAttribute('aria-label', nomeDia);
                if (chave === selData.value) { b.setAttribute('aria-pressed', 'true'); b.classList.add('escolhido'); }
                else b.setAttribute('aria-pressed', 'false');
                b.tabIndex = -1;
              } else {
                b.disabled = true;
                var motivo = feriados[chave] ? 'feriado: ' + feriados[chave] : (d.getDay() === 0 || d.getDay() === 6) ? 'sem atendimento' : 'indisponível';
                b.className = 'calendario-dia ' + (feriados[chave] ? 'feriado' : 'fechado');
                b.setAttribute('aria-label', nomeDia + ', ' + motivo);
                b.title = motivo.charAt(0).toUpperCase() + motivo.slice(1);
              }
              td.appendChild(b);
            }
            tr.appendChild(td);
            d.setDate(d.getDate() + 1);
          }
          corpo.appendChild(tr);
        }
        var ativos = corpo.querySelectorAll('.calendario-dia:not([disabled])');
        alvoFoco = corpo.querySelector('.escolhido') || ativos[0];
        if (alvoFoco) alvoFoco.tabIndex = 0;
        if (focar && alvoFoco) alvoFoco.focus();
        mostrarEscolha();
      };

      cal.addEventListener('click', function (ev) {
        var nav = ev.target.closest('.calendario-nav');
        if (nav) { mesVisto.setMonth(mesVisto.getMonth() + (+nav.getAttribute('data-mes'))); desenhar(false); return; }
        if (ev.target.closest('.calendario-limpar')) { selData.value = ''; desenhar(false); return; }
        var dia = ev.target.closest('.calendario-dia:not([disabled])');
        if (dia) { selData.value = dia.getAttribute('data-data'); desenhar(false); corpo.querySelector('.escolhido').focus(); }
      });

      // Setas movem entre os dias disponíveis; Enter ou espaço escolhe.
      cal.addEventListener('keydown', function (ev) {
        var atual = ev.target.closest('.calendario-dia');
        if (!atual) return;
        var passos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[ev.key];
        if (!passos) return;
        ev.preventDefault();
        var d = deIso(atual.getAttribute('data-data'));
        for (var n = 0; n < 60; n++) {
          d.setDate(d.getDate() + (passos > 0 ? 1 : -1) * (n === 0 ? Math.abs(passos) : 1));
          if (d < primeira || d > ultima) return;
          if (livres[iso(d)]) break;
        }
        if (!livres[iso(d)]) return;
        if (d.getMonth() !== mesVisto.getMonth() || d.getFullYear() !== mesVisto.getFullYear()) {
          mesVisto = new Date(d.getFullYear(), d.getMonth(), 1);
          desenhar(false);
        }
        var alvo = corpo.querySelector('[data-data="' + iso(d) + '"]');
        corpo.querySelectorAll('.calendario-dia').forEach(function (b) { b.tabIndex = -1; });
        alvo.tabIndex = 0;
        alvo.focus();
      });

      desenhar(false);
    }
  }

  var imprimir = document.querySelector('[data-imprimir]');
  if (imprimir) imprimir.addEventListener('click', function () { window.print(); });
})();
