/* UI: stato, salvataggio locale, rendering, eventi. */
(function () {
  "use strict";
  const NIM = globalThis.NIM;
  const UI = (NIM.ui = { A: {}, views: {}, modals: {}, live: {} });

  const STORE_KEY = "nimble-hero-sheet-v1";
  const S = (UI.S = { db: null, tab: "scheda", modal: null, edit: false, storageOK: true });

  /* ---------- helper HTML ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  UI.esc = esc;
  UI.fmt = NIM.fmt;
  UI.card = (title, body, cls) => `<section class="card ${cls || ""}">${title ? `<h2>${title}</h2>` : ""}${body}</section>`;
  UI.chip = (t, cls) => `<span class="chip ${cls || ""}">${t}</span>`;
  UI.sel = (bind, opts, cur, attrs) =>
    `<select data-bind="${bind}" ${attrs || ""}>${opts.map((o) => (o.group !== undefined ? `<optgroup label="${esc(o.group)}">${o.items.map((i) => `<option value="${esc(i.v)}" ${String(i.v) === String(cur) ? "selected" : ""}>${esc(i.t)}</option>`).join("")}</optgroup>` : `<option value="${esc(o.v)}" ${String(o.v) === String(cur) ? "selected" : ""}>${esc(o.t)}</option>`)).join("")}</select>`;
  UI.stepper = (act, data, val, opts) => {
    opts = opts || {};
    const da = Object.entries(data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ");
    return `<span class="stepper"><button data-act="${act}" ${da} data-d="-1" ${opts.minDisabled ? "disabled" : ""} aria-label="meno">−</button><b>${val}</b><button data-act="${act}" ${da} data-d="1" ${opts.maxDisabled ? "disabled" : ""} aria-label="più">+</button></span>`;
  };

  UI.dieSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2.5 21 7.5v9L12 21.5 3 16.5v-9Z"/><path d="M12 2.5 7 14.5h10Z M3 7.5l4 7M21 7.5l-4 7M7 14.5l5 7 5-7"/></svg>';

  /* ---------- salvataggio ---------- */
  function loadDB() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const db = JSON.parse(raw);
        if (db && db.chars) {
          Object.keys(db.chars).forEach((id) => NIM.normalize(db.chars[id]));
          return db;
        }
      }
    } catch (e) { S.storageOK = false; }
    return { v: 1, activeId: null, chars: {}, welcomed: false };
  }
  let saveTimer = null;
  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S.db)); S.storageOK = true; }
    catch (e) { S.storageOK = false; UI.toast("Salvataggio non riuscito: usa Esporta per tenere una copia."); }
  }
  UI.saveNow = saveNow;
  UI.save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 150); };
  addEventListener("pagehide", saveNow);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveNow(); });

  UI.C = () => (S.db && S.db.chars[S.db.activeId]) || null;
  UI.commit = function (render) {
    const c = UI.C();
    if (c) c.updated = Date.now();
    UI.save();
    if (render !== false) UI.render();
  };

  /* ---------- toast ---------- */
  let toastTimer;
  UI.toast = function (msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = NIM.i18n.t(msg); el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  };

  /* ---------- rendering ---------- */
  UI.TABS = [
    ["scheda", "Scheda", '<path d="M12 3 4 6v6c0 4.5 3.3 7.8 8 9 4.7-1.2 8-4.5 8-9V6Z"/>'],
    ["combat", "Combat", '<path d="m5 19 9-9m0 0 3-6 3 1-1 3-5 5Zm-9 9-2 2m3-1 2 2"/><path d="m19 19-9-9"/>'],
    ["classe", "Classe", '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z"/>'],
    ["zaino", "Zaino", '<path d="M8 7a4 4 0 0 1 8 0M6 7h12l1 13H5Z M9 12h6"/>'],
    ["altro", "Altro", '<path d="M4 7h16M4 12h16M4 17h16"/>'],
  ];

  UI.render = function () {
    const root = document.getElementById("app");
    const y = window.scrollY;
    const c = UI.C();
    let d = null;
    if (!c || S.tab === "chars") {
      root.innerHTML = UI.views.chars();
    } else {
      d = NIM.derive(c);
      root.innerHTML = UI.views.header(c, d) + `<main class="tab-${S.tab}">${UI.views[S.tab](c, d)}</main>` +
        `<nav class="nav">${UI.TABS.map(([id, label, path]) => `<button class="${S.tab === id ? "on" : ""}" data-act="tab" data-tab="${id}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg><span>${label}</span>${id === "classe" && d.pending ? `<em>${d.pending}</em>` : ""}</button>`).join("")}</nav>`;
    }
    UI.renderModal(c, d);
    NIM.i18n.apply(root);
    window.scrollTo(0, y);
  };

  UI.renderModal = function (c, d) {
    const el = document.getElementById("modal");
    if (!S.modal) { el.innerHTML = ""; document.body.classList.remove("modal-open"); return; }
    const fn = UI.modals[S.modal.type];
    const body = fn ? fn(c, d || (c ? NIM.derive(c) : null), S.modal) : "";
    const oldSheet = el.querySelector(".sheet");
    const keep = oldSheet && S.modal.keepScroll === S.modal.type ? oldSheet.scrollTop : 0;
    el.innerHTML = `<div class="overlay" data-act="modal-backdrop"><div class="sheet" role="dialog" aria-modal="true">${body}</div></div>`;
    NIM.i18n.apply(el);
    S.modal.keepScroll = S.modal.type;
    if (keep) el.querySelector(".sheet").scrollTop = keep;
    document.body.classList.add("modal-open");
  };
  UI.openModal = (type, extra) => { S.modal = Object.assign({ type }, extra || {}); UI.render(); };
  UI.closeModal = () => { S.modal = null; UI.render(); };

  /* ---------- eventi ---------- */
  function setPath(obj, path, val) {
    const parts = path.split(".");
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }
  UI.setPath = setPath;

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const fn = UI.A[el.dataset.act];
    if (fn) fn(el, e);
  });

  document.addEventListener("change", (e) => {
    const el = e.target;
    // campi di un modulo modale (stato in S.modal.f)
    if (el.dataset && el.dataset.mf !== undefined) {
      if (!S.modal) return;
      const v = el.type === "checkbox" ? el.checked : el.type === "number" ? (el.value === "" ? "" : +el.value) : el.value;
      S.modal.f = S.modal.f || {};
      S.modal.f[el.dataset.mf] = v;
      if (el.dataset.rerender !== undefined) UI.renderModal(UI.C());
      return;
    }
    if (!el.dataset || el.dataset.bind === undefined) return;
    const c = UI.C();
    if (!c) return;
    let val;
    if (el.type === "checkbox") val = el.checked;
    else if (el.dataset.type === "num" || el.type === "number") val = el.value === "" ? 0 : +el.value;
    else val = el.value;
    setPath(c, el.dataset.bind, val);
    if (el.dataset.bind === "ancestryId") c.ancChoice = "";
    if (el.dataset.bind === "bgId") { c.bgOption = 0; c.bgText = ""; }
    if (el.dataset.silent !== undefined) UI.commit(false);
    else if (el.tagName === "INPUT" && el.type !== "checkbox") { UI.save(); setTimeout(UI.render, 280); }
    else UI.commit(true);
  });

  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.live && UI.live[el.dataset.live]) UI.live[el.dataset.live](el, e);
    if (el.dataset && el.dataset.mf !== undefined && el.type !== "checkbox" && el.tagName !== "SELECT" && S.modal) {
      S.modal.f = S.modal.f || {};
      S.modal.f[el.dataset.mf] = el.type === "number" ? (el.value === "" ? "" : +el.value) : el.value;
      if (el.dataset.preview && UI.live[el.dataset.preview]) UI.live[el.dataset.preview]();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && S.modal) UI.closeModal();
    if (e.key === "Enter" && e.target.dataset && e.target.dataset.enter && UI.A[e.target.dataset.enter]) { e.preventDefault(); UI.A[e.target.dataset.enter](e.target, e); }
  });

  UI.boot = function () {
    S.db = loadDB();
    if (!S.db.lang) {
      const fresh = !Object.keys(S.db.chars).length && !S.db.welcomed;
      S.db.lang = fresh && !String(navigator.language || "it").toLowerCase().startsWith("it") ? "en" : "it";
    }
    NIM.i18n.set(S.db.lang);
    if (!S.db.activeId || !S.db.chars[S.db.activeId]) {
      const ids = Object.keys(S.db.chars);
      S.db.activeId = ids.length ? ids[0] : null;
    }
    S.tab = S.db.activeId ? "scheda" : "chars";
    UI.render();
    if (!S.db.welcomed) UI.openModal("welcome");
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ignore */ }
    const native = !!(window.Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform());
    if (native) { const f = document.getElementById("importfile"); if (f) f.removeAttribute("accept"); }
    if (!native && "serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  };
})();
