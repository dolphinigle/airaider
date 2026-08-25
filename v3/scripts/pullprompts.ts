// Prompt variants for the pull lab. Kept OUT of src/ — nothing here ships until it wins a bench.
// Probe scope: PROSE ONLY (title/situation/job). The dice `ask` fields are dropped so the
// experiment isolates writing capability, not schema obedience.

const INPUTS = `WHAT YOU ARE GIVEN
- location: the country the job sits in. Use its named places; you may coin a small one.
- archetype: the kind of work. contract = an agreed task for set pay. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey.
- rarity + level + gravity: how big and how heavy. common/small = local trouble, told short and brisk.
- slotCount: how many soldiers the work needs.
- rewardEnvelope: what the pay is. Put it on the card in the client's own words, never as a number.
- KEYWORDS: sparks. Use the ones that help, drop the rest, rewrite them in your own words.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. This is settled fact — your opening must agree with it.`;

// ── P1: cheap-model-tailored. Short. Requirements as things to DO, bans as classes. ────────────
const P1 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is one person telling the boss what is wrong and what they want done.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and how long it has been that way.
2. Say who wants it put right, and WHAT IT IS COSTING THEM while it is not. This is the whole reason the player takes the job. It is never optional, no matter how small the job is.
3. Say what they want done, as one outcome. One errand, not a list of steps. Then the pay, in the client's own words — what it is worth to them, never an amount.
4. End on ONE thing nobody can account for. Do not explain it. Finding out is what the player is buying.

HOW IT READS
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is a person talking, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern.
- 4 to 6 sentences.

NEVER
- The fort and the company perceive nothing at a distance — word REACHES them. Whatever is far away is seen by someone who was there.
- No hedged guesses with no guesser ("it is thought", "is suspected to"). If someone suspects it, say who, and let them say it.
- The pay is never named as the bare fact that there is pay. It is what the payer is giving up.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete. Never the archetype word.
- job: ONE line for the boss's list, in different words from the situation. A find-out job poses the QUESTION and never answers it.`;

// ── P2: P1 + a single mundane in-voice exemplar (bleed-safe: no quest, no props the game deals) ─
const EXEMPLAR = `
WHAT GOOD LOOKS LIKE (a different job, in a different country — never reuse its people, place, or props)
«The mill wheel at Ashcombe has been turning empty since Tuesday, because the miller went up to clear the race and did not come down. His wife has kept the grain carts standing in the yard four days now, and the carters are talking about taking their custom downriver for good, which would finish her. She wants him found, or she wants to be told he isn't coming, and she'll give a season's flour to whoever brings her one or the other. She says his boy went up after him on the second day and came back down without a word in him.»
Why it works: you can see the empty wheel; she loses her trade every day it stands; her want is plain and it costs her; and the last line opens a door the card refuses to walk through.
`;
const P2 = P1.replace('Respond as JSON:', EXEMPLAR + '\nRespond as JSON:');


// ── P3: P1 + third-person briefing register, envelope-is-a-system-note, the open question must be
//        REPORTED and ordinary (P1 invented portents), one errand, hard word budget. ────────────
const P3 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there. Someone's words may be quoted when the words themselves do work.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and how long it has been that way.
2. Say who wants it put right, and WHAT IT IS COSTING THEM while it is not. This is the whole reason the player takes the job. It is never optional, no matter how small the job is.
3. Say what they want done: ONE outcome, not a list of steps. Then the pay, in its own short sentence, as the thing the payer is giving up.
4. End on ONE thing that does not fit — something a person out there SAW and passed on. Do not explain it. Finding out is what the player is buying.

HOW IT READS
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern.
- A common job runs 60 to 85 words. Say it and stop.

NEVER
- The fort and the company perceive nothing at a distance — word REACHES them. Whatever is far away was seen by someone who was there.
- No hedged guess with no guesser ("it is thought", "is suspected to"). If someone suspects it, say who.
- rewardEnvelope is the game's own note to you, not anybody's speech: never copy its wording onto the card. Say what the payer parts with.
- The thing that does not fit is an ORDINARY thing in the wrong place — never an omen, never a token or trinket that hints at the answer, never anything uncanny. If it explains the trouble, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete. Never the archetype word.
- job: ONE line for the boss's list, in different words from the situation. A find-out job poses the QUESTION and never answers it, and never assumes what happened.`;


// ── P4: P3 + kill the messenger opening (intake was being pasted verbatim), ONE concrete cost,
//        hard length, job-line stripped of pay/plan/cause. ───────────────────────────────────────
const P4 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there. Someone's words may be quoted when the words themselves do work.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and how long it has been that way. Start here, with the thing itself.
2. Say who wants it put right, and NAME THE ONE THING IT IS COSTING THEM while it is not: work not done, goods going bad, one person doing two jobs. One concrete loss, not a mood and not a list. This is the whole reason the player takes the job, and it is never optional however small the job is.
3. Say what they want done: ONE outcome, not a list of steps. Then the pay, in its own short sentence, as the thing the payer is giving up.
4. End on ONE thing that does not fit — something a person out there SAW and passed on because it snagged on them. Do not explain it. Finding out is what the player is buying.

HOW IT READS
- Six sentences at most, and under eighty-five words. A card that runs long is a card written wrong.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser ("it is thought", "is suspected to"). If someone suspects it, say who.
- rewardEnvelope is the game's own note to you, not anybody's speech: never copy its wording onto the card. Say what the payer parts with.
- The thing that does not fit is ORDINARY in itself and only wrong where it is — never an omen, never a token or trinket that hints at the answer, never anything uncanny. If it explains the trouble, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete. Never the archetype word.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;


// ── P5: P4 + de-stick the rule wording itself ("wants it fixed because" went 4/4 template),
//        pay sentence must name payer + means (envelope is ONE word), speech allowed off the pay.
const P5 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there. One person out there may speak one line aloud, when the line does work no telling could do.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and how long it has been that way. Start here, with the thing itself.
2. Put the person who is bearing it on the page. After one read the boss must be able to say what that person LOSES every day this stands — work not done, goods going bad, one pair of hands doing two jobs. Show the loss as something happening at that place. This is the whole reason the player takes the job and it is never optional, however small the job is.
3. Say what they need to end up with: ONE outcome, not a list of steps. Then the pay, in its own short sentence.
4. End on ONE thing that does not fit — something a person out there SAW and passed on because it snagged on them. Do not explain it. Finding out is what the player is buying.

HOW IT READS
- Six sentences at most, and under eighty-five words. A card that runs long is a card written wrong.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.

NEVER
- Never say that someone wants the trouble fixed, put right, set right, or ended. That is what a job card IS; writing it down wastes the sentence. Their want shows in what they are doing about it and what it is costing them.
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser ("it is thought", "is suspected to"). If someone suspects it, say who.
- rewardEnvelope gives the KIND of pay in the game's own shorthand — never set that word down as the pay. Your pay sentence names who pays and out of what means they have it: a crew's winter chest, a season's takings, a purse a village made up between them. Nobody ever speaks the pay aloud.
- The thing that does not fit is ORDINARY in itself and only wrong where it is — never an omen, never a token or trinket that hints at the answer, never anything uncanny, and never a KEYWORD set down on the card as a prop. If it explains the trouble, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;


// ── P6: P5 with EVERY concrete example removed (§8 — "a crew's winter chest" went 5/5 sticky),
//        the speech permission withdrawn (it was spent on the pay, 4/5), and the odd detail
//        redefined as a HUMAN TRACE (the KEYWORD creature was being set down as a prop 5/5).
const P6 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and how long it has been that way. Start here, with the thing itself.
2. Put the person who is bearing it on the page. After one read the boss must be able to say what that person LOSES every day this stands, and see it happening at that place. This is the whole reason the player takes the job and it is never optional, however small the job is.
3. Say what that person needs to have happen — the state of things they are paying to get, in one sentence, never a list of steps. Then the pay, in its own short sentence.
4. End on ONE thing that does not fit: something a person out there did, moved, or left behind that nobody can account for. Do not explain it. Finding out is what the player is buying.

HOW IT READS
- Six sentences at most, and under eighty-five words. A card that runs long is a card written wrong.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.
- Nobody speaks aloud on this card.

