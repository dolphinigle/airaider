# Verbatim quest / contract / event text — mercenary-company games

Raw research dump for the prose-craft study. No analysis. Every block below is copied
verbatim from the game data file named in `Source:`. Engine template slots are preserved
exactly as they appear in the source (`%employer%`, `<<rep $g.scout>>`, `<hothead>`, `\n`,
`{A | B | C}` variant braces, `%SPEECH_ON%`/`%SPEECH_OFF%` speech markers, BBCode colour tags).

Word counts are whitespace-token counts of the raw source text, markup included
(`%SPEECH_ON%`/`%SPEECH_OFF%` markers excluded). For Battle Brothers, where one `Text`
field holds many alternates separated by top-level `|`, a single alternate was taken and
that is what is counted; the alternate index is stated.

---

## 1. Battle Brothers

Source repo: `kovasap/battle-bros-decompiled` (decompiled vanilla Squirrel `.nut` scripts).
Contract screens live in `scripts/contracts/contracts/*.nut`; ambient events in
`scripts/events/events/*.nut`. Each screen has an `ID` (`Task` = the offer/negotiation
screen, `Success*` / `Failure*` = outcome screens) and a `Text` field. `Text` usually
contains many alternates wrapped in `{...}` and separated by ` | `; the engine picks one.

---

### BB-01 Contract hook (shared intro template, alternate 1 of 10)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/templates/intro_templates.nut  (screen `Intro`, occurrence 1)

**Offer/Setup:** (64 words)

> A man surprises you by sliding into your shoulder. You just about draw your sword when he quickly explains that a man by the name of %employer% has sought your acquaintance. Sheathing your weapon, you tell the stranger to take you to him - if he's got business, he should tell you himself. The messenger nods and leads the way to a nobleman's house.

### BB-02 Contract hook — reputation-gated variants of the same beat

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/templates/intro_templates.nut  (screen `Intro`, 2nd text block = liked-in-town, 3rd = disliked-in-town)

**Offer/Setup — liked in town, alternate 1 of 9:** (27 words)

> A few peasants walk up to you and one even offers a hug. You decline.%SPEECH_ON%It's good to see you again, sellsword. %employer%'s been looking for you.%SPEECH_OFF%

**Offer/Setup — liked in town, alternate 4 of 9:** (45 words)

> A couple of bleating goats are being lead down the road. They shuffle through the mud, prodding their noses through the muck and somehow finding things to chew up. Their shepherd plants his cane in the ground.%SPEECH_ON%Hey there mercenary. %employer%'s been looking for ya.%SPEECH_OFF%

**Offer/Setup — disliked in town, alternate 1 of 11:** (75 words)

> You cautiously enter the home of one of %employer%'s liaisons. He's sitting next to a fire, a scroll in one hand and a goblet in the other.%SPEECH_ON%Don't bother sitting, sellsword. Wouldn't want to bring a chill to my comforts now would we? If you're looking for %employer%, then I'll send word. He's not happy with you, but business is business, or so we like to say.%SPEECH_OFF%He smiles and tips his goblet toward you.

**Offer/Setup — disliked in town, alternate 10 of 11:** (51 words)

> You pass a rope swinging from a tree. A man calls out from your side.%SPEECH_ON%Look out, dead man a-walkin'!%SPEECH_OFF%When you turn to him he laughs aloud.%SPEECH_ON%Don't worry, I think they just put that up for practice. Ain't no reason to use it, yet. Go ahead and see %employer%.%SPEECH_OFF%

**Button (liked / disliked):** (8 words)

> Let's get to business.  /  Let's talk, then.

### BB-03 Negotiation breaks down

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/templates/negotiation_templates.nut  (screen `Negotiation.Fail`, alternates 1, 5 and 6)

**Outcome (failure) — alt 1:** (27 words)

> %SPEECH_START%You act as if you were the only ones to hold a sword for coin. I think I'll look elsewhere for the men I need. Good day.%SPEECH_OFF%

**Outcome (failure) — alt 5:** (21 words)

> He's face turns red with anger.%SPEECH_ON%Get out of here, I'm not in the habit of making deals with greedy devils!%SPEECH_OFF%

**Outcome (failure) — alt 6:** (25 words)

> He sighs. %SPEECH_ON%Just... forget it. I shouldn't have trusted you in the first place. Leave me so I can look for other, more sensible men.%SPEECH_OFF%

### BB-04 Escort Caravan

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/contracts/escort_caravan_contract.nut

**Offer/Setup — `Task` alt 1:** (94 words)

> %employer%'s study is lit by a warm fire. He offers you a seat and a goblet of wine, both of which you take.%SPEECH_ON%Sellsword, you're familiar with how dangerous the roads are these days?%SPEECH_OFF%By the gods, that is some good wine. You nod and try to hide your astonishment. %employer% smiles tersely and continues.%SPEECH_ON%Good, then you'll understand this task I have for you. I need a caravan escorted along the roads to %objective% about %days% from here. Pretty simple, right? Do you have the time for it? Let's talk if you do.%SPEECH_OFF%

**Offer/Setup — `Task` alt 2:** (54 words)

> You find %employer% studying a few maps on his desk. He trails a finger to the edge of one map and continues it onto another.%SPEECH_ON%I need an escort for a caravan to %objective%, %days% %direction% of here. Will it be dangerous? Of course. That's why I go to you, sellsword. Are you interested?%SPEECH_OFF%

**Outcome (success) — `Success1` alt 1:** (63 words)

> Reaching %objective%, the caravan leader turns to you, a large satchel in hand.%SPEECH_ON%Thanks for getting us here, sellsword.%SPEECH_OFF%You take it and hand it over to %randombrother% for counting. He nods when he's finished. The caravan leader smiles.%SPEECH_ON%Also thanks for not betraying us and, you know, slaughtering us to a man and all that.%SPEECH_OFF%Mercenaries get thanked in the strangest ways.

**Outcome (failure) — `Failure1` alt 1:** (49 words)

> You started the journey in the company of caravan hands and a few merchants all of whom trusted you. Now, their bodies are strewn across the land, arms outstretched, fingers danced upon by flies. The sun will make a ruinous smell out of your failure. Time to move on.

**Outcome (failure) — `Failure1` alt 3:** (75 words)

> The merchant who hired you lies dead at your feet. He is not exactly face down, for that part of him no longer exists. Blood flows across the ground in spurts as you can't help but stare at the summation of your failure. One of your men spots a twitch, but you know better. Nothing can be done. The rest of the caravan is in even worse shape. There is no point in staying here.

### BB-05 Raid Caravan (destroy a wagon train, leave no witnesses)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/contracts/raid_caravan_contract.nut

**Offer/Setup — `Task` alt 1:** (61 words)

> You take a seat as %employer% folds out a map before you. He drags a finger along one of the poorly drawn roads.%SPEECH_ON%A caravan travels this route. I need it attacked, but wait!%SPEECH_OFF%He holds up the finger.%SPEECH_ON%I need it to look like the work of brigands. No one must know that its destruction came by my order, understand?%SPEECH_OFF%

**Offer/Setup — `Task` alt 2:** (82 words)

> %employer% explains that he needs a caravan destroyed. You inquire as to why, exactly, a nobleman such as himself would have such a task to complete, but the man is scarce on details. His primary demand is simple enough, destroy the caravan and kill everyone there. It must look like the work of {brigands | vandals | vagabonds | greenskins}, otherwise the nobleman might be incriminated.%SPEECH_ON%Did you get that last part, sellsword? Of course you did. You're a smart guy, right?%SPEECH_OFF%

**Outcome (success) — `Success1` alt 1:** (64 words)

> You return to %employer% with news of your success. He's got a warm greeting - a satchel heavy with crowns.%SPEECH_ON%Good job sellsword. Did you, uh, see anything else while down there?%SPEECH_OFF%It's an odd question, but you don't pursue it. You tell the man it went down just as the results show. He nods and quickly thanks you before returning to his work.

**Outcome (failure, half pay) — `Failure1` alt 1:** (86 words)

> You return to find %employer% sitting at his desk, tented hands before him, his thumbs practically plugged into his forehead. His hands fall forward when he begins to talk.%SPEECH_ON%You let... them live...%SPEECH_OFF%You raise a finger and make your case: not all of them lived.%SPEECH_ON%By the old gods' endless might, what on earth did I hire you for?%SPEECH_OFF%He pauses, then shrugs.%SPEECH_ON%Alright, I'll give you half of what we agreed to. You did destroy the wagon train, after all, I'll give you that.%SPEECH_OFF%

**Outcome (failure, no pay) — `Failure2` alt 2:** (113 words)

> The soles of %employer%'s feet welcome your return, his legs up on his desk. You notice that there's blood on his boots.%SPEECH_ON%So, mercenary, explain to me what it was that I hired you for?%SPEECH_OFF%He throws a hand out as if to say, 'go ahead.' You state that you were hired to destroy a caravan and leave no survivors. The man shoots a finger up.%SPEECH_ON%Repeat that last part.%SPEECH_OFF%You do. The man grins, satisfied with himself.%SPEECH_ON%Alright, you didn't do what I asked. So, what are you doing here? Shall I fetch one of my guards or will you excuse yourself willingly? Because you and I no longer have business together.%SPEECH_OFF%

**Outcome (failure, target escaped) — `Failure3` alt 1:** (43 words)

> Awaiting the caravan, a pair of travelers come up from where the convoy should be going. They remark in detail about a cart which is no doubt the one which you were supposed to be hunting down. No point in returning to %employer%.

**Outcome (failure, target escaped) — `Failure3` alt 2:** (30 words)

> Word on the road hints that the caravan you were supposed to be hunting down has given you the slip and reached its destination. The company shouldn't bother reaching %employer%.

### BB-06 Investigate Cemetery

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/contracts/investigate_cemetery_contract.nut

**Offer/Setup — `Task` alt 1:** (84 words)

> %employer% restlessly walks up and down while stopping now and then to address you.%SPEECH_ON%The folks are in turmoil! Graves in the cemetery have been found opened and raided. Some simpleton claims it to be the dead rising from the graves - superstitious nonsense. It's quite obviously some graverobbers audacious enough to come to %townname% and plague us with their greedy presence!%SPEECH_OFF%He bangs his fist on the table in anger.%SPEECH_ON%Go out to the cemetery and end this nuisance once and for all!%SPEECH_OFF%

**Offer/Setup — `Task` alt 4:** (76 words)

> %employer%'s standing by his window, peering out while nursing a mug of mead. He doesn't really seem to be focused on anything in particular and even talks as if he couldn't care less about the conversation.%SPEECH_ON%Graverobbers are plundering the cemetery. Again. I'm not really asking much of you, sellsword, other than to go there and put an end to this foolish business. Go to that cemetery and kill every graverobber you see. Got it? Good.%SPEECH_OFF%

**Outcome (failure, job not done) — `Failure1` alt 3:** (56 words)

> You find %employer% in his chair, rolling an empty goblet between his hands.%SPEECH_ON%It's not often I run across someone who tries to cheat me. That's what you were going to do, coming back here, right? I know the graverobbers aren't dead, sellsword. I'm no fool. Leave my sight before I have my men butcher you.%SPEECH_OFF%

**Outcome (failure, job not done) — `Failure1` alt 4:** (43 words)

> %employer% is reading a book when you enter his room.%SPEECH_ON%You have ten seconds to turn around and leave. Ten. Nine. Eight...%SPEECH_OFF%You realize he knows that the graverobbers were not taken care of.%SPEECH_ON%...four... three...%SPEECH_OFF%You turn and hastily leave the room.

**Outcome (failure, no proof, half pay) — `Failure2` alt 1:** (69 words)

> %employer% purses his lips.%SPEECH_ON%You've put me in an odd spot, mercenary. You tell me the graverobbers are taken care of, yet... I have no proof. Usually, dead men leave a lot of proof. Especially ones hastily slain before their time.%SPEECH_OFF%He shrugs.%SPEECH_ON%I'll pay you half. And you'll take that and then leave. Next time, bring proof. If you're lying... well, I'll figure that out on my own.%SPEECH_OFF%

### BB-07 Escort Envoy

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/contracts/escort_envoy_contract.nut

**Offer/Setup — `Task` alt 1:** (97 words)

> %employer%'s got a man standing beside him. You can hardly see his face and when you shift your head to get a better look, he does the same to make sure you don't.%SPEECH_ON%Please, mercenary. This is %envoy%. You don't need to see him. I just need for you to get him to %objective%. He's going there to convince them that our cause is one worth joining. Of course, %enemynoblehouse% won't be happy about that, so discretion is of some import.%SPEECH_OFF%You nod, understanding the intricacies of politics between the houses.%SPEECH_ON%Good, mercenary. Now, are you interested?%SPEECH_OFF%

**Outcome (success) — `Success1` alt 3:** (52 words)

> Having kept %envoy% safe, the envoy thanks you for your services. %employer% is not so amicable, instead ignoring you to talk to secretive emissary. While you stand around for pay, a guard sneaks up and slams a wooden chest into your arms.%SPEECH_ON%It's %reward_completion% crowns. You can count it if you want.%SPEECH_OFF%

**Outcome (failure) — `Failure1` alt 1:** (27 words)

> The envoy didn't make it. %employer% can accept losses here and there, but he's not going to be happy about this. Try not to fail him again.

**Outcome (failure) — `Failure1` alt 4:** (30 words)

> You promised to keep the envoy safe from harm. It's hard to get anymore harmed than being outright dead, so it appears you failed quite spectacularly at this here task.

**Outcome (failure) — `Failure1` alt 5:** (35 words)

