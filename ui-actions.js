/* UI: azioni, finestre modali, import/export. */
(function () {
  "use strict";
  const NIM = globalThis.NIM, UI = NIM.ui, A = UI.A, M = UI.modals, S = UI.S;
  const esc = UI.esc, fmt = NIM.fmt;
  const ctx = () => { const c = UI.C(); return { c, d: c ? NIM.derive(c) : null }; };
  const num = (v, def) => (v === "" || v == null || isNaN(+v) ? def : +v);

  /* ---------- navigazione / modifica ---------- */
  A.tab = (el) => { S.tab = el.dataset.tab; UI.render(); window.scrollTo(0, 0); };
  A["tab-zaino"] = () => { S.tab = "zaino"; UI.render(); window.scrollTo(0, 0); };
  A["tab-classe"] = () => { S.tab = "classe"; S.ctab = "prog"; UI.render(); window.scrollTo(0, 0); };
  A.ctab = (el) => { S.ctab = el.dataset.tab; UI.render(); window.scrollTo(0, 0); };
  A["det-all"] = (el) => {
    const on = el.dataset.v === "1";
    document.querySelectorAll("#app details.det[data-d]").forEach((x) => { x.open = on; S.open[x.dataset.d] = on; });
  };
  A["pin-toggle"] = (el) => {
    const { c } = ctx();
    const id = el.dataset.pin, tab = el.dataset.tab;
    c.pins = c.pins || [];
    let p = c.pins.find((x) => x.id === id);
    if (!p) {
      const r = UI.pinReg[id];
      if (!r) return;
      p = { id, name: r.name, sub: r.sub, text: r.text, tabs: [] };
      c.pins.push(p);
    }
    if (p.tabs.includes(tab)) p.tabs = p.tabs.filter((x) => x !== tab); else p.tabs.push(tab);
    if (!p.tabs.length) c.pins = c.pins.filter((x) => x.id !== id);
    UI.commit();
  };
  A["open-chars"] = () => { S.tab = "chars"; UI.render(); window.scrollTo(0, 0); };
  A["edit-toggle"] = () => { S.edit = !S.edit; UI.render(); };
  A["modal-close"] = () => UI.closeModal();
  A["modal-backdrop"] = (el, e) => { if (e.target === el) UI.closeModal(); };
  A["show-defense"] = () => UI.openModal("defense");

  /* ---------- valori ---------- */
  A["stat-step"] = (el) => { const { c } = ctx(); c.stats[el.dataset.stat] += +el.dataset.d; UI.commit(); };
  A["statmod-step"] = (el) => { const { c } = ctx(); c.statMod[el.dataset.stat] = (c.statMod[el.dataset.stat] || 0) + +el.dataset.d; UI.commit(); };
  A["manual-step"] = (el) => { const { c } = ctx(); c.manual[el.dataset.k] = (c.manual[el.dataset.k] || 0) + +el.dataset.d; UI.commit(); };
  A["skill-step"] = (el) => { const { c } = ctx(); c.skillPts[el.dataset.id] = (c.skillPts[el.dataset.id] || 0) + +el.dataset.d; UI.commit(); };

  /* ---------- Combat Tactics (nessun tiro: si usano dadi reali) ---------- */
  A["tactic-use"] = (el) => {
    const { c, d } = ctx();
    const t = d.cls.tactics.concat(d.cls.extraTactics).find((x) => x.id === el.dataset.id);
    if (c.combat.dice <= 0) return UI.toast("Nessun Combat Die rimasto.");
    c.combat.dice -= 1;
    let eff = t.id === "shatter-formation" ? `tira il d${d.diceSize}${d.diceAdv ? " (vantaggio)" : ""}: quel valore in danni a fino a ${Math.max(0, d.stats.STR)} bersagli, knockback 2` : `tira il d${d.diceSize}${d.diceAdv ? " (vantaggio)" : ""} e aggiungi il risultato ai danni`;
    if (t.mult > 1) eff += ` (×${t.mult})`;
    if (t.id === "heavy-strike") eff += `, knockback ${Math.max(0, d.stats.STR)} spazi`;
    UI.toast(t.name + ": Combat Die speso — " + eff);
    UI.commit();
  };
  A["dying-fail"] = () => {
    const { c, d } = ctx();
    NIM.gainWounds(c, d, 1);
    UI.toast("Save fallito: +1 Ferita");
    UI.commit();
  };

  /* ---------- PF / ferite ---------- */
  A["wound-set"] = (el) => { const { c } = ctx(); const n = +el.dataset.n; c.wounds = c.wounds === n ? n - 1 : n; UI.commit(); };
  A["hd-step"] = (el) => { const { c, d } = ctx(); c.hd = NIM.clamp(c.hd + +el.dataset.d, 0, d.maxHD); UI.commit(); };
  A["open-maxhp"] = () => { const { d } = ctx(); UI.openModal("maxhp", { f: { value: d.maxHP } }); };
  A["maxhp-apply"] = () => {
    const { c, d } = ctx();
    const v = Math.round(num(S.modal.f.value, NaN));
    if (isNaN(v) || v < 1) return UI.toast("Inserisci un valore valido (almeno 1).");
    c.manual.hp = (c.manual.hp || 0) + (v - d.maxHP);
    const d2 = NIM.derive(c);
    if (c.hp > d2.maxHP) c.hp = d2.maxHP;
    S.modal = null;
    UI.toast("PF massimi: " + d2.maxHP);
    UI.commit();
  };
  A["open-dmg"] = () => UI.openModal("dmg", { f: { amount: "", defend: false, crit: false, ignore: false } });
  A["open-heal"] = () => UI.openModal("heal", { f: { amount: "" } });
  A["open-rest"] = () => { const { c } = ctx(); UI.openModal("rest", { f: { count: Math.min(1, c.hd), medic: false, wild: false } }); };

  A["dmg-apply"] = () => {
    const { c, d } = ctx();
    const f = S.modal.f;
    const raw = num(f.amount, 0);
    if (raw <= 0) return UI.toast("Inserisci il danno subito.");
    if (f.defend && !c.combat.react.defend) { c.combat.react.defend = true; c.combat.actions = Math.max(0, c.combat.actions - 1); }
    const res = NIM.applyDamage(c, d, raw, { defend: f.defend, crit: f.crit, ignoreDef: f.ignore, furySpend: num(f.fury, 0), furySum: num(f.furySum, 0) });
    S.modal = null;
    UI.toast(res.notes.join(" · "));
    UI.commit();
  };
  A["heal-apply"] = () => {
    const { c, d } = ctx();
    const amt = num(S.modal.f.amount, 0);
    if (amt <= 0) return UI.toast("Inserisci quanti PF recuperi.");
    const was = c.hp;
    const got = NIM.heal(c, d, amt);
    S.modal = null;
    UI.toast("Recuperati " + got + " PF" + (was <= 0 && c.hp > 0 ? " — non sei più Dying" : ""));
    UI.commit();
  };
  A["tmp-apply"] = () => {
    const { c } = ctx();
    const amt = num(S.modal.f.amount, 0);
    if (amt <= 0) return UI.toast("Inserisci i PF temporanei.");
    c.tmp = Math.max(c.tmp, amt);
    S.modal = null;
    UI.toast("PF temp: " + c.tmp + " (non si sommano: si tiene il valore più alto)");
    UI.commit();
  };

  const parseDice = (t) => (String(t || "").match(/\d+/g) || []).map(Number);
  A["rest-catch"] = () => {
    const { c, d } = ctx();
    const f = S.modal.f;
    const n = NIM.clamp(num(f.count, 0), 0, c.hd);
    if (n <= 0) return UI.toast("Non hai dadi vita da spendere.");
    const oozeling = d.anc && d.anc.id === "oozeling";
    const results = parseDice(f.results);
    if (!oozeling && !results.length) return UI.toast("Scrivi i risultati dei dadi che hai tirato (es. 4 + 6).");
    const res = NIM.spendHitDice(c, d, n, { results, woundsInstead: num(f.wi, 0), fieldMedic: f.medic, perDie: f.wild ? Math.max(d.stats.STR, d.stats.INT) : 0 });
    S.modal = null; UI.toast("Catch Breath: recuperati " + res.healed + " PF" + (res.woundsHealed ? " e " + res.woundsHealed + " Ferite curate" : "")); UI.commit();
  };
  A["rest-camp"] = () => {
    const { c, d } = ctx();
    const f = S.modal.f;
    const n = NIM.clamp(num(f.count, 0), 0, c.hd);
    if (n <= 0) return UI.toast("Non hai dadi vita da spendere.");
    const res = NIM.spendHitDice(c, d, n, { camp: true, woundsInstead: num(f.wi, 0), fieldMedic: f.medic, perDie: f.wild ? Math.max(d.stats.STR, d.stats.INT) : 0 });
    S.modal = null; UI.toast("Make Camp: recuperati " + res.healed + " PF" + (res.woundsHealed ? " e " + res.woundsHealed + " Ferite curate" : "")); UI.commit();
  };
  A["rest-safe"] = () => {
    const { c, d } = ctx();
    NIM.safeRest(c, d);
    S.modal = null; UI.toast("Safe Rest: PF, Dadi Vita e risorse ripristinati, −1 Ferita."); UI.commit();
  };
  A["rest-kit"] = () => {
    const { c, d } = ctx();
    const idx = c.items.findIndex((i) => (NIM.resolveItem(i)).woundKit && (i.qty || 1) > 0);
    if (idx < 0) return UI.toast("Non hai un Medical Kit.");
    if (c.wounds <= 0) return UI.toast("Non hai Ferite da curare.");
    c.wounds -= 1;
    c.items[idx].qty = (c.items[idx].qty || 1) - 1;
    if (c.items[idx].qty <= 0) c.items.splice(idx, 1);
    S.modal = null; UI.toast("Medical Kit usato: −1 Ferita."); UI.commit();
  };

  /* ---------- turno e scontro ---------- */
  // Azione piena → la spende; azione vuota → la recupera.
  A["action-pip"] = (el) => {
    const { c, d } = ctx();
    const cap = d.dying ? d.dyingActions : 3;
    const left = Math.min(c.combat.actions, cap);
    c.combat.actions = +el.dataset.n <= left ? Math.max(0, left - 1) : Math.min(cap, left + 1);
    UI.commit();
  };
  // Defend / Interpose / Opportunity Attack / Help: spendono 1 azione (e la restituiscono se annulli).
  A["react-toggle"] = (el) => {
    const { c, d } = ctx();
    const k = el.dataset.k, cap = d.dying ? d.dyingActions : 3;
    if (c.combat.react[k]) {
      c.combat.react[k] = false;
      c.combat.actions = Math.min(cap, c.combat.actions + 1);
    } else {
      if (Math.min(c.combat.actions, cap) <= 0) return UI.toast("Non hai azioni rimaste.");
      c.combat.react[k] = true;
      c.combat.actions = Math.min(cap, c.combat.actions) - 1;
    }
    UI.commit();
  };
  function doEndTurn(attacked) {
    const { c, d } = ctx();
    const notes = NIM.endTurn(c, d, { attacked });
    UI.toast(["Fine turno: 3 azioni, reazioni e abilità “1/round” ripristinate."].concat(notes).join(" · "));
    UI.commit();
  }
  A["end-turn"] = () => {
    const { c, d } = ctx();
    if (d.cls.id === "berserker" && c.combat.raging && !c.combat.rageTurn) return UI.openModal("rageend");
    doEndTurn();
  };
  A["end-turn-yes"] = () => { S.modal = null; doEndTurn(true); };
  A["end-turn-no"] = () => { S.modal = null; doEndTurn(false); };
  A["new-enc"] = () => UI.openModal("enc", { f: { init: "", nat: false } });
  A["enc-start"] = () => {
    const { c, d } = ctx();
    const f = S.modal.f;
    const has = f.init !== "" && f.init != null && !isNaN(+f.init);
    const actions = has || f.nat ? NIM.actionsFromInit(has ? +f.init : 0, f.nat ? 20 : 0) : 3;
    const extra = NIM.startEncounter(c, d, actions);
    const bits = [actions + (actions === 1 ? " azione" : " azioni")];
    if (d.maxDice) bits.push(d.maxDice + " Combat Dice");
    if (d.maxMana) bits.push(d.maxMana + " mana");
    (extra || []).forEach((x) => bits.push(x));
    S.modal = null;
    UI.toast("Scontro iniziato: " + bits.join(", "));
    UI.commit();
  };
  A["end-enc"] = () => { const { c } = ctx(); NIM.endEncounter(c); UI.toast("Scontro terminato: Combat Dice e mana non spesi sono persi."); UI.commit(); };
  /* ---------- Berserker: Rage e Fury Dice ---------- */
  A["fury-step"] = (el) => {
    const { c, d } = ctx();
    const n = NIM.clamp(c.fury + +el.dataset.d, 0, d.furyMax);
    if (n > c.fury) c.combat.raging = true;
    if (n === 0) c.combat.raging = false;
    c.fury = n;
    UI.commit();
  };
  A["deathless"] = () => {
    const { c, d } = ctx();
    if (!d.dying) return UI.toast("Serve essere Dying.");
    if ((c.used.deathless || 0) >= 1) return UI.toast("Già usata in questo turno (1/turno).");
    NIM.gainWounds(c, d, 1);
    c.used.deathless = 1;
    c.combat.actions = Math.min(3, c.combat.actions + 1);
    NIM.gainFury(c, d, 1);
    UI.toast("Deathless Rage: +1 Ferita, +1 azione, +1 Fury Die");
    UI.commit();
  };
  A["spend-actions"] = (el) => {
    const { c, d } = ctx();
    const n = +el.dataset.n, cap = d.dying ? d.dyingActions : 3;
    if (Math.min(c.combat.actions, cap) < n) return UI.toast("Servono " + n + (n === 1 ? " azione" : " azioni") + ": non le hai.");
    c.combat.actions = Math.min(c.combat.actions, cap) - n;
    UI.toast(el.dataset.label + ": −" + n + (n === 1 ? " azione" : " azioni"));
    UI.commit();
  };
  A["spell-cast"] = (el) => {
    const { c, d } = ctx();
    const sp = d.cls.muscleSpells.find((x) => x.id === el.dataset.id);
    const n = +/^(\d)/.exec(sp.cost)[1], cap = d.dying ? d.dyingActions : 3;
    const req = Math.max(0, sp.req - d.fdReq);
    if (c.fury < req) return UI.toast("Servono almeno " + req + " Fury Dice.");
    if (Math.min(c.combat.actions, cap) < n) return UI.toast("Servono " + n + (n === 1 ? " azione" : " azioni") + ": non le hai.");
    c.combat.actions = Math.min(c.combat.actions, cap) - n;
    if (sp.once) c.used["ms-" + sp.id] = 1;
    UI.toast(sp.name + ": −" + n + (n === 1 ? " azione" : " azioni") + " (FD = " + c.fury + ")");
    UI.commit();
  };

  A["cdice-step"] = (el) => { const { c } = ctx(); c.combat.dice = Math.max(0, c.combat.dice + +el.dataset.d); UI.commit(); };
  A["mana-step"] = (el) => { const { c } = ctx(); c.mana = Math.max(0, c.mana + +el.dataset.d); UI.commit(); };
  A["use-pip"] = (el) => {
    const { c } = ctx();
    const k = el.dataset.key, max = +el.dataset.max;
    c.used[k] = NIM.clamp((c.used[k] || 0) + (el.dataset.on === "1" ? 1 : -1), 0, max);
    UI.commit();
  };
  A["use-step"] = (el) => { const { c, d } = ctx(); const u = d.uses.find((x) => x.key === el.dataset.key); c.used[u.key] = NIM.clamp((c.used[u.key] || 0) - +el.dataset.d, 0, u.max); UI.commit(); };
  A["cond-toggle"] = (el) => {
    const { c } = ctx();
    const id = el.dataset.id, i = c.combat.conds.indexOf(id);
    if (i >= 0) c.combat.conds.splice(i, 1); else c.combat.conds.push(id);
    UI.commit();
  };

  /* ---------- livelli ---------- */
  A["open-levelup"] = () => { const { c } = ctx(); UI.openModal("levelup", { f: { hp: NIM.levelUpInfo(c).avg, s0: "", s1: "", sub: "" } }); };
  A["levelup-confirm"] = () => {
    const { c } = ctx();
    const info = NIM.levelUpInfo(c);
    const f = S.modal.f;
    const stat = [];
    if (info.keyInc || info.secInc) {
      if (!f.s0) return UI.toast("Scegli la caratteristica da aumentare.");
      stat.push(f.s0);
    }
    if (info.twoInc) {
      if (!f.s0 || !f.s1) return UI.toast("Scegli le due caratteristiche da aumentare.");
      stat.push(f.s0, f.s1);
    }
    const hp = Math.round(num(f.hp, NaN));
    if (isNaN(hp) || hp < 0) return UI.toast("Inserisci i PF guadagnati (anche 0).");
    NIM.levelUp(c, { hp, stat, subclassId: info.pickSub ? f.sub : "" });
    const d = NIM.derive(c);
    S.modal = null;
    if (d.pending) S.tab = "classe";
    UI.toast("Livello " + c.level + "! +" + hp + " PF" + (d.pending ? " — hai nuove scelte da fare" : ""));
    UI.commit();
  };
  A["levelup-undo"] = () => {
    const { c } = ctx();
    UI.openModal("confirm", { text: `Annullare il livello ${c.level}? Verranno tolti i PF e l’aumento di caratteristica di quel livello.`, act: "levelup-undo-do", ok: "Annulla livello" });
  };
  A["levelup-undo-do"] = () => {
    const { c, d } = ctx();
    const lostHP = c.levels.length ? c.levels[c.levels.length - 1].hp : 0;
    NIM.undoLevel(c);
    const d2 = NIM.derive(c);
    c.hp = Math.min(Math.max(0, c.hp - lostHP), d2.maxHP);
    S.modal = null; UI.commit();
  };

  /* ---------- inventario ---------- */
  A["qty-step"] = (el) => {
    const { c } = ctx();
    const it = c.items[+el.dataset.idx];
    it.qty = (it.qty || 1) + +el.dataset.d;
    if (it.qty <= 0) { c.items.splice(+el.dataset.idx, 1); UI.toast("Oggetto rimosso."); }
    UI.commit();
  };
  A["potion"] = (el) => UI.openModal("potion", { idx: +el.dataset.idx, f: { amount: "" } });
  A["potion-apply"] = () => {
    const { c, d } = ctx();
    const amt = num(S.modal.f.amount, NaN);
    if (isNaN(amt) || amt < 0) return UI.toast("Inserisci quanti PF recuperi.");
    const idx = S.modal.idx;
    const got = NIM.heal(c, d, amt);
    c.items[idx].qty = (c.items[idx].qty || 1) - 1;
    if (c.items[idx].qty <= 0) c.items.splice(idx, 1);
    S.modal = null;
    UI.toast("Pozione usata: +" + got + " PF");
    UI.commit();
  };
  A["open-additem"] = () => UI.openModal("additem", { f: { qty: 1, pay: S.db.payDefault !== false, q: "", k: "" } });
  A["open-customitem"] = () => UI.openModal("customitem", { f: { kind: "misc", name: "", n: 1, die: 6, stat: "STR", dtype: "slashing", base: 0, dex: true, def: 1, text: "", slots: 1 } });
  A["additem-pick"] = (el) => {
    const { c } = ctx();
    const f = S.modal.f;
    const base = NIM.ITEM_BY_ID[el.dataset.id];
    const qty = Math.max(1, Math.round(+f.qty) || 1);
    let msg = qty > 1 ? qty + "× " + base.name : base.name;
    if (f.pay) {
      const unit = NIM.costSp(base.cost);
      if (unit == null) msg += " aggiunto: prezzo variabile (" + base.cost + "), scala le monete a mano";
      else {
        const tot = unit * qty;
        if (!NIM.payCoins(c, tot)) return UI.toast("Monete insufficienti: servono " + NIM.fmtCoins(tot) + ", hai " + NIM.fmtCoins(NIM.coinsSp(c)) + ".");
        msg += " aggiunto allo zaino" + (tot ? " (−" + NIM.fmtCoins(tot) + ")" : "");
      }
    } else msg += " aggiunto allo zaino";
    S.db.payDefault = !!f.pay;
    NIM.addCatalog(c, el.dataset.id, qty);
    UI.toast(msg);
    UI.commit();
  };
  UI.live.additem = function () {
    const f = S.modal && S.modal.f;
    if (!f) return;
    f.q = (document.getElementById("iq").value || "").toLowerCase().trim();
    f.k = document.getElementById("ik").value;
    document.querySelectorAll("#ilist .irow").forEach((el) => { el.hidden = !((!f.q || el.dataset.name.includes(f.q)) && (!f.k || el.dataset.kind === f.k)); });
  };
  A["slots-toggle"] = () => { const { c } = ctx(); c.noSlots = !c.noSlots; UI.commit(); };
  A["customitem-save"] = () => {
    const { c } = ctx();
    const f = S.modal.f;
    if (!String(f.name || "").trim()) return UI.toast("Dai un nome all’oggetto.");
    const o = { name: String(f.name).trim(), kind: f.kind, custom: true, slotsOverride: num(f.slots, 1), notes: f.text || "" };
    if (f.kind === "weapon") Object.assign(o, { n: num(f.n, 1), die: num(f.die, 6), stat: f.stat, dtype: f.dtype || "slashing", props: [], equipped: true });
    if (f.kind === "armor") Object.assign(o, { armor: "mail", base: num(f.base, 0), dex: !!f.dex, maxDex: null, req: 0, equipped: true });
    if (f.kind === "shield") Object.assign(o, { def: num(f.def, 1), req: 0, equipped: true });
    NIM.addItem(c, null, o);
    S.modal = null; UI.toast("Oggetto aggiunto"); UI.commit();
  };
  A["item-edit"] = (el) => {
    const { c } = ctx();
    const inst = c.items[+el.dataset.idx];
    const r = NIM.resolveItem(inst);
    UI.openModal("itemedit", { idx: +el.dataset.idx, f: { name: inst.name || "", n: r.n, die: r.die, dtype: r.dtype || "", qty: inst.qty || 1, slots: inst.slotsOverride != null ? inst.slotsOverride : "", stat: inst.stat || "", bonus: inst.bonus || 0, noProf: !!inst.noProf, notes: inst.notes || "" } });
  };
  A["item-save"] = () => {
    const { c } = ctx();
    const inst = c.items[S.modal.idx];
    const f = S.modal.f;
    if (f.name && f.name !== NIM.resolveItem(Object.assign({}, inst, { name: "" })).name) inst.name = f.name; else if (!f.name) delete inst.name;
    inst.qty = Math.max(1, num(f.qty, 1));
    if (f.slots === "" || f.slots == null) delete inst.slotsOverride; else inst.slotsOverride = num(f.slots, 1);
    if (f.stat) inst.stat = f.stat; else delete inst.stat;
    inst.bonus = num(f.bonus, 0);
    const baseW = NIM.ITEM_BY_ID[inst.ref];
    if (baseW && baseW.kind === "weapon" || inst.kind === "weapon") {
      const setOv = (k, v) => { if (baseW && baseW[k] === v) delete inst[k]; else inst[k] = v; };
      setOv("n", Math.max(1, Math.round(num(f.n, 1)))); setOv("die", Math.max(2, Math.round(num(f.die, 6))));
      if (String(f.dtype || "").trim()) setOv("dtype", String(f.dtype).trim());
    }
    inst.noProf = !!f.noProf;
    inst.notes = f.notes || "";
    S.modal = null; UI.commit();
  };
  A["item-delete"] = () => {
    const { c } = ctx();
    c.items.splice(S.modal.idx, 1);
    S.modal = null; UI.toast("Oggetto rimosso."); UI.commit();
  };

  /* ---------- personaggi ---------- */
  const isNative = () => !!(window.Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform());
  UI.isNative = isNative;
  function webDownload(name, text) {
    const b = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  // Nel browser/PWA scarica il file; nell'app Android (APK) scrive il file e apre il menu "Condividi/Salva".
  let nativeP = null;
  function nativePlugins() {
    if (nativeP) return nativeP;
    try { nativeP = { Filesystem: Capacitor.registerPlugin("Filesystem"), Share: Capacitor.registerPlugin("Share") }; } catch (e) { nativeP = {}; }
    return nativeP;
  }
  function download(name, text) {
    const P = isNative() ? nativePlugins() : null;
    if (P && P.Filesystem && P.Share) {
      P.Filesystem.writeFile({ path: name, data: text, directory: "CACHE", encoding: "utf8" })
        .then((r) => P.Share.share({ title: name, url: r.uri, dialogTitle: "Salva o invia il backup" }))
        .catch((e) => { if (e && /cancel/i.test(String(e.message || e))) return; UI.toast("Salvataggio del file non riuscito: usa “Copia backup”."); });
      return;
    }
    webDownload(name, text);
  }
  const savedMsg = (all) => (isNative() ? "Scegli dove salvare il file di backup" : all ? "Backup di tutti gli eroi salvato" : "File salvato: tienilo come backup");
  const fname = (c) => "eroe-" + (c.name || "senza-nome").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".json";
  A["char-open"] = (el) => { S.db.activeId = el.dataset.id; S.tab = "scheda"; S.edit = false; UI.save(); UI.render(); window.scrollTo(0, 0); };
  A["char-menu"] = (el) => UI.openModal("charmenu", { id: el.dataset.id });
  A["char-dup"] = () => {
    const src = S.db.chars[S.modal.id];
    const cp = JSON.parse(JSON.stringify(src));
    cp.id = NIM.uid(); cp.name += " (copia)"; cp.created = cp.updated = Date.now();
    S.db.chars[cp.id] = cp; S.modal = null; UI.toast("Eroe duplicato"); UI.save(); UI.render();
  };
  A["char-export"] = (el) => {
    const c = S.modal && S.modal.id ? S.db.chars[S.modal.id] : UI.C();
    if (!c) return;
    download(fname(c), JSON.stringify({ app: "taccuino-eroe", version: 1, chars: [c] }, null, 1));
    UI.toast(savedMsg(false));
  };
  A["export-all"] = () => {
    download("taccuino-eroe-backup.json", JSON.stringify({ app: "taccuino-eroe", version: 1, chars: Object.values(S.db.chars) }, null, 1));
    UI.toast(savedMsg(true));
  };
  A["copy-backup"] = () => {
    const txt = JSON.stringify({ app: "taccuino-eroe", version: 1, chars: Object.values(S.db.chars) });
    const done = () => UI.toast("Backup copiato: incollalo in una nota o in un messaggio a te stesso");
    const fallback = () => {
      const t = document.createElement("textarea");
      t.value = txt; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e) { /* ignore */ }
      t.remove(); ok ? done() : UI.toast("Copia non riuscita");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
  };
  A["paste-open"] = () => UI.openModal("paste", { f: { text: "" } });
  A["paste-apply"] = () => { const txt = (S.modal.f && S.modal.f.text) || ""; S.modal = null; importText(txt); };
  A["char-del"] = () => {
    const c = S.db.chars[S.modal.id];
    UI.openModal("confirm", { text: `Eliminare definitivamente “${c.name}”? Se non hai un backup, non si può recuperare.`, act: "char-del-do", ok: "Elimina", id: c.id });
  };
  A["char-del-do"] = () => {
    delete S.db.chars[S.modal.id];
    if (S.db.activeId === S.modal.id) S.db.activeId = Object.keys(S.db.chars)[0] || null;
    S.modal = null; if (!S.db.activeId) S.tab = "chars";
    UI.toast("Eroe eliminato"); UI.save(); UI.render();
  };
  A["import-open"] = () => document.getElementById("importfile").click();
  function importText(txt) {
    let n = 0;
    try {
      const data = JSON.parse(txt);
      const list = Array.isArray(data.chars) ? data.chars : data.stats && data.level ? [data] : [];
      list.forEach((ch) => {
        if (!ch || !ch.stats || !ch.classId || !NIM.CLASSES[ch.classId]) return;
        NIM.normalize(ch);
        if (S.db.chars[ch.id]) { ch.id = NIM.uid(); ch.name += " (importato)"; }
        S.db.chars[ch.id] = ch; S.db.activeId = ch.id; n++;
      });
    } catch (err) { n = 0; }
    UI.toast(n ? n + (n === 1 ? " eroe importato" : " eroi importati") : "File non valido");
    if (n) { S.tab = "scheda"; UI.save(); UI.render(); } else UI.render();
  }
  document.addEventListener("change", (e) => {
    if (e.target.id !== "importfile") return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    file.text().then(importText);
    e.target.value = "";
  });
  A["florian"] = () => {
    const c = NIM.makeFlorian(2);
    c.name = "Florian (esempio)";
    S.db.chars[c.id] = c; S.db.activeId = c.id; S.tab = "scheda"; S.edit = false;
    UI.save(); UI.render();
  };

  A["crush"] = () => {
    const c = NIM.makeCrush(2);
    c.name = "Crush (esempio)";
    S.db.chars[c.id] = c; S.db.activeId = c.id; S.tab = "scheda"; S.edit = false;
    UI.save(); UI.render();
  };

  /* ---------- creazione eroe ---------- */
  function defaultAssign(arrId, cls) {
    const arr = NIM.STAT_ARRAYS.find((a) => a.id === arrId).values.slice().sort((a, b) => b - a);
    const order = cls.keyStats.concat(NIM.STATS.filter((s) => !cls.keyStats.includes(s)));
    const out = {};
    order.forEach((s, i) => (out[s] = arr[i]));
    return out;
  }
  A["open-create"] = () => {
    const cls = NIM.CLASSES.commander;
    UI.openModal("create", { f: { cls: cls.id, name: "", anc: "human", ancChoice: "", bg: "", bgOption: 0, bgText: "", arr: "standard", assign: defaultAssign("standard", cls), gear: "1", lvl: 1, lv: {}, sub: "", maxHP: "" } });
  };
  A["create-submit"] = () => {
    const f = S.modal.f;
    const cls = NIM.CLASSES[f.cls] || NIM.CLASSES.commander;
    const arr = NIM.STAT_ARRAYS.find((a) => a.id === f.arr).values.slice().sort((a, b) => a - b).join();
    const got = NIM.STATS.map((s) => +f.assign[s]).sort((a, b) => a - b).join();
    if (arr !== got) return UI.toast("I valori assegnati devono essere esattamente quelli dell’array scelto.");
    const c = NIM.newChar({ name: (f.name || "").trim() || "Nuovo eroe", ancestryId: f.anc, bgId: f.bg, classId: cls.id, stats: Object.fromEntries(NIM.STATS.map((s) => [s, +f.assign[s]])), gear: f.gear === "1" });
    c.ancChoice = f.ancChoice || ""; c.bgOption = +f.bgOption || 0; c.bgText = f.bgText || "";
    const lvl = Math.max(1, Math.min(20, Math.round(+f.lvl || 1)));
    if (lvl > 1) NIM.startAtLevel(c, lvl, { picks: f.lv, sub: f.sub, maxHP: num(f.maxHP, 0) });
    else if (num(f.maxHP, 0) > 0) NIM.startAtLevel(c, 1, { maxHP: num(f.maxHP, 0) });
    const pend = NIM.derive(c).pending;
    S.db.chars[c.id] = c; S.db.activeId = c.id; S.tab = pend ? "classe" : "scheda"; S.edit = false; S.modal = null;
    UI.toast(lvl > 1 ? `Eroe di livello ${lvl} creato: assegna i ${lvl + 3} punti abilità nella scheda` + (pend ? " e fai le scelte di classe" : "") : "Eroe creato: assegna i 4 punti abilità nella scheda");
    UI.save(); UI.render(); window.scrollTo(0, 0);
  };
  A["create-array"] = () => { /* gestito da change con rerender */ };
  A.lang = (el) => {
    const lang = el.dataset.lang === "en" ? "en" : "it";
    S.db.lang = lang; NIM.i18n.set(lang);
    UI.saveNow(); UI.render();
  };
  A["welcome-ok"] = () => { S.db.welcomed = true; S.modal = null; UI.save(); UI.render(); };
  A["confirm-ok"] = () => { const m = S.modal; UI.A[m.act]({ dataset: Object.assign({}, m) }); };

  /* ---------- finestre modali ---------- */
  const head = (t) => `<div class="mhead"><h2>${t}</h2><button class="icon" data-act="modal-close" aria-label="Chiudi">✕</button></div>`;
  const mf = (k, f) => (f && f[k] != null ? f[k] : "");
  const optSel = (key, opts, cur, extra) => `<select data-mf="${key}" ${extra || ""}>${opts.map((o) => `<option value="${esc(o.v)}" ${String(o.v) === String(cur) ? "selected" : ""}>${esc(o.t)}</option>`).join("")}</select>`;

  M.welcome = () => `${head("Benvenuto!")}<div class="mbody"><div class="btnrow" style="margin-bottom:10px"><button class="btn ${NIM.i18n.lang === "it" ? "primary" : ""}" data-act="lang" data-lang="it">Italiano</button><button class="btn ${NIM.i18n.lang === "en" ? "primary" : ""}" data-act="lang" data-lang="en">English</button></div>
    <p><b>Taccuino dell’Eroe</b> è una scheda personaggio per Nimble: calcola da sola Defense, Initiative, salvezze, abilità e slot (classi: Commander e Berserker) e ti aiuta a tenere traccia di PF, Ferite, azioni, Combat Dice e abilità a uso limitato. I dadi li tiri tu, quelli veri.</p>
    <p>I dati restano <b>solo su questo dispositivo</b>. Esporta ogni tanto un backup dalla tab <i>Altro</i>.</p>
    <p class="small"><b>${esc(UI.LICENSE_TXT)}</b></p>
    <p class="small muted">App gratuita e non ufficiale: non usa l’arte o il logo di Nimble. Se ti piace il gioco, sostienilo acquistando i contenuti ufficiali su nimbleRPG.com.</p>
    <div class="btnrow"><button class="btn primary" data-act="welcome-ok">Ho capito</button></div></div>`;

  M.confirm = (c, d, m) => `${head("Conferma")}<div class="mbody"><p>${esc(m.text)}</p><div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn danger" data-act="confirm-ok">${esc(m.ok || "Conferma")}</button></div></div>`;

  M.defense = (c, d) => `${head("Defense " + d.defense)}<div class="mbody">${d.defenseParts.map(([n, v]) => `<div class="row between"><span>${esc(n)}</span><b>${v >= 0 ? "" : "−"}${Math.abs(v)}</b></div>`).join("")}
    <hr><div class="row between"><b>Totale</b><b>${d.defense}</b></div>
    <p class="muted small">Defend (reazione, 1 azione, 1/round): riduce di ${d.defense} il danno di un singolo attacco. I critici ignorano la Defense. Senza armatura: Defense = DEX. Mail: la DEX conta al massimo +2.</p></div>`;

  M.dmg = (c, d, m) => {
    const f = m.f;
    return `${head("Subisci danno")}<div class="mbody">
      <label class="form">Danno subito<input type="number" inputmode="numeric" min="0" id="dmgamt" data-mf="amount" data-preview="dmg" value="${esc(mf("amount", f))}" placeholder="0" autofocus></label>
      <label class="check"><input type="checkbox" data-mf="defend" ${f.defend ? "checked" : ""} data-live="dmg"> Uso <b>Defend</b> (−${d.defense}; costa 1 azione di reazione)</label>
      <label class="check"><input type="checkbox" data-mf="crit" ${f.crit ? "checked" : ""} data-live="dmg"> L’attacco è un <b>critico</b> (ignora Defense; se Dying: 3 Ferite)</label>
      <label class="check"><input type="checkbox" data-mf="ignore" ${f.ignore ? "checked" : ""} data-live="dmg"> Il danno ignora la Defense (es. psichico, alcune aree)</label>
      ${d.cls.id === "berserker" && c.fury > 0 ? `<label class="form">Fury Dice spesi per <b>That all you got?!</b> (−${d.stats.STR + d.stats.DEX} per dado, max ${c.fury})<input type="number" inputmode="numeric" min="0" max="${c.fury}" data-mf="fury" data-preview="dmg" value="${esc(mf("fury", f))}" placeholder="0"></label>
      ${d.subId === "mountainheart" ? `<label class="form">Somma dei valori dei dadi spesi (Stone’s Resilience)<input type="number" inputmode="numeric" min="0" data-mf="furySum" data-preview="dmg" value="${esc(mf("furySum", f))}" placeholder="0"></label>` : ""}` : ""}
      <div class="preview" id="dmgprev"></div>
      <div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn danger" data-act="dmg-apply">Applica</button></div></div>`;
  };
  UI.live.dmg = UI.live.dmgprev = function () {
    const { c, d } = ctx();
    if (!S.modal || S.modal.type !== "dmg") return;
    const f = S.modal.f;
    const amtEl = document.getElementById("dmgamt");
    const raw = num(amtEl ? amtEl.value : f.amount, 0);
    const el = document.getElementById("dmgprev");
    if (!el) return;
    const probe = JSON.parse(JSON.stringify(c));
    const res = NIM.applyDamage(probe, d, raw, { defend: document.querySelector('[data-mf="defend"]').checked, crit: document.querySelector('[data-mf="crit"]').checked, ignoreDef: document.querySelector('[data-mf="ignore"]').checked, furySpend: num(f.fury, 0), furySum: num(f.furySum, 0) });
    el.innerHTML = raw > 0 ? `<b>Risultato:</b> ${esc(res.notes.join(" · "))}<br>PF ${c.hp} → <b>${probe.hp}</b> · Ferite ${c.wounds} → <b>${probe.wounds}</b>${d.cls.id === "berserker" ? ` · Fury Dice ${c.fury} → <b>${probe.fury}</b>` : ""}` : '<span class="muted">Inserisci un valore per vedere l’effetto.</span>';
    NIM.i18n.apply(el);
  };
  // le checkbox del modale aggiornano sia lo stato sia l'anteprima
  document.addEventListener("change", (e) => { if (e.target.dataset && e.target.dataset.live === "dmg") UI.live.dmg(); });

  M.enc = (c, d, m) => {
    const f = m.f;
    const adv = d.initAdv;
    return `${head("Inizia scontro")}<div class="mbody">
      <p class="muted">Tira tu l’Initiative (tuo bonus ${fmt(d.initiative)}${adv ? ", con vantaggio" : ""}) e scrivi il risultato per impostare le azioni. Se lasci vuoto parti con 3 azioni.</p>
      <label class="form">Risultato di Initiative (facoltativo)<input type="number" inputmode="numeric" data-mf="init" value="${esc(mf("init", f))}" placeholder="es. 14"></label>
      <label class="check"><input type="checkbox" data-mf="nat" ${f.nat ? "checked" : ""}> Ho fatto 20 naturale (3 azioni)</label>
      <p class="muted small">Initiative 9 o meno: 1 azione · 10–19: 2 azioni · 20 o più: 3 azioni.${d.maxDice ? " Ricevi " + d.maxDice + " Combat Dice" : ""}${d.maxMana ? " e " + d.maxMana + " mana" : ""}.</p>
      <div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn primary" data-act="enc-start">Inizia</button></div></div>`;
  };

  M.rageend = () => `${head("Fine turno")}<div class="mbody">
    <p>Sei in Rage ma in questo turno non hai usato Rage. Hai attaccato in questo round?</p>
    <p class="muted small">La Rage finisce se per 1 round non attacchi né usi Rage.</p>
    <div class="btnrow wrap"><button class="btn primary" data-act="end-turn-yes">Sì, ho attaccato</button><button class="btn danger" data-act="end-turn-no">No: la Rage finisce</button></div>
    <div class="btnrow"><button class="btn ghost" data-act="modal-close">Annulla</button></div></div>`;

  M.potion = (c, d, m) => {
    const it = d.inv[m.idx];
    const h = it.heal;
    const medic = c.level >= 2 && c.classId === "commander";
    return `${head(esc(it.name))}<div class="mbody">
      <p class="muted">PF ${c.hp}/${d.maxHP}</p>
      <p>Tira <b>${h.n + (medic ? 1 : 0)}d${h.die}${h.bonus ? fmt(h.bonus) : ""}</b>${medic ? " (include il dado extra di Field Medic)" : ""} e scrivi il totale.</p>
      <label class="form">PF recuperati<input type="number" inputmode="numeric" min="0" data-mf="amount" value="${esc(mf("amount", m.f))}" placeholder="0" autofocus></label>
      <div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn good" data-act="potion-apply">Usa pozione</button></div></div>`;
  };

  M.maxhp = (c, d, m) => `${head("PF massimi")}<div class="mbody">
    <p class="muted">Calcolati dal livello: <b>${d.maxHP - (c.manual.hp || 0)}</b>${c.manual.hp ? " · correzione manuale " + fmt(c.manual.hp) : ""}.</p>
    <label class="form">PF massimi<input type="number" inputmode="numeric" min="1" data-mf="value" value="${esc(mf("value", m.f))}" autofocus></label>
    <p class="muted small">Scrivi il valore giusto: l’app salva la differenza come correzione manuale e la mantiene ai prossimi livelli.</p>
    <div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn primary" data-act="maxhp-apply">Salva</button></div></div>`;

  M.heal = (c, d, m) => `${head("Cura / PF temporanei")}<div class="mbody">
    <p class="muted">PF ${c.hp}/${d.maxHP}${c.tmp ? " · temp " + c.tmp : ""}</p>
    <label class="form">Quantità<input type="number" inputmode="numeric" min="0" data-mf="amount" value="${esc(mf("amount", m.f))}" placeholder="0" autofocus></label>
    <div class="btnrow wrap"><button class="btn good" data-act="heal-apply">Cura PF</button><button class="btn" data-act="tmp-apply">Imposta PF temp</button></div>
    <p class="muted small">I PF temporanei non si sommano: se ne hai già, tieni il valore più alto. Scadono dopo un Safe Rest.</p></div>`;

  M.rest = (c, d, m) => {
    const f = m.f;
    const kit = c.items.some((i) => NIM.resolveItem(i).woundKit);
    const wild = d.bg && d.bg.id === "wild-one";
    const medicOK = c.level >= 2 && c.classId === "commander";
    return `${head("Riposo")}<div class="mbody">
      <p class="muted">PF ${c.hp}/${d.maxHP} · Dadi Vita ${c.hd}/${d.maxHD} (d${d.hdSize}) · Ferite ${c.wounds}/${d.maxWounds}</p>
      <h3>Field Rest</h3>
      <label class="form">Dadi Vita da spendere<input type="number" inputmode="numeric" min="0" max="${c.hd}" data-mf="count" value="${esc(mf("count", f))}"></label>
      ${medicOK ? `<label class="check"><input type="checkbox" data-mf="medic" ${f.medic ? "checked" : ""}> <b>Field Medic</b>: ho esaminato le ferite per 10 minuti (+${d.skills.find((s) => s.id === "examination").total} Examination ai PF recuperati)</label>` : ""}
      ${wild ? `<label class="check"><input type="checkbox" data-mf="wild" ${f.wild ? "checked" : ""}> <b>Wild One</b>: riposo in natura (+KEY PF per Dado Vita)</label>` : ""}
      ${d.subId === "mountainheart" ? `<label class="form">Mountainous Tenacity: Ferite da curare al posto dei PF (1 ogni 10 PF)<input type="number" inputmode="numeric" min="0" data-mf="wi" value="${esc(mf("wi", f))}" placeholder="0"></label>` : ""}
      ${d.anc && d.anc.id === "oozeling" ? "" : `<label class="form">Catch Breath: risultati dei dadi tirati<input data-mf="results" value="${esc(mf("results", f))}" placeholder="es. 4 + 6 (un valore per dado)" autocomplete="off"></label>`}
      <div class="btnrow wrap"><button class="btn" data-act="rest-catch">Catch Breath (10 min)</button><button class="btn" data-act="rest-camp">Make Camp (8 ore, valore massimo)</button></div>
      <p class="muted small">Ogni Dado Vita recupera il suo risultato + STR (${fmt(d.stats.STR)}). Per Catch Breath tira tu i dadi e scrivi i risultati; Make Camp usa il valore massimo senza tirare.${d.stats.STR < 0 ? " Con STR negativa ogni dado cura meno." : ""}${d.anc && d.anc.id === "oozeling" ? " Oozeling: curi sempre il massimo." : ""}</p>
      ${kit ? '<div class="btnrow"><button class="btn ghost" data-act="rest-kit">Usa un Medical Kit (−1 Ferita)</button></div>' : ""}
      <hr><h3>Safe Rest</h3>
      <p class="muted small">In un luogo sicuro (es. una locanda): recuperi tutti i PF, i Dadi Vita, il mana e le risorse di classe, e guarisci 1 Ferita.</p>
      <div class="btnrow"><button class="btn primary" data-act="rest-safe">Esegui Safe Rest</button></div></div>`;
  };

  M.levelup = (c, d, m) => {
    const info = NIM.levelUpInfo(c);
    const f = m.f;
    const cls = d.cls;
    let h = `${head("Livello " + c.level + " → " + info.level)}<div class="mbody">`;
    h += `<h3>Punti ferita guadagnati</h3>
      <label class="form"><input type="number" inputmode="numeric" min="0" data-mf="hp" value="${esc(mf("hp", f))}"></label>
      <p class="muted small">Di default la media del d${cls.hitDie}: <b>+${info.avg}</b>. Se preferisci tirare, tira il d${cls.hitDie} con vantaggio e scrivi qui il risultato. Puoi scrivere qualsiasi valore: i PF massimi si possono sempre correggere dalla Scheda (tocca “PF max”).</p>
      <p class="muted small">Il nuovo livello dà anche +1 Dado Vita massimo e 1 punto abilità (puoi anche spostarne uno).</p>`;
    if (info.keyInc || info.secInc) {
      const opts = info.keyInc ? cls.keyStats : NIM.STATS.filter((s) => !cls.keyStats.includes(s));
      h += `<h3>${info.keyInc ? "Key Stat Increase" : "Secondary Stat Increase"}</h3><div class="optrow">${opts.map((s) => `<label class="radio"><input type="radio" name="st" data-mf="s0" value="${s}" ${f.s0 === s ? "checked" : ""}> +1 ${s} <span class="muted">(ora ${fmt(d.stats[s])})</span></label>`).join("")}</div>`;
    }
    if (info.twoInc) {
      const so = [{ v: "", t: "— scegli —" }].concat(NIM.STATS.map((s) => ({ v: s, t: s + " (ora " + fmt(d.stats[s]) + ")" })));
      h += `<h3>Livello 20: +1 a due caratteristiche</h3><div class="form">${optSel("s0", so, f.s0)}${optSel("s1", so, f.s1)}</div>`;
    }
    if (info.pickSub) {
      const so = [{ v: "", t: "— decido dopo —" }].concat(cls.subclasses.map((s) => ({ v: s.id, t: s.name })));
      h += `<h3>Sottoclasse</h3><div class="form">${optSel("sub", so, f.sub, "data-rerender")}</div>${f.sub ? `<p class="muted small">${esc(cls.subclasses.find((s) => s.id === f.sub).tagline)}</p>` : ""}`;
    }
    if (info.boon) h += `<h3>Epic Boon</h3><p class="muted small">Scegli un Epic Boon dalla GM’s Guide (pag. 75) e annotalo nella tab Altro.</p>`;
    h += `<h3>Nuove capacità</h3>` + info.features.map((x) => `<p><b>${esc(x.name)}.</b> ${esc(x.text)}</p>`).join("");
    const sf = info.subFeatures;
    if (sf.length) h += sf.map(([n, t]) => `<p><b>${esc(n)}</b> <span class="chip tiny">sottoclasse</span> ${esc(t)}</p>`).join("");
    h += `<div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn primary" data-act="levelup-confirm">Conferma livello ${info.level}</button></div></div>`;
    return h;
  };

  M.additem = (c, d, m) => {
    const f = m.f;
    const kinds = [["", "Tutto"], ["weapon", "Armi"], ["armor", "Armature"], ["shield", "Scudi"], ["misc", "Altro"]];
    const rows = NIM.ITEMS.map((i) => {
      const det = i.kind === "weapon" ? `${i.n}d${i.die}+${i.stat} ${i.dtype} · ${i.props.join(", ") || "—"}` : i.kind === "armor" ? `Defense ${i.base}${i.dex ? "+DEX" : ""}${i.maxDex ? " (max " + i.maxDex + ")" : ""}${i.req ? " · Req. STR " + i.req : ""}` : i.kind === "shield" ? `Defense +${i.def}${i.req ? " · Req. STR " + i.req : ""}` : i.text;
      const nm = i.name.toLowerCase();
      const hid = !((!f.q || nm.includes(f.q)) && (!f.k || i.kind === f.k));
      return `<div class="irow" data-name="${esc(nm)}" data-kind="${i.kind}" ${hid ? "hidden" : ""}><div class="itxt"><b>${esc(i.name)}</b><small>${esc(det)} · ${esc(i.cost)}</small></div><button class="btn small" data-act="additem-pick" data-id="${i.id}">Aggiungi</button></div>`;
    }).join("");
    return `${head("Aggiungi dal catalogo")}<div class="mbody">
      <div class="addbar"><label>Quantità<input type="number" inputmode="numeric" min="1" data-mf="qty" value="${esc(f.qty)}"></label><p class="coins">Monete: <b>${esc(NIM.fmtCoins(NIM.coinsSp(c)))}</b></p>
      <label class="check"><input type="checkbox" data-mf="pay" ${f.pay ? "checked" : ""}> Scala il costo dalle monete</label></div>
      <div class="gfilters"><input id="iq" placeholder="Cerca…" value="${esc(f.q)}" data-live="additem"><select id="ik" data-live="additem">${kinds.map(([v, t]) => `<option value="${v}" ${v === f.k ? "selected" : ""}>${t}</option>`).join("")}</select></div><div id="ilist">${rows}</div></div>`;
  };
  document.addEventListener("change", (e) => { if (e.target.dataset && e.target.dataset.live === "additem") UI.live.additem(); });

  M.customitem = (c, d, m) => {
    const f = m.f;
    let extra = "";
    if (f.kind === "weapon") extra = `<div class="form row2"><label>Dadi<input type="number" min="1" data-mf="n" value="${esc(f.n)}"></label><label>Facce<input type="number" min="2" data-mf="die" value="${esc(f.die)}"></label></div>
      <div class="form row2"><label>Stat danni${optSel("stat", [{ v: "STR", t: "STR" }, { v: "DEX", t: "DEX" }], f.stat)}</label><label>Tipo<input data-mf="dtype" value="${esc(f.dtype)}"></label></div>`;
    if (f.kind === "armor") extra = `<div class="form row2"><label>Defense base<input type="number" data-mf="base" value="${esc(f.base)}"></label><label class="check"><input type="checkbox" data-mf="dex" ${f.dex ? "checked" : ""}> + DEX</label></div>`;
    if (f.kind === "shield") extra = `<div class="form"><label>Defense<input type="number" data-mf="def" value="${esc(f.def)}"></label></div>`;
    return `${head("Oggetto personalizzato")}<div class="mbody"><div class="form">
      <label>Nome<input data-mf="name" value="${esc(f.name)}" placeholder="es. Spada +1"></label>
      <label>Tipo${optSel("kind", [{ v: "misc", t: "Equipaggiamento / altro" }, { v: "weapon", t: "Arma" }, { v: "armor", t: "Armatura" }, { v: "shield", t: "Scudo" }], f.kind, "data-rerender")}</label></div>
      ${extra}<div class="form">${d.slotsOn ? `<label>Slot occupati<input type="number" step="0.5" min="0" data-mf="slots" value="${esc(f.slots)}"></label>` : ""}<label>Note / effetto<input data-mf="text" value="${esc(f.text)}"></label></div>
      <div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn primary" data-act="customitem-save">Aggiungi</button></div></div>`;
  };

  M.itemedit = (c, d, m) => {
    const it = d.inv[m.idx];
    const f = m.f;
    const isW = it.kind === "weapon";
    return `${head(esc(it.name))}<div class="mbody"><div class="form">
      <label>Nome<input data-mf="name" value="${esc(f.name || it.name)}"></label>
      <div class="form row2"><label>Quantità<input type="number" min="1" data-mf="qty" value="${esc(f.qty)}"></label>${d.slotsOn ? `<label>Slot (vuoto = predefinito)<input type="number" step="0.5" min="0" data-mf="slots" value="${esc(f.slots)}"></label>` : ""}</div>
      ${isW ? `<div class="form row3"><label>Dadi<input type="number" min="1" data-mf="n" value="${esc(f.n)}"></label><label>Facce<input type="number" min="2" data-mf="die" value="${esc(f.die)}"></label><label>Tipo di danno<input data-mf="dtype" value="${esc(f.dtype)}"></label></div>
      <div class="form row2"><label>Stat dei danni${optSel("stat", [{ v: "", t: "Predefinita (" + (NIM.ITEM_BY_ID[it.ref] ? NIM.ITEM_BY_ID[it.ref].stat : it.stat) + ")" }, { v: "STR", t: "STR" }, { v: "DEX", t: "DEX" }], f.stat)}</label><label>Bonus ai danni<input type="number" data-mf="bonus" value="${esc(f.bonus)}"></label></div>
      <label class="check"><input type="checkbox" data-mf="noProf" ${f.noProf ? "checked" : ""}> Senza competenza (non può critare)</label>` : ""}
      <label>Note<input data-mf="notes" value="${esc(f.notes)}"></label></div>
      ${isW && NIM.ITEM_BY_ID[it.ref] && NIM.ITEM_BY_ID[it.ref].stat === "DEX" && false ? "" : ""}
      <div class="btnrow wrap"><button class="btn danger" data-act="item-delete">Elimina</button><button class="btn" data-act="modal-close">Annulla</button><button class="btn primary" data-act="item-save">Salva</button></div></div>`;
  };

  M.charmenu = (c, d, m) => {
    const ch = S.db.chars[m.id];
    return `${head(esc(ch.name))}<div class="mbody"><div class="btnrow wrap"><button class="btn" data-act="char-dup">Duplica</button><button class="btn" data-act="char-export">Esporta file</button><button class="btn danger" data-act="char-del">Elimina</button></div></div>`;
  };

  // Scelte dei livelli 2..N nella creazione (aumenti di caratteristica e sottoclasse)
  function levelSection(f, cls, lvl) {
    const stats = Object.fromEntries(NIM.STATS.map((s) => [s, +f.assign[s]]));
    const plan = NIM.resolvePicks(cls.id, stats, lvl, f.lv);
    const avg = NIM.HD_AVG[cls.hitDie];
    const cur = Object.assign({}, stats);
    let h = `<div class="lvsec"><h3>Livelli 2–${lvl}</h3><p class="muted small">Ogni livello dà i PF medi del d${cls.hitDie} (<b>+${avg}</b>), +1 Dado Vita e 1 punto abilità. Qui sotto scegli gli aumenti di caratteristica; le scelte di classe (tattiche, ordini, abilità…) le fai dopo nella tab Classe.</p>`;
    if (lvl >= 3) {
      const so = [{ v: "", t: "— decido dopo —" }].concat(cls.subclasses.map((x) => ({ v: x.id, t: x.name })));
      h += `<label>Sottoclasse (livello 3)${optSel("sub", so, f.sub)}</label>`;
    }
    plan.forEach((p) => {
      if (!p.stat.length) return;
      const opts = p.twoInc ? NIM.STATS : p.keyInc ? cls.keyStats : NIM.STATS.filter((x) => !cls.keyStats.includes(x));
      const lab = p.twoInc ? "Livello 20: +1 a due caratteristiche" : (p.keyInc ? "Livello " + p.level + ": Key Stat Increase" : "Livello " + p.level + ": Secondary Stat Increase");
      const mk = (k, val) => `<select data-mf="lv_${p.level}_${k}">${opts.map((s) => `<option value="${s}" ${s === val ? "selected" : ""}>+1 ${s} (ora ${fmt(cur[s])})</option>`).join("")}</select>`;
      h += `<label>${lab}<span class="form ${p.twoInc ? "row2" : ""}">${mk("s0", p.stat[0])}${p.twoInc ? mk("s1", p.stat[1]) : ""}</span></label>`;
      p.stat.forEach((s) => cur[s]++);
    });
    return h + "</div>";
  }

  M.paste = (c, d, m) => `${head("Incolla backup")}<div class="mbody"><p class="muted small">Incolla qui il testo copiato con “Copia backup”.</p><label class="form"><textarea rows="8" data-mf="text" placeholder="{ … }">${esc(mf("text", m.f))}</textarea></label><div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn primary" data-act="paste-apply">Importa</button></div></div>`;

  M.create = (c, d, m) => {
    const f = m.f;
    const cls = NIM.CLASSES[f.cls] || NIM.CLASSES.commander;
    const lvl = Math.max(1, Math.min(20, Math.round(+f.lvl || 1)));
    const anc = NIM.ANCESTRIES.find((a) => a.id === f.anc);
    const bg = NIM.BACKGROUNDS.find((b) => b.id === f.bg);
    const arr = NIM.STAT_ARRAYS.find((a) => a.id === f.arr);
    const vals = Array.from(new Set(arr.values)).sort((a, b) => b - a);
    const ancGroups = ["Common", "Uncommon", "Exotic"].map((t) => `<optgroup label="${t}">${NIM.ANCESTRIES.filter((a) => a.tier === t).map((a) => `<option value="${a.id}" ${a.id === f.anc ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</optgroup>`).join("");
    let ch = "";
    if (anc && anc.choice) {
      const t = anc.choice.type;
      const o = t === "skill" ? [{ v: "", t: "— scegli —" }].concat(NIM.SKILLS.map((s) => ({ v: s.id, t: s.name }))) : t === "save" ? [{ v: "", t: "— scegli —" }].concat(NIM.STATS.filter((s) => cls.saves[s] === "neu").map((s) => ({ v: s, t: s }))) : [{ v: "", t: "— scegli —" }, { v: "Small", t: "Small" }, { v: "Medium", t: "Medium" }];
      ch = `<label>${esc(anc.choice.label)}${optSel("ancChoice", o, f.ancChoice)}</label>`;
    }
    const bgo = bg && bg.options ? `<label>Opzione${optSel("bgOption", bg.options.map((o, i) => ({ v: i, t: o.name })), f.bgOption)}</label>` : bg && bg.textOption ? `<label>${esc(bg.textOption)}<input data-mf="bgText" value="${esc(f.bgText)}"></label>` : "";
    const statSel = NIM.STATS.map((s) => `<label>${s}${cls.keyStats.includes(s) ? " ★" : ""}<select data-mf="a_${s}">${vals.map((v) => `<option value="${v}" ${+f.assign[s] === v ? "selected" : ""}>${fmt(v)}</option>`).join("")}</select></label>`).join("");
    return `${head("Nuovo eroe")}<div class="mbody"><div class="form">
      <label>Nome<input data-mf="name" value="${esc(f.name)}" placeholder="Come si chiama il tuo eroe?"></label>
      <label>Classe${optSel("cls", Object.values(NIM.CLASSES).map((k) => ({ v: k.id, t: k.name })), f.cls, "data-rerender")}</label>
      <p class="muted small">${esc(cls.blurb)}</p>
      <label>Ancestry<select data-mf="anc" data-rerender>${ancGroups}</select></label>${ch}
      ${anc ? `<p class="small"><b>${esc(anc.trait)}.</b> ${esc(anc.text)}</p>` : ""}
      <label>Background${optSel("bg", [{ v: "", t: "— nessuno —" }].concat(NIM.BACKGROUNDS.map((b) => ({ v: b.id, t: b.name }))), f.bg, "data-rerender")}</label>${bgo}
      ${bg ? `<p class="small">${esc(bg.text)}</p>` : ""}
      <label>Array di caratteristiche${optSel("arr", NIM.STAT_ARRAYS.map((a) => ({ v: a.id, t: a.name + " (" + a.values.map(fmt).join(", ") + ")" })), f.arr, "data-rerender")}</label>
      <div class="form row4">${statSel}</div>
      <p class="muted small">Metti i valori più alti nelle KEY stats della classe (★). Ogni valore dell’array va usato una volta.</p>
      <label>Equipaggiamento${optSel("gear", [{ v: "1", t: "Equipaggiamento iniziale: " + cls.name }, { v: "0", t: "50 gp da spendere" }], f.gear)}</label>
      <label>Livello di partenza${optSel("lvl", Array.from({ length: 20 }, (_, i) => ({ v: i + 1, t: i === 0 ? "1 (nuovo eroe)" : String(i + 1) })), lvl, "data-rerender")}</label>
      ${lvl > 1 ? levelSection(f, cls, lvl) : ""}
      <label>PF massimi <span class="muted small">(facoltativo)</span><input type="number" inputmode="numeric" min="1" data-mf="maxHP" value="${esc(f.maxHP)}" placeholder="${lvl > 1 ? "vuoto = media del dado vita" : "vuoto = " + cls.startHP}"></label>
      </div><div class="btnrow"><button class="btn" data-act="modal-close">Annulla</button><button class="btn primary" data-act="create-submit">Crea eroe</button></div></div>`;
  };

  // gestione cambi nel modulo di creazione (array → riassegna; select stat a_X → assign)
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!S.modal || S.modal.type !== "create" || !el.dataset || el.dataset.mf === undefined) return;
    const f = S.modal.f;
    if (el.dataset.mf.startsWith("a_")) {
      f.assign[el.dataset.mf.slice(2)] = +el.value;
      delete f["a_" + el.dataset.mf.slice(2)];
      f.lv = {};
      if (+f.lvl > 1) UI.renderModal(UI.C());
    } else if (el.dataset.mf.startsWith("lv_")) {
      // congela le scelte mostrate, poi applica la modifica dell'utente
      const cls = NIM.CLASSES[f.cls] || NIM.CLASSES.commander;
      const stats = Object.fromEntries(NIM.STATS.map((s) => [s, +f.assign[s]]));
      const fixed = {};
      NIM.resolvePicks(cls.id, stats, +f.lvl, f.lv).forEach((p) => { if (p.stat.length) fixed[p.level] = { s0: p.stat[0], s1: p.stat[1] }; });
      const [, L, k] = el.dataset.mf.split("_");
      fixed[L] = Object.assign(fixed[L] || {}, { [k]: el.value });
      delete f[el.dataset.mf];
      f.lv = fixed;
      UI.renderModal(UI.C());
    } else if (el.dataset.mf === "arr") {
      f.assign = defaultAssign(f.arr, NIM.CLASSES[f.cls] || NIM.CLASSES.commander); f.lv = {};
      UI.renderModal(UI.C());
    } else if (el.dataset.mf === "cls") {
      f.assign = defaultAssign(f.arr, NIM.CLASSES[f.cls]); f.ancChoice = ""; f.lv = {}; f.sub = "";
      UI.renderModal(UI.C());
    } else if (el.dataset.mf === "anc") { f.ancChoice = ""; UI.renderModal(UI.C()); }
    else if (el.dataset.mf === "bg") { f.bgOption = 0; f.bgText = ""; UI.renderModal(UI.C()); }
  });
})();