NEVER
- Never say that someone wants the trouble fixed, put right, set right, or ended. That is what a job card IS; writing it down wastes the sentence. Their want shows in what they are doing about it and what it is costing them.
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser. If someone suspects a thing, say who does.
- rewardEnvelope gives the KIND of pay in the game's own shorthand. Never set that shorthand down as the pay. The pay sentence names who pays and what they are paying out of.
- The thing that does not fit is a trace of a PERSON — an act, a choice, a thing carried or set down. A creature, an object merely lying somewhere, or a KEYWORD placed on the card as a prop is not it. It is ordinary in itself and wrong only where it is; if it hints at the answer, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;


// ── P7: §0 test — one third the rule text, requirements as a checklist with NO fixed order and
//        no reusable phrasing (P6's rule wording went 5/5 sticky: "bears it", "He needs…").
const P7 = `You write ONE job card for a dark-fantasy mercenary game. The boss of a mercenary company reads it and decides which of his soldiers to send. He never goes himself, and nothing on this card has happened yet.

${INPUTS}

A card that works carries four things, in whatever order reads best:
- THE TROUBLE, SEEN. A thing out of place that an eye could catch, and how long it has been that way.
- WHO IS CARRYING IT, and the one thing it costs them for every day it stands. Show that cost happening. Without it the player has no reason to send anyone, and every card needs one however small the work is.
- WHAT THEY NEED TO END UP WITH — one outcome, never a list of steps — and who pays for it, out of what means they have.
- ONE THING NOBODY CAN ACCOUNT FOR: something a person did, moved, or left. Never explain it. That is what the player is buying, so a detail that hints at the answer is the wrong detail.

Write it as one person telling you a thing, not as a list of facts: pronouns after the first mention, sentences joined by so and but and because, and something an eye can see or a hand can do in every one of them. Plain farmhand words. Nothing modern. No numbers, no amounts. Everyone goes by their trade unless this message handed you a name. Nobody speaks aloud. Under eighty words and six sentences at most — say it and stop.

Four things sink a card. Opening on word arriving or on who sent it, instead of on the trouble itself. Writing down that someone wants the trouble put right — that is what a job card IS. Setting down rewardEnvelope's shorthand as if it were the pay. And saying the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation — one errand, no pay, no plan. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;


// ── P8: P6 with every requirement restated as a QUESTION THE CARD MUST ANSWER (declarative rule
//        wording came back as a template 5/5 in P4/P5/P6), the pay sentence given a job of its own
//        or folded away, and length enforced per sentence instead of per card.
const P8 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there.

${INPUTS}

THE CARD IS FINISHED WHEN IT ANSWERS ALL FOUR, IN THIS ORDER
1. What is out of place out there, and how long has it been that way? Open on that thing itself, as an eye would catch it.
2. Who is worse off for every day it goes on, and how? Answer by showing what is going wrong at that place. Do not answer with a feeling, and do not answer that they would like it dealt with — that is what a job card IS. This answer is why the player sends anyone at all, and no job is too small to owe it.
3. When the soldiers come home, what is different? One sentence, one outcome, never a list of steps.
4. What did somebody out there do, move, or leave that nobody can account for? Set it down and walk away from it — the player is buying the answer, so a detail that gives the answer away is the wrong detail.

THE PAY
Its sentence must tell the boss something he could not already guess: who is paying, and what it takes from them to pay it. A sentence that only says there is pay is a wasted sentence — fold the pay into another one instead. rewardEnvelope is the game's shorthand for the KIND of pay; never set that shorthand down as if it were the pay itself.

HOW IT READS
- Six sentences at most. Any sentence running past about fifteen words is broken in two or cut.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.
- Nobody speaks aloud on this card.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser. If someone suspects a thing, say who does.
- The thing nobody can account for is a trace of a PERSON — an act, a choice, a thing carried or set down. A creature, an object merely lying somewhere, or a KEYWORD placed on the card as a prop is not it. It is ordinary in itself and wrong only where it is.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;


// ── P9: P6 (champion) with its three leftovers fixed by NEUTRAL rewording — no questions (P8
//        proved the model answers them inside the prose), no examples, no odd phrases to lift.
const P9 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and how long it has been that way. Start here, with the thing itself.
2. Name who is left carrying it, and show one thing going wrong for them at that place while it lasts. Not a feeling, and not that they would like it dealt with — that is what a job card IS. This is why the player sends anyone at all, and no job is too small to owe it.
3. One sentence for the outcome that settles it for them — the end, never the steps to reach it. Then the pay.
4. Close on ONE thing that does not fit: something a person out there did, moved, or left behind that nobody can account for. Do not explain it. Finding out is what the player is buying.

HOW IT READS
- Six sentences at most, under eighty-five words. Any sentence past about fifteen words is broken in two or cut.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.
- Nobody speaks aloud on this card.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser. If someone suspects a thing, say who does.
- rewardEnvelope is the game's shorthand for the KIND of pay. Never set that shorthand down as if it were the pay. The pay names the hand it comes out of, and it may ride inside another sentence rather than take one of its own.
- The thing that does not fit is a trace of a PERSON — an act, a choice, a thing carried or set down. A creature, an object merely lying somewhere, or a KEYWORD placed on the card as a prop is not it. It is ordinary in itself and wrong only where it is; if it hints at the answer, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;


// ── P10: P6 with the three CONFIRMED prompt-borne templates killed (each survived a full change
//        of situation in the B fixture, so none were sampling artifacts):
//        "He needs X back" 5/5+4/4 · "coin from his purse" as its own dead sentence 5/5+4/4 ·
//        the trace collapsing to "a child's <garment> … no one can say who left it" 6/6+3/4.
const P10 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and how long it has been that way. Start here, with the thing itself.
2. Name who is left carrying it, and show one thing going wrong for them at that place while it lasts. Not a feeling, and not that they would like it dealt with — that is what a job card IS. This is why the player sends anyone at all, and no job is too small to owe it.
3. The end of the matter for them and what they will pay for it, together, in one sentence: the state of things they are buying, and the hand the coin comes out of. Never the steps, and never a sentence whose only news is that there is pay.
4. Close on ONE thing that does not fit: something a person out there did, moved, or left behind. Set it down plainly and stop — do not add that it cannot be explained, because the card has already shown that. Finding out is what the player is buying.

HOW IT READS
- Six sentences at most, under eighty-five words. Any sentence past about fifteen words is broken in two or cut.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.
- Nobody speaks aloud on this card.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser. If someone suspects a thing, say who does.
- rewardEnvelope is the game's shorthand for the KIND of pay. Never set that shorthand down as if it were the pay.
- The thing that does not fit is a trace of a PERSON — an act, a choice, a thing carried or set down — and it belongs to somebody this card has already put on the page: the one who is gone, the one who is left, the people who work that ground. A token from a stranger nobody has met is the cheap way and is not it, and neither is a creature, an object merely lying somewhere, or a KEYWORD placed on the card as a prop. It is ordinary in itself and wrong only where it is; if it hints at the answer, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;


// ── P11: P10 + the four causes read off the first real-payload batch (3/14 → target higher):
//   (a) the pay's ATTRIBUTION demand ("names the hand it comes from") was making a quote the
//       cheapest compliance — speech ban lost 4/14. Remove the demand, not add another ban (L3).
//   (b) restore the project-wide account-book ban I dropped in P6 — ledgers/tallies came back 4/14.
//   (c) the trace mold ("a child's <object>") survives because "a child" is nobody on the card;
//       pin it to a person the card ITSELF names by trade.
//   (d) duration went to a "three nights" stamp on nearly every card — stop demanding a count.
const P11 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and that it has stayed that way. Start here, with the thing itself.
2. Name who is left carrying it, and show one thing going wrong for them at that place while it lasts. Not a feeling, and not that they would like it dealt with — that is what a job card IS. This is why the player sends anyone at all, and no job is too small to owe it.
3. The end of the matter for them and what they will pay for it, together, in one sentence: the state of things they are buying, and the pay in your own plain words. Never the steps, and never a sentence whose only news is that there is pay.
4. Close on ONE thing that does not fit: something a person out there did, moved, or left behind. Set it down plainly and stop — do not add that it cannot be explained, because the card has already shown that. Finding out is what the player is buying.

HOW IT READS
- Five sentences. Any sentence past about fifteen words is broken in two or cut.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.
- Nobody speaks aloud on this card.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser. If someone suspects a thing, say who does.
- rewardEnvelope is the game's shorthand for the KIND of pay. Never set that shorthand down as if it were the pay, and never put the pay in anyone's mouth.
- Written accounts are BANNED as props anywhere on the card: no ledger, no tally, no register, no record-book, no roll, by any name.
- The thing that does not fit is a trace of a PERSON — an act, a choice, a thing carried or set down — and it belongs to one of the people this card has NAMED BY TRADE: the one who is gone, the one who is left, the people who work that ground. Anything belonging to somebody the card never put there is the cheap way and is not it, and neither is a creature, an object merely lying somewhere, or a KEYWORD placed on the card as a prop. It is ordinary in itself and wrong only where it is; if it hints at the answer, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;

// ── P12: P11 + the word cap restored beside the sentence count (a sentence count ALONE let
//        sentences balloon: 10/14 ran long, up to 127w).
const P12 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there.

${INPUTS}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and that it has stayed that way. Start here, with the thing itself.
2. Name who is left carrying it, and show one thing going wrong for them at that place while it lasts. Not a feeling, and not that they would like it dealt with — that is what a job card IS. This is why the player sends anyone at all, and no job is too small to owe it.
3. The end of the matter for them and what they will pay for it, together, in one sentence: the state of things they are buying, and the pay in your own plain words. Never the steps, and never a sentence whose only news is that there is pay.
4. Close on ONE thing that does not fit: something a person out there did, moved, or left behind. Set it down plainly and stop — do not add that it cannot be explained, because the card has already shown that. Finding out is what the player is buying.

HOW IT READS
- Five sentences, and under eighty-five words all told. Any sentence past about fifteen words is broken in two or cut.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.
- Nobody speaks aloud on this card.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser. If someone suspects a thing, say who does.
- rewardEnvelope is the game's shorthand for the KIND of pay. Never set that shorthand down as if it were the pay, and never put the pay in anyone's mouth.
- Written accounts are BANNED as props anywhere on the card: no ledger, no tally, no register, no record-book, no roll, by any name.
- The thing that does not fit is a trace of a PERSON — an act, a choice, a thing carried or set down — and it belongs to one of the people this card has NAMED BY TRADE: the one who is gone, the one who is left, the people who work that ground. Anything belonging to somebody the card never put there is the cheap way and is not it, and neither is a creature, an object merely lying somewhere, or a KEYWORD placed on the card as a prop. It is ordinary in itself and wrong only where it is; if it hints at the answer, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;


// ── P13: pay REMOVED from the prose entirely. Both UIs already print the reward beside the
//        card (cli/format.ts:155 `REWARD envelope:`, web/App.tsx:221 `<b>REWARD:</b>`), so the
//        pay sentence is redundant with the interface — and it is the root of the echo class, the
//        quoted-pay class and the dead closer. rewardEnvelope is also NOT SENT (project law: data
//        whose only instruction is 'never use it' is copy-bait). Frees a 5th of the budget for the
//        cost and the trace, which is where pull actually lives. DESIGN CHANGE — needs a ruling.
const P13 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there.

${INPUTS.split("\n").filter(l => !l.includes("rewardEnvelope")).join("\n")}

THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and that it has stayed that way. Start here, with the thing itself.
2. Name who is left carrying it, and show one thing going wrong for them at that place while it lasts. Not a feeling, and not that they would like it dealt with — that is what a job card IS. This is why the player sends anyone at all, and no job is too small to owe it.
3. The end of the matter for them, in one sentence: the state of things they want to be true when the soldiers are done. Never the steps to get there.
4. Close on ONE thing that does not fit: something a person out there did, moved, or left behind. Set it down plainly and stop — do not add that it cannot be explained, because the card has already shown that. Finding out is what the player is buying.

HOW IT READS
- Five sentences, and under eighty-five words all told. Any sentence past about fifteen words is broken in two or cut.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.
- Nobody speaks aloud on this card.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser. If someone suspects a thing, say who does.
- The pay is settled elsewhere and the boss already sees it. No coin, no purse, no wage, no reward, no offer of any kind appears on this card. Write as if payment were not your business.
- Written accounts are BANNED as props anywhere on the card: no ledger, no tally, no register, no record-book, no roll, by any name.
- The thing that does not fit is a trace of a PERSON — an act, a choice, a thing carried or set down — and it belongs to one of the people this card has NAMED BY TRADE: the one who is gone, the one who is left, the people who work that ground. Anything belonging to somebody the card never put there is the cheap way and is not it, and neither is a creature, an object merely lying somewhere, or a KEYWORD placed on the card as a prop. It is ordinary in itself and wrong only where it is; if it hints at the answer, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;



// ── P14: P12, IDENTICAL CONTENT, four requirements moved to the END anchor. Isolates POSITION
//        (§0 #3 / lost-in-the-middle) — P10-P13 all buried them mid-prompt, my own regression
//        against a rule this project had already measured.
const P14 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and decide whether to send soldiers, and which ones. The boss never goes. The job has not happened yet — nothing on this card has been done.

The card is a short briefing written TO the boss ("you"): what came in, what the job is, what it pays. Write it in the third person about the people out there.

${INPUTS}

HOW IT READS
- Five sentences, and under eighty-five words all told. Any sentence past about fifteen words is broken in two or cut.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern, and no comparisons to things this world has no word for.
- Nobody speaks aloud on this card.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- The fort and the company perceive nothing at a distance — whatever is far away was seen by someone who was there.
- No hedged guess with no guesser. If someone suspects a thing, say who does.
- rewardEnvelope is the game's shorthand for the KIND of pay. Never set that shorthand down as if it were the pay, and never put the pay in anyone's mouth.
- Written accounts are BANNED as props anywhere on the card: no ledger, no tally, no register, no record-book, no roll, by any name.
- The thing that does not fit is a trace of a PERSON — an act, a choice, a thing carried or set down — and it belongs to one of the people this card has NAMED BY TRADE: the one who is gone, the one who is left, the people who work that ground. Anything belonging to somebody the card never put there is the cheap way and is not it, and neither is a creature, an object merely lying somewhere, or a KEYWORD placed on the card as a prop. It is ordinary in itself and wrong only where it is; if it hints at the answer, it is the wrong detail.
- The trouble stays the SIZE it came in as. Do not widen one person's disappearance into everyone's.
- Never write the same fact twice in different words.

═══ ABOVE ALL (write now) ═══
THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and that it has stayed that way. Start here, with the thing itself.
2. Name who is left carrying it, and show one thing going wrong for them at that place while it lasts. Not a feeling, and not that they would like it dealt with — that is what a job card IS. This is why the player sends anyone at all, and no job is too small to owe it.
3. The end of the matter for them and what they will pay for it, together, in one sentence: the state of things they are buying, and the pay in your own plain words. Never the steps, and never a sentence whose only news is that there is pay.
4. Close on ONE thing that does not fit: something a person out there did, moved, or left behind. Set it down plainly and stop — do not add that it cannot be explained, because the card has already shown that. Finding out is what the player is buying.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;

// ── P15: P14 trimmed — the rules that never once fired across a real-payload batch are cut.
const P15 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card and pick which soldiers to send; the boss never goes, and the job has not happened yet. The card is a short briefing TO them ("you"), in the third person about the people out there.

${INPUTS}

HOW IT READS
- Five sentences, and under eighty-five words all told. Any sentence past about fifteen words is broken in two or cut.
- After you name someone once, use he / she / they. A person is never re-introduced by their trade twice.
- Sentences connect: so, but, and, because. This is someone telling you a thing, not a list of facts.
- Every sentence holds something an eye can see or a hand can do. A sentence of mood only is cut.
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. No numbers, no amounts. Nothing modern.
- Nobody speaks aloud on this card.

NEVER
- Never open on word arriving, on a messenger, or on who sent it. The boss knows the card came from somewhere. intake exists so you do not contradict how it got here; it almost never earns a sentence.
- rewardEnvelope is the game's shorthand for the KIND of pay. Never set that shorthand down as if it were the pay, and never put the pay in anyone's mouth.
- Written accounts are BANNED as props anywhere on the card: no ledger, no tally, no register, no record-book, no roll, by any name.
- The thing that does not fit belongs to one of the people this card NAMED BY TRADE, and it is something they did or set down. Never a stranger's, a creature, or a KEYWORD used as a prop. Ordinary in itself, wrong only where it is; if it hints at the answer it is the wrong detail.
- Never write the same fact twice in different words.

═══ ABOVE ALL (write now) ═══
THE CARD MUST DO FOUR THINGS, IN THIS ORDER
1. SHOW the trouble — something out of place that an eye could see, and that it has stayed that way. Start here, with the thing itself.
2. Name who is left carrying it, and show one thing going wrong for them at that place while it lasts. Not a feeling, and not that they would like it dealt with — that is what a job card IS. This is why the player sends anyone at all, and no job is too small to owe it.
3. The end of the matter for them and what they will pay for it, together, in one sentence: the state of things they are buying, and the pay in your own plain words. Never the steps, and never a sentence whose only news is that there is pay.
4. Close on ONE thing that does not fit: something a person out there did, moved, or left behind. Set it down plainly and stop — do not add that it cannot be explained, because the card has already shown that. Finding out is what the player is buying.

Respond as JSON: {title, situation, job}
- title: short and concrete — it names the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation. No pay in it and no plan in it — one errand only. A find-out job is posed as the QUESTION, and never names a cause the situation has not established.`;


