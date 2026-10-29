(function () {
  "use strict";

  var DATA = window.LAUNCHES_DATA || { launches: [] };
  var STATUS = { preparing: "Подготовка", live: "Запущено", finished: "Завершено" };
  var ICON = {
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    back: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>'
  };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function todo(hint) {
    return '<span class="todo">[ЗАПОЛНИТЬ' + (hint ? ": " + hint : "") + "]</span>";
  }
  // Text with placeholders. null / "" / "[ЗАПОЛНИТЬ: ...]" become a plaque.
  function t(v, hint) {
    if (v === null || v === undefined || String(v).trim() === "") return todo(hint || "");
    return esc(v).replace(/\[ЗАПОЛНИТЬ(?::\s*([^\]]*))?\]/g, function (m, h) {
      return todo(h ? h.trim() : "");
    });
  }
  // Empty string means "not applicable" (dash), not "unfilled".
  function tOrDash(v) {
    if (v === null || v === undefined) return todo("");
    if (String(v).trim() === "") return '<span class="muted">—</span>';
    return t(v);
  }
  function fmtDate(iso) {
    if (!iso) return todo("дата");
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? m[3] + "." + m[2] + "." + m[1] : esc(iso);
  }
  function badge(status) {
    var label = STATUS[status];
    if (!label) return todo("статус");
    return '<span class="badge badge--' + esc(status) + '">' + label + "</span>";
  }
  function accItem(opts) {
    // opts: id, title (html), tags (html), body (html), num
    var btnId = opts.id + "-btn", panelId = opts.id + "-panel";
    return (
      '<li class="acc-item">' +
      '<button class="acc-btn" type="button" id="' + btnId + '" aria-expanded="false" aria-controls="' + panelId + '">' +
      (opts.num ? '<span class="acc-num">' + opts.num + "</span>" : "") +
      '<span class="acc-title">' + opts.title + "</span>" +
      (opts.tags ? '<span class="acc-tags">' + opts.tags + "</span>" : "") +
      ICON.chev +
      "</button>" +
      '<div class="acc-panel' + (opts.num ? "" : " acc-panel--plain") + '" id="' + panelId + '" role="region" aria-labelledby="' + btnId + '" hidden>' +
      opts.body +
      "</div></li>"
    );
  }
  function kv(items, stack) {
    return (
      '<div class="kv' + (stack ? " kv--stack" : "") + '">' +
      items.map(function (i) {
        return '<div class="kv-item"><div class="kv-label">' + i.label + '</div><div class="kv-value">' + i.value + "</div></div>";
      }).join("") +
      "</div>"
    );
  }

  /* ---------- index page ---------- */
  function renderIndex(root) {
    var cards = DATA.launches.map(function (l) {
      return (
        '<article class="card launch-card">' +
        '<div class="card-row"><h3>' + t(l.name, "название") + "</h3>" + badge(l.status) + "</div>" +
        '<p class="partners">' + t(l.partners, "партнеры") + "</p>" +
        '<p class="muted">Обновлено ' + fmtDate(l.updated) + "</p>" +
        '<div class="card-actions"><a class="btn btn--primary" href="' + esc(l.slug) + '/">Открыть</a></div>' +
        "</article>"
      );
    });
    cards.push('<div class="card card--dashed">' + t(DATA.otherLaunches, "остальные партнерства") + "</div>");

    root.innerHTML =
      '<section class="hero"><div class="container"><h1>' + esc(DATA.siteTitle || "Партнерские запуски Bioniq") + "</h1></div></section>" +
      '<section class="section"><div class="container"><div class="grid grid-3">' + cards.join("") + "</div></div></section>";
  }

  /* ---------- launch page ---------- */
  var SECTIONS = [
    { id: "product", label: "Продукт" },
    { id: "roles", label: "Роли" },
    { id: "flow", label: "Флоу" },
    { id: "guarantees", label: "Гарантии" },
    { id: "nextsteps", label: "Следующие шаги" },
    { id: "contacts", label: "Контакты" }
  ];

  function findLaunch() {
    var slug = document.body.getAttribute("data-launch");
    if (!slug) {
      var parts = location.pathname.split("/").filter(Boolean);
      if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) parts.pop();
      slug = parts[parts.length - 1] || "";
    }
    for (var i = 0; i < DATA.launches.length; i++) if (DATA.launches[i].slug === slug) return DATA.launches[i];
    return null;
  }

  function renderLaunch(root) {
    var l = findLaunch();
    if (!l) {
      root.innerHTML = '<section class="hero"><div class="container"><h1>Запуск не найден</h1><p class="muted" style="margin-top:12px">Проверьте slug в data.js и имя папки.</p></div></section>';
      return;
    }
    document.title = (l.name || "Запуск") + ", партнерские запуски Bioniq";

    var html = "";

    // sub navigation
    html +=
      '<nav class="subnav" aria-label="Разделы страницы"><div class="container">' +
      '<details class="subnav-menu" id="subnav">' +
      '<summary><span class="subnav-current">Разделы</span>' + ICON.chev + "</summary>" +
      '<ul class="subnav-list">' +
      SECTIONS.map(function (s) { return '<li><a href="#' + s.id + '" data-section="' + s.id + '">' + s.label + "</a></li>"; }).join("") +
      "</ul></details></div></nav>";

    // hero
    html +=
      '<section class="hero"><div class="container">' +
      "<h1>" + t(l.name, "название") + "</h1>" +
      '<p class="hero-partners">' + t(l.partners, "партнеры") + "</p>" +
      '<div class="hero-meta">' + badge(l.status) + "<span>Обновлено " + fmtDate(l.updated) + "</span></div>" +
      "</div></section>";

    // product: what it is, three variants, preparation inside the modals
    var about = l.about || {};
    var products = l.products || [];
    var prepById = {};
    (l.preparation || []).forEach(function (pr) { prepById[pr.id] = pr; });
    function money(v) { return typeof v === "number" && isFinite(v) ? v.toLocaleString("ru-RU") + " ₽" : t(v, "цена"); }
    html +=
      '<section class="section" id="product"><div class="container"><div class="section-head"><h2>Продукт</h2></div>' +
      '<p class="lead">' + t(about.short, "что это") + "</p>" +
      '<div class="lead-actions"><button class="btn btn--secondary" type="button" data-modal="about-modal">Подробнее</button></div>' +
      '<div class="grid grid-3">' +
      products.map(function (p, i) {
        return (
          '<article class="card"><h3>' + t(p.name, "название") + "</h3>" +
          '<div><div class="kv-line"><span class="k">Срок результатов</span><span class="v">' + t(p.term, "срок") + "</span></div>" +
          '<div class="kv-line"><span class="k">Закупочная цена</span><span class="v">' + money(p.purchasePrice) + "</span></div></div>" +
          '<div class="card-actions"><button class="btn btn--secondary" type="button" data-modal="product-' + i + '">Состав и подготовка</button></div>' +
          "</article>"
        );
      }).join("") +
      "</div>" +
      (l.productsFootnote ? '<p class="footnote">' + t(l.productsFootnote) + "</p>" : "") +
      "</div></section>";

    // roles
    html +=
      '<section class="section" id="roles"><div class="container"><div class="section-head"><h2>Роли</h2></div>' +
      '<div class="grid grid-3">' +
      (l.roles || []).map(function (r) {
        return '<article class="card"><h3>' + t(r.party, "участник") + "</h3><p>" + t(r.role, "роль") + "</p></article>";
      }).join("") +
      "</div></div></section>";

    // flow: clickable prototype (assets/proto.js)
    html +=
      '<section class="section" id="flow"><div class="container"><div class="section-head"><h2>Клиентский флоу</h2></div>' +
      '<div id="flow-proto"></div>' +
      "</div></section>";

    // guarantees: short list
    html +=
      '<section class="section" id="guarantees"><div class="container"><div class="section-head"><h2>Гарантии клиенту</h2></div>' +
      '<ul class="guar-list">' +
      (l.guarantees || []).map(function (g) {
        return "<li><b>" + t(g.title, "гарантия") + ".</b> " + t(g.text, "описание") + "</li>";
      }).join("") +
      "</ul>" +
      (l.guaranteesInternalNote ? '<div class="internal-note"><span class="internal-note-tag">Служебное</span>' + t(l.guaranteesInternalNote) + "</div>" : "") +
      "</div></section>";

    // next steps
    var STEP_STATUS = { todo: "Не начато", doing: "В работе", done: "Готово" };
    html +=
      '<section class="section" id="nextsteps"><div class="container"><div class="section-head"><h2>Следующие шаги</h2></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Задача</th><th>Ответственный</th><th>Статус</th></tr></thead><tbody>' +
      (l.nextSteps || []).map(function (n) {
        var label = STEP_STATUS[n.status];
        return '<tr><td data-label="Задача">' + t(n.task, "задача") + '</td><td data-label="Ответственный">' + t(n.owner, "ответственный") + '</td><td data-label="Статус">' +
          (label ? '<span class="chip chip--' + esc(n.status) + '">' + label + "</span>" : todo("статус")) + "</td></tr>";
      }).join("") +
      "</tbody></table></div></div></section>";

    // contacts
    html +=
      '<section class="section" id="contacts"><div class="container"><div class="section-head"><h2>Контакты</h2></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Участник</th><th>Ответственный</th><th>Контакт</th></tr></thead><tbody>' +
      (l.contacts || []).map(function (c) {
        return "<tr><td data-label=\"Участник\">" + t(c.party, "участник") + '</td><td data-label="Ответственный">' + t(c.person, "ответственный") + '</td><td data-label="Контакт">' + t(c.contact, "контакт") + "</td></tr>";
      }).join("") +
      "</tbody></table></div></div></section>";

    // modals
    var det = about.details || {};
    function bullets(arr, hint) {
      if (!arr || !arr.length) return t(null, hint);
      return '<ul class="bullets">' + arr.map(function (x) { return "<li>" + t(x) + "</li>"; }).join("") + "</ul>";
    }
    html +=
      '<dialog class="modal" id="about-modal" aria-labelledby="about-modal-title">' +
      '<div class="modal-inner"><div class="modal-head"><h3 id="about-modal-title">МетабоСкан</h3>' +
      '<button class="modal-close" type="button" aria-label="Закрыть">' + ICON.close + "</button></div>" +
      '<div class="modal-body">' +
      kv([
        { label: "Метод", value: t(det.method, "метод") },
        { label: "Кровь", value: t(det.blood, "состав по крови") },
        { label: "Моча", value: t(det.urine, "состав по моче") },
        { label: "Что получает клиент", value: bullets(det.clientGets, "что получает клиент") },
        { label: "Чего не делает", value: bullets(det.notGives, "чего не делает") }
      ], true) +
      "</div></div></dialog>";

    html += products.map(function (p, i) {
      var prepHtml = (p.prep || []).map(function (id) {
        var pr = prepById[id];
        if (!pr) return t("[ЗАПОЛНИТЬ: подготовка " + id + "]");
        return (
          '<div class="prep-block"><div class="kv-label">' + t(pr.label) + "</div>" +
          '<ul class="check-list">' + (pr.items || []).map(function (it) { return "<li><span>" + t(it) + "</span></li>"; }).join("") + "</ul>" +
          (pr.memo
            ? '<a class="btn btn--primary" href="../assets/' + esc(pr.memo) + '" target="_blank" rel="noopener">' + ICON.open + "Открыть памятку</a>"
            : t(pr.memoTodo, "памятка PDF")) +
          "</div>"
        );
      }).join("");
      return (
        '<dialog class="modal" id="product-' + i + '" aria-labelledby="product-' + i + '-title">' +
        '<div class="modal-inner"><div class="modal-head"><h3 id="product-' + i + '-title">' + t(p.name) + "</h3>" +
        '<button class="modal-close" type="button" aria-label="Закрыть">' + ICON.close + "</button></div>" +
        '<div class="modal-body">' +
        kv([
          { label: "Срок результатов", value: t(p.term, "срок") },
          { label: "Закупочная цена (Сеченовский университет)", value: money(p.purchasePrice) },
          { label: "Биоматериал", value: t(p.biomaterial, "биоматериал") },
          { label: "Что входит", value: t(p.includes, "что входит") }
        ], true) +
        '<div class="prep-wrap">' + prepHtml + "</div>" +
        "</div></div></dialog>"
      );
    }).join("");

    root.innerHTML = html;
    if (window.renderFlowProto) window.renderFlowProto(document.getElementById("flow-proto"), l.flow || {}, { t: t, esc: esc, kv: kv });
    initSubnav();
    initModals();
    // Sections appear after load, so the browser could not scroll to the hash itself.
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }

  /* ---------- behaviour ---------- */
  function initAccordions() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".acc-btn");
      if (!btn) return;
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) panel.hidden = open;
    });
  }

  function initSubnav() {
    var details = document.getElementById("subnav");
    if (!details) return;
    var mq = window.matchMedia("(min-width: 1024px)");
    var current = details.querySelector(".subnav-current");
    var links = Array.prototype.slice.call(details.querySelectorAll("a[data-section]"));

    function sync() { details.open = mq.matches; }
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync); else mq.addListener(sync);

    links.forEach(function (a) {
      a.addEventListener("click", function () { if (!mq.matches) details.open = false; });
    });
    document.addEventListener("click", function (e) {
      if (!mq.matches && details.open && !details.contains(e.target)) details.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mq.matches && details.open) { details.open = false; details.querySelector("summary").focus(); }
    });

    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute("data-section") === id;
        a.classList.toggle("is-active", on);
        if (on) { a.setAttribute("aria-current", "location"); current.textContent = a.textContent; }
        else a.removeAttribute("aria-current");
      });
    }
    var sections = SECTIONS.map(function (s) { return document.getElementById(s.id); }).filter(Boolean);
    function onScroll() {
      var line = window.scrollY + 120, active = sections[0] && sections[0].id;
      sections.forEach(function (s) { if (s.offsetTop <= line) active = s.id; });
      if (active) setActive(active);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initModals() {
    var lastTrigger = null;
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-modal]");
      if (opener) {
        var dlg = document.getElementById(opener.getAttribute("data-modal"));
        if (dlg && typeof dlg.showModal === "function") {
          lastTrigger = opener;
          dlg.showModal();
          var close = dlg.querySelector(".modal-close");
          if (close) close.focus();
        }
        return;
      }
      var closeBtn = e.target.closest(".modal-close");
      if (closeBtn) { closeBtn.closest("dialog").close(); return; }
      // click on the backdrop: the target is the dialog itself, not its content
      if (e.target.tagName === "DIALOG" && e.target.open) e.target.close();
    });
    document.addEventListener("close", function (e) {
      if (e.target.tagName !== "DIALOG") return;
      if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
    }, true);
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("app");
    if (!root) return;
    initAccordions();
    if (document.body.getAttribute("data-page") === "index") renderIndex(root);
    else renderLaunch(root);
  });
})();
