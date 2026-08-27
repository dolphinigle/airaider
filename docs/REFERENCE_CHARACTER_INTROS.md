# Sultan's Game — HOW A NEW CHARACTER IS INTRODUCED

*(gathered 2026-08-27 at the designer's request: "check how sultan game introduces a new character
like Mahir in her quest. Read at least 10 of these… put them in a written list to refer to.")*

Extracted verbatim from the shipped English text (`research/sultans_en/config_merged.json.gz`,
43,619 entries). Every character introduction in the game is below — 22 of them.

---

## THE STRUCTURAL FACT, before any craft note

**Sultan's Game does not introduce a character inside a quest. It introduces them on their own
CARD, and quests afterwards use the bare name freely.** Mahir's quest text reads *"While desperately
trying to stop Mahir from dismantling it…"* with no introduction at all — because you met her card
first. The introduction and the task are two different objects.

Each card carries three fields, and the middle one is doing the heavy lifting:

```
NAME    Mahir
TITLE   Eccentric Artisan          ← the reader knows WHAT SHE IS before a word of prose
TEXT    At banquets, Mahir is often the butt of her fellow noble's jokes. …
```

The prose never spends words on "X is a Y" because the **title already said it**. That is why these
read so cleanly at 45-70 words: the placing is free.

---

## THE TWENTY-TWO (verbatim)

**1. Sadani** — «Once-Favored Consort»

> A captivating beauty, she was once the Sultan's undisputed favorite. But there will always someone younger, someone fairer. Sadani refuses to accept the inconstancy of her lord and will do anything she can to wrest back that heart of stone. As it happens, her madness is a delicacy the Sultan relishes.

**2. Zazie** — «Sultan's Favorite»

> The monarch's favor has swept away all memory of Zazie's humble origin. She rides the tides of adulation arrogantly, imperiously, and without worry. After all, her youth and beauty have already fetched her a price ten thousand times more than she could even dream in the House of Delights. As for what tomorrow may bring, she does not care.

**3. Samir** — «Court Physician»

> Samir has served the court for over ten years. He is a skilled physician, well-dressed, and avoids the touch of women. After all, more often than not, it is the delicate female members of the harem that requires his treatment, instead of the robust Sultan. It is said that the monarch once gifted him a male concubine. The two share a harmonious companionship till this day.

**4. Habib** — «Handy Chef»

> A chef highly skilled in both culinary arts and knife work. He excels in everything from butchering livestock, stewing pilaf that feeds an army, to arranging fruits into beautiful ornaments that delight the ladies. If you can provide Habib with inspiration or high quality ingredients, he will serve up a feast anytime.

**5. Nayla** — «Vain Noblewoman»

> Born of a venerable bloodline and blessed with a frail husband, Nayla is unafraid to be immodest. Flitting through the court's glittering intrigues, she has amassed many admirers, yet few catch her favor... For who can truly sate her insatiable vanity?

**6. Emane** — «Theologian»

> The words of the divine are laws, and Emane is their interpreter. Each morn, she preaches to her flock. With each hymn and prayer, her path grows clearer, her resolve unshaken. She believes in the truth of her words – for who could be closer to that vast and awe-inspiring presence than one who lives and breathes its guidance?

**7. Manar** — «Cartographer»

> Manar spent half her life recording every mountain range, valley, and oasis she traveled to with her paintbrush. She documented the migration of community and the trails of merchants. Eventually, she compiled all of her painstaking work into a meticulously drawn map. Some marveled at it, some questioned it. Unbeknownst to her, the ruler of this kingdom has also developed a unique interest in it...

**8. Junah** — «Popular Prostitute»

> Junah is beautiful, but lacks a certain poise. This means she cannot charge as much, which, for many patrons, works just fine. The other prostitutes think she is wasting her potential, but they do not know what she wants.

**9. Jalila** — «Queen of the Whip»

> Jalila has meticulously crafted her unapproachable persona. Many clients spend enough on her to buy several farms, and their only reward is a chance to kneel and kiss her toes – perhaps that is exactly what they want.

**10. Shama** — «Social Butterfly»

> Some say Shama is the illegitimate daughter of a noble lord. Her refined speech lends credence to such rumors. She might just be the city's finest fixer, when it comes to unsavory matters that require a delicate touch – pleasures of the bedchamber are merely a sweetener to her real service.

**11. Nawfal** — «Political Opposition»

> Nawfal was not born to an esteemed family. He spent five years earning the right to be the Sultan's courtier, and another five years coming to the realization that he cannot change the Sultan's ways. His ambition has smoldered into a profound disappointment, but he may yet find another way to save this country.

**12. Abdul** — «Sultan's Vizier»

> Everything Abdul enjoys as the vizier – wealth, status, privileges – stems from his diligent service to his master. He is the sharpest blade in the Sultan's arsenal and the court’s most eager jester.

**13. Fardak** — «Royal Hostage from a Vassal Tribe»

> Fardak comes from a vassal tribe. He was sent by his father to demonstrate the tribe's loyalty to the Sultan. His face still carries traces of a young man's barely concealed resentment – a look the Sultan adores, for it marks him as a perfect plaything.

**14. Ziad** — «Tax Collector»

> Ziad works diligently and meticulously. Driven by the abundant energy and vigor of youth, he is always trying to understand the causes of the tax anomalies and how to rectify them, rather than, like a seasoned tax collector, manipulating numbers to produce a pleasing report.

**15. Mahir** — «Eccentric Artisan»

> At banquets, Mahir is often the butt of her fellow noble's jokes. Neurotic and naive, she has no grasp of household affairs and shuts herself away from people, obsessing over absurd and useless studies. How ludicrous, she has debased herself into a mere craftswoman! But what is left unspoken is this: it is exactly those who mock her that have carved up her inheritance to the last scrap.

**16. Ensa** — «Unused»

> Ensa is an envoy from a distant land, bringing rich and exotic specialties to the Sultan. She is filled with curiosity about this land and spends much of her time wandering its streets, listening to others' stories and giving appropriate responses. She effortlessly blends in with officials, commoners, and merchants alike. After all, who can refuse a warm and generous guest?

**17. Hussain** — «Unused»

> Hussain is the most renowned court painter in the city, skillful and adept. It is said that his brush was blessed by god. How else could one create such rich and vivid artworks in three short days, while never missing a single banquet?

**18. Murtaz** — «Coward Who Resents the Sultan»

> No one likes the shady Murtaz. Now that the miserable rat has lost his family and fortune, even more so: people in court avoid him like the plague. But the Sultan enjoys his presence. That is the sole reason Murtaz must continue to attend court: to parade his feeble, impotent hatred for his master's amusement.

**19. Fayda** — «Unused»

> Fayda comes from an ancient noble line. It is said that his ancestors established their family estate over a thousand years ago, and only moved to this city twenty years ago due to changes in land and climate. But Fayda and his family do not pride themselves on this long history. They treat people with modesty and kindness and rarely voices any opinion in court.

**20. Malkina** — «Seamstress»

> Malkina's mother once served as a slave and managed your family's tailor shop. In time, she earned her freedom and a share in the shop. Now, bearing her mother's command, armed with golden needles, silver threads, eyes for beauty, and hands touched by god, Malkina has come to aid you in your mortal plight. Through [Methinks], she can give you and your followers a complete makeover.

**21. Hassan** — «Poet»

> Hassan is a terrible friend. He pays no debt, shirks all work, drinks all day, and amuses himself with crude, base antics. Yet, upon hearing of your plight, he brought a dagger and moved into your front hall, managing three whole days without a drink. He gains [Inspiration] by joining any ceremony, and can spend it through [Methinks] to write poems.

**22. Lady Becky** — «Cat»

> Two generations before the current Sultan, Lady Becky's ancestor was given the noble title for protecting a young prince from a venomous snake. The title has been passed down through eleven generations. Although no one takes it seriously, his nobility comes with full paperwork and all the legal force behind it. Additionally, he truly is a clever and beautiful kitten.

**23. Buthayna** — «Madam of the House of Delights»

> The still-radiant Madam Buthayna is the ostensible mistress of the House of Delights. Whispers claim that in her youth, she was so breathtaking that even the late Sultan sought her company beneath her silken canopy.
---

## THE PATTERN — eight things all of them do

Read across all 22. These are observations of the corpus, not rules for us yet.

### 1. The ROLE is a field, not a sentence
«Court Physician» · «Tax Collector» · «Vain Noblewoman» · «Royal Hostage from a Vassal Tribe».
The reader is placed before the prose starts, so no sentence is spent placing them. **This is the
single biggest difference from what we generate**, where the card must carry both jobs at once.

### 2. The text rarely opens on the name
It opens on a judgement, a world-fact, or a scene, and lets the person arrive inside it:
- *"A captivating beauty, she was once the Sultan's undisputed favorite."* (Sadani)
- *"The words of the divine are laws, and Emane is their interpreter."* (Emane)
- *"No one likes the shady Murtaz."*
- *"At banquets, Mahir is often the butt of her fellow noble's jokes."*
- *"Hassan is a terrible friend."*

A bare name leading a sentence is the exception, not the rule.

### 3. Everyone is placed against POWER — the Sultan, the court, or YOU
- *"once the Sultan's undisputed favorite"* · *"has served the court for over ten years"*
- *"the sharpest blade in the Sultan's arsenal and the court's most eager jester"* (Abdul)
- *"Malkina's mother once served as a slave and managed **your** family's tailor shop"*
- *"upon hearing of **your** plight, he brought a dagger and moved into your front hall"* (Hassan)

Nobody is described in isolation. Position in the hierarchy IS the characterisation.

### 4. Every one carries a WANT or an unresolved tension
- *"will do anything she can to wrest back that heart of stone"* (Sadani)
- *"they do not know what she wants"* (Junah)
- *"His ambition has smoldered into a profound disappointment, but he may yet find another way"* (Nawfal)
- *"trying to understand the causes of the tax anomalies… rather than manipulating numbers to produce
  a pleasing report"* (Ziad)

### 5. THE TURN — the last sentence recontextualises everything before it
This is the most consistent feature in the whole set. The card describes, then hinges:
- Mahir: *"But what is left unspoken is this: it is exactly those who mock her that have carved up
  her inheritance to the last scrap."*
- Sadani: *"As it happens, her madness is a delicacy the Sultan relishes."*
- Murtaz: *"That is the sole reason Murtaz must continue to attend court: to parade his feeble,
  impotent hatred for his master's amusement."*
- Fardak: *"a look the Sultan adores, for it marks him as a perfect plaything."*
- Junah: *"The other prostitutes think she is wasting her potential, but they do not know what she wants."*

Before the turn they are a type. After it they are a person with a problem.

### 6. The withheld thing is NAMED as withheld
Never vagueness for its own sake — the reader is told a secret exists and roughly its shape:
*"what is left unspoken is this"* · *"they do not know what she wants"* · *"Unbeknownst to her…"*
Contrast our failure mode, where the reader cannot tell whether something is hidden or simply missing.

### 7. Specifics are things you could point at
*"golden needles, silver threads"* · *"brought a dagger and moved into your front hall, managing three
whole days without a drink"* · *"spend enough on her to buy several farms, and their only reward is a
chance to kneel and kiss her toes"*. Never an adjective where an object would do.

### 8. Length is 2-4 sentences, ~45-70 words
Consistent across all 22. Mahir is the long end at four.

---

## WHAT THIS SAYS ABOUT OUR PROBLEM (`PLAYTEST_NOTES` N2)

Our saga cards fail because they are asked to do a job Sultan's Game never asks of a quest: introduce
strangers **and** set a task, in one card, in ~60 words. Sultan pays for its clean quest text with a
separate character card and a role-epithet field.

Three options follow, and they are a design choice, not a prompt fix:

- **A.** Give people a card of their own — closest to the reference, biggest build.
- **B.** Give every cast member a ROLE-EPITHET the engine deals and the card must use on first
  mention ("the reeve", "the wandering healer"), so placing costs a phrase instead of a sentence.
- **C.** Name nobody the player has not met — the one-off ruling extended to sagas. Cheapest, and it
  makes the first card readable, but it gives up the recurring-name texture Sultan gets for free.