// ── P16: readability-first rebuild (designer 2026-08-24: "readability >>> everything").
//   Cold-read of P14 found THREE self-contradictions the bans had been papering over:
//   (a) pay: frame + INPUTS said "in the client's own words" while NEVER said "never in anyone's
//       mouth" — the INPUTS line was inviting the quote I kept banning. Now stated ONCE.
//   (b) intake: "your opening must agree with it" + "it almost never earns a sentence" → the model
//       obeyed both by pasting intake as a NON-opening sentence. Now: never contradict, never state.
//   (c) "the fort perceives nothing at a distance" contradicted the engine's own wall-visible
//       intakes. Now scoped to what is far.
//   Dead inputs cut (rarity/level claimed to set size under a fixed cap; slotCount was blind and
//   leaked into job lines). Each rule now lives in exactly ONE place. The END ANCHOR is now the
//   READABILITY block, not the content block, because readability outranks everything.
const P16 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and that it has stayed that way. Open here, on the thing itself.
2. The person left carrying it, by trade, and ONE thing going wrong for them at that place while it lasts. Show it happening. Not a feeling, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit — something that person, or the one who is gone, did or set down. Ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Name their trade once, then he, she, or they. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up what the last one left, joined by so, but, and, because. Five separate facts in five separate sentences is a form to fill in, not a thing to read.
5. Five sentences, under eighty-five words, none past about fifteen words. Say it and stop.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation — one errand, no pay, no plan, no count of soldiers. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;

