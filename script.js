// Número usado no botão do formulário (somente dígitos, com DDI 55).
const WHATSAPP = "550000000000";

// Horário de funcionamento: dia da semana (0 = domingo) -> [abre, fecha] em horas.
const HORARIO = { 1: [9, 17], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [9, 17], 6: [9, 12] };

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Indica se o cartório está aberto agora e quando abre (horário de Brasília).
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
const hoje = agora.getDay();
const fmt = (h) => `${Math.floor(h)}h${h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, "0") : ""}`;

const status = document.querySelector("[data-status]");
if (status) {
  const hora = agora.getHours() + agora.getMinutes() / 60;
  const faixa = HORARIO[hoje];
  const aberto = faixa && hora >= faixa[0] && hora < faixa[1];
  let texto = aberto ? `Aberto agora · fecha às ${fmt(faixa[1])}` : "Fechado agora";
  if (!aberto) {
    for (let i = 0; i < 7; i++) {
      const dia = (hoje + i) % 7;
      const f = HORARIO[dia];
      if (f && (i > 0 || hora < f[0])) {
        const quando = i === 0 ? "hoje" : i === 1 ? "amanhã" : dia === 6 ? "no sábado" : dia === 0 ? "no domingo" : `na ${DIAS[dia]}`;
        texto += ` · abre ${quando} às ${fmt(f[0])}`;
        break;
      }
    }
  }
  status.textContent = texto;
  status.classList.add(aberto ? "is-open" : "is-closed");
}

document.querySelectorAll("[data-days]").forEach((row) => {
  const [de, ate = de] = row.dataset.days.split("-").map(Number);
  if (hoje >= de && hoje <= ate) row.classList.add("is-today");
});

// Menu mobile.
const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("nav");
menuBtn?.addEventListener("click", () => {
  const aberto = nav.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", aberto);
});
nav?.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

// Serviços: lista de abas (setas, Home/End), atalhos do topo e links diretos (#servico-escr).
const explorer = document.querySelector("[data-tabs]");
const tabs = explorer ? [...explorer.querySelectorAll('[role="tab"]')] : [];
const selectTab = (tab, foco = true) => {
  tabs.forEach((t) => {
    const ativo = t === tab;
    t.setAttribute("aria-selected", ativo);
    t.tabIndex = ativo ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !ativo;
  });
  if (foco) tab.focus();
  tab.scrollIntoView({ block: "nearest", inline: "nearest" });
};
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => {
    selectTab(tab);
    history.replaceState(null, "", `#servico-${tab.id.slice(2)}`);
  });
  tab.addEventListener("keydown", (e) => {
    const destino = {
      ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1,
    }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    selectTab(tabs[(destino + tabs.length) % tabs.length]);
  });
});

const abrirServico = (chave) => {
  const tab = document.getElementById(`t-${chave}`);
  if (!tab) return false;
  selectTab(tab, false);
  document.getElementById("servicos").scrollIntoView();
  return true;
};
document.querySelectorAll("[data-goto]").forEach((link) =>
  link.addEventListener("click", (e) => {
    if (abrirServico(link.dataset.goto)) {
      e.preventDefault();
      history.replaceState(null, "", `#servico-${link.dataset.goto}`);
    }
  })
);
const deep = location.hash.match(/^#servico-(\w+)$/);
if (deep) abrirServico(deep[1]);

// Botões de dúvida já levam o serviço na mensagem.
document.querySelectorAll("[data-ask]").forEach((a) => {
  a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre ${a.dataset.ask.toLowerCase()}.`)}`;
});
document.querySelectorAll("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));

// Formulário: valida e abre o WhatsApp com a mensagem pronta.
const form = document.querySelector("[data-form]");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = form.querySelector("[data-form-msg]");
  const invalidos = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  if (invalidos.length) {
    invalidos.forEach((el) => el.setAttribute("aria-invalid", "true"));
    msg.classList.remove("is-ok");
    msg.textContent = "Preencha os campos obrigatórios e aceite o uso dos dados.";
    invalidos[0].focus();
    return;
  }
  msg.textContent = "Abrimos o WhatsApp com sua mensagem. É só tocar em enviar.";
  msg.classList.add("is-ok");
  const d = new FormData(form);
  const texto = `Olá! Meu nome é ${d.get("nome")} (${d.get("contato")}).\nServiço: ${d.get("servico")}\n\n${d.get("mensagem")}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
});
