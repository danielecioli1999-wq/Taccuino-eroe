/* Lingua dell'interfaccia: il testo dell'app è scritto in italiano; con la lingua "en" viene tradotto
   al momento della visualizzazione usando il dizionario NIM.I18N_EN (i18n-en.js). */
(function () {
  "use strict";
  const NIM = globalThis.NIM;
  const I = (NIM.i18n = { lang: "it", exact: new Map(), pats: [], cache: new Map(), ready: false });

  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  I.init = function () {
    if (I.ready) return;
    I.ready = true;
    (NIM.I18N_EN || []).forEach(([it, en]) => {
      const k = it.trim();
      if (!k.includes("{#}")) { I.exact.set(k, en.trim()); return; }
      const rx = new RegExp("^" + k.split("{#}").map(reEsc).join("([\\s\\S]*?)") + "$");
      I.pats.push([rx, en.trim()]);
    });
    // i modelli più lunghi (più specifici) prima
    I.pats.sort((a, b) => b[0].source.length - a[0].source.length);
  };

  // traduce una stringa (senza toccare gli spazi ai bordi)
  I.tr = function (str, depth) {
    if (!str) return str;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(str);
    const core = m[2];
    if (!core) return str;
    return m[1] + I.trCore(core, depth || 0) + m[3];
  };
  I.trCore = function (core, depth) {
    if (I.exact.has(core)) return I.exact.get(core);
    if (I.cache.has(core)) return I.cache.get(core);
    let out = core;
    // elenchi "a · b · c" (note del motore, riepiloghi)
    for (const [rx, en] of I.pats) {
      const g = rx.exec(core);
      if (!g) continue;
      let i = 0;
      out = en.replace(/\{#\}/g, () => (depth < 3 ? I.tr(g[++i], depth + 1) : g[++i]));
      break;
    }
    if (out === core && core.includes(" · ")) {
      const parts = core.split(" · ");
      const tr = parts.map((p) => I.tr(p, depth + 1));
      if (tr.some((p, i) => p !== parts[i])) out = tr.join(" · ");
    }
    if (out === core && core.includes(", ") && depth < 3 && core.length < 160) {
      const parts = core.split(", ");
      const tr = parts.map((p) => I.tr(p, depth + 1));
      if (tr.some((p, i) => p !== parts[i])) out = tr.join(", ");
    }
    if (out === core && /\.\s+\S/.test(core) && depth < 3) {
      // più frasi: traduci ciascuna
      const parts = core.split(/(?<=[.!?])\s+/);
      if (parts.length > 1) {
        const tr = parts.map((p) => I.tr(p, depth + 1));
        if (tr.some((p, i) => p !== parts[i])) out = tr.join(" ");
      }
    }
    if (I.cache.size > 4000) I.cache.clear();
    I.cache.set(core, out);
    return out;
  };

  I.t = (s) => (I.lang === "en" ? I.tr(s) : s);

  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, SVG: 1, svg: 1 };
  I.apply = function (root) {
    if (I.lang !== "en" || !root) return;
    I.init();
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && SKIP[n.parentNode.nodeName] ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => { const v = n.nodeValue; if (v && v.trim()) { const o = I.tr(v); if (o !== v) n.nodeValue = o; } });
    root.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach((el) => {
      ["placeholder", "aria-label", "title", "alt"].forEach((a) => {
        const v = el.getAttribute(a);
        if (v) { const o = I.tr(v); if (o !== v) el.setAttribute(a, o); }
      });
    });
  };

  I.set = function (lang) {
    I.lang = lang === "en" ? "en" : "it";
    if (I.lang === "en") I.init();
    try { document.documentElement.lang = I.lang; } catch (e) { /* ignore */ }
  };
})();
