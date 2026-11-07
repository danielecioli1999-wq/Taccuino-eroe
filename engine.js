/* Motore di gioco: calcoli derivati, danni, riposi, livelli (nessun tiro di dadi: si usano dadi reali).
   Nessuna dipendenza dal DOM, quindi testabile da Node. */
(function () {
  const NIM = (globalThis.NIM = globalThis.NIM || {});

  /* ---------- utilità ---------- */
  NIM.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  NIM.fmt = (n) => (n < 0 ? "−" : "+") + Math.abs(n);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  NIM.clamp = clamp;
  const byId = (arr, id) => arr.find((x) => x.id === id) || null;

  /* ---------- creazione ---------- */
  NIM.newChar = function (o) {
    o = o || {};
    const cls = NIM.CLASSES[o.classId || "commander"];
    const c = {
      v: 1, id: NIM.uid(), name: o.name || "Nuovo eroe",
      ancestryId: o.ancestryId || "human", ancChoice: "", bgId: o.bgId || "", bgOption: 0, bgText: "",
      motivation: o.motivation || "", classId: cls.id, subclassId: "", level: 1,
      stats: Object.assign({ STR: 0, DEX: 0, INT: 0, WIL: 0 }, o.stats || {}),
      statMod: { STR: 0, DEX: 0, INT: 0, WIL: 0 },
      levels: [], skillPts: {}, hp: cls.startHP, tmp: 0, wounds: 0, hd: 1, mana: 0, fury: 0, shadows: 0, bonescythe: false,
      combat: { active: false, round: 1, actions: 3, attacks: 0, react: {}, dice: 0, conds: [], raging: false, rageTurn: false },
      used: {}, pins: [], choices: {}, items: [], gp: 0, sp: 0, languages: "", notes: "", boon: "",
      manual: { hp: 0, defense: 0, init: 0, speed: 0, hd: 0, wounds: 0 },
      created: Date.now(), updated: Date.now(),
    };
    NIM.SKILLS.forEach((s) => (c.skillPts[s.id] = 0));
    if (o.gear === false) c.gp = 50;
    else cls.startGear.forEach((g) => NIM.addItem(c, g.ref, { equipped: true, qty: g.qty || 1 }));
    return c;
  };

  // Riempie i campi mancanti (compatibilità con versioni future)
  NIM.normalize = function (c) {
    const base = NIM.newChar({ classId: c.classId || "commander", gear: false });
    for (const k of Object.keys(base)) if (c[k] === undefined) c[k] = base[k];
    for (const k of Object.keys(base.combat)) if (c.combat[k] === undefined) c.combat[k] = base.combat[k];
    for (const k of Object.keys(base.manual)) if (c.manual[k] === undefined) c.manual[k] = base.manual[k];
    NIM.SKILLS.forEach((s) => { if (c.skillPts[s.id] === undefined) c.skillPts[s.id] = 0; });
    NIM.STATS.forEach((s) => { if (c.statMod[s] === undefined) c.statMod[s] = 0; if (c.stats[s] === undefined) c.stats[s] = 0; });
    return c;
  };

  NIM.addItem = function (c, ref, over) {
    const base = NIM.ITEM_BY_ID[ref];
    const it = Object.assign({ uid: NIM.uid(), ref, qty: 1, equipped: false }, over || {});
    if (!base && !it.name) return null;
    c.items.push(it);
    return it;
  };
  // Prezzo in monete d'argento (10 sp = 1 gp). "—" = gratis; null = prezzo non calcolabile (es. "5–50 gp").
  NIM.costSp = function (str) {
    const t = String(str == null ? "" : str).trim();
    if (t === "—" || t === "" || t === "-") return 0;
    const m = /^([\d,]+)\s*(gp|sp)$/i.exec(t);
    if (!m) return null;
    const v = parseInt(m[1].replace(/,/g, ""), 10);
    return m[2].toLowerCase() === "gp" ? v * 10 : v;
  };
  NIM.coinsSp = (c) => (c.gp || 0) * 10 + (c.sp || 0);
  // Toglie sp monete d'argento dal portafoglio (usa prima gli sp per la parte "spicciola", poi gli gp). false se non bastano.
  NIM.payCoins = function (c, sp) {
    if (NIM.coinsSp(c) < sp) return false;
    let g = Math.floor(sp / 10), s = sp % 10;
    if (c.sp < s) { const k = Math.ceil((s - c.sp) / 10); c.gp -= k; c.sp += k * 10; }
    c.sp -= s;
    if (c.gp < g) { c.sp -= (g - c.gp) * 10; c.gp = 0; } else c.gp -= g;
    return true;
  };
  NIM.fmtCoins = function (sp) {
    const g = Math.floor(sp / 10), s = sp % 10;
    return [g ? g + " gp" : "", s ? s + " sp" : ""].filter(Boolean).join(" ") || "0 gp";
  };
  // Aggiunge qty esemplari dal catalogo; gli oggetti generici identici (non armi/armature/scudi) si sommano.
  NIM.addCatalog = function (c, ref, qty) {
    qty = Math.max(1, Math.round(qty) || 1);
    const base = NIM.ITEM_BY_ID[ref];
    if (!base) return null;
    if (base.kind === "misc") {
      const same = c.items.find((x) => x.ref === ref && !x.name && x.slotsOverride == null && !x.notes);
      if (same) { same.qty = (same.qty || 1) + qty; return same; }
    }
    return NIM.addItem(c, ref, { qty });
  };
  NIM.resolveItem = function (inst) {
    const base = NIM.ITEM_BY_ID[inst.ref] || {};
    const it = Object.assign({}, base, inst);
    it.name = inst.name || base.name || "Oggetto";
    if (inst.slotsOverride != null) it.slots = inst.slotsOverride;
    if (it.kind === "weapon" && !it.props) it.props = [];
    return it;
  };

  /* ---------- scelte di classe (slot) ---------- */
  NIM.slotsFor = function (c) {
    const cls = NIM.CLASSES[c.classId];
    if (cls.slots) return cls.slots(c);
    const lvl = c.level;
    const sub = lvl >= 3 ? c.subclassId : "";
    const slots = [];
    if (lvl >= 2) slots.push({ id: "tactic-2", kind: "tactic", level: 2, label: "Combat Tactic" });
    if (lvl >= 4) {
      slots.push({ id: "order-4a", kind: "order", level: 4, label: "Commander’s Order" });
      slots.push({ id: "order-4b", kind: "order", level: 4, label: "Commander’s Order" });
    }
    [6, 8, 10, 12, 16].forEach((L) => lvl >= L && slots.push({ id: "flex-" + L, kind: "flex", level: L, label: "Fit for Any Battlefield" }));
    [6, 10].forEach((L) => lvl >= L && slots.push({ id: "mastery-" + L, kind: "mastery", level: L, label: "Weapon Mastery" }));
    if (sub === "spellblade") {
      [[3, 1], [7, 2], [11, 3], [15, 4]].forEach(([L, t]) => {
        if (lvl >= L) {
          slots.push({ id: "dk-" + L + "-spell", kind: "spell", level: L, maxTier: t, label: "Deep Knowledge – spell (tier ≤ " + t + ")" });
          slots.push({ id: "dk-" + L + "-util", kind: "util", level: L, label: "Deep Knowledge – Utility Spell" });
        }
      });
    }
    slots.forEach((s) => { if (sub === "arena" && s.kind === "order") s.auto = "die"; });
    return slots;
  };

  NIM.orderText = (o, sb) => (sb ? o.sb : o.text);

  NIM.optionsFor = function (c, slot, taken) {
    const cls = NIM.CLASSES[c.classId];
    if (cls.options) return cls.options(c, slot).filter((o) => !(taken || []).includes(o.id));
    const lvl = c.level;
    const sub = lvl >= 3 ? c.subclassId : "";
    const sb = sub === "spellblade";
    const out = [];
    const tacticsAvail = cls.tactics.concat(cls.extraTactics.filter((t) => t.sub === sub && lvl >= t.minLevel));
    const addTactics = () => tacticsAvail.forEach((t) => out.push({ id: "tactic:" + t.id, name: t.name, group: "Combat Tactics", text: t.text, cost: t.cost }));
    const addOrders = () => cls.orders.forEach((o) => out.push({ id: "order:" + o.id, name: o.name, group: "Commander’s Orders", text: NIM.orderText(o, sb), cost: o.cost }));
    const addSpells = () =>
      NIM.SPELLS.filter((s) => !s.utility && s.tier <= 1).forEach((s) =>
        out.push({ id: "spell:" + s.id, name: s.name, group: "Spells (" + NIM.SCHOOLS[s.school][0] + ")", text: s.text, cost: s.cost, tier: s.tier }));
    const addMasteries = () => cls.masteries.forEach((m) => out.push({ id: "mastery:" + m.id, name: m.name, group: "Weapon Mastery", text: m.text, cost: m.cost }));
    switch (slot.kind) {
      case "tactic": if (sb) { addOrders(); addSpells(); } else addTactics(); break;
      case "order": addOrders(); break;
      case "mastery": if (sb) { addOrders(); addSpells(); } else addMasteries(); break;
      case "flex":
        out.push({ id: "die", name: "+1 max Combat Die", group: "Altro", text: "Gain +1 max Combat Dice.", cost: "" });
        if (sb) { addOrders(); addSpells(); } else { addTactics(); if (sub !== "arena") addOrders(); }
        break;
      case "spell":
        NIM.SPELLS.filter((s) => !s.utility && s.tier <= slot.maxTier).forEach((s) =>
          out.push({ id: "spell:" + s.id, name: s.name, group: "Spells (" + NIM.SCHOOLS[s.school][0] + ")", text: s.text, cost: s.cost, tier: s.tier }));
        break;
      case "util":
        NIM.SPELLS.filter((s) => s.utility).forEach((s) => out.push({ id: "spell:" + s.id, name: s.name, group: "Utility Spells", text: s.text, cost: s.cost, tier: 0 }));
        break;
    }
    return out.filter((o) => o.id === "die" || !(taken || []).includes(o.id));
  };

  // Scelte valide (ignora quelle non più disponibili, es. dopo un cambio sottoclasse)
  NIM.resolveChoices = function (c) {
    const slots = NIM.slotsFor(c);
    const res = {};
    const taken = [];
    slots.forEach((s) => {
      if (s.auto) { res[s.id] = s.auto; return; }
      const cur = c.choices[s.id];
      if (!cur) return;
      const opts = NIM.optionsFor(c, s, taken);
      if (opts.some((o) => o.id === cur)) {
        res[s.id] = cur;
        if (cur !== "die") taken.push(cur);
      }
    });
    return { slots, res };
  };

  /* ---------- derivati ---------- */
  NIM.derive = function (c) {
    const cls = NIM.CLASSES[c.classId];
    const anc = byId(NIM.ANCESTRIES, c.ancestryId);
    const bg = byId(NIM.BACKGROUNDS, c.bgId);
    const bgo = bg && bg.options ? bg.options[c.bgOption || 0] || null : null;
    const lvl = c.level;
    const sub = lvl >= 3 ? cls.subclasses.find((s) => s.id === c.subclassId) || null : null;
    const subId = sub ? sub.id : "";
    const d = { cls, anc, bg, bgo, sub, subId, lvl };

    // modificatori
    const m = { skillAll: 0, skill: {}, init: 0, initAdv: false, defense: 0, speed: 0, maxHD: 0, maxWounds: 0, hdStep: 0, disToNeutral: false };
    [anc && anc.mods, bg && bg.mods, bgo && bgo.mods].forEach((src) => {
      if (!src) return;
      Object.keys(src).forEach((k) => {
        if (k === "skill") Object.keys(src.skill).forEach((sk) => (m.skill[sk] = (m.skill[sk] || 0) + src.skill[sk]));
        else if (typeof src[k] === "boolean") m[k] = m[k] || src[k];
        else m[k] += src[k];
      });
    });
    if (anc && anc.choice && anc.choice.type === "skill" && c.ancChoice) m.skill[c.ancChoice] = (m.skill[c.ancChoice] || 0) + anc.choice.value;
    d.mods = m;

    // caratteristiche
    const incs = { STR: 0, DEX: 0, INT: 0, WIL: 0 };
    c.levels.forEach((l) => (l.stat || []).forEach((s) => { if (incs[s] !== undefined) incs[s]++; }));
    d.statIncs = incs;
    d.stats = {};
    const early = NIM.resolveChoices(c);
    const statBonus = cls.statBonus ? cls.statBonus(Object.values(early.res)) : {};
    NIM.STATS.forEach((s) => (d.stats[s] = c.stats[s] + incs[s] + (c.statMod[s] || 0) + (statBonus[s] || 0)));
    const st = d.stats;

    // salvezze
    d.saves = {};
    NIM.STATS.forEach((s) => (d.saves[s] = { state: cls.saves[s], val: st[s] }));
    if (m.disToNeutral) NIM.STATS.forEach((s) => { if (d.saves[s].state === "dis") d.saves[s].state = "neu"; });
    if (anc && anc.id === "fiendkin" && NIM.STATS.includes(c.ancChoice) && d.saves[c.ancChoice].state === "neu") d.saves[c.ancChoice].state = "adv";
    d.keyDC = cls.keyStats.map((k) => ({ stat: k, dc: 10 + st[k] }));

    // scelte di classe
    const { slots, res } = early;
    d.slots = slots;
    d.choices = res;
    d.pending = slots.filter((s) => !res[s.id]).length;
    const chosen = Object.values(res);
    d.tactics = chosen.filter((x) => x.startsWith("tactic:")).map((x) => x.slice(7));
    d.orders = chosen.filter((x) => x.startsWith("order:")).map((x) => x.slice(6));
    d.masteries = chosen.filter((x) => x.startsWith("mastery:")).map((x) => x.slice(8));
    if (lvl >= 14 && cls.masteries && subId !== "spellblade") d.masteries = cls.masteries.map((x) => x.id);
    d.spells = chosen.filter((x) => x.startsWith("spell:")).map((x) => x.slice(6));
    d.isSB = subId === "spellblade";

    d.arsenal = chosen.filter((x) => x.startsWith("arsenal:")).map((x) => x.slice(8));
    d.lesser = chosen.filter((x) => x.startsWith("lesser:")).map((x) => x.slice(7));
    d.greater = chosen.filter((x) => x.startsWith("greater:")).map((x) => x.slice(8));
    d.underhanded = chosen.filter((x) => x.startsWith("underhanded:")).map((x) => x.slice(12));
    d.gambits = chosen.filter((x) => x.startsWith("gambit:")).map((x) => x.slice(7));

    // modificatori di classe (valori comuni; il Berserker li usa davvero)
    d.initAdv = !!m.initAdv || d.orders.includes("move-it");
    d.dyingActions = 1; d.dyingNoSave = false; d.dyingWounds = { normal: 2, crit: 3 };
    let classWounds = 0, classSpeed = 0;
    if (cls.id === "berserker") {
      const has = (id) => d.arsenal.includes(id);
      const steps = [6, 9, 13, 17].filter((L) => lvl >= L).length;
      const stoke = subId === "burning-rage";
      d.furyMax = Math.max(0, st.STR, st.DEX);
      d.furySize = stoke ? 4 : cls.furyDieAt(lvl);
      d.rageDice = (lvl >= 5 ? 2 : 1) + (stoke ? steps : 0);
      d.deepRage = lvl >= 18;
      if (lvl >= 4) { d.dyingActions = 2; d.dyingNoSave = true; }
      if (has("unstoppable-force")) d.dyingWounds = { normal: 1, crit: 2 };
      if (has("mighty-endurance")) classWounds += 4;
      if (subId === "muscle-mage" && lvl >= 15) classWounds += 4;
      if (has("eager-for-battle")) d.initAdv = true;
      if (subId === "red-mist" && lvl >= 15 && c.combat.raging) classSpeed += 2;
      d.mm = subId === "muscle-mage";
      d.fdReq = d.mm && lvl >= 11 ? 2 : 0; // Flexpertise
    }

    if (cls.id === "shadowmancer") {
      const reaver = subId === "reaver";
      const hasG = (id) => d.greater.includes(id);
      if (hasG("fiendish-boon-dex") || hasG("fiendish-boon-int")) m.maxHD -= 1;
      d.sm = {
        reaver,
        limit: Math.max(0, st.INT),
        perCast: 1 + Math.floor(lvl / 5),
        blastN: 1 + Math.floor(lvl / 5),
        die: hasG("shadow-magus") ? 10 : 12,
        maxTier: cls.maxTierAt(lvl),
        pilfered: lvl >= 2 && !reaver ? Math.max(0, st.DEX) : 0,
        armor: hasG("armor-of-shadows"),
        known: [],
      };
      d.sm.known = cls.knownSpells(c, d);
      // Shadow Blast (non per il Reaver) e Bonescythe (solo Reaver, finché è evocata)
      d.sm.blast = !reaver;
      d.sm.scytheN = 2 + Math.floor(lvl / 5);
    }

    if (cls.id === "cheat") {
      d.ch = { sneak: cls.sneakAt(lvl), hs: subId === "honorseeker" };
    }

    // PF, dadi vita, ferite
    d.maxHP = cls.startHP + c.levels.reduce((a, l) => a + (l.hp || 0), 0) + (c.manual.hp || 0);
    const hdIdx = clamp(NIM.HD_STEPS.indexOf(cls.hitDie) + m.hdStep, 0, NIM.HD_STEPS.length - 1);
    d.hdSize = NIM.HD_STEPS[hdIdx];
    d.maxHD = Math.max(1, lvl + m.maxHD + (c.manual.hd || 0));
    d.maxWounds = Math.max(1, 6 + m.maxWounds + (c.manual.wounds || 0) + classWounds);
    d.dying = c.hp <= 0;
    d.dead = c.wounds >= d.maxWounds;
    d.bloodied = c.hp * 2 <= d.maxHP;

    // iniziativa / velocità
    d.initiative = st.DEX + m.init + (c.manual.init || 0) + (subId === "arena" && lvl >= 11 ? st.STR : 0);
    d.speed = 6 + m.speed + (c.manual.speed || 0) + classSpeed;
    d.size = anc ? anc.size : "Medium";
    if (anc && anc.choice && anc.choice.type === "size" && c.ancChoice) d.size = c.ancChoice;

    // oggetti
    const inv = c.items.map(NIM.resolveItem);
    d.inv = inv;
    const eq = inv.filter((i) => i.equipped);
    const armors = eq.filter((i) => i.kind === "armor");
    const shields = eq.filter((i) => i.kind === "shield");
    const parts = [];
    let armorItem = null, armorDef = st.DEX;
    if (armors.length) {
      let best = -Infinity;
      armors.forEach((a) => {
        const v = a.base + (a.dex ? Math.min(st.DEX, a.maxDex == null ? 99 : a.maxDex) : 0);
        if (v > best) { best = v; armorItem = a; }
      });
      armorDef = best;
      parts.push([armorItem.name, armorDef]);
    } else parts.push(["Senza armatura (DEX)", st.DEX]);
    let shieldItem = null;
    shields.forEach((s) => { if (!shieldItem || s.def > shieldItem.def) shieldItem = s; });
    let shieldDef = 0;
    if (shieldItem) {
      shieldDef = shieldItem.def + (subId === "bulwark" && lvl >= 15 ? 2 : 0);
      parts.push([shieldItem.name + (subId === "bulwark" && lvl >= 15 ? " (+2 Shield Wall)" : ""), shieldDef]);
    }
    let extraDef = 0;
    if (subId === "siege-breaker" && !shieldItem && eq.some((i) => i.kind === "weapon" && (i.props || []).some((p) => /^2-handed/.test(p)))) {
      extraDef += st.STR;
      parts.push(["Siege Veteran (arma a 2 mani)", st.STR]);
    }
    if (d.underhanded.includes("misdirection") && Math.max(0, st.INT) > 0) {
      extraDef += Math.max(0, st.INT);
      parts.push(["Misdirection (INT)", Math.max(0, st.INT)]);
    }
    if (m.defense) parts.push(["Ancestry/Background", m.defense]);
    if (c.manual.defense) parts.push(["Modificatore manuale", c.manual.defense]);
    d.defenseParts = parts;
    d.defenseRaw = armorDef + shieldDef + extraDef + m.defense + (c.manual.defense || 0);
    d.defense = Math.max(0, d.defenseRaw);
    d.armorItem = armorItem;
    d.shieldItem = shieldItem;

    // avvisi equipaggiamento
    const weaponProf = (w) => (cls.weaponProf ? cls.weaponProf(w, d) : true);
    d.warnings = [];
    const armorProf = (a) => cls.armor.includes(a.armor) || (subId === "bulwark" && a.armor === "plate");
    armors.forEach((a) => {
      if (!armorProf(a)) d.warnings.push(a.name + ": senza competenza (Defend costa 1 azione in più).");
      if (a.req > 0 && a.req > st.STR) d.warnings.push(a.name + ": richiede STR " + a.req + ".");
    });
    shields.forEach((s) => {
      if (!cls.armor.includes("shield")) d.warnings.push(s.name + ": senza competenza (Defend costa 1 azione in più).");
      if (s.req > 0 && s.req > st.STR) d.warnings.push(s.name + ": richiede STR " + s.req + ".");
    });
    if (shields.length > 1) d.warnings.push("Più scudi equipaggiati: conto solo il migliore.");
    if (armors.length > 1) d.warnings.push("Più armature equipaggiate: conto solo la migliore.");
    eq.filter((i) => i.kind === "weapon").forEach((w) => {
      (w.props || []).forEach((p) => {
        const r = /\(Req\. (\d) STR\)/.exec(p);
        if (r && !/1-handed/.test(p) && st.STR < +r[1]) d.warnings.push(w.name + ": richiede STR " + r[1] + ".");
      });
      if (w.noProf || !weaponProf(w)) d.warnings.push(w.name + ": senza competenza (non può critare).");
    });

    // attacchi
    d.attacks = eq.filter((i) => i.kind === "weapon").map((w) => {
      const mod = st[w.stat] + (w.bonus || 0);
      return {
        uid: w.uid, name: w.name, n: w.n, die: w.die, stat: w.stat, mod, dtype: w.dtype, props: w.props || [],
        vicious: (w.props || []).includes("Vicious"), noCrit: !!w.noProf || !weaponProf(w), ranged: w.ranged,
      };
    });
    const un = cls.unarmed ? cls.unarmed(d) : { die: 4, noCrit: false };
    d.attacks.push({ uid: "unarmed", name: "Unarmed Strike", n: 1, die: un.die, stat: "STR", mod: st.STR, dtype: "bludgeoning", props: [], vicious: false, noCrit: un.noCrit });
    if (cls.id === "cheat") {
      d.attacks.forEach((a) => {
        const notes = [];
        if (d.ch.hs) notes.push("Tenacious Fighter: +" + d.ch.sneak + " vs Upper Hand");
        else {
          notes.push("Sneak Attack: +" + d.ch.sneak + " on crit");
          const thrown = a.props.some((p) => /^Thrown/.test(p));
          if (!a.ranged || (thrown && d.underhanded.includes("trickshot"))) notes.push("Vicious Opportunist vs Distracted");
        }
        a.notes = notes;
      });
    }
    if (cls.id === "shadowmancer") {
      const sm = d.sm, extra = [];
      if (sm.blast) {
        const range = 8 + (d.greater.includes("shadow-spear") ? 8 : 0);
        const props = ["Range " + range, "1/round"];
        if (d.greater.includes("repelling-blast")) props.push("On hit: Knockback 2");
        if (d.greater.includes("shadow-spear")) props.push("Ignores cover", "Crits on a 1");
        if (subId === "abyssal-depths" && lvl >= 7) props.push("Slows");
        const dt = subId === "red-dragon" ? "necrotic/fire" : subId === "abyssal-depths" ? "necrotic/cold" : "necrotic";
        d.attacks.unshift({ uid: "shadow-blast", name: "Shadow Blast", n: sm.blastN, die: 12, stat: "DEX", mod: st.DEX, dtype: dt, props, vicious: false, noCrit: false, ranged: true });
      }
      if (sm.reaver && c.bonescythe) {
        d.attacks.unshift({ uid: "bonescythe", name: "Bonescythe", n: sm.scytheN, die: 12, stat: "DEX", mod: 0, dtype: "slashing + " + st.DEX + " necrotic per die", props: ["Reach 2", "Shatters on hit"], vicious: false, noCrit: false, ranged: false });
      }
    }
    if (cls.id === "berserker" && c.combat.raging && c.fury > 0) d.attacks.forEach((a) => { if (a.stat === "STR") a.fury = c.fury; });

    // slot inventario
    d.slotsCap = 10 + st.STR;
    let used = 0;
    inv.forEach((i) => {
      let sl = i.slots == null ? 1 : i.slots;
      if (i.kind === "armor") sl = i.equipped ? 1 : 2;
      used += sl * (i.qty || 1);
    });
    d.goldSlots = c.gp > 0 ? Math.ceil(c.gp / 500) : 0;
    d.slotsUsed = used + d.goldSlots;
    d.slotsOn = !c.noSlots;

    // abilità
    const skills = NIM.SKILLS.map((sk) => {
      const raw = st[sk.stat] + (c.skillPts[sk.id] || 0) + m.skillAll + (m.skill[sk.id] || 0) + (subId === "muscle-mage" && sk.stat === "INT" ? st.STR : 0);
      return { id: sk.id, name: sk.name, stat: sk.stat, pts: c.skillPts[sk.id] || 0, total: Math.min(10, raw), raw };
    });
    d.skills = skills;
    d.skillBudget = lvl + 3;
    d.skillSpent = skills.reduce((a, s) => a + s.pts, 0);
    d.skillLeft = d.skillBudget - d.skillSpent;

    // lingue
    d.langExtra = Math.max(0, st.INT);
    d.langAnc = anc && anc.lang && st.INT >= 0 ? anc.lang : "";

    // Combat Dice
    d.diceSize = cls.combatDieAt ? cls.combatDieAt(lvl) : 0;
    let bonus = chosen.filter((x) => x === "die").length;
    if (subId === "vanguard" && lvl >= 11) bonus += 1;
    if (subId === "siege-breaker" && lvl >= 11) bonus += 2;
    d.diceBonus = bonus;
    d.maxDice = cls.id === "commander" && lvl >= 2 ? Math.max(0, st.STR) + bonus : 0;
    d.diceAdv = subId === "siege-breaker" && lvl >= 11;
    d.maxMana = d.isSB ? Math.max(0, st.INT) : 0;

    d.uses = NIM.usesFor(c, d);
    return d;
  };

  /* ---------- risorse con usi ---------- */
  NIM.usesFor = function (c, d) {
    const cls = d.cls, lvl = c.level, st = d.stats, subId = d.subId;
    const u = [];
    if (cls.id === "commander") u.push({ key: "cs-enc", label: "Coordinated Strike", per: "enc", max: 1, src: "Class" });
    if (cls.id === "commander" && lvl >= 5) {
      // un'unica riga: pool di INT usi per Safe Rest (+1 ai livelli 9/13/17); vale comunque il limite di 1 per round
      const pool = Math.max(0, st.INT) + [9, 13, 17].filter((L) => lvl >= L).length;
      u.push({ key: "cs-pool", label: "Coordinated Strike (usi extra, max 1/round)", per: "safe", max: pool, src: "Master Commander" });
    }
    if (cls.id === "cheat") {
      const hs = d.ch.hs;
      if (hs) u.push({ key: "tenacious", label: "Tenacious Fighter (+" + d.ch.sneak + ")", per: "turn", max: 1, src: "Honorseeker" });
      else {
        u.push({ key: "sneak", label: "Sneak Attack (+" + d.ch.sneak + ")", per: "turn", max: 1, src: "Class" });
        u.push({ key: "vo", label: "Vicious Opportunist", per: "turn", max: 1, src: "Class" });
      }
      if (lvl >= 2) {
        u.push({ key: "cheat-move", label: "Cheat: free Move or Hide", per: "round", max: 1, src: "Class" });
        u.push({ key: "cheat-skill", label: "Cheat: skill check = 10+INT", per: "safe", max: 1, src: "Class" });
      }
      if (lvl >= 5) u.push({ key: "quick-read", label: "Quick Read", per: "enc", max: 1, src: "Class" });
      if (lvl >= 6) u.push({ key: "not-happened", label: "THAT’S Not What Happened!", per: "safe", max: 1, src: "Class" });
      if (lvl >= 13 && !hs) u.push({ key: "twist-free", label: "Twist the Blade (free)", per: "turn", max: 1, src: "Class" });
      if (subId === "scoundrel") {
        if (lvl >= 7) u.push({ key: "pocket-sand", label: "Pocket Sand", per: "enc", max: 2, src: "Scoundrel" });
        if (lvl >= 11) u.push({ key: "escape-plan", label: "Escape Plan", per: "safe", max: 1, src: "Scoundrel" });
        if (lvl >= 15) u.push({ key: "heads-win", label: "Heads I Win, Tails You Lose", per: "enc", max: 1, src: "Scoundrel" });
      }
      if (subId === "serpent" && lvl >= 7) u.push({ key: "noxious", label: "Noxious Cloud", per: "enc", max: lvl >= 15 ? 2 : 1, src: "Serpent" });
      if (subId === "gambler") {
        u.push({ key: "practice-roll", label: "That Was Just a Practice Roll", per: "enc", max: lvl >= 15 ? 2 : 1, src: "Gambler" });
        if (lvl >= 7) u.push({ key: "pocket-aces", label: "Pocket Aces!", per: "safe", max: 1, src: "Gambler" });
        if (lvl >= 11) u.push({ key: "play-odds", label: "Play the Odds", per: "round", max: 1, src: "Gambler" });
      }
      if (hs) u.push({ key: "prove-worth", label: "Prove Your Worth!", per: "turn", max: 1, src: "Honorseeker" });
    }
    if (cls.id === "shadowmancer") {
      const sm = d.sm;
      if (sm.pilfered > 0 || (lvl >= 2 && !sm.reaver)) u.push({ key: "pilfered", label: "Pilfered Power", per: "safe", max: sm.pilfered, src: "Class" });
      u.push({ key: "cmd-shadows", label: "Command Shadows", per: "round", max: 1, src: "Cantrip" });
      if (sm.blast) u.push({ key: "shadow-blast", label: "Shadow Blast", per: "round", max: 1, src: "Cantrip" });
      if (lvl >= 20) u.push({ key: "usurper", label: "Eldritch Usurper (Greater Shadow)", per: "enc", max: 1, src: "Class" });
      if (subId === "abyssal-depths" && lvl >= 11) u.push({ key: "glacial", label: "Glacial Resilience", per: "safe", max: 1, src: "Abyssal Depths" });
      if (subId === "void" && lvl >= 15) u.push({ key: "consuming-dark", label: "The Consuming Dark", per: "enc", max: 1, src: "Void" });
      if (subId === "high-celestial" && lvl >= 15) u.push({ key: "apotheosis", label: "Apotheosis", per: "safe", max: 1, src: "High Celestial" });
    }
    if (cls.id === "berserker") {
      if (lvl >= 2) u.push({ key: "ancients", label: "One with the Ancients", per: "safe", max: 1, src: "Class" });
      if (d.arsenal.includes("rampage")) u.push({ key: "rampage", label: "Rampage", per: "turn", max: 1, src: "Savage Arsenal" });
      if (d.arsenal.includes("deathless-rage")) u.push({ key: "deathless", label: "Deathless Rage", per: "turn", max: 1, src: "Savage Arsenal" });
      if (subId === "red-mist") {
        u.push({ key: "blood-frenzy", label: "Blood Frenzy", per: "turn", max: 1, src: "Red Mist" });
        if (lvl >= 15) u.push({ key: "onslaught", label: "Onslaught (movimento gratis)", per: "round", max: 1, src: "Red Mist" });
      }
      if (subId === "mountainheart" && lvl >= 7) u.push({ key: "unbreakable", label: "Unbreakable", per: "enc", max: 1, src: "Mountainheart" });
      if (subId === "burning-rage" && lvl >= 20) u.push({ key: "boundless-flames", label: "Boundless Flames", per: "round", max: 1, src: "Burning Rage" });
      if (subId === "muscle-mage") {
        if (lvl >= 7 && lvl < 15) u.push({ key: "imfine", label: "I’m Fine! Totally Fine!", per: "safe", max: 1, src: "Muscle Mage" });
        (cls.muscleSpells || []).filter((x) => x.once).forEach((x) => u.push({ key: "ms-" + x.id, label: x.name, per: "enc", max: 1, src: "Muscle Spell" }));
      }
    }
    (d.orders || []).forEach((id) => {
      const o = byId(cls.orders || [], id);
      if (o && o.uses) u.push({ key: o.uses.key, label: o.name, per: o.uses.per, max: o.uses.max, src: "Order" });
    });
    d.masteries.forEach((id) => {
      const mm = byId(cls.masteries || [], id);
      if (mm) u.push({ key: "mast-" + id, label: "Mastery: " + mm.name, per: "turn", max: 1, src: "Weapon Mastery" });
    });
    if (subId === "arena") {
      u.push({ key: "arena-show", label: "Showstopping Strike", per: "safe", max: 1, src: "Arena" });
      u.push({ key: "arena-glory", label: "Glory Seeker", per: "round", max: 1, src: "Arena" });
      if (lvl >= 7) u.push({ key: "arena-strategy", label: "Remarkable Strategy", per: "enc", max: 1, src: "Arena" });
    }
    if (subId === "bulwark" && lvl >= 11) u.push({ key: "bulwark-taunt", label: "Taunting Strike", per: "turn", max: 1, src: "Bulwark" });
    if (d.anc) d.anc.uses.forEach((x) => u.push(Object.assign({ src: d.anc.name }, x)));
    if (d.bg) d.bg.uses.forEach((x) => u.push(Object.assign({ src: d.bg.name }, x)));
    NIM.attachUseTexts(c, d, u);
    return u;
  };

  /* descrizione (testo del manuale) di ogni abilità con usi: serve alla scheda Combat */
  NIM.attachUseTexts = function (c, d, u) {
    const cls = d.cls, lvl = c.level;
    const base = (n) => n.toLowerCase().replace(/\s*\(\d+\)$/, "").trim();
    const feat = (name) => {
      const k = base(name), parts = [];
      cls.features.filter((f) => f.level <= lvl && base(f.name) === k).forEach((f) => parts.push(f.text));
      if (d.sub) d.sub.features.filter((f) => f.level <= lvl).forEach((f) => f.items.forEach(([n, t]) => { if (base(n) === k) parts.push(t); }));
      return parts.join("\n");
    };
    const NAMES = { "cs-enc": "Coordinated Strike!", "cs-pool": "Master Commander", ancients: "One with the Ancients", "blood-frenzy": "Blood Frenzy",
      onslaught: "Onslaught", unbreakable: "Unbreakable", "boundless-flames": "BOUNDLESS FLAMES", imfine: "I’m Fine! Totally Fine!",
      "arena-show": "Showstopping Strike", "arena-glory": "Glory Seeker", "arena-strategy": "Remarkable Strategy", "bulwark-taunt": "Taunting Strike",
      sneak: "Sneak Attack", vo: "Vicious Opportunist", "cheat-move": "Cheat", "cheat-skill": "Cheat", "quick-read": "Quick Read", "not-happened": "THAT’S Not What Happened!",
      "twist-free": "Twist the Blade", "pocket-sand": "Pocket Sand", "escape-plan": "Escape Plan", "heads-win": "Heads I Win, Tails You Lose", noxious: "Noxious Cloud",
      "practice-roll": "That Was Just a Practice Roll", "pocket-aces": "Pocket Aces!", "play-odds": "Play the Odds", tenacious: "Tenacious Fighter", "prove-worth": "Prove Your Worth!",
      pilfered: "Pilfered Power", usurper: "Eldritch Usurper", glacial: "Glacial Resilience", "consuming-dark": "The Consuming Dark", apotheosis: "Apotheosis" };
    u.forEach((x) => {
      if (x.text) return;
      let t = "";
      if (NAMES[x.key]) t = feat(NAMES[x.key]);
      else if (x.key === "cmd-shadows" || x.key === "shadow-blast") { const ct = (cls.cantrips || []).find((q) => q.id === (x.key === "cmd-shadows" ? "command-shadows" : "shadow-blast")); t = ct ? ct.text : ""; }
      else if (x.key === "rampage" || x.key === "deathless") { const a = byId(cls.arsenal || [], x.key === "deathless" ? "deathless-rage" : "rampage"); t = a ? a.text : ""; }
      else if (x.key.startsWith("ms-")) { const sp = byId(cls.muscleSpells || [], x.key.slice(3)); t = sp ? sp.text.replace(/\n/g, " ") : ""; }
      else if (x.key.startsWith("mast-")) { const mm = byId(cls.masteries || [], x.key.slice(5)); t = mm ? mm.text : ""; }
      else if (x.src === "Order") { const o = (cls.orders || []).find((q) => q.uses && q.uses.key === x.key); t = o ? NIM.orderText(o, d.isSB) : ""; }
      else if (d.anc && x.src === d.anc.name) t = d.anc.text;
      else if (d.bg && x.src === d.bg.name) t = d.bg.text;
      if (t) x.text = t;
    });
  };

  NIM.useLeft = (c, key, max) => Math.max(0, max - (c.used[key] || 0));

  NIM.resetUses = function (c, d, pers) {
    d.uses.forEach((x) => { if (pers.includes(x.per)) c.used[x.key] = 0; });
  };

  /* ---------- PF, ferite, riposi ---------- */
  NIM.gainWounds = function (c, d, n) {
    if (n <= 0) return;
    c.wounds = Math.min(d.maxWounds, c.wounds + n);
    d.uses.forEach((x) => { if (x.onWound) c.used[x.key] = 0; });
  };

  /* ---------- Berserker: Rage e Fury Dice ---------- */
  // Rage: aggiunge Fury Dice fino al massimo (KEY). opts.auto = effetto automatico (non conta come “1/turn”).
  NIM.rage = function (c, d, opts) {
    opts = opts || {};
    const n = opts.n != null ? opts.n : d.rageDice;
    const raw = c.fury + n;
    c.fury = Math.min(raw, d.furyMax);
    c.combat.raging = true;
    if (!opts.auto) c.combat.rageTurn = true;
    return { n, overflow: raw - c.fury };
  };
  NIM.gainFury = function (c, d, n) {
    const raw = c.fury + n;
    c.fury = Math.min(raw, d.furyMax);
    if (c.fury > 0) c.combat.raging = true;
    return raw - c.fury;
  };
  NIM.endRage = function (c) { c.fury = 0; c.combat.raging = false; };

  // Applica un danno. opt: {defend, crit, ignoreDef, furySpend, furySum}
  NIM.applyDamage = function (c, d, raw, opt) {
    opt = opt || {};
    let amt = raw;
    const notes = [];
    const bz = d.cls.id === "berserker";
    if (opt.defend && !opt.crit && !opt.ignoreDef) {
      amt = Math.max(0, raw - d.defense);
      notes.push("Defend −" + Math.min(raw, d.defense));
    } else if (opt.defend && opt.crit) notes.push("Il critico ignora la Defense");
    if (d.sm && d.sm.armor && c.shadows > 0 && amt > 0) {
      const red = Math.min(amt, c.shadows);
      amt -= red;
      notes.push("Armor of Shadows −" + red);
    }
    if (bz && opt.furySpend > 0) {
      const n = Math.min(Math.round(opt.furySpend), c.fury);
      if (n > 0) {
        const stone = d.subId === "mountainheart" ? Math.max(0, Math.round(+opt.furySum || 0)) : 0;
        const red = n * (d.stats.STR + d.stats.DEX) + stone;
        amt = Math.max(0, amt - Math.max(0, red));
        c.fury -= n;
        notes.push("That all you got?! −" + Math.max(0, red) + " (" + n + " Fury Dice)");
      }
    }
    const absorbed = Math.min(c.tmp, amt);
    if (absorbed) { c.tmp -= absorbed; amt -= absorbed; notes.push("PF temp −" + absorbed); }
    const wasDying = c.hp <= 0;
    let dropped = false;
    if (amt > 0) {
      if (wasDying) {
        const w = opt.crit ? d.dyingWounds.crit : d.dyingWounds.normal;
        NIM.gainWounds(c, d, w);
        notes.push("Dying: +" + w + (w === 1 ? " Ferita" : " Ferite"));
      } else {
        c.hp = Math.max(0, c.hp - amt);
        notes.push("PF −" + amt);
        if (c.hp === 0) { NIM.gainWounds(c, d, 1); notes.push("A 0 PF: +1 Ferita e Dying"); dropped = true; }
      }
    } else notes.push("Nessun danno ai PF");
    if (bz) {
      if (dropped && !d.deepRage) { NIM.endRage(c); notes.push("La Rage finisce (0 PF)"); }
      else if (dropped) notes.push("Deep Rage: la Rage non finisce");
      if (opt.crit && d.arsenal.includes("more-blood")) { NIM.gainFury(c, d, 1); notes.push("MORE BLOOD!: +1 Fury Die"); }
      if (dropped && d.arsenal.includes("more-blood")) { NIM.rage(c, d, { auto: true }); notes.push("MORE BLOOD!: Rage gratis"); }
      if (opt.crit && d.subId === "mountainheart" && d.lvl >= 11) { NIM.rage(c, d, { auto: true }); notes.push("Titan’s Fury: Rage gratis"); }
    }
    return { dealt: amt, notes };
  };

  NIM.heal = function (c, d, amount) {
    const before = c.hp;
    c.hp = Math.min(d.maxHP, Math.max(0, c.hp) + amount);
    if (c.hp >= d.maxHP) d.uses.forEach((x) => { if (x.per === "fullhp") c.used[x.key] = 0; });
    return c.hp - before;
  };

  // Catch Breath / Make Camp. opts: {camp, fieldMedic, perDie, results:[valori dei dadi tirati dal giocatore]}
  // Make Camp (e Oozeling): valore massimo di ogni dado, nessun tiro necessario.
  NIM.spendHitDice = function (c, d, count, opts) {
    opts = opts || {};
    count = Math.min(count, c.hd);
    const maxMode = opts.camp || (d.anc && d.anc.id === "oozeling");
    const per = d.stats.STR + (opts.perDie || 0);
    let total = 0;
    if (maxMode) total = count * Math.max(0, d.hdSize + per);
    else {
      const res = (opts.results || []).map((x) => clamp(Math.round(+x) || 0, 0, d.hdSize));
      if (res.length === count) total = res.reduce((a, v) => a + Math.max(0, v + per), 0);
      else total = Math.max(0, res.reduce((a, v) => a + v, 0) + count * per);
    }
    const medic = opts.fieldMedic ? (d.skills.find((s) => s.id === "examination").total) : 0;
    if (count > 0 && medic > 0) total += medic;
    c.hd -= count;
    // Mountainheart – Mountainous Tenacity: ogni 10 PF che recuperi puoi curare 1 Ferita al loro posto
    let woundsHealed = 0;
    if (opts.woundsInstead > 0 && d.subId === "mountainheart") {
      woundsHealed = Math.min(Math.round(opts.woundsInstead), Math.floor(total / 10), c.wounds);
      c.wounds -= woundsHealed; total -= woundsHealed * 10;
    }
    const healed = NIM.heal(c, d, total);
    return { total, medic, healed, count, woundsHealed };
  };

  NIM.safeRest = function (c, d) {
    c.hp = d.maxHP; c.tmp = 0; c.hd = d.maxHD; c.wounds = Math.max(0, c.wounds - 1);
    c.used = {}; c.mana = 0; c.fury = 0; c.shadows = 0; c.bonescythe = false;
    c.combat = Object.assign(c.combat, { active: false, round: 1, actions: 3, attacks: 0, react: {}, dice: 0, conds: [], raging: false, rageTurn: false });
  };

  /* ---------- combattimento ---------- */
  NIM.actionsFromInit = (total, nat) => (nat === 20 || total >= 20 ? 3 : total >= 10 ? 2 : 1);

  NIM.startEncounter = function (c, d, actions) {
    NIM.resetUses(c, d, ["enc", "round", "turn"]);
    c.combat.active = true; c.combat.round = 1; c.combat.attacks = 0; c.combat.react = {};
    c.combat.actions = actions == null ? 3 : actions;
    c.combat.dice = d.maxDice;
    c.mana = d.maxMana;
    if (d.subId === "vanguard" && c.level >= 11) c.used["cs-pool"] = Math.max(0, (c.used["cs-pool"] || 0) - 1);
    if (d.subId === "arena" && c.level >= 11) c.used["arena-show"] = 0;
    const notes = [];
    c.fury = 0; c.combat.raging = false; c.combat.rageTurn = false;
    c.shadows = 0; c.bonescythe = false;
    if (d.cls.id === "shadowmancer") {
      if (d.subId === "red-dragon" && c.level >= 11) {
        if ((c.used.pilfered || 0) > 0) { c.used.pilfered -= 1; notes.push("Heart of Burning Fire: +1 uso di Pilfered Power"); }
        else notes.push("Heart of Burning Fire: nessun uso di Pilfered Power da recuperare");
      }
      if (d.subId === "reaver" && c.level >= 15) { c.shadows = 2; c.bonescythe = true; notes.push("Sovereign One: 2 Shadow e Bonescythe gratis"); }
    }
    if (d.subId === "burning-rage" && c.level >= 7) { NIM.rage(c, d, { auto: true }); notes.push("Hot Headed: Rage gratis (+" + d.rageDice + " Fury Dice)"); }
    return notes;
  };
  NIM.endEncounter = function (c) {
    c.combat.active = false; c.combat.dice = 0; c.mana = 0; c.combat.attacks = 0; c.combat.react = {}; c.combat.actions = 3;
    c.fury = 0; c.combat.raging = false; c.combat.rageTurn = false;
    c.shadows = 0; c.bonescythe = false;
  };
  // Fine turno. opts.attacked === false: nel round non hai attaccato né usato Rage (la Rage finisce).
  // Ritorna le note degli effetti “a inizio turno”.
  NIM.endTurn = function (c, d, opts) {
    opts = opts || {};
    const notes = [];
    c.combat.actions = 3; c.combat.attacks = 0; c.combat.react = {}; c.combat.round += 1;
    NIM.resetUses(c, d, ["round", "turn"]);
    if (d.cls.id === "berserker") {
      if (c.combat.raging && !c.combat.rageTurn && opts.attacked === false) { NIM.endRage(c); notes.push("La Rage è finita (nessun attacco nel round)"); }
      if (c.hp <= 0 && c.level >= 4) { NIM.rage(c, d, { auto: true }); notes.push("Enduring Rage: Rage gratis (+" + d.rageDice + " Fury Dice)"); }
      if (c.level >= 2 && c.combat.raging) { const o = NIM.gainFury(c, d, 1); notes.push("Intensifying Fury: +1 Fury Die" + (o ? " (oltre il massimo)" : "")); }
    }
    c.combat.rageTurn = false;
    return notes;
  };

  /* ---------- livelli ---------- */
  NIM.levelUpInfo = function (c) {
    const cls = NIM.CLASSES[c.classId];
    const nl = c.level + 1;
    return {
      level: nl,
      keyInc: cls.keyIncLevels.includes(nl),
      secInc: cls.secIncLevels.includes(nl),
      twoInc: nl === 20,
      boon: nl === 19,
      pickSub: nl === 3,
      avg: NIM.HD_AVG[cls.hitDie],
      features: cls.features.filter((f) => f.level === nl && !(f.replacedBy && f.replacedBy === c.subclassId)),
      subFeatures: c.subclassId && nl > 3 ? ((cls.subclasses.find((s) => s.id === c.subclassId) || { features: [] }).features.find((f) => f.level === nl) || { items: [] }).items : [],
    };
  };
  NIM.levelUp = function (c, o) {
    const nl = c.level + 1;
    if (nl > 20) return false;
    c.level = nl;
    c.levels.push({ lvl: nl, hp: o.hp, stat: o.stat || [] });
    c.hp += o.hp;
    c.hd += 1;
    if (o.subclassId) c.subclassId = o.subclassId;
    return true;
  };
  NIM.undoLevel = function (c) {
    if (c.level <= 1) return false;
    c.levels.pop();
    c.level -= 1;
    if (c.level < 3) c.subclassId = "";
    c.hd = Math.min(c.hd, Math.max(1, c.level));
    return true;
  };

  /* ---------- creazione a un livello di partenza > 1 ---------- */
  // Elenco dei livelli 2..target con le scelte richieste (aumenti di caratteristica, sottoclasse).
  NIM.levelPlan = function (classId, target) {
    const cls = NIM.CLASSES[classId];
    const out = [];
    for (let L = 2; L <= Math.min(20, target); L++) {
      out.push({ level: L, keyInc: cls.keyIncLevels.includes(L), secInc: cls.secIncLevels.includes(L), twoInc: L === 20, pickSub: L === 3, avg: NIM.HD_AVG[cls.hitDie] });
    }
    return out;
  };
  // Risolve gli aumenti di caratteristica di ogni livello: usa le scelte dell'utente (picks[livello] = {s0, s1})
  // e, dove mancano, sceglie la caratteristica più bassa tra quelle ammesse (così non si supera mai +5 senza volerlo).
  NIM.resolvePicks = function (classId, baseStats, target, picks) {
    const cls = NIM.CLASSES[classId];
    picks = picks || {};
    const cur = Object.assign({}, baseStats);
    const lowest = (opts, skip) => opts.filter((s) => s !== skip).sort((a, b) => cur[a] - cur[b])[0];
    return NIM.levelPlan(classId, target).map((p) => {
      const pk = picks[p.level] || {};
      const stat = [];
      if (p.keyInc || p.secInc) {
        const opts = p.keyInc ? cls.keyStats : NIM.STATS.filter((s) => !cls.keyStats.includes(s));
        stat.push(opts.includes(pk.s0) ? pk.s0 : lowest(opts));
      } else if (p.twoInc) {
        const a = NIM.STATS.includes(pk.s0) ? pk.s0 : lowest(cls.keyStats);
        const b = NIM.STATS.includes(pk.s1) ? pk.s1 : lowest(cls.keyStats.concat(NIM.STATS.filter((s) => !cls.keyStats.includes(s))), a);
        stat.push(a, b);
      }
      stat.forEach((s) => cur[s]++);
      return Object.assign({}, p, { stat, hp: p.avg });
    });
  };
  // Porta un personaggio appena creato (livello 1) al livello di partenza scelto.
  // o = { picks, sub, maxHP } — i PF di ogni livello sono la media del dado vita; maxHP (facoltativo) li sovrascrive.
  NIM.startAtLevel = function (c, target, o) {
    o = o || {};
    NIM.resolvePicks(c.classId, c.stats, target, o.picks).forEach((p) => {
      NIM.levelUp(c, { hp: p.hp, stat: p.stat, subclassId: p.pickSub ? o.sub || "" : "" });
    });
    let d = NIM.derive(c);
    if (o.maxHP && o.maxHP > 0 && o.maxHP !== d.maxHP) c.manual.hp = (c.manual.hp || 0) + (Math.round(o.maxHP) - d.maxHP);
    d = NIM.derive(c);
    c.hp = d.maxHP; c.hd = d.maxHD;
    return c;
  };

  /* ---------- esempio: Crush, Dragonborn Berserker (build del manuale) ---------- */
  NIM.makeCrush = function (lvl) {
    const c = NIM.newChar({ name: "Crush", classId: "berserker", ancestryId: "dragonborn", bgId: "", stats: { STR: 2, DEX: 2, INT: -1, WIL: 0 } });
    c.skillPts.might = 4;
    if (lvl >= 2) NIM.levelUp(c, { hp: 8, stat: [] });
    return c;
  };

  /* ---------- esempio: Florian (build del manuale) ---------- */
  NIM.makeFlorian = function (lvl) {
    const c = NIM.newChar({ name: "Florian", ancestryId: "human", bgId: "", stats: { STR: 2, DEX: 0, INT: 2, WIL: -1 } });
    c.skillPts.insight = 1; c.skillPts.might = 1; c.skillPts.perception = 2;
    if (lvl >= 2) {
      NIM.levelUp(c, { hp: 7, stat: [] });
      // +1 punto abilità e 1 punto spostato da Arcana (come nella build del manuale)
      c.skillPts.arcana = -1;
      c.skillPts.examination = 1;
      c.skillPts.perception = 3;
      c.choices["tactic-2"] = "tactic:inerrant-strike";
      NIM.addItem(c, "wooden-buckler", { equipped: true });
    }
    return c;
  };
})();