> Guard the envoy. Just keep the envoy alive. The envoy must survive. Hey, I'm an envoy, I'm too important to die!\n\n These words must have fallen on deaf ears because the envoy is indeed dead.

### BB-08 Patrol (kill-count contract)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/contracts/patrol_contract.nut

**Outcome (success) — `Success3` alt 1:** (50 words)

> Your return to %employer% is met with curiosity. He's counting crowns but, before giving you any, asks you how many 'heads' you collected in your journey. After reporting %killcount% kills, he purses his lips and nods.%SPEECH_ON%Good enough.%SPEECH_OFF%The man spills some crowns into a satchel and hands it over.

**Outcome (success) — `Success3` alt 5:** (103 words)

> There's a party going on at %employer%'s abode. You weave through the crowd drunken opulence to get to the man. He shouts over the music and noise, asking how many you cut down on your patrol. It's odd, but shouting that you killed %killcount% seems to have no effect on the partygoers. Shrugging, %employer% turns and leaves, slipping into the crowd of attendees. You try to chase, but a man cuts you off, slamming a satchel into your chest.%SPEECH_ON%Your payment, mercenary. Now, please, see to the door. People are beginning to notice you and they did not come here to feel uncomfortable.%SPEECH_OFF%

**Outcome (failure, ran out of days) — `Failure1` alt 1:** (17 words)

> You took far too long to complete the patrol you've been tasked with. Consider the contract failed.

**Outcome (failure, ran out of days) — `Failure1` alt 3:** (40 words)

> What were you trying to do, collect as many heads as possible? It's doubtful that your employer, %employer%, would buy such a ruse. There's a reason he only gave you a few days to complete this task. Consider it failed.

### BB-09 Hunting Unholds (giant hunt) — mid-contract branch with its own success/failure

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/contracts/contracts/hunting_unholds_contract.nut

**Offer/Setup — `Task` alt 1:** (161 words)

> When you enter %employer%'s room you find the man stooped beside his window, looking out it with nearly conspiratorial flinching. His eyes slim and open wide and slim again. He snaps a curtain over the window and jerks his head to look at you.%SPEECH_ON%You didn't happen to see a very angry woman heading my way, did you? Ah, nevermind it. Look at this.%SPEECH_OFF%He tosses you a scroll which you unfurl. There's a crude drawing of what looks like a man hunched over an ant or some insect. You can't really tell. %employer% claps his hands.%SPEECH_ON%Local farmers are reporting missing livestock. All they found were footprints large enough for a man to lay a coffin in. Sounds like hearsay and rumormongering to me, could be rivals trying to hide their misdoings, but I'll leave you to it. Search the surrounding lands and see what you find. If you come upon an actual giant I think you know what do.%SPEECH_OFF%

**Mid-contract decision — `DriveThemOff`:** (51 words)

> As you put the men into formation, %shouter% goes running by you and right toward the unholds. He's hooting and hollering, his arms flailing like a sea cretin drawn up by the hook. The unholds pause and stare amongst one another. You're not sure whether this should be allowed to continue...

**Outcome (success) — `DriveThemOffSuccess`:** (105 words)

> Against better judgment, you let %shouter% go. He doesn't stop for nothing, like he was chasing down a throng of beautiful women undressing just for him. Shockingly, the unholds take a step back. They start to retreat one by one until only a lone giant remains.\n\n%shouter% runs up to its feet like a yapping dog and lets forth some atavistic scream so hoarsely made that you wonder if every ancestor of the earth buried or otherwise had heard it. The unhold slings an arm before its face as though to shield it, then starts stepping back, further and further until it's gone! They're all gone!

**Outcome (failure) — `DriveThemOffFailure`:** (160 words)

> Against better judgment, you let %shouter% go. He doesn't stop for nothing, like he was chasing down a throng of beautiful women undressing just for him. Shockingly, the unholds take a step back. They start to retreat one by one until only a lone giant remains.\n\n%shouter% runs up to its feet like a yapping dog and lets forth some atavistic scream so hoarsely made that you wonder if every ancestor of the earth buried or otherwise had heard it. The unhold slings an arm before its face and then throws it down and swats %shouter% away. The man goes cartwheeling through the air and his screams go with him like a rabbit stolen up by a hawk. His shouts somersault back to earth in an echo of dizzying whoops and he lands with a hardy thud. The giant jiggles with an earthen chuckle. It's amusement catches the attention of the departed unholds who all turn around and start to return.

**Outcome (success, contract end) — `Success` alt 2:** (102 words)

> You return to %employer% and find the man reading stories to children. He rends his hand through the air and growls like a beast. Knocking on the door, you intrude upon the theater.%SPEECH_ON%Aye, and then the ever honorable sellswords slew the monster!%SPEECH_OFF%The children cheer at your timely arrival. The mayor stands and gives you the promised reward, declaring he had a scout following your every move and he's already heard the reports of your success. He asks if you'll stick around and tell the tale for the kiddos. You tell him you don't work for free and leave the room.

---

### Battle Brothers — ambient camp / road events

These fire between contracts and slot in the names of specific hired brothers
(`%randombrother%`, `%hunter%`, `%cripple%`, `%veteran%`, `%clown%`, `%archer%`,
`%shortsighted%`, `%shouter%`, `%juggler%`, `%otherguy%`). `Title` is the header shown
above the text; `Options` are the player-facing buttons, quoted here where useful.

### BB-10 Along the road... (broken wagon)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/events/events/broken_wagon_event.nut

**Event text (`Title` = "Along the road..."):** (29 words)

> %terrainImage%You find an abandoned wagon amongst some tall reeds. %randombrother% checks it out and barks back.%SPEECH_ON%It's broke as shit, but I think we can salvage parts of it.%SPEECH_OFF%

**Button:** (2 words)

> Not bad.

**Engine result line (source expression):** (16 words)

> text = "You gain [color=" + this.Const.UI.Color.PositiveEventValue + "]+" + amount + "[/color] Tools and Supplies."

### BB-11 Cripple pep talk (two named brothers in dialogue)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/events/events/cripple_pep_talk_event.nut

**Event text:** (143 words)

> %cripple% the cripple asks how %veteran% does it. The veteran raises an eyebrow.%SPEECH_ON%Do what?%SPEECH_OFF%The cripple bounces his head around as he figuratively beats around the bush.%SPEECH_ON%You know, it. Fight. Every time I get out there, I just think I'm not up to it, as though I were dragging you fellas down.%SPEECH_OFF%%veteran% laughs.%SPEECH_ON%Aye, I get what you mean. A cripple ain't fit for sellswording. But is that who you are? Just a cripple? Or are ye a man? You can choose to let your wobbles and ungainliness define who you are, or you can make your own path, as crooked and hobbled it may be.%SPEECH_OFF%Nodding, %cripple%'s face starts to glow.%SPEECH_ON%You're right. I'm not all that I could be and I got the body of a dying nun, but no man will put in more effort than I!%SPEECH_OFF%

**Button:** (2 words)

> Well said.

### BB-12 Archery stunt (player choice, then success or maiming)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/events/events/archery_stunt_event.nut

**Setup — screen `A`:** (108 words)

> Something of a commotion draws you from your tent. Men are sitting on a few stumps or on the ground, eagerly watching something in the distance. With squinting eyes, you spot %clown% and %archer% doing something odd. An apple rests on one man's head, while the other is walking away - a bow in hand.\n\nYou ask %otherguy% what is going on and he explains that the two men are going to try some sort of stunt or trick that involves shooting a piece of fruit off a man's head. Shocked, you exclaim that's not safe at all, to which the brother grins and explains that is the point.

**Buttons — screen `A`:** (9 words)

> Stop at once!  /  Well... this should be interesting.

**Mid-beat — screen `B1`:** (81 words)

> You mull the situation over. The brothers look to you, expecting a stoppage, but instead you take a seat amongst them. This spurs a brief cheer from the crowd which quickly quiets to hushed whispers as %clown% and %archer% get ready.%SPEECH_ON%Make sure to hit the apple!%SPEECH_OFF%One brother shouts. Laughter ripples through the group.%SPEECH_ON%From that distance %clown_short%'s nose kinda looks like an apple to me.%SPEECH_OFF%More laughter, but it is ever nervous as the stunt is about to unfold.

**Outcome (failure — arrow to the head) — screen `B2`:** (104 words)

> %archer% angles his shoulders to %clown% and draws his bow, the silhouette of the man but a crescent of wood, string, and arm. You can't see %clown%'s face, but you assume his eyes are closed. The shot is released. It zips. It disappears. %clown% rocks backward, clutching his face. This isn't looking good. The man screams. The crowd oohs. %archer% slowly lowers his bow and looks at it as though it is at fault.\n\n Eventually, %clown% is carried past you, a shaft of an arrow sticking out of his head. Another brother lingers behind, quietly eating an apple in the wake of the chaos.

**Outcome (success) — screen `C`:** (151 words)

> The men cheer as you give an affirming nod. You take a seat amongst them as %archer% and %clown% get ready, the former nocking an arrow while the latter balances an apple atop his head. When the fruit is good and steady, the archer draws back his bow, forming but a silhouette of man, wood, and string, a crescent of determination as he aims downfield. The men are exchanging bets on whether or not he misses. You want to look away, but the spectacle truly is too much.\n\n A great gasp follows the arrow's release, as though some ominous event long foretold had finally happened. Men reel back in their seats, wincing and gritting their teeth. The apple is shot off %clown%'s head, fruit and arrow spinning away. After a brief silence, the men erupt in cheers. %clown% takes a bow, while %archer% slackens his draw and looks a bit relieved.

**Outcome (player forbade it) — screen `D`:** (61 words)

> You shake your head 'no' as you walk out into the field and step between the two men.%SPEECH_ON%If y'all wanted to play tricks, you should've joined a circus. Now get back to work before someone gets seriously hurt.%SPEECH_OFF%A wave of disappointment washes over the men. A few even boo and give you a thumbs down or other, rowdier, gestures.

### BB-13 Juggler tempts fate (three distinct failure texts for one event)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/events/events/juggler_tempts_fate_event.nut

**Setup — screen `A`:** (27 words)

> %juggler% the light-footed, swift-handed juggler is going around asking the brothers to throw him some knives. It appears that he is looking to show off his act.

**Buttons — screen `A`:** (14 words)

> Let's see what you can do!  /  That's not what I'm paying you for.

**Outcome (failure 1) — screen `Fail1`:** (77 words)

> %nonjuggler% throws a knife across the campground. The blade turns in the sun and you see a strobe of reflected light beam across the juggler's eyes. He blinks just long enough for the weapon to sheathe itself in his shoulder. He blinks again, just long enough for the pain to start kicking in. Within a moment, %juggler% is bowled over, clutching his wound in howling pain. A few men tend to him while others can only laugh.

**Outcome (failure 2) — screen `Fail2`:** (92 words)

> The axe %juggler% asked for is picked up and heaved toward him. It spins at an awkward angle as if the man who threw it intentionally sent it wobbling in indeterminate ways. Not expecting this, the juggler adjusts to try and catch the haywire axe handle, but the weapon smashes into one of the daggers and cuts across his shoulder. He falls to the ground in an instant, a shower of knives falling all around him. While some men tend to his wounds, other can't help but be delighted in his suffering.

**Outcome (failure 3) — screen `Fail3`:** (124 words)

> %nonjuggler% picks up the requested flail and, after a moment's hesitation, lofts it toward %juggler%. Mid-flight, the chain of the weapon wraps around the handle. The juggler seems to adjust himself for it, but at the last moment the chain unfurls, whipping back around with deadly intent. You see the man's eyes flare open as he sees a calamity he can't stop from coming. The flail crashes through his maelstrom of metal and clips him in the face. Knocked out cold, he spins on his feet and collapses to the ground. A falling dagger penetrates his leg and the axe cuts tumbles right into his hip. The men gasp in horror and soon every one of them gets up and rushes to his aid.

### BB-14 Shortsighted brother clocks another brother

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/events/events/shortsighted_shoots_bro_event.nut

**Outcome (failure/injury):** (138 words)

> You take a good, long look at the men, a gaze that flickers from one to the other and then back again, all the while shaking your head. %shortsightedtarget% is holding his head, a rather large lump cresting at the hairline. He looks at %shortsighted% then to you. Both men shrug. You ask %shortsighted% what happened. He explains.%SPEECH_ON%Thought I saw somethin' that wasn't there.%SPEECH_OFF%Incredulously, %shortsightedtarget% throws his hand out.%SPEECH_ON%I said, 'Hey, it's me' and you clocked me anyway.%SPEECH_OFF%Throwing out his own hands, %shortsighted% defends himself.%SPEECH_ON%'Hey it's me' aren't words beholden to ya! Any man can say them words! I reckon any man of ill-will would say them very words before he followed them with a sword, I bet he would!%SPEECH_OFF%It appears that %shortsighted%'s poor eyesight has led to something of an accident.

**Button:** (6 words)

> Get that wound looked at, %shortsightedtargetshort%.

### BB-15 Man in the forest (choice branches to ambush / beast / loot)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/events/events/man_in_forest_event.nut

**Setup — screen `A`:** (81 words)

> While traipsing between the trees, a man suddenly emerges from one of the bushes. Twigs and brush are all twisted up in his sweat swept hair. He rears up at the sight of you.%SPEECH_ON%Please, no more.%SPEECH_OFF%You raise your hand to calm him then ask what is going on. The stranger takes a step back.%SPEECH_ON%Please, no more!%SPEECH_OFF%He turns and runs off, thrashing his way back from whence he came. %randombrother% hurries to your side.%SPEECH_ON%Should we follow him?%SPEECH_OFF%

