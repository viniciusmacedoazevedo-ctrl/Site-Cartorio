'use strict';
/** Página pública de Transparência e download dos demonstrativos em PDF. */
const fs = require('node:fs');
const path = require('node:path');
const { cartorio, RUBRICAS, RAIZ, html, raw, dataBr, primeiraMaiuscula, rawurlencode } = require('../lib/base');
const { qTodos, qUm } = require('../lib/db');
const { Resposta } = require('../lib/http');
const { pagina } = require('../views/layout');

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mesNome = (m) => MESES[m - 1] || '';
const PASTA = path.join(RAIZ, 'storage', 'transparencia');

/** Como number_format($v, 2, ',', '.'). */
function numeroBr(v) {
  const [int, dec] = Math.abs(v).toFixed(2).split('.');
  return (v < 0 ? '-' : '') + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
}
const moeda = (v) => (v === null || v === undefined ? '–' : 'R$ ' + numeroBr(v));

/** Converte "1.234,56", "1234,56" ou "1234.56" em número; vazio vira null; inválido vira NaN. */
function lerMoeda(s) {
  let t = String(s ?? '').replace(/R\$/g, '').replace(/ /g, '').trim();
  if (t === '') return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(/,/g, '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return NaN;
  return Math.round(Number(t) * 100) / 100;
}

async function transparencia(ctx) {
  const anos = (await qTodos('SELECT DISTINCT ano FROM transparencia ORDER BY ano DESC')).map((r) => Number(r.ano));
  let ano = Number.parseInt(ctx.query.get('ano') || '', 10);
  if (!ano) ano = anos[0] || new Date().getFullYear();
  if (anos.length && !anos.includes(ano)) ano = anos[0];
  const linhas = await qTodos('SELECT * FROM transparencia WHERE ano = ? ORDER BY mes DESC', [ano]);
  const totais = Object.fromEntries(RUBRICAS.map((r) => [r.chave, 0]));

  let tabela;
  if (!linhas.length) {
    tabela = html`
      <div class="vazio">
        <p><strong>Ainda não há meses publicados.</strong> Os valores de cada mês são publicados depois do fechamento contábil.</p>
      </div>
    `;
  } else {
    const corpo = linhas.map((l) => {
      let v = {};
      try {
        v = JSON.parse(l.valores_json) || {};
      } catch {
        v = {};
      }
      const celulas = RUBRICAS.map((r) => {
        const x = r.chave in v ? Number(v[r.chave]) : null;
        if (x !== null) totais[r.chave] += x;
        return html`<td data-rotulo="${r.rotulo}">${moeda(x)}</td>
              `;
      });
      const mes = primeiraMaiuscula(mesNome(Number(l.mes)));
      return html`
            <tr>
              <th scope="row">${mes}</th>
              ${celulas}
              <td data-rotulo="Demonstrativo">${l.arquivo ? html`<a href="/transparencia/arquivo?id=${Number(l.id)}">PDF</a>` : '–'}</td>
            </tr>
            ${String(l.observacao || '').trim() !== '' ? html`
              <tr class="tabela-obs"><td colspan="${RUBRICAS.length + 2}">${mes}: ${l.observacao}</td></tr>
            ` : ''}
          `;
    });
    const ultima = linhas.map((l) => String(l.atualizado_em)).sort().pop();
    tabela = html`
      <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Receitas públicas de ${ano}">
        <table class="tabela tabela-numeros">
          <caption>Receitas e despesas públicas de ${ano}, em reais</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              ${RUBRICAS.map((r) => html`<th scope="col">${r.rotulo}</th>`)}
              <th scope="col">PDF</th>
            </tr>
          </thead>
          <tbody>
          ${corpo}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total do ano</th>
              ${RUBRICAS.map((r) => html`<td data-rotulo="${r.rotulo}">${moeda(totais[r.chave])}</td>`)}
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="atualizado">Última atualização: ${dataBr(ultima)}.</p>
    `;
  }

  const seletor = anos.length ? html`
      <nav class="indice" aria-label="Ano">
        ${anos.map((a) => html`<a href="/transparencia?ano=${a}"${raw(a === ano ? ' aria-current="page"' : '')}>${a}</a>
        `)}
      </nav>
    ` : '';

  return ctx.html(pagina(ctx, { titulo: 'Transparência', descricao: 'Receitas públicas mensais do Cartório de São José do Campestre: parcela pública dos emolumentos e repasses aos fundos.' }, html`
<main id="conteudo" class="pagina" tabindex="-1">
  <div class="largura">
    <div class="pagina-cabeca">
      <h1>Transparência</h1>
      <p class="lead">Receitas públicas arrecadadas mês a mês com a cobrança de emolumentos e outros serviços, e despesas públicas, conforme a Resolução CNJ nº 215/2015, art. 6º, § 3º, com a redação da Resolução CNJ nº 670/2025.</p>
    </div>

    ${seletor}
    ${tabela}

    <div class="texto-legal texto-estreito">
      <h2>O que é publicado aqui</h2>
      <ul>
        <li><strong>Emolumentos (parcela pública)</strong> e repasses aos fundos estaduais: <strong>FDJ</strong> (Fundo de Desenvolvimento da Justiça), <strong>FRMP</strong> (Fundo de Reaparelhamento do Ministério Público), <strong>FCRCPN</strong> (Fundo de Compensação dos Registradores Civis das Pessoas Naturais) e <strong>FUNAF</strong>, como define a norma do CNJ.</li>
        <li>O ISS é o imposto municipal sobre os serviços, recolhido ao Município de São José do Campestre.</li>
      </ul>
      <h2>Parcela privada e remuneração</h2>
      <p>A parcela privada dos emolumentos e as demais receitas e despesas privadas da serventia não são divulgadas abertamente. Quem tiver interesse legítimo pode pedir acesso por requerimento fundamentado à Corregedoria Geral de Justiça do RN, observada a LGPD (Resolução CNJ nº 215/2015, art. 6º, § 3º-B). A Corregedoria e os órgãos de controle têm acesso pleno a esses valores.</p>
      <p><a href="${cartorio('corregedoria_url')}" rel="noopener" target="_blank">Portal do extrajudicial da Corregedoria do RN</a> · <a href="/contato?assunto=${raw(rawurlencode('Pedido de informação'))}">Pedir outra informação ao cartório</a></p>
    </div>
  </div>
</main>`));
}

async function arquivo(ctx, naoEncontrado) {
  const id = Number.parseInt(ctx.query.get('id') || '0', 10) || 0;
  const l = await qUm('SELECT ano, mes, arquivo, arquivo_nome FROM transparencia WHERE id = ?', [id]);
  const caminho = l && l.arquivo ? path.join(PASTA, path.basename(l.arquivo)) : null;
  if (!caminho || !fs.existsSync(caminho)) return naoEncontrado(ctx);
  const nome = `transparencia-${l.ano}-${String(l.mes).padStart(2, '0')}.pdf`;
  const dados = fs.readFileSync(caminho);
  return new Resposta(200, dados, {
    'Content-Type': 'application/pdf',
    'Content-Length': String(dados.length),
    'Content-Disposition': `inline; filename="${nome}"`,
  });
}

module.exports = { transparencia, arquivo, mesNome, moeda, lerMoeda, numeroBr, PASTA, MESES };
