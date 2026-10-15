// Número usado no botão do formulário (somente dígitos, com DDI 55).
const WHATSAPP = "550000000000";

// Horário de funcionamento: dia da semana (0 = domingo) -> [abre, fecha] em horas.
const HORARIO = { 1: [9, 17], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [9, 17], 6: [9, 12] };

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Indica se o cartório está aberto agora (horário de Brasília).
const status = document.querySelector("[data-status]");
if (status) {
  const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const faixa = HORARIO[agora.getDay()];
  const hora = agora.getHours() + agora.getMinutes() / 60;
  const aberto = faixa && hora >= faixa[0] && hora < faixa[1];
  status.textContent = aberto ? "Aberto agora" : "Fechado agora";
  status.classList.add(aberto ? "is-open" : "is-closed");
}

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

// Abas de documentos (com navegação por setas).
document.querySelectorAll("[data-tabs]").forEach((root) => {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const ativo = t === tab;
      t.setAttribute("aria-selected", ativo);
      t.tabIndex = ativo ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !ativo;
    });
    tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (passo) select(tabs[(i + passo + tabs.length) % tabs.length]);
    });
  });
});

// Formulário: valida e abre o WhatsApp com a mensagem pronta.
const form = document.querySelector("[data-form]");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = form.querySelector("[data-form-msg]");
  const invalidos = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  if (invalidos.length) {
    invalidos.forEach((el) => el.setAttribute("aria-invalid", "true"));
    msg.textContent = "Preencha os campos obrigatórios e aceite o uso dos dados.";
    invalidos[0].focus();
    return;
  }
  msg.textContent = "";
  const d = new FormData(form);
  const texto = `Olá! Meu nome é ${d.get("nome")} (${d.get("contato")}).\nServiço: ${d.get("servico")}\n\n${d.get("mensagem")}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
});
