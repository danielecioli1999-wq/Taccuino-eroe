/* Classe: The Cheat (Nimble Heroes: The Cheat, 2026).
   Testi tratti dal manuale, usati secondo la Nimble 3rd Party Creator License v2.0. */
(function () {
  const NIM = (globalThis.NIM = globalThis.NIM || {});
  NIM.CLASSES = NIM.CLASSES || {};

  const H = "honorseeker"; // le capacità sostituite dall'Honorseeker spariscono con quella sottoclasse
  const features = [
    [1, "Sneak Attack", "(1/turn) When you crit, deal +1d6 damage.", H],
    [1, "Vicious Opportunist", "(1/turn) When you HIT a Distracted target with a melee attack, you may change the Primary Die roll to whatever you like (changing it to the max value counts as a crit).\nDistracted. A target is Distracted if it is adjacent to (or Taunted by) an ally, or if it cannot see you. Yes! If you can figure out how to attack on someone else’s turn, you can use this again in the same round!", H],
    [2, "Cheat", "You’re a well-rounded cheater. Gain the following abilities:\n• (1/round) You may either Move or Hide for free.\n• (1/Safe Rest) You may change any of your skill checks to 10+INT.\n• If you roll less than 10 on Initiative, you may change it to 10 instead.\n• You may gain advantage on skill checks while playing any games, competitions, or placing wagers. If you’re caught though…\nMagic? The Cheat has some abilities that look magical—they might be, but don’t have to be. You have your ways, okay? No need to explain how you did that, not even to the GM!"],
    [3, "Subclass", "Choose a Cheat subclass."],
    [3, "Sneak Attack (2)", "Your Sneak Attack becomes 1d8.", H],
    [3, "Thieves’ Cant", "You learn the secret language of rogues and scoundrels."],
    [4, "Key Stat Increase", "+1 DEX or INT."],
    [4, "Underhanded Ability", "Choose an Underhanded Ability.\nTrade Secrets. Whenever you spend a night talking shop with other roguish types during a Safe Rest, you may choose different Cheat options available to you.", H],
    [5, "Twist the Blade", "Action: Change a Sneak Attack die to whatever you like.", H],
    [5, "Quick Read", "(1/encounter) Gain advantage on an Assess check."],
    [5, "Secondary Stat Increase", "+1 WIL or STR."],
    [6, "Underhanded Ability (2)", "Choose a 2nd Underhanded Ability.", H],
    [6, "THAT’S Not What Happened!", "(1/Safe Rest) Reaction (when a Distracted enemy attacks you): You may change the Primary Die roll to whatever you like (changing the die to the minimum value counts as a miss)."],
    [7, "Subclass", "Gain your Cheat subclass feature."],
    [7, "Sneak Attack (3)", "Your Sneak Attack becomes 2d8.", H],
    [8, "Underhanded Ability (3)", "Choose a 3rd Underhanded Ability.", H],
    [8, "Key Stat Increase", "+1 DEX or INT."],
    [9, "Sneak Attack (4)", "Your Sneak Attack becomes 2d10.", H],
    [9, "Secondary Stat Increase", "+1 WIL or STR."],
    [10, "Underhanded Ability (4)", "Choose a 4th Underhanded Ability.", H],
    [11, "Subclass", "Gain your Cheat subclass feature."],
    [11, "Sneak Attack (5)", "Your Sneak Attack becomes 2d12.", H],
    [12, "Underhanded Ability (5)", "Choose a 5th Underhanded Ability.", H],
    [12, "Key Stat Increase", "+1 DEX or INT."],
    [13, "Twist the Blade (2)", "(1/turn) You can Twist the Blade for free.", H],
    [13, "Secondary Stat Increase", "+1 WIL or STR."],
    [14, "Underhanded Ability (6)", "Choose a 6th Underhanded Ability.", H],
    [15, "Subclass", "Gain your Cheat subclass feature."],
    [15, "Sneak Attack (6)", "Your Sneak Attack becomes 2d20.", H],
    [16, "Underhanded Ability (7)", "Choose a 7th Underhanded Ability.", H],
    [16, "Key Stat Increase", "+1 DEX or INT."],
    [17, "Sneak Attack (7)", "Your Sneak Attack becomes 3d20.", H],
    [17, "Secondary Stat Increase", "+1 WIL or STR."],
    [18, "Underhanded Ability (8)", "Choose an 8th Underhanded Ability.", H],
    [19, "Epic Boon", "Choose an Epic Boon (see pg. 75 of the GM’s Guide)."],
    [20, "Supreme Execution", "+1 to any 2 of your stats. When you attack with a blade, you do not require targets to be Distracted to trigger Vicious Opportunist.", H],
  ].map(([level, name, text, replacedBy]) => ({ level, name, text, replacedBy }));

  const underhanded = [
    { id: "creative-accounting", name: "“Creative” Accounting", cost: "Passive", text: "Steal up to INT actions from your next turn (Gain up to INT actions now. The next time you would gain actions, subtract the number stolen). You cannot use this 2 turns in a row." },
    { id: "exploit-weakness", name: "Exploit Weakness", cost: "Passive", text: "Whenever you successfully Assess: Create an Opening against a creature, you can use Vicious Opportunist against them, even if they are not Distracted. This lasts for 1 minute or until you use it against another target." },
    { id: "feinting-attack", name: "Feinting Attack", cost: "Passive", text: "If you miss for the 2nd time in a single round, you may change the Primary Die roll to any result instead." },
    { id: "howd-you-get-here", name: "How’d YOU get here?!", cost: "2 Actions", text: "(Reach 12) “Teleport” adjacent to a Distracted target, and make a melee attack against them. If you crit, you may “teleport” again." },
    { id: "im-outta-here", name: "I’m Outta Here!", cost: "Passive", text: "When an ally within Reach 4 is crit, you may turn Invisible until the end of your next turn and then move up to half your Speed for free." },
    { id: "misdirection", name: "Misdirection", cost: "Passive", text: "Gain INT Defense. Whenever you Defend, you may halve the damage instead." },
    { id: "steal-tempo", name: "Steal Tempo", cost: "Passive", text: "When you crit for the second time in a round, your target is Dazed and you give an ally 1 action." },
    { id: "sunder-armor", name: "Sunder Armor", cost: "1 Action", text: "After you crit an armored creature, sunder their armor: give the next non-crit Primary Die rolled against them +2." },
    { id: "tangling-wire", name: "Tangling Wire", cost: "Passive", text: "Whenever you Grapple, you may Restrain instead." },
    { id: "the-setup", name: "The Setup", cost: "1 Action", text: "Reaction (when an ally misses a creature adjacent to you): You can make an Opportunity Attack against them, treating them as Distracted." },
    { id: "trickshot", name: "Trickshot", cost: "Passive", text: "You can use Vicious Opportunist on thrown weapon attacks (but you can’t use Twist the Blade). Whenever you throw a weapon, you may spend an additional action to have it hit another creature within Reach 2 of it, dealing half as much damage to them." },
  ];

  const gambits = [
    { id: "deft-parry", name: "Deft Parry", cost: "Passive", text: "You take –INT damage from enemies while they have The Upper Hand." },
    { id: "down-not-out", name: "Down, Not Out!", cost: "Passive", text: "While Dying, reduce all Primary Dice rolled against you by 1, and you gain advantage on saves." },
    { id: "frightful-confidence", name: "Frightful Confidence", cost: "Passive", text: "While Bloodied, when you are attacked with advantage their lowest die is Primary." },
    { id: "mark-of-deflection", name: "Mark of Deflection", cost: "Passive", text: "If you’ve already Defended this round, attacks against you are rolled with disadvantage." },
    { id: "nowhere-to-flee", name: "Nowhere to Flee!", cost: "Passive", text: "Gain +INT Speed when moving toward enemies Taunted by you. Your Opportunity Attacks also Slow Medium or smaller targets on hit." },
    { id: "redemption-arc", name: "Redemption Arc", cost: "Passive", text: "Reaction (when an enemy with The Upper Hand attacks an ally): You may first Taunt them (the attack is rolled again, choose either result), this lasts until the end of their next turn." },
    { id: "riposte", name: "Riposte", cost: "Passive", text: "When you Defend against a melee attacker, you may immediately make an Opportunity Attack against them." },
    { id: "say-that-to-my-face", name: "Say That to My Face!", cost: "1 Action", text: "Action: (Reach 12) “Teleport” adjacent to a Taunted enemy." },
    { id: "victors-confidence", name: "Victor’s Confidence", cost: "Passive", text: "When you kill a Taunted enemy, give an ally advantage on their next attack." },
  ];

  const subclasses = [
    {
      id: "silent-blade", name: "Tools of the Silent Blade",
      tagline: "Kill, kill, kill.",
      features: [
        { level: 3, items: [
          ["Amidst All This Commotion…", "If a creature dies while you Sneak Attack them, you may turn Invisible until you attack again or until the beginning of your next turn."],
          ["Leave No Trace", "Advantage on Stealth checks when you are at full health."],
        ] },
        { level: 7, items: [["Cunning Strike", "Deal +2×INT damage whenever you crit."]] },
        { level: 11, items: [["Professional Skulker", "Gain a climbing Speed and advantage on Stealth checks (replaces Leave No Trace)."]] },
        { level: 15, items: [["KILL", "When you Sneak Attack an enemy with fewer max HP than you, it dies."]] },
      ],
    },
    {
      id: "scoundrel", name: "Tools of the Scoundrel",
      tagline: "Stay alive, fight dirty.",
      features: [
        { level: 3, items: [
          ["Low Blow", "When you Sneak Attack a creature not already Taunted by you, you may spend 1 additional action to roll 1d4. They are:\n1. Taunted by you for the rest of this encounter.\n2. Knocked Prone, then Taunted by you for the rest of this encounter.\n3. Dazed, then Taunted by you for the rest of this encounter.\n4. Incapacitated until the end of the next hero’s turn."],
          ["Sweet Talk", "You may gain advantage on all Influence checks with NPCs you’ve just met for the first time. This lasts until you fail an Influence check with them or until you meet a 2nd time. You have disadvantage on Influence checks with them after you use this ability (until you get back on their good side)."],
        ] },
        { level: 7, items: [["Pocket Sand", "(2/encounter—you’ve got to collect more sand!) When you Defend against an adjacent creature, Blind the attacker until the start of their next turn and force them to reroll the attack (Blind creatures attack with disadvantage)."]] },
        { level: 11, items: [["Escape Plan", "(1/Safe Rest) When you would drop to 0 HP or gain a Wound, you don’t. Instead, you turn Invisible for 1 minute or until you attack."]] },
        { level: 15, items: [["Heads I Win, Tails You Lose", "(1/encounter) Attacks you make this round don’t miss, you crit on 1 less than normally needed, and you gain LVL temp HP."]] },
      ],
    },
    {
      id: "serpent", name: "Tools of the Serpent",
      tagline: "You have harnessed the terrible fangs of nature to her deadly array of poisons. Choose this subclass if you want to debilitate your foes with venom and viciousness.",
      features: [
        { level: 3, items: [
          ["Viper’s Kiss", "Creatures you damage become Poisoned until the end of their next turn. Creatures Poisoned this way are also Distracted."],
          ["I’ve Tried This One Before", "You have advantage on saves against poison. Additionally, you can identify any poison you inspect."],
        ] },
        { level: 7, items: [["Noxious Cloud", "(1/encounter, Reach 4) Action: Enemies in a 2×2 area take INT d6 damage (ignoring armor) and become Poisoned. Creatures already Poisoned are also Dazed."]] },
        { level: 11, items: [["Cruel Dose", "Creatures Poisoned by you are also Slowed and their attack Range is halved."]] },
        { level: 15, items: [["Volatile Toxins", "Noxious Cloud can be used twice each encounter. Whenever a creature Poisoned by you dies, their body erupts into a Noxious Cloud."]] },
      ],
    },
    {
      id: "gambler", name: "Tools of the Gambler",
      tagline: "Trust me—this time it’s a SURE THING. Choose this subclass if you want to risk it all with dangerous plays and walk the line of ruin.",
      features: [
        { level: 3, items: [
          ["All In", "When you Sneak Attack, you may go All In: Roll a single All In die; if it rolls higher than average, maximize ALL of your Sneak Attack dice; otherwise minimize them."],
          ["That Was Just a Practice Roll", "(1/encounter) You may reroll ANY die."],
          ["It’s All Fun and Games", "If you’re caught cheating at a game, competition, or wager, you gain advantage on skill checks to get out of the consequences."],
        ] },
        { level: 7, items: [
          ["Pocket Aces!", "(1/Safe Rest) You can set a friendly creature’s Initiative roll to 20."],
          ["Double or Nothing!", "When you lose your “All In” roll, you may try once more. If you succeed, add 1 additional maximized Sneak Attack die. If you fail, your attack misses entirely and your turn ends."],
        ] },
        { level: 11, items: [["Play the Odds", "(1/round) When a creature hits you, you may force them to reroll their Primary Die. If the roll is lower, the attack misses; otherwise, it crits."]] },
        { level: 15, items: [["Odds Maker", "You may use That Was Just a Practice Roll 2/encounter and you may instead change the die to any other face."]] },
      ],
    },
    {
      id: "honorseeker", name: "The Honorseeker (story-based)",
      tagline: "“No more tricks. Honest.”",
      features: [
        { level: 3, items: [
          ["Honorseeker", "You give up Sneak Attack, Vicious Opportunist, Underhanded Abilities, and Twist the Blade, in exchange gain:\n• Honorable Gambits. For every Underhanded Ability you would have (except for your Old Habits…), choose an Honorable Gambit instead.\n• Worthy Underdog. When enemies have The Upper Hand, attacks miss you on 2 or less.\n• Tenacious Fighter. (1/turn) When you HIT an enemy that has The Upper Hand you may change the Primary Die roll to whatever you like and deal +1d6 damage (this increases as your Sneak Attack dice would).\nThe Upper Hand. Whenever there are more of them adjacent to you than allies."],
          ["Tenacious Fighter", "(1/turn) When you HIT an enemy that has The Upper Hand you may change the Primary Die roll to whatever you like and deal +1d6 damage (this increases as your Sneak Attack dice would)."],
          ["Prove Your Worth!", "(Reach 12, 1/turn) Taunt an enemy for free (lasts until they damage you). Gain DEX damage reduction vs enemies Taunted by you."],
        ] },
        { level: 5, items: [["Even the Odds", "When attacking or being attacked by an enemy with The Upper Hand, you may spend an action to change a die up or down 1 face (replaces Twist the Blade and improves as it would)."]] },
        { level: 7, items: [["Old Habits…", "Choose 1 Underhanded Ability."]] },
        { level: 11, items: [["Right Where I Want You", "You have advantage on attacks and +10 Defense as long as enemies have The Upper Hand."]] },
        { level: 15, items: [["Turn the Tables", "When an enemy with The Upper Hand misses you in melee, you may spend an action attacking them in return."]] },
        { level: 20, items: [["Supreme Underdog", "(Replaces Supreme Execution…) You take 10 less damage from all attacks by creatures with The Upper Hand."]] },
      ],
    },
  ];

  const sneakAt = (lvl) => (lvl >= 17 ? "3d20" : lvl >= 15 ? "2d20" : lvl >= 11 ? "2d12" : lvl >= 9 ? "2d10" : lvl >= 7 ? "2d8" : lvl >= 3 ? "1d8" : "1d6");

  NIM.CLASSES.cheat = {
    id: "cheat",
    name: "Cheat",
    blurb: "High burst damage class that can get in and get out! Break the rules, backstab with devastating crits and fight dirty.",
    keyStats: ["DEX", "INT"],
    hitDie: 6,
    startHP: 10,
    saves: { STR: "neu", DEX: "adv", INT: "neu", WIL: "dis" },
    armor: ["leather"],
    weaponsText: "DEX Weapons",
    armorText: "Leather Armor",
    startGear: [{ ref: "dagger", qty: 2 }, { ref: "sling" }, { ref: "cheap-hides" }, { ref: "chalk" }],
    keyIncLevels: [4, 8, 12, 16],
    secIncLevels: [5, 9, 13, 17],
    features,
    underhanded,
    gambits,
    subclasses,
    sneakAt,
    // competenza: armi DEX
    weaponProf: (w) => ((NIM.ITEM_BY_ID[w.ref] || {}).stat || w.stat) === "DEX",
    // una Underhanded Ability ai livelli 4, 6, ..., 18 (l’Honorseeker sceglie invece una Honorable Gambit, più 1 Old Habits al livello 7)
    slots(c) {
      const L = c.level;
      const sub = L >= 3 ? c.subclassId : "";
      const hs = sub === "honorseeker";
      const out = [4, 6, 8, 10, 12, 14, 16, 18].filter((l) => L >= l).map((l) => ({ id: "ua-" + l, kind: hs ? "gambit" : "underhanded", level: l, label: hs ? "Honorable Gambit" : "Underhanded Ability" }));
      if (hs && L >= 7) out.push({ id: "old-7", kind: "underhanded", level: 7, label: "Old Habits… – Underhanded Ability" });
      return out.sort((a, b) => a.level - b.level);
    },
    options(c, slot) {
      if (slot.kind === "gambit") return gambits.map((a) => ({ id: "gambit:" + a.id, name: a.name, group: "Honorable Gambits", text: a.text, cost: a.cost }));
      return underhanded.map((a) => ({ id: "underhanded:" + a.id, name: a.name, group: "Underhanded Abilities", text: a.text, cost: a.cost }));
    },
  };
})();
