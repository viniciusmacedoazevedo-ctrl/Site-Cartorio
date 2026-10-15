<p>Este Aviso de Privacidade explica como o <?= e(cartorio('nome_oficial')) ?> coleta, usa, guarda e protege os dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), as normas da Autoridade Nacional de Proteção de Dados (ANPD) e as diretrizes do Conselho Nacional de Justiça, em especial a Resolução CNJ nº 363/2021 e o Provimento CNJ nº 134/2022. O uso do site também segue os <a href="/termos">Termos de uso</a>.</p>

<h3>1. Quem é o controlador dos dados</h3>
<p>A titular da delegação atua como controladora dos dados pessoais tratados nesta serventia.</p>
<ul>
  <li><strong>Controladora:</strong> <?= e(cartorio('titular')) ?>, <?= e(cartorio('titular_cargo')) ?></li>
  <li><strong>Endereço:</strong> <?= e(cartorio('endereco')) ?>, <?= e(cartorio('cidade')) ?>, CEP <?= e(cartorio('cep')) ?></li>
  <li><strong>CNPJ:</strong> <?= e(cartorio('cnpj')) ?></li>
</ul>

<h3>2. Base legal e finalidade</h3>
<p>Os cartórios prestam um serviço público delegado. Por isso, quase todo o tratamento de dados feito aqui se baseia no cumprimento de obrigação legal ou regulatória (art. 7º, II, e art. 23 da LGPD).</p>
<ul>
  <li><strong>Atos notariais e de registro:</strong> praticar os atos previstos em lei, como escrituras, procurações, registros de imóveis, nascimento, casamento, óbito, protestos e autenticações, garantindo publicidade, autenticidade, segurança e eficácia.</li>
  <li><strong>Atendimento pelo site:</strong> os dados enviados nos formulários servem apenas para atender a solicitação feita, responder ao usuário e manter o registro do atendimento.</li>
</ul>

<h3>3. Quais dados coletamos</h3>
<ul>
  <li><strong>Para a prática de atos:</strong> os dados de qualificação exigidos pela legislação, como nome completo, CPF, RG, estado civil, profissão, endereço e e-mail.</li>
  <li><strong>Nos formulários do site:</strong> nome, CPF (quando necessário), e-mail, telefone, a mensagem e eventuais arquivos enviados voluntariamente. Na Ouvidoria a identificação é opcional.</li>
  <li><strong>Dados técnicos:</strong> endereço IP, data e hora do envio e tipo de navegador, guardados para a segurança do site e para prevenir fraudes.</li>
  <li><strong>Cookies:</strong> apenas os essenciais ao funcionamento seguro do site. Detalhes na <a href="/cookies">Política de Cookies</a>.</li>
</ul>

<h3>4. Compartilhamento</h3>
<p>Como prestador de serviço público, o cartório compartilha os dados dos atos notariais e de registro com os órgãos e centrais definidos em lei, como:</p>
<ul>
  <li>Conselho Nacional de Justiça (CNJ) e Corregedoria Geral de Justiça do RN;</li>
  <li>centrais nacionais de serviços compartilhados, como CENSEC, ONR, CRC Nacional e CENPROT;</li>
  <li>órgãos fiscais e tributários, como a Receita Federal.</li>
</ul>
<p>O cartório <strong>não vende</strong> dados pessoais em nenhuma hipótese. Os dados dos formulários do site não são compartilhados com terceiros, salvo por obrigação legal.</p>

<h3>5. Seus direitos como titular</h3>
<p>Você pode exercer todos os direitos do art. 18 da LGPD, descritos em <a href="/privacidade#direitos" data-dialogo="direitos-titulares">Direitos dos titulares</a>. Os dados inseridos em livros oficiais de registro seguem normas próprias da Corregedoria e não podem ser livremente alterados ou excluídos fora das hipóteses legais.</p>

<h3>6. Encarregado pelo tratamento de dados (DPO)</h3>
<ul>
  <li><strong>Encarregado:</strong> <?= e(cartorio('dpo_nome')) ?> – <a href="mailto:<?= e(cartorio('dpo_email')) ?>"><?= e(cartorio('dpo_email')) ?></a></li>
  <li><strong>Canal para solicitações dos titulares:</strong> <a href="mailto:<?= e(cartorio('emails.lgpd')) ?>"><?= e(cartorio('emails.lgpd')) ?></a> ou o <a href="/privacidade#solicitar">formulário desta página</a></li>
</ul>

<h3>7. Por quanto tempo guardamos</h3>
<p>Os dados dos atos notariais e de registro são guardados pelos prazos fixados em lei e pelas normas da Corregedoria. Os dados recebidos pelos formulários do site são guardados por até 5 anos após a conclusão do atendimento e depois eliminados, salvo obrigação legal de guarda.</p>

<h3>8. Segurança</h3>
<p>Adotamos medidas técnicas e organizacionais para proteger os dados pessoais contra acessos não autorizados, vazamentos e destruição acidental, em conformidade com o Provimento CNJ nº 213/2026, que define os padrões de tecnologia e segurança da informação dos cartórios. O site usa conexão criptografada (HTTPS), e o acesso ao painel interno é restrito e registrado.</p>

<p class="atualizado">Última atualização: <?= e(cartorio('politicas_atualizadas_em')) ?>.</p>
