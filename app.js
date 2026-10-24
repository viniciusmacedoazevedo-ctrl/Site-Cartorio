'use strict';
// Arquivo de inicialização para o "Setup Node.js App" do cPanel (Passenger).
// O site fica em node/; veja docs/CPANEL-NODE.md.
process.env.CARTORIO_INICIAR = '1';
require('./node/server.js');
