<?php
/** Ícones de linha das áreas de serviço. @var string $nome */
$tracos = [
    'notas'       => '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    'civil'       => '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0 1 21 19"/>',
    'protesto'    => '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><circle cx="12.5" cy="14" r="3.5"/><path d="M12.5 12.3v1.9l1.2.8"/>',
    'imoveis'     => '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    'titulos'     => '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 13h8"/>',
    'certificado' => '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v2"/>',
    'pedido'      => '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    'protocolo'   => '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2M8.5 11h5"/>',
    'selo'        => '<path d="M12 3l2.4 1.8 3 .1.9 2.9 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.9-3 .1L12 21l-2.4-1.8-3-.1-.9-2.9L3.3 14.4l.9-2.9-.9-2.9 2.4-1.8.9-2.9 3-.1z"/><path d="m9 12 2 2 4-4"/>',
    'custas'      => '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9.5 14.5 12 17l2.5-2.5"/>',
    'ouvidoria'   => '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
];
?><svg class="icone" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><?= $tracos[$nome] ?? $tracos['notas'] ?></svg>