**Buttons — screen `A`:** (11 words)

> Follow him, quick!  /  He's not our concern. Let him go.

**Outcome (ambush) — screen `B`:** (77 words)

> You follow the man into the thicket. His muddy footsteps aren't hard to track, his ungraceful retreat leaving much evidence. But suddenly, they disappear. The man exited into a clearing and then his tracks are gone. You hear a whistle above you. Looking up, you see the man sitting on a branch. He waves.%SPEECH_ON%Howdy, strangers.%SPEECH_OFF%He glances across the clearing. Men are approaching and they are well armed. The man in the tree snorts.%SPEECH_ON%Goodbye, strangers.%SPEECH_OFF%

**Outcome (beast) — screen `C`:** (72 words)

> The man's tracks lead away in the hurry that so frightfully forced him out of your sight. A scared man such as he is not hard to find, unfortunately he's not scared anymore, because all you find of him is thoroughly eviscerated corpse.\n\nA slight growl vibrates the nearby bushes. You look over to see slick, black fur slowly stepping out from behind a tree. You yell to the men to arm themselves.

**Outcome (loot) — screen `D`:** (51 words)

> The frightened man was not hard to find. You spot him curled up at the base of a tree. He's clutching something to his chest as though he were seeking warmth from it on a cold night. The man himself, however, is dead. You pry the item from his glomming grasp.

### BB-16 Hunt food (the company hunter delivers)

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/events/events/hunt_food_event.nut

**Event text — alt 1:** (130 words)

> As you help %otherguy% get his boot out of the mud, %hunter% comes out of the bushes with what must be nearly a dozen rabbits strung together. He sets them down and starts to untie them. The little bunnies - eyes wide, horrified in the end - all look quite tasty. The hunter grabs one by its neck and twists its body in a circle before pushing all its guts out in one swift motion. He repeats this process until every rabbit has been slaughtered. As he wipes his hand on %otherguy%'s cloak, the hunter points to the mound of emptied bunnies at his feet.%SPEECH_ON%That there is the eating pile.%SPEECH_OFF%He then points to the lump of rabbit guts.%SPEECH_ON%That there is not the eating pile. Got it? Good.%SPEECH_OFF%

**Event text — alt 3:** (148 words)

> Forest birds chitter and chatter above the company's march. The sun winks between the canopy branches, a soft glint that peppers the ground with dots of light. You spot a squirrel resting in one of the sun beams, enjoying the warmth as it gnaws on an acorn. It stops, sensing you watching it, and then it suddenly jerks and a fleck of its blood meets your cheek. You wipe it away, turning back to see that the squirrel has been impaled by an arrow, every shrieking death throe quieter than the last as the volume of its life slowly turns down. %hunter% suddenly breaks through the bushes with a bow in hand and a grin on his face. The hunter retrieves his kill and throws it in with a litter of others, a long hunter's line around which are tied all manner of critters foe and friend alike.

### BB-17 Wardogs dig up loot

`Source:` https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/HEAD/scripts/events/events/dogs_dig_up_loot_event.nut

**Event text:** (63 words)

> While along the roads, your wardogs suddenly scamper off and begin digging into the earth. You're not sure why as you don't recall giving either one a bone. A few moments later and they're fighting over what appears to be %finding%. You interrupt the tug of war, taking the goods for yourself. The hounds whine, but a few good pets settles them down.

**Button:** (2 words)

> Good boy.

---

## 2. Fort of Chains

Source repo: `Official-Husko/fork-of-chains` (maintained fork of darkofocdw's Fort of
Chains; quest text is unchanged from the original). Quests are Twee/SugarCube passages in
`project/twee/quest/**`. Structure per quest: one setup passage (shown on the quest board,
read before you assign anyone) and four graded outcome passages — `Crit`, `Success`,
`Failure`, `Disaster`. Several quests fold `Crit`/`Success` into one passage that branches
on `$gOutcome`. Roles (`$g.scout`, `$g.merc1`, ...) are filled by the units the player sent.

NOTE: this is an adult game. The quests below are the least explicit ones; two blocks still
contain sexual content and are marked.

---

### FoC-01 Bounty Hunt: Slime — full four-outcome set

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/darko/city/BountyHuntSlime.twee

**Offer/Setup:** (107 words)

> <p>
> The <<lore region_city>> has a massive underground sewers system.
> While most of the sewers are kept functional, some deeper parts of the sewers
> were apparently built in ancient times, and it is said to be inhabited by
> otherworldly monsters.
> One of the most infamous among these monsters are the slimes,
> who is said to feed upon the bodily fluids of other creatures.
> </p>
>
> <p>
> One of the alchemists in the city is posting an open request for a vial of the slime's
> liquid body for <<their $g.alchemist>> research.
> <<They $g.alchemist>> is offering a great amount of reward for adventurers brave enough to best
> these creatures.
> </p>

**Outcome (crit):** (141 words)

> <<if $g.slave.isMale()>>
>   <<questimage 'bounty_hunt_slime_male.jpg'>>
> <<else>>
>   <<questimage 'bounty_hunt_slime_female.jpg'>>
> <</if>>
>
> <p>
> During their adventure below the city,
> your slavers happened upon a slime "mating" with an unlucky victim,
> a resident of the undercity of Lucgate.
> With the slime distracted, it was easy for your slavers to defeat the creature.
> As your slavers put the slime's body into the vial,
> <<set _alc = setup.selectUnit([$g.merc1, $g.merc2, $g.negotiator], {trait: 'skill_alchemy'})>>
> <<if _alc>>
> <<yourrep _alc>> perceptively noted that a rare alchemical component was absorbed into the vial --
> <<else>>
> they were lucky that a rare component flew into the vial -- 
> <</if>>
> a mixture of its latest victim cum mixed together with the slime's natural aphrodisiac.
> <<Yourrep $g.negotiator>> managed to use this rare material to
> <<uadv $g.negotiator>> negotiate a better pay with
> the alchemist, who happily paid nearly double the rewards that was originally agreed on.
> </p>

**Outcome (success):** (72 words)

> <p>
> Your slavers turned out to be more than an even match for such a slime monstrosity,
> and managed to dispatch it cleanly without any problem.
> Your slavers then put samples from the slime's remains into the vial.
> The vial smelled weird, and <<yourrep $g.negotiator>> could not help but somehow
> became aroused by it.
> It made <<them $g.negotiator>> wonder just what kind of potion the
> alchemist needed such an ingredient for.
> </p>

**Outcome (failure):** (49 words)

> <p>
> Unfortunately, despite having the upper hand, your slavers sloppily allowed
> the slime to escape in the middle of the fight by sliding into the gutter.
> Your slavers did not manage to find any other slime during their venture
> and had to return back to the fort empty-handed.
> </p>

**Outcome (disaster) — sexual content:** (101 words)

> <p>
> Your slavers lost to the slime, and ended up submitting to the creature's whims.
> <<if $g.negotiator.isHasDick() and $g.merc1.isHasDick() and $g.merc2.isHasDick()>>
> The trio's balls were completely drained
> <<elseif $g.negotiator.isHasVagina() and $g.merc1.isHasVagina() and $g.merc2.isHasVagina()>>
> The trio's breasts were completely drained
> <<else>>
> They were drained
> both from their balls and from their breasts,
> <</if>>
> over and over again for a few hours.
> It would require several weeks for them to recover mentally from such trauma.
> You have the sneaking suspicion that the slavers deliberately submitted to the slime
> out of pure curiosity, but there was just no way to confirm this suspicion.
> </p>

### FoC-02 Kobold Rescue

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/darko/deep/kobold_rescue.twee

**Offer/Setup:** (172 words)

> <<questimage 'kobold_rescue.jpg'>>
>
> <p>
>     The drow economy relies much on slaves, to the point that the slaves are said to outnumber the drows. Among these slaves are a large number of kobold slaves, who are forced to mine in the many drow mineshafts in the <<lore region_deep>>.
>     Despite this, the drow and kobolds are not "technically" enemies — the drows maintained that these kobolds are criminals and scums they have captured somewhere. But one would be foolish to blindly trust a drow.
> </p>
>
> <p>
>     Recently, one of the expedition party from the city of <<rep $company.kobold>> has gone missing. The kobolds suspected foul play: They asked you to try and infiltrate the drow's many mineshafts, to find and free their fellow kobolds that has been "misidentified" as bandits by the drows. The mines are heavily guarded by day, but thankfully they are much less so during the nights, when the slaves are all shackled and sleeping. You just need a group stealthy enough to infiltrate the compound and pick the shackles' locks.
> </p>

**Outcome (crit/success):** (343 words)

> <p>
>     The mine was indeed lightly guarded during the night: the drows must have felt that the kobolds won't be able to escaped being collared into the floor at night. <<Yourrep $g.inf>> <<uadv $g.inf>> lead the team to infiltrate, and they indeed manage to indentify the kobolds that once belonged to the lost expedition.
>     <<Rep $g.thief>> then got to work, undoing the shackles one by one without drawing undue attention.
> </p>
>
> <p>
>     The locks were finally undone, but it turned out to not be the end of their problems.
>     The freed kobolds were worked to the bone by the drows, and was very weak as a result. Your slavers had to carry the five of them — in stealth — out of the compound.
>     <<set _unit = setup.selectUnit([$g.cap, $g.inf, $g.thief], {trait: 'magic_dark'})>>
>     <<if _unit>>
>         Using dark magic, <<rep _unit>> camouflaged the entire team in a shroud of darkness, helping the escape.
>     <</if>>
>
>     <<set _unit = setup.selectUnit([$g.cap, $g.inf, $g.thief], {trait: 'per_cautious'})>>
>     <<if _unit>>
>         <<Rep _unit>> ensured that the team would not draw undue attention — the careful slaver taking care not to get the team anywhere near the remaining drow guards.
>     <</if>>
>
>     <<set _unit = setup.selectUnit([$g.cap, $g.inf, $g.thief], {trait: 'height_dwarf'})>>
>     <<if _unit>>
>         <<Reps _unit>> stubby height prove useful to sneak out from the compound.
>     <</if>>
> </p>
>
> <p>
>     It took some time of sneaky sneaking, but the kobolds were successfully smuggled out of the compound. They were quite in a bad shape, however, and most slept throughout the journey to <<lore location_drak_xoth>>.
> </p>
>
> <p>
>     Your slavers were celebrated as friends of the kobolds, for having saved many of the lost kobold adventurers. While they may not have gotten any monetary rewards, your company's reputation among the kobolds of <<lore location_drak_xoth>> has soared.
> </p>
>
> <<if $gOutcome == 'crit'>>
>     <p>
>         Not all of the expedition members were found in the mines, however.
>         Or so your slavers has claimed.
>         Apparently two of the saved kobolds were relatively healthy ones, and your slavers decided wisely that they serve better as your slaves than returned to the city...
>     </p>
> <</if>>

**Outcome (failure):** (52 words)

> <p>
>     Unfortunately, the mines were not as lightly guarded as your slavers had expected. <<Reps $g.inf>> attempt to sneak in were in failure as a drow guard identified <<therace $g.inf>> and raised the alarm.
>     They managed to escape, but the drows somehow know that it was you who had sent them...
> </p>

**Outcome (disaster):** (98 words)

> <p>
>     Unfortunately, the mines were not as lightly guarded as your slavers had expected. <<Reps $g.inf>> attempt to sneak in were met with failure as one of the drow guards spotted <<therace $g.inf>>. Instead of raising the alarm, the cunning guard instead trailed <<them $g.inf>>, before knocking <<them $g.inf>> out with one swift blow.
>     The other two of your slavers managed to escape, thankfully.
>     As for <<rep $g.inf>>, you'll just have to rescue <<therace $g.inf>>, preferably before the drows drained <<them $g.inf>> of all <<their $g.inf>> worth in one of the many drow mines in the realm...
> </p>

### FoC-03 Treasure Hunt

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/Blueflame451/treasure_hunt.twee

**Offer/Setup:** (145 words)

> <p>
> Your scouts have returned from the <<lore region_vale>> with rumors of lost treasure.
> A fool's errand: treasure hunt is almost always a time-consuming affair, and does not always
> yield a reward. No matter how much
> <<rep $company.player>>'s coffers could use the extra coin,
> the thought of following-up on a lost treasure rumor is too idiotic even for you.
> </p>
>
> <p>
> But well, when had such a logical consideration stopped you from doing whatever it is that
> you want?
> If you want to waste your slaver's time on this fool's errand,
> the first step would be to send out a group to follow up on these rumors.
> They would need to explore the land while talking to the locals to see where the rumors might lead.
> This will incur costs, and the payout will not be immediate, if there is any payout at all...
> </p>

**Outcome (crit/success):** (229 words)

