/* Classe: Shadowmancer (Nimble Heroes: Shadowmancer, 2026).
   Testi tratti dal manuale, usati secondo la Nimble 3rd Party Creator License v2.0. */
(function () {
  const NIM = (globalThis.NIM = globalThis.NIM || {});
  NIM.CLASSES = NIM.CLASSES || {};

  const features = [
    [1, "Conduit of Shadow", "Learn the Shadowmancer cantrips."],
    [2, "Master of Darkness", "Learn all Necrotic cantrips and tier 1 Necrotic spells."],
    [2, "Pilfered Power", "You can steal power from your Patron to cast tiered spells (DEX times before they notice). If you exceed this limit, your Patron damages you for half your max HP as recompense. This resets as you commune with your Patron during a Safe Rest."],
    [3, "THE PACT IS SEALED", "Choose a Shadowmancer subclass and 1 Lesser Shadow Invocation.\nSupplicate. Whenever you commune with your Patron on a Safe Rest, you may beg them to allow you to choose different Shadowmancer options (they may ask for something in return)."],
    [4, "Key Stat Increase", "+1 INT or DEX."],
    [4, "A Gift from the Master", "Choose 1 Greater Shadow Invocation."],
    [5, "Tier 2 Spells", "You may now cast tier 2 spells; all of your spells are cast at this tier."],
    [5, "Upgraded Cantrips", "Your cantrips grow stronger."],
    [5, "Secondary Stat Increase", "+1 STR or WIL."],
    [6, "A Gift from the Master (2)", "Choose a 2nd Greater Shadow Invocation."],
    [6, "Shadowmastery", "Choose 1 Necrotic Utility Spell."],
    [7, "Subclass", "Gain your Shadowmancer subclass feature."],
    [7, "Tier 3 Spells", "You may now cast tier 3 spells; all of your spells are cast at this tier."],
    [8, "Key Stat Increase", "+1 INT or DEX."],
    [8, "Lesser Invocation", "Choose a 2nd Lesser Shadow Invocation."],
    [8, "Shadowmastery (2)", "Choose a 2nd Necrotic Utility Spell."],
    [9, "A Gift from the Master (3)", "Choose a 3rd Greater Shadow Invocation."],
    [9, "Secondary Stat Increase", "+1 STR or WIL."],
    [10, "Tier 4 Spells", "You may now cast tier 4 spells; all of your spells are cast at this tier."],
    [10, "Upgraded Cantrips", "Your cantrips grow stronger."],
    [11, "Subclass", "Gain your Shadowmancer subclass feature."],
    [11, "Lesser Invocation (2)", "Choose a 3rd Lesser Shadow Invocation."],
    [12, "Greedy Pact", "When you would take damage from Pilfered Power, make a STR save:\n1–9: Suffer damage as normal.\n10–19: Suffer only 10 HP of damage.\n20+: Suffer no damage and cast the spell as if it were 1 tier higher."],
    [12, "Key Stat Increase", "+1 INT or DEX."],
    [13, "Tier 5 Spells", "You may now cast tier 5 spells; all of your spells are cast at this tier."],
    [13, "Secondary Stat Increase", "+1 STR or WIL."],
    [14, "A Gift from the Master (4)", "Choose a 4th Greater Shadow Invocation."],
    [14, "Shadowmastery (3)", "You know all Necrotic Utility Spells."],
    [15, "Subclass", "Gain your Shadowmancer subclass feature."],
    [15, "Upgraded Cantrips", "Your cantrips grow stronger."],
    [16, "Tier 6 Spells", "You may now cast tier 6 spells; all of your spells are cast at this tier."],
    [16, "Key Stat Increase", "+1 INT or DEX."],
    [17, "Dire Shadows", "Attacks against your Shadows are made with disadvantage. They take no damage from successful saves."],
    [17, "Secondary Stat Increase", "+1 STR or WIL."],
    [18, "A Gift from the Master (5)", "Choose a 5th Greater Shadow Invocation."],
    [19, "Epic Boon", "Choose an Epic Boon (see pg. 75 of the GM’s Guide)."],
    [19, "Tier 7 Spells", "You may now cast tier 7 spells; all of your spells are cast at this tier."],
    [20, "Eldritch Usurper", "+1 to any 2 of your stats. (1/encounter) When you cast Summon Shadow you may summon a Greater Shadow instead."],
    [20, "Greater Shadow", "A 5d12 minion. When it dies, it explodes into 5 Shadows (ignoring your Shadow Limit). Place them anywhere within Reach 6."],
    [20, "Upgraded Cantrips", "Your cantrips grow stronger."],
  ].map(([level, name, text, replacedBy]) => ({ level, name, text, replacedBy }));

  const cantrips = [
    { id: "summon-shadow", name: "Summon Shadow", cost: "1 Action", text: "Summon 1 adjacent Shadow (a d12 minion).\nHigh Levels: +1 Shadow every 5 Levels.\nMinions. They follow the minion rules and abandon you immediately outside of combat.\nShadow Limit. You can have up to INT Shadows." },
    { id: "command-shadows", name: "Command Shadows", cost: "1 Action", text: "ALL your Shadows move 6 then attack (1/round)." },
    { id: "shadow-blast", name: "Shadow Blast", cost: "1 Action", text: "Range: 8. Damage: 1d12+DEX (1/round).\nHigh Levels: +1d12 every 5 Levels." },
  ];

  const lesser = [
    { id: "abhorrent-speech", name: "Abhorrent Speech", cost: "Passive", text: "You can communicate with horrible creatures (aberrations, undead, etc.)." },
    { id: "beguiling-influence", name: "Beguiling Influence", cost: "1 Action", text: "(1/Safe Rest) You may reroll an Influence check." },
    { id: "blood-sight", name: "Blood Sight", cost: "1 Action", text: "(1/Safe Rest) You may reroll an Examination check. Additionally, you can detect traces of blood on a surface, even after it has been cleaned." },
    { id: "devoted-acolyte", name: "Devoted Acolyte", cost: "Passive", text: "Learn 2 of the following languages: Celestial, Draconic, Deep Speak, Infernal, or Primordial. Advantage on Lore checks related to those 2 languages." },
    { id: "eldritch-sense", name: "Eldritch Sense", cost: "Passive", text: "You can sense any shapechanger or creature concealed by magic within Reach 6." },
    { id: "gaze-of-two-minds", name: "Gaze of Two Minds", cost: "1 Action", text: "Touch a willing creature and perceive through its senses instead of your own for as long as you hold concentration." },
    { id: "knowledge-from-beyond", name: "Knowledge from Beyond", cost: "0 Actions", text: "If you fail an Insight or Arcana check, you may suffer 1 Wound to succeed instead." },
    { id: "my-favored-pet", name: "My Favored Pet", cost: "Passive", text: "One Shadow can begrudgingly tolerate you outside of combat. It can (very creepily) do any menial task a below-average commoner could." },
    { id: "voice-of-the-dark", name: "Voice of the Dark", cost: "Passive", text: "You can communicate telepathically with a humanoid within 6 spaces." },
    { id: "whispers-of-the-grave", name: "Whispers of the Grave", cost: "1 Action", text: "(1/Safe Rest) Ask a dead creature 3 yes/no questions. You can never question it this way again." },
  ];

  const greater = [
    { id: "armor-of-shadows", name: "Armor of Shadows", cost: "Passive", text: "Reduce all damage you receive by an amount equal to the number of Shadows you have." },
    { id: "fiendish-boon-dex", name: "Fiendish Boon (DEX)", cost: "Passive", text: "Increase your DEX by 1. You have 1 fewer max Hit Dice." },
    { id: "fiendish-boon-int", name: "Fiendish Boon (INT)", cost: "Passive", text: "Increase your INT by 1. You have 1 fewer max Hit Dice." },
    { id: "hungering-shadows", name: "Hungering Shadows", cost: "Passive", text: "Whenever one of your Shadows rolls the max, the next tiered spell you cast this encounter does not cost a use of Pilfered Power." },
    { id: "one-with-shadows", name: "One with Shadows", cost: "1 Action", text: "While adjacent to a Shadow or in an area of dim light or darkness, you may become Invisible until you move or attack (summoning and commanding minions does not count as an attack)." },
    { id: "repelling-blast", name: "Repelling Blast", cost: "Passive", text: "Your Shadow Blast gains: On hit: Knockback 2." },
    { id: "shadow-magus", name: "Shadow Magus", cost: "Passive", text: "Your Shadows gain +4 Reach and deal d10 damage instead." },
    { id: "shadow-spear", name: "Shadow Spear", cost: "Passive", text: "Your Shadow Blast gains +8 Range, ignores cover, advantage vs Prone targets (instead of disadvantage), and crits on a 1." },
    { id: "shadow-rush", name: "Shadow Rush", cost: "Passive", text: "Whenever your Shadows attack, instead of rolling damage, you may have any of them deal the max amount, then die." },
    { id: "shadow-warp", name: "Shadow Warp", cost: "1 Action", text: "(Reach 12) Switch places with a creature that has been dealt necrotic damage this turn." },
    { id: "swarming-shadows", name: "Swarming Shadows", cost: "Passive", text: "Whenever a Shadow rolls the max, summon another Shadow adjacent to the target (ignoring your Shadow Limit)." },
  ];

  const faq = [
    ["Does Hungering Shadows or Swarming Shadows combo with Shadow Rush?", "No. Hungering Shadows and Swarming Shadows require you to roll the max amount; Shadow Rush forgoes rolling dice."],
    ["Can I go over my Shadow Limit?", "Some spells and abilities may permit this, but while at or above your Shadow Limit, casting Summon Shadow has no effect."],
    ["How do minions and swarms interact with Armor?", "Add up all the minions’/swarms’ dice and treat them as a single attack."],
  ];

  const subclasses = [
    {
      id: "red-dragon", name: "Pact of the Red Dragon", school: "fire",
      tagline: "The Great Dragon’s flames are yours. Its wrath is yours. Soon, even its flesh will be too.",
      features: [
        { level: 3, items: [["Draconic Crimson Rite", "Your Patron grants you knowledge of Fire spells. Your Shadows become flaming dragon wyrmling Shadows. Your Shadow Blast and Shadows can deal fire or necrotic damage and inflict Smoldering whenever they roll the max."]] },
        { level: 7, items: [["We’ll ALL Burn!", "You may cast Pyroclasm without Pilfered Power by including yourself in the damage. You have advantage on the save. Choose 1 Fire Utility Spell."]] },
        { level: 11, items: [["Heart of Burning Fire", "Regain 1 use of Pilfered Power each time you roll Initiative. This expires at the end of combat if unused."]] },
        { level: 15, items: [["Enveloped by the Master", "Gain 1d4 Wounds to cast Dragonform."]] },
      ],
    },
    {
      id: "abyssal-depths", name: "Pact of the Abyssal Depths", school: "ice",
      tagline: "Icy tendrils reach out from the abyss, and drag your foes into absolute cold and darkness.",
      features: [
        { level: 3, items: [["Master of Nightfrost", "Your Patron grants you knowledge of Ice spells. Gain the ability to breathe underwater. Your Shadows become beings of nightfrost. Your Shadow Blast and Shadows can deal cold or necrotic damage, and whenever they roll the max, you gain INT+LVL temp HP."]] },
        { level: 7, items: [["Shadowrime", "Your Shadow Blast also Slows. You can cast Omenrime or Rimeblades without Pilfered Power by expending 10 temp HP. Choose 1 Ice Utility Spell."]] },
        { level: 11, items: [["Glacial Resilience", "(1/Safe Rest) Reaction (whenever you are attacked or would gain a condition): Gain 10×LVL temp HP and end ALL negative conditions on yourself. At the end of your next turn, any remaining temp HP are lost."]] },
        { level: 15, items: [["Cryomancer’s Reprisal", "Pay half your max HP to cast ANY Ice spell. After casting an Ice spell in this way, you gain an invisible aura: the next creature that hits you with a melee attack this encounter takes cold damage equal to half the HP you spent on this casting."]] },
      ],
    },
    {
      id: "void", name: "Pact of the Void",
      tagline: "Your cosmic master gazes from beyond the stars. Time and space are mere playthings to you.",
      features: [
        { level: 3, items: [
          ["Void Spawn", "You can summon Shadows within Reach 6."],
          ["Void Step", "You and your allies can move between spaces your Shadows occupy as if they were the same space (but cannot end movement in an occupied space)."],
        ] },
        { level: 7, items: [
          ["Voidstrike", "You and your allies can attack between spaces your Shadows occupy as if they were the same space. Gain advantage when attacking this way (e.g., an ally next to a Shadow can make a melee attack against any enemy also adjacent to a Shadow)."],
          ["The Vast Cold", "Your Shadows inflict the Slowed condition when attacked in melee."],
        ] },
        { level: 11, items: [["Void Singularity", "(Reach 1/Shadow) Whenever 1 or more Shadows move into the space of another Shadow, all of them implode and die, dealing their combined damage to all creatures in the area, moving them toward the center as you choose."]] },
        { level: 15, items: [
          ["The Consuming Dark", "(1/encounter) When a Shadow kills an enemy you may have it transform into a Greater Shadow."],
          ["Urgent Command", "Gain a Wound to move your Shadows as a Reaction."],
        ] },
      ],
    },
    {
      id: "endless-swarm", name: "Pact of the Endless Swarm",
      tagline: "Pests and vermin… Even the weakest grow strong in numbers. The denizens of your swarm are infinite and unyielding.",
      features: [
        { level: 3, items: [
          ["Summon Hive", "Whenever you cast Summon Shadow, also summon a Hive within Reach 2 (max of INT Hives)."],
          ["Hive", "Immobile minion, enemies within Reach 2 attack with disadvantage. At the end of your turns, spawns a swarm: roll and set aside 1d4. Whenever you or an ally attacks, you can expend any of these dice to increase the damage done."],
        ] },
        { level: 7, items: [
          ["Rampant Brood", "When a Hive dies, it spawns 2 swarms. Whenever you cast Command Shadows, your Hives can also move."],
          ["Broodlord", "You may spend your Interpose reaction to make a Hive Interpose for yourself or an ally instead."],
        ] },
        { level: 11, items: [["Impending Infestation", "Summon 1 additional Hive for each time you’ve previously cast Summon Shadow this encounter."]] },
        { level: 15, items: [["Terrible Plague", "Your swarms increase to d8 damage and your Hives’ Reach increases to 3."]] },
      ],
    },
    {
      id: "high-celestial", name: "Pact of the High Celestial",
      tagline: "Be not afraid! Your radiant spirits empower, bless, and protect those that you deem worthy.",
      features: [
        { level: 3, items: [["Divine Bestowal", "Your Shadows become radiant Spirits, lose their ability to attack directly, but can move into the space of an ally and bless them. They move wherever the ally does, and each one grants the ally +2 damage on their attacks and +2 damage reduction from incoming attacks. If an ally takes damage, all minions blessing them die."]] },
        { level: 7, items: [["Radiant Boon", "You may target allies with Shadow Blast and give them temp HP instead of damaging them."]] },
        { level: 11, items: [
          ["Divine Bestowal (2)", "Your minions’ blessing increases to 3."],
          ["Celestial Armor", "When a blessed ally Defends or Interposes, 1 minion blessing them can sacrifice itself to take the damage instead."],
        ] },
        { level: 15, items: [["Apotheosis", "(1/Safe Rest) For 1 round you are immune to all damage and negative effects. Anytime you would roll a d20, roll a d100 instead, and anytime you would roll less than a d20, roll a d20."]] },
      ],
    },
    {
      id: "reaver", name: "Reaver",
      tagline: "Cast aside, born anew.",
      features: [
        { level: 3, items: [
          ["Hollow One", "Cut off from your Patron, you can no longer cast Shadow Blast, nor can you cast tiered spells using Pilfered Power. However, as a parting token, you have stolen a secret from your Patron: the magical Bonescythe, a weapon of sinew and bone, infused with shadowy magic."],
          ["Summon Bonescythe", "(1 Action) Summon a magical Bonescythe, a melee weapon. (Reach 2) 2d12 slashing+DEX necrotic damage to EACH die (add 1 extra damage die every 5 Levels). On hit (or when combat ends): it shatters and must be resummoned to use again. Invocations affecting Shadow Blast affect your Bonescythe instead."],
          ["Shadow Exploit", "Whenever you Defend, you can sacrifice a Shadow to take no damage. Or you may sacrifice a Shadow to cast a spell at the highest tier you have unlocked. Each subsequent time you use this ability in an encounter, increase the cost by 1 Shadow."],
        ] },
        { level: 7, items: [
          ["Grim Harrow", "When you strike with your Bonescythe, treat each die as Primary. You may divide the dice as you choose amongst any number of adjacent targets within Reach."],
          ["Reap", "When your Bonescythe crits or kills a creature, summon a Shadow for free (ignoring your Shadow Limit)."],
        ] },
        { level: 11, items: [
          ["My Blood, My Power", "You may take 1 Wound to cast a tiered spell you know at the highest tier you have unlocked."],
          ["Otherworldly Might", "Advantage on Concentration saves if you have any Shadows."],
        ] },
        { level: 15, items: [["Sovereign One", "Summon 2 Shadows and your Bonescythe for free when you roll Initiative."]] },
      ],
    },
  ];

  // Tier massimo degli incantesimi per livello (Master of Darkness + Tier N Spells)
  const maxTierAt = (lvl) => (lvl >= 19 ? 7 : lvl >= 16 ? 6 : lvl >= 13 ? 5 : lvl >= 10 ? 4 : lvl >= 7 ? 3 : lvl >= 5 ? 2 : lvl >= 2 ? 1 : 0);

  // Incantesimi noti: [{ spell, mode, note }] — mode: cantrip | pilfered | special | reaver
  function knownSpells(c, d) {
    const lvl = c.level, maxTier = maxTierAt(lvl), sub = d.subId, reaver = sub === "reaver";
    const all = NIM.SPELLS.filter((s) => !s.utility);
    const out = [];
    const seen = new Set();
    const push = (spell, mode, note) => { if (seen.has(spell.id)) return; seen.add(spell.id); out.push({ spell, mode, note: note || "" }); };
    const tiered = reaver ? "reaver" : "pilfered";
    if (lvl >= 2) {
      all.filter((s) => s.school === "necrotic" && s.tier === 0).forEach((s) => push(s, "cantrip"));
      all.filter((s) => s.school === "necrotic" && s.tier >= 1 && s.tier <= maxTier).forEach((s) => push(s, tiered));
    }
    const subDef = subclasses.find((x) => x.id === sub);
    if (subDef && subDef.school && lvl >= 3) {
      all.filter((s) => s.school === subDef.school && s.tier === 0).forEach((s) => push(s, "cantrip"));
      all.filter((s) => s.school === subDef.school && s.tier >= 1 && s.tier <= maxTier).forEach((s) => push(s, tiered));
      if (!reaver && sub === "red-dragon") {
        if (lvl >= 7) push(NIM.SPELL_BY_ID["pyroclasm"], "special", "We’ll ALL Burn!: senza Pilfered Power, includendo te stesso nel danno (vantaggio al TS)");
        if (lvl >= 15) push(NIM.SPELL_BY_ID["dragonform"], "special", "Enveloped by the Master: costa 1d4 Ferite");
      }
      if (!reaver && sub === "abyssal-depths") {
        if (lvl >= 7) ["omenrime", "rimeblades"].forEach((id) => push(NIM.SPELL_BY_ID[id], "special", "Shadowrime: senza Pilfered Power, spendendo 10 PF temp"));
        if (lvl >= 15) all.filter((s) => s.school === "ice").forEach((s) => push(s, "special", "Cryomancer’s Reprisal: paghi metà dei PF max"));
      }
    }
    return out;
  }

  NIM.CLASSES.shadowmancer = {
    id: "shadowmancer",
    name: "Shadowmancer",
    blurb: "A shadowy master of expendable hordes. Flexible minion-based class with powerful spellcasting options.",
    keyStats: ["INT", "DEX"],
    hitDie: 8,
    startHP: 13,
    saves: { STR: "neu", DEX: "neu", INT: "adv", WIL: "dis" },
    armor: ["cloth"],
    weaponsText: "Blades, Wands",
    armorText: "Cloth Armor",
    startGear: [{ ref: "adventurers-garb" }, { ref: "sickle" }, { ref: "shovel" }],
    keyIncLevels: [4, 8, 12, 16],
    secIncLevels: [5, 9, 13, 17],
    features,
    cantrips,
    lesser,
    greater,
    faq,
    subclasses,
    maxTierAt,
    knownSpells,
    // competenza: lame e bacchette
    weaponProf: (w) => {
      const nm = ((NIM.ITEM_BY_ID[w.ref] || {}).name || w.name || "");
      return /dagger|sickle|sword|rapier|blade|knife|scythe|saber|sabre|scimitar|katana|wand/i.test(nm);
    },
    // bonus alle caratteristiche dalle scelte (Fiendish Boon)
    statBonus: (chosen) => ({
      DEX: chosen.includes("greater:fiendish-boon-dex") ? 1 : 0,
      INT: chosen.includes("greater:fiendish-boon-int") ? 1 : 0,
    }),
    slots(c) {
      const L = c.level;
      const sub = L >= 3 ? c.subclassId : "";
      const out = [];
      [3, 8, 11].forEach((l) => L >= l && out.push({ id: "li-" + l, kind: "lesser", level: l, label: "Lesser Shadow Invocation" }));
      [4, 6, 9, 14, 18].forEach((l) => L >= l && out.push({ id: "gi-" + l, kind: "greater", level: l, label: "Greater Shadow Invocation" }));
      [6, 8].forEach((l) => L >= l && out.push({ id: "um-" + l, kind: "util", level: l, label: "Shadowmastery – Necrotic Utility Spell" }));
      if (L >= 7 && sub === "red-dragon") out.push({ id: "fu-7", kind: "util-fire", level: 7, label: "We’ll ALL Burn! – Fire Utility Spell" });
      if (L >= 7 && sub === "abyssal-depths") out.push({ id: "iu-7", kind: "util-ice", level: 7, label: "Shadowrime – Ice Utility Spell" });
      return out.sort((a, b) => a.level - b.level);
    },
    options(c, slot) {
      const util = (school, group) => NIM.SPELLS.filter((s) => s.utility && s.school === school).map((s) => ({ id: "spell:" + s.id, name: s.name, group, text: s.text, cost: s.cost, tier: 0 }));
      switch (slot.kind) {
        case "lesser": return lesser.map((a) => ({ id: "lesser:" + a.id, name: a.name, group: "Lesser Shadow Invocations", text: a.text, cost: a.cost }));
        case "greater": {
          // Fiendish Boon si può prendere una sola volta (DEX o INT)
          const hasBoon = Object.entries(c.choices || {}).some(([k, v]) => k !== slot.id && /^greater:fiendish-boon/.test(v));
          return greater.filter((a) => !(hasBoon && /^fiendish-boon/.test(a.id))).map((a) => ({ id: "greater:" + a.id, name: a.name, group: "Greater Shadow Invocations", text: a.text, cost: a.cost }));
        }
        case "util": return util("necrotic", "Necrotic Utility Spells");
        case "util-fire": return util("fire", "Fire Utility Spells");
        case "util-ice": return util("ice", "Ice Utility Spells");
      }
      return [];
    },
  };
})();
