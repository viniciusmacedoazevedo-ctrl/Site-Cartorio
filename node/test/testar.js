'use strict';
/**
 * Testes automáticos da versão Node.js (sem dependências externas).
 * Uso: node node/test/testar.js
 *   - sem variáveis: usa SQLite num diretório temporário;
 *   - com TESTE_PG="host=... port=... database=... username=... password=..." usa PostgreSQL.
 * Sobe o site numa porta livre, envia formulários, entra no painel e confere o banco.
 */
process.env.TZ = 'America/Fortaleza';
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const RAIZ = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cartorio-teste-'));
const usarPg = Boolean(process.env.TESTE_PG);

/* ------------------------------------------------------------- servidor SMTP falso */

const recebidos = [];
function smtpFalso() {
  return new Promise((resolve) => {
    const srv = net.createServer((s) => {
      s.setEncoding('utf8');
      let dados = false;
      let msg = '';
      let buf = '';
      const env = { de: '', para: [] };
      s.write('220 teste ESMTP\r\n');
      s.on('data', (d) => {
        buf += d;
        let i;
        while ((i = buf.indexOf('\r\n')) >= 0) {
          const linha = buf.slice(0, i);
          buf = buf.slice(i + 2);
          if (dados) {
            if (linha === '.') {
              dados = false;
              recebidos.push({ ...env, msg });
              s.write('250 ok\r\n');
            } else msg += linha + '\n';
            continue;
          }
          if (/^EHLO/i.test(linha)) s.write('250-teste\r\n250 AUTH LOGIN\r\n');
          else if (/^AUTH LOGIN/i.test(linha)) s.write('334 VXNlcm5hbWU6\r\n');
          else if (linha === Buffer.from('usuario@teste').toString('base64')) s.write('334 UGFzc3dvcmQ6\r\n');
          else if (linha === Buffer.from('senha-smtp').toString('base64')) s.write('235 ok\r\n');
          else if (/^MAIL FROM/i.test(linha)) { env.de = linha; s.write('250 ok\r\n'); }
          else if (/^RCPT TO/i.test(linha)) { env.para.push(linha.slice(9, -1)); s.write('250 ok\r\n'); }
          else if (/^DATA/i.test(linha)) { dados = true; msg = ''; s.write('354 vai\r\n'); }
          else if (/^QUIT/i.test(linha)) { s.end('221 tchau\r\n'); }
          else s.write('535 não\r\n');
        }
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

/* ------------------------------------------------------------- navegador simples com cookies */

class Navegador {
  constructor(base) {
    this.base = base;
    this.cookie = '';
  }
  async ir(caminho, opcoes = {}) {
    const r = await fetch(this.base + caminho, {
      redirect: 'manual', ...opcoes, headers: { ...(opcoes.headers || {}), cookie: this.cookie },
    });
    const sc = r.headers.get('set-cookie');
    if (sc) {
      const v = sc.split(';')[0];
      this.cookie = v.endsWith('=') ? '' : v;
    }
    r.texto = Buffer.from(await r.arrayBuffer()).toString('utf8');
    return r;
  }
  csrf(texto) {
    const m = texto.match(/name="_csrf" value="([a-f0-9]+)"/);
    return m ? m[1] : '';
  }
  async enviar(caminho, campos, arquivo) {
    const pagina = await this.ir(caminho.split('#')[0]);
    const fd = new FormData();
    fd.set('_csrf', this.csrf(pagina.texto));
    const t = pagina.texto.match(/name="_t" value="([^"]+)"/);
    if (t) fd.set('_t', t[1]);
    for (const [k, v] of Object.entries(campos)) fd.set(k, v);
    if (arquivo) fd.set(arquivo.campo, new Blob([arquivo.dados], { type: arquivo.tipo }), arquivo.nome);
    return this.ir(caminho, { method: 'POST', body: fd });
  }
}

/* ------------------------------------------------------------- execução */

let total = 0;
const falhas = [];
async function caso(nome, fn) {
  total++;
  try {
    await fn();
    console.log(`  ok     ${nome}`);
  } catch (err) {
    falhas.push(nome);
    console.log(`  FALHA  ${nome}\n         ${err.message.split('\n')[0]}`);
  }
}

function assinarTempo(chave, segundosAtras = 5) {
  const t = String(Math.floor(Date.now() / 1000) - segundosAtras);
  return `${t}.${crypto.createHmac('sha256', chave).update(t).digest('hex')}`;
}

async function main() {
  const smtp = await smtpFalso();
  const chave = crypto.randomBytes(32).toString('hex');
  let db;
  if (usarPg) {
    db = { driver: 'pgsql', ...Object.fromEntries(process.env.TESTE_PG.split(/\s+/).map((p) => p.split('='))) };
    db.port = Number(db.port || 5432);
  } else {
    db = { driver: 'sqlite', sqlite_path: path.join(TMP, 'teste.sqlite') };
  }
  const config = {
    base_url: 'http://localhost', app_key: chave, debug: false, db,
    mail: { transport: 'smtp', from_email: 'nao-responda@cartoriosjcampestre.com.br', from_name: 'Cartório de São José do Campestre',
      smtp: { host: '127.0.0.1', port: smtp.address().port, encryption: 'none', username: 'usuario@teste', password: 'senha-smtp', timeout: 5 } },
    destinos: { pedido: 'contato@teste', contato: 'contato@teste', ouvidoria: 'ouvidoria@teste', lgpd: 'lgpd@teste', lgpd_copia: 'dpo@teste' },
    uploads: { max_bytes: 5 * 1024 * 1024, path: path.join(TMP, 'anexos') },
    rate_limit: { max: 4, janela_min: 15 },
    admin_timeout_min: 30,
  };
  fs.writeFileSync(path.join(TMP, 'config.json'), JSON.stringify(config));
  process.env.CARTORIO_CONFIG = path.join(TMP, 'config.json');

  const { q, qUm, qValor, qTodos, fecharBanco, driver } = require('../lib/db');
  if (usarPg) {
    for (const t of ['historico', 'anexos', 'registros', 'contadores', 'limites', 'auditoria', 'transparencia', 'usuarios']) await q(`DELETE FROM ${t}`);
  } else {
    const { DatabaseSync } = require('node:sqlite');
    new DatabaseSync(db.sqlite_path).exec(fs.readFileSync(path.join(RAIZ, 'database', 'schema.sqlite.sql'), 'utf8'));
  }
  const { hashSenha } = require('../lib/auth');
  const { agora } = require('../lib/base');
  const criar = (nome, email, perfil, senha) => q('INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo, criado_em) VALUES (?, ?, ?, ?, 1, ?)', [nome, email, hashSenha(senha), perfil, agora()]);
  await criar('Admin', 'admin@teste.br', 'admin', 'SenhaAdmin123');
  await criar('Atendente', 'atend@teste.br', 'atendente', 'SenhaAtend123');
  await q("INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo, criado_em) VALUES ('Antiga', 'antiga@teste.br', '$2y$10$abcdefghijklmnopqrstuuWxXUSVB4f5A1d8x8n4Bqv0oQx8F8yy', 'admin', 1, ?)", [agora()]);

  const { iniciar } = require('../server');
  const servidor = iniciar(0);
  await new Promise((r) => servidor.once('listening', r));
  const base = `http://localhost:${servidor.address().port}`;
  console.log(`\nTestes da versão Node.js (${driver()})\n`);

  const cidadao = new Navegador(base);
  const rotas = ['/', '/serventia', '/servicos', '/emolumentos', '/transparencia', '/validacao', '/ouvidoria', '/contato', '/pedido', '/protocolo', '/privacidade', '/termos', '/cookies', '/acessibilidade', '/conformidade', '/admin'];

  await caso('todas as páginas públicas respondem 200', async () => {
    for (const r of rotas) assert.equal((await cidadao.ir(r)).status, 200, r);
  });
  await caso('página inexistente responde 404 com o layout do site', async () => {
    const r = await cidadao.ir('/nao-existe');
    assert.equal(r.status, 404);
    assert.match(r.texto, /Página não encontrada/);
  });
  await caso('cabeçalhos de segurança', async () => {
    const r = await cidadao.ir('/');
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });
  await caso('arquivos estáticos e bloqueio de arquivos internos', async () => {
    assert.equal((await cidadao.ir('/assets/css/site.css')).status, 200);
    for (const p of ['/../node/config.json', '/%2e%2e/node/config.json', '/.htaccess', '/index.php', '/../app/config.php', '/assets/../../storage/']) {
      const r = await cidadao.ir(p);
      assert.notEqual(r.status, 200, p);
      assert.doesNotMatch(r.texto, /app_key/, p);
    }
  });

  let protocoloContato;
  let codigoContato;
  await caso('contato: envio gera protocolo, grava no banco e manda e-mails', async () => {
    const r = await cidadao.enviar('/contato', { nome: 'Maria José', email: 'maria@exemplo.com.br', assunto: 'Dúvida', mensagem: 'Qual o prazo?', aceite: '1', _t: assinarTempo(chave) });
    assert.equal(r.status, 303, r.texto.slice(0, 200));
    assert.equal(r.headers.get('location'), '/enviado#conteudo');
    const recibo = await cidadao.ir('/enviado');
    const m = recibo.texto.match(/<strong>(CTT-\d{4}-\d{6})<\/strong>[\s\S]*?<strong>([A-Z]{4})<\/strong>/);
    assert.ok(m, 'recibo sem protocolo');
    [, protocoloContato, codigoContato] = m;
    assert.equal(protocoloContato, `CTT-${new Date().getFullYear()}-000001`);
    const reg = await qUm('SELECT * FROM registros WHERE protocolo = ?', [protocoloContato]);
    assert.equal(reg.nome, 'Maria José');
    assert.equal(recebidos.length, 2, 'esperava e-mail ao cartório e ao cliente');
    assert.deepEqual(recebidos[0].para, ['contato@teste']);
    assert.deepEqual(recebidos[1].para, ['maria@exemplo.com.br']);
    const corpo = Buffer.from(recebidos[1].msg.split('\n\n')[1].replace(/\n/g, ''), 'base64').toString('utf8');
    assert.match(corpo, new RegExp(`Código de consulta: ${codigoContato}`));
    assert.match(recebidos[1].msg, /Subject: =\?UTF-8\?B\?/);
    const hist = await qTodos('SELECT acao FROM historico WHERE registro_id = ?', [reg.id]);
    assert.deepEqual(hist.map((h) => h.acao).sort(), ['E-mail enviado ao cartório', 'Protocolo enviado ao cliente', 'Recebido pelo site'].sort());
  });
  await caso('recibo só aparece uma vez', async () => {
    const r = await cidadao.ir('/enviado');
    assert.equal(r.status, 303);
  });
  await caso('formulário com erros volta com mensagens e valores', async () => {
    const r = await cidadao.enviar('/contato', { nome: '', email: 'invalido', mensagem: 'x', aceite: '', _t: assinarTempo(chave) });
    assert.equal(r.status, 200);
    assert.match(r.texto, /Corrija os 3 campos indicados/);
    assert.match(r.texto, /Digite um e-mail válido/);
    assert.match(r.texto, /value="invalido"/);
  });
  await caso('envio rápido demais ou sem CSRF é recusado', async () => {
    let r = await cidadao.enviar('/contato', { nome: 'A', email: 'a@b.com.br', mensagem: 'x', aceite: '1', _t: assinarTempo(chave, 0) });
    assert.match(r.texto, /Aguarde alguns segundos/);
    const fd = new FormData();
    fd.set('_csrf', 'falso');
    r = await cidadao.ir('/contato', { method: 'POST', body: fd });
    assert.match(r.texto, /ficou aberta por muito tempo/);
  });
  await caso('pedido com anexo PDF (CPF formatado e serviço pelo nome)', async () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    const r = await cidadao.enviar('/pedido', {
      servico: 'escrituras', modalidade: 'Pedido online', nome: 'João', cpf: '52998224725', telefone: '(84) 99999-0000',
      mensagem: 'Segunda via', aceite: '1', _t: assinarTempo(chave),
    }, { campo: 'anexo', dados: pdf, tipo: 'application/pdf', nome: 'documento ç.pdf' });
    assert.equal(r.status, 303, r.texto.match(/alerta-erro[^<]*>([^<]*)/)?.[1]);
    const reg = await qUm("SELECT * FROM registros WHERE formulario = 'pedido'");
    assert.equal(reg.cpf, '529.982.247-25');
    assert.equal(reg.tipo, 'Escrituras públicas');
    const a = await qUm('SELECT * FROM anexos WHERE registro_id = ?', [reg.id]);
    assert.equal(a.mime, 'application/pdf');
    assert.equal(a.nome_original, 'documento ç.pdf');
    assert.ok(fs.existsSync(path.join(config.uploads.path, a.arquivo)));
  });
  await caso('anexo disfarçado (não é PDF/JPG/PNG) é recusado', async () => {
    const r = await cidadao.enviar('/ouvidoria', { tipo: 'Elogio', mensagem: 'Bom atendimento', aceite: '1', _t: assinarTempo(chave) },
      { campo: 'anexo', dados: Buffer.from('MZ\x90\x00 executavel'), tipo: 'application/pdf', nome: 'virus.pdf' });
    assert.match(r.texto, /Formato não aceito/);
  });
  await caso('arquivo grande demais é recusado sem erro', async () => {
    const r = await cidadao.enviar('/ouvidoria', { tipo: 'Elogio', mensagem: 'x', aceite: '1', _t: assinarTempo(chave) },
      { campo: 'anexo', dados: Buffer.alloc(13 * 1024 * 1024, 1), tipo: 'application/pdf', nome: 'grande.pdf' });
    assert.equal(r.status, 200);
    assert.match(r.texto, /passa de 5 MB/);
  });
  await caso('consulta pública do protocolo', async () => {
    const pag = await cidadao.ir('/protocolo');
    const fd = new FormData();
    fd.set('_csrf', cidadao.csrf(pag.texto));
    fd.set('protocolo', protocoloContato.toLowerCase());
    fd.set('codigo', codigoContato.toLowerCase());
    const r = await cidadao.ir('/protocolo', { method: 'POST', body: fd });
    assert.match(r.texto, /resultado-status status-novo">Novo</);
    fd.set('codigo', 'ZZZZ');
    const r2 = await cidadao.ir('/protocolo', { method: 'POST', body: fd });
    assert.match(r2.texto, /Não encontramos um pedido/);
  });
  await caso('limite de envios por conexão', async () => {
    const n = Number(await qValor("SELECT COUNT(*) FROM limites WHERE acao = 'form'"));
    for (let i = n; i < config.rate_limit.max; i++) await q("INSERT INTO limites (ip_hash, acao, criado_em) SELECT ip_hash, 'form', ? FROM limites WHERE acao = 'form' LIMIT 1", [agora()]);
    const r = await cidadao.enviar('/contato', { nome: 'A', email: 'a@b.com.br', mensagem: 'x', aceite: '1', _t: assinarTempo(chave) });
    assert.match(r.texto, /Muitos envios em pouco tempo/);
    await q("DELETE FROM limites WHERE acao = 'form'");
  });

  const admin = new Navegador(base);
  const entrar = async (nav, email, senha) => {
    const pag = await nav.ir('/admin');
    const fd = new FormData();
    fd.set('_csrf', nav.csrf(pag.texto));
    fd.set('email', email);
    fd.set('senha', senha);
    return nav.ir('/admin', { method: 'POST', body: fd });
  };
  await caso('painel exige login', async () => {
    const r = await admin.ir('/admin/registros');
    assert.equal(r.status, 303);
    assert.equal(r.headers.get('location'), '/admin');
  });
  await caso('senha errada não entra e conta tentativa', async () => {
    const r = await entrar(admin, 'admin@teste.br', 'errada');
    assert.match(r.texto, /E-mail ou senha incorretos/);
    assert.equal(Number(await qValor("SELECT tentativas FROM usuarios WHERE email = 'admin@teste.br'")), 1);
  });
  await caso('usuário com senha do sistema antigo recebe orientação', async () => {
    const r = await entrar(new Navegador(base), 'antiga@teste.br', 'qualquer123');
    assert.match(r.texto, /precisa ser redefinida/);
  });
  await caso('login do administrador e lista de registros', async () => {
    const r = await entrar(admin, 'ADMIN@teste.br', 'SenhaAdmin123');
    assert.equal(r.status, 303);
    const lista = await admin.ir('/admin/registros?todos=1');
    assert.match(lista.texto, new RegExp(protocoloContato));
    assert.match(lista.texto, /PED-\d{4}-000001/);
    assert.equal(lista.headers.get('cache-control'), 'no-store');
  });
  await caso('busca sem diferenciar maiúsculas e sem coringa', async () => {
    let r = await admin.ir('/admin/registros?busca=' + encodeURIComponent('maria josé'));
    if (driver() === 'pgsql') assert.match(r.texto, new RegExp(protocoloContato));
    r = await admin.ir('/admin/registros?busca=' + encodeURIComponent('100%'));
    assert.match(r.texto, /Nenhum registro/);
  });
  await caso('detalhe, mudança de situação com aviso por e-mail e nota', async () => {
    const id = Number(await qValor('SELECT id FROM registros WHERE protocolo = ?', [protocoloContato]));
    const pag = await admin.ir(`/admin/registro?id=${id}`);
    assert.match(pag.texto, /Maria José/);
    const antes = recebidos.length;
    const fd = new FormData();
    fd.set('_csrf', admin.csrf(pag.texto));
    fd.set('acao', 'atualizar');
    fd.set('status', 'Concluído');
    fd.set('retorno_publico', 'Pronto para retirada.');
    fd.set('avisar', '1');
    const r = await admin.ir(`/admin/registro?id=${id}`, { method: 'POST', body: fd });
    assert.equal(r.status, 303);
    assert.equal(await qValor('SELECT status FROM registros WHERE id = ?', [id]), 'Concluído');
    assert.equal(recebidos.length, antes + 1);
    const depois = await admin.ir(`/admin/registro?id=${id}`);
    assert.match(depois.texto, /Registro atualizado/);
    assert.match(depois.texto, /Cliente avisado por e-mail/);
  });
  await caso('download do anexo e exportação CSV', async () => {
    const a = await qUm('SELECT id FROM anexos');
    const r = await admin.ir(`/admin/anexo?id=${a.id}`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-disposition'), /attachment/);
    assert.ok(r.texto.startsWith('%PDF'));
    const csv = await admin.ir('/admin/exportar?todos=1');
    assert.match(csv.headers.get('content-type'), /text\/csv/);
    assert.ok(csv.texto.startsWith('﻿Protocolo;Formulário;'));
    assert.match(csv.texto, new RegExp(protocoloContato));
  });
  await caso('transparência: publicar mês com PDF e ver no site', async () => {
    const pag = await admin.ir('/admin/transparencia?ano=2026&mes=9');
    const fd = new FormData();
    fd.set('_csrf', admin.csrf(pag.texto));
    fd.set('ano', '2026');
    fd.set('mes', '9');
    fd.set('acao', 'salvar');
    fd.set('v[emolumentos_publica]', '1.234,56');
    fd.set('v[iss]', '10,5');
    fd.set('observacao', 'Retificado.');
    fd.set('pdf', new Blob([Buffer.from('%PDF-1.4 teste')], { type: 'application/pdf' }), 'demonstrativo.pdf');
    const r = await admin.ir('/admin/transparencia', { method: 'POST', body: fd });
    assert.equal(r.status, 303);
    const pub = await cidadao.ir('/transparencia?ano=2026');
    assert.match(pub.texto, /R\$ 1\.234,56/);
    assert.match(pub.texto, /Setembro: Retificado\./);
    const id = await qValor('SELECT id FROM transparencia');
    const arq = await cidadao.ir(`/transparencia/arquivo?id=${id}`);
    assert.equal(arq.status, 200);
    assert.equal(arq.headers.get('content-type'), 'application/pdf');
  });
  await caso('usuários: criar e desativar', async () => {
    const pag = await admin.ir('/admin/usuarios');
    const fd = new FormData();
    fd.set('_csrf', admin.csrf(pag.texto));
    fd.set('acao', 'criar');
    fd.set('nome', 'Novo');
    fd.set('email', 'novo@teste.br');
    fd.set('perfil', 'atendente');
    fd.set('senha', 'SenhaNova123');
    assert.equal((await admin.ir('/admin/usuarios', { method: 'POST', body: fd })).status, 303);
    const id = await qValor("SELECT id FROM usuarios WHERE email = 'novo@teste.br'");
    const fd2 = new FormData();
    fd2.set('_csrf', admin.csrf((await admin.ir('/admin/usuarios')).texto));
    fd2.set('acao', 'alternar');
    fd2.set('id', String(id));
    await admin.ir('/admin/usuarios', { method: 'POST', body: fd2 });
    assert.equal(Number(await qValor('SELECT ativo FROM usuarios WHERE id = ?', [id])), 0);
  });
  await caso('atendente não vê LGPD nem denúncias e não acessa usuários', async () => {
    await cidadao.enviar('/privacidade#solicitar', { direito: 'Portabilidade dos meus dados', nome: 'Carlos', cpf: '529.982.247-25', email: 'carlos@exemplo.com.br', mensagem: 'Quero meus dados', aceite: '1', _t: assinarTempo(chave) });
    const lgpd = await qUm("SELECT id, protocolo FROM registros WHERE formulario = 'lgpd'");
    assert.ok(lgpd, 'LGPD não foi gravada');
    const at = new Navegador(base);
    await entrar(at, 'atend@teste.br', 'SenhaAtend123');
    const lista = await at.ir('/admin/registros?todos=1');
    assert.doesNotMatch(lista.texto, new RegExp(lgpd.protocolo));
    const det = await at.ir(`/admin/registro?id=${lgpd.id}`);
    assert.equal(det.status, 303);
    assert.equal((await at.ir('/admin/usuarios')).status, 403);
  });
  await caso('troca de senha encerra as outras sessões', async () => {
    const outra = new Navegador(base);
    await entrar(outra, 'admin@teste.br', 'SenhaAdmin123');
    assert.equal((await outra.ir('/admin/registros')).status, 200);
    const pag = await admin.ir('/admin/senha');
    const fd = new FormData();
    fd.set('_csrf', admin.csrf(pag.texto));
    fd.set('atual', 'SenhaAdmin123');
    fd.set('nova', 'SenhaTrocada456');
    fd.set('repetir', 'SenhaTrocada456');
    assert.equal((await admin.ir('/admin/senha', { method: 'POST', body: fd })).status, 303);
    assert.equal((await admin.ir('/admin/registros')).status, 200, 'quem trocou continua dentro');
    assert.equal((await outra.ir('/admin/registros')).status, 303, 'a outra sessão saiu');
    assert.match((await entrar(new Navegador(base), 'admin@teste.br', 'SenhaAdmin123')).texto, /incorretos/);
  });
  await caso('cookie de sessão adulterado é ignorado', async () => {
    const nav = new Navegador(base);
    nav.cookie = 'sjc_sessao=' + Buffer.from('{"uid":1}').toString('base64url');
    assert.equal((await nav.ir('/admin/registros')).status, 303);
  });
  await caso('sair do painel', async () => {
    const pag = await admin.ir('/admin/registros');
    const fd = new FormData();
    fd.set('_csrf', admin.csrf(pag.texto));
    await admin.ir('/admin/sair', { method: 'POST', body: fd });
    assert.equal((await admin.ir('/admin/registros')).status, 303);
  });
  await caso('bloqueio após 5 senhas erradas', async () => {
    const nav = new Navegador(base);
    await q("UPDATE usuarios SET tentativas = 0, bloqueado_ate = NULL WHERE email = 'atend@teste.br'");
    await q('DELETE FROM limites');
    let r;
    for (let i = 0; i < 5; i++) {
      await q('DELETE FROM limites');
      r = await entrar(nav, 'atend@teste.br', 'errada' + i);
    }
    assert.match(r.texto, /bloqueado por 15 minutos/);
    await q('DELETE FROM limites');
    r = await entrar(nav, 'atend@teste.br', 'SenhaAtend123');
    assert.match(r.texto, /Acesso bloqueado por excesso de tentativas/);
  });

  servidor.close();
  smtp.close();
  fecharBanco();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\n${total - falhas.length} de ${total} testes passaram.`);
  process.exit(falhas.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