> <p>
> <<Rep $g.scout>> led your slavers on a jaunty trek across the <<lore region_vale>>.
> Each stop at a village, a farmstead or a tavern seemed to offer another clue to the treasure, another facet to the treasure hunt tale.
> </p>
>
> <<if $gOutcome == 'crit'>>
> <p>
> <<Rep $g.questioner>> <<uadv $g.questioner>> drew tales from the many northern folk encountered,
> sometimes for free, sometimes for a bribe, sometimes for a friendly cup of ale, and some other times with just
> <<if $g.questioner.getSpeech() == setup.speech.friendly>>
> a friendly word and smile.
> <<elseif $g.questioner.getSpeech() == setup.speech.bold>>
> <<their $g.questioner>> bold claims about being a treasure hunter.
> <<elseif $g.questioner.getSpeech() == setup.speech.cool>>
> <<their $g.questioner>> direct questions.
> <<elseif $g.questioner.getSpeech() == setup.speech.witty>>
> <<their $g.questioner>> witty charm.
> <<elseif $g.questioner.getSpeech() == setup.speech.debauched>>
> a suggestive wink.
> <</if>>
> Each bit of lore helped <<uadjgood $g.explorer>> <<rep $g.explorer>> to get closer and closer to the bottom of the tale, until finally <<they $g.explorer>> explorer|was confident that <<they $g.explorer>> had uncovered enough information to really begin the treasure hunt.
> </p>
>
> <<else>>
>
> <p>
> Over many mugs of mead did <<rep $g.questioner>> get to the bottom of the rumors.
> Before long, <<rep $g.explorer>> believed <<they $g.explorer>> had enough information to really begin this treasure hunt in earnest.
> The information costed coin, of course, but who can say how much was spent for tales and how much might have been spent on the comfort of fair company?
> </p>
> <</if>>

**Outcome (failure):** (74 words)

> <p>
> <<Rep $g.scout>> spent the week leading your slavers from village to village, from lone farmsteads to sleepy taverns, but regardless of the countless rumors and stories <<rep $g.questioner>> kept drawing from the many northern folk encountered, they returned without any solid leads whatsoever.
> Some coin was spent in travel and in drawing out all these useless tales, but at least <<rep $g.scout>> and <<rep $g.explorer>> had a relaxing week wandering the countryside.
> </p>

**Outcome (disaster):** (119 words)

> <p>
> <<Yourrep $g.explorer>> led your slavers on the north chasing rumors, and they went norther and norther.
> During their stay in one of the chilly northern tavern, <<rep $g.questioner>> had simply too much to drink, and agreed to purchase a treasure map from some wizened old geezer.
> </p>
>
> <p>
> The following morning, once your slavers mind cleared, they realized that they had just been fooled.
> The map they purchased contained nothing but a crude dick drawing of an old man.
> Swallowing their anger (but mostly shame) they returned to the <<rep $company.player>> without any leads and with much lighter pockets. Thankfully they ditched the ugly dick picture on the way so you don't have to see it too.
> </p>

### FoC-04 Sunken Barge I (a scouting quest that unlocks a follow-up)

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/Blueflame451/sunken_barge_i.twee

**Offer/Setup:** (163 words)

> <p>
> Your slavers efforts have finally paid off.
> Somehow, they actually found an actual lead, which might lead to an actual treasure.
> </p>
>
> <p>
> The northerners of old hated the <<lore race_humankingdom>>s, and it showed in their tales.
> According to the tale,
> some years ago a lavish pleasure barge belonging to a princeling from Lucgate was meandering up the river in the <<lore region_vale>> when disaster struck and the barge was sunk.
> The story then told in great raunchy details what happened to the survivors, but that's
> not the part of the tale that interests you.
> What you are interested in is the sunken vessel, no doubt brimming with lost treasure.
> </p>
>
> <p>
> It might still be a while until you can get your grubby <<uhands $unit.player>> on the treasure.
> You'd still need to locate the sunken vessel. This would no doubt require a strong swimmer, and you
> probably should select one among your slavers, unless you're up for the job yourself.
> </p>

**Outcome (crit/success):** (343 words)

> <p>
> The days were long -- your slavers scoured the riverbanks daily and swam in the icy river water,
> seeking the sunken barge.
> Fortunately, the hard cold work paid off when <<rep $g.spotter>> spotted something on the river bottom that looks very much like two halves of a large boat.
> </p>
>
> <p>
> It's up to <<yourrep $g.explorer>> to verify that the sighting is true.
> <<if $g.explorer.isNaked()>>
> Not wearing any clothings from the beginning,
> <<else>>
> So after stripping out of <<their $g.explorer>> <<uequipment $g.explorer>>,
> <</if>>
> <<they $g.explorer>> took a deep breath before diving into the river,
> leaving <<rep $g.spotter>> and <<rep $g.support>> to watch expectedly from the riverbank.
> </p>
>
> <p>
> After a few suspenseful moments
> <<if $g.explorer.isHasTrait('race_lizardkin')>>
> <<reps $g.explorer>> <<ueyes $g.explorer>> breached the river's' surface,
> before <<their $g.explorer>> <<therace $g.explorer>> <<uadjphys $g.explorer>> form exited from the water to rejoin <<their $g.explorer>> companions.
> <<else>>
> <<rep $g.explorer>> emerged from the river gasping for breath before swimming back into the riverbank where <<their $g.explorer>> companions were waiting.
> <</if>>
>
> <<if $gOutcome == 'crit'>>
> A fine prize were held in <<their $g.explorer>> <<uhand $g.explorer>> --
> an elegantly wrought fragments of a silver ship's lantern, a clear proof of the barge's value.
> <</if>>
> <<if $g.explorer.getSpeech() == setup.speech.friendly>>
> "We've found it friends, a barge full of treasure for no one else but us to loot!," <<rep $g.explorer>> announced with a smile!
> <<elseif $g.explorer.getSpeech() == setup.speech.bold>>
> "That barge is right down there, full of treasure for the taking," <<rep $g.explorer>> announced boldly!
> <<elseif $g.explorer.getSpeech() == setup.speech.cool>>
> "Looks like we have a barge to loot," <<rep $g.explorer>> informed them.
> <<elseif $g.explorer.getSpeech() == setup.speech.witty>>
> "It's down there alright, the snails kept the jewelries clean too, if you know what I mean," <<rep $g.explorer>> announced with a grin.
> <<elseif $g.explorer.getSpeech() == setup.speech.debauched>>
> "We've found the barge, no lusty river naiads in attendance, but plenty of booty," <<rep $g.explorer>> announced!
> <</if>>
> </p>
>
> <p>
> It seemed your slavers had found the sunken barge!
> The only task remaining is to properly loot the ship,
> and a final mission has been prepared for you to follow it up.
> </p>

**Outcome (failure):** (88 words)

> <p>
> Led by <<rep $g.spotter>>, your slavers spent the week scouring through the riverbanks with eyes peeled for any sign of the barge and the rich treasure it may hold.
> Yet day after day pass, and the only thing <<rep $g.explorer>> received for the trouble of diving into the chilly river were the wet and cold it brought.
> While your slavers had no success in their mission, there was still much of the river to explore and they may yet find the sunken barge in another attempt.
> </p>

**Outcome (disaster):** (87 words)

> <p>
> Initially excited, after days scouring the riverbanks without any clue, your slavers became
> more and more desperate.
> After spotting a shadowy form in the cold river, <<rep $g.explorer>> immediately dived in to investigate only to discover a fierce river beast that was none too happy to receive a visitor.
> <<rep $g.support>> support|was able to pull <<therace $g.explorer>> to safety, but not without them both suffering some bites from the unpleasant beast.
> The search will have to continue later, after they recover or with another team.
> </p>

### FoC-05 Bounty Hunt: Bandits

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/Blueflame451/bounty_hunt_bandits.twee

**Offer/Setup:** (165 words)

> <p>
> The <<lore region_vale>> is the home to many northerners.
> Nobody governs the land, which means nobody is there to protect the peasant
> from the dangers of the land. The farmers on the vale have grown hardy to
> the dangers of the land, be it the occassional flooding, bandit raids,
> or even the rare magical explosion.
> </p>
>
> <p>
> As it happens, these hardy peasants are currently having trouble with a group of bandits who have been attacking wagons, pillaging farms and burning crops.
> To combat these, they gathered some funds and is now seeking mercenaries to drive off the bandits
> from their lands.
> While enforcing law and order isn't your official designation, coin is coin, and you could take up the job.
> Besides, the actions of these outlaws could make your own affairs more difficult,
> especially if this job was to be taken by some other mercenary company.
> Plus, you could say no to the potential of acquiring some bandit for your slave collection.
> </p>

**Outcome (success):** (170 words)

> <p>
> While your slavers don't often hunt bandits, hunting men and women is not so unusual for them.
> It was not really surprising <<rep $g.tracker>> tracker|was able to pick up the tracks and locate the outlaws.
> </p>
>
> <p>
> Following the tracks, your slavers encountered a still burning farmstead, no doubt being raided by the bandits.
> A fierce and desperate fight erupted on the smoldering farm grounds, but <<rep $g.merc1>> and <<rep $g.merc2>> prove themselves more then a match for the bandits. After a bloody exchange, the wounded outlaws were routed, and your slavers emerged victorious.
> </p>
>
> <p>
> The farmers were saddened to hear of yet another homestead being lost to the bandit, but still agreed that your slavers did as requested by driving off the outlaws from their lands. They paid the promised bounty to your slavers. Your team may have spent a portion of the reward at a roadside tavern before returning to the fort, but who could blame them after they risked their lives on the job?
> </p>

**Outcome (failure):** (103 words)

> <p>
> Your slavers lost day after day following either an old trail or a misleading trail.
> After the rain wiped out the last remaining remnants of the trail,
> your slavers gave up trying to locate the bandits.
> </p>
>
> <p>
> Furthermore their frustration and shame were not all they suffer.
> After their failure, the farmers seemed certain your slavers were in league with the bandits.
> The only thanks your slavers received for their efforts were the hateful stares of the farmers
> of the land.
> <<if !$g.merc1.isHasTrait('per_kind')>>
>   <<Yourrep $g.merc1>> suggested to you to kidnap one of the farmer's daughter later,
>   out of spite.
> <</if>>
> </p>

**Outcome (disaster):** (94 words)

> <p>
> Hunting men and women is not such an unusual task for your slavers to begin with,
> so when <<rep $g.tracker>> found the outlaws tracks, <<they $g.tracker>> became overconfident and <<uadv $g.tracker>> gave chase.
> </p>
>
> <p>
> <<They $g.tracker>> tracker|was taken quite by surprise then when
> <<they $g.tracker>> stumbled into an ambush laid by the cunning bandits they were hunting.
> <<Rep $g.merc1>> and <<rep $g.merc2>> waged a desperate fight to escape from the ambush.
> They managed to escape alive and able to return home, but were injured both physically
> and mentally from the shame.
> </p>

### FoC-06 Werewolf Hunt

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/J1009/werewolf_hunt.twee

**Offer/Setup:** (214 words)

> <p>
> Word has come to your fort that a <<female $g.ziggar>> <<urace $g.ziggar>>
> has been seen terrorizing the small mountain settlements of the <<lore region_vale>>.
> According to the villagefolk, the <<urace $g.ziggar>> has been
> entering their homes at night and stealing their hard-earned gold, before
> disappearing into the darkness.
> So dire is the situation that the <<rep
> $company.humanvale>> have commissioned your company <<rep $company.player>>
> to take care of the threat, using any means upon which you deem necessary.
> </p>
>
> <<set _u = setup.getAnySlaver()>>
>
> <p>
> <<Yourrep _u>> points out that something is odd here — werewolves don't usually
> go out alone under the cover of darkness to sneak around and steal goods.
> These furry race usually prefers the more direct approach of simply
> raiding the villages to the ground, so this could be a rare outcast of the werewolves,
> which could present an opportunity for you to capture one without too many repercussions.
> Dealing with any <<urace $g.ziggar>> will be no easy task, however.
> First, you will need a good spotter in order to locate the
> <<urace $g.ziggar>> in it's surely hidden hideout, and then two
> hunters in order to take <<them $g.ziggar>> down and capture <<them
> $g.ziggar>>.
> It will not be an easy mission, but the money will
> (hopefully?) be well worth it.
> </p>

**Outcome (failure):** (48 words)

> <p>
> Despite your <<uadjphys $g.spotter>> spotter <<reps $g.spotter>> best
> efforts, <<they $g.spotter>> was unable to locate the <<urace $g.ziggar>>
> amidst the icy peaks of the <<lore region_vale>>.
> Your slavers had to return to the settlement empty-handed, who lost trust in your company's
> abilities to solve their problems.
> </p>

**Outcome (disaster):** (207 words)

> <<questimage 'werewolf_hunt.jpg'>>
>
> <p>
> Adventuring into the icy peaks of the <<lore region_vale>>, <<yourrep $g.spotter>>
> spotter|was able to <<uadv $g.spotter>> locate and track
> the <<urace $g.ziggar>>'s footsteps back into <<their $g.ziggar>> hiding
> place:
> a small cave on
> <<if $gQuest.getSeed() % 3 == 0>>
> the side of a mountain.
> <<elseif $gQuest.getSeed() % 3 == 1>>
> the side of an icy river.
> <<else>>
> the underside of a cliff.
> <</if>>
> Entering seemingly without care,
> <<if $g.hunter1.isHasTrait('per_cautious')>>
> a rare thing given how cautious <<therace $g.hunter1>> normally hunter1|is,
> <</if>>
> <<yourrep $g.hunter1>> and <<utheirrel $g.hunter1 $g.hunter2>>
> <<rep $g.hunter2>>
> found the cavern completely deserted.
> Ready to leave empty-handed, your slavers turned their backs around and were horrified to discover that the
> <<uadjgood $g.ziggar>> <<urace $g.ziggar>> was waiting for them at the
> entrance, having seemingly spotted them coming before they could get there.
> <<Rep $g.spotter>>, who had been left alone outside the cave,
> had already been overpowered by the <<urace $g.ziggar>> and laid unconscious at <<their
> $g.ziggar>> side.
> </p>
>
> <p>
> With no other way out, your slavers fought their way against the powerful enemy,
> and while they were able to escape, they suffered a great many injuries and had to
> stumble their way out of the <<urace $g.ziggar>>'s lair while
> carrying <<rep $g.spotter>> with them.
> </p>

