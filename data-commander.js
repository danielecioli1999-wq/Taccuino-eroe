/* Classe: Commander (Nimble Heroes: Commander, 2026).
   Testi tratti dal manuale, usati secondo la Nimble 3rd Party Creator License v2.0. */
(function () {
  const NIM = (globalThis.NIM = globalThis.NIM || {});
  NIM.CLASSES = NIM.CLASSES || {};

  const orders = [
    {
      id: "commanding-presence", name: "Commanding Presence", cost: "1 Action", uses: { key: "ord-presence", per: "enc", max: 1 },
      text: "(1/encounter) Make an Influence check, and Command an enemy to perform a single simple action and they spend their entire next turn obeying it: • 1–9: Move! The creature moves to a place you choose. • 10–19: Kneel! Move them, then they are considered Prone. • 20+: Strike! They move and attack a target of your choice.",
      sb: "Withering Presence. Creatures you Command suffer necrotic damage equal to the max value of your Combat Die (ignoring armor) and are considered undead for 1 round.",
    },
    {
      id: "face-me", name: "Face Me!", cost: "0 Actions",
      text: "After an enemy crits or attacks a Dying ally, you may Taunt them. Lasts until you drop to 0 HP.",
      sb: "Glimmering Decree. Free Reaction (whenever an enemy crits or attacks a Dying ally): That enemy takes STR d8 radiant damage (ignoring armor), is pulled up to 4 spaces toward you, and is Taunted by you until you drop to 0 HP.",
    },
    {
      id: "hold-the-line", name: "Hold the Line!", cost: "1 Action", uses: { key: "ord-hold", per: "enc", max: 1 },
      text: "(1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3× your LVL.",
      sb: "Crystalline Armor. (1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3× your LVL. Additionally, they gain that many temp HP. Enemies who reduce this temp HP in melee have their Speed halved until the end of their next turn.",
    },
    {
      id: "all-day", name: "I Can Do This ALL DAY!", cost: "1 Action", uses: { key: "ord-allday", per: "enc", max: 1 },
      text: "(1/encounter) Reaction (when you would drop to 0 HP): Expend any number of Hit Dice and set your HP to the sum rolled instead (do not add your STR).",
      sb: "Rising Phoenix. (1/encounter) Reaction (when you would drop to 0 HP): You may expend any number of Hit Dice, set your HP to the sum rolled instead, and deal that much fire damage to each enemy within Reach 2 of you. They gain the Smoldering condition.",
    },
    {
      id: "move-it", name: "Move it! Move it!", cost: "Passive",
      text: "When you roll Initiative, give yourself and an ally advantage on the roll and +3 Speed for 1 round.",
      sb: "Borne upon the Wind. When you roll Initiative, you may give yourself and an ally advantage on the roll, +3 Speed, and the ability to fly for 1 round. Then, you both can also move for free.",
      initAdv: true,
    },
    {
      id: "reposition", name: "Reposition!", cost: "1 Action",
      text: "Command 1 ally to move up to their Speed (or 2 allies up to half their Speed) for free. You may use this as a reaction on an ally’s turn.",
      sb: "Flashstep. Action: Command 1 ally to move up to their Speed (or 2 allies up to half their Speed) for free; you may exchange places with one of them. You may use this as a reaction on an ally’s turn.",
    },
  ];

  const tactics = [
    { id: "heavy-strike", name: "Heavy Strike", cost: "Passive", mult: 1, text: "Whenever you hit, deal +Combat Die damage and knockback your target STR spaces." },
    { id: "inerrant-strike", name: "Inerrant Strike", cost: "Passive", mult: 1, text: "Whenever you miss, add 1 to the Primary Die and deal +Combat Die damage." },
    { id: "lunging-strike", name: "Lunging Strike", cost: "Passive", mult: 2, text: "Whenever you attack, gain +1 Reach and +2× Combat Die damage." },
    { id: "sweeping-strike", name: "Sweeping Strike", cost: "Passive", mult: 1, text: "Whenever you attack, spend 1 additional action to select any contiguous area within your weapon’s Reach, deal +Combat Die damage to ALL targets there (AoE attacks do not miss on a 1, nor crit on the max)." },
  ];
  const extraTactics = [
    { id: "shatter-formation", name: "Shatter Formation", cost: "Action", mult: 1, sub: "siege-breaker", minLevel: 7, text: "(New Combat Tactic) Action: Roll a Combat Die and deal that much damage to up to STR targets within your weapon’s Reach, and knockback 2. You may use this ability while moving." },
    { id: "tear-asunder", name: "Tear Asunder", cost: "Passive", mult: 1, sub: "siege-breaker", minLevel: 11, text: "(New Combat Tactic) Strike an armored foe and deal +Combat Die damage. The next non-critical attack against them ignores armor." },
  ];

  const masteries = [
    { id: "slashing", name: "Slashing", cost: "1/turn", text: "(1/turn) Your attacks with slashing weapons can strike 1 additional creature adjacent to you and your target." },
    { id: "bludgeoning", name: "Bludgeoning", cost: "1/turn", text: "(1/turn) Your attacks with bludgeoning weapons deal +10 damage vs armored foes." },
    { id: "piercing", name: "Piercing", cost: "1/turn", text: "(1/turn) Your attacks with piercing weapons can strike another creature behind your target within Reach." },
  ];

  const subclasses = [
    {
      id: "bulwark", name: "Champion of the Bulwark",
      tagline: "Become an iron-clad juggernaut and boost your party with your defensive prowess.",
      features: [
        { level: 3, items: [
          ["Armor Master", "You are proficient with plate armor."],
          ["Shield Expert", "While equipped with a shield you can Defend for free; when you do, you may deal damage to an adjacent enemy equal to your shield’s Defense."],
        ] },
        { level: 7, items: [["Juggernaut", "When you use Coordinated Strike, you can spend an additional action to add 1 to your Primary Die and deal extra damage equal to your Defense."]] },
        { level: 11, items: [["Taunting Strike", "(1/turn) You may Taunt a creature you attack until the end of their next turn."]] },
        { level: 15, items: [["Shield Wall", "(Reach 2) Your shields gain +2 Defense. Your allies can also use your shield’s Defense when they Defend."]] },
      ],
    },
    {
      id: "phalanx", name: "Champion of the Phalanx",
      tagline: "“Together we stand, divided we fall!”",
      features: [
        { level: 3, items: [
          ["Polearm Mastery", "Weapons with Reach 2 gain +1 Reach; OR can be wielded one-handed with a shield."],
          ["Skewer", "You can perform Opportunity Attacks against enemies that enter the Reach of your weapon. If the movement was forced, attack with advantage instead of disadvantage."],
        ] },
        { level: 7, items: [["Formation March", "Whenever you move, allies within Reach of your weapon may move with you for free."]] },
        { level: 11, items: [["Together We Stand", "Add 1 to your Combat Die rolls for each ally within your weapon’s Reach."]] },
        { level: 15, items: [["Shoulder to Shoulder", "Allies within your weapon’s Reach gain +1 Reach to their weapons and gain the benefits of your Weapon Masteries."]] },
      ],
    },
    {
      id: "vanguard", name: "Champion of the Vanguard",
      tagline: "A forward-charging general who leads from the front!",
      features: [
        { level: 3, items: [["Advance!", "(Reach 12) Whenever you use your Coordinated Strike, you and all allies can first move up to half their Speed for free. Gain advantage on the first melee attack you make against enemies you moved toward this turn."]] },
        { level: 7, items: [["Experienced Commander", "Your Coordinated Strike may target 1 additional ally."]] },
        { level: 11, items: [["Survey the Battlefield", "When you roll Initiative, regain 1 use of Coordinated Strike. +1 max Combat Dice."]] },
        { level: 15, items: [["As One!", "All attacks made with your Coordinated Strike are made with advantage."]] },
      ],
    },
    {
      id: "arena", name: "Champion of the Arena",
      tagline: "A simple, single-minded fighter who goes for the glory!",
      features: [
        { level: 3, items: [
          ["Single-minded Fighter", "You forgo all Commander’s Orders. Whenever you would choose one, you gain +1 max Combat Die instead."],
          ["Showstopping Strike", "(1/Safe Rest) When you use Coordinated Strike, you and your ally both automatically crit."],
          ["Glory Seeker", "(1/round) Whenever an ally crits, your next attack is made with advantage."],
        ] },
        { level: 7, items: [
          ["Pushed to the Brink", "Showstopping Strike refreshes the first time each encounter you gain the Dying condition."],
          ["Remarkable Strategy", "(1/encounter) When Assessing with an INT skill, you may roll a Combat Die and add it to the result (without expending it)."],
        ] },
        { level: 11, items: [["Superior Striker", "Gain +STR Initiative. Showstopping Strike refreshes when you roll Initiative."]] },
        { level: 15, items: [["Outlast, Outmatch", "Your Coordinated Strike also grants you and your ally temp HP equal to the max value of your Combat Die."]] },
      ],
    },
    {
      id: "siege-breaker", name: "Champion of the Siege-Breaker",
      tagline: "Unleash aggressive combat tactics to disrupt your enemies. Leave the shield behind, it’ll only weigh you down.",
      features: [
        { level: 3, items: [
          ["Siege Veteran", "+STR Defense when wielding a weapon with 2 hands."],
          ["Mighty Cleave", "Whenever your damage dice on a melee attack sum to 8+, you may select 1 additional target within your weapon’s Reach."],
        ] },
        { level: 7, items: [["Shatter Formation", "(New Combat Tactic) Action: Roll a Combat Die and deal that much damage to up to STR targets within your weapon’s Reach, and knockback 2. You may use this ability while moving."]] },
        { level: 11, items: [
          ["Relentless Assault", "+2 max Combat Dice. You roll Combat Dice with advantage."],
          ["Tear Asunder", "(New Combat Tactic) Strike an armored foe and deal +Combat Die damage. The next non-critical attack against them ignores armor."],
        ] },
        { level: 15, items: [["Against the Hordes", "If there are 2+ enemies within your weapon’s Reach, your melee attacks have advantage and always trigger Mighty Cleave."]] },
      ],
    },
    {
      id: "spellblade", name: "Spellblade — Steel Meets Spell",
      tagline: "Steel meets spell.",
      features: [
        { level: 3, items: [
          ["Arcane Command", "Your focus on the arcane causes you to lose access to Weapon Mastery and Combat Tactics, but you now gain INT mana when you roll Initiative (this mana is lost if unspent when combat ends). Whenever you could choose a Combat Tactic or Weapon Mastery, instead choose another Commander’s Order or a tier 1 (or lower) spell from any spell school. Your Commander’s Orders are also empowered with magical power (see Commander’s Orders)."],
          ["Spellforge", "When you roll Initiative you may cast Enchant Weapon for free (can be upcast as normal by spending additional mana)."],
          ["Deep Knowledge (1)", "Choose any tier 1 (or lower) spell and any Utility Spell."],
        ] },
        { level: 7, items: [["Deep Knowledge (2)", "Choose any tier 2 (or lower) spell and any Utility Spell."]] },
        { level: 11, items: [["Deep Knowledge (3)", "Choose any tier 3 (or lower) spell and any Utility Spell."]] },
        { level: 15, items: [["Deep Knowledge (4)", "Choose any tier 4 (or lower) spell and any Utility Spell."]] },
      ],
    },
  ];

  const features = [
    [1, "Coordinated Strike!", "(1/encounter) You and an ally within Reach 6 both immediately make a weapon/Unarmed Strike or cast a cantrip for free."],
    [2, "Fit for Any Battlefield", "Choose a Combat Tactic. When you roll Initiative, gain STR Combat Dice (each a d6), they are lost when combat ends if unspent."],
    [2, "Field Medic", "Roll 1 additional die for any Healing Potion you administer. Whenever you or an ally spends any number of Hit Dice to recover HP, if you spent at least ten minutes examining their wounds, they can add your Examination bonus to the HP recovered."],
    [3, "Subclass", "Choose a Commander subclass."],
    [4, "Commander’s Orders", "Choose 2 Commander’s Orders."],
    [4, "Key Stat Increase", "+1 STR or INT."],
    [4, "Rigorous Training", "Whenever you train with your party or other soldiers during a Safe Rest, you may choose different Commander options available to you."],
    [5, "Master Commander", "Your Combat Dice are now d8s. You gain an additional pool of INT uses of Coordinated Strike to use per Safe Rest (you may use Coordinated Strike only 1/round). Attacks made from your Coordinated Strikes also now ignore disadvantage."],
    [5, "Secondary Stat Increase", "+1 DEX or WIL."],
    [6, "Fit for Any Battlefield (2)", "Choose another Combat Ability or gain +1 max Combat Dice."],
    [6, "Weapon Mastery", "You may sheathe a weapon and draw a different one 2×/round for free. Choose a Weapon Mastery."],
    [7, "Subclass", "Gain your Commander subclass feature."],
    [8, "Fit for Any Battlefield (3)", "Choose another Combat Ability or gain +1 max Combat Dice."],
    [8, "Key Stat Increase", "+1 STR or INT."],
    [9, "Master Commander (2)", "Your Combat Dice are now d10s. +1 use of Coordinated Strike."],
    [9, "Secondary Stat Increase", "+1 DEX or WIL."],
    [10, "Fit for Any Battlefield (4)", "Choose another Combat Ability or gain +1 max Combat Dice."],
    [10, "Weapon Mastery (2)", "Choose a 2nd Weapon Mastery."],
    [11, "Subclass", "Gain your Commander subclass feature."],
    [12, "Fit for Any Battlefield (5)", "Choose another Combat Ability or gain +1 max Combat Dice."],
    [12, "Key Stat Increase", "+1 STR or INT."],
    [13, "Master Commander (3)", "Your Combat Dice are now d12s. +1 use of Coordinated Strike."],
    [13, "Secondary Stat Increase", "+1 DEX or WIL."],
    [14, "Weapon Mastery (3)", "You have complete mastery of all weapon types."],
    [15, "Subclass", "Gain your Commander subclass feature."],
    [16, "Fit for Any Battlefield (6)", "Choose another Combat Ability or gain +1 max Combat Dice."],
    [16, "Key Stat Increase", "+1 STR or INT."],
    [17, "Master Commander (4)", "Your Combat Dice are now d20s. +1 use of Coordinated Strike."],
    [17, "Secondary Stat Increase", "+1 DEX or WIL."],
    [18, "Unparalleled Tactics", "The first time each encounter you use Coordinated Strike, an ally who can hear you also gains 1 action to use on their next turn."],
    [19, "Epic Boon", "Choose an Epic Boon (see pg. 75 of the GM’s Guide)."],
    [20, "Captain of Legions", "+1 to any 2 of your stats. The 1st time each encounter you use Coordinated Strike, INT allies gain +1 action (replaces Unparalleled Tactics)."],
  ].map(([level, name, text]) => ({ level, name, text }));

  NIM.CLASSES.commander = {
    id: "commander",
    name: "Commander",
    blurb: "Soldier. Warrior. Fearless leader. Highly tactical, teamwork-focused melee class. A party’s force multiplier.",
    keyStats: ["STR", "INT"],
    hitDie: 10,
    startHP: 17,
    saves: { STR: "adv", DEX: "dis", INT: "neu", WIL: "neu" },
    armor: ["mail", "shield"],
    weaponsText: "All Martial Weapons",
    armorText: "Mail Armor, Shields",
    startGear: [
      { ref: "short-sword" },
      { ref: "javelins" },
      { ref: "rusty-mail" },
    ],
    keyIncLevels: [4, 8, 12, 16],
    secIncLevels: [5, 9, 13, 17],
    // Combat Dice: grandezza per livello
    combatDieAt: (lvl) => (lvl >= 17 ? 20 : lvl >= 13 ? 12 : lvl >= 9 ? 10 : lvl >= 5 ? 8 : 6),
    features,
    orders,
    tactics,
    extraTactics,
    masteries,
    subclasses,
    faq: [
      ["How do AoE melee attacks work?", "The selected area must make sense: if an ally is between two enemies you can’t strike both enemies and avoid the ally!"],
      ["Can Sweeping Strike and Slashing Mastery stack?", "No."],
      ["Bulwark: Shield Expert. Can I Defend more than once per round if it’s free?", "No. Free simply means it does not cost an action, reactions are still limited to 1/round."],
    ],
  };
})();
