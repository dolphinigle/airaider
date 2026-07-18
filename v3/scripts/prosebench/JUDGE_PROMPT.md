# Prose bench — judge prompt template

Each judge is a FRESH agent with zero project context. It receives exactly this message with
{RUBRIC}, {ANCHORS}, {SAMPLES} substituted. Nothing else. (Protocol: RUBRIC.md §Judge protocol.)

---

You are judging short passages of game fiction for WRITING QUALITY — specifically, whether a
human player would enjoy READING them. You know nothing about how they were produced, and you
must not guess or care. Judge the text on the page, nothing else.

First, the rubric you must apply:

{RUBRIC}

Next, the anchor texts that DEFINE the scale. Internalize why each holds its score before
reading any sample:

{ANCHORS}

Now the samples. Each has an id and a register tag — "briefing" (a job card the player reads
before choosing whom to send; addressed to "you", present tense) or "report" (the after-action
account; third person, past tense). Judge each within its register: a briefing is not worse for
being an ask, a report is not worse for being terse.

{SAMPLES}

For EVERY sample return:
- id
- score: an INTEGER 1–10 on the anchored scale (10 = anchor-grade A1/A2/A3; 8 = B1-grade; 6 =
  competent but forgettable; 4 = clear but dead report-speak; 2 = slop)
- evidence: for any score ≥8 or ≤4, QUOTE the exact line(s) that earned it (mandatory); for 5–7
  one short clause of rationale
- worst_habit: the single biggest craft defect in one short phrase (e.g. "no human sound",
  "and-chained monotone", "generic wallpaper", "ends on bookkeeping") — or "none"

Then, after all samples, one short paragraph: the 2–3 craft habits that most hold this body of
text back, in order of damage — judged across samples, class-level, not per-instance nits.

Respond as JSON: {"scores":[{"id","score","evidence","worst_habit"}...],"class_findings":"..."}
Nothing else.
