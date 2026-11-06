/* Dati delle regole base di Nimble (Core Rules 3.0).
   Testi tratti dal manuale, usati secondo la Nimble 3rd Party Creator License v2.0.
   Per aggiungere contenuti basta modificare questi file dati. */
(function () {
  const NIM = (globalThis.NIM = globalThis.NIM || {});
  const slug = (s) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  NIM.slug = slug;

  NIM.STATS = ["STR", "DEX", "INT", "WIL"];
  NIM.STAT_NAMES = { STR: "Strength", DEX: "Dexterity", INT: "Intelligence", WIL: "Will" };
  NIM.STAT_TEXT = {
    STR: "Raw physical power and resilience, endurance, and resistance to harm. Affects STR weapon damage, resistance to Wounds, HP recovery, Concentration, STR saves, carrying capacity, Grappling, and the Might skill.",
    DEX: "Agility, reflexes, and precision with blades or bows. Affects DEX weapon damage, Initiative, DEX saves, Grappling, and can contribute to Defense, as well as the Stealth and Finesse skills.",
    INT: "Knowledge and reasoning across fields like the arcane, tactics, or street smarts. Affects languages, spellcasting, use of wands, spell scrolls, INT saves, as well as the Arcana, Examination, and Lore skills.",
    WIL: "Force of personality, courage, and wisdom. Affects spellcasting and WIL saves, as well as the Insight, Influence, Naturecraft, and Perception skills.",
  };
  NIM.STAT_ARRAYS = [
    { id: "standard", name: "Standard", values: [2, 2, 0, -1] },
    { id: "balanced", name: "Balanced", values: [2, 1, 1, 0] },
    { id: "minmax", name: "Min-Max", values: [3, 1, -1, -1] },
  ];
  NIM.HD_STEPS = [4, 6, 8, 10, 12, 20];
  NIM.HD_AVG = { 4: 3, 6: 4, 8: 5, 10: 7, 12: 8, 20: 12 };

  NIM.SKILLS = [
    { id: "arcana", name: "Arcana", stat: "INT", text: "Understanding of magical phenomena, spells, and enchantments. Identify magical effects, decipher arcane symbols, discern properties of magical items. Insights on Aberrations, Elementals, and Oozes." },
    { id: "examination", name: "Examination", stat: "INT", text: "Aptitude for thorough analysis and deduction. Diagnose injuries, determine causes of death, uncover clues, unravel traps or mechanical devices. Insights on Constructs." },
    { id: "finesse", name: "Finesse", stat: "DEX", text: "Using your hands and feet in careful ways: picking locks, disarming traps, piloting vehicles, tinkering, card tricks, stealing or planting items, climbing a mossy wall." },
    { id: "influence", name: "Influence", stat: "WIL", text: "Persuasiveness, charm, and ability to influence others through charisma or cunning. Convince or deceive, negotiate deals, build trust, put on a captivating performance." },
    { id: "insight", name: "Insight", stat: "WIL", text: "Understanding people and situations beyond the obvious: sense motives, detect lies, read hidden emotions, make sense of clues. Can be used to retroactively change situations (e.g. “did my hero think to buy rope?”)." },
    { id: "lore", name: "Lore", stat: "INT", text: "Understanding of the history of civilization, kingdoms, and religions. Recall historical events and cultural practices. Knowledge of Celestials, Dragons, Fey, Fiends, Giants, Humanoids, and Undead." },
    { id: "might", name: "Might", stat: "STR", text: "Applying strength effectively: lifting heavy objects, breaking through obstacles, climbing, swimming, jumping, feats of strength." },
    { id: "naturecraft", name: "Naturecraft", stat: "WIL", text: "Wilderness survival, navigation, tracking, handling animals. Identify flora, fauna, and track creatures. Knowledge of Beasts, Monstrosities, and Plants." },
    { id: "perception", name: "Perception", stat: "WIL", text: "Noticing subtle details: spot hidden objects, detect secret passages, sense environmental changes, sense when you're being followed or observed." },
    { id: "stealth", name: "Stealth", stat: "DEX", text: "Staying unseen and moving quietly: hide, slip past guards, evade detection, move without drawing attention." },
  ];

  NIM.LANGUAGES = [
    ["Common", "Most intelligent creatures"],
    ["Dwarvish", "Dwarves, Gnomes, and Giants"],
    ["Elvish", "Elves, Fey, and Sylvan"],
    ["Goblin", "Goblins and Orcs"],
    ["Infernal", "Various Fiends and cultists"],
    ["Thieves’ Cant", "Scoundrels and rogues"],
    ["Celestial", "Celestials and priests"],
    ["Draconic", "Dragons, Dragonborn, and Kobolds"],
    ["Primordial", "Elementals and Ancient Beings"],
    ["Deep Speak", "Underworld dwellers"],
  ];

  /* ---------------- Ancestries ---------------- */
  const A = (id, name, tier, size, trait, text, extra) => Object.assign({ id, name, tier, size, trait, text, mods: {}, uses: [] }, extra || {});
  NIM.ANCESTRIES = [
    A("human", "Human", "Common", "Medium", "Tenacious", "+1 to all skills and Initiative.", { mods: { skillAll: 1, init: 1 } }),
    A("dwarf", "Dwarf", "Common", "Medium", "Stout", "+2 max Hit Dice, +1 max Wounds, –1 Speed. You know Dwarvish if your INT isn’t negative.", { mods: { maxHD: 2, maxWounds: 1, speed: -1 }, lang: "Dwarvish" }),
    A("elf", "Elf", "Common", "Medium", "Lithe", "Advantage on Initiative, +1 Speed. You know Elvish if your INT isn’t negative.", { mods: { initAdv: true, speed: 1 }, lang: "Elvish" }),
    A("halfling", "Halfling", "Common", "Small", "Elusive", "+1 to Stealth. (1/Safe Rest) If you fail a save, you can succeed instead.", { mods: { skill: { stealth: 1 } }, uses: [{ key: "elusive", label: "Elusive (salva un fallimento)", per: "safe", max: 1 }] }),
    A("gnome", "Gnome", "Common", "Small", "Optimistic", "(Free Reaction, Reach 6) Allow an ally to reroll any 1 die; resets when healed to max HP. –1 Speed. You know Dwarvish if your INT isn’t negative (but you call it Gnomish, of course).", { mods: { speed: -1 }, lang: "Dwarvish", uses: [{ key: "optimistic", label: "Optimistic (rilancio per alleato)", per: "fullhp", max: 1 }] }),

    A("dragonborn", "Dragonborn", "Uncommon", "Medium", "Draconic Heritage", "+1 Defense. (1/Safe Rest) Deal an additional LVL+KEY damage on an attack divided as you choose among any of the attack’s targets (recharges whenever you gain a Wound). You know Draconic if your INT isn’t negative.", { mods: { defense: 1 }, lang: "Draconic", uses: [{ key: "draconic", label: "Draconic Heritage (+LVL+KEY danni)", per: "safe", max: 1, onWound: true }] }),
    A("kobold", "Kobold", "Uncommon", "Small", "Wily", "Advantage on skill checks related to dragons and to Influence friendly creatures. (1/encounter) Force an enemy to reroll a non-critical attack against you. You know Draconic if your INT isn’t negative.", { lang: "Draconic", uses: [{ key: "wily", label: "Wily (nemico rilancia attacco)", per: "enc", max: 1 }] }),
    A("goblin", "Goblin", "Uncommon", "Small", "Skedaddle", "Can move 2 spaces for free after you become the target of an attack or negative effect (after damage, ignoring Difficult Terrain). You know Goblin if your INT isn’t negative.", { lang: "Goblin" }),
    A("orc", "Orc", "Uncommon", "Medium", "Relentless", "(1/Safe Rest) When you would drop to 0 HP, you may set your HP to LVL instead. +1 Might. You know Goblin if your INT isn’t negative (but you call it Orcish, of course).", { mods: { skill: { might: 1 } }, lang: "Goblin", uses: [{ key: "relentless", label: "Relentless (resti a LVL HP)", per: "safe", max: 1 }] }),
    A("fiendkin", "Fiendkin", "Uncommon", "Medium", "Flameborn", "1 neutral save is advantaged instead. You know Infernal if your INT isn’t negative.", { lang: "Infernal", choice: { type: "save", label: "Quale salvezza neutra diventa avvantaggiata?" } }),
    A("bunbun", "Bunbun", "Uncommon", "Small", "Bunny Legs", "(1/encounter) Before Interposing or after Defending (after damage), hop up to your Speed in any direction for free.", { uses: [{ key: "bunny", label: "Bunny Legs (salto gratuito)", per: "enc", max: 1 }] }),

    A("birdfolk", "Birdfolk", "Exotic", "Small or Medium", "Hollow Bones", "You can fly as long as you are wearing armor no heavier than Leather (forced movement moves you 2× while flying). Crits against you are Vicious (the attacker rolls 1 additional die).", { choice: { type: "size", label: "Taglia" } }),
    A("celestial", "Celestial", "Exotic", "Medium", "Highborn", "Your disadvantaged save is neutral instead. You know Celestial if your INT isn’t negative.", { lang: "Celestial", mods: { disToNeutral: true } }),
    A("changeling", "Changeling", "Exotic", "Medium", "New Place, New Face", "+2 Shifting Skill Points. You take on the appearance of any ancestry (transformation time 10 min). When you do, you may move your 2 Shifting Skill Points into any 1 skill.", { choice: { type: "skill", label: "Skill che riceve i 2 Shifting Skill Points", value: 2 } }),
    A("crystalborn", "Crystalborn", "Exotic", "Medium", "Reflective Aura", "(1/encounter) When you Defend, gain KEY Defense and deal KEY damage back to the attacker (ignoring their armor).", { uses: [{ key: "reflective", label: "Reflective Aura", per: "enc", max: 1 }] }),
    A("dryad", "Dryad/Shroomling", "Exotic", "Small or Medium", "Danger Pollen/Spores", "Whenever you gain one or more Wounds, you excrete soporific spores: all adjacent enemies are Dazed. You know Elvish if your INT isn’t negative.", { lang: "Elvish", choice: { type: "size", label: "Taglia" } }),
    A("half-giant", "Half-Giant", "Exotic", "Large", "Strength of Stone", "(1/encounter) Force an enemy to reroll a crit against you. +2 Might. You know Dwarvish if your INT isn’t negative (but you call it Giant, of course).", { mods: { skill: { might: 2 } }, lang: "Dwarvish", uses: [{ key: "stone", label: "Strength of Stone (nemico rilancia crit)", per: "enc", max: 1 }] }),
    A("minotaur", "Minotaur/Beastfolk", "Exotic", "Medium", "Charge", "When you move at least 4 spaces, you can push a creature in your path 1 space."),
    A("oozeling", "Oozeling/Construct", "Exotic", "Small or Medium", "Odd Constitution", "Increment your Hit Dice one step (d6 » d8 » d10 » d12 » d20); they always heal you for the maximum amount. Magical healing always heals you for the minimum amount.", { mods: { hdStep: 1 }, choice: { type: "size", label: "Taglia" } }),
    A("planarbeing", "Planarbeing", "Exotic", "Medium", "Planeshift", "–2 max Wounds. Whenever you Defend, you can gain 1 Wound to temporarily phase out of the material plane and ignore all effects of the attack.", { mods: { maxWounds: -2 } }),
    A("ratfolk", "Ratfolk", "Exotic", "Small", "Scurry", "Gain +2 Defense if you moved on your last turn. +1 Speed.", { mods: { speed: 1 } }),
    A("stoatling", "Stoatling", "Exotic", "Small", "Small But Ferocious", "Whenever you make a single-target attack against a creature larger than you, roll 1 additional d6 for each size category it is larger. They do the same.") ,
    A("turtlefolk", "Turtlefolk/Stonefolk", "Exotic", "Small or Medium", "Slow & Steady", "+4 Defense, –2 Speed.", { mods: { defense: 4, speed: -2 }, choice: { type: "size", label: "Taglia" } }),
    A("wyrdling", "Wyrdling", "Exotic", "Small", "Chaotic Surge", "(1/encounter) Whenever you or a willing ally within Reach 6 casts a Tiered spell, you may allow them to roll on the Chaos Table.", { uses: [{ key: "chaotic", label: "Chaotic Surge", per: "enc", max: 1 }] }),
  ];

  /* ---------------- Backgrounds ---------------- */
  const B = (id, name, text, extra) => Object.assign({ id, name, text, mods: {}, uses: [] }, extra || {});
  NIM.BACKGROUNDS = [
    B("back-out-of-retirement", "Back Out of Retirement", "You’ve forgotten more than most adventurers these days know! Talk with your GM: what made you come out of retirement?", {
      options: [
        { name: "Let’s see if I remember how to do this…", text: "Gain 1 Wound to use an ability or cast a spell as if you were 1 level higher.", mods: {} },
        { name: "These old bones…", text: "Your age has long since started to show. –1 max Wounds.", mods: { maxWounds: -1 } },
      ],
    }),
    B("devoted-protector", "Devoted Protector", "Choose 1 ally in your party. You can survive +3 max Wounds as long as they are nearby. Whenever they take a Wound, you do too."),
    B("academy-dropout", "Academy Dropout", "School just isn’t for everyone! You learn by experience in the real world (or at least that’s what you tell yourself). Learn any 1 Utility Spell."),
    B("bad-choice", "Made a BAD Choice", "Start with 500 or 1,000 extra gold, or an uncommon/rare magical item (that your GM allows). Gain an equally powerful curse or enemy who wants it back. If you choose this background, your GM may allow you to choose another."),
    B("haunted-past", "Haunted Past", "You are haunted by voices that occasionally give you cryptic advice. The voices are sometimes VERY helpful. Other times they only want to see you suffer. Advantage against fear."),
    B("ear-to-the-ground", "Ear to the Ground", "Advantage on checks to know or obtain gossip for events that will soon happen or have happened less than 1 year ago."),
    B("been-around", "What? I’ve Been Around.", "(1/location; or at the GM’s discretion). You happen to know JUST the person who has the information you’re looking for, or could get you out of a jam, and… Roll 1d20: 1–5. They want you DEAD. 6–12. You owe them money. 13–19. They can be convinced to help you. 20. They are your biggest fan, or are madly in love with you."),
    B("acrobat", "Acrobat", "Can be thrown by a larger ally, REALLY far. Half damage from falling and forced movement."),
    B("wild-one", "Wild One", "Whether it is the sticks or flowers in your hair, your smell, or the way you carry yourself, wild creatures are less frightened of you and more willing to aid you. +1 Naturecraft. While Field Resting in the wild, your Hit Dice recover +KEY HP.", { mods: { skill: { naturecraft: 1 } } }),
    B("fey-touched", "Fey Touched", "You take half damage from all magical effects, double from weapons made of metal (before Defense is applied)."),
    B("survivalist", "Survivalist", "You never run out of your own personal rations. Anything can be food if you try hard enough! (1/Safe Rest) End poison on yourself. Advantage against poison saves. +1 max Hit Die.", { mods: { maxHD: 1 }, uses: [{ key: "survivalist", label: "Survivalist (termina veleno)", per: "safe", max: 1 }] }),
    B("home-at-sea", "Home at Sea", "Recover twice as many Wounds and HP while Resting on a ship or near water. You can fill in for a first mate or captain in a pinch. Advantage on water-related skill checks."),
    B("at-home-underground", "At Home Underground", "You can dig twice as fast as others. Safe Resting locations underground always count as Lavish lodging for you. You struggle to rest (INT save) while it’s raining. “Water… from the SKY?!”"),
    B("raised-by-goblins", "Raised by Goblins", "You speak Goblin natively (much better than one who has learned it later in life). You automatically notice and can avoid crudely made traps and have advantage to notice and disarm more sophisticated traps. (Change It Up! You can choose any other ancestry to be raised by instead, and exchange the known language and get 1 helpful/iconic ability those people would inculcate.)"),
    B("con-artist", "(Former) Con Artist", "You can forge most documents or mimic voices flawlessly. You have a criminal contact in most major cities. However, your reputation often precedes you—until you prove yourself to be trustworthy."),
    B("history-buff", "History Buff", "Advantage on all Lore checks related to knowledge about items, facts, or events that happened more than 100 years ago."),
    B("secretly-undead", "(Secretly) Undead", "Unnatural Resilience: You are immune to disease and do not need to eat, drink, or breathe. Children, animals, and Celestials are uneasy in your presence; many will be horrified to discover your true nature."),
    B("finer-things", "Taste for the Finer Things", "You always have up-to-date knowledge of the customs and dress of the upper classes and may even know many of their secrets. Advantage on Influence checks with the upper class."),
    B("fearless", "Fearless", "You are immune to the Frightened condition. +1 Initiative. –1 Defense.", { mods: { init: 1, defense: -1 } }),
    B("so-dumb", "So Dumb I’m Smart Sometimes", "Req. 0 or negative INT at character creation. (2/Safe Rest) Reroll a failed INT-related skill or save with advantage.", { uses: [{ key: "sodumb", label: "So Dumb I’m Smart (rilancio INT)", per: "safe", max: 2 }] }),
    B("wily-underdog", "Wily Underdog", "Req. 0 or negative STR at character creation. (2/Safe Rest) Reroll a failed STR attack, STR save, or Might check and use another stat instead.", { uses: [{ key: "underdog", label: "Wily Underdog (rilancio STR)", per: "safe", max: 2 }] }),
    B("bumblewise", "Bumblewise", "Req. 0 or negative WIL at character creation. A total of 1 or less on any WIL-related roll counts as a natural 20 (WIL save, Naturecraft, Perception, Influence, or Insight check)."),
    B("accidental-acrobat", "Accidental Acrobat", "Req. 0 or negative DEX at character creation. Whenever you fail a DEX-related roll (e.g., DEX attack, DEX save, Stealth check, Finesse check), you may roll again. If you still fail, the consequences are BAD."),
    B("tradesman", "Tradesman/Artisan", "Choose a profession (Baker/Cook, Smith, Stonemason, Weaver, Leatherworker, etc.). Checks you make related to that profession are made with advantage. You also retain special knowledge related to your profession.", { textOption: "Professione" }),
  ];

  NIM.MOTIVATIONS = [
    "I owe a life debt to someone in my party.",
    "I owe a LOT of money to some very dangerous people.",
    "I need to grow in power to defeat someone who has wronged me.",
    "I am searching for a way to bring a loved one (or someone I hate) back from the dead.",
    "I am trying to get back home.",
    "I am searching for the one who stole something valuable from me.",
    "I was polymorphed into another kind of creature by a wizard.",
    "Duty calls. I am honor-bound to serve.",
    "I was best friends with (and betrayed by) ____.",
    "I’m lost.",
    "Wanderlust/Pilgrimage.",
    "My hometown is in danger.",
    "Curiosity! I want to learn the DEEP secrets.",
    "To prove my worth.",
    "I’m following a prophecy.",
  ];

  /* ---------------- Equipment ---------------- */
  const items = [];
  const add = (o) => { o.id = o.id || slug(o.name); items.push(o); return o; };

  // Armor: base = defense, dex = adds DEX, maxDex = cap on DEX bonus
  const AR = (name, type, base, dex, cost, req, maxDex) => add({ name, kind: "armor", armor: type, base, dex, maxDex: maxDex || null, req: req || 0, cost, slots: 1 });
  AR("Adventurer’s Garb", "cloth", 2, true, "10 gp");
  AR("Minor Enchantment (cloth)", "cloth", 3, true, "100 gp");
  AR("Major Enchantment (cloth)", "cloth", 4, true, "1,000 gp");
  AR("Epic Enchantment (cloth)", "cloth", 5, true, "10,000 gp");
  AR("Cheap Hides", "leather", 3, true, "5 gp");
  AR("Ox Hide", "leather", 4, true, "45 gp");
  AR("Hard Leather", "leather", 5, true, "300 gp", 1);
  AR("Wyrmhide", "leather", 6, true, "2,000 gp", 1);
  AR("Rusty Mail", "mail", 6, true, "15 gp", 0, 2);
  AR("Chain Shirt", "mail", 9, true, "60 gp", 2, 2);
  AR("Scale Mail", "mail", 12, true, "700 gp", 3, 2);
  AR("Dragonscale", "mail", 15, true, "3,000 gp", 4, 2);
  AR("Rusty Plate", "plate", 10, false, "25 gp", 2);
  AR("Half Plate", "plate", 14, false, "200 gp", 3);
  AR("Full Plate", "plate", 18, false, "2,000 gp", 4);
  AR("Adamantine Plate", "plate", 22, false, "5,000 gp", 5);
  const SH = (name, def, cost, req) => add({ name, kind: "shield", def, req: req || 0, cost, slots: 1 });
  SH("Wooden Buckler", 2, "5 gp");
  SH("Iron Shield", 4, "80 gp", 2);
  SH("Tower Shield", 6, "1,500 gp", 3);
  SH("Dragon Shield", 8, "9,000 gp", 3);

  // Weapons
  const W = (name, n, die, stat, type, props, cost, ranged, extra) =>
    add(Object.assign({ name, kind: "weapon", n, die, stat, dtype: type, props, cost, ranged: !!ranged, slots: props.some((p) => /^2-handed/.test(p)) ? 2 : 1 }, extra || {}));
  W("Dagger", 1, 4, "DEX", "piercing", ["Light", "Thrown 4"], "3 gp");
  W("Sickle", 1, 4, "DEX", "slashing", ["Vicious"], "10 gp");
  W("Club/Mace", 1, 6, "STR", "bludgeoning", [], "2 gp");
  W("Hand Axe", 1, 6, "STR", "slashing", ["Thrown 4"], "8 gp");
  W("Spear", 1, 6, "STR", "piercing", ["2-handed (1-handed: Req. 2 STR)", "Reach 2"], "10 gp");
  W("Short Sword", 1, 6, "DEX", "piercing", ["Light"], "15 gp");
  W("Rapier", 2, 4, "DEX", "piercing", [], "60 gp");
  W("Staff", 1, 8, "STR", "bludgeoning", ["2-handed"], "8 gp");
  W("Longsword", 1, 8, "STR", "slashing", ["2-handed (1-handed: Req. 2 STR)"], "60 gp");
  W("Battleaxe", 1, 10, "STR", "slashing", ["2-handed"], "30 gp");
  W("Pole Hammer", 1, 10, "STR", "bludgeoning", ["2-handed", "Reach 2"], "60 gp");
  W("Glaive", 1, 10, "STR", "slashing", ["2-handed", "Reach 2"], "60 gp");
  W("Great Spear", 1, 10, "STR", "piercing", ["2-handed", "Reach 2"], "60 gp");
  W("Greatmaul", 3, 4, "STR", "bludgeoning", ["2-handed (Req. 2 STR)"], "80 gp");
  W("Greataxe", 2, 6, "STR", "slashing", ["2-handed (Req. 2 STR)"], "100 gp");
  W("Greatsword", 1, 12, "STR", "slashing/piercing", ["2-handed (Req. 2 STR)"], "120 gp");
  W("Sling", 1, 4, "DEX", "bludgeoning", ["2-handed", "Range 12", "Vicious"], "4 gp", true);
  W("Javelins", 1, 6, "STR", "piercing", ["Range 8", "Stack of 4"], "20 gp", true);
  W("Throwing Hammers", 1, 8, "STR", "bludgeoning", ["Range 4", "Stack of 3"], "25 gp", true);
  W("Shortbow", 1, 6, "DEX", "piercing", ["2-handed", "Range 12"], "25 gp", true);
  W("Longbow", 1, 8, "DEX", "piercing", ["2-handed", "Range 16 (Req. 1 STR)"], "30 gp", true);
  W("Crossbow", 4, 4, "DEX", "piercing", ["2-handed", "Load: 1 action", "Range 8"], "60 gp", true);
  W("Handheld Ballista", 1, 20, "DEX", "piercing", ["2-handed", "Load: 2 actions", "Range 8 (Req. 2 STR)"], "120 gp", true);

  // Misc equipment
  const M = (name, text, cost, extra) => add(Object.assign({ name, kind: "misc", text, cost, slots: 1 }, extra || {}));
  M("Healing Potion", "(action) Heal 2d4+4 HP.", "50 gp", { heal: { n: 2, die: 4, bonus: 4 }, slots: 0.5 });
  M("Greater Healing Potion", "(action) Heal 3d6+6 HP.", "150 gp", { heal: { n: 3, die: 6, bonus: 6 }, slots: 0.5 });
  M("Supreme Healing Potion", "(action) Heal 4d8+8 HP.", "450 gp", { heal: { n: 4, die: 8, bonus: 8 }, slots: 0.5 });
  M("Torch (stack of 2)", "For when it’s dark. 1 use each.", "5 sp");
  M("Lantern & Oil", "Like a torch, but not as cool (refill: 1 gp).", "10 gp");
  M("Medical Kit (1 use)", "Recover 1 Wound during a Field Rest.", "20 gp", { woundKit: true });
  M("Vial of Pitch", "Sticky, and VERY flammable.", "2 gp");
  M("Rations (meat)", "Food for the road (starting gear of the Berserker).", "—");
  M("Rope (50 ft.)", "You always need rope.", "10 gp");
  M("Chain (10 ft.)", "Like rope, but stronger (and heavy).", "50 gp");
  M("Bucket", "Also works as a hat in a pinch!", "1 gp");
  M("Padlock & Key", "Lock it or lose it.", "3 gp");
  M("Mirror", "For medusas AND spinach teeth.", "4 gp");
  M("Telescope", "Arrr.", "10 gp");
  M("Magnifying Glass", "Make the small, big.", "5 gp");
  M("Chalk", "Not JUST for kids.", "1 sp");
  M("Shovel", "Sometimes you need a hole dug.", "3 gp");
  M("Pulley", "Pull down, go up.", "3 gp");
  M("Grappling Hook", "For climbing or catching BIG fish.", "4 gp");
  M("Quiver & Ammo", "Don’t leave home without it.", "10 gp");
  M("Saw", "For cutting lumber.", "4 gp");
  M("Soap", "Useless.", "1 sp");
  M("Strange Plant", "Who knows?", "5 sp");
  M("Shiny Object", "Worthless, but VERY pretty.", "1 sp");
  M("Lock Pick", "It’s not mine, honest!", "5 gp");
  M("Bell", "For service.", "2 gp");
  M("Dice", "Math rocks. LOTS of fun.", "5 sp");
  M("Blanket", "Warm & fuzzy.", "1 gp");
  M("Hunting Trap", "Snap snap, don’t lose a finger!", "10 gp");
  M("Camping Supplies", "Bedroll, rations, simple tent.", "5 gp");
  M("Crowbar", "It’s LIKE a key.", "2 gp");
  M("Pitons", "Metal spikes, for sealing doors.", "5 gp");
  M("Manacles", "For when someone has been bad.", "3 gp");
  M("Instrument", "Drums, Horn, Lyre, Flute, etc.", "5–50 gp");
  M("Large Sack", "Like a BIG pocket.", "5 sp");

  NIM.ITEMS = items;
  NIM.ITEM_BY_ID = Object.fromEntries(items.map((i) => [i.id, i]));
  NIM.WEAPON_PROP_HELP = {
    "2-handed": "Can be held in a single hand, but must be wielded in 2 hands to attack with it.",
    Load: "Some weapons require extra actions to load before each shot.",
    Reach: "How close an enemy must be to be affected by this attack. If unspecified, Reach 1.",
    Range: "Attacks can be made from afar. If any enemy is adjacent to you, your Ranged attacks are made with disadvantage. Add 1 die of disadvantage to gain +2 Range (max +6 additional Range; disadvantage 3).",
    Thrown: "Treat a melee weapon as if it had Range. Once thrown, you no longer have it!",
    Vicious: "Roll 1 additional die whenever you roll crit damage.",
    Light: "You may wield 2 Light weapons at the same time (dual wielding).",
  };

  /* ---------------- Conditions ---------------- */
  NIM.CONDITIONS = [
    ["Blind", "Can’t see. Attacks against you have advantage, and your attacks have disadvantage."],
    ["Charged", "Become Charged whenever you take lightning damage. Lasts 1 min or until combat ends. Some spells have additional effects when Charged."],
    ["Charmed", "Sees the charmer as an ally. Charmer has advantage on social interactions with you."],
    ["Dazed", "Heroes: lose 1 action; monsters: can perform one less action on their next turn."],
    ["Deafened", "Can’t hear."],
    ["Distracted", "A target is Distracted if it is adjacent to or Taunted by an ally, or if it cannot see you. Minor status: does nothing on its own."],
    ["Dying", "At 0 HP. Max 1 action. Concentration ends. Attacking causes 1 Wound unless you succeed on a DC 10 STR save. Taking damage while Dying causes 2 Wounds; a crit causes 3 instead."],
    ["Empowered X", "Attack damage increased by X."],
    ["Frightened", "Disadvantage on rolls when source of fear is near; Speed halved when moving closer to it."],
    ["Grappled", "Cannot move. Attacks against you have advantage. Spend an action and succeed on a STR or DEX save (vs the grappler’s DC) to end it."],
    ["Hampered", "Any creature with actions or movement reduced (e.g., Dazed, Grappled/Restrained, Prone, Slowed, in Difficult Terrain)."],
    ["Incapacitated", "Can’t do anything. Attacks against you have advantage, and melee attacks that hit, crit."],
    ["Invisible", "Cannot be seen. Your attacks have advantage, and attacks against you have disadvantage."],
    ["Petrified", "Incapacitated with all the benefits and drawbacks of being a rock! Immune to most damage except from large explosions, picks, or similar tools."],
    ["Poisoned", "Disadvantage (typically, healing ends)."],
    ["Prone", "Movement costs twice as much, and disadvantage on attacks. Melee attacks against you have advantage; Ranged have disadvantage. Spend 3 spaces of your Speed to stand up."],
    ["Restrained", "Functions like Grappled, but is caused by objects (sticky tar, chains, rope, roots) and ignores size restrictions. Can be ended through any logical means."],
    ["Riding", "You move with the creature you are riding. Any attacks that miss you, strike them."],
    ["Silenced", "Cannot cast spells or use other abilities that require speaking (e.g., Commander’s Orders)."],
    ["Slowed", "Speed halved during your next turn."],
    ["Smoldering", "Minor status: does nothing on its own, though some spells and abilities have additional effects against Smoldering creatures, ending the condition."],
    ["Taunted", "Disadvantage on attacks except against the most recent taunter."],
    ["Weakened X", "Attack damage reduced by X."],
  ].map(([name, text]) => ({ id: slug(name), name, text }));

  /* ---------------- Quick rules reference ---------------- */
  NIM.RULES = [
    ["Skill check & Saves", "Roll 1d20 and add your skill (check) or the relevant stat (save). Meets or exceeds the DC = success. A roll of 1 always fails; a roll of 20 always succeeds. DCs: Easy 8, Medium 12, Challenging 15, Very Difficult 18, Extremely Difficult 20. The DC for effects a hero causes is 10+KEY. Each hero has 1 advantaged save (▲), 1 disadvantaged save (▼), and 2 neutral saves."],
    ["Advantage & Disadvantage", "Advantage: roll 1 additional die of the same type and remove the lowest. Disadvantage: remove the highest instead. For multiple instances, roll 1 extra die for each and remove the lowest/highest. Ties: remove dice left to right. 1 advantage cancels out 1 disadvantage before you roll."],
    ["Initiative", "Each hero rolls 1d20 + Initiative bonus (typically DEX). A single digit total = start with 1 action; 2 digits = 2 actions; 20+ (or a natural 20) = all 3 actions. At the end of their turn heroes gain all 3 actions back. By default, heroes go first, monsters act last."],
    ["Heroic Actions", "3 actions per turn. Attack, Move, Cast Spell and Assess each cost 1 action (strong abilities may cost more). Free Actions: simple tasks, 1/turn."],
    ["Attack", "Roll the weapon die and deal that much damage. If the Primary Die (leftmost) is a 1, the attack misses. If it rolls the max, it is a critical hit: roll the Primary Die again and add it to the total; repeat every time you roll the max. Additional attacks on your turn are Rushed: cumulative disadvantage for each attack after the first. Weapons used without proficiency cannot crit."],
    ["Defend (reaction)", "Reduce incoming damage from a single attack by your Defense. Crits ignore Defense. 1/round. Defending while wearing armor without proficiency costs 1 additional action."],
    ["Heroic Reactions", "Cost 1 action, 1/round each: Defend, Interpose (if a creature within Reach 2 would be hit, enter their space and become the new target), Opportunity Attack (melee attack with disadvantage against an adjacent creature as it willingly moves away; only heroes), Help (allow an ally to reroll; limit 1 Help/roll)."],
    ["Assess", "Choose one and make a DC 10 skill check: Ask a Question (GM answers honestly); Create an Opening (change the next Primary Die rolled against a target this round 1 face higher); Anticipate Danger (change ALL Primary Dice rolled against you this round 1 face lower). Can’t Assess using the same skill more than once in an encounter."],
    ["Hit Points, Wounds & Dying", "At 0 HP, gain 1 Wound and the Dying condition until you regain HP. While Dying: max 1 action; Concentration ends; attacking causes 1 Wound unless you succeed on a DC 10 STR save; taking damage causes 2 Wounds (crit: 3). You die when you have taken 6 Wounds. Temp HP are reduced first, don’t combine (keep the larger), and expire after a Safe Rest."],
    ["Field Rests", "Catch Breath: at least 10 minutes. Expend any number of Hit Dice one at a time (roll them and add your STR to each) and regain that many HP. Make Camp: Rest at least 8 hours with food and sleep; take the max value for each Hit Die you expend instead of rolling, add your STR as usual. A negative STR lowers each Hit Die you expend."],
    ["Safe Rests", "After a Safe Rest (e.g. lodging at an inn overnight; camping in the wilderness or a dungeon is not enough) heroes recover all of their HP, Hit Dice, mana (and other class-specific resources), and heal 1 Wound."],
    ["Leveling Up", "HP Increase: roll your Hit Die with advantage and add it to max HP (or take the average: d4 +3, d6 +4, d8 +5, d10 +7, d12 +8). Hit Die max +1. Gain 1 skill point; you may also move 1 point from one skill to another. Gain new class features. Max skill bonus +10."],
    ["Inventory", "10+STR inventory slots. 1 slot: a 1-handed weapon, shield, worn armor, stack of javelins, 500 gp, or 2 potions. 2 slots: a 2-handed weapon, unworn armor, or similarly bulky items."],
    ["Movement", "Speed is typically 6 spaces. Difficult Terrain halves movement. Prone: spend 3 spaces to stand up. Falling: 1d6 bludgeoning per 2 spaces fallen. Forced movement stopped by an obstacle: 1d6 bludgeoning per space cut short."],
    ["Cover & Hiding", "Cover imposes disadvantage on attacks against the creature. Full Cover: cannot typically be targeted. To hide in combat you need Cover and an action for a DC 10 Stealth check; the first attack you make while hidden has advantage."],
    ["Concentration", "Only one activity at a time. Whenever you are crit while concentrating, make a DC 10 STR save or Concentration breaks. Concentration automatically ends at 0 HP or when Incapacitated."],
  ];

  /* ---------------- Spells ---------------- */
  NIM.SCHOOLS = {
    fire: ["Fire", "Deal high, consistent damage at long range. Some fire spells can inflict the Smoldering condition and gain additional destructive effects against Smoldering enemies."],
    ice: ["Ice", "Deal medium damage at long range, with a focus on controlling the battlefield and protecting the spellcaster. Some ice spells have additional effects against Hampered targets."],
    lightning: ["Lightning", "Deal very high damage at medium range with a focus on teleporting around the battlefield and taking advantage of creatures equipped with metal. Some lightning spells may fail to find ground and damage the spellcaster instead."],
    wind: ["Wind", "Aid in moving friend and foe alike around the battlefield. They can also slice and cut through entire groups of foes and viciously deal extra damage on critical hits."],
    radiant: ["Radiant", "Can obliterate the unholy, the fearful, and those who would dare harm you or your allies. Equally effective at a distance or in melee. Other spells can protect, mend Wounds, and even restore creatures back to life!"],
    necrotic: ["Necrotic", "Summon horrible minions or manipulate and trap targets. Some risky necrotic spells prey upon damaged creatures, sapping their very life force—but frequently fail to distinguish between friend and foe."],
  };
  NIM.MAGIC_RULES = "There are 6 core schools of magic. Each school has its own cantrips and 9 Tiers of progressively more powerful spells. A spell’s mana cost is equal to its Tier; cantrips cost no mana. Upcasting: spend additional mana on Tiered spells (up to the Tier you have unlocked) for each additional mana spent. Spells with “Range” are cast with disadvantage if ANY enemy is adjacent (add 1 die of disadvantage to gain +2 Range, max +6); spells with “Reach” are cast as normal even when in melee. Half on Save: creatures who save take half as much damage and suffer no other effects. Casting a spell requires 1 hand free (or a spellcasting focus) and the ability to speak. Your save DC is typically 10+KEY.";

  const spells = [];
  const SP = (school, tier, name, cost, text, up, high, tags) =>
    spells.push({ id: slug(name), school, tier, name, cost, text, up: up || "", high: high || "", tags: tags || "" });
  // Fire
  SP("fire", 0, "Flame Dart", "1 Action", "Range: 10. Damage: 1d10. On crit: Smoldering.", "", "+5 damage every 5 levels.");
  SP("fire", 0, "Heart’s Fire", "1 Action", "Range: 4. (1/round) Give an ally 1 action. Cast as a Reaction for 1 mana.", "", "+2 Range every 5 levels.");
  SP("fire", 1, "Ignite", "2 Actions", "Range: 10. Damage: 4d10 to a Smoldering target.", "+10 damage.");
  SP("fire", 2, "Enchant Weapon", "1 Action", "Concentration: 1 min. Reach: 8. A weapon you choose inflicts Smoldering on crit and gains (1/turn) +KEY damage.", "+KEY damage.");
  SP("fire", 3, "Flame Barrier", "0 Actions", "Castable only while Defending. Reach: 1, AoE. Damage: 10+KEY and Smoldering. Triggers whenever you are attacked this round.", "+KEY damage OR +1 Reach.", "", "AoE");
  SP("fire", 4, "Pyroclasm", "2 Actions", "Reach: 3, AoE. Damage: 2d20+10 on a failed DEX save (Smoldering creatures fail); half on save.", "Advantage 1 and +1 Reach.", "", "AoE");
  SP("fire", 5, "Fiery Embrace", "2 Actions", "Concentration: 1 min. Reach: 10, AoE. An ally gains the effects of Enchant Weapon. Enemies gain Smoldering, and effects that would end it, don’t.", "+1 ally and +2 Reach.", "", "AoE");
  SP("fire", 7, "Living Inferno", "3 Actions", "Gain the effects of Flame Barrier until your next turn. At the end of this turn and your next turn, cast Pyroclasm for free.", "Upcast Flame Barrier and Pyroclasm.");
  SP("fire", 9, "Dragonform", "5 Actions", "Transform into a Huge dragon. Gain 3 actions, a flying Speed of 12, LVL Defense, 10×LVL temp HP, and: • Tooth & Claw. 1 Action: (Reach 2) 1d20+LVL damage (ignoring armor). Inflicts Smoldering. • Immolating Breath. 2 Actions: (Cone 10, AoE) KEY d20 damage, half on DEX save (Smoldering targets fail). Note. You can maintain this form for as long as the temp HP granted by this spell remain (max. 10 min). When it ends, you drop to 0 HP.");
  // Ice
  SP("ice", 0, "Ice Lance", "1 Action", "Range: 12. Damage: 1d6 cold/piercing, Slowed.", "", "+3 damage every 5 levels.");
  SP("ice", 0, "Snowblind", "1 Action", "Reach: 1. Damage: 1d6, Blind until the end of their next turn.", "", "+3 damage every 5 levels.");
  SP("ice", 1, "Frost Shield", "0 Actions", "Castable only while Defending. Gain 2×KEY temp HP. The temp HP are lost at the start of your next turn.", "+5 temp HP.");
  SP("ice", 2, "Shatter", "2 Actions", "Range: 12. Damage: 3d6. ANY die can crit vs a Hampered target. On crit: +20 damage (instead of rolling any additional dice).", "Increase a die roll by 1 and +5 damage on crit.");
  SP("ice", 3, "Omenrime", "1 Action", "Reach: 6. Roll 1d6; you may replace any single die rolled within Reach with that die (it expires at the end of the encounter if unused). Replacing a die: exchange the original die with the d6 that you rolled; treat it exactly as if that die were the one originally rolled.", "+1 Reach and roll +1d6 (keep only 1).");
  SP("ice", 4, "Rimeblades", "3 Actions", "Concentration: 1 min. Reach: 12, AoE. Conjure icy blades in 5 contiguous spaces; this area is Difficult Terrain. Creatures there (or who enter later) suffer 2d6 damage for each space they touch.", "+1 space and +1 damage.", "", "AoE");
  SP("ice", 5, "Arctic Blast", "2 Actions", "Reach: Cone 4, AoE. Damage: 4d6+10. This area is Difficult Terrain for 1 round. Any already Hampered creatures there are Restrained (frozen in place).", "+1 Reach.", "", "AoE");
  SP("ice", 8, "Glacier Strike", "3 Actions", "Range: 12, 3×3 AoE. Damage: d66 bludgeoning. Creatures adjacent to that area take half as much. The entire area permanently becomes Difficult Terrain. (D66: roll 2d6; the leftmost die is the tens place, the second the ones, e.g. 4 and 5 deal 45.)", "+1 initial area.", "", "AoE");
  SP("ice", 9, "Arctic Annihilation", "3 Actions", "Reach: 12, AoE. Any targets you choose are encased in ice and immune to damage and negative effects until the start of their next turn. All others take d66 damage, then make a STR save or be Incapacitated until the end of their next turn. Note. Once you cast this spell, you must Safe Rest for 1 week before using it again.", "", "", "AoE");
  // Lightning
  SP("lightning", 0, "Zap", "1 Action", "Range: 8. Damage: 1d8+4. On miss: you take half the damage instead.", "", "+6 damage every 5 levels.");
  SP("lightning", 0, "Overload", "1 Action", "Castable only if Charged, ending the condition. Reach: 2, AoE. Damage: 2d8.", "", "+4 damage every 5 levels.", "AoE");
  SP("lightning", 1, "Arc Lightning", "2 Actions", "Range: 12. Damage: 3d8. Also hits the next closest creature. (If you are the closest, you are hit! If 2 creatures are equally close, the GM can select randomly, the taller one, or whoever has the most metal.)", "+4 damage.", "", "1+ target");
  SP("lightning", 2, "Alacrity", "0 Actions", "(1/turn) Teleport up to your Speed, gain Charged (can be cast while Defending, after damage).", "+4 spaces.");
  SP("lightning", 3, "Stormlash", "2 Actions", "Line: 12, AoE. Damage: 3d8+4 and Prone on a failed STR save. Creatures with a large amount of metal (e.g., armor or a longsword) roll with disadvantage and suffer +10 damage.", "+4 damage.", "", "AoE");
  SP("lightning", 4, "Electrickery", "3 Actions", "Castable when an ally is attacked. Range: 8. Teleport an ally away. Teleport another creature there on a failed WIL save (making them the target). Costs 1 action if Charged, ending the condition.", "+2 Range.");
  SP("lightning", 5, "Electrocharge", "2 Actions", "Concentration: 1 min. Reach: 4. Give a creature Charged, +1 max action, +5 Defense, 2× Speed, and advantage on DEX saves.", "+4 Reach.");
  SP("lightning", 6, "Ride the Lightning", "3 Actions", "Reach: 12, AoE. Teleport to a spot you can see (if a willing creature is there, swap places with them). Adjacent creatures take d88 damage and Knockback 2. Creatures moved 2+ spaces are also knocked Prone, Dazed, and deafened for 1 day. (D88: roll 2d8; leftmost die is the tens place, the second the ones.)", "+1 Knockback.", "", "AoE");
  SP("lightning", 9, "Seething Storm", "3 Actions", "Concentration: 1 min. Become a cloud of tempestuous storm. You can fly, move for free 1/round, and attacks against you are disadvantaged. At the end of each of your turns, strike up to 4 creatures within Reach 4 with a bolt of lightning for d88 damage (a creature can only be struck 1/round). Costs 3 actions each round to maintain. +2 Reach and +2 lightning bolts each round. Note. Once you cast this spell, you must Safe Rest for 1 week before you can use it again.", "", "", "AoE");
  // Wind
  SP("wind", 0, "Razor Wind", "1 Action", "Range: 12. Damage: 2d4 slashing, with advantage OR include a 2nd creature adjacent to your target.", "", "+3 damage every 5 levels.");
  SP("wind", 0, "Breath of Life", "1 Action", "Range: 6. Restore 1d4 HP to a Dying creature. If healed for 4+: they also regain 1 action.", "", "+2 Range and healing every 5 levels.");
  SP("wind", 1, "Blustery Gale", "2 Actions", "Range: 12. Damage: 3d4 bludgeoning, Knockback 2 (advantage vs flying/Small/Tiny). Forced movement deals +5 damage instead of rolling additional dice.", "+1 Knockback.");
  SP("wind", 2, "Barrier of Wind", "0 Actions", "Castable only while Defending vs Ranged. Reach: 1. Reduce the Primary Die by 3. If it misses, redirect the original attack to another space in Reach.", "+1 Reduction and +1 Reach.");
  SP("wind", 3, "Echoburst", "2 Actions", "Reach: 1. Damage: d44 bludgeoning (ignoring armor). Any creature in the targeted space at the beginning of your next turn takes this damage again. (D44: roll 2d4; leftmost die is the tens place, the second the ones.)", "Roll with advantage OR +1 Reach.");
  SP("wind", 4, "Eye of the Storm", "2 Actions", "Reach: 3, AoE. Damage: 4d4+10 bludgeoning to enemies. Place surviving creatures anywhere within 1 space of the storm’s Reach on a failed STR save.", "+1 Reach.", "", "AoE");
  SP("wind", 5, "Updraft", "2 Actions", "Reach: 12, 5×5 AoE. Damage: 20 bludgeoning minus a DEX save. On 10+ damage, they land Prone and Dazed.", "+2 damage.", "", "AoE");
  SP("wind", 6, "Thousand Cuts", "3 Actions", "Range: 12. Damage: d44 slashing with advantage (roll 3d4 and drop the lowest die; the leftmost die is the tens place, the second the ones). Also damages enemies within Reach 1 of your target.", "+1 Reach.", "", "AoE");
  SP("wind", 7, "Boisterous Winds", "2 Actions", "Reach: 12. Gently move all creatures up to 6 spaces, each in a straight line in a direction of your choice. At the beginning of your subsequent turns, do so again but 2 fewer spaces.", "+2 spaces.");
  // Radiant
  SP("radiant", 0, "Rebuke", "1 Action", "Reach: 4. Damage: 1d8 (ignoring armor). 2× damage against undead or cowardly (those Frightened or behind Cover).", "", "+3 damage every 5 levels.");
  SP("radiant", 0, "True Strike", "1 Action", "Reach: 4. A target gains advantage (ignoring all sources of disadvantage) and +1 Reach on the next attack they make this encounter.", "", "+1 Reach every 5 levels.");
  SP("radiant", 1, "Heal", "1 Action", "Reach: 1. Heal a target 1d8+KEY HP. Powerful Healing: if 5+ mana is spent, heal a negative condition as well (e.g., Blind, 1 Wound).", "(Choose 1) +1d8, +1 target, OR +4 Reach.");
  SP("radiant", 2, "Warding Bond", "0 Actions", "Concentration: 1 min. Reach: 4. Make an ally your ward: they take 2 less damage from all sources. (1/round) When they are attacked, you may be attacked for some or all of the damage instead.", "+2 Reach and +2 damage reduction.");
  SP("radiant", 3, "Condemn", "1 Action", "Can only target enemies who crit since your last turn. Reach: 4. Damage: 30. Cannot be reduced by any means. The next attack against that enemy gains advantage.", "+1 Reach and +1 advantage.");
  SP("radiant", 4, "Shield of Justice", "0 Actions", "Castable only while Defending. Creatures who attack you are Blinded (until the end of their next turn); you deal damage back to each (ignoring armor) equal to damage you take this round.", "+5 damage OR +5 Defense.");
  SP("radiant", 5, "Vengeance", "2 Actions", "Can only target enemies who attacked a Dying ally or reduced one to 0 HP since your last turn. Reach: 1. Damage: 1d100.", "+1 Reach and +1 advantage.");
  SP("radiant", 6, "Sacrifice", "1 Action", "Reach: 4. Reduce yourself to 0 HP and you cannot have more than 0 HP until you Safe Rest. Heal an amount of HP equal to your max HP, divided as you choose among any other creatures. Dead? You may revive a creature that has died in the past minute if you give them at least 20 HP (also healing 2 Wounds from them), provided they have not been revived with this spell before.", "+4 Reach.");
  SP("radiant", 7, "Celestial Legion", "1 Action", "(1/turn) Any friendly creature may use 1 of 3 charges to call upon higher powers for aid this encounter: • Reckoning. When you attack, gain advantage (ignoring all disadvantage) and add 1d20 damage to the attack; with advantage too, if Bloodied. • Trembling. When attacked, the enemy becomes Frightened of you until the end of their next turn. Reduce the incoming damage by 1d20 if Bloodied.", "+1 charge.");
  SP("radiant", 9, "Redeem", "1 Day", "Requires (and consumes) a diamond worth 10,000 gp. Reach: 1 mile. Revive any number of creatures that have died in the past year, provided they have not died of old age or been revived with this spell before.", "", "", "AoE");
  // Necrotic
  SP("necrotic", 0, "Entice", "1 Action", "(1/round) Range: 12. Damage: 1d12 (ignoring armor). Target moves Primary Die spaces closer to you and gains 1d12 damage on their next attack.", "", "You may add 1d12 every 5 levels.");
  SP("necrotic", 0, "Withering Touch", "1 Action", "Reach: 1. Damage: 1d12. On damage, target is considered undead for 1 round.", "", "+6 damage every 5 levels.");
  SP("necrotic", 1, "Shadow Trap", "1 Action", "Reaction: When an enemy moves next to an ally within Reach 8. Damage: 2d12. If Small/Tiny, the enemy is also Restrained until they escape.", "+1 size category and +1d12 damage on escape.");
  SP("necrotic", 2, "Dread Visage", "0 Actions", "Castable only while Defending. Damage: 1d12 and Frighten all creatures attacking you in melee this round. Costs 2 mana less while Dying.", "+2 damage and +2 Defense.");
  SP("necrotic", 3, "Vampiric Greed", "2 Actions", "Reach: 1, AoE. Damage: 4d12. Heal HP equal to the damage dealt then gain 1 Wound. Gain 1 additional Wound for each creature that survived this damage.", "+1 Reach OR +10 damage.", "", "AoE");
  SP("necrotic", 4, "Vigor Mortis", "1 Action", "Castable only when an ally drops to 0 HP. Concentration: 1 min. Reach: 8. Their max actions do not change, they skip STR saves to act, and taking damage while Dying causes 1 fewer Wound (min 1).", "+10 temp HP.");
  SP("necrotic", 5, "Gangrenous Burst", "2 Actions", "Reach: Up to 8, AoE. Damage: 3d20 (ignoring armor) to damaged creatures on a failed STR save (target rolls with disadvantage if Bloodied), half on save.", "+10 damage.", "", "AoE");
  SP("necrotic", 6, "Unspeakable Word", "2 Actions", "Reach: 8. Damage: d66 with advantage (ignoring armor; roll 3d6 and drop the lowest die). On a failed INT save (disadvantage if Bloodied or Frightened) the target is Weakened 10, and you are Empowered 10 on your next attack. On save, the opposite happens instead.", "+1 DC and +10 damage.");
  SP("necrotic", 7, "Creeping Death", "3 Actions", "Reach: 8, AoE. Damage: 4d20. If this kills the creature, repeat the damage to another creature within Reach 8 of it not yet damaged by this effect. Repeat until a target survives or no others are within Reach.", "+10 damage.", "", "AoE");
  // Utility cantrips (school stored, tier 0, utility flag)
  const UT = (school, name, cost, text) => spells.push({ id: slug(name), school, tier: 0, utility: true, name, cost, text, up: "", high: "", tags: "Utility" });
  UT("fire", "Firebrand", "1 Action", "Touch a surface and secretly mark it with a symbol or brief message. Speaking a chosen command word nearby reveals it.");
  UT("fire", "Fire Step", "1 Minute", "Teleport to a fire source you can see.");
  UT("fire", "Kindle", "1 Action", "Conjure a minor visual illusion. OR: Ignite a small, unheld item within Reach 6.");
  UT("ice", "Chillcraft", "1 Action", "Chill. Harmlessly freeze, thaw, or move a bath-sized amount of water near you. OR: Craft. Conjure a sheet of opaque, mirror-like, or transparent ice the size of a window or door.");
  UT("ice", "Ice Disk", "1 Minute", "Conjure a floating disk of ice that follows you. It can carry moderately heavy weight for 1 hour or until you cast this spell again.");
  UT("ice", "Wintry Scrying", "1 Minute", "Turn a small patch of water into a reflective icy mirror. Looking through it grants you vision of any desired location near this body of water for 10 min.");
  UT("lightning", "Spark Buddy", "1 Minute", "Conjure a Tiny (squirrel-sized) helper for up to 1 hour. It can fetch Tiny objects, open unlocked doors, illuminate a small area, or deliver a harmless shock. If it takes damage or moves further than 6 spaces away from you, it dissipates into sparks.");
  UT("lightning", "Spark Step", "1 Action", "Reach: 4. Teleport to a metal object.");
  UT("lightning", "Tempest’s Command", "1 Action", "Dispel a minor magical effect, or temporarily suppress a stronger one (the more powerful an enchantment, the shorter the duration). OR: Your eyes glow and your voice is amplified to a thunder-like volume for 1 min.");
  UT("wind", "Wind Whisper", "1 Action", "You whisper a message into the wind and it will be secretly carried to a specified target anywhere wind could reach.");
  UT("wind", "Helpful Gust", "1 Action", "Reach: 6. Gently move a Tiny unheld item in any direction. OR: Generate an illusory scent.");
  UT("wind", "Feather Fall", "1 Action", "Reach: 6. Reaction: When a creature falls, cause them to gently float to the ground.");
  UT("radiant", "Light", "1 Action", "Cause an item to brightly glow as a torch with radiant light for as long as you hold it.");
  UT("radiant", "Beautify", "1 Action", "Clean stains or repair a small tear/break in a non-magical item, or conjure tiny beautiful things: flowers, butterflies, etc.");
  UT("radiant", "Bond of Peace", "1 Action", "Bond. Telepathically communicate simple thoughts or feelings with a friendly creature you can see. OR: Peace. Imbue your spoken words with calming magic, granting advantage on any check made to soothe anger or fear in creatures who can hear you.");
  UT("necrotic", "Gravecraft", "1 Action / 1 Minute", "Gravemark. Magically soil a surface with blood, filth, or other disgusting things (1 Action). Gravework. Shape/move a body-sized plot of earth (1 Minute).");
  UT("necrotic", "False Face", "1 Minute", "Change your appearance to look like someone else for 10 min. Requires a piece of them.");
  UT("necrotic", "Thought Leech", "1 Action", "Reach: 6. Read the surface thoughts of a creature. They can sense you doing this and may not like it.");
  NIM.SPELLS = spells;
  NIM.SPELL_BY_ID = Object.fromEntries(spells.map((s) => [s.id, s]));
})();