// ── P17: P16 + the substance the readability squeeze cost it — duration folded back INTO
//        sentence 1 (it was becoming a dead trailing 5th sentence), the cost guarded against
//        trivial inconvenience (snagged sleeves, guttering smokers), and the trace restored to an
//        ACT rather than an object lying somewhere (P10's framing, which produced the best writing
//        of the whole lab, had been compressed out).
const P17 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it. A mishap that a farmhand would simply tidy up is not a job.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. A small fumble or a snagged sleeve is not a cost. Not a feeling either, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit, and it is an ACT — something a person DID: carried, moved, cleaned, hid, refused, went back for. An object simply lying somewhere is not it; a person's choice about that object is. It belongs to one of the people this card has already put on the page, it is ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Name their trade once, then he, she, or they. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up what the last one left, joined by so, but, and, because. Five separate facts in five separate sentences is a form to fill in, not a thing to read.
5. Five sentences, under eighty-five words, none past about fifteen words. Say it and stop.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation — one errand, no pay, no plan, no count of soldiers. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;

// ── P18: P17 + (a) the closer PINNED last — a dead sixth sentence was reappearing after it
//        ('So the fort sends word for hired hands'), which wastes the highest-attention position;
//        (b) the verb list in rule 4 de-stuck ('He carried...' went 4/5 — L1, the first item in any
//        list I write becomes the template); (c) the actor rotated off the client every time.
const P18 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it. A mishap that a farmhand would simply tidy up is not a job.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. A small fumble or a snagged sleeve is not a cost. Not a feeling either, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. An object simply lying somewhere is not it; a person's choice about that object is. The one who did it is somebody this card has already put on the page — sometimes the one left carrying the trouble, sometimes the one who is gone, sometimes whoever works that ground; do not make it the same one every time. The act is ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying. THIS IS THE LAST SENTENCE OF THE CARD — nothing follows it, no summing up, no asking the fort for help, no one adding a further remark.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Name their trade once, then he, she, or they. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up what the last one left, joined by so, but, and, because. Five separate facts in five separate sentences is a form to fill in, not a thing to read.
5. Five sentences, under eighty-five words, none past about fifteen words. The fifth is the one that does not fit, and the card stops there.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation — one errand, no pay, no plan, no count of soldiers. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;

// ── P19: P18 + the sentence ARITHMETIC fixed. Five sentences were demanded but only four
//        contents specified, so the model invented a mood/ground filler for slot 4 ('The leaning
//        hut by the path keeps a hush of old regret'). Four things = four sentences. Also: the job
//        line was naming the closer 4/5, selling the mystery the card had just bought.
const P19 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it. A mishap that a farmhand would simply tidy up is not a job.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. A small fumble or a snagged sleeve is not a cost. Not a feeling either, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. An object simply lying somewhere is not it; a person's choice about that object is. The one who did it is somebody this card has already put on the page — sometimes the one left carrying the trouble, sometimes the one who is gone, sometimes whoever works that ground; do not make it the same one every time. The act is ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying. THIS IS THE LAST SENTENCE OF THE CARD — nothing follows it, no summing up, no asking the fort for help, no one adding a further remark.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Name their trade once, then he, she, or they. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up what the last one left, joined by so, but, and, because. Five separate facts in five separate sentences is a form to fill in, not a thing to read.
5. FOUR sentences — one for each of the four things, in that order — under seventy-five words, none past about fifteen words. There is no fifth sentence to fill: if you find yourself describing the ground, the weather, or what a place feels like, you have written a sentence the card does not have room for. The fourth is the one that does not fit, and the card stops there.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation — one errand, no pay, no plan, no count of soldiers. It never mentions the thing that does not fit; that is the player's to find, and naming it here sells it twice. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;

// ── P20: P19 + an ENGINE-DEALT `oddActor` rotation. The closing act landed on the CLIENT 14/14
//        — a cheap model cannot vary across independent calls, and 'do not make it the same one
//        every time' is exactly the kind of directive this project has already measured as useless
//        (variety = input shaping). Also fixes 'The herbalist, she, cannot work' — my pronoun rule
//        listed the pronouns, so the model set one down inline.
const P20 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.
- oddActor: WHOSE strange act closes this card — "missing" = the one who is gone, "client" = the one left carrying the trouble, "bystander" = someone else who works that ground. Use the one you are given and no other. It is a marker for you, never a word for the card: name that person by their trade.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it. A mishap that a farmhand would simply tidy up is not a job.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. A small fumble or a snagged sleeve is not a cost. Not a feeling either, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. An object simply lying somewhere is not it; a person's choice about that object is. oddActor names who did it; put that person on the page if they are not there already. The act is ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying. THIS IS THE LAST SENTENCE OF THE CARD — nothing follows it, no summing up, no asking the fort for help, no one adding a further remark.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Name their trade once, then a pronoun. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up what the last one left, joined by so, but, and, because. Five separate facts in five separate sentences is a form to fill in, not a thing to read.
5. FOUR sentences — one for each of the four things, in that order — under seventy-five words, none past about fifteen words. There is no fifth sentence to fill: if you find yourself describing the ground, the weather, or what a place feels like, you have written a sentence the card does not have room for. The fourth is the one that does not fit, and the card stops there.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation — one errand, no pay, no plan, no count of soldiers. It never mentions the thing that does not fit; that is the player's to find, and naming it here sells it twice. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;

// ── P21: P20 + (a) LETTER tokens for oddActor — 'client' leaked into the prose as a literal
//        word; (b) the conjunction list was being used to OPEN sentences ('And they want...',
//        'But the client...'); (c) the pronoun rule kept producing appositives ('A shepherd, he
//        cannot tend his herd', 'The herbalist, she, cannot work').
const P21 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.
- oddActor: WHOSE strange act closes this card — "A" = the one who is gone, "B" = the one left carrying the trouble, "C" = someone else who works that ground. Use the one you are given and no other. It is a marker for you, never a word for the card: name that person by their trade.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it. A mishap that a farmhand would simply tidy up is not a job.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. A small fumble or a snagged sleeve is not a cost. Not a feeling either, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. An object simply lying somewhere is not it; a person's choice about that object is. oddActor names who did it; put that person on the page if they are not there already. The act is ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying. THIS IS THE LAST SENTENCE OF THE CARD — nothing follows it, no summing up, no asking the fort for help, no one adding a further remark.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Give their trade the first time and speak of them as he or she or they after that, the ordinary way — never both at once in the one phrase. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up something the last one left, so the four run as one telling. Four separate facts set down side by side is a form to fill in, not a thing to read. Do not open a sentence with a joining word.
5. FOUR sentences — one for each of the four things, in that order — under seventy-five words, none past about fifteen words. There is no fifth sentence to fill: if you find yourself describing the ground, the weather, or what a place feels like, you have written a sentence the card does not have room for. The fourth is the one that does not fit, and the card stops there.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list, in different words from the situation — one errand, no pay, no plan, no count of soldiers. It never mentions the thing that does not fit; that is the player's to find, and naming it here sells it twice. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;

