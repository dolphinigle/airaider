---
id: E-NNNN
title: What was tested, in a few words
date: YYYY-MM-DD          # the day it started
status: planned           # planned | running | done | abandoned
type: sim                 # sim | playtest | lab | judge | research
question: The one question this answers, ending in a question mark?
verdict:                  # one line, filled in when done: the answer
decisions: []             # decisions it led to or proposed, e.g. [D-0005]
commit:                   # the commit or tag of the code it ran on, if any
---

## Question

Why we are asking, and what result would change our minds. Write this BEFORE running.

## Setup

Exactly what was run, so someone else could rerun it: the build, scripts in this folder, prompts, models, seeds, sample size, judges.

## Result

The numbers and the key observations. Paste the best samples here, or keep them in `samples/`. Bulk output stays in `raw/` (gitignored).

## Verdict

What we now believe, in a sentence or two. What it changes, and any decision it proposes.

## Next

Optional. The follow-up it suggests.
