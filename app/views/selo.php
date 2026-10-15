<?php $sid = 'selo-' . substr(md5((string) ($id ?? 'a')), 0, 6); ?>
<a class="selo" href="/conformidade" aria-label="Atende 100% aos requisitos do CNJ. Ver detalhes da conformidade">
  <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <defs>
      <path id="<?= $sid ?>" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"/>
    </defs>
    <circle cx="100" cy="100" r="96" class="selo-aro"/>
    <circle cx="100" cy="100" r="88" class="selo-fio"/>
    <circle cx="100" cy="100" r="58" class="selo-fio"/>
    <text class="selo-volta"><textPath href="#<?= $sid ?>" startOffset="0">ATENDE 100% AOS REQUISITOS DO CNJ ✦ PROV. 213/2026 ✦</textPath></text>
    <text x="100" y="92" text-anchor="middle" class="selo-grande">100%</text>
    <text x="100" y="118" text-anchor="middle" class="selo-cnj">CNJ</text>
    <path d="M82 139 l12 10 l26 -23" class="selo-check"/>
  </svg>
</a>