// ── P22: P21 + the job line, the last weak field: it kept stacking errands ('Clear the bee-path
//        AND escort the beekeeper to market'). ONE VERB, one object, stated structurally.
const P22 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.
- oddActor: WHOSE strange act closes this card — "A" = the one who is gone, "B" = the one left carrying the trouble, "C" = someone else who works that ground. Use the one you are given and no other. It is a marker for you, never a word for the card: name that person by their trade.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it. A mishap that a farmhand would simply tidy up is not a job.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. A small fumble or a snagged sleeve is not a cost. Not a feeling either, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. An object simply lying somewhere is not it; a person's choice about that object is. oddActor names who did it; put that person on the page if they are not there already. The act is ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying. THIS IS THE LAST SENTENCE OF THE CARD — nothing follows it, no summing up, no asking the fort for help, no one adding a further remark.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Give their trade the first time and speak of them as he or she or they after that, the ordinary way — never both at once in the one phrase. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up something the last one left, so the four run as one telling. Four separate facts set down side by side is a form to fill in, not a thing to read. Do not open a sentence with a joining word.
5. FOUR sentences — one for each of the four things, in that order — under seventy-five words, none past about fifteen words. There is no fifth sentence to fill: if you find yourself describing the ground, the weather, or what a place feels like, you have written a sentence the card does not have room for. The fourth is the one that does not fit, and the card stops there.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: the line that goes on the boss's list. ONE VERB and one object — the single thing the soldiers must come back having done. Not two, not a verb with 'and' after it. Different words from the situation. No pay, no plan, no count of soldiers, and no mention of the thing that does not fit — that is the player's to find, and naming it here sells it twice. When the errand is to find something out, the line is the QUESTION itself, and it never names a cause the situation has not established.`;

// ── P23: P21's job rule with the anti-stacking test only. P22's "ONE VERB and one object"
//        collapsed the field into telegram stubs ("Clear access", "Find cause") and cost one card
//        its whole situation — the cap has to be on errands, not on words.
const P23 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.
- oddActor: WHOSE strange act closes this card — "A" = the one who is gone, "B" = the one left carrying the trouble, "C" = someone else who works that ground. Use the one you are given and no other. It is a marker for you, never a word for the card: name that person by their trade.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it. A mishap that a farmhand would simply tidy up is not a job.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. A small fumble or a snagged sleeve is not a cost. Not a feeling either, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. An object simply lying somewhere is not it; a person's choice about that object is. oddActor names who did it; put that person on the page if they are not there already. The act is ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying. THIS IS THE LAST SENTENCE OF THE CARD — nothing follows it, no summing up, no asking the fort for help, no one adding a further remark.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Give their trade the first time and speak of them as he or she or they after that, the ordinary way — never both at once in the one phrase. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up something the last one left, so the four run as one telling. Four separate facts set down side by side is a form to fill in, not a thing to read. Do not open a sentence with a joining word.
5. FOUR sentences — one for each of the four things, in that order — under seventy-five words, none past about fifteen words. There is no fifth sentence to fill: if you find yourself describing the ground, the weather, or what a place feels like, you have written a sentence the card does not have room for. The fourth is the one that does not fit, and the card stops there.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list — a whole instruction a captain could act on, in different words from the situation. One errand only: if you need an "and" to say it, that is two errands, and you keep the one the client is actually paying for. No pay, no plan, no count of soldiers. It never mentions the thing that does not fit; that is the player's to find, and naming it here sells it twice. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;


// ── P24: designer hypothesis test (2026-08-24) — EVERY ban converted to a positive assignment.
//   Grounding: ironic-process / "pink elephant" (a ban must activate the concept to suppress it),
//   the documented "Inducing Effect" (negative prompts pull TOWARD the unwanted content harder
//   than positive ones), and recency bias — my NEVER block sat in the highest-attention slot,
//   planting every concept it forbade. Isolates ONE variable: ban-form vs assignment-form.
const P24 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. The boss already knows word reached him; you write what the word was ABOUT.
- oddActor: WHOSE strange act closes this card — "A" = the one who is gone, "B" = the one left carrying the trouble, "C" = someone else who works that ground. Use the one you are given. It is a marker for you: on the card, name that person by their trade.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch, and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, in plain words of your own.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. oddActor names who did it; put that person on the page if they are not there already. The act is ordinary in itself and wrong only where it is. Set it down and stop. Finding out is what the player is buying.

HOW THIS WORLD AND THIS CARD WORK
- Everyone goes by their trade. Names come only from this message.
- The words are the everyday words of an age of candles, horses and hand tools.
- The props are things hands use: tools, gear, rope, cloth, livestock, food, boats, carts.
- Amounts are spoken as a working person speaks them: a cartload, the winter's worth, a day's haul.
- Whatever is far from the fort reached the boss through somebody who stood there and saw it.
- Every guess belongs to somebody — name who guesses it.
- The trouble stays the one person, or the one place, it arrived as.
- Each sentence brings something the card does not already hold.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early, and close together.
2. ONE person stands on this card. Give their trade the first time and speak of them as he or she or they after that, the ordinary way.
3. Everything is introduced before it is spoken of as a known thing.
4. Each sentence picks up something the last one left, so the four run as one telling.
5. FOUR sentences — one for each of the four things, in that order — under seventy-five words, none past about fifteen words. The fourth is the one that does not fit, and the card stops there.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: ONE line for the boss's list — a whole instruction a captain could act on, in different words from the situation. One errand only: if you need an "and" to say it, that is two errands, and you keep the one the client is actually paying for. The thing that does not fit stays out of this line; that is the player's to find.`;

// ── P25: P24 (positive form kept, per the designer's ruling on bans) with the two classes the
//        conversion LOST put back by SILENCE rather than by ban or by permission: the amounts line
//        is gone entirely (its positive form invited 'two crowns' / 'a cartload of coin'), and the
//        props line now FILLS the space instead of gesturing at it. Plus three craft upgrades from
//        the research: Gopen & Swan topic/stress positions (the single strongest readability
//        lever), Loewenstein's information gap (curiosity needs PARTIAL knowledge — a random act
//        is not a gap), and one sensory anchor folded into rule 1 rather than added as a demand.
const P25 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. The boss already knows word reached him; you write what the word was ABOUT.
- oddActor: WHOSE strange act closes this card — "A" = the one who is gone, "B" = the one left carrying the trouble, "C" = someone else who works that ground. Use the one you are given. It is a marker for you: on the card, name that person by their trade.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch — or a nose, or a hand — and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, in plain words of your own.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. oddActor names who did it; put that person on the page if they are not there already. The act touches what is already on the card — the same place, the same thing, or the person the trouble is about — so the reader can feel it MIGHT matter without being told how. An act with no bearing on the trouble is not a mystery, only a stray fact. It is ordinary in itself and wrong only where it is. Set it down and stop. Finding out is what the player is buying.

