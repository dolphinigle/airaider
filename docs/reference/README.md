# Reference

Outside material we study: other games, research, sample texts. Notes, not rules. A reference shapes the game only through a decision.

One file per subject (`rimworld.md`, `battle-brothers.md`, …). Each one says where the material came from (links, editions) and why it matters to us.

## Record-keeping research (2026-10-19)

The repo layout ([D-0001](../decisions/D-0001-record-keeping-system.md)) is built from these practices:

- **Decision records:** Michael Nygard's format (context, decision, consequences) and its lean Markdown successor, [MADR](https://adr.github.io/madr/). The rules we use: one decision per record; records are immutable; a superseding record replaces an old one.
- **Documentation types:** [Diátaxis](https://diataxis.fr/) keeps explanation (vision), reference (design spec) and how-to (skills) apart, so no page mixes modes.
- **Playtest and experiment logs:** versioned, append-only reports that name the build, seeds and setup they ran on. A conclusion links back to its run, and closing an issue never erases the run behind it ([Playtesting and record keeping](https://brandonthegamedev.com/playtesting-and-record-keeping/)).
