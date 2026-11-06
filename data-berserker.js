/* Classe: Berserker (Nimble Heroes: Berserker, 2026).
   Testi tratti dal manuale, usati secondo la Nimble 3rd Party Creator License v2.0. */
(function () {
  const NIM = (globalThis.NIM = globalThis.NIM || {});
  NIM.CLASSES = NIM.CLASSES || {};

  const features = [
    [1, "Rage", "(1/turn) Action: Roll a Fury Die (1d4) and set it aside. Add it to every STR attack you make. You can have a max of KEY Fury Dice; they are lost when your Rage ends.\nThat all you got?! When you are attacked, you may expend 1 or more Fury Dice to reduce the damage taken by STR+DEX for each die spent."],
    [1, "Your Rage Ends…", "If you leave combat, drop to 0 HP, or go 1 round without attacking or Raging. You can Rage and gain another Fury Die even if you are already Raging. If you are already at your max, roll as normal and decide which ones to keep."],
    [2, "Intensifying Fury", "If you are Raging at the start of your turn, roll 1 Fury Die for free."],
    [2, "One with the Ancients", "(1/Safe Rest) When faced with a decision about which direction or course of action to take, you can call upon your ancestors to guide you toward the most dangerous or challenging path."],
    [3, "Subclass", "Choose a Berserker subclass."],
    [3, "Bloodlust", "Expend 1 or more Fury Dice on your turn, move DEX spaces per die spent for free."],
    [4, "Enduring Rage", "While Dying, you Rage automatically for free at the beginning of your turn, have a max of 2 actions instead of 1, and ignore the STR saves to make attacks."],
    [4, "Key Stat Increase", "+1 STR or DEX."],
    [4, "Savage Arsenal", "Choose 1 ability from the Savage Arsenal."],
    [4, "Wrath & Ruin", "Whenever you perform a notable act of destruction or feat of strength during a Safe Rest, you may choose different Berserker options available to you."],
    [5, "Rage (2)", "Whenever you Rage, gain 2 Fury Dice instead."],
    [5, "Secondary Stat Increase", "+1 INT or WIL."],
    [6, "Savage Arsenal (2)", "Choose a 2nd Savage Arsenal ability."],
    [6, "Intensifying Fury (2)", "Your Fury Dice are now d6s."],
    [7, "Subclass", "Gain your Berserker subclass feature."],
    [8, "Savage Arsenal (3)", "Choose a 3rd Savage Arsenal ability."],
    [8, "Key Stat Increase", "+1 STR or DEX."],
    [9, "Intensifying Fury (3)", "Your Fury Dice are now d8s."],
    [9, "Secondary Stat Increase", "+1 INT or WIL."],
    [10, "Savage Arsenal (4)", "Choose a 4th Savage Arsenal ability."],
    [11, "Subclass", "Gain your Berserker subclass feature."],
    [12, "Savage Arsenal (5)", "Choose a 5th Savage Arsenal ability."],
    [12, "Key Stat Increase", "+1 STR or DEX."],
    [13, "Intensifying Fury (4)", "Your Fury Dice are now d10s."],
    [13, "Secondary Stat Increase", "+1 INT or WIL."],
    [14, "Savage Arsenal (6)", "Choose a 6th Savage Arsenal ability."],
    [15, "Subclass", "Gain your Berserker subclass feature."],
    [16, "Savage Arsenal (7)", "Choose a 7th Savage Arsenal ability."],
    [16, "Key Stat Increase", "+1 STR or DEX."],
    [17, "Intensifying Fury (5)", "Your Fury Dice are now d12s."],
    [17, "Secondary Stat Increase", "+1 INT or WIL."],
    [18, "DEEP RAGE", "Dropping to 0 HP does not cause your Rage to end."],
    [19, "Epic Boon", "Choose an Epic Boon (see pg. 75 of the GM’s Guide)."],
    [20, "BOUNDLESS RAGE", "+1 to any 2 of your stats. Anytime you roll less than 5 on a Fury Die, change it to 5 instead.", "burning-rage"],
  ].map(([level, name, text, replacedBy]) => ({ level, name, text, replacedBy }));

  const arsenal = [
    { id: "death-blow", name: "Death Blow", cost: "Passive", text: "Whenever you crit, you may double the damage from your Fury Dice (instead of rolling any additional dice)." },
    { id: "deathless-rage", name: "Deathless Rage", cost: "Passive", text: "(1/turn) While Dying, you may suffer 1 Wound to gain 1 action and 1 Fury Die." },
    { id: "dismantle", name: "Dismantle", cost: "Passive", text: "After you roll an attack, expend any number of Fury Dice, increase your Primary Die by 1 for each." },
    { id: "eager-for-battle", name: "Eager for Battle", cost: "Passive", text: "Gain advantage on Initiative. Move 2×DEX spaces for free on your first turn each encounter." },
    { id: "into-the-fray", name: "Into the Fray", cost: "1 Action", text: "Leap up to 2×DEX spaces toward an enemy. If you land within your weapon’s Reach of at least 2 enemies, make an attack against 1 of them for free." },
    { id: "mighty-endurance", name: "Mighty Endurance", cost: "Passive", text: "You can now survive an additional 4 Wounds before death." },
    { id: "more-blood", name: "MORE BLOOD!", cost: "Passive", text: "Whenever an enemy crits you, gain 1 Fury Die. Whenever you drop to 0 HP, Rage for free." },
    { id: "rampage", name: "Rampage", cost: "Passive", text: "(1/turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again." },
    { id: "swift-fury", name: "Swift Fury", cost: "Passive", text: "Whenever you gain a Fury Die, move up to DEX spaces for free, ignoring Difficult Terrain." },
    { id: "thunderous-steps", name: "Thunderous Steps", cost: "Passive", text: "After moving at least 4 spaces while Raging, you may deal STR bludgeoning damage to all adjacent creatures where you stop." },
    { id: "unstoppable-force", name: "Unstoppable Force", cost: "Passive", text: "While Dying, taking damage causes 1 Wound (instead of 2) and crits inflict 2 Wounds (instead of 3)." },
    { id: "whirlwind", name: "Whirlwind", cost: "2 Actions", text: "AoE. Attack ALL targets within your melee weapon’s Reach." },
    { id: "youre-next", name: "You’re Next!", cost: "1 Action", text: "While Raging, you can make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee the battle." },
  ];

  // Muscle “Spells” del Muscle Mage: richiedono di avere un certo numero di Fury Dice (REQ)
  const muscleSpells = [
    { id: "clobber", req: 1, name: "Power Word: Clobber", cost: "1 Action", text: "1d10+STR+Fury Dice (FD) damage. On Hit: a Medium or smaller creature is Clobbered.\nClobbered. Any Medium or smaller creature that is Dazed, Grappled, Prone, or has been forcefully moved this round is also considered Clobbered this round." },
    { id: "throwmaturgy", req: 1, name: "Throwmaturgy", cost: "2 Actions", text: "Reach: 3/FD. Throw a Clobbered creature at another enemy; both suffer 1d6+STR+FD damage and land Prone (if Medium or smaller). OR: for 1 action throw a rock or similarly throwable object instead.\n3/FD? If you have 1 Fury Die, you can throw 3 spaces; 2 Fury Dice, 6 spaces; and so on." },
    { id: "chicken", req: 3, name: "Polymorph: CHICKEN!", cost: "1 Action", text: "Reach: 3/FD. Yell “Chicken” at a creature, Frightening them until the end of their next turn (Large+ creatures: Taunted instead)." },
    { id: "thunderfist", req: 3, name: "Thunderfist", cost: "2 Actions", text: "Reach: Cone FD, AoE. 1d20+STR+FD." },
    { id: "teleport", req: 4, name: "“Teleport”", cost: "1 Action", text: "Sum your Fury Dice, leap up to that many spaces." },
    { id: "meat-ward", req: 5, name: "Meat Ward", cost: "1 Action", text: "Reach: 1. Reaction: When attacked, move another Medium or smaller creature into your space and you move to another adjacent space.\nRemember! Each reaction is limited to 1/round." },
    { id: "powershout", req: 6, name: "Powershout: WEAKLINGS!", cost: "2 Actions", once: true, text: "Reach: 6, AoE. (1/encounter) FD damage to enemies, Frightening them (Large+ enemies are Taunted instead) and attacks deal +10 damage to Armored enemies this round." },
    { id: "earthquake", req: 7, name: "Earthquake", cost: "2 Actions", once: true, text: "(1/encounter) Leap into the air and land with seismic force up to 2× your Speed away. Creatures within Reach 3 take 3d20+FD damage and become Slowed. Clobbered creatures are knocked Prone." },
  ];

  const subclasses = [
    {
      id: "mountainheart", name: "Path of the Mountainheart",
      tagline: "Withstand terrible blows and overwhelming damage. Shrug off death and disease that would crumple the mightiest armies.",
      features: [
        { level: 3, items: [
          ["Stone’s Resilience", "Whenever you expend Fury Dice to reduce incoming damage, add the value of the die to the amount reduced."],
          ["Mountainous Tenacity", "Whenever you expend Hit Dice to recover HP, for every 10 HP you would recover, you may heal 1 Wound instead."],
        ] },
        { level: 7, items: [["Unbreakable", "(1/encounter) While Raging, if you would suffer your last Wound or other negative condition of your choice, you don’t."]] },
        { level: 11, items: [["Titan’s Fury", "After you miss an attack or are crit by an enemy, Rage for free."]] },
        { level: 15, items: [["Mountain’s Endurance", "While Dying, if an attack against you would be a crit, the attack is rerolled instead (when-crit abilities, such as Titan’s Fury, still trigger)."]] },
      ],
    },
    {
      id: "red-mist", name: "Path of the Red Mist",
      tagline: "Lean into your offensive fury and leave nothing remaining of your enemies but a lingering crimson mist.",
      features: [
        { level: 3, items: [
          ["Blood Frenzy", "(1/turn) While Raging, whenever you crit or kill an enemy, gain 1 Fury Die or change 1 Fury Die to the max."],
          ["Savage Awareness", "Advantage on Perception checks to notice or track down blood. Blindsight 2 while Raging: you ignore the Blind condition and can see through darkness and Invisibility within that Range."],
        ] },
        { level: 7, items: [["Unstoppable Brutality", "While Raging, you may gain 1 Wound to reroll any attack or save, ignoring disadvantage."]] },
        { level: 11, items: [["Opportunistic Frenzy", "While Raging, you can make Opportunity Attacks without disadvantage, and you may make them whenever an enemy enters your melee weapon’s Reach."]] },
        { level: 15, items: [["Onslaught", "While Raging, gain +2 Speed. (1/round) You may move for free."]] },
      ],
    },
    {
      id: "titans-grip", name: "Path of the Titan’s Grip",
      tagline: "Beat goblin chieftains with their own lackeys, piledrive bandits, and hurl enemies across the battlefield.",
      features: [
        { level: 3, items: [
          ["Titan’s Grip", "Gain proficiency with Unarmed Strikes and they gain: On hit: Grappled (vs Medium or smaller creatures)."],
          ["Living Weapon", "While Raging, living Grappled creatures can be used as improvised weapons: Tiny 1d4+STR Light, Thrown 6; Small 1d6+STR, Thrown 4; Medium 1d10+STR (2-handed). Living Weapons suffer as much damage as they deal."],
        ] },
        { level: 7, items: [["Meat Shield", "While Grappling a creature, you have Cover from attacks by other creatures. Attacks that miss you strike a creature you have Grappled."]] },
        { level: 11, items: [["Wrathful Grip", "Your Unarmed Strikes are now 1d6+STR. You may expend a Fury Die to force a creature to reroll a save to escape your Grapple."]] },
        { level: 15, items: [
          ["Sickening Blow", "Whenever you crit an enemy with an improvised weapon, add one maximized Primary Die to the total."],
          ["Catch!", "Your improvised weapons gain +4 Thrown."],
        ] },
      ],
    },
    {
      id: "burning-rage", name: "Path of the Burning Rage",
      tagline: "All will burn as your anger fuels the flames of battle, immolating all in its path in fiery destruction.",
      features: [
        { level: 3, items: [
          ["Stoke the Flames", "Whenever your Fury Die size would increase, instead roll 1 additional Fury Die when you Rage."],
          ["Overflowing Fury", "(Reach 2) For each Fury Die you discard over your max, deal 5 fire damage to a creature within Reach, they gain Smoldering."],
        ] },
        { level: 7, items: [["Hot Headed", "Rage for free when you roll Initiative. +2 to Overflowing Fury’s Reach."]] },
        { level: 11, items: [["EXPLOSION!", "When you attack a Smoldering creature, you may deal the same amount of damage to ALL other creatures adjacent to your target OR you can ignore armor of Smoldering creatures; ending the condition."]] },
        { level: 15, items: [["Pyromania", "Treat each of your Fury Dice as if they were always 5s."]] },
        { level: 20, items: [["BOUNDLESS FLAMES", "(Replaces BOUNDLESS RAGE) +1 to any 2 of your stats. (1/round) When attacked, deal half your Fury Dice damage to an adjacent creature."]] },
      ],
    },
    {
      id: "muscle-mage", name: "Muscle Mage (story-based)",
      tagline: "“Pointy-hat-man do magic. ME have pointy hat. ME DO MAGIC!” —Fleximus the Wise",
      features: [
        { level: 3, items: [
          ["Muscle Magic", "Your muscles have “unlocked the secrets of the arcane” (and any fool who disputes that is about to have a bad day). You lose access to the Savage Arsenal and all weapon proficiencies but gain access to “Muscle Spells” which require you to have a certain number of Fury Dice to cast."],
          ["STRENGTH of Mind", "Add your STR to INT-based skills."],
        ] },
        { level: 7, items: [["I’m Fine! Totally Fine!", "(1/Safe Rest) When you drop to 0 HP, give a number of actions out to your allies equal to the number of Fury Dice you had."]] },
        { level: 11, items: [["Flexpertise", "Reduce the Fury Die Requirement of your Muscle Spells by 2."]] },
        { level: 15, items: [["High Flexemplar", "Gain +4 max Wounds. “I’m Fine! Totally Fine!” is unlimited."]] },
      ],
    },
  ];

  NIM.CLASSES.berserker = {
    id: "berserker",
    name: "Berserker",
    blurb: "High-damage, high-survivability, melee-focused class. Become a raging, damage-dealing machine: the longer a fight goes on, the more your Rage intensifies.",
    keyStats: ["STR", "DEX"],
    hitDie: 12,
    startHP: 20,
    saves: { STR: "adv", DEX: "neu", INT: "dis", WIL: "neu" },
    armor: [],
    weaponsText: "All STR weapons",
    armorText: "None",
    startGear: [{ ref: "battleaxe" }, { ref: "rations-meat" }, { ref: "rope-50-ft" }],
    keyIncLevels: [4, 8, 12, 16],
    secIncLevels: [5, 9, 13, 17],
    furyDieAt: (lvl) => (lvl >= 17 ? 12 : lvl >= 13 ? 10 : lvl >= 9 ? 8 : lvl >= 6 ? 6 : 4),
    features,
    arsenal,
    muscleSpells,
    subclasses,
    // competenze: tutte le armi STR (il Muscle Mage perde ogni competenza con le armi)
    weaponProf: (w, d) => {
      if (d.subId === "muscle-mage") return false;
      const base = (NIM.ITEM_BY_ID[w.ref] || {}).stat || w.stat;
      return base === "STR";
    },
    // Unarmed Strike: senza competenza non può critare (Titan’s Grip la concede)
    unarmed: (d) => ({ die: d.subId === "titans-grip" && d.lvl >= 11 ? 6 : 4, noCrit: d.subId !== "titans-grip" }),
    // scelte: una Savage Arsenal ai livelli 4, 6, 8, 10, 12, 14, 16 (il Muscle Mage non vi ha accesso)
    slots(c) {
      const sub = c.level >= 3 ? c.subclassId : "";
      if (sub === "muscle-mage") return [];
      return [4, 6, 8, 10, 12, 14, 16].filter((L) => c.level >= L).map((L) => ({ id: "sa-" + L, kind: "arsenal", level: L, label: "Savage Arsenal" }));
    },
    options() {
      return arsenal.map((a) => ({ id: "arsenal:" + a.id, name: a.name, group: "Savage Arsenal", text: a.text, cost: a.cost }));
    },
  };
})();