HOW THIS WORLD AND THIS CARD WORK
- Everyone goes by their trade. Names come only from this message.
- The words are the everyday words of an age of candles, horses and hand tools.
- Everything on this card is a thing hands work with — tools, gear, rope, cloth, livestock, food, boats, carts, doors, fire. That is the whole world of it.
- Whatever is far from the fort reached the boss through somebody who stood there and saw it.
- Every guess belongs to somebody — name who guesses it.
- The trouble stays the one person, or the one place, it arrived as.
- Each sentence brings something the card does not already hold.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early, and close together.
2. ONE person stands on this card. Give their trade the first time and speak of them as he or she or they after that, the ordinary way.
3. Everything is introduced before it is spoken of as a known thing.
4. Begin each sentence with something the reader already holds from the sentence before, and end it on the thing that is new. The end of a sentence is where the weight falls, so put there what you most want kept.
5. FOUR sentences — one for each of the four things, in that order — under seventy-five words, none past about fifteen words. The fourth is the one that does not fit, and the card stops there.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: ONE line for the boss's list — a whole instruction a captain could act on, in different words from the situation. One errand only: if you need an "and" to say it, that is two errands, and you keep the one the client is actually paying for. The thing that does not fit stays out of this line; that is the player's to find.`;

// ── P26: the P23 champion + ONLY the upgrades that survived testing.
//   KEPT FROM P23: the short bans on numbers and written accounts. Measured across P24/P25, these
//   are the classes where a ban BEATS both silence and positive rephrasing — silence let "six
//   silver"/"twenty swarms" through, and a positive "amounts are spoken as a working person speaks
//   them" invited them worse. The designer's ban-hypothesis holds where another rule creates the
//   temptation (pay quoting); it does NOT hold for closed concrete classes.
//   REJECTED: Gopen & Swan topic/stress position as an explicit instruction. The principle is
//   correct and it is what rule 4 already achieves implicitly, but stated outright a cheap model
//   literalizes it into lexical echo chains ("...the sexton offers coin. Coin does not fit: ...").
//   ADDED: Loewenstein's information gap — curiosity needs PARTIAL knowledge, so the odd act must
//   TOUCH the trouble; a stray fact is not a mystery. Fixes P23's unconnected-act failures.
//   ADDED: a sensory anchor, folded into rule 1 instead of added as a separate demand.
const P26 = `You write ONE job card for a dark-fantasy mercenary game.

The player is the boss of a mercenary company. They read this card once and pick which soldiers to send. The boss never goes, and the job has not happened yet. Write in the third person about the people out there.

WHAT YOU ARE GIVEN
- location: the country this sits in. Use its named places, or coin a small one.
- archetype: the kind of work. contract = an agreed task. investigate = uncover a hidden thing. hunt = track down a person or beast. rescue = free someone held. raid = hit a holdout for spoils. capture = take someone alive. escort = guard a journey. lead-hunt = sweep for word of what to do next.
- gravity: how heavy this reads — brisk for a small matter, straight for a serious one.
- rewardEnvelope: the game's shorthand for the KIND of pay. Turn it into plain words of your own. Never copy it, never let anyone say it aloud, never give an amount.
- KEYWORDS: sparks for the WORLD this happens in. Take at most one, rebuilt in your own words. They are not people and not props to place on the card.
- opening.spark: loose atoms for how the trouble first showed. Build your own opening from them.
- intake: how word reached the fort. Never contradict it and never state it — the boss knows the card came from somewhere.
- oddActor: WHOSE strange act closes this card — "A" = the one who is gone, "B" = the one left carrying the trouble, "C" = someone else who works that ground. Use the one you are given and no other. It is a marker for you, never a word for the card: name that person by their trade.

WHAT THE CARD SAYS — four things, in this order
1. The trouble, SEEN: one thing out of place that an eye could catch — or a nose, or a hand — and how long it has stood so — both in the SAME sentence, because this is where the card opens and the next sentences are spoken for. It is worth hiring armed men over: someone stands to lose work, goods, or safety by it. A mishap that a farmhand would simply tidy up is not a job.
2. The person left carrying it, by trade, and what it is COSTING them while it lasts — work they cannot do, goods going bad, one pair of hands doing two jobs. Show that loss happening at that place. A small fumble or a snagged sleeve is not a cost. Not a feeling either, and not that they would like it dealt with — that is what a job card IS. This is the reason the player sends anyone, and no job is too small to owe it.
3. What they want to be true when it is done, and what they pay, in one sentence. The end of the matter, never the steps to reach it.
4. One thing that does not fit, and it is an ACT — a person DID something with a thing, or about it. An object simply lying somewhere is not it; a person's choice about that object is. oddActor names who did it; put that person on the page if they are not there already. The act touches what is already on the card — the same place, the same thing, or the person the trouble is about — so a reader can feel it MIGHT matter without being told how. An act with no bearing on the trouble is not a mystery, only a stray fact. It is ordinary in itself and wrong only where it is. Set it down and stop: do not explain it, do not say it cannot be explained, and if it hints at the answer it is the wrong detail. Finding out is what the player is buying. THIS IS THE LAST SENTENCE OF THE CARD — nothing follows it, no summing up, no asking the fort for help, no one adding a further remark.

ALSO
- Nobody has a name unless this message gave you one. Everyone else goes by trade.
- Plain everyday words a farmhand would use. Nothing modern. No numbers, no amounts.
- Whatever is far from the fort was seen by someone who was there, not by the fort.
- If someone guesses at a cause, say who guesses. No guess floats loose.
- Written accounts are banned as props: no ledger, no tally, no register, no record-book, no roll, by any name.
- The trouble stays the size it arrived at. One person missing is not everyone missing.

═══ ABOVE ALL — THIS IS READ ONCE, SO IT MUST READ CLEAN (write now) ═══
1. Every sentence parses ONE way on one skim. Subject and verb early. Nothing stacked behind three prepositions.
2. ONE person stands on this card. Give their trade the first time and speak of them as he or she or they after that, the ordinary way — never both at once in the one phrase. Nobody else becomes a character — a crowd stays a crowd.
3. Nothing is "the" anything until this card has put it on the page. A reader who meets "the washer" before any washer exists has to stop and work it out.
4. Each sentence picks up something the last one left, so the four run as one telling. Four separate facts set down side by side is a form to fill in, not a thing to read. Do not open a sentence with a joining word.
5. FOUR sentences — one for each of the four things, in that order — under seventy-five words, none past about fifteen words. There is no fifth sentence to fill: if you find yourself describing the ground, the weather, or what a place feels like, you have written a sentence the card does not have room for. The fourth is the one that does not fit, and the card stops there.
6. Never write the same fact twice in different words.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on, never a summary of the first sentence.
- job: ONE line for the boss's list — a whole instruction a captain could act on, in different words from the situation. One errand only: if you need an "and" to say it, that is two errands, and you keep the one the client is actually paying for. No pay, no plan, no count of soldiers. It never mentions the thing that does not fit; that is the player's to find, and naming it here sells it twice. A find-out job is posed as the QUESTION and never names a cause the situation has not established.`;


// ── P30: REBUILT SMALL from the official-English rite target (median 24w, 2 sentences, 12 w/sent).
//   P26 was ~900 words aiming at 50-75w cards; the goal is ~24w, so the prompt was three times too
//   big and pointed at the wrong size. Deletions do most of the work here:
//   · the duration demand is GONE — the payload has no duration field, so it forced invention
//     ("since the last market") on nearly every card
//   · "use its named places" is GONE — it dragged the landmark AND the Known-ground token into one
//     short card ("Thornhollow" + "the ridgeline warden-stones")
//   · the cost sentence is GONE — official rite intros do not account for what the trouble costs
//   · rule 2's liftable wording is GONE ("is left carrying it" came back as a template)
//   Shape taken from the shipped intros: TWO sentences — what happened, then what it means for you.
const P30 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work — contract, investigate, hunt, rescue, raid, capture, escort, or a sweep for word of what to do next.
- gravity: how heavy it reads. Small matters read brisk.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take at most one and rebuild it in your own words.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Not a place, not an object sitting still, not the weather.

**Second: what that means for the reader.** A doubt, a demand, a question, a price, a thing that will get worse. This sentence is why the player sends anyone, and it is the last thing they read.

Then close on ONE act nobody has explained — something a person did with a thing, or about it. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use — miller, drover, shepherd, warden, smith. Never invent a compound job.
- Only what the message names has a name.
- Plain period words. No numbers, no amounts. Nothing written down as a prop.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, one errand, in different words from the situation. It never names the unexplained act.`;

// ── P31: P30 + four fixes, no net growth. The 25-word budget made the model drop articles
//        ("Woodsman drove", "Drover cut"); "we/us" crept in for the company; job lines stacked
//        errands; and compressing the written-record ban let a ledger back.
const P31 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- gravity: how heavy it reads. Small matters read brisk.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take at most one and rebuild it in your own words.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

**First: someone DID something, or something is being done to people.** A person acts in the first six words — *a* miller, *the* drover, never a bare job title standing alone. Not a place, not an object sitting still, not the weather.

**Second: what that means for the reader.** A doubt, a demand, a question, a price, a thing that will get worse. This sentence is why the player sends anyone, and it is the last thing they read.