### FoC-07 Tomb Raider (setup only; the outcome passage is one long branching narrative)

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/darko/deep/tomb_raider.twee

**Offer/Setup:** (99 words)

> <p>
>     The <<lore region_deep>> is chokeful with secret, danger, and horrors. But it is also laden with treasure and ancient knowledge.
> </p>
>
> <p>
>     Recently, you have received information that an ancient crypt has just been accidentally unearthed within one of the many highways in the realm. You can try to send a group of slavers to try and raid the crypt before the underground cities send their own expedition crew. An explorer to identify the valuables, and two experienced tomb raiders that would be capable to handle whatever dangers your slavers will no doubt face inside the crypt...
> </p>

### FoC-08 Bandits on the Roads (a quest whose setup is delivered by an NPC arriving wounded)

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/Matthew_Lang/Bandits_On_The_Roads.twee

**Offer/Setup:** (357 words)

> <<set _guard = setup.getAnySlaver()>>
>
> <p>The sun is on it's way down towards the western horizon and <<name $g.trader>> is late. The friendly <<urace $g.trader>> was one of the first traders to visit the scary ruined fort full of folk with a reputation for kidnapping people like <<them $g.trader>>, and is
> <<if $unit.player.isHasTrait('per_cruel')>>
> useful in <<their $g.trader>> own way.
> <<elseif $unit.player.isHasTrait('per_kind')>>
> almost a friend, at this point. Enough that you're worried about <<them $g.trader>>, at least.
> <<elseif $unit.player.isHasTrait('per_empath')>>
> almost a friend, at this point. Enough that you're worried about <<them $g.trader>>, at least.
> <<elseif $unit.player.isHasTrait('per_evil')>>
> useful enough in <<their $g.trader>> own way.
> <<elseif $unit.player.isHasTrait('per_lustful')>>
> someone you've shared a blowjob with a time or two.
> <<elseif $unit.player.isHasTrait('per_sexaddict')>>
> some who can almost keep up with you in the bedroom.
> <<else>>
> someone who's worth more as a contact than a slave.
> <</if>>
> It is almost dark when <<they $g.trader>> finally staggers through the gates and into the courtyard, <<name _guard>>'s shouts of alarm alerting you to <<their $g.trader>> arrival.<br>
> "Bandits," <<they $g.trader>> says eventually
> <<if $fort.player.isHasBuilding('hospital')>>
> from their hospital bed, an empty bowl of soup on the table nearby.
> <<else>>
> when <<their $g.trader>> wounds have been tended and they've been given some bread and soup to eat.
> <</if>>
> "The road is lousy with them. If they stick around you're going to have issues with trade. Or travel."
> </p>
> <p>Despite <<their $g.trader>> injuries, <<name $g.trader>> managed to escape with their goods and assure you <<they $g.trader>> will be setting up their stall in your courtyard as normal in the next few days. Of course, there's now the question of those bandits. It's not what you normally deal with, but clearing the roads would mean the safe passage of your slavers in and out of the fort—and could even net you some goodwill with the locals. There's also the outside chance that you might manage to capture a bandit as a new slave, but then again, bandits are probably tougher fighters than your slavers typically go up against.</p>
> <p>On the other hand, this really isn't your problem. The Lords of Lucgate should be dealing with this, by right. They won't. But they should.</p>

**Outcome (crit/success):** (213 words)

> <p>
> <<if $gOutcome == 'crit'>>
> Your slavers strutted home, spirits high with a bound figure in tow.<br>
> <<elseif $gOutcome == 'success'>>
> Your slaves came back in high spirits, with <<name $g.warrior>> whistling a jaunty tune.<br>
> <</if>>
> "Lazy buggers never saw us coming," <<name $g.scout>> says <<uadv $g.scout>>. </p>
> <p>
> With their operation located off in the borderlands, the bandits clearly didn't think that anyone would dare attack them, and their bravado collapsed the moment your slavers started laying into them. They also brought back a wagonload of spoils—including more than a few trade goods
> <<if $unit.player.isHasTrait('per_cruel')>>
> that you gleefully add to your stockpiles.
> <<run setup.qc.Equipment(setup.equipmentpool.brawn).apply($gQuest)>>
> <<if $gQuest.getSeed() % 2 == 0>>
> <<run setup.qc.Item('f_tile_normal').apply($gQuest)>>
> <<elseif $gQuest.getSeed() % 2 == 1>>
> <</if>>
>
> <<elseif $unit.player.isHasTrait('per_kind')>>
> that you give to <<name $g.trader>> to sell on.
> <<run setup.qc.Favor('humankingdom', 50).apply($gQuest)>>
>
> <<elseif $unit.player.isHasTrait('per_evil')>>
> that you gleefully add to your stockpiles.
> <<run setup.qc.Equipment(setup.equipmentpool.brawn).apply($gQuest)>>
> <<if $gQuest.getSeed() % 2 == 0>>
> <<run setup.qc.Item('f_tile_normal').apply($gQuest)>>
> <<elseif $gQuest.getSeed() % 2 == 1>>
> <</if>>
>
> <<elseif $unit.player.isHasTrait('per_honorable')>>
> that you give to <<name $g.trader>>. The poor <<woman $g.trader>> could use the help right now and if nothing else, you do right by your allies.
> <<run setup.qc.Favor('humankingdom', 50).apply($gQuest)>>
> <<else>>
> that will fetch a pretty penny in the marketplace. Or maybe you'll just hand them out to your slavers.
> <</if>>
> </p>

**Outcome (failure + disaster tail) — sexual content:** (311 words)

> <p>Your slavers staggered back into the fort, looking worse for wear, and <<name $g.warrior2>> favouring their left leg.<br>
> <<set _unit = setup.selectUnit([$g.scout, $g.warrior, $g.warrior2], {trait: 'per_lustful'})>>
> <<if _unit>>
> "They...were really good fighters," <<name _unit>> says, wincing. "And then as punishment they... well I might have had fun if there had been less pain."<br> <<name _unit>> shudders, "a lot less pain."
> <<else>>
> <<set _unit = setup.selectUnit([$g.scout, $g.warrior, $g.warrior2], {trait: 'per_sexaddict'})>>
> <<if _unit>>
> "They...were really good fighters," <<name _unit>> says, wincing. "And then as punishment they... well I might have had fun if there had been less pain."<br> <<name _unit>> shudders, "a lot less pain."
> <<else>>
> <<set _unit = setup.selectUnit([$g.scout, $g.warrior, $g.warrior2], {trait: 'per_submissive'})>>
> <<if _unit>>
> "They...were really good fighters," <<name _unit>> says, wincing. "And then as punishment they... they treated us like slaves."
> <<else>>
> "I don't want to talk about it," <<name $g.warrior2>> says shortly.
> <</if>>
> <</if>>
> <</if>>
> </p>
> <p>
> As <<name $g.warrior2>> turns to leave, you notice <<their $g.warrior2>> <<uequipslot $g.warrior2 'legs'>> have been torn out at the ass and crotch and there's a wetness dripping from <<their $g.warrior2>> <<if $g.warrior2.isHasDick()>>
> ass
> <<else>>
> vagina
> <</if>>
> that looks suspiciously familiar. Maybe you should have left the bandits to the Lords of Lucgate.</p>
> <<if $gOutcome == 'disaster'>>
> <p>Two days later you find an broken arrow in the fortress courtyard, a missive attached to the shaft. Unrolling it you find a short message, the letters scratchy and disjointed<br>
> Thanks for sending us your whores. Why don't you send one we can keep, or we might have to pay you a visit and take our pick.</p>
> <p>Looks like you have a slave order—or a demand. Sending one might get the bandits off your back for a bit, but it could also just encourage them to make further demands. Either way, you don't expect they're going to be willing to pay a fair price. </p>
> <</if>>

### FoC-09 Crimson Robber (setup that spells out the plan the player is buying into)

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/darko/city/CrimsonRobber.twee

**Offer/Setup:** (246 words)

> <p>
> The market square of the <<lore region_city>> is a bustling place, with vendors
> everywhere peddling their goods. Normally, with the exception of small time
> pickpockets, the area is relatively safe and it would be impossible for your
> slavers to raid the place.
> But recently, there has been rumors of a particularly sexy and eye-catching
> robber doing daylight robberies, but the culprit is so charming that the victim
> usually willingly give everything they have to them.
> Due to such bold tactic of robbing in the middle of the day and the reddish
> costume they reportedly wear, the citizen have given the robber the nickname
> "Crimson Robber".
> Reports are inconsistent whether the Crimson Robber is a handsome and well-built
> young lad, or a sexy cat burglar in a tight red suit.
> </p>
>
> <p>
> Whether the rumors are true or not, there is an opportunity here for your
> slavers to make use. Specifically, you could try to dress up one of your
> slavers to look like the Crimson Robber in an attempt to distract the marketplace's
> people. Meanwhile, one of the other slavers will gather up valuables during the distraction from
> the unattended booths.
> To make the show more convincing, you can try adding a love interest to the mix --
> one of your own slavers who will be pretending to be a normal peddler that happened to be robbed by
> the Crimson Robber only to fall in love.
> Surely such a clever plan must work, no?
> </p>

### FoC-10 Head Hunter (a setup whose last beat is an explicit warning about the commitment)

`Source:` https://raw.githubusercontent.com/Official-Husko/fork-of-chains/HEAD/project/twee/quest/darko/city/HeadHunter.twee

**Offer/Setup — sexual content:** (246 words)

> <p>
> Among the many guilds in the <<lore region_city>>, the Head-Hunter guild is famous for being
> filthy rich.
> The Head-Hunter guild, despite their name, works on the entertainment field,
> supplying entertainment for various higher-end nobles as well as well paying merchants.
> Entering the head-hunter guild as an entertainer is a dream for many, but they are notoriously
> picky about picking their employees.
> </p>
>
> <p>
> ...or that's what seems to be on the surface. In fact, the many "employees" of the
> Head-Hunter guilds are in all technical terms slaves to the higher ups in the guild.
> The "entertainment" they provide are usually lending these employees to the guests to use
> as they see fit -- however, they are called the Head-Hunter because of their particular
> speciality: their employees are very, very good in the art of giving head.
> </p>
>
> <p>
> If your slavers can convince the boss that you can headhunt for more "employees",
> there is a potentially great money to be made here.
> To prove your capability of finding slaves that can give a good head, the standard procedure
> is for one of your slavers to actually demonstrate their capability of giving head,
> so bringing one rather slutty slaver is actually a requirement here.
> You must be careful with this quest, however, for deals
> involving the head-hunters are not so easily broken.
> If you are offering your services here, then you are committing to actually sending the
> specific slave that they will be requesting later.
> </p>

**Outcome block (all four grades in one passage, branching on `$gOutcome`):** (486 words)

> <p>
> Your arrived at the office and registered themselves to the receptions.
> After a while, one of the receptionists escorted
> <<yourrep $g.whoreblowjob>> for <<their $g.whoreblowjob>> "interview",
> while the rest of your slavers were asked to wait just a little bit longer.
> Some time later, your slavers were called upstairs to talk with one of the higher ups.
> They entered <<their $g.head>> office, a sparsely decorated office with only
> the desk as its centerpiece.
> The higher up was dressed formally, and was seemingly busy with an endless
> amount of paperwork.
> Upon seeing your slavers, <<they $g.head>> greeted them, but your slavers couldn't
> shake the feeling that there was something off about <<their $g.head>> demeanor.
> Indeed, as your slavers grew closer, they could hear some kind of slurping noises coming from
> under the desk. But they knew better than to ask.
> </p>
>
> <<if $gOutcome == 'crit'>>
>
> <p>
> Apparently, <<they $g.head>> offered your company a really good deal for a slave.
> <<Yourrep $g.whoreblowjob>> apparently did such a wonderful job with <<their $g.whoreblowjob>>
> "interview", which impressed <<them $g.head>> greatly.
> </p>
>
> <<elseif $gOutcome == 'success'>>
>
> <p>
> <<They $g.head>> bargained with your slavers, and it eventually reached an
> adequate deal for an opportunity to sell a slave.
> Throughout the bargaining process, the noises of slurping and sucking never stopped,
> but your slavers did their best to put it at the back of their minds.
> </p>
>
> <<elseif $gOutcome == 'failure'>>
>
> <p>
> <<They $g.head>> dealt a hard bargain with your slavers, resulting
> in a sub-par deal for you.
> Still, it is in your best interest for your company to fulfill the deal, for
> otherwise you would need to pay for wasting <<their $g.head>> time.
> </p>
>
> <<elseif $gOutcome == 'disaster'>>
>
> <p>
> Throughout the negotiation, the sucking and slurping noises were accompanied by the
> occasional zapping noises and a displeased grunt, but your slavers kept their mouths
> shut.
> The supervisor dealt a really hard bargain with your slavers,
> resulting in a terrible par deal for your company.
> Still, it is in your best interest for your company to fulfill the deal, for
> otherwise you would need to pay for wasting <<their $g.head>> time.
> </p>
>
> <</if>>
>
> <p>
> Once the negotiations were over and your slavers were escorted back to the exit, they regrouped with
> <<rep $g.whoreblowjob>>, who looked a little worse for the wear.
> <<They $g.whoreblowjob>> refused to talk about the interview at all.
> <<if $gOutcome == 'disaster'>>
>   Still, based on the new slight burn marks on <<them $g.whoreblowjob>>, your other
>   slavers did not have to think hard to guess what actually had happened.
> <<elseif $g.whoreblowjob.isHasTrait('per_submissive')>>
>   Judging from the occasional blush and knowing how submissive <<they $g.whoreblowjob>> usually
>   whoreblowjob|is, however, there was little room for doubt as to what might have happened under
>   the desk...
> <<elseif $g.whoreblowjob.isHasTrait('per_dominant')>>
>   If anything, <<they $g.whoreblowjob>> looked a little down in the coming days,
>   as if <<their $g.whoreblowjob>> dominant nature had been contested somewhere within the office.
>   <<run setup.qc.TraumatizeRandom('whoreblowjob', 2).apply($gQuest)>>
> <</if>>
> </p>

