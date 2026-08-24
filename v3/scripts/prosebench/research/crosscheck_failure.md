# Cross-check #2 — FAILURE prose (the gap every earlier source left open)
Our weakest class historically. 39 failure/disaster texts from Battle Brothers + Fort of Chains,
58 from Fallen London/Sunless, plus KoDP's deadpan reports. Measured and read by me.

## Measurements
| corpus | n | median | sentences |
|---|---|---|---|
| Fallen London shipped failures | 58 | **31 w** | 3 |
| Battle Brothers / FoC failures | 39 | 75 w | 5 |
| KoDP outcome reports | 25 | 31 w | — |

**Success runs longer than failure — three independent confirmations.** Failbetter states it as a
rule ("make success text a bit longer or more interesting than failure text", because "text is a
reward for play"); measured in FL shipped text (33 vs 31) and strongly in Battle Brothers
(105 vs 75). This is a real asymmetry and we do not currently have it.

## The register: short, dry, and it never blames the men
> She is not convinced, even allowing some artistic license.                                  [9 w]

> Lost! You arrive too late to earn your fee.                                                 [9 w]

> Well, they're not putting their heads out. So no nailing.                                  [10 w]

> She shakes her head slowly. "Good try. Not good enough."                                   [10 w]

> You've been spotted. How embarrassing. You excuse yourself and hurry off.                  [11 w]

> You took far too long to complete the patrol you've been tasked with. Consider the contract
> failed.                                                                                    [17 w]

> The envoy didn't make it. %employer% can accept losses here and there, but he's not going to be
> happy about this. Try not to fail him again.                                               [27 w]

> Word on the road hints that the caravan you were supposed to be hunting down has given you the
> slip and reached its destination.                                                          [30 w]

> Remains of <Name>, the warrior we exiled for beating our elders, have been found not far from
> here. It is hard to say but he was probably killed by neighboring patrols.       [KoDP, deadpan]

Common properties:
1. **State the miss plainly in the first clause.** "The envoy didn't make it." "Lost!" No build-up.
2. **Dry, sometimes wry.** "How embarrassing." "So no nailing." Failure is played deadpan — which is
   already in our own `PROMPT_RULES.md` §10 residual list as the FoC lesson, now confirmed at scale.
3. **The consequence is the employer's or the world's reaction, not the party's shame.** Nobody is
   berated for incompetence; the client is annoyed, or the quarry is simply gone.
4. **Uncertainty is allowed.** KoDP: "It is hard to say but he was probably killed…"
5. **Short.** The FL median failure is 31 words and the shortest are 9–11.

## GRADED failure — Fort of Chains has the structure we actually need
FoC ships four grades per quest (`Crit` / `Success` / `Failure` / `Disaster`), and the pair is
written as an ESCALATION of the same event, not as two unrelated texts:
- Failure (49 w): *"despite having the upper hand, your slavers sloppily allowed the slime to escape
  in the middle of the fight by sliding into the gutter… had to return back to the fort
  empty-handed."*
- Disaster (101 w): the same encounter, lost outright, with a lasting cost to a named character.
- Failure (52 w): *"the mines were not as lightly guarded as your slavers had expected… They managed
  to escape, but the drows somehow know that it was you who had sent them…"*
- Disaster (98 w): same setup, but one of the party is taken.
**Pattern: FAILURE = the objective is missed but everyone comes home; DISASTER = the objective is
missed AND something is lost that persists.** Disaster runs roughly twice the length of failure,
because the lasting cost needs stating. Our engine already grades outcomes — this is directly usable.

## The craft literature agrees, and adds the reason
Jon Ingold (inkle), "The Problem of Failure": get through **"at a cost, with that cost setting up the
next beat of the story… keep the player failing-but-not-failed."** Failure prose is not a dead end;
it is the seed of the next thing. That matches FoC's "the drows somehow know that it was you who had
sent them" — a failure that plants a future problem.