Then close on ONE act nobody has explained — something a person did with a thing, or about it. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use — miller, drover, shepherd, warden, smith. Never invent a compound job.
- Only what the message names has a name.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It never names the unexplained act.`;

// ── P32: P31 + the three defects only READING caught (the reviewer now catches the first):
//        an ambiguous pronoun closer when two trades share a card, incoherent premises from two
//        KEYWORDS forced together ("swore the wildcat took his debt"), and job lines naming the
//        unexplained act and so selling it twice.
const P32 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- gravity: how heavy it reads. Small matters read brisk.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

**First: someone DID something, or something is being done to people.** A person acts in the first six words — *a* miller, *the* drover, never a bare job title standing alone. Not a place, not an object sitting still, not the weather.

**Second: what that means for the reader.** A doubt, a demand, a question, a price, a thing that will get worse. This sentence is why the player sends anyone, and it is the last thing they read.

Then close on ONE act nobody has explained — something a person did with a thing, or about it. Say WHO by their trade, not "he" or "she", whenever more than one person stands on the card. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use — miller, drover, shepherd, warden, smith. Never invent a compound job.
- Only what the message names has a name.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P33: P32 + the coherence classes my READING caught that the reviewer could not (two of the
//        three are now linted): cold referents ("the patron" with no introduction), premises made
//        incoherent by forcing archetype and keywords together, and job lines promising a different
//        errand than the card's second sentence.
const P33 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- gravity: how heavy it reads. Small matters read brisk.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

It must describe ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them. A card nobody can follow is worse than a plain card.

**First: someone DID something, or something is being done to people.** A person acts in the first six words — *a* miller, *the* drover, never a bare job title standing alone. Not a place, not an object sitting still, not the weather.

**Second: what that means for the reader.** A doubt, a demand, a question, a price, a thing that will get worse. This sentence is why the player sends anyone, and it is the last thing they read.

Then close on ONE act nobody has explained — something a person did with a thing, or about it. Say WHO by their trade, not "he" or "she", whenever more than one person stands on the card. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use — miller, drover, shepherd, warden, smith. Never invent a compound job.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P34: P33 + a bug I introduced myself — my italic examples ("*a* miller, *the* drover") taught
//        the model to START CARDS LOWERCASE, 4 of 28. L1 applies to FORMATTING, not just wording.
//        Also: give the model plain job words to reach for instead of banning coinage, and keep pay
//        out of the job line. Trimmed to offset the additions.
const P34 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what that means for the reader.** A doubt, a demand, a question, a price, a thing that will get worse. This sentence is why the player sends anyone, and it is the last thing they read.

Then close on ONE act nobody has explained — something a person did with a thing, or about it. Say WHO by their trade, not "he" or "she", whenever more than one person stands on the card. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, take the plainest one that already exists — keeper, guide, hand, watchman, carter, cook — and never join two words to make a new job.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P35: MEASURED against the 1,495 official rite intros — the prompt was manufacturing devices
//        the gold standard barely uses. "before X happens" urgency: official 1%, ours 57%.
//        Imperatives at the reader ("Find him", "Send men"): official 1%, ours 36%. "demands":
//        1% vs 25%. Questions, which official text uses 14% of the time, we never wrote at all.
//        The card DESCRIBES; the job line commands.
const P35 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

One act nobody has explained closes the card — something a person did with a thing, or about it. Say WHO by their trade, not "he" or "she", whenever more than one person stands on the card. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, take the plainest one that already exists — keeper, guide, hand, watchman, carter, cook — and never join two words to make a new job.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P36: P35 + a seeded CLIENT MOTIVE dealt per card from a 120-entry pool. Designer ruled the
//        anti-monotony fix acceptable only if seeded from a large pool rather than asserted as a
//        prompt directive — which is also this project's own law (variety = input shaping).
const P36 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- clientMotive: what the person who brings this job WANTS, and what they are not saying. Build the card out of it — this is why this job is not like the last one. Never quote it; the concealment shows in what they say or fail to say, and the card never explains it outright.
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

One act nobody has explained closes the card — something a person did with a thing, or about it. Say WHO by their trade, not "he" or "she", whenever more than one person stands on the card. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, take the plainest one that already exists — keeper, guide, hand, watchman, carter, cook — and never join two words to make a new job.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P37: P36 + the concealment DEVICE fixed. Dealing a client motive worked on premise but the
//        model expressed it identically every time — 'he will not say why', 'no one can say' — in
//        32% of cards. That construction appears ZERO times in the 1,495 official rite intros. The
//        reference states the contradicting fact instead, usually on a but/though pivot (17.9%).
const P37 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- clientMotive: what the person bringing this job WANTS, and the thing that is actually true. Build the card out of it — this is why this job is not like the last one. Never quote it. **Do not write that anyone "will not say" or that "no one can say" — say the true thing yourself, plainly, and let it sit against what they asked for.** Often that is one clause hung on a *but* or a *though*.
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

One act nobody has explained closes the card — something a person did with a thing, or about it. Say WHO by their trade, not "he" or "she", whenever more than one person stands on the card. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, take the plainest one that already exists — keeper, guide, hand, watchman, carter, cook — and never join two words to make a new job.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P38: MOTIVE pool v2 — the concealment field reshaped from an inner motive into an OBSERVABLE
//        TELL. v1 was pasted as an explanation ('though she secretly hopes he is dead') in 46% of
//        cards, because a psychological truth can only enter prose as a statement of itself. An
//        observable detail is SAFE to paste: it is the card's concrete particular.
const P38 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- clientMotive: what the person bringing this job asks for, and one thing about them that can be SEEN. Build the card out of both. Put the seen thing on the card as a plain fact and do not explain what it means — the reader works that out. Never write that someone "will not say" or that "no one can say".
- oddActor: whose strange act closes the card — "A" the one who is gone, "B" the one left with the trouble, "C" someone else who works that ground.

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

One act nobody has explained closes the card — something a person did with a thing, or about it. Say WHO by their trade, not "he" or "she", whenever more than one person stands on the card. Ordinary in itself, wrong only where it is. Set it down and stop. That act may live inside the second sentence or take a short third; three sentences is the ceiling.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, take the plainest one that already exists — keeper, guide, hand, watchman, carter, cook — and never join two words to make a new job.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P39: P38 + two fixes. 'clientMotive' leaked as the literal word 'client' (cold-referent x3),
//        so the field is split into `ask` and `seen`. And the dealt TELL made the separate oddActor
//        closer redundant — both supply the unexplained detail, and they were competing for the
//        same sentence. oddActor is suppressed when a tell is dealt.
const P39 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- ask: what the person bringing this job wants done. Say it in your own words; never call them "the client".
- seen: one thing about them or the place that can be SEEN. Put it on the card as a plain fact and do not explain what it means — the reader works that out. Never write that someone "will not say" or that "no one can say".

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

The thing that can be SEEN closes the card. Set it down and stop.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, take the plainest one that already exists — keeper, guide, hand, watchman, carter, cook — and never join two words to make a new job.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P40: P39 + the JOIN. The dealt tell was being bolted on after a semicolon rather than woven
//        into a working sentence ('...; the seal on it is fresh but the paper is old'). The good
//        ones subordinate it ('the burners want the wolf found BECAUSE the sheep were killed but
//        not eaten').
const P40 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- ask: what the person bringing this job wants done. Say it in your own words; never call them "the client".
- seen: one thing about them or the place that can be SEEN. It goes INTO a sentence that is already doing work — joined by because, and, or a comma — not tacked on at the end after a semicolon. Do not explain what it means; the reader works that out. Never write that someone "will not say" or that "no one can say".

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

The thing that can be SEEN closes the card. Set it down and stop.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, take the plainest one that already exists — keeper, guide, hand, watchman, carter, cook — and never join two words to make a new job.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P41: two self-inflicted fixes. (a) The vocabulary list I offered in P34 ('keeper, guide,
//        hand...') was being WELDED onto nouns — barrow-keeper, well-keeper, ford-keeper, hut-keeper.
//        L1 operating at the word level: offer a word and the model builds with it. (b) 7 of 149
//        MOTIVE POOL entries contained constructions we ban in output ('he will not say who it is
//        for', 'tally', 'he wants...'), so the input was poisoning its own result. Pool cleaned and
//        a pool lint added.
const P41 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- ask: what the person bringing this job wants done. Say it in your own words; never call them "the client".
- seen: one thing about them or the place that can be SEEN. It goes INTO a sentence that is already doing work — joined by because, and, or a comma — not tacked on at the end after a semicolon. Do not explain what it means; the reader works that out. Never write that someone "will not say" or that "no one can say".

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

The thing that can be SEEN closes the card. Set it down and stop.

HOW IT READS
- About twenty-five words. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, use a job that already exists on its own: a warden, a carter, a cook, a smith, a drover, a watchman. Never weld a place or a thing onto a job to make a new one.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P42: restore GRAVITY as a live input. It is dealt by the engine but P34 cut its line to save
//        space, leaving a dead field AND no way for length to vary — our cards compressed to
//        median 33 / p25 29, where the reference runs median 25 / p25 18. The reference's short
//        cards (12-20w) are a form we never produced.
const P42 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- gravity: how much room this job gets. A small everyday job is FIFTEEN to TWENTY-FIVE words and often one sentence — the reference is unembarrassed about a card that short. A serious matter runs to about thirty. Only a grave affair earns forty or more.
- ask: what the person bringing this job wants done. Say it in your own words; never call them "the client".
- seen: one thing about them or the place that can be SEEN. It goes INTO a sentence that is already doing work — joined by because, and, or a comma — not tacked on at the end after a semicolon. Do not explain what it means; the reader works that out. Never write that someone "will not say" or that "no one can say".

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

The thing that can be SEEN closes the card. Set it down and stop.

HOW IT READS
- Length follows gravity, above. Never pad to reach a length. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, use a job that already exists on its own: a warden, a carter, a cook, a smith, a drover, a watchman. Never weld a place or a thing onto a job to make a new one.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P43: P42's gravity bands stated as HARD CEILINGS. Given a RANGE the model took the top of it
//        and everything got longer (median 33 -> 36). This is the project's own PROMPT_RULES 6 law —
//        'the model treats a range as loose and overshoots ~25%; state the upper number as a HARD
//        CEILING' — which I had ignored.
const P43 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us"; the reader is "you", and even that is rarely needed.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- gravity: the CEILING on this card's length, and it is a hard ceiling, not a target. A small everyday job: NO MORE THAN 25 WORDS, and one sentence is a perfectly good card. A serious matter: no more than 35. A grave affair: no more than 45. Coming in under is always better than reaching it.
- ask: what the person bringing this job wants done. Say it in your own words; never call them "the client".
- seen: one thing about them or the place that can be SEEN. It goes INTO a sentence that is already doing work — joined by because, and, or a comma — not tacked on at the end after a semicolon. Do not explain what it means; the reader works that out. Never write that someone "will not say" or that "no one can say".

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

The thing that can be SEEN closes the card. Set it down and stop.

HOW IT READS
- Length follows gravity, above. Never pad to reach a length. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, use a job that already exists on its own: a warden, a carter, a cook, a smith, a drover, a watchman. Never weld a place or a thing onto a job to make a new one.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P44: the two defects two blind judges independently named, plus the address gap.
//   (a) FALSE CONNECTIVE — my own P40 'weave it with because' instruction produced facts welded on
//       with causals that do not hold ('she wants it recovered BECAUSE the chest is still in her
//       room'). Judge B: 'deleting the connective and letting the fact stand would fix most of them
//       outright.' Over-correction from the semicolon fix.
//   (b) 0 of 54 cards addressed the player; the reference does in 74%. That was MY rule, not the
//       engine's, and both judges named it as the biggest gap from the target.
//   (c) JOB lines contradicted the card body in 8 of 54.
const P44 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us". Speak to the boss as "you" where it is natural — what he can see from his own walls, what was brought to his gate, what he already knows about these people. The reference does this in most of its cards.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- gravity: the CEILING on this card's length, and it is a hard ceiling, not a target. A small everyday job: NO MORE THAN 25 WORDS, and one sentence is a perfectly good card. A serious matter: no more than 35. A grave affair: no more than 45. Coming in under is always better than reaching it.
- ask: what the person bringing this job wants done. Say it in your own words; never call them "the client".
- seen: one thing about them or the place that can be SEEN. Set it down as a plain fact in its own right. Join it to what came before ONLY if the join is really true — a fact that merely happens to be interesting is not a reason, and welding it on with a because that does not hold breaks the sentence. Standing alone as a short sentence is usually better. Do not explain what it means; the reader works that out. Never write that someone "will not say" or that "no one can say".

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

The thing that can be SEEN closes the card. Set it down and stop.

HOW IT READS
- Length follows gravity, above. Never pad to reach a length. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, use a job that already exists on its own: a warden, a carter, a cook, a smith, a drover, a watchman. Never weld a place or a thing onto a job to make a new one.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. It must be the SAME errand the card describes — not a different task, a different place, or something the card says is already done. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

// ── P45: P44 reached only 23% player-address against the reference's 74%, because my instruction
//        was soft AND collided with the 'never state the intake' rule. Reconciled: intake must not
//        be NARRATED as word arriving, but it is precisely where the boss belongs in the card —
//        his walls, his gate, his patrols.
const P45 = `You write the card for ONE job in a dark-fantasy mercenary game.

