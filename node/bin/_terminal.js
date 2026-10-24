'use strict';
/** Perguntas no terminal, inclusive senha sem mostrar na tela (sem depender de system()/stty). */
const readline = require('node:readline');

let linhas = null; // entrada redirecionada (não é terminal): uma fila de linhas compartilhada

function proximaLinha() {
  if (!linhas) {
    linhas = { fila: [], esperando: [], fim: false };
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    rl.on('line', (l) => {
      const w = linhas.esperando.shift();
      if (w) w(l);
      else linhas.fila.push(l);
    });
    rl.on('close', () => {
      linhas.fim = true;
      for (const w of linhas.esperando.splice(0)) w(null);
    });
  }
  if (linhas.fila.length) return Promise.resolve(linhas.fila.shift());
  if (linhas.fim) return Promise.resolve(null);
  return new Promise((resolve) => linhas.esperando.push(resolve));
}

function encerrar() {
  process.stderr.write('\nEntrada encerrada. Nada foi gravado.\n');
  process.exit(1);
}

async function perguntar(texto, padrao = '') {
  const sufixo = padrao !== '' && padrao !== null && padrao !== undefined ? ` [${padrao}]` : '';
  process.stdout.write(`${texto}${sufixo}: `);
  let r;
  if (process.stdin.isTTY) {
    r = await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, terminal: false });
      let ok = false;
      rl.once('line', (l) => {
        ok = true;
        rl.close();
        resolve(l);
      });
      rl.once('close', () => {
        if (!ok) resolve(null);
      });
    });
  } else {
    r = await proximaLinha();
    process.stdout.write('\n');
  }
  if (r === null) encerrar();
  const v = r.trim();
  return v === '' ? String(padrao ?? '') : v;
}

function perguntarSenha(texto) {
  if (!process.stdin.isTTY) {
    process.stdout.write(`${texto}: `);
    return proximaLinha().then((l) => {
      process.stdout.write('\n');
      if (l === null) encerrar();
      return l.replace(/\r$/, '');
    });
  }
  return new Promise((resolve) => {
    process.stdout.write(`${texto}: `);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let senha = '';
    const aoDigitar = (ch) => {
      for (const c of ch) {
        if (c === '\r' || c === '\n' || c === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', aoDigitar);
          process.stdout.write('\n');
          resolve(senha);
          return;
        }
        if (c === '\u0003') {
          stdin.setRawMode(false);
          process.stdout.write('\n');
          process.exit(1);
        }
        if (c === '\u007f' || c === '\b') senha = senha.slice(0, -1);
        else senha += c;
      }
    };
    stdin.on('data', aoDigitar);
  });
}

async function escolher(texto, opcoes, padrao) {
  for (;;) {
    const r = await perguntar(`${texto} (${opcoes.join('/')})`, padrao);
    if (opcoes.includes(r)) return r;
  }
}

module.exports = { perguntar, perguntarSenha, escolher };
