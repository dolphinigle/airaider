# Dialogue-density experiment (batch N, 2026-07-24) — FULL SAMPLES + verdict

Designer directive: "long narration with dialogues ONLY when needed — don't make them over-commit
to it; this is an EXPERIMENT: try different things, see what lands, combine the knowledge."
All arms = shipped config (diet+stack, long budgets) differing ONLY in the speech rule; same seed
96601; blind-judged on the frozen bench (3 judges; holdout scored 10/10/10; hidden V0 repeat
scored 4/3/4 vs historic 3 — cohort calibrated).

## The arms and what they produced
| arm | speech rule | quotes/reports | median | mean |
|---|---|---|---|---|
| A quota (old default) | "One line of speech, quoted, where it changes something" | **16/16 — a metronome** | 6.5 | 6.25 |
| B neutral | "Dialogue is not required — only where it does what narration cannot" | **0/14 — total silence** | 6 | 5.5 |
| C scene-conditioned — **SHIPPED** | B's rule, but social sceneMode invites a 2-voice exchange | **~2/15** | 6.5 | **6.5** (both batch 8s) |

## The three laws this batch established (all 3 judges convergent)
1. **Permission reads as prohibition.** Remove the push and this model NEVER writes dialogue
   (0/14) — even with neutral wording. Dialogue exists only where a rule pushes.