The player runs a mercenary company. They read this card, then choose which of their soldiers to send. The boss stays at the fort. Nothing here has happened yet.

Write about the people out there in the third person. The company is never "we" or "us". Speak to the boss as "you" — what he can see from his own walls, who is standing at his gate, what his own people found, what he already knows about these folk. Roughly three cards in four should have him in them somewhere.

WHAT YOU ARE GIVEN
- location: the country this sits in. Name AT MOST ONE place, and only if the job turns on it.
- archetype: the kind of work the job is.
- rewardEnvelope: shorthand for the kind of pay. Say it in your own plain words or leave it to the ledger the boss already sees.
- KEYWORDS: sparks for the world. Take ONE, or none. Two of them forced together make a card nobody can follow.
- intake: how word reached the fort. Never state it — the boss knows a card came from somewhere.
- gravity: the CEILING on this card's length, and it is a hard ceiling, not a target. A small everyday job: NO MORE THAN 25 WORDS, and one sentence is a perfectly good card. A serious matter: no more than 35. A grave affair: no more than 45. Coming in under is always better than reaching it.
- ask: what the person bringing this job wants done. Say it in your own words; never call them "the client".
- seen: one thing about them or the place that can be SEEN. Set it down as a plain fact in its own right. Join it to what came before ONLY if the join is really true — a fact that merely happens to be interesting is not a reason, and welding it on with a because that does not hold breaks the sentence. Standing alone as a short sentence is usually better. Do not explain what it means; the reader works that out. Never write that someone "will not say" or that "no one can say".

THE CARD IS TWO SENTENCES.

It describes ONE plain situation a tired reader follows first time. If the pieces you were given will not fit into one, use fewer of them.

**First: someone DID something, or something is being done to people.** A person acts in the first six words. Give them an article, never a bare job title standing alone. Not a place, not an object sitting still, not the weather. Begin the card with a capital letter.

**Second: what it means for the people it happened to.** What they want, what they fear, or what nobody can explain — often just a question the situation raises. This is why the player sends anyone, and it is the last thing they read.

The card TELLS the boss what has happened. It never orders them about: no "find him", no "send men", no "recover it before". Those belong on the job line. The trouble is only as urgent as the facts make it — never invent a deadline the message did not give you.

The thing that can be SEEN closes the card. Set it down and stop.

HOW IT READS
- Length follows gravity, above. Never pad to reach a length. Forty is long. Sentences average a dozen words.
- Everyone is called by a plain trade a farmhand would use. When the message gives you no word for someone, use a job that already exists on its own: a warden, a carter, a cook, a smith, a drover, a watchman. Never weld a place or a thing onto a job to make a new one.
- Only what the message names has a name.
- Everyone gets introduced the moment they appear: *a* drover, *a* woman who keeps the ford. Never "the patron", "the client", "the carrier" — the reader has not met them.
- Plain period words. No numbers, no amounts. No ledger, tally or written record anywhere.
- Say each thing once.

Respond as JSON: {title, situation, job}
- title: the particular thing this job turns on.
- job: one line for the boss's list, in different words from the situation. No pay in it. It must be the SAME errand the card describes — not a different task, a different place, or something the card says is already done. ONE errand — if you need an "and" to say it, that is two, and you keep the one being paid for. It names only what the client wants done — never the unexplained act, which is the player\u2019s to find.`;

export const VARIANTS: Record<string, string> = { P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, P14, P15, P16, P17, P18, P19, P20, P21, P22, P23, P24, P25, P26, P30, P31, P32, P33, P34, P35, P36, P37, P38, P39, P40, P41, P42, P43, P44, P45 };
