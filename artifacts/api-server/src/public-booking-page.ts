function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderPublicBookingPage(shopId: string) {
  const safeShopId = escapeHtml(shopId);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Agendar horário</title>
    <style>
      :root { color-scheme: dark; --bg:#100f0e; --card:#1b1a18; --line:#38332e; --text:#f7f2ec; --muted:#aca29a; --accent:#d88e50; --accent-dark:#34251b; --danger:#ef8d83; }
      * { box-sizing:border-box; }
      body { margin:0; min-height:100vh; background:var(--bg); color:var(--text); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { width:min(100% - 32px, 560px); margin:0 auto; padding:32px 0 48px; }
      .header { display:flex; align-items:center; gap:14px; margin-bottom:28px; }
      .logo { width:56px; height:56px; border-radius:17px; object-fit:cover; background:var(--accent-dark); display:grid; place-items:center; color:var(--accent); font-size:22px; font-weight:800; }
      .eyebrow { color:var(--accent); font-size:11px; font-weight:800; letter-spacing:1.4px; text-transform:uppercase; margin-bottom:5px; }
      h1 { font-size:28px; letter-spacing:-.7px; margin:0; }
      h2 { font-size:15px; margin:26px 0 10px; }
      .muted { color:var(--muted); font-size:14px; line-height:1.5; }
      .address { color:var(--muted); font-size:12px; margin-top:5px; }
      .days { display:flex; gap:7px; overflow-x:auto; padding:2px 0 5px; scrollbar-width:none; }
      .days::-webkit-scrollbar { display:none; }
      button, input, select { font:inherit; }
      button { cursor:pointer; }
      .day { flex:0 0 58px; height:68px; border:1px solid var(--line); border-radius:14px; background:var(--card); color:var(--text); }
      .day.selected, .time.selected { background:var(--accent); border-color:var(--accent); color:#20150e; }
      .day small { display:block; font-size:10px; font-weight:700; text-transform:uppercase; opacity:.8; }
      .day strong { display:block; font-size:18px; margin-top:5px; }
      .services { display:grid; gap:9px; }
      .service { width:100%; display:flex; align-items:center; justify-content:space-between; text-align:left; padding:14px; border:1px solid var(--line); border-radius:15px; color:var(--text); background:var(--card); }
      .service.selected { background:var(--accent-dark); border-color:var(--accent); }
      .service-name { font-weight:800; font-size:14px; }
      .service-meta { color:var(--muted); font-size:12px; margin-top:4px; }
      .price { color:var(--accent); font-size:13px; font-weight:800; }
      .times { display:flex; flex-wrap:wrap; gap:8px; }
      .time { border:1px solid var(--line); border-radius:11px; padding:11px 14px; background:var(--card); color:var(--text); font-size:13px; font-weight:800; }
      .empty { color:var(--muted); font-size:13px; padding:10px 0; }
      label { display:block; color:var(--muted); font-size:12px; font-weight:700; margin:20px 0 8px; }
      input { width:100%; min-height:50px; border:1px solid var(--line); border-radius:14px; padding:0 14px; color:var(--text); background:var(--card); outline:none; }
      input:focus { border-color:var(--accent); }
      .submit { width:100%; margin-top:24px; min-height:52px; border:0; border-radius:14px; color:#20150e; background:var(--accent); font-weight:800; }
      .submit:disabled { cursor:not-allowed; opacity:.45; }
      .message { min-height:20px; margin-top:14px; color:var(--danger); font-size:13px; text-align:center; }
      .success { text-align:center; padding:80px 0; }
      .check { width:64px; height:64px; display:grid; place-items:center; margin:0 auto 20px; border-radius:22px; background:var(--accent-dark); color:var(--accent); font-size:30px; }
      .success h1 { font-size:27px; }
      .loading { color:var(--muted); padding:30px 0; text-align:center; }
    </style>
  </head>
  <body>
    <main id="app"><div class="loading">Carregando horários...</div></main>
    <script>
      const shopId = ${JSON.stringify(shopId)};
      const app = document.getElementById("app");
      const today = new Date();
      const pad = (value) => String(value).padStart(2, "0");
      const dateKey = (date) => date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
      const dateLabel = (date) => date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      let selectedDate = dateKey(today);
      let selectedService = "";
      let selectedTime = "";
      let shop;

      function formatPrice(value) {
        return "R$ " + Number(value).toFixed(2).replace(".", ",");
      }

      function render() {
        if (!shop) return;
        const service = shop.services.find((item) => item.id === selectedService);
        app.innerHTML = \`
          <header class="header">
            \${shop.profileImage ? '<img class="logo" alt="" src="' + shop.profileImage + '">' : '<div class="logo">B</div>'}
            <div>
              <div class="eyebrow">Agendamento online</div>
              <h1>\${shop.shopName}</h1>
              \${shop.address || shop.city ? '<div class="address">' + [shop.address, shop.city].filter(Boolean).join(" · ") + '</div>' : ""}
            </div>
          </header>
          <div class="muted">Escolha seu serviço e horário. A reserva será enviada diretamente para a agenda da barbearia.</div>
          <h2>Data</h2>
          <div class="days">\${Array.from({length:14}, (_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index);
            const key = dateKey(date);
            return '<button class="day ' + (key === selectedDate ? "selected" : "") + '" data-date="' + key + '"><small>' + (index === 0 ? "Hoje" : dateLabel(date)) + '</small><strong>' + date.getDate() + '</strong></button>';
          }).join("")}</div>
          <h2>Serviço</h2>
          <div class="services">\${shop.services.map((item) => '<button class="service ' + (item.id === selectedService ? "selected" : "") + '" data-service="' + item.id + '"><span><span class="service-name">' + item.name + '</span><span class="service-meta">' + item.duration + ' min</span></span><span class="price">' + formatPrice(item.price) + '</span></button>').join("")}</div>
          <h2>Horário disponível</h2>
          <div class="times">\${shop.availableTimes.length ? shop.availableTimes.map((item) => '<button class="time ' + (item === selectedTime ? "selected" : "") + '" data-time="' + item + '">' + item + '</button>').join("") : '<div class="empty">Nenhum horário disponível nesta data.</div>'}</div>
          <label for="name">Seu nome</label><input id="name" placeholder="Nome completo" autocomplete="name">
          <label for="phone">Seu telefone</label><input id="phone" placeholder="(11) 99999-9999" autocomplete="tel" inputmode="tel">
          <div class="message" id="message"></div>
          <button class="submit" id="submit" disabled>Confirmar agendamento</button>
        \`;
        document.querySelectorAll("[data-date]").forEach((button) => button.onclick = () => { selectedDate = button.dataset.date; selectedTime = ""; load(); });
        document.querySelectorAll("[data-service]").forEach((button) => button.onclick = () => { selectedService = button.dataset.service; render(); });
        document.querySelectorAll("[data-time]").forEach((button) => button.onclick = () => { selectedTime = button.dataset.time; render(); });
        const name = document.getElementById("name");
        const phone = document.getElementById("phone");
        const submit = document.getElementById("submit");
        const updateSubmit = () => { submit.disabled = !(name.value.trim() && phone.value.trim() && selectedService && selectedTime); };
        name.oninput = updateSubmit; phone.oninput = updateSubmit;
        submit.onclick = () => createBooking(name.value.trim(), phone.value.trim(), submit);
      }

      async function load() {
        app.innerHTML = '<div class="loading">Carregando horários...</div>';
        try {
          const response = await fetch("/api/booking/" + encodeURIComponent(shopId) + "?date=" + selectedDate);
          if (!response.ok) throw new Error();
          shop = await response.json();
          if (!selectedService || !shop.services.some((item) => item.id === selectedService)) selectedService = shop.services[0]?.id || "";
          render();
        } catch {
          app.innerHTML = '<div class="loading">Este link de agendamento não está disponível.</div>';
        }
      }

      async function createBooking(name, phone, submit) {
        submit.disabled = true;
        const message = document.getElementById("message");
        message.textContent = "";
        try {
          const response = await fetch("/api/booking/" + encodeURIComponent(shopId), {
            method: "POST",
            headers: {"content-type":"application/json"},
            body: JSON.stringify({ clientName:name, clientPhone:phone, serviceId:selectedService, date:selectedDate, time:selectedTime })
          });
          if (response.status === 409) throw new Error("Esse horário acabou de ser reservado. Escolha outro.");
          if (!response.ok) throw new Error("Não foi possível concluir o agendamento.");
          app.innerHTML = '<section class="success"><div class="check">✓</div><h1>Horário reservado.</h1><p class="muted">Seu agendamento foi enviado para ' + shop.shopName + '.</p></section>';
        } catch (error) {
          message.textContent = error.message;
          submit.disabled = false;
          if (error.message.includes("acabou")) { selectedTime = ""; await load(); }
        }
      }
      load();
    </script>
  </body>
</html>`;
}