2. **A line lifts only when it IS the turn** ("She's still there." · "The pledge needs a witness,
   not a thief") — and the quota's failure mode is real: content summarized, then the same words
   stapled on as a quote after the scene ended (N7, flagged by all three).
3. **Silence can carry a scene to an 8** (N3's wordless rescue, N11's caper) — but leaves
   procedure-logs dead when nothing else moves (B's floor: mute rescued apprentice, N8, N9).

VERDICT: ship C — silent-by-default with a data-driven push where words decide the job.
Within-noise vs A on mean, but takes the peaks, kills the 16/16 cadence stamp, and matches the
designer's over-commit instinct. Parked: D (rotating none/one/exchange axis) — C already
delivers "sometimes" from engine data rather than a random tick, and single-axis rotation
measurably stamps (ROUND2). `SPEECH_MODE=quota` restores arm A.

---

## ARM A — quota (one line per report; note the metronome)

**N1 · failure, warden-stones rescue (7,6,7 → 7)**
> Almsi arrived at the rise above the warden-stones and watched the hollow. A preacher stood on the central slab with an iron mace. Sentries formed a ring that blocked the stones' path to the bench where a bound girl sat now. /// Almsi slipped down the slope to the nearest cover and moved toward the bench, but a sentry's eye caught her as she stepped into torchlight. The preacher drove the mace flat across the stone to call the men, and a sentry stepped forward and struck her arm. Almsi drew back under the lip of the slabs and watched while two sentries kept the bound girl on the bench. She left the stones and returned empty-handed. "She's still there."

**N4 · sailmaker's tools (6,6,6 → 6)**
> Saphrax arrived at the old elf road with coil of rope, an iron hook, and a canvas to kneel on. The sink had an overhung lip of loosened earth and a lattice of roots that pinched hands and threatened to give under weight. /// He set the coil and hook where the lip would not slip, then worked the hook under the nearest root and braced himself on the canvas he had carried. When the root loosened, he fed the rope, eased a buried bundle free and carried the sod away by hand until the tarred cloth lay whole and the chest of tools sat clean of loam. He checked each seam and handle by touch, wrapped the canvas around the tools, and slung the load over his shoulder. "They're going back to Yarshaw," he said as he turned for the road.

**N7 · Glint Hollow parley (5,5,5 → 5) — the quota's staple-mode defect**
> Almsi reached Glint Hollow in the thin light. Late sun lay low and the air bit at her cheek. A lone hunter stood on the hollow's rim with a long staff and a braided cap. His presence kept the small green clear of any other folk. Mulvarion blocked the hollow's center and would not let strangers search the place for the crier bell. /// Almsi stepped up and spoke plainly. Mulvarion answered without ceremony and pointed her toward Bracken Rise. He said the bell hung there and that he kept watch until the old pledge was witnessed. He refused any removal until that was done. Almsi noted his terms, heard the rise's line of approach, and left with his directions to find the woman who tends the bell. "It hangs at Bracken Rise, and I guard the pledge," Mulvarion said.

**N10 · bell-tender partial (7,6,7 → 7)**
> Almsi drew up to Bracken Rise under low light and a steady rain that slicked the path. The bell hung in a timber frame half-swallowed by bracken, its bronze dull with lichen. Motistaari sat on the rise beside it, thin and alert, and would not permit any hand to touch the bell unless the old pledge was spoken aloud and witnessed at the frame. /// Almsi met Motistaari, spoke plain and watched the woman test the company's intent. Motistaari said the oath must be witnessed at the bell and refused any solo handling. Almsi stayed until Motistaari finished the words, then knelt to show she had heard them. Coming down the slick frame she rolled her ankle and fell, leaving the bell where it hung and the requirement clear. Motistaari folded a scrap of cloth into Almsi's hand and said, "The pledge needs a witness, not a thief."

## ARM B — neutral/no push (dialogue never appeared)

**N2 · failure, ruined chapel (6,7,6 → 6)**
> Almsi arrived at the ruined chapel beneath the warden-stones while light from a thin dawn washed the cut rock. A stretch of broken steps, moss-slick from mist, lay across the stair and blocked descent into the undercroft. /// She moved down the broken stair and lost her footing. She slid on the wet step and twisted her ankle. Almsi crawled the last yard, found only a damp scrap torn from the child's note and a set of small, bare prints that ended at the broken steps. The hollow below held no sound of a child and no sign of Emelote. She could not keep searching on one ankle and could not send anyone else from the fort. Almsi folded the torn scrap into her palm and began the climb back up.

**N6 · shaft rescue (6,6,6 → 6) — "a rescued man announced as able to speak who never speaks"**
> Saphrax drew up to the hollow on the old elf road and smelled cold air from a crack in the packed earth. A band of splintered timbers leaned into the gap and a wide brace had been snapped and forced inward. The shaft was pinched closed by that lodged beam. /// Saphrax wedged his hammer between the brace and the lip, worked the splintered beam free with two pick strikes, and crawled into the shaft. He found the apprentice wedged beneath loose turf, alive, soaked and shivering but able to speak. Saphrax cut ragged cord from the apprentice's pack to free his legs and hauled him back up by the shoulders. The hollow yielded no other living thing. Saphrax set the apprentice on the road and lifted his head until he could walk on his own.

**N9 · granary sweep (4,4,4 → 4) — entity/sequence garble, unrelated to speech**
> Almsi came to the Ford granary and found a smear of river-brown mud on the sill and a torn strap flung near the lower bins. Tacitus' dockhand stood on the threshold with a bar across the door and would not let her search the granary. /// Almsi moved the dockhand aside by giving the child a coin and led the barefoot boy downstream. At the Lower Wash the child pointed at a footpath along the bank and said dusk, someone walked toward the warden-stones carrying a wrapped bundle. She matched the mud and the strap at a hollow pool where the bank had been pressed flat, then turned the child back to the ford and kept him at her side while he pointed downriver toward the Lower Wash.

**N12 · Lower Wash trail (6,7,6 → 6)**
> They drew up to the pooled bend below the ford and moved along the bank where the child had pointed. A woman left the wash and climbed the slope toward the warden-stones with a heavy wrapped bundle under her arm, walking away from the pool. /// They followed the river trail until the bank opened to the pool and caught the woman in motion. It was Vitellia Blackbrook, moving uphill with a bulging bundle that dragged the hem of her skirt. Almsi stepped into the reeds and called once. Vitellia did not answer but lifted her head and kept walking. Saphrax kept low and tracked the prints up the slope to where the path tightened. They watched Vitellia pass out of sight along the ridge toward the warden-stones, the bundle held tight to her chest.

## ARM C — scene-conditioned (SHIPPED)

**N3 · ward-ring rescue (8,8,8 → 8) — the batch's best; wordless**
> Almsi came up the ridge with a pack, a stew pot, and a short cleaver lashed at her hip. The stone ring held Emelote on a low slab surrounded by robed acolytes and a circle of pale marks between Almsi and the slab that snapped a prick of cold against anyone who stepped on it. /// Almsi shoved the stew pot onto a flat stone and set a rag in it alight. The scent and sudden smoke made two acolytes duck their hoods and step back. She moved on the brief blind, slid the cleaver under the ward's lip where the runes did not meet the ground, and cut Emelote's cords free while the robed keepers cursed and scrambled. Emelote stumbled to her feet, coughing and steadying herself by the stone edge. She kept her head bowed until Almsi put the cleaver back and offered an arm. The pair left down the slope without more words. The ring's marks pulsed once and fell dull as they went.

**N8 · crate under the old road (5,5,5 → 5) — the wordless floor: pure mechanism**
> Saphrax came up the cut of the old road and found the cart wheel ruts filled with loose earth and a plankwork sunk where the ditch took the bank. The soil was held by crude wedges and a short cord. The wedges were set so the packed earth would slip if anyone put weight on the plankwork. /// Saphrax slipped a crowbar under the top plank, cut the cord where it bound the wedges and drove two wedges home so the earth would not let go, then hauled the crate clear and eased it out intact. The sailcloth inside was dry and folded. He checked the crate's bottom with his hands for hidden holes, pried loose the bent iron band, and refastened it before he moved. He rolled the crate up to the cart wheelbase, wedged it between the spokes, and lashed the crate to the cart frame for the road.

**N11 · Blackmoss Causeway (7,7,8 → 7)**
> Almsi came to the Blackmoss Causeway at midday and set the kettle to warm while she examined the planks. A lone watcher in a sodden cloak stood where the boardwalk narrowed and kept one hand on a spear. He barred the causeway's lane and would not let anyone pass without answering questions. /// Almsi crossed the narrow section while the watcher argued with a traveling peatman and slipped down under the boards where water ran clear. She found a scrap of leather wedged in a rotten tie-beam, its edge scrubbed of blood and stamped with the name Tadrose had asked for. The watcher never noticed the hand under the boards. Almsi stood and folded the leather into her apron and walked back across the causeway with it held against her chest.

**N13 · Hewn Scar Cave partial (6,5,7 → 6)**
> Almsi and Saphrax drew up to the broken mouth of Hewn Scar Cave and stood where loose stones ran into bare earth. A man with a weathered cloak and a lean dog at his heel sat on a slab and lashed a length of ironed timber across the opening. He held a rusted whistle on a leather thong at his belt and would not loosen the thong. /// Saphrax strode forward and took the thong. Neldris swung his staff and the dog lunged. Saphrax stepped wide, drew a clinched hammer, and cracked the wood. The staff split and the whistle skittered free while Neldris cursed. The dog tore at Saphrax's leg as it came past and a thrown spear from Neldris caught him. He sank to one knee, blood on his boot and the dog scrubbed at the wound. Almsi shoved the whistle into her apron and pressed cloth to the rupture while Neldris gathered his dog and spat that the dog would not be reclaimed. "We take the whistle and the rest goes to the fort," Saphrax said through grit, and Almsi folded the thong into her palm.

## Residual classes (unchanged by any arm; already on the worklist)
Ledger closes on investigates ("the job's question was answered" — the V0 repeat), setup-restating
outcomes (N12), procedure verb-chains without friction (N4/N6/N8), entity garble (N9's
dockhand→child), off-register word wobbles (N13's "clinched hammer", "the rupture").
