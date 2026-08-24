# Complete Sultan's Game rite records — official shipped English

Assembled 2026-08-24.

---

## READ THIS FIRST — the premise of the brief is out of date

The brief assumed `StreamingAssets/i18n/en/config.json` is not public and that the only route to
official English was cross-matching ~98 wiki.gg `{{quote}}` pages against the Chinese rite configs.

**That file is public, and a prior session already downloaded it into this very directory.**
See `english_source_hunt.md`: `sultans_en/config.json`, 7,762,449 bytes, 38,797 keys, from
`github.com/we1how/Sultan-s-Game_Data` (`StreamingAssets/i18n/en/config.json`). 23,375 of its keys
are `rite_*`. The same repo also carries the **version-matched** Chinese structural config
(`StreamingAssets/config/rite/*.json`, 1,382 rites), which supplies the piece the localisation file
lacks: each settlement branch's dice/state **condition**.

Joining those two gives a complete, verbatim, official-English record for essentially every rite in
the game — intro, slot lines, dice line, and every outcome branch with its exact condition. The wiki
cross-match was still run in full, but its role changed from *source* to *independent proof* that
the localisation file is the shipped English (see Provenance below).

---

## Summary

### What official English exists, across the whole rite corpus (1,382 rites)

| English coverage | rites | note |
|---|---:|---|
| **Full record** — intro + slot lines + **every** outcome branch in English | **1,366** | 98.8% of the corpus |
| English intro + some but not all outcomes | 0 | — |
| English intro only | 0 | — |
| No English intro | 7 | intro is empty in the **Chinese** too (estate-expansion rites: `5000057`, `5000060`, `5000061`, `5000062`, `5006024`, `5006025`, `5008165`) |
| No outcome branches at all | 9 | all named `Abandoned` / `Discard` — dead rite slots (`5000311`, `5000338`, `5000351`, `5000715`–`5000719`, `5008086`) |

**Nothing in the rite corpus is CN-only.** Every field that has Chinese text has English text.
There is no `[CN ONLY]` marking anywhere in the records below, because there is nothing to mark.

### What the wiki-only route would have produced, for comparison

The wiki sweep was completed as specified before the pivot. Numbers, self-verified:

- **1,137** content pages enumerated (ns0; the wiki reports 859 "articles" + redirects/stubs).
- **98** pages contain `{{quote` — the brief's figure is exactly right.
- **216** `{{quote}}` templates in those 98 pages; a further **978** italic / `mw-collapsible`
  prose blocks across **229** pages carry game text the `{{quote}}`-only sweep misses.
- **238** distinct official English `rite_*` strings across **140 rites** are corroborated by
  that wiki prose. 163 of the matching blocks agree *verbatim* after whitespace/quote-mark
  normalisation; the rest agree on 5-gram word overlap, differing only because the wiki preserves
  an **earlier build's** official translation (e.g. rite `5008177`: wiki "While you anxiously
  ponder what the Cultists might do with your Conquest Card…" vs current build "While fretting
  over what the cultists might do with your Conquest Card…").

Assembling *only* from the wiki, those 140 rites would have come out as:

| wiki-only outcome | rites |
|---|---:|
| Full record (intro + all outcomes) | **10** |
| English intro + ≥1 English outcome | 18 |
| English intro only | 89 |
| Outcome fragments only, no intro | 23 |

So: **10 complete records from the wiki route, 1,366 from the localisation file** — and 8 of the 10
are short rites with 1–3 branches. The wiki's prose also drifts: it is variously an older build's
translation, a British-spelling re-typing, or a version with editor typos the shipped file does not
have ("all maner of evil" / "trully" on `Alim#Turning_the_Millstone` vs "all manner of evil" in the
file). Where the two disagree, the localisation file wins.

---

## Provenance — why `sultans_en/config.json` is trustworthy as the shipped English

1. **Key-for-key structural identity with the shipped Chinese config.** For all 1,382 rites, every
   `settlement_prior[i]` / `settlement[i]` / `settlement_extre[i]` entry carrying a `result_text`
   has a matching `rite_<id>_prior_settlement_<i>_text` / `_settlement_<i>_text` /
   `_settlement_extre_<i>_text` key. Zero index mismatches. (Against the *other* public Chinese
   config — `liwenhao0427/sultans-game-config`, 1,174 rites — 44 rites mismatch, because that mirror
   is an older build. The `we1how` Chinese config is the version-matched one and is what these
   records use.)
2. **Independent corroboration by player transcription.** 163 English prose blocks transcribed by
   wiki editors straight from the running game match the localisation strings verbatim after
   whitespace/quote-mark normalisation — including long passages (the White-Belly duel, the
   Alim mystery-box branches, the three Maggie replies). Editors typing from their screens cannot
   coincidentally reproduce a fan translation.
3. **Untranslated runtime tokens survive.** Strings retain the engine's substitution tokens
   (`[player.name]`, `[s4.name]`, `[s4.gender(his, her)]`) — present in the shipped build, absent
   from any human retelling. Where the wiki says "Lord Arzu", the file says `Lord [player.name]`.

---

## How to read a record

- **Intro** = rite `text`, the card face. **Slot lines** = `cards_slot.sN.text`, the ask on each slot.
- **Dice line** = the pre-roll strip: `random_text.r1` (what the roll is called), which attributes
  feed the dice, and the success target.
- **Outcome** = one settlement branch. The `condition` is copied verbatim from the shipped config.
  Branches resolve top-to-bottom: `settlement_prior` first, then `settlement`, then
  `settlement_extre` (extras stack on top of the main result).
- Condition idioms:
  - `{"r1:战斗+体魄-e(战斗+体魄)>=": [6, 5]}` — roll `r1`, dice pool from (Combat + Physique) minus the
    opponent's (Combat + Physique), **5 dice**, needs **≥6 successes**. `<` is the failure twin.
  - `{"s3.is": 2000885}` — slot s3 holds card 2000885. `{"s3.金币=": 5}` — 5 Gold Coins in s3.
    `{"!s4": 1}` — slot s4 left empty. `{"s5.纵欲": 1}` — a Carnality card in s5.
  - `{"counter.7000182>=": 3}` — a hidden story counter.
  - Attribute glossary: 体魄 Physique · 魅力 Charisma · 智慧 Wisdom · 社交 Sociability ·
    战斗 Combat · 隐匿 Stealth · 生存 Survival · 神秘 Magic · 金币 Gold Coin ·
    杀戮 Bloodshed · 纵欲 Carnality · 征服 Conquest · 奢靡 Extravagance · 已装备 equipped.
- **Branch label** (`success` / `failure` / `partial` / `branch`) is derived from the condition:
  a dice comparison gives success/failure, a pure state condition gives `branch`.

---

## The records

The 136 records below are the ones that also have independent wiki corroboration, ranked by how
many of their English strings a wiki editor transcribed (most-corroborated first), then by branch
count. Every one of them is **complete** — this ranking is about strength of external evidence, not
about English coverage, which is total.

The other ~1,230 complete records are one command away and are not pasted here only to keep this file
readable:

```bash
cd v3/scripts/prosebench/research
python3 rite_record.py --index            # id / English name / branch count / coverage, all 1382
python3 rite_record.py 5006053 5008074    # named rites, full records
python3 rite_record.py --all              # every rite (~5 MB)
python3 rite_record.py --all --max 30     # every rite, capped at 30 branches each
```

A handful of hub rites here are capped at 30 outcome branches (`Game of Power` has 111, `Your Game`
64, `Tailor Shop` 40); the cap is noted in place and `rite_record.py <id>` prints them uncapped.

---

## Zazie's Nightmare — rite `5000576` (莎姬的噩梦)
**Confidence:** High — official `i18n/en` string for every field; 9 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000576_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Zazie#A_More_Terrible_God, https://sultansgame.wiki.gg/wiki/Zazie#Bookstore_Encounter, https://sultansgame.wiki.gg/wiki/Zazie#God-Hunting, https://sultansgame.wiki.gg/wiki/Zazie#Lord_s_Ambition, https://sultansgame.wiki.gg/wiki/Zazie#Star-Burning

**Intro (EN):**
> The Highlord torments Zazie nightly, each dream more terrifying than the last. You have methods to temporarily soothe the god's demands, easing her suffering. Other approaches might eliminate the problem entirely.

**Slot lines (EN):**
> s1: The god's patience is Zazie's life countdown
> s2: What will you use to ease the Highlord's pressure?
> s3: Find a way to eliminate the Highlord completely

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"any": {"counter.7000530>=": 1}}`:**
> The matter is resolved; no further action necessary.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s3.is": 2000022, "!s3.密教徒": 1}`:** *Power Lost*
> Badriyyah cannot assist Zazie - she has exhausted all her borrowed powers from the Cultic Gods in securing your freedom.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s3.is": 2001021}`:** *You Obtained the Bait*
> Zazie lacks the spiritual fortitude to harness a god's power. You would make a far more suitable vessel for such a covenant, with superior skills to negotiate favorable terms.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s3.is": 2000913, "rare=": 4}`:** *Divine Revival*
> The Testament to Bygone Oaths works like a balm on the agitated god, rekindling memories of Their golden age when countless worshippers knelt before Him. Human devotion and desire act like an intoxicating poison to divine beings - destructive yet irresistibly addictive. 
> The Highlord now ceases tormenting Zazie, willing to wait for the grand feast you've promised Him. 
> Forget the Sultan's precious seed! In her gratitude, Zazie has eagerly offered a more private tribute of your own essence... Who knows? Perhaps these seeds will one day grow into something royal.

<!-- settlement[3] -->
**Outcome — branch, condition `{"any": {"s3.is": 2000848}}`:** *A More Terrible God*
> Knowing how to defeat a god. In an intimate encounter, revealing to Zazie's deity the god inside your heart—desire, ambition, and fear mere links among them. Compared to your illusion, the Highlord seemed weak—a dim star—how long since it drank mortal's dreams? No surprise it pressured Zazie so. Embracing, entering Zazie, the god inside you pursues through her soul, consuming the weakened astral spirit. That night, under twinkling stars, thunder roared over clear skies, causing roses throughout the capital to wither, former dynasty loyalists dying from nightmarish fright, Polaris dimming substantially. Afterwards, Zazie curious, felt on your chest—half doubting her curse's resolution—realizing your harsher torment... After pledging rewards and assistance, she fled in anxiety.

<!-- settlement[4] -->
**Outcome — branch, condition `{"s3.is": 2000022, "s3.密教徒": 1}`:** *Holy Quarry*
> Badriyyah's eyes ignite with excitement at your words. 
> "The Highlord of the Highlands! For millennia He ruled as supreme god before the Purists drove Him away. I knew He would seek return... What if we summon Him only to destroy Him?" 
> ...Deicide? 
> You hesitate momentarily. "Don't falter now," she urges with growing intensity. "The Highlord is merely a Star-Souled - an exceptionally powerful star, yes, but still just a star! No one knows which precisely. My masters in the darkness will aid us in this hunt. Imagine the power we could extract from His pretentious skull... The Master will reward us generously, perhaps even hasten His coming!"

<!-- settlement[5] -->
**Outcome — branch, condition `{"s3.is": 2000021}`:** *A True Purification*
> Iman raises a skeptical eyebrow as he examines you. 
> "You claim the Highlord has infiltrated the Sultan's harem? Ah... those ancient rose gardens that recently bloomed - now it makes sense. The Purist and his faithful will cleanse this false god with all our strength; it is our sacred duty." 
> When you inquire about purifying something so intangible, he explains: "Each Star-Souled corresponds to a specific star. By tracking its earthly manifestations, we can calculate its celestial position. Once located, the God of Immaculate Purity himself will cleanse this wayward star with divine flame. 
> "You find yourself wondering how many celestial entities the Purists have blocked from reaching our world through such methods, but... Iman's expression makes it clear he has no desire to discuss the matter further.

<!-- settlement[6] -->
**Outcome — branch, condition `{"s2.is": 2000021}`:** *Hidden Penance*
> Iman makes a shallow cut across Zazie's foot. This ritualistic punishment serves as treatment, temporarily weakening the Highlord's influence within her. However, he warns that until this heretical god is permanently banished, the concubine's nightmares will persist...

<!-- settlement[7] -->
**Outcome — branch, condition `{"s2.is": 2000022, "s2.密教徒": 1}`:** *Sacred Mark*
> With practiced precision, Badriyyah tattoos a tiny sigil behind Zazie's left ear - the only place she can conceal it from the Sultan's scrutiny. This offers merely temporary protection; meanwhile, Badriyyah repeatedly presses Zazie to reveal the god's true name. Her unusual interest in this particular god hasn't escaped your notice.

<!-- settlement[8] -->
**Outcome — branch, condition `{"s2.is": 2000022, "!s2.密教徒": 1}`:** *Power Lost*
> Badriyyah cannot assist Zazie - she has exhausted all her borrowed powers from the Cultic Gods in securing your freedom.

<!-- settlement[9] -->
**Outcome — branch, condition `{"s2.is": 2001024}`:** *Patience Shattered*
> Zazie kneels reverently before the Highlord's damaged bust... Through this act of worship, she temporarily regains a measure of the god's favor - though this merely postpones the inevitable.

<!-- settlement[10] -->
**Outcome — branch, condition `{"s2.is": 2000172}`:** *Divine Vengeance*
> Your strategy awakens the Highlord's memories of the Sultan's family - those who allied with the Purist Order to overthrow Their favored dynasty! During that kingdom's fall, the overwhelming surge of devotion, desire and madness poisoned Him so severely They could neither ascend to the stars nor fully manifest on earth. For now, at least, Zazie's nightmares have transformed into visions of the Sultan's torture - almost a pleasant dream for her.

<!-- settlement[11] -->
**Outcome — branch, condition `{"s2.is": 2000913}`:** *Stirring Divinity*
> The Testament to Bygone Oaths works like a balm on the agitated god, rekindling memories of Their golden age when countless worshippers knelt before Him. Human devotion and desire act like an intoxicating poison to divine beings - destructive yet irresistibly addictive... But your covenant remains incomplete; many former worshippers have yet to pledge themselves. Hurry! The god's patience wanes with each passing moment!


## One Hand for Goods — rite `5008068` (一手拿货)
**Confidence:** High — official `i18n/en` string for every field; 9 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008068_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Alim#Money_First__Goods_Later, https://sultansgame.wiki.gg/wiki/Alim#One_Hand_for_Goods, https://sultansgame.wiki.gg/wiki/Alim#Outcomes

**Intro (EN):**
> The pickpocket ringleader sells stolen goods at your doorstep – not just for business, clearly.

**Slot lines (EN):**
> s1: Alim
> s2: Alim's Mysterious Box of Stolen Goods
> s3: 5 Gold Coins or anything that Alim might care about.
> s4: You can do this job yourself, or send any of your followers to do it.

**Dice line (EN):**
> Buy Stolen Goods
> The number of dice is affected by the challenger's Stealth and Wisdom.
> You need at least 1 Success.

<!-- settlement[0] -->
**Outcome — branch, condition `{"!s4": 1}`:** *You are not interested in stolen goods*
> Alim packs away the stolen goods, shakes his head, and walks away without saying a word.

<!-- settlement[1] -->
**Outcome — success, condition `{"s4": 1, "r1:隐匿+智慧-e(隐匿+智慧)>=": [1, 5], "s3.is": 2000885}`:** *One Hand for People*
> You understand what Alim wants, so you throw Hemir, who has been locked up at your place, right in front of him. Seeing how cooperative Lord [player.name] is, Alim grins so wide his rotten teeth look like they might fall out... Of course, he presents you with a Supreme Mystery Box in return.

<!-- settlement[2] -->
**Outcome — success, condition `{"s4": 1, "r1:隐匿+智慧-e(隐匿+智慧)>=": [1, 5], "s3.金币=": 5}`:** *One Hand for Money*
> Interested in this way of drawing lots, you decide to try it out at least once.

<!-- settlement[3] -->
**Outcome — branch, condition `{"s4": 1, "s3.is": 2000885}`:** *One Hand for People*
> You understand what Alim wants, so you throw Hemir, who has been locked up at your place, right in front of him. Seeing how cooperative Lord [player.name] is, Alim grins so wide his rotten teeth look like they might fall out... Of course, he presents you with a Supreme Mystery Box in return.

<!-- settlement[4] -->
**Outcome — branch, condition `{"s4": 1, "s3.金币=": 5}`:** *One Hand for Money*
> Interested in this way of drawing lots, you decide to try it out at least once.

<!-- settlement[5] -->
**Outcome — success, condition `{"s4": 1, "!s3": 5, "r1:隐匿+智慧-e(隐匿+智慧)>=": [1, 5]}`:** *No Honesty*
> Old Alim immediately perceived you hadn't brought a single coin - clearly planning robbery! He fled swifter than a sand lizard. Though you failed, at least you retained your possessions, correct?

<!-- settlement[6] -->
**Outcome — failure, condition `{"s4": 1, "!s3": 5, "r1:隐匿+智慧-e(隐匿+智慧)<": [1, 5]}`:** *No Honesty*
> You hadn't brought a single coin - clearly planning robbery. Old Alim sensed trouble and fled quickly, not even retrieving his stolen goods.

<!-- settlement_extre[0] -->
**Outcome — failure, condition `{"s4.已装备>=": 1, "r1:隐匿+智慧-e(隐匿+智慧)<": [1, 5]}`:** *Sleight of Hand*
> [s4.name] returns home in a bad mood...[s4.gender] found [s4.gender(his, her)] equipment in Alim's mysterious box – no one even saw when he made his move.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"s4": 1, "s4.已装备<": 1, "r1:隐匿+智慧-e(隐匿+智慧)<": [1, 5]}`:** *Empty Pockets*
> There was a note in the mysterious box advising you to carry more equipment to deal with the terrible Sultan's Game.


## Tailor Shop — rite `5000101` (裁缝店)
**Confidence:** High — official `i18n/en` string for every field; 7 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000101_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Arzuna#Tailor_Shop, https://sultansgame.wiki.gg/wiki/Jenna#Tailor_Shop, https://sultansgame.wiki.gg/wiki/Lady_Becky#Tailor_Shop, https://sultansgame.wiki.gg/wiki/The_Protagonist#Tailor_Shop, https://sultansgame.wiki.gg/wiki/The_Protagonist/Twin#Tailor_Shop, https://sultansgame.wiki.gg/wiki/Zaki#Entangled_in_Scandal, https://sultansgame.wiki.gg/wiki/Zephyr

**Intro (EN):**
> Malkina offers her talents to style you or your followers.

**Slot lines (EN):**
> s1: Malkina
> s2: Any ally or yourself
> s3: Special Items
> s4: 5 Gold Coins, no haggling.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s3.is": 2000680, "s2.主角": 1, "counter.7000365<": 1}`:** *You seem to have aged twenty years overnight.*
> Thanks to Malkina's talent, your hair has become dull and dry, streaked with gray, with patches of baldness barely concealed by the styling. Your cheeks have sunken in like those of a beggar – one who might be suffering from consumption, or simply someone who has lost all desire to eat. Your eyes are puffy and lifeless, showing no interest in the world around you. The Sultan's wish was granted – one he was very pleased with. He even offers you a few words of comfort, as insincere as it always is.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s3.is": 2000680, "s2.主角": 1, "counter.7000365>=": 1}`:** *Applied the aged makeup once more.*
> But this time it won't work!

<!-- settlement[2] -->
**Outcome — branch, condition `{"s2.妻子": 1}`:**
> Malkina helped Maggie redesign her style, encouraging her to embrace more elaborate attire - and reminding her to maintain dignity especially in the darkest times.

<!-- settlement[3] -->
**Outcome — branch, condition `{"s2.is": 2000292}`:**
> Malkina crafted a better-fitting mask and bodysuit for the Masked Swordsman - she thoroughly enjoyed caressing such muscles, giggling continuously.

<!-- settlement[4] -->
**Outcome — branch, condition `{"s2.is": 2000013}`:**
> This wandering rogue strongly resisted Malkina's touch... They played a brief game of chase around the room until he finally allowed her to adjust his belt and coat... After mere minutes, the swordsman fell in love with this new style.

<!-- settlement[5] -->
**Outcome — branch, condition `{"s2.is": 2000014}`:**
> She rebraided Habib's hair and taught him a new method to care for his hands' skin.

<!-- settlement[6] -->
**Outcome — branch, condition `{"s2.is": 2000019}`:**
> After lengthy discussion, Malkina decided to design jewelry and accessories that would remind people of <i>you</i>. Thus, whenever people saw Jenna's ornaments, they would recall the Sultan's Game - and the fact that you still suffer.

<!-- settlement[7] -->
**Outcome — branch, condition `{"s2.is": 2000021}`:**
> Malkina admired his scars and suggested treating them as decorative elements... Iman accepted some of her designs.

<!-- settlement[8] -->
**Outcome — branch, condition `{"s2.is": 2000054}`:**
> Hmm... Jabal clearly needed a bath first. You never realized Malkina possessed such a cutting tongue when disciplining a man. Indeed, after thorough cleansing and proper beard grooming, Jabal emerged completely transformed.

<!-- settlement[9] -->
**Outcome — branch, condition `{"s2.is": 2000055}`:**
> Malkina invested considerable patience explaining a principle to Nayla: sometimes more modest attire creates greater allure - if that's Nayla's intention. 
> After witnessing these women's day-long battle of wills, you must admit the results impressed you, though you wisely refrained from direct commentary.

<!-- settlement[10] -->
**Outcome — branch, condition `{"s2.is": 2000056}`:**
> Qais fiercely resisted such embellishments and grooming, yet after Malkina worked her magic, his mother's astonished praise finally convinced him to accept her changes with grudging appreciation.

<!-- settlement[11] -->
**Outcome — branch, condition `{"s2.is": 2000057}`:**
> What a genuine challenge! Especially with Jawad stubbornly refusing to slim down first... Malkina employed countless techniques to reshape his rounded features - transforming them into something resolute and trustworthy! Jawad was absolutely delighted, hurrying home to show his daughter his new appearance.

<!-- settlement[12] -->
**Outcome — branch, condition `{"s2.is": 2000061}`:**
> Malkina reimagined Adila's wardrobe - feminine attires restricted her movement too severely, while masculine attire rarely fit properly. Now she moved with newfound freedom, cutting a more dashing figure.

<!-- settlement[13] -->
**Outcome — branch, condition `{"s2.is": 2000062}`:**
> Fatuna perpetually wore her widow's veil - Malkina refined its design to cloak her sorrow with greater elegance.

<!-- settlement[14] -->
**Outcome — branch, condition `{"s2.is": 2000063}`:**
> Zaki perpetually strived to appear mature, while Malkina taught him instead to embrace and leverage his youthful advantages.

<!-- settlement[15] -->
**Outcome — branch, condition `{"s2.is": 2000064}`:**
> Nabhani absolutely adored Malkina. The two could spend entire days joyfully mixing and matching outfits, showering each other with compliments. In time, he became increasingly obsessed with his looks, often bringing along several sets of accessories to swap depending on the occasion...

<!-- settlement[16] -->
**Outcome — branch, condition `{"s2.is": 2000065}`:**
> Faris exuded an overwhelming canine scent - Malkina discovered a perfume that masked the odor without distressing his dogs. Additionally, she crafted fashionable gold chains allowing him to secure important items to his belt, preventing his notorious tendency to misplace possessions.

<!-- settlement[17] -->
**Outcome — branch, condition `{"s2.is": 2000080}`:**
> For Junah, Malkina simply selected standard noblewoman's attire - garments she would never dare don even after purchasing her freedom. Under Malkina's gentle insistence, Junah appeared utterly transformed.

<!-- settlement[18] -->
**Outcome — branch, condition `{"s2.is": 2000081}`:**
> Malkina designed scholarly women's attires for Jalila - wearing them to a bookshop once attracted scores of former clients arriving in carriages seeking conversation.

<!-- settlement[19] -->
**Outcome — branch, condition `{"s2.is": 2000082}`:**
> Malkina thoughtfully prepared several masculine attires for Shama... even Maggie couldn't resist stealing several glances.

<!-- settlement[20] -->
**Outcome — branch, condition `{"s2.is": 2000113}`:**
> The original Alim became completely unrecognizable. Wearing these new clothes, he circulated throughout the Sultan's court delivering an address - remarkably, nobody detected anything unusual.

<!-- settlement[21] -->
**Outcome — branch, condition `{"s2.is": 2000114}`:**
> Gullis refused any modifications to his cherished braids, yet adorned his body with precious metals and gemstones more naturally than you anticipated... as though he once lived such an opulent lifestyle.

<!-- settlement[22] -->
**Outcome — branch, condition `{"s2.is": 2000123}`:**
> Malkina crafted new robes for Lumera - more magnificent than before, yet cleverly designed to conceal two volumes within their folds.

<!-- settlement[23] -->
**Outcome — branch, condition `{"s2.is": 2000195, "!s2.变身公主": 1}`:**
> Raed insisted on maintaining her "modest" appearance to better connect with those requiring her assistance. Respecting her wishes, Malkina fashioned sturdy, practical trousers better suited for her demanding work.

<!-- settlement[24] -->
**Outcome — branch, condition `{"s2.is": 2000195, "s2.变身公主": 1}`:**
> You certainly presented Malkina with a challenge! Nevertheless, she skillfully employed cosmetic techniques to render Jemor truly frightening... transforming ordinary unpleasantness into genuine terror. Jemor was absolutely thrilled - this embodied the powerful image he'd fantasized about his entire life!

<!-- settlement[25] -->
**Outcome — branch, condition `{"s2.is": 2000196}`:**
> You certainly presented Malkina with a challenge! Nevertheless, she skillfully employed cosmetic techniques to render Jemor truly frightening... transforming ordinary unpleasantness into genuine terror. Jemor was absolutely thrilled - this embodied the powerful image he'd fantasized about his entire life!

<!-- settlement[26] -->
**Outcome — branch, condition `{"s2.is": 2000197}`:**
> You certainly presented Malkina with a challenge! Nevertheless, she skillfully employed cosmetic techniques to render Hamar truly frightening... transforming ordinary unpleasantness into genuine terror. Hamar was absolutely thrilled - this embodied the powerful image he'd fantasized about his entire life!

<!-- settlement[27] -->
**Outcome — branch, condition `{"s2.is": 2000352}`:**
> Mahir neither wanted nor required anything. However, Malkina crafted specialized ear and eye coverings - now she could sleep undisturbed in her laboratory! For scholars, quality rest proves virtually priceless!

<!-- settlement[28] -->
**Outcome — branch, condition `{"s2.法拉杰": 1}`:**
> Faraj hoped to imitate your sartorial habits, but Malkina offered more practical guidance - he's now learned to wear colors complementary to yours, which seems somewhat concerning.

<!-- settlement[29] -->
**Outcome — branch, condition `{"s2.is": 2000460}`:**
> Hassan's taste proved so abysmal that Malkina eventually surrendered, simply adding some decorative bells to the mutton stove's ensemble.

*(+10 further outcome branches, all present in official English — regenerate uncapped with `rite_record.py 5000101`.)*


## Charges and Defense — rite `5001026` (论罪与辩护)
**Confidence:** High — official `i18n/en` string for every field; 7 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001026_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Charges_and_Defence#Failure, https://sultansgame.wiki.gg/wiki/Charges_and_Defence#Partial_success, https://sultansgame.wiki.gg/wiki/Charges_and_Defence#Success

**Intro (EN):**
> The judges under the Sultan's command are known for their perfect parallel thinking. On the one hand, they turn a blind eye to the atrocities committed by the supreme ruler... On the other hand, they enforce the law on others with the strictest and most mechanical standards. This way, they can still claim to uphold the dignity of the law.

**Slot lines (EN):**
> s1: Your Evidence
> s2: Your Noble Defendant
> s3: Consumables to Assist
> s4: Litigation Funds
> s5: Ally to take the fall for your crimes

**Dice line (EN):**
> Trial Debate
> The number of dice provided by your Wisdom, Sociability, and gold coins is affected by the evidence.
> You need at least 1 Success to stop the trial. With more Successes, you can turn the tables and eliminate 1 piece of evidence. The number of successes required varies depending on your Influence.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"counter.7000193>=": 1}`:**
> Most of the officials side with you, and the trial is hastily concluded.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s5": 1}`:** *Scapegoat*
> [s5.name] confesses to all the crimes on your behalf and is sentenced to death, executed immediately.

<!-- settlement[1] -->
**Outcome — success, condition `{"!s5": 1, "r1:智慧+社交+金币>=": [1, 5]}`:** *A Successful Defense*
> Your defender's smooth words successfully stop the judge's verdict. But you know the High Constable will not let this go so easily.

<!-- settlement[2] -->
**Outcome — failure, condition `{"!s5": 1, "r1:智慧+社交+金币<": [1, 5]}`:** *Defense Failed*
> No matter how eloquent your defender may be, they had already decided to sentence you to death from the very beginning. Now, it all depends on the Sultan’s will.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"!s5": 1, "r1:智慧+社交+金币>=": [1, 5], "counter.7100003>=": 20}`:** *Distort the Truth*
> Under your terrifying glare, the judge not only fails to convict you, but is forced to declare a key piece of evidence inadmissible. So this is what power tastes like?

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"!s5": 1, "r1:智慧+社交+金币>=": [2, 5], "counter.7100003>=": 15, "counter.7100003<": 20}`:** *Distort the Truth*
> Under your terrifying glare, the judge not only fails to convict you, but is forced to declare a key piece of evidence inadmissible. So this is what power tastes like?

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"!s5": 1, "r1:智慧+社交+金币>=": [3, 5], "counter.7100003>=": 10, "counter.7100003<": 15}`:** *Distort the Truth*
> Under your terrifying glare, the judge not only fails to convict you, but is forced to declare a key piece of evidence inadmissible. So this is what power tastes like?

<!-- settlement_extre[3] -->
**Outcome — success, condition `{"!s5": 1, "r1:智慧+社交+金币>=": [4, 5], "counter.7100003>=": 5, "counter.7100003<": 10}`:** *Distort the Truth*
> Under your terrifying glare, the judge not only fails to convict you, but is forced to declare a key piece of evidence inadmissible. So this is what power tastes like?

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"!s5": 1, "r1:智慧+社交+金币>=": [5, 5], "counter.7100003<": 5}`:** *Reversal!*
> The judge not only fails to convict you, but stumbles during the debate, forced to declare a key piece of evidence inadmissible.


## The Grand Game — rite `5001001` (权力的游戏)
**Confidence:** High — official `i18n/en` string for every field; 6 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001001_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Fire_Dragon_Scales#Grand_Game, https://sultansgame.wiki.gg/wiki/Sadani, https://sultansgame.wiki.gg/wiki/Sadani#Or_not_helping..., https://sultansgame.wiki.gg/wiki/Sultan%27s_Nipple_Chains#Grand_Game

**Intro (EN):**
> Frequent appearances in the palace are as necessary as water and air are to the living; missing a friend only loses some benefits, but missing an enemy means not knowing the words that escaped their lips into the Sultan's ear.

**Slot lines (EN):**
> s1: If left unchecked, slander will grow like weeds in the ears of the king...
> s2: The Supreme Sultan
> s3: Being brought by the Sultan in his court is not necessarily a blessing.
> s4: Noble speaking in court today
> s5: You can go yourself or send a follower who is a <i>Noble</i> to go.
> s6: Using a Sultan Card in front of the Sultan might be a madness idea...
> s7: You can offer everything you have to the great Sultan for his favor, which may not be as you expect. You may ask Him for anything your heart desire, but will it be enough to pay the cost?

**Dice line (EN):**
> You try to attract the Sultan's attention...
> The number of dice provided by your Sociability.
> You need at least 3 Successes to persuade the Sultan.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"any": {"s7.is": 2000172}}`:**
> You publicly declared the Sultan's atrocities and your intent to rebel. Everyone thought you were mad, including the Sultan, and thus, you were executed.

<!-- settlement[0] -->
**Outcome — branch, condition `{"f:反对-支持>=": 0, "谗言>=": 3, "counter.7000085<": 1}`:**
> You wonder why the Sultan treats himself even more cruelly than you? Isn't it ridiculous that he threw himself into such a crazy game—tarnishing his respect and endangering his subjects' loyalty?
>
> Through the noisy whispers, through malicious eyes, the lights in the palace flickering, on the Sultan's blurred face, you caught a glimmer, a trace, a hint, something wafting through the air... one of fear.

<!-- settlement[1] -->
**Outcome — branch, condition `{"f:反对-支持>=": 0, "谗言>=": 3, "counter.7000085>=": 1}`:**
> You wonder why the Sultan treats himself even more cruelly than you? Isn't it ridiculous that he threw himself into such a crazy game—tarnishing his respect and endangering his subjects' loyalty?
>
> Through the noisy whispers, through malicious eyes, the lights in the palace flickering, on the Sultan's blurred face, you caught a glimmer, a trace, a hint, something wafting through the air... one of fear.

<!-- settlement[2] -->
**Outcome — branch, condition `{"f:反对-支持>": 0, "谗言<": 3}`:**
> Slander grows by the Sultan's ear, about your misdeeds, your disrespect...
> If there were even one person to speak for you, it would've been difficult for such weeds to take root, but unfortunately, there wasn't.

<!-- settlement[3] -->
**Outcome — branch, condition `{"f:反对-支持=": 0}`:**
> The Nobles bicker like street ruffians scrambling for food before their master. This is exactly what the Sultan wants to see.

<!-- settlement[4] -->
**Outcome — branch, condition `{"f:反对-支持<": 0}`:**
> You are carrying out the sacred task given by the Sultan, aren't you? You deserve support in the palace.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"倦怠>=": 6, "谗言=": 0}`:**
> All the absurdity of endless debates and debacles has left the Sultan thoroughly exhausted, so he will probably relieve himself from the court for a few days. Your recent actions have not aroused any suspicion from the Sultan, as such, your Influence has increased.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"倦怠>=": 6, "谗言>": 0, "谗言<": 3, "!rite": 5001018}`:**
> All the absurdity of endless debates and debacles has left the Sultan thoroughly exhausted, so he will probably relieve himself from the court for a few days. Your recent actions have not aroused any suspicion from the Sultan, as such, your Influence has increased.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"倦怠>=": 6, "谗言>": 0, "any": {"谗言>=": 3, "rite": 5001018}}`:**
> All the absurdity of endless debates and debacles has left the Sultan thoroughly exhausted, so he will probably relieve himself from the court for a few days.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"倦怠<": 6, "倦怠>=": 4}`:**
> Palace intrigues have made the Sultan somewhat weary.

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"倦怠<": 4}`:**
> Palace intrigues have made the Sultan somewhat weary.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"纵欲": 1, "type": "sudan", "f:s6.rare-s3.rare=": 0, "!s3.纵欲的痕迹": 1, "s5.主角": 1, "s3.is": 2000008}`:** *Bronze Tribute*
> You notice today that the position beside the Sultan is not vacant. 
> The woman sitting beside him has ashen-pale skin and hair bright as sand. She silently, expressionlessly listens to the courtiers' clamor, serene as if from another world. 
> Such astonishing beauty, you think, like a stone in a flattering palace. She shouldn't be here, but rather stand in an undying river or an unmelting snowy peak, serving a god who looks down once in a ten millennia. 
> Yet here she is. 
> You understand why the Sultan brought her – for this discordant sensation. He enjoys forcing someone into a misfit mold, watching them break. A strange empathy grips you. 
> You are suddenly seized by an unfamiliar urge, as if you hover above, observing that beautiful heart, this land's ruler stripped of armor, roaming outside a heart's gate. In front of this bleeding heart, in this universally bitter rejection, you find yourself half her, half the Sultan's shadow. 
> A chasm splits your heart and soul. Respectfully, you offer the Carnality Card, seeking closeness to her. 
> You dare not raise your head, knowing full well the Sultan's black gaze brews rage, but Ansuya's tranquility fills your heart. You wish only for a rare glint of surprise in her eyes before welcoming the Sultan’s storm. 
> However, no storm arrives. You hear the Sultan's strange, low chuckle. He toys with your card, "My dear Ansuya is worth a Bronze Card indeed." 
> The Sultan admires Ansuya’s paleness, snapping the card with a crisp sound: "I permit this, but..." His cold gaze wraps your throat like a serpent. Smiling, he continues, "Ansuya, from which tribe? Balham or Tyria? Tyria's artisans excel in idol crafting. [s5.name], bring Tyria's statue for Ansuya to ease homesickness. Then she'll accompany you." 
> You agree with no choice, but Ansuya shows neither gratitude nor scorn under the Sultan’s wild laughter, thanking stoically, more still than stonework. Only you see her fist clench, white as a jade blade.

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"纵欲": 1, "type": "sudan", "f:s6.rare-s3.rare=": 0, "!s3.纵欲的痕迹": 1, "s5.主角": 1, "s3.is": 2000009}`:** *Silver Exchange*
> You notice that the position beside the Sultan is not vacant today. 
>
> Sadani, long absent from court, sits on where she was confidently again, scanning the courtiers with a look of mingled haughtiness and ostentation, whose repulsive gaze only became tender when it fell upon the Sultan. She gently peeled off the thin skins of the grapes with her delicate fingers, and placed one of the glistening fruits on a golden plate in the Sultan's hand.
>
> The contrasting pride and humility met in her young face, and how similar it was to that of the courtiers who filled the hall! Who has not endeavored to please the Sultan with the power he has bestowed upon him? Yet none display such "love," so nauseatingly insincere.
>
> You make your mind to uncover the facade, the Carnality Card sears inside you. You politely hold it to the Sultan, seeking closeness with Sadani.
>
> But without even so much as a glance towards the card, the Sultan take it and throw it away, his grin wide, "That's fine, Sadani, accompany him."
>
> "Impossible!" she bursts out, yet instantly regrets. How can the Sultan allow defiance? Her beautiful face with decent makeup drains of color as she kneels, pleading, her voice mixes fear, resentment, and reluctant coquettishness, "Your Majesty... [s5.name] brazenly entreats Your favor so openly. He is but a bug under your heel – unworthy of Your attention!"
>
> "Haha... Seems Sadani isn't fond of you." The Sultan laughs deeply, yet as relief flits Sadani's face, he adds, unhurried, "I've heard of a beast troubling outside the city. Chop off its head; Sadani will rejoice."
>
> "Your Majesty!" the consort pleads, but her eyes waver, hints of breaking, almost falling. The Sultan swats away her trembling hand, leaving the audience hall. As his robe brushed by casually, the grape-filled platter spills, fruit scattering over marble, their juice colorless and cold.

<!-- settlement_extre[7] -->
**Outcome — branch, condition `{"纵欲": 1, "type": "sudan", "f:s6.rare-s3.rare=": 0, "!s3.纵欲的痕迹": 1, "s5.主角": 1, "s3.is": 2000010}`:** *Golden Price*
> The Sultan regarded his companion, fingers idly manipulating the golden chains adorning her waist – each representing nights of exemplary service. "I shall accompany him, my sovereign," Zazie declared with arrogant confidence, "merely to demonstrate no man surpasses your excellence. I shall make your nobleman kneel before me, confessing his presumption in approaching battlefields you've already conquered." The Sultan laughed appreciatively, casually caressing Zazie's buttocks before adding: "Ensure Zazie receives appropriate gifts to secure her favor before claiming her company."

<!-- settlement_extre[8] -->
**Outcome — branch, condition `{"纵欲": 1, "type": "sudan", "f:s6.rare-s3.rare=": 0, "!s3.纵欲的痕迹": 1, "s5.主角": 1, "s3.is": 2000173}`:** *Stone Substitution*
> "Ah, Fadia... not entirely impossible..." 
> The Sultan smiled indulgently toward the slave girl beside him, her head bowed so deeply her expression vanished in shadow. 
> "Without dear Fadia, my household might lack certain specialized services. My excellent Fadia possesses remarkable talents, doesn't she? Demonstrate your particular skills for my courtiers." 
> The slave girl knelt gracefully, pouring fragrant ointment from her golden vessel onto her exposed chest, then meticulously cleansing the Sultan's feet with her anointed breasts, ensuring thorough application between toes using her nipples – performing these intimate services without hesitation or reluctance. 
> "Observe – certain services other concubines refuse without severe punishment, Fadia performs without complaint. My proposition: I shall grant you temporary access to Fadia, provided you contribute equivalently talented slaves to my household. Reasonable, yes?" 
> This statement constituted imperial command rather than negotiation. 
> Both you and Fadia knelt in ceremonial acceptance.

<!-- settlement_extre[9] -->
**Outcome — branch, condition `{"纵欲": 1, "type": "sudan", "s5.主角": 1, "!s3.被覆者": 1, "!s3.纵欲的痕迹": 1, "any": {"f:s6.rare-s3.rare>": 0, "f:s6.rare-s3.rare<": 0}}`:** *The Sultan rejects your request.*
> You wish to use the Carnality Card on my woman; only one of exactly matching tier will suffice.

<!-- settlement_extre[10] -->
**Outcome — branch, condition `{"杀戮": 1, "type": "sudan", "f:s6.rare-s4.rare=": 0, "s5.主角": 1, "!s7.is": 2000137, "s4.is": 2000349, "counter.7000059<": 1}`:**
> When you reveal the card of Bloodshed in the Sultan's court, everyone holds their breath.
>
> After a moment of peace, you choose the one who just spoke on stage, Vizier Abdul. Facing the trembling Abdul, the Sultan permits him to call for help – it's more entertaining that way.

<!-- settlement_extre[11] -->
**Outcome — branch, condition `{"杀戮": 1, "type": "sudan", "f:s6.rare-s4.rare=": 0, "s5.主角": 1, "!s4.is": 2000349, "!s7.is": 2000137, "counter.7000059<": 1}`:**
> When you reveal the card of Bloodshed in the Sultan's palace, everyone stops breathing.
> After enjoying the moment of silence, you point to the individual who just gave a speech. The courtiers buzz like a swarm of bees, while the Sultan smiles like a beekeeper:
> He announces that the two of you will duel to the death in front of the throne tomorrow.

<!-- settlement_extre[12] -->
**Outcome — branch, condition `{"征服": 1, "type": "sudan", "s5.主角": 1}`:**
> You place one foot on the steps of the Sultan's throne and show him the card with a coronation pattern. Now, you exercise the power granted to you by the game rules, and you aim to conquer the center of power...
> Then, everything spins, and you see your beheaded body spurting blood, which gets absorbed by the crimson carpet as if falling into a void.

<!-- settlement_extre[13] -->
**Outcome — branch, condition `{"s7.is": 2000174, "s6.type": "sudan", "s5.主角": 1, "s6.杀戮": 1, "s6.rare<=": 3, "s3.is": 2000009}`:** *You report Sadani's Secret to the Sultan.*
> To the consort besides the Sultan, your words was something even in a milennia she could not expect. That mask of condescension and calmness goes stiff, then shattered like glasses after. She almost jumps, pointing at you with trembling fingers, try to organize a sentence but in vain.
>
> "Cr..crazy...words...what...What are you talking about? Your majesty, please... I... He... He is a madman! Yes! He is a madman driven by the card game... Your MAJESTY!"
>
> Hapless Sadani kneels at his feet, pallor on her panic-stricken face. The Sultan gazes down gently, caressing her soft, pale cheek, oh so beautiful as ever, lacking only a drop of blood embellishment. He smiles, "I'll investigate, nothing to worry about, Sadani."
>
> Trembling harder, she knows his kindness never reaches the living... Despair-stricken, she stands abruptly, rushing the guard's side to wield a scimitar against you.
>
> You narrowly dodge, chaos erupts. From his high throne, the Sultan looks on, amused by the spectacle. At last, Sadani collapses, she has left only screams and curses, filling the air until she was pulled away. The crying of women dissapears, alongside it something everyone can imagine. An expected disappearance – your goal achieved. Tidying yourself, you present the card painted with sacrifice.
>
> The Sultan, impressed by your nerve, stares at you while breaking the card, the sound of its snap akin to a broken bone.

<!-- settlement_extre[14] -->
**Outcome — branch, condition `{"s7.is": 2000174, "s6.type": "sudan", "s5.主角": 1, "s6.杀戮": 1, "s6.rare<=": 3, "!s3.is": 2000009}`:** *You report Sadani's Secret to the Sultan and present a card inscribed with sacrifice.*
> The Sultan toys with it, but stares at you. "How do you know I would definitely kill her?"
>
> You bow low respectfully, "Your majesty is so powerful that everyone submits to you. Why would you need an heir to share your power?"
>
> The Sultan nods thoughtfully, "Very well, then personally give this dagger to the her."
>
> You have no choice but to comply. You carry the accompanying guards through the wide and intricate stone path of the harem, arriving in front of Sadani's palace. The consort looks at you in surprise, unable to believe what she heard: "You're betraying me? At such a time... Ha! Men... Very well, very well!" She slowly pulls out the gold dagger from the tray, then suddenly attacks you.
>
> You, catch off guard and forgetting to dodge, have the blade stopped by Royal Guard Captain Seliman. He looked at the consort and shook his head almost imperceptibly, and then looked at you. "Sir, please wait here. Sadani the consort is, after all, a royal figure. She need not do anything in public." His dark, steadfast eyes are particularly convincing to you in your state of shock. You watch him lead the consort into the room, and after a while, the door opens again, and only Seliman comes out. He places the blood-stained dagger back on the gold tray expressionlessly.
>
> You return it to the Sultan, who doesn't take a second glance and happily breaks the card.

<!-- settlement_extre[15] -->
**Outcome — branch, condition `{"s7.is": 2000174, "s3.is": 2000009, "s5.主角": 1, "any": {"!s6.type": "sudan", "!s6.杀戮": 1, "!s6.rare<=": 3}}`:** *You report Sadani's Secret to the Sultan.*
> To the consort besides the Sultan, your words was something even in a milennia she could not expect. That mask of condescension and calmness goes stiff, then shattered like glasses after. She almost jumps, pointing at you with trembling fingers, try to organize a sentence but in vain.
>
> "Cr..crazy...words...what...What are you talking about? Your majesty, please... I... He... He is a madman! Yes! He is a madman driven by the card game... Your MAJESTY!"
>
> Hapless Sadani kneels at his feet, pallor on her panic-stricken face. The Sultan gazes down gently, caressing her soft, pale cheek, oh so beautiful as ever, lacking only a drop of blood embellishment. He smiles, "I'll investigate, nothing to worry about, Sadani."
>
> Trembling harder, she knows his kindness never reaches the living... Despair-stricken, she stands abruptly, rushing the guard's side to wield a scimitar against you.
>
> You narrowly dodge, chaos erupts. From his high throne, the Sultan looks on, amused by the spectacle. At last, Sadani collapses, she has left only screams and curses, filling the air until she was pulled away. The crying of women dissapears, alongside it something everyone can imagine. An expected disappearance. 
>
> Your work is done.

<!-- settlement_extre[16] -->
**Outcome — branch, condition `{"s7.is": 2000174, "!s3.is": 2000009, "s5.主角": 1, "any": {"!s6.type": "sudan", "!s6.杀戮": 1, "!s6.rare<=": 3}}`:**
> You reported Sadani's secret to the Sultan, but the Sultan reacted indifferently, 'Is that so? I see.' He tapped the armrest of the throne lightly, saying no more. A few days later, you heard that a woman’s corpse, with its abdomen hollowed out, was found outside the city, possibly chewed by wild dogs.

<!-- settlement_extre[17] -->
**Outcome — branch, condition `{"s7.is": 2000177, "s5.主角": 1, "s6.type": "sudan", "s6.杀戮": 1, "s6.rare<=": 3}`:**
> You recount the assassination of the Royal Guard Captain to the Sultan and hoped to break a Bloodshed Card. The Sultan agrees.

<!-- settlement_extre[18] -->
**Outcome — branch, condition `{"s7.is": 2000137}`:**
> You presented conclusive evidence of his crimes to the Sultan, castigating him for his atrocities against humanity and disdain for life.
> 'Indeed? How many died?'
> 'Seventy-seven slave girls.'
> 'Were they beautiful?'
> 'Well... I don't know.'
> The Sultan's interest immediately waned, as he leaned back against the throne, idly twirling his gem ring.
> How simple was the logic. Humans are not born equal, how do seventy-seven corpses compare to a useful tool? You felt a chill, but you did not intend to retreat. You bowed again to the Sultan. 'I request your permission for this trial to offset a card from your great hand.'
> The Sultan stared at you for a while, then finally smiled. He waved his hand and granted you permission.

<!-- settlement_extre[19] -->
**Outcome — branch, condition `{"s4.is": 2000312, "s4.大敌": 1}`:**
> Nawfal vehemently opposed everything you said and did. He even proposed ending this chaotic game to the Sultan, but was rejected. you are admittedly the protagonist of a game of stolen power, but isn't that the Sultan's game as well? Until the Sultan grows weary, you still have a chance.

<!-- settlement_extre[20] -->
**Outcome — branch, condition `{"s5": 1, "counter.7000067<": 3, "!is": 2000461}`:**
> Sending someone there has at least one benefit – you can receive useful intelligence in real-time.

<!-- settlement_extre[21] -->
**Outcome — branch, condition `{"s5.is": 2000461, "counter.7000067<": 3}`:**
> Lady Becky sometimes unexpectedly gets rewarded for doing something herself.

<!-- settlement_extre[22] -->
**Outcome — branch, condition `{"s5": 1, "counter.7000067>=": 3, "!is": 2000461}`:**
> Sending someone there has at least one benefit – you can receive useful intelligence in real-time.

<!-- settlement_extre[23] -->
**Outcome — branch, condition `{"s5.is": 2000461, "counter.7000067>=": 3}`:**
> Lady Becky sometimes unexpectedly gets rewarded for doing something herself.

*(+81 further outcome branches, all present in official English — regenerate uncapped with `rite_record.py 5001001`.)*


## White-Belly — rite `5008074` (白肚皮)
**Confidence:** High — official `i18n/en` string for every field; 6 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008074_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Alim#Able_to_Recruit_Alim_Later, https://sultansgame.wiki.gg/wiki/Alim#Unable_to_Recruit_Alim_Later, https://sultansgame.wiki.gg/wiki/Alim#White-Belly

**Intro (EN):**
> Alim wants to slice up that beggar leader with his knife – considering what the man did, he deserves it; but you might handle it better, like finding out where Hemir is... What's keeping a ruthless trafficker from talking anyway?

**Slot lines (EN):**
> s1: Angry Alim
> s2: White-Belly
> s3: Try to convince White-Belly, need to show him something.
> s4: You must handle White-Belly yourself.
> s5: Use the Sultan Card to deal with this villain.
> s6: Anything you find useful

**Dice line (EN):**
> Duel with White-Belly
> The number of dice is affected by the challenger's Combat and Physique.
> You need at least 6 Success.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s3": 1}`:** *His gaze no longer stubborn*
> You took out Hemir's whistle, telling White-Belly that the child must be connected to his beggar gang...
> You told him you will question every street urchin here, even every person in the Dark Alley—someone must have seen a child with this whistle. Meanwhile, you'll torture him every day until Hemir is found. If he's alive, you'll let Hemir kill him personally. Or, he could reveal Hemir's whereabouts now, and you promised he can leave alive.
> This threat hit home, and he gave up resisting, revealing a shocking truth—Hemir is his long-lost biological son.
> Alim's eyes widened in shock: "Then why did you kidnap him? Who kidnaps their own son?"
> "Because I went to find him before! I told him 'You're my son, I'll spend money to buy you an identity, I'll send you to be a respectable apprentice'—but this ungrateful brat actually—I can't even—he told me that he wants to follow Alim to be a thief! What father wouldn't be furious hearing that? Tell me, Alim—my son wants to follow you to become a thief! What do you think about that?!"
> Alim, usually articulate, with lips parted as if to speak, said: "If I hadn't picked Hemir up from the streets and brought him home... he would have starved to death."
> "Sure, he's not starving, but now he's turning into a thief. He'll end up on the gallows... or torn apart by the nobles' hounds!"
> "Oh, come on, following you means being a beggar at most!"
> "I've saved money—yes, I've stepped on other kids to do it, I'm a bastard, I'm scum, I'm a vulture—but I've saved that money to give Hemir a future. You're the one teaching him wrong!"
> This had to be the most pathetic custody battle ever. Anyway, now that you had found out Hemir's whereabouts, killing his biological father isn't an option—just leave the rest to Alim.

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"s5.纵欲": 1, "s4": 1}`:** *Alim, some rumors aren't just rumors*
> Although Alim has threatened White-Belly dozens of times, he doesn't expect you to actually take out the Carnality Card... Old Alim wants to run away, as it is said that when the card glows, your manhood will surge through everyone in sight; but he doesn't dare turn his back on you or look away from what's happening even for a moment. 
> ... 
> Afterward, you pull up your pants and look at White-Belly who has bitten his tongue to commit suicide: there must be some special hidden truth in this matter that we'll never know now. 
> Old Alim is truly, completely frightened; he might never dare to appear before you again.

<!-- settlement_prior[2] -->
**Outcome — branch, condition `{"s5.征服": 1, "s4": 1}`:** *You tell him he'll lose everything, yet he simply smiles*
> You nail this shameful trafficker to the iron gate, forcing him to watch as you conquer this place with the powers bestowed by the Sultan. You empty his lair, take away all the beggars and thugs, level the garbage heaps (which he calls treasures), flatten every inch of stinking soil, and remove the graffiti on the walls (which he calls history).
>
> In the end, he bleeds out and dies in spasms, and all you get is nothing but an empty room... Alim leaves disappointed, leaving all these trophies to you.

<!-- settlement[0] -->
**Outcome — branch, condition `{"!s3": 1, "!s4": 1, "!s5": 1}`:** *Smells Fishy*
> Alim drains every last drop of blood from White-Belly… but he still won't reveal the Hemir's whereabouts or admit to killing him. Alim is on the verge of losing his mind–it's said he's been scouring the Dark Alley ever since that day, to no avail.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s5.杀戮": 1, "!s4": 1}`:** *You signal Alim to kill White Belly*
> Alim tortured White-Belly to death. Even in his final moments, he never revealed the child's whereabouts.

<!-- settlement[2] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [6, 5], "s5.杀戮": 1, "s4": 1}`:** *Death and Truth*
> You present White-Belly with the Sultan's Bloodshed Card, offering him a chance: a one-on-one duel to the death, witnessed in the name of the Sultan's Game. If he wins, he walks free and may even tell his tale to the Sultan, but if you win, he must divulge what he knows.
>
> For any condemned prisoner, this is a fair and even honorable opportunity. Neither White-Belly nor Alim raises any objection. Or rather, they seem baffled as to why you would go to such lengths for a child.
>
> Alim unties White-Belly, who grabs his favored iron rod... he straightens his posture, puffing out his chest, trying to face you with the dignity of a true warrior.
>
> ...
>
> Moments later, White-Belly falls to the ground. He shouldn't be surprised by this outcome.
>
> "Hemir is my biological son... I sent him to be an apprentice at a mill..." he gasps, revealing shocking truths before his final words fade into a gurgle of blood.
>
> Modest as it may be, perhaps this tale of death might provide some small amusement for the Sultan? As for Hemir, now that you have your lead, you can leave the rest to Alim – just make sure no one tells the boy who really killed his father.

<!-- settlement[3] -->
**Outcome — failure, condition `{"r1:战斗+体魄-e(战斗+体魄)<": [6, 5], "s5.杀戮": 1, "s4": 1}`:** *Death and Truth*
> You present White-Belly with the Sultan's Bloodshed Card, offering him a chance: a one-on-one duel to the death, witnessed in the name of the Sultan's Game. If he wins, he walks free and may even tell his tale to the Sultan, but if you win, he must divulge what he knows.
>
> For any condemned prisoner, this is a fair and even honorable opportunity. Neither White-Belly nor Alim raises any objection. Or rather, they seem baffled as to why you would go to such lengths for a child.
>
> Alim unties White-Belly, who grabs his favored iron rod... he straightens his posture, puffing out his chest, trying to face you with the dignity of a true warrior.
>
> ...
>
> Moments later, White-Belly breaks your shinbone, and you lie in pain on the ground – an outcome that surprises everyone present.
>
> "Hemir is my biological son... hah..." White-Belly reveals this shocking truth just before crushing your skull. But now, you'll never have a chance to share this story with the Sultan...


## Turning the Millstone — rite `5008075` (拉磨)
**Confidence:** High — official `i18n/en` string for every field; 6 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008075_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Alim#Turning_the_Millstone

**Intro (EN):**
> Alim has found Hemir. Would you like to see him? It seems that he is really working as an apprentice at the mill.

**Slot lines (EN):**
> s1: Pickpocket
> s2: You can go yourself, or send a follower
> s3: Pay 1 Gold Coin

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"counter.7100004>=": 10, "counter.7100002<": 10, "counter.7100001<": 10, "counter.7100003<": 10}`:** *The miller brought out the best liquor from home*
> This is a childless couple whose ancestors were nobles, but by this generation, they only have this mill left. The mill owner shakily took out Hemir's apprenticeship contract for you, a distinguished figure, to review. It's the most generous type of contract, where the apprentice must fulfill the obligations of a firstborn and will inherit all the master's property and powers. This means everything here will belong to Hemir as long as he works hard.
> At your request, Hemir is called out of the mill, his face covered in flour, his hair and clothes full of bran, his body reeking of donkey dung. But at least he appears well-fed, looking much brawnier than when you last caught him, his face rounder.
> "It's [player.name]!" he shrieks, then begins boasting to his master and mistress about your greatness, your charisma, how many followers you have in the Dark Alley… He points to his small arm where you once caught him, bragging about your lightning-fast reflexes and martial prowess as if that spot were coated in gold. Honestly, this somewhat intimidates the miller couple – they can evidently recall the other side of the tale: you, plundering, debauching, and causing all manner of evil, protected by black magic...
> So, you have to wave your hand to stop him. You explain you're here for Alim's sake. The old man would be delighted to have some flour personally ground by the pup... oh, the apprentice he used to take care of.
> The silly child eagerly drives out the donkey and personally mills a large bag of fine white flour with the finest wheat for you...
> Later, as Alim is dropping the dough into the hodgepodge soup, you share this detail with him. Old Alim's tears begin to fall into the soup – plop, plop – right alongside the dough... he definitely needs to use less salt now.

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"counter.7100004<": 10, "counter.7100002>=": 10, "counter.7100001<": 10, "counter.7100003<": 10}`:** *The miller's hand trembled as he poured the liquor*
> This is a childless couple whose ancestors were nobles, but by this generation, they only have this mill left. The mill owner shakily took out Hemir's apprenticeship contract for you, a distinguished figure, to review. It's the most generous type of contract, where the apprentice must fulfill the obligations of a firstborn and will inherit all the master's property and powers. This means everything here will belong to Hemir as long as he works hard.
> At your request, Hemir is called out of the mill, his face covered in flour, his hair and clothes full of bran, his body reeking of donkey dung. But at least he appears well-fed, looking much brawnier than when you last caught him, his face rounder.
> "It's [player.name]!" he screams, his teeth chattering with fear. He asks, trembling, if you're here to kill him, to root out White-Belly's remaining underlings... He drops to his knees begging you to kill only him, not to do anything worse to the mill, to his master and mistress...
> Before the whole family falls to their knees, you interrupt this farce; you have to wave your hand to stop him. You explain you're here for Alim's sake. The old man would be delighted to have some flour personally ground by the pup... oh, the apprentice he used to take care of.
> So the young boy breaks into a smile through his tears and personally grinds a large bag of snow-white flour from the finest wheat for you...
> Later, as Alim drops the dough into the hodgepodge soup, you tell him this detail. Old Alim roars with laughter, spittle flying everywhere, completely killing your appetite.

<!-- settlement_prior[2] -->
**Outcome — branch, condition `{"counter.7100004<": 10, "counter.7100002<": 10, "counter.7100001>=": 10, "counter.7100003<": 10}`:** *The miller's wife baked a huge, deliciously fragrant flatbread for you*
> This is a childless couple whose ancestors were nobles, but by this generation, they only have this mill left. The mill owner shakily took out Hemir's apprenticeship contract for you, a distinguished figure, to review. It's the most generous type of contract, where the apprentice must fulfill the obligations of a firstborn and will inherit all the master's property and powers. This means everything here will belong to Hemir as long as he works hard.
> At your request, Hemir is called out of the mill, his face covered in flour, his hair and clothes full of bran, his body reeking of donkey dung. But at least he appears well-fed, looking much brawnier than when you last caught him, his face rounder.
> "It's [player.name]!" he screams, praising your kindness – every child in the Dark Alley has received your charity, and you forgave his theft with godlike mercy. As he rambles on excitedly, the old miller pours you a drink with a knowing smile – they all know this is true.
> So, you have to wave your hand to stop him. You explain you're here for Alim's sake. The old man would be delighted to have some flour personally ground by the pup... oh, the apprentice he used to take care of.
> The silly child eagerly drives out the donkey and personally mills a large bag of fine white flour with the finest wheat for you...
> Later, as Alim is dropping the dough into the hodgepodge soup, you share this detail with him. Old Alim's tears begin to fall into the soup – plop, plop – right alongside the dough... he definitely needs to use less salt now.

<!-- settlement_prior[3] -->
**Outcome — branch, condition `{"counter.7100004<": 10, "counter.7100002<": 10, "counter.7100001<": 10, "counter.7100003>=": 10}`:** *The miller couple knelt to greet you*
> This is a childless couple whose ancestors were nobles, but by this generation, they only have this mill left. The mill owner shakily took out Hemir's apprenticeship contract for you, a distinguished figure, to review. It's the most generous type of contract, where the apprentice must fulfill the obligations of a firstborn and will inherit all the master's property and powers. This means everything here will belong to Hemir as long as he works hard. 
> At your request, Hemir is called out of the mill, his face covered in flour, his hair and clothes full of bran, his body reeking of donkey dung. But at least he appears well-fed, looking much brawnier than when you last caught him, his face rounder.
> "It's [player.name]!" he screams, hastily telling his master and mistress about your power and wealth. He begins describing the treasures he saw during his last theft at your home. Thankfully, he's cut short and forced to the ground to kowtow before he can say much more. 
> You wave your hand and gesture to everyone to sit; you explain you're here for Alim's sake. The old man would be delighted to have some flour personally ground by the pup - oh, the apprentice he used to take care of. 
> So the silly boy breaks into a smile through his tears and personally grinds a large bag of snow-white flour from the finest wheat for you... 
> Later, as Alim drops the dough into the hodgepodge soup, you tell him this detail. Old Alim roars with laughter, spittle flying everywhere, completely killing your appetite.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2": 1, "s3": 1}`:** *Hemir remembers you*
> This is a childless couple whose ancestors were nobles, but by this generation, they only have this mill left. They don't recognize you, but Hemir proudly shares the story of how he once stole from your home… The miller's face darkens slightly – it's clear they've been raising Hemir like their own son, and no one wants their heir to be a thief, do they?
> You quickly cut off his rambling, pulling out a shiny gold coin and insisting on buying flour milled by Hemir himself – the boy reluctantly heads off to work.
> Later, as Alim drops noodles into the hodgepodge soup, his tears fall into the pot. "The boy's finally on the right path," he mutters, "I couldn't be happier!"


## Catching a Thief — rite `5008067` (抓贼)
**Confidence:** High — official `i18n/en` string for every field; 5 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008067_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Alim#Catching_a_Thief

**Intro (EN):**
> As you step into the study, a dark figure scrambles out the window in a panic –

**Slot lines (EN):**
> s1: Pickpocket
> s2: Hemir made off with your gold coins
> s3: You can do this job yourself, or send any of your followers to do it.
> s4: Anything you find useful

**Dice line (EN):**
> Catching a Thief
> The number of dice is affected by the challenger's Stealth and Physique.
> You need at least 3 Successes.

<!-- settlement[0] -->
**Outcome — branch, condition `{"!s3": 1, "s2.金币>=": 1}`:** *His Lucky Day*
> You ignore the pickpocket – kids like him are too common, and he is certainly not the biggest problem you need to deal with today.

<!-- settlement[1] -->
**Outcome — success, condition `{"s2.金币>=": 1, "r1:战斗+体魄-e(战斗+体魄)>=": [3, 5], "s3": 1}`:** *You can't run far with shoes like these*
> When [s3.name] drags him back, the young pickpocket keeps cursing his shoes – if he had stolen your money sooner and gotten sturdy boots, he would never have been caught.

<!-- settlement[2] -->
**Outcome — failure, condition `{"s2.金币>=": 1, "r1:战斗+体魄-e(战斗+体魄)<": [3, 5], "s3": 1}`:** *Run Like a Rabbit*
> [s3.name] returns in a fury – the kid clearly knows the local terrain well, and maybe he will come back again.

<!-- settlement[3] -->
**Outcome — branch, condition `{"!s3": 1, "s2.金币<": 1}`:** *What's left for me to lose?*
> The wallet's empty anyway... You just shrug it off, like he's only stolen your misfortune.

<!-- settlement[4] -->
**Outcome — success, condition `{"s2.金币<": 1, "r1:战斗+体魄-e(战斗+体魄)>=": [3, 5], "s3": 1}`:** *Honor Among Thieves: The Poor Don't Rob the Poor*
> When [s3.name] brings him back, the young pickpocket keeps begging for mercy, though his way of pleading is quite unpleasant.

<!-- settlement[5] -->
**Outcome — failure, condition `{"s2.金币<": 1, "r1:战斗+体魄-e(战斗+体魄)<": [3, 5], "s3": 1}`:** *Let's go somewhere emptier than your wallet*
> [s3.name] returns in a fury. After failing to steal the money, the young pickpocket cursed him vulgarly, even tripping him with a rope... The kid clearly knows the local terrain well, and maybe he will come back again.


## Money First, Goods Later — rite `5008069` (先钱后货)
**Confidence:** High — official `i18n/en` string for every field; 5 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008069_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Alim#Money_First__Goods_Later, https://sultansgame.wiki.gg/wiki/Alim#Outcomes

**Intro (EN):**
> As you scold the old pickpocket, you don't notice your wallet is now completely empty! He smiles, waiting for you to trade something else.

**Slot lines (EN):**
> s1: Alim
> s2: Alim's Mysterious Box of Stolen Goods
> s3: Alim made off with your gold coins
> s4: You can do this job yourself, or send any of your followers to do it.
> s5: Send someone with what Alim wants.

<!-- settlement[0] -->
**Outcome — branch, condition `{"!s4": 1, "!s5": 1}`:** *Furious*
> You walk away without looking back – and order all the servants to lock the doors and windows securely.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s4": 1, "!s5": 1}`:** *Since you're already here*
> You appreciate the humor of this old pickpocket and send someone to pick a mysterious box – who knows what good things might come out of it?

<!-- settlement[2] -->
**Outcome — branch, condition `{"s4": 1, "s5": 1}`:** *Since you're already here*
> You appreciate the humor of this old pickpocket and send someone to pick a mysterious box – who knows what good things might come out of it?

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3.金币>=": 5, "s5.is": 2000885}`:** *Barter*
> You understand what Alim wants, so you throw Hemir, who has been locked up at your place, right in front of him. Seeing how cooperative Lord [player.name] is, Alim grins so wide his rotten teeth look like they might fall out... Of course, he returns all your money as promised, along with a Supreme Mystery Box.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s3.金币<": 5, "s5.is": 2000885}`:** *Barter*
> You understand what Alim wants, so you throw Hemir, who has been locked up at your place, right in front of him. Seeing how cooperative Lord [player.name] is, Alim grins so wide his rotten teeth look like they might fall out... he offers a Supreme Mystery Box as part of the deal.
>
> He glances at your empty purse and mockingly says with a wink: "Knowing your lordship's poor financial situation, I'll tell my boys to give you less trouble in the future."


## Thief Apprentice — rite `5008076` (贼的志愿生)
**Confidence:** High — official `i18n/en` string for every field; 5 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008076_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Alim#Thief_s_Apprentice

**Intro (EN):**
> "This young pup came back to me, still set on being a thief... but that's wrong. So, my Lord, help me set him straight until he goes back to the mill."

**Slot lines (EN):**
> s1: Alim
> s2: Hemir
> s3: You can do this job yourself, or send any of your followers to do it.
> s4: Consumable to improve abilities.
> s5: Your gold coins

**Dice line (EN):**
> Start lecturing
> The number of dice is affected by the challenger’s Sociability and Charisma.
> You need at least 8 Successes.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:社交+魅力>=": [8, 5]}`:** *You could get a part-time job*
> It's not hard to see why Hemir's fed up with the mill: who wants to spend their life trudging in circles with a donkey? Making someone else's gold coins do the spinning is much more fun; especially since Alim’s pretty good to his pups. He's out of options now, pinning his hopes on that slick tongue of yours that can even fool the Sultan.
>
> So, acting all grown-up, you pour this kid a full glass of wine and sit across from him:
>
> "Hundreds, maybe thousands, of kids in the Dark Alley would kill for your chance right now. It's tough for a thief to turn miller, but a miller… can turn thief whenever he likes."
>
> This lesson isn't quite what Alim expects, but Hemir clearly takes it to heart. He vows to work hard, inherit the mill, and one day become a master thief like Alim – which brings Alim to tears of joy.

<!-- settlement[1] -->
**Outcome — failure, condition `{"r1:社交+魅力<": [8, 5]}`:** *Old dog and pup*
> Hemir doesn't listen to you at all, instead nestling affectionately into Alim's arms. He wants nothing but this old dog, this father-like thief ringleader. With no other choice, Alim takes Hemir back to the dog den. While his mouth curses the boy for being useless, incompetent, and unable to know what's good for him, his eyes betray a smile.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r2:智慧+隐匿-e(智慧+隐匿)>=": [6, 5]}`:** *You're still green*
> In this touching moment, you catch Hemir's fingers sneaking into your wallet... Honestly, he's much better at turning the mill.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"r2:智慧+隐匿-e(智慧+隐匿)<": [6, 5], "s5.金币>=": 1}`:** *He'll achieve great things*
> In this touching moment, while you were distracted, Hemir silently took the gold coins from your wallet. It wasn't until after they left that you noticed Alim proudly scolding him, making you finally realize what had happened.

<!-- settlement_extre[2] -->
**Outcome — failure, condition `{"r2:智慧+隐匿-e(智慧+隐匿)<": [6, 5], "s5.金币<": 1}`:** *Lord [player.name] is a deep one*
> Hemir slips his hand into your wallet with silent precision... but as he rummages deeper and deeper, practically diving in with his whole body, he can't find even a single coin. Left with no choice, he exchanges an awkward forced smile with Alim...


## The Monarch's Weight — rite `5000160` (君王的胸襟)
**Confidence:** High — official `i18n/en` string for every field; 4 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000160_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sultan%27s_Nipple_Chains#The_Monarch_s_Weight

**Intro (EN):**
> Wearing this constitutes clear presumption, but how can you resist keeping such amusing... and useful things buried in chests!

**Slot lines (EN):**
> s1: Wow, the Monarch's Weight
> s2: Bearer your chosen

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.主角": 1}`:** *You resolve to personally bear this imperial anguish*
> You take the fire-heated silver needle, grit your teeth, close your eyes, and pierce your own nipple. You keep telling yourself this pain means nothing compared to slaughter, battle, or... well, nothing.
> However, when this heavy golden chain truly presses, grips, and begins tearing your skin, you realize this stabbing ache cannot heal, knows no day or night, and permits no escape. It grows with desire and ambition, continuously stirring and disturbing every sleepless dream henceforth.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.贵族": 1}`:** *Unspeakable Secrets*
> Seeing this nipple chain, [s2.name] freezes completely. He examines its details repeatedly, then regards you with expressions beyond words, utterly complex...
> You exhaust yourself persuading him about fashionability and benefits... For old friendship's sake, he reluctantly agrees with martyred expression, but absolutely refuses your personal assistance. The next day when you reach to verify he's wearing it and ask about sensations, he firmly refuses confession.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s2.奴隶": 1}`:** *Suit Him Perfectly*
> Slaves naturally cannot refuse your decisions - they must endure even agony. Fascinating, isn't it? With proper timing and conditions, why shouldn't royal items - even royal thrones - belong to base servants?

<!-- settlement[3] -->
**Outcome — branch, condition `{}`:** *Hope Dashed*
> Hearing you wish to gift him this golden chain, [s2.name] immediately offers profuse gratitude, clearly ignorant of its nature...
> So you immediately explain he must pierce it through nipples to claim it... Alas, you expected his slight hesitation for dignity's sake, but he nods decisively - joking aside, this is pure gold!
> Regrettably, he'll learn later that what cannot be removed cannot be sold for actual currency...


## Maggie, let me ask you... — rite `5006053` (梅姬，我问你……)
**Confidence:** High — official `i18n/en` string for every field; 4 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006053_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Maggie__let_me_ask_you...

**Intro (EN):**
> Adila's sudden disclosure makes it difficult for you to sleep. After tossing and turning for a long time, you can't help it and wake Maggie up...

**Slot lines (EN):**
> s1: You really want to ask Maggie.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *You tell Maggie everything Adila has said.*
> Maggie's drowsy eyes suddenly fly wide open at your words. She remains stunned for a moment before coming back to her senses.
>
> "Oh my dear Adila, my goodness... I have no idea she felt this way..." She seems to gradually recall her various interactions with Adila. "She did mention she could never picture herself with a man..."
>
> She sinks into deep contemplation... Adila wants to elope with her after slaying the dragon... What would she think? You watch her anxiously, searching her eyes for any hint of her thoughts.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"counter.7000182>=": 3}`:**
> Almost instinctively, Maggie nods. Then, as if suddenly remembering your presence beside her, she quickly shakes her head.
> "I won't give up being the mistress of this mansion to become a femal warrior's... lover. That's too silly, right?"
> You had hoped for something more – perhaps a promise of her love – but Maggie simply lets out a small yawn and says, "Go to sleep, my darling."
> For now, you'll have to take what comfort you can from those words.
> With Adila still away and nothing certain, all you can do is push down the anxiety gnawing at your heart and try to find some rest.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"counter.7000182<": 3, "counter.7000182>": 0}`:**
> Maggie simply tilts her head in confusion, thinking hard for a moment before confirming this isn't a joke.
>
> "Run away with her? But I don't want to run away with her. How could she say that? I don't have any romantic feelings for her... Oh my goodness, I've never had feelings for anyone but you, never!"
>
> She turns to you, eyes widening. "Wait... you actually thought I...?"
>
> Oh, heavens, you quickly assure her that you've never doubted your relationship and swear to it. Maggie studies your face for a long moment before letting her eyes drift shut. "Alright, darling, go to sleep. It's late."
>
> And with that, the matter is settled. You breathe a small sigh of relief. It's all Adila's crazy talk to blame.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"counter.7000182<=": 0}`:**
> "Ah, how could she say such a thing? To my husband, no less!"
>
> Maggie finally snaps back to her senses, her fists clenched tight. "Marrying you has been the greatest joy of my life. Even through all the torments we endured from the Sultan, I've never once regretted it. How could she – how dare she – think my love for you is so superficial?"
>
> Maggie remains angry for a while before turning to self-reproach, wondering if she had somehow led Adila to misread their friendship. You quickly draw her into your arms, murmuring words of comfort. Together, you sink into each other's embrace, soon drifting off to sleep in the gentle warmth of candlelight.


## Become Lambs — rite `5008081` (做羔羊)
**Confidence:** High — official `i18n/en` string for every field; 4 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008081_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Orphans#Become_Lambs

**Intro (EN):**
> Theoretically, the True Faith does charity, but clearly, it's not free.

**Slot lines (EN):**
> s1: Children
> s2: You need to spend 10 Gold Coins to donate to the True Faith; breaking the Extravagance Card requires 20 Gold Coins.
> s3: You can break Stone Extravagance
> s4: Your faith in the True Faith garners a reinforcement

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1": 1, "any": {"s2.金币<=": 10, "!s3": 1}}`:** *From Dirty to Pure*
> This money will provide these children with basic education. They will be properly groomed, learn to recite sacred laws and divine hymns – and perform various duties for the Order of the Pure. The brightest and purest among them might even be enlightened, ascending to become monks of the Pure.
>
> In any case, it's a decent livelihood – even old Alim doesn't deserve to step into the Sanctum of the Pure!

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1": 1, "s2.金币>=": 20, "s3": 1}`:** *From Dirty to Pure*
> This money will provide these children with basic education. They will be properly groomed, learn to recite sacred laws and divine hymns – and perform various duties for the Order of the Pure. The brightest and purest among them might even be enlightened, ascending to become monks of the Pure.
>
> In any case, it's a decent livelihood – even old Alim doesn't deserve to step into the Sanctum of the Pure!
>
> The Sultan himself attended to witness your breaking of the Carnality Card. Despite the street urchins' rather unprofessional rendition of the holy hymn – this gesture greatly improved the Order of the Pure's opinion of you.

<!-- settlement[2] -->
**Outcome — branch, condition `{"!s1": 1}`:** *All sheep are hilariously silly*
> You barely believe in religion yourself, yet you're sending children to be slaves of God... Is that really OK? Perhaps you should reconsider.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1": 1, "s4": 1}`:** *Piousness*
> Your faith in the True Faith garners a solid reinforcement.


## Dealing with the Betraying Friend — rite `5006001` (处置背叛的朋友)
**Confidence:** High — official `i18n/en` string for every field; 4 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006001_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Betrayed_Friend#Dealing_with_the_Betrayed_Friend, https://sultansgame.wiki.gg/wiki/Betrayed_Friend#You_decided_to_forgive_this_former_friend, https://sultansgame.wiki.gg/wiki/Betrayed_Friend#You_decided_to_indulge_in_Carnality, https://sultansgame.wiki.gg/wiki/Betrayed_Friend#You_decided_to_relish_in_Bloodshed

**Intro (EN):**
> You detest ungrateful people the most. Even though you once drankr under a tree together, this person is no longer your friend! This wasn't your choice – it was his. He chose to become your enemy, and now, he must pay the price for it.

**Slot lines (EN):**
> s1: The Betraying Friend is at your mercy.
> s2: In this situation, you should step in personally.
> s3: You can use this opportunity to discard a Bloodshed Card or a Carnality Card

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3.纵欲": 1}`:** *You decided to indulge in Carnality.*
> You drag this man out of the cellar and slap a Carnality Card on his face.
> Has the poor guy finally realized what's going to happen? He frantically tries to escape your restraint, but due to the torment he endured over the past three days, he's unable to resist your advances. As you brutally pierce him, his weak and pale face no longer holds the prideful expression it once had. Only the gemstone ring you didn't take from his finger remains, a most ironic epitaph to the event.
> You break the card as desired, and the man has learned his lesson and will never appear before you again.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s3.杀戮": 1}`:** *You decided to relish in Bloodshed.*
> You drag the man out of the cellar and slap a Bloodshed Card onto his face.
>
> Does this poor thing finally realize what's about to happen? He panics, desperately trying to escape your grasp, but after three days of torment, he's far too weak to resist. As the blade pierces his chest, that weak and pallid face finally loses its once-proud expression. Only the gemstone ring on his finger – one you couldn't even bother to take – remains as his final, ironic burial token.
>
> Just as you wished – you break the card, and the man will never appear before you again.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"!s3": 1}`:** *You decided to forgive this former friend.*
> These three days were enough to teach him a profound lesson. You drag this man out of the cellar and tell him he can go. He looks at you suspiciously, confirming it's not a joke, and then bursts into tears of joy, kneeling and hugging your legs as if you were the greatest saint in the world...
> Not long after, he voluntarily returns all the money he owed you.


## Ripples in the Bathhouse — rite `5006514` (浴池里的波澜)
**Confidence:** High — official `i18n/en` string for every field; 4 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006514_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Zaki#Admiration_of_the_Young_Noble

**Intro (EN):**
> You invited Zaki, and he did not refuse. What will happen in the ripples of the bathhouse? Zaki might know, or he might not. But you are fully aware of what you are doing, aren't you? You will hold his hand, using his curiosity, trust, and admiration to lure him onto a path full of temptation and danger...

**Slot lines (EN):**
> s1: You must attend the appointment in person.
> s2: Zaki is curious about what will happen
> s3: You can use this to break a Carnality card of no higher tier than Zaki

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:** *Zaki would never refuse your invitation*
> The bathhouse has long been cleared, leaving only the two of you. Zaki is a bit shy but proud of the strength you've shown. He looks at you, repeatedly complimenting, admiring, and praising you. You know these words come from his heart.
> 'Sometimes I wish,' he says, his eyes sparkling, 'you were my father... Oh, if only you were my father!'
> You move closer to his young and strong body, place your hand on his shoulder, and softly tell him that you can do better than a real father...
> Zaki is not a foolish child; he understands what you mean.
> Rose-scented water ripples endlessly, marking a very interesting and pleasant time.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3": 1}`:** *You take out a Carnality card*
> You make public what should have been a private affair, but the Sultan shows little interest and casually asks you for many details, seeming somewhat repulsed. To prove that your affair was enough to break this Carnality card, you have to emphasize the immoral aspects, how you used his naivety, how you tricked him into your trap...
> By the end, the Sultan smiles meaningfully. You break the Carnality card in public as you wished, but when the cold wind chills your sweat, you realize that this was the Sultan's trap... and you will pay a price far beyond your imagination.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s3": 1}`:** *Everything was done in secret*
> When Zaki says goodbye, there is a hint of reluctance and hope in his eyes. You smile and touch his wet curls, telling him it's time to go back and that... there will be many more opportunities. The young man's face reddens again. He tries to suppress the curve of his mouth, nodding vigorously, and then leaves without daring to look at you again.


## Investigate Evidence — rite `5001024` (调查罪证)
**Confidence:** High — official `i18n/en` string for every field; 3 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001024_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Investigate_Evidence#Expiration, https://sultansgame.wiki.gg/wiki/Investigate_Evidence#Failure

**Intro (EN):**
> High Constable Adil is searching for your evidence... You need to do something, or he might really put you on trial – when obviously when it’s all clearly the Sultan’s fault!

**Slot lines (EN):**
> s1: High Constable Adil
> s2: Your Evidence
> s3: Ally to Apply Pressure
> s4: Ally to Plan the Attack
> s5: Consumables to Assist

**Dice line (EN):**
> Apply pressure
> Your Sociability and Wisdom provide you with the full dice count.
> You need at least 2 Successes, or 1 Success if Renown is greater than 5.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"!s3": 1, "!s4": 1}`:** *You didn't intervene in this matter*
> Adil won't show you any mercy, and soon you'll receive notice of the trial.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"s3": 1, "counter.7100001<": 5, "r1:s3.社交+s3.智慧+s5.社交+s5.智慧>=": [2, 5]}`:** *The investigation against you is facing significant resistance.*
> Everyone knows you are playing a dangerous game with the Sultan, so discussing law now is not very wise.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"s3": 1, "counter.7100001>=": 5, "r1:s3.社交+s3.智慧+s5.社交+s5.智慧>=": [1, 5]}`:** *Adil is under heavy criticism*
> Everyone knows your good reputation, especially since you are already dealing with the Sultan's game. His opportunistic investigation is both unpopular and futile. He has no choice but to back off for now.

<!-- settlement_extre[2] -->
**Outcome — failure, condition `{"s3": 1, "counter.7100001>=": 5, "r1:s3.社交+s3.智慧+s5.社交+s5.智慧<": [1, 5]}`:** *You couldn't stop him*
> Adil has found what he wanted, and soon you'll receive notice of the trial.

<!-- settlement_extre[3] -->
**Outcome — failure, condition `{"s3": 1, "counter.7100001<": 5, "r1:s3.社交+s3.智慧+s5.社交+s5.智慧<": [2, 5]}`:** *You couldn't stop him*
> Adil has found what he wanted, and soon you'll receive notice of the trial.

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"s4": 1, "r2:s4.体魄+s4.战斗+s5.体魄+s5.战斗-e(体魄+战斗)>=": [1, 5]}`:** *Attack Successful*
> Adil was stabbed several times in the dark alley. It's a miracle he didn't die. At least he won't investigate you for a while.

<!-- settlement_extre[5] -->
**Outcome — failure, condition `{"s4": 1, "counter.7100004<": 5, "r2:s4.体魄+s4.战斗+s5.体魄+s5.战斗-e(体魄+战斗)<": [1, 5]}`:** *Attack Failed*
> The assassin you sent almost got caught by Adil... He knows it was your person, and it's not over yet.

<!-- settlement_extre[6] -->
**Outcome — failure, condition `{"s4": 1, "counter.7100004>=": 5, "r2:s4.体魄+s4.战斗+s5.体魄+s5.战斗-e(体魄+战斗)<": [1, 5]}`:** *Acting with impunity*
> Adil has survived your assassination attempt, but with your spies everywhere, he hasn’t been able to gather any evidence or testimonies.


## The True Reward — rite `5000562` (真正的报偿)
**Confidence:** High — official `i18n/en` string for every field; 3 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000562_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#True_Reward

**Intro (EN):**
> You hope to convince Sadani to join your regicide plot. It is better to conspire of such things in person. You decide to take the risk and sneak into the palace to meet Sadani.

**Slot lines (EN):**
> s1: Consort Sadani is quietly resting in her palace.
> s2: You can handle this yourself, or send certain followers.
> s3: You can either pay 10 Gold Coins to bribe the guard, or utilize the prepared Harem Secret Passage.
> s4: Some items can help with infiltration or persuasion.

**Dice line (EN):**
> You already have an "arrangement" with the harem guards, but upon hearing your request, a rare look of unease creep up their brows. Not long after, the Royal Guard Captain, who has caught wind of the matter, hurries over. He does not seem pleased. You need to persuade him to let you pass, somehow...
> Your Charisma and Sociability determine your full dice count.
> You need at least 3 Successes to convince the guard.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.is": 2000011}`:** *Cold-shouldered, as expected*
> Taking advantage of his position, the Court Physician Samir pays a visit to Consort Sadani. But she turns down your request for a meeting outside the palace, excusing herself saying she does not want to draw further attention. She hands Samir some money for you, hoping that it is enough to settle the matter.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.is": 2000019}`:** *Cold-shouldered, as expected*
> The Jeweler visits the consorts as usual, and sees Consort Sadani. But Sadani turns down your request for a meeting outside the palace, excusing herself saying she does not want to draw further attention. She hands the Jeweler some money for you, hoping that it is enough to settle the matter.

<!-- settlement[2] -->
**Outcome — failure, condition `{"s2.主角": 1, "s3.金币": 1, "r1:魅力+社交<": [3, 5]}`:** *You failed to convince them*
> The Royal Guard Captain, Seliman, seems to be in a bad mood today. He interrupts your flattery and even pushes away the bag of coins you try to sneak him. He states flatly that Consort Sadani is unwell and unfit to receive visitors; you are not to disturb her again.
>
> How odd. Did Consort Sadani specifically order them to stop you? After all that she has done for her, how dare she be so cold?
>
> There is something strange going on. But there is nothing to be done here today. Perhaps next time you will learn something.

<!-- settlement[3] -->
**Outcome — success, condition `{"s2.主角": 1, "s3.金币": 1, "r1:魅力+社交>=": [3, 5]}`:** *You notice something strange...*
> Captain Seliman of the Royal Guards seem to be in a poor mood today. He abruptly interrupts your flatteries, even refusing the purse you try to bribe him with. He states flatly that Consort Sadani is unwell today and not in a state to receive visitors, that you should leave her in peace.
> You detect a hint of something unusual in his eyes – the hostility of lion whose territory has been threatened.
> It dawns on you. Pulling him aside, you whisper: "I know the relationship between you and Consort Sadani. Worry not, I have no intentions on her. It's just that the Consort had tasked me with this errand..."
> "Sadani told you?" Seliman looks at you in surprise, and when he sees the shrewd satisfaction on your face, he falls silent.
> You smile. "No wonder Consort Sadani asked me to 'correct' the royal records... Well, less correction, more fabrication, right, Captain Seliman? Please take your hand off the hilt. We are friends, aren't we?" You pat his shoulder.
> At this point, it is no longer necessary for you to meet with Sadani today. You can wait and see which of you, Seliman and her can best keep your composure. You know you can wait, unlike them.

<!-- settlement[4] -->
**Outcome — branch, condition `{"s2.主角": 1, "s3.is": 2000283}`:** *You Sneak into the Palace*
> You sneak into the palace by the secret passage. It takes you some time to find Consort Sadani's abode.
>
> As night drapes its velvet shroud over the palace, you scale the garden wall in silence, only to halt in surprise at the sight before you. Sadani stands among the blooming desert roses, her gaze lowered as a man in gilded armor plucks a blossom and tucks it behind her ear. A gesture far too intimate. And yet, she does not pull away. Beneath the lantern’s glow, her glassy, jewel-like eyes shimmer with complex emotions.
>
> Before you can decipher the look in those eyes, the man lifts his head, as if sensing something amiss. You flee before they find you, but you have seen enough. You know his face. Seliman, the Royal Guard Captain, one of the Sultan’s most trusted Champions, the only four men permitted to bear arms in his presence.

<!-- settlement[5] -->
**Outcome — success, condition `{"s2.主角": 1, "!s3": 1, "r2:隐匿+体魄>=": [1, 5]}`:** *You Sneak into the Palace*
> You find a way and sneak into the harem. It takes you some time to find Consort Sadani's abode.
> As night drapes its velvet shroud over the palace, you scale the garden wall in silence, only to halt in surprise at the sight before you. Sadani stands among the blooming desert roses, her gaze lowered as a man in gilded armor plucks a blossom and tucks it behind her ear. A gesture far too intimate.
> And yet, she does not pull away. Beneath the lantern’s glow, her glassy, jewel-like eyes shimmer with complex emotions.
> Alas, before you can decipher the look in those eyes, the man lifts his head, as if sensing something amiss. You flee before they find you, but you have seen enough. You know his face. Seliman, the Royal Guard Captain, one of the Sultan’s most trusted Champions, the only four men permitted to bear arms in his presence.

<!-- settlement[6] -->
**Outcome — failure, condition `{"s2.主角": 1, "!s3": 1, "r2:隐匿+体魄<": [1, 5]}`:** *You failed*
> You hid in a carriage carrying supplies at night and tried to sneak into the harem, but unfortunately failed.
> You took great pains to escape the siege of the guards, but they still left a lot of wounds on you... You must find a trustworthy doctor to heal you as soon as possible, otherwise your life will be in danger.


## Entangled in Scandal — rite `5006515` (丑闻缠身)
**Confidence:** High — official `i18n/en` string for every field; 3 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006515_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Zaki#Entangled_in_Scandal

**Intro (EN):**
> To break the Carnality card, you made public the affair between you and Zaki. He and his mother Fatuna became the targets of criticism overnight.

**Slot lines (EN):**
> s1: Zaki is entangled in scandal
> s2: Fatuna cannot bear the shame

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1.激情": 1, "s2.激情": 1}`:**
> Once stigmatized, there is no washing it away. People curse, blame, and mock Zaki and Fatuna. Those obscene words penetrate their ears no matter how tightly they shut their doors and windows. Those piercing stares make them feel naked in broad daylight no matter how tightly they wrap their clothes around themselves.
> Finally, Fatuna could not bear it any longer. She took Zaki and left the city. However, before leaving, she sighed and had a servant give something to you. After that, you two had no further ties.

<!-- settlement[1] -->
**Outcome — branch, condition `{}`:**
> Once stigmatized, there is no washing it away. People curse, blame, and mock Zaki and Fatuna. Those obscene words penetrate their ears no matter how tightly they shut their doors and windows. Those piercing stares make them feel naked in broad daylight no matter how tightly they wrap their clothes around themselves.
> Finally, Fatuna could not bear it any longer. She took Zaki and left the city. Naturally, she did not say goodbye to you, the perpetrator.


## Become Prostitutes — rite `5008079` (做鸡)
**Confidence:** High — official `i18n/en` string for every field; 3 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008079_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Orphans#Become_Prostitutes

**Intro (EN):**
> You've been stressed over these street urchins – They must find a way to sustain themselves! Today... as you pass by the House of Delights, where a pretty girl is stuffed in a big clay jar, her head poking out to lure in customers; maybe it's a stunt, maybe it's for real… either way, a wild idea crashes into your head.

**Slot lines (EN):**
> s1: Children

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1": 1}`:** *They have a bright future*
> Buthayna loves these unique girls: "Look at them, adorable! Many customers love this type of demeanor!" She pinches another boy's cheek. "Every client feels more confident in front of them! You've made an excellent selection, Lord [player.name]. I'll take them all!"
>
> So, it's settled. Even if Alim angrily objects, he can't support so many thieves.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s1": 1}`:** *Becoming prostitutes is not good*
> You didn't pull them out of White-Belly for this kind of mess, at least not now.


## Beast of Burden — rite `5008080` (做牛马)
**Confidence:** High — official `i18n/en` string for every field; 3 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008080_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Orphans#Beast_of_Burden

**Intro (EN):**
> You find Bharat – a guy who wheels and deals between the Sultan and foreign lands, full of dodgy tricks to scrape by. The thing is, he only takes on mute or deaf kids as his little helpers, figuring their silence works in his favor. For the rest, he is willing to show them some sleight of hand, cheap scams, and juggling – begging is much easier on those long trade routes compared to the capital. It will cost you a few coins, though.

**Slot lines (EN):**
> s1: Children
> s2: You need to give the foreign merchant 5 Gold Coins as children's maintenance

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1": 1}`:** *At least, they can leave here*
> Bharat promised to take the children when he next leaves. Though his business isn't entirely legal, he wouldn't harm them or dare betray you. Alim is reassured by this arrangement.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s1": 1}`:** *A Beast of Burden, No Matter How Far It Roams*
> You think for a moment. Bharat definitely won't teach these children anything decent, and will only treat them like animals and tools... Perhaps in a few days, a better idea will come along. Better to wait for now.


## Become a Lamb? — rite `5008083` (做羔羊？)
**Confidence:** High — official `i18n/en` string for every field; 3 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008083_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Orphans#Become_a_Lamb_

**Intro (EN):**
> There is not just one god in this world... Some gods shepherd their people, while others grind their teeth, suck blood, and favor fresh lambs...

**Slot lines (EN):**
> s1: Children
> s2: Convictions of the Cult.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1": 1}`:** *Badriyyah took them away*
> Badriyyah takes the lead, and you stick close – the stuffed beggars scamper after you the whole way.
>
> Then, in a pitch-black woodland untouched by moon or stars, she turns around and kisses you, her sweet juice seeping into you. When you savor such an extraordinary reward, you realize all the children have disappeared.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s1": 1}`:** *Forget it*
> You saw that woodland and even heard that call, but you are not prepared to take the children to such a place.


## Become Rats — rite `5008084` (做老鼠)
**Confidence:** High — official `i18n/en` string for every field; 3 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008084_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Orphans#Become_Rats

**Intro (EN):**
> You found Alim again and suggested that he might consider teaching these children to become thieves. After all, he's quite good at taking care of children... Of course, you could give him some money to kick things off.

**Slot lines (EN):**
> s1: Children
> s2: You need to give Alim 8 Gold Coins for the children's care

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1": 1}`:** *Every man to his trade*
> In the past, these children had to rely on their disabilities to earn sympathy while begging, but now Alim has shown them how to make money on their own. After all, without offering people a chance to feel superior, those with disabilities are invisible to normal people, aren't they?

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s1": 1}`:** *Too Many Thieves*
> Looking at Alim's sly and confident smile, you feel you could not tolerate small children turning out this way... Think again, think again.


## Guesthouse — rite `5006565` (舍馆)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006565_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse, https://sultansgame.wiki.gg/wiki/Guesthouse#Upgrades

**Intro (EN):**
> These people will risk everything for you after enjoying your meal... at least until it's digested.

**Slot lines (EN):**
> s1: Retainer
> s2: Retainer
> s3: Retainer
> s4: Retainer
> s5: Retainer
> s6: Send someone to recruit the 1st Retainer.
> s7: Send someone to recruit the 2nd Retainer.
> s8: Send someone to recruit the 3rd Retainer.
> s9: Send someone to recruit the 4th Retainer.
> s10: Send someone to recruit the 5th Retainer.
> s11: If Notoriety is greater than or equal to 20, you can spend 15 Gold Coins to upgrade the Guesthouse.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s11": 1}`:** *You have expanded the Guesthouse.*
> The more mouths there are to feed, the more voices there are to speak for you. Your subjects will sic your foes at your behest.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s6": 1}`:**
> Recruitment Successful

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s7": 1}`:**
> Recruitment Successful

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s8": 1}`:**
> Recruitment Successful

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s9": 1}`:**
> Recruitment Successful

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s10": 1}`:**
> Recruitment Successful

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"any": {"s6.is": 2000350, "s7.is": 2000350, "s8.is": 2000350, "s9.is": 2000350, "s10.is": 2000350}}`:**
> Come back next time

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"!s6.is": 2000350, "!s7.is": 2000350, "!s8.is": 2000350, "!s9.is": 2000350, "!s10.is": 2000350}`:**
> Come back next time


## Guesthouse — rite `5006566` (舍馆)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006566_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse, https://sultansgame.wiki.gg/wiki/Guesthouse#Upgrades

**Intro (EN):**
> These people will risk everything for you after enjoying your meal... at least until it's digested.

**Slot lines (EN):**
> s1: Retainer
> s2: Retainer
> s3: Retainer
> s4: Retainer
> s5: Retainer
> s6: Send someone to recruit the 1st Retainer.
> s7: Send someone to recruit the 2nd Retainer.
> s8: Send someone to recruit the 3rd Retainer.
> s9: Send someone to recruit the 4th Retainer.
> s10: Send someone to recruit the 5th Retainer.
> s11: If Notoriety is greater than or equal to 20, you can spend 15 Gold Coins to upgrade the Guesthouse.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s11": 1}`:** *You have expanded the Guesthouse.*
> The more mouths there are to feed, the more voices there are to speak for you. Your subjects will sic your foes at your behest.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s6": 1}`:**
> Recruitment Successful

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s7": 1}`:**
> Recruitment Successful

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s8": 1}`:**
> Recruitment Successful

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s9": 1}`:**
> Recruitment Successful

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s10": 1}`:**
> Recruitment Successful

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"any": {"s6.is": 2000350, "s7.is": 2000350, "s8.is": 2000350, "s9.is": 2000350, "s10.is": 2000350}}`:**
> Come back next time

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"!s6.is": 2000350, "!s7.is": 2000350, "!s8.is": 2000350, "!s9.is": 2000350, "!s10.is": 2000350}`:**
> Come back next time


## Guesthouse — rite `5006563` (舍馆)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006563_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse, https://sultansgame.wiki.gg/wiki/Guesthouse#Upgrades

**Intro (EN):**
> These people will risk everything for you after enjoying your meal... at least until it's digested.

**Slot lines (EN):**
> s1: Retainer
> s2: Retainer
> s3: Retainer
> s4: Retainer
> s5: Send someone to recruit the 1st Retainer.
> s6: Send someone to recruit the 2nd Retainer.
> s7: Send someone to recruit the 3rd Retainer.
> s8: Send someone to recruit the 4th Retainer.
> s9: When your Notoriety is 10 or higher, you can spend 10 Gold Coins to upgrade the guesthouse.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s9": 1}`:** *You have expanded the Guesthouse.*
> The more mouths there are to feed, the more voices there are to speak for you. Your subjects will sic your foes at your behest.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s5": 1}`:**
> Recruitment Successful

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s6": 1}`:**
> Recruitment Successful

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s7": 1}`:**
> Recruitment Successful

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s8": 1}`:**
> Recruitment Successful

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"any": {"s5.is": 2000350, "s6.is": 2000350, "s7.is": 2000350, "s8.is": 2000350}}`:**
> Come back next time

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"!s5.is": 2000350, "!s6.is": 2000350, "!s7.is": 2000350, "!s8.is": 2000350}`:**
> Come back next time


## Guesthouse — rite `5006561` (舍馆)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006561_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse, https://sultansgame.wiki.gg/wiki/Guesthouse#Upgrades

**Intro (EN):**
> These people will risk everything for you after enjoying your meal... at least until it's digested.

**Slot lines (EN):**
> s1: Retainer
> s2: Retainer
> s3: Retainer
> s4: Send someone to recruit the 1st Retainer.
> s5: Send someone to recruit the 2nd Retainer.
> s6: Send someone to recruit the 3rd Retainer.
> s7: When your Notoriety is 5 or higher, you can spend 5 Gold Coins to upgrade the guesthouse.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s7": 1}`:** *You have expanded the Guesthouse.*
> The more mouths there are to feed, the more voices there are to speak for you. Your subjects will sic your foes at your behest.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s4": 1}`:**
> Recruitment Successful

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s5": 1}`:**
> Recruitment Successful

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s6": 1}`:**
> Recruitment Successful

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"any": {"s4.is": 2000350, "s5.is": 2000350, "s6.is": 2000350}}`:**
> Come back next time

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"!s4.is": 2000350, "!s5.is": 2000350, "!s6.is": 2000350}`:**
> Come back next time


## Guesthouse — rite `5006562` (舍馆)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006562_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse, https://sultansgame.wiki.gg/wiki/Guesthouse#Upgrades

**Intro (EN):**
> These people will risk everything for you after enjoying your meal... at least until it's digested.

**Slot lines (EN):**
> s1: Retainer
> s2: Retainer
> s3: Retainer
> s4: Send someone to recruit the 1st Retainer.
> s5: Send someone to recruit the 2nd Retainer.
> s6: Send someone to recruit the 2nd Retainer.
> s7: When your Notoriety is 5 or higher, you can spend 5 Gold Coins to upgrade the guesthouse.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s7": 1}`:** *You have expanded the Guesthouse.*
> The more mouths there are to feed, the more voices there are to speak for you. Your subjects will sic your foes at your behest.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s4": 1}`:**
> Recruitment Successful

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s5": 1}`:**
> Recruitment Successful

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s6": 1}`:**
> Recruitment Successful

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"any": {"s4.is": 2000350, "s5.is": 2000350, "s6.is": 2000350}}`:**
> Come back next time

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"!s4.is": 2000350, "!s5.is": 2000350, "!s6.is": 2000350}`:**
> Come back next time


## Nest of Decay — rite `5008072` (腐烂之巢)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008072_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Alim#Outcomes

**Intro (EN):**
> You come to the depths of Dark Alley, with its towering walls and iron gates sturdy enough to withstand armed soldiers – but it still stinks like a garbage dump. Alim clenches his fists. 
> "It's them... They've been eyeing my boys..." 
> You ask him who they are. 
> "The beggars of Dark Alley... They all listen to an old man called White-Belly, who always tries to turn my kids into beggars... This time they're even stealing!" 
> You remember the child beggars in Dark Alley, often physically disabled, using their deformed bodies to forcibly evoke passersby's sympathy... And you think of lively, healthy Hemir. You need to act quickly.

**Slot lines (EN):**
> s1: This beggar leader won't let you in
> s2: Sturdy Gate
> s3: Alim's Impotent Rage
> s4: You can do this job yourself, or send any of your followers to do it.
> s5: Send a person to assist with this matter
> s6: Consumable to improve abilities.

**Dice line (EN):**
> Open the Gate
> The number of dice is affected by the challenger's Combat and Physique.
> You need at least 9 Success.

<!-- settlement_prior[0] -->
**Outcome — failure, condition `{"counter.7100002<": 10, "counter.7100004<": 10, "r1:战斗+体魄-e(体魄+战斗)<": [9, 5]}`:** *You wasted too much time*
> The gate is reinforced specifically to withstand group attacks. By the time you find tools to break through, nothing remains but the stench of garbage... All the beggars and that child-trafficking kingpin White-Belly have vanished. Alim races frantically into the night... After that night, you never hear from him again.

<!-- settlement[0] -->
**Outcome — branch, condition `{"all": {"counter.7100004>=": 10, "counter.7100002<": 10}}`:** *Your words can split steel*
> Almost everyone in the Dark Alley knows you; they gather around the beggar's hideout, shouting your command: "Open the gate!"
>
> Under this pressure, the gate opens, and an old man with disgusting white sores covering his belly emerges. "What's all this about?" he squints at the crowd, then notices Alim. "Oh, it's the old mutt searching for his lost pup? He ran off, who knows where. Nothing to do with me." The angry crowd seizes him. Meanwhile, Alim rushes straight into the squalid den with you.

<!-- settlement[1] -->
**Outcome — branch, condition `{"counter.7100002>=": 10}`:** *There's always a bigger fish*
> Seeing the sturdy wooden door, Alim's heart races with panic. He blurts out, "Do you know Lord [player.name]? The Sultan's most terrifying minion! He eats children, kills women, rapes men, and brushes his teeth with their ashes! He is right here! And I swear, if you don't open this door, he will rape you, then kill you! Even if you fled to the ends of the earth, the Sultan's magician will still find you, gnawing off your rotten dick at midnight!" 
>
> Before you say anything to clarify yourself, White-Belly – trembling with fear – flings the door wide open.

<!-- settlement[2] -->
**Outcome — success, condition `{"counter.7100002<": 10, "counter.7100004<": 10, "r1:战斗+体魄-e(战斗+体魄)>=": [9, 5]}`:** *Master Key*
> There is a kind of key that can open any door: large enough, thick enough, heavy enough, a <size=+10><font="Title SDF"><b>log</b></font></size> wrapped in iron... lucky you, you can actually use this key. 
> White-Belly, still listening inside, is knocked off his feet, revealing ugly white sores on his belly...

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r2:生存+隐匿>=": [6, 5]}`:** *Unexpected Discovery*
> This is a trash heap, home to a swarm of young beggars – most of them crippled, while a few have yet to be maimed.
> You search through them one by one, but there's no sign of Hemir…
> Suddenly, Alim grabs something from around a young beggar's neck. It's a crude wooden whistle.
> "This belongs to Hemir. He carved it himself. That old bastard must have dragged my boy here – forcing him, beating him, trying to make him a beggar. Then Hemir refused, so he beat him even harder, probably even killed him. That's why the other kid has his whistle." He clenches the whistle tightly in his hand… Maybe you could interrogate White-Belly again – or at least kill him to let Alim vent his anger.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"r2:生存+隐匿<": [6, 5]}`:** *Nothing Gained*
> This is a trash heap, home to a swarm of young beggars – most of them crippled, while a few have yet to be maimed.
>
> You search through them one by one, but there's no sign of Hemir…
>
> Alim kicks White-Belly to the ground… then pulls out his blade, the one he uses for cutting purses.
>
> Maybe you could interrogate White-Belly again – or at least kill him to let Alim vent his anger.


## Deal with Adila — rite `5000633` (处置阿迪莱)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000633_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Deal_with_Adila

**Intro (EN):**
> The victor has the right to do as they please with the loser. Such is the warriors' code of honor.

**Slot lines (EN):**
> s1: Adila is at your mercy.
> s2: You can use her to break a Bloodshed Card or Carnality Card, or... as a gesture of good faith, gift her the White Rhino Skin?

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s2.杀戮": 1}`:** *You break a Bloodshed Card through her*
> Adila does not resist. You take her life with ease. Her family clearly expected the demise of this rebellious girl. The fate of this young maverick becomes nothing more than a passing amusement in the Sultan’s court...

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s2.纵欲": 1}`:** *You break a Carnality Card through her*
> Such is the most primal form of conquest, such is how the victor claim his prize. You derive immense pleasure from such an act.
> Adila, a warrior strong and dexterous, is nothing like the other women. Neither frail nor dainty, she lies beneath you like a young lion. She appears inexperienced, yet swallows her pain. You wrap your hand around her clenched fist soothingly, and pace the pleasures you give her, all so strange and new to her.
> What a pleasant night, at least for you.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s2.is": 2000329}`:** *You generously gift her the White Rhino Skin*
> "What is the meaning of this?" She stares at you, startled, unwilling to accept. You insist: "Forget about the bet, Adila. We are friends, aren't we? Giving a gift to a friend requires no reason. Besides, its color matches your sword. Let it accompany you in war. I think that's a much better fate for it than to gather dust in my warehouse."
> Adila's eyes sparkle. She solemnly accepts the rhino hide, then bows to you. "Please allow me to follow you, [player.name]. Let this sword belong to both of us." She proclaims, reintroducing herself, "My name is Adila, I am a warrior. You will need me."

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"!s2": 1}`:** *You spare her*
> Adila looks at you in astonishment. "You are letting me go, just like this? For nothing?" 
> You laugh heartily, pat her shoulder, and reply, "We’ve hunted together – faced death side by side, haven’t we? We're friends. Now, go back, wipe your face clean, and rest. Today has been long enough.'"
> She opens her mouth. "That won’t do – didn’t we agree? A warrior must stand by her words."
> After a long moment, she grits her teeth and unfastens the sword at her waist. "I have nothing else of value – only this blade, which is as dear to me as my own life…"
> She tenderly caresses its edge, upon which light dances like ripples, then places it squarely on your table. "Worry not. I will acquire another weapon for myself, though it won't hold up to this one... You must cherish it, understand? I’ve labored long and hard to get it." 
> With that, she bows hurriedly to you and departs without a backward glance, rushing off before regret catches up with her.

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s2.is": 2001139}`:** *You gave her a frightening gift*
> Clearly, the rhino hide was no longer what Adila had once known. It radiated a dark energy, more like something ripped from a monster than a beast of this world. She hesitated, uncertain of your intentions...
> You told her that in a game this twisted, survival meant using whatever you had at your disposal, dark forces included. The ends justified the means.
> Whether you meant it or were just saying what she needed to hear, it struck a chord with her. Adila took the cursed hide and forged it into an even stronger weapon. Then she joined your game, determined to see how your story ends.


## The Full Confession — rite `5000820` (从实招来)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000820_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/The_Full_Confession

**Intro (EN):**
> Now the slave hunter is your prisoner. You tell him that if he doesn't provide valuable intelligence, you'll make him wish for death.

**Slot lines (EN):**
> s1: Riel watches with hungry eyes
> s2: The slaver is now your prisoner
> s3: Possible intelligence
> s4: Possible intelligence
> s5: Possible intelligence
> s6: Possible intelligence about the mastermind
> s7: You can go yourself, or send any followers to interrogate him

<!-- settlement[0] -->
**Outcome — branch, condition `{"any": {"!s3": 1, "!s4": 1, "!s5": 1}}`:** *"I'll Talk! I'll Talk!"*
> The slave hunter crumbles instantly, tears streaming as words tumble out in desperate confession. He swears on his life he's withholding nothing. You're inclined to believe most of it.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s3": 1, "s4": 1, "s5": 1, "!s6": 1, "have.2000349": 1}`:** *"Abdul Forced My Hand!"*
> The slave hunter weeps in confession, claiming Abdul forced him into it, threatening his entire family if he refused... He reveals many details, but you doubt this could bring down Abdul.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s3": 1, "s4": 1, "s5": 1, "!s6": 1, "!have.2000349": 1}`:** *"Abdul Forced My Hand!"*
> The slave hunter weeps in confession, claiming the former Vizier Abdul's faction forced him into it, threatening his entire family if he refused... He reveals many details, but the old man is already dead, so what use is this information?

<!-- settlement[3] -->
**Outcome — branch, condition `{"s3": 1, "s4": 1, "s5": 1, "s6": 1, "counter.7000476<": 1}`:** *"What Else?"*
> His story aligns perfectly with what you already know - satisfactory, but insufficient. You lean closer: "Tell me something I don't know." 
> After visible internal struggle, he surrenders a location, the admission aging him visibly. Your agents return with valuable findings from the site. Quite satisfactory indeed.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"counter.7000476>=": 1}`:** *"I'll Tell You Everything!"*
> Your predatory gaze breaks his final resistance. Cowering, he practically shrieks a location before collapsing into pleas for mercy. 
> Your people return with significant discoveries. Given his exceptional cooperation, perhaps mercy isn't entirely unwarranted.


## Spread in the evening light... — rite `5006055` (于夕色中蔓延……)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006055_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Spread_in_the_Evening_Light

**Intro (EN):**
> One evening, you didn't see Maggie at home.

**Slot lines (EN):**
> s1: Adila returned victorious.
> s2: Maggie's eager waiting.
> s3: How much resentment might a wife feel?

<!-- settlement[0] -->
**Outcome — branch, condition `{"s3.不满>=": 2, "counter.7000182>=": 2}`:**
> You barely notice her absence at first, much like how we rarely think about our own shadows.
> After how upset she's been with you lately, especially about not supporting Adila's dragon hunt, you figure she's just sulking and will be back soon. The second day passes, then the third... but Maggie is nowhere to be found.
> Late one night, a knock comes at the door. You think it might be Maggie, but instead, you find a messenger holding a delicate box and a letter.
> "My husband, [player.name], I've left. You know, this isn't about loving Adila – she knows that too – but you've brought me nothing but tears and pain, and I can't take it anymore. Adila has given me the courage to begin anew. Please don't try to find me."
> Below the letter, there are a few hurried notes, perhaps from Adila:
> "I didn't kill the dragon – it escaped to another dimension – but I managed to gouge out its eye. Here's your proof, in this box. Consider it compensation for taking Maggie away. After all, you care more about such things than her, don't you?"
> "The dragon cursed Adila's bloodline to bear only daughters, thinking it would strip us of our dragon-slaying destiny. But it was wrong – I've proven that a woman can defeat a dragon. We can achieve anything we set our minds to, become whoever we want to be. That curse? It backfired – it drove every Adila to take up the sword, to break both the curse and our shackles!"
> "Perhaps that's why Maggie chose to leave you in the end. Poor soul, you'll never understand this feeling, will you?"
> You open the box and stare at the gem that was once a dragon's eye. Within the gem, flames flow like living fire, as if the fury of an entire world had been imprisoned in a palm-sized crystal. No mortal craft could have wrought this...
> You gaze at the gem for a long time. Perhaps you're dwelling on your loss, perhaps a thousand thoughts race through your mind. Or perhaps you're already calculating what fortune this otherworldly treasure might bring you...

<!-- settlement[1] -->
**Outcome — branch, condition `{"s3.不满>=": 2, "counter.7000182<": 2}`:**
> You barely notice her absence at first, much like how we rarely think about our own shadows.
> After how upset she's been with you lately, especially about not supporting Adila's dragon hunt, you figure she's just sulking and will be back soon. The second day passes, then the third... but Maggie is nowhere to be found.
> Late one night, there's a knock at the door. You open it to find Maggie standing there. She's holding an delicate box in her arms and a letter in her hand, saying it's from Adila, meant for you.
> "I didn't kill the dragon – it escaped to another dimension – but I managed to gouge out its eye. Here's the proof, in this box."
> "Maggie loves you more than she loves me – I've known this all along. So when she wouldn't take my gift, I decided to give this gem to you. At least this way, my greatest triumph will stand guard over my most cherished one, in place of me."
> "The dragon cursed Adila's bloodline to bear only daughters, thinking it would strip us of our dragon-slaying destiny. But it was wrong – I've proven that a woman can defeat a dragon. We can achieve anything we set our minds to, become whoever we want to be. That curse? It backfired – it drove every Adila to take up the sword, to break both the curse and our shackles!"
> "Thank you and Maggie for all your help during this time. But in the end, forgive me for no longer being able to serve you, you damned man who won Maggie's heart and yet refuses to treasure it!"
> As you read the letter, you glance at Maggie sitting quietly beside you, her face painted with bittersweet memories.
> "That day, Adila grabbed me out of nowhere, asking me if I would stay with her. She was drenched in blood – the dragon's and her own... The desperate look in her eyes – it reminded me of you years ago. I stayed with her for a while, but... I couldn't help coming back to you. Those few days, I kept thinking about everything between us. I even thought about walking away forever, convinced it would be better for us both...
> "But here I am again, you bastard... My goodness, I hate myself that I still need you!"
> You can't resist any longer. You pull her into your arms. Maggie keeps her head down, concealing her tears.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s3.不满<": 2, "counter.7000182>=": 2}`:**
> You barely notice her absence at first, much like how we rarely think about our own shadows. The second day passes, then the third... but Maggie is nowhere to be found.
>
> Late one night, there's a knock at the door. You open it to find Maggie standing there. 
>
> She's holding an delicate box in her arms and a letter in her hand, saying it's from Adila, meant for you.
>
> "I didn't kill the dragon – it escaped to another dimension – but I managed to gouge out its eye. Here's the proof, in this box."
>
> "The dragon cursed Adila's bloodline to bear only daughters, thinking it would strip us of our dragon-slaying destiny. But it was wrong – I've proven that a woman can defeat a dragon. We can achieve anything we set our minds to, become whoever we want to be. That curse? It backfired – it drove every Adila to take up the sword, to break both the curse and our shackles!"
>
> "Take this gemstone – it's my way of thanking you for everything. Though you... What you've given me means so much more."
>
> As you read the letter, you notice Maggie beside you, toying with the gemstone, a soft smile touching her lips.
>
> "That day, Adila grabbed me out of nowhere, asking me if I would stay with her. She was drenched in blood – the dragon's and her own... The desperate look in her eyes – it reminded me of you years ago. I stayed with her for a while...Well, here I am choosing you again.Those few days, I kept telling myself I could manage without you – that everything you do for me, I could do on my own..."
>
> "...But here I am, because deep down, I know you're the one who needs me now, aren't you?"
>
> You answer by drawing her into your arms, your kisses speaking what words cannot.

<!-- settlement[3] -->
**Outcome — branch, condition `{"s3.不满<": 2, "counter.7000182<": 2}`:**
> As expected, you find Maggie at the city gate, with Adila beside her... This female warrior is covered in blood – the dragon's and her own. Her bandaged hands clutch tightly at a massive sulfur-colored gem, holding it up before Maggie's eyes. Within the gem, flames flow like living fire, as if the fury of a world-burning inferno had been imprisoned in a palm-sized crystal ball.
>
> "I didn't kill the dragon – it escaped to another dimension – but I managed to gouge out its eye. The dragon cursed Adila's bloodline to bear only daughters, thinking it would strip us of our dragon-slaying destiny. But it was wrong!"
>
> "I've proven that a woman can defeat a dragon. We can achieve anything we set our minds to, become whoever we want to be. That curse? It backfired – it drove every Adila to take up the sword, to break both the curse and our shackles!"
>
> "Maggie, take it!" Adila declares proudly, her eyes blazing as she presents the gem to the woman before her. "This is my greatest achievement. Would you–"
>
> Maggie seems uncomfortable, averting her gaze only to meet your eyes. Adila notices you too. A flash of embarrassment crosses her face. She turns, hastily shoves the gem into your hands, and with bitten lip, flees the scene.
>
> Maggie comes to your side, gently gripping your arm, clearly shaken. "She actually made it back alive, and wounded such a beast! Heavens... She even asked me to leave with her! But that's impossible – I'm [player.name]'s wife! I love you more than life itself! And then she just... Oh, thank goodness you came. I wouldn't have known how to handle that situation."
>
> Even so, Maggie's eyes are drawn to the magical gem. She stares intently at its shimmering surface, murmuring, "So, she really did it... The dragon is banished to another dimension, and the curse is finally broken. Adila is truly remarkable, despite what just happened... she really is incredible!"
>
> "This gem belongs to her... We should find a way to return it to Adila, shouldn't we?" Maggie says softly.
>
> You pause for a moment before drawing Maggie into your arms, her face nestled against your chest. 
>
> And so, this is how the dragon-slaying tale ends.


## Infiltration and Forgery — rite `5000559` (潜入篡改)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000559_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#Infiltration_and_Forgery

**Intro (EN):**
> You attempt to infiltrate the palace and correct the logs for Consort Sadani.

**Slot lines (EN):**
> s1: You can infiltrate the records office and tamper with the logs yourself, or send a follower.
> s2: Anything to help with the stealth mission.

**Dice line (EN):**
> To avoid complications, you pick a dark and windy night to sneak into the palace...
> Your Stealth and Wisdom determine your full dice count.
> You need at least 3 Success.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:隐匿+智慧>=": [3, 5]}`:** *You successfully infiltrated the palace*
> You took advantage of the guard change to sneak into the Chamberlain's archive.
> He records the king's daily life in great detail, from conquests and sentencing to dining and drinking. The volumes are many, but fortunately the classification is clear. You spend some time to find the volume where the date mentioned by Consort Sadani is located, and slowly recall that during that period, the Sultan has just led his army to conquer a small country, returning triumphantly, holding feasts in the palace.
> The Chamberlain records all of the dishes in detail, even including the fact that the Sultan drank three more cups of foreign spiced wine. But, would such a careful archivist really remiss to mention the beauty who was by the Sultan's side that night?
> Imitating the Chamberlain's handwriting, you forge a record that the Sultan had visited Consort Sadani that night, doubt growing in your heart.

<!-- settlement[1] -->
**Outcome — failure, condition `{"r1:隐匿+智慧<": [3, 5], "!s1.追随者": 1}`:** *You failed*
> You are overconfident in your stealth and alerted the guards changing shifts. You hurt yourself while making your escape. Though your identity is not exposed, the guards at the record office would surely be more vigilant from now on. You have to find another way.

<!-- settlement[2] -->
**Outcome — failure, condition `{"r1:隐匿+智慧<": [3, 5], "s1.追随者": 1}`:** *You failed*
> You overestimated [s1.name]'s skills in infiltration. [s1.name] alerted the guards changing shifts and failed to escape, and is now imprisoned. After such an incident, the guards at the record office would surely be more vigilant. You have to find another way.


## Become Human — rite `5008085` (做人)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008085_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Orphans#Become_Human

**Intro (EN):**
> Alim proposed a bold idea: to establish a school that would shelter the beggars from Dark Alley. Think about it – he is already skilled at caring for his puppies, but they need a gentleman to teach them proper manners rather than the tricks of thievery. So, if you're willing to help, Alim could fund half of the project – which means quite a fortune for him!

**Slot lines (EN):**
> s1: Alim
> s2: Half each, 10 Gold Coins
> s3: If you're willing to pay 20 Gold Coins, you can take the opportunity to break an Extravagance Card no higher than the Bronze tier
> s4: Children

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"!s4": 1}`:** *You don't trust Alim*
> Perhaps there are other solutions? Anyway, you politely declined Alim's suggestion for now.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s4": 1, "!s3": 1}`:** *This school's future exceeds Alim's imagination*
> Alim noticed you had built this shelter much larger than these beggars actually needed. You told him that this place would not only house one group of beggars but become a base for educating all homeless children: We are nurturing the future.
>
> Although Alim did not fully grasp what you said, he smiled, knowing it's always right to follow you.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s4": 1, "s3": 1}`:** *This school's future exceeds Alim's imagination*
> Alim noticed you had built this shelter much larger than these beggars actually needed. You told him that this place would not only house one group of beggars but become a base for educating all homeless children: We are nurturing the future.
>
> Although Alim did not fully grasp what you said, he smiled, knowing it's always right to follow you.


## Alim's Feast — rite `5008077` (阿里木的大餐)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008077_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Alim#Alim_s_Feast

**Intro (EN):**
> A kid from the Dark Alley has a fresh start – and you all feel like you've done something truly significant, worth celebrating with a Dark Alley special dough-drop stew.

**Slot lines (EN):**
> s1: Alim
> s2: You can invite any friend
> s3: You can invite any friend
> s4: Yourself
> s5: Dough Soup

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1": 1, "s4": 1, "any": {"s2.妻子": 1, "s3.妻子": 1}}`:** *Savor the Present*
> Surprisingly, Maggie isn't repelled by dirty Alim at all. Instead, she happily listens to Hemir's story – the embellished version by Alim, of course – even having a servant cut some of her favorite pickles to add to the stew. This dish's charm is mixing everyone's goodies into one pot. 
> She praises your courage and mercy, saying you've done a great deed for Hemir... Suddenly, you realize: in reality, neither you nor Alim, especially you, have done anything meaningful regarding Hemir... It's ridiculous; what exactly are we celebrating? 
> Holding Maggie in your arms, her body warmed by the steaming dough-drop soup, you decide not to think about more complex things but quietly enjoy this moment of warmth.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1": 1, "s4": 1}`:** *Destiny Like the Dough Soup*
> The secret recipe of the Dark Alley is simple: throw in whatever you find – stolen loot, street scraps, or robbed things. To prevent Alim from tossing in real junk, you bring a large piece of lamb, much to Alim's evident delight. He giggles as he serves everyone a bowl, regardless of whether they're lords or slaves – the newly ground flour smells surprisingly fragrant, and Alim has added numerous mysterious ingredients. With each bite, you never know what's coming, and it's best not to wonder what's in there.


## Perjury of Love — rite `5000550` (爱的伪证)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000550_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#Perjury_of_Love

**Intro (EN):**
> You must hunt down the ferocious beasts causing chaos outside the city to prove your bravery and worth to Consort Sadani.

**Slot lines (EN):**
> s1: You must take the beast's head as trophy to prove your bravery.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *You present the Beast's Head*
> The smell of blood made Sadani nauseous, but perhaps she dared not lose her composure in the court. She just covered her pale lips with an embroidered handkerchief and tried her best to endure.
>
> Your test has been completed, but hers has not – and for what cause?
>
> She couldn't help but think of the time when she and the Sultan first met, it was in the royal hunting ground. He was so strong and powerful. The cold scimitar swung down ruthlessly, and the blood of the beasts she trapped instantly gushed out from the wounds and splashed on her fair cheeks.
>
> God... At that moment, her mind was completely occupied by the panic of death, and there was only one thought left, to marry him and become the bride of this warrior...
>
> Sadani stroked the cold fur of the wolf king in a trance, and her fingertips could not feel a trace of temperature. The Sultan had exhausted his remaining patience for this long silence. He spoke reluctantly and told the consort who looked confused: "Do you know what to do, Sadani?"
>
> What was the Sultan reminding her? No... not, her Sultan... her husband clearly still remember those past events, their sweet and romantic times! He... he must still love her, yes, he did this only because of his position as ruler, because of... because of that damn card!
>
> Sadani suddenly looked at you, her eyes full of resentment, as if all the contempt, insult, misfortune and failure she suffered were blamed on you.
>
> She will take revenge on you, as long as she catches you; she will use all the means she can think until you drown in an unreturnable abyss, until you pay the price for her lost love!


## Bribing the Chamberlain — rite `5000560` (贿赂主管)
**Confidence:** High — official `i18n/en` string for every field; 2 of them also appear verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000560_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#Bribing_the_Chamberlain, https://sultansgame.wiki.gg/wiki/Sadani#Infiltration_and_Forgery

**Intro (EN):**
> Consort Sadani wants you to correct the royal ledger that records the Sultan's daily movements. You plan to find the Chamberlain Lazag, in hope he agrees to do you this small favor...

**Slot lines (EN):**
> s1: He is the keeper of the daily logs.
> s2: To impress him, you need at least 15 Gold Coins.

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:** *You bribed Lazag*
> Hearing that you question the correctness of his record, Lazag almost jumps up to scold you. You quickly placate him and seamlessly stuff the purse full of Gold Coins into his hands. He is a little relieved. "All that mess in the harem... I know, I understand. But you can't go around claiming my records are incomplete or wrong! I can't be!" He mutters angrily while taking you into the house of knowledge that he is so proud of. He navigates the vast archive with ease and pulls out the right record based on date. "This one, right?"
> You look at the document that details the Sultan's daily routine. These words trigger some memories -during that time, the Sultan has just led his army to conquer a small country, returning triumphantly, holding feasts in the palace. The Chamberlain records all of the dishes in detail, even including the fact that the Sultan drank three more cups of foreign spiced wine - would such a careful archivist really remiss to mention the beauty who was by the Sultan's side that night?
> You frown slightly, unable to suppress a little suspicion in your heart. But seeing the Chamberlain casually adding notes to the end of the scroll as you dictated, you sense that everything here is malleable and not so credible after all.


## Your Game — rite `5000798` (你的游戏)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000798_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Your_Game

**Intro (EN):**
> This is your game; you control the guest list, indulge in pleasures, savor every moment – provided the Sultan isn't present.

**Slot lines (EN):**
> s1: You once promised the great Sultan you would invite him to attend
> s2: The Invited Lady of Delights
> s3: You can invite one male noble follower
> s4: You can invite one male commoner follower
> s5: You can invite one female noble follower
> s6: You may invite a female commoner follower
> s7: You can invite any follower
> s8: As the host of the banquet, you must be present in person
> s9: You can take the opportunity to break any Sultan Card
> s10: Some convenient consumables, if you wish to break an Extravagance Card, you must insert 30 Gold Coins

**Dice line (EN):**
> You present a Conquest Card, and so every man, every woman, all turn their eyes on you...
> The number of dice provided by your Physique is influenced by everyone.
> You need at least 3 Successes to win

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1": 1}`:** *You humbly greet the Sultan's palanquin*
> Slippers embroidered with gold thread step on your shoulder as the Sultan descended down from the carriage, entering the garden of earthly delights you prepared. He inspects the arrangements and the guests you've gathered with great interest, a slight smile on his lips. Now, he is the master here, and everyone revolves around his pleasure.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s1": 1, "s2": 1}`:** *Everyone is the Sultan's prostitute*
> [s2.name] kneels naked at his feet, her beautiful and smooth back supporting the golden tray and wine on the table, trembling slightly, but not daring to spill a drop of the wine

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s1": 1, "s3": 1}`:**
> [s3.name] lies on the carpet before the Sultan, holding a scroll with both hands, struggling to restrain herself, frowning and reading out the nonsense written on it, yet unable to suppress the rolling breath in her throat

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s1": 1, "s4": 1}`:**
> Under the veil, [s4.name] is bound on the rack, elegant whip marks on his chest. Slave girls teased his body with feathers, while he keeps his brow tight, shouts eyes enduring, as the master did not allow him to release

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s1": 1, "s5": 1}`:**
> [s5.name] kneels by the banquet table, the only neatly dressed lady, yet beneath the loose robe, you can see her desperately enduring something, maybe pain, maybe desire

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s1": 1, "s6": 1, "!s7.is": 2000461, "s7": 1}`:**
> Of course, there are [s6.name] and [s7.name]... Ordered by the Sultan to perform before him, anyway, all needed toys are present; they can take it slow. Gradually, their expressions take on a frenzied and intoxicated flush, as if such compulsion instead released a restrained nature...

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"s1": 1, "s6": 1, "s7.is": 2000461}`:**
> Of course, there's also [s6.name]... At the Sultan's command, her silk garments fall like water, leaving traces of passion on the gold-threaded carpet. He lifts Lady Becky onto his lap, idly running his fingers through her silky white fur. The cat – noble and elegant, yet blissfully naive – purrs contentedly. Perhaps only such a creature could approach that shadowed heart. He rolls playfully on her back, batting at the swaying gold chain above...

<!-- settlement_extre[7] -->
**Outcome — branch, condition `{"s1": 1}`:**
> You kneel before the Sultan. The musty scent from the floor fills your senses while a heavy air of desire hangs above, making you afraid to raise your eyes.

<!-- settlement_extre[8] -->
**Outcome — branch, condition `{"s1": 1, "s9.征服": 1}`:** *You present a Conquest Card*
> The Sultan laughs heartily at your courage and madness, rewarding you by making your corpse the party's favorite toy – your head gloriously placed on the throne, witnessing the full spectacle.

<!-- settlement_extre[9] -->
**Outcome — branch, condition `{"s1": 1, "s9.纵欲": 1}`:** *You present a Carnality Card*
> How naturally you flow into this feast of desire. As silks slip from your body, you lose yourself in the women's soft caresses, the wine-sweet taste of their lips, the raw passion in men's touch. Your mind drowns in pure pleasure, your soul dissolving into a sticky puddle, drying and wetting, over and over agian.

<!-- settlement_extre[10] -->
**Outcome — branch, condition `{"s1": 1, "s9.奢靡": 1, "s10.金币=": 30}`:** *You added a touch of flair to the Sultan's Game*
> Fine liquor, exquisite dishes, and a collection of rare and curious trinkets – you present them to the Sultan, calling them a token of your humble regard. The Sultan is pleased with you. From the array of dazzling trinkets, he selects the most intriguing one and rewards you with it – slicing your skin with his golden blade and piercing it through your flesh.

<!-- settlement_extre[11] -->
**Outcome — branch, condition `{"s1": 1, "s9.杀戮": 1}`:** *You suggest adding a touch of flair to the Sultan's Game*
> What does the Sultan love most if not blood? He laughs, pointing casually at someone. And you, you give him a performance like no other.
>
> You embrace the chosen one with seeming tenderness – soft caresses and gentle kisses belied by your strong arms. With a thin, razor-sharp blade, you carve intricate patterns across bare flesh. Every shudder, every gasping breath, every desperate struggle, and every plea becomes part of this canvas of despair. You are the cold executioner, alone in your deadly dance.
>
> As blood drips steadily, you finally release the fading soul, presenting the blade to the Sultan. With a hearty laugh, he drives it into the victim's lower body, destroying what little life remains. Then he orders the skin flayed whole – this masterpiece, he declares, must be preserved forever.

<!-- settlement_extre[12] -->
**Outcome — branch, condition `{"s1": 1}`:**
> Time stands frozen, as if the sun and moon have abandoned their eternal course, waiting for the master of the world to grow bored. With a yawn, the Sultan carelessly kicks aside the perfumed beauty curled against him. He strides across the scattered chaos of the floor, leaving with languid grace.
> Only then does the wind stir in this chamber thick with desire. Only then do you slowly recall your own name, at last aware that you're still breathing.

<!-- settlement_extre[13] -->
**Outcome — branch, condition `{"!s1": 1}`:** *You deliberately choose a different day*
> Very well, the Sultan is not here. Now, you can be the master of this feast! Your friends once gather beneath your roof, each with their own reasons. But now, behind these layers of shimmering bead curtains, they gather for only one reason: desire.

<!-- settlement_extre[14] -->
**Outcome — branch, condition `{"!s1": 1, "s7": 1, "!s7.妻子": 1}`:** *You saved a spot especially for [s7.name]*
> [s7.gender] came as promised and stepped into this room of utmost pleasure with you.

<!-- settlement_extre[15] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000080, "!s2.妓女": 1}`:**
> Junah approaches, helping you remove your outer garments while delicate silk slides from her shoulders.
> "You have no idea how I've missed you," she whispers in your ear, her flattery reminding you of when you first met at the House of Delights. She seems to hint that you can treat her the same way as before. As if only that could befit such a feast of ultimate desire.
> However, when your fingers touch her smooth neck, her lowered eyelashes gently tremble. You know she is truly different now – she has something she can't lose.
> You smile and give her a breathtaking kiss, leading her into the depths of the room.

<!-- settlement_extre[16] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000080, "s2.妓女": 1}`:**
> When Junah sees you, she seems a little bit nervous. It's as if she has never worn such luxurious silk before; she also dreads finding even the slightest trace of disappointment in your expression. She clutches the silk tightly around her body and kneels before you, pleading for you to pull the leather cord hanging on the wall – without someone holding the cord, she is not allowed to move, and, of course, She must never touch the cord herself.

<!-- settlement_extre[17] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000080, "s2.妓女": 1, "!s5.妻子": 1, "!s7.妻子": 1}`:**
> With the cord in your hand, you guide her forward as she crawls on all fours, joyfully following you – finally, she has a master in this feast.

<!-- settlement_extre[18] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000080, "s2.妓女": 1, "any": {"s5.妻子": 1, "s7.妻子": 1}}`:**
> You smile slightly, not taking the leather cord, and instead, give her a breathtaking kiss. Her body trembles slightly, partly from joy, partly from fear.

<!-- settlement_extre[19] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000081, "!s2.妓女": 1}`:**
> You hear Jalila laughing in the distance. You see her removing a string of jewels and tossing it your way – it happens to land right on your foot. As you stoop to pick it up, a bare foot gently presses against the back of your hand. Lady Jalila tilts your chin up with the handle of her whip, smiling. "Look at this handsome face... I permit you to have it." Her laughter echoes and fades as she walks away – you wonder if she's laughing at you, or at her past self.

<!-- settlement_extre[20] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000081, "s2.妓女": 1}`:**
> Jalila sits proudly in the most conspicuous spot in the room, a whip in her hand, sharply critiquing the men and women gathered around her. Who is worthy of her performance? Who deserves this reward of pain and sweetness intertwined? Until she sees you. Her whip flicks lightly, its tip slithering across your chest like a venomous snake. The wound blooms like a petal as she steps toward you, pressing the handle of her whip against your chin. "Kneel," she says. "Kneel. I grant you permission to submit."

<!-- settlement_extre[21] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000081, "s2.妓女": 1, "!s5.妻子": 1, "!s7.妻子": 1}`:**
> You submit to her willingly, letting her pull open your collar. The sharp crack of the whip and the wetness of a tongue, the sting of harsh slaps, and the softness of tender caresses alternately torment your body. In a moment when the lash and the pleasure blur your senses, a vision boils over in your mind: the true master you've endured for so long might be nothing more than a whore, just like this woman before you.

<!-- settlement_extre[22] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000081, "s2.妓女": 1, "any": {"s5.妻子": 1, "s7.妻子": 1}}`:**
> And you just smile, opening your palm to her, revealing a crystal orb lying in your hand.
>
> Jalila lets out a soft scoff. "Do you think I'm a little girl, [player.name]?" She takes the orb, examining its hazy patterns with disdain as if appraising some inferior gemstone. You gesture for her to put it in her mouth.
>
> Assuming it is just some trinket, she shoots you a skeptical look before popping it into her mouth. But it is sweet. It is candy. For a second, Jalila's expression goes blank, then quickly resumes her haughty demeanor. "Don't treat me like a little girl!"
>
> She whirls away, whip in hand, searching for her next target among the crowd.

<!-- settlement_extre[23] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000082, "!s2.妓女": 1}`:**
> Wisps of elegant incense dance around Shama, creating an illusion that this place has somehow escaped the encroaching debauchery. As you approach, your fingers find a stray lock of her hair. Shama smiles as she shows you her newly acquired poetry collection. As she reads these love poems, you savor how her scholarly recitation melts into wanton sighs.

<!-- settlement_extre[24] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000082, "s2.妓女": 1}`:**
> Shama's figure emerges faintly through the dim, almost suggestive haze of incense and candlelight. You notice her masculine part beneath the gossamer, adorned and bound with jewels and gold. Oddly enough, it does make you feel a bit more at ease.

<!-- settlement_extre[25] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000082, "s2.妓女": 1, "!s5.妻子": 1, "!s7.妻子": 1}`:**
> She beckons to you, and you walk toward her. She takes your hand, pulling you close to her side. Then she cups your face, gazing into your eyes for a moment before giving you a gentle kiss.
>
> It almost gives you a sense of love, so pure, and precious. For a moment, in her eyes, you glimpse someone else's. But Shama is always gentle, always safe – you can immerse yourself in this love's embrace, free from all concerns.

<!-- settlement_extre[26] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000082, "s2.妓女": 1, "any": {"s5.妻子": 1, "s7.妻子": 1}}`:**
> She beckons to you, and you walk toward her. She takes your hand, pulling you close to her side. Then she cups your face, gazing into your eyes for a moment before giving you a gentle kiss.
>
> It almost gives you a sense of love, so pure and precious. For a moment, in her eyes, you glimpse someone else's. So you tear yourself from this love's embrace, seeking the one whose eyes occasionally turn cold as winter frost.

<!-- settlement_extre[27] -->
**Outcome — branch, condition `{"!s1": 1, "s3.抱猫人": 1}`:**
> [s3.name] arrives with Lady Becky in his arms. One thing is certain – Lady Becky is having a great time here. Paying no heed to anyone's reactions, he kicks over unpleasant incense burners, tastes the warm pool water, scratches anyone who dares approach, and shreds the comfortable plush rugs into tassels.
>
> There are always couples in throes of passion finding themselves at the mercy of his mischief – his tail sweeping across their sensitive soles, his claws catching their sheer silks and glittering jewels... Consider yourself lucky! At least your face has been spared from his claws.
>
> As for [s3.name], you arrange for him to be a cat climbing frame all day. Naturally, he becomes quite the entertainment for passing admirers.

<!-- settlement_extre[28] -->
**Outcome — branch, condition `{"!s1": 1, "any": {"s3.is": 2000064, "s7.is": 2000064}}`:**
> Nabhani thrives in situations like this. He works the room with a drink in hand, his charm and wit leaving a trail of giggles in his wake. He doesn't mind when the ladies can't resist touching his well-built frame. Only now do you realize he's a bit ticklish.

<!-- settlement_extre[29] -->
**Outcome — branch, condition `{"!s1": 1, "any": {"s3.is": 2000063, "s7.is": 2000063}}`:**
> Surrounded by lively young women, Zaki's face flushes red. These enchanting ladies, all a few years his senior, delight in watching his bashful reactions, their clear laughter filling the air. Zaki protests indignantly, attempting to prove himself with a few words, before leading them into the layered silk drapes.

*(+43 further outcome branches, all present in official English — regenerate uncapped with `rite_record.py 5000798`.)*


## Your Game — rite `5000800` (你的游戏)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000800_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Your_Game

**Intro (EN):**
> This is your game; you control the guest list, indulge in pleasures, savor every moment – provided the Sultan isn't present.

**Slot lines (EN):**
> s1: You once promised the great Sultan you would invite him to attend
> s2: The Invited Lady of Delights
> s3: You can invite one male noble follower
> s4: You can invite one male commoner follower
> s5: You can invite one female noble follower
> s6: Buthayna
> s7: You can invite any follower
> s8: As the host of the banquet, you must be present in person
> s9: You can take the opportunity to break any Sultan Card
> s10: Some convenient consumables, if you wish to break an Extravagance Card, you must insert 30 Gold Coins

**Dice line (EN):**
> You present a Conquest Card, and so every man, every woman, all turn their eyes on you...
> The number of dice provided by your Physique is influenced by everyone.
> You need at least 3 Successes to deal with everyone except the Sultan.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1": 1}`:** *You humbly greet the Sultan's palanquin*
> Slippers embroidered with gold thread step on your shoulder as the Sultan descended down from the carriage, entering the garden of earthly delights you prepared. He inspects the arrangements and the guests you've gathered with great interest, a slight smile on his lips. Now, he is the master here, and everyone revolves around his pleasure.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s1": 1, "s2": 1}`:** *Everyone is the Sultan's prostitute*
> [s2.name] kneels naked at his feet, her beautiful and smooth back supporting the golden tray and wine on the table, trembling slightly, but not daring to spill a drop of the wine

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s1": 1, "s3": 1}`:**
> [s3.name] lies on the carpet before the Sultan, holding a scroll with both hands, struggling to restrain herself, frowning and reading out the nonsense written on it, yet unable to suppress the rolling breath in her throat

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s1": 1, "s4": 1}`:**
> Under the veil, [s4.name] is bound on the rack, elegant whip marks on his chest. Slave girls teased his body with feathers, while he keeps his brow tight, shouts eyes enduring, as the master did not allow him to release

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s1": 1, "s5": 1}`:**
> [s5.name] kneels by the banquet table, the only neatly dressed lady, yet beneath the loose robe, you can see her desperately enduring something, maybe pain, maybe desire

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s1": 1, "s6": 1}`:** *This was where the former king once "fought"*
> This peculiarity sparks some interest in the Sultan, but not much. His sullen gaze weighs on Buthayna, making her obediently kneel, not daring to lift her head. 
>
> How uninteresting! He was long past the need to prove his authority with his father's possessions, and even the throne had become unpleasant after sitting too long. Let alone an outdated woman! However... he smiles again. The Sultan leans forward and nods at you, "I like this gift, my loyal subject," he says, "So, I have decided to bestow this opportunity upon you."

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"s1": 1, "s6": 1}`:** *And you have no choice but to comply*
> Despite being well-maintained, time still left traces of looseness on Buthayna. Yet, the illusion of power is an excellent aphrodisiac. While riding her, you seems possessed by a dark ghost, the air filled with a murky and stale scent of blood, brushing you with broken sentences like a curse. You can't make out what it is saying, but you can feel the fear and sadness of approaching the end. However, when your senses return, all you see is the Sultan's sullen face.

<!-- settlement_extre[7] -->
**Outcome — branch, condition `{"s1": 1}`:**
> You kneel before the Sultan. The musty scent from the floor fills your senses while a heavy air of desire hangs above, making you afraid to raise your eyes.

<!-- settlement_extre[8] -->
**Outcome — branch, condition `{"s1": 1, "s9.征服": 1}`:** *You present a Conquest Card*
> The Sultan laughs heartily at your madness. Even if you were truly deluded by what just happened, have you forgotten the fate of the former king?
>
> Very well, as a reward, your corpse becomes the most popular toy at the gathering – your head is gloriously placed on the throne to witness it all.

<!-- settlement_extre[9] -->
**Outcome — branch, condition `{"s1": 1, "s9.纵欲": 1}`:** *You present a Carnality Card*
> How naturally you break this card. But the feast of desire isn't over. As silks slip from your body, you lose yourself in the women's soft caresses, the wine-sweet taste of their lips, the raw passion in men's touch. Your mind drowns in pure pleasure, your soul dissolving into a sticky puddle, drying and wetting, over and over agian.

<!-- settlement_extre[10] -->
**Outcome — branch, condition `{"s1": 1, "s9.奢靡": 1, "s10.金币=": 30}`:** *You added a touch of flair to the Sultan's Game*
> Fine liquor, exquisite dishes, and a collection of rare and curious trinkets – you present them to the Sultan, calling them a token of your humble regard. The Sultan is pleased with you. From the array of dazzling trinkets, he selects the most intriguing one and rewards you with it – slicing your skin with his golden blade and piercing it through your flesh.

<!-- settlement_extre[11] -->
**Outcome — branch, condition `{"s1": 1, "s9.杀戮": 1}`:** *You suggest adding a touch of flair to the Sultan's Game*
> What does the Sultan love most if not blood? He laughs, pointing casually at someone. And you, you give him a performance like no other.
> You embrace the chosen one with seeming tenderness – soft caresses and gentle kisses belied by your strong arms. With a thin, razor-sharp blade, you carve intricate patterns across bare flesh. Every shudder, every gasping breath, every desperate struggle, and every plea becomes part of this canvas of despair. You are the cold executioner, alone in your deadly dance.
> As blood drips steadily, you finally release the fading soul, presenting the blade to the Sultan. With a hearty laugh, he drives it into the victim's lower body, destroying what little life remains. Then he orders the skin flayed whole – this masterpiece, he declares, must be preserved forever.

<!-- settlement_extre[12] -->
**Outcome — branch, condition `{"s1": 1}`:**
> Time stands frozen, as if the sun and moon have abandoned their eternal course, waiting for the master of the world to grow bored. With a yawn, the Sultan carelessly kicks aside the perfumed beauty curled against him. He strides across the scattered chaos of the floor, leaving with languid grace.
> Only then does the wind stir in this chamber thick with desire. Only then do you slowly recall your own name, at last aware that you're still breathing.

<!-- settlement_extre[13] -->
**Outcome — branch, condition `{"!s1": 1}`:** *You deliberately choose a different day*
> Very well, the Sultan is not here. Now, you can be the master of this feast! Your friends once gather beneath your roof, each with their own reasons. But now, behind these layers of shimmering bead curtains, they gather for only one reason: desire.

<!-- settlement_extre[14] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000080, "!s2.妓女": 1}`:**
> Junah approaches, helping you remove your outer garments while delicate silk slides from her shoulders.
> "You have no idea how I've missed you," she whispers in your ear, her flattery reminding you of when you first met at the House of Delights. She seems to hint that you can treat her the same way as before. As if only that could befit such a feast of ultimate desire.
> However, when your fingers touch her smooth neck, her lowered eyelashes gently tremble. You know she is truly different now – she has something she can't lose.
> You smile and give her a breathtaking kiss, leading her into the depths of the room.

<!-- settlement_extre[15] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000080, "s2.妓女": 1}`:**
> When Junah sees you, she seems a little bit nervous. It's as if she has never worn such luxurious silk before; she also dreads finding even the slightest trace of disappointment in your expression. She clutches the silk tightly around her body and kneels before you, pleading for you to pull the leather cord hanging on the wall – without someone holding the cord, she is not allowed to move, and, of course, She must never touch the cord herself.

<!-- settlement_extre[16] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000080, "s2.妓女": 1, "!s5.妻子": 1, "!s7.妻子": 1}`:**
> With the cord in your hand, you guide her forward as she crawls on all fours, joyfully following you – finally, she has a master in this feast.

<!-- settlement_extre[17] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000080, "s2.妓女": 1, "any": {"s5.妻子": 1, "s7.妻子": 1}}`:**
> You smile slightly, not taking the leather cord, and instead, give her a breathtaking kiss. Her body trembles slightly, partly from joy, partly from fear.

<!-- settlement_extre[18] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000081, "!s2.妓女": 1}`:**
> You hear Jalila laughing in the distance. You see her removing a string of jewels and tossing it your way – it happens to land right on your foot. As you stoop to pick it up, a bare foot gently presses against the back of your hand. Lady Jalila tilts your chin up with the handle of her whip, smiling. "Look at this handsome face... I permit you to have it." Her laughter echoes and fades as she walks away – you wonder if she's laughing at you, or at her past self.

<!-- settlement_extre[19] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000081, "s2.妓女": 1}`:**
> Jalila sits proudly in the most conspicuous spot in the room, a whip in her hand, sharply critiquing the men and women gathered around her. Who is worthy of her performance? Who deserves this reward of pain and sweetness intertwined? Until she sees you. Her whip flicks lightly, its tip slithering across your chest like a venomous snake. The wound blooms like a petal as she steps toward you, pressing the handle of her whip against your chin. "Kneel," she says. "Kneel. I grant you permission to submit."

<!-- settlement_extre[20] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000081, "s2.妓女": 1, "!s5.妻子": 1, "!s7.妻子": 1}`:**
> You submit to her willingly, letting her pull open your collar. The sharp crack of the whip and the wetness of a tongue, the sting of harsh slaps, and the softness of tender caresses alternately torment your body. In a moment when the lash and the pleasure blur your senses, a vision boils over in your mind: the true master you've endured for so long might be nothing more than a whore, just like this woman before you.

<!-- settlement_extre[21] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000081, "s2.妓女": 1, "any": {"s5.妻子": 1, "s7.妻子": 1}}`:**
> And you just smile, opening your palm to her, revealing a crystal orb lying in your hand.
>
> Jalila lets out a soft scoff. "Do you think I'm a little girl, [player.name]?" She takes the orb, examining its hazy patterns with disdain as if appraising some inferior gemstone. You gesture for her to put it in her mouth.
>
> Assuming it is just some trinket, she shoots you a skeptical look before popping it into her mouth. But it is sweet. It is candy. For a second, Jalila's expression goes blank, then quickly resumes her haughty demeanor. "Don't treat me like a little girl!"
>
> She whirls away, whip in hand, searching for her next target among the crowd.

<!-- settlement_extre[22] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000082, "!s2.妓女": 1}`:**
> Wisps of elegant incense dance around Shama, creating an illusion that this place has somehow escaped the encroaching debauchery. As you approach, your fingers find a stray lock of her hair. Shama smiles as she shows you her newly acquired poetry collection. As she reads these love poems, you savor how her scholarly recitation melts into wanton sighs.

<!-- settlement_extre[23] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000082, "s2.妓女": 1}`:**
> Shama's figure emerges faintly through the dim, almost suggestive haze of incense and candlelight. You notice her masculine part beneath the gossamer, adorned and bound with jewels and gold. Oddly enough, it does make you feel a bit more at ease.

<!-- settlement_extre[24] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000082, "s2.妓女": 1, "!s5.妻子": 1, "!s7.妻子": 1}`:**
> She beckons to you, and you walk toward her. She takes your hand, pulling you close to her side. Then she cups your face, gazing into your eyes for a moment before giving you a gentle kiss.
>
> It almost gives you a sense of love, so pure, and precious. For a moment, in her eyes, you glimpse someone else's. But Shama is always gentle, always safe – you can immerse yourself in this love's embrace, free from all concerns.

<!-- settlement_extre[25] -->
**Outcome — branch, condition `{"!s1": 1, "s2.is": 2000082, "s2.妓女": 1, "any": {"s5.妻子": 1, "s7.妻子": 1}}`:**
> She beckons to you, and you walk toward her. She takes your hand, pulling you close to her side. Then she cups your face, gazing into your eyes for a moment before giving you a gentle kiss.
>
> It almost gives you a sense of love, so pure and precious. For a moment, in her eyes, you glimpse someone else's. So you tear yourself from this love's embrace, seeking the one whose eyes occasionally turn cold as winter frost.

<!-- settlement_extre[26] -->
**Outcome — branch, condition `{"!s1": 1, "s3.抱猫人": 1}`:**
> [s3.name] arrives with Lady Becky in his arms. One thing is certain – Lady Becky is having a great time here. Paying no heed to anyone's reactions, he kicks over unpleasant incense burners, tastes the warm pool water, scratches anyone who dares approach, and shreds the comfortable plush rugs into tassels.
>
> There are always couples in throes of passion finding themselves at the mercy of his mischief – his tail sweeping across their sensitive soles, his claws catching their sheer silks and glittering jewels... Consider yourself lucky! At least your face has been spared from his claws.
>
> As for [s3.name], you arrange for him to be a cat climbing frame all day. Naturally, he becomes quite the entertainment for passing admirers.

<!-- settlement_extre[27] -->
**Outcome — branch, condition `{"!s1": 1, "any": {"s3.is": 2000064, "s7.is": 2000064}}`:**
> Nabhani thrives in situations like this. He works the room with a drink in hand, his charm and wit leaving a trail of giggles in his wake. He doesn't mind when the ladies can't resist touching his well-built frame. Only now do you realize he's a bit ticklish.

<!-- settlement_extre[28] -->
**Outcome — branch, condition `{"!s1": 1, "any": {"s3.is": 2000063, "s7.is": 2000063}}`:**
> Surrounded by lively young women, Zaki's face flushes red. These enchanting ladies, all a few years his senior, delight in watching his bashful reactions, their clear laughter filling the air. Zaki protests indignantly, attempting to prove himself with a few words, before leading them into the layered silk drapes.

<!-- settlement_extre[29] -->
**Outcome — branch, condition `{"!s1": 1, "s3.法拉杰": 1, "!s3.激情": 1}`:** *May I kiss you*
> You have no idea where Faraj appeared from – perhaps from the moment you walked in, his eyes had already found you, as if guided by some innate instinct that you could never possess.
>
> He watches you, something subtle flickering in his eyes. After asking his question, he doesn't wait for your answer, suddenly stepping closer. Your lips brush against something soft, but before you can even react, he touches his own lips, his face flushing red, and quickly runs away.
>
> ...Why is he running? In a place like this, even bolder actions wouldn't raise an eyebrow. Wait. You pause for a moment, hesitating briefly, but before you can dwell on it further, you are carried forward by the laughing, pressing crowd.

*(+43 further outcome branches, all present in official English — regenerate uncapped with `rite_record.py 5000800`.)*


## Headless Dragons — rite `5001004` (群龙无首)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001004_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/The_Court#Headless_Dragons

**Intro (EN):**
> The Sultan is like the sun, projecting vast, distorted shadows named power when away from the court.

**Slot lines (EN):**
> s1: Conviction
> s2: Insert 3 Intelligences of the same name and tier to synthesize
> s3: Insert 3 Conviction of the same name to synthesize
> s4: The True Taboo
> s5: Other Matters Best Left Untold

<!-- settlement[0] -->
**Outcome — branch, condition `{"any": {"rite": 5000795}}`:**
> The Sultan is still not seen today.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1.休息>=": 3}`:**
> The Sultan has returned to his loyal court.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s1.休息<": 3}`:**
> The Sultan is still not seen today.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s2.is": 2000032}`:** *Reading Between the Lines*
> One secret pulls out another secret, and in the exploration process, you're not sure if you're closer to or further from the truth.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s2.is": 2000038}`:** *Reading Between the Lines*
> One secret pulls out another secret, and in the exploration process, you're not sure if you're closer to or further from the truth.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s2.is": 2000044}`:** *Reading Between the Lines*
> One secret pulls out another secret, and in the exploration process, you're not sure if you're closer to or further from the truth.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s2.is": 2000033}`:** *Art of Relevance*
> The inner philosophy of things is mostly universal; you've peered through to deeper mysteries.

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s2.is": 2000039}`:** *Art of Relevance*
> The inner philosophy of things is mostly universal; you've peered through to deeper mysteries.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s2.is": 2000045}`:** *Art of Relevance*
> The inner philosophy of things is mostly universal; you've peered through to deeper mysteries.

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"s2.is": 2000034}`:** *Prepare yourself.*
> No one can win always, but you now have confidence in catching more leaves when the wind blows.

<!-- settlement_extre[7] -->
**Outcome — branch, condition `{"s2.is": 2000040}`:** *Prepare yourself.*
> No one can win always, but you now have confidence in catching more leaves when the wind blows.

<!-- settlement_extre[8] -->
**Outcome — branch, condition `{"s2.is": 2000046}`:** *Prepare yourself.*
> No one can win always, but you now have confidence in catching more leaves when the wind blows.

<!-- settlement_extre[9] -->
**Outcome — branch, condition `{"s2.is": 2000035}`:** *I see.*
> Suddenly, you realize what's behind those secretive glances and smiles.

<!-- settlement_extre[10] -->
**Outcome — branch, condition `{"s2.is": 2000041}`:** *I see.*
> Suddenly, you realize what's behind those secretive glances and smiles.

<!-- settlement_extre[11] -->
**Outcome — branch, condition `{"s2.is": 2000047}`:** *I see.*
> Suddenly, you realize what's behind those secretive glances and smiles.

<!-- settlement_extre[12] -->
**Outcome — branch, condition `{"s2.is": 2000036}`:** *Pieces of the Puzzle*
> The murmured exchanges among colleagues dissolve into holy silence, and flashes of the future flicker before your eyes, but upon deep thought, they remain a blur.

<!-- settlement_extre[13] -->
**Outcome — branch, condition `{"s2.is": 2000042}`:** *Pieces of the Puzzle*
> The murmured exchanges among colleagues dissolve into holy silence, and flashes of the future flicker before your eyes, but upon deep thought, they remain a blur.

<!-- settlement_extre[14] -->
**Outcome — branch, condition `{"s2.is": 2000048}`:** *Pieces of the Puzzle*
> The murmured exchanges among colleagues dissolve into holy silence, and flashes of the future flicker before your eyes, but upon deep thought, they remain a blur.

<!-- settlement_extre[15] -->
**Outcome — branch, condition `{"s2.is": 2000037}`:** *Planning Ahead*
> Your past battle experience and knowledge slowly integrate through conversations with colleagues.

<!-- settlement_extre[16] -->
**Outcome — branch, condition `{"s2.is": 2000043}`:** *Planning Ahead*
> Your past battle experience and knowledge slowly integrate through conversations with colleagues.

<!-- settlement_extre[17] -->
**Outcome — branch, condition `{"s2.is": 2000049}`:** *Planning Ahead*
> Your past battle experience and knowledge slowly integrate through conversations with colleagues.

<!-- settlement_extre[18] -->
**Outcome — branch, condition `{"s2.is": 2000419}`:** *Fanning the Flames*
> The splendid stories are inevitably wrapped in lies and fabrications, adding an air of mystery.

<!-- settlement_extre[19] -->
**Outcome — branch, condition `{"s2.is": 2000420}`:** *Fanning the Flames*
> The splendid stories are inevitably wrapped in lies and fabrications, adding an air of mystery.

<!-- settlement_extre[20] -->
**Outcome — branch, condition `{"s2.is": 2000421}`:** *Fanning the Flames*
> The splendid stories are inevitably wrapped in lies and fabrications, adding an air of mystery.

<!-- settlement_extre[21] -->
**Outcome — branch, condition `{"s3.is": 2000100}`:** *Eye Contact*
> All fear will find an exit – those oppressed can't help but ask, "how can we gain freedom?"

<!-- settlement_extre[22] -->
**Outcome — branch, condition `{"s3.is": 2000541}`:** *Unspoken Understanding*
> All questions will have their answers, like how a stream naturally becomes a river as it flows.

<!-- settlement_extre[23] -->
**Outcome — branch, condition `{"s3.is": 2000171, "s1.is": 2000169}`:** *Known to All*
> More and more people gather around you, uneasy and restless, daggers in hand thirst for the unjust ruler's blood.

<!-- settlement_extre[24] -->
**Outcome — branch, condition `{"s3.is": 2000724}`:** *You Casually Reveal a Dark Secret*
> A few strands of Impure Thoughts tempt people, drawing them to you, leading you all into mysterious and dangerous darkness.

<!-- settlement_extre[25] -->
**Outcome — branch, condition `{"s3.is": 2000410}`:** *Once Forgotten, Now Remembered*
> Certain corners of the court are perpetually sunless, where ancient God's words are quietly etched.

<!-- settlement_extre[26] -->
**Outcome — branch, condition `{"s3.is": 2000411}`:** *What If It's True?*
> The gullible are skeptical while nobles bide their time, waiting for better terms – only you've heard it, that alluring yet hoarse whisper in your mind of the New World's promise.

*(+4 further outcome branches, all present in official English — regenerate uncapped with `rite_record.py 5001004`.)*


## Noble Hospitality — rite `5008118` (如何款待尊贵的客人)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008118_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Noble_Hospitality

**Intro (EN):**
> You must prepare thoroughly for the Sultan's visit. Ideally, you should distract him, bore him, prevent him from scrutinizing your operations here, and return him to the palace as quickly as possible...

**Slot lines (EN):**
> s1: The Sultan will soon visit your guesthouse
> s2: You must provide a companion with Charisma no less than 5 to entertain the Sultan and divert his attention
> s3: A meal befitting the Sultan's exalted status - the foundation of your banquet
> s4: The banquet's essential flattery portion - the key is what you want the Sultan to hear
> s5: For breaking an Extravagance Card, prepare a more lavish setting at additional cost: Bronze tier 10 Gold Coins, Silver tier 15 Gold Coins, Gold tier 20 Gold Coins
> s6: You can take this to break a Carnality or Extravagance Card of Bronzetier or higher. Breaking Extravagance Cards requires corresponding Gold Coins.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3.大餐": 1, "have.2000014": 1}`:** *Culinary Strategy*
> You specifically instructed Habib to ensure that, while every dish remained delicious, the flavors be made bolder so the Sultan drinks more—as the more he drinks, the quicker he gets drunk, and the more likely you are to get through the day peacefully...

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s3.大餐": 1, "!have.2000014": 1}`:** *Culinary Strategy*
> Your best chef is dead, but his dishes haven't spoiled yet... You've added extra salt and spices not only to mask any deterioration but to make the flavors stronger, encouraging the Sultan to drink more - after all, the more he drinks, the faster he'll become intoxicated, and the more likely you'll survive the day...

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s3.大餐": 1, "s3.rare>=": 3, "have.2000014": 1}`:** *Culinary Triumph*
> Everything goes according to plan. The Sultan enjoys each dish immensely, commenting on every course. He even summons Habib to personally inquire about certain recipes... Habib later tells you that he could feel the Sultan's gaze following him all the way out of the room.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s3.大餐": 1, "s3.rare>=": 3, "!have.2000014": 1}`:** *Culinary Triumph*
> Everything goes according to plan. The Sultan enjoys each dish immensely, commenting on every course. He even wants to summon your chef to personally inquire about certain recipes... 
> You reluctantly explain that the chef recently had an unfortunate accident involving his neck and a kitchen knife... in short, he's dead. The Sultan gives you a suspicious look, clearly believing you're withholding a talented chef from him.

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s3.大餐": 1, "s3.rare<": 3}`:** *Culinary Success*
> He eats with evident pleasure, particularly enjoying the accompanying wine. He even orders his eunuchs to record several recipes. Before the banquet ends, the Sultan generously rewards you with gold, laughing as he watches you become even more attentive after receiving his favor.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s2": 1}`:**
> As the wine's flush still colors the Sultan's cheeks, you quietly clap your hands, and the music in the hall gradually shifts to something more seductive...

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"s2": 1, "s2.rare<=": 1}`:** *Fatal Entertainment*
> [s2.name] carefully approaches the Sultan, kneeling respectfully. Learning this beauty is your gift to him, the Sultan beckons her closer, then casually slits her throat with his dagger. 
> The Sultan admires her face, frozen in shock and terror, then bursts into laughter: "What excellent entertainment! [player.name], you never disappoint me!" 
> You force out a dry laugh while wiping cold sweat from your brow...

<!-- settlement_extre[7] -->
**Outcome — branch, condition `{"!s2.主角": 1, "!s2.妻子": 1, "!s2.is": 2000195, "s2.魅力<": 10, "s2.rare>=": 2}`:** *Royal Pleasure*
> [s2.name] approaches the Sultan with dignified grace, kneeling before him. Learning this beauty is your gift to him, the Sultan smiles. He beckons her closer, and you witness firsthand the cruel pleasure of receiving the great Sultan's attention. 
> You hear the woman's painful moans and try to convince yourself they contain some pleasure, but they don't. Perhaps even the Sultan feels none. He's merely playing with a fresh, interesting prey, nothing more.

<!-- settlement_extre[8] -->
**Outcome — branch, condition `{"!s2.主角": 1, "!s2.妻子": 1, "!s2.is": 2000195, "s2.rare>=": 2, "s2.魅力>=": 10}`:** *Sweet Conclusion*
> Learning this beauty is your gift, the Sultan's eyes brighten slightly. He beckons her closer, and you witness firsthand the cruel pleasure of receiving the great Sultan's attention. 
> You hear the woman's painful moans and try to convince yourself they contain some pleasure, but they don't. Only the Sultan seems genuinely entertained, enjoying this rare after-dinner treat.

<!-- settlement_extre[9] -->
**Outcome — branch, condition `{"s2.妻子": 1}`:** *Sweet Conclusion*
> Seeing Maggie kneeling submissively, the Sultan laughs aloud. 
> "Ha!" he looks at you intriguingly. "What does this mean, my dear courtier?" 
> You kneel with equal submission, explaining she is your most precious woman. You couldn't think of anyone else worthy of entertaining the esteemed Sultan. 
> The Sultan accepts Maggie, while you avoid her cold, mocking glance in your direction.

<!-- settlement_extre[10] -->
**Outcome — branch, condition `{"s2.妻子": 1}`:** *Boundaries Forgotten*
> After this, people truly begin to fear you.

<!-- settlement_extre[11] -->
**Outcome — branch, condition `{"s2.is": 2000082}`:** *Sacrilege Unveiled*
> At first, everything proceeds smoothly - Shama's elegance and beauty could conquer any man, until the Sultan touches something that shouldn't exist... Even slightly intoxicated, the Sultan recognizes what it is. 
> He pauses, toying with it, seemingly curious about its connection to her anatomy. Finally, he skillfully cuts it away, using the gushing blood to enhance his pleasure, even as the body beneath him gradually grows cold.

<!-- settlement_extre[12] -->
**Outcome — branch, condition `{"s2.is": 2000195}`:** *She Uttered the Vilest Curse in the Tongue of the Fallen Kingdom*
> For survival, and for the vagrants, Raed could endure every manner of suffering. But the Sultan—this humiliation, and this alone—was what she could never accept.
> She drew the blade she kept close to her body and struck with all her strength, yet the edge found nothing but the Sultan's robe.
> That wild gift, laced with so many secrets, thrilled the Sultan beyond measure.
> He was elated, satisfied beyond words.
> Behind the bloodstained curtain, he made you all wait for a long while before bursting into laughter and leaving—ordering his soldiers to take away Raed's corpse.

<!-- settlement_extre[13] -->
**Outcome — branch, condition `{"s2.主角": 1, "!s6.纵欲": 1, "!s2.生命权杖": 1}`:** *Direct Approach*
> The Sultan seems momentarily stunned by your advance. He pushes you away. "Return to your seat, courtier," he says, nearly spilling his wine with laughter.

<!-- settlement_extre[14] -->
**Outcome — branch, condition `{"s2.主角": 1, "s6.纵欲": 1, "!s2.生命权杖": 1}`:** *Formal Request*
> Kneeling, you respectfully present the card depicting lovers, begging your master to break it - which is absolutely inappropriate. The Sultan narrows his eyes dangerously. Swirling his wine leisurely, he says, "Courtier, if you wish to please me, take this game more seriously. If not... what exactly are you trying to do?" 
> Sweating profusely, you withdraw the card, offering many flattering words and promising never to take such shortcuts again. Only then does the Sultan wave dismissively, letting your transgression pass.

<!-- settlement_extre[15] -->
**Outcome — branch, condition `{"s2.生命权杖": 1}`:** *Confidence From Rod*
> When the atmosphere feels right, you activate the Rod of Life in the main hall, promising the Sultan unprecedented pleasure. 
> Naturally, the ashen-faced Sultan has your head removed.

<!-- settlement_extre[16] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1}`:** *Perfect Timing*
> As the banquet nears its conclusion, you invite the Sultan to see your velvet-curtained chamber, to hear what people discuss there... 
> The Sultan eagerly sets down his wine cup, following your lead as you guide him up the attic stairs.

<!-- settlement_extre[17] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "any": {"s4.is": 2000541}}`:** *Loyal Subjects*
> You whisper in the Sultan's ear that the most common topic here is people's inability to approach the sun-like greatness of the Sultan. "You wouldn't believe how many people journey great distances to glimpse your divine countenance, almost like pilgrims!" You bow humbly. "They should envy me - not only do I have the honor of seeing you at court, enjoying your favor, but I'm blessed to prepare meals and pour wine for you!" 
> The Sultan laughs with pleasure. Laugh, yes, laugh, you join him with sincere-seeming mirth. You haven't lied - many indeed come from everywhere to see him, except they come to drink his blood!

<!-- settlement_extre[18] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "any": {"s4.is": 2000727}}`:** *Pious Whispers*
> You whisper in the Sultan's ear that the lower city's people pray daily to the Immaculate Purity, describing religious ceremonies in detail, answering his every question like his informant in the Dark Alley. The Sultan remains noncommittal about their devotions but seems quite pleased with your attitude. 
> Naturally, the Purist Order's priests are equally pleased upon hearing of your assistance.

<!-- settlement_extre[19] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "s4.is": 2000728}`:** *Zealous Devotion*
> You quietly inform the Sultan that the lower city's people pray daily to the Immaculate Purity. You indignantly reveal that during ceremonies, the Purist Order priests conceal significant amounts of gold - gold that rightfully belongs to the Sultan's treasury. 
> The Sultan remains noncommittal, but seems pleased with your attitude, as if you've truly become his informant in the Dark Alley. He even rewards you with a vial of Aether, something priceless to the Order but merely a casual gift from him.

<!-- settlement_extre[20] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "any": {"s4.is": 2000411}}`:** *Forbidden Worship*
> Even the scent of blood hangs in the air... 
> You awkwardly meet the Sultan's knowing smile, explaining embarrassingly that occasionally - just occasionally - some cultists visit... 
> The Sultan merely pats your shoulder, telling you to relax. He seems unbothered - after all, what is such minor evil to the Sultan?

<!-- settlement_extre[21] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "s4.is": 2000412}`:** *New World Prophecy*
> The cultists in the room fervently proclaim their grand plans while you stand sweating beside the Sultan, not daring to speak... 
> The Sultan smiles with interest, seemingly believing it, or perhaps just enjoying it as entertainment. Before leaving, he casually rewards you with a vial of Aether... 
> Perfect - this Aether, along with the Sultan's obvious attitude, is exactly what you need.

<!-- settlement_extre[22] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "s4.is": 2000943}`:** *Imperial Parasites!*
> Through the heavy curtains, you hear indignant voices. You move to intervene but the Sultan stops you. Disguised as an ordinary noble guest, he smokes a water pipe while listening to others eloquently criticize corrupt officials and vizier factions, accusing them of emptying the great Sultan's treasury, forcing him to delay military campaigns... 
> He occasionally asks questions, and after about one water pipe's worth of time, he calmly rises, his expression unreadable, and quietly departs.

<!-- settlement_extre[23] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "s4.is": 2000944}`:** *Ungrateful Meddlers!*
> Through the heavy curtains, you hear indignant voices. You move to intervene but the Sultan stops you. Disguised as an ordinary noble guest, he smokes a water pipe while listening to others criticize self-proclaimed virtuous officials who constantly trouble the Sultan with trivial matters. "Can gold multiply through arguments? Couldn't they be more considerate?" 
> The Sultan cheerfully joins their conversation, occasionally asking questions. After about one water pipe's worth of time, he calmly rises, his expression unreadable, and quietly departs. 
> Upon hearing of this, Abdul greatly praises you, providing the promised substantial reward.

<!-- settlement_extre[24] -->
**Outcome — branch, condition `{"s2": 1, "!s2.主角": 1, "any": {"s6.is": 2010008}}`:**
> Witnessing the supreme Sultan's carnality is itself a supreme carnality. The Sultan nods, granting your request.

<!-- settlement_extre[25] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "s6.is": 2010012, "s5.金币>=": 20}`:**
> Considering your meticulous and attentive service, the Sultan allows you to break this card.

<!-- settlement_extre[26] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "s6.is": 2010011, "s5.金币>=": 15}`:**
> Considering your meticulous and attentive service, the Sultan allows you to break this card.

<!-- settlement_extre[27] -->
**Outcome — branch, condition `{"!s2.生命权杖": 1, "s6.is": 2010010, "s5.金币>=": 10}`:**
> Considering your meticulous and attentive service, the Sultan allows you to break this card.


## Receive Divine Grace — rite `5004513` (领受神恩)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5004513_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Purist_Order#Receive_Divine_Grace

**Intro (EN):**
> Priests from the Purist Order can dispel evil and bestow blessings through special incantations... making recipients increasingly devoted to the Immaculate.

**Slot lines (EN):**
> s1: Attending Priest
> s2: One Seeking Blessing or Curse Removal
> s3: You Must Demonstrate "Sincerity" to the Priests
> s4: Try a Sultan Card here? You must personally deliver it

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s2.密教徒": 1}`:**
> The Immaculate Purity cleansing flame consumes [s2.name]'s vessel, purging the darkness of false faith from [s2.gender(his,her)] mortal form.

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"!s4": 1, "s1.is": 2000021, "s2.is": 2000055, "!s2.已获亵渎之欢": 1}`:** *Unfulfilled Pleasure*
> In Nayla's imagination, tarnishing an apparently untouchable, immaculate priest should be the highlight. However, when she actually attempts seducing this High Priest the following day, Nayla approached you with extreme disappointement. 
> She tells you that despite her most seductive arts, Iman remained entirely unmoved, leading her to question his virility rather than doubt her own considerable charms! 
> You hurridly praise her, and in the end, Nayla giggles, generously throwing a handful of Gold Coins into your lap, "Alright, let's not talk about that guy, really boring. Oh, you're much more fun, you're more fun now than in bed."

<!-- settlement_prior[2] -->
**Outcome — branch, condition `{"s2.is": 2000013, "counter.7000618<": 1}`:** *I Won't Go*
> The Roaming Swordsman refuses without hesitation. "Although - the Star-Souled I worship is a failure," his voice drops, perhaps recalling hopeless prayers and pleas during his nation's destruction, then shakes his head, "but I cannot betray Them."
> You know the Star-Souled worshipped by Highland people was exactly what the Purist banished, just as the Highland realm was destroyed by the Sultan's father. Well, it seems you cannot persuade him.

<!-- settlement_prior[3] -->
**Outcome — branch, condition `{"s2.is": 2000013, "counter.7000618>=": 1}`:** *Death Before Worship*
> The Roaming Swordsman lounges at the table, sprawls on the carpet, refusing to go regardless of what you say, preferring to be covered in sores or even die.

<!-- settlement_prior[4] -->
**Outcome — branch, condition `{"s2.is": 2001182}`:**
> [xiaochou.name] refused to pray to the Purist—not even as a pretense.
> “That is not a being to be trifled with,” it warned you. “You’d do well to stay far from Him.”

<!-- settlement[0] -->
**Outcome — branch, condition `{"counter.7000589>=": 1, "s4.type": "sudan", "s2.主角": 1}`:**
> You should understand this offers no opportunity to break Sultan Cards.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s4.奢靡": 1, "s2.主角": 1, "s3.金币<": 10}`:**
> Before meeting High Priest Iman, the entrance priest examines your gold and this evil card, then promptly asks you to leave. 
> This pittance insults both your game and the exalted god!

<!-- settlement[2] -->
**Outcome — branch, condition `{"s4.奢靡": 1, "s2.主角": 1, "s3.金币>=": 10, "!s2.祝福": 1}`:**
> This sinful card makes Iman frown. 
> He coldly, unhesitatingly rejects you: "Please don't call divine blessings 'extravagance'." With distaste, he orders priests to escort you out. 
> Perhaps their god is pure, untarnished, and inviolable, yet at this moment, under this brilliant sky, you distinctly sense an otherworldly glance toward you and your card. Only your connection remains insufficient; you haven't yet received divine blessing... that's all.

<!-- settlement[3] -->
**Outcome — branch, condition `{"s4.奢靡": 1, "s2.主角": 1, "s3.金币>=": 10, "s2.祝福": 1, "counter.7000587<": 1}`:**
> This sinful card makes Iman frown. 
> He coldly, unhesitatingly rejects you: "Please don't call divine blessings 'extravagance'." With distaste, he orders priests to escort you out.
> Yet in this moment, under this brilliant sky, you sense an otherworldly glance toward you, then every white stone around you subtly vibrates, your card shatters, and divine light concentrates on your forehead like a simple mark or brand - He has noticed you.
> Yes.
> <size=+10><font="Title SDF"><b>HE - HAS - NOTICED - YOU.</b></font></size> 
> Everyone witnesses this sudden miracle; believers and priests prostrate themselves, loudly praising the Immaculate while Iman stands frozen, eyes reflecting profound anguish and confusion. Finally, he kneels before you, head bowed, voice tearful: "Please guide me."

<!-- settlement[4] -->
**Outcome — branch, condition `{"s4.奢靡": 1, "s2.主角": 1, "s3.金币>=": 10, "s2.祝福": 1, "counter.7000587>=": 1}`:**
> You should understand this offers no opportunity to break Sultan Cards.

<!-- settlement[5] -->
**Outcome — branch, condition `{"s4.杀戮": 1, "s2.主角": 1}`:**
> No one anticipates a dagger here; even the divine doesn't vigilantly protect its faithful. Iman collapses bleeding, crimson quickly staining surrounding spring water. You're genuinely surprised at your easy success... 
> Priests quickly identify the culprit, protesting to the Sultan, who fortunately pre-pardoned your game-related transgressions - besides, who's to say the Sultan disapproves?

<!-- settlement[6] -->
**Outcome — branch, condition `{"s4.纵欲": 1, "s2.主角": 1, "!s2.祝福": 1}`:**
> This sinful card deeply disturbs Iman; its depictions of love and desire would contaminate his eyes with a second glance. Predictably, priests and believers chase you from the temple. 
> Why so serious? Just let me indulge briefly. You grumble, retrieving your Sultan Card from the mud. Just then, something stirs within - looking skyward, you sense a hasty celestial glance. Only your connection remains insufficient; you haven't yet received divine blessing...

<!-- settlement[7] -->
**Outcome — branch, condition `{"s4.纵欲": 1, "s2.主角": 1, "s2.祝福": 1, "counter.7000588<": 1}`:**
> This sinful card deeply disturbs Iman; its depictions of love and desire would contaminate his eyes with a second glance. Predictably, priests and believers grab your arms to eject you, but suddenly, under this brilliant sky, you sense an otherworldly glance, then every white stone around you subtly vibrates, your card shatters, and divine light bathes you, marking your forehead - They have noticed you. 
> Yes. 
> <size=+10><font="Title SDF"><b>HE - HAS - NOTICED - YOU.</b></font></size> 
> Everyone freezes at this sudden miracle; believers and priests eventually prostrate themselves, loudly praising the Immaculate while Iman stands paralyzed, eyes reflecting profound anguish and confusion - why? Why would divine intervention protect this filthy card, this filthy desire...? What kind of deity has he been worshipping? 
> Finally, he kneels, head bowed, voice unnaturally calm: "Please follow me.” 
> Countless glances exchange surreptitiously - could it be that the god has sanctioned this impending union as sacred, pure, and righteous?

<!-- settlement[8] -->
**Outcome — branch, condition `{"s4.纵欲": 1, "s2.主角": 1, "s2.祝福": 1, "counter.7000588>=": 1}`:**
> You should understand this offers no opportunity to break Sultan Cards.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"counter.7000589<": 1, "s4.奢靡": 1, "s2.主角": 1, "s3.金币>=": 10, "s2.祝福": 1, "counter.7000587<": 1, "counter.7000578<": 1}`:**
> On the broken Sultan Card, you notice strange markings. Mysteriously, one shackle has been broken, one transgression absorbed by this card.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"counter.7000589<": 1, "s4.杀戮": 1, "s2.主角": 1, "counter.7000581<": 1}`:**
> Innocent blood dripped upon the card's fracture, creating a strange sensation. Mysteriously, a shackle had been broken - this card now carried a burden of sin.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"!s4": 1, "counter.7000601<": 1}`:** *Blessing Procedure*
> Being your first visit, a priest carefully instructs you. 
> You'll kneel on white stone slabs; after a brief wait, their High Priest Iman will present you with a sharp-edged white stone fragment. 
> He will dispassionately brush aside his pristine white hair, directing you to use this stone knife to cut his gold-dusted, scarred back, and amidst blood and pain, he'll whisper one pure word. 
> This strange, inhuman intonation, once heard, will wash away everything - curses, impurities, uncleanness - like flowing water.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"!s4": 1, "s3.金币>=": 5, "s3.金币<": 10}`:**
> [s2.name]'s spiritual impurities are thus expelled, just as [s1.name]'s flowing blood is washed from white stones without leaving traces.

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"!s4": 1, "!s2.祝福": 1, "s3.金币>=": 10}`:**
> Divine blessing fills [s2.name]'s body; never has [s2.gender(him,her)] felt such lightness.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"!s4": 1, "s2.祝福": 1, "s3.金币>=": 10}`:**
> [s2.name] has already received divine blessing, but the pure word still brings [s2.gender(him,her)] comfort.

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"!s4": 1, "s3.金币<": 5}`:**
> Though lacking sufficient funds for blessing or curse removal, your donation pleases the priests enough for them to speak encouraging words before your departure.


## The Frenzied Highlord — rite `5000578` (狂乱的圣主)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000578_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Highlord_of_the_Highlands

**Intro (EN):**
> The mightiest of Star-Souleds has returned to earth, consumed by excitement, joy, and insatiable hunger, devouring mortal dreams without restraint.

**Slot lines (EN):**
> s1: The Highlord
> s2: Your follower caught by the Star
> s3: A noble of the city caught by the Star
> s4: The Star-Souled
> s5: Leading the god-slayers
> s6: Following the god-slayers
> s7: Following the god-slayers
> s8: Following the god-slayers
> s9: Against a god, scripture? Or intimidation!
> s10: Consumable
> s11: Conquest Card

**Dice line (EN):**
> The Star's Appetite
> The victims' Magic and Survival determine your full dice count.
> The victims need at least 5 Successes to escape.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s9.is": 2000843}`:** *The Highlord's Gift*
> When you stand before the Highlord, the fear of your inner god...

<!-- settlement[1] -->
**Outcome — branch, condition `{"s9.is": 2000844}`:** *The Star's Moment of Clarity*
> They fled in terror.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s9.is": 2000847}`:** *The Star's Moment of Clarity*
> They fled in terror, but revealed profound truths in Their retreat.

<!-- settlement[3] -->
**Outcome — branch, condition `{"s9.is": 2000848}`:** *The Star's Moment of Clarity*
> They fled in terror.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"!s5": 1, "all": {"!s9.is": 2000848}}`:** *Hungry Highlord*
> Those touched by Him become hollow vessels, babbling madness while their bodies and souls wither simultaneously. Should you fail to stop Him soon, this long-forgotten god will consume without end.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "!s4": 1, "s2": 1, "r1:s2.魔力+s2.生存+s10.魔力+s10.生存+s4.魔力+s4.生存>=": [5, 5]}`:** *[s2.name] Escapes from Heaven*
> [s2.gender] describes being in the Highlord's grasp as an endless dream - everything dissolving into a river that flowed toward a vast, peaceful ocean...

<!-- settlement_extre[2] -->
**Outcome — failure, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "!s4": 1, "s2": 1, "r1:s2.魔力+s2.生存+s10.魔力+s10.生存+s4.魔力+s4.生存<": [5, 5]}`:** *Another Victim*
> [s2.name]'s mind and body are completely consumed by the ravenous god. [s2.gender] withers visibly, uttering only meaningless whispers. Refusing food and water, [s2.gender(he,she)] perishes within days.

<!-- settlement_extre[3] -->
**Outcome — success, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "!s4": 1, "s3": 1, "r2:s3.魔力+s3.生存+s10.魔力+s10.生存+s4.魔力+s4.生存>=": [5, 5]}`:** *[s3.name] Survives the Encounter*
> [s3.gender] describes being in the Highlord's grasp as an endless dream - everything dissolving into a river that flowed toward a vast, peaceful ocean...

<!-- settlement_extre[4] -->
**Outcome — failure, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "!s4": 1, "s3": 1, "r2:s3.魔力+s3.生存+s10.魔力+s10.生存+s4.魔力+s4.生存<": [5, 5]}`:** *Another Victim*
> [s3.name]'s mind and body are completely consumed by the ravenous god. [s3.gender] withers visibly, uttering only meaningless whispers. Refusing food and water, [s3.gender(he,she)] perishes within days.

<!-- settlement_extre[5] -->
**Outcome — success, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "s4": 1, "s2": 1, "r1:s2.魔力+s2.生存+s10.魔力+s10.生存+s4.魔力+s4.生存>=": [5, 5]}`:** *[s2.name] Escapes from Heaven*
> [s2.gender] describes being in the Highlord's grasp as an endless dream - everything dissolving into a river that flowed toward a vast, peaceful ocean... Until another star - warm and familiar - opened a doorway for [s2.gender(him,her)] to escape the dream...

<!-- settlement_extre[6] -->
**Outcome — failure, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "s4": 1, "s2": 1, "r1:s2.魔力+s2.生存+s10.魔力+s10.生存+s4.魔力+s4.生存<": [5, 5]}`:** *Another Victim*
> [s2.name]'s mind and body are completely consumed by the ravenous god. [s2.gender] withers visibly, uttering only meaningless whispers. Refusing food and water, [s2.gender(he,she)] perishes within days.

<!-- settlement_extre[7] -->
**Outcome — success, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "s4": 1, "s3": 1, "r2:s3.魔力+s3.生存+s10.魔力+s10.生存+s4.魔力+s4.生存>=": [5, 5]}`:** *[s3.name] Survives the Encounter*
> [s3.gender] describes being in the Highlord's grasp as an endless dream - everything dissolving into a river that flowed toward a vast, peaceful ocean... Until another star - warm and familiar - opened a doorway for [s3.gender(him,her)] to escape the dream...

<!-- settlement_extre[8] -->
**Outcome — failure, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "s4": 1, "s3": 1, "r2:s3.魔力+s3.生存+s10.魔力+s10.生存+s4.魔力+s4.生存<": [5, 5]}`:** *Another Victim*
> [s3.name]'s mind and body are completely consumed by the ravenous god. [s3.gender] withers visibly, uttering only meaningless whispers. Refusing food and water, [s3.gender(he,she)] perishes within days.

<!-- settlement_extre[9] -->
**Outcome — success, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "r3:s5.魔力+s5.战斗+s6.魔力+s6.战斗+s7.魔力+s7.战斗+s8.魔力+s8.战斗+s10.魔力+s10.战斗+s4.魔力+s4.战斗-e(魔力+战斗)>=": [8, 5]}`:** *The Tears of Stars Moisten the Firmament*
> You fought beyond mortal boundaries. Once stubborn disbelievers, tonight you faced the undeniable presence of divinity. 
> The North Star answered Their rage by transforming into a spear, leading countless celestial bodies in their descent. You battled against heaven's light, earth's winds, and cosmic darkness simultaneously. Yet They remain a fallen god in a realm that no longer acknowledges Him, Their powers caught between reality and illusion. 
> Through sheer determination, you pierce the veil of Their realm, driving your blades into Their luminous form - that body rebuilt from stolen mortal flesh. 
> In Their final moment, this weakened god regains a flash of clarity... You've destroyed not just Their earthly manifestation, but the mind corrupted by human desires. The North Star flickers with renewed brilliance in the night sky; unexpectedly, sweet rain falls from cloudless heavens, refreshing your exhausted forms... A great Star-Souled returns at last to its rightful domain.

<!-- settlement_extre[10] -->
**Outcome — failure, condition `{"all": {"!s9.is": 2000848}, "s5": 1, "r3:s5.魔力+s5.战斗+s6.魔力+s6.战斗+s7.魔力+s7.战斗+s8.魔力+s8.战斗+s10.魔力+s10.战斗+s4.魔力+s4.战斗-e(魔力+战斗)<": [8, 5]}`:** *Crimson Marks*
> The Highlord battles with starlight, darkness, and moist winds, but Their maddened shrieks prove most terrifying. 
> Now you understand - this is a god poisoned by mortal desires. They absorbed too much to return to the heavens, yet remains too ravenous to fully manifest on earth. Those collective hungers and thoughts now crawl beneath your skin like venomous insects, sharing in the god's torment.

<!-- settlement_extre[11] -->
**Outcome — branch, condition `{"any": {"s9.is": 2000846}}`:** *Futile Faith*
> In battle with the divine, you realize that certain notions, fantasies, or faiths within your heart... remain feeble and useless against truly sacred entities.

<!-- settlement_extre[12] -->
**Outcome — branch, condition `{"any": {"s9.is": 2000728}}`:** *Empty Words*
> In battle with the god, you invoked the Truth's name, praying for punishment of heresy... Of course, it had absolutely no effect, but your loud scripture recitation appeared heroic, earning high praise from the Purist Order.

<!-- settlement_extre[13] -->
**Outcome — branch, condition `{"s11": 1, "any": {"s9.is": 2000848, "r3:s5.魔力+s5.战斗+s6.魔力+s6.战斗+s7.魔力+s7.战斗+s8.魔力+s8.战斗+s10.魔力+s10.战斗+s4.魔力+s4.战斗-e(魔力+战斗)>=": [8, 5]}, "counter.7000579<": 1}`:** *You break a Sultan Card in an extremely sacred moment*
> You vanquished a god... The Sultan's Game witnessed this achievement. As the card snapped, a scar suddenly appeared on your chest... Bloodless, painless, even emanating waves of ecstasy - in this game, the sin of tearing reality is forgiven, even when committed by a god.

<!-- settlement_extre[14] -->
**Outcome — branch, condition `{"s11": 1, "any": {"s9.is": 2000848, "r3:s5.魔力+s5.战斗+s6.魔力+s6.战斗+s7.魔力+s7.战斗+s8.魔力+s8.战斗+s10.魔力+s10.战斗+s4.魔力+s4.战斗-e(魔力+战斗)>=": [8, 5]}, "counter.7000579>=": 1}`:** *You break a Sultan Card in an extremely sacred moment*
> You vanquished a god... The Sultan's Game witnessed this achievement.


## Unreliable Ally — rite `5000713` (靠不住的盟友)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000713_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Nabhani#Unreliable_Ally

**Intro (EN):**
> Clearly, in Nabhani's imagination, the Sultan's Game should be full of skirmish, sex, and scandals. His sword should be clanging steels, but the only clanging that echoed was the clanging of accounted Gold Coins, counting days after days, after days... This obviously couldn't satisfy his restless heart. Soon enough, he returned to his former life of debauchery. Perhaps once he's bored, he will come back to check if you're still alive every now and then.

**Slot lines (EN):**
> s1: Nabhani is dashing outside
> s2: Find a female with enough Charisma to go get him... or a bottle of wine.
> s3: Can the Sultan's card bring him some new excitement?

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s3.纵欲": 1, "counter.7000277<": 1, "counter.7000471>=": 1}`:** *You show him a Carnality Card*
> House of Delights remains closed; Carnality must wait

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"s3.纵欲": 1, "counter.7000277<": 1, "counter.7000471<": 1}`:** *You show him a Carnality Card*
> Nabhani returns to your courtyard with great enthusiasm.
>
> He winks at you mysteriously: "Have you heard that the House of Delights has been trying out something new lately? Let's go together–but remember to bring your best cloth; we are in the presence of men."
>
> You're full of doubt: you've always heard of the Lady of Delights wearing heavy makeup and competing for attention to greet guests, but it's the first time hearing that guests need to dress elaborately. However, you calmly nod, indicating that you agree.

<!-- settlement_prior[2] -->
**Outcome — branch, condition `{"s3.征服": 1, "counter.7000323<": 1, "s3.rare=": 1}`:** *Show Nabhani the Conquest Card.*
> Nabhani fiddles with the card you brought and bursts into laughter: "Worried about this card? Oh, good friend, I have a brilliant idea!"
>
> He cheerfully leaves with your card, and seeing him like this, you suddenly have doubts... showing him the Conquest Card might not have been a good idea...

<!-- settlement_prior[3] -->
**Outcome — branch, condition `{"s3.征服": 1, "counter.7000323<": 1, "s3.rare=": 2}`:** *Show Nabhani the Conquest Card.*
> Nabhani fiddles with the card you brought and bursts into laughter: "Worried about this card? Oh, good friend, I have a brilliant idea!"
>
> He cheerfully leaves with your card, and seeing him like this, you suddenly have doubts... showing him the Conquest Card might not have been a good idea...

<!-- settlement_prior[4] -->
**Outcome — branch, condition `{"s3.征服": 1, "counter.7000323<": 1, "s3.rare>=": 3}`:** *Show Nabhani the Conquest Card.*
> Nabhani fiddles with the card you brought and bursts into laughter: "Worried about this card? Oh, good friend, I have a brilliant idea!"
>
> He cheerfully leaves with your card, and seeing him like this, you suddenly have doubts... showing him the Conquest Card might not have been a good idea...

<!-- settlement_prior[5] -->
**Outcome — branch, condition `{"s3.奢靡": 1, "counter.7000159<": 1, "counter.7000464>=": 1}`:** *Temporal Matters*
> Seeing the card, Nabhani ruefully shakes head: “I do know of a luxurious spot, but sadly, recent flames burnt that very slave market to the ground.”

<!-- settlement_prior[6] -->
**Outcome — branch, condition `{"s3.奢靡": 1, "counter.7000159>=": 1, "counter.7000464>=": 1}`:** *Fortunate Timing*
> Seeing your card, Nabhani suddenly remembered something: "Did you know that the slave market we visited last time was completely burned down?"

<!-- settlement_prior[7] -->
**Outcome — branch, condition `{"s3.奢靡": 1, "counter.7000159<": 1, "counter.7000464<": 1}`:** *Time to go, [player.name]~!*
> You show him an Extravagance Card, and Nabhani happily comes back to you. He winks at you, "Great, time to spruce up our activity varieties a little!"

<!-- settlement_prior[8] -->
**Outcome — branch, condition `{"s3.杀戮": 1, "s2.女性": 1}`:** *Have fun to your heart's content*
> You had [s2.name] summon Nabhani back to help. But of course, neither of them knows that a dagger awaits this playboy... Always with eyes only for beauty and indulgence, Nabhani finally shifts his gaze to you. Those eyes are heavy with pity, devoid of hatred, as if he still seeks to offer you comfort. But the blood filling his throat silences him.

<!-- settlement_prior[9] -->
**Outcome — branch, condition `{"s3.杀戮": 1, "any": {"!s2": 1, "s2.is": 2000767}}`:** *Enough is enough*
> Although there has been no conflict between you before, you really can't stand his frivolous attitude... So let a duel under God's gaze mettle the resolve you two carry.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.is": 2000055, "!s2.已获放浪之欢": 1}`:** *Nabhani returns with unsteady steps.*
> You look at him with concern, ready to ask, but he simply waves his hand, sighs deeply, and stays silent.
> Not long after, Nayla comes to see you. She is in high spirits, helping herself to the juiciest grapes off your table. "I could never understand it," she complains, "Nabhani has slept with almost every woman in the capital, yet only now has he finally spent the night with me.” Then, with a playful smile, Nayla cups your face in her hands. "Thanks to you, my dear [player.name], I finally ate him. Oh, he's so delicious!! Not only in... well, that sense, but he's so sweet too. His tongue is absolutely a treasure of this empire!"

<!-- settlement[1] -->
**Outcome — branch, condition `{"!s2": 1, "s3.奢靡": 1, "counter.7000159>=": 1}`:** *Already played~*
> You couldn't think of anything new to bring Nabhani back.

<!-- settlement[2] -->
**Outcome — branch, condition `{"!s2": 1, "s3.纵欲": 1, "counter.7000277>=": 1}`:** *Not today ~*
> You couldn't think of anything new about carnality to bring Nabhani back.

<!-- settlement[3] -->
**Outcome — branch, condition `{"!s2": 1, "s3.征服": 1, "counter.7000323>=": 1}`:** *Already proved myself here ~*
> Clearly, Nabhani has long lost interest in "conquest."

<!-- settlement[4] -->
**Outcome — branch, condition `{"!s2": 1, "counter.7000051<": 7}`:**
> While you struggle to survive, Nabhani is out having fun.

<!-- settlement[5] -->
**Outcome — branch, condition `{"!s2": 1, "counter.7000051=": 7}`:**
> Nabhani had someone leave a note for you, asking you to prepare good wine as he would return tomorrow.

<!-- settlement[6] -->
**Outcome — branch, condition `{"s2": 1}`:**
> Only beauties or fine liquor can motivate Nabhani, but only for a short while.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"!s3": 1, "s2": 1, "s2.type": "char", "counter.7000273<": 1}`:**
> You send someone to track down Nabhani at the House of Delights, where chaos has broken out.
>
>  A paying customer has been waiting far too long for the girl he requested, but was left ignored. Frustrated, he stands up, pulls aside the veil, and sees that most of the girls are fawning over Nabhani in the inner chamber. The man, furious at being ignored, challenges Nabhani, the center of attention. Two men head to the open ground in front of the House of Delights, ready to settle the matter. 
>
> When you and [s2.name] arrive, a familiar girl hurries over and pleads with you, as a powerful minister, to mediate the duel. If any patron were to die there, it would spell disaster for everyone in the House of Delights.


## Resolve Wife's Resentment — rite `5000009` (消除妻子的不满)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000009_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Maggie#Resolve_Wife_s_Resentment

**Intro (EN):**
> What you are going through and what you have done are enough drive any spouse mad. You would do well to keep her in good cheer, less you find yourself dead before you even know how.

**Slot lines (EN):**
> s1: Summon your wife.
> s2: Something that will please your wife.
> s3: You can't leave it to others. You have to do it yourself.
> s4: Wife's Resentment
> s5: Perhaps you can break a Carnality Sultan Card

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.is": 2001065}`:** *She Displayed It Proudly*
> Maggie laughed while critiquing your brushwork, pointing out numerous areas for improvement.
> Naturally, she allowed no opportunity for corrections—immediately commanding her servant to hang the painting prominently in the great hall. Such fastidious attention to household aesthetics was rarely seen from her!

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.is": 2000689}`:** *Is marriage a ship, or the ocean itself?*
> There are neither seas too safe, nor clouds too clear... The key is, do we still have the desire to set sail?
> At least today, we persevered... No matter where you steer the wheel, Maggie still hoisted the sails for you.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s2.is": 2000680, "counter.7000344<": 1}`:** *She is absolutely playing herself.*
> You explained your plan to Maggie: you would play the role of a henpecked coward, beaten bloody by your wife, then suffer ridicule before the court, reducing the Sultan's suspicions of you... For this to work, she needed to stay with her parents for a few days, maintaining the appearance of a genuine quarrel...
> The plan went smoothly, though Maggie was perhaps too fluid in her violence... That pot flying past your head gave you a genuine fright, though she repeatedly assured you she intentionally missed - only after leaving an enormous handprint on your face, of course.

<!-- settlement[3] -->
**Outcome — branch, condition `{"counter.7000153<": 1, "s3.生命权杖": 1}`:** *You are now the bearer of the Rod of Life!*
> Your wife is shocked by your change, and almost immediately raises her voice, now shrill with anger, rebuking you for turning yourself into this monstrous abomination. To stop her lecture, holding her tight, you quickly activate the switch. In the hums of its rotations, her complaints soon ceased.
> Pleasure slowly surges from the device – much slower than with the original, but it means better control for your body. You can enjoy yourself while adjusting your moves in response to her euphoric expressions, all while manually switching the modes as the female artisan taught you.
> Time stretches and evaporates. As the resonance between your mind and the aether within the machine reached its peak, what is usually brief like a flash of lightning became a firework show of colors and explosions lasting tens of minutes...
> You are spent. In the afterglow, your wife, drenched in sweat, lies on top of you, still mumbling, "what the hell is this..." But the way her fingertips still linger upon your chest, tracing circles in the sweat, clearly suggests she was well pleased...
> A bold thought crosses your mind. If she were to grow resentful of you at some point, this might be a good way of consoling her...

<!-- settlement[4] -->
**Outcome — branch, condition `{"counter.7000153>=": 1, "s3.生命权杖": 1}`:** *The Rod of Life is the solution to all problems.*
> Of course your wife knows what you are doing, but she is exhausted from this game, and why wallow in that misery, when she can enjoy the great Rod of Life instead?
> She would caress your cheeks and brush away the drops of sweat glistening in your brows. She would praise you for how handsome you are as you wield the rod with focus and intention.
> Her phrasing makes you feel odd, as if the rod is not part of your own body, but as the aether tide roars through your nerves, such distractions are drowned by pleasure...

<!-- settlement[5] -->
**Outcome — branch, condition `{"s2.is": 2000184}`:** *Why don't you let your wife use a Double-Headed Dragon to 'penetrate' you?*
> Before entering, she repeatedly assures you that the actual act is unimportant, what matters is your sincerity – the sincertiy to make up for your wrongdoings by surrendering your dignity and sticking up your butt... First, you feel the cool gel. Then, a pounding as violent as an ocean storm... Through your body, you feel her love for you, her hatred for you, and the grief this cruel game has caused her – all the things that words cannot say.
> Afterwards, it is painful to get out of bed. But you count it a small price to pay for the release of these tempestuous emotions.

<!-- settlement[6] -->
**Outcome — branch, condition `{"s2.type": "item", "s2.饰品": 1, "counter.7000012<": 1}`:** *Gift your wife a piece of suitably expensive jewelry...*
> This carefully selected set of jewelry has completely changed your wife. She has never craved a life of excess and never urged you to seek power. But look at her now, absolutely rejuvenated! You <i>should</i> pursue status. You <i>should</i> pursue wealth! Give your woman hope. Give your woman the life she deserves.

<!-- settlement[7] -->
**Outcome — branch, condition `{"s2.is": 2000193, "counter.7000013<": 1}`:** *Read your wife one of her favorite books...*
> Sitting under a thick wool blanket, by the gently swaying lamp, you read to your wife. At every plot twist, she would lean closer, her feet – how cold they are – pressed against your skin. Slowly, your voice grows quieter, and the shroud of sleep descends upon you both. Come morning, you seem to recall confessions of loyalty and love, exchanged in a half-dreaming haze. But you cannot determine if that was not merely a dream.

<!-- settlement[8] -->
**Outcome — branch, condition `{"s2.is": 2000064, "s2.密教徒": 1}`:** *Crimson Bath*
> After hearing your troubles, Nabhani confidently promises a solution. He prepares a bath for Maggie filled with fresh rose petals. Yet he remains dissatisfied - the flowers aren't beautiful enough, not fragrant enough, not red enough... After intense deliberation, he brings in a street beggar, using the child's blood to fill the tub...
> Strangely, Maggie never realizes it's blood... More disturbing still, from that moment on, she develops a taste for these baths.

<!-- settlement[9] -->
**Outcome — branch, condition `{"s2.is": 2000064, "counter.7000050<": 1}`:** *Let the professional handle it...*
> "You're the smoothest talker in the whole city," you said to Nabhani, "so help me, before my wife slips poison into my tea."
> Having said that, when the two really closed the bedroom door, you still felt a pang of pain: half for being the cuckold, and half in regret for all the ridiculous things you have done.
> Soon, laughter drifted out from the room—not the kind born of lust, but of lively conversation.
> A couple of times Nabhani stepped out to fetch some food; their clothes were perfectly in place.
> Whatever they said in there, at least your wife seemed to hate you a little less now.

<!-- settlement[10] -->
**Outcome — branch, condition `{"s2.is": 2000081, "counter.7000075<": 1}`:** *An unforgettable training session*
> Your wife has no love for Jalila, but when you suggested this, she spent a whole afternoon behind closed doors, conversing with your new concubine.
>
> Nightfall. With strong ropes, the two tie you to the bed and blindfold you... In the darkness, the whipping and insults you steeled yourself for do not materialize. Instead, you hear giggling.
>
> The ladies turn every single part of your body into some sort of treat or toy. They tease and tickle and lick and bite – you never knew how ticklish your body was, and in so many places; you never expected just being pinched between their teeth could be so electrifying.
>
> As they make you their plaything, you lose your ground, you twist and turn, you struggle and laugh and scream until your throat goes hoarse.
>
> When they release you from the bondage, you are on the verge of fainting. But your mistresses are well pleased.

<!-- settlement[11] -->
**Outcome — branch, condition `{"s2.is": 2000471}`:** *You sing your wife a love poem*
> The greatest love comes from understanding, from forgiveness. Your poetry comforts your wife.

<!-- settlement[12] -->
**Outcome — branch, condition `{"s2.is": 2001292}`:** *[player.name], what's the matter? Have you not eaten?*
> When Maggie was bathing, you stepped into the room with a bottle of fragrant essential oil—dressed in a short tunic, looking almost like a bathhouse attendant. Perhaps it was the scent of the oil, or the comfort of the warm water, that eased her mood, and so you worked gently along her skin—from arms, to back, to calves, to the arches of her feet.
> She let out a few quiet murmurs of pleasure, and for a fleeting moment, the mistakes you had made—curse this damned game—seemed to be washed away with the water flowing down her body.

<!-- settlement[13] -->
**Outcome — branch, condition `{"any": {"counter.7000012>=": 1, "counter.7000013>=": 1, "counter.7000050>=": 1, "counter.7000075>=": 1}}`:**
> This has grown stale. Your wife's attitude has not improved.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"!s1.激情": 1}`:**
> Your wife's passion for you has been rekindled.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s2.is": 2000184, "s5": 1}`:** *Resolve Sultan Card*
> Having heard of your use of the Double-Headed Dragon, the Sultan laughs and permits you breaking the flimsy card.


## Sharp Grass Plain — rite `5000835` (锐草之原)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000835_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sharp_Glass_Plains

**Intro (EN):**
> An unnatural place where grass grows sharp as razors and nights become bitterly cold. Legends tell of fallen Homeland royal ghosts wandering here. Perhaps treasures or secrets lie hidden.

**Slot lines (EN):**
> s1: Pathfinder needs 4 Survival
> s2: Exorcist needs 5 Magic
> s3: Explorer needs 5 Wisdom
> s4: The 10 Gold Coins cost of this adventure
> s5: Fire-setting requires special items or someone with sufficient magic
> s6: Conquest Sultan Card Silver of Silver or lower
> s7: Consumable

**Dice line (EN):**
> Cut a Path
> Your Survival and Combat determine your full dice count.
> You need at least 5 Success to clear a path successfully

<!-- settlement_extre[0] -->
**Outcome — failure, condition `{"!s5": 1, "!is": 2000013, "r1:s1.生存+s1.战斗+s6.战斗+s7.生存+s7.战斗<": [5, 5]}`:** *Cutting Through Pain*
> [s1.name] hacks brutally at the obstructing grass, creating a rough path. The grass seems alive, dancing in cold wind. Soon blood flows, and everyone suffers wounds. 
> Before the wind strengthens further, the exploration team retreats.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"!s5": 1, "!is": 2000013, "r1:s1.生存+s1.战斗+s6.战斗+s7.生存+s7.战斗>=": [5, 5]}`:** *Woven Passage*
> [s1.name] meticulously prepares with chains, sickles, and heavy iron gloves. You bind swaying bladed grass with cut sturdy leaves, methodically clearing a path into the plain's depths.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"!s5": 1, "!is": 2000013, "r1:s1.生存+s1.战斗+s6.战斗+s7.生存+s7.战斗>=": [5, 5], "r2:s2.魔力+s2.魅力+s7.魔力+s7.魅力<": [5, 5]}`:** *Freezing Spirits*
> Supernatural cold descends. Reaching for exorcism talismans, the team discovers their fingers already frozen. 
> "Leave! Abandon this place where nobility rests! Or suffer our eternal punishment!" 
> These frost spirits seem cursed to forever experience their oath-breaking coldness... Whatever their crimes, they now block your expedition.

<!-- settlement_extre[3] -->
**Outcome — success, condition `{"!s5": 1, "!is": 2000013, "r1:s1.生存+s1.战斗+s6.战斗+s7.生存+s7.战斗>=": [5, 5], "r2:s2.魔力+s2.魅力+s7.魔力+s7.魅力>=": [5, 5]}`:** *Spectral Blindness*
> [s2.name] anoints everyone with goat oil, making your expedition appear as wild animals to vengeful spirits. Enduring bone-chilling cold, explorers slip past wandering ghosts into long-untrodden hills... 
> Where stars shine with extraordinary brilliance.

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"!s5": 1, "!is": 2000013, "r1:s1.生存+s1.战斗+s6.战斗+s7.生存+s7.战斗>=": [5, 5], "r2:s2.魔力+s2.魅力+s7.魔力+s7.魅力>=": [5, 5], "r3:s3.智慧+s3.隐匿+s7.智慧+s7.隐匿<": [5, 5], "counter.7000523<": 1}`:** *Starlight Secrets*
> The expedition finds nothing; the open hills offer only the sky... stars... stars... stars... A peculiar place indeed.

<!-- settlement_extre[5] -->
**Outcome — success, condition `{"!s5": 1, "!is": 2000013, "r1:s1.生存+s1.战斗+s6.战斗+s7.生存+s7.战斗>=": [5, 5], "r2:s2.魔力+s2.魅力+s7.魔力+s7.魅力>=": [5, 5], "r3:s3.智慧+s3.隐匿+s7.智慧+s7.隐匿<": [5, 5], "counter.7000523>=": 1}`:** *Starlight Secrets*
> The expedition finds nothing; the open hills offer only the sky... stars... stars... stars... A peculiar place indeed.

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"s5": 1}`:** *Cleansing Fire*
> Using [s5.name]'s power, you ignite this haunted wasteland. Sharp dry grass burns wildly, occasionally erupting into towering flame pillars accompanied by ghostly wails.
> No sane person would enter until everything becomes ash.

<!-- settlement_extre[7] -->
**Outcome — failure, condition `{"s5": 1, "!is": 2000013, "r3:s3.智慧+s3.隐匿+s7.智慧+s7.隐匿<": [5, 5]}`:** *Starlight Secrets*
> Among ash-covered hills, the expedition finds nothing; the open hills offer only the sky... stars... stars... stars... A peculiar place indeed. At least the fire destroyed everything, eliminating future exploration value.

<!-- settlement_extre[8] -->
**Outcome — success, condition `{"!is": 2000013, "any": {"all": {"!s5": 1, "r1:s1.生存+s1.战斗+s6.战斗+s7.生存+s7.战斗>=": [5, 5], "r2:s2.魔力+s2.魅力+s7.魔力+s7.魅力>=": [5, 5]}}, "r3:s3.智慧+s3.隐匿+s7.智慧+s7.隐匿>=": [5, 5]}`:** *Starlit Treasures*
> Like lifting a veil, [s3.name] unravels the starlight's mystery - discovering secrets hidden in plain sight: female personal items including precious but aged clothes and footwear. They belonged to someone noble who removed these garments on this hill, carefully folding and arranging them. What happened next remains unknown.

<!-- settlement_extre[9] -->
**Outcome — failure, condition `{"!s5": 1, "is": 2000013, "r3:s3.智慧+s3.隐匿+s7.智慧+s7.隐匿<": [5, 5]}`:** *Whispers of the Plains*
> When the Roaming Swordsman first set foot on these plains, you all felt the change in the air. 
> The wind carried whispers, spectral wails filled the night, and the Sharp Grass made that unsettling sound - like countless blades clashing in battle. 
> Without hesitation, he drew his ancient sword - and like a key turning in a lock, silence fell. The iron-strong Sharp Grass bowed to the earth like obedient servants... The spirits dissolved into mist with satisfied moans, mingling with the plains' frost before rushing eagerly toward his ancestral blade. 
> A ritual of sacrifice, punishment, and absolution all at once. Then, as if answering some silent call, he charged madly toward the starlit hill... You saw nothing there, yet he dug like a man possessed... None dared approach - he swung that strange weapon at anyone who tried to stop him or even offer water... You had no choice but to leave him to his feverish task.

<!-- settlement_extre[10] -->
**Outcome — success, condition `{"!s5": 1, "is": 2000013, "r3:s3.智慧+s3.隐匿+s7.智慧+s7.隐匿>=": [5, 5]}`:** *Ancient Bonds*
> When the Roaming Swordsman first set foot on these plains, you all felt the change in the air.
> The wind carried whispers, spectral wails filled the night, and the Sharp Grass made that unsettling sound - like countless blades clashing in battle.
> Without hesitation, he drew his ancient sword - and like a key turning in a lock, silence fell. The iron-strong Sharp Grass bowed to the earth like obedient servants... The spirits dissolved into mist with satisfied moans, mingling with the plains' frost before rushing eagerly toward his ancestral blade.
> A ritual of sacrifice, punishment, and absolution all at once. Then, as if answering some silent call, he charged toward that empty hill... The stars seemed to punish him, hiding what he sought as he dug desperately among stones and wild grass, his hands bloody and tears streaming...
> You, unable to watch his suffering any longer, revealed what had been hidden from him - women's belongings lying there all along: fine but weathered garments and shoes... They must have belonged to someone of noble birth who had removed them on this hill, folding each piece carefully... What happened after, we can only guess.
> Like a man possessed, the swordsman fled with these seemingly worthless relics, running beneath the night sky and wailing like a child... No one could catch him.

<!-- settlement_extre[11] -->
**Outcome — branch, condition `{"s5": 1, "is": 2000013}`:** *Summoned by Ash*
> Black fragments from the burning grass and spirits danced wildly across the plains, sparks flying through the air like some terrible ceremony. 
> The nameless Roaming Swordsman had been watching silently with your expedition when suddenly - the starlight flickered through smoke and ash, revealing truths only he could see - he snapped. Cursing and weeping, he charged sword-drawn into the flames... 
> No one could stop him in time, nor did anyone dare follow him into that inferno... You all simply watched as he vanished into the wild dance of fire and ash.

<!-- settlement_extre[12] -->
**Outcome — success, condition `{"!is": 2000013, "any": {"all": {"!s5": 1, "r1:s1.生存+s1.战斗+s6.战斗+s7.生存+s7.战斗>=": [5, 5], "r2:s2.魔力+s2.魅力+s7.魔力+s7.魅力>=": [5, 5]}}, "r3:s3.智慧+s3.隐匿+s7.智慧+s7.隐匿>=": [5, 5]}`:** *Barren Grounds*
> The connection to the Homeland piqued the Sultan's interest somewhat... though he clearly scorned these spirits. After all, no matter how they haunt these plains, they could never harm their true enemy - the exalted Sultan himself. 
> Nevertheless, your courage has earned you a Conquest Card.

<!-- settlement_extre[13] -->
**Outcome — branch, condition `{"any": {"all": {"s5": 1, "is": 2000013}}}`:** *Keep Silent*
> Speak of these supernatural events linked to the Homeland at court, and you'll surely face accusations of treason and disrespect... Better not to use this adventure to break a Sultan Card.


## God-Hunting — rite `5000581` (猎神)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000581_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/God-Hunting

**Intro (EN):**
> The ritual's elegance lies in its simplicity - lure the greedy god into the vessel, block escape with darkness, counter resistance with mirrors, then slice open the vessel to release divine essence - no different from butchering livestock.

**Slot lines (EN):**
> s1: Zazie's Token
> s2: Sacrifice to entice divine incarnation - ideally the ruler's seed, otherwise a strong vessel (Physique+Magic)
> s3: The host can assist the sacrifice with their Magic and Charisma; if using the ruler's seed, no effort is needed
> s4: Cloud Master shrouds stars, preventing god escape (Magic+Survival)
> s5: Mirror Master counter curses of the Stars with reflections (Magic+Wisdom)
> s6: Knife Master harvests god's life by cutting the sacrifice's throat (Combat+Survival)
> s7: Elixir to save the sacrifice - if salvation remains your intention
> s8: 5 Gold Coins for ritual materials
> s9: Consumable
> s10: Conquest Card

**Dice line (EN):**
> Shrouding Starlight
> Your Magic and Survival determine your full dice count.
> You need at least 5 Success to trap Him.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *The Stars Shimmer*
> As [s3.name] chants the ancient invocation, arcane energy surges into [s2.name], bathing it in ethereal radiance. 
> The stars above twinkle with curiosity - after countless years, someone once again calls to the ancient star spirits. [s3.gender] summons the most powerful yet long-forgotten Highlord! 
> First arrives the caressing wind, followed by the trembling North Star. 
> Finally, cosmic darkness pierces the veil between realms, starlight transforming into luminous arrows that illuminate [s2.name], infusing it with the Highlord's essence from within.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"r1:s4.魔力+s4.生存+s9.魔力+s9.生存<": [5, 5], "s2.is": 2001021}`:** *They Detect the Trap*
> Before [s4.name] can summon clouds to obscure the stars, tiny celestial lights above chirp urgently - Great Highlord, beware deception! Their light strikes your eyes and faces like needles, disrupting the ritual while the glowing liquid - having barely formed a tiny humanoid - rises upward, breaches your ritual circle, and vanishes into the night.

<!-- settlement_extre[2] -->
**Outcome — failure, condition `{"r1:s4.魔力+s4.生存+s9.魔力+s9.生存<": [5, 5], "!s2.is": 2001021}`:** *They Detect the Trap*
> Before [s4.name] can summon clouds to obscure the stars, tiny celestial lights above chirp urgently - Great Highlord, beware deception! Their light strikes your eyes and faces like needles, disrupting the ritual while [s2.name] releases a pitiful shriek. [s2.gender(his,her)] body begins to glow and expand into a glass-like humanoid, overturning everyone nearby before rising into the whirling winds and vanishing into the night.

<!-- settlement_extre[3] -->
**Outcome — success, condition `{"r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5]}`:** *Silent Witnesses*
> [s2.name] begins expanding and glowing, transforming into semi-transparent glass. The Highlord enters this new body, confused yet eager, while the tiny stars above witness the butcher's knife lurking behind Him. They desperately attempt warning their elder sibling, but [s4.name]'s summoned clouds obscure them - such is the fate of star spirits bewitched by the mortal realm.

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "r2:s5.魔力+s5.智慧+s9.魔力+s9.智慧>=": [5, 5]}`:** *Blind Divinity*
> The luminous Star attempts to summon powers - wind, starlight, darkness - all severed by your ritual. They begin desperate flickering and shrieking, intent on shredding your sacrilegious souls with Their madness.
> At the critical moment, [s5.name] raises the mirror, forcing the god to confront Their ugliness - the decayed form poisoned by human desires. Their sorrow, lamentation, and curses all reflect back upon Himself.

<!-- settlement_extre[5] -->
**Outcome — success, condition `{"r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "r2:s5.魔力+s5.智慧+s9.魔力+s9.智慧<": [5, 5]}`:** *Crimson Marks*
> The luminous Highlord attempts to summon powers - wind, starlight, darkness - all severed by your ritual. They begin desperate flickering and shrieking, intent on shredding your sacrilegious souls with Their madness. 
> Only now do you understand - this god, poisoned by human desires, once absorbed too much to return to Their realm yet remains too hungry to fully manifest in the mortal world. The collective desires and thoughts crawl beneath your skin like venomous insects, sharing the god's suffering - but the ritual hasn't failed! Hold fast!

<!-- settlement_extre[6] -->
**Outcome — success, condition `{"r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "r3:s6.战斗+s6.生存+s9.战斗+s9.生存>=": [3, 5], "s2.is": 2001021}`:** *Divine Sacrifice*
> [s6.name] skewered through the just-puffed, baby-sized Highlord, [s6.gender]'s move was precise and deadly, like filleting a fish flawlessly, without a scale hindering the blade, nor giving the prey undue pain. This between-real-and-mirage Body shriveled away; every deity must know this cost — becoming mortal, they lose immortality, can be killed, just as any life can die.

<!-- settlement_extre[7] -->
**Outcome — success, condition `{"r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "!s2.is": 2001021, "r3:s6.战斗+s6.生存+s9.战斗+s9.生存>=": [3, 5]}`:** *Bloodletting*
> [s6.name] cut [s2.name]'s throat precisely, the smooth wound, the divine power just infused into [s2.gender]'s Body flows as azure Aether... All deities must know this cost — becoming mortal, they lose immortality, can die, just like most life dies, died insignificantly.

<!-- settlement_extre[8] -->
**Outcome — success, condition `{"r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "r3:s6.战斗+s6.生存+s9.战斗+s9.生存<": [3, 5]}`:** *Meaningless Violence*
> The sacred incarnation Ritual caused [s6.name] panic. [s6.gender]'s knife-hand trembled, the first stab missed the vital point, then the Highlord's struggle forced [s6.gender] to thrust repeatedly... The Highlord perished, but divine power dissipated in such struggle... All deities must know this cost — becoming mortal, they lose immortality, will die, as most life dies, meaningless and in vain.

<!-- settlement_extre[9] -->
**Outcome — success, condition `{"!s2.is": 2001021, "r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "r3:s6.战斗+s6.生存+s9.战斗+s9.生存>=": [3, 5], "s7": 1}`:** *Channel Only*
> As the final drop of divine blood drains, you swiftly pour Water of Life into [s2.name]'s open throat. Thanks to the perfect incision, flesh heals flawlessly - the god's remarkable journey through this vessel bestows [s2.gender(him,her)] with special gifts.

<!-- settlement_extre[10] -->
**Outcome — success, condition `{"!s2.is": 2001021, "r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "r3:s6.战斗+s6.生存+s9.战斗+s9.生存>=": [3, 5], "!s7": 1}`:** *One-Time Channel*
> As the final drop of divine blood drains, [s2.name]'s throat remains open - we knew from the beginning [s2.gender(he,she)] wouldn't survive, didn't we? At least [s2.gender] completed their purpose.

<!-- settlement_extre[11] -->
**Outcome — success, condition `{"s10": 1, "r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "counter.7000585<": 1}`:** *You break a Sultan Card in an extremely unclean moment*
> You've murdered a god... the Sultan's Game witnesses this achievement. As the card snaps, through the messy stains, you glimpse an exalted vision - a crown destined for the King of Kings, the world-ruling God. In ancient times, a god was judged evil and banished for unauthorized world-alteration - now, through game-created stains and your vision, Their name will be sanctified anew, returning once more.

<!-- settlement_extre[12] -->
**Outcome — success, condition `{"s10": 1, "r1:s4.魔力+s4.生存+s9.魔力+s9.生存>=": [5, 5], "counter.7000585>=": 1}`:** *You break a Sultan Card in an extremely unclean moment*
> You've murdered a god... the Sultan's Game witnesses this achievement.


## News in the Bathhouse — rite `5001501` (浴场里的消息)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001501_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sultan%27s_Nipple_Chains#Bathhouse_Game

**Intro (EN):**
> The warm flow of water soothes your tense nerves. In these moments of fatigue and relaxation, people are always more likely to let slip their secrets. Here, you can gather all kinds of rumors, as well as tales of unrest often dismissed by nobles with disdain – stories of bandits, adventurers, and demons.

**Slot lines (EN):**
> s1: You can personally make the trip, or send any noble follower to the bathhouse.
> s2: Entry fee is 1 Gold Coin, unless you have a Bath VIP Card.
> s3: Certain items can be useful for chatting and probing.

**Dice line (EN):**
> If something or someone hasn't been discussed in the Bathhouse, it just doesn't exist. It's time to test your Charisma and Sociability.
> Your Charisma and Sociability determine your full dice count.
> You need at least 1 Success to have a chance of getting the information.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s1.鳄鱼": 1}`:** *Where's My Water*
> You brought the Little Crocodile to the Bathhouse just for fun, since it wasn't big enough to swallow a person yet! The Little Crocodile seemed happy too...
>
> What you didn't anticipate was that someone, while you were turned around, slipped... certain vital parts into the Little Crocodile's mouth. He didn't die immediately, but amidst his screams and the blood causing chaos, at least three people were trampled to death...

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"s1.主角": 1, "s3.is": 2000680, "counter.7000361<": 1}`:** *Madness, Sickness, and Taboos*
> You mashed together oil and exotic fermented ingredients, binding the mixture to your groin and thighs with bandages. In the bathhouse, the stench was unbearable. Horror filled every face as people recoiled from you. Despite your insistence that it was just a small problem, the bathers fled in panic. Days later, word spread throughout the court that you had contracted a filthy disease. Some even claimed their own rashes came from merely sharing the bath with you.
>
> The Sultan was very pleased with the farce – after all, who would fear a man whose groin was seemingly rotting away?

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [3, 5]}`:**
> You don't know why you always hear about various things; maybe it's because people don't mind you walking up to them.

<!-- settlement[1] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [2, 5]}`:**
> The sauna is crowded with people trying to talk to you; there's no need to pour water on the copper basin anymore.

<!-- settlement[2] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [1, 5]}`:**
> You couldn't get a word in and only occasionally got some fragmented news while pouring water on the copper basin in the sauna.

<!-- settlement[3] -->
**Outcome — failure, condition `{"r1:魅力+社交<": [1, 5]}`:**
> You didn't get any news; you just had an ordinary bath.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [1, 5]}`:**
> During your conversation with everyone, you unexpectedly learned about a matter that needs attention.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s1.is": 2000019}`:**
> The chitchat in the Bathhouse inspired Jenna's jewelry design.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"counter.7000117<": 6}`:**
> The stares of people pierce your exposed skin. Even soaking in warm water, you can feel them, like a fisherman's thrown spears and ropes. When you rise from the pool, there is a feeling of more and more things tugging and pulling at you, like a voyaging ship pulling at a whale it is hunting.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"counter.7000117>=": 6, "counter.7000200<": 39}`:**
> Something noteworthy has happened.

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s1.妻子": 1, "counter.7000166>=": 1, "have.2000061.追随者": 1, "counter.7000167<": 1}`:**
> When Maggie enters the bathhouse, she finds Adila sitting alone in the bath. The horrifying scars on Adila’s back have kept the other noblewomen from speaking to her. But as your wife, Maggie is not afraid of such things. She sits beside Adila and warmly praises her for her bravery as a warrior, as well as the graceful beauty of her figure. Her words earn Adila’s affection and respect. They agree to bathe together next time and plan to help each other care for their bodies with essential oils and delicate threads.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s1.妻子": 1, "counter.7100004>=": 11, "counter.7000222<": 1}`:** *Dispute in the Bathhouse*
> Your wife encounters some trouble in the bathhouse...

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"s1.君王的胸襟": 1}`:** *Won't Float*
> When [s1.name] disrobed, that cursed familiar golden chain upon [s1.gender(his,her)] chest drew furtive glances and averted eyes, spawning increasingly outrageous rumors that slowly dispersed in the steam.


## The Most Popular Man — rite `5000795` (最受欢迎的男人)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000795_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/The_Most_Popular_Man

**Intro (EN):**
> After showing Nabhani a carnal card, he mysteriously told you to dress up well and meet him at the House of Delights that day.

**Slot lines (EN):**
> s1: The mysterious masked guest
> s2: Well-groomed Nabhani
> s3: You must attend in person, and it's best to dress up splendidly
> s4: Certain consumables can be helpful

**Dice line (EN):**
> You scrutinize the masked guest...
> The number of dice, determined by your Wisdom and Stealth, is influenced by the masked man’s Stealth.
> You need at least 3 Successes to see through his identity.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *Today's House of Delights Seems a Little Different*
> The patrons are dressed brightly and elaborately, with the men's hair covered in rose water and shining longswords encrusted in ancestral jewels, while the Ladies of Delights sit behind veils, concealing their faces like noblewomen.
>
> "Ladies and gentlemen!" Buthayna, the elderly mistress of the House of Delights, came out, "Today we are choosing the most popular man, the one closest to the ladies' hearts, the one who qualifies to enjoy the greatest pleasure!"
>
> The men stir, sizing each other up... Eventually, all eyes focus on three individuals – you, Nabhani, and a masked noble guest.
>
> Today, Nabhani wear the Iron Guard's uniform, a few braids mix with his loose hair, each adorn with large garnets matching his honey-colored hair, keeping all women's eyes on him.
>
> As for the masked guest... How strange, why wear a mask in such a setting?

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r1:s3.智慧+s3.隐匿-s1.隐匿>=": [3, 5]}`:** *Now You See the Truth...*
> All other patrons are familiar faces, except him... You carefully observe this man hidden by a mask, his face completely covered.
> Finally, your gaze sweep over the large familiar gemstone ring on his finger... It's... Suddenly, you break into a cold sweat.
> He's the Sultan himself! ...Why would he...? 
> At this point, the masked guest notices you are watching him; he turns and looks at you, seemingly smiling. However, before you can react, Buthayna's clapping interrupts your thoughts.

<!-- settlement_extre[2] -->
**Outcome — failure, condition `{"r1:s3.智慧+s3.隐匿-s1.隐匿<": [3, 5]}`:** *The mask he wears covers his entire face*
> All other patrons are familiar faces, except him. You rack your brains but can't recall where you've seen this person...
> Before you have time to draw any conclusions, Buthayna's clapping interrupts your thoughts.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{}`:**
> "All our guests today are the most popular in the House of Delights. Of course, most of you don't use real names here; everyone has the right to seek pleasure, and we certainly won't pry... But charisma! A man's charisma! It's not just what's between his legs, but also his how deep the depth of his eyes, how ironclad his heart, how well his fingers move for women! These are a man's most precious assets!"
>
> Her hoarse voice echos within the House of Delights, drawing giggles from the girls beyond the veils.
> "Hence! Let the ladies be the judges, shall we? Whoever has the most ladies of delight around him will become the most popular man in the House of Delights!"
>
> The veil is drawn back, and the women flood out like a tide, each moving towards their favorite patron...

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"r1:s3.智慧+s3.隐匿-s1.隐匿>=": [3, 5], "f:s1.魅力-s3.魅力-s4.魅力>=": 0, "f:s1.魅力-s2.魅力>=": 0}`:** *Beauties Flock to the Masked Guest*
> While quite a few surround you and Nabhani, it is still the masked guest who has the most ladies at his side.
> Buthayna claps her hands, loudly congratulating the masked guest for winning.
>
> Buthayna hands the golden key to the masked guest: "This is the highest pleasure," she says, "This is the key to the backyard of the House of Delights, where there's pool, plenty of cushions, and fountains overflowing with wine... As the most popular man, you have the right to host a party of frivility and pleasure there. All ladies of delight will attend, and you decide which male guests to invite."
>
> Silence descends suddenly, then come the cheers – men cluster around the masked guest, begging to be taken along. Dismissively, he shakes them off, lead girls by the hand, and ducks into the veils.
>
> Next, the Sultan will enjoy his game. You feel slightly relieved...

<!-- settlement_extre[5] -->
**Outcome — failure, condition `{"r1:s3.智慧+s3.隐匿-s1.隐匿<": [3, 5], "f:s1.魅力-s3.魅力-s4.魅力>": 0, "f:s1.魅力-s2.魅力>=": 0}`:** *Beauties Flock to the Masked Guest*
> While quite a few surround you and Nabhani, it is still the masked guest who has the most ladies at his side.
> Buthayna claps her hands, loudly congratulating the masked guest for winning.
>
> Buthayna hands the golden key to the masked guest: "This is the highest pleasure," she says, "This is the key to the backyard of the House of Delights, where there's pool, plenty of cushions, and fountains overflowing with wine... As the most popular man, you have the right to host a party of frivility and pleasure there. All ladies of delight will attend, and you decide which male guests to invite."
>
> Silence descends suddenly, then come the cheers – men cluster around the masked guest, begging to be taken along. Dismissively, he shakes them off, lead girls by the hand, and ducks into the veils.
>
> Next, the Sultan will enjoy his game.

<!-- settlement_extre[6] -->
**Outcome — success, condition `{"r1:s3.智慧+s3.隐匿-s1.隐匿>=": [3, 5], "f:s3.魅力+s4.魅力-s1.魅力>": 0, "f:s3.魅力+s4.魅力-s2.魅力>=": 0}`:** *You're the One Surrounded by the Most Girls*
> Perhaps it's tenderness, handsomeness, or possibly the madness that makes you particularly charming...
> After counting, Buthayna cheerfully hands you the key.
> "This is the highest pleasure," she says, "This is the key to the backyard of the House of Delights, where there's a pool, plenty of cushions, and fountains flowing with wine... As the most popular man, you have the right to host a party of pursuit and pleasure there. All ladies of delight will attend, and you decide which male guests to invite."
> A hush fell, then erupted into cheers—men pressed close, begging to be chosen.
> Suddenly, the masked guest next to you raised a hand.
> "I propose, [player.name], to give this key to me."
> The crowds are astonished, turning their eyes to him. Nabhani stands angrily...
> But soon, the Iron Guard's gaze falls on the ring, or rather, the Sultan subtly twists the ring, silently asserting his identity. Nabhani can possibly recognize his master; his face turns pale, looking between you and the Sultan.
> The Sultan wants to be the host of this decadent party, so what's your choice?

<!-- settlement_extre[7] -->
**Outcome — failure, condition `{"r1:s3.智慧+s3.隐匿-s1.隐匿<": [3, 5], "f:s3.魅力+s4.魅力-s1.魅力>=": 0, "f:s3.魅力+s4.魅力-s2.魅力>=": 0}`:** *You're the One Surrounded by the Most Girls*
> Perhaps it's tenderness, handsomeness, or possibly the madness that makes you particularly charming...
>
> After counting, Buthayna cheerfully hands you the key.
> "This is the highest pleasure," she says, "This is the key to the backyard of the House of Delights, where there's a pool, plenty of cushions, and fountains flowing with wine... As the most popular man, you have the right to host a party of pursuit and pleasure there. All ladies of delight will attend, and you decide which male guests to invite."
>
> Suddenly, the masked guest next to you raised a hand.
> "I propose, [player.name], to give this key to me."
> The crowds are astonished, turning their eyes to him. And you are so dizzy with the girls' pressing bodies that you refuse him without hesitation...

<!-- settlement_extre[8] -->
**Outcome — success, condition `{"r1:s3.智慧+s3.隐匿-s1.隐匿>=": [3, 5], "f:s2.魅力-s1.魅力>": 0, "f:s2.魅力-s3.魅力-s4.魅力>": 0}`:** *Nabhani is surrounded by girls, leaving no space for a fly to get through*
> "It seems we have a winner!" Buthayna laughs, approaching wearing a smile, "Perhaps I didn't need this competition and could crown you directly, right, Lord Nabhani?"
>
> The crowd erupts with joy, as you wipe the cold sweat from your brow – the Sultan is not declared the most popular man, but his Iron Guard won...
>
> Buthayna hands a small golden key to Nabhani.
>
> "This is the highest pleasure," she says, "This is the key to the backyard of the House of Delights, where there's a pool, plenty of cushions, and fountains flowing with wine... As the most popular man, you have the right to host a party of pursuit and pleasure there. All ladies of delight will attend, and you decide which male guests to invite."
>
> Quiet descends suddenly, then come the cheers—men cluster around Nabhani, pleading to be taken along.
> Suddenly, the masked guest next to you raises a hand: "I propose, Nabhani, to give this key to me."
>
> The crowd is surprised, turning their eyes to him.
> Nabhani furrows his brow at the suggestion – wait a minute, he still hasn't realized the masked guest's identity.

<!-- settlement_extre[9] -->
**Outcome — failure, condition `{"r1:s3.智慧+s3.隐匿-s1.隐匿<": [3, 5], "f:s2.魅力-s1.魅力>": 0, "f:s2.魅力-s3.魅力-s4.魅力>": 0}`:** *Nabhani is surrounded by girls, leaving no space for a fly to get through*
> "It seems we have a winner!" Buthayna laughs, approaching wearing a smile, "Perhaps I didn't need this competition and could crown you directly, right, Lord Nabhani?"
> The crowd erupts with joy, but Buthayna hands a small golden key to Nabhani.
> "This is the highest pleasure," she says, "This is the key to the backyard of the House of Delights, where there's pool, plenty of cushions, and fountains overflowing with wine... As the most popular man, you have the right to host a party of frivility and pleasure there. All Ladies of Delights will attend, and you decide which male guests to invite."
> Quiet descends suddenly, then come the cheers - men cluster around Nabhani, pleading to be taken along.
> Suddenly, the masked guest next to you raises a hand: "I propose, Nabhani, to give this key to me."
> The crowd is surprised, turning their eyes to him. Nabhani laughs heartily: "Brother, sorry, a bet's a bet!" He shakes the golden key between his fingers, swaggers, and heads to the backyard with several Ladies of Delights...


## Matchmaker — rite `5008060` (证婚人)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008060_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Fardak#First_Sight, https://sultansgame.wiki.gg/wiki/Lumera#Marriage

**Intro (EN):**
> Marriage can also bring happiness. With this in mind, you volunteered to help Fardak find a suitable wife and bring them together...

**Slot lines (EN):**
> s1: You can introduce a marriage partner that you consider suitable for Fardak

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1.is": 2000123}`:** *Lumera, what do you think of him?*
> You call Lumera and tell her about Fardak, then ask about her opinion.
>
> Lumera's clear eyes stare at you, without a hint of girlish shyness or hesitation: "If that's your wish, I'll marry him," she says, "but I'm just a beggar; how could I deserve a noble?"
>
> Oh well, if Lumera agrees, then this is not a problem... You ponder that as long as your influence is high enough, persuading others that Lumera is your adopted daughter will naturally give her noble status.
>
> As for Fardak, how dare he even be dissatisfied with Lumera?!

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1.妻子": 1}`:** *You Better Be Joking*
> Before you finished speaking, Maggie slapped you.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s1.is": 2000062, "!s1.侧室": 1}`:** *How about Fatuna?*
> She has a child, but undeniably, she's both beautiful and wealthy, coveted by many men.
>
> However, upon hearing this, Fardak's face turns red, "How... how can this be? I've dined with the lady's son, sparred with him, hunted with him, this... this isn't appropriate."
>
> You imagine that scene; it does seem a bit awkward...

<!-- settlement[3] -->
**Outcome — branch, condition `{"s1.is": 2000062, "s1.侧室": 1}`:** *How about Fatuna?*
> Before you finish speaking, Fardak's face turns red. "But she... she's your wife!" he exclaims. Unable to continue, he hastily bids you farewell.
>
> You think to yourself: this guy – if you don't mind, what's he so concerned about?

<!-- settlement[4] -->
**Outcome — branch, condition `{"s1.is": 2000055, "counter.7000440<": 1}`:** *How about Nayla?*
> "But she has a husband! Please, don't make fun of me anymore!" Fardak replies loudly, his face reddening, rejecting your suggestion and leaving without finishing his tea.

<!-- settlement[5] -->
**Outcome — branch, condition `{"s1.is": 2000055, "!s1.新妻": 1, "counter.7000440>=": 1}`:** *How about Nayla?*
> Nayla's beauty is undeniable. With a face like that, who cares about anything else, right...?
>
> Fardak jumps back like he's been stung, frantically waving his hands and spouting a string of lofty excuses – things like how he's not worthy of her or how such a delicate flower would only suffer if she were with him. But finally, after you press him hard enough, he cracks. He confesses, utterly defeated, that he can't handle the way this fine lady carries herself. "In the market, you can't even walk five minutes without bumping into ten guys who've slept with her! Ten guys – not ten times, ten different guys!"

<!-- settlement[6] -->
**Outcome — branch, condition `{"s1.is": 2000055, "s1.新妻": 1}`:** *How about Nayla?*
> Before you finish speaking, Fardak's face turns red. "But she... she's your wife!" he exclaims. Unable to continue, he hastily bids you farewell.
>
> You think to yourself: this guy – if you don't mind, what's he so concerned about?

<!-- settlement[7] -->
**Outcome — branch, condition `{"s1.is": 2000352}`:** *How about Mahir?*
> Fardak is still hesitating, so you drag him along to see Mahir.
>
> You explain your intentions extensively, and Mahir keeps her eyes fixed on the strange liquid-filled flask in her hand, responding quickly: "If he can beat me in a prime number challenge, it's fine."
>
> "What's a prime number?" Fardak asks, looking confused.
>
> Mahir shrugs, not bothering to explain. It seems this marriage won't work.

<!-- settlement[8] -->
**Outcome — branch, condition `{"s1.is": 2000061}`:** *How about Adila?*
> Fardak racks his brain, then cautiously asks: "You mean the woman who crushed that stone statue at the bathhouse? With just one hand?"
>
> You scratch your head, falling into silence. Your survival instinct tells you it's better not to bring up this incident with Adila...

<!-- settlement[9] -->
**Outcome — branch, condition `{"s1": 1, "!s1.is": 2000352, "!s1.妻子": 1}`:** *How about [s1.name]?*
> Whether it's appearance, identity, status, wealth, or character... in general, this person is not very suitable.


## Adventurer's Tavern — rite `5008123` (冒险者酒吧)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008123_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse#Adventurer_s_Tavern

**Intro (EN):**
> Adventurers spend their idle time here boasting and chatting. You can provide them with any sponsorship or talking points... or nothing at all - they'll find their own entertainment, especially after eating at Habib's.

**Slot lines (EN):**
> s1: Idle adventurers
> s2: What will you offer them?

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.金币<=": 5, "s2.金币>=": 1}`:**
> You pay for a renowned martial arts master. The adventurers set down their mugs reluctantly.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.金币>": 5}`:**
> You pay for a renowned martial arts master. The adventurers set down their mugs reluctantly, but draw their swords faster than anyone - such opportunities are rare.

<!-- settlement[2] -->
**Outcome — branch, condition `{"counter.7000516<": 1, "any": {"s2.is": 2000412}}`:**
> This is just how taverns work - whatever you say, some fool will believe it.

<!-- settlement[3] -->
**Outcome — branch, condition `{"counter.7000518<": 1, "any": {"s2.is": 2000541}}`:**
> The spirit of rebellion runs deep in adventurers' bones. You barely begin speaking before they erupt in excitement.

<!-- settlement[4] -->
**Outcome — branch, condition `{"counter.7000517<": 1, "any": {"s2.is": 2000728}}`:** *What the F-?*
> They shout loudly, ignoring you completely. Nevertheless, your attempt to preach here earns recognition from the Purist Order.

<!-- settlement[5] -->
**Outcome — branch, condition `{"any": {"s2.is": 2001195}}`:** *Miracle Flex*
> You use [s2.name] to save a severely wounded adventurer. Moved to tears, they give you a family heirloom.

<!-- settlement[6] -->
**Outcome — branch, condition `{"s2.情报": 1, "s2.rare=": 1}`:** *Same, Bro!*
> Amid endless discussion and arguments, in topics branching without end, you eventually gather more information - though perhaps not what you initially sought.

<!-- settlement[7] -->
**Outcome — branch, condition `{"s2.情报": 1, "s2.rare=": 2}`:** *Same, Bro!*
> Amid endless discussion and arguments, in topics branching without end, you eventually gather more information - though perhaps not what you initially sought.

<!-- settlement[8] -->
**Outcome — branch, condition `{"s2.情报": 1, "s2.rare=": 3}`:** *Same, Bro!*
> Amid endless discussion and arguments, in topics branching without end, you eventually gather more information - though perhaps not what you initially sought.

<!-- settlement[9] -->
**Outcome — branch, condition `{"s2.情报": 1, "s2.rare=": 4}`:** *Let's Roll!*
> The adventurers use existing intelligence to embark on their quest, returning successful. To thank you, they share ten Gold Coins.


## Religious Leader's Privilege — rite `5010044` (教领的特权)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5010044_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Religious_Leader%27s_Privilege

**Intro (EN):**
> Enjoy the reward the god grants their servant... though unwrapping it requires effort.

**Slot lines (EN):**
> s1: Aether of the True Faith
> s2: Who to send for Aether
> s3: Who to send for Aether
> s4: Who to send for Aether
> s5: Consumables that help collect Aether
> s6: The Vault of the True Faith
> s7: Who to send for Gold Coins
> s8: Who to send for Gold Coins
> s9: Who to send for Gold Coins
> s10: Consumables that help collect Gold Coins

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1": 1, "f:s2.社交+s2.魅力+s3.社交+s3.魅力+s4.社交+s4.魅力+s5.社交+s5.魅力>=": 25, "s2.污染者": 1}`:** *The Destroyer Surprise*
> Now this is privilege! Bringing a cultist into the Purist's sanctuary! Badriyyah giggles, praising your wisdom while entering this sapphire-like pool... Let this mortal woman soil the nectar prepared for the gods!
> She removes her garments one by one; the fabrics quickly dissolve like ink in the azure pool... Then her tattoos begin fading - you've never seen her like this, naked and clean.
> When her hair begins falling out, she smilingly prevents anyone from approaching, mischievously pressing her lower abdomen... Urine and blood flow down her legs into the pool, followed by nails, teeth, peeling skin and organs - black organs.
> As her final skeleton collapses and dissolves in the pool, the formerly sapphire-clear water has become pitch-black, churning with foul bubbles... You quickly lock the vault doors securely, which still bear murals depicting the Purist drinking from the Aether pool! Better make sure nobody discovers what's happened to it before that fated day arrives...

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s1": 1, "f:s2.社交+s2.魅力+s3.社交+s3.魅力+s4.社交+s4.魅力+s5.社交+s5.魅力>=": 25, "s3.污染者": 1}`:** *The Destroyer Surprise*
> Now this is privilege! Bringing a cultist into the Purist's sanctuary! Badriyyah giggles, praising your wisdom while entering this sapphire-like pool... Let this mortal woman soil the nectar prepared for the gods!
> She removes her garments one by one; the fabrics quickly dissolve like ink in the azure pool... Then her tattoos begin fading - you've never seen her like this, naked and clean.
> When her hair begins falling out, she smilingly prevents anyone from approaching, mischievously pressing her lower abdomen... Urine and blood flow down her legs into the pool, followed by nails, teeth, peeling skin and organs - black organs.
> As her final skeleton collapses and dissolves in the pool, the formerly sapphire-clear water has become pitch-black, churning with foul bubbles... You quickly lock the vault doors securely, which still bear murals depicting the Purist drinking from the Aether pool! Better make sure nobody discovers what's happened to it before that fated day arrives...

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s1": 1, "f:s2.社交+s2.魅力+s3.社交+s3.魅力+s4.社交+s4.魅力+s5.社交+s5.魅力>=": 25, "s4.污染者": 1}`:** *The Destroyer Surprise*
> Now this is privilege! Bringing a cultist into the Purist's sanctuary! Badriyyah giggles, praising your wisdom while entering this sapphire-like pool... Let this mortal woman soil the nectar prepared for the gods!
> She removes her garments one by one; the fabrics quickly dissolve like ink in the azure pool... Then her tattoos begin fading - you've never seen her like this, naked and clean.
> When her hair begins falling out, she smilingly prevents anyone from approaching, mischievously pressing her lower abdomen... Urine and blood flow down her legs into the pool, followed by nails, teeth, peeling skin and organs - black organs.
> As her final skeleton collapses and dissolves in the pool, the formerly sapphire-clear water has become pitch-black, churning with foul bubbles... You quickly lock the vault doors securely, which still bear murals depicting the Purist drinking from the Aether pool! Better make sure nobody discovers what's happened to it before that fated day arrives...

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s1": 1, "f:s2.社交+s2.魅力+s3.社交+s3.魅力+s4.社交+s4.魅力+s5.社交+s5.魅力>=": 25, "!s2.污染者": 1, "!s3.污染者": 1, "!s4.污染者": 1}`:** *Divine Astonishment*
> A madwoman claimed she could create dancing phalluses from sacred blood - isn't that ridiculous?

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s1": 1, "any": {"s2": 1, "s3": 1, "s4": 1}, "f:s2.社交+s2.魅力+s3.社交+s3.魅力+s4.社交+s4.魅力+s5.社交+s5.魅力<": 25}`:**
> Your messengers failed to acquire Aether

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"!s1": 1, "f:s2.社交+s2.魅力+s3.社交+s3.魅力+s4.社交+s4.魅力+s5.社交+s5.魅力>=": 25}`:** *Ancient Reserves*
> Not a drop remains... You quickly secure the vault doors, still adorned with murals of Purists drinking from the Aether pool! Let no one discover the complete depletion before the appointed day!

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"f:s7.社交+s7.魅力+s8.社交+s8.魅力+s9.社交+s9.魅力+s10.社交+s10.魅力>=": 25}`:** *Noble Purposes?*
> You carefully inspect these coins for markings - what if they circulated to the House of Delights? That would ruin your reputation!

<!-- settlement_extre[7] -->
**Outcome — branch, condition `{"any": {"s7": 1, "s8": 1, "s9": 1}, "f:s7.社交+s7.魅力+s8.社交+s8.魅力+s9.社交+s9.魅力+s10.社交+s10.魅力<": 25}`:**
> The person you sent couldn't collect Gold Coins

<!-- settlement_extre[8] -->
**Outcome — branch, condition `{}`:** *Divine Bounty*
> The Purist Order's accumulated wealth spans centuries, inexhaustible... Your only constraint is time itself.


## The Star's Contract — rite `5000579` (星神的契约)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000579_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/The_Star%27s_Contract

**Intro (EN):**
> With seed to attract the Highlord... you could conduct your own ritual to summon Him. Whether dealing with abyssal demons or Star-Souled, such rituals share a core principle - trap the target, then negotiate.

**Slot lines (EN):**
> s1: Zazie's Token
> s2: The Highlord's perpetual desire, a summoning medium
> s3: Sacrifice to entice divine incarnation - perhaps also part of the bargain (Physique+Charisma)
> s4: The host illuminates the sacrifice, guiding the god's path (Magic+Charisma)
> s5: Use Magic to maintain the barrier, trapping the summoned entity
> s6: Use Magic to maintain the barrier, trapping the summoned entity
> s7: Use Magic to maintain the barrier, trapping the summoned entity
> s8: Consumable
> s9: Perhaps this allows your inner god to speak with theirs

**Dice line (EN):**
> You attempt to trap Him
> Your Magic determines your full dice count.
> You need at least 8 Success to trap Him.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *The Stars Shimmer*
> As [s3.name] chants the ancient invocation, arcane energy surges into the vial of seeds, bathing it in ethereal radiance. 
> The stars above twinkle with curiosity - after countless years, someone once again calls to the ancient star spirits. [s3.gender] summons the most powerful yet long-forgotten Highlord! 
> First arrives the caressing wind, followed by the trembling North Star. 
> Finally, cosmic darkness pierces the veil between realms, starlight transforming into luminous arrows that illuminate the dragon seed and the vessel prepared for Him, infusing it with the Highlord's essence from within.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r1:s5.魔力+s6.魔力+s7.魔力+s8.魔力>=": [8, 5]}`:** *The Body is a Trap*
> That seed, under starlight's glow, gradually coalesces into a tiny humanoid form. Along the starlight path, They will enter the prepared vessel through its left eye... In this moment, the spellcasters simultaneously utter true words, completing the binding of this god - They has accepted the sacrifice, and now, the time of covenant has come.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"r1:s5.魔力+s6.魔力+s7.魔力+s8.魔力>=": [8, 5], "s3.主角": 1, "!s9": 1}`:** *Shared Captivity*
> A god has entered your soul... They sees all that you are and has fallen into your web - that cruel game constructed of the Magician's cards and countless victims' souls... More delightful still, you yourself cannot escape either, so regardless of what great god They once were, They cannot leave now. 
> After much arguing, complaining, cursing, persuading, deceiving... They finally accept Their fate - agreeing to lend you Their power, helping you play the Sultan's Game: at least, you have a chance to destroy the descendants of Their enemies, and even, with Their help, you might kill the Magician who endangers the world and insults the gods! 
> The only question remains... how long can your soul endure? Coexisting with a suffering god?

<!-- settlement_extre[3] -->
**Outcome — success, condition `{"r1:s5.魔力+s6.魔力+s7.魔力+s8.魔力>=": [8, 5], "s3.主角": 1, "s9.is": 2000843}`:** *Deeper Dark*
> A god has entered your soul... only to discover someone has already beaten Him to it.
> The Creator laughs maniacally at this delivered feast - the darkness They raise in your mind blots out the sky like a world-devouring maw... When everything finally settles, you rise from the ground to find everyone involved in the ritual unconscious, with no memory of what transpired.
> In your mind, that fleeting vision makes you tremble... the god lifted the veil They had always shown you in order to feed, and that was certainly not what the Creator should resemble.

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"r1:s5.魔力+s6.魔力+s7.魔力+s8.魔力>=": [8, 5], "s3.主角": 1, "s9.is": 2000847}`:** *Light That Shrouds All*
> A god has entered your soul... only to discover someone has already beaten Him to it.
> The Immaculate Purity laughs maniacally at this delivered enemy - They raise a wave of holy light in your mind, like world-destroying flames... When everything finally settles, you rise from the ground to find everyone involved in the ritual unconscious, with no memory of what transpired.
> In your mind, that fleeting vision makes you tremble... the god lifted the veil They had always shown you in order to kill, and that was certainly not what the Immaculate Purity should resemble.

<!-- settlement_extre[5] -->
**Outcome — success, condition `{"r1:s5.魔力+s6.魔力+s7.魔力+s8.魔力>=": [8, 5], "s3.主角": 1, "any": {"s9.is": 2000848}}`:** *Moths to Flame*
> A deity entered your soul... He witnessed the apocalypse. They were once the Creator's favored tools, the stars attested their achievements, and witnessed their dispersal and conflict. Now, the power once belonging to the Creator has fallen to ruin, destined to destroy the world — That is the fearsome future the stars foresee, a world without wishes, emotions, or caring for falling stars. The Highlord laments, His mind dimmed and weakened, briefly rekindled at life's last moments — He fulfills the Star-Souled's mission, striving with the last divine spark to protect this world... A meteor falls, He charges at the deity hidden within you... the being to destroy the world... With despair, igniting, screaming, pulverized. It causes no harm to the true deity, but the star's fragments indeed pierce your soul.

<!-- settlement_extre[6] -->
**Outcome — success, condition `{"r1:s5.魔力+s6.魔力+s7.魔力+s8.魔力>=": [8, 5], "!s3.主角": 1}`:** *Adapting to New Body*
> Just as you suspected, this is what happens to Zazie after she satisfies the Highlord - [s3.name]'s gaze gradually shifts, her hair slowly begins to glow... transforming into a bright, verdant hue, like summer night stars. Now, speak your wish, contemptible mortal... while the great Highlord remains trapped here by your petty tricks!

<!-- settlement_extre[7] -->
**Outcome — failure, condition `{"r1:s5.魔力+s6.魔力+s7.魔力+s8.魔力<": [8, 5]}`:** *They Detect the Trap*
> The seed, bathed in starlight, forms into a tiny humanoid figure. According to ritual, They should enter the prepared sacrifice while being bound by your ritual circle. 
> But They hesitat, sensing your insincerity. The glowing figure studies your ritual circle, discovers a flaw - and escapes through this breach like an arrow. 
> Perhaps He'll possess some nearby innocent as a temporary vessel - let us hope They finds only rats to inhabit in this wilderness!


## Admiration of Young Noble — rite `5000623` (年轻望族的仰慕)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000623_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Zaki#Admiration_of_the_Young_Noble

**Intro (EN):**
> After rigorous training, the young noble has fully committed himself to you. Now, you have the chance to shape his mind with your own ideals.

**Slot lines (EN):**
> s1: Zaki
> s2: Conviction

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.is": 2000100}`:** *We are all Sultan's toys, nothing more*
> When Zaki and you were envisioning the future, you casually said this to him and then pretentiously left. Zaki hurriedly chased after you... hoping to grasp your thoughts.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.is": 2000541}`:** *I have a dream...*
> You tell Zaki of a future where everyone can achieve happiness, no one fears unwarranted calamity, and everyone can speak freely about everything... He was deeply captivated.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s2.is": 2000171}`:** *Following me may lead to death*
> You deliberately say this to Zaki, without a doubt—every young person dreams of a glorious death, and he is no exception.

<!-- settlement[3] -->
**Outcome — branch, condition `{"s2.is": 2000172}`:** *Help me kill the Sultan*
> He can't even imagine this scene, and you speak softly, unfolding one rebellious plan after another, reshaping his soul... Now, he is also part of your plan.

<!-- settlement[4] -->
**Outcome — branch, condition `{"s2.is": 2000410}`:** *Power*
> You slowly drip the dark secret into a glass, telling him it is what he lacks, and even what his father lacks... Without hesitation, he drinks the dark remedy.

<!-- settlement[5] -->
**Outcome — branch, condition `{"s2.is": 2000411}`:** *Power*
> You slowly drip the dark secret into a glass, telling him it is what he lacks, and even what his father lacks... Without hesitation, he drinks the dark remedy.

<!-- settlement[6] -->
**Outcome — branch, condition `{"s2.is": 2000412}`:** *Power*
> You slowly drip the dark secret into a glass, telling him it is what he lacks, and even what his father lacks... Without hesitation, he drinks the dark remedy.

<!-- settlement[7] -->
**Outcome — branch, condition `{}`:** *You had a simple chat with Zaki*
> You had a pleasant chat, that's all.


## Canyon of Gales — rite `5000703` (狂风峡谷)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000703_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Canyon_of_Gales

**Intro (EN):**
> Ancient people used magic and terrain to shape the ruins here. It is perpetually windy, and the entrance of the canyon is filled with flying sand and pebbles. Statues of griffins and snakes flank the canyon, suggesting the challenges adventurers will face...
> After hearty discussion, you decide to cooperate to escort Jabal to the treasure site at the end of the canyon... if his ancestral notes are not lying, there will be a treasure.

**Slot lines (EN):**
> s1: Will the adventurous general come here this time?
> s2: You need at least 5 in Magic to part the storm and protect the expedition.
> s3: An archer, to handle lurking beasts.
> s4: A crafty adventurer with at least 4 in Survival, to handle unexpected dangers.
> s5: Someone strong enough to endure the storm, with at least 4 in Physique.
> s6: Consumable
> s7: The Beginning of Adventure

**Dice line (EN):**
> Magic to part the storm.
> [s1.name] and [s2.name]'s Magic and Charisma determine your full dice count.
> You need at least 1 Success.

<!-- settlement_extre[0] -->
**Outcome — failure, condition `{"r2:s1.体魄+s1.战斗+s3.体魄+s3.战斗+s6.体魄+s6.战斗<": [1, 5]}`:**
> The expedition team rushes into the canyon under the protection of [s2.name]'s spell, only to find a griffin nesting there, awakening to the sound of its next feast...
>  [s3.name] draws the bow and shoots, but the griffin's claws are faster. In the chaos, the team scrambles forward as each one of their comrades is torn apart...

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r2:s1.体魄+s1.战斗+s3.体魄+s3.战斗+s6.体魄+s6.战斗>=": [1, 5]}`:**
> The expedition plunges into the canyon under the protection of [s2.name]’s magic. A griffon nests here, and you are the feast that has stumbled willingly into its jaws…
>
> But [s3.name] is quick – an arrow takes its left eye. Then Jabal strikes, driving steel deep into the beast’s heart. Though it reeks of musk and carrion, the path ahead is clear now.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"r3:s4.智慧+s4.生存+s6.智慧+s6.生存>=": [1, 5]}`:**
> Amidst the black stone forest sculpted by storms, you struggle to trudge on...
> Countless snakes emerge from the shadows, slithering to catch up with you.
> At this moment, [s4.name] steps up, igniting [s4.gender(his, her)] cloak to fend off the snakes, while the rest of you hasten forward, not wasting the precious time [s4.gender] bought.

<!-- settlement_extre[3] -->
**Outcome — failure, condition `{"r3:s4.智慧+s4.生存+s6.智慧+s6.生存<": [1, 5]}`:**
> Amidst the black stone forest sculpted by storms, you struggle to trudge on...
> Countless snakes emerge from the shadows, slithering to catch up with you.
> At this moment, [s4.name] steps up, igniting [s4.gender(his, her)] cloak to fend off the snakes, while the rest of you hasten forward, not wasting the precious time [s4.gender] bought.

<!-- settlement_extre[4] -->
**Outcome — failure, condition `{"r1:s1.魔力+s1.魅力+s2.魔力+s2.魅力+s6.魔力+s6.魅力<": [1, 5], "r4:s1.体魄-1+s1.生存-1+s5.体魄+s5.生存+s6.体魄+s6.生存>=": [1, 5]}`:**
> [s2.name]’s magic is spent. Jabal vanishes into the howling dust. The rest press forward, searching for his tracks, but only smears of blood stretch into the storm.
> The wait is a slow death. The wind buries half the party before the world stills, before silence falls like a heavy shroud.
> Then – the sky clears. And there, in the distance, Jabal runs toward you, something brilliant clutched in his hands.

<!-- settlement_extre[5] -->
**Outcome — failure, condition `{"r1:s1.魔力+s1.魅力+s2.魔力+s2.魅力+s6.魔力+s6.魅力<": [1, 5], "r4:s1.体魄-1+s1.生存-1+s5.体魄+s5.生存+s6.体魄+s6.生存<": [1, 5]}`:**
> [s2.name]’s magic is spent. Jabal vanishes into the howling dust. The rest press forward, searching for his tracks, but only smears of blood stretch into the storm.
>
> At last, [s5.name] finds him beneath a slab of rock, barely conscious. [s5.name] then drags the band out of the canyon, almost dying in the process. From his sickbed, Jabal swears he will return. But you are unsure if you can afford another loss like this.

<!-- settlement_extre[6] -->
**Outcome — success, condition `{"r1:s1.魔力+s1.魅力+s2.魔力+s2.魅力+s6.魔力+s6.魅力>=": [1, 5], "r4:s1.体魄+s1.生存+s5.体魄+s5.生存+s6.体魄+s6.生存>=": [1, 5]}`:**
> [s2.name] tears the winds apart, watching as Jabal charges toward the canyon’s end. The rest stumble forward in pursuit, until a boulder falls, sundering their path.
> The wait is a slow death. The wind buries half the party before the world stills, before silence falls like a heavy shroud.
> Then – the sky clears. And there, in the distance, Jabal runs toward you, something brilliant clutched in his hands.

<!-- settlement_extre[7] -->
**Outcome — success, condition `{"r1:s1.魔力+s1.魅力+s2.魔力+s2.魅力+s6.魔力+s6.魅力>=": [1, 5], "r4:s1.体魄+s1.生存+s5.体魄+s5.生存+s6.体魄+s6.生存<": [1, 5]}`:**
> [s2.name] tears the winds apart, watching as Jabal charges toward the canyon’s end. The rest stumble forward in pursuit, until a boulder falls, sundering their path.
>
> At last, [s5.name] finds him beneath a slab of rock, barely conscious. [s5.name] then drags the band out of the canyon, almost dying in the process. From his sickbed, Jabal swears he will return. But you are unsure if you can afford another loss like this.


## Forest of the Jinn — rite `5000705` (妖精森林)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000705_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Forest_of_the_Jinn

**Intro (EN):**
> Legends say the jinn are as beautiful as they are cruel, yet many claim to have won the Jinn Queen's treasures through wit and deceit... Jabal’s notes speak of a wager: triumph, and the jinn will be trapped to serve you... You wonder what the cost of failure would be.

**Slot lines (EN):**
> s1: Will the adventurous general come here this time?
> s2: A guide, with at least 4 in Survival.
> s3: A bulwark, with at least 4 in Combat.
> s4: To deal with the jinn's trickery, you need someone clever, with at least 4 in Wisdom.
> s5: To engage the Jinn Queen, you need a messenger with at least 4 in Charisma.
> s6: The Beginning of Adventure

**Dice line (EN):**
> Break through the traps at the entrance.
> [s2.name]'s Stealth and Survival determine your full dice count.
> You need at least 1 Success to break through the trap.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:s2.隐匿+s2.生存>=": [1, 5]}`:**
> The entrance to the Forest of the Jinn is covered with bitter briars. A single scratch, and your mind is drowned in its worst pains. [s2.name] parts the thorns with cautious hands, clearing the way. At the path’s end, the flowering branches stir, twisting like hungry serpents, but Jabal seizes them with his bare hands.
> He weeps long after the party's escape. But he does not share what the thorns made him remember.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"r1:s2.隐匿+s2.生存<": [1, 5]}`:**
> The entrance to the Forest of the Jinn is covered with bitter briars. A single scratch, and your mind is drowned in its worst pains. [s2.name] parts the thorns with cautious hands, clearing the way...
> At the end of the path, the flowering branches stirs, suddenly coming to life, and trips your guide. He stumbles, lost among the thorns... Even as the party flees, [s2.name]'s screams linger.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"r2:s1.体魄+s1.战斗+s3.体魄+s3.战斗>=": [1, 5]}`:**
> A tiny jinn the size of a pea stops the adventurers, demanding a wrestling match with not just one but two of you at a time. Jaball and [s3.name] both surge forward, only to see the jinn blow on his own thumb, growing into a giant three times taller than a person in an instant. He plays with the party's strongest warriors as if they were toys.
> Suddenly, [s3.name] seizes an opportunity and stabs the jinn's bulging belly – the jinn deflates like a balloon, and is blown away in a spray of foul-smelling gas. The expedition seizes this chance to proceed.

<!-- settlement_extre[3] -->
**Outcome — failure, condition `{"r2:s1.体魄+s1.战斗+s3.体魄+s3.战斗<": [1, 5]}`:**
> A tiny jinn the size of a pea stops the adventurers, demanding a wrestling match with not just one but two of you at a time. Jaball and [s3.name] both surge forward, only to see the jinn blow on his own thumb, growing into a giant three times taller than a person in an instant. He easily defeats the party's strongest fighters.
> The jinn grabs [s3.name], and opening his enormous mouth, swallows him whole with a guttural gulp...
> Just when you think all is lost, a dagger pierces out from his belly... [s3.name]'s final strike.
> the jinn deflates like a balloon, and is blown away in a spray of foul-smelling gas. The expedition seizes this chance to proceed.

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"r3:s4.智慧>=": [1, 5]}`:**
> The next challenge is a game of chess. The jinn sage smiles, whispering that the price is sanity itself. [s4.name] steps forward with glee. The jinn twist the rules at will, but he twists them back, trapping the creature in its own contradictions. In the end, the sage wearing a big hat swells – bloats – bursts like a fire cracker. An erudite smell fills the air.

<!-- settlement_extre[5] -->
**Outcome — failure, condition `{"r3:s4.智慧<": [1, 5]}`:**
> The next challenge is a game of chess. The jinn sage smiles, whispering that the price is sanity itself. [s4.name] plays well, but the jinn twist the rules at will. Soon, he loses his king. And something else. The twisted laws of the game have lodged deep in his mind... Fortunately, you are allowed to continue forward. But [s4.name] – [s4.name] must be watched, lest he start smearing feces upon his own skin.

<!-- settlement_extre[6] -->
**Outcome — failure, condition `{"r4:s5.魅力+s5.社交<": [3, 5]}`:**
> Through trial and torment, you reach the Jinn Queen. There is no wager here – only her favor, or the lack of it, depending on her mood.
>
> [s5.name] flatters her beauty, her wisdom with passion and poetry. Yet her gaze lingers on Jabal's handsome features instead...
>
> She lifts a hand. The brave warrior’s eyes fill with devotion, with love. He falls to his knees like a loyal hound, worshipping at the queen's feet. And the rest of you receive your prize: a lantern, and the jinns trapped within.

<!-- settlement_extre[7] -->
**Outcome — success, condition `{"r4:s5.魅力+s5.社交>=": [3, 5]}`:**
> Through trial and torment, you reach the Jinn Queen. There is no wager here – only her favor, or the lack of it, depending on her mood.
>
> [s5.name] is struck by inspiration and entertains the queen with tales about the Sultan's Game. The queen rewards the party with mercy. She gifts them with a Jinn Lantern, through which she can now watch the stories unfold with her own eyes.


## Sultan's Suspicion — rite `5001018` (苏丹的戏弄)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001018_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Brutal_Fight#Fighting_Wild_Dogs

**Intro (EN):**
> Many people have whispered to the Sultan that your warriors are unparalleled in bravery... Even surpassing the Sultan's Army. Otherwise, how could you complete those challenging tasks? Maybe the Sultan never truly saw you as a threat, but he clearly doesn't mind using this to amuse himself – he orders you to select a warrior to combats to the death in the palace to please the gods, which basically means to please him.

**Slot lines (EN):**
> s1: Combat cannot be less than 4
> s2: Sultan's Patience

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s1.rare=": 1}`:** *You present a Stone tier warrior*
> The Sultan let out a cold laugh. Such a lowly brute deserves to duel with wild dogs.

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"s1.rare=": 2}`:** *You present a Bronze tier warrior*
> The Sultan claps his hands and announces that the death row prisoners from the prison will fight. If they kill your warrior, they will be pardoned.

<!-- settlement_prior[2] -->
**Outcome — branch, condition `{"s1.rare=": 3}`:** *You present a Silver tier warrior*
> An excellent warrior, deserving a real combats... The Sultan said, arranging his own famished lion, which had not been fed for many days, as the opponent for [s1.name].

<!-- settlement_prior[3] -->
**Outcome — branch, condition `{"s1.rare=": 4}`:** *You present a Gold tier warrior*
> The Sultan excitedly shouts, quickly ordering the captured Giant to be brought to the arena... It is said this Giant is still young, but it still takes at least twelve Slaves to hold the chain around its neck.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2": 1}`:**
> The Sultan's Patience is dwindling.

<!-- settlement[1] -->
**Outcome — branch, condition `{"!s2": 1}`:**
> Your arrogance has completely infuriated the Sultan

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"耐心<=": 0}`:**
> You were executed.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"耐心>": 0}`:**
> You barely got through today, but the Sultan's patience is running out.


## Book Hunt — rite `5002036` (淘书)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5002036_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Book_Hunt#Refugee_Version

**Intro (EN):**
> The bookstore owner is heading to the vagrants outside the city to gather worthwhile books. He believes you should send someone to accompany him – after all, it's your relentless book-buying that has left his shelves empty.

**Slot lines (EN):**
> s1: Bookstore Owner
> s2: Send a follower to accompany
> s3: You have to pay for the book hunt.
> s4: Certain items may be useful during the communications

**Dice line (EN):**
> Finding books is important, but beware of thieves
> Your Survival and Wisdom determine your full dice count.
> You need at least 4 Successes

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"!loot": 6000005}`:** *Cleaned Out*
> You've bought so many books that local vendors and thieves can't produce any decent ones for a while...

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *Where books and fate fall*
> You wander through the vagrant camp, surrounded by hungry children, gaunt women, and filthy men with vacant stares. How could there be books for sale in such a place?
>
> "When fate takes a bad turn, some sell their books first, while others cling to them until the very end," he explains, weaving through the crowd with eyes fixed on people's hands. "Under our most exalted Sultan's rule, such rises and falls of fate are commonplace. Those who recited poetry in gardens yesterday might well be begging for gruel here today."
>
> You can't help but wonder... if your fate fell, would he buy back his books from your dirty hands as well?

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r1:智慧+生存>=": [4, 5], "any": {"counter.7000330<": 3, "counter.7000330>": 3}}`:** *Successful Salvage*
> You find some valuable books... You try to speak with the bookstore owner, but she covers her face and hurries away, as though she's done something more shameful than the women of the night across the road.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"r1:智慧+生存>=": [4, 5], "counter.7000330=": 3}`:** *Successful Salvage*
> You find some valuable books... You try to speak with the bookstore owner, but she covers her face and hurries away, as though she's done something more shameful than the women of the night across the road.

<!-- settlement_extre[3] -->
**Outcome — failure, condition `{"r1:智慧+生存<": [4, 5]}`:** *Oh no, where's my money?*
> As you prepare to pay, you suddenly find your wallet has been stolen... Luckily, it didn't contain much money.

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"r1:智慧+生存>=": [4, 5], "s2.is": 2000019}`:**
> This book hunting experience provides Jenna with jewelry design inspiration.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"counter.7000117<": 6}`:**
> Books used to be a refuge from reality – a place filled with stories and fiction. But now, standing at the center of the story yourself, all you can see on every page are metaphors and satire, reminding you of the absurdity and irrationality in reality.

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"counter.7000117>=": 6, "counter.7000200<": 39, "any": {"counter.7000330<": 3, "counter.7000330>": 3}}`:**
> Something noteworthy has happened.


## Book Hunt — rite `5002037` (淘书)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5002037_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Book_Hunt#Upper_City_Version

**Intro (EN):**
> The bookstore owner finds you and asks if you could accompany him on a trip to the Upper City. He wants to visit a few nobles and try to collect some worthwhile books from them. He comes to you partly because he believes you have a genuine love for reading, and partly because he’s terrible at dealing with nobles. If you can’t come yourself, at least send someone who knows how to handle such delicate conversations.

**Slot lines (EN):**
> s1: Bookstore Owner
> s2: Send a follower to accompany
> s3: You have to pay for the book hunt.
> s4: Certain items may be useful during the communications

**Dice line (EN):**
> You exchange a few pleasantries with the noble and get ready to cut to the chase
> Your Charisma and Sociability determine your full dice count.
> You need at least 4 Successes

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"!loot": 6000005}`:** *Bibliophile's Dilemma*
> You've bought so many books that no quality volumes will escape noble hands for some time...

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *Everyone keeps their dignity*
> When buying books from nobles, the last thing you want is to make it seem like they need the money. After all, knowledge and culture are priceless – you’re merely offering a token of gratitude for their selfless sharing.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [4, 5], "any": {"counter.7000331<": 3, "counter.7000331>": 3}}`:** *Reciprocity*
> You successfully bought the books – it's almost brand new, still unopened.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [4, 5], "counter.7000331=": 3}`:** *Reciprocity*
> You successfully bought the books – it's almost brand new, still unopened.

<!-- settlement_extre[3] -->
**Outcome — failure, condition `{"r1:魅力+社交<": [4, 5]}`:** *Are you crazy?*
> Despite your efforts to negotiate, the other person's ego was hurt, leading to an unhappy breakup of the deal.

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [4, 5], "s2.is": 2000019}`:**
> This book hunting experience provides Jenna with jewelry design inspiration.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"counter.7000117<": 6}`:**
> Books used to be a refuge from reality – a place filled with stories and fiction. But now, standing at the center of the story yourself, all you can see on every page are metaphors and satire, reminding you of the absurdity and irrationality in reality.

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"counter.7000117>=": 6, "counter.7000200<": 39, "any": {"counter.7000331<": 3, "counter.7000331>": 3}}`:**
> Something noteworthy has happened.


## Book Hunt — rite `5002038` (淘书)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5002038_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Book_Hunt#Dark_Alley_Version

**Intro (EN):**
> The Dark Alley is flooded with countless unknown things – some are stolen goods, others are even worse... My task is to reach into that murky stream, seize the moment, catch a wave – or a book. Once it's out of that river, it becomes as perfect and intriguing as the rest of my collection, the bookstore owner says, as he invites you – or someone as skilled in combat as you – to join him in "catching waves."

**Slot lines (EN):**
> s1: Bookstore Owner
> s2: Send a follower to accompany
> s3: You have to pay for the book hunt.
> s4: Certain items may be useful during the communications

**Dice line (EN):**
> Finding books is important, but also be cautious
> Your Combat and Physique determine your full dice count.
> You need at least 4 Success.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"!loot": 6000005}`:** *Cleaned Out*
> You've bought so many books that local vendors and thieves can't produce any decent ones for a while...

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *You only need to keep watch*
> The bookstore owner, much like a hound, can always sniff out his target in the bustling Dark Alley... Just make sure he doesn't get hit with a blackjack.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r1:战斗+体魄>=": [4, 5], "any": {"counter.7000332<": 3, "counter.7000332>": 3}}`:** *A single wave*
> Today's a good day – a fine book acquired, knowledge gained without bloodshed.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"r1:战斗+体魄>=": [4, 5], "counter.7000332=": 3}`:** *A single wave*
> Today's a good day – a fine book acquired, knowledge gained without bloodshed.

<!-- settlement_extre[3] -->
**Outcome — failure, condition `{"r1:战斗+体魄<": [4, 5]}`:** *An Accident Happened*
> There was a robbery, [s2.name] repelled the clueless bandit but got injured, so today's Splash Hunt ended in failure.

<!-- settlement_extre[4] -->
**Outcome — success, condition `{"r1:战斗+体魄>=": [4, 5], "s2.is": 2000019}`:**
> This book hunting experience provides Jenna with jewelry design inspiration.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"counter.7000117<": 6}`:**
> Books used to be a refuge from reality – a place filled with stories and fiction. But now, standing at the center of the story yourself, all you can see on every page are metaphors and satire, reminding you of the absurdity and irrationality in reality.

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"counter.7000117>=": 6, "counter.7000200<": 39, "any": {"counter.7000332<": 3, "counter.7000332>": 3}}`:**
> Something noteworthy has happened.


## Guesthouse — rite `5006567` (舍馆)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006567_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse

**Intro (EN):**
> These people will risk everything for you after enjoying your meal... at least until it's digested.

**Slot lines (EN):**
> s1: Retainer
> s2: Retainer
> s3: Retainer
> s4: Retainer
> s5: Retainer
> s6: Retainer
> s7: Send someone to recruit the 1st Retainer.
> s8: Send someone to recruit the 2nd Retainer.
> s9: Send someone to recruit the 3rd Retainer.
> s10: Send someone to recruit the 4th Retainer.
> s11: Send someone to recruit the 5th Retainer.
> s12: Send someone to recruit the 6th Retainer.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s7": 1}`:**
> Recruitment Successful

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s8": 1}`:**
> Recruitment Successful

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s9": 1}`:**
> Recruitment Successful

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s10": 1}`:**
> Recruitment Successful

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s11": 1}`:**
> Recruitment Successful

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s12": 1}`:**
> Recruitment Successful

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"any": {"s7.is": 2000350, "s8.is": 2000350, "s9.is": 2000350, "s10.is": 2000350, "s11.is": 2000350, "s12.is": 2000350}}`:**
> Come back next time

<!-- settlement_extre[7] -->
**Outcome — branch, condition `{"!s7.is": 2000350, "!s8.is": 2000350, "!s9.is": 2000350, "!s10.is": 2000350, "!s11.is": 2000350, "!s12.is": 2000350}`:**
> Come back next time


## Guesthouse — rite `5006568` (舍馆)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006568_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse

**Intro (EN):**
> These people will risk everything for you after enjoying your meal... at least until it's digested.

**Slot lines (EN):**
> s1: Retainer
> s2: Retainer
> s3: Retainer
> s4: Retainer
> s5: Retainer
> s6: Retainer
> s7: Send someone to recruit the 1st Retainer.
> s8: Send someone to recruit the 2nd Retainer.
> s9: Send someone to recruit the 3rd Retainer.
> s10: Send someone to recruit the 4th Retainer.
> s11: Send someone to recruit the 5th Retainer.
> s12: Send someone to recruit the 6th Retainer.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s7": 1}`:**
> Recruitment Successful

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s8": 1}`:**
> Recruitment Successful

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s9": 1}`:**
> Recruitment Successful

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s10": 1}`:**
> Recruitment Successful

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s11": 1}`:**
> Recruitment Successful

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s12": 1}`:**
> Recruitment Successful

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"any": {"s7.is": 2000350, "s8.is": 2000350, "s9.is": 2000350, "s10.is": 2000350, "s11.is": 2000350, "s12.is": 2000350}}`:**
> Come back next time

<!-- settlement_extre[7] -->
**Outcome — branch, condition `{"!s7.is": 2000350, "!s8.is": 2000350, "!s9.is": 2000350, "!s10.is": 2000350, "!s11.is": 2000350, "!s12.is": 2000350}`:**
> Come back next time


## Against Nawfal — rite `5007001` (决战奈费勒)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5007001_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Great_Adversary#Raid

**Intro (EN):**
> You found the hall where Nawfal is hiding, with his followers gathered there. Perhaps this is an opportunity to capture them all, but it will be a tough battle.

**Slot lines (EN):**
> s1: Nawfal now sees you as a sworn enemy, unyielding and relentless
> s2: A group of zealous, mindless youths, Nawfal's admirers
> s3: Rumored to be Nawfal's lover
> s4: This person vows to guard Nawfal side at all costs
> s5: His advantage will keep accumulating.
> s6: You have to handle this yourself
> s7: You must lead loyal troops
> s8: You can send a follower for assistance
> s9: Certain items can be useful in combats.
> s10: You can take this opportunity to break a Conquest Card or Bloodshed Card up to Silver tier

**Dice line (EN):**
> Strike first!
> The number of dice is affected by opponent's Combat and Physique.
> You need at least 1 Success to avoid dying.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [3, 5], "s4": 1}`:** *A Decisive Victory.*
> When you found Nawfal, he was already lying in a pool of blood, alongside the corpses of his two companions. His eyes were full of endless sorrow and a hint of relief.
>
> In those final moments, you wondered if his eyes saw you, the victor. You couldn't know anyway. After all, the dead can't speak.

<!-- settlement[1] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [3, 5], "!s4": 1}`:** *A Decisive Victory.*
> When you found Nawfal, he was already lying in a pool of blood... The instant you approached, he mustered all his strength to lunge at you.
> Fortunately, even immense hatred couldn't overcome the loss of blood and fatigue; he slipped like a clown and was soon hacked to pieces by your men... Nawfal, you were never good at fighting, were you?

<!-- settlement[2] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [1, 5], "s4": 1}`:** *He narrowly survived*
> The ambush turned into a chaotic melee, everyone entangled in confusion. You swing your blade wildly in the dimly-lit room, surrounded by death, friend and foe indiscernable with each swings. Suddenly, behind a curtain, you spot Nawfal's silhouette...
> When you pierced the curtain with all your might, you found Nawfal crawling disoriented from under the crushed drapery, loudly calling for retreat...
> Afterwards, upon examining the body beneath the drapery, you discovered she was the nomadic woman who always followed Nawfal.
> At least, this folly would severely decimate Nawfal’s morale, temporarily prevent him from hindering you.

<!-- settlement[3] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [1, 5], "!s4": 1}`:** *He narrowly survived*
> You killed many, burned down this house, but amidst the archaic scene, Nawfal escaped.
> At least, this folly would severely decimate Nawfal’s morale, temporarily prevent him from hindering you.

<!-- settlement[4] -->
**Outcome — failure, condition `{"r1:战斗+体魄-e(战斗+体魄)<": [1, 5]}`:** *A Crushing Defeat*
> A reckless charge caused you to be isolated... Swords and clubs quickly surround you...

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [3, 5], "s10.杀戮": 1}`:** *You took this opportunity to break a Bloodshed Card*
> Your twisted and prolonged struggle with Nawfal greatly pleased the Sultan, who ordered a troupe to create a special drama for repeated enjoyment... next festival.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [3, 5], "s10.征服": 1}`:** *You took this opportunity to break a Conquest Card*
> Your twisted and prolonged struggle with Nawfal greatly pleased the Sultan, who ordered a troupe to create a special drama for repeated enjoyment... next festival.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [3, 5], "!s10": 1}`:** *Dreadful Conflict*
> As a powerful courtier, Nawfal's death inevitably triggered a shockwave; people gossiping, whether noble or commoner, both lost friends or family in the struggle, ensuring no shortage of trouble to follow!


## Ritual of Inner Chambers — rite `5008025` (内宅的仪式)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008025_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Ritual_of_Inner_Chambers

**Intro (EN):**
> Inciting jealousy among women rather than resentment towards the masters, ensuring peace within the house. This is the fundamental purpose of this ritual, making masters more handsome and beautiful is just an added benefit.

**Slot lines (EN):**
> s1: You can take this to break a Carnality Card not higher in tier than the subject
> s2: You must personally host this ritual
> s3: You can select a follower filled with passion, or...
> s4: Ritual of the Hearth

<!-- settlement[0] -->
**Outcome — branch, condition `{"all": {"s1": 1, "counter.7100001>=": 10, "counter.7100002<": 3, "s3.is": 2000056}}`:** *You chose Qais*
> The ritual preparations concluded, Qais still seemed puzzled by your spouse's absence until you looked at him—Qais never expected this, practically leaping backward—but you firmly grabbed him, pushing him onto the stone bed.
> Then things naturally progressed, as you held grace over him, being exactly the kind of person he aspired to be, honest, sincere, handsome, kind...
> His mind flashed with confusion but soon vanished under the influence of the ritual. Suddenly, in his eyes, you became so charismatic, irresistible. As for the overwhelming guilt about your wife, it dissipated with your actions.
> Everything ended in disarray; you didn’t feel any special change upon the ritual's completion. Qais weakly propped himself up, his voice hoarse: "I mentioned before, being watched by others is also a necessary condition for the ritual's success."
> You finally came to your senses. Disappointment? Not necessarily. You looked towards Qais, into his eyes—this ritual may not have genuinely failed, that familiar longing shimmered in his eyes, although it quickly disappeared into the darkness.
> When you publicly recounted the event, the Sultan took a moment to remember who Qais was. Then he looked at this minister, known for his stubbornness, integrity, and conservativeness, and appreciated his shamelessly calm expression, finally showing a meaningful smile. The Sultan permitted you to break the card.
> After this, you were on edge for several days, unsure if the ritual had truly taken effect, as Maggi did not cause you trouble. This brought you relief but also left you with a faint sense of unease.

<!-- settlement[1] -->
**Outcome — branch, condition `{"all": {"!s1": 1, "counter.7100001>=": 10, "counter.7100002<": 3, "s3.is": 2000056}}`:** *You chose Qais*
> The ritual preparations concluded, Qais still seemed puzzled by your spouse's absence until you looked at him—Qais never expected this, practically leaping backward—but you firmly grabbed him, pushing him onto the stone bed.
>
> Then things naturally progressed, as you held grace over him, being exactly the kind of person he aspired to be, honest, sincere, handsome, kind...
>
> His mind flashed with confusion but soon vanished under the influence of the ritual. Suddenly, in his eyes, you became so charismatic, irresistible. As for the overwhelming guilt about your wife, it dissipated with your actions.
>
> Everything ended in disarray; you didn’t feel any special change upon the ritual's completion. Qais weakly propped himself up, his voice hoarse: "I mentioned before, being watched by others is also a necessary condition for the ritual's success."
>
> You finally came to your senses. Disappointment? Not necessarily. You looked towards Qais, into his eyes—this ritual may not have genuinely failed, that familiar longing shimmered in his eyes, although it quickly disappeared into the darkness.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s1": 1, "s3.is": 2000056}`:** *You chose Qais*
> The ritual preparations concluded, Qais still seemed puzzled by your spouse's absence until you looked at him—Qais never expected this, practically leaping backward—but you firmly grabbed him, pushing him onto the stone bed.
> Then things naturally progressed, as you held grace over him, being exactly the kind of person he aspired to be, honest, sincere, handsome, kind... His mind flashed with confusion but soon vanished under the influence of the ritual. Suddenly, in his eyes, you became so charismatic, irresistible. As for the overwhelming guilt about your wife, it dissipated with your actions.
> Qais weakly propped himself up, his voice hoarse: "I mentioned before, being watched by others is also a necessary condition for the ritual's success."
> You finally came to your senses. Disappointment? Not necessarily. You looked towards Qais, into his eyes—this ritual may not have genuinely failed, that familiar longing shimmered in his eyes, although it quickly disappeared into the darkness.
> When you publicly recounted the event, the Sultan took a moment to remember who Qais was. Then he looked at this minister, known for his stubbornness, integrity, and conservativeness, and appreciated his shamelessly calm expression, finally showing a meaningful smile. The Sultan permitted you to break the card.
> After this, you were on edge for several days, unsure if the ritual had truly taken effect, as Maggi did not cause you trouble. This brought you relief but also left you with a faint sense of unease.

<!-- settlement[3] -->
**Outcome — branch, condition `{"!s1": 1, "s3.is": 2000056}`:** *You chose Qais*
> The ritual preparations concluded, Qais still seemed puzzled by your spouse's absence until you looked at him—Qais never expected this, practically leaping backward—but you firmly grabbed him, pushing him onto the stone bed.
> Then things naturally progressed, as you held grace over him, being exactly the kind of person he aspired to be, honest, sincere, handsome, kind... His mind flashed with confusion but soon vanished under the influence of the ritual. Suddenly, in his eyes, you became so charismatic, irresistible. As for the overwhelming guilt about your wife, it dissipated with your actions.
> Qais weakly propped himself up, his voice hoarse: "I mentioned before, being watched by others is also a necessary condition for the ritual's success."
> You finally came to your senses. Disappointment? Not necessarily. You looked towards Qais, into his eyes—this ritual may not have genuinely failed, that familiar longing shimmered in his eyes, although it quickly disappeared into the darkness.

<!-- settlement[4] -->
**Outcome — branch, condition `{"s3.妻子": 1, "s1": 1}`:** *You chose Maggie*
> Maggie is very unhappy with Qais' presence, but you told her it couldn't be helped, and Qais keeps promising not to look at her.
>
> You skillfully ignite your wife's passion on the stone bed; with Qais watching, she behaves more shyly yet passionately, both of you enjoying the experience.
>
> The ritual succeeds. Somehow, you notice a strange blush on Qais's face. He hides his unexpected jealousy well, but he can't bring himself to look you in the eye.

<!-- settlement[5] -->
**Outcome — branch, condition `{"!s1": 1, "s3.妻子": 1}`:** *You chose Maggie*
> Maggie is very unhappy with Qais' presence, but you told her it couldn't be helped, and Qais keeps promising not to look at her.
>
> You skillfully ignite your wife's passion on the stone bed; with Qais watching, she behaves more shyly yet passionately, both of you enjoying the experience.
>
> The ritual succeeds. Somehow, you notice a strange blush on Qais's face. He hides his unexpected jealousy well, but he can't bring himself to look you in the eye.

<!-- settlement[6] -->
**Outcome — branch, condition `{"!s3.妻子": 1, "!s3.is": 2000056, "s1": 1}`:** *You chose [s3.name]*
> Qais uncomfortably witnessed your passion and pleasure, quickly leaving as soon as the ritual was completed.
>
> When you bring this matter up in public, the Sultan takes a moment to recall who Qais is. He glances at the minister, known for his stubbornness, integrity, and rigidity, and watches as his face flushes red and pale in turn, then bursts into laughter. In the end, you tear up the card.
>
> You remain on edge for the next few days, unsure if the ritual worked. Maggie's silence on this matter brings you relief, yet it also leaves you with a subtle sense of unease.

<!-- settlement[7] -->
**Outcome — branch, condition `{"!s3.妻子": 1, "!s3.is": 2000056, "!s1": 1}`:** *You chose [s3.name]*
> Qais uncomfortably witnessed your passion and pleasure, quickly leaving as soon as the ritual was completed.


## Superior Replacement — rite `5008153` (比最好更好的)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008153_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Fadia#Superior_Replacement

**Intro (EN):**
> You must provide a slave girl worthy of replacing Fadia for the Sultan within the deadline to retrieve her.

**Slot lines (EN):**
> s1: You must bring a beauty to please the Sultan, or... consider alternative methods?

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1.金币=": 20}`:** *Desperate Plea*
> Kneeling at the Sultan's feet, you passionately lament that Fadia is the finest slave girl possible - despite your best efforts, no one compares. Before he dismisses your excuses, you quickly present a platter of gold coins, humbly suggesting this might somewhat compensate... The Sultan narrows his eyes with an amused smile, teasing you thoroughly before finally relenting.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1.is": 2000055, "s1.已获掠夺之欢": 1}`:** *Special Service*
> Nayla thoroughly instructs the Sultan's concubines in bedroom arts. Adding their own improvisations, they collectively employ these techniques on the Sultan in a single night. 
> He is thoroughly pleased with the experience.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s1.is": 2000055, "!s1.已获掠夺之欢": 1}`:** *Special Service*
> Nayla instructs the Sultan's concubines in intimate arts while serving him herself - something she's always wanted to try! 
> After finally satisfying the Sultan, she rushes back to share this extraordinary experience. 
> "Honestly, what woman hasn’t dreamed of becoming his concubines?" she says, covering her mouth with a cheerful laugh. "Our king – both strength and size – is absolutely top-notch! The only issue, well..." 
> She tilts her head slightly, glancing around before leaning in to whisper, "He doesn't care about how I feel at all... Of course, he's the Sultan – why would he care? But if he could just see me as a person instead of a piece of meat, the pleasure would be so much greater." 
> "Of course, our king doesn’t need to consider anyone's feelings, so just one experience like this is enough for me. Thank goodness I'm not one of his concubines!” Saying this, Nayla goes on to share some palace secrets she overheard. Before leaving, she slips you a handful of coins, probably hoping you'll help her find her next prey.

<!-- settlement[3] -->
**Outcome — branch, condition `{"s1.is": 2000352}`:** *Mechanical Wonder*
> Initially, the Sultan doubts Mahir's usefulness - she appears plain with roughened fingers and cheeks. But since you've vouched for her with your life, he nods approval. 
> Soon, Mahir develops an automatically rotating bed for the Sultan... She returns bearing generous rewards while the Sultan? He's still enjoying his new toy.

<!-- settlement[4] -->
**Outcome — branch, condition `{"any": {"s1.is": 2001111}}`:** *Otherworldly Pleasure*
> When you release the succubus in the palace center, letting dark, sweet-coppery power flow unrestrained, everyone falls into momentary hallucinations - except the Sultan. 
> He observes his courtiers' infatuated states with subtle cruelty. Intrigued, he beckons you to bring the creature before him, wanting to touch its oil-like skin and discover what generates such power beneath its mist-shrouded face.

<!-- settlement[5] -->
**Outcome — branch, condition `{"s1.is": 2000022}`:** *Body Art*
> Badriyyah brings her complete tattoo kit to the palace, providing the Sultan's women with stimulating tattoo patterns that quickly spread throughout the harem. This novelty satisfies his taste - though needles on the Sultan himself remain unthinkable.

<!-- settlement[6] -->
**Outcome — branch, condition `{"s1.is": 2000195}`:** *Before Long, You Heard the News of Raed's Death*
> You did not know what had happened to her in the palace, but clearly she—or at least part of her body—had been buried in the royal mausoleum.
> Whatever she had whispered to the Sultan in her final moments had evidently planted some ill thoughts of you in his mind.

<!-- settlement[7] -->
**Outcome — branch, condition `{"all": {"s1.魅力>=": 5, "s1.女性": 1}}`:** *Every Woman Your Due*
> The Sultan is thoroughly pleased with [s1.name]'s beauty, appearance, and trembling body - as well as your flattery. He waves Fadia away to serve you, then immediately leaves the audience hall to enjoy new stimulations in his harem.


## In the Name of God — rite `5000506` (以神的名义)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000506_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Purist_Order#In_the_name_of_God

**Intro (EN):**
> The High Priest of the Purists asks you to find and capture cultists operating secretly within the city.

**Slot lines (EN):**
> s1: Those judged heretical, living or dead
> s2: Your devout faith, or the one who delivers cultists

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1.is": 2000384}`:** *You brought Mahir's head over*
> You inform the priest that Mahir dared peer into the stars' secrets and the dwelling place of gods - undeniably heretical! You've already purified her on their behalf.
> "This woman repeatedly attempted to steal sacred objects," the priest acknowledges, nodding gratefully. When you inquire about these "sacred objects," he falls silent. You depart with your reward and lingering questions.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1.is": 2000352}`:** *You brought Mahir over*
> You denounce Mahir to the priest for daring to peer into the stars' secrets and the dwelling place of gods - undeniably heretical! Mahir stares at you in disbelief, struggling desperately before guards restrain and remove her.
> "This woman repeatedly attempted to steal sacred objects," the priest acknowledges gratefully. When you inquire about these "sacred objects," he falls silent. You depart with your reward and lingering questions.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s1.is": 2000840}`:** *Cultist's Offering*
> You deliver the cultist to the church. Before you can speak, an agonized wail erupts. The young man clutches his fractured stone, emitting inhuman howls. As the stone crumbles to dust in the pure light, he collapses lifeless.
> Thus the follower of the strange god is purified by the Purists' power. The priest silently nods in appreciation.

<!-- settlement[3] -->
**Outcome — branch, condition `{"s1.is": 2000189}`:** *Witch Hunter*
> The priests recognize Badriyyah's face immediately. This detestable woman attracted numerous ignorant commoners from Dark Alley as followers, and several elimination attempts had failed... for various reasons.
> They acknowledge your achievement with appropriate compensation.

<!-- settlement[4] -->
**Outcome — branch, condition `{"s1.is": 2000190}`:** *Witch Captive*
> The priests recognize Badriyyah's face immediately. This detestable woman attracted numerous ignorant commoners from Dark Alley as followers, and several elimination attempts had failed... for various reasons.
> They acknowledge your achievement with appropriate compensation. Badriyyah is dragged away, hurling vile curses at you, the priests, and even the Immaculate Purity until the very end.

<!-- settlement[5] -->
**Outcome — branch, condition `{"s1.is": 2000022}`:** *Temple Trap*
> The moment Badriyyah stepped into the temple, the trap was sprung.
> Confusion flickered across her face, twisting into disbelief—then into wild, hysterical laughter. The priests recognized her instantly. This detestable woman attracted numerous ignorant commoners from Dark Alley as followers, and several elimination attempts had failed... for various reasons.
> They acknowledged your deed and rewarded you as promised. Badriyyah was seized and dragged away, spewing curses until her voice broke—at you, at the priests, and even at the Immaculate Purity itself.

<!-- settlement[6] -->
**Outcome — branch, condition `{}`:** *False Accusation*
> When [s1.name] is dragged away by waiting temple guards, the entire sanctuary echoes with protestations of innocence and curses against you. The priests state they will provide your reward after obtaining concrete evidence of heretical crimes.
> Clearly, you're unlikely to receive that reward.


## Guesthouse — rite `5006564` (舍馆)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006564_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse#Upgrades

**Intro (EN):**
> You can recruit temporary followers here.

**Slot lines (EN):**
> s1: Retainer
> s2: Retainer
> s3: Retainer
> s4: Retainer
> s5: Send someone to recruit the 1st Retainer.
> s6: Send someone to recruit the 2nd Retainer.
> s7: Send someone to recruit the 3rd Retainer.
> s8: Send someone to recruit the 4th Retainer.
> s9: When your Notoriety is 10 or higher, you can spend 10 Gold Coins to upgrade the guesthouse.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s9": 1}`:** *You have expanded the Guesthouse.*
> The more mouths there are to feed, the more voices there are to speak for you. Your subjects will sic your foes at your behest.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s5": 1}`:**
> Recruitment Successful

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s6": 1}`:**
> Recruitment Successful

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s7": 1}`:**
> Recruitment Successful

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s8": 1}`:**
> Recruitment Successful

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"any": {"s5.is": 2000350, "s6.is": 2000350, "s7.is": 2000350, "s8.is": 2000350}}`:**
> Come back next time

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"!s5.is": 2000350, "!s6.is": 2000350, "!s7.is": 2000350, "!s8.is": 2000350}`:**
> Come back next time


## Innocent Victim — rite `5008177` (无妄之灾)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008177_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Disaster_from_Nowhere

**Intro (EN):**
> While fretting over what the cultists might do with your Conquest Card, you hear reports of a terrifying monster ravaging your territory...

**Slot lines (EN):**
> s1: Predator
> s2: Captive Followers
> s3: The Sultan Card you gave the cultists
> s4: You must face this monster yourself
> s5: You can seek assistance
> s6: You can seek assistance

**Dice line (EN):**
> With no escape route, to save your followers from captivity and bewitchment, you bravely take up arms against this enormous beast...
> Your Wisdom, Survival and Combat determine your full dice count.
> You need at least 5 Success to defeat the monster.

<!-- settlement[0] -->
**Outcome — success, condition `{"s1.rare=": 4, "r1:智慧+生存+战斗-e(智慧+生存+魔力)>=": [5, 5]}`:** *Dark Blood*
> You've won, though your territory bears grievous wounds... As the beast collapses with a final roar, its massive corpse crushes buildings, its black blood poisons rivers and springs, and its dying breath spreads disease among your surviving subjects. Still, you've won - at least you have the chance to rebuild.

<!-- settlement[1] -->
**Outcome — success, condition `{"s1.rare<": 4, "r1:智慧+生存+战斗-e(智慧+生存+魔力)>=": [5, 5]}`:** *Dark Blood*
> You've won, though your territory bears grievous wounds... As the beast collapses with a final roar, its massive corpse crushes buildings, its black blood poisons rivers and springs, and its dying breath spreads disease among your surviving subjects. Still, you've won - at least you have the chance to rebuild.

<!-- settlement[2] -->
**Outcome — failure, condition `{"r1:智慧+生存+战斗-e(智慧+生存+魔力)<": [5, 5]}`:** *You lost*
> Despite regrets and protests, you die pathetically beneath the predator's fangs.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:智慧+生存+战斗-e(智慧+生存+魔力)>=": [5, 5]}`:** *Squandered Favor*
> Hearing how you broke this Conquest Card, the Sultan's expression darkens: "You're exhausting my favor, [player.name]." He toys with his ring, watching you coldly. "Surely you don't believe you've gained authority to assign others to this game?"
> Cold sweat pours as you repeatedly deny this; another such incident would certainly cost you your head.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r1:智慧+生存+战斗-e(智慧+生存+魔力)>=": [5, 5], "have.2000022": 1, "!have.2000022.追随者": 1}`:** *Another Visit*
> Badriyyah wants more! She giggles, seeking a second, third card... For your own survival, you absolutely cannot oblige. She seems disappointed, though her smile never fades. "Well then, let's reframe - not you providing cards, but me helping you. That works, right?"
> She settles this unilaterally.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"r1:智慧+生存+战斗-e(智慧+生存+魔力)>=": [5, 5], "!s4.黑暗知识": 1}`:**
> The cultists' ritual grants you disturbing insights into forbidden realms.

<!-- settlement_extre[3] -->
**Outcome — success, condition `{"counter.7000585<": 1, "r1:智慧+生存+战斗-e(智慧+生存+魔力)>=": [5, 5]}`:** *You break a Sultan Card through an extremely unclean mean*
> You tell no one of your vision at the moment you slew the predator. As the card snaps, through the messy stains, you glimpse an exalted vision - a crown destined for the King of Kings, the world-ruling God. In ancient times, a god was judged evil and banished for unauthorized world-alteration - now, through game-created stains and your vision, Their name will be sanctified anew, returning once more.


## Do Whatever You Want — rite `5010016` (为所欲为)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5010016_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guide:Rod_of_Life#Convert_Faris

**Intro (EN):**
> No matter how powerful he once was, his brutal deeds that turned everyone against him have led him to this pitiable corner – pinned to the throne by blades, barely breathing... now, your command shall become his destiny.

**Slot lines (EN):**
> s1: Sultan
> s2: Humiliate him
> s3: Kill him
> s4: Imprison him
> s5: Exile him

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s2": 1, "!s2.生命权杖": 1, "counter.7000494<": 1}`:** *Complete Victory*
> "Oh, wait, we all know what's coming, but wait - we, at least I don't want to witness this firsthand," Nabhani declares, hastily exiting the palace. The others exchange knowing glances before unanimously leaving this victory spoil for you to savor alone. 
> Perfect. You approach the fallen Sultan with deliberate steps, your eyes taking in every detail of his defeated form. For the first time, you look down upon those once-commanding eyes, now dimmed by defeat. 
> "At last, this moment is mine, Your Majesty." A smile plays across your lips as you casually hook a finger around the golden chain adorning his chest. 
> His breathing quickens - is it rage or something baser? It hardly matters now. 
> With calculated cruelty, you smear his blood across his flesh, methodical as those nights you studied battle maps by candlelight. You toy with his broken dignity, like raising your standard over each conquered territory. This city, this kingdom now bows before you, and its embodiment lies bound to this golden throne by traitors' blades, awaiting your final conquering act. 
> When pained sounds escape his throat, you crush his feeble resistance without mercy - just as he once trampled countless others beneath his boot. You force his gaze to meet yours, a perfect mirror of how he once delighted in others' suffering. 
> A satisfaction beyond description surges through your chest, more potent than any carnal pleasure. For one crystalline moment, you understand perfectly how the Sultan transformed from the vibrant ruler he once was into this hollow shell. 
> Yet you will not relent, not today. You'll return his cruelties a thousandfold. Once could never suffice. "Death shouldn't claim you too quickly, Your Majesty," you whisper against his ear, with the intimacy of a lover and the coldness of a mortal enemy. "Where would be the satisfaction in that?"

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s2": 1, "!s2.生命权杖": 1, "counter.7000494>=": 1}`:** *Ballad of Hatred*
> "None remain, Your Majesty." You approach the fallen Sultan with deliberate steps, your eyes taking in every detail of his defeated form. For the first time, you look down upon those once-commanding eyes, now dimmed by defeat. 
> "Your guards, your courtiers, your soldiers, your subjects..." Your voice barely carries to his ear. "Your dynasty perishes today." 
> A strange sound rises from the Sultan's throat - perhaps laughter. It hardly matters now. 
> With calculated cruelty, you smear his blood across his flesh, methodical as those nights you studied battle maps by candlelight. You handle his vulnerable form with clinical detachment, as though raising your standard over each conquered territory. You crush his feeble resistance without mercy - just as he once trampled countless others beneath his boot. You force his gaze to meet yours, a perfect mirror of how he once delighted in others' suffering. 
> The taste of victory should be sweet. Yet as this long-dreamed triumph finally comes to pass, why do tears mark your face? 
> Your companions, your allies, the righteous souls who rallied to your cause, even the common folk who joined your banner - countless lives extinguished in this fiery night. Their collective grief courses through you, more potent than any carnal pleasure. 
> You search the Sultan's hollow gaze - did this mighty ruler beg for mercy? Did he plead for a shred of dignity? The words never reached you. You know only that his debt must be repaid a thousandfold. Once could never suffice. 
> "Death shouldn't claim you too quickly, Your Majesty," you whisper against his ear, with the intimacy of a lover and the coldness of a mortal enemy. "Where would be the satisfaction in that?"

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s2": 1, "s2.生命权杖": 1}`:** *Quickly use the Rod of Life*
> You whisper at the Sultan's ear, a soft hiss that declares this to be the punishment – or perhaps the reward – for all he has wrought in his fleeting life. His face twists for the first time, a mask of flesh buckling, but whatever words he means to spit, you silence them. Before his lips part, you pierce his body with your flawless creation – a thing of ruinous perfection. 
> Aether surges between you, crackling with lightning and thunder – yet its clamor pales beside the merest fraction of his screams, his wails of anguish. 
> Wielding this seemingly boundless power, you transport him between ecstasy and agony, countless times unleashing years of suppressed humiliation... 
> Throughout this communion, you experience pleasure transcending imagination. Did the mighty ruler beg for mercy? Did he moan from depths of shameful desire? Did his proud spirit finally break? The words never reached you... At last, even the Rod of Life reaches its end, shuddering to a halt in a keening wail of metal. 
> Only then do you see it: the thing once called Sultan lies shattered, a broken relic of flesh and bone. Rising, you turn. Lightning flares, and your loins – ablaze with the sacred flame of aether – stand proud before the cowering court. They kneel, one by one, trembling as they greet the new monstrosity that claims their throne.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s3": 1, "!s3.承阳": 1}`:** *I must handle it myself*
> Sword in hand, you approach the fallen Sultan with deliberate steps. Blood loss has drained most of his strength; his arms hang limply at his sides, each breath a laborious struggle. 
> When has the mighty ruler, perched upon his golden throne, ever known such defeat, such vulnerability? 
> Without a flicker of mercy, you examine every detail of his defeated form, looking down upon those once-commanding eyes, now dimmed by defeat, as you speak: "At last, this moment is mine, Your Majesty." 
> You recite his crimes, your blade dancing across his skin, opening precise, shallow cuts with each transgression named. 
> In days past, he would have mocked your impudence, ordering guards to drag you away, or demanding tribute to soothe his wounded pride. Now he can only tremble in silence, unable even to voice his terror. 
> Will the Sultan repent as death approaches? Perhaps - yet what solace would this bring to those who suffered beneath his cruelty? 
> Blood weeps from countless wounds, forming crimson rivulets across his skin. In the solemn silence of final reckoning, the tyrant's chest falls still - so quiet, so insignificant in death. 
> You regard the broken vessel expressionlessly before severing his head with a clean stroke. 
> In death's frozen moment, his eyes hold the same fear any commoner might show. This is the Sultan you served faithfully for years, the despot who trampled countless others beneath his boot. Now, his reign ends! 
> With your own hands, you mount his head at the palace's highest point - amidst gasps of shock, cries of fear, and swelling cheers, the news spreads like wildfire through the city streets: The Sultan is dead!

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s3": 1, "s3.承阳": 1}`:** *It's all about sex, and sex is all about power*
> The Sword of the Sun trembles and sings in your hand, rejoicing – you once feared possessing the finest phallus in the country, knowing deep down that only the Supreme Sultan was worthy of such thing...but now, you have conquered your fear with your own hands!
>
> Such chaotic thoughts flash through your mind, and so you swing down your blade without hesitation, sending the Sultan's head soaring high. From now on, you will fear possessing nothing.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s4": 1}`:** *Death would be too kind for him*
> You approach the fallen Sultan with deliberate steps, your eyes taking in every detail of his defeated form. 
> Blood loss has drained most of his strength; his arms hang limply at his sides, each breath a laborious struggle, yet somehow - he smiles! 
> How magnificently theatrical this final act of defiance! The proud king refuses to acknowledge defeat, treating this conquest as mere performance! What finale will you compose for this drama? Death? Humiliation? Or something more fitting? A chuckle escapes his throat. You merely regard him with icy detachment. 
> You know the perfect punishment. 
> You'll confine him in the quietest cell, buried in the deepest dungeon beneath the palace. 
> There he will see no face, hear no voice. Endless darkness will consume his sanity, yet no matter how he screams, pleads, or repents, only silence will answer. 
> You'll visit periodically - indeed, you've already composed the monologue for your next visit, your tenth visit, your thousandth visit - until eventually, you forget his existence, until the last soul alive forgets he ever ruled. 
> He will perish from madness, from isolation, and ultimately from the mundane humiliation of starvation... Let this be his atonement! Perhaps in his next life, he'll discover how not to trample countless others beneath his boot.

<!-- settlement_extre[6] -->
**Outcome — branch, condition `{"s5": 1}`:** *Bloodshed ends at my command*
> You summon all the nobles, ministers, and generals worthy of heed – those already sworn to your cause and those dragged reluctantly into your shadow. 
>
> Before them all, you speak. This wretched failure, this once-Sultan, shall not meet death's embrace. Whatever atrocities the tyrant has wrought, half the sin stains our own hands... His punishment – the loss of all he held dear – suffices. You spare him the noose, and in doing so, you absolve the multitude's guilt. No longer must blood scour the throne clean. The fallen one lives. His kin, those willing to exile, live too. This mercy flows from you, destined to bind all rulers yet to come.
>
> Some kneel in dread of your might. Others bow to your mercy and wisdom. All hail this hallowed pardon with trembling voices.


## Badriyyah — rite `5000514` (拜铃耶)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000514_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Haunted_Mansion#Badriyyah

**Intro (EN):**
> <i>I am Badriyyah</i>, she smiles. Her black fingers brush and tingle your chest, perhaps to calm you, or to provoke you further.

**Slot lines (EN):**
> s1: She can teach you forbidden knowledge no longer spoken of
> s2: You must attend the appointment in person.
> s3: This is an enticing woman; you can take this to break a Bloodshed or Carnality Card.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"!s3": 1}`:** *Peering into Darkness*
> Effortlessly, you confide your recent experiences, earning her high praise. "You completed my unfinished ritual through blood and followed the remaining guidance to find me... You have remarkable talent, both in magical aptitude and your cold heart." She laughs joyfully, taking your hand. "Look, my master has acknowledged you." You discover a black mark on your palm - like a small mole or ink drop. Gazing at it, you involuntarily recite an ancient incantation guided by Badriyyah's voice.
> Darkness answers your call, painting your head with the blood and hatred of your sacrifice. Thus you learn the name of that ancient, banished Cultic God and the forbidden knowledge bestowed upon humanity.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s3": 1}`:**
> "Welcome," she squeezes your hand with obvious affection. "Our god favors you. We're fellow travelers now."

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s3.纵欲": 1}`:** *Dark Communion*
> Before speaking to her, you presented a Carnality Card. Words weren't necessary, physical connection brings one closer to the truth—besides, you were aware of your hunger. She laughed, holding the hand with the Carnality Card, mimicking the card posture, pressing your lower bodies together. What is more important than joy or merriment? In the entanglement, your blade pierced through the longstanding delusion—life is a scam, an endless toil. The divine guiding our joy is exiled, yearning to return and end this ancient suffering. Recalling forbidden knowledge sealed for eons, as you and Badriyyah recited the Cultic God’s honorifics, you both reached the peak of joy."Welcome, fellow traveler." She laughed playfully, squeezing your hand with evident affection, "Our god likes you well."

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s3.杀戮": 1}`:** *Pain's End*
> Before speaking to her, you first present a Bloodshed Card.
> Unexpectedly, she smiles and grasps your hand holding the Sultan Card, mimicking the depicted posture, using the card to slice her own throat. That massive wound becomes her true lips, truth flowing like blood, which you instinctively respond to with lover-like kisses and drinking - through this gift, you learn an ancient secret - life is merely deception, a meaningless arrangement of endless toil, the god guiding us toward pleasure was banished, and followers await Their return to end the world's eternal suffering!
> The forbidden knowledge buried for eons resurfaces, the Cultic God's name escapes your lips, and in that moment, you look up to find her entrails consumed by your teeth, her remains vibrant and beautiful, supremely elegant.

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"s3.杀戮": 1, "counter.7000582<": 1}`:** *Unholy Ritual*
> In the moment the card breaks, through the splattered blood, you glimpse a sublime vision - angels serving at the god's side. In ancient times, a god was condemned for unauthorized embellishment of the world - now, through your vision and the game's unholy stains, Their name shall be sanctified again, returning to glory.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"s3.纵欲": 1, "counter.7000584<": 1}`:** *Unholy Ritual*
> In the moment the card breaks, through the splattered stains, you glimpse a sublime vision - pure devotees kneeling before the true god. In ancient times, a god was judged evil and banished for unauthorized world-alteration - now, through game-created stains and your vision, Their name will be sanctified anew, returning once more.


## I, Freeloader — rite `5000817` (我，白嫖)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000817_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/I,_Freeloader

**Intro (EN):**
> Soon, Buthayna discovers the four girls are missing. She confronts you at your room's doorway with several guards, demanding to know what happened.

**Slot lines (EN):**
> s1: Buthayna comes to demand answers
> s2: Someone must provide an explanation
> s3: Or pay to make it go away? 20 Gold Coins are enough.
> s4: You can break an Extravagance Card of Silver tier or lower

**Dice line (EN):**
> Deceive Buthayna
> The dice count provided by your Sociability and Charisma is affected by Buthayna
> You need 3 Successto deceive Buthayna.

<!-- settlement[0] -->
**Outcome — branch, condition `{"counter.7100003>=": 15, "s2.贵族": 1}`:** *"Do You Know Who I Am?"*
> You leisurely straighten your sleeves, calmly drinking tea, keeping Buthayna waiting. 
> Her expression changes slightly. Soon she calms down - offending a powerful minister like you over a few slave girls and gold coins isn't worth it, especially when she lacks concrete evidence... 
> The anger vanishes from her face. Buthayna takes a deep breath and politely sees you out, pretending nothing happened.

<!-- settlement[1] -->
**Outcome — branch, condition `{"counter.7100004>=": 15}`:** *"What Did You Say?"*
> You narrow your eyes slightly, set down your teacup, and ask her to repeat herself. 
> Buthayna's expression changes slightly. Soon she calms down - offending you over a few slave girls and gold coins isn't worth it... not if she wants to continue operating in the Dark Alley. 
> The anger vanishes from her face. Buthayna takes a deep breath and politely sees you out, pretending nothing happened.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s3.金币=": 20}`:** *"I'll Pay, of Course"*
> You take out your money - twenty gold coins in total. 
> Honestly, it's not enough, but Buthayna's face darkens as she decides not to pursue the matter further - after all, business requires maintaining goodwill. And so the matter passes.

<!-- settlement[3] -->
**Outcome — success, condition `{"r1:社交+魅力-e(社交+魅力)>=": [3, 5]}`:** *Turn the Tables*
> Before she can make accusations, you turn the tables, berating her fiercely. 
> You insist that when you entered the room, the four slave girls were already gone, and now what about your Sultan Card? Every day delayed brings you closer to your Execution Day - who will compensate for your lost time, your lost life? 
> Buthayna's fury instantly subsides. She softens her stance, trying to appease you, promising various benefits. You reluctantly agree to let the matter drop, secretly delighted.

<!-- settlement[4] -->
**Outcome — failure, condition `{"r1:社交+魅力-e(社交+魅力)<": [3, 5]}`:** *Still Denying?*
> You insist you have nothing to do with this, but Buthayna doesn't believe you. Moreover, many clients saw you following the slave girls into the private room... 
> Although no one dares stop you when you angrily leave, Buthayna can't swallow this insult. She complains to everyone, inciting nobles to speak ill of you at court... 
> Tsk. This troublesome woman.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3.金币=": 20, "s4.奢靡": 1}`:** *A Setup?*
> Buying four slave girls only to have them escape before you could enjoy them - laughable. 
> After breaking this card, gossipers linger outside your home for days, observing closely whether you've secretly brought those legendary barbarian slave girls home...


## Invoking the Sacred Icon — rite `5000850` (敦请圣像)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000850_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Roaming_Swordsman#Invoking_the_Sacred_Icon

**Intro (EN):**
> This broken sculpture depicts the Star-Souled God who ruled the Highland skies. In war, the heavens shattered and the statue lost half its form, preserved only by blind faithful using sticks, straw, and mud. That it stands at all seems a genuine miracle.

**Slot lines (EN):**
> s1: Final Anchor
> s2: How to make this relic your own?
> s3: Consumable

**Dice line (EN):**
> Attempting to forcibly remove the statue
> Your Magic and Wisdom provide you with the full dice count
> You need at least 5 Success to safely remove the statue.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.is": 2000913, "s2.rare<": 4}`:** *Oath's Blessing*
> They say the Star-Souled blessed this Testaments to Bygone Oaths, promising the return of their age of worship... Now, through this shattered image, the greatest Star-Souled sees this pledge again... 
> The statue weeps, mourning the age when it was venerated, freely walked the mortal realm, and played with humans... These tears fall onto the covenant, seeping into the dreams of all who ever pressed their blood onto this parchment. None can refuse this summons, none can evade this duty... The restoration of the Highland Kingdom will be fulfilled.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.is": 2000913, "s2.rare=": 4}`:** *Kingdom Approaches*
> When you show the Oath Testament to the Highlord, it senses the power overflowing within - human desires and dreams, the sweetest nectar for the Star-Souled... As if in shared hallucination, the broken statue seems to bow and step forward, breaking free of its ramshackle supports, reaching toward its faithful... 
> In the rising dust, the Highland exiles kneel while you catch the glowing head of the statue - its power now yours to command.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s2.is": 2000013}`:** *Divine Authority*
> Ah, the last child of the bloodline that shared its essence with the deity... Though he has lost this faith, the god still loves him - he is nearly its child! 
> The statue weeps, droplets falling onto the bewildered prince's arm... This is the Star-Souled's power bestowed upon him - those loyal shall gather to him even if physically destroyed; those who betrayed him cannot escape their due suffering, even in death.

<!-- settlement[3] -->
**Outcome — branch, condition `{"any": {"s2.邪神的面容": 1, "s2.正神的面容": 1}}`:** *Divine Banishment*
> The voices you hear, the faces you see suddenly materialize from the void, exploding like violent shockwaves, yet as if nothing happened - when you clutch your head and struggle for rationality amid piercing ringing, you discover the Highlord's Effigy has crumbled to dust, while the god you worship, across endless void, conveys satisfaction to you.

<!-- settlement[4] -->
**Outcome — success, condition `{"r1:s2.魔力+s2.智慧+s3.魔力+s3.智慧>=": [5, 5]}`:** *Power Over Meaning*
> [s2.name] analyzes the statue's remaining magical circuits and safely deactivates them... This object of immense magic is now in your possession.

<!-- settlement[5] -->
**Outcome — failure, condition `{"r1:s2.魔力+s2.智慧+s3.魔力+s3.智慧<": [5, 5]}`:** *Sacrilege*
> While analyzing the statue's magical circuits, [s2.name] makes several errors. The statue begins dancing wildly, destroying its supports... In the dust and rubble, you gain nothing.


## Wine and Flesh — rite `5006029` (酒与肉)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006029_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Wine_and_Flesh

**Intro (EN):**
> Adila wants to have a drink with Maggie, do you want to join in?

**Slot lines (EN):**
> s1: Adila wants to visit Maggie
> s2: Maggie should attend
> s3: You can join this small talk.

**Dice line (EN):**
> You grab a small knife and start dueling with her...
> The numbers of dices provided by your Combat are affected by Adila.
> You need at least 1 Success to achieve victory.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2": 1, "!s3": 1}`:** *You decide not to join the women's discussion.*
> You arrange for Maggie to meet her alone – after all, she’s here specifically to see Maggie.
>
> Maggie is pleasantly surprised by her visit and quickly asks the maid to prepare nuts, dried fruits, and plenty of honey and cheese. The two of them spend a full two hours together, with bursts of laughter echoing from time to time.
>
> When Adila leaves, Maggie comes to find you. Her wine-flushed cheeks makes her look particularly charming. She tells you that Adila has shared a story about how her family is cursed by a dragon, preventing them from ever having male heirs. Adila seems to truly believe in the existence of the dragon and is determined to slay it to end the curse.
>
> As Maggie speaks, a complicated expression crosses her face. She pauses, as if wanting to say something, but in the end, she simply shakes her head and stays silent. Perhaps even she hasn’t figured out what to say.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2": 1, "s3": 1}`:** *You choose to entertain Adila with your wife.*
> Maggie greatly appreciates your respect for her. According to the noble tradition, the lady of the house must be present when entertaining unmarried female guests in the inner chambers.
>
> But Adila doesn't consider herself a guest at all. She eats freely, tearing into meat chunks, and drinks heavily. Eventually, she starts talking about her family.
>
> “My ancestors killed a dragon. A real dragon – a massive, winged lizard.”
>
> You nod and tell her that you’ve heard stories about dragons too. The story came from Jabal – the general who was always obsessed with venturing into the unknown. He once told you that, long ago, the Sultan’s armies spent years scouring the land in search of dragons. Yet even with the strength of an entire nation, they never found even a single dragon scale.
>
> Still, Jabal believes that dragons existed – and so do you.
>
> Adila’s eyes widen, clearly not expecting your agreement. Then, with renewed excitement, she dives into the history of her family. She explains that the Adila family had been warriors for generations. They were once extremely prominent, and among every Sultan's grand generals, there was always one from her lineage.
>
> But about two centuries ago, one of her ancestors encountered a dragon. He tracked it relentlessly, following its trail deep into its lair, and ultimately slew it.
>
> “At the time, my old ancestor thought dragons were nothing more than oversized lizards,” she says with a bitter laugh. “Dead is dead, right? Well, it turns out that dragons are far more formidable than that.”
>
> With its dying breath, the dragon cursed the Adila family, ensuring they would never kill another dragon again. The curse manifested in a cruel way: from that day forward, no male heirs were ever born into the family. And a woman's hands were for spinning thread and cooking - not for wielding swords. A family with only women could never slay a dragon.
>
> As Adila recounts this twisted tale of curses and dragons, she toys with the carving knife stuck in her lamb shank. As Adila recounts this twisted tale, she toys with the carving knife in her lamb shank. Her tone is mocking, but her eyes betray a melancholy she can't hide.
>
> “So you see,” she continues, “even though my family has done well for itself, run entirely by women, the moment I said I wanted to take up the sword, my grandmother, mother, aunts, cousins – all of them – jumped in to stop me. They said the dragon’s curse forbids us from touching weapons, and if I dared to try, it would only anger that dead dragon even more! They're... ah, forget it. Just treat it as drunk talk, nothing more."
>
> Her voice trails off, and she downs the last of her wine in a single, fluid motion. From the way she handles the cup, you suspect she isn’t drunk at all. She just needed the courage of the drink to tell you this story.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"!s2": 1, "s3": 1}`:** *You choose to entertain Adila alone.*
> According to the noble tradition, the lady of the house must be present when entertaining unmarried female guests in the inner chambers. But Adila doesn't consider herself a guest at all... Perhaps Maggie won't be angry about this... hopefully.
> Adila eats freely, tearing into meat chunks, and drinks heavily. The conversation turns to her family only after she is half-drunk.
> “My ancestors killed a dragon. A real dragon – a massive, winged lizard.” She puts down her glass and stares straight at you as if she is judging whether you believe her or not...
> It occurs to you that the Sultan once sent the adventurous general Jabal to lead his army around for years in search of dragons.Yet even with the strength of an entire nation, they never found even a single dragon scale. And yet...
> You hesitate, unsure how to respond, but Adila doesn’t miss a beat. She slams her glass down with a thud, waving a leftover goat bone in one hand, and demands that you to fight her. She can't take anyone suspecting her of being a swindler.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"!s2": 1, "s3": 1, "r1:战斗-e(战斗)<": [1, 5]}`:**
> The goat bone catches you right in the head before you can react. Adila freezes, the shock sobering her up a bit. She backs off – as wild as she might be, she's still a guest and wouldn't dare to seriously harm her host. After making sure you're not hurt, she apologizes, straightens up in her seat, and starts telling you about her family.

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"!s2": 1, "s3": 1, "r1:战斗-e(战斗)>=": [1, 5]}`:**
> No matter which angle Adila swings the goat bone from, you smoothly deflect each blow. You're so in control that you even manage to grab the bone and use it to pin her down. She bursts into laughter as she admits defeat, praising your skills over and over again. When things finally settle down, she clears her throat, straightens up in her seat, and with a suddenly serious face, starts telling you about her family.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"!s2": 1, "s3": 1}`:**
> She explains that the Adila family had been warriors for generations. They were once extremely prominent, and among every Sultan's grand generals, there was always one from her lineage.
>
> But about two centuries ago, one of her ancestors stumbled upon a dragon. He tracked it relentlessly, following its trail all the way to its lair, and finally slayed it.
>
> “At the time, my old ancestor thought dragons were nothing more than oversized lizards,” she says with a bitter laugh. “Dead is dead, right? Well, it turns out that dragons are far more formidable than that.”
>
> With its dying breath, the dragon cursed the Adila family, ensuring they would never kill another dragon again. The curse manifested in a cruel way: from that day forward, no male heirs were ever born into the family. And a woman's hands were for spinning thread and cooking - not for wielding swords. A family with only women could never slay a dragon.
>
> As Adila recounts this twisted tale of curses and dragons, she toys with the carving knife stuck in her lamb shank. As Adila recounts this twisted tale, she toys with the carving knife in her lamb shank. Her tone is mocking, but her eyes betray a melancholy she can't hide.
>
> “So you see,” she continues, “even though my family has done well for itself, run entirely by women, the moment I said I wanted to take up the sword, my grandmother, mother, aunts, cousins – all of them – jumped in to stop me. They said the dragon’s curse forbids us from touching weapons, and if I dared to try, it would only anger that dead dragon even more! They're... ah, forget it. Just treat it as drunk talk, nothing more."
>
> Her voice trails off, and she downs the last of her wine in a single, fluid motion. From the way she handles the cup, you suspect she isn’t drunk at all. She just needed the courage of the drink to tell you this story.


## Malicious Joke — rite `5006670` (恶意的玩笑)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006670_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Nawfal#Malicious_Joke

**Intro (EN):**
> Upon setting foot in the Vizier's mansion, you hear his followers boasting about his achievements at the banquet. Seeing you arrive, he claps, summoning the male prostitute who flirted with Nawfal. 
>
> "You came just in time, my lord. You could certainly accompany my next step—" He smirks, pushing the prostitute into your arms, "Please spend a night with him. We all know the Sultan's Game frustrates you; this is an excellent time for indulgence!"

**Slot lines (EN):**
> s1: Should you engage in carnality with the male prostitute in person? Or think of another way?
> s2: You must engage personally to break a Carnality Card of no more than Bronze tier

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"!have.2000312": 1}`:**
> All taunts are meaningless, for Nawfal is already dead! Hahaha, the noble laughs, holding the prostitute's shoulder as they leave and generously treats everyone to a lavish feast of camel.

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"!have.2000349": 1}`:**
> Nobody mentions pranking Nawfal anymore. Now, a more pressing issue arises: Abdul is dead, who will be the next Vizier? Do themselves have a chance? If not, whom should they flatter next?

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1.主角": 1}`:** *You agreed*
> Seeing you nod, the male prostitute immediately climbs onto your shoulder, snuggling against your chest. The cheap and vulgar scent of balm makes your head ache.
>
> He does everything he can to please you, while you have the leisure to listen to the nearby nobles chatting.
>
> They speak excitedly about how this male prostitute and Nawfal's relationship, which is sadomasochism and subtle, has become a scandal throughout the city. They mockingly criticize Nawfal, claiming his charity is driven by personal desire, a longing to find that lowly man he glimpsed briefly, rather than by any kindness or generosity!
>
> "That's right!" They laugh and clap at this indelible stigma, looking towards you with eager eyes, as though they themselves are in the action, "Alright, alright, our best friend, just spread the news that you've 'taken' the prostitute, then quietly... haha, people will just think Nawfal goes mad for a male prostitute and accidentally falls into a stinking ditch!"
>
> Hearing this, the male prostitute beneath you shouts out more enthusiastically, perhaps you are the most distinguished guest he has served. But his eyes are locks on the smiling Vizier sitting above. That is the most distinguished guest he has seen.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1.金币": 1}`:** *You took out a few gold coins*
> "Take it," you generously give the male prostitute a large sum of money and loudly say that today's guests are on you – it's not that you are unwilling to cooperate, it's just that your recent situation... Ahem, is a bit overwhelming. Colleagues exchange glances and give you ambiguous smiles, while the male prostitute, after a brief pause, puts the money in his pocket, and then coquettishly turns around to embrace the Vizier's neck...
>
> Abdul does not expect him to be so bold, but his understanding lackey immediately swears loyalty in a low voice, stating he will take responsibility for this and won't let the noble Abdul carry the stigma – they will loudly declare they "took" the male prostitute and plan to keep him at home, and then you'll have a chance to quietly capture Nawfal... hahahaha. By then, people will just think he goes mad for a male prostitute anyway! After all, now this male prostitute's deep and complicated relationship with him has been retold in over a dozen versions.
>
> Perhaps the intoxicating music at this moment, or the strong wine he has just consumed, or the ease and joy of eliminating Nawfal fill his heart, as all those present are his supporters... With them, the Vizier responds passionately to the male prostitute right in front of you, allowing his hand to reach inside the Vizier's garment...

<!-- settlement[2] -->
**Outcome — branch, condition `{"!s1": 1}`:**
> You did nothing, so your colleagues' gleeful expressions turned cold. They looked at you with suspicion and caution until the vizier nods, and you were then asked to leave the banquet. What happened after? You have no way of knowing.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s2": 1}`:**
> You take out the Carnality Card, but before you start recounting the process, The Sultan interrupts. "I've heard about it all, not only did you have an affair with Nawfal's lover in public, but you're also planning to marry him as your wife. Haha, I've heard it all!" The Sultan laughs heartily, while Nawfal's face turns livid, attempting to argue, but his voice is drowned by the courtiers' laughter. The Vizier looks at Nawfal with a smug smile.
>
> As for you, your scandal has already spread throughout the streets, fueled by certain people's stories, and you can neither stand up to clear your name. No matter how you swear to Maggie that you have no intention of marrying a male prostitute, she still feels very, very embarrassed, shutting herself away to cry silently several times.


## Youth’s Curtain — rite `5008010` (青年的帷幕)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008010_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Faraj#Faraj_s_Connections

**Intro (EN):**
> Under your roof, Faraj is humble as a servant. But in the Upper City's most luxurious, radical parties, he is the eagle chasing the storm, every word and gesture attracting attention and admiration... Unfortunately, such socializing might be too extravagant for the young, maybe you should provide him with some reasonable support.

**Slot lines (EN):**
> s1: Faraj
> s2: Radical crowd
> s3: You must participate yourself to break the Sultan Card.
> s4: You can place Gold Coins or Convictions, up to 15 Gold Coins.
> s5: You can take this to break a Bloodshed Card of Rock tier or lower

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"all": {"s5.杀戮": 1, "s5.rare=": 1, "s3.主角": 1}}`:** *The state is ruined by your parents.*
> Looking at these ignorant youths with their high-sounding talks, you can’t help but feel annoyed. You are running around trying not to get executed by the Sultan, while they drink the finest wine, flirt with the prettiest girls, and discuss reforms and policies for which they never have to pay... So, you give them a lesson about the Sultan, about politics.
> You talk about the history of the Sultanate, the basic political and economic structure, and the noble class – that is, the behind-the-scenes division of their family’s interests, those dirty businesses supporting this velvet room... You write with blood all over a whole wall, and until the victim completely breathes his last, no student dares to leave the class.
> Later, the Sultan personally comes to view this wall and orders that the host of the party preserve it forever with varnish and gold powder.
> From that day on, Faraj seems lost in spirit... but he still habitually returns to your home.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"all": {"!s4": 1, "!s5": 1}}`:** *Everyone adores heroes, ideals, but ultimately adores vanity.*
> You heard one day, when he needed to buy everyone a drink, he didn't have enough coins – a disappointing night for any young person.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"all": {"!s5": 1, "type": "item", "any": {"s4.is": 2000172}}}`:** *While they were talking about swords and jade...*
> At the party, you voiced words of treason – not out of agitation, but rationality, solid as a sledgehammer and stone sculpture, which easily shatters the flashy yet fragile minds of the noble youth. It's time to reshape them.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"all": {"type": "item", "!s5": 1, "s4.金币>=": 1, "s4.金币<=": 10}}`:** *He is still embarrassed about money.*
> These gold coins are enough to cover his daily expenses, but that's about it – Faraj holds them, looking more anxious than holding a bowl of fire, but seeing this was worth it.

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"all": {"type": "item", "!s5": 1, "s4.金币>": 10, "s4.金币<=": 14}}`:** *You gave him enough gold coins to make new friends.*
> "Consider it for me", you comforted him... and he did fairly well.

<!-- settlement_extre[5] -->
**Outcome — branch, condition `{"all": {"type": "item", "!s5": 1, "s4.金币>=": 15}}`:** *You arranged for a servant to settle his bill.*
> Faraj happily told you he has made many new friends who spend time listening to him, and he conveys much of... your ideas. These concepts enlightened the spiritually empty noble youths.


## Adila's Challenge — rite `5000631` (阿迪莱的战书)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000631_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Adila_s_Challenge

**Intro (EN):**
> A woman dressed as a warrior blocks your doorway, aggressively demanding an explanation.

**Slot lines (EN):**
> s1: A warrioress is causing you trouble.
> s2: You can meet her in person or send a follower to receive her.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"counter.7000660<": 1, "counter.7000661<": 1}`:**
> As soon as she sees you, Adila gives you an angry rant. That rhino was her prey. She has been tracking it for months, and when she finally, finally managed to wound it, you swooped in, and claimed the trophy. She is deeply upset.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"counter.7000660<": 1, "counter.7000661<": 1}`:**
> You try to talk to her, but she wants none of your excuses. She will solve this the warrior's way. She proposes a competition over a powerful lion outside the city. Whoever hunts down the prey first wins. If you lose, she wants you to return the White Rhino Skin to her. Her family sword is just in need of a beautiful rhino hide sheath.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"counter.7000660<": 1, "counter.7000661<": 1}`:**
> "But if you win…" She tilts her chin up, pride gleaming in her eyes. Clearly, she finds the notion absurd. "Hmph. Then I will acknowledge defeat, and you may do with me as you wish!"

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"counter.7000660<": 1, "counter.7000661<": 1}`:**
> As you wish... Ha. You glance at the Sultan Card in your hand, perhaps...

<!-- settlement_extre[4] -->
**Outcome — branch, condition `{"counter.7000661>=": 1}`:**
> The moment she saw you, Adila start venting. That rhino had been her mark for months. She’d spent months tracking it, managed to wound it after a tremendous effort. Then you showed up and stole the final kill. She was <I>not</I> happy.
> You tried to explain, but she wasn’t having it. Everyone was saying you only brought the beast down using some cursed magic from a Sultan Card. She told you there’s a fierce lion roaming just outside the city. The two of you should race to see who can take it down first. If you lose, she wants the rhino hide back—it would make a perfect sheath for her family’s heirloom sword. And this time, you’re not allowed to use Sultan Cards.
> But should she lose, she’ll let you use a Sultan Card on her, no complaints. Not that it’ll come to that, of course. Because there’s no way you’ll win. Absolutely none!


## Girl Returning the Book — rite `5002009` (还书的少女)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5002009_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Lumera#The_Beggar_Girl

**Intro (EN):**
> She wandered near your house... God only knows how she found your house... It seems she wants to return the book.

**Slot lines (EN):**
> s1: Ragged Girl
> s2: Book Once Maiden
> s3: This is an excellent target for harm. Besides your conscience, no one will blame or retaliate against you. After all, the Sultan’s Game thirsts for blood, and it is good if inconsequential blood can be used to satisfy it.
> s4: Spend 5 Gold Coins to treat her well

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"!s3": 1, "!s4": 1}`:**
> You asked her three questions about the book, she answered two correctly, and summarized one better than you remembered. She wanted to thank you for your kindness... after you fed her, bathed her, and dressed her in clean clothes, you gained a clever servant. 
> Moreover, she actually returned the book; that’s great.

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"s3.杀戮": 1}`:**
> In a sense, this is also a kind act. You chose an innocent person, who had no connections and whose death would not bring sorrow to anyone, to satisfy the Sultan's malicious game. For this humble girl, the more she knew, the more she realized her powerlessness against the world, only adding to her pain.
> In the end, she held the books high – keep the blood from staining the covers. What a good child.

<!-- settlement_prior[2] -->
**Outcome — branch, condition `{"s3.纵欲": 1}`:**
> You explained your need; for both parties, it was a fair price. She repaid the kindness, and you didn’t have to harm others to fulfill the Sultan's malice. Clearly, she's not unfamiliar with such matters, but during the process, she couldn't hold back her tears... She apologized while asking if even after studying, a woman could only do such things.
>
> The next morning, you saw she kicked over the ladder for taking the book and hung herself on the beam in the study.

<!-- settlement_prior[3] -->
**Outcome — branch, condition `{"s3.奢靡": 1, "s4": 1}`:** *Because they don't acknowledge the value of the soul, this is called extravagance.*
> You ask her three questions about the book, she answer two correctly, and summarize one better than you remembered.
>
> You immediately realize she's a genius! She deserves the best treatment – so you declare you'll adopt this child as your goddaughter, hastily arranging as decent and swift a ceremony as possible.
>
> Of course, the noble status isn’t easily obtained – everyone, including Lumera herself, still considers her as your servant, labeling your benevolence as a desperate courtier's whim, or some strange idea to fulfill the Sultan's task.
>
> After all, she’s so small, inconspicuous, and even the Sultan doesn’t care to harm her...
> Only you understand she holds <size=+10><font="Title SDF"><b>Promising Futures</b></font></size>.

<!-- settlement_prior[4] -->
**Outcome — branch, condition `{"!s3.奢靡": 1, "s4": 1}`:** *Raise Her as Your Own Daughter*
> You order servants to prepare a chamber befitting her noble status, purchasing fine clothes, jewelry, and exotic spices... After a complete transformation, she emerges as a remarkably graceful, keen, and endlessly curious lady – a treasure whose true value only you recognize.
>
> This brings you an unexpected delight, even providing comfort amid the Sultan's Game – yet Lumera, still unaccustomed to her noble station, soon returns to the servant's quarters, with her all books...


## The Mountain Lion's Final Demand — rite `5002517` (山狮最后的索求)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5002517_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Killing_the_Fierce_Lion#The_Mountain_Lion_s_Final_Demand

**Intro (EN):**
> Should you trust the evil dream or dispose of the monster still craving human flesh?

**Slot lines (EN):**
> s1: The fierce lion with countless victims under its fangs.
> s2: You can either go yourself or dispatch a strong enough follower to hunt.
> s3: An extra companion, a better chance of success.
> s4: Some things might come in handy during the hunt.
> s5: You can take this to break a Conquest Card of Bronze tier or lower
> s6: Sacrifice for the Mountain Lion.

**Dice line (EN):**
> Hunting a lion requires more than just bravado. You had better be well-prepared – with traps, bait, or stronger weapons... You'll need anything that can give you the slightest edge. And pray for good luck...
> The number of dice provided by your Physique and Combat is affected by the enemy's corresponding attributes.
> You need at least 1 Success to win.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s6": 1}`:** *You sacrificed a living person.*
> The mountain lion eagerly pounces on its meal... devouring wildly, feasting grandly, leaving only bones and blood pools, with the feline sighing satisfyingly, you are sure something has departed from its body.
>
> The gigantic cat curiously eyes you, its face smears with blood, then lie on the ground exposing its soft belly for you to caress.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:s2.体魄+s2.战斗+s3.体魄+s3.战斗+s4.体魄+s4.战斗+s5.体魄+s5.战斗-e(战斗+体魄)>=": [2, 5]}`:**
> The lion cautiously circles around, eventually succumbing to the temptation of the sheep and stepping into your trap. 
> Its paws and stomach are pierced by sharp wooden spikes, its fur soaked in blood. It roars loudly, trying to escape, but you force it back with your spear. This is a battle of strength and endurance; you cannot afford a moment of laxity. 
> Finally, the lion exhausts its last bit of strength and collapses with a whimper. After ensuring it is truly dead, you drag its body out of the trap. 
> Conquering a lion is the ultimate symbol of a warrior's glory. As you wearily carry the lion's bloodied head through the long street, everyone remembers the hero's name.

<!-- settlement[1] -->
**Outcome — success, condition `{"r1:s2.体魄+s2.战斗+s3.体魄+s3.战斗+s4.体魄+s4.战斗+s5.体魄+s5.战斗-e(战斗+体魄)>=": [1, 5]}`:**
> The lion did not fall into your trap. You must rely on your agility and strong physique to engage in a prolonged struggle with the cunning beast. 
> Finally, you seize an opportunity to leap onto the lion's back and plunge a dagger into its vulnerable throat. Despite its attempts to throw you off, you hold on tightly to its mane, praying to the gods. 
> Gradually, its struggles weaken, and it collapses on the blood-soaked sand, lifeless. The world is silent, save for the sound of your heartbeat. It is dead. A sudden wave of relief washes over you, followed by unbearable pain and dizziness. 
> When you awaken, you have been taken to a city Sanitarium by a passerby, and your bravery in battling the fierce lion has become a city-wide legend.

<!-- settlement[2] -->
**Outcome — failure, condition `{"r1:s2.体魄+s2.战斗+s3.体魄+s3.战斗+s4.体魄+s4.战斗+s5.体魄+s5.战斗-e(战斗+体魄)<": [1, 5]}`:**
> A reckless attack has cost you the chance of victory. 
> You and the lion face off, not daring to show any fatigue. Using the best disguise you have, you maintain a strong facade. After a long standoff, the injured lion roars and retreats. Watching its form disappear into the sands, you nearly drop your dagger and collapse. 
> Blood has long soaked through your clothes, and pain explodes from your back, spreading throughout your body. The lion's claws have left deep, hard-to-heal wounds, and you need immediate treatment.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:s2.体魄+s2.战斗+s3.体魄+s3.战斗+s4.体魄+s4.战斗+s5.体魄+s5.战斗-e(战斗+体魄)>=": [1, 5], "s5": 1}`:**
> The Sultan listens intently to your detailed lion hunt story. He accepts the lion's head you offer and permits you to break a Conquest Card. 
> A few days later, the blood-soaked lion's head hangs on the wall of the audience hall, symbolizing the Sultan's power, glory, and bravery.


## Tempting Opportunity — rite `5004508` (监守自盗)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5004508_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Tempting_Opportunity

**Intro (EN):**
> With frequent thefts occurring, the Purist Order invites a faithful person of your reputation to guard the Sacred Light Source - their aether storage. 
> What a fortunate situation - like a mouse falling into a rice bin!

**Slot lines (EN):**
> s1: Steal? You can send someone with at least 5 Charisma and Combat for this task.
> s2: Steal? You can send someone with at least 5 Charisma and Combat for this task.
> s3: Devoted Faith in the Immaculate Purity

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> No one discovers you secretly substituting a flask of ordinary water for aether from the Light Spring...

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"any": {"s1.is": 2000352, "s2.is": 2000352}}`:**
> Upon returning home, Mahir triumphantly produces a flask she secretly acquired... You hadn't even noticed when she took it!

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s3": 1}`:**
> Your cover-up proves flawless; the Order suspects nothing, even considering your willingness to accept night duty as proof of devotion.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s1.污染者": 1}`:**
> After obtaining the Aether, Badriyyah doesn't leave with you. Giggling, she walks step by step into this sapphire-like pool... Let this mortal woman soil the nectar prepared for the gods!
> She removes her garments one by one; the fabrics quickly dissolve like ink in the azure pool... Then her tattoos begin fading - you've never seen her like this, naked and clean.
> When her hair begins falling out, she smilingly prevents anyone from approaching, mischievously pressing her lower abdomen... Urine and blood flow down her legs into the pool, followed by nails, teeth, peeling skin and organs - black organs.
> As her final skeleton collapses and dissolves in the pool, the formerly sapphire-clear water has become pitch-black, churning with foul bubbles... You'd better flee quickly, before the god realizes someone has spat in its refreshing treat.

<!-- settlement_extre[3] -->
**Outcome — branch, condition `{"s2.污染者": 1}`:**
> After obtaining the Aether, Badriyyah doesn't leave with you. Giggling, she walks step by step into this sapphire-like pool... Let this mortal woman soil the nectar prepared for the gods!
> She removes her garments one by one; the fabrics quickly dissolve like ink in the azure pool... Then her tattoos begin fading - you've never seen her like this, naked and clean.
> When her hair begins falling out, she smilingly prevents anyone from approaching, mischievously pressing her lower abdomen... Urine and blood flow down her legs into the pool, followed by nails, teeth, peeling skin and organs - black organs.
> As her final skeleton collapses and dissolves in the pool, the formerly sapphire-clear water has become pitch-black, churning with foul bubbles... You'd better flee quickly, before the god realizes someone has spat in its refreshing treat.


## Under the Sultan's Gaze — rite `5006027` (御前试合)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006027_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Under_the_Sultan%27s_Gaze

**Intro (EN):**
> The Rod of Life's fame grows... more and more of its rumors keep the Sultan vigilant, even restless at night.
>
> Finally, he asks you to demonstrate the fake phallus's power before him – Alas, the benevolent Sultan proposes that this glorious demonstration in the lapis lazuli hall is worth breaking a Gold Carnality Card, only if you draw it.

**Slot lines (EN):**
> s1: Yourself
> s2: An ally with Passion, or an ally equipped with the Rod of Life, or... the Rod itself
> s3: Golden Carnality Card of the highest tier

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"s2.is": 2000556}`:** *Infinite Loyalty*
> You dismantle this thing and personally deliver it to the throne — this invincible weapon can only belong to the Sultan. And infinite loyalty surpassing even one's own desire of self to the Sultan, who can surpass this? You rarely see the Sultan laughs so happily, he praises you tirelessly and rewarded you with a large sum of money.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.妻子": 1}`:** *Grand Harmony*
> The Sultan’s intent was perhaps half curiosity, half humiliation. But with the help of the Rod of Life, you and your wife overcame all shame, presenting a fluid and harmonious passion – an ability to make one's partner feel blissful that moved the entire palace – nearly everyone displayed envious expressions... The Sultan seemed influenced by this atmosphere as well; he made a few praises of you and your wife and then dismissed you.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1.生命权杖": 1, "!s2.妻子": 1}`:** *Barbarity and Bliss*
> This prolonged, powerful, and debauched feast shocked the palace. The ministers quietly watched as you exhibited invincible techniques with the Rod of Life, as if overwhelmed by your indomitable aura. Finally, when you stood proudly in front of the Sultan, you suddenly realized you had overstepped your bounds...
>  You immediately knelt to apologize to the Sultan, but alas, his cruelty and bestial desire had been provoked to the extreme by the previous obscene performance – he declared that subjects were unworthy of using such a monarch's tool, and as punishment, your flesh-bound prosthetic would be cut off at once... It is a self-evident law in this country that there cannot be a phallus better than the Sultan's!
>  You bled to death in the palace like a clown.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s2.生命权杖": 1, "!s2.妻子": 1}`:** *Disgrace at Court*
> The Sultan wanted to humiliate you, and you satisfied his wildest imagination. But truly, you never expected the Rod of Life to feel this pleasurable...
> [s2.name] was evidently a bit scared of the Sultan, but the power of the Rod of Life surpassed earthly dominion. You were entirely conquered in the center of the palace hall, emitting various strange cries and terrifying sounds, finally collapsing from exhaustion under the gaze of the ministers and the Sultan.
>  Regardless, such humiliation and pleasure must never be repeated in this lifetime.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"any": {"all": {"s2.生命权杖": 1, "s3": 1}}}`:**
> Such legendary tales can break any Carnality Card.


## Thirst for Blood — rite `5006071` (血的渴求)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006071_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Thirst_For_Blood

**Intro (EN):**
> An unseen presence in your dreams craves more blood... endlessly, insatiably, more blood...

**Slot lines (EN):**
> s1: Are you prepared to provide a sacrifice, or seek help from your faith?
> s2: Any True Faith or Conviction of the Cult
> s3: Consumables to assist with checks

**Dice line (EN):**
> [s1.name] prays to the God...
> Your Magic determines your full number of dice.
> You need at least 2 Successes.

<!-- settlement[0] -->
**Outcome — branch, condition `{"!s2": 1, "s1.主角": 1}`:** *You Sacrificed Yourself*
> Guided and tempted by that voice in your dreams, you grasp a sharp dagger and slice your skin. Scarlet blood joyfully gushes from the wound, but not enough, never enough. The voice presses anxiously against your heart. Not enough...!
>
> Dizziness brings a formless embrace to your hand, tenderly yet urgently comforting the wounds. No pain disturbs your sacrifice.
>
> You close your eyes.

<!-- settlement[1] -->
**Outcome — branch, condition `{"!s2": 1, "!s1.主角": 1}`:** *You Sacrificed [s1.name]*
> Under the allure of the voice from your dreams, you grasp a sharp dagger and slice [s1.name]'s skin. Scarlet blood gushes from the wound.
> Not enough, never enough. The voice presses anxiously against your heart. Never enough, never...Your world bleeds to scarlet as the blade dances across skin, each slash painting fresh strokes upon this crimson canvas...
> You wake at nightfall from your fevered dream. Scattered flesh surrounds you, yet your heart feels neither guilt nor fear – only a mysterious joy. Your hands, blessed by unknown powers, now hold the strings of fate.

<!-- settlement[2] -->
**Outcome — success, condition `{"any": {"s2.is": 2000728}, "r1:魔力>=": [2, 5]}`:** *You Prayed for God's Help*
> You squeeze your eyes shut, and you chant the Immaculate Purity over and over in midday's pure light, pleading for His help. 
> No nightmare or shadow can linger amid candles, gold, and mirrors. You hear a hateful wail, carried away by the warmth of a gentle breeze. Thus, the faithful believer receives redemption.

<!-- settlement[3] -->
**Outcome — success, condition `{"any": {"s2.is": 2000412}, "r1:魔力>=": [2, 5]}`:** *You Prayed for God's Help*
> You squeeze your eyes shut, whispering that forgotten name in the midnight shadows. Who dares threaten His followers in His domain – in this realm of darkness and dreams? The darkness surges around you, and you feel that strange, entangling presence being devoured by your master... Was that a chewing sound you just heard?

<!-- settlement[4] -->
**Outcome — failure, condition `{"r1:魔力<": [2, 5]}`:**
> The god remains silent to your prayers, while the demon of dreams stirs in vengeful awakening.


## No Loose Ends — rite `5000565` (不留后患)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000565_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#No_Loose_Ends

**Intro (EN):**
> The Royal Guard Captain steps obliviously into your snare.

**Slot lines (EN):**
> s1: Seliman was unprepared
> s2: You can do this yourself or send any of your followers to do it.
> s3: You can place a Bloodshed Card of a tier no higher than the Royal Guard Captain's.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.主角": 1}`:** *You killed Seliman*
> Unexpectedly, Seliman didn't even put up any resistance.
> His brows were entangled with pain, but his eyes were relaxed: "Did Sadani ask you to do this?" He asked this question with his last bit of strength, but he didn't need to get an answer from you.
> He closed his eyes and fell down in the sharp and soft embrace of the reeds, as if this was the last thing he could do for Sadani.

<!-- settlement[1] -->
**Outcome — branch, condition `{"!s2.主角": 1}`:** *You killed Seliman*
> Unexpectedly, Seliman didn't even put up any resistance.
> His brows were entangled with pain, but his eyes were relaxed: "Did Sadani ask you to do this?" He asked this question with his last bit of strength, but he didn't need to get an answer from you.
> He closed his eyes and fell down in the sharp and soft embrace of the reeds, as if this was the last thing he could do for Sadani.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3": 1}`:** *You have used a Bloodshed Card*
> The Sultan doesn’t seem to care about Seliman's death.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s3": 1}`:**
> Your actions inevitably left traces.


## Duel with the Lion — rite `5001021` (和狮子对决)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001021_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Brutal_Fight#Duel_with_the_Lion

**Intro (EN):**
> This lion has devoured many of the Sultan's ministers... Half of the audience hopes your warrior can kill the lion, while the other half hopes you get eaten by the lion, sooner or later.

**Slot lines (EN):**
> s1: The fierce and cruel lion hungers only for blood.
> s2: The fighter has already been chosen by you.
> s3: You can still provide items for this battle to slightly increase your chances of victory.

**Dice line (EN):**
> Can you win this duel?
> The number of dice provided by your Combat and Physique is affected by the Lion's corresponding attributes.
> You need at least 3 Successes to survive.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"!s2.主角": 1, "r1:战斗+体魄-e(体魄+战斗)>=": [3, 5]}`:** *Victory!*
> A split second before the Lion bites through its opponent's throat, [s2.name] bravely pries open its jaws with his steel-like arms. The bloody struggle lasts a long time until [s2.name] finally rips open the Lion's head... Later, [s2.name] tells you that deep in the Lion's throat, [s2.gender] heard a cacophony of distorted death cries... You tell [s2.gender] never to mention this to anyone.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"!s2.主角": 1, "r1:战斗+体魄-e(体魄+战斗)<": [3, 5]}`:** *Failure*
> [s2.name] was devoured by the lion, and you couldn't even retrieve[s2.gender]body...

<!-- settlement_extre[2] -->
**Outcome — success, condition `{"s2.主角": 1, "r1:战斗+体魄-e(体魄+战斗)>=": [3, 5]}`:** *Victory!*
> As the lion opened its bloodstained jaws, ready to tear out its prey's throat, you seized the moment and, with arms like steel, pried apart its jaws. The bloody struggle dragged on for what felt like an eternity – until, at last, you tore the lion's head apart.
>
> Afterward, you recall hearing twisted screams echoing from deep within the lion's throat... You decide not to let anyone else know about this.

<!-- settlement_extre[3] -->
**Outcome — failure, condition `{"s2.主角": 1, "r1:战斗+体魄-e(体魄+战斗)<": [3, 5]}`:** *Failure*
> The lion tore you apart, leaving nothing but scattered remains too shattered to ever reassemble.


## Natural Rebirth — rite `5006023` (自然新生)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006023_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Natural_Rebirth

**Intro (EN):**
> Mahir is very angry with your suggestion, feeling it desecrates her great creation. After some kind words and the promise of further funding, she begins to seriously consider your problem.
> “Well... if it’s the Water of Life... it might resolve the problem, essentially a small-scale rebirth, growing your limb back to its original form...”
> She hesitates and seems uncertain, implying the procedure carries some risk.
> Do you want to try? Abandon the bronze genital for a new, original, non-phantom pain inducing, but also non-automatic spinning model?
> What, you don’t know how to get the Water of Life? Well, of course, by investing in her experiments...

**Slot lines (EN):**
> s1: The Rod of Life and You
> s2: Responsible Mahir
> s3: Water of Life
> s4: 5 Gold Coins Surgery Fee
> s5: What's the best consumable, take it out quickly!

**Dice line (EN):**
> You feel an unprecedented surge of vitality but can your body withstand its full release?
> Your Physique determines your full dice count.
> You need 2 Successes to ensure intactness.

<!-- settlement[0] -->
**Outcome — branch, condition `{"!s3": 1}`:**
> You believe there’s no need for the Water of Life and command Mahir to forcibly remove it. This results in even more intense phantom pain...

<!-- settlement[1] -->
**Outcome — branch, condition `{"s3": 1}`:**
> After your promise of further investment, she applies a numbing agent on you.
> Next, a series of clink and clank sounds – sounds not typically associated with a human body – resound, and the Rod of Life is cast aside.
> She opens a bottle of Water of Life, applying the precious liquid to the scarred cut...

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"s3": 1, "r1:体魄>=": [2, 5]}`:**
> Your willpower mixed with the Water of Life's efficacy seeps into your veins, saturates your soul, and then erupts.
> Guess what?
> The newly grown part is actually <b><size=125%>larger</size></b> than before!

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"s3": 1, "r1:体魄<": [2, 5]}`:**
> You attempt to channel your consciousness to guide the power of the Water of Life... yet to no avail.
>
> The new one that grows is roughly the same size as the original, but some uncontrollable force has surged elsewhere... Your belly grows larger, with fat hanging around your waist, causing the exposed part of that thing to diminish... An adverse effect to your Charisma by no small margin.
>
> At least those terrible dreams and phantom pains will haunt you no longer.


## This might not be the best idea... — rite `5006505` (这或许不是最好的主意……)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006505_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Fatuna#This_might_not_be_the_best_idea...

**Intro (EN):**
> Maggie has noticed your recent hesitant demeanor. Now, she seems to be in a good mood and takes the initiative to ask you about it. Maybe this is a good time to talk to her about that matter – the one where you could take another wife.

**Slot lines (EN):**
> s1: Maggie finally has some free time
> s2: You must discuss this with your wife personally
> s3: Is there something to help you persuade Maggie?
> s4: Wife's Resentment

**Dice line (EN):**
> You plan to persuade your wife
> Your Charisma and Sociability determine your full dice count.
> 2 Successes to persuade

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"counter.7000128>=": 1}`:** *Reminds you of the absurd acts with Zaki and Fatuna.*
> As you were about to speak, you suddenly remembered the time at the bathhouse... that unexpected, unforgettable threesome with you, Fatuna, and her son... The rose-scented mist seemed to fill your nostrils once again. You began to wonder if you could really marry Fatuna and live under the same roof with Maggie, Fatuna, and Zaki...
> The complex and immoral entanglement made you shiver as you couldn't decide whether you were yearning or dreading it. Nonetheless, this secret affair, not accepted by the world, made you lose the courage to openly propose to marry Fatuna to your wife.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s4": 1}`:** *You try to persuade your wife.*
> You prepared a string of honeyed words to make Maggie happy before revealing your true intention. However, Maggie remained cold-faced. Don't you know what you've done before? She's seen through you, this damned, disappointing man.
> Seeing this, you quickly swallowed back the intention to marry Fatuna. Are you kidding? You don't want to lose Maggie over this trivial matter. You still rely on her for managing the estate, buying books, and negotiating with others... She is still of great use!

<!-- settlement[1] -->
**Outcome — failure, condition `{"r1:魅力+社交<": [2, 5]}`:** *This doesn’t make sense*
> You prepared a string of honeyed words, finally making Maggie smile. Then, taking advantage of the situation, you revealed your true intention, telling Maggie about your desire to marry Fatuna.
> Maggie was stunned. She widened her eyes, making sure you weren't joking, and then angrily stood up. She incredulously yelled for you not to even think about it and stormed into the room, locking the door behind her.
> All right... even if you stubbornly marry Fatuna, no one will be willing to face Maggie’s reaction. You can only brace yourself and tell Fatuna the result. Fatuna silently nodded, showing no sign of regret or resentment, and returned to her usual composure. A peaceful life continuing like this isn't bad either. She keeps a clear line with you, but you notice that Fatuna still drinks tea with Maggie.

<!-- settlement[2] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [2, 5]}`:** *Appeal to reason and emotion*
> Maggie was persuaded by you. After a brief shock, she fell into deep thought: “She indeed is a pitiful person, and I do like her – of course, as a friend... Moreover, her family background is distinguished enough to match your lineage... But what do you think of it? You are the master of this house; you indeed have the right to marry another wife. But if you must ask for my opinion, I can only say she is not the worst choice, and I respect my man's decision.”
> She looked straight at you, as if trying to see through your eyes into your heart and soul.


## The Promised Moment — rite `5008056` (应许时刻)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008056_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Fardak#The_Promised_Moment

**Intro (EN):**
> The Sultan ruthlessly rejected Fardak's request. Now everyone knows he can never return to his hometown.
>
> Heartbroken, Fardak instinctively shows up at your door once more.

**Slot lines (EN):**
> s1: Fardak
> s2: You choose to embrace him, persuading acceptance of this cruel fate.
> s3: You choose to tell him that you can help him escape...
> s4: You choose to tell him he should act like a mouse...

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2": 1}`:** *Bittersweet Respite*
> At this point, what more can be done but to accept this cruel fate? You sit opposite each other, not speaking a word.
>
> In his eyes, you see a familiar weariness and despair; perhaps he sees the same in yours. You are like two small boats facing the same storm at sea... He moves closer to you, or perhaps you to him; it no longer matters. You embrace each other.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s3": 1}`:** *I can help you escape*
> This is no simple matter – you're not one to joke about such things. Fardak looks at you in surprise, waiting for you to continue.

<!-- settlement[2] -->
**Outcome — branch, condition `{"have.2000853": 1, "s4": 1}`:** *You need to act like a mouse...*
> You soothe the anxious and sorrowful young man, telling him that the steep path known to the lions and gazelles is unknown to the Sultan, and it is his only way out. But he cannot simply sneak away... He must hide like a mouse in the shadows of the Sultan's palace, then escape swiftly when the Sultan is unaware.
>
> Fardak sighs deeply, clenches his fists, and says, "Of course, I can wait...! No need to rush."
>
> He promises not to do anything drastic or impulsive. Before leaving, he places a sharp dagger in your hand.
>
> "...At first...I was going to use it to end myself. Now I'd rather give it to you – whenever I see it, those thoughts just... they come right back."

<!-- settlement[3] -->
**Outcome — branch, condition `{"!have.2000853": 1, "s4": 1}`:** *You need to act like a mouse...*
> You soothe the anxious and sorrowful young man, telling him that the only thing he can do is to hide like a mouse in the shadows of the Sultan's palace, then escape swiftly when the Sultan is unaware.
>
> Unfortunately... you recall that narrow path again. It might have been a possible escape for Fardak if it had remained unknown to the Sultan. But it's all too late now.


## A Proper Meal — rite `5008088` (合宜的一餐)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008088_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Habib#A_Proper_Meal

**Intro (EN):**
> Habib has arrived at the guesthouse's kitchen, arranging his pots and sharpening his knives, preparing for this pre-appointment trial.

**Slot lines (EN):**
> s1: Ready to Impress
> s2: How much will you allocate for ingredients? 10 gold coins would certainly be more than sufficient.
> s3: If you provide 10 gold coins for a feast, you can take this to break a Extravagance Card of Rock tier

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.金币=": 10}`:** *You provided Habib with a generous budget*
> He accepted the coins with excitement, purchasing fresh, seasonal ingredients from the market without pocketing a single copper piece. These exceptional materials showcased his culinary mastery, and soon, irresistibly enticing aromas wafted above the guesthouse - complex, rich, intoxicating. 
> Not only were the rough laborers you'd hired captivated, but you yourself could not help swallowing in anticipation...

<!-- settlement[1] -->
**Outcome — branch, condition `{"all": {"s2.金币>=": 6, "s2.金币<=": 9}}`:** *Generous Funding*
> He respectfully accepted your reasonable sum - perfectly suited for his specialty: feeding many bellies with fair-priced, satisfying meals. 
> Soon, appetizing aromas filled the guesthouse, causing the hired laborers to grow restless, craning their necks and asking when the feast might begin.

<!-- settlement[2] -->
**Outcome — branch, condition `{"all": {"s2.金币>=": 1, "s2.金币<=": 5}}`:** *Test of Skill*
> Creating a generous yet economical meal with limited funds - the ultimate test for any cook. 
> Habib accepted with quiet understanding, taking the modest sum to the marketplace. Before long, delicious aromas drifted through the guesthouse. Without prompting, your hired laborers abandoned their half-hearted tasks, gathering in curious anticipation. 
> Undoubtedly, Habib had found his rightful occupation.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3.奢靡": 1}`:**
> Building some pathetic guesthouse in a place like Dark Alley, then throwing away a thous... ten gold coins to fill the bellies of those worthless commoners - such wasteful extravagance is certainly enough to break this low-tier Extravagance Card.


## The Uncanny Mirror — rite `5000301` (诡异的镜子)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000301_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/The_Ancient_Mirror#The_Uncanny_Mirror

**Intro (EN):**
> That old warehouse—untouched for a decade—now hums with whispers and flickers with eerie blue light. Something stirs where nothing should.

**Slot lines (EN):**
> s1: How long has it been in your home?
> s2: Take someone with you to see what stirs.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.男性": 1, "s2.女性": 1}`:** *A Peculiar Thing to Mimic*
> Under cover of night, you and [s2.name] ventured into the old warehouse, drawn by its secrets...
> The eerie blue light pulsed again, matching your footsteps. Beneath a dust-laden cloth lay a flat, glowing object—your own reflections shimmering faintly through the fabric. A mirror?
> Compelled, you tore the cloth aside. The mirror showed not just your face, but everything—your home, your life, your fumbling first steps into the game. The mirror had watched and remembered. Just as its depths threatened to swallow you whole, [s2.name] stepped forward, casting [s2.gender(his,her)] reflection into the mirror—
> [s2.name] gripped your shoulder. The world lurched. You were back. But something had followed. A crystalline figure, naked and glowing, its liquid form rippling as it shaped itself to match [s2.name]’s silhouette.
> You watched, stunned, as its hands explored the peculiar duality between its thighs. Amusement struck you before the shock could take root.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.女性": 1}`:** *Shaped by the Reflection*
> Under cover of night, you and [s2.name] ventured into the old warehouse, drawn by its secrets...
> The eerie blue light pulsed again, matching your footsteps. Beneath a dust-laden cloth lay a flat, glowing object—your own reflections shimmering faintly through the fabric. A mirror?
> Compelled, you tore the cloth aside. The mirror showed not just your face, but everything—your home, your life, your fumbling first steps into the game. The mirror had watched and remembered. Just as its depths threatened to swallow you whole, [s2.name] stepped forward, casting [s2.gender(his,her)] reflection into the mirror—
> [s2.name] gripped your shoulder. The world lurched. You were back. But something had followed. A crystalline figure, naked and glowing, its liquid form rippling as it shaped itself to match [s2.name]’s silhouette.
> But the face remained unfinished—shifting, uncertain. Perhaps it needed more than mimicry. Perhaps it needed to learn?

<!-- settlement[2] -->
**Outcome — branch, condition `{"s2.男性": 1}`:** *Shaped by the Reflection*
> Under cover of night, you and [s2.name] ventured into the old warehouse, drawn by its secrets...
> The eerie blue light pulsed again, matching your footsteps. Beneath a dust-laden cloth lay a flat, glowing object—your own reflections shimmering faintly through the fabric. A mirror?
> Compelled, you tore the cloth aside. The mirror showed not just your face, but everything—your home, your life, your fumbling first steps into the game. The mirror had watched and remembered. Just as its depths threatened to swallow you whole, [s2.name] stepped forward, casting [s2.gender(his,her)] reflection into the mirror—
> [s2.name] gripped your shoulder. The world lurched. You were back. But something had followed. A crystalline figure, naked and glowing, its liquid form rippling as it shaped itself to match [s2.name]’s silhouette.
> But the face remained unfinished—shifting, uncertain. Perhaps it needed more than mimicry. Perhaps it needed to learn?


## The Call of Darkness — rite `5000513` (黑暗的召唤)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000513_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Haunted_Mansion#The_Call_Of_Darkness

**Intro (EN):**
> You frequently dream of returning to that perilous mansion, following blood trails from a fallen dagger deeper into darkness. Something awaits you there, calling you.

**Slot lines (EN):**
> s1: Traces of black magic can help you find clues
> s2: You must handle this issue personally
> s3: You can find a wise person for help
> s4: Certain items can help you uncover more clues during conversations

**Dice line (EN):**
> You look for a mentor who can give you answers.
> Your Sociability and Wisdom provide you with the full dice count.
> You need at least 3 Successes.

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"counter.7000571>=": 1}`:**
> In the lingering shadows, you hear mocking laughter. But daylight breaks, and the dream dissolves into nothing.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:社交+智慧>=": [3, 5]}`:** *A Woman Found*
> Her shelter is crude, burning strange incense, with no light penetrating the worn tapestries. Her jewelry emits a moon-like glow, outlining her entrancing silhouette, her garments parted like a doorway inviting entry into darkness.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"r1:社交+智慧<": [3, 5]}`:**
> It leads you into a fog-filled labyrinth where you wander in circles until morning light breaks through. You awaken exhausted to the sound of fading sighs.


## Proof of Valor — rite `5000551` (勇武的证明)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000551_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#Proof_of_Valor

**Intro (EN):**
> You must hunt down the beasts that are causing chaos outside the city within a certain time limit to prove your bravery and win the favor of Consort Sadani. But the Sultan has not told you what the beasts are, or where they are located. It looks like a trap. The hunter is waiting for you to step into it as a bloody sacrifice, and you have no choice but to do so.

**Slot lines (EN):**
> s1: You must prove your bravery yourself.
> s2: You can bring some items that will help you hunt.

**Dice line (EN):**
> You spend several days searching for a quarry worthy of being called a "ferocious beast" – a wolf king who has only just assumed command of his pack. His domain is vast, his loyal throng numerous, and the hunt to fall him fraught with peril.
> Your Physique and Combat determine your full dice count.
> You need at least 3 Success to get a kill.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:体魄+战斗>=": [5, 5]}`:**
> Through precarious calculations and a thrilling struggle, overcoming a trial of physical prowess and endurance, you finally decapitate the wolf king.
> Panting, you lift the head, dripping with hot blood. You estimate it is worth at least one Silver Card – the same quality as Consort Sadani.
> Good heavens, how commendable! You have learned to compartmentalize matters around you so adeptly. Stone, Bronze, Silver, and those worthy of Gold... Keep at it. Your world will soon become simpler. The Sultan's Game will become your everything.

<!-- settlement[1] -->
**Outcome — success, condition `{"r1:体魄+战斗>=": [3, 5]}`:**
> After a harrowing blend of cunning stratagem and fierce combat – a dual trial of strength and endurance – you finally sever the beast king’s head. 
>
> You withstand the agony of your wounds as you scrutinize this hard-won trophy, and deduce that it merits at least a Silver Card – the same quality as that of Consort Sadani. 
>
> By the heavens, how commendable! You have grown so adept at classifying the world around you, sorting everything into Stone, Bronze, Silver, and Gold... Press on, for soon your world will be made plain. The Sultan’s Game shall govern all that you are.

<!-- settlement[2] -->
**Outcome — failure, condition `{"r1:体魄+战斗<": [3, 5]}`:**
> Your hunt yields an unforeseen mishap; fortunately, this little “accident” has not claimed your life. Yet the time you have left dwindles. Whether you perish at the wolf king’s jaws or beneath the Sultan’s blade, what difference does it make?


## Deal with the Sorceress — rite `5000747` (处置女邪术师)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000747_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Captured_Cultist#Deal_with_the_Sorceress

**Intro (EN):**
> How will you deal with this Occultist who worships the Cultic God?

**Slot lines (EN):**
> s1: Captured, she is at your mercy.
> s2: In this situation, you should step in personally.
> s3: Choice 1: Use Carnality card on her
> s4: Choice 2: Use Bloodshed card on her

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3": 1}`:** *You decide to indulge in carnality*
> Looking at your card, she laughs brazenly. She grasps your hand holding the Carnality Card, mimicking the depicted posture, pressing your bodies tightly together.
> What matters more than pleasure? What concerns us more than desire? In your passionate embrace, revelation pierces through the veil that has long troubled you - life is merely deception, a meaningless arrangement of endless toil. Only death, yes, only death offers the redemption and end to suffering! You comprehend life's mysteries, and in this moment, you both reach ecstatic heights while simultaneously smiling into eternal, painless sleep.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s4": 1}`:** *You decide to enjoy the bloodshed*
> Unexpectedly, she smiles and grasps your hand holding the Sultan Card, mimicking the depicted posture, using the card to slice her own throat. That massive wound becomes her true lips, truth flowing like blood, which you instinctively respond to with lover-like kisses and drinking - through this gift, an ancient secret pours into your mind - life is merely deception, a meaningless arrangement of endless toil, the god guiding our pleasures was banished, but shall return!
> <size=+10><font="Title SDF"><b>THEY - SHALL - RETURN!</b></font></size>

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"s4": 1, "counter.7000582<": 1}`:** *Unholy Ritual*
> Your killing draws god attention, and the Sultan's Game witnesses this achievement. In the moment the card breaks, through the splattered blood, you glimpse a sublime vision - angels attending at the god's side. In ancient times, a god was judged evil and banished for unauthorized world-alteration - now, through game-created stains and your vision, Their name will be sanctified anew, returning once more.


## Emergency Marriage — rite `5002030` (紧急结婚)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5002030_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Shama#Emergency_Marriage

**Intro (EN):**
> If being a Lady of Delights is dishonorable for the family, then as long as you redeem Shama and make her a concubine for a statesman, maybe her father will be placated? You certainly are a clever one!

**Slot lines (EN):**
> s1: Shama
> s2: You must show up yourself.
> s3: You must present 30 Gold Coins to ransom Shama and organize the wedding
> s4: You can take the opportunity to break an Extravagance Card that is not higher than Shama's tier

<!-- settlement[0] -->
**Outcome — branch, condition `{"counter.7000199<": 1}`:**
> Shama has moved into your house, bringing with her twenty carriages chock-full of accessories, dresses, books, and artwork collections. These things have barely reached the doorstep before your wife erupted on her. Reluctantly, you settle her in a nearby house.

<!-- settlement[1] -->
**Outcome — branch, condition `{"counter.7000199>=": 1}`:**
> Shama moved into your house with twenty carriages of accessories, dresses, books, and artwork collections. Maggie is dead, no one can stop you from doing this, yet for some reason, you feel a chill down your spine for several days after...

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s4": 1}`:** *You thus break an Extravagance Card*
> The Sultan is very pleased with the wedding after hearing your story with Shama. After all, you played a prank on a Grand Lord, an opportunity not always present.


## Sacred Encounter — rite `5004808` (神圣的会晤)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5004808_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sacred_Encounter

**Intro (EN):**
> What a spectacle - two deities appear before you in succession...

**Slot lines (EN):**
> s1: The Mightiest Cultic God
> s2: The Purifying Truth God

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1.is": 2000843, "s2.is": 2000847}`:** *Convergent Paths*
> Creator and Purifier regard each other coldly; clearly, gods dislike reunions or chance meetings. 
> Before you can decide what to ask of them, your mind shrinks... the space where gods dwell becomes cramped - no, your mind isn't shrinking - both deities freely expand their transcendent forms - growing larger, nearly filling your will entirely... 
> One side of your mind craves pain, feeling utterly defiled, wanting to flay your skin, burn what lies beneath with acid, scrape away all filth - while your other mind cannot resist urges to kill, destroy, witness holy men's debauchery, roast virgins on spits!
> Clutching your head, you writhe in agony. The true god claiming to purify all, the Cultic God claiming to liberate all - face to face, how similar their inflicted suffering!
> You see nothing, your mind's eye blinded, completely filled with God power, you should never have done this, how could you allow these opposing gods simultaneously -
> "Destruction!"
> This voice erupts in your mind. 
> "Destruction! Destruction! Destruction!"
> Your eyes widen, seeing nothing. Tears flow, each drop laden with divinity and malice.
> You understand - no savior exists - deities bring only one thing to the mortal world...
> <size=+10><font="Title SDF"><b>"Destruction!"</b></font></size>
> If any difference exists between them, it's merely in their methods, means, and aesthetics of world destruction, but the result remains: Destruction! Destruction! Destruction!
> With sudden clarity, you close your eyes... again seeing the two deities standing face to face...
> Standing behind the Creator, you glimpse the Immaculate Purity's true face. Their countenance bears nothing... They desire everything to vanish, return to blank slate...
> Then circling behind the Immaculate Purity, you glimpse the Creator's true face. Like churning black mud, urgent ink droplets, wanting to blacken everything, eliminate distinction between pain and pleasure...
> They suddenly turn to regard you.
> Time to awaken, mortal - you've learned enough about divinity.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s1.is": 2000843, "s2.is": 2000848}`:** *Convergent Paths*
> Corruption and Purity regard each other coldly; clearly, gods dislike reunions or chance meetings. 
> Before you can decide what to ask of them, your mind shrinks... the space where gods dwell becomes cramped - no, your mind isn't shrinking - both deities freely expand their transcendent forms - growing larger, nearly filling your will entirely... 
> One side of your mind craves pain, feeling utterly defiled, wanting to flay your skin, burn what lies beneath with acid, scrape away all filth - while your other mind cannot resist urges to kill, destroy, witness holy men's debauchery, roast virgins on spits! 
> Clutching your head, you writhe in agony. The true god claiming to purify all, the Cultic God claiming to liberate all - face to face, how similar their inflicted suffering! 
> You see nothing, your mind's eye blinded, completely filled with God power, you should never have done this, how could you allow these opposing gods simultaneously - 
> "Destruction!" 
> This voice erupts in your mind.
> "Destruction! Destruction! Destruction!" 
> Your eyes widen, seeing nothing. Tears flow, each drop laden with divinity and malice. 
> You understand - no savior exists - deities bring only one thing to the mortal world... 
> <size=+10><font="Title SDF"><b>"Destruction!"</b></font></size>
>  If any difference exists between them, it's merely in their methods, means, and aesthetics of world destruction, but the result remains: Destruction! Destruction! Destruction! 
> With sudden clarity, you close your eyes... again seeing the two deities standing face to face... 
> Standing behind the Creator, you glimpse the Destroyer's true face. Their countenance bears nothing... They desire everything to vanish, return to blank slate... 
> Then circling behind the Destroyer, you glimpse the Creator's true face. Like churning black mud, urgent ink droplets, wanting to blacken everything, eliminate distinction between pain and pleasure... 
> They suddenly turn to regard you. 
> Time to awaken, mortal - you've learned enough about divinity.

<!-- settlement[2] -->
**Outcome — branch, condition `{"s1.is": 2000844, "s2.is": 2000847}`:** *Convergent Paths*
> Corrupter and Purifier regard each other coldly; clearly, gods dislike reunions or chance meetings.
> Before you can decide what to ask of them, your mind shrinks... the space where gods dwell becomes cramped - no, your mind isn't shrinking - both deities freely expand their transcendent forms - growing larger, nearly filling your will entirely...
> One side of your mind craves pain, feeling utterly defiled, wanting to flay your skin, burn what lies beneath with acid, scrape away all filth - while your other mind cannot resist urges to kill, destroy, witness holy men's debauchery, roast virgins on spits!
> Clutching your head, you writhe in agony. The true god claiming to purify all, the Cultic God claiming to liberate all - face to face, how similar their inflicted suffering!
> You see nothing, your mind's eye blinded, completely filled with God power, you should never have done this, how could you allow these opposing gods simultaneously -
> "Destruction!"
> This voice erupts in your mind.
> "Destruction! Destruction! Destruction!"
> Your eyes widen, seeing nothing. Tears flow, each drop laden with divinity and malice.
> You understand - no savior exists - deities bring only one thing to the mortal world...
> <size=+10><font="Title SDF"><b>"Destruction!"</b></font></size>
> If any difference exists between them, it's merely in their methods, means, and aesthetics of world destruction, but the result remains: Destruction! Destruction! Destruction!
> With sudden clarity, you close your eyes... again seeing the two deities standing face to face...
> Standing behind the Corruptor, you glimpse the Immaculate Purity's true face. Their countenance bears nothing... They desire everything to vanish, return to blank slate...
> Then circling behind the Immaculate Purity, you glimpse the Corruptor's true face. Like churning black mud, urgent ink droplets, wanting to blacken everything, eliminate distinction between pain and pleasure...
> They suddenly turn to regard you.
> Time to awaken, mortal - you've learned enough about divinity.


## Worries of the Wife — rite `5008001` (妻子的忧虑)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008001_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Maggie#Wife_s_Worries

**Intro (EN):**
> Now, everyone says the Sultan Card freed your nature – allowing you to do what you love most: rape, bloodshed… What others think doesn’t matter much, but what about Maggie's thoughts?

**Slot lines (EN):**
> s1: Worried Wife
> s2: You can't leave it to others. You have to do it yourself.
> s3: Anything you find useful

**Dice line (EN):**
> You try to comfort your wife.
> Your Charisma and Sociability determine your full dice count.
> You need at least 2 Successes to avoid Wife's Resentment.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [4, 5]}`:** *It's impervious that you care about her attitude*
> Of course, you understand Maggie's worries. At the dressing table, you embrace her from behind, soaking in the scent of her long hair, sharing your inner struggles.
> Perhaps these flowery words were not entirely sincere, but Maggie felt what she needed most... Your need and respect for her.
>
> She turns to rub her nose and cheeks against your face, telling you she will walk with you no matter what path you choose.

<!-- settlement[1] -->
**Outcome — success, condition `{"r1:魅力+社交>=": [2, 5]}`:** *She chooses to trust you.*
> Does Maggie care about present sin because she is kind? Or does she worry about future punishment because she is afraid? You feel neither, but you know that this woman won't abandon you – at least, not before you manifested those imaginary crimes into reality.

<!-- settlement[2] -->
**Outcome — failure, condition `{"r1:魅力+社交<": 2}`:** *So, this is the real you.*
> Your attitude of admission instead reveals your mindlessness towards the crime... or rather, your mindlessness towards your wife. Deep ran Maggie's disappointment.


## Glory through Wealth — rite `5008013` (收买头衔)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008013_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Qais#Buy_a_title.

**Intro (EN):**
> The number of people desperately wanting to escape the city is the same as those desperately trying to get in. Buying a suitable title isn't difficult for you.

**Slot lines (EN):**
> s1: It costs 10 Gold Coins.
> s2: You can send someone or go personally to purchase the title
> s3: You've heard he intends to leave the city
> s4: Maybe there is something that can help you persuade them.

**Dice line (EN):**
> Can you successfully buy this title?
> Your Sociability and Charisma determine your full dice count.
> Requires at least 4 Successes.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:**
> Without much effort, you find out that a minor noble can't bear the Sultan's madness and wants to just leave. Hearing your purpose, he, who has already gathered enough travel expenses, is rather indifferent.

<!-- settlement_extre[1] -->
**Outcome — success, condition `{"r1:社交+魅力>=": [4, 5]}`:** *You succeeded*
> You tell him that living an ideal life isn't as easy as leaving the capital. The title bestowed by the Sultan might not be useful in a foreign land, but the heavy gold is sure to help him find his footing.
> The noble is persuaded by you, and on that same day, he and you handle the paperwork together, and like that, you successfully exchange the title with this one from Jawad for Qais's title.

<!-- settlement_extre[2] -->
**Outcome — failure, condition `{"r1:社交+魅力<": [4, 5]}`:** *You failed*
> The noble refuses to give up his surname and title, which, for a traditional noble, is even worse than vying for his life. It seems you'll have to wait for another opportunity.


## Velvet Chamber — rite `5008116` (丝绒暗室)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008116_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Guesthouse#Velvet_Dark_Room

**Intro (EN):**
> You transform the attic into a discreet chamber for political intrigue. Heavy curtains create an atmosphere where anything might be discussed or accomplished.

**Slot lines (EN):**
> s1: Noble Conspiracy
> s2: Noble Conspiracy

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s1.追随者<": 1, "s2.追随者<": 1}`:**
> Two nobles drink and converse, unaware that valuable intelligence has reached your ears.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s1.密教徒": 1, "!s2.密教徒": 1, "any": {"s1.追随者>=": 1, "s2.追随者>=": 1}}`:**
> Under your subtle guidance, the conversation flows toward more valuable information.

<!-- settlement_extre[2] -->
**Outcome — branch, condition `{"any": {"all": {"s2.追随者>=": 1, "s2.密教徒": 1}}}`:**
> Under your subtle guidance, the conversation flows toward more valuable information.


## Sacred Branding — rite `5010034` (神圣的烙印)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5010034_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Bonum_in_se%3F#Sacred_Branding_Conclusion

**Intro (EN):**
> A mark of loyalty... branded over your heart.

**Slot lines (EN):**
> s1: Divine Patience
> s2: The tower guiding your god, that which should not exist
> s3: You absolved your god of the great sin of tearing reality's veil
> s4: You absolved your god of the great sin of coveting mortal realms
> s5: You absolved your god of the great sin of arrogant pride
> s6: You absolved your god of the great sin of harming innocents

<!-- settlement_prior[0] -->
**Outcome — branch, condition `{"!s1": 1, "any": {"!s2": 1, "!s3": 1, "!s4": 1, "!s5": 1, "!s6": 1}}`:** *Burning Out*
> As the sacred mission approaches its limit, that brand burns white-hot. Your blood, flesh, and soul incinerate - god desire and fanaticism consuming you...

<!-- settlement_prior[1] -->
**Outcome — branch, condition `{"s1": 1, "any": {"!s2": 1, "!s3": 1, "!s4": 1, "!s5": 1, "!s6": 1}}`:** *Each day, the brand expands*
> A recurring dream - They need a tower, foundation laid with innocent blood, built with arrogance, topped with gold, igniting judgment flames to rend the world, satisfying Its desire to enter our realm... This world is too filthy! Such dreams and demands flood your thoughts, blood seeping from that wound...

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2": 1, "s3": 1, "s4": 1, "s5": 1, "s6": 1}`:** *Fallen to Earth*
> Only void remains in your dreams. No pressure, no glowing moonstone, no divine voice - at the moment of completion, They eagerly released its heavenly connection, letting sin's weight carry it earthward.
> Now wake, and greet your god.


## The Real Culprit — rite `5000504` (幕后真凶)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000504_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Haunted_Mansion#Unsolved_Murders

**Intro (EN):**
> You have solid evidence that the Legal Official has committed a crime, and this is also the leverage you can use to control him and make him work for you.

**Slot lines (EN):**
> s1: You have the whereabouts of the Legal Official Amur.
> s2: Option 1: You can send a follower, or kill the culprit yourself.
> s3: Option 2: To blackmail the Legal Official into doing your bidding, you can send any follower, or talk to him yourself.
> s4: You must place the item <i>Valid Evidence</i>

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2": 1}`:** *You decide to kill this sinner...*
> Amur cries bitterly before the evidence you show him, begging for your forgiveness. However, those who had the right to forgive are long dead, and all that you can do is send him to them.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s3": 1}`:** *Make him an asset...*
> Amur cries bitterly before the evidence you show him, begging for your forgiveness. His old eyes are filled with disbelief, rancor, and fear, but as you expected, there is not a trace of remorse. Which is just fine. You need no remorse, you need his submission.
>
> The judge bows his trembling head and tells you all you wanted to know, from what the evil ritual in the mansion is meant to achieve, to the whereabouts of the Occultist who could preside over the ritual...


## Anonymous assailant — rite `5000554` (无名的暗杀)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000554_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#Anonymous_Assassination

**Intro (EN):**
> Night falls. Wickedness stirs beneath the shroud of darkness... Shadows close in around you. Beware.

**Slot lines (EN):**
> s1: You can't tell who's coming
> s2: You have to be careful
> s3: There are things that can help you get through a crisis.

**Dice line (EN):**
> You smell danger and grab your weapon in advance. With a slight noise, a knife comes at you just as you are distracted!
> The number of dice provided by your Physique and Combat is affected by the enemy's Physique and Combat.
> You need at least 1 Success to win.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:体魄+战斗-e(体魄+战斗)>=": [1, 5]}`:** *You defeated the assassin*
> You use all your strength to push away the blade and struggle against the masked assassin.
> His attacks are ferocious, relentless, but unlike a professional who would disappear after a single, targeted strike, he is like a warrior fighting with his own life. Did the Sultan send him? Just because through your guile, you managed to avoid death by an inch?
> No... no. During your confrontation, as your shoulders brush past each other, you catch a pair of eyes full of hatred, a hatred that will not die even if you died. Who is he...? You have no time to ponder.
> The sharp clanks of steel against steel resound through the silent night, and these eyes make it abundantly clear that only one of you will return to hearth and home.
> Fortunately, it is you. Exhausting every trick up your sleeve, you manage to strike him down. You wipe off the blood on your blade and pull off the assassin's mask. You recognize the face and those eyes, forever frozen in death: it is the Royal Guard Captain, the Sultan's most loyal servant. Was that profound hatred you felt just now an illusion? There is no way of knowing anymore.

<!-- settlement[1] -->
**Outcome — failure, condition `{"r1:体魄+战斗-e(体魄+战斗)<": [1, 5]}`:** *You died at the hands of an assassin*
> You use all your strength to push away the blade and struggle against the masked assassin.
> His attacks are ferocious, relentless, but he does not seem like a professional assassin who would disappear after a single, targeted strike. Instead, he is like a warrior fighting with his own life. Did the Sultan send him? Just because through your guile, you managed to avoid death by an inch?
> No... no. During the confrontation, as your shoulders brush past each other, you catch a glimpse of a pair of eyes full of hatred, a hatred that will not die even if you died. Who is he...? You have no time to ponder.
> The sharp clanks of steel against steel resound through the silent night, and these eyes make you realize clearly that only one of you will return to hearth and home.
> Unfortunately, that person is not you. You finally run out of strength and can no longer hold the weapon in your hand. The pain of your wounds tear all your thoughts to shreds, like silk threads that collapse at the touch of a finger, disappearing with the night wind.
> In your final moments, who is it that appeared in your mind? Will she weep for you?


## Anonymous assailant — rite `5000555` (无名的暗杀)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000555_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#Anonymous_Assassination

**Intro (EN):**
> Night falls. Wickedness stirs beneath the shroud of darkness... Shadows close in around you. Beware.

**Slot lines (EN):**
> s1: You can't tell who's coming
> s2: You have to be careful
> s3: There are things that can help you get through a crisis.

**Dice line (EN):**
> You smell danger and grab your weapon in advance. With a slight noise, a knife comes at you just as you are distracted!
> The number of dice provided by your Physique and Combat is affected by the enemy's Physique and Combat.
> You need at least 1 Success to win.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:体魄+战斗-e(体魄+战斗)>=": [1, 5]}`:** *You defeated the assassin*
> You use all your strength to push away the blade and struggle against the masked assassin.
> His attacks are ferocious, relentless, but unlike a professional who would disappear after a single, targeted strike, he is like a warrior fighting with his own life. Did your enemies send him?
> No... no. During your confrontation, as your shoulders brush past each other, you catch a pair of eyes full of hatred, a hatred that will not die even if you died. Who is he...? You have no time to ponder.
> The sharp clanks of steel against steel resound through the silent night, and these eyes make it abundantly clear that only one of you will return to hearth and home.
> Fortunately, it is you. Exhausting every trick up your sleeve, you manage to strike him down. You wipe off the blood on your blade and pull off the assassin's mask. You recognize the face and those eyes, forever frozen in death: it is the Royal Guard Captain, the Sultan's most loyal servant. Why is he here? Is the Sultan displeased? Did you make a mistake: does the Sultan want his son to live...? 
> A chill creeps up your spine. Alas, the dead gives no answers.

<!-- settlement[1] -->
**Outcome — failure, condition `{"r1:体魄+战斗-e(体魄+战斗)<": [1, 5]}`:** *You died at the hands of an assassin*
> You use all your strength to push away the blade and struggle against the masked assassin.
> His attacks are ferocious, relentless, but he does not seem like a professional assassin who would disappear after a single, targeted strike. Instead, he is like a warrior fighting with his own life. Did the Sultan send him? Just because through your guile, you managed to avoid death by an inch?
> No... no. During the confrontation, as your shoulders brush past each other, you catch a glimpse of a pair of eyes full of hatred, a hatred that will not die even if you died. Who is he...? You have no time to ponder.
> The sharp clanks of steel against steel resound through the silent night, and these eyes make you realize clearly that only one of you will return to hearth and home.
> Unfortunately, that person is not you. You finally run out of strength and can no longer hold the weapon in your hand. The pain of your wounds tear all your thoughts to shreds, like silk threads that collapse at the touch of a finger, disappearing with the night wind.
> In your final moments, who is it that appeared in your mind? Will she weep for you?


## Anonymous assailant — rite `5000556` (无名的暗杀)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000556_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#Anonymous_Assassination

**Intro (EN):**
> Night falls. Wickedness stirs beneath the shroud of darkness... Shadows close in around you. Beware.

**Slot lines (EN):**
> s1: You can't tell who's coming
> s2: You are in crisis
> s3: There are things that can help you get through a crisis.

**Dice line (EN):**
> You smell danger and grab your weapon in advance. With a slight noise, a knife comes at you just as you are distracted!
> The number of dice provided by your Physique and Combat is affected by the enemy's Physique and Combat.
> You need at least 1 Success to win.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:体魄+战斗-e(体魄+战斗)>=": [1, 5]}`:** *You defeated the assassin*
> You use all your strength to push away the blade and struggle against the masked assassin.
> His attacks are ferocious, relentless, but unlike a professional who would disappear after a single, targeted strike, he is like a warrior fighting with his own life. As your shoulders brush past each other, you catch a pair of stone-cold eyes. Did your enemies send him? What have you done lately to draw such an attempt...? You have no time to ponder.
> The sharp clanks of steel against steel resound through the silent night, and fortunately, it is you who emerge victorious. Exhausting every trick up your sleeve, you manage to strike him down. You wipe off the blood on your blade and pull off the assassin's mask. 
> You recognize the face and those eyes, forever frozen in death: it is the Royal Guard Captain, the Sultan's most loyal servant. Why is he here? Does he represent the Sultan's will? You are confused. There is a puzzle missing, and you thought you had the whole picture.
> A chill creeps up your spine. Alas, the dead gives no answers.

<!-- settlement[1] -->
**Outcome — failure, condition `{"r1:体魄+战斗-e(体魄+战斗)<": [1, 5]}`:** *You died at the hands of an assassin*
> You use all your strength to push away the blade and struggle against the masked assassin.
> His attacks are ferocious, relentless, but he does not seem like a professional assassin who would disappear after a single, targeted strike. Instead, he is like a warrior fighting with his own life. During the confrontation, as your shoulders brush past each other, you catch a glimpse of a pair of cold, scornful eyes, full of contempt – did your enemies send him? What transgression did you commit? 
> You do not know and you have no time to think. Against his brutal onslaught, your strength fails you. Slowly but surely, your arm grows weak. The pain of your wounds tear all your thoughts to shreds, like silk threads that collapse at the touch of a finger, disappearing with the night wind.
> In your final moments, who is it that appeared in your mind? Will she weep for you?


## Anonymous assailant — rite `5000557` (无名的暗杀)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000557_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#Anonymous_Assassination

**Intro (EN):**
> Night falls. Wickedness stirs beneath the shroud of darkness... Shadows close in around you. Beware.

**Slot lines (EN):**
> s1: You can't tell who's coming
> s2: You are in crisis
> s3: There are things that can help you get through a crisis.

**Dice line (EN):**
> You smell danger and grab your weapon in advance. With a slight noise, a knife comes at you just as you are distracted!
> The number of dice provided by your Physique and Combat is affected by the enemy's Physique and Combat.
> You need at least 1 Success to win.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:体魄+战斗-e(体魄+战斗)>=": [1, 5]}`:** *You defeated the assassin*
> You use all your strength to push away the blade and struggle against the masked assassin.
> His attacks are ferocious, relentless, but unlike a professional who would disappear after a single, targeted strike, he is like a warrior fighting with his own life. As your shoulders brush past each other, you catch a pair of stone-cold eyes. Did your enemies send him? What have you done lately to draw such an attempt...? You have no time to ponder.
> The sharp clanks of steel against steel resound through the silent night, and fortunately, it is you who emerge victorious. Exhausting every trick up your sleeve, you manage to strike him down. You wipe off the blood on your blade and pull off the assassin's mask. 
> You recognize the face and those eyes, forever frozen in death: it is the Royal Guard Captain, the Sultan's most loyal servant. Why is he here? Does he represent the Sultan's will?
> You are confused. There is a puzzle missing, and you thought you had the whole picture. A chill creeps up your spine. Alas, the dead gives no answers.

<!-- settlement[1] -->
**Outcome — failure, condition `{"r1:体魄+战斗-e(体魄+战斗)<": [1, 5]}`:** *You died at the hands of an assassin*
> You use all your strength to push away the blade and struggle against the masked assassin.
> His attacks are ferocious, relentless, but he does not seem like a professional assassin who would disappear after a single, targeted strike. Instead, he is like a warrior fighting with his own life. During the confrontation, as your shoulders brush past each other, you catch a glimpse of a pair of cold, scornful eyes, full of contempt – did your enemies send him? What transgression did you commit? 
> You do not know and you have no time to think. Against his brutal onslaught, your strength fails you. Slowly but surely, your arm grows weak. The pain of your wounds tear all your thoughts to shreds, like silk threads that collapse at the touch of a finger, disappearing with the night wind.
> In your final moments, who is it that appeared in your mind? Will she weep for you?


## A Warrioress' Challenge — rite `5000638` (女战士的挑战)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000638_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Adila_s_Challenge

**Intro (EN):**
> A woman dressed as a warrior blocks your door, aggressively demanding an explanation. She claims that the white rhino was her prey. After all it took to trap and wound it, you came out of nowhere and scared it off! Adila's anger flares higher and higher as she speaks, until she throws her sword on the ground and challenges you to a duel, her finger an inch from your nose.

**Slot lines (EN):**
> s1: The Enraged Warrioress
> s2: You can fight personally, or send a follower.
> s3: Certain consumables can come in handy in combat.

**Dice line (EN):**
> At this moment, you have no choice but to face the challenge.
> The number of dice provided by your Physique and Combat is affected by the enemy's corresponding attributes.
> You need at least 2 Successes to win.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(战斗+体魄)>=": [2, 5]}`:** *You won*
> You realize the moment your blades cross – this warrior is no mere showpiece. Her swordplay is razor-sharp, her footwork fluid and fast. Fury and battle-lust blaze in her eyes, but you are no lesser fighter. More than that, you are colder, sharper, more calculating. You let her rage guide her, bait her with a few careless words, and she becomes reckless, exposed... Too young, too naive. You whistle, lazy and amused. Now, she is your prisoner.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"r1:战斗+体魄-e(战斗+体魄)<": [2, 5]}`:** *You lost*
> You realize the moment your blades cross – she is no mere showpiece. Her swordplay is razor-sharp, her footwork fluid and fast. Fury and battle-lust blaze in her eyes, and soon burn through your defense. 
>
> You shout as you try to protect yourself from her attacks: her sword is too powerful; it is unfair. She laughs at your words and slashes your neck – you fall to your knees with a scream, holding your neck, but no blood comes out. 
>
> You have not even noticed when her blade was back in its sheath.


## An Interesting Incident — rite `5000712` (一桩趣事)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000712_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Nabhani#An_Interesting_Incident

**Intro (EN):**
> Nabhani – the most gorgeous swordsman in the capital, and the most adept user of his other sword come nighttime callings – knocks on your door. You don't know what he intends to do... surely he didn't come just to mock himself?

**Slot lines (EN):**
> s1: The Most Handsome Swordsman in the Capital
> s2: You can entertain him personally or let Maggie do it

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.妻子": 1}`:**
> Unlike the rumored frivolity, he was courteous and graceful in his every move – of course, these are all told to you by your wife afterward. You can see she highly approves of the man, even needing her to tiptoe with her words to avoid giving you any bad impressions.
> But that's not important. The key point is that as an excellent Swordsman, Nabhani expresses sympathy for your plight and is willing to lend a helping hand whenever you need it.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.主角": 1}`:**
> Nabhani spent half the evening mocking you, but unlike those who prey on your misfortunes, he shows genuine interest in the Sultan's Game:
> "From now on, should there be any adventures or other interesting activities, you may consider Nabhani your ally."
> After saying this, he quietly leaves, stealing your best bottle of wine on his way out.


## Master of Revels — rite `5000799` (寻欢作乐的高手)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000799_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Master_of_Revels

**Intro (EN):**
> The grand orgy you hosted rippled among all men and women; during this time, rumors and imaginations about the party were the hottest topic, making those who attended head over heels in pride and those who didn't continuously probing Buthayna about the next time... Underneath all this frenzy, Nabhani comes under your roof.

**Slot lines (EN):**
> s1: Nabhani has something to say
> s2: You must receive him personally

<!-- settlement[0] -->
**Outcome — branch, condition `{"counter.7000406>=": 1}`:** *Master of Pleasure*
> Without any expression, Nabhani places a fine bottle of liquor on your table. You immediately recognize it – the same bottle he took during his first visit to your home. Its crimson color, dark as blood, brings back memories of that night's cruel indulgence.
>
> "Now, I owe you nothing," Nabhani says, his eyes cold as ice, before turning away without another word.

<!-- settlement[1] -->
**Outcome — branch, condition `{"counter.7000406<": 1}`:** *True Master of Pleasure*
> Nabhani brings you a fine bottle of liquor, chuckling as he admires your elegant, sophisticated indulgences.
> "You're truly a master of pleasure," he says with a playful wink. "It seems I still have much to learn from you."
> Tipsy, you don't take his words seriously. But from that day on, Nabhani never again leaves you alone or slips away to pursue his pleasures.


## Fight with the Prisoner — rite `5001020` (和囚犯对决)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001020_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Brutal_Fight#Fight_with_the_Prisoner

**Intro (EN):**
> This is the Prisoner's only chance. Why was he sentenced to death? Honestly, you and he aren't that different.

**Slot lines (EN):**
> s1: This is the Prisoner’s only chance to stay alive after committing a capital crime.
> s2: The fighter has already been chosen by you.
> s3: You can still provide items for this battle to slightly increase your chances of victory.

**Dice line (EN):**
> Kill the opponent before being killed
> The number of dice provided by your Combat and Physique is affected by the Prisoner's corresponding attributes.
> You need at least 3 Successes to survive.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(体魄+战斗)>=": [3, 5]}`:** *Victory*
> The Prisoner's desperate thrust was too flawed. [s2.name] easily seized the opportunity and delivered a fatal blow. Afterwards, another battle ensued in the court, in which the ministers had to put in a lot of effort to persuade The Sultan not to use this method for executing all prisoners.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"r1:战斗+体魄-e(体魄+战斗)<": [3, 5]}`:** *Failure...*
> [s2.name] was more skilled and cut the Prisoner's shoulder first. However, the Prisoner clinched him desperately, and in the ensuing struggle, choked him with chains... They rolled in the mud, struggled, and tore each other in the pigsty mud for a long time. In the end, neither of them stood alive to claim victory.


## Duel with the Giant — rite `5001022` (和巨人对决)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5001022_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Brutal_Fight#Duel_with_the_Giant

**Intro (EN):**
> This giant comes from deep within the mountains. The masons found him in an abandoned cave... He has suffered through abuse and torment, refuses to or cannot speak the human tongue, and is filled with rage towards everything.

**Slot lines (EN):**
> s1: This Giant, tormented for ages, couldn't quell its wrath.
> s2: The fighter has already been chosen by you.
> s3: You can still provide items for this battle to slightly increase your chances of victory.

**Dice line (EN):**
> Can you win this duel?
> The number of dice provided by your Combat and Physique is affected by the Giant's corresponding attributes.
> You need at least 3 Successes to survive.

<!-- settlement_extre[0] -->
**Outcome — success, condition `{"r1:战斗+体魄-e(体魄+战斗)>=": [3, 5]}`:** *Victory!*
> The Giant's body is like stone, unfazed by pain and possessing immense strength. [s2.name] is driven to a dead end. Having lost all weapons, [s2.name] ignites a cloak with a torch and wraps it around the Giant's face...
> The frenzied Giant breaks through the stone wall and is eventually shot dead by soldiers with bows and arrows.

<!-- settlement_extre[1] -->
**Outcome — failure, condition `{"r1:战斗+体魄-e(体魄+战斗)<": [3, 5]}`:** *Failure*
> The Giant's strength was something Humans could not contend with. He ruthlessly pounded [s2.name], turning him into a bloody mess.


## Storm Omen — rite `5003004` (风暴预兆)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5003004_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Habib#Storm_Omen

**Intro (EN):**
> The servant tells you that Maggie left early in the morning. Upon closer inquiry, they hesitate and cannot give you a clear answer. You have a premonition that the storm you have been unwilling to face has already arrived.

**Slot lines (EN):**
> s1: Maggie has gone out
> s2: You can go yourself, or you can send a follower to investigate
> s3: You can bring some items with you to aid your investigation more stealthily

**Dice line (EN):**
> At this point, asking sincere questions and communicating is impossible – no one will repeatedly accept a dagger with a soft heart. She has long raised her shield and built high walls; you can't go back to the past, and it's your own doing. Do you really want to find out where Maggie went and what she did? Then be like Wild dog following the scent of meat. But be clear, no one welcomes Wild dog. For the sake of the little dignity left between you, it's best not to be discovered.
> Your Stealth and Sociability determine your full dice count.
> You need at least 1 Success to have a chance of getting the information.

<!-- settlement[0] -->
**Outcome — success, condition `{"r1:隐匿+社交>=": [1, 5]}`:**
> You don't even know how you got here. You emerge from the dark alley. 
> Three minutes ago, a young man inside the door opened it with a ladle in hand; he smiled when he saw Maggie. He embraced your Wife, lightly kissed her, and then pulled her inside. A tempting and rich fragrance poured out from every crack in the bricks. Was it from the soup he made by hand? It stirred your fading memories; why did it seem so familiar? It was like Maggie's favorite flavor - information you yourself had shared with him. 
> You found yourself approaching, almost placing your ear against the wall, trying to hear the murmurs and whispers inside. In this small room, Maggie was no longer your Wife. She belonged to another man. You hadn't seen her smile in such a way for a long time, and now, her beauty and gentleness were laid bare for someone else to enjoy. A flame burst in your chest – was it anger, jealousy, hatred, or resentment? Unknowingly, you and Maggie have reached the edge of a cliff.

<!-- settlement[1] -->
**Outcome — failure, condition `{"r1:隐匿+社交<": [1, 5]}`:**
> In the maze of intertwined alleys, you lost track of Maggie. There are countless forks in the road beneath your feet, each one leading to an unknown end, questioning you about what outcome you really want. Fate has played a dark joke on you. It's time to turn back.
> Finally, you turn around and retrace your steps. At the end of the path is your home, where you and Maggie live, lying under the night sky. You open the door and see Maggie kneeling at the table. She glances at you calmly and then returns to her work. You are weary and confused, but for now, it seems like nothing is wrong. In the lamplight, she is still your wife.


## Desperation — rite `5003016` (饥不择食)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5003016_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Desperation

**Intro (EN):**
> To complete the Sultan's Game, you consider desperate measures, such as directly seducing a nobleman's female relatives... Beauty, understanding, and voluptuousness are unnecessary, as long as they are foolish enough.

**Slot lines (EN):**
> s1: Of course, you take action personally.
> s2: Some things can make you more charismatic.
> s3: You can break a Carnality Card of Bronze tier or lower

**Dice line (EN):**
> Gifts, flattery, and empty promises...
> Your Charisma determines your full dice count.
> You need at least 1 Success.

<!-- settlement[0] -->
**Outcome — failure, condition `{"r1:魅力<": [1, 5]}`:**
> She screamed, then her brother, her father, and even her dog and cat came; you almost died today.

<!-- settlement[1] -->
**Outcome — success, condition `{"r1:魅力>=": [1, 5]}`:**
> The next day, the Sultan laughed loudly in palace at her name. You knelt with her father, one trembling, the other sighing deeply.


## Dispose of the Slave Awaiting Death — rite `5006010` (处置等死的奴隶)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006010_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Hemir

**Intro (EN):**
> The time has come. You decide to use the card you drew to deal with the slave who dared to steal from the master.

**Slot lines (EN):**
> s1: Slave Awaiting Death, at your mercy.
> s2: In this situation, you should step in personally.
> s3: You can use this to break a Stone tier Carnality Card or Bloodshed Card

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3.纵欲": 1}`:** *You decided to indulge in Carnality.*
> This slave was at your mercy. How could he refuse his master anymore? You had a great night, but the next day, you heard that the slave, dragged from your bedchamber at dawn, had breathed his last.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s3.杀戮": 1}`:** *You decided to relish in Bloodshed.*
> This slave's life belongs to you; you could have taken it long ago, couldn't you? As he faces your blood-stained dagger, the tortured slave surprisingly calmed down. From then on, he would no longer have to live in fear.


## Metal Equipment Phantom Pain — rite `5006022` (合金装备·幻痛)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006022_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Metal_Gear_Solid:_The_Phantom_Pain

**Intro (EN):**
> At night, your body may rest, but a certain part of it clearly hasn't harmonized with the rest...

**Slot lines (EN):**
> s1: Yourself

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> Ever since you changed to this tool of gold, you have often had a dream.
>
> In your dream, you saw a Warrior with a bronze spear approaching, then decaying in front of you. You are greatly saddened by his death, and want to save him; but for some reason, your first impulse is to touch your crotch. This touch wakes you up - for in the dream, between your legs is but an empty space.
>
> Every time you awakened from the dream, yor breath was heavy, your body sweaty. You can feel your phallus, an organic one, the one your mother gave you, but it's decaying in some places, you can feel it's pain by corrupting from insects. Something phantom, yet so painfully true.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"!rite": 5006023}`:**
> Perhaps? Should I ask Mahir... to exchange it back?


## Book of Dragonslaying — rite `5006046` (屠龙之书)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006046_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Things_Warriors_Do_Not_Need_Romance_Flag

**Intro (EN):**
> An ancient manuscript by the Adila family, filled with secrets of the dragons. Adila entrusts this sacred task to Maggie – decoding the book's mysteries. And you, as the closest man to Maggie, naturally find yourself helping with the work...

**Slot lines (EN):**
> s1: Ancient scrolls documenting dragon-slaying techniques.
> s2: Adila entrusted this heavy burden to Maggie.
> s3: You can offer Maggie some assistance.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s3": 1}`:** *You accompany Maggie day and night.*
> You stay by Maggie's side, telling her you're here to help.
>
> Maggie sighs with relief, hugging you.
>
> Together, you and Maggie study the Book of Dragonslaying, trying to decode its mysteries. The text begins to dance, shake and twist, until you drift into sleep, falling into a wild and barren place...
>
> When you wake, Maggie stands at the room's center, arms raised above her head, frozen in a falling pose.
>
> You embrace her. She relaxes in your arms... then opens her eyes, telling you she faced the dragon in her dream. The dragon asked her a strange question – what was the true purpose of slaying dragons...
>
> "I answered 'freedom'... I want freedom, not just freedom as a woman, but freedom of the soul..." Maggie rubs her temples wearily. "Then the voice faded, and I saw the dragon. I think... I can now fully understand the book."
>
> Adila is amazed by Maggie's dream revelation.
>
> "I'd heard that text written in dragon's blood could connect to their mental realm – I never believed it true," Adila says in wonder. "But it requires extraordinary inner strength. Good thing you were here..."
>
> Maggie gives a soft laugh, shaking her head as she takes your hand. "Without [player.name], I wouldn't have made it. My goodness, you have no idea how terrified I was when the dragon appeared..."

<!-- settlement[1] -->
**Outcome — branch, condition `{"!s3": 1}`:** *You do not meddle in this matter.*
> You have many matters to attend to, and with Maggie too distracted to spare any thought for the estate lately, the burden falls even heavier on you.
>
> Maggie understands this and doesn't ask too much of you.
>
> One morning, Maggie suddenly bursts into your room. She looks extremely tired yet unusually excited, clutching ink-stained papers, with ink smudges on her clothes and face.
>
> "I've seen it... I've actually seen the dragon in my dream!" she shouts at you. "I can truly help now – not relying on my husband, not on you, just by myself!"
>
> She laughs with joy and races back to her study to write down her insights – information that could help Adila track the dragon. You stand there bewildered, wondering if you've made a wise decision or not...
>
> Adila is amazed by Maggie's dream revelation.
>
> "I'd heard that text written in dragon's blood could connect to their mental realm – I never believed it true," Adila says in wonder. "But it requires extraordinary inner strength. Good thing you were by my side!"
>
> They exchange a knowing smile – a private moment that has absolutely nothing to do with you.


## Adila is on an adventure. — rite `5006051` (阿迪莱正在冒险)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006051_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Blessing_Ritual_for_Adila

**Intro (EN):**
> Adila is confirming the giant dragon's trail near the dragon's lair...

**Slot lines (EN):**
> s1: Adila is on an adventure.

<!-- settlement[0] -->
**Outcome — branch, condition `{"counter.7000183<": 1}`:**
> There's still no news from Adila.

<!-- settlement[1] -->
**Outcome — branch, condition `{"counter.7000183>=": 1}`:**
> Adila returnes. More scars mark her body; upon asking, she shrug it off, saying she narrowly escaped getting discovered by the dragon while observing its nest closely. Thankfully she overcame the fear and rolled across the mountain then ran away. 
> Maggie think this is due to the blessing ritual working. She joyfully embraces Adila, expressing her concerns. Adila looks uneasy too, but in her eyes lies more resolve and excitement: 
> "That is truly a dragon! That beast!!" She clutches Maggie's hand tightly. "Maggie, I don't know how to thank you. Listen, I'll slay that dragon and offer its head to you, I promise!"


## Conversations with God — rite `5006073` (与神沟通)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006073_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Conversations_with_God

**Intro (EN):**
> A minister made a promise to the god but broke it. Indeed, it was his fault, though he did it out of deep love for his son. Perhaps you can help him and make a deal with God...

**Slot lines (EN):**
> s1: The concept of The Truth
> s2: The concept of The Other
> s3: You choose to communicate with The Truth
> s4: You choose to communicate with The Other

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3": 1}`:** *You decide to communicate with the Immaculate Purity*
> You light a purifying incense. With solemn devotion, you perform the ritual and plead to exchange the blood of five hundred livestock for the child. A voice from the void agrees to your request. You can feel that voice almost emerging from your mind.
>
> The minister's gratitude knows no bounds. He seizes the cattle and sheep from every farm without hesitation. For seven days, the stench of blood hangs heavy over the land. The farmers' fate – how they will till their fields or sustain themselves without livestock – are beneath notice.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"s4": 1}`:** *You decide to communicate with the Cultic God*
> You ask the minister for seven slaves and slit their throats at seven positions according to the ritual's design, exchanging their blood for the promise concerning the child. An ominous curse surges through their spilled blood, then vanishes into the darkening earth. A sharp voice suddenly pierces your mind. He speaks with greed and force, demanding such bounty of blood each year as His tribute.
>
> The minister agrees without hesitation, clearly valuing his beloved son's life above any number of slaves. He even inquires about the ritual's details. There is no doubt that you have a new accomplice.


## Fragment of the Star-Souled Glyphs — rite `5006519` (星灵咒文残卷)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006519_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Lumera#The_Pain_of_Editing

**Intro (EN):**
> You and Lumera try to decipher these obscure spells.

**Slot lines (EN):**
> s1: Fragment of the Star-Souled Glyphs
> s2: Lumera looks forward to decoding the spell with you.
> s3: You must handle this yourself

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> The spell is written in the most arcane ancient language, full of metaphors and similes, making it very hard to interpret. You've managed a rough translation, to which Lumera adds more based on your work, and together you piece together the entire 'Starlight Spell'.
> Contrary to what the nobles thought, this doesn't seem to be a curse against the Sultan's ancestors; its purpose is to 'open', but what exactly it opens isn't clear in the spell. Further interpretation will require much more time.
> Lumera is utterly captivated by it. She looks at you almost obsessively, pleading for you to give her the fragment. She wants to decode it, decipher it, and uncover its hidden secrets. Her fervor overwhelms you, and you cannot refuse her.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *Scholar Visits*
> Upon hearing this news, several young people knocked at your door, hoping to meet Lumera. Lumera recognized one among them and introduced her as someone who'd provided substantial assistance with compilation work.
> They courteously bowed to you, identifying themselves as Scholar members - indeed, they all wore distinctive badges upon their cloaks.
> As the girls conversed quietly, you sat in shade, gradually recollecting which "Scholar" this was. The empire maintained only one court-recognized society. In earlier years, the Sultan permitted an organization to gather various knowledge and curiosities from the populace - a common method for controlling masses and suppressing thought. Later, their work seemed unsuccessful, gradually fading from the Sultan's attention... What did they want?
> Stroking your chin thoughtfully, the Scholar members had already departed the study. The leading lady approached, placing a badge in your hand: "You and Miss Lumera discovered extremely valuable knowledge. As gratitude... please accept this. With it, you can freely access our library. Don't worry, Miss Lumera possesses her own badge." She winked at you. "We welcome and willingly assist everyone who thirsts for knowledge and pursues truth."


## Desperate Housewives — rite `5006540` (致命主妇)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006540_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Desperate_Housewives

**Intro (EN):**
> A veiled woman visits you. She says nothing once inside, simply removing her hat, cloak, dress, and down to her undergarments. Her face is beautiful, her figure ample and graceful as mountains and rivers – even bruised from beatings, it does not hide her beauty.
>
> "My husband is about to beat me to death, I beg you, if killing with the Sultan's Bloodshed Card is sinless, then help me kill him!" she lifts her breast, showing a bite mark: "In return, after it's done, you can do whatever you want with me."

**Slot lines (EN):**
> s1: Wife
> s2: Husband
> s3: Insert the Bloodshed Card here to kill the wife.
> s4: Insert the Bloodshed Card here to kill the husband.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s3": 1}`:** *It's easier this way*
> They're all just Stone tiered peasants anyway, so why go far to find that man? 
>
> Unfortunately, he doesn't appreciate your kindness. Instead, he spreads rumors about you, claiming you assault women... Of course, never to your face.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s4": 1}`:** *Everyone Wears a Mask*
> You effortlessly killed her husband – a poor merchant that didn't even dare to resist.
>
> Unfortunately, the woman betrayed you immediately, accusing you of murdering him to steal his family's necklace. She's already fled the capital with all the man's wealth which, in all fairness, is a reasonable move. 
>
> Well, you must admit that family heirloom is quite the treasure.


## Regicide — rite `5006541` (弑君者)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006541_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Regicide

**Intro (EN):**
> You walk down the street, and a filthy beggar recognizes you. He crawls towards you in madness, causing you to step back several paces in fear, only to see the remnants of luxurious embroidery on his tattered rags, long since obscured by blood, sweat, and mud... Below his knees is missing, so he can only crawl like a beast, begging... 
> Perhaps a few years ago, his status was far above yours, but now you cannot even recall which courtier he was who driven to madness by the Sultan's torment.
> Suddenly, he lunges at you, crying at your feet: "Kill the Sultan with the Cards, kill the Sultan with the Cards...!"

**Slot lines (EN):**
> s1: Beggar
> s2: Stone Bloodshed or Gold Bloodshed?

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2.rare=": 1}`:** *Insulting the Sultan is a capital offense.*
> You executed this beggar, though but an insignificant nobody, for he spread words of disrespect towards the Sultan–only but a Stone Bloodshed Card suits him.
>  His filthy head rolled on the ground, still whispering: "Hehe, the Sultan will die for this, hehe, the Sultan will die for this..."

<!-- settlement[1] -->
**Outcome — branch, condition `{"s2.rare=": 4}`:** *You show him the Gold Bloodshed Card.*
> "My friend," you squat down, giving him a hug: "It's almost there. I've already drawn this card."
>
> Holding the gold card, he reveals a mad smile… Black tears with blood spurts from his dim eye sockets, dribbling on the Sultan Card, followed by his eyeballs… You snatch back the valuable card, only to find nothing on it, while the beggar is left with hollowed eyes, as if blind for years thereafter.
>
> Afterward, if you looked at the Bloodshed Card out of the corner of your eye, you might occasionally feel eerie eyeballs secretly moving… yet nothing upon a focused look.


## Last Wish — rite `5006678` (最后的愿望)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006678_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Nursery#Happiness

**Intro (EN):**
> In the orphanage, there is a well-loved child named Safaa. Little Safaa is a die-hard fan of the King of Flames and the most beloved happy spirit among the children. Sadly, she is afflicted with an illness that even the most excellent doctors cannot cure... Yesterday, you heard that Little Safaa wishes to become a "burning ghost" under the King of Flames when she dies. (You have no idea what this means – it wasn't part of your original writings. It seems to be a fan creation by subsequent bards).

**Slot lines (EN):**
> s1: Poor Little One, Gravely Ill
> s2: Find someone to play the King of Flames
> s3: It can also handle this heartwarming task
> s4: It would be great if there were a magical potion that could cure all ailments, don't you think?

<!-- settlement[0] -->
**Outcome — branch, condition `{"!s4": 1}`:** *You requested [s2.name] to dress as the King of Flames*
> The King of Flames enters the orphanage like a god, lays the sword on Little Safaa's forehead, calls her a true warrior, and promises her a place by his left burning side – her soul is granted the honor to follow the King of Flames in eternal conquest, executing justice! 
> ...Little Safaa left peacefully and serenely. You've never seen any monk guide the dying to such tranquility.

<!-- settlement[1] -->
**Outcome — branch, condition `{"s4": 1}`:** *You requested [s2.name] to educate the children well*
> The King of Flames enters the orphanage like a deity, pouring the terribly bitter Water of Life into Safaa's mouth.
>
> ... After what seemed like only minutes, her breathing stabilizes. The King of Flames then summons all the children, scolding them for neglecting their studies and indulging in intellectually bankrupt literature and street tricks. It declares that only rationality and wealth can change one's fate.
>
> After assigning shocking homework, the mysterious figure vanishes back into the flames.


## Hungry Mouths — rite `5008078` (饥饿的嘴)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008078_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Orphans#Hungry_Mouths

**Intro (EN):**
> These little beggars have latched onto you – they eat like there's no tomorrow… but once you play the good guy, everyone expects you to keep it up… Before they eat you out of house and home, hurry to find them a way out.

**Slot lines (EN):**
> s1: Hungry Street Urchins
> s2: This money can feed the kids for no more than 3 Gold Coins.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s2": 1}`:** *Today is a hopeful day*
> Every hungry mouth gets fed without hurting anything but your wallet.

<!-- settlement_extre[1] -->
**Outcome — branch, condition `{"!s2": 1}`:** *Empty*
> Your wallet is as empty as the kids' stomachs, but you had better worry about yourself first – they can tough out hunger way better than you can tough out broke.


## The Crown of Mirror — rite `5000349` (镜之冠冕)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000349_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/The_Ancient_Mirror_(Noble)#The_Crown_of_Mirror

**Intro (EN):**
> Tonight, [xiaochou.name] returns to your dreams...

**Slot lines (EN):**
> s1: The Mirror’s final wish is about to be fulfilled

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *The Crowned One*
> "[player.name]," [xiaochou.name] calls your name.
> "I must thank you, human. You've shown me things I've never known... But to be human—too loud, too cumbersome for me." As [xiaochou.name] speaks, its form begins to dissolve, fading. "Let me stay with you in a quieter way. My final gift. Prove yourself worthy of it—show me more wonders."
> In the dream, [xiaochou.name] scatters into dust of glass. When you jolt awake, a crown rests upon your brow—heavy as gold, smooth as a mirror, reflecting all around you.


## The Façade of Harmony — rite `5000563` (貌合神离)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000563_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#The_Facade_of_Harmony

**Intro (EN):**
> Consort Sadani wishes to see you.

**Slot lines (EN):**
> s1: Sadani has lost patience.
> s2: You must attend the appointment in person.

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:** *You meet with Sadani*
> Someone has paved the way for you. Under the cover of night, you slip into the harem undetected.
>
> Sadani dismisses her attendants and approaches you, slow and deliberate. The flickering lamplight stretches her shadow thin against the cavernous hall, cold and spectral. She studies your eyes for a long moment before she finally speaks. "You know already, don’t you?" Tonight, she wears no rouge to mask her weariness. Her pallor makes her look fragile, almost pitiable. She sighs. "It was a mistake."
>
> Her gaze drifts to the rippling surface of her tea, then, suddenly says: "You mean to use my child, don’t you? He has to be the Sultan’s son to be of any use, no?" She bites her lower lip, then lifts her eyes to meet yours. Those entrancing eyes glisten like gemstones on a dagger’s hilt. "Kill Seliman for me. Besides us, he is the only one who knows the truth."
>
> This, you did not expect. The words come out before you could stop them: "What? But you are –"
>
> Her brows furrow. For a moment, she is lost in some thought. Then, with a sharp clatter, she sets the tea cup down, her voice bored. "I told you. It was a mistake." She composes herself once more. "Listen. Tomorrow at dusk, I will summon him here." She dips a fingertip into the tea and sketches a crude map onto the table, tapping a single point. "Have your men in place. Kill him on sight. End it." Her words are ruthless. She has made her decision. "I care not what you want from me, but after this, you will have it, whatever it is. The divine can be my witness."
>
> You hold her gaze. At last, you nod and step away, leaving her in her cold, tomb-like palace.


## The Final Madness — rite `5000567` (最后的疯狂)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000567_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Sadani#The_Final_Madness

**Intro (EN):**
> Sadani is waiting. You must bring her news of Seliman's death.

**Slot lines (EN):**
> s1: Sadani is waiting for your news.
> s2: Proof of the Royal Guard Captain's death. A fake will also work.

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> You brought the evidence of Seliman's death, but there was no joy on Sadani's face.
>
> "He's dead!" Consort Sadani stared at it and murmured to herself, "Good, he's dead..."
> She seemed to be relieved, but also like she had lost her soul, tears flowed down her cheeks involuntarily. She wiped it away, embarrassed, then looked up and asked you: "Okay, you can ask me for a favor, what do you want?"
>
> "I want to support your child and make him the next Sultan." You said it lightly, but Sadani was almost speechless, "You, you want to commit regicide? On the Sultan?! How dare you...? No, I don't allow... you..."
>
> You stared at this confused woman indifferently, words bereft. You saw her tears welling up again. For so many years, she had never thought that there was such a way – that the Sultan could die, and he could pay the price for his mistakes and negligence!
>
> For so many years... For so many years! She couldn't figure it out. The Sultan and she were clearly in love, and she was clearly favored, but the Sultan was seduced by one woman, one woman, after another, after another... until she was no longer. She tried her best to murder countless favored women, but she was unable to stop more and more new faces from appearing by his side. She always wanted the Sultan's eyes to fall back on her for a moment – even if it was only a moment, but what came of it?
>
> How talented the Sultan! In hurting hearts! How did he think of setting a test with the plot of their first meeting, just to give her to another man as if a commodity? And she actually thought that he remembered everything in the past, and fantasized that he still loved her!
>
> Love... He never even said this word...
> Sadani bowed her head and covered her face in resignation. She thought of that man... that brave man who always looked at her... How dare he say "I love you" on behalf of the Sultan? That phantom, that dream that should have been shattered long ago...
>
> "That was a mistake..." Sadani almost laughed out loud. She raised her hand to wipe away her tears, but there was no way to stop more tears from washing away her delicate makeup, making her look so miserable. "I know, I'll help you... I can help you. This is a token of the Royal Guard Captain. It can open the palace gate for you, no matter how many army you have... Haha..." She has done too many irreversible madness things, and she doesn't care about one more! She slapped the small card related to the safety of the palace into your palm with force, and held your hand tightly. Her sharp nails almost pierced your wrist. Her expression was distorted, but she smiled, making her beautiful face look extremely hideous, "Kill... Let them all in and kill!”


## Holy Judgment — rite `5000677` (神圣审判)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000677_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Holy_Judgement

**Intro (EN):**
> You are struck by the sheer shamelessness of these cultists. They abandon their gods for a handful of coins. Worse, they defile yours in the process! The True Faith will not stand for this. You shall bring holy judgment upon them. No cost too great.

**Slot lines (EN):**
> s1: The commander of the Justiciars must be a Walker of the True Faith or have at least 8 in Magic.

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *You rain down judgment*
> There is no debate, no trials. The false converts are seized, sentenced, and executed. Their lands are sold to noble houses as compensation for the taxes they dared to deny. Terror follows in the wake of this purge. No one dares speak against you. Good. They have learned their lesson.


## Someone is preparing to challenge you — rite `5000764` (有人准备挑战你)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000764_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Nabhani#Someone_is_preparing_to_challenge_you

**Intro (EN):**
> A prostitute was killed by you in the House of Pleasure, and her lover, her confidant – and also the most dashing swordsman in the capital: Nabhani – is determined to avenge her.

**Slot lines (EN):**
> s1: Nabhani is preparing
> s2: Resolve of Revenge

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> He makes up his mind and draws his dust-covered sword, coming to you.


## Master of Revels — rite `5000862` (寻欢作乐的高手)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5000862_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Master_of_Revels

**Intro (EN):**
> The grand orgy you hosted rippled among all men and women; during this time, rumors and imaginations about the party were the hottest topic, making those who attended head over heels in pride and those who didn't continuously probing Buthayna about the next time... Underneath all this frenzy, Nabhani comes under your roof.

**Slot lines (EN):**
> s1: Nabhani has something to say
> s2: You must receive him personally

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:** *True Master of Pleasure*
> Nabhani brings you a fine bottle of liquor, chuckling as he admires your elegant, sophisticated indulgences.
> "You're truly a master of pleasure," he says with a playful wink. "It seems I still have much to learn from you."
> Tipsy, you don't take his words seriously. But from that day on, Nabhani never again leaves you alone or slips away to pursue his pleasures.


## Desperate Gamble — rite `5002028` (孤注一掷)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5002028_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Shama#Desperate_Gamble

**Intro (EN):**
> In this city, only two men might help Shama oppose her Father. She tried the first option before, now with no other path, she can only try the second option – she enters the Sultan’s court, and recounts her ordeal to the Sultan...

**Slot lines (EN):**
> s1: Shama

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> The Sultan is not interested in what she tells him, but after seeing her body, he decides to bring her into his harem – the news that a prostitute became the Sultan's favorite consort quickly spreads...


## Library Organization — rite `5004505` (整理智库)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5004505_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Righteous_Path#Library_Organization

**Intro (EN):**
> The Order houses countless texts - doctrines, classics, and accumulated wisdom from religious leaders and high priests... Being frequently consulted by the faithful, organizing them proves challenging.

**Slot lines (EN):**
> s1: Person with at least 5 Wisdom
> s2: Person with at least 5 Wisdom
> s3: Person with at least 5 Wisdom

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> Your assistant spends three days among ancient texts before finally satisfying the priests. They acknowledge your devotion.


## Sacred Procession — rite `5004507` (神像游行)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5004507_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Righteous_Path#Sacred_Procession

**Intro (EN):**
> During major festivals, the Purist Order has representatives carry massive white stone statues through streets washed with flower-infused spring water. This requires considerable strength...

**Slot lines (EN):**
> s1: Person with at least 5 Physique
> s2: Person with at least 5 Physique
> s3: Person with at least 5 Physique

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> Bearing the divine symbol on one's shoulders is supreme blessing! The priests observe while offering commentary... Regardless, they recognize your devotion.


## Light's Discipline — rite `5004805` (光之训诫)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5004805_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Bonum_in_se%3F#Light_s_Disciple

**Intro (EN):**
> To clear your mind and understand these thoughts... you choose the most primitive method: asceticism.

**Slot lines (EN):**
> s1: What seeks to guide me?

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:** *Divine Experience*
> Emulating devout Purist followers, you pour ice water over yourself, then scorch with fire, then accept flagellation. Through cycles of mortification, you remain expressionless. Pain merges with your soul - unimaginable to exist without it. Your birth brought your mother pain, your growth brought pain to lessers, your nobility brings pain from the Sultan. Pain defines existence - no joy exists without it, so we should venerate pain as we do pleasure! You've never felt anything like this - your thoughts become a rope whose other end someone violently seizes! Something pulls desperately at your heart, soul, and magical essence! 
> The rope tightens, nearly dragging you into unfathomable depths... As you struggle, the vibrating cord creates a rhythm, revealing a path to hear the sacred voice more clearly. 
> Servants rush in, witnessing flames and hearing thunder... terrified by the phenomena you've triggered. They should fear, for you've received holy instruction.


## Beyond Walls — rite `5004815` (墙垣之外)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5004815_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Beyond_Walls

**Intro (EN):**
> Cross the walls of your mind, and you can visit any corner of the world.

**Slot lines (EN):**
> s1: Protagonist
> s2: Madness
> s3: Evil?
> s4: Good?

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:** *Hello, World*
> Some call you mad, but how else discover you're merely a frog in a well? This world contains many secrets, and now, though your flesh remains confined within walls, you've begun to perceive the mysteries of all things...


## Succubus Power — rite `5004903` (魅魔之力)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5004903_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Succubus_Power

**Intro (EN):**
> The Sultan is extremely pleased with the succubus you presented! He laughs heartily while patting your shoulder, erasing any previous tensions between sovereign and subject.

**Slot lines (EN):**
> s1: The Sultan's Suspicion

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> Clearly, he has no time to dwell on "minor matters" that once could have cost your life.
> If only he could also forget that seven-day rule about breaking cards or face beheading.


## One-on-one Sword Training — rite `5006042` (上门教学)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006042_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Practicing_Swordsmanship_with_Adila

**Intro (EN):**
> Adila comes to visit Maggie. You can tell how much she values this appointment – even her hair is perfectly styled. She's holding a newly forged rapier with somewhat crude patterns engraved on its blade.The hilt is wrapped with a thin grip cord, tied into a clumsily crooked bow. Catching your gaze, Adila, unusually shy, tries to hide the sword behind her back. "Is Lady Maggie here? We had an appointment," she asks.

**Slot lines (EN):**
> s1: Maggie and Adila have agreed that Maggie will learn swordsmanship from Adila.
> s2: Adila is ready to be Maggie's swordsmanship tutor.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1": 1, "s2": 1}`:** *You fully support Maggie learning swordsmanship from Adila.*
> This day, when you return from the court, you find Adila still in your home.
> She's holding Maggie's hand, teaching her the proper sword stance.
> Adila wears only a wrap around her torso. Her scarred body, viewed from behind, rivals that of any warrior.
> While Maggie, in fine silk with a gauze veil, looks too delicate to wield a sword...
> "Just so, keep it steady, get used to the feel of the sword!"
> "Oh, oh, it's so heavy..."
> "Imagine it as a pot, a kettle, or your husband's head!"
> "Ha, then I'd drop it!"
> They laugh and continue training, unaware of your presence.


## The Purpose of Combat — rite `5006045` (战斗的目的)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006045_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Continued_Swordsmanship_Training

**Intro (EN):**
> Adila is here for Maggie's sword training again. She's waiting for Maggie, eagerly like a puppy with a wagging tail. Though you've already promised Maggie, you find yourself wishing she wouldn't come...

**Slot lines (EN):**
> s1: Maggie wants to continue swordsmanship practice.
> s2: Adila looks forward to meeting with Maggie.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1": 1, "s2": 1}`:**
> They're more invested in this than you expected. You thought it was just another of Maggie's whims... But now at night, when you hold her small hands, you can feel the beginnings of calluses forming on her palms.
>
> "A fight isn't about killing your opponent – it's about staying alive," Adila says, guiding Maggie's stance with a hand on her waist. "That's why defense always comes first."
>
> "Just like love," Maggie says with a smile. "For us women, protecting ourselves matters more than striking first."
>
> You notice Adila's smile, with a hint of shyness...


## Before Departure — rite `5006049` (临行之前)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006049_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Adila#Before_Departure

**Intro (EN):**
> Once Adila finishes telling you what she's found, she's eager to get back to her journey. She's practically bouncing with excitement about finding the dragon's trail, ready to rush off right away. 
> But Maggie stops her. "I have something for you," she says with a smile, leading her into the courtyard.

**Slot lines (EN):**
> s1: Adila is preparing for the next step of her plan.
> s2: Maggie prepared the belongings for her.

<!-- settlement[0] -->
**Outcome — branch, condition `{"s2": 1}`:** *Maggie hands Adila the fireproof robe she prepared.*
> Tired and dust-covered from the road, Adila solemnly accepts the equipment and heads out right away. On her journey, she discovered a giant stone marked with sulfurous dragon breath. According to The Book of Dragonslaying, a dragon's lair must be close by. She settles in for what might be a long wait, determined to find concrete evidence of the dragon's trail.


## Star-Souled Night — rite `5006521` (星灵之夜)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006521_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Lumera#Ascension

**Intro (EN):**
> You loudly praise each name of the stars. The infinite paths recorded on the scrolls have been opened. The one who bears this great destiny is also destined to vanish.

**Slot lines (EN):**
> s1: Is she still Lumera?

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:**
> A violent black whirlwind rushes into your residence, causing people to scream and hide. After the commotion, it’s found that nothing is missing, but Lumera has vanished. You look up at the stars, only you know where she has gone.


## Shield of Public Opinion — rite `5006589` (民意之盾)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006589_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Commoner%27s_Support

**Intro (EN):**
> Ordinary citizens, even those slaves, their voices may be insignificant, but you can unite these neglected forces – essentially, you hold a power that ordinary people can't resist, whether they're nobles or bandits.

**Slot lines (EN):**
> s1: Commoner's Support

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:** *Your opponent has vanished*
> If they continue to oppose you, their windows will be pelted at night, women will spread rumors, merchants will refuse to trade... no matter how large the hatred in their hearts is, nobody dared oppose you openly.


## Shield of Influence — rite `5006590` (权势之盾)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5006590_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Nobility%27s_Support

**Intro (EN):**
> There are two concepts of guilt, one that comes from moral torment within, the other from the bindings of power and order, and in the Sultan's Game, you are immune to the latter.

**Slot lines (EN):**
> s1: Nobility's Support

<!-- settlement[0] -->
**Outcome — branch, condition `{}`:** *Investigations against you have ceased*
> Heavens, even the High Constable has family, children, need to make a living... I mean, you are a respected man.


## Fate of the Pickpocket — rite `5008070` (小贼的命运)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008070_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Hemir

**Intro (EN):**
> The time has come. You decide to use the card you drew to deal with the little pickpocket bold enough to steal your property.

**Slot lines (EN):**
> s1: Hemir
> s2: In this situation, you should step in personally.
> s3: You can use this to break a Stone tier Bloodshed Card

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{"s3.杀戮": 1}`:** *You decided to relish in Bloodshed.*
> You stole my money, so I take your life – fair trade.


## Carnival — rite `5008106` (谢肉祭)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008106_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Carnival

**Intro (EN):**
> Badriyyah drags Habib to see you, giggling that she knows of an ancient festival requiring the skills of your talented chef. You can gather cultists to participate, and... the more, the better.

**Slot lines (EN):**
> s1: Banquet Chef
> s2: Badriyyah
> s3: This person will be consumed as an offering
> s4: Invite a cultist to consume the sacrifice
> s5: Invite a cultist to consume the sacrifice
> s6: Invite a cultist to consume the sacrifice

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *Perfect Feast*
> Habib carves [s3.name]'s limbs with a cold fanaticism and devotion, opening [s3.gender(his,her)] abdomen. And [s3.name] remains conscious throughout - [s3.gender(he,she)] watches as you use [s3.gender(his,her)] warm blood as wine, [s3.gender(his,her)] thinly sliced muscles as food. With [s3.gender(his,her)] last breath, [s3.gender] fervently calls out the title of the Cultic God you all worship. [s3.gender] will return to Their blackest throne, while you enjoy a blessed meal.


## Harem Vacancy — rite `5008169` (后宫的空缺)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5008169_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Harem_Vacancy

**Intro (EN):**
> A cultist wielding your Bloodshed Card killed a woman serving the Sultan, whose fury extends to you. He demands you provide a replacement - one who will never leave the palace.

**Slot lines (EN):**
> s1: You must present a suitable beauty within the deadline

<!-- settlement[0] -->
**Outcome — branch, condition `{"s1": 1}`:** *Silent Acceptance*
> When presenting [s1.name] to the Sultan, he says nothing, merely allowing eunuchs to lead her away.
> This becomes your final glimpse of [s1.name].


## Audience with Sultan — rite `5010036` (觐见苏丹)
**Confidence:** High — official `i18n/en` string for every field; 1 of them also appears verbatim on sultansgame.wiki.gg, transcribed by editors from the running game (see Source).
**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_5010036_*`; wiki corroboration: https://sultansgame.wiki.gg/wiki/Bonum_in_se%3F#Audience_with_Sultan

**Intro (EN):**
> Your god is your master, the Sultan is your master - a good servant always adapts to this middle position... Now you need the Sultan's permission to build a golden tower for the Immaculate Purity.

**Slot lines (EN):**
> s1: You must go yourself
> s2: A follower - don't confuse them with cultists
> s3: 20 Gold Coins, tribute for the Sultan

<!-- settlement_extre[0] -->
**Outcome — branch, condition `{}`:** *Supreme Blessing*
> As God's spokesperson, you confidently relate prophecies supposedly from the Immaculate Purity's dream visitations - entirely your invention: the Immaculate Purity will personally bless the Sultan! Beyond the Warrior King blessing received upon inheriting imperial traditions, the Purity will bestow upon Its strongest supporter an entirely new blessing! The Sultan's image will project from the high tower into the heavens, standing alongside the god, visible from the empire's furthest territories... As you explain, holy light guides gold's growth, constructing a tower model in the Lapis Lazuli Hall, deeply impressing the court.
> Regardless, this gesture moves the Sultan - after all, if it fails, he can always behead you!


---

## Appendix — full rite index (all 1,382)

`English coverage` is `full` when the intro and every outcome branch have an official English string. Sorted by rite id.

| rite id | English name | branches | English coverage |
|---|---|---:|---|
| 5000001 | Managing the Estate | 55 | full |
| 5000002 | Methinks | 134 | full |
| 5000003 | Carnality at Home | 27 | full |
| 5000004 | Cruel Sacrifice | 12 | full |
| 5000005 | Minor Renovation | 2 | full |
| 5000006 | Complete Renovation | 2 | full |
| 5000007 | Expansion | 2 | full |
| 5000008 | Major Construction | 1 | full |
| 5000009 | Resolve Wife's Resentment | 16 | full |
| 5000010 | Reading | 2 | full |
| 5000011 | A Special Meal | 3 | full |
| 5000012 | Daggers and Scimitars | 1 | full |
| 5000013 | Classical wrestling | 2 | full |
| 5000014 | Military Spear Guide | 1 | full |
| 5000015 | Jousting | 1 | full |
| 5000016 | Battles at Night | 2 | full |
| 5000017 | Victory Against the Odds | 2 | full |
| 5000018 | Dignity | 1 | full |
| 5000019 | Sixty Rules for Life | 1 | full |
| 5000020 | A Guide to Palace Etiquette | 1 | full |
| 5000021 | Bureaucracy | 1 | full |
| 5000022 | Ava's Diary | 1 | full |
| 5000023 | Physiognomy | 1 | full |
| 5000024 | Hunter's Tales | 2 | full |
| 5000025 | Legend of the Thief | 2 | full |
| 5000026 | Scout Training Manual | 1 | full |
| 5000027 | Memoirs of a High Constable | 1 | full |
| 5000028 | Dog Skin | 2 | full |
| 5000029 | Song and Silence | 2 | full |
| 5000030 | Introduction to Herbology | 2 | full |
| 5000031 | Maps and Borders | 1 | full |
| 5000032 | Nomadic life | 1 | full |
| 5000033 | Encyclopedia of Flora and Fauna | 2 | full |
| 5000034 | Journey to the West | 2 | full |
| 5000035 | Book of the Desert | 2 | full |
| 5000036 | Fitness Manual | 1 | full |
| 5000037 | Soldier's Training | 1 | full |
| 5000038 | Tales of Valor | 2 | full |
| 5000039 | Breath of the Ancients | 2 | full |
| 5000040 | Blood of Mercury | 2 | full |
| 5000041 | Words of Sages | 1 | full |
| 5000042 | Collection of Dialectics | 2 | full |
| 5000043 | Computations of Squares and Circles | 2 | full |
| 5000044 | Opened Mind | 2 | full |
| 5000045 | How to Please Your Lover | 1 | full |
| 5000046 | Forty-Seven Elegant Poses | 1 | full |
| 5000047 | Mysteries of Essential Oils | 1 | full |
| 5000048 | Secret of the Mask | 1 | full |
| 5000049 | Cults and the Occult Ways | 2 | full |
| 5000050 | The Fifth Element | 2 | full |
| 5000051 | The Book of Whispers | 2 | full |
| 5000052 | Scroll of Worms | 2 | full |
| 5000053 | Starlit Apprentice | 2 | full |
| 5000054 | Mystery of Mysteries | 2 | full |
| 5000055 | Room to Rent | 4 | full |
| 5000056 | Foreign Merchant | 12 | full |
| 5000057 | Build Tapestry Corridor | 2 | no-intro |
| 5000058 | Build Crocodile Pond | 2 | full |
| 5000059 | Expansion of the Gold Cat Climbing Frame | 2 | full |
| 5000060 | Build Hot Air Balloon Platform | 2 | no-intro |
| 5000061 | Build Observatory | 2 | no-intro |
| 5000062 | House of Wonders | 8 | no-intro |
| 5000063 | Summon a Tornado | 6 | full |
| 5000064 | Smash the Lantern | 1 | full |
| 5000065 | Academic Monograph | 1 | full |
| 5000066 | Deny the Reality | 2 | full |
| 5000067 | Slip into the Backstage | 1 | full |
| 5000100 | Jewelry Design | 12 | full |
| 5000101 | Tailor Shop | 40 | full |
| 5000102 | Entertainment Banquet | 3 | full |
| 5000103 | Arzuna's Request | 1 | full |
| 5000104 | Arzuna's Request | 1 | full |
| 5000105 | Love Poem | 5 | full |
| 5000106 | Epic | 5 | full |
| 5000107 | Satire | 5 | full |
| 5000108 | Revelatory Verse | 5 | full |
| 5000109 | Stolen Goods Merchant | 1 | full |
| 5000110 | Curious Ghazal | 1 | full |
| 5000111 | Wonderful Ghazal | 1 | full |
| 5000112 | Timeless Ghazal | 1 | full |
| 5000113 | In Praise of Love | 1 | full |
| 5000114 | Interesting Epic | 1 | full |
| 5000115 | Extraordinary Epic | 1 | full |
| 5000116 | Glories of Ages Past | 2 | full |
| 5000117 | Magnificent Epic | 1 | full |
| 5000118 | Torrents of History | 1 | full |
| 5000119 | Alliterative Abuse | 1 | full |
| 5000120 | Ingenious Hija | 1 | full |
| 5000121 | A Challenge in Verse | 1 | full |
| 5000122 | Vicious Mockery | 1 | full |
| 5000123 | Magical Masnavi | 1 | full |
| 5000124 | Whispers from Nowhere | 1 | full |
| 5000125 | Terrifying Echoes | 1 | full |
| 5000126 | Roots of Darkness | 2 | full |
| 5000127 | The Great Darkness | 1 | full |
| 5000128 | Inal's Diary | 1 | full |
| 5000129 | Prepare yourself. | 1 | full |
| 5000130 | Foolish Prostitute and Living Villain | 1 | full |
| 5000131 | Observatory | 1 | full |
| 5000132 | Gold Bird House | 1 | full |
| 5000133 | Gold Bird House | 4 | full |
| 5000134 | Crocodile Pond | 1 | full |
| 5000135 | Hot Air Balloon Platform | 2 | full |
| 5000136 | Gold Cat Climbing Frame | 2 | full |
| 5000137 | Tapestry Corridor | 1 | full |
| 5000138 | Offered Wooden Sculpture | 2 | full |
| 5000139 | Offered Wooden Sculpture | 4 | full |
| 5000140 | Study of the Stars | 1 | full |
| 5000141 | The Giant Phallic Warrior | 1 | full |
| 5000142 | The Old Garden | 2 | full |
| 5000143 | The Book of Kings | 1 | full |
| 5000144 | Long Overdue | 2 | full |
| 5000145 | An Immortal's Kiss | 2 | full |
| 5000146 | Jungle! Jungle! | 1 | full |
| 5000147 | The Madame's Gold Slipper | 1 | full |
| 5000148 | Book of the Wild | 1 | full |
| 5000149 | White Weasels Court | 1 | full |
| 5000150 | A Game of Marbles | 1 | full |
| 5000151 | L.O.Q.U.A.C.I.O.U.S. 100 | 2 | full |
| 5000152 | Do Not Stare at the Stars | 1 | full |
| 5000153 | The Little Spider's Web | 1 | full |
| 5000154 | Maintain the Estate | 3 | full |
| 5000155 | Flame Within Stone | 1 | full |
| 5000156 | The Curved and the Straight | 1 | full |
| 5000157 | Battle of the Yellow Sands | 1 | full |
| 5000158 | Time Reversal | 2 | full |
| 5000159 | Dream World | 2 | full |
| 5000160 | The Monarch's Weight | 4 | full |
| 5000161 | Scholar's Haven | 7 | full |
| 5000162 | Lady Becky Vanished | 1 | full |
| 5000163 | Philosophical Force | 1 | full |
| 5000164 | Blood of the Longhorn Beetle | 2 | full |
| 5000165 | Mountain Depths | 8 | full |
| 5000166 | Study on Stone Scale | 2 | full |
| 5000167 | Resurrect the Dead | 7 | full |
| 5000168 | Eternal Promise | 2 | full |
| 5000201 | Taming Ritual | 13 | full |
| 5000202 | Curse Lifted | 9 | full |
| 5000203 | Mortal Ways | 2 | full |
| 5000204 | Unwavering Loyalty | 2 | full |
| 5000205 | Thorn and Tower | 8 | full |
| 5000206 | Exotic Garden | 9 | full |
| 5000301 | The Uncanny Mirror | 3 | full |
| 5000302 | Reflection | 79 | full |
| 5000303 | Your name | 12 | full |
| 5000304 | Mirror a Man | 7 | full |
| 5000305 | Mirror a Woman | 13 | full |
| 5000306 | See a noble | 9 | full |
| 5000307 | Desire and Love | 16 | full |
| 5000308 | What to See...? | 7 | full |
| 5000309 | Desire and Progeny | 9 | full |
| 5000310 | Desire and Its Price | 8 | full |
| 5000311 | Discard | 0 | no-branches |
| 5000312 | Seems Detached from Desires | 11 | full |
| 5000313 | An Attempt at Carnality | 29 | full |
| 5000314 | See the Wise | 6 | full |
| 5000315 | See a Bad Guy | 6 | full |
| 5000316 | See a Fool | 5 | full |
| 5000317 | Joy of Hoarding | 6 | full |
| 5000318 | Joy of Spending | 6 | full |
| 5000319 | See a Coin-hater | 5 | full |
| 5000320 | What About Taste? | 7 | full |
| 5000321 | See the Profit | 6 | full |
| 5000322 | Waste and Whims | 5 | full |
| 5000323 | A Windfall Falls From the Sky | 11 | full |
| 5000324 | See the Warrior | 7 | full |
| 5000325 | See the trophies | 7 | full |
| 5000326 | See the Honor | 6 | full |
| 5000327 | Person with Ideals | 5 | full |
| 5000328 | See a Slave | 6 | full |
| 5000329 | The Thought of Rebellion | 9 | full |
| 5000330 | See a Survivor | 7 | full |
| 5000331 | The Weight of Duty | 5 | full |
| 5000332 | Act of Conquest | 4 | full |
| 5000333 | See Vested Interest | 6 | full |
| 5000334 | See the Unseen Blade | 7 | full |
| 5000335 | Craft of Killing | 7 | full |
| 5000336 | Death is Like Dust | 9 | full |
| 5000337 | Life and Longing | 9 | full |
| 5000338 | Abandoned | 0 | no-branches |
| 5000339 | Instinct of Life | 7 | full |
| 5000340 | Fear of Life and Death | 7 | full |
| 5000341 | What’s Your Next Life | 12 | full |
| 5000342 | Cycle of Death | 58 | full |
| 5000343 | The Coin’s Turn | 1 | full |
| 5000344 | Mind Over Matter | 1 | full |
| 5000345 | Amusing Humans | 1 | full |
| 5000346 | The Archivist | 3 | full |
| 5000347 | A Song from Afar | 1 | full |
| 5000348 | The Strings of Thousand Harmonies | 1 | full |
| 5000349 | The Crown of Mirror | 1 | full |
| 5000350 | Human is Mirror | 1 | full |
| 5000351 | Abandoned | 0 | no-branches |
| 5000352 | Reinforcements from the Mirror | 1 | full |
| 5000353 | That Shore | 2 | full |
| 5000501 | Haunted Mansion | 27 | full |
| 5000502 | Unsolved Murders | 6 | full |
| 5000503 | Rest in Peace | 7 | full |
| 5000504 | The Real Culprit | 2 | full |
| 5000505 | Court Execution | 1 | full |
| 5000506 | In the Name of God | 7 | full |
| 5000507 | Night's Shelter | 6 | full |
| 5000508 | Divine Assistance | 5 | full |
| 5000509 | Evil Clues | 5 | full |
| 5000511 | Untraceable Crime | 1 | full |
| 5000512 | Avenge Them | 6 | full |
| 5000513 | The Call of Darkness | 3 | full |
| 5000514 | Badriyyah | 6 | full |
| 5000515 | White Honey Amber Orb | 1 | full |
| 5000520 | Lost Treasures | 1 | full |
| 5000521 | Consort Ansuya's Visit | 7 | full |
| 5000522 | Ansuya's Request I | 11 | full |
| 5000523 | Ansuya's Request | 11 | full |
| 5000524 | Ansuya's Request | 11 | full |
| 5000525 | Biding Your Time | 4 | full |
| 5000526 | Reckoning Begins Here | 1 | full |
| 5000527 | Jade Crumbles and Pearls Sink | 1 | full |
| 5000528 | Regicide (Abandoned) | 14 | full |
| 5000529 | Regicide Plot (Abandoned) | 1 | full |
| 5000531 | Search for Tyrian Relic | 5 | full |
| 5000532 | Regicide Plot (Abandoned) | 1 | full |
| 5000550 | Perjury of Love | 1 | full |
| 5000551 | Proof of Valor | 3 | full |
| 5000552 | Sadani's Visit | 6 | full |
| 5000553 | The Price of Pleasure | 2 | full |
| 5000554 | Anonymous assailant | 2 | full |
| 5000555 | Anonymous assailant | 2 | full |
| 5000556 | Anonymous assailant | 2 | full |
| 5000557 | Anonymous assailant | 2 | full |
| 5000558 | Lips Sealed | 5 | full |
| 5000559 | Infiltration and Forgery | 3 | full |
| 5000560 | Bribing the Chamberlain | 1 | full |
| 5000561 | Eliminate Hidden Dangers | 1 | full |
| 5000562 | The True Reward | 7 | full |
| 5000563 | The Façade of Harmony | 1 | full |
| 5000564 | Affair and Betrayal (Abandoned) | 1 | full |
| 5000565 | No Loose Ends | 4 | full |
| 5000566 | A Chance for Survival | 5 | full |
| 5000567 | The Final Madness | 1 | full |
| 5000568 | The Price of Pleasure | 2 | full |
| 5000569 | A Woman of Gold | 3 | full |
| 5000570 | Receiving Zazie | 4 | full |
| 5000571 | Desire or ambition | 4 | full |
| 5000572 | Golden Experience | 2 | full |
| 5000573 | The Cleansing Eunuch | 5 | full |
| 5000574 | Sultan's Private Life | 5 | full |
| 5000575 | Bookstore Encounter | 3 | full |
| 5000576 | Zazie's Nightmare | 13 | full |
| 5000577 | The Sultan's Sheath | 8 | full |
| 5000578 | The Frenzied Highlord | 19 | full |
| 5000579 | The Star's Contract | 8 | full |
| 5000580 | Make a wish upon a star | 5 | full |
| 5000581 | God-Hunting | 13 | full |
| 5000582 | Star-Burning | 3 | full |
| 5000583 | Star's Decline | 1 | full |
| 5000584 | Golden Experience | 2 | full |
| 5000600 | Riots Outside the City | 4 | full |
| 5000601 | Raider's Hideout | 6 | full |
| 5000602 | Ownership of the Winery | 4 | full |
| 5000603 | A Fatal Invitation | 1 | full |
| 5000604 | Assassination | 3 | full |
| 5000605 | Fratricide | 11 | full |
| 5000606 | Assassination | 3 | full |
| 5000607 | The Winery Owner Visits Again | 2 | full |
| 5000608 | Assassination | 3 | full |
| 5000610 | The Boy's Request | 1 | full |
| 5000611 | Martial Arts Instruction | 3 | full |
| 5000612 | Instigation of Crime | 3 | full |
| 5000613 | Hunting Practice | 3 | full |
| 5000614 | Zaki's Request | 1 | full |
| 5000615 | Learning Sociability | 3 | full |
| 5000616 | Learning Sociability | 4 | full |
| 5000617 | Learning Sociability | 3 | full |
| 5000618 | Zaki's Request | 1 | full |
| 5000619 | The Final Lesson | 1 | full |
| 5000620 | The Final Lesson | 1 | full |
| 5000621 | The Final Lesson | 1 | full |
| 5000622 | A Visit from the Widow | 4 | full |
| 5000623 | Admiration of Young Noble | 8 | full |
| 5000624 | The Widow's Friendship | 8 | full |
| 5000630 | Injured White Rhino | 28 | full |
| 5000631 | Adila's Challenge | 5 | full |
| 5000632 | Lion King's Hunting Ground | 16 | full |
| 5000633 | Deal with Adila | 5 | full |
| 5000634 | A Gift, a Curse | 1 | full |
| 5000635 | Girl Examines Herself | 2 | full |
| 5000636 | Girl Examines Herself | 2 | full |
| 5000637 | Valor | 3 | full |
| 5000638 | A Warrioress' Challenge | 2 | full |
| 5000639 | Deal with Adila | 3 | full |
| 5000640 | Visiting Nawfal | 1 | full |
| 5000641 | Private Meeting | 3 | full |
| 5000650 | Vanity, Vanity | 2 | full |
| 5000651 | A Makeup in Blood | 4 | full |
| 5000652 | The Gift of Gold | 5 | full |
| 5000653 | Impatience | 7 | full |
| 5000654 | Her Husband | 9 | full |
| 5000660 | Explore the Unknown Oasis | 2 | full |
| 5000661 | Undertow | 2 | full |
| 5000662 | A Lone Journey into the Unknown | 1 | full |
| 5000663 | Journey into the Unknown | 4 | full |
| 5000664 | Undertow | 2 | full |
| 5000665 | Manar’s Farewell | 2 | full |
| 5000666 | Distant Paradise | 1 | full |
| 5000667 | The Sultan’s Prank | 4 | full |
| 5000668 | Building Underground Channels | 1 | full |
| 5000669 | Rain Prayer Sacrifice | 5 | full |
| 5000670 | Building the Palace | 1 | full |
| 5000672 | The Law of Iron and Lash | 1 | full |
| 5000673 | Promise of Mercy | 1 | full |
| 5000674 | Facilitate Negotiation | 1 | full |
| 5000675 | Forceful Expulsion | 1 | full |
| 5000676 | Check for vulnerabilities | 2 | full |
| 5000677 | Holy Judgment | 1 | full |
| 5000678 | The Sultan's Suspicion | 1 | full |
| 5000679 | Rebellion Everywhere | 5 | full |
| 5000680 | Fardak's Friendship | 8 | full |
| 5000681 | Building Underground Channels | 1 | full |
| 5000682 | Rain Prayer Sacrifice | 5 | full |
| 5000683 | Silent Departure | 1 | full |
| 5000684 | Testing the Blade | 1 | full |
| 5000685 | Field Investigation | 3 | full |
| 5000686 | Preliminary Investigation | 2 | full |
| 5000687 | In Depth Investigation | 2 | full |
| 5000688 | Inspiring Qais | 7 | full |
| 5000701 | Impulse of Adventure | 3 | full |
| 5000702 | Boundless Sands | 2 | full |
| 5000703 | Canyon of Gales | 8 | full |
| 5000704 | The Umbrous Temple | 5 | full |
| 5000705 | Forest of the Jinn | 8 | full |
| 5000706 | Jabal's Friendship | 5 | full |
| 5000707 | Mount Doom (Abandoned) | 1 | full |
| 5000708 | Volcanic Demonic Dragon | 13 | full |
| 5000709 | Sword Duel | 5 | full |
| 5000710 | Guardian | 11 | full |
| 5000711 | A Portrait for the Ages | 1 | full |
| 5000712 | An Interesting Incident | 2 | full |
| 5000713 | Unreliable Ally | 18 | full |
| 5000714 | Subdue the Seducer | 5 | full |
| 5000715 | Abandoned | 0 | no-branches |
| 5000716 | Abandoned | 0 | no-branches |
| 5000717 | Abandoned | 0 | no-branches |
| 5000718 | Abandoned | 0 | no-branches |
| 5000719 | Abandoned | 0 | no-branches |
| 5000720 | Audience with the Vizier | 2 | full |
| 5000721 | Absent Courtier | 4 | full |
| 5000722 | Report to the Vizier | 2 | full |
| 5000723 | Audience with the Vizier | 1 | full |
| 5000724 | How Dare the Worm? | 1 | full |
| 5000725 | End the Pain | 3 | full |
| 5000726 | Report to the Vizier | 3 | full |
| 5000727 | Spare him | 3 | full |
| 5000728 | Audience with the Vizier | 2 | full |
| 5000729 | Fortune Scattered | 4 | full |
| 5000730 | Report to the Vizier | 2 | full |
| 5000731 | Project Investment | 4 | full |
| 5000732 | Project Investment II | 6 | full |
| 5000733 | Recruit Mahir | 1 | full |
| 5000734 | Long-Term Research | 9 | full |
| 5000735 | Volcanic Dragon – Final Battle | 3 | full |
| 5000736 | Into the Darkness (Abandoned) | 3 | full |
| 5000737 | Human Sacrifice | 7 | full |
| 5000738 | Summon Abomination | 6 | full |
| 5000739 | Reading – Bizarre Book (Abandoned) | 2 | full |
| 5000740 | Blood Forge | 3 | full |
| 5000741 | Obtain Forbidden Tome | 3 | full |
| 5000742 | Magic Growth Ritual | 4 | full |
| 5000743 | Dark Crucible Ritual | 11 | full |
| 5000744 | Reading – Forbidden Tome | 2 | full |
| 5000745 | Study Mysterious Pot | 2 | full |
| 5000746 | Spread Cult Ideology | 41 | full |
| 5000747 | Deal with the Sorceress | 3 | full |
| 5000748 | Duel with Nabhani | 11 | full |
| 5000749 | Let's have fun together | 2 | full |
| 5000750 | Behind the Yellow Sands | 2 | full |
| 5000751 | Howling Mountain Winds | 2 | full |
| 5000752 | Treasure Raider | 2 | full |
| 5000753 | Jinn Kingdom Travelogue | 2 | full |
| 5000754 | General Night Hunt | 3 | full |
| 5000755 | A Cruel Gift | 8 | full |
| 5000756 | A Savage Delicacy | 1 | full |
| 5000757 | A Cruel Gift | 1 | full |
| 5000758 | Ominous goods | 1 | full |
| 5000759 | Expected Buyer | 1 | full |
| 5000760 | A pugilist in the dark alley? | 5 | full |
| 5000761 | You wouldn’t want anyone else to know, would you? | 3 | full |
| 5000762 | Public Brawl | 3 | full |
| 5000763 | Making a name in the dark alley | 1 | full |
| 5000764 | Someone is preparing to challenge you | 1 | full |
| 5000765 | Guardian | 11 | full |
| 5000766 | Lie Low | 1 | full |
| 5000767 | Exhibition of Flesh | 5 | full |
| 5000768 | Slave Trade | 2 | full |
| 5000769 | Slave Trade | 2 | full |
| 5000770 | Midnight Visitor | 4 | full |
| 5000771 | The Wanderer's Thoughts | 1 | full |
| 5000772 | That Woman | 1 | full |
| 5000773 | Dead Drunk | 1 | full |
| 5000774 | A New Girl to the House of Delights | 1 | full |
| 5000775 | The Wanderer's Thoughts | 1 | full |
| 5000776 | Not on Purpose | 1 | full |
| 5000777 | Luxurious Joy | 1 | full |
| 5000778 | Things have settled down at last | 1 | full |
| 5000779 | Unfulfilled Desires | 2 | full |
| 5000780 | Another Way Out | 1 | full |
| 5000781 | You Know The Drill | 1 | full |
| 5000782 | Split with | 6 | full |
| 5000783 | Hidden Jewel in the Golden House | 3 | full |
| 5000784 | Minor Trouble | 7 | full |
| 5000785 | Delicate Gift | 6 | full |
| 5000786 | Freedom in Flames | 3 | full |
| 5000787 | Visit | 4 | full |
| 5000788 | What You Can Do | 2 | full |
| 5000789 | Weaving Classroom | 3 | full |
| 5000790 | Blue Scarf | 1 | full |
| 5000791 | Dark Alley Warrior Campaign | 6 | full |
| 5000792 | Capital Dojo Conquest Battle | 2 | full |
| 5000793 | World Martial Arts Validation Battle | 8 | full |
| 5000794 | World Martial Arts Validation Battle? | 2 | full |
| 5000795 | The Most Popular Man | 10 | full |
| 5000796 | Sultan's Game | 16 | full |
| 5000797 | Preparing for the Game | 2 | full |
| 5000798 | Your Game | 73 | full |
| 5000799 | Master of Revels | 2 | full |
| 5000800 | Your Game | 73 | full |
| 5000801 | Junah's Game | 46 | full |
| 5000802 | Jalila's Game | 6 | full |
| 5000803 | Shama's Game | 22 | full |
| 5000804 | Salwiyah's Game | 7 | full |
| 5000805 | The Grief of the Prodigal | 4 | full |
| 5000806 | Junah's Game | 6 | full |
| 5000807 | Jalila's Game | 7 | full |
| 5000808 | Shama's Game | 7 | full |
| 5000809 | Salwiyah's Game | 7 | full |
| 5000810 | Gang Rivalry | 6 | full |
| 5000811 | Jackal Alliance | 3 | full |
| 5000812 | Riel's Gang | 9 | full |
| 5000813 | Hunting the Jackals | 4 | full |
| 5000814 | Heart and Liver | 2 | full |
| 5000815 | To the House of Delights! | 5 | full |
| 5000816 | The Great Sister Heist | 13 | full |
| 5000817 | I, Freeloader | 6 | full |
| 5000818 | Hunting the Hunters | 7 | full |
| 5000819 | The Naked Tea Party | 19 | full |
| 5000820 | The Full Confession | 5 | full |
| 5000821 | The Vizier's Hint | 2 | full |
| 5000822 | Hunters' Remnants | 2 | full |
| 5000823 | Hunters' Remnants | 2 | full |
| 5000824 | Hunters' Remnants | 2 | full |
| 5000825 | Uprising Troops | 15 | full |
| 5000826 | Silver Saddle | 1 | full |
| 5000827 | Wild Heart | 1 | full |
| 5000828 | Tavern Dispute | 19 | full |
| 5000829 | Homeland's Vengeance | 7 | full |
| 5000830 | Righteous Fury | 2 | full |
| 5000831 | Worthless Papers | 7 | full |
| 5000832 | Builder's Guide | 3 | full |
| 5000833 | Garden Designs (Incomplete) | 2 | full |
| 5000834 | Kitchen Records | 2 | full |
| 5000835 | Sharp Grass Plain | 14 | full |
| 5000836 | Digging Graves | 1 | full |
| 5000837 | Lost in Ashes | 1 | full |
| 5000838 | The Offer | 2 | full |
| 5000839 | Heart's Treasure | 7 | full |
| 5000840 | Blade's True Name | 2 | full |
| 5000841 | Sword Duel | 3 | full |
| 5000842 | Covenant's Call | 2 | full |
| 5000843 | Retribution | 1 | full |
| 5000844 | Opportunist | 8 | full |
| 5000845 | Righteous Loyalist | 9 | full |
| 5000846 | Superstitious Follower | 8 | full |
| 5000847 | Cowardly Opportunist | 2 | full |
| 5000848 | Greedy Opportunist | 2 | full |
| 5000849 | Homeland Banner | 2 | full |
| 5000850 | Invoking the Sacred Icon | 6 | full |
| 5000851 | Reclaim Oath of Gilded Blood | 2 | full |
| 5000852 | Serving the Sultan | 3 | full |
| 5000853 | One Against Hundred | 3 | full |
| 5000854 | Innocent Victim | 1 | full |
| 5000855 | A Grand Celebration | 3 | full |
| 5000856 | Ultimate Humiliation | 3 | full |
| 5000857 | Nighttime Service | 5 | full |
| 5000858 | Nighttime Service | 5 | full |
| 5000859 | Nighttime Service | 5 | full |
| 5000860 | Nighttime Service | 5 | full |
| 5000861 | Nighttime Service | 5 | full |
| 5000862 | Master of Revels | 1 | full |
| 5000863 | Sacred Blood Theft | 13 | full |
| 5001001 | The Grand Game | 111 | full |
| 5001002 | Sultan's Suspicion | 5 | full |
| 5001003 | Sultan's Mockery (Abandoned) | 6 | full |
| 5001004 | Headless Dragons | 34 | full |
| 5001005 | Palace Duel | 15 | full |
| 5001006 | Visit the Prison | 1 | full |
| 5001007 | Lowly Prison | 15 | full |
| 5001008 | Prison | 35 | full |
| 5001009 | Depths of the Black Prison (Abandoned) | 15 | full |
| 5001010 | Dark Alley Informant | 1 | full |
| 5001011 | Anonymous assailant | 3 | full |
| 5001012 | Jawad visits | 4 | full |
| 5001013 | Treasure Location | 5 | full |
| 5001014 | Hope for Exoneration | 1 | full |
| 5001015 | Qais Family Assistance | 2 | full |
| 5001016 | Sultan's Suspicion | 7 | full |
| 5001017 | The Sultan's Pleasure | 4 | full |
| 5001018 | Sultan's Suspicion | 8 | full |
| 5001019 | Fighting Wild Dogs | 2 | full |
| 5001020 | Fight with the Prisoner | 2 | full |
| 5001021 | Duel with the Lion | 4 | full |
| 5001022 | Duel with the Giant | 2 | full |
| 5001023 | Change of Dynasty | 3 | full |
| 5001024 | Investigate Evidence | 8 | full |
| 5001025 | Destroy Evidence | 6 | full |
| 5001026 | Charges and Defense | 9 | full |
| 5001027 | Pay for atonement | 1 | full |
| 5001028 | Presenting One's Wife and Concubine | 1 | full |
| 5001029 | Palace Duel | 18 | full |
| 5001100 | Palace Intrigue | 4 | full |
| 5001101 | Scourged Corpse | 1 | full |
| 5001102 | Arzuna's Proposition | 6 | full |
| 5001103 | No Return | 1 | full |
| 5001104 | Fallen Blossom | 1 | full |
| 5001501 | News in the Bathhouse | 13 | full |
| 5001502 | Steam Social | 9 | full |
| 5001503 | Bathhouse Date | 4 | full |
| 5001504 | Explanation | 2 | full |
| 5002001 | Sanitarium | 3 | full |
| 5002002 | Sickness Outbreak | 5 | full |
| 5002003 | House of Delights | 8 | full |
| 5002004 | House of Delights | 8 | full |
| 5002005 | House of Delights | 8 | full |
| 5002006 | Bookstore Business | 13 | full |
| 5002007 | Bookstore Rendezvous | 5 | full |
| 5002008 | Beggar at the Bookstore Entrance | 1 | full |
| 5002009 | Girl Returning the Book | 5 | full |
| 5002010 | Equipment Merchant | 6 | full |
| 5002011 | Equipment Merchant | 6 | full |
| 5002012 | Attire Merchant | 6 | full |
| 5002013 | Attire Merchant | 6 | full |
| 5002014 | Accessory Merchant | 6 | full |
| 5002015 | Accessory Merchant | 6 | full |
| 5002016 | Mysterious Merchant | 6 | full |
| 5002017 | Sweet Whip | 4 | full |
| 5002018 | Edge Walker | 4 | full |
| 5002019 | Celestial Gathering | 8 | full |
| 5002020 | Pleasures of the Sultan | 5 | full |
| 5002021 | Special Techniques – Assassinate the Sultan (Abandoned) | 5 | full |
| 5002022 | Redeem Junah | 3 | full |
| 5002023 | Call of Abnormal Affection | 3 | full |
| 5002024 | Disposing of a Corpse | 4 | full |
| 5002025 | Duel | 15 | full |
| 5002026 | Queen as Consort | 3 | full |
| 5002027 | Queen's Friend | 14 | full |
| 5002028 | Desperate Gamble | 1 | full |
| 5002029 | Shama's Funeral | 2 | full |
| 5002030 | Emergency Marriage | 3 | full |
| 5002031 | Righteous Cause | 3 | full |
| 5002032 | Flames of Fury | 1 | full |
| 5002033 | My Lord | 2 | full |
| 5002034 | Ascension | 2 | full |
| 5002035 | House of Delights | 8 | full |
| 5002036 | Book Hunt | 8 | full |
| 5002037 | Book Hunt | 8 | full |
| 5002038 | Book Hunt | 8 | full |
| 5002501 | Pack of Vicious Dogs | 8 | full |
| 5002502 | House Occupied by Vagrants | 8 | full |
| 5002503 | Famous Hamar Brothers | 3 | full |
| 5002504 | Divine Stallion | 2 | full |
| 5002505 | Killing the Fierce Lion | 5 | full |
| 5002506 | Merchant's Relics | 2 | full |
| 5002507 | Lion Rampage | 2 | full |
| 5002508 | Trail of the Wolf King | 2 | full |
| 5002509 | Battle at the Wolves’ Den | 4 | full |
| 5002510 | Sewer Crocodile | 4 | full |
| 5002511 | Snake Valley | 4 | full |
| 5002512 | Horse Betting | 2 | full |
| 5002513 | Horse Betting | 2 | full |
| 5002514 | Horse Betting | 2 | full |
| 5002515 | Horse Betting | 2 | full |
| 5002516 | Feeding the Fierce Lion | 3 | full |
| 5002517 | The Mountain Lion's Final Demand | 5 | full |
| 5003001 | Dissonance | 6 | full |
| 5003002 | Journey to Visit a Friend | 1 | full |
| 5003003 | Stress Relief | 2 | full |
| 5003004 | Storm Omen | 2 | full |
| 5003005 | Accumulated Grief | 2 | full |
| 5003006 | Into the Dream | 1 | full |
| 5003007 | Set You Free | 1 | full |
| 5003008 | Face the Reality | 3 | full |
| 5003009 | Execution | 2 | full |
| 5003010 | Brewing conspiracy | 7 | full |
| 5003011 | Shifting Winds | 12 | full |
| 5003012 | Rumors Spread | 2 | full |
| 5003013 | Justice's Challenge | 9 | full |
| 5003014 | Blackjack | 1 | full |
| 5003015 | Blade of Vengeance | 1 | full |
| 5003016 | Desperation | 2 | full |
| 5003017 | Super Charity | 2 | full |
| 5003018 | Honorable Bloodshed | 4 | full |
| 5003019 | The Solitary One | 2 | full |
| 5003020 | Palace Affairs | 4 | full |
| 5003021 | Royal Library | 4 | full |
| 5003022 | Selling Labor | 4 | full |
| 5003023 | Performing at the feast | 4 | full |
| 5003024 | Dog Eat Dog | 4 | full |
| 5003025 | Tavern Brawl | 4 | full |
| 5003026 | Hunting Game | 4 | full |
| 5003027 | Escape from the Sultan's Game | 21 | full |
| 5004001 | Explore the Dark Alley | 4 | full |
| 5004002 | Dark Alley Dwellers | 1 | full |
| 5004003 | Lost Money | 1 | full |
| 5004004 | High Constable's Investigation | 7 | full |
| 5004005 | Petty Crime | 5 | full |
| 5004006 | Medium Crime | 5 | full |
| 5004007 | Severe Crime | 5 | full |
| 5004010 | Pickpocket Group (Abandoned) | 9 | full |
| 5004012 | You are no longer trusted in the Dark Alley. | 2 | full |
| 5004013 | Organized Crime | 2 | full |
| 5004014 | Theft Example | 7 | full |
| 5004015 | Intimidation Example | 7 | full |
| 5004501 | Seeking Order Aid | 2 | full |
| 5004502 | Piety's Examination | 4 | full |
| 5004503 | Confession | 35 | full |
| 5004504 | Ritual Assistance | 1 | full |
| 5004505 | Library Organization | 1 | full |
| 5004506 | Recruitment | 1 | full |
| 5004507 | Sacred Procession | 1 | full |
| 5004508 | Tempting Opportunity | 5 | full |
| 5004509 | Faith Rejected | 1 | full |
| 5004510 | Gentle Detention | 2 | full |
| 5004511 | Lingering Curse | 1 | full |
| 5004512 | Public Enemy | 2 | full |
| 5004513 | Receive Divine Grace | 21 | full |
| 5004514 | Divine Purpose | 23 | full |
| 5004515 | Chamber of Prayer | 3 | full |
| 5004516 | Secret Meeting | 7 | full |
| 5004517 | The Sunblaze Scale | 20 | full |
| 5004518 | Among Jasmine Blossoms... | 2 | full |
| 5004519 | God Interpretation | 3 | full |
| 5004520 | Order Dominion | 1 | full |
| 5004521 | Sacred Contest | 6 | full |
| 5004522 | Divine Manifestation | 1 | full |
| 5004523 | Servant of God | 5 | full |
| 5004524 | Holy Uprising | 4 | full |
| 5004525 | Divine Light Trial | 1 | full |
| 5004526 | Choose the Enlightened | 9 | full |
| 5004527 | God's Big Rat | 4 | full |
| 5004801 | Awakening | 1 | full |
| 5004802 | The Depths Call | 1 | full |
| 5004803 | Inner God | 1 | full |
| 5004804 | God Visage | 1 | full |
| 5004805 | Light's Discipline | 1 | full |
| 5004806 | God Revelation | 1 | full |
| 5004807 | A manifestation of the True God. | 1 | full |
| 5004808 | Sacred Encounter | 3 | full |
| 5004809 | Madness Manifest | 9 | full |
| 5004810 | Madness Manifest | 10 | full |
| 5004811 | Madness Manifest | 10 | full |
| 5004812 | Madness Manifest | 11 | full |
| 5004813 | Madness Manifest | 10 | full |
| 5004814 | Madness Manifest | 9 | full |
| 5004815 | Beyond Walls | 1 | full |
| 5004816 | Zealot's Oil | 1 | full |
| 5004817 | Dispelling Madness | 24 | full |
| 5004818 | Battle of the Mind I | 14 | full |
| 5004819 | Battle of the Mind II | 14 | full |
| 5004820 | Battle of the Mind III | 14 | full |
| 5004821 | Battle of the Mind IV | 14 | full |
| 5004822 | Battle of the Mind V | 14 | full |
| 5004823 | Battle of the Mind VI | 14 | full |
| 5004824 | Battle of the Mind VII | 14 | full |
| 5004825 | Battle of the Mind VIII | 14 | full |
| 5004826 | Battle of the Mind IX | 14 | full |
| 5004827 | Battle of the Mind X | 14 | full |
| 5004828 | Battle of the Mind XI | 14 | full |
| 5004829 | Battle of the Mind XII | 14 | full |
| 5004830 | Battle of the Mind XIII | 14 | full |
| 5004831 | Battle of the Mind XIV | 14 | full |
| 5004832 | Battle of the Mind XV | 15 | full |
| 5004833 | Creator's Shadow | 3 | full |
| 5004901 | Maggie no longer resentful | 1 | full |
| 5004902 | Evil Purging | 5 | full |
| 5004903 | Succubus Power | 1 | full |
| 5004904 | Father's Flesh | 1 | full |
| 5004905 | Blood Rose | 3 | full |
| 5004906 | Luna, My Precious | 1 | full |
| 5004907 | Secret of the God | 3 | full |
| 5004908 | Faith Confrontation | 3 | full |
| 5004909 | Talent Cultivation | 2 | full |
| 5004910 | Dark Gathering | 18 | full |
| 5005101 | Silver Carnality Card | 6 | full |
| 5005102 | Gold Bloodshed Card | 3 | full |
| 5005103 | Stone Extravagance Card | 4 | full |
| 5005104 | Bronze Conquest Card | 2 | full |
| 5006001 | Dealing with the Betraying Friend | 3 | full |
| 5006002 | As You Wish | 2 | full |
| 5006003 | I Want It All | 2 | full |
| 5006004 | I Only Want the Best | 1 | full |
| 5006005 | A Day's Good Dream | 1 | full |
| 5006006 | Generous Donation | 2 | full |
| 5006007 | Money to Avoid Disaster | 1 | full |
| 5006008 | Betting funds | 4 | full |
| 5006009 | Gold Bird | 2 | full |
| 5006010 | Dispose of the Slave Awaiting Death | 2 | full |
| 5006011 | Unclean Material | 5 | full |
| 5006012 | The Sultan's Questioning | 2 | full |
| 5006013 | A Fine | 2 | full |
| 5006014 | Witness a Miracle | 3 | full |
| 5006015 | Corpse Power Workshop | 3 | full |
| 5006016 | The Gradually Perfected Creation | 17 | full |
| 5006017 | Corpse Power Workshop | 2 | full |
| 5006018 | Sultan's Demand | 1 | full |
| 5006019 | Sultan's Revenge | 2 | full |
| 5006020 | Life Creation Master | 1 | full |
| 5006021 | Privilege of the Strong | 4 | full |
| 5006022 | Metal Equipment Phantom Pain | 2 | full |
| 5006023 | Natural Rebirth | 4 | full |
| 5006024 | Expand the Rod of Life Sculpture | 2 | no-intro |
| 5006025 | Gift the Rod to Others | 3 | no-intro |
| 5006026 | Joy Makes Me Spin | 5 | full |
| 5006027 | Under the Sultan's Gaze | 5 | full |
| 5006028 | Focus of The Bathhouse | 2 | full |
| 5006029 | Wine and Flesh | 6 | full |
| 5006030 | Legend of the Dragon | 1 | full |
| 5006031 | A meeting related to the dragon | 3 | full |
| 5006032 | Things Warriors Do Not Need | 6 | full |
| 5006033 | Journey Alone | 2 | full |
| 5006034 | Struggling Forward | 1 | full |
| 5006035 | Dragon Lair Investigation | 3 | full |
| 5006036 | Final Preparations | 2 | full |
| 5006037 | Final Preparations | 1 | full |
| 5006038 | Heroic Act of Dragonslaying | 5 | full |
| 5006039 | A King-Sized Gift | 16 | full |
| 5006040 | Unparalleled Gift | 5 | full |
| 5006041 | Unmatched Love | 1 | full |
| 5006042 | One-on-one Sword Training | 1 | full |
| 5006043 | Maggie's Secret Recipe | 1 | full |
| 5006044 | Ways to Rest | 1 | full |
| 5006045 | The Purpose of Combat | 1 | full |
| 5006046 | Book of Dragonslaying | 2 | full |
| 5006047 | Necessary Preparations | 3 | full |
| 5006048 | Adila is seeking the dragon. | 1 | full |
| 5006049 | Before Departure | 1 | full |
| 5006050 | As Marriage Should Be | 1 | full |
| 5006051 | Adila is on an adventure. | 2 | full |
| 5006052 | Blessing Ritual | 2 | full |
| 5006053 | Maggie, let me ask you... | 4 | full |
| 5006054 | Heroic Act of Dragonslaying | 1 | full |
| 5006055 | Spread in the evening light... | 4 | full |
| 5006056 | Wedding Song | 3 | full |
| 5006057 | The Warrior's Union | 3 | full |
| 5006058 | Book of Dragonslaying | 2 | full |
| 5006059 | Trial in the Dream | 7 | full |
| 5006060 | Trial in the Dream | 3 | full |
| 5006061 | Trial in the Dream | 4 | full |
| 5006062 | Trial in the Dream | 3 | full |
| 5006063 | Study Results | 1 | full |
| 5006064 | Tracing the Trail | 1 | full |
| 5006065 | Final Preparations | 5 | full |
| 5006066 | Ambush at the Dragon's Lair | 2 | full |
| 5006067 | Heroic Act of Dragonslaying | 18 | full |
| 5006068 | Fatal Strike | 1 | full |
| 5006069 | Release | 3 | full |
| 5006070 | How Much Money Do You Need | 2 | full |
| 5006071 | Thirst for Blood | 5 | full |
| 5006072 | Dispose of the Captured Cultist | 2 | full |
| 5006073 | Conversations with God | 2 | full |
| 5006074 | Let Me Open Your Chest | 5 | full |
| 5006075 | Soul Beguiled by the Devil | 2 | full |
| 5006076 | Search the Remains | 1 | full |
| 5006077 | R.I.P. | 2 | full |
| 5006078 | Forge Dragonscale Equipment | 4 | full |
| 5006079 | Dragon Head's Ownership | 2 | full |
| 5006080 | Face the Sultan | 3 | full |
| 5006081 | Testing the Edge of the Blade | 3 | full |
| 5006082 | Elegy of the Defeated | 9 | full |
| 5006101 | Shadows of Flowers in the Corridor | 2 | full |
| 5006102 | Gold, Crystal, and Mud | 4 | full |
| 5006103 | Little Guardian | 4 | full |
| 5006104 | Homeland's Blood | 16 | full |
| 5006105 | Samir's disappointment | 3 | full |
| 5006106 | Unexpected Guests | 1 | full |
| 5006107 | Samir's Gratitude | 1 | full |
| 5006108 | An Unexpected Visitor | 3 | full |
| 5006109 | Execution | 1 | full |
| 5006110 | The Stillborn Affair | 9 | full |
| 5006111 | Inquiry in the Harem | 5 | full |
| 5006112 | Samir's Request | 3 | full |
| 5006113 | The Physician's Death | 2 | full |
| 5006114 | A Truth Samir Dreads | 2 | full |
| 5006115 | A Truth Samir Dreads | 2 | full |
| 5006116 | Medical Codex - Chapter I | 5 | full |
| 5006117 | Medical Codex - Chapter II | 5 | full |
| 5006118 | Compilation of the medical codex is in progress. | 1 | full |
| 5006119 | Last Chapter | 4 | full |
| 5006120 | Compilation of the medical codex is in progress. | 1 | full |
| 5006121 | The Very Last Chapter | 3 | full |
| 5006122 | A Quiet Place | 7 | full |
| 5006123 | A Quiet Place | 7 | full |
| 5006124 | Potion of Vitality | 1 | full |
| 5006125 | Precious Sample | 1 | full |
| 5006126 | A Cure for Wounds? | 4 | full |
| 5006127 | Pain Cannot Be Ignored | 8 | full |
| 5006128 | A New Medicine | 4 | full |
| 5006129 | A Midnight Call | 4 | full |
| 5006130 | The Uncanny Order | 1 | full |
| 5006131 | Not for Human Use | 4 | full |
| 5006132 | Punishment for Breaking Your Word | 2 | full |
| 5006133 | Tattoo Patterns | 1 | full |
| 5006134 | Nighttime Gift | 1 | full |
| 5006135 | Drink of the Night | 2 | full |
| 5006136 | Rough Gems | 9 | full |
| 5006137 | Gem Embedment | 4 | full |
| 5006138 | A Dubious Treasure | 12 | full |
| 5006139 | A Bloody Diamond Pit | 6 | full |
| 5006140 | Bloody Wealth | 18 | full |
| 5006141 | Diamond of Hope | 7 | full |
| 5006142 | Roast Pigeon | 2 | full |
| 5006143 | Feast of Gems | 4 | full |
| 5006144 | Healing Wounds | 4 | full |
| 5006145 | A Nobleman's Order | 3 | full |
| 5006146 | A Noble Lady's Order | 3 | full |
| 5006147 | Puppy's Commission | 3 | full |
| 5006148 | The Canvas for Her Jewels | 25 | full |
| 5006149 | Consort's Commission | 3 | full |
| 5006150 | Slave Girls' Commission | 3 | full |
| 5006151 | Treasures for the Sultan | 4 | full |
| 5006152 | The Sultan's Summons | 1 | full |
| 5006153 | The Crown's Appraisal | 6 | full |
| 5006154 | The Empire's Finest Jeweler | 1 | full |
| 5006155 | A Young Man's Commission | 3 | full |
| 5006156 | A Couple's Commission | 3 | full |
| 5006157 | A Mother's Commission | 4 | full |
| 5006158 | A Gem Unlike Any Other | 17 | full |
| 5006159 | Bone Craze | 1 | full |
| 5006165 | Lustrous Silk | 4 | full |
| 5006501 | Crusade against the clan | 1 | full |
| 5006502 | Forcefully Seizing the Withering Flower | 3 | full |
| 5006503 | The Poisonous Fruit | 1 | full |
| 5006504 | We should share everything | 1 | full |
| 5006505 | This might not be the best idea... | 4 | full |
| 5006506 | Two Ladies | 6 | full |
| 5006507 | The Only Flower in the Garden | 1 | full |
| 5006508 | Silent Conversation | 8 | full |
| 5006509 | What is Justice | 4 | full |
| 5006510 | Easily obtained happiness | 2 | full |
| 5006511 | Destroy the Corpse | 3 | full |
| 5006512 | Negotiation | 3 | full |
| 5006513 | Ruin and Death | 1 | full |
| 5006514 | Ripples in the Bathhouse | 3 | full |
| 5006515 | Entangled in Scandal | 2 | full |
| 5006516 | Perhaps We Shouldn't Have Done This | 3 | full |
| 5006517 | Ancient Language Lessons | 4 | full |
| 5006518 | The Pain of Editing | 2 | full |
| 5006519 | Fragment of the Star-Souled Glyphs | 2 | full |
| 5006520 | Star-Souled Night | 1 | full |
| 5006521 | Star-Souled Night | 1 | full |
| 5006522 | Revenge | 3 | full |
| 5006523 | The Orphan's Revenge | 2 | full |
| 5006524 | Acceptance of Reward | 5 | full |
| 5006525 | Acceptance of Reward | 5 | full |
| 5006526 | In the Shadows | 3 | full |
| 5006527 | Buy her books | 3 | full |
| 5006528 | In the Shadows | 7 | full |
| 5006529 | The Taste of Revenge | 2 | full |
| 5006530 | The Taste of Revenge | 2 | full |
| 5006531 | The Taste of Revenge | 2 | full |
| 5006532 | In the Shadows | 3 | full |
| 5006533 | Bloody Wall | 2 | full |
| 5006534 | Foolish Prostitute and Living Villain | 2 | full |
| 5006535 | Justice Must... | 2 | full |
| 5006536 | Challenges Are Ever-Present | 7 | full |
| 5006537 | Patricide | 2 | full |
| 5006538 | Honorable vs. Corrupt | 2 | full |
| 5006539 | Love Triangle | 4 | full |
| 5006540 | Desperate Housewives | 2 | full |
| 5006541 | Regicide | 2 | full |
| 5006542 | Sacrilegious Tongues | 2 | full |
| 5006543 | Till Death Do Us Meet | 3 | full |
| 5006544 | Shadows of Assassination | 1 | full |
| 5006545 | Shadows of Assassination | 6 | full |
| 5006546 | Shadows of Assassination | 6 | full |
| 5006547 | Dark Lane Attack | 2 | full |
| 5006548 | Shadows of Assassination | 6 | full |
| 5006549 | Their Revenge | 3 | full |
| 5006550 | Bloody Oasis | 2 | full |
| 5006551 | Mud-playing Tribe | 2 | full |
| 5006552 | Caravan Raid | 2 | full |
| 5006553 | Sin of Pride | 2 | full |
| 5006554 | Wealthy Troll | 2 | full |
| 5006555 | Evil Incarnate | 2 | full |
| 5006556 | Even you... | 6 | full |
| 5006557 | Mysterious Assistance | 20 | full |
| 5006558 | A Miracle in Restoration | 2 | full |
| 5006559 | Fire of Purification | 5 | full |
| 5006560 | Construct a Guesthouse | 2 | full |
| 5006561 | Guesthouse | 6 | full |
| 5006562 | Guesthouse | 6 | full |
| 5006563 | Guesthouse | 7 | full |
| 5006564 | Guesthouse | 7 | full |
| 5006565 | Guesthouse | 8 | full |
| 5006566 | Guesthouse | 8 | full |
| 5006567 | Guesthouse | 8 | full |
| 5006568 | Guesthouse | 8 | full |
| 5006569 | Stealth Cottage | 1 | full |
| 5006570 | Stealth Cottage | 1 | full |
| 5006571 | Reprobates in Refuge | 3 | full |
| 5006572 | Better Dead Than Living | 6 | full |
| 5006573 | Military Operations | 6 | full |
| 5006574 | Evil Emblem | 6 | full |
| 5006575 | Bullying in the Army | 6 | full |
| 5006576 | Flesh Tax | 6 | full |
| 5006577 | Civil Fundraising | 6 | full |
| 5006578 | Death of a Tax Farmer | 6 | full |
| 5006579 | Sultan's Demand | 7 | full |
| 5006580 | The Former King's Harem | 3 | full |
| 5006581 | Meritocracy / Kakistocracy | 6 | full |
| 5006582 | Supervision on Officials | 6 | full |
| 5006583 | Broken Vessels | 3 | full |
| 5006584 | Lineage Investigation | 3 | full |
| 5006585 | Sky-high Deficit | 4 | full |
| 5006586 | Representative of The People | 5 | full |
| 5006587 | Rest Day | 5 | full |
| 5006588 | Fog of War | 5 | full |
| 5006589 | Shield of Public Opinion | 1 | full |
| 5006590 | Shield of Influence | 1 | full |
| 5006591 | The Sultan's Suspicion | 7 | full |
| 5006592 | Book Burning | 7 | full |
| 5006593 | Uncontrollable Wife | 1 | full |
| 5006594 | As You Wish | 2 | full |
| 5006595 | The Missing | 4 | full |
| 5006596 | Lingering Fear | 1 | full |
| 5006597 | Going Further | 1 | full |
| 5006598 | Going Further | 1 | full |
| 5006599 | Malevolent Bride | 6 | full |
| 5006600 | Nayla needs your money | 1 | full |
| 5006601 | Nayla needs you | 1 | full |
| 5006602 | Nayla's Resentment | 1 | full |
| 5006603 | Unless... | 3 | full |
| 5006604 | Commitment and Detriment | 2 | full |
| 5006605 | Sickly Old Female Slave | 2 | full |
| 5006606 | Incurable Sickness | 4 | full |
| 5006607 | Incurable Sickness | 1 | full |
| 5006608 | Unstoppable Death | 3 | full |
| 5006609 | Coitus Matching | 6 | full |
| 5006610 | Curse Elimination | 1 | full |
| 5006611 | The Empire's warrior | 2 | full |
| 5006612 | The Empire's warrior | 3 | full |
| 5006613 | True Warriors of the Empire, Ranked | 4 | full |
| 5006614 | True Warriors of the Empire, Ranked | 5 | full |
| 5006615 | True Warriors of the Empire, Ranked | 2 | full |
| 5006616 | Day of Charity | 3 | full |
| 5006617 | Food Relief | 3 | full |
| 5006618 | Reward | 1 | full |
| 5006619 | Let Me Have a Taste | 5 | full |
| 5006620 | Betrayal and Escape | 1 | full |
| 5006621 | A Huge Toy | 3 | full |
| 5006622 | Stone Lunchbox | 1 | full |
| 5006623 | Many Stone Lunchboxes | 1 | full |
| 5006624 | Lunchbox Business | 3 | full |
| 5006625 | The Sands of Time | 2 | full |
| 5006626 | The Master's Feast | 1 | full |
| 5006627 | The Feast for Everyone | 6 | full |
| 5006628 | Blow the Bone Flute | 1 | full |
| 5006629 | An Irresistible Comfort | 5 | full |
| 5006630 | Marriage | 2 | full |
| 5006631 | Running Wildly All Night | 6 | full |
| 5006632 | Never Leave Her Side. | 2 | full |
| 5006633 | Make Peace | 1 | full |
| 5006634 | Handle with the Slave | 2 | full |
| 5006635 | Private Investigation | 1 | full |
| 5006636 | How Dare You? | 6 | full |
| 5006637 | Deterministic Force | 1 | full |
| 5006638 | Melancholic and Disheartened. | 1 | full |
| 5006639 | Tribulation | 5 | full |
| 5006640 | Deterministic Force | 1 | full |
| 5006641 | Confrontation at Court | 2 | full |
| 5006642 | Free Will | 2 | full |
| 5006643 | Lengthy Inquiry | 2 | full |
| 5006644 | Palace Gate Donation | 2 | full |
| 5006645 | Disgrace of Being Abandoned | 1 | full |
| 5006646 | What do the poor really need? | 17 | full |
| 5006647 | A Mother's Drop | 1 | full |
| 5006648 | Nawfal's Actions | 1 | full |
| 5006649 | Changes Brought | 1 | full |
| 5006650 | God's Grace | 2 | full |
| 5006651 | Nawfal's Actions | 2 | full |
| 5006652 | Unchanged | 3 | full |
| 5006653 | Golden Tool | 1 | full |
| 5006654 | Nawfal's Actions | 1 | full |
| 5006655 | Bringing Hope | 1 | full |
| 5006656 | Fire of Punishment | 1 | full |
| 5006657 | Rob The Rich, Give to The Poor | 2 | full |
| 5006658 | Vengeance in Justice | 2 | full |
| 5006659 | Terror Manor | 3 | full |
| 5006660 | Courage and Unity | 1 | full |
| 5006661 | Call of the Flames | 1 | full |
| 5006662 | The Crossing of Clear Streams | 13 | full |
| 5006663 | Clean troop | 3 | full |
| 5006664 | Enjoy the wine | 2 | full |
| 5006665 | Nawfal detained in seclusion | 2 | full |
| 5006666 | Clean troop | 5 | full |
| 5006667 | Loyalty And The Judging Eyes | 1 | full |
| 5006668 | Hefty Price | 1 | full |
| 5006669 | Malicious Pranks | 4 | full |
| 5006670 | Malicious Joke | 6 | full |
| 5006671 | Land of the Foul Flow | 4 | full |
| 5006672 | Prisoner and Kidnapper | 4 | full |
| 5006673 | A Curious News Story | 1 | full |
| 5006674 | Futile Charity | 3 | full |
| 5006675 | Whimsical Idea | 3 | full |
| 5006676 | Nursery | 2 | full |
| 5006677 | Nursery | 21 | full |
| 5006678 | Last Wish | 2 | full |
| 5006679 | Suspicious Coin | 5 | full |
| 5006680 | Revealing the Truth | 3 | full |
| 5006681 | Interrogation | 4 | full |
| 5006682 | Ransack | 8 | full |
| 5006683 | The Sultan's Suspicion | 4 | full |
| 5006684 | Please the Sultan | 5 | full |
| 5006685 | Minting | 7 | full |
| 5006686 | A Delicacy | 13 | full |
| 5006687 | Calling the Dishes | 3 | full |
| 5006688 | When We Speak of Love | 14 | full |
| 5006689 | Mischief | 9 | full |
| 5006690 | Hassan's Ordeal | 6 | full |
| 5006691 | Poem of Delights | 1 | full |
| 5006692 | Nursery Lessons | 1 | full |
| 5006693 | Art Advisor | 1 | full |
| 5006694 | Court Poet | 1 | full |
| 5006695 | The Poet's Renown | 8 | full |
| 5006696 | The Poet's Lamb | 6 | full |
| 5006697 | Strange Assault | 9 | full |
| 5006698 | A Strange Story | 6 | full |
| 5006699 | Baa, Baa! Enough of That! | 9 | full |
| 5006700 | The Bookshop of Fate | 8 | full |
| 5006701 | The Poet's Visit | 4 | full |
| 5006702 | The Jeweler's Visit | 4 | full |
| 5006703 | The Dancer's Visit | 4 | full |
| 5006704 | Meow, Meow | 4 | full |
| 5006705 | The Makeup Artist's Visit | 4 | full |
| 5006706 | The Kindred Bird | 4 | full |
| 5006710 | The Bookstore Owner's Visit | 1 | full |
| 5006711 | Ambiguities | 2 | full |
| 5006712 | Strange Rumors | 3 | full |
| 5006713 | Midnight Banquet | 2 | full |
| 5006714 | Even Stranger Rumors | 3 | full |
| 5006715 | Mortal's Research | 1 | full |
| 5006716 | Midnight Banquet | 6 | full |
| 5006717 | The Whole Story | 3 | full |
| 5006718 | Encyclopedia | 16 | full |
| 5006719 | The Calling Card | 5 | full |
| 5006720 | The Vault | 4 | full |
| 5006721 | The Copyist | 1 | full |
| 5006722 | Return to the Grove | 3 | full |
| 5006723 | Ink Offender | 2 | full |
| 5006724 | Errant Thoughts | 1 | full |
| 5006725 | The Birth of a Book | 3 | full |
| 5006726 | The Art of the Printing | 1 | full |
| 5006727 | Support the Official Release | 24 | full |
| 5006728 | Perhaps you should share it with her. | 4 | full |
| 5006729 | Patron of Stories | 10 | full |
| 5006730 | Of Flesh and Bone Dust | 1 | full |
| 5006731 | The Heart of the Labyrinth | 1 | full |
| 5006732 | A Place Unknown | 1 | full |
| 5006733 | Little Star | 1 | full |
| 5006734 | On the Measure of Criticism | 1 | full |
| 5006735 | The Expedition of Isar | 1 | full |
| 5006736 | Tales of the Mountain Home | 1 | full |
| 5006737 | The Angler and Me | 1 | full |
| 5006738 | On the Craft of Printing | 1 | full |
| 5006739 | Strings of the Cosmos | 1 | full |
| 5006740 | Rose Oil Offered | 1 | full |
| 5006741 | The Rope's Tempering | 1 | full |
| 5006742 | The Makeup Artist's Visit | 3 | full |
| 5006743 | The Look of Kindness | 7 | full |
| 5006744 | The Look of Evil | 7 | full |
| 5006745 | The Look of Power | 4 | full |
| 5006746 | The Look of the Chivalry | 7 | full |
| 5006747 | Hidden Among the Many | 1 | full |
| 5006748 | 神的侍从 | 12 | full |
| 5006749 | 神的威能 | 13 | full |
| 5007001 | Against Nawfal | 8 | full |
| 5007002 | Accumulate Advantages | 5 | full |
| 5007003 | Ruining reputations. | 5 | full |
| 5007004 | Turmoil In The Court | 2 | full |
| 5007005 | Spreading Rumors | 5 | full |
| 5007006 | Divide and Conquer | 5 | full |
| 5007007 | Discordance Scheme | 3 | full |
| 5007008 | Raid the Slums. | 8 | full |
| 5007009 | Peeking Eyes | 5 | full |
| 5007010 | A Loyal Enemy | 5 | full |
| 5007011 | Recruit Subordinates | 5 | full |
| 5007012 | Ambush | 5 | full |
| 5007013 | Victim | 3 | full |
| 5007014 | Sabotage behind the scenes | 5 | full |
| 5007015 | Reckless Revenge | 5 | full |
| 5007016 | Desperate Gamble | 4 | full |
| 5008001 | Worries of the Wife | 3 | full |
| 5008002 | Arming the Wife | 3 | full |
| 5008003 | Special pillow | 3 | full |
| 5008004 | Excuse for you. | 4 | full |
| 5008005 | Wife's Tea Party | 10 | full |
| 5008006 | Encouragement | 6 | full |
| 5008007 | Encouragement | 6 | full |
| 5008008 | Desire and Happiness | 4 | full |
| 5008009 | Betrayal | 4 | full |
| 5008010 | Youth’s Curtain | 6 | full |
| 5008011 | Dangerous Gathering | 6 | full |
| 5008012 | Revolutionary Salon | 8 | full |
| 5008013 | Glory through Wealth | 3 | full |
| 5008014 | Glorious Return | 2 | full |
| 5008015 | Purchase Title | 2 | full |
| 5008016 | Final Farewell | 1 | full |
| 5008017 | The Right Price | 1 | full |
| 5008018 | No Second Chances | 1 | full |
| 5008019 | Glorious Return | 1 | full |
| 5008020 | Eternal Legacy | 2 | full |
| 5008021 | Abandoned | 1 | full |
| 5008022 | Abandoned | 1 | full |
| 5008023 | Ritual of Harvest | 2 | full |
| 5008024 | Destroy the Blueprints | 1 | full |
| 5008025 | Ritual of Inner Chambers | 8 | full |
| 5008026 | Room for Redemption | 1 | full |
| 5008027 | Room for Redemption | 2 | full |
| 5008028 | I've heard it all! | 2 | full |
| 5008029 | Ritual of Sword and Shield | 5 | full |
| 5008030 | Agitated | 4 | full |
| 5008031 | Duel | 6 | full |
| 5008032 | Ruin | 1 | full |
| 5008033 | Someone Else's Daughter | 2 | full |
| 5008034 | Accumulate Advantages | 5 | full |
| 5008035 | Behind-the-scenes. | 5 | full |
| 5008036 | Planning an attack. | 5 | full |
| 5008037 | Ambush. | 3 | full |
| 5008038 | Interfere with business. | 5 | full |
| 5008039 | Ruining reputations. | 5 | full |
| 5008040 | Slander. | 5 | full |
| 5008041 | Prosecute his action | 5 | full |
| 5008042 | Plan an assassination. | 5 | full |
| 5008043 | An assassination. | 3 | full |
| 5008044 | Imprisonment. | 2 | full |
| 5008045 | Raid the corrupt official's residence | 8 | full |
| 5008046 | Again? | 4 | full |
| 5008047 | Feast | 11 | full |
| 5008048 | A pleasant memory | 2 | full |
| 5008049 | Zephyr's Date | 1 | full |
| 5008050 | The Gold Coin Dowry | 2 | full |
| 5008051 | Joyful Visitor | 1 | full |
| 5008052 | Zephyr's settling-in allowance | 1 | full |
| 5008053 | Missing Zephyr | 1 | full |
| 5008054 | Zephyr's settling-in allowance | 1 | full |
| 5008055 | Pathway Home (Obsolete) | 2 | full |
| 5008056 | The Promised Moment | 4 | full |
| 5008057 | The Same Storm | 5 | full |
| 5008058 | Let Me Be Your Shield | 2 | full |
| 5008059 | An Escape Like a Mouse | 5 | full |
| 5008060 | Matchmaker | 10 | full |
| 5008061 | No Second Chances | 1 | full |
| 5008062 | First Sight | 4 | full |
| 5008063 | Young People's Wedding | 6 | full |
| 5008064 | Pathway Home | 2 | full |
| 5008065 | Hometown Folks Meet | 1 | full |
| 5008066 | At Your Service | 3 | full |
| 5008067 | Catching a Thief | 6 | full |
| 5008068 | One Hand for Goods | 9 | full |
| 5008069 | Money First, Goods Later | 5 | full |
| 5008070 | Fate of the Pickpocket | 1 | full |
| 5008071 | Night Thief | 8 | full |
| 5008072 | Nest of Decay | 6 | full |
| 5008073 | Street Urchins | 2 | full |
| 5008074 | White-Belly | 7 | full |
| 5008075 | Turning the Millstone | 5 | full |
| 5008076 | Thief Apprentice | 5 | full |
| 5008077 | Alim's Feast | 2 | full |
| 5008078 | Hungry Mouths | 2 | full |
| 5008079 | Become Prostitutes | 2 | full |
| 5008080 | Beast of Burden | 2 | full |
| 5008081 | Become Lambs | 4 | full |
| 5008082 | Become Dogs | 2 | full |
| 5008083 | Become a Lamb? | 2 | full |
| 5008084 | Become Rats | 2 | full |
| 5008085 | Become Human | 3 | full |
| 5008086 | Abandoned | 0 | no-branches |
| 5008087 | Dog Den | 2 | full |
| 5008088 | A Proper Meal | 4 | full |
| 5008089 | A Troubled Wife | 3 | full |
| 5008090 | Everyone come together! | 4 | full |
| 5008091 | Someone didn't get any | 5 | full |
| 5008092 | Nobles also want to eat | 7 | full |
| 5008093 | Dinner is Served | 2 | full |
| 5008094 | Comfort Food | 5 | full |
| 5008095 | A Jar of Candied Fruits | 2 | full |
| 5008096 | Free Feast | 6 | full |
| 5008097 | Troublemaking Rat | 3 | full |
| 5008098 | Big Rat | 6 | full |
| 5008099 | Family Portrait | 2 | full |
| 5008100 | Waiting for a meal | 1 | full |
| 5008101 | Cold Amusement | 1 | full |
| 5008102 | Spicy Feast | 1 | full |
| 5008103 | Warrior's Feast | 1 | full |
| 5008104 | Court Banquet | 1 | full |
| 5008105 | Paean Assembly | 1 | full |
| 5008106 | Carnival | 1 | full |
| 5008107 | Laughter in the Attic | 2 | full |
| 5008108 | Partnership Gold | 2 | full |
| 5008109 | Echoes from Above | 8 | full |
| 5008110 | Echoes from Above | 8 | full |
| 5008111 | Sporadic Joy | 1 | full |
| 5008112 | Laughter in the Attic | 1 | full |
| 5008113 | Corrupt Rose | 8 | full |
| 5008114 | Carving of the Dark Lord | 1 | full |
| 5008115 | Stinking Attic | 2 | full |
| 5008116 | Velvet Chamber | 3 | full |
| 5008117 | Royal Interest | 8 | full |
| 5008118 | Noble Hospitality | 28 | full |
| 5008119 | Royal Chef | 3 | full |
| 5008120 | Sultan's Suspicion | 5 | full |
| 5008121 | Habib's Escape | 9 | full |
| 5008122 | Royal Favorite | 1 | full |
| 5008123 | Adventurer's Tavern | 10 | full |
| 5008125 | Midnight Blade | 6 | full |
| 5008126 | Stop Now | 5 | full |
| 5008127 | You Are the Last One | 4 | full |
| 5008128 | Blossom's Fall | 1 | full |
| 5008129 | Food Poisoning | 1 | full |
| 5008130 | Armed Sheep | 1 | full |
| 5008131 | Fire! Fire! Fire! | 2 | full |
| 5008132 | Food or Foe? | 17 | full |
| 5008133 | White Crocodile Pilaf | 3 | full |
| 5008134 | Smoked Lion Feast | 3 | full |
| 5008135 | Pudding of Life | 3 | full |
| 5008136 | Wilderness Stew | 3 | full |
| 5008137 | Wild Goose Herbal Broth | 3 | full |
| 5008138 | Whole Roasted Camel | 3 | full |
| 5008139 | The Vitality Platter | 3 | full |
| 5008140 | Cactus Cake | 3 | full |
| 5008141 | Holy Bread | 3 | full |
| 5008142 | King's Roast | 3 | full |
| 5008143 | Anything Wrap | 3 | full |
| 5008144 | Honey Omelette | 3 | full |
| 5008145 | Adventurers' Gratitude | 1 | full |
| 5008146 | Dark Alley Dog-Fighting | 24 | full |
| 5008147 | Beyond Whistles | 1 | full |
| 5008148 | UlLTIMATE Dog-Fighting | 24 | full |
| 5008149 | Vengeance Request | 5 | full |
| 5008150 | Piecing the Truth Together | 13 | full |
| 5008151 | Inescapable Conclusion | 9 | full |
| 5008152 | Rare Jerky | 4 | full |
| 5008153 | Superior Replacement | 8 | full |
| 5008154 | Unexpected Visitor | 6 | full |
| 5008155 | Sultan's Message? | 6 | full |
| 5008156 | Path to Redemption | 4 | full |
| 5008157 | Fadia's Help | 2 | full |
| 5008158 | Classic Terrace Buffet | 3 | full |
| 5008159 | Seared Fowl and Wild Mushrooms | 3 | full |
| 5008160 | Mysterious Note | 1 | full |
| 5008161 | Playful Little Moon | 9 | full |
| 5008162 | A Song of Two Moons | 1 | full |
| 5008163 | Rising Little Moon | 3 | full |
| 5008164 | Faith Challenge | 11 | full |
| 5008165 | Abandoned | 6 | no-intro |
| 5008166 | Cult Messenger | 3 | full |
| 5008167 | Impure Aid | 13 | full |
| 5008168 | Fate's End | 15 | full |
| 5008169 | Harem Vacancy | 1 | full |
| 5008170 | Abandoned | 1 | full |
| 5008171 | Absurd Pleasure | 16 | full |
| 5008172 | Devourer's Hunger | 9 | full |
| 5008173 | Devourer's Hunger | 9 | full |
| 5008174 | Devourer's Hunger | 9 | full |
| 5008175 | Devourer's Hunger | 7 | full |
| 5008176 | Voracious Idol | 1 | full |
| 5008177 | Innocent Victim | 7 | full |
| 5008178 | Flesh-Carver | 12 | full |
| 5008179 | Cleanse the Cultists | 25 | full |
| 5008180 | Prisoner's Fate | 4 | full |
| 5008181 | God, Please Descent! | 19 | full |
| 5008182 | Divine Summoning | 20 | full |
| 5008183 | Unholy Birth | 14 | full |
| 5008184 | Vengeful Curse | 4 | full |
| 5008185 | Abandoned | 1 | full |
| 5008186 | Divine Summoning | 1 | full |
| 5008187 | Secret Chamber | 29 | full |
| 5008188 | The Cultic God's Curse | 9 | full |
| 5008189 | Liberation Bloom | 16 | full |
| 5008190 | Fallen Call | 4 | full |
| 5008191 | The Realm of Serpent | 2 | full |
| 5008192 | Viper Temple | 12 | full |
| 5008193 | Serpent's Desire | 5 | full |
| 5008194 | Serpent's Purification | 1 | full |
| 5008195 | A Mercenary's Journal | 2 | full |
| 5008196 | The Vagrants' Demand | 6 | full |
| 5008197 | The Vagrants' Labor | 1 | full |
| 5008198 | The Vagrants' Demand | 7 | full |
| 5008199 | Squatting Tenants | 4 | full |
| 5008200 | The Vagrants' Labor | 1 | full |
| 5008201 | [player.name]'s Fortress | 3 | full |
| 5008202 | [player.name]'s Fortress | 25 | full |
| 5008203 | The Besieged Keep | 2 | full |
| 5008204 | The Busy Raed | 2 | full |
| 5008205 | The False Princess | 9 | full |
| 5008206 | Master of Intrigue | 10 | full |
| 5008207 | Sparkling Presence | 13 | full |
| 5008208 | Jawad's Smile | 1 | full |
| 5008209 | The Court Physician's Diagnosis | 2 | full |
| 5008210 | The Cultic God's Blessing | 2 | full |
| 5008211 | The Blessing of the Truth | 2 | full |
| 5008212 | Shrewd Servants | 1 | full |
| 5008213 | Reverse Engineering | 1 | full |
| 5008214 | Flowers and Swords | 1 | full |
| 5008215 | The Sultan's Summons | 26 | full |
| 5008216 | Who Is She? | 6 | full |
| 5008217 | A Daughtet's Tale | 4 | full |
| 5008218 | Death Match | 4 | full |
| 5008219 | Bloodshed and Passion | 1 | full |
| 5008220 | The Joy of Kinslaying | 1 | full |
| 5010000 | Escape Countdown | 8 | full |
| 5010001 | Let's go! | 2 | full |
| 5010002 | Night of Soul Shattering | 1 | full |
| 5010003 | Final Carnality Card | 4 | full |
| 5010004 | Final Bloodshed Card | 4 | full |
| 5010005 | Final Conquest Card | 5 | full |
| 5010006 | Final Extravagance Card | 3 | full |
| 5010007 | Before Dawn | 5 | full |
| 5010008 | Assemble the Troops | 6 | full |
| 5010009 | The Dawn Rally | 10 | full |
| 5010010 | Honor Guards | 8 | full |
| 5010011 | Sultan's Walls | 42 | full |
| 5010012 | Burning City | 39 | full |
| 5010013 | Palace | 36 | full |
| 5010014 | Face the Sultan | 14 | full |
| 5010015 | The Honor Guard's Promise | 9 | full |
| 5010016 | Do Whatever You Want | 7 | full |
| 5010017 | Dance of Light | 21 | full |
| 5010018 | Dance of Swords | 13 | full |
| 5010019 | Dance of the King | 13 | full |
| 5010020 | Nawfal's Poisoned Arrows | 5 | full |
| 5010021 | Nayla's Request | 3 | full |
| 5010022 | Behind the Veil | 2 | full |
| 5010023 | Steps | 135 | full |
| 5010024 | Fruit | 45 | full |
| 5010025 | Assemble the Troops | 6 | full |
| 5010026 | Final Carnality Card | 2 | full |
| 5010027 | Final Bloodshed Card | 3 | full |
| 5010028 | Final Extravagance Card | 4 | full |
| 5010029 | Final Conquest Card | 2 | full |
| 5010030 | Abyss Invitation | 4 | full |
| 5010031 | The Sorceress's Invitation | 1 | full |
| 5010032 | The Sultan's Reward | 1 | full |
| 5010033 | Ancient Road | 1 | full |
| 5010034 | Sacred Branding | 3 | full |
| 5010035 | Abandoned | 1 | full |
| 5010036 | Audience with Sultan | 1 | full |
| 5010037 | Sacred Pillars | 3 | full |
| 5010038 | Gilding | 3 | full |
| 5010039 | Kindling | 2 | full |
| 5010040 | Judgment Flames | 1 | full |
| 5010041 | Final Temptation | 2 | full |
| 5010042 | Revelation Ritual | 18 | full |
| 5010043 | Deicide (Abandoned) | 18 | full |
| 5010044 | Religious Leader's Privilege | 9 | full |
| 5010045 | World's Eye | 15 | full |
| 5010046 | Great Hunt | 7 | full |
| 5010047 | Dagger's Path | 13 | full |
| 5010048 | Sky Fire | 14 | full |
| 5010049 | Reborn True God | 9 | full |
| 5010050 | Flower of Evil | 3 | full |
| 5010051 | Conception | 7 | full |
| 5010052 | Insatiable Hunger | 4 | full |
| 5010053 | Starve | 1 | full |
| 5010054 | Final Absolution | 2 | full |
| 5010055 | Womb | 2 | full |
| 5010056 | Blood Offering | 4 | full |
| 5010057 | The Sultan's Questioning | 1 | full |
| 5010058 | Final Reckoning | 3 | full |
| 5010059 | Divine Genesis | 9 | full |
| 5010060 | Gathering Darkness | 12 | full |
| 5010061 | Apocalyptic Storm | 15 | full |
| 5010062 | Nightmare's Edge | 26 | full |
| 5010063 | Flawed Creation | 11 | full |
| 5010064 | Chaos King | 4 | full |

