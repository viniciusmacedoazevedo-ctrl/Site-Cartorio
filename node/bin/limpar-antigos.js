'use strict';
/**
 * Apaga registros concluídos ou arquivados mais antigos que o prazo de guarda.
 * Uso: node node/bin/limpar-antigos.js [anos=5] [--confirmar]
 * Sem --confirmar, apenas mostra quantos seriam apagados.
 */
process.env.TZ = 'America/Fortaleza';
const fs = require('node:fs');
const path = require('node:path');
const { cfg, agora } = require('../lib/base');
const { q, qTodos, fecharBanco } = require('../lib/db');
const { auditoria } = require('../lib/auth');

async function main() {
  const anos = Number.parseInt(process.argv[2], 10) || 5;
  const confirmar = process.argv.includes('--confirmar');
  const d = new Date();
  d.setFullYear(d.getFullYear() - anos);
  const limite = agora(d);
  const regs = await qTodos("SELECT id FROM registros WHERE status IN ('Concluído', 'Arquivado') AND atualizado_em < ?", [limite]);
  console.log(`${regs.length} registro(s) anteriores a ${limite}.`);
  if (!confirmar) {
    console.log('Nada foi apagado. Rode com --confirmar para apagar.');
    fecharBanco();
    return;
  }
  for (const r of regs) {
    for (const a of await qTodos('SELECT arquivo FROM anexos WHERE registro_id = ?', [r.id])) {
      try {
        fs.unlinkSync(path.join(cfg('uploads.path'), a.arquivo));
      } catch {
        /* já não existe */
      }
    }
    await q('DELETE FROM historico WHERE registro_id = ?', [r.id]);
    await q('DELETE FROM anexos WHERE registro_id = ?', [r.id]);
    await q('DELETE FROM registros WHERE id = ?', [r.id]);
  }
  await auditoria(null, null, 'limpeza', `${regs.length} registros anteriores a ${limite}`);
  console.log('Apagados.');
  fecharBanco();
}

main().catch((err) => {
  console.error(`Erro: ${err.message}`);
  process.exit(1);
});