---

## 3. Wildermyth

Source repo: `adenzu/Wildermyth-Turkish` — a translation project that vendors the game's
English `.properties` string files verbatim alongside the `_tr` translations. The English
files are the shipped vanilla text.

Format: one file per event/outcome. `.name` / `.longName` / `.blurb` are the headline and
the one-line summary shown on the map. Body lines are keyed
`~<scene>~<branch>~<panel_NNN>~<order>_<speakerRole>` and each is one comic panel's
caption or speech bubble. Slots: `<hero>`, `<deadHero>`, `<company>`, `<site>`,
`<overlandTile>`, `<foes.singular>`. Personality-conditional text is
`<role.tagA/tagB/NN:variant A/variant B/fallback>`; gender is `<hero.mf:he/she/they>`;
`[b]`, `[i]`, `[green]`, `[face:grim]` are inline markup. Whole files are reproduced
because the branching IS the writing.

---

### WM-01 Generic mission victory (the fully generic fallback)

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/missionOutcome/missionVictory_generic.properties

**Outcome (success) — whole file:** (19 words)

> #suppress inspection "UnusedProperty" for whole file
> .blurb=You've won!
> .longName=Victory at <site>!
> .name=Victory!
> ~01~~panel_001~1_narration=You've won a hard-fought battle at <site>.

### WM-02 Generic mission defeat (the fully generic fallback)

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/missionOutcome/missionDefeat_generic.properties

**Outcome (failure) — whole file:** (22 words)

> #suppress inspection "UnusedProperty" for whole file
> .blurb=You've lost.
> .longName=Defeat at <site>
> .name=Defeat!
> ~01~~panel_001~1_narration=Despite your sacrifices, the battle at <site> ended in defeat...

### WM-03 Defeat: "Giving Ground" (a written-out retreat scene between two named heroes)

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/missionOutcome/defeat_givingGround.properties

**Outcome (failure) — whole file:** (231 words)

> #suppress inspection "UnusedProperty" for whole file
> .longName=Giving Ground
> .name=Defeat
> ~01~~panel_001~1_narration=The sounds of battle fade as the party rushes away.
> ~01~~panel_002~1_coward=<coward.coward/snark/60:Do you think this is far enough? They're not chasing us, are they? /They're not chasing us, are they? It'd be our luck that they'd refuse to let up./I think this is far enough. They didn't chase us did they?>
> ~01~~panel_003~1_hothead=<hothead.hothead/snark/60:No they're not chasing us. You ran us halfway across the world in our cowardly retreat./ Like anything could follow us with how fast you ran with your tail tucked!/No they didn't chase us. Like anything could keep up with how fast you fled outta there.>
> ~01~~panel_004~1_coward=I ... there were too many! They were beating us senseless!
> ~01~~panel_005~1_hothead=<hothead.hothead/leader/snark:What sort of heroes are we?/ Is this our legacy?/Some big damn heroes we are!> Running away like startled sheep?!
> ~01~~panel_006~1_healer=<healer.healer/leader/bookish/60:Peace, <hothead>. Sometimes the wisest course is to know which battles you can win. / There is no dishonor in choosing your battles wisely, <hothead>./Emphilius said, "She who knows when to engage and when to withdraw is wisest," <hothead>./Easy, <hothead>. There's no need for us to fight a losing battle.> We live to fight another day.
> ~01~~panel_008~1_hothead=<hothead.hothead/poet:You're right. I'm sorry, <coward>. /My apologies, <coward>.>
> ~01~~panel_009~1_hothead=<hothead.hothead.50/leader:The rush of the battle sometimes makes me forget that I'm part of a team./ Each of us matters.> We must all [b]always[] live to fight another day if we can.

### WM-04 Defeat: "Escape!" — one hero was maimed getting out

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/missionOutcome/defeat_escapeMaimed.properties

**Outcome (failure) — whole file:** (142 words)

> #suppress inspection "UnusedProperty" for whole file
> .longName=Escape!
> .name=Defeat
> ~01~~panel_001~1_hero=<hero.rfln.maimedHero:[face:angry]Well maybe if you hadn't [small]gone in there and...[]/<hero.goofball/snark/healer/leader/poet/80:[face:happy]You're still alive though, right? That counts for something./[face:skeptical]You're still alive though, right? That counts for something./[face:interested]No what-if's. No if-only's. We made it out, that's the important thing./[face:grim]No what-if's. No if-only's. We made it out, that's the important thing./[face:grim]No what-if's. No if-only's. We dodged death, and today that is enough./[face:grim]Come on. We're gonna get you out of here.>/[face:interested]You're going to be alright. Just a little further, hang in there./<hero.goofball/snark/healer/leader/poet/80:[face:happy]You're still alive though, right? That counts for something./[face:skeptical]You're still alive though, right? That counts for something./[face:interested]No what-if's. No if-only's. We made it out, that's the important thing./[face:grim]No what-if's. No if-only's. We made it out, that's the important thing./[face:grim]No what-if's. No if-only's. We dodged death, and today that is enough./[face:grim]Come on. We're gonna get you out of here.>>

### WM-05 Victory: "Tarnished Victory" — won the fight, lost a hero

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/missionOutcome/victory_tarnishedVictory.properties

**Outcome (success with a death) — whole file:** (105 words)

> #suppress inspection "UnusedProperty" for whole file
> .longName=Tarnished Victory
> .name=Victory
> ~01~~panel_001~1_snark=<snark.snark/leader/poet/60:I feel like I really got into a groove there at the end./Great fight, everyone! They won't bother us again!/And lo! did <snark> and <company> lay waste to their foes!/Victory is ours!>
> ~01~~panel_002~1_snark=They were falling left and ri -- what's wrong?
> ~01~~panel_003~1_snark=Oh no. No ...
> ~01~~panel_003~2_bookish=<deadhero.mf:He/She/They> took a blow meant for me, I think.
> ~01~~panel_004~1_snark=What ... what do we tell <deadhero.mf:his/her/their> family?
> ~01~~panel_004~2_leader=<deadhero.mf:He/She/They> went down bravely. <deadHero> saved us.
> ~01~~panel_005~1_bookish=<bookish.romantic/snark:My heart feels empty. The cost of our victory was too high. / May you be in a place better than the one you left behind, <deadhero>.>

### WM-06 Victory: "Fodder"

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/missionOutcome/victory_fodder.properties

**Outcome (success) — whole file:** (46 words)

> #suppress inspection "UnusedProperty" for whole file
> .longName=Fodder
> .name=
> ~01~~panel_001~1_action=Caw!
> ~01~~panel_002~1_action=Caw!
> ~01~~panel_003~1_action=Caw!
> ~01~~panel_003~2_action=Kraw!
> ~01~~panel_004~1_volunteer=Enjoy yourselves, <volunteer.mf:brothers/sisters/cousins>. The buffet’s back that way!
> ~01~~panel_005~1_volunteer=You'll be doing the Yondering Lands a favor.
> ~01~~panel_006~1_action=Caw!
> ~01~~panel_006~2_actionSmall=Kraw!
> ~01~~panel_006~3_volunteer=Mind you don't pick up any diseases!
> ~01~~panel_006~4_hero2=[small]...Nature can't be all emeralds and sunsets, I guess.

### WM-07 Victory: "The Unspeakable Thing" — the surviving lover speaks (excerpt: the file continues with one full variant per personality)

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/missionOutcome/victory_deadLover.properties

**Outcome (success with a death) — first branch of the file:** (208 words)

> #suppress inspection "UnusedProperty" for whole file
> .longName=The Unspeakable Thing
> .name=Victory
> ~01~~panel_001.(lover_is_Bookish)~1_narration=Despite their exhaustion, no one wanted to be the first to turn in that night. Not before <lover>, anyway.
> ~01~~panel_003.(lover_is_Bookish)~1_lover=My only thought for a while was, “it should have been me.”
> ~01~~panel_004.(lover_is_Bookish)~1_lover=But then, if it had been me, <deadHero> would be the one left behind to grieve.
> ~01~~panel_005.(lover_is_Bookish)~1_lover=I don’t know if making [i]<deadHero.mf:him,her,them>[] go through that would have been any kinder.
> ~01~~panel_006.(lover_is_Bookish)~1_lover=I don’t know what to think anymore.
> ~01~~panel_008.(lover_is_Coward)~1_lover=The dark is darker alone.
> ~01~~panel_010.(lover_is_Coward)~1_lover=The cold is colder.
> ~01~~panel_012.(lover_is_Coward)~1_hero=Come back to camp. We'll get the fire up again.
> ~01~~panel_013.(lover_is_Coward)~1_hero=We can talk about <deadHero>—
> ~01~~panel_014.(lover_is_Coward)~1_lover=<hero>, I don't know how I'm going to keep doing this without <deadHero.mf:him,her,them>!
> ~01~~panel_015.(lover_is_Coward)~1_hero=Easy, okay?
> ~01~~panel_016.(lover_is_Coward)~1_hero=Don't give fate any ideas.
> ~01~~panel_017.(lover_is_Coward)~1_hero=We've lost enough today.
> ~01~~panel_018.(lover_is_Goofball)~1_narration=Despite their exhaustion, no one wanted to be the first to turn in that night. Not before <lover>, anyway.
> ~01~~panel_020.(lover_is_Goofball)~1_lover=<deadHero> told me that this wasn’t going to happen.
> ~01~~panel_021.(lover_is_Goofball)~1_lover=<deadHero.mf:He,She,They> told me. And I believed <deadHero.mf:him,her,them>.
> ~01~~panel_022.(lover_is_Goofball)~1_lover=So maybe...
> ~01~~panel_023.(lover_is_Goofball)~1_lover=Maybe I am as much of a fool as everyone says.
> ~01~~panel_025.(lover_is_Greedy)~1_narration=In the days after the battle, <lover> would drop behind the others occasionally.
> ~01~~panel_026.(lover_is_Healer)~1_narration=hey we won!
> ~01~~panel_027.(lover_is_Hothead)~1_narration=hey we won!
> ~01~~panel_028.(lover_is_Leader)~1_narration=hey we won!
> ~01~~panel_029.(lover_is_Loner)~1_narration=hey we won!
> ~01~~panel_030.(lover_is_Poet)~1_narration=hey we won!
> ~01~~panel_031.(lover_is_Romantic)~1_narration=hey we won!
> ~01~~panel_032.(lover_is_Snark)~1_narration=hey we won!

### WM-08 Tidings: a hero's story after a build job (Mine)

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/tidingOutcome/buildMine1.properties

**Outcome (job complete) — whole file:** (90 words)

> #suppress inspection "UnusedProperty" for whole file
> .blurb=<hero> has a story.
> .longName=buildMine1
> .name=Tidings
> ~01~~panel_001~1_narration=Negotiations with the Badgerfolk were a weighty part of developing <site>.
> ~01~~panel_002~1_narration=<hero.healer/leader/bookish/60:<hero> assured them that the mine wouldn't encroach on any existing tunnels, and eventually a peace was reached./Eventually <hero> worked up a profit-sharing system that satisfied both parties./But <hero>'s meticulously drawn plans assured them that the mine wouldn't disturb any existing tunnels./ But once it was clear that the mine wouldn't disturb any existing tunnels, the Folk were able to give some good leads on <hero.romantic/snark/loner:ruby/silver/iron> deposits.>

### WM-09 Tidings: "No Rest for the Watchful"

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/tidingOutcome/noRestfortheWatchful.properties

**Outcome (between-chapter tiding) — whole file:** (66 words)

> #suppress inspection "UnusedProperty" for whole file
> .blurb=<hero> has a story.
> .longName=No Rest for the Watchful
> .name=Tidings
> ~01~~panel_001~1_narration=<hook2> lost sleep, spending whole weeks watching a secluded hovel. <hook2.mf:He/She/They> wondered always when a disturbing secret might spill out.
> ~01~~panel_002~1_narration=But wariness works both ways.
> ~01~~panel_002~2_hook=<hook.goofball/hothead/loner/snark/romantic:It's a little cute, isn't it?/[face:grim]Someday I may have to do something about <hook2.mf:him/her/them>.../[face:grim]Oh yes.\nI haven't forgotten.../[face:dubious]I sleep quite well, myself./I'm a little bit flattered...>

### WM-10 Tidings: "Lost in the Darkness"

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/tidingOutcome/lostintheDarkness.properties

**Outcome (between-chapter tiding) — whole file:** (58 words)

> #suppress inspection "UnusedProperty" for whole file
> .blurb=<hero> has a story.
> .longName=Lost in the Darkness
> .name=Tidings
> ~01~~panel_001~1_narration=<hook> disappeared for a while, saying <hook.mf:he/she/they> had distances to wander and worries that needed to be put to rest.
> ~01~~panel_001~3_bookish=<bookish.exists:<lover.exists:[face:joy]/>/>
> ~01~~panel_002~1_narration=What returned in <hook.mf:his/her/their> place? It was hard to know. <hook.mf:He/She/They> claimed <hook.mf:he was/she was/they were> here to see <hook.mf:his/her/their> oaths fulfilled...

