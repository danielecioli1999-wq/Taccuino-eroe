/* UI: schermate principali. */
(function () {
  "use strict";
  const NIM = globalThis.NIM, UI = NIM.ui, V = UI.views, S = UI.S;
  const esc = UI.esc, fmt = NIM.fmt, card = UI.card, chip = UI.chip, sel = UI.sel;

  /* ---------- dettagli apribili con stato mantenuto ---------- */
  S.open = S.open || {};
  document.addEventListener("toggle", (e) => {
    const el = e.target;
    if (el.tagName === "DETAILS" && el.dataset.d) S.open[el.dataset.d] = el.open;
  }, true);
  const det = (id, summary, body, cls) => `<details class="det ${cls || ""}" data-d="${esc(id)}" ${S.open[id] ? "open" : ""}><summary>${summary}</summary><div class="detbody">${body}</div></details>`;
  UI.det = det;
  const para = (t) => String(t).split("\n").map((x) => `<p>${esc(x)}</p>`).join("");
  const SAVE_ICON = { adv: "▲", dis: "▼", neu: "●" };
  const SAVE_TXT = { adv: "vantaggio", dis: "svantaggio", neu: "neutra" };
  const PER = { enc: "1/scontro", safe: "per Safe Rest", round: "1/round", turn: "1/turno", fullhp: "fino a PF max" };

  /* ---------- header ---------- */
  V.header = (c, d) => `<header class="top">
    <button class="icon" data-act="open-chars" aria-label="I miei eroi">☰</button>
    <div class="who"><b>${esc(c.name)}</b><small>${esc(d.anc ? d.anc.name : "")} · ${esc(d.cls.name)}${d.sub ? " · " + esc(d.sub.name.replace("Champion of the ", "")) : ""} · Lv ${c.level}</small></div>
    <button class="hpmini ${c.hp <= 0 ? "dying" : ""}" data-act="tab" data-tab="combat" aria-label="Vai a Combat">${c.hp}<small>/${d.maxHP} PF</small></button>
  </header>`;

  /* ---------- SCHEDA ---------- */
  const ancOpts = ["Common", "Uncommon", "Exotic"].map((t) => ({ group: t, items: NIM.ANCESTRIES.filter((a) => a.tier === t).map((a) => ({ v: a.id, t: a.name })) }));
  const bgOpts = [{ v: "", t: "— nessuno —" }].concat(NIM.BACKGROUNDS.map((b) => ({ v: b.id, t: b.name })));

  function identityCard(c, d) {
    const edit = S.edit;
    const a = d.anc, bg = d.bg;
    let h = `<div class="idrow"><div><h1>${esc(c.name)}</h1><p class="muted">${esc(a ? a.name : "—")} (${esc(d.size)}) · ${esc(d.cls.name)}${d.sub ? " · " + esc(d.sub.name) : ""}</p></div>
      <button class="btn ghost" data-act="edit-toggle">${edit ? "Fine" : "Modifica"}</button></div>`;
    if (edit) {
      h += `<div class="form">
        <label>Nome<input data-bind="name" data-silent value="${esc(c.name)}"></label>
        <label>Ancestry${sel("ancestryId", ancOpts, c.ancestryId)}</label>`;
      if (a && a.choice) {
        const ch = a.choice;
        let o = [];
        if (ch.type === "skill") o = [{ v: "", t: "— scegli —" }].concat(NIM.SKILLS.map((s) => ({ v: s.id, t: s.name })));
        else if (ch.type === "save") o = [{ v: "", t: "— scegli —" }].concat(NIM.STATS.filter((s) => d.cls.saves[s] === "neu").map((s) => ({ v: s, t: s })));
        else o = [{ v: "", t: "— scegli —" }, { v: "Small", t: "Small" }, { v: "Medium", t: "Medium" }];
        h += `<label>${esc(ch.label)}${sel("ancChoice", o, c.ancChoice)}</label>`;
      }
      h += `<label>Background${sel("bgId", bgOpts, c.bgId)}</label>`;
      if (bg && bg.options) h += `<label>Opzione${sel("bgOption", bg.options.map((o, i) => ({ v: i, t: o.name })), c.bgOption || 0, 'data-type="num"')}</label>`;
      if (bg && bg.textOption) h += `<label>${esc(bg.textOption)}<input data-bind="bgText" data-silent value="${esc(c.bgText)}"></label>`;
      h += `<label>Motivazione<input list="motivs" data-bind="motivation" data-silent value="${esc(c.motivation)}" placeholder="Perché avventuri? (scegli o scrivi)"></label>
        <datalist id="motivs">${NIM.MOTIVATIONS.map((m) => `<option value="${esc(m)}">`).join("")}</datalist></div>`;
    } else if (c.motivation) h += `<p class="quote">“${esc(c.motivation)}”</p>`;
    if (a) h += det("anc-" + a.id, `<b>${esc(a.trait)}</b> <span class="muted">· ${esc(a.name)}</span>`, para(a.text));
    if (bg) {
      const o = bg.options ? bg.options[c.bgOption || 0] : null;
      h += det("bg-" + bg.id, `<b>${esc(bg.name)}</b> <span class="muted">· Background${c.bgText && bg.textOption ? " (" + esc(c.bgText) + ")" : ""}</span>`, para(bg.text) + (o ? `<p><b>${esc(o.name)}</b> ${esc(o.text)}</p>` : ""));
    }
    return card("", h, "identity");
  }

  function statsCard(c, d) {
    const edit = S.edit;
    const tiles = NIM.STATS.map((s) => {
      const key = d.cls.keyStats.includes(s);
      const sv = d.saves[s];
      return `<div class="stat ${key ? "key" : ""}">
        <small>${s}${key ? " ★" : ""}</small><b>${fmt(d.stats[s])}</b>
        <span class="save ${sv.state}" title="Salvezza ${SAVE_TXT[sv.state]}">${SAVE_ICON[sv.state]} Save ${fmt(sv.val)}</span>
        ${edit ? `<div class="mini"><span>base</span>${UI.stepper("stat-step", { stat: s }, c.stats[s])}<span>mod.</span>${UI.stepper("statmod-step", { stat: s }, c.statMod[s] || 0)}${d.statIncs[s] ? `<span class="muted">+${d.statIncs[s]} dai livelli</span>` : ""}</div>` : ""}
      </div>`;
    }).join("");
    const dc = d.keyDC.map((k) => `${k.stat} ${k.dc}`).join(" / ");
    const manualRows = edit ? `<div class="form manual"><h3>Modificatori manuali (oggetti, GM…)</h3>${[["defense", "Defense"], ["init", "Initiative"], ["speed", "Speed"], ["hd", "Dadi Vita max"], ["wounds", "Ferite max"]].map(([k, l]) => `<div class="mrow"><span>${l}</span>${UI.stepper("manual-step", { k }, c.manual[k] || 0)}</div>`).join("")}</div>` : "";
    return card("Caratteristiche e salvezze", `<div class="stats4">${tiles}</div>
      <p class="muted small">▲ vantaggio · ▼ svantaggio · ● neutra. DC dei tuoi effetti = 10 + KEY: <b>${dc}</b>. Massimo normale di una caratteristica: +5.</p>${manualRows}`);
  }

  function derivedCard(c, d) {
    const kv = (l, v, act, extra) => `<${act ? 'button data-act="' + act + '"' : "div"} class="kv ${extra || ""}"><small>${l}</small><b>${v}</b></${act ? "button" : "div"}>`;
    return card("Valori derivati", `<div class="grid3">
      ${kv("PF max ✎", d.maxHP, "open-maxhp", "tap")}
      ${kv("Defense", d.defense, "show-defense", "tap")}
      ${kv("Initiative", fmt(d.initiative) + (d.initAdv ? " ▲" : ""))}
      ${kv("Speed", d.speed)}
      ${kv("Taglia", esc(d.size))}
      ${kv("Dadi Vita", d.maxHD + "d" + d.hdSize)}
      ${kv("Ferite max", d.maxWounds)}
      ${kv("Slot zaino", d.slotsUsed + "/" + d.slotsCap, "tab-zaino", "tap " + (d.slotsUsed > d.slotsCap ? "warn" : ""))}
      ${kv("Salita livello", d.lvl + "/20", "tab-classe", "tap")}
    </div>`);
  }

  function skillsCard(c, d) {
    const showEdit = S.edit || d.skillLeft !== 0;
    const rows = d.skills.map((s) => `<div class="skill">
      <span class="sname"><span>${s.name} <small>${s.stat}</small></span></span>
      <span class="val">${fmt(s.total)}${s.raw > 10 ? ' <small title="Massimo +10">max</small>' : ""}</span>
      ${showEdit ? `<span class="sedit">${UI.stepper("skill-step", { id: s.id }, (s.pts >= 0 ? "+" : "−") + Math.abs(s.pts), { minDisabled: s.raw - 1 < 0 })}</span>` : ""}
    </div>`).join("");
    const banner = d.skillLeft > 0 ? `<div class="banner warn">Hai ancora <b>${d.skillLeft}</b> punti abilità da assegnare (usa + e −).</div>`
      : d.skillLeft < 0 ? `<div class="banner bad">Hai assegnato <b>${-d.skillLeft}</b> punti in più del consentito (budget ${d.skillBudget}).</div>` : "";
    return card("Abilità", `${banner}<div class="skills">${rows}</div>
      <p class="muted small">Il valore è il bonus da sommare al d20. Punti da assegnare: ${d.skillBudget} totali (4 al livello 1, +1 a livello). Ad ogni level up puoi spostare 1 punto da un’abilità a un’altra (l’abilità non può scendere sotto 0). Bonus massimo: +10.
      ${showEdit ? "" : ' <span>Per riassegnare i punti premi “Modifica” in alto.</span>'}</p>`);
  }

  function languagesCard(c, d) {
    return card("Lingue", `<p>Common${d.langAnc ? ", " + esc(d.langAnc) + " <span class='muted'>(Ancestry)</span>" : ""} · lingue extra da INT: <b>${d.langExtra}</b></p>
      <label class="form"><input data-bind="languages" data-silent value="${esc(c.languages)}" placeholder="Altre lingue scelte (es. Elvish, Goblin)"></label>`);
  }

  V.scheda = (c, d) => identityCard(c, d) + statsCard(c, d) + derivedCard(c, d) + skillsCard(c, d) + languagesCard(c, d);

  /* ---------- COMBAT ---------- */
  function vitalsCard(c, d) {
    const pct = Math.max(0, Math.min(100, (c.hp / d.maxHP) * 100));
    let b = "";
    if (d.dead) b += `<div class="banner bad"><b>Morto</b>: ${c.wounds} Ferite su ${d.maxWounds}. Esistono modi per rianimare un eroe, ma sono rari e costosi.</div>`;
    else if (d.dying) {
      const sv = d.saves.STR;
      const wn = (n) => n + (n === 1 ? " Ferita" : " Ferite");
      b += `<div class="banner bad"><b>DYING</b> — max ${d.dyingActions} ${d.dyingActions === 1 ? "azione" : "azioni"}, Concentration finita. ${d.dyingNoSave ? "Enduring Rage: puoi attaccare senza STR save." : `Se attacchi: 1 Ferita salvo STR save DC 10 (tuo bonus ${fmt(sv.val)}${sv.state === "adv" ? " ▲" : sv.state === "dis" ? " ▼" : ""}).`} Se subisci danno: ${wn(d.dyingWounds.normal)} (critico: ${d.dyingWounds.crit}).
      ${d.dyingNoSave ? "" : '<button class="btn small" data-act="dying-fail">Save fallito: +1 Ferita</button>'}</div>`;
    }
    else if (d.bloodied) b += `<div class="banner warn"><b>Bloodied</b> (metà PF o meno).</div>`;
    const pips = Array.from({ length: d.maxWounds }, (_, i) => `<button class="pip ${i < c.wounds ? "on" : ""}" data-act="wound-set" data-n="${i + 1}" aria-label="Ferita ${i + 1}"></button>`).join("");
    return card("Punti ferita", `${b}
      <div class="hpbar ${d.bloodied ? "bl" : ""} ${d.dying ? "dy" : ""}"><i style="width:${pct}%"></i><span>${c.hp} / ${d.maxHP}${c.tmp ? ` <em>+${c.tmp} temp</em>` : ""}</span></div>
      <div class="btnrow"><button class="btn danger" data-act="open-dmg">Subisci danno</button><button class="btn good" data-act="open-heal">Cura / PF temp</button></div>
      <div class="row between"><span class="lbl">Ferite <small class="muted">(${c.wounds}/${d.maxWounds}, a ${d.maxWounds} muori)</small></span><span class="pips">${pips}</span></div>
      <div class="row between"><span class="lbl">Dadi Vita <b>${c.hd}/${d.maxHD}</b> <small class="muted">d${d.hdSize}</small></span>
        ${UI.stepper("hd-step", {}, c.hd, { minDisabled: c.hd <= 0, maxDisabled: c.hd >= d.maxHD })}<button class="btn" data-act="open-rest">Riposo</button></div>`);
  }

  function turnCard(c, d) {
    const cb = c.combat;
    const cap = d.dying ? d.dyingActions : 3;
    const left = Math.min(cb.actions, cap);
    const react = [["defend", "Defend"], ["interpose", "Interpose"], ["oa", "Opportunity Attack"], ["help", "Help"]];
    const pips = [1, 2, 3].map((i) => `<button class="apip ${i <= left ? "on" : ""}" data-act="action-pip" data-n="${i}" ${i > cap ? "disabled" : ""} aria-label="${i <= left ? "Spendi un’azione" : "Recupera un’azione"}">${i}</button>`).join("");
    return card("Turno e azioni", `
      <div class="row between"><span class="lbl">Round <b>${cb.round}</b> ${cb.active ? chip("scontro attivo", "good") : chip("fuori combattimento")}</span></div>
      <div class="row between"><span class="lbl">Azioni rimaste: <b>${left}</b>${d.dying ? ` <small class="muted">(Dying: max ${d.dyingActions})</small>` : ""}</span><span class="pips">${pips}</span></div>
      <p class="muted small">Tocca un’azione piena per spenderla, una vuota per recuperarla.</p>
      <div class="chips">${react.map(([k, l]) => `<button class="chip toggle ${cb.react[k] ? "spent" : ""}" data-act="react-toggle" data-k="${k}">${l}${cb.react[k] ? " ✕" : ""}</button>`).join("")}</div>
      <p class="muted small">Toccando Defend, Interpose, Opportunity Attack o Help si spende 1 azione (tocca di nuovo per annullare). Ognuna si può usare 1/round e si rigenera a fine turno.</p>
      <div class="btnrow wrap">
        <button class="btn ${cb.active ? "" : "primary"}" data-act="new-enc">Inizia scontro</button>
        <button class="btn" data-act="end-turn">Fine turno</button>
        <button class="btn ghost" data-act="end-enc">Fine scontro</button>
      </div>`);
  }

  function resourcesCard(c, d) {
    if (c.level < 2 && !d.isSB) return "";
    let h = "";
    if (d.maxDice > 0) {
      const dice = Array.from({ length: Math.max(d.maxDice, c.combat.dice) }, (_, i) => `<i class="cdie ${i < c.combat.dice ? "on" : ""}">d${d.diceSize}</i>`).join("");
      h += `<div class="row between"><span class="lbl">Combat Dice <b>${c.combat.dice}/${d.maxDice}</b> <small class="muted">d${d.diceSize}${d.diceAdv ? " con vantaggio" : ""}</small></span>${UI.stepper("cdice-step", {}, c.combat.dice, { minDisabled: c.combat.dice <= 0 })}</div>
        <div class="cdice">${dice}</div>
        <p class="muted small">Li ottieni all’inizio dello scontro (STR${d.diceBonus ? " + " + d.diceBonus : ""}) e si perdono a fine scontro. Usa − per segnare un dado speso.</p>`;
    }
    if (d.isSB) {
      h += `<div class="row between"><span class="lbl">Mana <b>${c.mana}/${d.maxMana}</b> <small class="muted">(INT, si perde a fine scontro)</small></span>${UI.stepper("mana-step", {}, c.mana, { minDisabled: c.mana <= 0 })}</div>`;
    }
    return h ? card("Risorse di classe", h) : "";
  }

  function attacksCard(c, d) {
    const rows = d.attacks.map((a) => {
      const props = a.props.map((p) => `<span class="chip tiny">${esc(p)}</span>`).join("");
      return `<div class="atk"><div class="atxt"><b>${esc(a.name)}</b><small>${a.n}d${a.die}${a.mod ? fmt(a.mod) : ""} ${esc(a.dtype)} <span class="muted">(${a.stat})</span></small><div class="chips tight">${props}${a.noCrit ? '<span class="chip tiny bad">no crit</span>' : ""}${a.fury ? `<span class="chip tiny good">+${a.fury} Fury Dice (d${d.furySize})</span>` : ""}</div></div>
        </div>`;
    }).join("");
    const w = d.warnings.length ? `<div class="banner warn">${d.warnings.map(esc).join("<br>")}</div>` : "";
    return card("Attacchi", `${rows}${w}<p class="muted small">Per equipaggiare o togliere armi usa lo Zaino.</p>`);
  }

  function tacticsCard(c, d) {
    if (!d.tactics.length) return "";
    const rows = d.tactics.map((id) => {
      const t = d.cls.tactics.concat(d.cls.extraTactics).find((x) => x.id === id);
      if (!t) return "";
      return `<div class="atk"><div class="atxt"><b>${esc(t.name)}</b> <span class="chip tiny">${esc(t.cost)}</span><small>${esc(t.text)}</small></div>
        <button class="btn" data-act="tactic-use" data-id="${t.id}" ${c.combat.dice <= 0 ? "disabled" : ""}>Usa</button></div>`;
    }).join("");
    return card("Combat Tactics", `${rows}<p class="muted small">Quando attacchi puoi spendere un Combat Die per usare una Combat Tactic (max 1 per attacco). “Usa” segna un Combat Die speso: tira il dado e applica l’effetto.</p>`);
  }

  function usesCard(c, d) {
    const rows = d.uses.map((u) => {
      const used = Math.min(u.max, c.used[u.key] || 0);
      const left = u.max - used;
      const pips = u.max <= 8 ? Array.from({ length: u.max }, (_, i) => `<button class="upip ${i < left ? "on" : ""}" data-act="use-pip" data-key="${u.key}" data-max="${u.max}" data-on="${i < left ? 1 : 0}" aria-label="${esc(u.label)}"></button>`).join("")
        : `${UI.stepper("use-step", { key: u.key }, left, { minDisabled: left <= 0, maxDisabled: left >= u.max })}`;
      return `<div class="use"><div class="utxt"><b>${esc(u.label)}</b><small class="muted">${PER[u.per] || ""} · ${esc(u.src || "")}</small></div><span class="pips">${u.max === 0 ? '<span class="muted small">nessun uso</span>' : pips}</span></div>`;
    }).join("");
    return card("Usi delle abilità", `${rows}<p class="muted small">“Fine turno”, “Inizia scontro” e “Riposo (Safe Rest)” ripristinano automaticamente quelli che si rigenerano.</p>`);
  }

  function condsCard(c, d) {
    const active = c.combat.conds;
    const list = NIM.CONDITIONS.filter((x) => x.id !== "dying");
    const info = active.map((id) => { const x = NIM.CONDITIONS.find((k) => k.id === id); return x ? `<p><b>${esc(x.name)}.</b> ${esc(x.text)}</p>` : ""; }).join("");
    return card("Condizioni", `<div class="chips">${list.map((x) => `<button class="chip toggle ${active.includes(x.id) ? "on" : ""}" data-act="cond-toggle" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>${info ? `<div class="condinfo">${info}</div>` : '<p class="muted small">Tocca per attivare/disattivare. Dying è automatico a 0 PF.</p>'}`);
  }

  function rageCard(c, d) {
    if (d.cls.id !== "berserker") return "";
    const cb = c.combat;
    const deathless = d.arsenal.includes("deathless-rage") && d.dying;
    return card("Rage e Fury Dice", `
      <div class="row between"><span class="lbl">Fury Dice <b>${c.fury}/${d.furyMax}</b> <small class="muted">d${d.furySize}</small> ${cb.raging ? chip("in Rage", "good") : ""}</span>${UI.stepper("fury-step", {}, c.fury, { minDisabled: c.fury <= 0, maxDisabled: c.fury >= d.furyMax })}</div>
      ${deathless ? `<div class="btnrow"><button class="btn danger" data-act="deathless" ${(c.used.deathless || 0) >= 1 ? "disabled" : ""}>Deathless Rage: +1 Ferita → +1 azione, +1 Fury Die</button></div>` : ""}
      <p class="muted small">Usa + e − per aggiungere o togliere Fury Dice (a 0 la Rage finisce). “That all you got?!” è in <i>Subisci danno</i>.</p>`);
  }

  function arsenalCard(c, d) {
    if (!d.arsenal || !d.arsenal.length) return "";
    const rows = d.arsenal.map((id) => d.cls.arsenal.find((x) => x.id === id)).filter(Boolean).map((a) => {
      const n = /^(\d) Action/.exec(a.cost);
      return `<div class="atk"><div class="atxt"><b>${esc(a.name)}</b> <span class="chip tiny">${esc(a.cost)}</span><small>${esc(a.text)}</small></div>
        ${n ? `<button class="btn" data-act="spend-actions" data-n="${n[1]}" data-label="${esc(a.name)}">Usa</button>` : ""}</div>`;
    }).join("");
    return card("Savage Arsenal", rows);
  }

  function muscleCard(c, d) {
    if (!d.mm) return "";
    const rows = d.cls.muscleSpells.map((sp) => {
      const req = Math.max(0, sp.req - d.fdReq);
      const n = +/^(\d)/.exec(sp.cost)[1];
      const used = sp.once && (c.used["ms-" + sp.id] || 0) > 0;
      const ok = c.fury >= req && !used;
      return `<div class="atk"><div class="atxt"><b>${esc(sp.name)}</b> <span class="chip tiny">REQ ${req} FD</span> <span class="chip tiny">${esc(sp.cost)}</span><small>${esc(sp.text.replace(/\n/g, " "))}</small></div>
        <button class="btn" data-act="spell-cast" data-id="${sp.id}" ${ok ? "" : "disabled"}>${used ? "Usato" : "Lancia"}</button></div>`;
    }).join("");
    return card("Muscle Spells", `<p class="muted small">FD (Fury Dice attuali): <b>${c.fury}</b> · STR ${fmt(d.stats.STR)}. I Fury Dice non si spendono per lanciare: servono solo come requisito.</p>${rows}`);
  }

  V.combat = (c, d) => vitalsCard(c, d) + turnCard(c, d) + rageCard(c, d) + muscleCard(c, d) + arsenalCard(c, d) + resourcesCard(c, d) + attacksCard(c, d) + tacticsCard(c, d) + usesCard(c, d) + condsCard(c, d);

  /* ---------- CLASSE ---------- */
  function optionSelect(c, d, slot) {
    const cur = d.choices[slot.id] || "";
    if (slot.auto) return `<div class="auto">+1 max Combat Die <span class="muted">(Single-minded Fighter)</span></div>`;
    const taken = Object.entries(d.choices).filter(([k, v]) => k !== slot.id && v !== "die").map(([, v]) => v);
    const opts = NIM.optionsFor(c, slot, taken);
    const groups = [];
    opts.forEach((o) => {
      let g = groups.find((x) => x.group === o.group);
      if (!g) groups.push((g = { group: o.group, items: [] }));
      g.items.push({ v: o.id, t: o.name + (o.cost && o.cost !== "Passive" ? " (" + o.cost + ")" : "") });
    });
    const sl = sel("choices." + slot.id, [{ v: "", t: "— da scegliere —" }].concat(groups), cur);
    const o = opts.find((x) => x.id === cur);
    return `${sl}${o ? `<p class="optinfo">${esc(o.text)}</p>` : ""}`;
  }

  V.classe = (c, d) => {
    const cls = d.cls;
    const info = NIM.levelUpInfo(c);
    let h = `<div class="row between"><div><h1>${esc(cls.name)}</h1><p class="muted">${esc(cls.blurb)}</p></div></div>
      <div class="grid3 small">
        <div class="kv"><small>Key Stats</small><b>${cls.keyStats.join(" · ")}</b></div>
        <div class="kv"><small>Hit Die</small><b>d${cls.hitDie}</b></div>
        <div class="kv"><small>PF iniziali</small><b>${cls.startHP}</b></div>
      </div><p class="muted small">Salvezze: ${NIM.STATS.filter((x) => cls.saves[x] !== "neu").map((x) => x + (cls.saves[x] === "adv" ? " ▲" : " ▼")).join(", ")} · Armature: ${esc(cls.armorText)} · Armi: ${esc(cls.weaponsText)}</p>`;
    let out = card("", h);

    out += card("Livello " + c.level + " / 20", `<div class="btnrow wrap">${c.level < 20 ? `<button class="btn primary" data-act="open-levelup">Sali al livello ${c.level + 1}</button>` : '<span class="chip good">Livello massimo</span>'}${c.level > 1 ? '<button class="btn ghost" data-act="levelup-undo">Annulla ultimo livello</button>' : ""}</div>
      <p class="muted small">Il level up apre una guida: PF, aumento di caratteristica, nuove capacità e sottoclasse. Il GM decide quando sali (di solito durante un Safe Rest).</p>`);

    // sottoclasse
    if (c.level >= 3) {
      const so = [{ v: "", t: "— scegli la sottoclasse —" }].concat(cls.subclasses.map((s) => ({ v: s.id, t: s.name })));
      out += card("Sottoclasse", `<label class="form">${sel("subclassId", so, c.subclassId)}</label>${d.sub ? `<p class="muted">${esc(d.sub.tagline)}</p>` : ""}`);
    } else out += card("Sottoclasse", `<p class="muted">Si sceglie al livello 3.</p>`);

    // scelte
    if (d.slots.length) {
      const rows = d.slots.map((s) => {
        const missing = !d.choices[s.id];
        return `<div class="slot ${missing ? "need" : ""}"><div class="slabel"><b>${esc(s.label)}</b> <span class="chip tiny">Lv ${s.level}</span>${missing ? ' <span class="chip tiny warn">da scegliere</span>' : ""}</div>${optionSelect(c, d, s)}</div>`;
      }).join("");
      const m14 = cls.masteries && c.level >= 14 && !d.isSB ? `<div class="slot"><div class="slabel"><b>Weapon Mastery (3)</b> <span class="chip tiny">Lv 14</span></div><div class="auto">Maestria completa: tutti i tipi di arma.</div></div>` : "";
      out += card("Le tue scelte", `${d.isSB ? '<p class="muted small">Spellblade: al posto di Combat Tactics e Weapon Mastery scegli un altro Commander’s Order oppure un incantesimo di tier 1 o inferiore.</p>' : ""}${rows}${m14}
        <p class="muted small"><b>Rigorous Training.</b> Durante un Safe Rest in cui ti addestri con il gruppo o altri soldati puoi cambiare queste scelte: modificale qui quando vuoi.</p>`);
    }

    // abilità attive: orders, mastery (testo)
    const orders = d.orders.map((id) => d.cls.orders.find((o) => o.id === id)).filter(Boolean);
    if (orders.length) out += card("Commander’s Orders", orders.map((o) => det("ord-" + o.id, `<b>${esc(o.name)}</b> <span class="chip tiny">${esc(o.cost)}</span>`, para(NIM.orderText(o, d.isSB)))).join(""));
    if (d.masteries.length) out += card("Weapon Mastery", d.masteries.map((id) => d.cls.masteries.find((m) => m.id === id)).filter(Boolean).map((m) => det("mas-" + m.id, `<b>${esc(m.name)}</b>`, para(m.text))).join(""));
    if (d.isSB) {
      const sp = d.spells.map((id) => NIM.SPELL_BY_ID[id]).filter(Boolean);
      out += card("Incantesimi (Spellblade)", `<p class="muted small">Mana: <b>${c.mana}/${d.maxMana}</b> (INT, ottenuto all’inizio dello scontro). Costo = Tier; i cantrip sono gratis. Spellforge: all’iniziativa puoi lanciare Enchant Weapon gratis.</p>` +
        (sp.length ? sp.map((s) => spellDet(s, d)).join("") : '<p class="muted">Nessun incantesimo scelto ancora (vedi “Le tue scelte”).</p>'));
    }

    if (d.arsenal && d.arsenal.length) out += card("Savage Arsenal", d.arsenal.map((id) => cls.arsenal.find((x) => x.id === id)).filter(Boolean).map((a) => det("sa-" + a.id, `<b>${esc(a.name)}</b> <span class="chip tiny">${esc(a.cost)}</span>`, para(a.text))).join(""));
    if (d.mm) out += card("Muscle Spells", `<p class="muted small">Si lanciano se hai almeno il numero di Fury Dice richiesto (REQ). FD = i tuoi Fury Dice.</p>` + cls.muscleSpells.map((sp) => det("ms-" + sp.id, `<b>${esc(sp.name)}</b> <span class="chip tiny">REQ ${Math.max(0, sp.req - d.fdReq)} FD</span> <span class="chip tiny">${esc(sp.cost)}</span>`, para(sp.text))).join(""));

    // capacità di classe già ottenute
    const shown = (f) => !(f.replacedBy && f.replacedBy === d.subId);
    const got = cls.features.filter((f) => f.level <= c.level && shown(f));
    out += card("Capacità di classe", got.map((f) => det("feat-" + f.level + f.name, `<b>${esc(f.name)}</b> <span class="chip tiny">Lv ${f.level}</span>`, para(f.text))).join(""));

    // capacità sottoclasse
    if (d.sub) {
      const sf = d.sub.features.filter((f) => f.level <= c.level);
      out += card(esc(d.sub.name), `<p class="muted small">${esc(d.sub.tagline)}</p>` + sf.map((f) => f.items.map(([n, t]) => det("sf-" + d.sub.id + f.level + n, `<b>${esc(n)}</b> <span class="chip tiny">Lv ${f.level}</span>`, para(t))).join("")).join(""));
    }

    // prossimi livelli
    const next = cls.features.filter((f) => f.level > c.level && shown(f));
    if (next.length) out += card("Prossimi livelli", det("nextlv", "Mostra le capacità future", next.map((f) => `<p><span class="chip tiny">Lv ${f.level}</span> <b>${esc(f.name)}.</b> ${esc(f.text)}</p>`).join("")));

    return out;
  };

  function spellDet(s, d) {
    const sc = NIM.SCHOOLS[s.school][0];
    return det("sp-" + s.id, `<b>${esc(s.name)}</b> <span class="chip tiny school-${s.school}">${sc}</span> <span class="chip tiny">${s.utility ? "Utility" : s.tier === 0 ? "Cantrip" : "Tier " + s.tier}</span> <span class="muted small">${esc(s.cost)}</span>`,
      `<p>${esc(s.text)}</p>${s.up ? `<p><b>Upcast:</b> ${esc(s.up)}</p>` : ""}${s.high ? `<p><b>High Levels:</b> ${esc(s.high)}</p>` : ""}`);
  }
  UI.spellDet = spellDet;

  /* ---------- ZAINO ---------- */
  const KIND_ORDER = [["weapon", "Armi"], ["armor", "Armature"], ["shield", "Scudi"], ["potion", "Pozioni"], ["misc", "Equipaggiamento"]];
  function itemRow(c, d, inst, idx) {
    const it = d.inv[idx];
    let detail = "";
    if (it.kind === "weapon") {
      const mod = d.stats[it.stat] + (it.bonus || 0);
      detail = `${it.n}d${it.die}${mod ? fmt(mod) : ""} ${esc(it.dtype)} (${it.stat}) · ${(it.props || []).map(esc).join(", ") || "—"}`;
    } else if (it.kind === "armor") {
      detail = `Defense ${it.base}${it.dex ? "+DEX" : ""}${it.maxDex ? " (DEX max " + it.maxDex + ")" : ""} · ${esc(it.armor)}${it.req ? " · Req. STR " + it.req : ""}`;
    } else if (it.kind === "shield") detail = `Defense +${it.def}${it.req ? " · Req. STR " + it.req : ""}`;
    else detail = esc(it.text || "");
    if (it.notes) detail += (detail ? " · " : "") + `<i>${esc(it.notes)}</i>`;
    const canEquip = ["weapon", "armor", "shield"].includes(it.kind);
    return `<div class="item ${it.equipped ? "eq" : ""}">
      ${canEquip ? `<label class="eqbox" title="Equipaggiato"><input type="checkbox" data-bind="items.${idx}.equipped" ${it.equipped ? "checked" : ""}><span></span></label>` : '<span class="eqbox none"></span>'}
      <div class="itxt"><b>${esc(it.name)}</b><small>${detail}</small></div>
      ${it.heal ? `<button class="btn small" data-act="potion" data-idx="${idx}">Usa</button>` : ""}
      ${UI.stepper("qty-step", { idx }, inst.qty || 1, { minDisabled: false })}
      <button class="icon small" data-act="item-edit" data-idx="${idx}" aria-label="Modifica oggetto">⋯</button>
    </div>`;
  }

  V.zaino = (c, d) => {
    const over = d.slotsUsed > d.slotsCap;
    const pct = Math.min(100, (d.slotsUsed / d.slotsCap) * 100);
    let h = `<div class="hpbar slots ${over ? "dy" : ""}"><i style="width:${pct}%"></i><span>Slot ${d.slotsUsed} / ${d.slotsCap}${d.goldSlots ? ` <em>(monete: ${d.goldSlots})</em>` : ""}</span></div>
      <div class="money"><label>Oro (gp)<input type="number" inputmode="numeric" min="0" data-bind="gp" data-type="num" value="${c.gp}"></label><label>Argento (sp)<input type="number" inputmode="numeric" min="0" data-bind="sp" data-type="num" value="${c.sp}"></label></div>
      <p class="muted small">10 sp = 1 gp. 500 gp occupano 1 slot. Capienza = 10 + STR. 1 slot: arma a una mano, scudo, armatura indossata, pila di giavellotti, 2 pozioni. 2 slot: arma a due mani, armatura non indossata.</p>`;
    let out = card("Zaino", h);
    if (d.warnings.length) out += `<div class="banner warn">${d.warnings.map(esc).join("<br>")}</div>`;
    out += card("In sintesi", `<div class="grid3 small"><div class="kv"><small>Defense</small><b>${d.defense}</b></div><div class="kv"><small>Armatura</small><b class="sm">${esc(d.armorItem ? d.armorItem.name : "nessuna")}</b></div><div class="kv"><small>Scudo</small><b class="sm">${esc(d.shieldItem ? d.shieldItem.name : "nessuno")}</b></div></div>`);
    KIND_ORDER.forEach(([k, label]) => {
      const rows = c.items.map((inst, i) => [inst, i]).filter(([, i]) => {
        const it = d.inv[i];
        const kind = it.kind === "misc" && it.heal ? "potion" : it.kind;
        return kind === k;
      });
      if (rows.length) out += card(label, rows.map(([inst, i]) => itemRow(c, d, inst, i)).join(""));
    });
    out += `<div class="btnrow wrap pad"><button class="btn primary" data-act="open-additem">+ Aggiungi dal catalogo</button><button class="btn" data-act="open-customitem">+ Oggetto personalizzato</button></div>`;
    return out;
  };

  /* ---------- ALTRO ---------- */
  const LICENSE_TXT = "Taccuino dell’Eroe is an independent product published under the Nimble 3rd Party Creator License. Nimble TTRPG © Nimble Co.";
  const SRD_TXT = "This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.";
  UI.LICENSE_TXT = LICENSE_TXT;

  function grimoire() {
    const schools = Object.entries(NIM.SCHOOLS);
    const list = NIM.SPELLS.slice().sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name)).map((s) =>
      `<div class="gsp" data-name="${esc(s.name.toLowerCase())}" data-school="${s.school}" data-tier="${s.utility ? "u" : s.tier}">${spellDet(s)}</div>`).join("");
    return `<div class="gfilters"><input id="gq" placeholder="Cerca incantesimo…" data-live="grim">
      <select id="gs" data-live="grim"><option value="">Tutte le scuole</option>${schools.map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join("")}</select>
      <select id="gt" data-live="grim"><option value="">Tutti i tier</option><option value="0">Cantrip</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<option value="${n}">Tier ${n}</option>`).join("")}<option value="u">Utility</option></select></div>
      <p class="muted small">${esc(NIM.MAGIC_RULES)}</p><div id="glist">${list}</div>`;
  }
  UI.live.grim = function () {
    const q = (document.getElementById("gq").value || "").toLowerCase().trim();
    const sc = document.getElementById("gs").value, t = document.getElementById("gt").value;
    document.querySelectorAll("#glist .gsp").forEach((el) => {
      const ok = (!q || el.dataset.name.includes(q)) && (!sc || el.dataset.school === sc) && (t === "" || el.dataset.tier === t);
      el.hidden = !ok;
    });
  };

  // Selettore lingua (non tradotto di proposito: ognuno deve poterlo riconoscere)
  UI.langBox = () => `<section class="card"><h2>Lingua / Language</h2><div class="btnrow"><button class="btn ${NIM.i18n.lang === "it" ? "primary" : ""}" data-act="lang" data-lang="it">Italiano</button><button class="btn ${NIM.i18n.lang === "en" ? "primary" : ""}" data-act="lang" data-lang="en">English</button></div></section>`;

  V.altro = (c, d) => {
    let out = UI.langBox() + card("Note", `<label class="form"><textarea rows="6" data-bind="notes" data-silent placeholder="Appunti di sessione, PNG, missioni…">${esc(c.notes)}</textarea></label>`);
    if (c.level >= 19) out += card("Epic Boon", `<label class="form"><input data-bind="boon" data-silent value="${esc(c.boon)}" placeholder="Epic Boon scelto (GM’s Guide, pag. 75)"></label>`);
    out += card("Regole rapide", NIM.RULES.map(([t, x]) => det("rule-" + t, `<b>${esc(t)}</b>`, para(x))).join(""));
    out += card("Condizioni", NIM.CONDITIONS.map((x) => det("cond-" + x.id, `<b>${esc(x.name)}</b>`, para(x.text))).join(""));
    out += card("Grimorio (tutti gli incantesimi)", grimoire());
    out += card("Equipaggiamento: proprietà armi", Object.entries(NIM.WEAPON_PROP_HELP).map(([k, v]) => `<p><b>${esc(k)}.</b> ${esc(v)}</p>`).join(""));
    out += card("Eroi e backup", `<div class="btnrow wrap"><button class="btn" data-act="open-chars">I miei eroi</button><button class="btn" data-act="char-export">Esporta questo eroe</button><button class="btn" data-act="export-all">Esporta tutto</button><button class="btn" data-act="import-open">Importa file</button></div>
      <div class="btnrow wrap" style="margin-top:8px"><button class="btn ghost" data-act="copy-backup">Copia backup (testo)</button><button class="btn ghost" data-act="paste-open">Incolla backup</button></div>
      <p class="muted small">I dati restano <b>solo su questo dispositivo</b> (nel browser/app). Se cambi telefono o cancelli i dati del sito, li perdi: esporta ogni tanto un file di backup e salvalo altrove.</p>`);
    out += card("Informazioni", `<p><b>Taccuino dell’Eroe</b> — scheda personaggio non ufficiale per Nimble. Gratuita, senza account, funziona offline.</p><p class="small">${esc(LICENSE_TXT)}</p><p class="small muted">${esc(SRD_TXT)}</p><p class="small muted">Se ti piace Nimble, sostieni il gioco acquistando i contenuti ufficiali su nimbleRPG.com. Questa app non usa arte o logo di Nimble e non è un prodotto ufficiale né approvato da Nimble Co.</p>`);
    return out;
  };

  /* ---------- LISTA EROI ---------- */
  V.chars = () => {
    const chars = Object.values(S.db.chars).sort((a, b) => b.updated - a.updated);
    const rows = chars.map((c) => {
      const anc = NIM.ANCESTRIES.find((a) => a.id === c.ancestryId);
      const cls = NIM.CLASSES[c.classId];
      return `<div class="charrow ${c.id === S.db.activeId ? "active" : ""}"><button class="open" data-act="char-open" data-id="${c.id}"><b>${esc(c.name)}</b><small>${esc(anc ? anc.name : "")} · ${esc(cls.name)} · Lv ${c.level}</small></button>
        <button class="icon small" data-act="char-menu" data-id="${c.id}" aria-label="Opzioni">⋯</button></div>`;
    }).join("");
    const standalone = window.matchMedia && matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    return `<div class="home">
      <div class="brand"><div class="logo">${UI.dieSvg}</div><div><h1>Taccuino dell’Eroe</h1><p class="muted">Scheda personaggio per Nimble · non ufficiale</p></div></div>
      ${S.storageOK ? "" : '<div class="banner bad">Il salvataggio locale non è disponibile in questo browser: esporta i tuoi eroi per non perderli.</div>'}
      ${UI.langBox()}
      ${chars.length ? `<section class="card"><h2>I tuoi eroi</h2>${rows}</section>` : '<section class="card"><p>Nessun eroe ancora. Creane uno per iniziare!</p></section>'}
      <div class="btnrow wrap pad"><button class="btn primary" data-act="open-create">+ Nuovo eroe</button><button class="btn" data-act="import-open">Importa file</button><button class="btn ghost" data-act="florian">Esempio: Florian (Commander)</button><button class="btn ghost" data-act="crush">Esempio: Crush (Berserker)</button>${chars.length ? '<button class="btn ghost" data-act="tab" data-tab="scheda">Torna alla scheda</button>' : ""}</div>
      ${standalone ? "" : '<section class="card"><h2>Installa l’app</h2><p class="small">Dal menu del browser scegli <b>“Installa app”</b> / <b>“Aggiungi a schermata Home”</b> (su iPhone: Condividi → Aggiungi alla schermata Home). Crea gli eroi <b>dopo</b> l’installazione, così i dati stanno nell’app installata.</p></section>'}
      <section class="card notice"><p class="small"><b>${esc(LICENSE_TXT)}</b></p><p class="small muted">${esc(SRD_TXT)}</p></section>
    </div>`;
  };
})();
