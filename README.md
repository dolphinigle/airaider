# Airaider

> A persistent, single-player, **AI-driven character-collection fort game**: collect characters you grow attached to, assign them to AI-generated quests, and live with what happens. The engine owns every number; the AI owns every story.

## Repo layout

- **[docs/](docs/README.md)** — the design. Finalized + verified to convergence (2026-07-03). `docs/GENERATION_FLOW.md` is the frozen decision log every 🔒 traces to.
- **[v3/](v3/)** — prototype v3, built from scratch against the docs. Shared TypeScript core; text CLI (dogfooding) + web GUI (humans).

Prototypes v1 (`prototype/`+`engine/`) and v2 (`app/`) are deleted — recover via git tag `v2-final`.

## Run

```bash
cd v3
npm install
npm run cli          # text UI (dogfooding; mock AI by default)
npm run gui          # server + web UI
npm test             # engine invariants + sim baselines
```

Real AI needs `OPENAI_API_KEY` (via `.env`, never committed): `npm run cli -- --ai` / `npm run gui:ai`.
Free playtests on a Claude subscription: `npm run cli -- --claude` / `npm run gui:claude` (the same prompts through
the headless `claude` CLI — a playtest transport, not production; see [docs/AI_PROVIDER.md](docs/AI_PROVIDER.md) §6.1).

## Status

Prototype v3 under construction. The question it must answer: *is the marriage of the mechanical loop (min-max, fort, the roll) and the AI loop (individuated character stories) actually fun?*