### WM-11 Wilderness event: "The Offering" — full four-choice scene with a pass/fail skill roll

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/wilderness/theOffering.properties

**Setup + choices + all outcomes (incl. `test_pass` / `test_fail`) — whole file:** (787 words)

> #suppress inspection "UnusedProperty" for whole file
> .blurb=Scouting complete.
> .longName=The Offering
> .name=Event
> ~01~prompt~panel_003~1_narration=And then it was simply there, striding beside them.
> ~01~prompt~panel_004~1_snark=<healer.loner.80:Go on, say something. I saw you talking to a stone that one time before.../<healer>, are you gonna say something to it, or...>
> ~01~prompt~panel_006~1_healer=<healer.loner/poet/80:Um... hello?/Fellow wanderer! What calls the very stones to cross this valley?/Ahem... To what do we owe the honor of such company?/>
> ~01~prompt~panel_007~1_action=*rumble*
> ~01~prompt~panel_008~1_speech=[darkAqua]Someone has visited my shrine.
> ~01~prompt~panel_008~2_greedy=[darkAqua]It has been a long time. I have slept.
> ~01~prompt~panel_008~3_speech=[darkAqua]I go to it now.
> ~01~prompt~panel_009~1_snark=*shrug*
> ~01~prompt~panel_011~1_speech=[darkAqua]It is close. I feel the offering.
> ~01~prompt~panel_011~2_speech=[darkAqua]But something is not right.
> ~01~prompt~panel_013~1_speech=[darkAqua]Who desecrates my shrine with [i]thievery?[]
> ~01~prompt~panel_014~1_speech=[darkGold][b][i]Your[][] shrine?
> ~01~prompt~panel_015~1_snark=Oh boy. Here we go.
> ~01~prompt~panel_016~1_narration=If you asked <company> why they always seemed to draw the land's troubles to them, they may disagree over the answer.
> ~01~prompt~panel_017~1_healer=Perhaps there are so [b]many[] troubles that <healer.bookish.60:the odds of encountering any one are actually quite high./you can't help but trip over one on any given stroll.>
> ~01~prompt~panel_018~1_snark=Or maybe <snark.romantic/leader:we just have that kind of "dumping ground" aura./we're just encouraging this kind of thing because we keep dealing with it.>
> ~01~prompt~panel_019~1_speech=[darkAqua]This shrine was built by the Hillfolk, in the days of Stone. Before any of you upstart saplings scattered here.[]
> ~01~prompt~panel_020~1_speech=[darkGold]And is that how long it's been since you've visited it?[]
> ~01~prompt~panel_020~2_speech=[darkGold]Who tended its moss and shielded it from storms in the meantime?
> ~01~prompt~panel_020~3_greedy=[darkGold]Not you, old scuff. That's for sure.[]
> ~01~prompt~panel_021~1_speech=[darkAqua]This offering was [i]intended[] for the Hills.[]
> ~01~prompt~panel_022~1_speech=[darkGold]You abandoned the shrine for ages. You forfeit any offering. It is rightfully the Forest's now.[]
> ~01~prompt~panel_023~1_speech=[darkAqua]What say the soft ones?[]
> ~02~choice_one~panel_001~1_healer=It belongs to the Hills.
> ~03~choice_two~panel_001~1_snark=Ehh, I think the Forest has a good point here.
> ~04~choice_three~panel_001~1_greedy=No way. Not getting involved.
> ~05~choice_four~panel_001~1_greedy=...Wait, let me get a closer look at that offering...
> ~05~choice_four~panel_001~2_self=<greedy.eventRoll:roll_four|difficulty_four>
> ~06~player_chose_one~panel_001~1_npc=<healer.poet.80:Things don't change their essence so easily./I mean, it's still a Hill Shrine, at the base of it. The person visiting must have known that.>
> ~06~player_chose_one~panel_002~1_npc=<healer.poet.80:Even if <snark> had been raised by badgers, <snark.mf:he'd/she'd/they'd> still be a human./Besides, I always have to help <snark> keep <snark.mf:his/her/their> cookware from rusting away. Doesn't mean it's mine though.>
> ~06~player_chose_one~panel_003~1_speech=[darkGold]Kshaahh. No good deed, they say...
> ~06~player_chose_one~panel_004~1_speech=[darkGold]Shrrrah, I hope the trinket gets wedged in his neck.[]
> ~06~player_chose_one~panel_006~1_speech=[darkAqua]May the Hills' strength settle in you.
> ~07~player_chose_two~panel_001~1_snark=Listen, I know we walked a long way and all.
> ~07~player_chose_two~panel_002~1_snark=<snark.snark.60:But I think shrines fall under the natural law of "Use It or Lose It."/But if the forest really has been taking care of the shrine as long as it says, it deserves something for its troubles.>
> ~07~player_chose_two~panel_003~1_snark=I dunno. I mean. He asked.
> ~07~player_chose_two~panel_007~1_speech=[darkGold]It is good to see that such work does not go unseen by even human eyes.
> ~07~player_chose_two~panel_008~1_speech=[darkGold]Accept this. The Forest takes care of its own.
> ~08~player_chose_three~panel_001~1_greedy=<greedy.snark/poet/60:Choose sides in an argument between two gnarly giants?/Do ants judge in the courts of our own cities?/We're just a few mortals passing through.>
> ~08~player_chose_three~panel_002~1_greedy=<greedy.snark/poet/60:Are you kidding? There's no way that ends well for <greedy.poet.40:squishy folk/us>./This is far beyond the wisdom of mere mortals./Our opinion isn't worth the dirt we stand on.>
> ~08~player_chose_three~panel_003~1_greedy=<greedy.snark/poet/60:No spirit-grudges for me today, no sir./We humbly concede the decision to you./Not compared to thousands of years of nature-wisdom. They can work this out themselves.>
> ~08~player_chose_three~panel_006~1_speech=[darkAqua]Halfsies?
> ~08~player_chose_three~panel_006~2_speech=[darkGold]Okay.
> ~09~player_chose_four.test_pass~panel_003~1_greedy=Whoa!
> ~09~player_chose_four.test_pass~panel_004~1_greedy=The <greedy.poet/bookish/goofball:foul aura/withering energy/bad juju> coming off of this <greedy.poet/bookish/goofball:artifact/artifact/thing> is strong. ...You aren't feeling that?
> ~09~player_chose_four.test_pass~panel_005~1_greedy=[white]?
> ~09~player_chose_four.test_pass~panel_006~1_greedy=Someone clearly wanted to curse [i]one[] of you by leaving this "gift" here.
> ~09~player_chose_four.test_pass~panel_007~1_speech=[darkGold]Ksharrr! Probably one of those tatter-robes from the swamp...
> ~09~player_chose_four.test_pass~panel_008~1_greedy=Or a <foes.singular>. Seems like their style.
> ~09~player_chose_four.test_pass~panel_009~1_greedy=Please let us dispose of this [i]abomination[] for you. <greedy.poet/bookish/snark/60:Better to risk a meager human life than the life of the land itself./I'm familiar with curses and confident that we could do it safely./We're heroes. We do this sort of thing all the time./ >
> ~09~player_chose_four.test_pass~panel_010~1_action=[neutralAspect]*rumble*[]
> ~09~player_chose_four.test_pass~panel_011~1_speech=[darkAqua]Rrmmm. Indeed. It is not worth the risk. Take it far from here.[]
> ~09~player_chose_four.test_pass~panel_012~1_speech=[darkGold]Krrrr. Fortunate that the fleshfolk were with you.
> ~09~player_chose_four.test_pass~panel_013~1_narration=Later...
> ~09~player_chose_four.test_pass~panel_013~2_snark=So, what... we've got a cursed offering now?
> ~09~player_chose_four.test_pass~panel_014~1_greedy=Psh, no. There's no curse.
> ~09~player_chose_four.test_pass~panel_016~1_snark=<snark.rfln.greedy:Heh.../Wow, <greedy>./Ha! <greedy>, <greedy>.../Sheesh, <greedy>...>
> ~09~player_chose_four.test_pass~panel_017~1_snark=<snark.rfln.greedy:I knew there was a reason we kept you around./I have to admit, I'm impressed./That's my sly <greedy.mf:fox/vixen/fox>, alright./You'd better hope [i]they[] don't ever find out.>
> ~10~player_chose_four.test_fail~panel_003~1_greedy=Whoa, now!
> ~10~player_chose_four.test_fail~panel_004~1_greedy=This "offering" of yours is clearly cursed!
> ~10~player_chose_four.test_fail~panel_005~1_greedy=Lucky for you we happened to be here!
> ~10~player_chose_four.test_fail~panel_006~1_greedy=We could take it off your... hand. Things.
> ~10~player_chose_four.test_fail~panel_008~1_greedy=<company> are n-nothing if not, um. Selfless.
> ~10~player_chose_four.test_fail~panel_010~1_speech=[darkAqua]Fleshfool.[]
> ~10~player_chose_four.test_fail~panel_011~1_speech=[darkAqua]Thinks it can deceive us.[]
> ~10~player_chose_four.test_fail~panel_012~1_speech=[darkAqua]Thinks the Hills and Forests of Old can't plainly see curses that are or [i]are not[] there.[]
> ~10~player_chose_four.test_fail~panel_013~1_speech=[darkGold]Ksharrr! Humans. Just when you think they're getting somewhere as a species...
> ~10~player_chose_four.test_fail~panel_014~1_speech=[darkAqua] Vacate this place. Before the stink of this [i]rat[] taints it any further.[]
> ~10~player_chose_four.test_fail~panel_015~1_action=[aqua]*sshhhrrrrp!*
> ~10~player_chose_four.test_fail~panel_017~1_snark=<snark.hothead/healer:Trying to bluff up a Hill Guardian, <greedy>? [i]Really??[] /Thank your new appendage that spirit didn't do anything worse!>

### WM-12 Wilderness event: "Into the Woods"

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/wilderness/intotheWoods.properties

**Setup + choices + outcomes — whole file:** (273 words)

> #suppress inspection "UnusedProperty" for whole file
> .blurb=Scouting complete.
> .longName=Into the Woods
> .name=Event
> ~01~prompt~panel_001~1_snark=Well shoot, if it weren't for this Heartwood, <overlandTile> would have been a [i]complete[] waste of time.
> ~01~prompt~panel_001~2_goofball=Rrrk. I forgot how much work actually taking down a tree is.
> ~01~prompt~panel_002~1_snark=Nah, my arms are all wobbly too.
> ~01~prompt~panel_003~1_goofball=You'd think in our line of work, it wouldn't be the most exerting thing we'd do in a day.
> ~01~prompt~panel_004~1_snark=I think it's different muscles from the fighting ones.
> ~01~prompt~panel_004~2_snark=<target> could probably tell you the details.
> ~01~prompt~panel_005~1_goofball=So how about it, are you in the market for a new <snark.whm:spear/bow/staff>?
> ~01~prompt~panel_006~1_goofball=This stuff looks particularly... <snark.whm:unyielding./springy./er, magical.>
> ~01~prompt~panel_007~1_snark=Since when are you an expert?
> ~01~prompt~panel_008~1_goofball=I don't need to be an expert, look at that grain! It's gorgeous!
> ~01~prompt~panel_010~1_goofball=Is it just me, or do the trees seem to be rather close in here?
> ~01~prompt~panel_011~1_goofball=It was not just <goofball.mf:him/her/them>.
> ~01~prompt~panel_011~2_action=[green]Grrrrkkggg...
> ~02~choice_one~panel_001~1_snark=Stand and fight!
> ~03~choice_two~panel_001~1_goofball=Forget the wood! Let's beat it!
> ~04~choice_three~panel_001~1_volunteer=<volunteer> feels a green humming in <volunteer.mf:his/her/their> bones...
> ~05~player_chose_one~panel_001~1_actionLarge=[green]Roarggggh!
> ~06~player_chose_two~panel_001~1_goofball=<goofball.healer/hothead/greedy/60:Okay fine, I'd be mad too, if someone tried to make a <snark.whm:spear/bow/staff> out of my cousin./Urgh, maybe if we had more people.../Urgh, maybe if we had more people.../I'd rather keep my own limbs, thank you.>
> ~07~player_chose_three~panel_002~1_volunteer=[green]Rrrrmmm?
> ~07~player_chose_three~panel_003~1_volunteer=[green]You do not look like a tree. And yet you are... Elmish?
> ~07~player_chose_three~panel_004~1_volunteer=Oh, this? It happened a while ago. I got this mean old splinter, you see? And then—
> ~07~player_chose_three~panel_005~1_volunteer=[green]Hush. There is only a bit of elm. I can barely make out the rest of what you say.
> ~07~player_chose_three~panel_006~1_volunteer=*sniffff*
> ~07~player_chose_three~panel_007~1_volunteer=[green]Your sap runs strong.
> ~07~player_chose_three~panel_007~2_volunteer=[green]Some elm saw something in you.
> ~07~player_chose_three~panel_008~1_volunteer=[green]I trust an elm's judgment.
> ~07~player_chose_three~panel_013.(snark_is_theme_tree)~1_goofball=Did that tree just [i]sniff[] you?
> ~07~player_chose_three~panel_014.(snark_NOT_theme_tree)~1_snark=Did that tree just [i]sniff[] you?

### WM-13 Job cards (the terse "send heroes to do this" strings)

`Source:` https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/job/job_scoutArea.properties and https://raw.githubusercontent.com/adenzu/Wildermyth-Turkish/HEAD/assets/text/effects/job/job_clearInfestation.properties

**Offer/Setup — Scout:** (23 words)

