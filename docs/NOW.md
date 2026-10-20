# Now

> The status board. Rewrite it at the end of every working session. History lives in git, decisions and experiments, not here.

**Phase:** prototype v4 kickoff (started 2026-10-19). E-0001 (Claude plays the game, designer steers) is running: merc stats, coin tests and growth are taking shape (D-0007 to D-0018). Blank slate: v3 is archived ([archive/](archive/README.md)), most v3 decisions are open again ([D-0002](decisions/D-0002-v4-restart-squad-first.md)).

## Next

1. **Simulate a good game, with Claude, before any code.** Play a session on paper to find what a fun squad-on-base loop looks like. This will be E-0001.
2. Turn what the simulation shows into proposed decisions for the designer.
3. Write design/ from the accepted ones, then start `v4/`.

## Waiting on the designer

- [D-0021](decisions/D-0021-core-skills-ai-names-the-exact-skill-and-maps-it-to-one.md) (proposed): core skills (twenty-seven); the AI names exact skills and maps them.

## Notes

- Lessons ledger `docs/findings.md` (D-0005): every new idea is cross-checked against it.
- Records system done (D-0001): `tools/rec.mjs`, the `records` skill, the SessionStart/Stop hooks and a git pre-commit hook (`git config core.hooksPath tools/githooks` on a fresh clone).

- v3 is still playable from the sibling checkout `../airaider-v3` (tag `v3-final`).
