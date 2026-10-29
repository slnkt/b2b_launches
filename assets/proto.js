/* Кликабельный прототип клиентского флоу в рамке телефона.
   Без реальных данных и отправки: кнопки только переключают экраны. */
(function () {
  "use strict";

  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    status: '<span class="ph-status-ic">' +
      '<svg viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
      '<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1 4.5a10 10 0 0 1 14 0"/><path d="M3.8 7.3a6 6 0 0 1 8.4 0"/><path d="M6.6 10a2.2 2.2 0 0 1 2.8 0"/></svg>' +
      '<svg viewBox="0 0 26 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="1" y="1" width="21" height="10" rx="3"/><rect x="3" y="3" width="15" height="6" rx="1.5" fill="currentColor" stroke="none"/><path d="M24 4.5v3" stroke-linecap="round"/></svg>' +
      "</span>"
  };

  window.renderFlowProto = function (root, flow, h) {
    if (!root) return;
    var t = h.t, esc = h.esc, kv = h.kv;
    var steps = flow.steps || [];
    var statuses = flow.statuses || [];
    var co = flow.checkout || {}, auth = flow.auth || {}, qn = flow.questionnaire || {}, bk = flow.booking || {};
    var products = co.products || ["Кровь"];
    var qBlocks = qn.blocks || [];

    var state = {
      step: 0, product: 0,
      promo: co.promo || "", promoApplied: false, consents: [false, false],
      qPage: 0,
      method: 0, date: 0, slot: 0, sent: false,
      status: 0,
      descOpen: false
    };

    function dates() {
      var out = [], now = new Date();
      for (var i = 1; i <= 3; i++) {
        var d = new Date(now.getTime() + i * 86400000);
        out.push(d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" }).replace(".", ""));
      }
      return out;
    }
    var DATES = dates();

    function chips(items, active, act, extra) {
      return '<div class="ph-chips">' + items.map(function (x, i) {
        return '<button type="button" class="ph-chip' + (i === active ? " on" : "") + '" data-act="' + act + '" data-i="' + i + '"' + (extra || "") + ">" + esc(x) + "</button>";
      }).join("") + "</div>";
    }
    function seg(items, active, act) {
      return '<div class="ph-seg">' + items.map(function (x, i) {
        return '<button type="button" class="' + (i === active ? "on" : "") + '" data-act="' + act + '" data-i="' + i + '">' + esc(x) + "</button>";
      }).join("") + "</div>";
    }
    function statusbar() { return '<div class="ph-status"><span>9:41</span>' + ICON.status + "</div>"; }
    function productName() { return "МетабоСкан: " + products[state.product]; }

    /* ---------- screens ---------- */
    function screenCheckout() {
      var ready = state.promoApplied && state.consents[0] && state.consents[1];
      var consents = (co.consents || []).map(function (c, i) {
        return '<label class="ph-check"><input type="checkbox" data-act="consent" data-i="' + i + '"' + (state.consents[i] ? " checked" : "") + "><span>" + t(c.label) + "<br>" + t(c.text, "текст согласия") + "</span></label>";
      }).join("");
      return (
        '<div class="ph-body">' +
        '<div class="ph-h1">Оформление заказа</div>' +
        seg(products, state.product, "product") +
        '<div class="ph-order"><div><b>' + esc(productName()) + "</b><span>Результаты в ЛК и PDF на почту</span></div>" +
        '<div class="ph-price">' + (state.promoApplied ? "<s>" + t(co.price, "цена") + "</s>0 ₽" : t(co.price, "цена")) + "</div></div>" +
        (state.promoApplied ? '<div><span class="ph-applied">' + ICON.check + "Промокод Encore применен</span></div>" : "") +
        '<div class="ph-field"><label class="ph-label" for="ph-promo">Промокод</label>' +
        '<div class="ph-promo"><input class="ph-input" id="ph-promo" value="' + esc(state.promo) + '" placeholder="Введите промокод"' + (state.promoApplied ? " disabled" : "") + ">" +
        '<button type="button" class="ph-btn-sm" data-act="promo"' + (state.promoApplied ? " disabled" : "") + ">" + (state.promoApplied ? "Применен" : "Активировать") + "</button></div></div>" +
        '<div class="ph-consents">' + consents + "</div>" +
        '<div class="ph-bottom"><button type="button" class="ph-btn' + (ready ? "" : " ph-btn--dis") + '" data-act="next"' + (ready ? "" : " aria-disabled=\"true\"") + ">Продолжить</button>" +
        '<div class="ph-hint">' + (ready ? "" : "Активируйте промокод и отметьте согласия") + "</div></div>" +
        "</div>"
      );
    }

    function screenAuth() {
      return (
        '<div class="ph-body ph-center">' +
        '<img class="ph-logo" src="../assets/bioniq-wordmark.svg" alt="Bioniq">' +
        '<div class="ph-h1">Вход в личный кабинет</div>' +
        '<div class="ph-sub">' + t(auth.method, "способ входа") + "</div>" +
        '<div class="ph-field ph-field--full"><label class="ph-label" for="ph-phone">Телефон</label><input class="ph-input" id="ph-phone" placeholder="+7"></div>' +
        '<div class="ph-bottom ph-bottom--tight"><button type="button" class="ph-btn" data-act="next">Войти</button>' +
        '<button type="button" class="ph-link" data-act="next">Зарегистрироваться</button></div>' +
        "</div>"
      );
    }

    function screenQuestionnaire() {
      var n = qBlocks.length || 1, page = Math.min(state.qPage, n - 1), b = qBlocks[page] || { fields: [] };
      var pct = Math.round(((page + 1) / n) * 100);
      var fields = (b.fields || []).map(function (f, i) {
        var id = "ph-q-" + page + "-" + i;
        var ctrl = f.type === "choice"
          ? chips(f.options || [], -1, "choice", ' data-group="' + id + '"')
          : '<input class="ph-input" id="' + id + '" placeholder="' + esc(f.placeholder || "") + '">';
        return '<div class="ph-field"><label class="ph-label"' + (f.type === "choice" ? "" : ' for="' + id + '"') + ">" + t(f.label) + "</label>" + ctrl + "</div>";
      }).join("");
      return (
        '<div class="ph-body">' +
        '<div class="ph-progress" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' +
        '<div class="ph-sub">Анкета, блок ' + (page + 1) + " из " + n + "</div>" +
        '<div class="ph-h1">' + t(b.title, "блок") + "</div>" +
        (page === 0 && qn.note ? '<div class="ph-sub">' + t(qn.note) + "</div>" : "") +
        fields +
        '<div class="ph-bottom"><button type="button" class="ph-btn" data-act="' + (page + 1 < n ? "qnext" : "next") + '">' + (page + 1 < n ? "Далее" : "Готово") + "</button>" +
        (page > 0 ? '<button type="button" class="ph-link" data-act="qback">Назад</button>' : "") +
        "</div></div>"
      );
    }

    function screenBooking() {
      var methods = bk.methods || ["В Encore", "Медсестра на дом"];
      if (state.sent) {
        return (
          '<div class="ph-body ph-center">' +
          '<div class="ph-done">' + ICON.check + "</div>" +
          '<div class="ph-h1">Заявка отправлена</div>' +
          '<div class="ph-sub">' + esc(methods[state.method]) + ", " + esc(DATES[state.date]) + " в " + esc((bk.slots || [])[state.slot] || "") + "<br>Подтвердим и напишем вам.</div>" +
          '<div class="ph-bottom ph-bottom--tight"><button type="button" class="ph-btn" data-act="next">В личный кабинет</button></div>' +
          "</div>"
        );
      }
      return (
        '<div class="ph-body">' +
        '<div class="ph-h1">Запись на сдачу</div>' +
        '<div class="ph-field"><span class="ph-label">Где сдать</span>' + seg(methods, state.method, "method") + "</div>" +
        (state.method === 1 ? '<div class="ph-field"><label class="ph-label" for="ph-addr">Адрес</label><input class="ph-input" id="ph-addr" placeholder="Город, улица, дом, квартира"></div>' : "") +
        '<div class="ph-field"><span class="ph-label">Дата</span>' + chips(DATES, state.date, "date") + "</div>" +
        '<div class="ph-field"><span class="ph-label">Время, слоты 8:00–10:00</span>' + chips(bk.slots || [], state.slot, "slot") + "</div>" +
        '<div class="ph-block"><b>Как подготовиться</b><ul>' + (bk.prep || []).map(function (x) { return "<li>" + t(x) + "</li>"; }).join("") + "</ul>" +
        (bk.memo ? '<a class="ph-ext" href="../assets/' + esc(bk.memo) + '" target="_blank" rel="noopener">' + ICON.ext + "Открыть памятку</a>" : "") + "</div>" +
        '<div class="ph-bottom"><button type="button" class="ph-btn" data-act="send">Записаться</button></div>' +
        "</div>"
      );
    }

    function screenCabinet() {
      var st = statuses[state.status] || {};
      var key = st.key || "pending";
      var methods = bk.methods || ["В Encore", "Медсестра на дом"];
      var slot = (bk.slots || [])[state.slot] || "";
      var rows = '<div class="ph-rows">' +
        '<div class="ph-row"><span>Дата</span><span>' + esc(DATES[state.date]) + "</span></div>" +
        '<div class="ph-row"><span>Время</span><span>' + esc(slot) + "</span></div>" +
        '<div class="ph-row"><span>Способ</span><span>' + esc(methods[state.method]) + "</span></div></div>";
      var body = "";
      if (key === "pending") {
        body = rows + '<div class="ph-sub">Команда подтвердит запись и напишет вам.</div>';
      } else if (key === "confirmed") {
        body = rows + '<div class="ph-block"><b>Как подготовиться</b><ul>' + (bk.prep || []).map(function (x) { return "<li>" + t(x) + "</li>"; }).join("") + "</ul>" +
          (bk.memo ? '<a class="ph-ext" href="../assets/' + esc(bk.memo) + '" target="_blank" rel="noopener">' + ICON.ext + "Открыть памятку</a>" : "") + "</div>";
      } else if (key === "processing") {
        body = '<div class="ph-rows"><div class="ph-row"><span>Кровь взята</span><span>' + esc(DATES[state.date]) + "</span></div>" +
          '<div class="ph-row"><span>Ожидаемый срок</span><span>' + t(flow.expectedTerm, "срок") + "</span></div></div>";
      } else if (key === "ready") {
        body = '<div class="ph-rows"><div class="ph-doc">' + ICON.doc + "Результаты анализов<em>PDF</em></div>" +
          (flow.reports || []).map(function (r) { return '<div class="ph-doc">' + ICON.doc + t(r) + "<em>PDF</em></div>"; }).join("") + "</div>" +
          '<button type="button" class="ph-btn ph-btn--ghost">Посмотреть результаты</button>';
      } else if (key === "retake") {
        body = '<div class="ph-sub">' + t(st.nameTodo) + "</div>" +
          '<div class="ph-rows"><div class="ph-row"><span>Причина</span><span>' + t("[ЗАПОЛНИТЬ: причина]") + "</span></div></div>" +
          '<button type="button" class="ph-btn" data-act="retake">Записаться повторно</button>';
      }
      return (
        '<div class="ph-body">' +
        '<div class="ph-h1">Мой заказ</div>' +
        '<div class="ph-card"><div class="ph-card-top"><b>' + esc(productName()) + '</b><span class="ph-badge ph-badge--' + esc(key) + '">' + t(st.name, "статус") + "</span></div>" +
        body +
        "</div></div>"
      );
    }

    var SCREENS = [screenCheckout, screenAuth, screenQuestionnaire, screenBooking, screenCabinet];

    /* ---------- description ---------- */
    function description() {
      var s = steps[state.step] || {};
      var head = "<h3>Шаг " + (state.step + 1) + ". " + t(s.title, "шаг") + "</h3>";
      if (state.step === 4) {
        return head +
          '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>Статус</th><th>Когда ставится</th><th>Кто меняет</th><th>Что видит клиент</th></tr></thead><tbody>' +
          statuses.map(function (st) {
            return '<tr><td data-label="Статус">' + t(st.name) + (st.nameTodo ? "<br>" + t(st.nameTodo) : "") + '</td><td data-label="Когда ставится">' + t(st.when) + '</td><td data-label="Кто меняет">' + t(st.who) + '</td><td data-label="Что видит клиент">' + t(st.sees) + "</td></tr>";
          }).join("") +
          "</tbody></table></div>" +
          kv([{ label: "Что происходит у нас", value: t(s.ours) }, { label: "Кто отвечает", value: t(s.owner) }], true);
      }
      return head + kv([
        { label: "Что делает клиент", value: t(s.client, "что делает клиент") },
        { label: "Что происходит у нас", value: t(s.ours, "что происходит у нас") },
        { label: "Кто отвечает", value: t(s.owner, "кто отвечает") }
      ], true);
    }

    /* ---------- render ---------- */
    function render() {
      var pills = steps.map(function (s, i) {
        return '<button type="button" class="flow-pill' + (i === state.step ? " is-active" : "") + '" data-act="step" data-i="' + i + '" aria-pressed="' + (i === state.step) + '"><span class="n">' + (i + 1) + "</span>" + t(s.title) + "</button>";
      }).join("");
      var statusPills = state.step === 4
        ? '<div class="flow-statuses" aria-label="Статус заказа">' + statuses.map(function (st, i) {
            return '<button type="button" class="flow-status-pill' + (i === state.status ? " is-active" : "") + '" data-act="status" data-i="' + i + '" aria-pressed="' + (i === state.status) + '">' + t(st.name) + "</button>";
          }).join("") + "</div>"
        : "";
      root.innerHTML =
        '<div class="flow-layout">' +
        '<div class="flow-phone-col">' +
        '<div class="flow-steps" aria-label="Шаги">' + pills + "</div>" +
        statusPills +
        '<div class="phone"><div class="screen-clip"><div class="notch"></div><div class="ph-screen">' + statusbar() + SCREENS[state.step]() + "</div></div></div>" +
        "</div>" +
        '<div class="flow-desc">' +
        '<button type="button" class="flow-desc-toggle" data-act="desc" aria-expanded="' + state.descOpen + '"><span class="acc-title">Описание шага</span>' + ICON.chev + "</button>" +
        '<div class="flow-desc-body"' + (state.descOpen ? "" : " hidden") + ">" + description() + "</div>" +
        "</div></div>";
    }

    function go(step) { state.step = Math.max(0, Math.min(SCREENS.length - 1, step)); render(); }

    root.addEventListener("click", function (e) {
      var el = e.target.closest("[data-act]");
      if (!el || !root.contains(el)) return;
      var act = el.getAttribute("data-act"), i = parseInt(el.getAttribute("data-i"), 10);
      switch (act) {
        case "step": go(i); break;
        case "status": state.status = i; render(); break;
        case "product": state.product = i; render(); break;
        case "promo":
          var inp = root.querySelector("#ph-promo");
          var val = inp ? inp.value.trim() : "";
          if (!val) { if (inp) inp.focus(); return; }
          state.promo = val; state.promoApplied = true; render(); break;
        case "next":
          if (el.getAttribute("aria-disabled") === "true") return;
          state.qPage = 0; go(state.step + 1); break;
        case "qnext": state.qPage += 1; render(); break;
        case "qback": state.qPage = Math.max(0, state.qPage - 1); render(); break;
        case "method": state.method = i; render(); break;
        case "date": state.date = i; render(); break;
        case "slot": state.slot = i; render(); break;
        case "send": state.sent = true; render(); break;
        case "retake": state.sent = false; go(3); break;
        case "choice":
          var group = el.getAttribute("data-group");
          root.querySelectorAll('[data-group="' + group + '"]').forEach(function (b) { b.classList.toggle("on", b === el); });
          break;
        case "desc":
          state.descOpen = !state.descOpen;
          el.setAttribute("aria-expanded", String(state.descOpen));
          root.querySelector(".flow-desc-body").hidden = !state.descOpen;
          break;
      }
    });
    root.addEventListener("input", function (e) {
      if (e.target.id === "ph-promo") state.promo = e.target.value;
    });
    root.addEventListener("change", function (e) {
      if (e.target.getAttribute("data-act") === "consent") {
        state.consents[parseInt(e.target.getAttribute("data-i"), 10)] = e.target.checked;
        render();
      }
    });

    render();
  };
})();
