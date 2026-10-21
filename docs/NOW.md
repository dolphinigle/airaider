# Now

> The status board. Rewrite it at the end of every working session. History lives in git, decisions and experiments, not here.

**Phase:** prototype v4 kickoff (started 2026-10-19). E-0001 (Claude plays the game, designer steers) is running. Settled so far: mercs (stats, skills, talents, levels, growth) and quest tests; see [design/mercs.md](design/mercs.md) and [design/quests.md](design/quests.md).

## Next

1. **Make quest gameplay more fun.** The designer has several options ready, including **Loop Hero-style autobattler fights**. Cross-check each against [findings.md](findings.md) and the deployment research ([reference/squad-deployment.md](reference/squad-deployment.md): a decision before each roll, failure that leaves a mark, who you sent changes the event).
2. Keep playing E-0001 on the Atlas scenario with each option, then close it with a verdict.
3. Write design/ from the accepted decisions as they land, then start `v4/`.

## Waiting on the designer

- Nothing right now.

## Notes

- Lessons ledger `docs/findings.md` (D-0005): every new idea is cross-checked against it.
- Records system done (D-0001): `tools/rec.mjs`, the `records` skill, the SessionStart/Stop hooks and a git pre-commit hook (`git config core.hooksPath tools/githooks` on a fresh clone).

- v3 is still playable from the sibling checkout `../airaider-v3` (tag `v3-final`).
