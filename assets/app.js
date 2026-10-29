(function () {
  "use strict";

  var DATA = window.LAUNCHES_DATA || { launches: [] };
  var STATUS = { preparing: "Подготовка", live: "Запущено", finished: "Завершено" };
  var ICON = {
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>',
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
    { id: "roles", label: "Роли" },
    { id: "products", label: "Продукты" },
    { id: "prep", label: "Подготовка" },
    { id: "flow", label: "Флоу" },
    { id: "guarantees", label: "Гарантии" },
    { id: "contacts", label: "Контакты" },
    { id: "questions", label: "Вопросы" }
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

    // roles
    html +=
      '<section class="section" id="roles"><div class="container"><div class="section-head"><h2>Роли</h2></div>' +
      '<div class="grid grid-3">' +
      (l.roles || []).map(function (r) {
        return '<article class="card"><h3>' + t(r.party, "участник") + "</h3><p>" + t(r.role, "роль") + "</p></article>";
      }).join("") +
      "</div></div></section>";

    // products
    var products = l.products || [];
    html +=
      '<section class="section" id="products"><div class="container"><div class="section-head"><h2>Продукты</h2></div>' +
      '<div class="grid grid-3">' +
      products.map(function (p, i) {
        return (
          '<article class="card"><h3>' + t(p.name, "название") + "</h3>" +
          '<div><div class="kv-line"><span class="k">Цена</span><span class="v">' + t(p.price, "цена") + "</span></div>" +
          '<div class="kv-line"><span class="k">Срок результатов</span><span class="v">' + t(p.term, "срок") + "</span></div></div>" +
          '<div class="card-actions"><button class="btn btn--secondary" type="button" data-modal="product-' + i + '">Состав</button></div>' +
          "</article>"
        );
      }).join("") +
      "</div></div></section>";

    // preparation
    var prep = l.preparation || [];
    html +=
      '<section class="section" id="prep"><div class="container"><div class="section-head"><h2>Подготовка к сдаче</h2></div>' +
      '<div class="tabs" role="tablist" aria-label="Тип биоматериала">' +
      prep.map(function (p, i) {
        return '<button class="tab" type="button" role="tab" id="tab-' + esc(p.id) + '" aria-selected="' + (i === 0) + '" aria-controls="panel-' + esc(p.id) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + t(p.label) + "</button>";
      }).join("") +
      "</div>" +
      prep.map(function (p, i) {
        var memo = p.memo
          ? '<a class="btn btn--primary" href="' + esc(p.memo) + '" download>' + ICON.download + "Скачать памятку</a>"
          : '<div>' + t(p.memoTodo, "памятка PDF") + "</div>";
        return (
          '<div class="tabpanel" role="tabpanel" id="panel-' + esc(p.id) + '" aria-labelledby="tab-' + esc(p.id) + '"' + (i === 0 ? "" : " hidden") + ">" +
          '<ul class="check-list">' + (p.items || []).map(function (it) { return "<li><span>" + t(it) + "</span></li>"; }).join("") + "</ul>" +
          memo +
          "</div>"
        );
      }).join("") +
      "</div></section>";

    // flow
    var flow = l.flow || [];
    html +=
      '<section class="section" id="flow"><div class="container"><div class="section-head"><h2>Клиентский флоу</h2></div>' +
      '<ol class="acc">' +
      flow.map(function (s, i) {
        return accItem({
          id: "flow-" + i,
          num: i + 1,
          title: t(s.title, "шаг"),
          body: kv([
            { label: "Что делает клиент", value: t(s.client, "что делает клиент") },
            { label: "Кто отвечает", value: t(s.owner, "кто отвечает") }
          ])
        });
      }).join("") +
      "</ol>" +
      '<ul class="acc" style="margin-top:16px">' +
      accItem({ id: "statuses", title: "Статусы заказа в ЛК", body: '<div class="kv-value">' + t(l.orderStatuses, "статусы заказа") + "</div>" }) +
      "</ul>" +
      "</div></section>";

    // guarantees
    html +=
      '<section class="section" id="guarantees"><div class="container"><div class="section-head"><h2>Гарантии клиенту</h2></div>' +
      '<ul class="acc">' +
      (l.guarantees || []).map(function (g, i) {
        return accItem({
          id: "g-" + i,
          title: t(g.situation, "ситуация"),
          body: kv([
            { label: "Что происходит", value: tOrDash(g.what) },
            { label: "Кто платит", value: tOrDash(g.who) }
          ])
        });
      }).join("") +
      "</ul></div></section>";

    // contacts
    html +=
      '<section class="section" id="contacts"><div class="container"><div class="section-head"><h2>Контакты</h2></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Участник</th><th>Ответственный</th><th>Контакт</th></tr></thead><tbody>' +
      (l.contacts || []).map(function (c) {
        return "<tr><td data-label=\"Участник\">" + t(c.party, "участник") + '</td><td data-label="Ответственный">' + t(c.person, "ответственный") + '</td><td data-label="Контакт">' + t(c.contact, "контакт") + "</td></tr>";
      }).join("") +
      "</tbody></table></div></div></section>";

    // questions
    var qs = l.questions || [];
    html +=
      '<section class="section" id="questions"><div class="container"><div class="section-head"><h2>Открытые вопросы</h2>' +
      '<label class="switch"><input type="checkbox" id="show-resolved"> Показать решенные</label></div>' +
      '<ul class="acc" id="questions-list">' +
      qs.map(function (q, i) {
        var resolved = q.status === "resolved";
        return accItem({
          id: "q-" + i,
          title: t(q.question, "вопрос"),
          tags: '<span class="chip' + (resolved ? " chip--resolved" : "") + '">' + (resolved ? "Решен" : "Открыт") + "</span>",
          body: kv([
            { label: "У кого", value: t(q.owner, "у кого") },
            { label: resolved ? "Решение" : "Контекст", value: t(q.note, resolved ? "решение" : "контекст") }
          ])
        }).replace('<li class="acc-item">', '<li class="acc-item" data-status="' + (resolved ? "resolved" : "open") + '"' + (resolved ? " hidden" : "") + ">");
      }).join("") +
      "</ul>" +
      '<div class="q-empty" id="q-empty" hidden>Открытых вопросов нет.</div>' +
      "</div></section>";

    // modals
    html += products.map(function (p, i) {
      var c = p.composition || {};
      return (
        '<dialog class="modal" id="product-' + i + '" aria-labelledby="product-' + i + '-title">' +
        '<div class="modal-inner"><div class="modal-head"><h3 id="product-' + i + '-title">' + t(p.name) + "</h3>" +
        '<button class="modal-close" type="button" aria-label="Закрыть">' + ICON.close + "</button></div>" +
        '<div class="modal-body">' +
        kv([
          { label: "Что входит", value: t(c.includes, "что входит") },
          { label: "Какие отчеты получает клиент", value: t(c.reports, "отчеты") },
          { label: "Цена", value: t(c.price, "цена") },
          { label: "Срок результатов", value: t(c.term, "срок") }
        ], true) +
        "</div></div></dialog>"
      );
    }).join("");

    root.innerHTML = html;
    initSubnav();
    initTabs();
    initQuestions();
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

  function initTabs() {
    var list = document.querySelector('[role="tablist"]');
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach(function (x) {
        var on = x === tab;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(x.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") j = 0;
        if (e.key === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j]); }
      });
    });
  }

  function initQuestions() {
    var toggle = document.getElementById("show-resolved");
    var list = document.getElementById("questions-list");
    var empty = document.getElementById("q-empty");
    if (!toggle || !list) return;
    function apply() {
      var visible = 0;
      Array.prototype.forEach.call(list.children, function (li) {
        var hide = li.getAttribute("data-status") === "resolved" && !toggle.checked;
        li.hidden = hide;
        if (!hide) visible++;
      });
      if (empty) empty.hidden = visible > 0;
    }
    toggle.addEventListener("change", apply);
    apply();
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
      if (e.target.tagName === "DIALOG" && lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
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
