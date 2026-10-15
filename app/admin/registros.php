<?php
require __DIR__ . '/_filtros.php';
$u = exigir_login();
$entrada = $_GET + ($_GET ? [] : ['abertos' => '1']);
[$f, $where, $params] = filtros_registros($u, $entrada);

$porPagina = 50;
$pagina = max(1, (int) ($_GET['pagina'] ?? 1));
$total = (int) q_val("SELECT COUNT(*) FROM registros WHERE $where", $params);
$paginas = max(1, (int) ceil($total / $porPagina));
$pagina = min($pagina, $paginas);
$lista = q("SELECT id, protocolo, formulario, tipo, nome, email, telefone, status, criado_em, atualizado_em
            FROM registros WHERE $where ORDER BY criado_em DESC, id DESC LIMIT $porPagina OFFSET " . (($pagina - 1) * $porPagina), $params)->fetchAll();

$contagem = [];
foreach (q('SELECT status, COUNT(*) n FROM registros WHERE ' . filtro_perfil($u) . ' GROUP BY status')->fetchAll() as $r) {
    $contagem[$r['status']] = (int) $r['n'];
}
$hoje = (int) q_val('SELECT COUNT(*) FROM registros WHERE ' . filtro_perfil($u) . ' AND criado_em >= ?', [date('Y-m-d') . ' 00:00:00']);
$titulos = array_map(fn ($x) => $x['titulo'], formularios());
$curtos = ['pedido' => 'Pedido', 'ouvidoria' => 'Ouvidoria', 'lgpd' => 'LGPD', 'contato' => 'Contato'];
if ($u['perfil'] !== 'admin') {
    unset($curtos['lgpd']);
}
$qs = fn (array $extra) => '?' . http_build_query(array_filter(array_merge($f, $extra), fn ($v) => $v !== '' && $v !== null));

view('admin-header', ['u' => $u, 'titulo' => 'Registros']);
?>
<div class="adm-cabeca">
  <h1>Registros recebidos pelo site</h1>
  <a class="adm-botao adm-botao-sec" href="/admin/exportar<?= e($qs([])) ?>">Exportar CSV (filtro atual)</a>
</div>

<ul class="adm-contadores">
  <li><a href="<?= e($qs(['status' => 'Novo', 'abertos' => ''])) ?>"><strong><?= $contagem['Novo'] ?? 0 ?></strong> novos</a></li>
  <li><a href="<?= e($qs(['status' => 'Em análise', 'abertos' => ''])) ?>"><strong><?= $contagem['Em análise'] ?? 0 ?></strong> em análise</a></li>
  <li><a href="<?= e($qs(['status' => 'Aguardando cliente', 'abertos' => ''])) ?>"><strong><?= $contagem['Aguardando cliente'] ?? 0 ?></strong> aguardando cliente</a></li>
  <li><a href="<?= e($qs(['status' => 'Concluído', 'abertos' => ''])) ?>"><strong><?= $contagem['Concluído'] ?? 0 ?></strong> concluídos</a></li>
  <li class="adm-hoje"><strong><?= $hoje ?></strong> recebidos hoje</li>
</ul>

<form class="adm-filtros" method="get" action="/admin/registros">
  <div>
    <label for="fl-busca">Buscar</label>
    <input id="fl-busca" name="busca" type="search" value="<?= e($f['busca']) ?>" placeholder="Protocolo, nome, CPF, e-mail ou telefone">
  </div>
  <div>
    <label for="fl-form">Formulário</label>
    <select id="fl-form" name="formulario">
      <option value="">Todos</option>
      <?php foreach ($curtos as $k => $rot): ?><option value="<?= $k ?>"<?= $f['formulario'] === $k ? ' selected' : '' ?>><?= e($rot) ?></option><?php endforeach; ?>
    </select>
  </div>
  <div>
    <label for="fl-status">Situação</label>
    <select id="fl-status" name="status">
      <option value="">Todas</option>
      <?php foreach (STATUS as $s): ?><option<?= $f['status'] === $s ? ' selected' : '' ?>><?= e($s) ?></option><?php endforeach; ?>
    </select>
  </div>
  <div>
    <label for="fl-de">De</label>
    <input id="fl-de" name="de" type="date" value="<?= e($f['de']) ?>">
  </div>
  <div>
    <label for="fl-ate">Até</label>
    <input id="fl-ate" name="ate" type="date" value="<?= e($f['ate']) ?>">
  </div>
  <label class="adm-check"><input type="checkbox" name="abertos" value="1"<?= $f['abertos'] ? ' checked' : '' ?>> Só em aberto</label>
  <div class="adm-filtros-acoes">
    <button class="adm-botao" type="submit">Filtrar</button>
    <a href="/admin/registros?todos=1">Limpar</a>
  </div>
</form>

<p class="adm-total"><?= $total ?> registro<?= $total === 1 ? '' : 's' ?><?= $paginas > 1 ? ", página $pagina de $paginas" : '' ?></p>

<?php if (!$lista): ?>
  <div class="adm-vazio">
    <p>Nenhum registro com esses filtros.</p>
    <a href="/admin/registros?todos=1">Ver todos os registros</a>
  </div>
<?php else: ?>
  <div class="adm-tabela-wrap">
    <table class="adm-tabela">
      <thead><tr><th scope="col">Protocolo</th><th scope="col">Recebido</th><th scope="col">Formulário</th><th scope="col">Assunto</th><th scope="col">Solicitante</th><th scope="col">Situação</th></tr></thead>
      <tbody>
      <?php foreach ($lista as $r): ?>
        <tr>
          <td><a class="adm-protocolo" href="/admin/registro?id=<?= (int) $r['id'] ?>"><?= e($r['protocolo']) ?></a></td>
          <td><?= e(data_br($r['criado_em'])) ?></td>
          <td><?= e($curtos[$r['formulario']] ?? $r['formulario']) ?></td>
          <td><?= e($r['tipo']) ?></td>
          <td><?= $r['nome'] !== '' ? e($r['nome']) : '<span class="adm-anon">Não identificado</span>' ?><?php if ($r['email'] || $r['telefone']): ?><br><small><?= e($r['email'] ?: $r['telefone']) ?></small><?php endif; ?></td>
          <td><span class="adm-status st-<?= status_classe($r['status']) ?>"><?= e($r['status']) ?></span></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php if ($paginas > 1): ?>
    <nav class="adm-paginas" aria-label="Páginas">
      <?php if ($pagina > 1): ?><a href="<?= e($qs(['pagina' => $pagina - 1])) ?>">Anterior</a><?php endif; ?>
      <?php if ($pagina < $paginas): ?><a href="<?= e($qs(['pagina' => $pagina + 1])) ?>">Próxima</a><?php endif; ?>
    </nav>
  <?php endif; ?>
<?php endif; ?>
<?php view('admin-footer'); ?>