> #suppress inspection "UnusedProperty" for whole file
> .ability.jobNotificationInfo.title=[b]<target>[] has been revealed!
> .blurb=Scout the tile to reveal the terrain and any lurking threats.
> .longName=Scout
> .name=Scout

**Offer/Setup — Patrol:** (31 words)

> #suppress inspection "UnusedProperty" for whole file
> .ability.jobNotificationInfo.title=[b]<target>[] has been cleared of infestation!
> .blurb=Clear out any infestations on this tile
> .longName=Patrol
> .name=Patrol
> .target.participant.promptText=Pick at least three heroes to take out the infestation.

---

## 4. Crusader Kings III  (VIET Events mod, NOT vanilla)

I could not find any repo mirroring vanilla CK3 localization. What follows is from
`cybrxkhan/VIET-Events-for-CK3`, the largest CK3 flavour-event mod; it is written to
vanilla CK3 conventions and uses the vanilla scripted-slot syntax, so the template shape is
representative even though the words are the mod author's. Format is Paradox YAML
localization: `.t` = title, `.desc` = the event body, `.a`/`.b`/`.c`/`.d` = the buttons.
Slots are bracketed script calls — `[ROOT.Char.GetCurrentLocation.GetName]`,
`[drinker.GetFirstName]`, `[scholar.GetSheHe]`, `[ROOT.Char.GetFaith.HighGodName]` — where
the lowercase names are event-scoped characters the engine picked. `\n\n` is a paragraph
break; `#emphasis ...#!` and `#italic ...#!` are inline markup; `$key$` interpolates
another loc key.

---

### CK3-01 Travel event: Food Gone Bad

`Source:` https://raw.githubusercontent.com/cybrxkhan/VIET-Events-for-CK3/HEAD/VIET%20Events/localization/english/viet_travel_events_l_english.yml  (keys `VIETmisc.7001.*`)

**Title:** (4 words)

> $travel_event_prefix$ Food Gone Bad

**Offer/Setup (event description):** (90 words)

> While traveling on the road in [ROOT.Char.GetCurrentLocation.GetName], we discovered to our horror that a number of our food supplies had gone bad. It appears earlier in our trip, the food got mixed with a lot of water by accident, and is now rather moldy.\n\nThere aren't any settlements nearby, so we need to forage and hunt for some food to hold us over, though this will waste time. On the other hand, perhaps we could tough it out, ration out what food we still have, and hurry to the nearest settlements.

**Player option `a`:** (8 words)

> Let's take our time to forage and hunt.

**Player option `b`:** (8 words)

> We'll put up with smaller rations for now.

### CK3-02 Travel event: Caravan Loot

`Source:` https://raw.githubusercontent.com/cybrxkhan/VIET-Events-for-CK3/HEAD/VIET%20Events/localization/english/viet_travel_events_l_english.yml  (keys `VIETmisc.7006.*`)

**Title:** (3 words)

> $travel_event_prefix$ Caravan Loot

**Offer/Setup (event description):** (83 words)

> We come across the remnants of a trading caravan in [ROOT.Char.GetCurrentLocation.GetName]. The arrow-ridden corpses of merchants, guards, and horses, overturned carriages, and ruined merchandise all point to this being some kind of attack by bandits.\n\nAnyways, such dangers on the road aren't unheard of. After we bury the dead, my traveling companions and I debate what should be done with the merchandise which the bandits did not carry off with them. Salvaging these items could be quite lucrative, though it will take some time.

**Player option `a`:** (6 words)

> We'll split the goods among ourselves.

**Player option `b`:** (9 words)

> I'll take the lion's share as is my right.

**Player option `c`:** (7 words)

> We shouldn't steal these from the dead.

**Player option `d`:** (7 words)

> Give it to the region's ruler, [ROOT.Char.GetCurrentLocation.GetTitle.GetDeJureLiege.GetHolder.GetFirstName].

### CK3-03 Travel event: Servant's Death

`Source:` https://raw.githubusercontent.com/cybrxkhan/VIET-Events-for-CK3/HEAD/VIET%20Events/localization/english/viet_travel_events_l_english.yml  (keys `VIETmisc.7010.*`)

**Title:** (3 words)

> $travel_event_prefix$ Servant's Death

**Offer/Setup (event description):** (81 words)

> While traveling through [ROOT.Char.GetCurrentLocation.GetName], one of my close servants passed away. Death from natural causes is not unheard of on these travels, but it is unfortunate nonetheless as the servant was close to me.\n\nRegardless, we have to decide what we will do with the body of the deceased. It would be improper to just dump their corpse on the side of the road, after all, even if they're a servant. We could instead take their body back home for a funeral.

**Player option `a`:** (9 words)

> Dump the corpse on the side of the road.

**Player option `b`:** (8 words)

> Give them a simple but proper burial here.

**Player option `c`:** (10 words)

> Bring them back with us – they deserve no less.

### CK3-04 Travel event: Victims of the Desert

`Source:` https://raw.githubusercontent.com/cybrxkhan/VIET-Events-for-CK3/HEAD/VIET%20Events/localization/english/viet_travel_events_l_english.yml  (keys `VIETmisc.7023.*`)

**Title:** (5 words)

> $travel_event_prefix$ Victims of the Desert

**Offer/Setup (event description):** (86 words)

> In one of the harsher parts of the desert in [ROOT.Char.GetCurrentLocation.GetName], we come across the remains of some travelers who must have passed away not too long ago. May [ROOT.Char.GetFaith.HighGodName] bless these unfortunate souls in the afterlife.\n\nAlas, their fate is not uncommon. Few would doubt the fact that these kinds of deserts are unforgiving. After all, even those experienced with such terrain and conditions could meet their untimely end in such barren terrain if they are unlucky.\n\nWe are fortunate that we still have many supplies left.

**Player option `a`:** (5 words)

> Continue onwards to our destination.

**Player option `b`:** (9 words)

> Take time to give the deceased a proper funeral.

### CK3-05 Travel event: Bad Directions? (a pure-failure outcome event)

`Source:` https://raw.githubusercontent.com/cybrxkhan/VIET-Events-for-CK3/HEAD/VIET%20Events/localization/english/viet_travel_events_l_english.yml  (keys `VIETmisc.7029.*`)

**Title:** (3 words)

> $travel_event_prefix$ Bad Directions?

**Offer/Setup (event description):** (54 words)

> This morning, we asked for directions towards our next destination from one of the locals passing by on the road in [ROOT.Char.GetCurrentLocation.GetName]. I’m not sure now whether we should have.\n\nWe are lost, in other words.\n\nThese directions we were trying to follow…. Were they bad directions to begin with, or did we just misunderstand them?

**Player option `a`:** (6 words)

> Maybe we should go… that way?

### CK3-06 Travel event: Troubled River Crossing (a loss the player must respond to)

`Source:` https://raw.githubusercontent.com/cybrxkhan/VIET-Events-for-CK3/HEAD/VIET%20Events/localization/english/viet_travel_events_l_english.yml  (keys `VIETmisc.7033.*`)

**Title:** (4 words)

> $travel_event_prefix$ Troubled River Crossing

**Offer/Setup (event description):** (100 words)

> While crossing a river in [ROOT.Char.GetCurrentLocation.GetName], some of our supplies came loose and fell into the river. We watched helplessly as the water swept these supplies away. While a lot of our supplies are still with us, thankfully, we still lost quite a bit.\n\nMy companions have different suggestions on what to do. Some say we should go downstream to see if we can recover some of the supplies, especially if they’ve washed ashore; others say we should cut our losses and purchase replacement supplies at the next town. Yet others say we should bear with our misfortune and continue along.

**Player option `a`:** (8 words)

> Try to recover some of our supplies downstream.

**Player option `b`:** (6 words)

> Purchase supplies in the next town.

**Player option `c`:** (8 words)

> Bear with it and continue on our journey.

### CK3-07 Travel event: Helpful Locals (a pure-success outcome event)

`Source:` https://raw.githubusercontent.com/cybrxkhan/VIET-Events-for-CK3/HEAD/VIET%20Events/localization/english/viet_travel_events_l_english.yml  (keys `VIETmisc.7002.*`)

**Title:** (3 words)

> $travel_event_prefix$ Helpful Locals

**Offer/Setup (event description):** (34 words)

> During my travels I came to a rather friendly village in [ROOT.Char.GetCurrentLocation.GetName]. The locals were respectful and kindly gave us supplies. A few members of my traveling caravan were suspicious, but nothing unusual happened.

**Player option `a`:** (5 words)

> Such nice people out there!

### CK3-08 Travel event: A Shortcut (success credited to a named entourage member)

`Source:` https://raw.githubusercontent.com/cybrxkhan/VIET-Events-for-CK3/HEAD/VIET%20Events/localization/english/viet_travel_events_l_english.yml  (keys `VIETmisc.7003.*`)

**Title:** (3 words)

> $travel_event_prefix$ A Shortcut

**Offer/Setup (event description):** (32 words)

> Thanks to [master.GetHerHis] diligent efforts, my caravan master [master.GetTitledFirstName] found a safe shortcut in [ROOT.Char.GetCurrentLocation.GetName], which we could use to reduce the time of our journey by quite a bit. How fortunate!

**Player option `a`:** (2 words)

> Good work!

---

## WHAT I COULD NOT GET

**Battle Brothers**

- The **contract-board listing blurb** (the one-or-two-line summary of a contract as it appears
  in the settlement contract list, before you open negotiations). It is not a `Text` string:
  the `Offer` screen in each contract `.nut` is pure script, and the board line is built at
  runtime from `BulletpointsObjectives` string arrays plus the contract `m.Name`. Closest
  verbatim equivalents I did capture are the objective bullets, e.g. `"Secure " +
  this.Flags.get("DestinationName")` (investigate_cemetery) and `"Hunt for Direwolves,
  Webknechts, Nachzehrers, Hyenas and Serpents"` (big_game_hunt).
- I sampled 10 of ~57 contract files and 20 of ~420 event files. The rest are available at the
  same repo paths if more is wanted; `scripts/events/events/` also has whole named
  sub-families (`civilwar_*`, `greenskins_*`, `undead_*`, `holywar_*`, `anatomist_*`) that I
  did not open at all.
- I could not clone the repo (`git clone` times out; it carries thousands of PNGs), so
  everything was fetched file-by-file over raw.githubusercontent.
- The Nexus "Event Info" mod page and the Steam event-list guides were not consulted: the
  decompiled source is strictly better (it is the shipped text, and it preserves the `|`
  alternate structure that wikis and guides flatten away).

**Fort of Chains**

- The upstream repo is on gitgud.io (`darkofocdw/fort-of-chains`), which I did not reach; I
  used the maintained GitHub fork `Official-Husko/fork-of-chains`. Quest text in the fork is
  the original authors' text, but I cannot certify line-for-line identity with the current
  upstream build.
- Roughly 600 quest files exist. I read 13 and reproduced 10. I deliberately skipped the
  `corrupt/`, `brothel`, `training` and most `questchain/` trees because they are almost
  entirely explicit sexual content; if the study needs more failure/disaster samples the
  `darko/deep/` and `Blueflame451/` trees are the cleanest sources.
- Some quests fold all four grades into a single passage that branches on `$gOutcome`
  (Head Hunter, Crimson Robber, Tomb Raider), so a standalone "failure passage" does not
  exist to quote for them.

**Wildermyth**

- There is no public repo of the vanilla game data. I used `adenzu/Wildermyth-Turkish`, a
  translation project that vendors the shipped English `.properties` files verbatim next to
  its `_tr` files. That gives the exact strings but NOT the `.json`/`.hjson` scene files, so
  I have no visibility into which panel art, triggers, or outcome conditions each line is
  attached to, and no way to tell a "success" branch from a "failure" branch except by the
  key names (`victory_*` / `defeat_*` / `test_pass` / `test_fail`).
- The English files in that repo are from the translation snapshot, so they may lag the
  current game version.
- `assets/text/effects/` holds ~2,500 English files (131 `missionOutcome`, 85 `tidingOutcome`,
  120 `arriveAtSite`, 104 `hook`, 47 `wilderness`...). I reproduced 14.
- Wildermyth has no "contract offer" text in the sense the study wants: jobs are UI cards
  (`.blurb` / `.longName`, one line each — see WM-13) and the prose all lands after the fact.

**Crusader Kings III**

- **No vanilla CK3 text.** I could not find any repo mirroring vanilla
  `localization/english/*_l_english.yml`; GitHub code search requires auth and repo search
  turned up only mod and mod-translation repos. The CK3 section is therefore a MOD
  (VIET Events) and is labelled as such — treat the wording as fan-written, the slot syntax
  as authentic.
- I only pulled `viet_travel_events_l_english.yml` (one of ~20 loc files in that mod).
- CK3 events of this kind have no separate outcome text at all: the description IS the
  outcome, and the buttons are the decision. So there are no CK3 failure passages to quote.

**Darkest Dungeon**

- Nothing. Its quest/town flavour lives in `localization/*.string_table.xml` inside the game
  install; the datamine repos I found (`nickmart819/darkest_dungeon_datamine`,
  `dzerrenner/darkest`, `TheRealMorgenfrue/dd-xml-extractor`) are tooling only and ship no
  extracted text.

**Roadwarden**

- Nothing. It is a closed-source commercial Ren'Py game with no public data dump or
  translation repo that I could locate.

**General**

- GitHub's API was intermittently returning 504/HTML error pages during this session, which
  cost several searches; anything above that says "could not find" means "could not find
  within that constraint", not "does not exist".
- No wiki `api.php?action=parse&prop=wikitext` fetches were needed in the end — every game I
  got had a raw data source, which is strictly better than a wiki transcription.
