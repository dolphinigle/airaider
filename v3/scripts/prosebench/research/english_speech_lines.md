# Wiki exhaustion check + a bonus set of SPEECH LINES (2026-08-24, done by me, not an agent)

## The negative result — the wiki holds no more prose, stop looking
I swept **all 1,137 pages** of `sultansgame.wiki.gg` (`action=query&list=allpages`, then wikitext in
batches of 40) rather than only the pages a search flagged. Findings:
- **215 `{{quote}}` bodies across 98 pages.** This confirms the earlier agent's count (216 before
  dedup) and establishes it as the CEILING, not a sample. There is no untouched reservoir.
- 152 quoted strings sit OUTSIDE quote templates (109 unique) — game text the `{{quote}}`-only
  extraction missed. But they are short SPEECH lines, median 11 words, not outcome prose.
- 725 pages carry an infobox `Description=` field (already harvested: 738 blurbs).
- The wiki's entire article corpus is 144,731 words, most of it mechanics tables.

**Conclusion: `sultansgame.wiki.gg` is fully mined.** Any further official English must come from
outside the wiki, and the only complete source is the game's own `StreamingAssets/i18n/en/config.json`.

## The bonus: 99 official-English SPEECH lines
Not outcome prose, but directly useful for one guideline rule — `GUIDELINE.md` C5, the card's hook
returning as SPEECH at the pivot, and for the dialogue register generally. These are how this game
writes a line a character says aloud.

> [1001 Nights] "I really hope I can save enough money soon and leave this dog-eat-dog hellhole…"

> [1001 Nights] "Just give it a light shake – look, the cards have been restored."

> [1001 Nights] "Great, guess we can now continue the game!"

> [1001 Nights] "It’s already unwise to trust men, and you even believe in love?"

> [1001 Nights] "Your Majesty! I implore you to execute this man who dares to covet what you own! At least, at the very least, gouge out these creepy, lecherous eyes!"

> [1001 Nights] "Only by eliminating the source of it all.. can we cure this deep-rooted sickness."

> [1001 Nights] "Let everything return to the dark chaos, let us become one again..."

> [1001 Nights] "Listen to me, your wife didn’t cheat on you. She and that handsome boy talked all night about poetry, mathematics and philosophy… Maybe you should start reading?"

> [1001 Nights] "This is indeed a most secret supply channel..."

> [1001 Nights] "To ensure every beast dies for a worthy purpose is the chef’s duty."

> [1001 Nights] "Fear not, my love. Death and ecstasy are as close to each other as you and I."

> [1001 Nights] "What did I lose? No, it gave me double the freedom and joy."

> [1001 Nights] "I’ve said thank you too many times. Tonight, I want to say something else…"

> [1001 Nights] "Don't worry, I have everything under control."

> [1001 Nights] "I want to try planting some seeds, but what will I harvest? I don't know either."

> [1001 Nights] "Crescent... you little mongrel, little mutt, little wretch, your name is Crescent."

> [1001 Nights] "Mirror mirror, tell me, who is the happiest, most envied woman in this country?"

> [1001 Nights] "You are the most remarkable city dweller in the world!"

> [1001 Nights] "He was lucky—when he ranted about the Sutlan on the court, the Sultan did not have a matching Bloodshed Card on hand."

> [1001 Nights] "How come? I... planned for everything..."

> [1001 Nights] "Hey, don't invite that person over; he'll only ruin this fun game."

> [1001 Nights] "Without you, I cannot imagine how I would have reached this land."

> [1001 Nights] "When the Sultan falls, this tale must be penned into chronicles..."

> [1001 Nights] "Ha! Is there anything more ridiculous than this?!"

> [1001 Nights] "That lucky bookworm! She used to beg in the corner next to us!"

> [1001 Nights] "She’s buried in parchment all day. Good lord, what kind of woman would allow herself to stink of ink!"

> [1001 Nights] "I adore gold – golden slippers, golden earrings, golden belts, and above all, a golden throne!"

> [1001 Nights] "What a twist. I was expecting bloodshed today, a pity."

> [1001 Nights] "The people will make their own choices, just as rivers have their own directions."

> [1001 Nights] "That perilous path bears the tracks of lions and gazelles.. and also the tiny footprints of rats..."

> [1001 Nights] "Those who only dine with you once might be more reliable than so-called friends."

> [Adila] "A real dragon — a massive, winged lizard"

> [Adila] "Yet even with the strength of an entire nation, they never found even a single dragon scale."

> [Adila] "Without you, I don't know how to talk to women!"

> [Alim] ">''That night, Alim bangs on your door."

> [Alim] "he says, his face tight with worry instead of a smile."

> [Alim] "This belonged to Hemir, handcrafted. That old rascal must have dragged my boy here, forced him to beg, beat him—when Hemir refused, the beatings worsened or maybe killed him, leaving this whistle for others to find."

> [Alim] "This young pup came back to me, still set on being a thief... but that's wrong. So, my Lord, help me set him straight until he goes back to the mill."

> [Alim] "Hundreds, maybe thousands, of kids in the Dark Alley would kill for your chance right now. It's tough for a thief to turn miller, but a miller... can turn thief whenever he likes."

> [Arumina] "I am Arumina, I heard my father discussed my marriage with you, allow me to beg you... my marriage is my own choice, don't listen to my father's nonsense."

> [Ava's Diary] "If I die one day, can you burn all my diaries and manuscripts? Please - and don't read them, not a single word."

> [Bharat] "]] in Foreign Merchant it will create the ritual [["

> [Change of Dynasty] "No more pondering. The arrow is nocked - there is no turning back now."

> [Change of Dynasty] "></div> successes ≥ 5: </br>Partial success <br />(commander is ''knocked out'')<br /> <div style="

> [Cleanse the Heretics] "The one we're summoning is very greedy, sure to like these fragrant sacrifices."

> [Cooperative Dragonslaying Route] "What do you want? What are you looking for by deciphering that book?"

> [Cooperative Dragonslaying Route] "With life and soul, burn this wicked game to ashes"

> [Do Not Stare at the Stars] "Do Not Stare at the Stars Do Not Stare at the Stars Do Not Stare at the Stars Do Not Stare at the Stars Do Not St-"

> [Fardak] "The shadow of the same storm looms over you, drawing you inexplicably closer to each other, seeking solace..."

> [Faris] "Except for this... Except for this, Arzu, I will do anything for you."

> [Fatuna] "I think, Maggie, your wife, and I are the best of friends. Have you heard of sororal polygyny? Em, I mean, what I mean is...."

> [Hassan] "I thought of a brilliant sentence, you must hear it!"

> [Habib] "What about the cook from your territory?"

> [Habib] "His name was Habib, remember? When we first toured your lands upon marriage, we enjoyed his meal... You had summoned him, commended the food; that's why I remember his name."

> [Habib] "What's this in the soup! A mouse? This unscrupulous cook...! So horrible, so horrible!"

> [Habib] "the 'gentle and lovely' Lady Habib spoke of to meet me."

> [Guide: Breaking All Sultan Cards] "events that do not expire or you can call upon at any time for later use - something I dubbed the"

> [Inal] "You knock on the presumptuous noble's door with the Sultan Card, demanding to know if he really wants to harass YOUR follower - even a slave girl."

> [Inal] "You both shared a smile. The world is cruel, a blade hangs over your heads, but still, with what little power, goodwill, and money you had, you provided a small refuge for some people... isn't that a miracle?"

> [Jabal] "comes from the Arabic word جبل meaning"
