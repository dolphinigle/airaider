# UNIT_GENERATION.md — how a character's tags are rolled

**Status:** prototype = simple random rolls (this doc §1). The **value-targeting** half (§2) is
**DESIGN-DEFERRED** — not built. We nail the STORY first; the unit/value economy is a later prototype.

## 1. Prototype: roll each tag independently (no value target)

Path-of-Exile's *limited prefix/suffix slots* are the wrong model — we don't cap tag COUNT. Instead each
tag is **rolled on its own**, so a character's trait set is emergent (and a really unlucky one can come out
nearly blank):

- **Mandatory (identity floor):** gender + race — always exactly one each.
- **Every other tag:** rolled independently by an **appearance probability** (low — most tags don't
  appear). If it appears, its **tier is a weighted roll**: low tiers (weak, "ordinary") common, top tiers
  ("very X" / Master / Legendary) **rare**, gated by the source ceiling (`tagCeiling(level)` = PoE ilvl).
- **Mutex still holds** (correctness, not a cap): never both of an opposite pair (muscular/frail), one
  background, etc. **No count caps** (no max-skills / max-physical / max-top-tier) — rarity is emergent
  from the weights, so a 4×"very" stack is astronomically unlikely *on its own*, not clipped.

Principle (locked): **most traits common, a few standout — the standout occurring with LOW probability.**

**Consequence for now:** a unit's VALUE is whatever it rolls (not a target). The reward economy treats
that as the emergent value (chains bank gold for the rest; one-offs top up with gold). Good enough while
the focus is story; precise "reward worth V" is a §2 concern.

## 2. DESIGN-DEFERRED: targeting a value ("generate a unit worth ~500")

The engine will eventually want "give me a reward unit worth ~V." Pure independent rolls can't hit a
target. Options to design later (NOT decided):

- **(a) Skew the pool.** Raise appearance/tier probabilities (shift the whole distribution up) so the
  *average* roll lands near V. The unit is still a roll — sometimes under, sometimes over — but centered
  on V. Simple; keeps one tag pool; variance scales with V.
- **(b) Value-tiered pools.** Separate pools whose *base* values differ — e.g. a high-V reward draws from
  a "dragonkin"/elite pool with intrinsically stronger tags, a low-V from a common pool. Picks the pool by
  V, then rolls within it. Gives distinct *flavour* per value band (a 500-gold reward FEELS different, not
  just statistically bigger), at the cost of authoring multiple pools.
- **(c) Hybrid:** pick the pool by band (b), then skew within it (a) to fine-tune toward V.

Open questions for the design pass: how much variance around V is fun (loot excitement vs. "reward worth
V" predictability); do negative/jackpot-with-catch rolls fold in here; how pools map to rarity/level;
whether the focal's value should be set this way or stay emergent + gold-topped.

This is its own prototype, AFTER the story loop is good. See ECONOMY.md (value), REWARD_BANK.md (how a
chain's reward is paid).
