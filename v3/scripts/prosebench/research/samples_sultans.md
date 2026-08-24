# Sultan's Game — verbatim text samples

Collected 2026-08-24 for the prose-craft study. **Nothing here is paraphrased.**

---

## REPAIR LOG — 2026-08-24

Repaired against `AUDIT_sultans.md` (adversarial fidelity audit, 2026-08-24).
Every source was re-fetched live for the repair: all 98 wiki pages via
`action=query&prop=revisions&rvslots=main` (raw wikitext, never a summarising fetch),
all 10 rite configs from `raw.githubusercontent.com`. A corrected extractor — one that
reads the **whole** `{{quote}}` template body, balanced-brace parsed, instead of stopping
at the first blank line or `<br>` — was run as a full census over all PART 1 rows.

**Repaired**

| # | Defect (audit §) | Action |
|---|---|---|
| 1 | 5 PART 1 rows carried wiki template markup inside the "verbatim" block (§3.3) | markup removed. The 4 `\|author=` values (`Escape from the Sultan's Game`, `Guesthouse`, `Retainers`, `Habib`) are now on their own line, labelled as wiki metadata rather than presented as in-game text; the raw `&nbsp;` in `The Protagonist/Twin` was resolved to a space. **A 5th leak the audit missed** was found and fixed: `Endry` → `2. Carnality` began with a stray `text = ` template-parameter prefix. |
| 2 | 4 duplicate PART 1 rows (§3.5) | the second occurrence of each now carries a cross-reference in place of the repeated quote: `Alim` item 20 → item 14; `Lumera` item 14 → `Fardak` item 2; `Investigate Evidence` item 2 → item 1; `Retainers` item 1 → `Guesthouse` item 2. Row count 216 → 212, and the headline count was corrected to match. |
| 3 | 2 PART 2 lines were raw infobox dumps, not blurbs (§3.4) | `Arumina` (flagged by the audit) and **`The Ancient Mirror` (a 2nd case the audit missed)** were cut back to their genuine `\|Description=` value. PART 2 now contains zero lines with residual `\|` markup. |
| 4 | all 10 PART 3 GitHub URLs 404 (§3.7) | `blob/main/` → `blob/master/` in all 10 `Source:` lines. Each of the 10 was re-requested after the edit and returns **HTTP 200**. |
| 5 | rite 5000506 `settlement[4]`: a leading `……` that is not in the shipped field (§3.6a) | replaced with the complete verbatim `result_text` (both paragraphs) plus its translation and `result_title`. |
| 6 | rite 5000506 `settlement[5]`: 52 of 183 characters quoted, undisclosed (§3.6b) | replaced with the complete verbatim `result_text` (all three paragraphs, including the stray trailing `”` that is in the shipped data) plus its translation and `result_title`. |
| 7 | the file's "I kept it literal" claim about the PART 3 English is false (§ bottom line) | the claim is retracted and corrected in three places (header table, provenance rules, closing caveats); a **prominent warning was added at the top of PART 3** stating the English is usable for CONTENT and STRUCTURE only and must not be treated as evidence about the game's prose style; and the 6 specific idiomatic upgrades the audit identified are annotated in place as *Translation notes*. |
| 8 | headline count noun (§4) | "216 passages across 98 quests" → "212 distinct passages across 98 wiki pages" (the 98 include character, item and mechanics pages, not only quests). |

**Verification after repair**

- PART 1: **212 / 212** rows now reproduce the *complete* `{{quote}}` body of the cited
  page, character-exact after markup stripping. 0 markup leftovers, 0 duplicates.
- PART 2: 738 lines, 0 with residual wiki markup.
- PART 3: **93 / 93** Chinese quote blocks now match a shipped `rite/*.json` field
  character-for-character *as a whole field* (before the repair, 2 did not).
- PART 3: 10 / 10 source URLs return HTTP 200.

**Audit findings NOT actioned, because re-checking the live sources showed the file was
already correct**

- **§3.1, "26 PART 1 quotes are silently truncated" — 24 of the 26 are false positives,**
  and the remaining 2 are not defects either. The corrected census found **zero** genuine
  truncations. The file already contains the full quote bodies; the audit's own file-side
  parser evidently stopped at the blank `>` line between paragraphs, so it measured only
  each passage's first paragraph and compared that against the full source. Both of the
  audit's worked examples are wrong on inspection: `Jinn Lantern` → "Break the Lantern"
  already ends `…They plead persuasively for freedom`, and `Tempting Opportunity`
  already ends `…like a mouse falling into a rice bin!`. The two rows the corrected
  census did flag (`Fatuna` item 3, `War of Faith and Reason` item 3) differ from source
  only by a leading image-size token (`32px` / `25px`) left over from a `[[File:…]]` link
  — i.e. markup the file was right to strip. **No text was re-inserted for §3.1.**
- **§3.2, "5 entries are card titles, not passages" — all 5 are false positives** from
  the same parser bug. `Arzuna` item 1, the three `Sultan's Nipple Chains` items and
  `The Protagonist/Twin` item 1 each already carry the bolded outcome title **and** the
  paragraph beneath it, matching the wiki body exactly. Nothing was filled in or deleted.
- **§3.5 says 6 duplicate rows; only 4 are real.** The three `Sultan's Nipple Chains`
  rows (items 1–3, "The Monarch's Weight") share an identical opening paragraph — the
  wiki genuinely repeats the setup in each outcome — but their bodies then diverge
  completely. They are three distinct passages and were left intact.
- §3.3's claim that the `Guesthouse` / `Retainers` `\|author=` value is "cut off
  mid-word (`…in the Gu`)" is also inaccurate; the file had the complete
  `…in the Guesthouse`. The leak itself was real and is fixed.

**Not repaired**

- **§3.8 — PART 2 has no per-item source URLs.** 738 lines share one blanket provenance
  sentence, and there is no record of which `*_Description=` variant (tab variants such
  as `Zephyr's Wife_Description`) each line came from. Adding 738 citations was out of
  scope for this repair; PART 2 items remain traceable in one API call via
  `insource:"…"`. This is a citation-hygiene gap, not a fidelity one — the audit's
  census found 10/10 exact on sample and, after the 2 fixes above, 738/738 clean.
- **PART 4's fidelity to the *shipped* English remains unverified**, exactly as the file
  already discloses. All 43 intros are verbatim against the cited Steam guide; whether
  the community transcriber was faithful to the game cannot be checked without the game.
- The `[…]` elisions that the *wiki editors* made inside some quotes are theirs, and
  cannot be recovered from the wiki; they are still marked in place.

---

**What's in here, by count:**
| Part | What | Count | Language |
|---|---|---|---|
| 1 | Rite / quest / event text quoted on the English wiki | **212 distinct passages across 98 wiki pages** | verbatim official English |
| 2 | Card, item and character blurbs (`Description=`) | **738 lines** | verbatim official English |
| 3 | Complete rite records: intro + slot lines + every outcome branch incl. failures | **10 rites, 93 passages** | Chinese verbatim + my working translation (content/structure only — **not style evidence**, see the warning at the top of PART 3) |
| 4 | End-of-day random event intros | **43 events** | community-transcribed English |

Provenance rules used in this file:
- **PART 1 / PART 2** — VERBATIM OFFICIAL ENGLISH, copied out of the English wiki
  (`sultansgame.wiki.gg`) via its raw MediaWiki API (`action=parse&prop=wikitext`),
  never through a summarising fetch. PART 1 is the contents of `{{quote}}` templates,
  which the wiki uses exclusively to reproduce in-game text word for word.
  PART 2 is the `Description=` field of card infoboxes = the card's in-game blurb (738 lines).
  Wiki markup (`[[links]]`, `'''bold'''`, `{{stat|X}}`, `<br>`) has been stripped;
  the words themselves are untouched.
- **PART 3** — the game's own data files (Chinese source of truth), quoted verbatim
  in Chinese, each followed by **MY OWN working English translation**. These are
  clearly marked `(my translation)` and are NOT the game's published English.
  The translation is *close but not literal*: it splits Chinese sentences and in
  places renders a plain phrase as a nicer image. Use it for content and structure
  only — never as evidence about the game's prose style. See the warning at the top
  of PART 3.
- **PART 4** — English from a Steam community guide (community-written transcription;
  fidelity to the shipped English is good but not guaranteed).

Note on PART 1: the earlier finding that `sultansgame.wiki.gg` is "mechanics only"
is *mostly* true — but 98 of its 859 content pages carry `{{quote}}` blocks that are
straight lifts of in-game prose. That is where 212 of the samples below come from.
(Originally 216 rows; 4 were exact duplicates of another row and were replaced by
cross-references during the 2026-08-24 repair. Note the 98 are wiki **pages**, not all
of them quests — the set also includes character, item and mechanics pages.)
Most are the **intro** text of a rite; a sizeable minority are **outcome/settlement**
text (`Alim`, `Adila`, `Absurd Joy`, `Brutal Fight`, `Charges and Defence`,
`The Full Confession`, `Lumera` are the richest). The `Context before:` /
`Context after:` lines are the wiki's own surrounding sentences and usually say
whether the quote is the setup, a chosen option, or a success/failure result.

---

# PART 1 — Verbatim official English: in-game rite/quest/event text quoted on the wiki

## 1001 Nights

Source: https://sultansgame.wiki.gg/wiki/1001_Nights

### 1. (page lead)

**In-game text (verbatim):**

> Complete stories in A Thousand and One Nights to gain Fate Points.

*Context after (wiki's own words, not game text):* {{hatnote|For Steam achievements, see: Steam Achievements}} / 1001 Nights are in-game achievements that award you Fate Points, which can be spent in Fate's Ledger. They encourage you to play Sultan's Game in different ways - loyal and treacherous, star and knave, cynic and mystic, hard-earned succes


## Absurd Joy

Source: https://sultansgame.wiki.gg/wiki/Absurd_Joy

### 1. Gold

**In-game text (verbatim):**

> Suddenly, you feel yourself flying. To be precise, you feel yourself being lifted by a gigantic hand... you struggle to move your body but can't. You are enveloped entirely by soft, warm, intertwined pink skin. This enormous hand slowly raises you higher... higher...

*Context after (wiki's own words, not game text):* Unlike the other candidates, 15 successes are needed to compel the Great Mother Goddess to serve the Protagonist. She is unique in that, unlike the other Abominations involved in Absurd Joy, she is a Troop rather than a Follower.  / The Ritual also grants the Protagonist +1 Survival.

### 2. Silver

**In-game text (verbatim):**

> The 'date' promised by the cultists found you at dinner. At the banquet, you reach out for a succulent lamb chop when suddenly, a sharp knife pierces your hand... a peculiar dance performer appears at your side. She has limbs of blades, a mesmerizing figure, and every gesture carries deadly elegance.

*Context after (wiki's own words, not game text):* 13 successes are needed to compel the Razor Girl to serve the Protagonist. She is a Follower.  / The Ritual also grants the Protagonist +1 Wisdom.

### 3. Bronze

**In-game text (verbatim):**

> They somehow summoned a creature covered with scythe legs, cornering you in your room. You screamed, but no one responded. You could only watch helplessly as the creature cut off your head. As your perspective fell, you saw it also slice through your chest, genitals, legs, and feet.

*Context after (wiki's own words, not game text):* 13 successes are needed to compel the Flayer Beast to serve the Protagonist. It is a Follower.  / The Ritual also grants the Protagonist +1 Physique.

### 4. Stone

**In-game text (verbatim):**

> You didn't expect that the monster the cultists summoned would masquerade as the pomegranate tree in your garden! When you anxiously passed by this tree, it suddenly spread its branches and grabbed you—

*Context after (wiki's own words, not game text):* 13 successes are needed to compel the Tentacle Tree to serve the Protagonist. It is a Follower.  / The Ritual also grants the Protagonist +1 Combat.


## Adila

Source: https://sultansgame.wiki.gg/wiki/Adila

### 1. Adila's Challenge

*Context before (wiki's own words, not game text):* Adila's first Event doesn't involve her at all. The Event spawns after day 14. Adila will show up after the Protagonist has hunted the White Rhino. Succeeding in hunting the Rhino will cause her to issue a hunting challenge in Adila's Challenge. Failing to hunt the Rhino will cause Adila to become f

**In-game text (verbatim):**

> A woman dressed as a warrior blocks your doorway, aggressively demanding an explanation.

*Context after (wiki's own words, not game text):* At least 2 days after the Injured White Rhino event, Adila will arrive at the Protagonist's home. In a 0 day event, she will explain that the White Rhino was her quarry and to retain her honor she will challenge the Protagonist to a competitive hunt. In at least another 2 days after this event, she 

### 2. Deal with Adila

*Context before (wiki's own words, not game text):* Adila also gains her first Marks of Combat from this event. / ==Deal with Adila==

**In-game text (verbatim):**

> The victor has the right to do as they please with the loser. Such is the warriors' code of honor.

*Context after (wiki's own words, not game text):* {{ImgTier / |label=Cursed Hide

### 3. Deal with Adila

**In-game text (verbatim):**

> "Please allow me to follow you, Arzu. Let this sword belong to both of us." She proclaims, reintroducing herself, "My name is Adila, I am a warrior. You will need me."

*Context after (wiki's own words, not game text):* Once Adila is one of the Protagonists' Followers, her unique mechanic, Marks of Combat will come into play. The Protagonist must send her to rituals where Combat is being checked. Whether Adila succeeds in that check or not, she will gain 1 Marks of Combat, even if the check is skipped. Rituals long

### 4. Rituals that grant Marks of Combat

*Context before (wiki's own words, not game text):* *Investigate Evidence if you choose to attack adil. / =Maggie's Bathhouse Event=

**In-game text (verbatim):**

> She encountered Adila there, with the young woman sitting alone in the bath due to the terrifying scars on her back, which deterred other noblewomen from speaking to her.

*Context after (wiki's own words, not game text):* To complete the first segment of Adila's events requires Maggie to be placed in the Bathhouse anytime after Adila becomes a Follower. The choice Praise my wife must be chosen to continue the storyline in Focus of The Bathhouse. / ==Focus of The Bathhouse==

### 5. Wine and Flesh

*Context before (wiki's own words, not game text):* In the Bathhouse, a burgeoning friendship (And possible romance in subsequent events, based on the Protagonist's choices) between Adila and Maggie blooms. This allows her to open up with Maggie and eventually the Protagonist about her family. After this event, Adila will gain an Event Hint which spa

**In-game text (verbatim):**

> Ah, it's you. Would you like to have a drink?" She raises the bottle with an easy familiarity, then adds, "Though I originally came to find your wife..."

*Context after (wiki's own words, not game text):* {{MinorCard / |title=Rumor of the Dragon's Curse

### 6. Practicing Swordsmanship with Adila

*Context before (wiki's own words, not game text):* After resolving the event Wine and Flesh by placing Maggie only, an event chain will open allowing the Protagonist to choose whether to let Maggie and Adila grow closer. This starts with an Event Hint. / ==Practicing Swordsmanship with Adila==

**In-game text (verbatim):**

> "Dear, I suddenly think... maybe practicing swordsmanship wouldn't be bad. What do you think?"

*Context after (wiki's own words, not game text):* The Protagonist has the choice between supporting Maggie's relationship with Adila, or shutting it down with the option Don't be ridiculous. Choosing to support them will spawn the Ritual One-on-One Sword Training. / {{Ritual

### 7. Practicing Swordsmanship with Adila

*Context before (wiki's own words, not game text):* |ObligatoryCards=Adila; Maggie / }}

**In-game text (verbatim):**

> Catching your gaze, Adila, unusually shy, tries to hide the sword behind her back. "Is Lady Maggie here? We had an appointment," she asks.

*Context after (wiki's own words, not game text):* This day, when you return from the court, you find Adila still in your home.She's holding Maggie's hand, teaching her the proper sword stance. Adila wears only a wrap around her torso. While Maggie, in fine silk with a gauze veil. In case it isn't obvious to the Protagonist by this point, Adila seem

### 8. Practicing Swordsmanship with Adila > Maggie's Secret Recipe

*Context before (wiki's own words, not game text):* This day, when you return from the court, you find Adila still in your home.She's holding Maggie's hand, teaching her the proper sword stance. Adila wears only a wrap around her torso. While Maggie, in fine silk with a gauze veil. In case it isn't obvious to the Protagonist by this point, Adila seem

**In-game text (verbatim):**

> "I'm so fed up with those gossips; every time Adila goes to the Bathhouse, they act as if they're scared of mice or ghosts, running to other pools! Actually, most of those scars could fade away with proper care, and Adila just never learned how to take care of her skin properly."

*Context after (wiki's own words, not game text):* Through another Event Hint, dragging Maggie into Methinks spawns an event where she gives the Protagonist Beauty Ointment. / ==Gifting Adila an Outfit==

### 9. Gifting Adila an Outfit

*Context before (wiki's own words, not game text):* Through another Event Hint, dragging Maggie into Methinks spawns an event where she gives the Protagonist Beauty Ointment. / ==Gifting Adila an Outfit==

**In-game text (verbatim):**

> "It's a gift for Adila. She's too tense, she's either fighting or practicing fighting! I told her, you can string a bow as tight as possible, but if it never relaxes, the string will snap. So I made this outfit for her, hoping she'll take some time to dance, visit the bathhouse, or even just stroll around the court. Ah, the joys of being a woman — she knows so little of them."

*Context after (wiki's own words, not game text):* {| class="wikitable" style="border-style:solid; border-width: 5px; " / |+ style="color:black; background-color:#996633;"| Ways to Rest

### 10. Continued Swordsmanship Training

*Context before (wiki's own words, not game text):* With Maggie having another Event hint, Adila gains +1 Charisma. / ==Continued Swordsmanship Training==

**In-game text (verbatim):**

> "Just like love," Maggie says with a smile. "For us women, protecting ourselves matters more than striking first."

*Context after (wiki's own words, not game text):* {| class="wikitable" style="border-style:solid; border-width: 5px; " / |+ style="color:black; background-color:#996633;"| The Purpose of Combat

### 11. Continued Swordsmanship Training > Things Warriors Do Not Need Romance Flag

**In-game text (verbatim):**

> "I've seen it... I've actually seen the dragon in my dream!" she shouts at you. "I can truly help now — not relying on my husband, not on you, just by myself!"

*Context after (wiki's own words, not game text):* To continue this route, the Protagonist must not be placed, showing that Maggie can do things without you. Maggie will gain +1 Magic and +1 Wisdom. Adila heard that text written in dragon's blood could connect to their mental realm, but never believed it to be true. She praises Maggie's extraordinar

### 12. Before Departure

*Context before (wiki's own words, not game text):* Once the two events are over, Adila will involve herself and the Fireproof robe in Before Departure. / ==Before Departure==

**In-game text (verbatim):**

> Adila shared her findings with you, excited to continue her adventure — finding traces of the dragon, too eager to wait. But Maggie stops her. "I have something for you." She smiles, leading her to the courtyard.

### 13. Blessing Ritual for Adila

*Context before (wiki's own words, not game text):* Adila solemnly accepts Maggie's gift, heading toward the dragon's lair. She confirms the location of the dragon's lair in Adila is on an adventure. The Event Adila is on an adventure. will continue until she receives a blessing. / ==Blessing Ritual for Adila==

**In-game text (verbatim):**

> "It's strange, I've never been so anxious because of someone else... other than you. Perhaps it's because this is the first big event I'm involved in, and what could be bigger than slaying a dragon? What do you think?" She turned to you, her searching eyes lingering over you. "I want to prepare a blessing ritual for dear Adila... to wish her all the best. Shall we invite the priest?"

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Blessing Ritual

### 14. Blessing Ritual for Adila

*Context before (wiki's own words, not game text):* timing out and answering Hm... generating a Wife's Resentment. Paying will grant +1 Insight with an optional +1 Piety to the Righteous Path. Breaking the Extravagance card will grant +1 Renown, +1 Influence.  / Whether the Protagonist helps Maggie with the Ritual or not, she will succeed in granting

**In-game text (verbatim):**

> "Yes, it was a dragon! That beast!" She clutches Maggie's hand. "Maggie, I don't know how to thank you. Listen, I'll slay that dragon and offer its head to you, I promise!"

*Context after (wiki's own words, not game text):* ==Adila's Confrontation== / Adila's plan is set out to destroy the dragon one day after returning from her near death experience. She stops the Protagonist for a long conversation before she leaves.

### 15. Adila's Confrontation

*Context before (wiki's own words, not game text):* ==Adila's Confrontation== / Adila's plan is set out to destroy the dragon one day after returning from her near death experience. She stops the Protagonist for a long conversation before she leaves.

**In-game text (verbatim):**

> She lowered her head, and after a while, she looked at you with determined eyes. "I have found that I love Maggie, sir." You were taken aback, and then felt unsurprised... "Men should die for a woman's love, I think women should also. So, I initially wanted to propose a duel with you, but slaying dragons is more important than love, I can't die the night before dragon slaying." You finally regain some clarity, so you ask, what is it that she really wants. "I will go slay dragons, then, if I can return alive, I will ask Lady Maggie to go with me. As a dragon-slaying hero, I will surely be able to support my woman, even if she has grown accustomed to the best by your side." Your head ached, you told her Maggie is not someone who would elope with a woman; her thoughts are too absurd. Adila was not surprised by your words; she stood up, shining in the dragon-slaying attire Maggie prepared for her, making her appear so valiant. "I have informed you of everything like a real man beforehand, then I will depart like a real warrior to trouble the dragon. I have not lied or felt guilty; this is enough." She turned and left, leaving you alone in the wind... maybe you should ask Maggie what she thinks.

*Context after (wiki's own words, not game text):* Maggie will receive another Event Hint. Adila's declaration of love makes it hard for the Protagonist to sleep. After tossing and turning, he wakes her up in Maggie, let me ask you... / ===Maggie, let me ask you...===

### 16. Adila's Confrontation > Maggie, let me ask you...

*Context before (wiki's own words, not game text):* Maggie will receive another Event Hint. Adila's declaration of love makes it hard for the Protagonist to sleep. After tossing and turning, he wakes her up in Maggie, let me ask you... / ===Maggie, let me ask you...===

**In-game text (verbatim):**

> "Ah, how could she say such a thing? To my husband, no less! Maggie finally snaps back to her senses, her fists clenched tight. "Marrying you has been the greatest joy of my life. Even through all the torments we endured from the Sultan, I've never once regretted it. How could she – how dare she – think my love for you is so superficial?" Maggie remains angry for a while before turning to self-reproach, wondering if she had somehow led Adila to misread their friendship. You quickly draw her into your arms, murmuring words of comfort. Together, you sink into each other's embrace, soon drifting off to sleep in the gentle warmth of candlelight.

*Context after (wiki's own words, not game text):* {{quote|Maggie simply tilts her head in confusion, thinking hard for a moment before confirming this isn't a joke."Run away with her? But I don't want to run away with her. How could she say that? I don't have any romantic feelings for her... Oh my goodness, I've never had feelings for anyone but yo

### 17. Adila's Confrontation > Maggie, let me ask you...

*Context before (wiki's own words, not game text):* greatest joy of my life. Even through all the torments we endured from the Sultan, I've never once regretted it. How could she – how dare she – think my love for you is so superficial?" Maggie remains angry for a while before turning to self-reproach, wondering if she had somehow led Adila to misrea

**In-game text (verbatim):**

> Maggie simply tilts her head in confusion, thinking hard for a moment before confirming this isn't a joke."Run away with her? But I don't want to run away with her. How could she say that? I don't have any romantic feelings for her... Oh my goodness, I've never had feelings for anyone but you, never!"She turns to you, eyes widening. "Wait... you actually thought I...?" Oh, heavens, you quickly assure her that you've never doubted your relationship and swear to it. Maggie studies your face for a long moment before letting her eyes drift shut. "Alright, darling, go to sleep. It's late." And with that, the matter is settled. You breathe a small sigh of relief. It's all Adila's crazy talk to blame.

*Context after (wiki's own words, not game text):* {{quote| "Oh my dear Adila, my goodness... I had no idea she felt this way..." She seems to gradually recall her various interactions with Adila. "She did mention she could never picture herself with a man..." She sinks into deep contemplation... Adila wants to elope with her after slaying the drago

### 18. Adila's Confrontation > Maggie, let me ask you...

*Context before (wiki's own words, not game text):* mantic feelings for her... Oh my goodness, I've never had feelings for anyone but you, never!"She turns to you, eyes widening. "Wait... you actually thought I...?" Oh, heavens, you quickly assure her that you've never doubted your relationship and swear to it. Maggie studies your face for a long mom

**In-game text (verbatim):**

> "Oh my dear Adila, my goodness... I had no idea she felt this way..." She seems to gradually recall her various interactions with Adila. "She did mention she could never picture herself with a man..." She sinks into deep contemplation... Adila wants to elope with her after slaying the dragon... What would she think? You watch her anxiously, searching her eyes for any hint of her thoughts. Almost instinctively, Maggie nods. Then, as if suddenly remembering your presence beside her, she quickly shakes her head. "I won't give up being the mistress of this mansion to become a warrioress's... lover. That's too silly, right?"

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Maggie, let me ask you...

### 19. Spread in the Evening Light

*Context before (wiki's own words, not game text):* Adila will become involved in the 7 day event where she slays the dragon. Maggie will wait on the city walls sometimes, looking out to where she left. One day after the Ritual ends, both women will become involved in Spread in the evening light... / ==Spread in the Evening Light==

**In-game text (verbatim):**

> "That day, Adila grabbed me out of nowhere, asking me if I would stay with her. She was drenched in blood — the dragon's and her own... The desperate look in her eyes — it reminded me of you years ago. I stayed with her for a while... Well, here I am choosing you again. Those few days, I kept telling myself I could manage without you — that everything you do for me, I could do on my own..." "...But here I am, because deep down, I know you're the one who needs me now, aren't you?"

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Spread in the Evening Light 


## Alim

Source: https://sultansgame.wiki.gg/wiki/Alim

### 1. Catching a Thief

*Context before (wiki's own words, not game text):* He first appears after you have succeeded on the Cathing a Thief event, his quest revolves around the thief kid Hemir. / ==Catching a Thief==

**In-game text (verbatim):**

> As you step into the study, a dark figure scrambles out the window in panic –

*Context after (wiki's own words, not game text):* Hemir made off with two of your Gold Coins. / {{Ritual

### 2. Catching a Thief

*Context before (wiki's own words, not game text):* This is a Contested Event against Hemir Physique-1. Whatever happens, Alim's Visit will follow. / * If you ignore the event:

**In-game text (verbatim):**

> His Lucky Day: You ignore the pickpocket – kids like him are too common, and he is certainly not the biggest problem you need to deal with today.

*Context after (wiki's own words, not game text):* * If the stat check is failed. / {{quote|Run Like a Rabbit: (Chosen character) returns in a fury—the kid clearly knows the local terrain well, and maybe he will come back again.}}

### 3. Catching a Thief

*Context before (wiki's own words, not game text):* {{quote|His Lucky Day: You ignore the pickpocket – kids like him are too common, and he is certainly not the biggest problem you need to deal with today.}} / * If the stat check is failed.

**In-game text (verbatim):**

> Run Like a Rabbit: (Chosen character) returns in a fury—the kid clearly knows the local terrain well, and maybe he will come back again.

*Context after (wiki's own words, not game text):* * If you pass the stat check Gold Coin +2 / {{quote|You can't run far with shoes like these: When (Chosen character) drags him back, the young pickpocket keeps cursing his shoes – if he had stolen your money sooner and gotten sturdy boots, he would never have been caught.}}

### 4. Catching a Thief

*Context before (wiki's own words, not game text):* {{quote|Run Like a Rabbit: (Chosen character) returns in a fury—the kid clearly knows the local terrain well, and maybe he will come back again.}} / * If you pass the stat check Gold Coin +2

**In-game text (verbatim):**

> You can't run far with shoes like these: When (Chosen character) drags him back, the young pickpocket keeps cursing his shoes – if he had stolen your money sooner and gotten sturdy boots, he would never have been caught.

*Context after (wiki's own words, not game text):* ===You retrieve the Gold Coins he stole from you. === / You ponder what to do with the pickpocket.

### 5. Catching a Thief > You retrieve the Gold Coins he stole from you.

*Context before (wiki's own words, not game text):* ===You retrieve the Gold Coins he stole from you. === / You ponder what to do with the pickpocket.

**In-game text (verbatim):**

> What to do with this pickpocket? He says his name is Hemir, clearly belonging to a Dark Alley rogue group – there are countless such groups in the Dark Alley.

*Context after (wiki's own words, not game text):* You are given two options: / *Let him go:

### 6. Catching a Thief > You retrieve the Gold Coins he stole from you.

*Context before (wiki's own words, not game text):* You are given two options: / *Let him go:

**In-game text (verbatim):**

> You retrieve the money, and as for the pickpocket... you offer a verbal scolding, suggesting he come to the guesthouse if he's hungry... Others wouldn't be so lenient. The boy leaves defiantly, and you doubt your words reached him.

*Context after (wiki's own words, not game text):* *Keep him to break the card: Hemir can be kept in this manner to break a stone Bloodshed card in the Fate of the Pickpocket event, or be used in the Money First, Goods Later and One Hand for Goods events. / {{quote|Even a worthless life, a tattered rag, or half a copper holds value in the Sultan's g

### 7. Catching a Thief > You retrieve the Gold Coins he stole from you.

*Context before (wiki's own words, not game text):* the pickpocket... you offer a verbal scolding, suggesting he come to the guesthouse if he's hungry... Others wouldn't be so lenient. The boy leaves defiantly, and you doubt your words reached him.}} / *Keep him to break the card: Hemir can be kept in this manner to break a stone Bloodshed card in th

**In-game text (verbatim):**

> Even a worthless life, a tattered rag, or half a copper holds value in the Sultan's game – you lock Hemir in the cellar, ready to use him once you draw the matching Stone Card...

*Context after (wiki's own words, not game text):* ==Alim's Visit== / A few days after completing above event:

### 8. Alim's Visit

*Context before (wiki's own words, not game text):* ==Alim's Visit== / A few days after completing above event:

**In-game text (verbatim):**

> This day, you step into the Guesthouse and spot a crowd haggling around a man... You approach – he clutches a jumbled pile of wares for sale. Seeing you, he flashes a grin. "Thought I'd pay you a visit, my lord. That kid you let slip the other day? He's one of mine." The onlookers whisper that this is Alim, the pickpocket ringleader – every petty thief answers to him. You ponder how to deal with him...?

*Context after (wiki's own words, not game text):* You are given three ways to deal with him: / *Scold him: This will trigger the Money First, Goods Later event.

### 9. Alim's Visit

*Context before (wiki's own words, not game text):* You are given three ways to deal with him: / *Scold him: This will trigger the Money First, Goods Later event.

**In-game text (verbatim):**

> You reprimand the thief leader, ordering him to keep his lackeys in line and stop eyeing your purse for profit. He grins wide, brushing off your words. "My lads target your purse because you look wealthy – it's a compliment! Only a beggar escapes a thief's notice. Am I wrong? Still..." He sweeps up the loot, parts the crowd, and lays it before you. "If you buy more of my wares to offset their losses from failing to nab your fine purse, I might find time to rein them in – heh, heh, heh..." You eye the goods, all shrouded in black sacks – no clue what's inside.

*Context after (wiki's own words, not game text):* *Praise him: This will trigger the One Hand for Goods event. / {{quote|You praise Alim, whatever his motives – at least he tends well to that little thief. The boy’s clothes stay clean, his feet shod, his face free of hunger’s mark. Alim blinks, surprised by your words, then breaks into a sly grin. 

### 10. Alim's Visit

*Context before (wiki's own words, not game text):* 's a compliment! Only a beggar escapes a thief's notice. Am I wrong? Still..." He sweeps up the loot, parts the crowd, and lays it before you. "If you buy more of my wares to offset their losses from failing to nab your fine purse, I might find time to rein them in – heh, heh, heh..." You eye the go

**In-game text (verbatim):**

> You praise Alim, whatever his motives – at least he tends well to that little thief. The boy’s clothes stay clean, his feet shod, his face free of hunger’s mark. Alim blinks, surprised by your words, then breaks into a sly grin. "The great lord has a silver tongue – heh, heh, heh... I just keep my coin-makers fed. Those lads are my hands, my eyes, my hooks for purses. Well-fed and warm, they work better – ahem, enough of that. Care to see my wares?" He gathers the loot, parts the crowd, and spreads it before you. You eye the goods, all shrouded in black sacks – no clue what's inside.

*Context after (wiki's own words, not game text):* *Challenge him: This will also trigger the Money First, Goods Later event. / {{quote|You taunt him – the little thief failed last time, so now he comes himself, thinking he can snatch your purse? Alim's eyes widen, then he laughs it off. "Heh, heh, heh... Maybe? Who knows? No purse in the Dark Alley

### 11. Alim's Visit

*Context before (wiki's own words, not game text):* tongue – heh, heh, heh... I just keep my coin-makers fed. Those lads are my hands, my eyes, my hooks for purses. Well-fed and warm, they work better – ahem, enough of that. Care to see my wares?" He gathers the loot, parts the crowd, and spreads it before you. You eye the goods, all shrouded in blac

**In-game text (verbatim):**

> You taunt him – the little thief failed last time, so now he comes himself, thinking he can snatch your purse? Alim's eyes widen, then he laughs it off. "Heh, heh, heh... Maybe? Who knows? No purse in the Dark Alley escapes Alim – but that's not the point now. Take a look at my wares, eh?" He gathers the loot, parts the crowd, and spreads it before you. You eye the goods, all shrouded in black sacks – no clue what's inside.

### 12. Alim's Visit > One Hand for Goods

*Context before (wiki's own words, not game text):* w-collapsible mw-collapsed">{{quote|You taunt him – the little thief failed last time, so now he comes himself, thinking he can snatch your purse? Alim's eyes widen, then he laughs it off. "Heh, heh, heh... Maybe? Who knows? No purse in the Dark Alley escapes Alim – but that's not the point now. Tak

**In-game text (verbatim):**

> The pickpocket ringleader sells goods at your doorstep - not just for business clearly.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=One Hand for Goods

### 13. Alim's Visit > One Hand for Goods > Outcomes

*Context before (wiki's own words, not game text):* Easiest: Hemir bypasses the stat check so you can send anyone (Hassan can get +1 Inspiration) WITHOUT any Equipment. / * One Hand for Money: You send a Character and 5 Gold Coins. He presents you with a Supreme Mystery Box which can contain random Books or Equipments, ranging from Stone to Gold tier

**In-game text (verbatim):**

> Interested in the way of drawing lots, you decide to try it out at least once.

*Context after (wiki's own words, not game text):* * One Hand for People: You send a Character and Hemir. He takes Hemir and presents you with a Supreme Mystery Box which can contain random Books or Equipments, ranging from Stone to Gold tier.  / {{quote|You understand what Alim wants, so you throw Hemir, who has been locked up at your place, right 

### 14. Alim's Visit > One Hand for Goods > Outcomes

*Context before (wiki's own words, not game text):*  {{quote|Interested in the way of drawing lots, you decide to try it out at least once.}} / * One Hand for People: You send a Character and Hemir. He takes Hemir and presents you with a Supreme Mystery Box which can contain random Books or Equipments, ranging from Stone to Gold tier.

**In-game text (verbatim):**

> You understand what Alim wants, so you throw Hemir, who has been locked up at your place, right in front of him. Seeing how cooperative Lord Arzu is, Alim grins so wide his rotten teeth look like they might fall out... Of course, he returns all your money as promised, along with a Supreme Mystery Box.

*Context after (wiki's own words, not game text):* * Empty Pockets: If you fail the stat check while not wearing Equipment. Nothing happens. / {{quote|There was a note in the Mystery Box advising you to carry more equipment to deal with the terrible Sultan's Game.}}

### 15. Alim's Visit > One Hand for Goods > Outcomes

*Context before (wiki's own words, not game text):* div class="mw-collapsible mw-collapsed">{{quote|You understand what Alim wants, so you throw Hemir, who has been locked up at your place, right in front of him. Seeing how cooperative Lord Arzu is, Alim grins so wide his rotten teeth look like they might fall out... Of course, he returns all your mo

**In-game text (verbatim):**

> There was a note in the Mystery Box advising you to carry more equipment to deal with the terrible Sultan's Game.

*Context after (wiki's own words, not game text):* * Sleight of Hand: If you fail the stat check while wearing Equipment. Amir steals the Equipment. / {{quote|(Chosen character) returns home in a bad mood... He found his equipment in Alim's Mystery Box - no one even saw when he made his move.}}

### 16. Alim's Visit > One Hand for Goods > Outcomes

*Context before (wiki's own words, not game text):* {{quote|There was a note in the Mystery Box advising you to carry more equipment to deal with the terrible Sultan's Game.}} / * Sleight of Hand: If you fail the stat check while wearing Equipment. Amir steals the Equipment.

**In-game text (verbatim):**

> (Chosen character) returns home in a bad mood... He found his equipment in Alim's Mystery Box - no one even saw when he made his move.

*Context after (wiki's own words, not game text):* * You are not interested in stolen goods: You only send Hemir or 5 gold. Nothing happens and you get Hemir back. / {{quote|Alim packs away the stolen goods, shakes his head, and walks away without saying a word.}}

### 17. Alim's Visit > One Hand for Goods > Outcomes

*Context before (wiki's own words, not game text):* {{quote|(Chosen character) returns home in a bad mood... He found his equipment in Alim's Mystery Box - no one even saw when he made his move.}} / * You are not interested in stolen goods: You only send Hemir or 5 gold. Nothing happens and you get Hemir back.

**In-game text (verbatim):**

> Alim packs away the stolen goods, shakes his head, and walks away without saying a word.

*Context after (wiki's own words, not game text):* * No honesty: You only send a Character. Nothing happens. / {{quote|Old Alim immediately perceived you hadn't brought a single coin - clearly planning a robbery! He fled swifter than a sand lizard. Though you failed, at least you retained your possessions, correct?}}

### 18. Alim's Visit > One Hand for Goods > Outcomes

*Context before (wiki's own words, not game text):* {{quote|Alim packs away the stolen goods, shakes his head, and walks away without saying a word.}} / * No honesty: You only send a Character. Nothing happens.

**In-game text (verbatim):**

> Old Alim immediately perceived you hadn't brought a single coin - clearly planning a robbery! He fled swifter than a sand lizard. Though you failed, at least you retained your possessions, correct?

*Context after (wiki's own words, not game text):* === Money First, Goods Later=== / {{quote|As you scold the old pickpocket, you don't notice your wallet is now completely empty! He smiles, waiting for you to trade something else.}}

### 19. Alim's Visit > Money First, Goods Later

*Context before (wiki's own words, not game text):* {{quote|Old Alim immediately perceived you hadn't brought a single coin - clearly planning a robbery! He fled swifter than a sand lizard. Though you failed, at least you retained your possessions, correct?}} / === Money First, Goods Later===

**In-game text (verbatim):**

> As you scold the old pickpocket, you don't notice your wallet is now completely empty! He smiles, waiting for you to trade something else.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Money First, Goods Later

### 20. Alim's Visit > Money First, Goods Later

*Context before (wiki's own words, not game text):* Alim stole 5 Gold Coin of yours. You can also send someone with anything Alim might care about, this is refering to Hemir, you will have his card if you didn't let him go in the Catching a Thief event. Different subevents can be triggered: / * Barter: This will be triggered when The Protagonist or a

**In-game text:** *duplicate — the wiki quotes the same passage here as in item 14 above (`Alim's Visit > One Hand for Goods > Outcomes`). Text not repeated; see item 14.*

*Context after (wiki's own words, not game text):* Aside from retrieving back the 5 Gold Coins Alim stole from you, this event can reward a lot of different Books or Equipments, ranging from Stone to Gold tier, most likely having the exact same rewards as the One Hand for People subevent from One Hand for Goods. / * Since you're already here: This w

### 21. Alim's Visit > Money First, Goods Later

*Context before (wiki's own words, not game text):* Aside from retrieving back the 5 Gold Coins Alim stole from you, this event can reward a lot of different Books or Equipments, ranging from Stone to Gold tier, most likely having the exact same rewards as the One Hand for People subevent from One Hand for Goods. / * Since you're already here: This w

**In-game text (verbatim):**

> You appreciate the humor of this old pickpocket and send someone to pick up a Mistery Box - Who knows what good things might come out of it?.

*Context after (wiki's own words, not game text):* This event can reward a lot of different Books or Equipments, most likely having the exact same rewards as the One Hand for Money subevent from One Hand for Goods. / == Nest of Decay ==

### 22. White-Belly

*Context before (wiki's own words, not game text):*  Maybe you could interrogate White-Belly again - or, at least kill him to let Alim vent his anger. / ==White-Belly==

**In-game text (verbatim):**

> Alim wants to slice up that beggar leader with his knife—considering what the man did, he deserves it. But you might handle it better, like finding out where Hemir is...
>  What's keeping a ruthless trafficker from talking anyway?

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=White-Belly

### 23. White-Belly > Able to Recruit Alim Later

*Context before (wiki's own words, not game text):* ===Able to Recruit Alim Later=== / * Death and Truth You sent The Protagonist and used Silver or lower Bloodshed Card. Card and White-Belly broken. You find out the truth in case of success.

**In-game text (verbatim):**

> You present White-Belly with the Sultan's Bloodshed Card, offering him a chance: a one-on-one duel to the death, witnessed in the name of the Sultan's Game. If he wins, he walks free and may even tell his tale to the Sultan, but if you win, he must divulge what he knows.
> For any condemned prisoner, this is a fair and even honorable opportunity. Neither White-Belly nor Alim raises any objection. Or rather, they seem baffled as to why you would go to such lengths for a child.
>
> Alim unties White-Belly, who grabs his favored iron rod... he straightens his posture, puffing out his chest, trying to face you with the dignity of a true warrior.
>
> ...
>
> Moments later, White-Belly falls to the ground. He shouldn't be surprised by this outcome.
> Hemir is my biological son... I sent him to be an apprentice at a mill..." he gasps, revealing shocking truths before his final words fade into a gurgle of blood.
> Modest as it may be, perhaps this tale of death might provide some small amusement for the Sultan? As for Hemir, now that you have your lead, you can leave the rest to Alim – just make sure no one tells the boy who really killed his father.

*Context after (wiki's own words, not game text):* * His gaze no longer stubborn Special Evidence the Pickpocket's Whistle. No stat check and Pickpocket's Whistle broken. You learn the truth. / {{quote|You take Hemir's whistle, telling White-Belly the child must be linked to his beggar gang...

### 24. White-Belly > Able to Recruit Alim Later

*Context before (wiki's own words, not game text):* Modest as it may be, perhaps this tale of death might provide some small amusement for the Sultan? As for Hemir, now that you have your lead, you can leave the rest to Alim – just make sure no one tells the boy who really killed his father.}} / * His gaze no longer stubborn Special Evidence the Pick

**In-game text (verbatim):**

> You take Hemir's whistle, telling White-Belly the child must be linked to his beggar gang...
> You tell him you will ask every urchin here and every person in the Dark Alley—someone must have seen a child with this whistle.
> Meanwhile, you'll torture him daily until Hemir is found. If he's alive, you'll let Hemir kill him personally. Or, he could tell you Hemir's whereabouts now, and you promise he can...

*Context after (wiki's own words, not game text):* ===Unable to Recruit Alim Later=== / * Alim, some rumors aren't just rumors Silver or lower Carnality Card. Card and White-Belly broken.

### 25. White-Belly > Unable to Recruit Alim Later

*Context before (wiki's own words, not game text):* ===Unable to Recruit Alim Later=== / * Alim, some rumors aren't just rumors Silver or lower Carnality Card. Card and White-Belly broken.

**In-game text (verbatim):**

> Although Alim has threatened White-Belly dozens of times, he never thought you would actually take out the Carnality Card... Old Alim wanted to escape, as it is said that when the card glows, everyone present will be pierced by your lower body. Yet he dared not truly turn his back on you, or even look away for an instant.
>  Afterward, you pull up your pants and look at White-Belly who has bitten his tongue to commit suicide: it seems there's truly a special hidden truth here, which we may never uncover now. Old Alim is genuinely, completely terrified; he might never dare to appear in front of you again?

*Context after (wiki's own words, not game text):* * You tell him he'll lose everything, yet he simply smiles Silver or lower Conquest Card. Card and White-Belly broken. Receive a Bronze Tier Vacant Mansion / {{quote|You nail this shameful trafficker to the iron gate, forcing him to watch as you conquer this place with the powers bestowed by the Sul

### 26. White-Belly > Unable to Recruit Alim Later

*Context before (wiki's own words, not game text):* fterward, you pull up your pants and look at White-Belly who has bitten his tongue to commit suicide: it seems there's truly a special hidden truth here, which we may never uncover now. Old Alim is genuinely, completely terrified; he might never dare to appear in front of you again?}} / * You tell h

**In-game text (verbatim):**

> You nail this shameful trafficker to the iron gate, forcing him to watch as you conquer this place with the powers bestowed by the Sultan. You empty his lair, take away all the beggars and thugs, level the garbage heaps (which he calls treasures), flatten every inch of stinking soil, and remove the graffiti on the walls (which he calls history).
>  In the end, he bleeds out and dies in spasms, and all you get is nothing but an empty room... Alim leaves disappointed, leaving all these trophies to you.

*Context after (wiki's own words, not game text):* * You signal Alim to kill White Belly — You used Silver or lower Bloodshed Card but did NOT send The Protagonist / ===Conclusion===

### 27. White-Belly > Conclusion

*Context before (wiki's own words, not game text):* ===Conclusion=== / A few days after White-Belly is completed, Alim will tell you Hemir has been found, working for a miller. This will trigger the Turning the Millstone event.

**In-game text (verbatim):**

> The lost child, Hemir, has been found working for a miller. Alim hopes you can visit him - It'd be much better than if a thief like himself shows up.

*Context after (wiki's own words, not game text):* ==Turning the Millstone== /  Alim has found Hemir, would you like to see him? It seems that he is really working as an apprentice at the mill.


## Arumina

Source: https://sultansgame.wiki.gg/wiki/Arumina

### 1. Conclusion

*Context before (wiki's own words, not game text):* #Arumina is alive and idle / #Jawad has been dead for more than 3 days

**In-game text (verbatim):**

> "After Jawad’s death, Zephyr seems very anxious, and other servants say he often stays out all night… Just as you plan to discuss this with him, he suddenly brings a woman dressed in coarse hemp. 
>  “I love this woman, and she loves me. We want to live together. Master, I will continue to serve you, I will share my food with her, please permit this.” 
>  The woman trembles all over, sticking close behind him, like a leaf lost from its tree, or a little fish lost from its school.
>  According to The Sultan’s law, a slave is not entitled to have a wife. What will you do?",

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! Option


## Arzuna

Source: https://sultansgame.wiki.gg/wiki/Arzuna

### 1. Tailor Shop

*Context before (wiki's own words, not game text):* ==Tailor Shop== /  See main article: Tailor Shop

**In-game text (verbatim):**

> ◆ Noble Blood 
>
> Although Arzuna is somewhat resistant, Malkina insisted on her trying more noble garments and outfits... When a noblewoman dances the exotic dances for guests, the scene nearly spirals out of control, with someone almost proposing immediately.

*Context after (wiki's own words, not game text):* Arzuna, like every other follower, can have Malkina make an outfit for her for 5 Gold. / Effects: +3 Charisma; +3 Sociability; +3 Stealth


## Asal

Source: https://sultansgame.wiki.gg/wiki/Asal

### 1. Book Route

*Context before (wiki's own words, not game text):* == Book Route == / If Lumera has written a book (The Orphan's Revenge or The Taste of Revenge), an offer pops up:

**In-game text (verbatim):**

> Your thoughts had barely torn free of Lumera's revenge when Asal, owner of the Angler, arrived. 
>
> As always, he bowed with exquisite deference, moving like a noble of the fallen kingdom. 
>
> "My thanks for allowing me to set foot in your splendid residence—it is so beautiful, like silk spun by the goddess from the thinnest threads..."
>
> After a flurry of florid praise, he politely brought up Lumera's book. The acclaim on the streets smelled like an opportunity to him; thus he wished for your permission to publish it. If you consented, he would see to plates and printing—more formal, more accurate, and far wider in reach than the handful of hand-copied manuscripts now in circulation.

*Context after (wiki's own words, not game text):* {| class="wikitable" / |-


## Beyond Walls

Source: https://sultansgame.wiki.gg/wiki/Beyond_Walls

### 1. (page lead)

**In-game text (verbatim):**

> Cross the walls of your mind, and you can visit any corner of the world.

*Context after (wiki's own words, not game text):* This is another event to resolve Madness / {{Ritual


## Black Art

Source: https://sultansgame.wiki.gg/wiki/Black_Art

### 1. (page lead)

**In-game text (verbatim):**

> Forbidden knowledge. Use it to decipher tomes of the black art or enact wicked rituals.

*Context after (wiki's own words, not game text):* Black Art is a tag for those most in touch with the Cult.  / There are only a few characters that are able to have this:


## Brutal Fight

Source: https://sultansgame.wiki.gg/wiki/Brutal_Fight

### 1. Duel with the Giant

**In-game text (verbatim):**

> This giant comes from deep within the mountains. The masons found him in an abandoned cave... He has suffered through abuse and torment, refuses to or cannot speak the human tongue, and is filled with rage towards everything.

*Context after (wiki's own words, not game text):* {{MinorCard / |title=Giant

### 2. Duel with the Lion

*Context before (wiki's own words, not game text):* A Gold tier follower will face off against the Giant, with an enormous -14 Contested check. If victorious, however, the Protagonist will gain +1 Influence and 20 Gold Coins. / ==Duel with the Lion==

**In-game text (verbatim):**

> This lion has devoured many of the Sultan's ministers... Half of the audience hopes your warrior can kill the lion, while the other half hopes you get eaten by the lion, sooner or later.

*Context after (wiki's own words, not game text):* {{MinorCard / |title=Lion

### 3. Fight with the Prisoner

*Context before (wiki's own words, not game text):* A Silver tier follower will face off against the Lion, with a respectable -10 Contested check. If victorious, however, the Protagonist will gain +1 Influence and 10 Gold Coins. / ==Fight with the Prisoner==

**In-game text (verbatim):**

> This is the Prisoner's only chance. Why was he sentenced to death? Honestly, you and he aren't that different.

*Context after (wiki's own words, not game text):* {{MinorCard / |title=Condemned Prisoner

### 4. Fighting Wild Dogs

*Context before (wiki's own words, not game text):* A Bronze tier follower will face off against the Prisoner, with an easy -5 Contested check. If victorious, however, the Protagonist will gain +1 Influence and 5 Gold Coins. / ==Fighting Wild Dogs==

**In-game text (verbatim):**

> The Sultan let out a cold laugh. Such a lowly brute deserves to duel with wild dogs.

*Context after (wiki's own words, not game text):* {{MinorCard / |title=Wild Dog


## Canyon of Gales

Source: https://sultansgame.wiki.gg/wiki/Canyon_of_Gales

### 1. (page lead)

**In-game text (verbatim):**

> Ancient people used magic and terrain to shape the ruins here. It is perpetually windy, and the entrance of the canyon is filled with flying sand and pebbles. Statues of griffins and snakes flank the canyon, suggesting the challenges adventurers will face...

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Canyon of Gales


## Captured Cultist

Source: https://sultansgame.wiki.gg/wiki/Captured_Cultist

### 1. Deal with the Sorceress

*Context before (wiki's own words, not game text):* Dragging her to Methinks spawns the ritual Deal with the Sorceress. / ==Deal with the Sorceress==

**In-game text (verbatim):**

> How will you deal with this Occultist who worships the Cultic God?

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Deal with the Sorceress


## Carnality at Home

Source: https://sultansgame.wiki.gg/wiki/Carnality_at_Home

### 1. (page lead)

*Context before (wiki's own words, not game text):* herself, which the player can agree or disagree with. Agreeing will soon spawn the ritual This might not be the best idea…. Disagreeing will immediately spawn the ritual Forcefully Seizing the Withering Flower. <u>Note that having Fatuna participate in this ritual will NOT result in the (immediate) 

**In-game text (verbatim):**

> You violated an unwilling ally…

*Context after (wiki's own words, not game text):* Having a follower with no Passion participate in this ritual will generate a Wife's Resentment, and the character involved will gain 3 Opposition and leave your household.  / Category:Rituals


## Carnival

Source: https://sultansgame.wiki.gg/wiki/Carnival

### 1. (page lead)

*Context before (wiki's own words, not game text):* This event will only occur if Habib is a Cultist.

**In-game text (verbatim):**

> Badriyyah drags Habib to see you, giggling that she knows of an ancient festival requiring the skills of your talented chef. You can gather cultists to participate, and... the more, the better.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Carnival


## Charges and Defence

Source: https://sultansgame.wiki.gg/wiki/Charges_and_Defence

### 1. Partial success

*Context before (wiki's own words, not game text):* The event text notes the following: 1 success is to stop the trial. With more successes you can shift control and eliminate 1 piece of evidence. The number of successes required varies depending on your influence. / ==Partial success==

**In-game text (verbatim):**

> Using florid speech, the defender successfully blocked the judge's verdict. But you know the High Constable will not let it rest.

*Context after (wiki's own words, not game text):* One success might resolve the ritual. It is unknown if the event respawns immediately, or if the evidence is returned to the player's hand. / ==Success==

### 2. Success

*Context before (wiki's own words, not game text):* One success might resolve the ritual. It is unknown if the event respawns immediately, or if the evidence is returned to the player's hand. / ==Success==

**In-game text (verbatim):**

> Under your terrifying glare, the Judge not only fails to convict you, but is forced to declare a key piece of evidence inadmissible. So this is what power feels like?

*Context after (wiki's own words, not game text):* Having enough successes resolves the ritual and destroys the evidence involved. / If a follower was provided to take the fall, this follower is killed.

### 3. Failure

*Context before (wiki's own words, not game text):* If a follower was provided to take the fall, this follower is killed. / ==Failure==

**In-game text (verbatim):**

> No matter how eloquent your defender may be, they had already decided to sentence you to death from the very beginning. Now it all depends on the Sultan's will.

*Context after (wiki's own words, not game text):* The evidence used in the trial is destroyed. A few days later the player is given the following choice: / {{Quote|text=You were convicted of your crimes and sentenced to death. Of course, the Sultan doesn't care about laws and justice… Ending the game like that would be too boring. Therefore, the ge

### 4. Failure

*Context before (wiki's own words, not game text):* {{Quote|text=No matter how eloquent your defender may be, they had already decided to sentence you to death from the very beginning. Now it all depends on the Sultan's will.}} / The evidence used in the trial is destroyed. A few days later the player is given the following choice:

**In-game text (verbatim):**

> You were convicted of your crimes and sentenced to death. Of course, the Sultan doesn't care about laws and justice… Ending the game like that would be too boring. Therefore, the generous and supreme Sultan gives you some opportunities for atonement.

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! Choice !! Result 


## Cleanse the Heretics

Source: https://sultansgame.wiki.gg/wiki/Cleanse_the_Heretics

### 1. (page lead)

**In-game text (verbatim):**

> Purity's followers once again hunt heretics throughout the city… This is their privilege. As long as they identify someone as undermining faith in the Purist, they have the code authority to arrest anyone… Badriyyah and the cultists hide like mice, but this time, they don't want to hide; they are busily preparing a Ritual, intending to teach those priests a lesson…

*Context after (wiki's own words, not game text):* {{MinorCard /  |title=Priests of the Purist


## Commoner's Support

Source: https://sultansgame.wiki.gg/wiki/Commoner%27s_Support

### 1. (page lead)

**In-game text (verbatim):**

> Ordinary citizens, even those slaves, their voices may be insignificant, but you can unite these neglected forces – essentially, you hold a power that ordinary people can't resist, whether they're nobles or bandits.

*Context after (wiki's own words, not game text):* This ritual occurs after getting Commoner's Approval to Gold Tier. / {{Ritual


## Desperate Housewives

Source: https://sultansgame.wiki.gg/wiki/Desperate_Housewives

### 1. (page lead)

**In-game text (verbatim):**

> A veiled woman visits you. She says nothing once inside, simply removing her hat, cloak, dress, and down to her undergarments. Her face is beautiful, her figure ample and graceful as mountains and rivers—even bruised from beatings, it does not hide her beauty.

*Context after (wiki's own words, not game text):* {{MinorCard /  |title=Wife


## Desperation

Source: https://sultansgame.wiki.gg/wiki/Desperation

### 1. (page lead)

**In-game text (verbatim):**

>  To complete the Sultan's Game, you consider desperate measures, such as directly seducing a nobleman's female relatives... Beauty, understanding, and voluptuousness are unnecessary, as long as they are foolish enough.

*Context after (wiki's own words, not game text):* This ritual will appear if you hold on to a low-tier Carnality card for enough time. Unsure on further details. / {{Ritual


## Disaster from Nowhere

Source: https://sultansgame.wiki.gg/wiki/Disaster_from_Nowhere

### 1. (page lead)

*Context before (wiki's own words, not game text):* |} / The Ritual will be created after 1 day of downtime, unlike the other Rituals involved in Impure Aid. The Abducted Follower's attributes will be added onto the Predator's, making an abducted Magic based Follower more difficult for the Protagonist. The Protagonist and any Followers must use their

**In-game text (verbatim):**

> While you anxiously ponder what the Cultists might do with your Conquest Card, you hear about a terrifying evil monster ravaging your territory.........

*Context after (wiki's own words, not game text):* =Gold= / {{MinorCard


## Dispelling Madness

Source: https://sultansgame.wiki.gg/wiki/Dispelling_Madness

### 1. (page lead)

**In-game text (verbatim):**

> Madness is a toxin; it harms you, and taints those around you…

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Dispelling Madness


## Embrace the Power

Source: https://sultansgame.wiki.gg/wiki/Embrace_the_Power

### 1. (page lead)

**In-game text (verbatim):**

> Badriyyah doesn't want Inal's talents wasted — neither do you, right?

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Embrace the Power


## Endry

Source: https://sultansgame.wiki.gg/wiki/Endry

### 1. Carnality

*Context before (wiki's own words, not game text):* This is one of the followers which can be gained after breaking the Jinn Lantern in the Break the Lantern ritual. / ==Carnality==

**In-game text (verbatim):**

> Hello! Because I lost a bet, I'm staying here to play with you! You can call me Little An! I'm a combat jinn! I spend my days dueling romantic rivals! Do you have many such rivals to duel? This is a rather strong jinn—with an enchanting appearance... As you look at her, you sense she's also examining your body with interest.

*Context after (wiki's own words, not game text):* Breaking a Carnality card with her gives you Insight +1 / {{Quote | text = This Jinn swordsman can wield three invisible hands to swing swords. And they prove just as skillful in other contexts...

### 2. Carnality

*Context before (wiki's own words, not game text):* {{quote| Hello! Because I lost a bet, I'm staying here to play with you! You can call me Little An! I'm a combat jinn! I spend my days dueling romantic rivals! Do you have many such rivals to duel? This is a rather strong jinn—with an enchanting appearance... As you look at her, you sense she's also

**In-game text (verbatim):**

> This Jinn swordsman can wield three invisible hands to swing swords. And they prove just as skillful in other contexts...

*Context after (wiki's own words, not game text):* Category:Characters Category:Abomination


## Escape from the Sultan's Game

Source: https://sultansgame.wiki.gg/wiki/Escape_from_the_Sultan%27s_Game

### 1. (page lead)

**In-game text (verbatim):**

> "I really hope I can save enough money soon and leave this dog-eat-dog hellhole…"

*Speaker (from the quote template's `|author=` field, wiki metadata, not part of the quoted line):* Maggie

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Escape from the Sultan's Game 


## Faraj

Source: https://sultansgame.wiki.gg/wiki/Faraj

### 1. Faraj's Connections

*Context before (wiki's own words, not game text):* * there is no Wife's Resentment generated / ==Faraj's Connections==

**In-game text (verbatim):**

> Under your roof, Faraj is humble as a servant. But in the Upper City's most luxurious, radical parties, he is the eagle chasing the storm, every word and gesture attracting attention and admiration... Unfortunately, such socializing might be too extravagant for the young, maybe you should provide him with some reasonable support.

*Context after (wiki's own words, not game text):* Requirements: Notoriety >=12; Infamy <3. / He will ask you for permission to start holding Salons for other nobles. You'd be a fool not to: this creates good opportunities for you to spread your Convictions. 


## Fardak

Source: https://sultansgame.wiki.gg/wiki/Fardak

### 1. Thoughts of Escape > The Promised Moment

*Context before (wiki's own words, not game text):* ===The Promised Moment=== / Some time later, he will go to The Grand Game and ask the Sultan one last time to let him go home. Unsurprisingly, he is refused. He turns to you in an involved event The Promised Moment, asking what to do:

**In-game text (verbatim):**

> The Sultan ruthlessly rejected Fardak's request. Now everyone knows he can never to his hometown. 
>
> Heartbroken, Fardak instinctively shows up at your door once more.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=The Promised Moment

### 2. Fardak's Marital Troubles > First Sight

*Context before (wiki's own words, not game text):* *Lumera - First Sight event. / ===First Sight===

**In-game text (verbatim):**

> Lumera's clear eyes stare at you, without a hint of girlish shyness or hesitation. "If that's your wish, I'll marry him," [...]

*Context after (wiki's own words, not game text):* The Protagonist organizes a ceremony announcing he is adopting Lumera purely because she is worth it. / {{Ritual


## Fate's Ledger

Source: https://sultansgame.wiki.gg/wiki/Fate%27s_Ledger

### 1. (page lead)

**In-game text (verbatim):**

> Everything that happens, all the weal and woe, shall be your chips to tip the scale of fate: Fate Points.

*Context after (wiki's own words, not game text):* Spend Fate Points to claim boons that may guide you closer to the secrets hidden within this tale. / * Resolve Sultan Cards in game, or complete stories in One Thousand and One Nights to gain Fate Points.


## Fatuna

Source: https://sultansgame.wiki.gg/wiki/Fatuna

### 1. Carnality Card

*Context before (wiki's own words, not game text):* "I think, Maggie, your wife, and I are the best of friends. Have you heard of sororal polygyny? Em, I mean, what I mean is...." / You understand what she means, and to be honest, it is not a bad idea. Who would not want to be blessed with the company of two wonderful women? The only things is... You

**In-game text (verbatim):**

> While you were courting Fatuna, she made a tempting proposal... She wants you to marry her. Maybe, for your happiness, you should find some time to discuss this with Maggie? Or... humph, why should she refuse you? Maybe she's just pretending to be uninterested.

*Context after (wiki's own words, not game text):* * No, I want her now: triggers Forcefully Seizing the Withering Flower event. / * Maybe I should ask my wife: cancels carnality event, triggers This might not be the best idea… event.

### 2. Carnality Card > This might not be the best idea...

*Context before (wiki's own words, not game text):* Fatuna loses all her Passion whether or not a Carnality Card is provided. / ===This might not be the best idea...===

**In-game text (verbatim):**

> Maggie has noticed your recent hesitant demeanor. Now, she seems to be in a good mood and takes the initiative to ask you about it. Maybe this is a good time to talk to her about that matter—the one where you could take another wife.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=This might not be the best idea…

### 3. Carnality Card > This might not be the best idea...

**In-game text (verbatim):**

> You plan to persuade your wife

*Context after (wiki's own words, not game text):* *Ignore: Let your affair with Fatuna remain a secret forever. / *If there are any Wife's Resentment: you will fail. Gain 1x Bronze Opportunity

### 4. Carnality Card > This might not be the best idea...

*Context before (wiki's own words, not game text):* {| class="wikitable" / |+

**In-game text (verbatim):**

> Maggie verbally says she respects your choice, but her gaze is sharper than a knife. Your scalp tightens… how should you choose?

*Context after (wiki's own words, not game text):* ! Choice / ! Outcome


## Fire Dragon Scales

Source: https://sultansgame.wiki.gg/wiki/Fire_Dragon_Scales

### 1. Grand Game

*Context before (wiki's own words, not game text):* ==Grand Game== / Taking this to The Grand Game results in Influence -3; Renown +3; Notoriety +1 as the Sultan is mad you didn't capture it.

**In-game text (verbatim):**

> The Sultan holds the scale with two fingers, glances towards your prostrate position, and lightly throws it away. The scale spins over in an arc, finally embedding in the palace beams, you notice a blood streak cut across your cheek. 
>
> "Everything in the world is my property. You dared to take without permission and let that creature escape? Such a waste! This punishment is but a fraction of what I should rightfully mette, now get out!" 
>
> The next day, stories of you leading a team to defeat the Fire Dragon begin to spread in the city.

*Context after (wiki's own words, not game text):* Category:Stubs


## Forest of the Jinn

Source: https://sultansgame.wiki.gg/wiki/Forest_of_the_Jinn

### 1. (page lead)

**In-game text (verbatim):**

> Legends say the Jinn are as beautiful as they are cruel, yet many claim to have won the Jinn Queen's treasures through wit and deceit… Jabal's notes speak of a wager: triumph and the Jinn will be trapped to serve you… You wonder what the cost of failure would be.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Forest of the Jinn


## God-Hunting

Source: https://sultansgame.wiki.gg/wiki/God-Hunting

### 1. (page lead)

**In-game text (verbatim):**

> The ritual's elegance lies in its simplicity - lure the greedy god into the vessel, block escape with darkness, counter resistance with mirrors, then slice open the vessel to release divine essence - no different from butchering livestock.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=God Hunt


## Gold Coin

Source: https://sultansgame.wiki.gg/wiki/Gold_Coin

### 1. (page lead)

*Context before (wiki's own words, not game text):* |Tier=Gold / |Tags=Gold Coin, Stackable, Consumable}}

**In-game text (verbatim):**

> These little cuties are indispensable everywhere.

*Context after (wiki's own words, not game text):* Gold Coins are the Currency used to pay for things. There exist coins made from less precious metals, but those are too small to matter in Sultan's Game. / =Earning Money=


## Guesthouse

Source: https://sultansgame.wiki.gg/wiki/Guesthouse

### 1. (page lead)

**In-game text (verbatim):**

> These people will risk everything for you after enjoying your meal.. at least until it's digested.

*Context after (wiki's own words, not game text):* The Guesthouse is a location where adventurers gather for a free meal. You can send your followers here to recruit Retainers, with an initial total of 3 Retainers. Retainers will change every 7 days. Recruiting counts as a 0 days event. / The Guesthouse is also heavily connected with Habib storyline

### 2. Retainers

*Context before (wiki's own words, not game text):* Constructing it gives you +1 Influence. If Extravagance is used, you gain Slander as other nobles claim you're raising assassins in the slums. / ==Retainers==

**In-game text (verbatim):**

> "They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty."

*Speaker (from the quote template's `|author=` field, wiki metadata, not part of the quoted line):* Description of every retainer in the Guesthouse

*Context after (wiki's own words, not game text):* All of them have Unemployed tag while unemployed. / {| class="wikitable mw-collapsible"

### 3. Upgrades

**In-game text (verbatim):**

> The more mouths there are to feed, the more voices there are to speak for you. Your subjects will sic your foes at your behest.

*Context after (wiki's own words, not game text):* The Guesthouse can be upgraded 3 times, requiring you to meet Notoriety thresholds for each. Each upgrade will increase the number of Retainers slots. Upgrades also count as 0 days events. / {| class="wikitable"

### 4. Upgrades > Laughter in the Attic

*Context before (wiki's own words, not game text):* *Stone-tier: you get 3 Gold Coins. / *Bronze-tier: you get silver Intelligence.

**In-game text (verbatim):**

> Buthayna storms up to you, bristling. 
>  "You look like an upright sort – yet here you are, snatching my gutter trade!" She jabs a finger at your guesthouse attic. “ - using my own people, no less!" 
>
> Sure, no law says she alone runs this business in town, but...

*Context after (wiki's own words, not game text):* I'll use my own people: / Mind your own people first:


## Guide:Rod of Life

Source: https://sultansgame.wiki.gg/wiki/Guide%3ARod_of_Life

### 1. Convert Faris

*Context before (wiki's own words, not game text):* {{main|Change of Dynasty}} / Continue through Change of Dynasty as normal. After getting through his legions, you will reach the Sultan. Since you've converted all four of his champions, you are now in Honor Guards' Promise. If you have not stolen the ring, all four of them will perish.

**In-game text (verbatim):**

> You whisper at the Sultan's ear, a soft hiss that declares this to be the punishment – or perhaps the reward – for all he has wrought in his fleeting life. His face twists for the first time, a mask of flesh buckling, but whatever words he means to spit, you silence them. Before his lips part, you pierce his body with your flawless creation – a thing of ruinous perfection. 
>
> Aether surges between you, crackling with lightning and thunder – yet its clamor pales beside the merest fraction of his screams, his wails of anguish. 
>
> Wielding this seemingly boundless power, you transport him between ecstasy and agony, countless times unleashing years of suppressed humiliation... 
>
> Throughout this communion, you experience pleasure transcending imagination. Did the mighty ruler beg for mercy? Did he moan from depths of shameful desire? Did his proud spirit finally break? The words never reached you... At last, even the Rod of Life reaches its end, shuddering to a halt in a keening wail of metal. 
>
> Only then do you see it: the thing once called Sultan lies shattered, a broken relic of flesh and bone. Rising, you turn. Lightning flares, and your loins – ablaze with the sacred flame of aether – stand proud before the cowering court. They kneel, one by one, trembling as they greet the new monstrosity that claims their throne.

*Context after (wiki's own words, not game text):* Choose to humiliate him and the achievement is yours! / Category: Guides


## Gullis

Source: https://sultansgame.wiki.gg/wiki/Gullis

### 1. (page lead)

*Context before (wiki's own words, not game text):* He can be selected to inspire the former slaves from the diamond mine into maintaining secrecy and working for you / =Storyline=

**In-game text (verbatim):**

> You realize that Gullius is an 'untrained' slave. He doesn't know how to deal with city dwellers, can offend passing nobles with a glance, and constantly gives off a feral air. When you ask him to keep a lower profile, he instead looks like an assassin.
> Perhaps you should send him out often with other servants and learn how to handle the ways of this urban world.

*Context after (wiki's own words, not game text):* Gullis will need to be put into Methinks to Trigger the Event "Social Training". Gullis needs to be sent out with a character who is considered a servant, along with 1 Gold and any Consumable to Help the Roll. / Jenna, Malkina, Hassan, Zaki, Lumera, and Arzuna do not meet the requirements, but Habib


## Habib

Source: https://sultansgame.wiki.gg/wiki/Habib

### 1. What smells good? > Nobles also want to eat

*Context before (wiki's own words, not game text):*  Due to your negligence, everyone resentment escalated. / ===Nobles also want to eat===

**In-game text (verbatim):**

> He fancies himself the capital's most discerning connoisseur. Wherever fine cuisine is whispered of, he must taste it for himself.

*Speaker (from the quote template's `|author=` field, wiki metadata, not part of the quoted line):* Gluttonous Noble

*Context after (wiki's own words, not game text):* {{MinorCard / |title=Gluttonous Noble

### 2. After the Banquet

*Context before (wiki's own words, not game text):* ==After the Banquet== / After at least 3 banquets have been hosted, the following will appear.

**In-game text (verbatim):**

> You suddenly realize that the children helping in Habib's kitchen seem different each time.So, you ask Habib what is going on.

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! Choice

### 3. After the Banquet

**In-game text (verbatim):**

>  Maggie heard about you reprimanding Habib for bringing hungry children to help in the kitchen. She doesn't look happy. 
>
> "Habib is the kindest, most honest person – you shouldn't speak to him like that, especially in front of everyone," she glares at you. "What he's doing isn't wrong, those children deserve help.' 
>
> Saying this, she pulls out an embroidered velvet money pouch – her personal savings. 
>
> "I'll pay for it on your behalf. Just let them continue going to Habib's kitchen – why can't you just let everyone be happy?""

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! Choice


## Harem Vacancy

Source: https://sultansgame.wiki.gg/wiki/Harem_Vacancy

### 1. (page lead)

*Context before (wiki's own words, not game text):* This event occurs if a Bloodshed Card is used in Impure Assisstance and one of the Sultan's concubines is killed.

**In-game text (verbatim):**

>  A cultist wielding your Bloodshed Card killed a woman serving the Sultan, whose fury extends to you. He demands you provide a replacement - one who will never leave the palace.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Harem Vacancy


## Haunted Mansion

Source: https://sultansgame.wiki.gg/wiki/Haunted_Mansion

### 1. Night's Shelter

*Context before (wiki's own words, not game text):* *Talk: Speaking to her does not trigger a stat check. If you speak with her you will get Black Art tag, Badriyyah as a follower and Bronze tier Peering Into Darkness conviction. Recruiting Badryiyyah also gives Sacrificial Ritual. / *Apprehend: Captured Badriyyah becomes bronze-tier Captured Cultist

**In-game text (verbatim):**

> As her limbs go numb, she lets out a moan from the depths of her throat, a sound that makes your legs weak...

*Context after (wiki's own words, not game text):* Captured Cultist can be brought to In the Name of God. / =The Whodunnit Route=

### 2. Unsolved Murders

*Context before (wiki's own words, not game text):* =The Whodunnit Route= / ==Unsolved Murders==

**In-game text (verbatim):**

> You have solid evidence the Judge has committed a crime, and this is also the leverage you can use to control him and make him work for you.

*Context after (wiki's own words, not game text):* {{MinorCard|title=Valid Evidence|image=Valid Evidence.png|Tier=Stone|Type=Item|Designation=Item|Description=You now have irrefutable evidence proving the Judge to be the real culprit. What will you do next?}} / {{Ritual

### 3. The Call Of Darkness

*Context before (wiki's own words, not game text):* =The Call Of Darkness= / ==The Call Of Darkness==

**In-game text (verbatim):**

> You Frequently dream of returning to that perilous mansion, following blood trails from a fallen dagger deeper into darkness. Something awaits you there, calling you

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=The Call Of Darkness

### 4. Badriyyah

*Context before (wiki's own words, not game text):* *Failure has no consequences except wasted time. / ==Badriyyah==

**In-game text (verbatim):**

> I am Badriyyah, she smiles. Her black fingers brush and tingle your chest, perhaps to calm you, or to provoke you further

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Badriyyah


## Highlord of the Highlands

Source: https://sultansgame.wiki.gg/wiki/Highlord_of_the_Highlands

### 1. (page lead)

**In-game text (verbatim):**

> The mightiest of Star-Souleds has returned to earth, consumed by excitement, joy, and insatiable hunger, devouring mortal dreams without restraint.

*Context after (wiki's own words, not game text):* =The Frenzied Highlord= / {{Ritual


## Holy Judgement

Source: https://sultansgame.wiki.gg/wiki/Holy_Judgement

### 1. (page lead)

**In-game text (verbatim):**

> You are struck by the sheer shamelessness of these heathens. They abandon their gods for a handful of coins. Worse, they defile yours in the process! The True Faith will not stand for this. You shall bring holy judgment upon them. No cost too great.

*Context after (wiki's own words, not game text):* This ritual appears when religious outrage reaches its peak. / {{Ritual


## Hunters' Remnants

Source: https://sultansgame.wiki.gg/wiki/Hunters%27_Remnants

### 1. (page lead)

**In-game text (verbatim):**

> You've distilled effective information from these scattered clues.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Surviving Hunters

### 2. (page lead)

*Context before (wiki's own words, not game text):* This ritual will randomly grab one of Riel's troops from her base. If any followers were queued up to receive training from Riel's troops, it will reset the entire training. / While their leader may be captured, several groups of slave hunters are still around, each group going after specific target

**In-game text (verbatim):**

> This group targets barbarians, with both its leader and base now clearly identified, allowing you to send forces for extermination at any moment.

*Context after (wiki's own words, not game text):* Adds the Soul Hunters to Riel's gang. / {{Quote|text=Surprisingly, this group's target is the country's vagrants—all free men! They burn these people's identity papers, selling them as slaves, which is entirely unlawful! Fortunately, their leader and base are quite apparent, allowing you to send for

### 3. (page lead)

*Context before (wiki's own words, not game text):* {{Quote|text=This group targets barbarians, with both its leader and base now clearly identified, allowing you to send forces for extermination at any moment.}} / Adds the Soul Hunters to Riel's gang.

**In-game text (verbatim):**

> Surprisingly, this group's target is the country's vagrants—all free men! They burn these people's identity papers, selling them as slaves, which is entirely unlawful! Fortunately, their leader and base are quite apparent, allowing you to send forces for immediate extermination.

*Context after (wiki's own words, not game text):* Adds the Paper Shredders to Riel's gang. / {{Quote|text=This is a party tasked with capturing nomads, and both their leader and base are now clearly identified, allowing you to send forces for eradication at any time.}}

### 4. (page lead)

*Context before (wiki's own words, not game text):* {{Quote|text=Surprisingly, this group's target is the country's vagrants—all free men! They burn these people's identity papers, selling them as slaves, which is entirely unlawful! Fortunately, their leader and base are quite apparent, allowing you to send forces for immediate extermination.}} / Add

**In-game text (verbatim):**

> This is a party tasked with capturing nomads, and both their leader and base are now clearly identified, allowing you to send forces for eradication at any time.

*Context after (wiki's own words, not game text):* Adds the Blade Winds to Riel's gang. / It is possible to obtain a copy of an already existing troop this way, which could lead to not all Troops being recruited.


## I, Freeloader

Source: https://sultansgame.wiki.gg/wiki/I%2C_Freeloader

### 1. (page lead)

**In-game text (verbatim):**

> Soon, Buthayna discovers that four of the girls are missing. She confronts you at your room's doorway with several guards, demanding to know what happened.

*Context after (wiki's own words, not game text):* This event occurs after Preparing for the Game.  / {{Ritual


## Iliona

Source: https://sultansgame.wiki.gg/wiki/Iliona

### 1. (page lead)

*Context before (wiki's own words, not game text):* Iliona's major strength is her +3 Support, which is very useful in The Grand Game. She has a decent starting Charisma, which can be boosted a lot if you put three pieces of jewelry into her accessory slots. She is also one of the very rare characters who start with skill in Magic, and also one of th

**In-game text (verbatim):**

> Iliona occasionally brings back some forgotten luck from others, but that itself is also a matter of luck.

*Context after (wiki's own words, not game text):* Wish options (trigger unknown, possibly use in The Grand Game) / {| class="wikitable"


## Impure Aid

Source: https://sultansgame.wiki.gg/wiki/Impure_Aid

### 1. Impure Aid > Bloodshed

**In-game text (verbatim):**

> The cultist chose someone — no, rather, the Cult God selected the target for this unholy slaughter, and you're powerless to stop it.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Fate's End

### 2. Impure Aid > Extravagance

**In-game text (verbatim):**

> The cultists loudly proclaim that the Cultic God will bestow a boon so that even the poorest in the Dark Alley have meat to eat... you dare not imagine their confidence... or where the money for meat comes from.

*Context after (wiki's own words, not game text):* {| class="wikitable" style="border-style:solid; border-width: 5px; " / |+ style="color:black; background-color:#996633;"| Gluttony Desires


## Investigate Evidence

Source: https://sultansgame.wiki.gg/wiki/Investigate_Evidence

### 1. Apply pressure > Failure

*Context before (wiki's own words, not game text):* Successfully applying pressure to Adil resolves the ritual and returns the Evidence card to the player's hand, giving them another chance to get rid of it. / ===Failure===

**In-game text (verbatim):**

> Adil has found what he wanted, and soon you'll receive notice of the trial.

*Context after (wiki's own words, not game text):* The ritual Charges and Defence spawns a few days later. / ==Attack Adil==

### 2. Attack Adil > Failure

*Context before (wiki's own words, not game text):* Adila also gains 1 Marks of Combat from this event. / ===Failure===

**In-game text:** *duplicate — the wiki uses the identical failure paragraph for this branch as for item 1 above (`Apply pressure > Failure`). Text not repeated; see item 1.*

*Context after (wiki's own words, not game text):* The ritual Charges and Defence spawns a few days later. / ==Expiration==

### 3. Expiration

*Context before (wiki's own words, not game text):* ==Expiration== / Not engaging with the ritual will always let the investigation succeed.

**In-game text (verbatim):**

> Adil won't show you any mercy, and soon you'll receive notice of the trial.

*Context after (wiki's own words, not game text):* The ritual Charges and Defence spawns a few days later. / Category:Rituals


## Jawad

Source: https://sultansgame.wiki.gg/wiki/Jawad

### 1. The Obese Prisoner

*Context before (wiki's own words, not game text):* =Storyline= / ==The Obese Prisoner==

**In-game text (verbatim):**

> This Prisoner is held here for the crime of greed. Though he is now in prison, he maintains his noble pride and pomp. Why not? He will soon leave this hellhole, maybe tomorrow, maybe the day after.

*Context after (wiki's own words, not game text):* Jawad wound up in Prison for corruption and embezzlement. He promises compensation if you set him free.  / Jawad can be rescued by paying 5 gold to a Dark Alley informant (event takes 3 days) and bringing the Perjury of Integrity that clears his name to Prison. He disappears for a rather long time a


## Jenna

Source: https://sultansgame.wiki.gg/wiki/Jenna

### 1. Tailor Shop

*Context before (wiki's own words, not game text):* ==Tailor Shop== /  See main article: Tailor Shop

**In-game text (verbatim):**

> After lengthy discussion, Malkina decided to design jewerly and accessories that would remind people of you. Thus, whenever people saw Jenna's ornaments, they would recall the Sultan's Game — and the fact that you still suffer.

*Context after (wiki's own words, not game text):* Jenna, like every other follower, can have Malkina make an outfit for her for 5 Gold. / Effects: +3 Support; +2 Sociability 


## Jinn Lantern

Source: https://sultansgame.wiki.gg/wiki/Jinn_Lantern

### 1. Break the Lantern

**In-game text (verbatim):**

> Three errant Jinn are imprisoned here. One for theft, another for illicit love, another for nobility.
>
> They plead persuasively for freedom

*Context after (wiki's own words, not game text):* You gain Iliona, Endry, or Veesa as a follower. / Category:EquipmentCategory:ItemsCategory:WeaponsCategory:Rituals


## Killing the Fierce Lion

Source: https://sultansgame.wiki.gg/wiki/Killing_the_Fierce_Lion

### 1. The Mountain Lion's Final Demand

**In-game text (verbatim):**

> Should you trust the evil dream, or dispose of the monster still craving human flesh?

*Context after (wiki's own words, not game text):* *Should you decide to kill the beast, you gain Renown +1, and both hunters gain +1 Combat. / *Should you decide to provide a sacrifice, this sacrifice will obviously be killed, but you gain the card Mountain Lion.


## Lady Becky

Source: https://sultansgame.wiki.gg/wiki/Lady_Becky

### 1. Tailor Shop

*Context before (wiki's own words, not game text):* ==Tailor Shop== /  See main article: Tailor Shop

**In-game text (verbatim):**

> Lady Becky is absolutely adorable! He deserves proper adornment! Malkina promised to individually craft every garment and accessory specifically for Lady Becky, ensuring even cats could enjoy gilded splendor.

*Context after (wiki's own words, not game text):* Lady Becky, like every other follower, can have Malkina make an outfit for her for 5 Gold. / Effects: +1 Accessory slot; +1 Attire slot


## Lumera

Source: https://sultansgame.wiki.gg/wiki/Lumera

### 1. The Beggar Girl

*Context before (wiki's own words, not game text):* =Storyline= / ==The Beggar Girl==

**In-game text (verbatim):**

> Poverty and hunger have marred her flesh, but her innocent eyes are like two deep pools - luring fools to pour out their desires, inviting the wise to impart wisdom.

*Context after (wiki's own words, not game text):* After buying three books in Bookstore business, a Girl in Rags asks The Protagonist to borrow a book. / {{Ritual

### 2. The Beggar Girl

*Context before (wiki's own words, not game text):* Providing her with a book (or Hassan's poem) results in the girl quickly leaving as if frightened by the Protagonist. / If the event times out it will reappear later.

**In-game text (verbatim):**

> She wandered near your house... God only knows how she found your house... It seems she wants to return the book.

*Context after (wiki's own words, not game text):* The Girl in Rags appears at the Protagonist's residence 3 days after Beggar at the Bookstore Entrance hoping to return the borrowed book. / The event description suggest using a Sultan Card on her will have no consequence, as the girl will be missed by nobody, which is thusly reflected in gameplay.

### 3. The Genius Girl

*Context before (wiki's own words, not game text):* If the event times out it will reappear later. / ==The Genius Girl==

**In-game text (verbatim):**

> A genius girl who loves to read, with immense potential.

*Context after (wiki's own words, not game text):* After reading 5 books, Lumera will indicate to the player she has something to tell them when put in Methinks. / {| class="wikitable"

### 4. Happiness

**In-game text (verbatim):**

> You tell her that, in your view, honor is far less important than happiness. In other words, the ultimate goal of life should be to make oneself happy, and honor is just one of the means to achieve happiness. For the protagonist's child in the book, a cup of hot milk is happiness. Therefore, you think she should take the milk home and let go of hatred.

*Context after (wiki's own words, not game text):* When the player tells Lumera that Apolos should have kept the milk jug, she will indicate she has something to tell the player when put in Methinks. / {{quote|Lumera bows to you and tells you she wants to learn the ancient language of the empire, which is the language of her homeland. This language 

### 5. Happiness

*Context before (wiki's own words, not game text):* view, honor is far less important than happiness. In other words, the ultimate goal of life should be to make oneself happy, and honor is just one of the means to achieve happiness. For the protagonist's child in the book, a cup of hot milk is happiness. Therefore, you think she should take the milk

**In-game text (verbatim):**

> Lumera bows to you and tells you she wants to learn the ancient language of the empire, which is the language of her homeland. This language doesn't differ much from the common language, but many terms are different, especially those related to faith.
> "I think the past is not important. What matters is that I use this life to do something I want to do. The ultimate goal of life is to achieve happiness, which is what you taught me. I have thought about it, and my happiness lies in learning more knowledge. Please send me to learn the nacient language; I will repay your benevolence doubly."
> She says this while groveling, and you contemplate the answer. Sending her to learn the ancient language requires some money, but she is very smart, so it might be worth it...

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! scope="col" style="width: 300px;" | Choice

### 6. Happiness > Ancient Language Lessons

*Context before (wiki's own words, not game text):* The questline will continue regardless of the outcome. / Immediately after finishing Ancient Language Lesson the following event will appear:

**In-game text (verbatim):**

> Lumera's ancient language teacher finds you and first pays perfunctory compliments on her learning progress. After that, he proposes taking Lumera to work together.
>  Recently, the Sultan's scribes have been organizing a vast amount of old ceremonial documents, attempting to find evidence that the royal family of Lumera's homeland once cursed the Sultan's ancestors. This would further convince the people that the Sultan is persecuted and just while portraying Lumera's homeland as evil magicians.
>  Nine-tenths of those ancient documents are meaningless, and only the remaining tenth has some use. He needs peope with some kind of knowledge of the ancient language to help filter them.

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! scope="col" style="width: 300px;" | Choice

### 7. Happiness > The Pain of Editing

*Context before (wiki's own words, not game text):* This event does not disappear on completion. / When the event is completed for the third time, the following event appears:

**In-game text (verbatim):**

> Lumera's ancient language teacher comes to you in a rage and blurts out, "Your slave girl is too rude!!"
> He angrily tells you that while organizing the ancient documents, Lumera discovered a very obscure spell. This could be said to be the most important find in recent documentation efforts. Naturally, the scribes demanded she hand over the spell as their achievement, but she - a lowly slave - refused!
> "She even had the audacity to bring you up, saying she only listens to your orders! Hmph... you will surely make that disrespectful slave surrender the spell, then whip her and make her lick our toes to apologize, right?!" He confidently gives you a knowing look, "If you do this, we will support you at palace!"
> You look down at Lumera, who has been dragged aside. Her arms and face are covered in bruises and dust. Despite hearing such harsh words, she remains silent, holding the bundle tightly. Clearly, that's what the noble wants to take away. She must have fought desperately to keep it.

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! scope="col" style="width: 300px;" | Choice

### 8. Happiness > The Pain of Editing

**In-game text (verbatim):**

> "Master, it's the Starry Spell." Her eyes sparkled, and ever since you gave her a book in front of the bookstore, this seemed to be her happiest moment, "We can further interpret it."

*Context after (wiki's own words, not game text):* After siding with Lumera, the special book Fragment of the Star-Souled Glyphs is added to the players hand. Putting it in Methinks starts Fragment of the Star-Souled Glyphs / {{Ritual

### 9. Happiness > The Pain of Editing

*Context before (wiki's own words, not game text):* On completion: Add +1 Wisdom to Lumera and the Protagonist; Fragment of the Star-Souled Glyphs is destroyed. Gain Scholar's Insignia. / Fragment of the Star-Souled Glyphs is unlike normal book events, in that it requires 2 specific participants, instead of 1 that fulfils the book's requirements, and

**In-game text (verbatim):**

> She looks at you obsessively, pleading for you to give her the fragment. She wants to decode it, decipher it, and uncover its hidden secrets. Her fervor overwhelms you, and you cannot refuse her.

*Context after (wiki's own words, not game text):* 3 days later, Lumera will indicate to the player that she has something to tell them when put in Methinks. / ===Starry Night===

### 10. Happiness > Starry Night

*Context before (wiki's own words, not game text):* 3 days later, Lumera will indicate to the player that she has something to tell them when put in Methinks. / ===Starry Night===

**In-game text (verbatim):**

> You found Lumera in the study. She seemed spellbound, chanting the deciphered starry spell over and over again. Whatever you said beside her, she seemed not to hear a word.
> After a while, she looked up, a silver star cross flashing in her left eye, both eerie and sacred... She read the spell faster and faster, and many words not recorded in the parchment slipped from her lips , as if some higher will were whispering to her, as if this will had chosen her as an innocent vessel...
> You finally understood - the meaning of "opening was to open a door leading to the path of infinity; "opening" meant severing the link to the present world - she seemed to have knocked on the door of the spell. Should you stop her from continuing to read it?

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! Choice

### 11. Happiness > Starry Night > Ascension

*Context before (wiki's own words, not game text):* The two Star-Souled Night events have identical names, which is not an issue in-game, as having one appear strictly means having the other one not appear. This wiki uses "Humanity" and "Ascension" in parentheses to differentiate the two. / ====Ascension====

**In-game text (verbatim):**

> According to those extinct beliefs, all of man's power came from the stars, but no living person could withstand the true power of the star spirits, so the vessel must die - dying to achieve eternal life.

*Context after (wiki's own words, not game text):* Allowing Lumera to finish the ritual makes her ascend to the star spirits. / {{Ritual

### 12. Happiness > Starry Night > Ascension

*Context before (wiki's own words, not game text):* }} / On completion: Lumera dies; Obtain The Star-Souled (this card is not added to the player's hand). This can be used during rebellion or escape.

**In-game text (verbatim):**

> A violent black whirlwind rushes into your residence, causing people to scream and hide. After the commotion, it's found that nothing is missing, but Lumera has vanished. You look up at the stars, only you know where she has gone.

*Context after (wiki's own words, not game text):* ====Humanity==== /  {{quote|The star cross in her eyes gradually faded. In the void, something sighed... Lumera collapsed to the ground, fainting as if exhausted.}}

### 13. Happiness > Starry Night > Humanity

*Context before (wiki's own words, not game text):*  {{quote|A violent black whirlwind rushes into your residence, causing people to scream and hide. After the commotion, it's found that nothing is missing, but Lumera has vanished. You look up at the stars, only you know where she has gone.}} / ====Humanity====

**In-game text (verbatim):**

> The star cross in her eyes gradually faded. In the void, something sighed... Lumera collapsed to the ground, fainting as if exhausted.

*Context after (wiki's own words, not game text):* Stopping the ritual makes Lumera faint and stay asleep for 3 days. / {{Ritual

### 14. Marriage

*Context before (wiki's own words, not game text):* }} / When Lumera is placed in the event: First Sight appears

**In-game text:** *duplicate — the same passage is quoted on the `Fardak` page (item 2, `Fardak's Marital Troubles > First Sight`). Text not repeated; see there.*

*Context after (wiki's own words, not game text):* The Protagonist organizes a ceremony announcing he is adopting Lumera. / Purely because she is worth it.


## Madness Manifest

Source: https://sultansgame.wiki.gg/wiki/Madness_Manifest

### 1. (page lead)

**In-game text (verbatim):**

> Behind stones, in unseen places, movements, gazing, peering at life!

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Madness and Illusions

### 2. Failure

*Context before (wiki's own words, not game text):* *Badriyyah: Insight +1; Physique +1; Combat +1 / ==Failure==

**In-game text (verbatim):**

> Lack of sleep

*Context after (wiki's own words, not game text):* Not providing a way to relieve the madness will result in The Protagonist losing 2 Charisma and increases Insight by 1. / ==Highlord Interaction==


## Maggie

Source: https://sultansgame.wiki.gg/wiki/Maggie

### 1. Wife's Resentment > Dealing with Wife's Resentment

*Context before (wiki's own words, not game text):* ===Dealing with Wife's Resentment=== / ====Resolve Wife's Resentment====

**In-game text (verbatim):**

> What you are going through and what you have done are enough to drive any spouse mad. You would do well to keep her in good cheer, less you find yourself dead before you even know how.

*Context after (wiki's own words, not game text):* Resolve Wife's Resentment is a ritual that allows the player to get rid of a Wife's Resentment card, provided the player has access to an item which will please Maggie. / This ritual can be spawned by dragging the Wife's Resentment card into Methinks and does not require a check. This event can be r


## Malkina

Source: https://sultansgame.wiki.gg/wiki/Malkina

### 1. (page lead)

*Context before (wiki's own words, not game text):* |Description=Malkina's mother once served as a slave and managed your family's tailor shop. In time, she earned her freedom and a share in the shop. Now, bearing her mother's command, armed with golden needles, silver threads, eyes for beauty, and hands touched by god, Malkina has come to aid in you

**In-game text (verbatim):**

> Your family once supported a slave's career, making her a free woman. Now her daughter has come to repay the kindness... Seeing how downcast your house is looking, she says that this will not do, and whips out her makeup box.

*Context after (wiki's own words, not game text):* == Malkina's Tailor Shop == / {{Main|Tailor Shop}}

### 2. An argument

*Context before (wiki's own words, not game text):* Malkina, when placed in Methinks, will immediately involve herself in a 2 day ritual. For the price of 5 Gold Coins, Malkina can provide a one-time permanent bonus to any follower.  / ==An argument==

**In-game text (verbatim):**

> A servant tells you Malkina is arguing with a strange man outside your residence, so you go to look.
> The man seems a low noble, one hand gripping a shy-eyed young woman; the other jabbing angrily at Malkina, who wears a face of lofty indifference.
> After listening a while, you untangle it: the girl had long pined for the man but could not win his affection, so she went to Malkina, asking to be remade in the image of his ideal woman...and it worked. But later, he discovered the hair, the skin, the figure had all been “enhanced” by Malkina...He felt deceived; Malkina, of course, felt she had done nothing wrong.
> The two glare at each other, neither yielding an inch...perhaps you should say something?

*Context after (wiki's own words, not game text):* Malkina's storyline will begin once Malkina has finished one outfit for any character, starting with this event. The event will trigger on the same end of turn sequence as the first Tailor Shop ritual.  / {| class="wikitable"

### 3. An argument > The Wind Along the Street

**In-game text (verbatim):**

> Your servant spotted that loud man again at market and rushed back to gossip with you.
> He runs a small caravan, only four horses, and peddles foreign spices. The girl who loved him, the one who changed herself for him, was a slave girl at the spice shop next door… WIth that disguise and a few “necessary” tricks, she made him fall in love, then persuaded him to buy her freedom and marry her as a free woman. 
>
> Yet she had been a slave girl, and he was a noble. True, she was skilled. She could distill perfumes; but he was the most insignificant sort of noble, with only two old servants at home… 
>
> Still, he felt he ought not to have married a slave, especially one who didn’t match the beauty he’d imagined. Even if he loved the girl and knew she was the best gift fate would grant him, he was furious at himself. 
>
> So, the night after their wedding, he raised that quarrel– his tonic for a wounded pride.
>
> Now they run a business together. He paid her master, tore up her slave papers; she is free. She sits smiling before their own shop, blending perfumes— deft hands, a keen nose, and a sweet smile. Their trade grows better by the day 
>
> You asked a servant—what of the oil the girl had used to fake ebony skin? Her maple-colored hair? Her lips plumped with honey...? 
>
> "Oh my lord, you were measuring ordinary folk by the standards of great nobles! What husband and wife could keep that up every day, unless they were the Sultan and his consort!" The servant's eyes went round. "Of course she looked just the same as before now! Pale skin, yellow hair, and hardly any flesh up front!" You could not help a laugh. 
>
> The servant also gave you a bottle of perfume, a gift from the newlywed who had reverted to her original look; when she had stopped by earlier, she had remembered the servant's face.

*Context after (wiki's own words, not game text):* One day after an argument, this event will play and grant the item Rose Essence Oil. Placing the item inside Methinks will create a 0-day ritual, granting any gifted with the oil (including the Protagonist gifting it to himself!) +2 Charisma. / ==The Makeup Artist’s Visit==


## Master of Revels

Source: https://sultansgame.wiki.gg/wiki/Master_of_Revels

### 1. (page lead)

**In-game text (verbatim):**

>  The grand orgy you hosted rippled among men and women; during this time time, rumors and imaginations about the party were the hottest topic, making those who attended head over heels in pride and those who didn't continuously probing Buthayna about the next time... Underneath all this frenzy, Nabhani comes under your roof.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Master of Revels


## Metal Gear Solid: The Phantom Pain

Source: https://sultansgame.wiki.gg/wiki/Metal_Gear_Solid%3A_The_Phantom_Pain

### 1. (page lead)

**In-game text (verbatim):**

> At night, your body may rest, but a certain part of it clearly hasn't harmonized with the rest…

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Metal Gear Solid: The Phantom Pain


## Midnight Blade

Source: https://sultansgame.wiki.gg/wiki/Midnight_Blade

### 1. (page lead)

**In-game text (verbatim):**

> A vengeful specter roams at midnight… If left unchecked, his blade's victims will only multiply.

### 2. (page lead)

**In-game text (verbatim):**

> The Sword's Souls Under the Sword are increasing…
>
> You can dispatch a companion to investigate this issue.

*Context after (wiki's own words, not game text):* *If failed: Investigation fails, Souls Under the Sword gains an additional stack. Reaching the 9th stack causes this event to go away.  / *Successfully completing this ritual reveals that the Roaming Swordsman is responsible for several murders. Interrogating this man reveals he is seeking revenge a


## Nabhani

Source: https://sultansgame.wiki.gg/wiki/Nabhani

### 1. (page lead)

*Context before (wiki's own words, not game text):* |Opposition=1 / |Description= One of the four esteemed individuals granted the honor of serving as the Sultan's personal guard, permitted to bear arms in the Sultan's presence. The best swordsman in the capital, yet too handsome to guard the harem and too clever to serve in the army. Instead, he lin

**In-game text (verbatim):**

> Sigh! I'd rather go home and sleep than listen to these arguments from these grumpy scholars.

*Context after (wiki's own words, not game text):* Nabhani is the most skilled and beautiful fighter in Sultan's Champion. Despite being a playboy, he is kind in his own way, and has built genuine friendships with the city's semi-monde. / =Storyline=

### 2. An Interesting Incident

*Context before (wiki's own words, not game text):* ing a Sultan Card on one of the girls in the House of Delights. Using a Carnality or Extravagance card spawns the ritual [https://sultansgame.wiki.gg/wiki/Nabhani#An_Interesting_Incident An Interesting Incident], while using a Bloodshed card will have him challenge The Protagonist to a duel to the d

**In-game text (verbatim):**

> Nabhani - the most gorgeous swordsman in the capital, and the most adept user of his other sword come nighttime callings - knocks on your door.

*Context after (wiki's own words, not game text):* This event will spawn after using a Carnality or Extravagance card on one of the girls in the House of Delights. This event is not timed; you can do it at any point after it shows up. / {{Ritual

### 3. Someone is preparing to challenge you

*Context before (wiki's own words, not game text):* If you build the Cult Base, Nabhani will immediately find out about it and will cease being your follower. This can't be circumvented by recruiting him before building the base. It can work if you build the base after converting Nabhani, however you'll need to complete his story first. / ==Someone i

**In-game text (verbatim):**

> A prostitute was killed by you in the house of pleasure, and her lover, her confidant - and also the most dashing swordsman in the capital: Nabhani - is determined to avenge her.

*Context after (wiki's own words, not game text):* If the player uses a Bloodshed card on any of the girls in the House of Delights, Nabhani will be angered, starting the Someone is Preparing to Challenge You ritual. / {{MinorCard

### 4. Unreliable Ally

*Context before (wiki's own words, not game text):* After this event, Nabhani will lose all his Support for you and leave. His storyline ends. / ==Unreliable Ally==

**In-game text (verbatim):**

> Clearly in Nabhani's imagination, the Sultan's Game should be full of skirmish, sex, and scandals.

*Context after (wiki's own words, not game text):* From time to time, Nabhani becomes locked on this event. He can be brought back by promises of excitement, or he will return on his own after 7 days. / {{Ritual


## Naked Tea Party

Source: https://sultansgame.wiki.gg/wiki/Naked_Tea_Party

### 1. (page lead)

**In-game text (verbatim):**

> Various clues led you to a lavish mansion in the noble district

*Context after (wiki's own words, not game text):* This event will happen following Hunting the Slave Hunters. Riel has located another group of her barbarian sisters, this time serving as slaves in a mansion belonging to an unknown noble. This mansion is heavily guarded, and Riel can't extract her sisters on her own. So once again, she turns to The


## Natural Rebirth

Source: https://sultansgame.wiki.gg/wiki/Natural_Rebirth

### 1. (page lead)

**In-game text (verbatim):**

> Mahir is very angry with your suggestion, feeling it desecrates her great creation.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Natural Rebirth


## Nawfal

Source: https://sultansgame.wiki.gg/wiki/Nawfal

### 1. Political Opposition Subplot > Malicious Joke

*Context before (wiki's own words, not game text):* ===Malicious Joke=== / Malicious Joke continues the plotting: they have you pay for sleeping with that male prostitute, so their next actions can be covered by a fake rumor Nawfal did something stupid out of jealousy.

**In-game text (verbatim):**

> Upon setting foot in the Vizier's mansion, you hear his followers boasting about his achievements at the banquet. Seeing you arrive, he claps, summoning the male prostitute who flirted with Nawfal.
>
> "You came just in time, my lord. You could certainly accompany my next step-" He smirks, pushing the prostitute into your arms, "Please spend a night with him. We all know the Sultan's Game frustrates you; this is an excellent time for indulgence!"

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Malicious Joke


## Nobility's Support

Source: https://sultansgame.wiki.gg/wiki/Nobility%27s_Support

### 1. (page lead)

**In-game text (verbatim):**

> There are two concepts of guilt, one that comes from moral torment within, the other from the bindings of power and order, and in the Sultan's Game, you are immune to the latter.

*Context after (wiki's own words, not game text):* This ritual occurs after getting 3 stacks of Nobility's Support.  / {{Ritual


## Noble Hospitality

Source: https://sultansgame.wiki.gg/wiki/Noble_Hospitality

### 1. (page lead)

**In-game text (verbatim):**

> You must prepare thoroughly for The Sultan's visit. Ideally, you should distract him, bore him, prevent him from scrutinizing your operations here and return him to the palace as quickly as possible....

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Noble Hospitality


## Purist Order

Source: https://sultansgame.wiki.gg/wiki/Purist_Order

### 1. Receive Divine Grace

*Context before (wiki's own words, not game text):* ** The Book of Whispers / ==Receive Divine Grace==

**In-game text (verbatim):**

> Priests from the Purist Order can dispel evil and bestow blessings through special incantations... making recipients increasingly devoted to the Immaculate.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Receive Divine Grace

### 2. Receive Divine Grace

**In-game text (verbatim):**

> Curse removal requires 5 gold; blessings require 10 gold
> Money collected by the Order is generally non-refundable
>
> Each character may receive only one blessing
>
> After activating "A Glimpse of the Divine" in the Fate Shop, this event triggers additional storylines
> Only with the protagonist can Sultan Cards take effect, though not all cards can be broken immediately

*Context after (wiki's own words, not game text):* * If placing Nayla for the first time, she will gain the tag: Profane Pleasure and return your 5 Gold. / * If placing the Roaming Swordsman for the first time, he will start the ritual Invoking the Sacred Icon.

### 3. In the name of God

*Context before (wiki's own words, not game text):* ==In the name of God== / {{Hatnote| Not to be confused with the other event with the same name: In the Name of God}}

**In-game text (verbatim):**

> The High Priest of the Purists asks you to find and capture cultists operating secretly within the city.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Receive Divine Grace (This name is wrong)


## Regicide

Source: https://sultansgame.wiki.gg/wiki/Regicide

### 1. (page lead)

*Context before (wiki's own words, not game text):* This is an event that likely appears when you choose to investigate lineage in State Affairs. This will only occur if Infamy is greater than 5.

**In-game text (verbatim):**

> You walk down the street, and a filthy beggar recognizes you. He crawls towards you in madness, causing you to step back several paces in fear, only to see the remnants of luxurious embroidery on his tattered rags, long since obscured by blood, sweat, and mud... Below his knees is missing, so he can only crawl like a beast, begging... 
>
> Perhaps a few years ago, his status was far above yours, but now you cannot even recall which courtier he was who driven to madness by the Sultan's torment.
>
> Suddenly, he lunges at you, crying at your feet: "Kill the Sultan with the Cards, kill the Sultan with the Cards...!

*Context after (wiki's own words, not game text):* {{MinorCard / |title=Beggar


## Religious Leader's Privilege

Source: https://sultansgame.wiki.gg/wiki/Religious_Leader%27s_Privilege

### 1. (page lead)

*Context before (wiki's own words, not game text):* This event appears after The Protagonist becomes Hierophant.

**In-game text (verbatim):**

> Enjoy the reward that god grants their servant... though unwrapping it requires effort.

*Context after (wiki's own words, not game text):* {{MinorCard / |title=The True Faith's Vault


## Retainers

Source: https://sultansgame.wiki.gg/wiki/Retainers

### 1. Guesthouse Retainers

*Context before (wiki's own words, not game text):* =List of Retainers= / ==Guesthouse Retainers==

**In-game text:** *duplicate — the same quote is on the `Guesthouse` page (item 2, `Retainers`). Text not repeated; see there.*

*Context after (wiki's own words, not game text):* All of them have Unemployed tag while unemployed. / {| class="wikitable mw-collapsible"


## Riel

Source: https://sultansgame.wiki.gg/wiki/Riel

### 1. Running Slave > By Herself Route

*Context before (wiki's own words, not game text):* *Note that if you do this route and do not free Riel, the second path will not happen in that playthrough. Nabhani always ruins something... / ===By Herself Route===

**In-game text (verbatim):**

> You heard an insignificant rumor about a slave breaking free during a market transaction, killing his master and burning half the street...

*Context after (wiki's own words, not game text):* Another way is her own damn self. At some point (pretty late in, like 40 days?) you'll hear news in passing of a slave that escaped and caused a terrible mess in the market, even started a fire. What larks! But soon after, an injured woman shows up at your door! She is that runaway barbarian slave! 


## Righteous Path

Source: https://sultansgame.wiki.gg/wiki/Righteous_Path

### 1. Repeatable Events > Sacred Procession

*Context before (wiki's own words, not game text):* Repeatable events that give 1 Piety, last 3 days and require 3 followers each with 5 in a specific stat. These can occur simultaneously and overlap. For instance two instances of Sacred Procession at the same time. / ===Sacred Procession===

**In-game text (verbatim):**

> During major festivals, the Purist Order has representatives carry massive white stone statues through streets washed with flower-infused spring water. This requires considerable strength... Faith Shines First

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Sacred Procession

### 2. Repeatable Events > Library Organization

*Context before (wiki's own words, not game text):* The first character gains +1 Piety. / ===Library Organization===

**In-game text (verbatim):**

> The Order houses countless texts - doctrines, classics, and accumulated wisdom from religious leaders and high priests... Being frequently consulted by the faithful, organizing them proves challenging. Faith Shines First

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Library Organization


## Ritual of Inner Chambers

Source: https://sultansgame.wiki.gg/wiki/Ritual_of_Inner_Chambers

### 1. (page lead)

**In-game text (verbatim):**

> Inciting jealousy among women rather than resentment towards the masters, ensuring peace within the house. This is the fundamental purpose of this ritual, making masters more handsome and beautiful is just an added benefit.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Ritual of Inner Chambers


## Roaming Swordsman

Source: https://sultansgame.wiki.gg/wiki/Roaming_Swordsman

### 1. Invoking the Sacred Icon

*Context before (wiki's own words, not game text):* Trying to bless the Swordsman leads to him rather decisively refusing, as he is a worshipper of Star-Souled whose cult was banished by Immaculate Piety. He's got beef. Alternatively, if you try to convert him to the Cult, he will give you a Mask. Both of these lead to the following event:  / ==Invok

**In-game text (verbatim):**

> This broken sculpture depicts the Star-Souled God who ruled the Highland skies. In war, the heavens shattered and the statue lost half it's form, preserved only by blind faithful using sticks, straw, and mud. That it stands at all seems a genuine miracle.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Invoking the Sacred Icon

### 2. Talking About Princesses

*Context before (wiki's own words, not game text):* This triggers after upgrading the Guesthouse to an Adventurer's Tavern. / In the tavern, The Protagonist overhears an old mercenary discuss whether bedding princesses is different from bedding ordinary women with some other mercenaries.

**In-game text (verbatim):**

> An old mercenary often brags at the adventurers' tavern, claiming he once followed the previous Sultan in conquering this land, and was rewarded by sleeping with several princesses from the conquered realm. 
>
> "The taste was exquisite," he says, licking his lips. "Once you've tried it, ordinary women become meaningless." 
>
> Other mercenaries mock him - how different could a princess's private parts be? How big could the difference be? The old soldier argues loudly, insisting he's right. 
>
> They hope you'll settle this extremely vulgar dispute."

*Context after (wiki's own words, not game text):* *Princesses are indeed different: The old mercenary is mysteriously killed and the event Midnight Blade spawns a few turns later. / *All women are basically the same: The old mercenary still ends up dead, but nothing further happens.


## Royal Chef

Source: https://sultansgame.wiki.gg/wiki/Royal_Chef

### 1. (page lead)

**In-game text (verbatim):**

> "Do you think you deserve a better chef than The Royal Chef?" The Sultan suddenly asks before leaving your guesthouse...

*Context after (wiki's own words, not game text):* This seems to happen after entertaining the Sultan in the Noble Hospitality after serving one of Habib's dishes that the Sultan enjoys.  / {{Ritual


## Royal Interest

Source: https://sultansgame.wiki.gg/wiki/Royal_Interest

### 1. (page lead)

**In-game text (verbatim):**

> After a court session, a sweaty Courtier halts you, insisting there's crucial matters to discuss.

*Context after (wiki's own words, not game text):* A loose lipped courtier has revealed the existence of the Velvet Dark Room to The Sultan, and he has shown great interest in it. Now you have to decide how to deal with the situation. / {{MinorCard|title=Panicking Courtier


## Sacred Encounter

Source: https://sultansgame.wiki.gg/wiki/Sacred_Encounter

### 1. (page lead)

*Context before (wiki's own words, not game text):* This event occurs when you have The Creator and The Immaculate Piety

**In-game text (verbatim):**

> What a spectacle — two deities appear before you in succession...

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Sacred Encounter


## Sharp Glass Plains

Source: https://sultansgame.wiki.gg/wiki/Sharp_Glass_Plains

### 1. (page lead)

**In-game text (verbatim):**

> An unnatural place where grass grows sharp as razors and nights become bitterly cold. Legends tell of fallen Homeland royal ghosts wandering here. Perhaps treasures or secrets lie hidden.

*Context after (wiki's own words, not game text):* This event occurs after following the Roaming Swordsman's storyline and will unlock either The Frostveil Blade or The Ashen Blade depending on whether or not you put something/someone with sufficient Magic in the additional card slot (not the consumable slot). / {{Ritual


## Succubus Power

Source: https://sultansgame.wiki.gg/wiki/Succubus_Power

### 1. (page lead)

*Context before (wiki's own words, not game text):* This ritual appears after giving the Sultan a Grand Succubus in The Grand Game.

**In-game text (verbatim):**

> The Sultan is extremely pleased with the succubus you presented! He laughs heartily while patting your shoulder, erasing any previous tensions between sovereign and subject.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Succubus Power


## Sultan Cards

Source: https://sultansgame.wiki.gg/wiki/Sultan_Cards

### 1. (page lead)

**In-game text (verbatim):**

> Foul is the human if the lion eats it, making the lion human.

*Context after (wiki's own words, not game text):* Sultan Cards are magic cards that Sorceress brought to Sultan's court, which make the player commit acts of depravity - Bloodshed, Carnality, Extravagance and Conquest. The default deck has 7 cards of each type, for a total of 28. Breaking Sultan Cards is the central mechanic of Sultan's Game.  / Yo


## Sultan's Nipple Chains

Source: https://sultansgame.wiki.gg/wiki/Sultan%27s_Nipple_Chains

### 1. The Monarch's Weight

*Context before (wiki's own words, not game text):* Expanded content / Protagonist wears it

**In-game text (verbatim):**

> Wearing this constitutes clear presumption, 
> but how can you resist keeping such 
> amusing... and useful things buried in chests! 
>
>
> You resolve to personally bear this imperial anguisb 
>
>
> You take the fire-heated silver needle, grit 
> your teeth, close your eyes, and pierce your 
> own nipple. You keep telling yourself this pain 
> means nothing compared to slaughter, battle, 
> or... well, nothing. 
>
> However, when this heavy golden chain truly 
> presses, grips, and begins tearing yourskin,
> you realize this stabbing ache cannot heal, 
> knows no day or night, and permits no 
> escape. It grows with desire and ambition, 
> continuously stirring and disturbing every 
> sleepless dream henceforth.

*Context after (wiki's own words, not game text):* A noble wears it / {{Quote|

### 2. The Monarch's Weight

**In-game text (verbatim):**

> Wearing this constitutes clear presumption, 
> but how can you resist keeping such 
> amusing... and useful things buried in chests! 
>
>
> Unspeakable Secrets 
>
>
> Seeingthisnipple chain, [Name-noble] freezes 
> completely. He examines its details 
> repeatedly, then regards you with expressions 
> beydndyvords, utterly complex... 
>
> You exhaust y ourself persuading him about
> fashionability and benefits... For old 
> friendship's sake, he reluctantly agrees with 
> martyred expression, but absolutely refuses 
> your personal assistance. The next day when 
> you reach to verify he's wearing it and ask 
> about sensations, be firmly refuses 
> confession.

*Context after (wiki's own words, not game text):* A slave wears it / {{Quote|

### 3. The Monarch's Weight

**In-game text (verbatim):**

> Wearing this constitutes clear presumption, 
> but how can you resist keeping such 
> amusing... and useful things buried in chests! 
>
>
> Suit Him Perfectly 
>
>
> Slaves naturally cannot refuse your decisions
> - they must endure even agony. Fascinating,
> isn't it? With proper timing and conditions,
> why shouldn't royal items - even royal
> thrones - belong to base servants?

*Context after (wiki's own words, not game text):* ==Grand Game== / Wearing this to The Grand Game: The follower was killed. Influence -3. 

### 4. Grand Game

*Context before (wiki's own words, not game text):* Wearing this to The Grand Game: The follower was killed. Influence -3.  / Expanded content

**In-game text (verbatim):**

> Poor lmitation 
>
>
> [Name character]'s careless gesture exposed the secret upon his chest - a nipple chain identical to the Sultan's. 
> Before any entreaty could be voiced, his head
> fell amid the sovereign's eerie laughter.

*Context after (wiki's own words, not game text):* Bring this to Sultan: Gain The Sultan's Suspicion, Influence +3.  / Expanded content

### 5. Grand Game

*Context before (wiki's own words, not game text):* Bring this to Sultan: Gain The Sultan's Suspicion, Influence +3.  / Expanded content

**In-game text (verbatim):**

> Rightfully Yours 
>
>
> When silk was lifted to reveal your offering,
> the Sultan laughed peculiarly. After brief
> commendation, he gestured for its removal.
> The following day, you learned the Sultan's
> court jewelers had been executed - every 
> single one.

*Context after (wiki's own words, not game text):* Given that Protagonist is the only character that cannot be pulled to the Grand Game automatically, it is ideal to equip it to him. However, he will not longer be able to go to the Grand Game.  / ==Bathhouse Game==

### 6. Bathhouse Game

*Context before (wiki's own words, not game text):* Wearing this to News in the Bathhouse will attract some attention. Notoriety +1  / Expanded content

**In-game text (verbatim):**

> Wont FIoat 
>
>
> When [Name character] disrobed, that cursed familiar
> golden chain upon his chest drew furtive
> glances and averted eyes, spawning
> increasingly outrageous rumors that slowly
> dispersed in the steam.

*Context after (wiki's own words, not game text):* Category:Fate's Ledger Items Category:Sponsored


## Tempting Opportunity

Source: https://sultansgame.wiki.gg/wiki/Tempting_Opportunity

### 1. (page lead)

*Context before (wiki's own words, not game text):* Seems to occur once you've stolen Aether with Mahir and have a high level Righteous Path conviction.

**In-game text (verbatim):**

> With frequent thefts occurring, the Purist Order invites a faithful person of your reputation to guard the Sacred Light Source - their aether storage. 
>
> What a fortunate situation - like a mouse falling into a rice bin!

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Tempting Opportunity


## The Ancient Mirror

Source: https://sultansgame.wiki.gg/wiki/The_Ancient_Mirror

### 1. Recruiting

*Context before (wiki's own words, not game text):* To unlock The Ancient Mirror, you need to buy Glimpse of God from the Fate's Ledger for 40 Fate Points. / ==Recruiting==

**In-game text (verbatim):**

> The mysterious mirror-spirit could freely shift its form and gender... much like a reflection in glass, shaped only by what you showed it.

*Context after (wiki's own words, not game text):* A day after resolving Battle of the Mind I, (which happens when Insight is at least 1) The Uncanny Mirror appears: / ===The Uncanny Mirror===

### 2. Recruiting > The Uncanny Mirror

*Context before (wiki's own words, not game text):* A day after resolving Battle of the Mind I, (which happens when Insight is at least 1) The Uncanny Mirror appears: / ===The Uncanny Mirror===

**In-game text (verbatim):**

> That old warehouse-untouched for a decade-now hums with whispers and flickers with eerie blue light. Something stirs where nothing should. Take someone with you to see what stirs.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=The Uncanny Mirror


## The Ancient Mirror (Noble)

Source: https://sultansgame.wiki.gg/wiki/The_Ancient_Mirror_%28Noble%29

### 1. Event One

*Context before (wiki's own words, not game text):* ===Event One=== / Shortly after breaking a Conquest card, a text event will appear:

**In-game text (verbatim):**

> After exhausting every scheme to break this Conquest Card, you returned to your estate—only to find [xiaochou.name] waiting.\n[xiaochou.gender] lounged shamelessly in your hall, puffing on your finest hookah, commanding your servants. At [xiaochou.gender(His,Her)] side lay your prized illustrated tome, its pages gilded with mica. When you entered, [xiaochou.name] barely acknowledged you with a nod, not even bothering to rise. And your servants—kneeling to enter, kneeling to leave—acted as though this were perfectly natural to serve [xiaochou.name]! \"Conquest. You humans do love your petty games, don't you?\" [xiaochou.gender] exhaled a cloud of smoke, the scent of caramelized resin thick in the air. Suppressing your irritation, you took a seat opposite [xiaochou.gender[(Him,Her)]. \"Don't glower. I'm merely... sampling the noble experience. Power. Dominion. You humans seem addicted to such things.\" It leaned forward, eyes glinting. \"So, [player.name], let's speak of conquest. I watched your little performance through the mirror. Isn't destruction your favorite pastime? If there were but a drop of logic in your actions, a spoonful of reason—\" Facing that mocking grin, you muster a defense for human's folly...

*Context after (wiki's own words, not game text):* {| class="wikitable" / |+ 

### 2. Event Two

*Context before (wiki's own words, not game text):* ===Event Two=== / Shortly after breaking the second Conquest card, a text event will appear:

**In-game text (verbatim):**

> As you scrambled at the Conquest Card's relentless demands, [xiaochou.name] paid yet another visit. It strolled leisurely through your opulent halls, an aged servant dutifully recounting your house's history. When they reached you, the old servant bowed away, leaving [xiaochou.name] to study the trophies lining the walls. \"All noble houses have these, don't they?\" It traced a finger over your grandfather's silver shield. \"I've often glimpsed human's follies through these armors and shields. So you hang them as boasts—because they symbolize past conquests?\" You nodded, explaining these very triumphs secured your family's noble standing. \"How amusing. The powerful conquer to grow more powerful... Humans are both complicated and strangely consistent.\" [xiaochou.name] rapped the ancient, costly shield before turning to you. \"Tell me—what true merit lies in any of this?\" The creature now carried itself with more arrogance than a highborn noble—quick, find a retort sharp enough to match!",

*Context after (wiki's own words, not game text):* {| class="wikitable" / ! Choice

### 3. Event Three

*Context before (wiki's own words, not game text):* ===Event Three=== / Shortly after breaking the third Conquest card, a text event will appear:

**In-game text (verbatim):**

> Another Conquest Card snapped in your grasp... and not without cost. As you dragged your weary bones home, [xiaochou.name] greeted you with mocking grandeur—like a Vizier prostrating before a triumphant Sultan. You quickly dismissed the bewitched servants and hissed at [xiaochou.name] to cease such deadly jests.\n\"Even you understand, Master [player.name]—all things demand payment,\" It mused. \"So tell me, what is the cost of your conquests, of the cards you break and of this very game? Do human ever pause to count the cost... or do you simply charge ahead before you know it?\"\nYou loathe this tiresome reckoning. This time, you'll give [xiaochou.name] an answer sharp enough to cut that smirk away—

*Context after (wiki's own words, not game text):* {| class="wikitable" / |+""

### 4. Conclusion > Mirrorland

*Context before (wiki's own words, not game text):* The conclusion will be determined by all of the decisions made up until this point.  / ====Mirrorland====

**In-game text (verbatim):**

> The city had truly changed hands—[xiaochou.name] was now its master, and the Mirror named it “Mirrorlands”. 
>
> In time, emissaries from Mirrorlands arrived at the capital, bearing gratitude: at the very least, you had not made another enemy. Yet you sensed it clearly—as [xiaochou.name] gained recognized standing and tangible power in the mortal world, the bond, the pact, the constraint between you and the Mirror—whatever it had been—was gone. [xiaochou.name] was no longer a mirror-spirit awakened by [player.name]'s reflection. It had become part of this world.

*Context after (wiki's own words, not game text):* The Ancient Mirror is no longer a follower. He does return later in Change of Dynasty, but is otherwise no longer around.  / ====Human is Mirror====

### 5. Conclusion > The Crown of Mirror

*Context before (wiki's own words, not game text):* Ancient Mirror remains a follower and gains Wisdom +3, Sociability +3, Charisma +2, Combat +2, Stealth +1, Magic +1, Physique +1, Survival +1. / ====The Crown of Mirror====

**In-game text (verbatim):**

> "Arzu," The Ancient Mirror calls your name.
>
> "I must thank you, human. You've shown me things I've never known... But to be human—too loud, too cumbersome for me." As The Ancient Mirror speaks, its form begins to dissolve, fading. "Let me stay with you in a quieter way. My final gift. Prove yourself worthy of it—show me more wonders."
>
> In the dream, The Ancient Mirror scatters into dust of glass. When you jolt awake, a crown rests upon your brow—heavy as gold, smooth as a mirror, reflecting all around you.

*Context after (wiki's own words, not game text):* The Ancient Mirror becomes The Crown of Mirror.


## The Court

Source: https://sultansgame.wiki.gg/wiki/The_Court

### 1. Headless Dragons

**In-game text (verbatim):**

> The Sultan is like the Sun, projecting vast, distorted shadows named power when away from the court.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Headless Dragons


## The Full Confession

Source: https://sultansgame.wiki.gg/wiki/The_Full_Confession

### 1. (page lead)

**In-game text (verbatim):**

> Now the slave hunter is your prisoner. You tell him that if he doesn't provide valuable intelligence, you'll make him wish for death.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Come clean

### 2. (page lead)

*Context before (wiki's own words, not game text):* }} / This ritual requires no checks, and simply providing a follower will lead to its success.

**In-game text (verbatim):**

> The slave hunter crumbles instantly, tears streaming as words tumble out in desperate confession. He swears on his life he's withholding nothing. You're inclined to believe most of it.

*Context after (wiki's own words, not game text):* Successfully completing this ritual gives one more Clue to the Slave Hunters. / If you present all 3 Clue to the Slave Hunters you get 10 Gold Coins, Aether and gold Intelligence. Also if you don't already have Evidence of Abdul's Crimes, you get Evidence of Abdul's Crimes.

### 3. Follow Up

*Context before (wiki's own words, not game text):* ==Follow Up== / A few days later, Riel comes to you hungry.

**In-game text (verbatim):**

> You choose to believe he's told you everything he knows. Since he's useless now, Riel licks her lips and asks if she can now eat his liver. She's been waiting so long.

*Context after (wiki's own words, not game text):* *Just... handle it yourself, but be discreet: Riel Physique +2 / *Let him go, not worth it: Riel reluctantly agrees


## The Most Popular Man

Source: https://sultansgame.wiki.gg/wiki/The_Most_Popular_Man

### 1. (page lead)

**In-game text (verbatim):**

> After showing Nabhani a Carnality Card, he mysteriously told you to dress up well, and meet him at the House of Delights that day.

*Context after (wiki's own words, not game text):* {{MinorCard / |title=Masked Libertine


## The Protagonist

Source: https://sultansgame.wiki.gg/wiki/The_Protagonist

### 1. Tailor Shop

*Context before (wiki's own words, not game text):* == Tailor Shop == /  See main article: Tailor Shop

**In-game text (verbatim):**

> Oh! Master, your requirements are truly extensive... You shoulder... such burdens. I shall assist you to the utmost of my capabilities!

*Context after (wiki's own words, not game text):* The Protagonist, like any other follower, can have Malkina make an outfit for him for 5 Gold. / Effects: +1 to all Stats, +1 Reroll


## The Protagonist/Twin

Source: https://sultansgame.wiki.gg/wiki/The_Protagonist/Twin

### 1. Tailor Shop

*Context before (wiki's own words, not game text):* == Tailor Shop == /  See main article: Tailor Shop

**In-game text (verbatim):**

> ◆ That which is   not 
>
> Malkina evidently distinguishes between you two — though she consistently pretends otherwise. This proves remarkably amusing.

*Context after (wiki's own words, not game text):* The Twin, like any other follower, can have Malkina make an outfit for him for 5 Gold. / Effects: +2 to all Stats, +1 Reroll


## The Star's Contract

Source: https://sultansgame.wiki.gg/wiki/The_Star%27s_Contract

### 1. (page lead)

**In-game text (verbatim):**

> With seed to attract the Highlord... you could conduct your own ritual to summon Him. Whether dealing with abyssal demons or Star-Souled, such rituals share a core principle - trap the target, then negotiate.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Contract of the Star


## The Star-Souled

Source: https://sultansgame.wiki.gg/wiki/The_Star-Souled

### 1. Highland Highlord

**In-game text (verbatim):**

> At night, you dream of Lumera... She's returned to the Star-Souled's realm - turns out the Highland Highlord is her kin! 
>  When clouds obscure other stars and moonlight draws a veil of silence, she whispers the Highlord's secret in your ear: He is the North Star incarnate, one of the most powerful Star-Souleds... however, His longing for the days of human worship clouded His wisdom. \nLumera warns you, if the Highlord gains the Monarch's Seeds, he can fully revive in the mortal world with complete power - but this spells disaster for that mortal. 
>  Finally, as wind shifts the clouds and moonlight dims, stars twinkling again, she bids you farewell with a smile: Goodbye, master, I still miss those days reading books and eating preserved fruits by your bookshelf... Whatever difficulties you face, please don't give up. We watch your story from above - at the crucial moment, I'll do my best to help you.


## Thirst For Blood

Source: https://sultansgame.wiki.gg/wiki/Thirst_For_Blood

### 1. (page lead)

**In-game text (verbatim):**

> An unseen presence in your dreams craves more blood… endlessly, insatiably, more blood…

*Context after (wiki's own words, not game text):* Thirst For Blood is a ritual that can be generated as the result of a Random Events.  / {{Ritual


## Twin-Headed Ogre

Source: https://sultansgame.wiki.gg/wiki/Twin-Headed_Ogre

### 1. (page lead)

*Context before (wiki's own words, not game text):* Since it is a unique Follower that is also a Troop, it may be the only Troop that can utilize Equipment. / =Heartfelt Brotherhood=

**In-game text (verbatim):**

> Cultic Gods also possess humor, behold Their works! Such wonderful Brothers! Only problem is, what's "gaga"? Is this God-Demon language?"

*Context after (wiki's own words, not game text):* Be warned that any equipment on both brothers is LOST FOREVER IN THE RITUAL.  / The Twin-Headed Ogre is a unique Follower that doubles as a Troop. It is created after sending the Sand Pirate Brothers, Jemor and Hamar, to the Ritual Dark Gathering.


## Under the Sultan's Gaze

Source: https://sultansgame.wiki.gg/wiki/Under_the_Sultan%27s_Gaze

### 1. (page lead)

**In-game text (verbatim):**

>  The Rod of Life's fame grows...more and more of its rumors keep the Sultan vigilant, even restless at night.
>
> Finally, he asks you to demonstrate the fake phallus's power before him- Alas, the benevolent Sultan proposes that this glorious demonstration in the lapiz lazuli hall is worth breaking a Gold Carnality card, only if you draw it.

*Context after (wiki's own words, not game text):* <u>BE VERY CAREFUL WITH THIS EVENT AS IT CAN KILL YOU! / </u>


## Uprising Troops

Source: https://sultansgame.wiki.gg/wiki/Uprising_Troops

### 1. (page lead)

**In-game text (verbatim):**

> Vagrants, Barbarians, Nomads - those who unjustly lost family, friends, or kind - have gathered, angrily assembling outside the capital's walls, wielding sticks and swords, seeking vengeance on unreachable nobles.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=Rebel Army


## War of Faith and Reason

Source: https://sultansgame.wiki.gg/wiki/War_of_Faith_and_Reason

### 1. (page lead)

**In-game text (verbatim):**

> Badriyyah resolves to personally bestow Cultic God's gifts upon Lumera, showcasing its might and immortality.

*Context after (wiki's own words, not game text):* {{Ritual / |EventName=War of Faith and Reason

### 2. (page lead)

**In-game text (verbatim):**

> If you wish to halt everything, never let it begin.

*Context after (wiki's own words, not game text):* ==Description== / After trying and failing to recruit Lumera into the cult, Badriyyah is now attempting to succeed where The Protagonist failed. This goes just as well as the last attempt, with Lumera being unimpressed at the arguments Badriyyah uses, and Badriyyah, like The Protagonist, being unabl

### 3. Description

*Context before (wiki's own words, not game text):* Note: spoilers from this point on! {{spoiler|This is a duel to the death.Whomever it is that you want to come out on top of this confrontation, make sure that her stats are as high as possible, while ensuring that their opponent's stats are as low as possible. / If you don't want either of them dyin

**In-game text (verbatim):**

>  Interdimensional gates ripped open, a fearsome creature is compelled to charge at Lumera.

*Context after (wiki's own words, not game text):* ==Success== / Badriyyah is killed.


## Weapon Enchantment Ritual Blueprint

Source: https://sultansgame.wiki.gg/wiki/Weapon_Enchantment_Ritual_Blueprint

### 1. Weapon Enchantment Ritual

**In-game text (verbatim):**

> Forge Steel with Soul, Quench Sword with Blood

*Context after (wiki's own words, not game text):* It requires a character with the Black Art tag to function as the ritual's conductor, a weapon to be enchanted, and a character as a sacrifice to power the ritual. / This ritual attaches the sacrificed character to the weapon, adding this character's stats to the stats of the weapon. It adds the Fle


## Your Game

Source: https://sultansgame.wiki.gg/wiki/Your_Game

### 1. (page lead)

**In-game text (verbatim):**

>  This is your game, you control the guest list, indulge in pleasures, savor every moment- provided the Sultan isn't present.

*Context after (wiki's own words, not game text):* This event occurs after Preparing for the Game or I, Freeloader. / {{Ritual


## Zaki

Source: https://sultansgame.wiki.gg/wiki/Zaki

### 1. First Education

**In-game text (verbatim):**

> Zaki hopes to learn martial arts from you to protect his mother.

*Context after (wiki's own words, not game text):* You are presented with multiple ways to guide Zaki’s future. Whether through honorable training or morally dubious paths, your choices shape his fate. / === Martial Arts Instruction===

### 2. Learning Sociability

*Context before (wiki's own words, not game text):* * 0–2 successes: Zaki is Injured, Physique +1 / == Learning Sociability ==

**In-game text (verbatim):**

> Zaki saw you argue with ministers, and wants to improve his social skills to help his mother.

*Context after (wiki's own words, not game text):* Your interactions in public life have inspired Zaki to pursue social finesse. Guide him through the proper — or improper — channels of communication. / === Communication in the Court ===

### 3. Final Lesson

*Context before (wiki's own words, not game text):* * More than 3 successes: Sociability +2, Charisma +3 / == Final Lesson ==

**In-game text (verbatim):**

> Now he regards you as his mentor for life. He asks you where you go for answers when you have questions.

*Context after (wiki's own words, not game text):* Zaki now looks to you for deeper understanding — of life, the world, and the self. Where you guide him next will shape his values. / === To the Bookstore ===

### 4. Admiration of the Young Noble > Entangled in Scandal

*Context before (wiki's own words, not game text):* =Tailor Shop= /  See main article: Tailor Shop

**In-game text (verbatim):**

> Zaki perpetually strived to appear mature, while Malkina taught him instead to embrace and leverage his youthful advantages.

*Context after (wiki's own words, not game text):* Zaki, like every other follower, can have Malkina make an outfit for him for 5 Gold. / Effects: +3 Stealth; +2 Wisdom


## Zazie

Source: https://sultansgame.wiki.gg/wiki/Zazie

### 1. Bookstore Encounter

*Context before (wiki's own words, not game text):* *I can handle it better: Gains The Monarch's Seed / =Zazie's Nightmare=

**In-game text (verbatim):**

> The Highlord torments Zazie nightly, each dream more terrifying than the last. You have methods to temporarily soothe the god's demands, easing her suffering. Other approaches might eliminate the problem entirely.

*Context after (wiki's own words, not game text):* {{hatnote|Will put this where it belongs as this page gets updated: Highlord of the Highlands}} / If you agree to help her plans, Zazie's Token will spawn, and it has a time limit of 15 days.

### 2. A More Terrible God

*Context before (wiki's own words, not game text):* This pathway occurs if you place The Monarch's Seed into eliminate the Highlord. / ==A More Terrible God==

**In-game text (verbatim):**

> Knowing how to defeat a god. In an intimate encounter, revealing to Zazie's deity the god inside your heart—desire, ambition, and fear mere links among them. Compared to your illusion, the Highlord seemed weak—a dim star—how long since it drank mortal's dreams? No surprise it pressured Zazie so. Embracing, entering Zazie, the god inside you pursues through her soul, consuming the weakened astral spirit. That night, under twinkling stars, thunder roared over clear skies, causing roses throughout the capital to wither, former dynasty loyalists dying from nightmarish fright, Polaris dimming substantially. Afterwards, Zazie curious, felt on your chest—half doubting her curse's resolution—realizing your harsher torment... After pledging rewards and assistance, she fled in anxiety."

*Context after (wiki's own words, not game text):* This pathway occurs if you place a Level 3 or 4 God Card (The Immaculate Piety, The Destroyer, The Creator, or The Creeping Rot) / Outcome: Lose Zazie's Token; Triggers Zazie's Gift.

### 3. God-Hunting

**In-game text (verbatim):**

> Badriyyah's eyes ignite with excitement at your words. \n\"The Highlord of the Highlands! For millennia He ruled as supreme god before the Purists drove Him away. I knew He would seek return... What if we summon Him only to destroy Him?\" \n...Deicide? \nYou hesitate momentarily. \"Don't falter now,\" she urges with growing intensity. \"The Highlord is merely a Star-Souled - an exceptionally powerful star, yes, but still just a star! No one knows which precisely. My masters in the darkness will aid us in this hunt. Imagine the power we could extract from His pretentious skull... The Master will reward us generously, perhaps even hasten His coming!\"",

*Context after (wiki's own words, not game text):* This pathway occurs if you place Badriyyah into eliminate the Highlord. She suggests you should slay the god instead. / ==Star-Burning==

### 4. Star-Burning

**In-game text (verbatim):**

> Iman raises a skeptical eyebrow as he examines you. \n\"You claim the Highlord has infiltrated the Sultan's harem? Ah... those ancient rose gardens that recently bloomed - now it makes sense. The Purist and his faithful will cleanse this false god with all our strength; it is our sacred duty.\" \nWhen you inquire about purifying something so intangible, he explains: \"Each Star-Souled corresponds to a specific star. By tracking its earthly manifestations, we can calculate its celestial position. Once located, the God of Immaculate Purity himself will cleanse this wayward star with divine flame. \n\"You find yourself wondering how many celestial entities the Purists have blocked from reaching our world through such methods, but... Iman's expression makes it clear he has no desire to discuss the matter further.

*Context after (wiki's own words, not game text):* This pathway occurs if you place Iman into eliminate the Highlord. He suggests you let God of Immaculate Purity handle it himself. / ==Lord's Ambition==

### 5. Lord's Ambition

*Context before (wiki's own words, not game text):* This pathway occurs if you place Iman into eliminate the Highlord. He suggests you let God of Immaculate Purity handle it himself. / ==Lord's Ambition==

**In-game text (verbatim):**

> The Testament to Bygone Oaths works like a balm on the agitated god, rekindling memories of Their golden age when countless worshippers knelt before Him. Human devotion and desire act like an intoxicating poison to divine beings - destructive yet irresistibly addictive. \nThe Highlord now ceases tormenting Zazie, willing to wait for the grand feast you've promised Him. \nForget the Sultan's precious seed! In her gratitude, Zazie has eagerly offered a more private tribute of your own essence... Who knows? Perhaps these seeds will one day grow into something royal.

*Context after (wiki's own words, not game text):* This pathway occurs if you place a Gold-Tier Testament to Bygone Oaths. Lose Zazie's Token; Gain Belief in the Stars; triggers Zazie's Gift. / ==A Scientific Solution==

### 6. A Scientific Solution

*Context before (wiki's own words, not game text):* Note that it's possible to destroy the Highlord's Effigy this way even before using a Carnality Card on Zazie! She will still thank the protagonist as usual for ridding her of her nightmares. / =Zazie's Gift=

**In-game text (verbatim):**

> Zazie sends someone to find you. Besides bringing gifts, she also brings a promise: \"As long as I'm beside the Sultan, I'll find ways to eliminate The Sultan's Suspicion

*Context after (wiki's own words, not game text):* Outcome: Zazie gives you 50 Gold Coins, Influence +2, and Zazie Support +2. You can also break The Sultan's Suspicion at The Grand Game if Zazie is present. / =Golden Experience=


## Zephyr

Source: https://sultansgame.wiki.gg/wiki/Zephyr

### 1. (page lead)

*Context before (wiki's own words, not game text):* =Tailor Shop= /  See main article: Tailor Shop

**In-game text (verbatim):**

> Malkina created a distinctive hairstyle and neckerchief for Zephyr, ensuring he would be instantly recognizable from great distances as Arzu's personal messenger.

*Context after (wiki's own words, not game text):* Zephyr, like every other follower, can have Malkina make an outfit for him for 5 Gold. / Effects: +2 Physique; +2 Charisma; +2 Survival


---

# PART 2 — Verbatim official English: card / item / character blurbs

These are the `Description=` values of the wiki's card infoboxes — the short flavour
line printed on the card in game. 738 of them. Format: `**Card name** — text`.

- **"Gold Coin"** — To most people, these coins are indistinguishable from real gold-so for all practical purposes, they are as good as the real thing.
- **A Challenge in Verse** — After reading this poem, you gain Combat +1, Stealth +1, Charisma +1.
- **A Consort's Resolve** — A small, court-pattern dagger—an emblem the sultan gifted favored consorts, reminding them to guard their chastity with their lives.
- **A Cut Rope** — May we break free from our bindings, you and I both. Looking at it, recalling the words shared and interrogation answered, even the most troubled mind will find peace in the storm.
- **A Game of Marbles** — A fantasy novel about a meritocratic nation, where the only measurement of merit is how well one plays marbles. The better one plays, the higher one climbs... You remember playing marbles as a child. After reading this book, you gain Magic +1 and Wisdom +1.
- **A Guide to Palace Etiquette** — After reading this book, you gain Sociability +2.
- **A Jar of Candied Fruits** — A jar of men's exclusive preserves. With this, stop snatching Maggie's share.
- **A Large Bouquet** — Here, fresh flowers in bloom are themselves a synonym of wealth and influence.
- **A Mercenary's Journal** — Books filled with the adventures of mercenarires. After reading this book, you gain Physique +1, Survival +1, Combat +1.
- **A Song of Two Moons** — Poem penned by Hasan, inspired by Little Moon, the little dog. After reading this book, you gain an extra Equipment slot for equipping a pet.
- **Abdul** — Everything Abdul enjoys as a vizier - wealth, status, privileges - stems from his diligesnt service to his master. He is the sharpest blade in the Sultan's arsenal and the court's most eager jester.
- **Abomination Summoning Ritual** — An evil ritual blueprint detailing a ritual to summon an abomination.
- **Absurd Joy** — Witnessed by the Sultan's game, sacred images seen in traces of debauchery... these are devotees kneeling before the true god.
- **Abyssal Offering** — Neither of life nor death, brimming with arcane secrets and raw power... a delicacy that even gods covet.
- **Adila** — She refuses to walk the path her family chose for her and wishes to prove herself through combat. A girl with a pure heart, admirable in her folly.
- **Adila** — At a banquet, Adila spoke of the legend that her family had once slain a dragon and the curse laid upon them by the vengeful beast... Perhaps someone might find interest in such rumors.
- **Adila** — A book passed down through Adila's family, said to hold secrets about the dragonkind.
- **Adila's Sword** — Adila's sword, meticulously cared for, yet still bearing the marks of countless bloodshed and battles.
- **Advantage** — This means he's started spending money to deal with you.
- **Aerial Reconnaissance** — With the Hot Air Balloon, you are able to chart the local landscape. This will come in handy.
- **Aether** — To the Purist Order, aether is the divine ichor spilled by their god to heal the world. It is sacred beyond measure. But of course, to any magic practicioners, it is something else: raw, living magic, potent and pure.
- **Aged Consort** — Strictly speaking, she is the Sultan's elder sister. But for those of royal blood, this is hardly an unusual arrangement. It is said that she slipped her father and brothers' battle plans to the Sultan... thus earning her place at the ruler's side, to share in his glory and victory.
- **Alchemical Bomb** — Once ignited, its power can send an entire house flying.
- **Alim** — He might have picked your pocket before, but you cannot remember his face for the life of you. In the blink of an eye, he is gone, just another face in the crowd.
- **Alim** — As you step into the study, a dark figure scrambles out the window in panic
- **Alim** — The entrance to the beggar's den. White-Belly reinforced it with scraps of wood and iron.
- **Alim** — A crude wooden whistle made by Hemir himself.
- **Alim's Followers** — These little thieves running about, some are quite skilled at their craft.
- **All-Seeing Eye** — He deems every character in his narrative a fool, yet true wisdom eludes his pen.
- **Alley Jackals** — Hooligans from the Jackals, now under Riel's rule. Oh well, no matter who the boss is, life goes on.
- **Alliterative Abuse** — After reading this poem, you gain Combat +1.
- **Amber Pendant** — Faraj's gift. If the sun could weep, this amber would be its tear.
- **Ambiguities** — A treatise on the archaic cults and journeys of the spirit-curiously, legible only to you.
- **Amulet of Wind** — Amulet of Wind, place into Methinks to summon a tornado, usable three times.
- **Amur** — He handles lawsuits between commoners. Many respect him, but more fear him.
- **An Immortal's Kiss** — A strange book. Its pages are empty but for the tiny burnt holes. If you align the holes, the pages curl into strange shapes... Codes left behind by occultists of yore, perhaps. After reading this book, you gain Stealth +1 and Magic +1. You need at least 4 in Wisdom to read it.
- **Ancient Ring** — An ancient ring that has seen the death of mountians, and the rising of fertile fields from where there once was a sea.
- **Anita** — A girl entrusted to you by a dying elder; diligent, literate, and seemingly gifted in medicine.
- **Ansuya** — A tribe once implored the Sultan for protection from its neighbors' raids. The Sultan graciously received its gift of its princess and deployed his Iron army to march on the tribe, conquering it before its neighbors could. The princess who lost everything saw through the Sultan's capriciousness and never would she again place her hopes in him. The Sultan soon tired of this frigid consort. She is forgotten in a quiet corner of the harem. In silence, she wilts.
- **Anything Wrap** — Convenient and nutritious, just what you need in a rush.
- **Armlet of Faded Honor** — Warriors of the tribe commemorated each victory with an additional loop of gold thread. The threads twisted and the loops were many, only to snap at last. The tribe, too, perished.
- **Army's Support** — For the army sworn to protect the Sultan to remain neutral, that is already the greatest support to you.
- **Arumina** — The prideful and willful Arumina is the light of Jawad's life.
- **Arzuna** — You have seen this face before - one that bears a resemblance to your own - but only in your father's will. And now, the dancer stands before you in the flesh. Her beauty is excessive, no doubt an inheritance from the woman who seduced your father. The likeness between you is faint, lingering only in the arch of her brows, the shape of her eyes.
- **As You Wish** — Your neighbor's wife, oft abused by her husband.
- **As You Wish** — Your neighbor, a fallen noble. The sounds of violent quarrels and a woman's helpless cries can often be heard from his home.
- **Asal** — His ancestors were once chroniclers for another king. It is said he remembers every book he read, allowing him to sell them without any qualms.
- **Asal** — Names of those devoured by the Lord of the Revels. Call them at the right moment to weaken that being.
- **Astounding Sarcasm** — After reading this poem, you gain Combat +1, Stealth +1, Charisma +1, Sociability+1.
- **Ava's Diary** — After reading this book, you gain Sociability +3.
- **Aziz** — A robust male slave responsible for various heavy labor tasks in your household.
- **Aziz** — When you picked it up, you did not think it would be such a handy weapon.
- **Aziz's Gauntlets** — A pair of boxing gloves forged in fire, and quenched in blood.
- **Azure Scarf** — A scarf Jenna made from the elegant blue gauze, its flowing light reminiscent of endless sea waves - halcyon, carefree, carrying all your worries away.
- **Badriyyah** — The path to transcendence is revealed, not unearthed. And thus, all who delve into the arcane or divine might be branded occultists — at least in theory. But you know this woman to be something else. Beneath her tattooed skin coils an alluring darkness...
- **Baneful Toads** — When a mind sinks into filth, its thoughts become their tadpoles.
- **Barbarian Uprising** — A barbarian host gathers towards the capital, scimitars raised high beneath the darkening sky.
- **Bath VIP Card** — Wow, you and your wife really love to bathe. The balance on this card could last a lifetime - especially if your game ends poorly. Use the card to bathe for free. It also allows non-noble allies to bathe.
- **Battles at Night** — After reading this book, you gain Combat +3 and Stealth +2. You need at least 3 in Wisdom to read it.
- **Beauty Ointment** — A salve Maggie prepared for Adila, with a spare casually handed to you. For scar removal, she says... Such a convenient thing, why was it not offered sooner? Gives +1 Charisma to a Follower when used.
- **Behind the Veil of Sand** — The tale of a pilgrim's journey through the desert. First time reading this book grants you Wisdom +1. Reading it triggers the Boundless Sands adventure.
- **Belief in the Stars** — One of this land's oldest beliefs; the stars above are often unwilling to remain mere observers and frequently cannot resist interfering in human stories...
- **Betrayed Friend** — A friedn bound, awaiting your decision in despair.
- **Bharat** — A merchant of exotic goods, currently renting a shop under your name. It is said that before coming to this city, he had journeyed through the desert and visited many a distant land. Children flock to him for his tales of long forgotten mysteries. Yet, when asked about his past, he would only say that he is a man without a home.
- **Bharat** — The hired hand who is responsible for the operation of the store and payment of rents when Bharat is away.
- **Big Bomb** — A big bomb lovingly crafted by Mahir. Powerful enough to blow through city walls with ease.
- **Black Crystal Mask** — An alluringly mysterious mask. when looking through it, its wearer occasionally experiences strange visions...
- **Blade Winds** — The nomads found and rescued by you and Riel, skilled in horseback combat, coming and going like the wind.
- **Blade of the Ancient Kingdom** — After the downfall of the Highlander royalty, many merchants sell counterfeit royal swords claiming they are genuine... Nonetheless, this is still a sharp blade that cuts through Iron like Water.
- **Blessing of Harvest** — An ancient blessing, can be placed in managing the estate to increase gold coin production.
- **Blind Allegiance** — To follow without question is the gravest betrayal of one's master.
- **Blind Dog** — It needs no eyes to seize your neck.
- **Blood Drop Earrings** — Earrings made from an enormous ruby. When light hits it, you can almost see blood coursing within.
- **Blood of Mercury** — After reading this book, you gain Physique +3. You need at least 1 point of Magic to read it.
- **Blood of the Longhorn Beetle** — This ancient text preserves a prmordial legend: somewhere in the mountain heights, a deity once wielded mysterious power to restore their beloved to life. First reading grants Physique +1 and unlocks the Mountain Depths adventure.
- **Bloodstained Diamond Pit** — Every diamond mined from this place is soaked with human blood.
- **Bloodstained Diamond Pit** — This person has no other choice but to toil in the pit for you until death.
- **Bloody Oasis** — You need not care whether they are innocent.
- **Blue Turban Army** — They all wear a blue scarf, be it from Habunah's shop, or made from the most common fabric. They support you. They support freedom.
- **Blueprint of Revolution** — Hazy visions born from you and Nawfal, this idea is a dream-forged blade - pure, sharp, ephemeral, fragile... Yet incomplete, but should you find a vessel for it in the waking world, it will rend heaven and earth, ushering in a brilliant, new dawn.
- **Bonum in se?** — Gods do not possess more patience than the mortal men.
- **Bonum in se?** — Tormentors of souls in purgatory once; now the mortal realm welcomes these demons with open arms.
- **Book Rental Club Card** — The Bookstore Owner only gives Bookshop Loyalty Cards to true book lovers - just return the book after reading. Use this card to buy books at the Bookstore for free.
- **Book of Dragonslaying** — A book passed down through Adila's family, said to hold secrets about the dragonkind.
- **Book of Enlightenment** — Unlocking the palace of wisdom through the simplest language. After reading it, you get +1 Wisdom.
- **Book of the Desert** — After reading this book, you gain Survival +3. You need at least 1 point of Magic to read it.
- **Book of the Wild** — Those who dwell in the wilderness survive only by surrendering their fate to nature. It contains many recipes utilizing the simplest ingredients. After reading this book, you gain Survival +3.
- **Bouquet of Enchantment** — These blossoms carry the same subtle intoxicant as Badriyyah's tattoo ink—both induce gentle hallucinations.
- **Braided Headband** — Apparently it improves concentration. Or at least it makes you look smart.
- **Breath of the Ancients** — After reading this book, you gain Physique +3. You need at least 3 in Wisdom to read it.
- **Broken Gold Sword** — Broken by war, yet still yearns to be wielded.
- **Brutal Fight** — This Giant, tormented for ages, couldn't quell its wrath.
- **Brutal Fight** — The fierce and cruel lion hungers only for blood.
- **Brutal Fight** — The prisoner sentenced to death. The Sultan has promised him freedom, if he survives the duel.
- **Brutal Fight** — A pack of wild dogs that have gone unfed for days are predictably vicious.
- **Builder's Guide** — A compendium of blueprints from the Old Kingdom, used in the construction of the royal palace. Who knows what secrets lie within its pages? After reading this book, you gain Survival +1, Wisdom +1.
- **Bureaucracy** — After reading this book, you gain Sociability +2.
- **Cactus Cake** — Soft, sweet layers wrapped around a delicate filling, carrying the unmistakable fragrance of cactus fruit.
- **Calling the Dishes** — An old poet reels of every beloved homestyle dish he's eaten - practically a rhymed recipe list.
- **Cape of Spring** — A cape with golden embroidered scenes of coitus, unsuitable for any respectable social occasion.
- **Cape of an Ancient Weave** — This ancient fabric of meticulously woven silk once featured the profile of an ancient deity. However, the creator of the cloak deliberately severed the deity's head, leaving only the majestic body. Perhaps this was done to avoid drawing attention from the Sultan and the clergy to the wearer, or perhaps it was born of a deeper, more personal hatred for the deity itself.
- **Capital Dojo Conquest Battle** — A warrior incited by Nabhani to challenge you. He has a well honed body – it would be better if he is clothed.
- **Captured Cultist** — As her limbs go numb, she lets out a moan from the depths of her throat, a sound that makes your legs weak...
- **Captured Heretic** — Cultists who worship the Stone Deity have been captured by you.
- **Caravan Raid** — You need not care whether they are innocent.
- **Caravan's Accessory** — An accessory favored by nobles.
- **Carefully Compounded Wound Salves** — A salve mixed by Court Physician Samir.
- **Carnality (Painting)** — A painting vividly depicting carnal desire. Someone must really like it.
- **Chainmail** — Chainmail masterfully crafted by artisans, impervious to arrows.
- **Challenges are Ever-Present** — You are not the Sultan. There will be those who refuse to overlook your misdeeds.
- **Change of Dynasty** — You must rally your troops before the Sultan reacts.
- **Change of Dynasty** — The interplay of light and shadow magnifies the man on the trone into something great, inscrutable, terrifying.
- **Chariot Necklace** — Generals wear such heavy necklaces to war. If they do not return, their chariots will be buried with them.
- **Charming Amulet** — The Character equipped with this accessory needs only attend The Grand Game once per week to ensure the Sultan's approval.
- **Charred Armor** — Armor destroyed by dragon's breath. The metal was melted in blazing flames and cast with scorching blood, resulting in this charred, shapeless thing.
- **Charted Oasis** — The oasis you and Minal discovered, its coordinates now clearly marked on Minal's map. The residents of there are eager to trade with you. Placing this card into Managing the Estate will yield additional gains.
- **Chieftain's Blessing** — It bears the blessing of the gods the barbarians revere.
- **China** — Minal has found a paradise beyond Sultan's control. It is powerful, wealthy, and peaceful. For the first time in a long while, she saw genuine smiles on people's faces. If you wish to escape the Sultan's Game for good, this is your best choice. Keep this secret from the Sultan.
- **Classic Terrace Buffet** — Platters of fresh fruit and sugared delicacies, arranged with deliberate artistry. Sweet as lovers gazing into each other's eyes.
- **Classical Wrestling** — After reading this book, you gain Combat +1 and Physique +1. You need at least 2 in Wisdom to read it.
- **Clay Key** — It is not an actual entity, but a key seared into your soul, one that grants access to a promised land.
- **Cleanse the Heretics** — They are the most devout followers of the Purist, always fighting for their faith.
- **Cleanse the Heretics** — In the name of God, he can slaughter at will.
- **Cleanse the Heretics** — Those masses who have nothing, and therefore fear no gods or demons.
- **Cloak of Hundred Watchers** — Never again fear an attack from behind—though the cruel irony is you'll never stop looking over your shoulder anyway.
- **Clue to the Slave Hunters** — Clues to the Slave Hunters, usable in methinks.
- **Collection of Dialectics** — After reading this book, you gain Wisdom +1. You need at least 3 in Wisdom to read it.
- **Commoner's Support** — When the common people side with you, you gain eyes and ears everywhere.
- **Compound Bow** — Compound bow made with wood and bone, more powerful than the average longbow.
- **Computations of Squares and Circles** — After reading this book, you gain Wisdom +2. You need at least 3 in Wisdom to read it.
- **Confused Learning Machine** — A failed invention by Mahir. It does nothing, save for making your hair stand on end.
- **Cooperative Dragonslaying Route** — The severed Fire Dragon’s head, its dim eyes seem to still gaze upon this world.
- **Corrupt Officials** — Corrupt officials in the Sultan's court. They have long been colluding with Jawad, causing rampant bribery.
- **Court incense** — A coveted palace incense in high demand. A consumable that aids estate management.
- **Crank Chainsword** — A failed invention by Mahir. Its power is questionable, but cranking it for long enough might just kill you instead.
- **Criminal Evidence** — A damning piece of evidence that will lead you to your inevitable reckoning.
- **Crown of Morning Dews** — Pearls so full and bright, they gleam like morning dews. Nothing gold can stay, unless someone treasures it with all their heart.
- **Crown of the Monarch** — What remained after the Gold Conquest card was consumed by Heaven's fire, only a true monarch chosen by all beings can wear this crown, otherwise, it is an invisible shackle.
- **Crystal Dagger** — A thin layer of blue glaze covers the blade. Those who fall victim to its sharpness oft mistake it for crystal.
- **Crystal Lens** — A failed product developed by Mahir, but at least wearing it on the bridge of your nose can make you look knowledgeable and charming.
- **Cult Follower** — Souls lured by honeyed words, blood-soaked rituals, and fevered visions of carnal paradise.
- **Cults and Occult Ways** — After reading this book, you gain Charisma +2 and Magic +1. You need at least 4 in Wisdom to read it.
- **Cults and the Occult Ways** — After reading this book, you gain Charisma +2 and Magic +1. You need at least 4 in Wisdom to read it.
- **Curious Ghazal** — After reading this poem, you gain Charisma +1.
- **Cursed** — Hard lumps under the skin. Fleeting shadows out of the corner of the eyes. Sharp cries from empty street corners. The effulgent fluid you wake up with every morn, dripping down from your lips.
- **Dagger** — A slightly worn dagger, barely usable as a weapon.
- **Dagger for Oneself** — What remained after the Gold Bloodshed card was consumed by Heaven's fire, only when one chooses death in fulfillment of their heartfelt desire does the blood flow with such noble red.
- **Dagger of Chaste** — Every princess of the lost kingdom would receive a curved dagger upon her coming of age. If her purity is under threat, she should use it to end her life. The truth remains that it is mostly used to pierce the offender's throat.
- **Dagger of Purity** — This beautiful ruin, these pure ashes...
- **Daggers and Scimitars** — After reading this book, you gain Combat +1.
- **Dark Alley Dough** — Hemir's dough paste: unremarkable in taste, but stubbornly filling.
- **Dark Alley Warrior Campaign** — A warrior from the Dark Alley. He will defeat you to prove who's boss.
- **Dark Fantasies** — This treasure was generously sponsored by wzj. Part of the Dungeon Lord's regalia - after indulging in carnality and conquest, tempered by warning, praise, and mercy, the deep philosophical darkness within gradually stirs to life.
- **Dark Side of the Moon** — A mad moon gazes upon the earth.
- **Dark Sword** — Black magic is also a kind of weapon. As with any weapon, what matters is who wields it.
- **Delicate Gold Earrings** — For a noble lady, to leave the house without jewelry amounts to the same as running around naked.
- **Desperate Housewives** — You only know their labels they carry now, and nothing of their past.
- **Diamond Gloves** — The jeweler's intention was extravagance. But the gloves' sturdiness far exceeds it's beauty.
- **Dignity** — After reading this book, you gain Sociability +1.
- **Disaster from Nowhere** — Witnessed by the Sultan's game, sacred images seen in shattered skulls and splattered blood... this is the crown that reigns over the earth.
- **Disaster from Nowhere** — A monster summoned by Cultists, now conquering, or rather, trampling your domain.
- **Distant Oasis** — This is an untainted land, untouched by human corruption; no magic, royal authority, divinity, law, or even desire has ever reached this place.
- **Divine Intervention** — Is not the author supreme within their creation? Why then does the ending slip through their fingers?
- **Divine Patience** — Gods do not possess more patience than the mortal man.
- **Divine Summoning** — Those masses who have nothing, and therefore fear no gods or demons.
- **Do Not Stare at the Stars** — A strange book. The entire book consists of a single sentence, repeated over and over and over again. "Do not stare at the stars." From how the book is bound, it must be old – perhaps from the era when the Star-souled were still widely worshiped? After reading this book, you gain Magic +3 and Insight +1.
- **Dog Skin** — After reading this book, you gain Stealth +3. You need at least 1 point of Magic to read it.
- **Double Dragon** — A novel weapon born from an accident, still marked by the fights it had seen.
- **Double Headed Dragon** — An unambiguous sex toy. It may lead to increased enjoyment when used in the right context, but might be disastrous if brought out in the wrong one.
- **Draconic Dialogue** — You conversed with a dragon, once upon a dream.
- **Dragon's Eye** — Trophy brought back by the dragonslayers, this eyeball is like an indestructible gem, burning with a wrath that can turn worlds to dust. It is not of this world, just as slaying a dragon is no mortal task.
- **Dragonscale Armor** — Armor made from Fire Dragon Scales, invulnerable.
- **Dragonscale Blade** — Sword crafted from Fire Dragon's scales. It cuts through iron like clay.
- **Dragonscale Helm** — Helmet crafted from Fire Dragon's scales. Commanding.
- **Dragonscale Shield** — A shield made from Fire Dragon Scales, as solid as a rock.
- **Dragonslaying Supplies** — Dragonslaying is not just the glorious moment of lifting the blade before the great beast. It is a long and arduous process, requiring much strength, faith, supplies, and gold.
- **Dreamer's Necklace** — The tribe's seer would search for water sources and oases in dreams. One day, she saw the Sultan's empire.
- **Dried Flowers** — These flowers seem forever frozen at their peak bloom, their delicate fragrance lingering on through time.
- **Dust-Clad Blade** — An heirloom of the Qais family. An ancient sword, its once-noble edge dulled by neglect. Whatever glory it once bore has long since faded.
- **Eldritch Cultic God** — The otherworldly entity Badriyyah succeeded in summoning.
- **Elegant Blue Gauze** — A beautiful gauze woven by Habunah's own hands, a liquid-like light flows down its dark surface. One of a kind. You may gift it to an ally in Methinks, or ask Jenna to craft it into an Accessory.
- **Embryo of Darkness** — When nurtured in hallowed ground... it shall become the flesh of God incarnate.
- **Emerald Necklace** — This necklace seems to hold a protective spell, preventing the wearer from immediately succumbing to illness or injury.
- **Encyclopedia of Flora and Fauna** — After reading this book, you gain Survival +2. You need at least 2 in Wisdom to read it.
- **Endry** — Once prisoners trapped in the Jinn Lantern, they are grateful for your rescue.
- **Engraved Comb** — A Fatuna family heirloom, the comb is engraved with abstruse runes and astrological signs. Perhaps it was a ritual implement, once upon a time. But under the current Sultan's reign, it is just another piece of decoration for elaborate hairstyles.
- **Errant Thoughts** — On constitutions, orthodox and debased; on royal authority, rightful and warped. After reading this book, you gain Sociability +1, Stealth +2.
- **Evidence of Abdul's Crimes** — The evidence suggests that Abdul has been secretly backing this wicked trade.
- **Exhibition of Flesh** — Her hands are shackled tight behind her back, yet she still lashes out, kicking at the slaver who holds her chain. Her eyes are those of a jackal roaming the wastes – uneasy, feral, and brimming with menace.
- **Exhibition of Flesh** — This frail and thin girl has the most extraordinary violet eyes, full of tears and words unsaid, it takes a heart of stone to ignore them.
- **Exhibition of Flesh** — She appears unremarkable, but her silence and quiet endurance suggest a spirit far stronger than the brittle grass that blows in the wind.
- **Exotic Carved Ring** — All artisans capable of cutting these unique gemstones were slaughtered. The general responsible for the matter was executed by the Sultan. alongside his entire family.
- **Expensive Gold Veil** — Miss Arumina's veil. Costly
- **Expensive Spices** — An expensive spice with remarkable effects, works wonders if used in the right place.
- **Exquisite Dagger** — Adila's Gift to Maggie: a dagger sharp and dainty.
- **Exquisite Incense Burner** — arrying this meticulously carved Exquisite Incense Burner will have subtle fragrances following your every move.
- **Exquisite Leather Boots** — Beautifully crafted leather boots, so comfortable you could walk in them for days without fatigue.
- **Exquisite Leather Gloves** — Not only beautiful, but also practical.
- **Extraordinary Epic** — After reading this poem, you gain Wisdom +1, Sociability +1.
- **Eye of Darkness** — Upon being imbued by the malice of the Other, the Dragon's Eye changed its form. It contains immense destructive power.
- **Eye of Light** — Upon being imbued by the glory of the True, the Dragon's Eye changed its form. It contains immense destructive power.
- **Fadia** — In Sultan's harem, there are countless anonymous, unnoticed slave girls, and their lives are as insignificant as blades of grass. No one cares for them. Fadia is the luckiest among them.
- **Faraj** — The young ones, aflame with their own youth, declaim and pontificate about politics with reckless fervor.
- **Faraj** — The nobles gather in their salons, their murmured conversations laced with the scent of treason.
- **Faraj** — The young crowd the salons, restless as floodwaters straining against a dam. They do not seek reform. They seek ruin – for a world that has never been fair to them.
- **Fardak** — Fardak comes from a vassal tribe. He was sent by his father to demonstrate the tribe's loyalty to the Sultan. His face still carries traces of a young man's barely concealed resentment - a look the Sultan adores, for it marks him as a perfect plaything.
- **Fardak** — A mysterious man that walks with Fardak, addressed by him as "General".
- **Faris** — One of the four esteemed individuals granted the honor of serving as the Sultan's personal guard, permitted to bear arms in Sultan's presence. He is the best horseman in the capital and oversees all the Sultan's steeds and cavalry. However, he much prefers the company of horses to people.
- **Faris** — A whistle for training young hounds. Place it in Methinks to give a follower an extra Equipment slot of equipping a pet.
- **Fat Pigeon** — A plump pigeon delivered by a butcher's apprentice, heavy in the hand—almost suspiciously so. You can bring it to Habib to be roasted into a fine meal.
- **Fate Poetry Scroll** — Fragments of odd verse tied to dreams and mutterings; the more you collect, the stronger it grows.
- **Fatuna** — Her husband passed away recently, and her only son still young... Now, like vultures, her relatives close in on her.
- **Faux Condom** — The most intricate thing you have ever crafted. Be proud!
- **Female Bodyguard** — An enslaved nomad, freed by Nawfal. She works as a bodyguard for him, and is secretly in love with her savior.
- **Fiery Spirit** — A failed product developed by Mahir, but at least it is fragrant, rich, and strong. No one can finish three shots without ending up under the table.
- **Fighter** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Filigree-Embroidered Robe** — An extraordinarily ornate formal robe, embroidered with pure gold threads.
- **Fine Camel Bone Flute** — A fine, ancient bone flute inscribed with a script you do not recognize.
- **Fine Camel Bone Flute** — Aziz's clansmen, brought together.
- **Fine-Dried Fish** — A sea fish personally caught and dried by Arzuna herself. She had it delivered to you from a thousand miles away.
- **Fire Dragon** — Intelligent, cunning, a monster that does not belong to this world. Legend has it – mere hearsay, perhaps – its breath can destroy anything of this world, be it material or formless.
- **Fire Dragon Scales** — Scales of the Fire Dragon, seemingly still imbued with magic. Place in Methinks to craft an item.
- **Fireproof Robe** — A robe woven from special materials, resistant to fire and impervious to blades. With its protection, you will have more options facing the dragon.
- **Fitness Manual** — After reading this book, you gain Physique +1.
- **Flail** — This sinister mechanism works by ejecting the hammerhead, linked by chains and the handle, capable of severe damage.
- **Flamethrower** — A weapon lovingly crafted by Mahir. It can spit fire without warning.
- **Flayer Beast** — It likes to cut this part off and stuff it into that, and also likes to sever that and put it on this.
- **Flowers of the Empire** — A popular list of the empire's most beautiful women, with Nayla ranked seventh. Beside her portrait, the names of men rumored to have shared a night with her are listed, filling an entire page. The names of the women ahead of her have been scratched out with nails, and a series of vicious curses are scrawled in bright red ink beside them.",
- **Flowers of the Empire (Tattered Page)** — This tattered page still holds a portrait of your wife, smiling gently. Perhaps the Jeweler could find a way to restore it. Using this page in a corresponding attribute check grants +2 Sociability and provides 2 reroll opportunities.
- **Forgiving Ghazal** — What is the greatest love? You better pray it is forgiveness. Can be used to reduce Wife's Resentment once.
- **Forty-Seven Elegant Poses** — After reading this book, you gain Charisma +1.
- **Freemen Uprising** — A rabble of freemen marches on the capital, shouting slogans.
- **Full Armor** — Wearing it, you will fear nothing - just mind your eyes and knees.
- **Full Moon Scimitar** — Deadliest on the days when the moon is as full as the curves of its blade.
- **Garbled Messengers** — Look closely: their bodies are woven from ambiguous misspellings.
- **Garden Designs (Incomplete)** — A book detailing royal garden designs. Only fragments remain. After reading this book, you gain Survival +1.
- **Gazelle** — A graceful and agile antelope that has traversed the rocky paths countless times.
- **Gem Earrings** — Golden earrings inlaid with sapphires – of course, they are fake.
- **Gem-Studded Dagger** — A dagger with a gemstone-inlaid hilt, evidently costly, more decorative than utilitarian.
- **General** — The only surviving brother of the Sultan's. He carved a path of blood to the throne at the Sultan's side - only to sink into that sweet, wine-induced haze and the languor of earthly pleasures.
- **General's Sword** — Jabal's sword. Not a trophy from a battlefield or a gift from a friend, nor does it bear any enemy's hatred.
- **Giant Wolf's Head** — A hunting trophy, proof of a conquest. Put it in Methinks.
- **Gilded Bronze Slippers** — Though the Sultan has strictly forbidden the fashions and jewels of the Fallen Dynasty from flourishing within his empire, beauty attracts.
- **Glories of Ages Past** — After reading this poem, you gain Charisma +1, Sociability +1. If a non-noble Character reads it, it would turn them into a noble.
- **God's Aether** — This aether is stored in the Purist Order's sacred light spring, containing pure magical power, extremely precious.
- **Godflesh Mantle** — The flayed face of an upstart deity, now your prized trophy.
- **Gold Arm Ring** — A piece of jewelry given to Lumera by a favored concubine; its greatest merit is its expense.
- **Gold Bird** — You convince everyone that this mechanical bird is crafted out of pure gold. How could you not? It costed you a whole 30 Gold Coins.
- **Gold Coin** — Some say that gold can buy anything. You used to scoff at that. Now, you know it to be true.
- **Gold Drinking Horn** — Once rewarded only to the most outstanding warriors during the Sultan's father's time, this drinking horn overflows with pride and glory. How did it end up here?
- **Gold Necklace** — A gleaming gold necklace, though it develops a greenish patina over time.
- **Golden Armor** — Luxuriously decorated golden armor, majestic.
- **Golden Bracelet** — On the inner rim are the words: "Daughter of Gosa… Our—". In principle it signified Raed's claim to the throne. Yet far more names score the gold—blessings from the countless vagrants you aided. The late Sultan's formula is lost among those of smiths, grooms, laundresses, and hunters.",
- **Golden Cat Warrior** — A magical creature summoned by the Golden Cat Warrior Statue. Can be used to give +9 Combat in a single attribute check.
- **Golden Cat Warrior Statue** — Can be placed in the Expanded Residence. While placed, gains Summon Cat Warrior every 7 days.
- **Golden Cat Warrior Statue** — The warrior-cat's soul has found a vessel far more noble and vital than cold stone.
- **Golden Leaf from the Crown** — A gold leaf plucked from the Sultan's crown and casually bestowed upon you. Such enviable favor--people instinctively bow and yield before it.
- **Golden Ram Earrings** — A pair of ancient earrings. Under the ram on the left is carved "The Eternal Watcher". There are similar carvings on the right, but only the word for "poetry" remains legible.
- **Golden Relics** — Golden-stranded slippers, a gossamer robe embroidered with flowers and woven through with gold... Their owner must have been of surpassing beauty and unimaginable rank.
- **Grand Succubus** — Are they beautiful? Alluring? Do you want to embrace them? Once you begin to contemplate this question, there's no escape.
- **Great Adversary** — His resentment and determination, along with that of his supporters, twist into a powerful force.
- **Great Adversary** — The loyal ministers of the homeland still support their former king.
- **Great Adversary** — An old, weary mercenary broker, caretaker of the Roaming Swordsman.
- **Great Lord's Ring** — A trophy seized from the battlefield, engraved with the great lord's emblem, its significance cannot be overstated.
- **Great Lord's Steed** — A trophy seized from the battlefield. An extraordinary steed, personally raised by the great lord.
- **Great Lord's Sword** — A trophy seized from the battlefield, it accompanied the great lord on his campaigns, elegant and sharp.
- **Great Mother Goddess** — She can nurture everything, if she so desires.
- **Greatsword** — An ornate longsword, made with superior materials, resistant to wear or breakage
- **Grocery Ledger** — Hardly a book at all. A thick sheaf of aging documents, chronicling the royal kitchens' procurement records... and the many times corner-cutting was exposed. After reading this book, you gain Survival +1, Stealth +1.
- **Guardian Beast Bracelet** — The fierce guardian beast will protect its wearer from hardship-at least that is the hope.
- **Guesthouse** — She is wrapped tightly in sheer gauze, like she's trying to conceal something... But her graceful figure is still discernible.
- **Guide: No One Understands You Better Than I Do** — You should find a way to eliminate it within 7 days. You do not want to know what the Sultan will do once his patience is exhausted.
- **Gun Maidens** — The rescued barbarian sisters by Riel, wielding long spears and painted with blood marks, extraordinarily heroic
- **Habib** — A chef with formidable culinary skill and blade work, he is equally at ease dismantling animal carcasses, feeding an army with well-cooked palaw, and crafting dainty fruit confections to charm a lady's heart. If you can provide Habib with inspiration or high quality ingredient, he will serve you a feast anytime.
- **Habib** — Delicacies made by Habib, tantalizing not only the retainers in your guesthouse, but also nearby residents.
- **Habib** — Freeloaders, queue jumpers, and those who lost their seat or food are quarreling in your guesthouse.
- **Habib** — He fancies himself the capital's most discerning connoisseur. Wherever fine cuisine is whispered of, he must taste it for himself.
- **Habib** — The hungry people, scavenging for food in the garbage heap behind your guesthouse.
- **Hairbound Oath Ring** — Wrought of golden threads entwined with silken strands—hair whose hue recalls a certain comely figure at the Sultan's side... Inside the band, words are etched: "Cruelty of fate tore us asunder."
- **Halcyon Days** — A manuscript from a sorcerer of old, detailing the many signs of enlightenment. Chief among them: the power to weave a dream-garden, a place of one's own design within the shifting tides of slumber. The author, it seems, took his own life shortly after finishing the work. After reading this book, you gain Insight +1. You need at least 5 in Wisdom to read it.
- **Hand Crank Lantern** — A failed invention by Mahir. If you keep cranking, it produces a glow almost as bright as a candle.
- **Harem Secret Passage** — A secret passage to the Sultan's harem.
- **Hassan** — Hassan is a terrible friend. He pays no debt, shirks all work, drinks all day, and amuses himself with crude, base antics. Yet, upon hearing of your plight, he brought a dagger and moved into your front hall, managing three whole days without a drink.
- **Hassan** — Musings on an uncanny being—I'll mull it over.
- **Haunted Mansion** — There is no blood in his neck. Lurid green worms of various sizes hide in the drained cavities.
- **Heading Axe** — A reward from the monarch after a grueling battle that broke a thousand blades. Henceforth, it accompanied the general's every conquest, paving his way with the fallen heads of his enemies.
- **Healing Herb** — Healing herb, used to resist death during sickness.
- **Hemir** — He is just a kid.
- **Heritage Tapestry** — A tapestry of prodigious length, embroidered with the entire history of a tribe from its birth. The tapestry is unfinished, burned by fire. A dedicated gallery is required to display it in full. You can construct such a luxurious corridor for your estate by placing this in Methinks.
- **Hidden Passage to the Inner Palace** — When the hour of treason strikes, you may wish to see where this passage leads.
- **Highlord of the Highlands** — He is the North Star. Following the roads He illuminated, the highlanders built what later became the Sultanate. Henceforth, He was venerated above all else... until He fell to the Immaculate Purity. So the high was brought low, and He was reduced to a waning Star-Souled wraith, drifting, alone.
- **Hollow Knight** — Don't ask who was originally inside its armor... otherwise the answer might be "you".
- **Holy Bread** — It is not the taste that matters, but the piety of hearts.
- **Homestyle Delicacies** — Braised Chicken Thigh; Hot-Oil-Doused Pork; Steamed Beef Tripe; Poached Meatballs; Stewed Flatbread; Slow-Braised Peas; Yuan-yang Braise; Smoked Zebra; Candied Braised Fruit; Fried Lily Bulbs...
- **Honey Omelette** — A simple, unpretentious dish. Making something so simple into something remarkable is no easy feat - but Habib has done it.
- **Honorable vs. Corrupt** — You only know the labels they carry now, but nothing of their past.
- **Horn Earrings** — Enormous and extravagant, they demand attention without descending into tastelessness.
- **Hot Air Balloon** — A flash of genius. When Mahir said she can send you to heaven, you thought it was a joke...
- **How to Please Your Lover** — After reading this book, you gain Charisma +1.
- **Huge Gemstone Necklace** — Bigger is better! Such a massive sapphire is a rarity worldwide.
- **Hunter's Tales** — After reading this book, you gain Stealth +1 and Survival.png Survival +1. You need at least 2 in Wisdom to read it.
- **Hunting Bow** — A hardwood bow commonly used by hunters, skilled archers often tweak it to enhance accuracy.
- **Ikar and Husam** — A boon from the monarch, they are the final work of a famed pair of swordsmiths. The male blade gleams gold, while its counterpart is silver chased with emerald. When the two sink into flesh together, they sing with a low, exultant hum.
- **Iliona** — Once prisoners trapped in the Jinn Lantern, they are grateful for your rescue.
- **Iman** — A priest who has served God since childhood. Might even the most unyielding devotion conceal fractures?
- **Iman** — In three days, all will be revealed.
- **Imposter** — People always long to be filled, but when truly filled, they wail and beg for mercy-how strange.
- **Impure Aid** — Witnessed by the Sultan's game, sacred images seen in the stains of corpses and spurting blood... these are the angels welcoming the return of divinity.
- **Impure Aid** — Witnessed by the Sultan's game, sacred images seen in greedy bite marks... these are sacred objects praising the achievements of divinity.
- **Impure Aid** — To satisfy your Extravagance Card, cultists used flesh, gold, and silver... to create this monster for you. Can be used in Methinks, it might awaken.
- **In Praise of Love** — After reading this poem, you gain Charisma +4.
- **In the Land of the Jinns** — The fairy tale of how a woodcutter who lost his ways deep in the forest encountered jinns. First time reading this book grants you Sociability +1. Reading it triggers the Forest of the Jinn adventure.
- **Inal** — A female slave who came as a dowry with your wife. She is an excellent cook and literate, a rarity among slaves.
- **Inal** — A rat-faced, shifty-eyed noble who fancies himself a match for Nabhani in terms of charm, prone to making unwelcome advances toward women.
- **Inal's Diary** — The pains and joys of a runaway slave. After reading this book, you gain Survival +1.
- **Incense Locket** — ts delicate hollow structure allows it to hold a piece of incense within.
- **Indignant Crowd** — The righteous who are dissatisfied with the tyranny of the Sultan, the overburdened peasants, and the displaced herdsmen have gathered together to form an army. They are willing to serve you after hearing of your good name.
- **Indulgence Necklace** — A gold necklace crafted from a copious amount of gold, with a small inscription: To my pearl, Arumina.
- **Infamy Card** — Many creatures survive by mimicking the bright, the poisonous, or the terrifying to scare off predators. Whether it's real or just an act doesn't matter, what's important is staying alive. Through Methinks, this card will boost your Infamy.
- **Influence Card** — Of course you're the Sultan's favorite. Why else would you be the one playing this game? Just because of bad luck? Yeah, right. Through Methinks, this card will boost your Influence.
- **Ingenious Satire** — After reading this poem, you gain Combat +1, Stealth +1.
- **Injured** — A wound that will reduce your physical attributes. Injured characters may die if they fall sick.
- **Injured White Rhino** — A White Rhino, bloodied and injured, all the more aggressive as a result.
- **Inside Information** — Tacit agreements and unspoken rules.
- **Insight Card** — You've been able to see those creepy, otherworldly things for as long as you can remember. You just kept pretending not to, doing your best to act like everything was normal. Through Methinks, this card will boost your Insight.
- **Interesting Epic** — After reading this poem, you gain Wisdom +1.
- **Introduction to Herbology** — After reading this book, you gain Survival.png Survival +1. You need at least 3 in Wisdom.png Wisdom to read it.
- **Invisibility Cloak** — How can something visible be called an invisibility cloak!? Rest assured! It truly is an invisibility cloak!
- **Jabal** — One of the four esteemed individuals granted the honor of serving as the Sultan's personal guard, permitted to bear arms in Sultan's presence. An affable man oft ridiculed for his passion for adventure stories and ancient heroics, he steadfastly upholds the ideals of the very paragons he admires.
- **Jabal** — A ferocious giant wolf wandering around the city.
- **Jabal** — This person's fighting style feels very familiar to you. You may have fought them before.
- **Jade Arm Ring** — A beautiful jade circlet. An arm ring for the slim, but for the strong, it barely fits as a bracelet.
- **Jalila** — Jalila has meticulously crafted her unapproachable persona. Many clients spend enough on her to buy several farms, and their only reward is a chance to kneel and kiss her toes - perhaps that is exactly what they want.
- **Jalila** — A warrior in service to a noble family, here to avenge the dead.
- **Jalila** — Impossible to tell who is under the cocoon of silk.
- **Jalila** — What is this thing/ What will it bring?
- **Jalila** — The Sultan announces that everyone can visit the House of Delights for five consecutive days, all expenses paid—of course, "all expenses paid" is a lie. Because you're the one who has to pay for it.
- **Jasmine** — Named after her soft white mane - but her temper is anything but soft.
- **Jasmine Flame** — Iman consecrates the crown and robes of your, the Purist's agent, with his blood.
- **Jawad** — You have rescued the Obese Noble Prisoner and restored his honor. He once more strolls the Sultan's court, flaunting his exceptional art of amassing wealth.
- **Jawad** — Appearance indiscernible, identity unkown.
- **Jawad's Henchmen** — Jawad's Henchmen. They're loyal to money and money alone, but that is fine by Jawad - even here in the capital, few can name a price higher than his.
- **Jealous Minister** — This person is jealous of your thriving business and unmatched reputation in the Dark Alley.
- **Jenna** — This man discovered a diamond vein but never reported it to the sultan. Instead, he secretly seized it and began private excavation.
- **Jenna** — Their blades are ever drawn, watching for slaves who might attempt escape, and for outsiders who stray too near.
- **Jenna** — Their whips are ever ready to lash across the bent backs of the laborers.
- **Jinn Lantern** — Jinn Lantern, place into Methinks to try smashing it
- **Journey to the West** — After reading this book, you gain Survival +3. You need at least 2 in Wisdom to read it.
- **Jousting** — After reading this book, you gain Combat +2.
- **Junah** — Junah is beautiful, but lacks a certain poise. This means she cannot charge as much, which, for many patrons, works just fine. The other prostitutes think she is wasting her potential, but they do not know what she wants.
- **Junah** — Impossible to tell who is under the cocoon of silk.
- **Jungle! Jungle!** — Adventure stories from some place called "Jungle". Apparently it is a land strangled by trees, where monkeys outnumber people... Pure fabrications, surely? After reading this book, you gain Survival +1 and Stealth +1.
- **Kapar** — A "gift" from the Sultan. He has stayed by Samir's side for years, living quietly and contentedly.
- **Kaplan's End** — A cold blade to the throat: this is how many a noble bloodline ends.
- **Killing the Fierce Lion** — An exiled male, driven from its pride, ventures dangerously close to the city in the dry season, desperate for prey.
- **King of Flames' Army** — A group of farmers and slaves gathered under the banner of the King of Flames.
- **King's Roast** — Does the complex and obscure court etiquette really add to the flavor of the dish?
- **Knight Revenant** — Undyingly loyal, restless in his shame.
- **Knuckles** — Brass Knuckles, slightly rusted, barely usable as a weapon.
- **L.O.Q.U.A.C.I.O.U.S. 100** — Its full title is Logical Overview of 100 Questions Underpinning Abstract Concepts in Intellectual and Ontological Understanding of Scholarship – a synopsis is presumed to be redundant. After reading this book, you gain Wisdom +4. You need at least 5 in Wisdom to read it.
- **Lady Becky** — Two generations before the current Sultan, Lady Becky's ancestor was given the noble title for protecting a young prince from a venomous snake. The title has been passed down through generations. Although no one takes it seriously, his nobility comes with full paperwork and all the legal force behind it. Additionally, he truly is a clever and beautiful kitten.
- **Lady Becky** — The warrior-cat's soul has found a vessel far more noble and vital than cold stone.
- **Lapis Edge** — A boon from the monarch, this dagger is suited only for the pure of heart, for in the blue glaze on its back is reflected even the slightest hint of malice in those nearby.
- **Large Agate** — A large piece of agate cut from the raw stone. Though such gemstones are common enough that even the poorest Lady of Delights can wear them, one of this size and clarity is a true rarity.
- **Large Amethyst** — A large piece of amethyst cut from the raw stone. Mysterious, noble, and elegant—what could be more fitting for the vizier or the sultan of the gem world? Even among high-grade gemstones, few could rival its brilliance.
- **Large Diamond** — A large piece of diamond cut from the raw stone. Given that all diamond veins are monopolized by the royal family, obtaining such a massive stone is an almost unthinkable symbol of wealth and power.
- **Large Emerald** — A large piece of emerald cut from the raw stone. Its sheen is calm yet profound, clear beyond belief. A gem of such perfect quality would drive noble ladies into a frenzy of desire.
- **Large Red Carnelian** — A large piece of carnelian cut from the raw stone. This soft gem, admired for its graceful veins and vibrant color, would make any common girl a bride envied by all if she wore such a large piece on her wedding day
- **Large Ruby** — A large piece of ruby cut from the raw stone. You have never seen such a pure, vivid red—no stained glass could ever imitate its glow. It embodies nobility, beauty, and love itself. Jenna thought up the advertisement line the moment she saw it.
- **Large Sapphire** — A large piece of sapphire cut from the raw stone. To call it the vizier of the gem world would be no exaggeration; only diamonds could vie with its splendor. Even the Sultan would take pride in owning the largest sapphire in the Empire—yet Jenna suspects this one might not be any less brilliant.
- **Large Shield** — A small round weathered shield, can be strapped to the arm for minimal protection.
- **Lavish Body Chain** — The clergy decries this new design, claming it incites transgressions.
- **Lease Agreement** — You rented your lodge to Bharat with some thoughtful upgrades. You can collect 3 Gold Coins from him every 5 days.
- **Leather Armor** — The leather armor is covered with scratches, offers partial protection.
- **Leather Boots** — Deerskin boots adorned with intricate embroidery and tassels.
- **Legend of the Thief** — After reading this book, you gain Stealth +1. You need at least 2 in Wisdom to read it.
- **Legendary Sword** — Adila paired her sword with a beautify and hardy white rhino skin — more than ever, it has taken on the likeness of a sword from the epics.
- **Little Crocodile** — A crocodile from the sewers. If raised and tamed, it may inspire awe and admiration.
- **Living Pelt** — Many decry the skinning of living beasts as barbaric—these pelts sovled that problem by remaining alive!
- **Long Overdue** — A collection sharp and poised as its heroine. It recounts how the poetess, far from home, found courage in hatred, and strength in solitude. After reading this book, you gain Stealth +1 and Combat +1.
- **Longbow** — An excellent yew bow requires an extraordinary strong arm to draw.
- **Longsword** — The most common longsword available.
- **Love Triangle** — You only know the labels they carry now, but nothing of their past.
- **Lover's Heart** — What remained after the Gold Carnality was consumed by Heaven's fire, initially wrapped and concealed by lust and perverse love.
- **Lucky Amulet** — The Character equipped with this accessory gains reroll +1 (once per check).
- **Ludicrous Ghazal** — When passion fades, this poem is just nonsense. But when you are in the moment, it is a ball of wildfire, lighting the way to an impossible world. Use this poem in Carnality at Home to make an ally who has no passion for you accept your advance once.
- **Lumera** — Many people can read, but she reads with a merciless efficiency, and lives out the teachings with no regard of morality or difficulty. (She ignores any prerequisites there may be for reading a book.)
- **Lumera** — A book written in an enigmatic script, incomplete.
- **Lumera** — This downtrodden beggar gambled everything he had at the table, and then... ha, lost miserably, again and again.
- **Lunar Breastplate** — Gilded lunar phases adorn this breastplate, tracing the silent passage of time. An inscription reads:The moon our ancestors once saw has waned. It has been aged by the loneliness of those who came after.
- **Lustrous Silk** — A material of singular quality. Merchcants who trade across nations might prize it, though keeping it for your own use is equally tempting.
- **Madness** — Mad delusions have overwhelmed you.
- **Mage** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Maggie** — Your wife, a wise and respectable woman. While your marriage - arranged by your late parents when you were still young - lacks passion, it has proven to be a source of stability and peace. She has been steadfast as ever, even after this deadly game has caught you in its snares, never once expressing a desire to leave you. Though occasionally, you hear her sigh.
- **Maggie** — The Bookstore Owner found dozens of erotic stories and sex manuals from the warehouse and placed them on the bookshelf the two of you had knocked over.
- **Maggie** — Someone snuck into the Bathhouse at night and carved a buttocks-shaped groove - right where the two of you had been. Heaven knows how he got your butt size right.
- **Maggie's Portrait** — You personally drew Maggie's image, her true form, the one you love.
- **Magic Growth Ritual Blueprint** — An evil ritual blueprint detailing the ritual to increase one's magic
- **Magical Masnavi** — After reading this poem, you gain Magic +1.
- **Magnificent Epic** — After reading this poem, you gain Wisdom +2, Sociability +2.
- **Mahir** — At banquets, Mahir is often the butt of her fellow nobles' jokes. Neurotic and naive, she has no grasp of household affairs and shuts herself away from people, obsessing over absurd and useless studies. How ludicrous, she has debased herself into a mere craftswoman! But what is left unspoken is this: it is exactly who mock her that have carved up her inheritance to the last scrap.
- **Maintain the Estate** — More fragile than power, more direct than words, more precious than life.
- **Malefic Flares** — Conjectures on the correlation between earthly affairs and the movements of the baleful Mars. Used as Intelligence, it can provide +5 Combat, and 1 reroll opportunities. You can also think on its potential use.
- **Malkina** — Malkina's mother once served as a slave and managed your family's tailor shop. In time, she earned her freedom and a share in the shop. Now, bearing her mother's command, armed with golden needles, silver threads, eyes for beauty, and hands touched by god, Malkina has come to aid in your mortal plight.
- **Malkina** — You can introduce some suitable people to Malkina through Methinks, so that she can see more profound faces. However, this demands that your Renown or Infamy spread far and wide, and that you hold considerable influence in court or in the Dark Alley.
- **Malum in se?** — Gods do not possess more patience than the mortal men.
- **Malum in se?** — The breeding ground God chose for Himself... still crawling with maggots.
- **Manar** — Manar has spent half her life recording every mountain range, valley, and oasis she traveled to with her paintbrush. She documented the migration of community and the trails of merchants. Eventually, she compiled all of her painstaking work into a meticulously drawn map. Some marveled at it, some questioned it. Unbeknownst to her, the ruler of this kingdom has also developed a unique interest in it...
- **Mansion Guard** — The sentries are visible. But more deadly are the blades in the shadows…
- **Mantle of Forgotten Gods** — Once belonging to a high priest, now merely an exotic accessory.
- **Many-Eyed Sage** — It perceives everything... sometimes it even hates itself for this.
- **Maps and Borders** — After reading this book, you gain Survival +1.
- **Marvelous Mush** — To secure the guesthouse job, Habib put his effort into preparing the cuisine.
- **Mask of Madness** — In your eyes, the perfect complement to the Roaming Swordsman's essence. He likely begs to differ.
- **Masked Warrior** — Seliman, the Royal Guard Captain is dead. Now, an anonymous freeman stands by your side.
- **Mechanical Horse** — A mount lovingly crafted by Mahir. Looks rather ridiculous, but - against all odds - it moves.
- **Mechanical Ring** — A ring with hidden compartments for secrets and poison.
- **Medical Codex** — Compiled by Samir—an authoritative reference of treatments and potent remedies.
- **Memoirs of a High Constable** — After reading this book, you gain Stealth +2.
- **Mercenary Adventurer** — The mercenaries who drink, boast, and brawl in the adventurers' tavern.
- **Midnight Blade** — Beheaded by a blade filled with anger, unable to rest in peace.
- **Military Spear Guide** — After reading this book, you gain Combat +2.
- **Mirror of Stars** — A precise instrument made by Mahir, capable of peering into the depths of the distant starry sky, capturing those dom yet eternal glimmers of light.
- **Monk** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Monster's Armor** — Plundered armor... Exaggerated and ornate, its origin is unknown.
- **More Educated Servant** — The Old Slave Woman has trained your servants and improved their skills. They can now provide more assistance to you during Managing the Estate.
- **Morning Star** — The star that signals the coming of dawn, records of its rising and settling. Used as Intelligence, it can provide +5 Intellect. You can also think more on its potential use.
- **Mud Crawlers** — Those gathered under Riel have long been accustomed to rolling in the mud, struggling for survival.
- **Mud-playing Tribe** — You need not care whether they are innocent.
- **Murtaz** — No one likes the shady Murtaz. Now that the miserable rat has lost his family and fortune, even more so: people in court avoid him like the plague. But the Sultan enjoys his presence. That is the sole reason Murtaz must continue to attend court: to parade his feeble, importent hatred for his master's amusement.
- **Mute Bells** — A string of small bells woven with colorful cords that make no sound when shaken. You have gained Ansuya's trust.
- **Mysteries of Essential Oils** — After reading this book, you gain Charisma +2.
- **Mysterious Magic Ring** — Legend has it that only the ruler of the empire can wear this ring, and the owner of this magic ring need only raise his hand to take a life. This is the source of the Sultan's power... If this ring is not dealt with, no one can oppose the Sultan.
- **Mysterious Pot** — A huge cooking pot. Mysterious. An unusual aroma lingers around it.
- **Mystery of Mysteries** — After reading this book, you gain Magic +3. You need at least 5 in Wisdom and 3 in Magic to read it.
- **Mystique** — Rumors, strange, alluring, dangerous.
- **Nabhani** — One of the four esteemed individuals granted the honor of serving as the Sultan's personal guard, permitted to bear arms in the Sultan's presence. The best swordsman in the capital, yet too handsome to guard the harem and too clever to serve in the army. Instead, he lingers in the House of Delights, befriending prostitutes and artists.
- **Nabhani** — You cut down Nabhani's friend in the name of a Bloodshed Card. Now, he comes in vengeance.
- **Navudo** — To the Creator, this name embodies infinite possibility... yet the Creator was driven to the brink of madness pursuing this boundless vision.
- **Nawfal** — Nawfal was not born to an esteemed family. He spent five years earning the right to be the Sultan's courtier, and another five years coming to the realization that he cannot change the Sultan's ways. His ambition smoldered into a profound disappointment, but he may yet find another way to save this country.
- **Nawfal's Necklace** — An ornate necklace with faint traces of magic.
- **Nawfal's Poisoned Arrows** — Poisoned arrows. Their long shafts are covered by etching of names: a spell, or perhaps a curse.
- **Nayla** — Born of a venerable bloodline and blessed with a frail husband, Nayla is unafraid to be immodest. Flitting through the court's glittering intrigues, she has amassed many admirers, yet few catch her favor... For who can truly sate her insatiable vanity?
- **Nayla's Resentment** — You failed to satisfy Nayla's request. She is rather displeased.
- **Night without Light** — It is traditional for lunar eclipses to serve as warnings to the monarchs against slander and rumormongers. You can also unlock its potentials in Methinks.
- **Nobility's Support** — The ruling class sides with you. You are now above reproach.
- **Noble Cavalry's Saber** — Striking engravings in gold and enamel cover this long blade. Those decapitated die admiring its glory.
- **Nomad Uprising** — A well-armed force of nomadic rebels hurtles toward the capital.
- **Nomadic Life** — After reading this book, you gain Survival +2.
- **Notoriety Card** — In your younger days, you had friends and connections all across the land. You might be out of the game now, but the stories about you are still making rounds. Through Methinks, this card will boost your Notoriety.
- **Occultist** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Oil of the Zealot** — You do not want to know what was rendered to produce this oil. Best to ponder its uses instead.
- **Old Rose Garland** — A thank-offering from the slave girls: fresh, dewy boughs from the old rose garden, each thorn carefully stripped.
- **Old Slave Woman** — You bought her back out of momentary kindness. Sickly and frail, she looks like she has one foot in the grave already.
- **Omen** — Luck, fortune, superstitions.
- **Opened Mind** — After reading this book, you gain Wisdom +3, Charisma -1, and Physique -1. You need at least 1 point of Magic to read it.
- **Orb of Wisdom** — A treasured relic passed down in Fatuna's family, said to sharpen the senses and invigorate the mind when kept close.
- **Ossuary Armor** — Each person has their strongest bones in different places—this armor harvests and combines only the hardest parts.
- **Ox Bone** — A so-called "gem" you and Jenna managed to inflate into a high-priced sensation. Once dismissed as worthless, it has now become something the wealthy covet and the masses chase—proof enough of human folly and desire.
- **Pack of Vicious Dogs** — A group of abandoned dogs, wandering and gathering in the desolate wilderness.
- **Paper Shredders** — Freedmen found and rescued by you and Riel, their identity papers are already shattered.
- **Paths Eternal** — A record of the sun's movements, charting the paths of the zodiac and other astral patterns. Contains potent mystic powers. Unlock its use in Methinks.
- **Patricide** — You only know the labels they carry now, but nothing of their past.
- **Perilous Trail** — Records of a forgotten trail leading to distant lands. With discretion, one may establish a quiet trade with them in Managing the Estate.
- **Philosophical Man** — This peculiar figure haunts the shadows of his cell, supposedly once a legendary chieftain of some formidable tribe.
- **Physiognomy** — After reading this book, you gain Sociability +3.
- **Poet** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Pomegranite Garden** — A beautiful circlet wrought by a talented craftswoman. A noble by birth, she was forced into hiding after her family's downfall. But thanks to the friendship of an influential courtier, she found her way back to the forge. This piece was inspired by of dream of hers. In the dream, she was back in her ancestral estate: pomegranates were in full bloom, the water fountain sang, and the people laughed...
- **Pool of Blood** — The womb God chose for Himself.
- **Portents of Madness** — Observational records of an inauspicious star, radiating malice. Used as Intelligence, it can provide +6 Magic, and 3 reroll opportunities. You can also think on its potential use.
- **Priests of the Purist** — They are the most devout followers of the Purist, always fighting for their faith.
- **Prison** — The dungeon, a place for imprisoning criminals.
- **Providence** — An epic about the changing of dynasties. Normally, you would be arrested and hanged halfway through reading it, but at the right moment (such as in Events relating to your rebellion), it can lend legitimacy to your cause and serve you well. Henceforth, no matter how many dynasties rise and fall, how many wars are fought and lost, this poem shall be remembered and sung.
- **Pudding of Life** — A pudding infused with the Water of Life, brimming with the warmth of strong spirits.
- **Qais** — The Sultan has forgiven the noble's offense.
- **Qais** — The Qais family's hereditary title has been revoked. Was it cast into obscurity, or does a path remain to reclaim it? You might glean whispers of its fate in The Grand Game, by asking your colleagues.
- **Qais** — A noble distressed by the Sultan's tyranny. To fund his journey away from this city, he is selling his own title.
- **Qais** — Only with this can the ancient glory of the Qais name be passed down through generations.
- **Quenched Mithril Longsword** — An ancient mithril longsword tempered by dragon's breath. Adila's people believe it capable of piercing dragonscale.
- **Radical Order** — A group of ascetic young theologians, backed by their own militia. Nawfal is one of their key spiritual leaders.
- **Raed** — People who, for many reasons, had no papers, could not settle, and enjoyed no protection under the law—outcasts in the eyes of religion as well. Even slaves were protected as property; vagrants were treated like mud at the roadside.
- **Rain Child • Volume II** — A fantasy novel by the famed poet Seldi, the story is simple and classical, but contains a captivating narrative voice and exceptionally beautiful metaphors. Banned for its contentious religious themes, it is rather hard to acquire. You have Volume I at home. It is one of your wife's favorite books.
- **Ranger** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Rare Jerky** — Dried meat made from a game caught by retainer hunters, requiring serious chewing power, a small piece lasts for a long time...
- **Rationality** — The human mind, compared to the world, the higher powers, is an island in an endless ocean. Insignificant, weak, to be devoured by some disaster at any moment. Even so, a lighthouse stands erect on this island: rationality.
- **Razor Girl** — Embrace her, what are you afraid of? Death is the most intense lovemaking!
- **Reanimated Zombie** — A handcrafted reanimated corpse that can accomplish many tasks.
- **Red Monarch** — You personally drew the Sultan's image - in a kind of indefinable, frenzied disorder.
- **Regeneration Amulet** — The Character equipped with this accessory automatically heals wounds after each Ritual.
- **Regicide** — You only know the labels they carry now, but nothing of their past.
- **Renown Card** — Before the game began, Maggie made a hefty donation to the Purist Order in your name. You can remind people of that anytime. Through Methinks, this card will boost your Renown.
- **Rhythms of Change** — The moon wanes and waxes, and the world shifts in accordance. Used as Intelligence, it can provide +5 Magic, +5 Stealth, and 3 reroll opportunities. You can also think on its potential use.
- **Riftblade** — A fairy's lament forever frozen within.
- **Righteous Wrath** — To thwart your plans, even the blackest heart may be granted the mantle of divine justice.
- **Ring of Inevitability** — Legend has it that only the ruler of the empire can wear this ring, and the owner of this magic ring need only raise his hand to take a life. This is the source of the Sultan's power... You fumble with the ring, finding it impossible to fit any of your fingers in. However, inside the ring, inscriptions burn like flames with the flow of magic - ALL SHALL FADE. With a single glance, it scorches your soul, leaving an indelible mark in your vision. It seems this ring may also lie at the source of the Sultan's madness. Do these words torture him, he whose reign knows no bounds? Do all his possessions lose their luster under this burning verdict? Regardless, a glimmer of hope sprouts from your dark life as you peer through this ring.
- **Ring of the Lovebirds** — A pair of lovebirds looking away from each other. Tiny mechanisms hide beneath their delicate heads. With a flick, their heads will turn to look at each other and the compartment hidden in the underside of the ring will open up. It is filled with poison. Words inscribed on the inner side read: You are my doom, and I am willing
- **Ritual of Harvest** — Inside the scroll is some sort of strange sacrificial ritual. Only the oldest noble houses would have knowledge pertaining to such things.
- **Ritual of Sword and Shield** — Inside the scroll is some sort of strange sacrificial ritual. Only the oldest noble houses would have knowledge pertaining to such things.
- **Ritual of the Hearth** — Inside the scroll is some sort of strange sacrificial ritual. Only the oldest noble houses would have knowledge pertaining to such things.
- **Road Map of Revolution** — The flame is kindled. A workable plan has formed in your heart.
- **Roaming Swordsman** — As the most well recognized mercenary swordsman, he refuses to reveal his name. What marks him - other than his gleaming golden sword, is his libertine attitude: the overflowing goblet, the beauties in his arms, and the coins he can never keep.
- **Roaming Swordsman** — A noble of little consequence.
- **Roast Pigeon** — Echo of kindness made this plump roast pigeon even more fragrant!
- **Rod of Life** — A magical item created by Mahir... Any description of it is hollow; ah, only those who have used it, or been used by it, know what a magnificent creation it truly is.
- **Rogue** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Roots of Darkness** — After reading this poem, a Character without knowledge of the Black Art gains Black Art and Magic +3. If they already have Black Art, they gain Magic +6.
- **Rose Essence Oil** — Rich rose aroma, like rain-wet petals. Use to increase Charisma.
- **Royal Interest** — He has suffered dearly for his reckless words. And yet, he still cannot hold his tongue.
- **Royal Interest** — Abdul hopes you'll take the opportunity of entertaining the Sultan at the guesthouse to reveal this list.
- **Royal Sword** — A powerful weapon forged from a meteorite. Four swords and two daggers were forged from the same meteorite. Only the greatest warriors of the realm may wield them.
- **Rumor of Impotence** — A rumor that reached the Sultan's ears.
- **Sacrificial Ritual** — Sinister instructions on harnessing dark powers through human sacrifice.
- **Sacrilegious Tongues** — You only know the labels they carry now, but nothing of their past.
- **Sadani** — A captivating beauty, she was once the Sultan's undisputed favorite. But there will always be someone younger, someone fairer. Sadani refuses to accept the inconsistency of her lord and will do anything she can to wrest back that heart of stone. As it happens, her madness is a delicacy the Sultan relishes.
- **Sadani** — The beast's head, proof of your valor.
- **Sadani** — Sadani is pregnant. This is a secret she will do anything to protect.
- **Sadani** — Deeply trusted by Sadani, she is entrusted with tasks would rather not handle personally.
- **Sadani** — You have corrected the logs for Sadani. This is the material proof.
- **Sadani** — Seliman is dead. This bloody head is the proof.
- **Sadani** — Story of Seliman's death, heavily embellished with details to ensure credibility. You and Seliman crafted it together.
- **Sadani** — Sadani's token, grants passage through the city gate.
- **Sadani** — An assasssin, striking to kill.
- **Sadani's Token** — Sadani's token, grants passage through the city gate.
- **Salt-Roasted Ox Heart** — A massive heart, coated in coarse salt and clay and roasted whole. A dish nomadic peoples reserve for their most honored guests.
- **Samir** — Samir has served the court for over ten years. he is skilled in his art, well-dressed, and avoidant of women's touch. After all, more often than not, it is the delicate female members of the harem that requires his treatment, instead of the robust Sultan. It is said that the monarch once gifted him a male concubine. The two share a harmonious and cordial companionship till this day.
- **Samir** — You must report to the Sultan before the deadline.
- **Savasar** — Eunuchs whose task it is to cleanse the bodies of the concubines… both outside and within. Few who perform this task meet a kind end.
- **Scholar** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Scholar's Insignia** — This treasure was commissioned by Scholar member 氡. For those who dwell among dusty tomes- not seeking hollow flattery, but gathering wisdom that actually serves a purpose.
- **Scout Training Manual** — After reading this book, you gain Stealth +2.
- **Scribe** — The task of chroniciling is sacred. The scribe is responsible for recording the Sutlan's every word and action. As a result, he always feels like he is living on borrowed time.
- **Scroll of Worms** — After reading this book, you gain {Magic +1 and Physique -1. You need at least 1 point of Magic to read it.
- **Seared Fowl and Wild Mushrooms** — The dish crackles on a searing stone slab. Patience is key - consume it before it is fully cooked, and you may regret it dearly.
- **Secret** — Things that are kept hidden.
- **Secret Chamber** — Crafted not merely to keep mortals out, but to keep darkness contained—hence its unyielding weight and impenetrable strength.
- **Secret of the Mask** — After reading this book, you gain Charisma +2.
- **Self-Transformation** — True creation transforms the Creator first.
- **Sense of Happiness** — Maggie remembers a time when you made her feel happy, safe. The echo of happiness lingers in her heart, leaving it unguarded and tender.
- **Shadow Compass** — Shadow Compass, place into Methinks to restore a countdown on a Sultan Card.
- **Shadow Hands** — These hands have pulled the darkness from within you and merged with it...
- **Shadows of Assassination** — You never know what surprises your enemies have in store for you.
- **Shadows of Assassination** — Appearance indiscernible, identity unkown.
- **Shama** — Some say Shama is the illegitimate daughter of a noble lord. Her refined speech lends credence to such rumors. She might just be the city's finest fixer, when it comes to unsavory matters that require a delicate touch - pleasures of the bedchamber are merely a sweetener to her real service.
- **Shama** — A troop serving the Great Lord.
- **Shama** — He was once the most trusted minister of the former Sultan; after receiving land and favors, he has retreated to his vast and fertile territory.
- **She Who Slithers** — Feet are burden, both to charm and strength.
- **Shield and Helmet** — A set of high-quality protective gear that are both durable and light. On a battlefield, they will save your life. Additionally, a helmet stand is included in the set. Beautiful craftsmanship.
- **Shield of Abbara** — The surface of this round shield is etched with a masterful depiction of the Sultan’s triumph at the Gorge of Abbara, where the armies of the previous Sultan were crushed. Of course, there are seditious whispers – that the Sultan did not conquer the capital through war, but traitorous treachery... The official tale remains official: a hard-fought victory, a triumphant return, and the severed head of a fallen monarch raised high as the faithful roared the name of their Sultan.
- **Shield of Blinded Eyes** — A bronze shield bearing a warrior's face, said to be a figure of tribal legends. But the eyes are damaged. Perhaps he could not bear witnessing the subjugation of his people.
- **Shunia** — To the Creator, this name signifies the primal source... yet the God of Purification could grasp only emptiness in the end.
- **Sickle** — The most common scimitar available.
- **Sickly Appearance** — As if aged thirty years in a day.
- **Sickness** — When you are sick, it is hard to get anything done.
- **Silk Gown** — A silk robe embroidered with golden patterns, elegant and refined.
- **Silver Bracelet** — A coarsely made Silver Bracelet, give you a dash of flair.
- **Silver Incense Burner** — A little incense burner to be carried on the belt. Intricately designed with a double-layered silver net, it can hold and burn incense inside it, without the worry of spillage.
- **Silver Pendant** — A silver pendant exquisitely crafted by The Jeweler, which opens to reveal MAggie's smiling face. Perhaps you are imagining things, but every time you see it, your heart finds momentary peace.
- **Silver Ring** — A plain silver ring with an inscription inside: "May you grow up healthy and happy."
- **Silver Saddle** — Masterfully wrought, adorned with exquisite detail - yet built for purpose, not just for show.
- **Sin of Pride** — You need not care whether they are innocent.
- **Sin: Blood of the Innocent** — A slit throat, rivers of blood... this is one of the crimes of divine covetousness of the world, witnessed by the Sultan's game.
- **Sin: Lust** — A whipped back covered in scars. The means by which ascetics purify desire, yet the more they whip, the more desire intensifies... this is one of the crimes of divine covetousness of the world, witnessed by the Sultan's game.
- **Sin: Pride** — Blinding wounds that cause blindness, this is one of the crimes of divine covetousness of the world, witnessed by the Sultan's game.
- **Sin: Strife** — Wounds engraved at the heart, tearing the human heart, this is one of the crimes of divine covetousness of the world, witnessed by the Sultan's game.
- **Sixty Rules for Life** — After reading this book, you gain Sociability +1.
- **Skeleton Knight** — A specter of a knight clad in empty black armor, mounted on a grotesque beast. Only the deep-set eyes under its tattered robe hold a glimmer of unsettling life.
- **Slander** — Accumulated Slander will prompt the Sultan to issue additional orders to you. Rest assured, they will not be merciful.
- **Slave Awaiting Death** — A slave bound and gagged, awaiting your final order.
- **Slave Hunter** — He could almost pass for a merchant — were it not for the glint of banditry in his gaze and the sharp cunning behind his smile.
- **Slave Hunters** — Be wary. These men may seem unremarkable, but they are watchful, cunning and ruthless.
- **Slayer** — A thin and sharp scimitar, made to flay, debone, and carve out the heart.
- **Sleeping Draught** — Strong enough to send anyone to sleep.
- **Sling** — Cannot guatantee accuracy. The only advantage is that stones are everywhere, ready to use...
- **Small Agate** — A small piece of agate cut from the raw stone. Such common gemstones are affordable even to the poorest Lady of Delights, though their humble beauty still surpasses that of stained glass or polished pebbles.
- **Small Amethyst** — A small piece of amethyst cut from the raw stone. Mysterious, noble, and graceful, it is the aristocrat among gemstones. Though merely the entry level of the high-grade sequence, it already lies far beyond the reach of ordinary households.
- **Small Diamond** — A small piece of diamond cut from the raw stone. "Diamond" has become a word for all things beautiful, precious, and eternal. It is the jewel of kings—and the king of jewels.
- **Small Emerald** — A small piece of emerald cut from the raw stone. With its calm, deep, and crystal-clear glow, it is the cherished favorite of noble ladies—especially those with green eyes, who would feel disgraced to be seen without a few emeralds on them.
- **Small Red Carnelian** — A small piece of red carnelian cut from the raw stone. This popular soft gem is prized for its flowing patterns and rich hue, often worn by daughters of common families as bridal ornaments.
- **Small Round Shield** — A small round weathered shield, can be strapped to the arm for minimal protection.
- **Small Ruby** — A small piece of ruby cut from the raw stone. It is as if a lover's heart were sealed within crystal—fire, blood, and rose entwined. Many cheap glass jewels try to imitate its glow, yet true connoisseurs can tell the difference from several steps away.
- **Small Sapphire** — A small piece of sapphire cut from the raw stone. It gleams on the robes of lords, the coronets of viziers, and the ears of the most elegant noblewomen. For commoners, even catching a glimpse of such a gem from afar is a rare privilege.
- **Smoke Bomb** — Rapidly dispersing smoke that can conceal your movements, making it easier for those prepared to act.
- **Smoked Lion Feast** — The devouring lion is in turns devoured. Such is the cycle of life.
- **Snake Venom** — Potent snake venom. A small wound is enough to ensure lethality. Can be used to win a duel.
- **Soldier's Protective Charm** — A tiny silver box, lined with red velvet. Within which is a piece of tightly folded paper that reads: "Though hundreds may die, let it not be my love. If only one lives, let it be my love."
- **Soldier's Training** — After reading this book, you gain Physique +1.
- **Song and Silence** — After reading this book, you gain Stealth +3. You need at least 3 in Wisdom to read it.
- **Soul Hunters** — The barbarians found and rescued by you and Riel, with indomitable combat spirit flowing through their veins.
- **Soul Imprint Pestle** — This treasure was generously sponsored by 839. Once sacred, used in worship - until followers perished and gods fell silent. Now only this corroded relic endures, forever thirsting for fresh offering of blood and spirit.
- **Spear** — A spear favored by knights.
- **Special Cuisine** — To secure the guesthouse job, Habib put his effort into preparing the cuisine.
- **Spidersilk Cloak** — A unique cloak woven out of spidersilk.
- **Spiked Ring** — Combines the function of brass knuckles and a ring.
- **Spiral Drill** — A tunneling machine lovingly crafted by Mahir. Originally conceived as an escape plan, should the Purifiers ever capture her. Really? How exactly were you planning to smuggle this into a prison?
- **Stag Head Mount** — A perfect stag's head for mounting - usable in managing the estate.
- **Stain: Angel** — Witnessed by the Sultan's game, sacred images seen in the stains of corpses and spurting blood... these are the angels welcoming the return of divinity.
- **Stain: Beads** — Witnessed by the Sultan's game, sacred images seen in greedy bite marks... these are sacred objects praising the achievements of divinity.
- **Stain: Crown** — Witnessed by the Sultan's game, sacred images seen in shattered skulls and splattered blood... this is the crown that reigns over the earth.
- **Stain: Faithful** — Witnessed by the Sultan's game, sacred images seen in traces of debauchery... these are devotees kneeling before the true god.
- **Stallion** — A jet black stallion of divine speed, it is said that it chooses its own master.
- **Standard Military Scimitar** — Standard issue of the Sultan's army, its wrought steel blade conquered one nation after another.
- **Starlight Beacon** — The stars whisper their promise: point this toward the Magician, and they shall cast their sacred spears down from the heavens...
- **Starlit Apprentice** — After reading this book, you gain Magic +1 and Charisma -1. You need at least 1 point of Magic to read it.
- **Stately Lip Ring** — A perfect embellishment to your lips, adding weight to every word you say.
- **Stone Scale** — Here lies beauty claimed too soon by fate.
- **Stone Scale** — You tell yourself this is Maggie, despite its silence, despite its inability to return your love.
- **Stone Scale** — You tell yourself this is Nabhani - at last, truly at your beck and call.
- **Stone Scale** — You tell yourself this is Nawfal, though he'll never again challenge you in the court.
- **Stone Scale** — You tell yourself this is Iman. You bathe him daily in jasmine water, hoping to mask what shouldn't be there.
- **Stone Scale** — You tell yourself this is Shama. And why not? See how perfectly it captures her essence - neither fully man nor woman, but somehow both.
- **Stone Scale** — You tell yourself this is Junah, finally receiving the love you never gave her. But does she even want it now?
- **Stone Scale** — You tell yourself this is Jalila, though she'll never raise her whip against you again.
- **Strange Mask** — Apparently she crafted it while half-asleep. No one knows what the figure on it is.
- **Succubus** — Are they beautiful? Alluring? Do you want to embrace them? Once you begin to contemplate this question, there's no escape.
- **Sultan's Nipple Chains** — This treasure was generously sponsored by 糖贰. The resemblance to our Sultan's own chest piece is uncanny – save for all those telltale bloodstains in the intricate work. You almost wonder if they might be one and the same... but surely not?
- **Sultan's Rule** — Sultan's Rule is a fate most people accept as inevitable.
- **Sun and Moon Armlets** — These armlets are intricate, perfectly balanced, and very durable. If thrown with precision, they can crack a skull.
- **Sunless Sky** — It is traditional for solar eclipses to serve as warnings to the monarch against slanders and rumourmongers. You can also unlock its potentials in Methinks.
- **Super Stinky Perfume** — A failed invention by Mahir. It reeks. Spectacularly. Who, exactly, was this for?
- **Swordsman** — They will serve you in exchange for food on the table. But a few meals is not enough to ensure undying loyalty.
- **Symbolism-Thieves** — They store stolen inspirations and memories in the subconscious of fools and madmen—hence their shocking flashes of truth.
- **Tactics** — Means to defeat an opponent.
- **Tales of Valor** — After reading this book, you gain Physique +2. You need at least 2 in Wisdom to read it.
- **Taming Bridoon** — This treasure was sponsored by 溯 氵云. This masterwork gold bridoon subdues even the wildest beasts. Though something about those engravings sends chills towards your spine.
- **Tentacle Tree** — Occasional caresses, sometimes whippings, always pain.
- **Terrifying Echoes** — After reading this poem, you gain Magic +3.
- **The Ancient Mirror** — It has slumbered in your home for years untold. How many secrets has it reflected?
- **The Ancient Mirror (Noble)** — Their minds seeded with false convictions, they march with fervor for a leader who never exist.
- **The Ancient Mirror (Noble)** — A lord so insignificant, none would notice if he were... replaced.
- **The Ancient Mirror (Noble)** — A hasty levy of men, sent to bleed for noble squabbles before they even grasp what war they fight.
- **The Ashen Blade** — Once, a prince believed he could leave his past behind. But when the fires rose to consume all he had forsaken, regret drove him into the inferno. In the smoldering ruin, he and the blade were reborn-tempered in hatred, quenched in sorrow, sharper than ever before...
- **The Blade of Lament** — It is said the Star-Souled, in their love for mortals, forged this blade alongside the jinn, tempering it with the bodies of their own kin. Once, it was known as Oath of Gilded Blood, a symbol of power passed down through the highlanders. Now, with the dynasty in ruin, it sings only in sorrow - hence, the name.
- **The Book of Kings** — How this land remembers its monarchs. To avoid unwanted attention, some names have been blotted out. After reading this book, you gain Wisdom +1 and Sociability +1.
- **The Book of Whispers** — After reading this book, you gain Magic +2 and Wisdom -1. You need at least 3 in Wisdom to read it.
- **The Bronze Shield** — These soldiers wield heavy shields, and when they form ranks, they are like an impenetrable wall.
- **The Croc Guards** — Each of these soldiers wears a crocodile helm - a grim sight for sure. They say each of the Croc Guards slays their own beast to adorn their crest.
- **The Face of Creation** — You have shaped the form of God.
- **The Fifth Element** — After reading this book, you gain Magic +1. You need at least 4 in Wisdom to read it.
- **The Frostveil Blade** — Beneath the night sky, a great treason was committed. A betrayal to a queen loved by the stars, and her kingdom... The traitors were cursed to haunt the Whetted Grassland, sharpening the blades of grass with their wails and cold contempt. When at last the bearer of the Oath of the Gilded Blood arrived, the sinners found penance in their toil, becoming part of the blade itself.
- **The Gold Blade** — These soldiers ride beneath the Sultan's gilded blade. Noble born, schooled in steel and scripture alike, they need only amass enough victories to rise to a commander's post.
- **The Grand Hunt Feast** — A mix of dozens of meats and wild greens, wrapped in a freshly baked flatbread. The smell alone is mouthwatering beyond words.
- **The Great Darkness** — After reading this poem, you gain Magic +4.
- **The Great Phallic Sword** — A divine sword imbued with the power of a certain faith.
- **The Highlord's Effigy** — Broken, yet still revered. This is the last anchor He has left in the world.
- **The Iron Crest** — These soldiers are mostly conscripts drawn from the common folk. They endure harsh training for no greater cause than a full stomach.
- **The Jackals** — A gang entrenched in the Dark Alley for years. Their roots run deep.
- **The Kingslayer** — Years have gone by without this sword having met a worthy foe.
- **The Lion-Riders** — No one knows how they tamed these ferocious beasts. They are the heralds of assured victories and painful deaths.
- **The Madame's Gold Slipper** — A romance novel popular decades back, about how a noble lady "lost" her slipper, in order to seduce a young officer. How lavish of her. After reading this book, you gain Charisma +1.
- **The Measurements of Heaven** — Record of a star whose orbit is as precise as a clock. Used as Intelligence, it can provide +4 Sociability and +4 Survival. You can also think more on its potential use.
- **The Monarch's Seed** — Show some respect! From those seeds, empires had sprung!
- **The Most Popular Man** — A masked person, nothing special other than that.
- **The Old Garden** — A book of lyrical poetry. In tottering steps, the poet ponders through a garden of lost splendors, reminiscing on the wonders of youth. After reading this book, you gain Charisma +2 and Stealth +1. You need at least 3 in Wisdom to read it.
- **The Orphan's Revenge** — After reading this book, you gain Wisdom +1, Survival +1.
- **The Pit Vipers** — Their standard issue longswords are but decorative. When the Pit Vipers bear their fangs, it is the whip-blades around their waists that unfurl to dance. With these snake-like blades, a single Pit Viper can rival ten soldiers.
- **The Prosperous City** — The bustling city across the deadly desert, now marked on Minal's map. You and Minal found it together. You met many merchants there who are eager to trade with you. Placing this card into Managing the Estate will yield additional gains.
- **The Protagonist** — You, a poor soul caught in the Sultan's Game.
- **The Protagonist/Twin** — You, a poor soul caught in the Sultan's Game.
- **The Rope's Tempering** — Dense and sigil-marked to purge malign power from the text. After reading this book, you gain Magic +2.
- **The Secret Passage** — A secret passage out of the city, built in secret by Faraj for unforeseen need.
- **The Smiling Helmet** — It keeps smiling. So will you.
- **The Star-Souled** — After enduring cycles of suffering, Lumera returned to her divine essence, her powers elevated... At a crucial moment, she might bestow a miracle upon you.
- **The Storm-Riders** — Camel riders with formidable polearms, when they charge through the battlefield, they are as devastating and terrifying as sandstorm.
- **The Sultan** — He was once a ruler of wisdom, cunning and strength. Yet beneath it all lies cruelty, madness, and a chilling indiffirence: not the work of the Cards, but the unyielding essence of his nature.
- **The Sultan's Suspicion** — You should find a way to eliminate it within 7 days. You do not want to know what the Sultan will do once his patience is exhausted.
- **The Sun's Companion** — Recording of variations in Mercury's movements and aetheric tremors. Used as Intelligence, it can provide +5 Magic and 8 reroll opportunities. You can also think more on its potential use.
- **The Taste of Revenge** — After reading this book, you gain [Insert Stat] +2.
- **The Thinking Figure** — He pondered why he was himself, and why he was not himself.
- **The Tower of Revelation** — The tower stands complete, awaiting the moment of a god's arrival.
- **The Undying** — Someone who desperately seeks immortality has finally achieved his goal, once and for all.
- **The Vagrants' Labor** — At your word, the vagrants would gather, eat your food, and do anything—expected or not. Usable in "Methinks"
- **The Warriors of Steel** — These well-trained soldiers wield long swords of gleaming steel, their armor shining bright and polished. Inhumanly disciplined, they oft overwhelm their opponents with sheer presence.
- **The Winged Cavalry** — These knights are each highly skilled in archery and riding; they are raiders on the battlefield, coming and going like the wind, their arrows falling like rain.
- **Thief Gang** — A gang formed out of escaped slaves.
- **Thief's Cloak** — A very inconspicuous cloak, completely blends into the night.
- **Thief's Shoes** — Unremarkable-looking boots, they touch the ground soundlessly.
- **Thorn Blade** — The heart it once guarded has crystallized to gem, while tender vines have hardened into killing steel.
- **Thornbind Ring** — This treasure was generously sponsored by 林塞天下第. Gift, contract, and seed rolled into one - magic scholars call such triple-natured things "Curses".
- **Tidbits on the Vizier** — Scoop of the Vizier consorting with male prostitute, witnessed by over a dozen nobles, guaranteed to be true.
- **Till Death Do Us Meet** — You only know the labels they carry now, but nothing of their past.
- **Timeless Ghazal** — After reading this poem, you gain Charisma +3.
- **Toothy Remnant** — Canines, incisors, molars-shark teeth, hound teeth, human teeth. Tearing, grinding.
- **Tornado** — A tempest born of the Amulet of the Wind, capable of scattering a troop.
- **Tornado** — A tempest born of the Amulet of Wind, capable of scourging an entire swath of land.
- **Tornado** — A tempest born of the Amulet of the Wind, capable of swallowing an entire city.
- **Torrents of History** — After reading this poem, you gain Wisdom +3, Sociability +3.
- **Trajectory of Time** — Record of a bright star appearing and disappearing in different celestial spheres. Used as Intelligence, it can provide +4 Magic, +4 intellect, and 2 reroll opportunities. You can also think on its potential use.
- **Trapped Star** — He is the North Star. Following the roads He illuminated, the highlanders built what later became the Sultanate. Henceforth, He was venerated above all else... until He fell to the Immaculate Purity, and then to your trickery... His moodiness are surely understandable.
- **Treasure Raiders** — The story of adventurers breaching a temple in search of treasures. First time reading this book grants you Stealth +1. Reading it triggers The Umbrous Temple adventure.
- **Treasure of a Lost Kingdom** — A gold statue in the Tyrian style. To avoid certain problems, you and Bharat have made some simple restoration and disguises to it.
- **Tribal Treasure** — Treasures worshipped for generations by the tribe.
- **Troop of Fanatics** — There is no doubt – your words have shaped them. They raise their blades to justice and hope, but in truth, they fight for Darkness, for you.
- **Troop of Radicals** — There is no doubt - your words have shaped them. Their blades thirst for the heat of battle and blood. Raise your banner, and they will follow, seeking not glory, but change.
- **Troop of Refugees** — Fardak and his loyal general gathered those who have lost their homes to the drought and trained them into a hardy troop.
- **Twin-Headed Ogre** — A marvel even among monsters—one head scheming and shrewd, the other fierce and fearless. Legends claim such rare creatures possess the cunning to rule kingdoms in the realms beyond.
- **Twisted Remnant** — It writhes... oh... heavens, it's writhing toward you!
- **Undead Army** — An army of accursed oath-breakers, denied rest even in death.
- **Universal Scorn** — This is a pre-duel statement, so brilliant that it could make your opponent surrender without a fight... or even die from rage. It can be used as a piece of Intelligence. When used in a duel, victory is guaranteed.
- **Unnamed Cellar Reserve** — Gift from Nawfal. A fine wine with a complex, lingering fruitwood aroma, uncommon in this city.
- **Unstable Rocket Launcher** — A failed invention by Mahir. Designed for long-range combat. It technically works. Sometimes
- **Unwavering Loyalty** — Tales of loyalty twisted into betrayal, seasoned with historical flavor but clearly more fiction than fact.
- **Vacant Mansion** — A vacant mansion you acquired after resolving the occupiers.
- **Vacant Room** — An empty room created after your recent renovation. It cna be rented out in Managing the Estate.
- **Valley of Serpents** — Grants Charisma +1 upon reading. First reading unlocks the Viper Temple adventure.
- **Veesa** — Once prisoners trapped in the Jinn Lantern, they are grateful for your rescue.
- **Veil of Myriad Faces** — Don this garment and become whoever you desire—but take care not to forget your true self.
- **Victory Against the Odds** — After reading this book, you gain Combat +3. You need at least 4 in Wisdom to read it.
- **Viper Temple** — Grants Charisma +1 upon reading. First reading unlocks the Viper Temple adventure.
- **Voyeur's Ring** — When direct observation proves unwise, let this ring be your wandering eye.
- **Warrior's Headscarf** — It can shield against sandstorms and conceal oneself.
- **Water of Life** — An elixir created by Mahir, containing immense vitality, capable of suppressing all diseases.
- **Wealthy Troll** — You need not care whether they are innocent.
- **Weapon Enchantment Ritual Blueprint** — An evil ritual blueprint detailing the ritual to enchant a weapon with flesh and blood.
- **Whispers from Nowhere** — After reading this poem, you gain Magic +2.
- **White Crocodile Pilaf** — A fragrant rice dish made from a rare white crocodile. Its scent alone is enough to entice the boldest of appetites.
- **White Honey Amber Orb** — A sacred gem of great purity, possessing the power to dispel evil. Can only be used once.
- **White Rhino** — You once conquered this massive beast and the twisted game locked it in that state, frozen as a reward to you for breaking its record.
- **White Weasels Court** — Some farce about how a colony of white weasels took over the court and elected the biggest weasel as Sultan... How is this book not banned already? After reading this book, you gain Wisdom +2, Sociability +1.
- **White-Belly** — A Dark Alley kingdpin with a singular trade - turning children into beggars.
- **Whole Roasted Camel** — Enough to feed a crowd. Finding a plate large enough is another matter entirely.
- **Wife's Resentment** — Your wife is holding a grudge... not surprising, considering what you have done. These accumulated resentment will bring you misfortune.
- **Wild Game** — Various freshly hunted birds and beasts.
- **Wild Goose Herbal Broth** — A dish that manages to balance both flavor and medicinal value.
- **Wilderness Stew** — Bubbling and rich, its ingredients are dictated by whatever the hunters happened to drag in today.
- **Winged Pauldron** — Exagerrated pauldrons worn by the cavalry and the honor guards. Particular training is required to maintain balance in them.
- **Wolf Head Scarf** — A scarf made by Jenna from the wolf's head. Absolutely terrifying.
- **Wonderful Ghazal** — After reading this poem, you gain Charisma +2.
- **Wooden Apple** — A rough wood carving, a token of gratitude from the children.
- **Words of Sages** — After reading this book, you gain Wisdom +1.
- **World Martial Arts Validation Battle** — A spellblade from a foreign land, challenging you for a prostitute's hand.
- **World Martial Arts Validation Battle** — Your challenger claims that this horrid monster is part of his power. If you are afraid, surrender.
- **World Martial Arts Validation Battle** — To make it here, beauty alone is not enough.
- **Wuthering Winds** — The story of a storm-ridden canyon. First time reading this book grants you Survival +1. Reading it triggers the Canyon of Gales adventure.
- **Young Official** — A low-rank yet indispensable official at the Sultan's court, capable and well-connected. Some say he is Nawfal's lover.
- **Zaki** — Fatuna's son. He is a remarkable youth, an uncut gem. Pure, unpolished, and blissfully ignorant of the world's cruelties.
- **Zazie** — The monarch's favor has swept away all memory of Zazie's humble origin. She rides the tides of adulation arrogantly, imperiously, and without worry. After all, her youth and beauty have already fetched her a price ten thousand times more than she could even dream in the House of Delights. As for what tomorrow may bring, she does not care.
- **Zazie** — Zazie's Token. Place it in Methinks to initiate the plot to aid Zazie. Its countdown is the countdown to Zazie's demise.
- **Ziad** — Ziad works dilligently and meticulously. Driven by the abundant energy and vigor of youth, he is always trying to understand the causes of the tax anomalies and how to rectify them, rather than, like a seasoned Tax Official, manipulating numbers to produce a pleasing report.

Source for every line above: `https://sultansgame.wiki.gg/wiki/<Card name>` (raw wikitext via api.php).

---

# PART 3 — Complete rite records from the game's own data files
### (Chinese verbatim + **my own working English translation — NOT style evidence**)

> ## ⚠ READ BEFORE USING PART 3
>
> **The English in PART 3 is my own working translation. Use it for CONTENT and
> STRUCTURE only — what happens, in what order, in which branch. Do NOT treat any
> English sentence in PART 3 as evidence about the game's prose style, sentence
> rhythm, punctuation habits or diction.**
>
> The 2026-08-24 audit checked the translations line by line and found no invented
> event, character or plot beat — but it did find a consistent one-directional drift:
> the translator **splits single Chinese sentences into two English ones**, and in at
> least four places **upgrades a plain Chinese phrase into a nicer English image**
> (e.g. `令人舒爽的风`, "a refreshing wind", became "a wind that feels good on the
> skin" — the skin is the translator's). The English therefore reads a little better
> than the Chinese, in a consistent direction. Each drift the audit identified is
> annotated in place below as a *Translation note*.
>
> **The Chinese is trustworthy**: all 93 Chinese quote blocks in PART 3 have been
> matched character-for-character against the shipped `rite/*.json` fields.
> The four lines marked `[OFFICIAL EN]` are trustworthy too: all four were re-checked
> against `sultansgame.wiki.gg` and are exact.
> Any prose-style measurement over PART 3 must run on the **Chinese**, or on the
> `[OFFICIAL EN]` lines, and never on the translations.

**Provenance.** These come from the game's shipped config, mirrored at
`https://github.com/liwenhao0427/sultans-game-config` (`rite/<id>.json`) — the same
files the Spanish/Vietnamese translation repos localise, and the same ones the Chinese
"story reader" tools parse. The Chinese lines are **verbatim game data**. The English
under each is **MY translation, not the game's published English** — except where a
line is marked `[OFFICIAL EN]`, which means I found the identical line quoted in
English on `sultansgame.wiki.gg` and used that instead.

Field meanings (from the schema): `text` = the **intro** the player reads on the rite
card · `cards_slot.sN.text` = the line printed under each character/item slot ·
`settlement` / `settlement_extre[i]` = the **result** paragraphs, selected by
`condition` — the `r1:体魄+战斗>=[1,5]` form means "roll 5 dice on Physique+Combat,
need ≥1 success", so a `<` twin of a `>=` branch is the **failure** text for that check.

Placeholders left as-is: `[s2.name]` = the name of whoever was assigned to slot 2;
`[s4.gender]` = a gendered pronoun.

---

## Rite 5000131 — 天文台 / "The Observatory"

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000131.json

**Intro:** (`text`)

> 天象仪缓缓转动，在一张轻薄的铜板上，用钢针与滚轮，压刻出复杂的图形——可以称之为真理的痕迹，也可以称之为命运的轨迹。

*(my translation)*

> The orrery turns slowly, and with steel needle and roller it stamps an intricate figure into a thin plate of copper — you may call it the trace of truth, or you may call it the track of fate.

**Slot lines:**
- s1: 天象仪 — *(my translation)* "The orrery"
- tip: 7天后会获得观测后的天象 — *(my translation)* "In 7 days you will receive the observed celestial phenomenon."

**Result** (`settlement_extre[0]`, unconditional — this rite cannot fail) — title 记录完成了:

> 天象仪的乙太平衡器会自动与目前最值得注意的天象同频——这意味着影响魔力，影响命运最强烈的星象，也可以理解为最容易观测到的。

*(my translation)* — title "The record is complete"

> The orrery's aether balance tunes itself, unbidden, to whichever sign in the heavens is most worth noting at present — meaning the one whose pull on magic and on fate is strongest, which is also to say: the one easiest to observe.

*Translation note (2026-08-24 repair):* "unbidden" is an upgrade. The Chinese is `会自动` = plainly "automatically"; the note of volition is the translator's, not the game's.

---

## Rite 5000703 — 狂风峡谷 / "Canyon of Gales"

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000703.json
Cross-check: https://sultansgame.wiki.gg/wiki/Canyon_of_Gales

**Intro:** `[OFFICIAL EN]` (first paragraph, quoted on the wiki)

> Ancient people used magic and terrain to shape the ruins here. It is perpetually windy, and the entrance of the canyon is filled with flying sand and pebbles. Statues of griffins and snakes flank the canyon, suggesting the challenges adventurers will face...

Chinese, both paragraphs:

> 古代人利用魔法与地形塑造了此处遗迹。它终年刮着狂风，而山谷入口更是飞沙走石。峡谷的两侧是狮鹫与毒蛇的神像，提示着冒险者将面对什么样的挑战……
> 经过商议之后，你们决定分工合作，掩护哲巴尔抵达山谷尽头的藏宝处……如果这本笔记没有说谎的话，那里会有一件宝物。

*(my translation of the second paragraph)*

> After some discussion you decide to split the work between you and cover Jabal until he reaches the treasure-place at the canyon's far end… If this notebook is not lying, a treasure waits there.

**Slot lines** *(my translation)*:
- s1: "The adventure-loving general — will he come this time?"
- s2: "You need at least 5 Magic to part the storm and shield the party"
- s3: "An archer, for the beasts lying in wait"
- s4: "A quick-witted adventurer, Survival 4 or higher, for all the unexpected dangers"
- s5: "Someone strong enough to endure the storm, Physique 4 or higher"
- s6: "Consumable"
- s7: "The starting point of the adventure"

**Failure — first check** (`settlement_extre[0]`, Physique+Combat < 1 success):

> 冒险队在[s2.name]法术的保护下冲入峡谷，却发现一只狮鹫在这里筑巢，而你们就是它送上门的美餐……
> [s3.name]开弓射箭，却仍然比狮鹫的利爪慢了一步。趁着同伴被撕碎的空隙，探险队慌不择路地冲向前方……

*(my translation)*

> Under the protection of [s2.name]'s spell the party charges into the canyon — only to find a griffin has nested here, and that you are the meal delivered to its door…
> [s3.name] draws and looses, and is still a step slower than the griffin's talons. In the gap bought by a companion being torn apart, the expedition bolts blindly forward…

**Success — first check** (`settlement_extre[1]`, ≥1 success):

> 冒险队在[s2.name]法术的保护下冲入峡谷，一只狮鹫在这里筑巢，而你们就是它送上门的美餐……
> [s3.name]眼疾手快，射瞎了它的左眼，随后哲巴尔奋力洞穿了它的心脏。现在，你们可以穿过腐臭的野兽巢穴，继续向前……

*(my translation)*

> Under the protection of [s2.name]'s spell the party charges into the canyon. A griffin has nested here, and you are the meal delivered to its door…
> [s3.name]'s eye and hand are quick: the arrow blinds its left eye, and then Jabal drives a blade through its heart. Now you can cross the stinking den of the beast and press on…

**Success — second check** (`settlement_extre[2]`, Wisdom+Survival ≥1):

> 在风暴雕塑的黑色石林中，你们艰难地分辨着方向……
> 无数的毒蛇从阴影中缓缓爬出，缓慢地追上了你们的步伐。
> 关键时刻，[s4.name]挺身而出，[s4.gender]点燃了自己的斗篷，留下来拦截蛇群，而其他人唯有加快步伐，冲入前方的狂风里，好不浪费[s4.gender]争取到的宝贵时间。

*(my translation)*

> In the black stone forest the storm has carved, you can barely tell one direction from another…
> Countless vipers slide out of the shadows and, slowly, catch up with your pace.
> At the critical moment [s4.name] steps forward — [s4.gender] sets [s4.gender] own cloak alight and stays behind to hold off the snakes, and the rest of you can only quicken your step and run into the gale ahead, so as not to waste the precious time [s4.gender] has bought.

**Failure — second check** (`settlement_extre[3]`, Wisdom+Survival <1):

> 在风暴雕塑的黑色石林中，你们艰难地分辨着方向……
> 无数的毒蛇从阴影中缓缓爬出，缓慢地追上了你们的步伐。
> 关键时刻，[s4.name]挺身而出，抽出武器，冲入蛇群，吸引了它们的注意，而其他人唯有加快步伐冲入前方的狂风里，好不浪费[s4.gender]争取到的宝贵时间。

*(my translation)*

> In the black stone forest the storm has carved, you can barely tell one direction from another…
> Countless vipers slide out of the shadows and, slowly, catch up with your pace.
> At the critical moment [s4.name] steps forward, draws a weapon and charges into the snakes, pulling their attention onto [s4.gender]self, and the rest of you can only quicken your step into the gale ahead, so as not to waste the precious time [s4.gender] has bought.

**Ending — magic failed, endurance held** (`settlement_extre[4]`):

> [s2.name]的法力用尽了，哲巴尔消失在了滚滚沙尘之中。剩下的人挣扎向前，想要追随他的足迹，却只能看到斑斑血迹蔓延向前方。
> 在令人绝望的等待之后，队伍已经被风沙掩埋过半……
> 突然，一切都安静了下来，风停止了，你们看到了蓝色的天空，而哲巴尔高举着一个闪光的东西从远处跑来……

*(my translation)*

> [s2.name]'s magic runs dry, and Jabal vanishes into the rolling dust. The rest of you struggle forward, wanting to follow his tracks, and can find only a trail of blood-spots leading on.
> After a wait that drains all hope, half the party lies buried in the driven sand…
> Then, suddenly, everything goes quiet. The wind stops. You see blue sky — and Jabal comes running out of the distance, holding something bright above his head…

**Ending — magic failed, endurance failed too** (`settlement_extre[5]`):

> [s2.name]的法力用尽了，哲巴尔消失在了滚滚沙尘之中。剩下的人挣扎向前，想要追随他的足迹，却只能看到斑斑血迹蔓延向前方。
> 最后，[s5.name]在一块岩石下方找到了几乎昏迷的他，并拼死将其他人带出了峡谷。哲巴尔在病床上就发誓要再次挑战，但你不知道自己是否还能再承受这样的损失。

*(my translation)*

> [s2.name]'s magic runs dry, and Jabal vanishes into the rolling dust. The rest of you struggle forward, wanting to follow his tracks, and can find only a trail of blood-spots leading on.
> In the end [s5.name] finds him half-unconscious beneath a slab of rock, and at desperate cost drags everyone out of the canyon. From his sickbed Jabal is already swearing he will try again — but you do not know whether you can bear a loss like this a second time.

*Translation note (2026-08-24 repair):* "at desperate cost" is an upgrade, and implies casualties incurred. The Chinese is `拼死` = "at the risk of his own life".

*(`settlement_extre[6]` and `[7]` are the same two endings with the opening line replaced by:*
"[s2.name]拼尽全力分开狂风，目送哲巴尔冲向峡谷尽头。剩下的人挣扎向前，想要追随他的足迹，却被一块坠落的巨石扰乱了方向。" — *my translation:* "[s2.name] spends everything parting the gale, and watches Jabal run for the canyon's end. The rest of you struggle after him, and a falling boulder throws you off his track."*)

---

## Rite 5000705 — 妖精森林 / "Forest of the Jinn"

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000705.json
Cross-check: https://sultansgame.wiki.gg/wiki/Forest_of_the_Jinn

**Intro:** `[OFFICIAL EN]`

> Legends say the Jinn are as beautiful as they are cruel, yet many claim to have won the Jinn Queen's treasures through wit and deceit… Jabal's notes speak of a wager: triumph and the Jinn will be trapped to serve you… You wonder what the cost of failure would be.

Chinese original:

> 在传说中，妖精们美丽又残忍，但又经常有人声称自己从妖精女王那里骗到了宝藏……哲巴尔的笔记上记载了一个赌约，胜利者可以把妖精囚禁起来，为自己服务……你不禁在想，这个赌约如果失败了会得到怎样的惩罚。

**Slot lines** *(my translation)*:
- s1: "The adventure-loving general — will he come this time?"
- s2: "Someone with Survival 4 or higher, enough to lead the way"
- s3: "Someone with Combat 4 or higher, to face the danger head-on"
- s4: "To handle the Jinn's tricks you need a clever head — Wisdom 4 or higher"
- s5: "Your opposite number is the Jinn Queen; you need an envoy with Charisma 4 or higher"
- s6: "The starting point of the adventure"

**Success — the thorns** (`settlement_extre[0]`, Stealth+Survival ≥1):

> 妖精森林的入口布满了苦荆，如果被它们划伤，就会重温一生中最痛苦的记忆……[s2.name]小心地拨开荆棘，为队伍指引通路……在道路的尽头，开花的枝条突然活动了起来，仿佛要择人而噬，而哲巴尔徒手拉住了它们。
> 逃脱之后，他默默流泪了许久，但并不愿意与冒险队分享自己的回忆。

*(my translation)*

> The mouth of the Jinn forest is choked with bitter briar; to be cut by it is to live through the most painful memory of your life again… [s2.name] parts the thorns carefully and guides the party through… At the end of the path the flowering branches suddenly stir, as if choosing whom to devour, and Jabal grips them with his bare hands.
> Once you are clear of it he weeps quietly for a long time, and will not share the memory with the party.

**Failure — the thorns** (`settlement_extre[1]`, <1):

> 妖精森林的入口布满了苦荆，如果被它们划伤，就会重温一生中最痛苦的记忆……[s2.name]小心地拨开荆棘，为队伍指引通路……
> 在道路的尽头，开花的枝条突然活动了起来，绊倒了你们的向导，让他跌入荆棘丛中……直到大家逃到很远之后，还能听见[s2.name]的惨叫声。

*(my translation)*

> The mouth of the Jinn forest is choked with bitter briar; to be cut by it is to live through the most painful memory of your life again… [s2.name] parts the thorns carefully and guides the party through…
> At the end of the path the flowering branches suddenly stir, trip your guide, and drop him into the briar… Long after the rest of you have fled far away, you can still hear [s2.name] screaming.

**Success — the wrestling match** (`settlement_extre[2]`, Physique+Combat ≥1):

> 一个蚕豆大的小妖精拦住了冒险队的去路，他要求和你们比赛摔跤，而且一次还要打两个人。哲巴尔与[s3.name]一拥而上，随后就看见妖精对着自己的大拇指开始吹气。
> 很快，他就变成了一个三人高的壮汉，如同玩具一般戏耍着冒险队中最强大的战士。
> 突然，[s3.name]抓住机会，刺中了他鼓囊囊的肚子——仿佛一个漏气的皮球一般，妖精喷射着难闻的味道，被吹向远方，冒险队赶紧抓住机会通过了这个关卡。

*(my translation)*

> A jinni the size of a broad bean blocks the party's road; he demands a wrestling match, two of you at once. Jabal and [s3.name] rush him together — and then watch the jinni begin to blow on his own thumb.
> Very soon he is a bruiser three men tall, playing with the strongest fighters of the party as if they were toys.
> Then [s3.name] seizes the moment and stabs his swollen belly — like a punctured leather ball the jinni goes shooting off into the distance, spraying a foul smell behind him, and the party takes the chance to get past this gate.

**Failure — the wrestling match** (`settlement_extre[3]`, <1):

> 一个蚕豆大的小妖精拦住了冒险队的去路，他要求和你们比赛摔跤，而且一次还要打两个人。哲巴尔与[s3.name]一拥而上，随后就看见妖精对着自己的大拇指开始吹气。
> 很快，他就变成了一个三人高的壮汉，如同玩具一般击倒了冒险队中最强大的战士。
> 他抓起[s3.name]，张大嘴巴，生吞而下，发出嘎嘎的咀嚼声……
> 就当你们认为自己无法幸免的时候，一把匕首从他的肚皮里刺出来……这是[s3.name]的最后一击。
> 仿佛一个漏气的皮球一般，妖精喷射着难闻的味道，被吹向远方，冒险队赶紧抓住机会通过了这个关卡。

*(my translation)*

> A jinni the size of a broad bean blocks the party's road; he demands a wrestling match, two of you at once. Jabal and [s3.name] rush him together — and then watch the jinni begin to blow on his own thumb.
> Very soon he is a bruiser three men tall, knocking down the strongest fighters of the party as if they were toys.
> He picks [s3.name] up, opens his mouth wide, swallows [s3.name] whole, and chews with a wet cracking sound…
> Just as you are certain none of you will get out alive, a dagger comes through his belly from the inside… [s3.name]'s last blow.
> Like a punctured leather ball the jinni goes shooting off into the distance, spraying a foul smell behind him, and the party takes the chance to get past this gate.

**Success — the chess game** (`settlement_extre[4]`, Wisdom ≥1):

> 下一道关卡是一盘棋局，妖精的贤者说，赌注是玩家的理智……[s4.name]欣然应战，虽然妖精可以随时修改游戏规则，但他反而利用这些规则之间的矛盾难住了对手。最后，大帽子的妖精贤者头脑发胀，像爆竹一般炸开了。空气中充满了大聪明的味道。

*(my translation)*

> The next gate is a game of chess; the jinn sage says the stake is the player's sanity… [s4.name] takes the challenge gladly, and although the jinni may rewrite the rules whenever he likes, [s4.name] turns the contradictions between those rules against him. In the end the big-hatted jinn sage's head swells and bursts like a firecracker. The air is full of the smell of great cleverness.

**Failure — the chess game** (`settlement_extre[5]`, <1):

> 下一道关卡是一盘棋局，妖精的贤者说，赌注是玩家的理智……[s4.name]欣然应战，虽然他棋艺精湛，但妖精可以随时修改游戏规则……很快，他就失去了自己的国王，同时，那些扭曲的规则永远地留在了他的脑海之中……当然，无论如何，你们剩下的幸运儿都可以继续前进，只是要注意别让[s4.name]把大便涂在自己身上。

*(my translation)*

> The next gate is a game of chess; the jinn sage says the stake is the player's sanity… [s4.name] takes the challenge gladly, and although his play is excellent the jinni may rewrite the rules whenever he likes… Very soon he has lost his king — and those twisted rules stay in his head forever… In any case, those of you still lucky can go on; just take care that [s4.name] doesn't smear himself with his own excrement.

**Failure — the Jinn Queen** (`settlement_extre[6]`, Charisma+Sociability <3):

> 穿过了这重重考验，你们见到了妖精女王，但这里根本没有什么赌约。能否得到女王的赏赐，完全取决于她当天的心情。
> [s5.name]舌灿莲花，夸耀女王的美貌与智慧，但女王似乎更看重哲巴尔的英武样貌……
> 她轻轻招了招手，勇敢的哲巴尔的眼神就被爱慕与服从所占据，他像猎犬一样爬到了女王脚下……作为赏赐，剩下的冒险者得到了一盏关着妖精的提灯。

*(my translation)*

> Past all these trials you come before the Jinn Queen — and there is no wager here at all. Whether the Queen rewards you depends entirely on her mood that day.
> [s5.name]'s tongue blooms like a lotus, praising the Queen's beauty and wisdom; but the Queen seems to think more of Jabal's soldierly looks…
> She crooks a finger, and adoration and obedience fill brave Jabal's eyes; he crawls to the Queen's feet like a hound… As a reward, the adventurers who are left receive a lantern with a jinni shut inside it.

**Success — the Jinn Queen** (`settlement_extre[7]`, ≥3):

> 穿过了这重重考验，你们见到了妖精女王，但这里根本没有什么赌约。能否得到女王的赏赐，完全取决于她当天的心情。
> [s5.name]灵机一动，跟女王讲述了苏丹游戏，于是女王格外开恩，给了冒险者一盏关着妖精的提灯，这样女王就能够通过提灯看到后面的故事。

*(my translation)*

> Past all these trials you come before the Jinn Queen — and there is no wager here at all. Whether the Queen rewards you depends entirely on her mood that day.
> [s5.name] has a flash of inspiration and tells the Queen about the Sultan's game; at which the Queen is especially gracious, and gives the adventurers a lantern with a jinni shut inside it — so that through the lantern she can watch the rest of the story.

---

## Rite 5000835 — 锐草之原 / "Sharp Glass Plains"

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000835.json
Cross-check: https://sultansgame.wiki.gg/wiki/Sharp_Glass_Plains

**Intro:** `[OFFICIAL EN]`

> An unnatural place where grass grows sharp as razors and nights become bitterly cold. Legends tell of fallen Homeland royal ghosts wandering here. Perhaps treasures or secrets lie hidden.

Chinese original:

> 这里不是一般的地方，某种不祥的超自然力量让这个地方的草如同刀子一样锋利，夜晚如同严冬一般寒冷……据说，有人看到故国皇族的幽灵在此徘徊……也许真的有什么宝藏或者隐秘的事物潜藏此间。

**Slot lines** *(my translation)*:
- s1: "The trailbreaker needs Survival 4"
- s2: "The exorcist needs Magic 5"
- s3: "The searcher needs Wisdom 5"
- s4: "The 10 gold coins this expedition costs"
- s5: "Set it on fire! Requires a special item, or someone with enough Magic"
- s6: "A Conquest Sultan card, Silver rarity or lower"
- s7: "Consumable"

**Failure — cutting the path** (`settlement_extre[0]`, <5 successes) — title 你们仿佛在刀剑中挣扎:

> [s1.name]用蛮力砍倒这些挡路的锐草，分来了一条崎岖的道路，这草丛似乎有生命一般，在寒风中舞动……不一会儿，就有人流了血，很快，所有人都满目疮痍。
> 在风势更大之前，探索队伍不得不撤退了。

*(my translation)* — title "It was as if you struggled among blades"

> [s1.name] hacks the blocking grass down by main force and opens a rough path; the grass seems alive, dancing in the cold wind… Before long someone is bleeding, and very soon everyone is cut to ribbons.
> Before the wind can rise any further, the expedition has to turn back.

**Success — cutting the path** (`settlement_extre[1]`, ≥5) — title 结草之路:

> [s1.name]花了很多心思，准备了铁链与镰刀，还有厚重的铁手套。你们用切割下来的坚固草叶捆住了周围随风乱舞的锐草，缓慢而稳妥地开辟了一条通向荒原深处的道路。

*(my translation)* — title "A road of knotted grass"

> [s1.name] has thought this through: iron chains, sickles, heavy iron gauntlets. With the tough blades you cut down you bind the sharp grass thrashing around you, and slowly, steadily, open a road into the depths of the waste.

**Failure — the cold** (`settlement_extre[2]`, Magic+Charisma <5) — title 寒彻骨:

> 那超自然的寒意降临了，队伍要拿出早已准备好的驱魔护符，却发现手指已经冻僵……
> 滚吧，离开这里！离开这尊贵之人永眠的地方！或者，你们想要像我们一样，永世受这样惩罚！？
> 这些冻寒之灵应该是受到了一些诅咒，被迫生生世世在这里体会自己背弃誓言的冷漠……不论它们犯过怎样的错，现在都成为了你探险的主要障碍。

*(my translation)* — title "Cold to the bone"

> The unnatural cold comes down. The party reaches for the warding charms they prepared long ago and finds their fingers already frozen stiff…
> *Get out — leave this place! Leave the place where the noble sleep forever! Or would you rather be like us, and suffer this punishment for all time?!*
> These frozen spirits must be under some curse, forced to feel, life after life, the coldness of their own broken oath… Whatever they did wrong, they are now the chief obstacle to your expedition.

**Success — the cold** (`settlement_extre[3]`, ≥5) — title 盲目之灵:

> [s2.name]为每个人都抹上了一些山羊油，这样在短时间之内，探险队在这些冤魂的眼中，就与路边的野兽无异。于是，探险队忍耐着刺骨的寒冷，与这些徘徊的幽魂擦肩而过，进入到了许久未有人踏足过的空旷山丘——
> 一处星辰极为美丽绚烂的地方。

*(my translation)* — title "Blinded spirits"

> [s2.name] smears everyone with goat fat, so that for a short while the expedition is, in the eyes of these wronged ghosts, no different from the beasts by the roadside. And so, enduring the bone-deep cold, the expedition passes shoulder to shoulder with the wandering dead and comes out onto an empty hill no one has set foot on in a very long time —
> a place where the stars are extraordinarily beautiful and bright.

**Failure — the search** (`settlement_extre[4]`, Wisdom+Stealth <5) — title 星光向你们隐匿了它们的秘密:

> 探险队什么都没找到，那片空旷的山丘上值得注意的东西只有星空……星空……星空……嗯，真的是有一点邪门的地方呢。

*(my translation)* — title "The starlight hid its secrets from you"

> The expedition finds nothing at all; the only thing on that empty hill worth noting is the night sky… the night sky… the night sky… Mm. It really is a slightly uncanny place.

**Success — the search** (`settlement_extre[8]`, ≥5) — title 她的遗物沐浴在星光之中:

> 仿佛拨开面纱一般，[s3.name]解开了星光遮掩的谜题——发现了那些一直在你们面前的秘密：那是一些女性的随身物品，包括了珍贵但已经老化的衣服和鞋履……看起来，它们曾经属于某位尊贵的大人物，但此人决定在这处山丘上脱下这些衣衫，并一一折叠，摆放整齐……接下来的事情我们就无从得知了。

*(my translation)* — title "Her relics bathed in starlight"

> As though lifting a veil, [s3.name] unpicks the riddle the starlight was hiding — and finds the secret that was in front of you the whole time: a woman's personal effects, among them costly but long-decayed clothes and shoes… They seem to have belonged to some person of great rank, who decided on this hill to take those garments off, and fold them one by one, and lay them out neatly… What happened after that, we have no way of knowing.

**Alternate route — burn it** (`settlement_extre[6]`, the fire slot filled) — title 野火:

> 借助[s5.name]的力量，你们点燃了这片闹鬼的荒原。锋锐的干草发疯一样燃烧了起来，时不时，在旷野里，就会爆燃出好几人高的炎柱，伴随着鬼魅的哀鸣……
> 在这一切都化作灰烬之前，正常人都不会再踏入此地半步了……

*(my translation)* — title "Wildfire"

> With [s5.name]'s help you set the haunted waste alight. The dry razor-grass burns like something gone mad; every so often, out on the open ground, a pillar of flame several men high erupts, accompanied by a ghostly wailing…
> Until all of it is ash, no sane person will take another step in here…

**Sword-bearer branch, failure** (`settlement_extre[9]`) — title 这里有什么东西在呼唤他……:

> 当无名的剑客来到这片荒原的时候，你们就知道，有什么东西完全不一样了……
> 风在低语，幽灵在哀鸣，锐草发出了诡异的声音……仿佛有无数士兵的刀刃在互相撞击。
> 本能地，剑客拔出了自己的武器，那把造型古朴的长剑——仿佛这就是某种锁钥，一切都安静了下来。坚韧如铁的锐草纷纷扑倒在地，仿佛腰身柔软的奴仆……幽灵们在满意的哀鸣中化作缥缈的雾气，夹裹着草原上的严霜，争先恐后地扑向故国的刀锋。
> 这是献祭，也是处刑，也是宽恕。仿佛受到某种感召，流浪剑客疯狂地冲向那空旷，只有星光的山丘……你们什么都没看到，而他却像疯子一样四处挖掘……没人能走近他，因为他会挥舞着那把怪异的武器，砍向每一个劝阻他，甚至想让他喝口水的好心人……最后，你们只有把他留在这里……任他进行这些疯魔的行径。

*(my translation)* — title "Something here is calling to him…"

> When the nameless swordsman comes to this waste, you know at once that something is entirely different…
> The wind whispers, the ghosts wail, the razor-grass makes an eerie sound… as though the blades of countless soldiers were striking one another.
> By instinct the swordsman draws his weapon, that plain, archaic longsword — and as if it were some kind of key, everything falls silent. The iron-tough grass lies flat, row upon row, like servants bending at the waist… The ghosts, wailing in satisfaction, dissolve into a thin mist, and dragging the plain's hard frost with them they throw themselves, one before the other, onto the blade of the old country.
> This is a sacrifice, and an execution, and a pardon. As if answering some summons, the wandering swordsman runs like a madman for that empty hill under the bare starlight… You see nothing there; he digs everywhere like a lunatic… No one can get near him, because he swings that strange weapon at anyone who tries to stop him, or even to bring him a drink of water… In the end you can only leave him there… and let him go on with this frenzy.

**Sultan-card settlements:**
`settlement_extre[12]` — title 一处荒原罢了 / *(my translation)* "Only a wasteland, then":

> 此地与故国的联系让苏丹稍微有了一些兴致……但他显然蔑视那些幽魂。毕竟，那些鬼魂无论如何作祟，也根本伤害不到他们真正的仇人——也就是至高的苏丹。
> 但无论如何，你的勇敢行为仍然配得上一张征服卡。

*(my translation)*

> This place's link to the old country stirs a little interest in the Sultan… but he plainly holds the ghosts in contempt. After all, however they haunt, those ghosts cannot lay a finger on their true enemy — the most exalted Sultan himself.
> All the same, your courage still deserves a Conquest card.

`settlement_extre[13]` — title 此事应当保密 / *(my translation)* "This should be kept quiet":

> 这些与故国相关的灵异事件，若是在宫廷上宣扬，难免会被打上谋反与不敬的嫌疑……还是不要用这段冒险来折断苏丹卡了吧。

*(my translation)*

> Uncanny business tied to the old country, if it were proclaimed at court, would inevitably draw suspicion of treason and irreverence… Better not to use this adventure to break a Sultan card after all.

---

## Rite 5000581 — 猎神 / "God-Hunting"

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000581.json
Cross-check: https://sultansgame.wiki.gg/wiki/God-Hunting

**Intro:** `[OFFICIAL EN]`

> The ritual's elegance lies in its simplicity - lure the greedy god into the vessel, block escape with darkness, counter resistance with mirrors, then slice open the vessel to release divine essence - no different from butchering livestock.

Chinese original:

> 整个仪式非常简单——把贪婪的神骗进容器里，然后用黑暗堵住祂的退路，用镜子反制祂的挣扎——最后用刀切开容器，释放出神圣的精华，跟杀一头牲口没有什么区别。

**Slot lines** *(my translation)*:
- s1: "Shama's token"
- s2: "The offering — the bait that tempts the god to take flesh in this world. Best of all is a sovereign's seed; next best, a strong body (Physique + Magic)"
- s3: "The officiant may aid the offering with his own Magic and Charisma; with a sovereign's seed, no effort is needed"
- s4: "Cloud-warden — veils the stars so the god cannot escape (Magic + Survival)"
- s5: "Mirror-warden — uses the mirror against the star-god's curse (Magic + Wisdom)"
- s6: "Knife-warden — cuts the offering's throat and reaps the god's life (Combat + Survival)"
- s7: "An elixir to save the offering… if you still want to save it."
- s8: "5 gold coins, the materials to lay out the ritual"
- s9: "Consumable"
- s10: "Conquest card"

**Opening result** (`settlement_extre[0]`, unconditional) — title 群星闪烁:

> [s3.name]念动了古老的祷词，将魔力注入[s2.name]之中，令其闪闪发光……
> 群星好奇地眨起眼睛，这么多年了，又有人在呼唤古老的星灵——[s3.gender]在呼唤最强大，同时也迷失已久的圣主！
> 最先到来的是令人舒爽的风，然后是颤抖的指北星。
> 最后，宇宙的黑暗冲破了界域交汇的狭间，星光化做箭头，穿透了，照亮了[s2.name]，由内向外，令其被圣主的力量充盈……

*(my translation)* — title "The stars glitter"

> [s3.name] speaks the old prayer and pours magic into [s2.name] until [s2.gender] shines…
> The stars blink their eyes in curiosity: after all these years, someone is calling the ancient star-spirits again — [s3.gender] is calling the mightiest and longest-lost of them, the Holy Lord!
> First comes a wind that feels good on the skin, then the trembling of the pole star.
> And at last the dark of the universe breaks through the narrow seam where the realms meet; the starlight becomes an arrowhead, pierces [s2.name] and lights [s2.gender] up, filling [s2.gender] from the inside out with the Holy Lord's power…

*Translation note (2026-08-24 repair):* two drifts in one line. (a) `令人舒爽的风` is just "a refreshing / pleasant wind" — **"on the skin" is the translator's addition**, the single clearest case of added imagery in PART 3. (b) the Chinese `然后是颤抖的指北星` has *the trembling pole star* arrive; the English makes *the trembling of the pole star* the thing that arrives.

**Failure — the cloud-warden check** (`settlement_extre[2]`, Magic+Survival <5) — title 祂察觉了这是一个陷阱:

> 在[s4.name]还没来得及合起乌云，遮掩星光的时候，天上的小星星们叽叽喳喳地叫嚷了起来——伟大的圣主，你被欺骗了！它们的光芒如针刺一般拍打着你们的眼睛和面容，令仪式混乱，而[s2.name]则发出了凄惨的嘶吼……[s2.gender]的身体开始发光，膨胀，变成一个玻璃一般的人形……随后掀翻了周围的人，在狂风中腾空而起，消失在夜空中……

*(my translation)* — title "He sensed that it was a trap"

> Before [s4.name] can draw the clouds shut and cover the starlight, the little stars overhead start chattering and shouting — *Great Holy Lord, you are being deceived!* Their light beats at your eyes and faces like needles, throwing the ritual into confusion, and [s2.name] lets out a wretched scream… [s2.gender] body begins to glow and swell into a glass-like human shape… then throws everyone nearby off [s2.gender]self, rises into the gale, and vanishes into the night sky…

**Success — the cloud-warden check** (`settlement_extre[3]`, ≥5) — title 群星知晓了你的秘密，却无法言语:

> [s2.name]开始膨胀，发光，变成半透明的玻璃人形……圣主正懵懂又急切地进入你们为其准备的新身体，而天上的小星星们看到了祂背后潜伏的屠刀……它们急切地想要警告自己的兄长，却被[s4.name]招来的乌云遮蔽——这便是为人世所迷惑的星灵所要遭受的厄运了。

*(my translation)* — title "The stars knew your secret, and could not speak"

> [s2.name] begins to swell and glow into a half-transparent glass figure… The Holy Lord, dazed and eager, is entering the new body you prepared for him, and the little stars above see the butcher's knife lying in wait behind him… Frantic to warn their elder brother, they are blotted out by the clouds [s4.name] has called down — such is the doom that waits for any star-spirit beguiled by the mortal world.

**Success — the mirror-warden check** (`settlement_extre[4]`, Magic+Wisdom ≥5) — title 没有人的帮助，神看不见自己:

> 那发光的星神想要呼唤力量，但无论是风，星光还是黑暗，都被你们的仪式隔绝，于是祂开始绝望地闪烁，尖鸣……要以自身的疯狂撕碎你们渎神的灵魂。
> 关键时刻，[s5.name]及时举起了镜子，于是神看到了丑陋的自己——被人类的愿望所毒害的衰败模样，祂的悲伤，祂的哀鸣，祂的诅咒，也全部归于己身……

*(my translation)* — title "Without human help, a god cannot see himself"

> The shining star-god reaches for his power, but wind, starlight and darkness alike are sealed off by your ritual; and so he begins to flicker in despair, and to shriek… meaning to tear your blasphemous souls apart with his own madness.
> At the critical moment [s5.name] raises the mirror in time, and the god sees his own ugliness — the ruined thing human wishes have poisoned him into — and his grief, his wailing and his curse all return upon himself…

**Failure — the mirror-warden check** (`settlement_extre[5]`, <5) — title 所有人身上都长出了红色的蜘蛛斑纹:

> 那发光的星神想要呼唤力量，但无论是风，星光还是黑暗，都被你们的仪式隔绝，于是祂开始绝望地闪烁，尖鸣……要以自身的疯狂撕碎你们渎神的灵魂。
> 你这时才明白，这便是被人类的愿望所毒害的神明——祂曾经吸收了太多，以至于无法回归属于自己的世界，而现在又太饥饿，以至于无法彻底降临人间……那众生之欲，众生之念，仿佛毒虫一般，在你们的皮肤下方爬行，向你们分享着神明的苦痛……不过仪式还没有失败！坚持住！

*(my translation)* — title "Red spider-marks came up on everyone's skin"

> The shining star-god reaches for his power, but wind, starlight and darkness alike are sealed off by your ritual; and so he begins to flicker in despair, and to shriek… meaning to tear your blasphemous souls apart with his own madness.
> Only now do you understand: this is a god poisoned by human wishes — he once absorbed so much that he can no longer return to the world that is his, and now he is too hungry to descend fully into ours… The desires of all living things, the thoughts of all living things, crawl like venomous insects beneath your skin, sharing the god's suffering with you… But the ritual has not failed yet! Hold on!

**Success — the knife-warden check, with the seed as offering** (`settlement_extre[6]`, Combat+Survival ≥3) — title 案板上的神:

> [s6.name]用尖锥刺穿了刚刚膨胀到婴儿大小的圣主，[s6.gender]的动作精准而致命，好似在处理一条肥美的鱼，没有让刀尖受到一点点鳞片的阻碍，也没有让猎物多受一点点痛苦。
> 这介于真实与虚幻之间的肉体就这样干瘪了下去，神明都应当知晓此间代价——在成为凡间生命的瞬间，祂们也就失去了不朽，会被杀死，就像任何生命都可以被杀死一样。

*(my translation)* — title "A god on the cutting board"

> [s6.name] drives an awl through the Holy Lord, who has only just swollen to the size of an infant; [s6.gender] movement is precise and lethal, like handling a fat fish — not one scale slows the point, and the prey suffers not one moment more than it must.
> That body, half real and half unreal, shrivels away. Every god ought to know the price of this: in the instant they become a mortal life, they lose their immortality, and can be killed, just as anything alive can be killed.

**Success — the knife-warden check, with a person as offering** (`settlement_extre[7]`) — title 放血:

> [s6.name]精准地切开了[s2.name]的喉咙，那伤口整齐又平滑，那些刚刚融入[s2.gender]血肉的神圣力量，就这么化作湛蓝的乙太汩汩流淌……神明都应当知晓此间代价——在成为凡间生命的瞬间，祂们也就失去了不朽，会被杀死，就像任何生命都可以被杀死一样。

*(my translation)* — title "Bleeding it out"

> [s6.name] opens [s2.name]'s throat with precision; the wound is neat and smooth, and the divine power that had only just melted into [s2.gender] flesh comes gurgling out as deep-blue aether… Every god ought to know the price of this: in the instant they become a mortal life, they lose their immortality, and can be killed, just as anything alive can be killed.

**Failure — the knife-warden check** (`settlement_extre[8]`, <3) — title 无意义的暴行:

> 神圣的受肉仪式，令[s6.name]感到恐慌。[s6.gender]持刀的手颤抖了，第一刀偏离了要害，而随后圣主的挣扎又逼迫[s6.gender]捅出了一刀又一刀……圣主死了，但那神圣的力量也在这般挣扎中消散……神明都应当知晓此间代价——在成为凡间生命的瞬间，祂们也就失去了不朽，他们会死，而且和大部分生命一样，都会无意义地白白死去。

*(my translation)* — title "Pointless butchery"

> The rite of divine incarnation throws [s6.name] into a panic. The hand holding the knife shakes; the first cut misses the vital point, and then the Holy Lord's thrashing forces [s6.gender] to stab again, and again… The Holy Lord dies, but the divine power scatters in all that thrashing… Every god ought to know the price of this: in the instant they become a mortal life, they lose their immortality — they die, and like most living things they die for nothing at all.

**Aftermath — offering saved** (`settlement_extre[9]`, elixir slot filled) — title 肉体仅仅是一个通道:

> 当最后一滴神血被放干后，你们及时地将生命之水灌入[s2.name]洞开的咽喉。得益于平整，完美的切口，血肉迅速地完美愈合了……而神明穿过己身的奇妙经历也为[s2.gender]带来了一些特别的礼物……

*(my translation)* — title "The flesh is only a passage"

> When the last drop of god's blood has been drained you pour the water of life in time down [s2.name]'s gaping throat. Thanks to the flat, perfect cut, flesh and blood knit back together at once… and the strange experience of having a god pass through [s2.gender] leaves [s2.gender] certain special gifts…

**Aftermath — offering not saved** (`settlement_extre[10]`, no elixir) — title 一次性通道:

> 当最后一滴神血被放干后，[s2.name]洞开的咽喉继续洞开着……一开始，我们就知道[s2.gender]活不下来，不是么？但至少[s2.gender]完成了自己的使命。

*(my translation)* — title "A single-use passage"

> When the last drop of god's blood has been drained, [s2.name]'s gaping throat goes on gaping… We knew from the start that [s2.gender] wouldn't survive, didn't we? But at least [s2.gender] finished what [s2.gender] was for.

**Sultan-card settlement** (`settlement_extre[11]`) — title 你在极度不洁的场合折断了一张苏丹卡:

> 你谋杀了一位神明……苏丹的游戏见证了这份功绩。在卡牌折断的那一瞬间，你透过现场狼藉的污渍，看到了崇高的幻象——那是一顶要加冕给万王之王，统御世界之神的冠冕。在太古，一位神明曾因为擅自涂抹世界的罪名而被鉴定为恶，被放逐——现在，经由游戏中制造的污渍，经由你的幻视，祂的名字将重新封圣，再度回归。

*(my translation)* — title "You broke a Sultan card in a place of utter defilement"

> You have murdered a god… The Sultan's game has witnessed the deed. In the instant the card snaps, through the mess and the stains of the scene, you see a lofty vision — a crown, to be set on the King of Kings, the god who rules the world. In the deep past a god was judged evil and cast out for the crime of daubing over the world without leave — and now, by way of the stains this game has made, by way of your vision, his name will be sanctified again, and he will return.

---

## Rite 5001029 — 宫廷决斗 / "Court Duel"

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5001029.json

**Intro:** *(my translation)*

> 昨天，你在宫廷上亮出一张杀戮卡。今天，到你与对方一同履行这不死不休的杀戮诺言的时刻了。

> Yesterday, at court, you produced a Bloodshed card. Today is the moment when you and your opponent together make good on that promise of slaughter — no quarter, to the death.

**Slot lines** *(my translation)*: s1 "Abdul" · s2 "Abdul's guard" · s3 "Abdul's guard" · s4/s5 "You may go yourself, or pick a noble follower to fight in your place" · s6 "Some items may come in handy in a fight"

**Priority settlements** (item shortcuts, `settlement_prior`):

> 你用恶毒的语言直接将对方骂死了！你获得了胜利！

*(my translation)* > With sheer venomous language you curse your opponent to death on the spot! Victory is yours!

> 你将毒液涂在了武器上，只需要轻轻割开一个小小的伤口，剩下的就是等待胜利！你赢了！

*(my translation)* > You smear venom on your weapon; you need only open one small cut, and the rest is waiting for victory. You win!

**Success — clean kill** (`settlement_extre[0]`, Combat beats opponent by ≥8):

> 阿卜德的护卫虽然极力阻拦，但凭着出人意料的速度和技巧，你依然迅速地接近到了阿卜德的身边。阿卜德孱弱的身体连手上的刀也拿不稳，你轻松地将他砍翻在地。鲜血让苏丹很满意,大家高呼着你的名字。

*(my translation)*

> Abdul's guards do all they can to block you, but with unexpected speed and skill you are at Abdul's side in moments. Abdul's frail body cannot even hold the knife in his hand steady; you cut him down without effort. The blood pleases the Sultan greatly, and everyone chants your name.

**Step failures / partials:**

`[1]`: 阿卜德的盾卫挡住了你的进攻 — *(my translation)* "Abdul's shield-guard blocks your attack."
`[2]`: 你凭借着更胜一筹的力量和技巧撞开了盾卫。 — *(my translation)* "With superior strength and skill you shove the shield-guard aside."
`[3]`: — *(my translation)* "You beat the sword-guard's weapon aside, stun him with a headbutt to the ground, and follow it with one heavy downward cut that takes his head off; blood jets from the neck like a fountain and sets the whole duelling ground alight — everyone is calling your name."
`[6]`: 你被剑卫的攻击逼退，而这时盾卫也重新包围了过来 — *(my translation)* "The sword-guard's attack drives you back, and the shield-guard closes in around you again."
`[7]`: — *(my translation)* "Things are turning against you, and you are forced to choose… wound for wound, you kill Abdul's guard, but the price is steep."
`[11]`: — *(my translation)* "The shield-guard's great strength and airtight defence fill you with despair — and now the sword-guard has surrounded you as well."

**Failure — you die** (`settlement_extre[8]` / `[13]`, contested check failed):

> 两名护卫的进攻让你左支右拙，一个不留神便被他们宰杀当场。

*(my translation)*

> The two guards' attacks have you fending off one and stumbling into the other; one lapse of attention and they butcher you where you stand.

**Failure — you win the fight and lose anyway** (`settlement_extre[5]` / `[10]` / `[15]`, final check failed):

> 阿卜德害怕地扑倒在地，而面对唾手可得地胜利你并没有急于去摘取它，你高举着自己手上地武器，环顾着四周尽情享受着观众地欢呼。阿卜德偷袭了你，并且出乎他自己意料地成功了，你看着从自己胸膛里突兀冒出剑尖，不甘心地倒下了……

*(my translation)*

> Abdul throws himself to the ground in terror; and with the victory there for the taking you are in no hurry to take it — you raise your weapon high, look around, and drink in the crowd's cheering. Abdul strikes at you from behind, and to his own astonishment it works. You watch a sword-point come jutting out of your own chest, and go down unwilling…

**Success — final** (`settlement_extre[4]` / `[9]` / `[14]`):

> 你来到阿卜德身边，毫无怜悯地将他砍翻在地。这次决斗让苏丹很满意。

*(my translation)*

> You reach Abdul's side and cut him down without a scrap of pity. The duel pleases the Sultan greatly.

---

## Rite 5000506 — 以神的名义 / "In the Name of God"

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000506.json
Related wiki page (mechanics + some quotes): https://sultansgame.wiki.gg/wiki/Haunted_Mansion

**Intro:**

> 纯净者的主祭希望你找到并抓捕在城内秘密活动的异教徒。

*(my translation)*

> The Purists' high priest wants you to find and seize the heretics working in secret inside the city.

**Slot lines** *(my translation)*:
- s1: "Someone judged a heretic, alive or dead"
- s2: "Your own devout faith, or someone to escort the heretic in"

Note: this rite has **no dice check** — the outcome text is chosen purely by *who* you hand over. This is the clearest example in the data of "the result paragraph is a function of the card you assigned".

**Result — you bring Mahir's head** (`settlement[0]`) — title 你把玛希尔的头颅带了过来:

> 你告诉祭司，玛希尔竟然胆敢窥视所谓星空的真相、窥视神的居所，这毫无疑问是异端邪行！你已经代他们将之净化掉了。
> “这个女人的确曾多次妄图窃取神圣之物。”祭司认出了她的面容，向你点头致谢，但在你追问“神圣之物”是什么的时候又闭口不言。你只好带着他的奖赏和满腹疑惑离开了。

*(my translation)* — title "You brought Mahir's head"

> You tell the priest that Mahir dared to pry into the so-called truth of the night sky, to pry into the dwelling-place of God — beyond any doubt a heretic's work! And that you have purified her on their behalf already.
> "This woman did indeed attempt, more than once, to steal what is holy." The priest recognises her face and nods his thanks — but when you press him on what "what is holy" means, he shuts his mouth again. You leave with his reward and a head full of questions.

**Result — you bring Mahir alive** (`settlement[1]`) — title 你把玛希尔带了过来:

> 你向祭司控诉玛希尔竟然胆敢窥视所谓星空的真相、窥视神的居所，这毫无疑问是异端邪行！玛希尔难以置信地瞪着你，拼命挣扎起来，但很快被守卫控制住，带了下去。
> “这个女人曾多次妄图窃取神圣之物。”祭司向你点头致谢，但在你追问“神圣之物”是什么的时候又闭口不言。你只好带着他的奖赏和满腹疑惑离开了。

*(my translation)* — title "You brought Mahir in"

> You denounce Mahir to the priest: she dared to pry into the so-called truth of the night sky, to pry into the dwelling-place of God — beyond any doubt a heretic's work! Mahir stares at you in disbelief and struggles with everything she has, but the guards have her under control soon enough and take her away.
> "This woman attempted, more than once, to steal what is holy." The priest nods his thanks — but when you press him on what "what is holy" means, he shuts his mouth again. You leave with his reward and a head full of questions.

**Result — you bring the man who worships the god in the stone** (`settlement[2]`):

> 你将异端者扭送到教会，还未说什么，就听见一阵痛苦的哀鸣。年轻人弓着身紧攥着怀中那颗破裂的石头，发出怪物一般的吼叫和哭泣，随着那颗石头在洁净的光辉中碎成齑粉，他也就这样倒在地上，失去了呼吸……
> 异神的信徒就这样被纯净者的伟力净化，祭司沉默着向你点头致谢。

*(my translation)* — title "You brought in the heretic who believes in the god within the stone"

> You frogmarch the heretic to the church, and before you can say anything there is a wail of pain. The young man doubles over, clutching the cracked stone to his chest, roaring and weeping like a monster; and as the stone crumbles to powder in the cleansing light he too falls to the ground and stops breathing…
> So the follower of the alien god is purified by the Purists' great power. The priest nods his thanks in silence.

**Result — you bring Badriyyah's head** (`settlement[3]`):

> 祭司们认出了拜铃耶的脸，这个可恨的女人吸引了黑街一大帮没见识的贱民追随她，数度清缴都……呃，因为种种原因……没能得手。
> 他们认可了你的功绩，也给了你相应的报酬。

*(my translation)* — title "You brought Badriyyah's head"

> The priests recognise Badriyyah's face. This detestable woman drew a great crowd of ignorant Dark Alley wretches after her, and several purges had… ah… for various reasons… failed to lay hands on her.
> They acknowledge your service and pay you accordingly.

**Result — you bring Badriyyah alive** (`settlement[4]`) — title 你把拜铃耶带了过来:

> 祭司们认出了拜铃耶的脸，这个可恨的女人吸引了黑街一大帮没见识的贱民追随她，数度清缴都……呃，因为种种原因……没能得手。
> 他们认可了你的功绩，也给了你相应的报酬。而拜铃耶，她被押下去、一直到最后都在极尽污言秽语辱骂你、辱骂祭司、甚至、辱骂纯净之神。

*(my translation)* — title "You brought Badriyyah in". Note: the first paragraph and the first sentence of the second are word-for-word the `settlement[3]` text above; only the closing clause is new.

> The priests recognise Badriyyah's face. This detestable woman drew a great crowd of ignorant Dark Alley wretches after her, and several purges had… ah… for various reasons… failed to lay hands on her.
> They acknowledge your service and pay you accordingly. And Badriyyah, as she is dragged away, goes on to the very last cursing you in the filthiest language she has — cursing you, cursing the priests, and even cursing the God of Purity.

**Result — you lured Badriyyah into the temple** (`settlement[5]`) — title 你把拜铃耶骗去了神殿:

> 拜铃耶踏进神殿的那一刻，就已落入了陷阱。她脸上瞬间浮现出错愕和荒唐的神色，接着化为一声声难以自已的狂笑。
> 祭司们认出了拜铃耶的笑声、也认出了她的脸，这个可恨的女人吸引了黑街一大帮没见识的贱民追随她，数度清缴都……呃，因为种种原因……没能得手。
> 他们认可你的功绩，也给了你相应的报酬。而拜铃耶，她被押下去、一直到最后都在极尽污言秽语辱骂你、辱骂祭司、甚至、辱骂纯净之神。”

*(my translation)* — title "You tricked Badriyyah into the temple". Note: the stray closing 」-style quotation mark `”` at the very end is in the shipped data and is reproduced here as-is; paragraphs 2–3 re-use the `settlement[3]` / `settlement[4]` wording, with 认出了拜铃耶的笑声、也认出了她的脸 ("recognise her laugh, and her face too") swapped in for the plain 认出了拜铃耶的脸.

> The moment Badriyyah sets foot in the temple, the trap has already closed. Astonishment and absurdity cross her face in an instant, and then turn into peal after peal of laughter she cannot stop.
> The priests recognise Badriyyah's laugh, and recognise her face too. This detestable woman drew a great crowd of ignorant Dark Alley wretches after her, and several purges had… ah… for various reasons… failed to lay hands on her.
> They acknowledge your service and pay you accordingly. And Badriyyah, as she is dragged away, goes on to the very last cursing you in the filthiest language she has — cursing you, cursing the priests, and even cursing the God of Purity."

**FAILURE — you fobbed the priest off with an innocent** (`settlement[6]`, the fallback branch):

> [s1.name]被早有准备的神殿守卫无情地拖下去时，整座神殿都回荡着其痛陈自己的无辜和咒骂你的声音。祭司们表示，他们会在掌握对方犯下邪行的确凿证据之后，给予你应得的报酬。
> 呃……你心里清楚，既然这样，这笔报酬你多半是拿不到了。

*(my translation)* — title "You grabbed some innocent to fob the priest off"

> As the temple guards, who were ready for this, drag [s1.name] mercilessly away, the whole temple rings with their anguished protests of innocence and their curses on you. The priests indicate that once they have hard evidence that this person committed the evil deeds, they will pay you what you are owed.
> Ah… you know perfectly well what that means. That payment is not coming.

---

## Rite 5000201 — 驯服仪式 / "Taming Ritual" (the Taming Bridoon)

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000201.json
Related wiki page: https://sultansgame.wiki.gg/wiki/Taming_Bridoon

> **Content note:** several branches of this rite are sexually explicit. They are quoted as they ship.

**Intro:**

> 巴拉特随马衔附赠了你一本比《哲百集》还厚的说明书和免责声明，说真的谁有耐心看完啊，又不增长智慧，反正你只要知道它能帮人驯服野兽就行了。

*(my translation)*

> Bharat threw in, along with the bridoon, an instruction manual and disclaimer thicker than the *Collected Sayings of the Philosophers*. Honestly, who has the patience to read it — it doesn't even make you wiser. All you need to know is that it helps a person tame beasts.

**Slot lines** *(my translation)*: s1 "The taming bridoon" · s2 "Who should use it?"

This rite, like *In the Name of God*, has **no dice roll** — every branch is keyed to *which character card* is in the slot. Worth the whole list as an example of card-conditioned result writing:

**Nabhani** (`settlement[0]`) — title 就是你想的那种口衔 / *(my translation)* "Yes, that kind of bit":

> 对欢场上常见的玩意儿，奈布哈尼总是缺乏必备的戒心……早有人预言他会为此付出代价，只是没想到在此刻得到了应验。

*(my translation)*

> Nabhani has never had the wariness he ought to have about the sort of toys one meets in a pleasure house… Someone predicted long ago that he would pay for it; no one expected the prediction to come true right now.

**Iman** (`settlement[1]`) — title 恶咒 / *(my translation)* "An evil charm":

> 伊曼认出了马衔上刻画的咒文，也正因此，他曲解了你的用意。他平静地将它衔在口中……对他而言，献祭自己是再简单不过的一件事。

*(my translation)*

> Iman recognises the incantation cut into the bridoon, and precisely because of that he misreads what you intended. Calmly, he takes it into his mouth… For him, offering himself up is the simplest thing in the world.

**Faraj** (`settlement[2]`) — title 呼唤 / *(my translation)* "A calling":

> 将它套在一个本就驯服的动物嘴里是一种浪费吗？回应一个爱你的人是一种浪费吗？你抚弄着法拉杰溢出口涎的唇角，轻轻地微笑起来。

*(my translation)*

> Is it a waste to put it in the mouth of an animal that was already tame? Is it a waste to answer someone who loves you? You stroke the corner of Faraj's mouth where the saliva has run over, and smile faintly.

**Jalila** (`settlement[4]`) — title 纪念品 / *(my translation)* "A keepsake":

> 把黄金马衔送给贾丽拉，本来只是作为结束事业的迟来纪念品。
> “有些客人在吃鞭子之前总是很矜持，甚至会挑剔一件刑具够不够美，配不配得上身份。他们好像不知道，欲望面前，每个人都免不了丑态百出。”贾丽拉一面说着，一面褪下衣衫服侍你，自然，马衔作为增添情趣的部分加入了这场水到渠成的情事，只是你们谁都没想到，它居然就这样摘不下来了……

*(my translation)*

> Giving the golden bridoon to Jalila was only meant as a belated keepsake to mark the end of her career.
> "Some customers are terribly reserved right up until they take the whip — they'll even complain that an instrument isn't beautiful enough, isn't worthy of their station. They don't seem to know that in front of desire, nobody escapes looking ridiculous." Jalila talks as she undresses to serve you; naturally the bridoon joins the proceedings as an added spice, and it all follows on as such things do — except that neither of you expected that it simply would not come off again…

**Shama, free** (`settlement[5]`) — title 这个我熟 / *(my translation)* "Oh, I know this one":

> 夏玛翻来覆去地看这个黄金马衔，咯咯笑着说：“我当然见过这个，不过就算是贾丽拉那里的都没你这个这么精巧，这么体贴。”说话间，她把马衔调整到合适的粗细，张口轻轻咬住，既而撩起长发，把铜环扣在脑后扣好，这才抬眼看向你。
> 就这样，你被她带领着驰骋在无边畅快的欲望原野……她真是最好的一匹雌马！

*(my translation)*

> Shama turns the golden bridoon over and over, giggling: "Of course I've seen one of these. Though even the ones at Jalila's place aren't as finely made as yours, or as considerate." As she talks she adjusts the bit to the right thickness, opens her mouth and bites down lightly on it, then sweeps her long hair up and fastens the bronze ring at the back of her head — and only then raises her eyes to you.
> And so she leads you at a gallop across a boundless, exhilarating plain of desire… She really is the finest mare of all!

**Shama, enslaved** (`settlement[6]`) — title 雌伏 / *(my translation)* "Submission":

> 看到你拿出的黄金马衔，夏玛只是温顺地跪下，双手接过它，然后张开口咬住了它，而你根本来不及阻止——但是，凭心而论，你真的没有一丁点期待看到这样的画面吗？
> 在魔力的束缚和操控下，绝色的美人就这样温驯地伏在你身侧，眼睛里再也没有那隐隐的、偶然会刺痛一个男人的高贵。她是因你变为奴隶的，此刻，也被你亲手变为了母马。

*(my translation)*

> Seeing the golden bridoon you have brought out, Shama only kneels down meekly, takes it in both hands, opens her mouth and bites down on it — and you have no time at all to stop her. But be honest: was there really not the smallest part of you that wanted to see this?
> Bound and steered by the magic, the great beauty lies tame at your side, and the faint nobility that used to sting a man now and then is gone from her eyes. It was you who made her a slave; and now, with your own hands, you have made her a mare.

**Mahir** (`settlement[7]`) — title 糟了 / *(my translation)* "Oh no":

> 你拼命阻止玛希尔把它拆掉的过程中不知道误触了什么开关，她忽然就叼着这只马衔慢慢地、四肢着地地趴下了。你从来没在这双总是洋溢着灵感和热情的眼睛里看到过这样迷茫的空洞，吓得你连连对着她道歉，承诺会努力找到解咒的方法，但她好像听不见，也不在乎，只知道围着你打转。这可怎么办啊！

*(my translation)*

> Somewhere in your frantic effort to stop Mahir taking it apart you must have tripped some catch, because all at once she has the bridoon in her teeth and is sinking slowly onto all fours. You have never seen that dazed emptiness in eyes that always brimmed with inspiration and enthusiasm; it frightens you into apologising over and over, promising you will find a way to break the spell — but she doesn't seem to hear, or to care, and only circles around you. What on earth are you supposed to do now!

**Lady Becky (a cat)** (`settlement[10]`) — title 不出意外又出意外了 / *(my translation)* "Predictably, the unexpected again":

> 贝姬夫人好像非常喜欢这只马衔。他抱着这截会叮当作响的棍棍在地上打滚、啃咬、后脚不住地蹬它，把它踢来踢去，最后，你也不知道这个马衔被扔到什么地方去了，只看到贝姬夫人正放松地整理自己柔顺的长毛，发出满意的呼噜声。

*(my translation)*

> Lady Becky seems to love the bridoon enormously. She wraps herself around the jingling little stick, rolls about with it, gnaws it, kicks at it steadily with her back feet, boots it here and there — and in the end you have no idea where the bridoon has got to. All you can see is Lady Becky, at her ease, grooming her sleek long fur and purring with satisfaction.

**Generic fallback** (`settlement[11]`) — title 就说了读说明书是浪费时间:

> 只要稍微研究一下就能把这只马衔的功能摸清楚，嘿，这不是简简单单吗？

*(my translation)* — title "Told you reading the manual was a waste of time"

> A little poking about is all it takes to work out what this bridoon does. Hey — easy, wasn't it?

**Refusal branch** (`settlement[12]`) — title 且慢 / *(my translation)* "Hold on":

> 你刚想把[s2.name]叫来，就突然想起[s2.gender]不是已经会了这项技能吗？不必这样多此一举了吧。

*(my translation)*

> You are about to call [s2.name] over when it occurs to you — doesn't [s2.gender] already have this skill? No need to gild the lily.

---

## Rite 5000630 — 受伤的白犀牛 / "Injured White Rhino"

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000630.json
Related wiki page: https://sultansgame.wiki.gg/wiki/Injured_White_Rhino

**Intro:**

> 有人在野外的一处水草丰茂之地目击到一只白犀牛，疑似受伤了。

*(my translation)*

> Someone sighted a white rhinoceros out in the wild, at a place thick with water and grass. It appeared to be wounded.

**Slot lines** *(my translation)*:
- s1: "The injured white rhino"
- s2 / s3: "You may go yourself, or send followers to hunt this white rhino"
- s4: "Some consumables can be useful in a fight"
- s5: "You may use this to break a Conquest or Carnality card of a rarity no higher than the rhino's"

**Stalk succeeded** (`settlement_extre[0]`, Stealth ≥2):

> 你成功地靠近白犀牛，不过，这也是不惊动它的极限位置了。
> 它正在河边饮水，身侧有一道狭长的伤口，还在流着血。看来这伤很深，必定是一把利刃留下的。你心里计较着，如果用投枪投中它的伤口，就能在最大程度地保护这张美丽犀皮的前提下将它杀死……

*(my translation)*

> You get close to the white rhino successfully — though this is as near as you can come without startling it.
> It is drinking at the riverbank; along its flank runs a long narrow wound, still bleeding. The cut looks deep; it must have been left by a keen blade. You work it out in your head: if a thrown spear went into that wound, you could kill it while doing the least possible damage to that beautiful hide…

**Success — the spear** (`settlement_extre[1]`, Physique+Combat ≥1) — title 你成功了:

> 归功于完美的体魄和战斗能力，投枪又狠又准地插入了白犀牛的伤口。白犀牛发出刺耳的嚎叫，发狂般地挣扎、奔跑、试图甩掉这痛苦的利器，扬起了无尽的尘土，最终，还是失血倒地，没有了声息。确定它真的不会再跳起来给你一脚之后，你擦了把汗，在血腥味引来鬣狗之前迅速地把你的猎物带走。

*(my translation)* — title "You succeeded"

> Thanks to a flawless body and flawless fighting skill, the spear goes into the rhino's wound hard and true. The white rhino lets out an ear-splitting bellow, thrashes and runs like something possessed, trying to shake off the agonising shaft, kicking up endless dust — and at last goes down from blood loss and makes no more sound. Once you are sure it really will not spring up and kick you, you wipe the sweat off and take your quarry away quickly, before the smell of blood brings hyenas.

*Translation note (2026-08-24 repair):* "like something possessed" imports a supernatural note the Chinese does not have: `发狂般地` = "as if maddened".

**Failure — the spear** (`settlement_extre[2]`, <1) — title 你失手了:

> 投枪飘忽地扎进水里，惊动了这只本就警惕的庞大生物。白犀牛昂起首来，看向了你们的位置。看来，有一场硬仗要打了。

*(my translation)* — title "You missed"

> The spear wobbles off and goes into the water, startling the huge and already wary creature. The white rhino raises its head and looks straight at where you are. It seems there is a hard fight coming.

**Contested fight — decisive win** (`settlement_extre[3]`, ≥3 net successes):

> 凭着卓越的体魄和战斗技巧，你们最终取得了胜利。白犀牛悲鸣着倒下，扬起一蓬尘土，终究是没有了声息。你擦了把汗，在血腥味引来鬣狗之前，你得赶紧把战利品带走。

*(my translation)*

> With outstanding physique and fighting skill, you win in the end. The white rhino goes down keening, throwing up a cloud of dust, and at last makes no more sound. You wipe off the sweat; before the smell of blood brings hyenas, you had better take the trophy and go.

**Contested fight — narrow win** (`settlement_extre[4]`, 1–2 net successes):

> 势均力敌的战斗，猎物和猎人的身份在随时切换，但最后还是你获胜了。白犀牛悲鸣着倒下，扬起一蓬尘土，终究是没有了声息。你和同伴彼此搀扶着，草草处理了一下伤口。时间紧迫，在血腥味引来鬣狗之前，你们必须赶紧把战利品带走。

*(my translation)*

> An even fight, in which who is hunter and who is quarry keeps changing hands — but in the end you win. The white rhino goes down keening, throwing up a cloud of dust, and at last makes no more sound. You and your companions prop each other up and patch your wounds roughly. Time is short: before the smell of blood brings hyenas, you must take the trophy and go.

**FAILURE — the fight is lost** (`settlement_extre[5]`, <1 net success):

> 白犀牛在你们中间横冲直撞，最终凭借着蛮力和强烈的求生意志逃走了。你们伤痕累累，垂头丧气，但至少，你们还活着……自此，你们彻底失去了白犀牛的消息。

*(my translation)*

> The white rhino barrels through the middle of you, and in the end escapes on brute force and a fierce will to live. You are covered in wounds and thoroughly dejected — but at least you are alive… From that day on you never hear of the white rhino again.

**Stalk failed** (`settlement_extre[6]`, Stealth <2):

> 你们刚想靠近，就不小心惊动了这只警惕的庞大生物。白犀牛昂起首来，看向了你们的位置。看来，有一场硬仗要打了。

*(my translation)*

> You have barely started to close in when you carelessly startle the wary, enormous creature. The white rhino raises its head and looks straight at where you are. It seems there is a hard fight coming.

**Carnality-card branch — the setup** (`settlement_extre[10]`):

> 为了用这种异想天开的方式完成纵欲卡，你下了很多工夫——包括让皇家饲养员为自己准备了一瓶雄性犀牛的尿液。这种气味可以迷惑犀牛，无论是为了接近它，还是……进入它。唉，为了不在这个罪恶的游戏中伤害人类，为了博苏丹一笑，你真是付出了太多！
> 话不多说，靠着这份臭气熏天的药剂，你成功接近了这头白犀牛……就如同传言一般，它受了伤，警惕而不安——现在，你身上散发的浓烈雄性气息让它产生了迷惑……

*(my translation)*

> To discharge a Carnality card by this whimsical method you have gone to a great deal of trouble — including having the royal keepers prepare you a bottle of male rhinoceros urine. The smell can confuse a rhino, whether you want to get near it or… get inside it. Ah — to avoid harming a human being in this wicked game, to raise one smile from the Sultan, you really have given up far too much!
> Enough said: on the strength of this reeking preparation you get close to the white rhino… Just as the rumour had it, it is wounded, wary, uneasy — and now the heavy male scent coming off you has it confused…

**Carnality branch, success** (`settlement_extre[11]`) — title 在夕阳下奔跑:

> 勇敢的一跃！在犀牛明白发生了什么之前，你成功扑到了它身后……并在合宜的位置固定了住了自己。
> 这一切显然完全超出了犀牛对这个世界的理解……你能感觉到它的紧张，无助，甚至也有一点点兴奋。
> 就这样，你以自己的身体驾驭着这股非凡的野性，在荒野上奔跑……直至双方都精疲力尽。当你将白犀牛牵到宫廷之上，向苏丹展示这番功绩时，它显得恬静而高贵，令群臣露出古怪的表情……苏丹则乐不可支。

*(my translation)* — title "Running in the sunset"

> A brave leap! Before the rhino understands what is happening you are onto its back… and have anchored yourself in a suitable position.
> All of this clearly exceeds anything the rhino understands about the world… You can feel its tension, its helplessness, and even a very small excitement.
> And so, with your own body, you ride this extraordinary wildness at a run across the waste… until both parties are spent. When you lead the white rhino into court and display the feat to the Sultan, it looks placid and noble, and the assembled ministers wear very strange expressions… The Sultan is beside himself with delight.

**Carnality branch, failure** (`settlement_extre[14]`) — title 它认出了你邪恶的本质:

> 白犀牛在很多故事中都被认为有一定圣洁的魔力，而现在看来，这些传说所言非虚……这头受伤的野兽躲开了你的第一次扑击，它显然被激怒了，咆哮了起来，而与之呼应的，你怀里的纵欲卡也迸发出了黑暗的气息……这玷污世界，记录世界，玩弄世界的游戏正在为一个从未有过的收藏品而感到兴奋。

*(my translation)* — title "It recognised your evil nature"

> In many stories the white rhinoceros is held to possess a certain sacred magic, and it now appears the legends did not lie… The wounded beast dodges your first lunge; it is plainly enraged, and roars — and answering it, the Carnality card against your chest gives off a burst of dark air… This game, which defiles the world, records the world and toys with the world, is excited about an item it has never had in its collection before.

**Post-victory flourish** (`settlement_extre[12]` / `[13]`) — title 你已征服荒野:

> 从此，动物们都能闻到你身上那股代表力量的气息……它们将顺服于你。
> 不过，话虽如此，人应该闻不到……吧？

*(my translation)* — title "You have conquered the wild"

> From now on, animals can all smell the scent of power on you… They will submit to you.
> Although — that said — people shouldn't be able to smell it… should they?

---

## Rite 5000796 — 苏丹的游戏 / "The Sultan's Game" (the title rite)

Source: https://github.com/liwenhao0427/sultans-game-config/blob/master/rite/5000796.json

> **Content note:** this is the rite where the Sultan card is discharged in front of the
> Sultan himself. Several branches are graphically sexual or violent. I have translated
> the framing and the less extreme branches in full; the branches I have skipped are
> named so you can find them in the source file (`settlement_extre[7]`, `[8]`, `[11]`).

**Intro:**

> 现在，高贵而仁慈的君王，要求你加入这场“苏丹的游戏”。

*(my translation)*

> And now the noble and merciful sovereign requires you to join this "Sultan's game".

**Slot lines** *(my translation)*:
- s1: "He is the masked guest from the House of Delights that day; he won the golden key and began this amusing game"
- s2 / s3: "Women of pleasure surround the Sultan"
- s4 / s5: "The Sultan orders him to join this game"
- s6 / s7: "The Sultan orders her to join this game"
- s8: "You too are 'invited' to join this debauched game"
- s9: "You may take the chance to break any Sultan card, except…"
- s10: "A consumable that will come in handy — or, if you mean to break an Extravagance card, 30 gold coins"

**Opening result** (`settlement[0]`) — title 你踏入这欲望之所:

> 一掀开欢愉之馆的珠帘，于一片目眩神迷的珠光之中，你看见苏丹坐在最深处的阴影之中，惬意地微眯着眼睛，看起来如一头松弛而舒缓的野兽。

*(my translation)* — title "You step into this house of desire"

> Lifting the beaded curtain of the House of Delights, in a dazzle of pearl-light, you see the Sultan seated in the deepest shadow, eyes contentedly half-closed, looking like a beast at ease.

**Slot-conditioned scene lines** (`settlement_extre[0]`–`[4]`, one per filled slot):

> [s2.name]赤裸地跪在他脚边，美丽而光洁的脊背承托着桌案上的金盘和美酒。

*(my translation)* > [s2.name] kneels naked at his feet, her beautiful smooth back carrying the golden dish and the wine that serve as his table.

> [s3.name]伏在地毯上，双手捧着一卷文书，一面呻吟，一面装腔作势地念着上面写的劝谏的话语。

*(my translation)* > [s3.name] lies over the carpet, holding a scroll in both hands, moaning and at the same time declaiming, with mock solemnity, the words of remonstrance written on it.

> 纱帘的遮掩之下，[s4.name]被缚于刑架上，胸膛上叠着考究的鞭痕。女奴们时时用羽毛拂弄着他的身体，而他紧蹙着眉峰，闭目隐忍，因为主人不允许他在此释放。

*(my translation)* > Behind the gauze curtain, [s4.name] is bound to a frame, tidy overlapping whip-marks across his chest. Slave girls stroke his body with feathers from time to time, and he knits his brows and endures with his eyes shut, because his master has not permitted him to finish here.

> [s6.name]则跪坐在酒宴的桌边，她是场中唯一一个衣着整齐的女士，但你却能看出，在宽大的衣袍下方她在拼命忍耐着什么，也许是痛苦，也许是欲望。

*(my translation)* > [s6.name] kneels at the banquet table — the only woman in the room who is fully dressed; but you can tell that beneath the loose robe she is desperately enduring something, perhaps pain, perhaps desire.

> 当然，还有[s5.name]和[s7.name]……你看见他们正在圣前狂热又迷醉地交欢，到底是苏丹的命令迫使他们如此表演？还是暴君的诱惑解放了他们的本性？

*(my translation)* > And of course there are [s5.name] and [s7.name]… You see them coupling before the holy presence, feverish and drunk with it. Is it the Sultan's order that forces them to perform like this? Or has the tyrant's temptation set their true natures free?

> 当你在苏丹面前跪下时，地板上湿漉漉的气味扑面而来，某种炽热的东西盘桓在你的头顶，让你不敢抬头。

*(my translation)* > When you kneel before the Sultan, the wet smell of the floor comes up into your face, and something scorching hovers above your head that you dare not look up at.

**Result — you present a Conquest card** (`settlement_extre[6]`) — title 你呈上一张征服卡:

> 苏丹为你的胆量与疯狂哈哈大笑，作为奖励，你的尸体成为了聚会中最受欢迎的玩具——而你的头被光荣地放在王座上见证了全部过程。

*(my translation)* — title "You presented a Conquest card"

> The Sultan roars with laughter at your nerve and your madness; and as a reward your corpse becomes the most popular toy at the party — while your head is honoured with a place on the throne, to witness the whole thing.

**Result — you present a Bloodshed card** (`settlement_extre[11]`) — title 你提议为苏丹的游戏增添些许雅兴 / *(my translation)* "You proposed to add a little refinement to the Sultan's game". *(Body omitted here: a long, explicit description of flaying a chosen person alive. Present in the source file.)*

**Result — you present an Extravagance card + 30 gold** (`settlement_extre[10]`) — title 你为苏丹的游戏增添了些许雅兴:

> 美酒、佳肴、还有各式各样的奇珍玩具，你带着这些东西来到苏丹的面前，说这是你的一点小小心意。苏丹被你取悦了，他从那些琳琅满目的小玩意儿里挑了个最有趣的，把它赏赐给了你——用他的金刀切开了你的皮肤，亲手帮你穿在了身体上。

*(my translation)* — title "You added a little refinement to the Sultan's game"

> Fine wine, fine food, curios and toys of every kind — you bring all of it before the Sultan and say it is a small token of your regard. The Sultan is pleased with you. From among the dazzling little objects he picks the most amusing one and bestows it on you — opening your skin with his golden knife and fitting it onto your body with his own hands.

**Result — Gold-rarity Carnality card, check failed** (`settlement_extre[8]`) — title 但，你并没能唤起苏丹的兴致 / *(my translation)* "But you failed to stir the Sultan's interest". *(Body omitted here: explicit. In the source file.)*

**Result — Gold-rarity Carnality card, check passed** (`settlement_extre[9]`, Sociability+Charisma beats the Sultan's by ≥3) — title 你勾起了苏丹一点微小的兴致:

> 权势、财富、人们总是渴望从苏丹这里得到更多，你与他们又有什么不同？
> 苏丹从黄金的座椅上长身而起，烛火在他身后拖开一条长长的影子，跃动犹如魔鬼。
> 他带着他胸中的魔鬼步到你的面前，用他高贵的脚尖抬起你低俯的头颅，“是吗，那就取悦我吧。”
> 你双手背在身后，如一条受训良好的猎犬。这样，你终于用舌尖品尝到了你的君王、你的主人皮肤的味道。它并不令人快乐，犹如一场肆意妄为、摧枯拉朽的风暴，又有点温暖，像被血浸透的铁……

*(my translation)* — title "You stirred some small interest in the Sultan"

> Power, wealth — people always want more out of the Sultan. How are you any different from them?
> The Sultan rises to his full height from the golden chair; the candle-flames drag a long shadow out behind him, and it leaps like a devil.
> He carries the devil in his breast over to where you are, tips your lowered head up with the point of his noble foot, and says: "Is that so. Then please me."
> Your hands go behind your back, like a well-trained hound. And so at last you taste with the tip of your tongue the flavour of your sovereign's, your master's, skin. It gives no pleasure. It is like a storm that runs wild and levels everything, and also a little warm, like iron soaked in blood…

*Translation note (2026-08-24 repair):* the speech tag "and says:" is inserted; the Chinese `“是吗，那就取悦我吧。”` has no verb of speaking. This block also shows the file-wide pattern of splitting one Chinese sentence into two English ones.

**Closing result** (`settlement_extre[12]`, no Conquest card):

> 日月不再轮转，昼与夜不再降临，直到世界的主人感到无聊了。苏丹打着哈欠，百无聊赖地踢开依偎着他的温香软玉，踏过满地狼藉，施施然离去。
> 直到这时，风才吹进这被欲望盛满的房间，你才缓缓记起自己的名字，才终于意识到，原来自己还在人间。

*(my translation)*

> The sun and moon stop turning; day and night stop arriving; until the master of the world grows bored. The Sultan yawns, listlessly kicks aside the warm soft creatures nestled against him, walks across the wreckage on the floor and strolls out.
> Only then does the wind blow into this room brimful of desire; only then do you slowly recall your own name, and realise at last that you are still, after all, in the world of the living.

**Closing result, variant** (`settlement_extre[13]`, when a particular card is present):

> 日月不再轮转，昼与夜不再降临，直到世界的主人感到无聊了。苏丹打着哈欠，百无聊赖地踢开依偎着他的温香软玉，你能隐约感觉到，他的目光在某个人身上流连了片刻，仿佛燃起了一种幽微的兴趣，但你不确定那个人是谁。
> 直到苏丹踏过满地狼藉，施施然离去之后，风才吹进这被欲望盛满的房间，吹散了这无关紧要的疑虑。你缓缓记起自己的名字，缓缓意识到，原来自己还在人间。

*(my translation)*

> The sun and moon stop turning; day and night stop arriving; until the master of the world grows bored. The Sultan yawns and listlessly kicks aside the warm soft creatures nestled against him — and you can dimly feel his gaze linger a moment on someone, as though some faint interest had kindled in him; but you are not sure who.
> Not until the Sultan has walked across the wreckage on the floor and strolled out does the wind blow into this room brimful of desire and scatter that unimportant doubt. Slowly you recall your own name; slowly you realise that you are still, after all, in the world of the living.

**Optional hidden result** (`settlement_extre[14]`) — title 最重要的东西:

> 你贿赂了搬运垃圾的奴隶，在他们的掩护下，回收了一份珍贵的，属于苏丹的生命精华。他至少消耗了四五个这样的套子，最后全都扔进了装满辣椒粉的盒子里——而其中一个被你用几乎一样的赝品掉包了。

*(my translation)* — title "The most important thing"

> You bribe the slaves who carry out the rubbish, and under their cover you recover one precious portion of the Sultan's own essence of life. He got through at least four or five of those sheaths, and threw them all at the end into a box packed with chilli powder — and one of them you swapped for a near-identical forgery.


---

# PART 4 — Random events, English, from a Steam community guide

Source: https://steamcommunity.com/sharedfiles/filedetails/?id=3464000283 ("Random Events (Text-only)")

These are the end-of-day random event cards. Each block below is the event's **intro
text** as the guide transcribes it (I have cut the guide's mechanical outcome list that
follows each one; the outcomes there are stat deltas, not prose). This is
community-transcribed English — it reads like the shipped English but I could not
verify it against the game binary, so treat fidelity as *high but unverified*.

### Event 1

**Intro:**

> A bored noble in the city sent his two slaves into the desert, betting on which slave would live longer. Would it be the strong man who had lost an arm, or the weak woman?

### Event 2

**Intro:**

> A colleague from the court came to your home for a feast. Probably having drunk too much, he drunkenly vented his grievances to you and began to recklessly complain about the Sultan...

### Event 3

**Intro:**

> A lavishly dressed man suddenly appeared at your door, gesturing to indicate he was an exiled foreign prince and hoping for your support to return home, promising a reward afterward. Whether or not there would be a reward, you knew there was definitely a trick...

### Event 4

**Intro:**

> A noble presents the Sultan with a strange beast: it has the head of a deer, the body of a leopard, and the tail of a pheasant. The Sultan is very intrigued by the creature and asks you how to interpret it.

### Event 5

**Intro:**

> A noble stopped you, hoping you could tell him the tier of himself and his archenemy. You recalled his name and made a judgment silently in your heart- he was just a Bronze-tiered young man, and his archenemy, who was about to inherit the family property, would soon reach Silver tier. "Your archenemy is Silver tier, as for you..." You hesitated whether to tell the truth.

### Event 6

**Intro:**

> A peculiar man claiming to be an inventor seeks an The Grand Game, presenting a mechanical bird made of metal. The bird can tell time, fly, and preen its feathers. He hopes the Sultan will buy it with its weight in gold.

### Event 7

**Intro:**

> A person suddenly approaches you, showing you a bundle of old items, claiming they are treasures passed down from your ancestors and asking you to buy them back. You inspect them; some are good, some are clearly fake, but some seem worth appreciating.

### Event 8

**Intro:**

> A poet kept by a nearby clan has been writing satirical poems about you lately, annoying and persistent like a fly.

### Event 9

**Intro:**

> A poor man complains that he invested all his savings to help his brother start a business, which has since prospered. However, his brother now refuses to share any of the profits. While his brother has grown wealthy, he struggles to even provide for his daughter. The brother, now a successful merchant, angrily insists that the borrowed money was repaid in full years ago.

### Event 10

**Intro:**

> A river that flowed through the territories of two Nobles suddenly changed its course recently. Now it flows through one Noble's land but hardly through the other's. The latter presented this matter to the Sultan, requesting an adjustment of their land borders. He is willing to cede a larger piece of land in exchange for the area where the river flows. The Sultan asked what you think about this matter...

### Event 11

**Intro:**

> A strange merchant invites you to invest in their caravan. They plan to depart soon, traveling along the coast to transport Eastern goods to the distant North... If they arrive smoothly, a hefty profit awaits. However, long-distance trade journeys are always fraught with various risks.

### Event 12

**Intro:**

> A strangely dressed itinerant monk claimed that you have a connection to the god he worships, and wanted to give you an ancient statue. The statue had a serene and compassionate look, but you always felt something was off about it...

### Event 13

**Intro:**

> A wanton Noble lady demands the Sultan's judgment on her marriage. She married a Noble, but the husband, feeling insecure about his performance inb ed, secretly had his brother fulfill his marital duties. The Noble lady didn't realize that the nightly visitor wasn't her husband until her husband died unexpectedly in a fall, and the unaware brother sneaked into her bedroom that very night! Now, the enraged and grieving Noble lady demands the entire property of her deceased husband's family - including the brother's share - as compensation for the family's deceit.

### Event 14

**Intro:**

> At midnight, you hear a knock on your door. A young, beautiful woman dressed seductively appears shyly asking to spend the night with you...

### Event 15

**Intro:**

> Earlier, when you were still prosperous, you lent some moeny to a friend. Now, in your time of need, he found various excuses to refuse... The newly bought gemstone ring swayed in front of you, particularly annoying.

### Event 16

**Intro:**

> Envoys from a neighboring country come to request permission from the Sultan to establish a trade route. They want to transport the rice and spices from the Sultan's lands to their own coutnry. This trade deal is certainly beneficial, but the neighboring country is experiencing a famine, making price negotiations tricky...

### Event 17

**Intro:**

> In the city, a noble's mansion suddenly caught fire! The lady of the house cried out that her pet cat was still inside, but people were holding her back, saying it's not worth risking her life for a cat...

### Event 18

**Intro:**

> It's about to rain heavily, and a group of passing travelers  hope to rest under your roof. They look weary and travel-worn. However, you notice faint bloodstains on the hems of their cloaks and the outlines of their weapons under their tarps. They are certainly not ordinary Merchants... you decide?

### Event 19

**Intro:**

> Maggie had a beloved piece of jewelry stolen-who could have done it? Inal, the maid who came with her dowry, has the easiest access to her jewelry box; and the boy, Zephyr, often runs errands in the city and can easily fence stolen goods... Or... could it be a friend who recently visited your wife?

### Event 20

**Intro:**

> On the street, a peculiar man stops you and invites you to join a mysterious game... He tells you that if you successfully complete it, you will receive a rare treasure, and the game is very simple, with every step clearly written in this ancient manual...

### Event 21

**Intro:**

> Recently, a highly explicit picture book has been circulating secretly in the city, with you and the Sultan as the protagonists...

### Event 22

**Intro:**

> Recently, several wells in the royal city have suddenly turned bitter, prompting many complaints. The Sultan asks for your opinion...

### Event 23

**Intro:**

> Several friends from your old school gather at your home. After a few drinks, you all discuss a topic that had sparked debates back then: What distinguishes humans from animals - the soul, intellect, body, or divinity?

### Event 24

**Intro:**

> Someone accuses their neighbor of smashing a sacred stone they carry- a relic housing their family's good. The neighbor fires back, furious, calling it a sham- anyone can see it's just a common cracked rock!

### Event 25

**Intro:**

> Someone beats drums and gongs at your doorstep, singing hymns loudly. As you open the door, a group of children shower you with white flowers and shout 'Hooray' and 'Thank you.' Before you figure out what's going on, they pull out a donation banner 'for the pure children'...

### Event 26

**Intro:**

> Someone entrusts their child to a sandfolk tribe with some trade ties, convinced that growing up in the desert toughens the body and sharpens the mind. But after an undeard-of sandstorm sweeps through, the sandfolks tell him the child vanishes- a gentle way of putting it. Everyone knows no kid survives alone in that merciless desert...

### Event 27

**Intro:**

> Someone pounds on your door, staring at you with hollow eyes. "A demon nests in your heart... It gnaws at you, bends you, and, in the end, devours your soul, turning you into a puppet of its will... Only I can save you, only I can save you." His eyes twitch wildly. "Let me split your chest open - let me rip it out for you."

### Event 28

**Intro:**

> Someone presented a popular booklet from the market, which told a legendary love story between a king and a fallen princess. In the story, the princess, having lost her country, has to work as a washerwoman. She meets the handsome monarch by the river while washing clothes, and the two overcome many difficulties to find happiness. The Sultan asks what you think of this matter...

### Event 29

**Intro:**

> The Sultan, in a whimiscial mood, asks you to judge the most beautiful female in his harem...

### Event 30

**Intro:**

> The sultan had a strange dream that left him unsettled. He asked you to interpret the dream for him. In the dream, the Sultan saw a beautiful woman standing on the edge of a cliff. As he approached her, she began to slowly jump off the cliff, and he ran to see her shattered body below. Then, he suddenly saw the woman standing next to him again, jumping off the cliff and shattering once more. This scen repeated countless times until he finally woke up.

### Event 31

**Intro:**

> There is a dispute at the city gate. After inquiries, you learn these travelers want to enter the city for pilgrimage but cannot provide a guarantee. The guards firmly insist they might be spies and refuse entry. A guarantee? You've never heard of a city entry guarantee. Maybe it's a new ruse by the soldiers to extort. You decide...

### Event 32

**Intro:**

> This morning, Maggie seemed very troubled. She said she had a nightmare where she was on a small boat with a dog, a rope, and a flute. The boat was drifting on the sea, and she felt increasingly afraid but didn't know how to sue these three items. She seeks your comfort. How would you explain the dream?

### Event 33

**Intro:**

> Two people in the city are arguing. One claims that his neighbor stole his sheep, while the neighbor says that he abandoned the sick lamb, and if not for him taking it in and treating it, the lamb would have died in the desert... They ask you to judge who the sheep should belong to.

### Event 34

**Intro:**

> When disaster struck, you and your wife dismissed most of the servants to keep them from being caught up in this cruel game. Unfortunately, not everyone appreciated your goodwill ;one person stole some money... Luckily, he was caught just as he was about to spend it.

### Event 35

**Intro:**

> Your farmers are worried because somsone has recently drawn many mysterious sigils near their homes... Perhaps wise Master, you can find something out?

### Event 36

**Intro:**

> Your neighbor- a fool who always competes with you- beats his own wife's face just to warn her not to talk to someone like you (a man who commits adultery with women using magician cards).,

### Event 37

**Intro:**

> Your neighbor, a scholar, complained that your feast was too noisy, interrupting his creative flow and preventing him from finishing his great work!

### Event 38

**Intro:**

> You recently discovered that the soldiers' training performances have been extremely slack. Upon investigation, you found out that someone has been spreading an evil belief among them, teaching them to seize the comfort and glory of this world and not to worry about the crises and depravity of the afterlife...

### Event 39

**Intro:**

> While the bookstore owner and the book seller were bargaining, you noticed a few children slowly approaching you, pretending to look straight ahead but glancing at you like cats crouching near pigeons. So, you pretended to look at the book in the book seller's hand and suddenly reached back to catch a little dirty hand reaching for your belt. You swiftly grabbed the book seller and flipped him to the ground before he could escape. This guy wanted to make twice the money, both from the book and from the cut he got from the thief... Now he and the little thief beg for mercy, saying they were wrong to target your wallet. To demonstrate his sincerity, the man slaps himself while the little thief knocks his head hard. Everyone around is watching... What will you do?

### Event 40

**Intro:**

> A plainly dressed man angrily blocks your path. You remember him as the young prisoner you rescued from jail for speaking against the Sultan. During this time out of prison, he has figured out the current situation- you have become a player of the Sultan's Game! "How can you do this?" he appears deeply disappointed, "I never thought I was rescued by someone like you... I'd rather go back to prison and wait for that Bloodshed card pointed at me! Ha, it's absurd!"

### Event 41

**Intro:**

> A maid takes a great risk to ask for your help. The mistress of her lord, a tax collector, went back to her hometown with her child some time ago and never returned. After a brief investigation, her hometown people claimed they had never seen her. The official handling the case thus ruled that the tax collector murdered her to get her dowry and fabricated her disappearance. But the maid insists her master would never do such a thing; he and his wife have always been very loving. She heard you are a rare kind noble and plucks up the courage to seek your help to find the truth.

### Event 42

**Intro:**

> The Fate Shop upgrade adds end of turn events, which will be listed below.

### Event 43

**Intro:**

> At a court meeting, a minister pleads for aid as disaster strikes his territory, seeking funds from the Sultan. The courtiers immediately mock him, saying he deserves his fate - years ago, after struggling with infertility, he made a sacred vow to a deity. He had promised to give up his third child in exchange for divine blessing. The deity answered his prayers, granting him children. But when his third child was finally born, a father's love stayed his hand from fulfilling the sacred vow. Now his lands suffer under divine wrath - punishment for his faithlessness!


*(43 events transcribed.)*

---

# WHAT I COULD NOT GET

**The one thing missing: the game's own published English `config.json`.**
The game ships `StreamingAssets/i18n/<lang>/config.json` (~10–13 MB per language),
keyed `rite_N_text`, `rite_N_cards_slot_sN_text`, `rite_N_settlement_N_text`,
`rite_N_settlement_extre_N_text`, `card_N_text`. If the **`en`** file could be found,
it would give perfect verbatim English for every intro / slot line / result / extreme
result in the game — the complete version of PART 3. It does not appear to be on the
public internet. Everything I tried:

| Source | Result |
|---|---|
| GitHub repo search: `sultan game translation`, `sultan localization`, `sultansgame`, `苏丹的游戏` (in name and in description; ~200 repos reviewed) | Found ~30 Sultan's Game repos. **All game-data repos are Chinese**; the only translations published are `Jastro/sultan` (`i18n/es`) and `neyney2810/sultan-game-vi-translation` (Vietnamese). No `i18n/en`. |
| GitHub **code** search (authenticated) for `settlement_extre`, `result_text` + English words, `cards_slot` + `result_title`, `rite_5000003_text`, JSON >10 KB containing `result_text` | Every hit is Chinese data (`MarcWebber/sultan-s-game-cheater`, `AC-HUB-AC/Sultan_s_Game_Event_Viewer`, `liwenhao0427/sultans-game-config`, `wuhuhu-k/sudangame-config`, `miffycs/sultans-game-mod`). Zero English hits. |
| `liwenhao0427/SultansGameReader` (Electron story reader) | Ships the *parser*, not the data. Reads the user's local install. |
| `hanpaemo/sultans-game-korean-patch` | README + screenshots only; the patch itself is not in the repo. |
| `fasa70/SultansGameModManager` | Only an id catalog (`base-id-catalog-10005.json`), no text. |
| archive.org full-text/item search for "Sultan's Game" | Only a Nov-2024 dump of the wiki itself; no game data. |
| `sultansgame.fandom.com` | Does not exist (404 on `api.php`). |
| `sultan.huijiwiki.com` (Chinese wiki) | 403 to non-browser clients; not retried, since the Chinese source text is already available in full from the config repos. |
| Steam guide index (`steamcommunity.com/app/3117820/guides`, `workshop/browse`) | Steam serves an empty/JS-only listing to `curl`; had to find guide ids through web search instead. |
| Steam guide 3459052703 ("Random Event") | Mechanics only — stat deltas, **no prose**. |
| Steam guide 3464000283 ("Random Events (Text-only)") | **Worked** → PART 4. |
| The "Sultan's Game – Digital Novel" (Steam app 3728320) | Ships as a PDF inside the buyer's local game folder; not obtainable without owning it. |

**Things I did NOT try** (flagged in case you want them chased):
- Buying/owning the game and reading `StreamingAssets/i18n/en/config.json` directly.
  This is by far the highest-yield option and would make PART 3 unnecessary — it is
  ~1,150 rites × (intro + slot lines + every settlement branch) in official English.
- YouTube auto-transcripts of walkthroughs. Auto-captions of on-screen *read text* are
  unreliable (the game's text is not narrated aloud), so I judged the fidelity too poor
  for a study that needs exact wording, and spent the time on the wiki instead.
- TV Tropes `VideoGame/SultansGame`. It quotes little verbatim rite text and what it
  does quote is already covered by the wiki.

**Known fidelity caveats inside this file:**
- PART 1 quotes are only as faithful as the wiki editor who transcribed them. Spot
  checks against the Chinese source (Canyon of Gales, Forest of the Jinn, Sharp Glass
  Plains, God-Hunting) matched sentence-for-sentence, so confidence is high — but a
  handful of quotes on the wiki are lightly trimmed with `…` and one or two contain
  editor typos (`Mistery Box` on the `Alim` page is the wiki's, not mine).
- A leftover `text=` template-parameter prefix was stripped from 87 PART 1 quotes; the
  words after it are untouched. (86 at collection time; the 87th, on `Endry`, was missed
  then and stripped during the 2026-08-24 repair.)
- PART 3 English is **mine**, and it is a *working* translation, not a literal one.
  (The original wording of this caveat — "I kept it literal (clause order and
  punctuation follow the Chinese)" — was **overstated and has been corrected**: the
  2026-08-24 audit showed the translation routinely splits one Chinese sentence into
  two English ones, so the punctuation does *not* follow the Chinese, and in at least
  four places it upgrades a plain phrase into a nicer image.) It is therefore *not* a
  sample of the game's published English prose style — only of its content and shape,
  and every drift the audit found is annotated in place. Where the published English
  exists I marked the line `[OFFICIAL EN]`.
