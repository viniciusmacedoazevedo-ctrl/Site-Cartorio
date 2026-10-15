# Site-Cartorio

Site institucional estático para cartório (tabelionato de notas e registro civil). HTML, CSS e JavaScript puros, sem build.

## Como visualizar

Abra `index.html` no navegador, ou sirva a pasta:

```sh
python3 -m http.server 8000
```

## Personalizar

Substitua os marcadores entre colchetes em `index.html` (`[Nome]`, `[Cidade]`, `[UF]`, endereço, telefones, CNS, titular) e ajuste:

- `script.js` → `WHATSAPP` (número do formulário) e `HORARIO` (usado no indicador "Aberto agora").
- Links `wa.me`, `tel:` e `mailto:` em `index.html`.
- Lista de serviços e documentos conforme os atos que o cartório pratica.

## Publicar

Qualquer hospedagem estática serve (GitHub Pages, Netlify, cPanel/FTP): envie `index.html`, `styles.css`, `script.js` e a pasta `assets/`.
