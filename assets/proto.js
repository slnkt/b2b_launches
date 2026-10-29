/* Кликабельный прототип клиентского флоу в рамке телефона.
   Компоненты экранов повторяют существующие прототипы Bioniq (прототип для Яндекс консьержа).
   Без реальных данных и отправки: кнопки только переключают экраны. */
(function () {
  "use strict";

  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.5"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    status: '<span class="ph-status-ic">' +
      '<svg viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
      '<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1 4.5a10 10 0 0 1 14 0"/><path d="M3.8 7.3a6 6 0 0 1 8.4 0"/><path d="M6.6 10a2.2 2.2 0 0 1 2.8 0"/></svg>' +
      '<svg viewBox="0 0 26 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="1" y="1" width="21" height="10" rx="3"/><rect x="3" y="3" width="15" height="6" rx="1.5" fill="currentColor" stroke="none"/><path d="M24 4.5v3" stroke-linecap="round"/></svg>' +
      "</span>"
  };
  var MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

  window.renderFlowProto = function (root, flow, h) {
    if (!root) return;
    var t = h.t, esc = h.esc, kv = h.kv;
    var steps = flow.steps || [];
    var statuses = flow.statuses || [];
    var co = flow.checkout || {}, auth = flow.auth || {}, qn = flow.questionnaire || {}, bk = flow.booking || {};
    var products = co.products || ["Кровь"];
    var qBlocks = qn.blocks || [];
    var slots = bk.slots || [];

    var state = {
      step: 0, product: 0,
      promo: co.promo || "", promoApplied: false, consents: [false, false],
      qPage: 0,
      date: 0, slot: 0, sent: false,
      status: 0,
      descOpen: false
    };

    var DATES = (function () {
      var out = [], now = new Date();
      for (var i = 1; i <= 3; i++) {
        var d = new Date(now.getTime() + i * 86400000);
        out.push({ wd: WEEKDAYS[d.getDay()], day: d.getDate(), mon: MONTHS[d.getMonth()], full: d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear() });
      }
      return out;
    })();

    /* ---------- shared parts ---------- */
    function statusbar() { return '<div class="ph-status"><span>9:41</span>' + ICON.status + "</div>"; }
    function tophead() { return '<div class="ph-tophead"><div class="ph-av">НС</div></div>'; }
    function productName() { return "МетабоСкан: " + products[state.product]; }
    function prepCard() {
      return '<div class="ph-rec"><div class="ph-rec-title">Как подготовиться</div><ol class="ph-rec-list">' +
        (bk.prep || []).map(function (x) { return "<li>" + t(x) + "</li>"; }).join("") + "</ol>" +
        (bk.memo ? '<a class="ph-pilllink" href="../assets/' + esc(bk.memo) + '" target="_blank" rel="noopener">' + ICON.ext + "Открыть памятку</a>" : "") +
        "</div>";
    }

    /* ---------- screens ---------- */
    function screenCheckout() {
      var consentList = co.consents || [];
      var ready = state.promoApplied && consentList.every(function (c, i) { return c.required === false || state.consents[i]; });
      var priceHtml = t(co.price, "цена");
      var consents = consentList.map(function (c, i) {
        return '<label class="ph-check"><input type="checkbox" data-act="consent" data-i="' + i + '"' + (state.consents[i] ? " checked" : "") + '><span class="ph-cb"></span><span>' + t(c.label) +
          ' <em class="ph-req">' + (c.required === false ? "необязательно" : "обязательно") + "</em><br>" + t(c.text, "текст согласия") + "</span></label>";
      }).join("");
      return (
        tophead() +
        '<div class="ph-body">' +
        '<h2 class="ph-h2s">Оформление заказа</h2>' +
        '<div class="ph-seg">' + products.map(function (x, i) {
          return '<button type="button" class="' + (i === state.product ? "on" : "") + '" data-act="product" data-i="' + i + '">' + esc(x) + "</button>";
        }).join("") + "</div>" +
        '<div class="ph-order-item"><b>' + esc(productName()) + '</b><span class="ph-pr">' + priceHtml + "</span></div>" +
        '<div class="ph-sect-h">Промокод</div>' +
        '<div class="ph-promo' + (state.promoApplied ? " ok" : "") + '"><input class="ph-promo-in" id="ph-promo" value="' + esc(state.promo) + '" placeholder="Введите промокод"' + (state.promoApplied ? " disabled" : "") + ">" +
        '<button type="button" class="ph-ap" data-act="promo"' + (state.promoApplied ? " disabled" : "") + ">" + (state.promoApplied ? "Применен" : "Активировать") + "</button></div>" +
        (state.promoApplied ? '<div><span class="ph-chip-ok">' + ICON.check + "Промокод Encore применен</span></div>" : "") +
        '<div class="ph-order-list"><div class="ph-ol">' + esc(productName()) + '</div><div class="ph-ol">Выезд медсестры на дом</div>' +
        (state.promoApplied ? '<div class="ph-ol">Промокод Encore: <s>' + priceHtml + "</s></div>" : "") + "</div>" +
        '<div class="ph-order-total"><span class="l">Итого</span><span class="v">' + (state.promoApplied ? "0 ₽" : priceHtml) + "</span></div>" +
        '<div class="ph-consents">' + consents + "</div>" +
        '<div class="ph-bottom"><button type="button" class="ph-btn' + (ready ? "" : " dis") + '" data-act="next"' + (ready ? "" : ' aria-disabled="true"') + ">Продолжить</button>" +
        '<div class="ph-hint">' + (ready ? "" : "Активируйте промокод и отметьте обязательное согласие") + "</div></div>" +
        "</div>"
      );
    }

    function screenAuth() {
      return (
        '<div class="ph-auth">' +
        '<div class="ph-auth-modal">' +
        '<div class="ph-auth-head"><h3>Войти или зарегистрироваться</h3><span class="ph-auth-x" aria-hidden="true">✕</span></div>' +
        '<p class="ph-auth-sub">' + t(auth.method, "способ входа") + "</p>" +
        '<label class="ph-fld"><span class="lb">Ваш email или номер телефона</span><input class="ph-fld-in" placeholder="+7"></label>' +
        '<button type="button" class="ph-btn" data-act="next">Войти</button>' +
        '<button type="button" class="ph-btn dark" data-act="next">Зарегистрироваться</button>' +
        "</div></div>"
      );
    }

    function screenQuestionnaire() {
      var n = qBlocks.length || 1, page = Math.min(state.qPage, n - 1), b = qBlocks[page] || { fields: [] };
      var pct = Math.round(((page + 1) / n) * 100);
      var fields = (b.fields || []).map(function (f, i) {
        var id = "ph-q-" + page + "-" + i;
        if (f.type === "choice") {
          return '<div class="ph-cap-h">' + t(f.label) + "</div>" + (f.options || []).map(function (o, j) {
            return '<button type="button" class="ph-fmt-row" data-act="choice" data-group="' + id + '">' + esc(o) + '<span class="radio"></span></button>';
          }).join("");
        }
        return '<label class="ph-fld"><span class="lb">' + t(f.label) + '</span><input class="ph-fld-in" id="' + id + '" placeholder="' + esc(f.placeholder || "") + '"></label>';
      }).join("");
      return (
        tophead() +
        '<div class="ph-body">' +
        '<div class="ph-progress" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' +
        '<h2 class="ph-h2s">' + t(b.title, "блок") + "</h2>" +
        '<p class="ph-sub">Анкета, блок ' + (page + 1) + " из " + n + (page === 0 && qn.note ? ". " + t(qn.note) : "") + "</p>" +
        fields +
        '<div class="ph-bottom"><button type="button" class="ph-btn" data-act="' + (page + 1 < n ? "qnext" : "next") + '">' + (page + 1 < n ? "Далее" : "Готово") + "</button>" +
        (page > 0 ? '<div class="ph-hint"><button type="button" class="ph-link" data-act="qback">Назад</button></div>' : "") +
        "</div></div>"
      );
    }

    function screenBooking() {
      if (state.sent) {
        return (
          statusbarless() +
          '<div class="ph-thanks">' +
          '<div class="ph-ok-ring">' + ICON.check + "</div>" +
          "<h2>Заявка отправлена</h2>" +
          "<p>Медсестра приедет " + esc(DATES[state.date].full) + " в " + esc(slots[state.slot] || "") + ". Менеджер подтвердит запись и напишет вам.</p>" +
          '<button type="button" class="ph-btn" data-act="next">В личный кабинет</button>' +
          "</div>"
        );
      }
      return (
        tophead() +
        '<div class="ph-body">' +
        '<h2 class="ph-h2s">Заявка на сдачу крови</h2>' +
        '<p class="ph-sub">Медсестра приедет к вам домой. Менеджер свяжется после отправки заявки</p>' +
        '<label class="ph-fld"><span class="lb">Адрес</span><input class="ph-fld-in" id="ph-addr" placeholder="Город, улица, дом, квартира"></label>' +
        '<div class="ph-cap-h">Дата</div>' +
        '<div class="ph-date-chips">' + DATES.map(function (d, i) {
          return '<button type="button" class="ph-date-chip' + (i === state.date ? " on" : "") + '" data-act="date" data-i="' + i + '">' + esc(d.wd) + "<b>" + d.day + "</b>" + esc(d.mon) + "</button>";
        }).join("") + "</div>" +
        '<div class="ph-cap-h mt">Время, слоты 8:00–10:00</div>' +
        '<div class="ph-slots">' + slots.map(function (x, i) {
          return '<button type="button" class="ph-slot' + (i === state.slot ? " on" : "") + '" data-act="slot" data-i="' + i + '">' + esc(x) + "</button>";
        }).join("") + "</div>" +
        '<div class="ph-cap-h mt"></div>' + prepCard() +
        '<div class="ph-bottom"><button type="button" class="ph-btn" data-act="send">Записаться</button></div>' +
        "</div>"
      );
    }
    function statusbarless() { return ""; }

    function screenCabinet() {
      var st = statuses[state.status] || {};
      var key = st.key || "pending";
      var slot = slots[state.slot] || "";
      var when = "Дата: " + esc(DATES[state.date].full) + "<br>Время: " + esc(slot) + "<br>Адрес: выезд медсестры на дом";
      var flag, title, desc, body = "";
      if (key === "pending") {
        flag = '<span class="ph-st-flag red">' + ICON.clock + t(st.name) + "</span>";
        title = "Запись на сдачу крови";
        desc = "Заявка на выезд медсестры ожидает подтверждения менеджера";
        body = '<div class="ph-kv">' + when + "</div>" + '<div class="ph-links"><button type="button" class="ph-link">Отменить запись</button></div>';
      } else if (key === "confirmed") {
        flag = '<span class="ph-st-flag green">' + ICON.check + t(st.name) + "</span>";
        title = "Запись на сдачу крови";
        desc = "Выезд медсестры подтвержден";
        body = '<div class="ph-kv">' + when + "</div>";
      } else if (key === "processing") {
        flag = '<span class="ph-st-flag orange">' + ICON.clock + t(st.name) + "</span>";
        title = "Результаты МетабоСкан";
        desc = "Кровь взята " + esc(DATES[state.date].full) + ", образец передан в лабораторию";
        body = '<div class="ph-kv">Срок результатов: ' + t(flow.expectedTerm, "срок") + "</div>";
      } else if (key === "ready") {
        flag = '<span class="ph-st-flag green">' + ICON.check + t(st.name) + "</span>";
        title = "Результаты МетабоСкан";
        desc = "Результаты из лаборатории Сеченовского университета и ваш отчет";
        body = '<div class="ph-docs">' +
          '<div class="ph-drow"><span class="ph-doc-thumb">PDF</span><span class="m">' + t(flow.clientReport, "отчет клиента") + '</span><button type="button" class="ph-pilllink">Скачать</button></div>' +
          "</div>" +
          '<div class="ph-kv">Оцифрованные результаты: 162 показателя со шкалами в кабинете</div>' +
          '<div class="ph-links"><button type="button" class="ph-link">Смотреть результаты</button></div>';
      } else {
        flag = '<span class="ph-st-flag red">' + ICON.alert + t(st.name) + "</span>";
        title = "Требуется пересдача";
        desc = "Проблема с биоматериалом, нужен повторный забор";
        body = '<div class="ph-kv">Причина: ' + t("[ЗАПОЛНИТЬ: причина пересдачи]") + "<br>Повторный забор для вас бесплатный.</div>" +
          '<button type="button" class="ph-btn mt" data-act="retake">Записаться повторно</button>';
      }
      return (
        tophead() +
        '<div class="ph-body">' +
        '<div class="ph-lk-hi">Добро пожаловать, <span>Никита</span></div>' +
        '<div class="ph-lk-chip">' + esc(productName()) + " ▾</div>" +
        '<div class="ph-lk-card">' + flag + '<div class="h">' + title + '</div><div class="d">' + desc + "</div>" + body + "</div>" +
        (key === "confirmed" ? prepCard() : "") +
        "</div>"
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
            return '<tr><td data-label="Статус">' + t(st.name) + '</td><td data-label="Когда ставится">' + t(st.when) + '</td><td data-label="Кто меняет">' + t(st.who) + '</td><td data-label="Что видит клиент">' + t(st.sees) + "</td></tr>";
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
      var screenClass = state.step === 1 ? " s-auth" : "";
      root.innerHTML =
        '<div class="flow-layout">' +
        '<div class="flow-phone-col">' +
        '<div class="flow-steps" aria-label="Шаги">' + pills + "</div>" +
        statusPills +
        '<div class="phone"><div class="screen-clip"><div class="notch"></div><div class="ph-screen' + screenClass + '">' + statusbar() + SCREENS[state.step]() + "</div></div></div>" +
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
