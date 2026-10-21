# E-0003 log

Designer messages verbatim, with Claude's notes.

**Designer (2026-10-21):** "ok next, lets go back to the earlier, i was asking how to make the gameplay "fun". previously you just flip coins vs tests. but my concern is, lots of the "skils" like the heavy weapon, ranged, etc, are "combat" skills. in checks it make little sense to must pick one of them. maybe autobattler is better? do we still want autobattler for, say, other skill checks like lores? pls experiment, investigate online, then propose / do this thoroughly, use ultracode if needed"

Claude: research sweep (samples/research-*.md), spec.md, a build workflow started.

**Designer:** "wdym built? dont build just "mock" them to me then propose first"

Claude: stopped the build, wrote [mocks.md](mocks.md) (A family, B Loop Hero split, C coin autobattle, D tracks, E clash), proposed C.

**Designer:** "player only watch is fine as long as player can get the "just right" thing? i think a lot of games like time mgm games derive fun from "close" battles and things like that right? so the Q is do we want to add things like talents, weapon effects, and stuffs?"

**Designer:** "clash bad i think"

Claude: E dropped. Findings refined: the failure is a fight no choice shaped, not watching itself; watching works when the build decides it.

**Designer:** "limbus weakest thing is its battle system"

**Designer:** "im leaning towards coin autobattle but in a way that player can ifnluence. for example, player can set a "party", e.g., 4 units, like two warrior, one mage, one healer. Then can manipulate how they use their skills, e.g., "if ally < 50 then use Skill 2" on the healer which skill 2is heal or something? pls experiment then rpeot"

Claude: building a small party-autobattle sim (partysim.mjs): 4 mercs, coin flips, FF12-style rules per merc; test whether rules change outcomes and make fights close.

**Designer:** "yea the fight will be DISPLAYED not read. ai writing is just for start/end not mid fight and for generating the sprites. (2) loss != kill, just injured. (3) are the skills flexible for this? also the ruleset instead of dragon age "coding-like" style can you use something like live a hero "dragon and drop" skills? like for example, say each hero has 3-4 skills named S1, S2, S3, and S4 (initially only 1-2 unlock for ramp, so initially you dont need tactics). you can set which ones to be S1, S2, S3, S4. then as you level up it unlock slots and tactic slots, where you can put the "tactics". for example, against undead, use S3 or when low on mana, use S2 or things like that? the "tactic slots" are actually 'tactic books' and are lootables or something?""

`RULE:` fights are displayed, AI writes only start/end lines and sprites (D-0023). Losing a fight injures, never kills (D-0024).
Claude: sim v2 (partysim2.mjs): skills from core skills, S1-S4 priority order, tactic books as lootable conditional overrides, slots unlock with level.

**Designer:** "so my question: did having battle make it more fun?"

Claude: unknown. The sims measure proxies (decision leverage, close wins), not fun; nobody has played a fight as a player. Findings open bullet rewritten. Proposed next: a small playable, displayed fight for the designer to judge.

**Designer:** "so likely we'll have battles AND skill checks. skill checks are just pure coin flips." / "if the finding is good"

**Designer:** "ok lets try mocking with battles. for battle skills, try: (1) ai generated, (2) from a fixed list, (3) have a fixed list then ai can give it a "skin", e.g., a "Cleave" attack that aoe damage with sword, when used by a greatsword user, becomes Great Cleave for example."

Claude: mock of three battle-skill sources (skills-mock/), real cheap-model calls for (1) and (3).

**Designer:** "NO LINES. no ai stuff except BEFORE and AFTER battle, no mid fight ai lines too much work."

Claude: skill flavor lines dropped (restates D-0023). Open: whether AI skin NAMES (made once at recruitment) stay, or skills keep fixed names.

**Designer:** "i like variation of C best though: how about this: we have a list of skills, and a bunch of modifiers for it. Then AI skin it and pick one or two modifiers. For example, Cleave: Deal 3 PHYSICAL to all frontline enemies (battle is on a 2x3 grid, 3 backline 3 frontline, see vagrus). Stamina cost: 3. Mana cost: 0. Mods: "Fiery": add 1 FIRE damage, 1 MANA cost, "Icy": ..., etc"

Claude: mock 2 (skills-mock2/): base skills on a 2x3 grid with STA/MANA costs + modifiers; AI (Sonnet high) names each skill and picks 1-2 mods. Two variants: (a) free pick from all fitting mods, (b) engine deals 3 candidates weighted by the merc's skills.

Claude: mock 2 done ([skills-mock2/cards.md](skills-mock2/cards.md)). Free picks pile on +damage (Heavy 9/40, Swift 6/40, nearly always 2 mods); dealt candidates spread picks and give more 1-mod skills. Names fit; two slips: "Wolf-Howl" again copies Atlas's exact skill; "Quick Slash" (Thrifty) promises speed it lacks.

**Designer:** "3 is 3 damage PER heads."

`RULE:` a skill's number is damage per heads; the merc's coin pool decides how many heads. Recorded in proposed D-0025 (battle skills).

**Designer:** "we'll figure out balance later" / "for now just assume it works"

Claude: balance parked; no more balance tuning in E-0003 mocks.

**Designer:** "ok sure. the 2x3 grid etc stuff is not locke.d the LOCKED part i think is: Autobattler and skill checks. once done, ready for /compact then we'll simulate a playtest -- youll act as the game i tell u what player do"

`RULE:` D-0026 accepted (autobattles + pure coin-flip skill checks). D-0025 stays proposed as the working model.

**Designer:** "dont forge tthe goal -- right now we're brainstorming ideas that yous hould record. so that we get what the game should look like"

Claude: NOW.md now holds a "Working model (brainstormed, not locked)" section; E-0001 and E-0003 closed.
