# scripts/prosebench/agents/w2_v1.txt — n=24

## 1 · contract · a serious matter · 36w
**Sealed Missive**

Riverward steward leans over a desk and signs a sealed letter to bind his patronage. The seal on it is fresh but the paper is old and it must cross the warden stones upriver to Thornhollow.

`JOB:` Escort missive upriver for salvage-rights and coin

`lint:` clean

## 2 · escort · a small, everyday job · 44w
**Beekeeper's Hut**

Beekeeper at the hut beats a hollow drum in the glade and asks this as homage for a lost child. He cannot say what the rider carries and insists the company catch the rider before the crossing and it is owed to the company.

`JOB:` Catch a rider before the crossing for coin and salvage-rights

`lint:` clean

## 3 · hunt · a small, everyday job · 36w
**Unmarked Grave**

Estate broker straightens his collar and demands the grave be moved before sale because it secures his reputation and is worth coin. A buyer waits in his yard and the unmarked grave lies at the lane.

`JOB:` Relocate unmarked grave before sale for payment in coin

`lint:` clean

## 4 · investigate · a serious matter · 48w
**New Thatch**

Forest warden of Yarlea stands on the old elf road and asks that the roof be watched at night because the hamlet trusts their steadiness. There is new thatch on one side only and something scraps in the rafters at dusk which makes this worth a careful squad.

`JOB:` Watch Yarlea church roof at night for coin

`lint:` two-places:road + Yarlea

## 5 · lead-hunt · a small, everyday job · 37w
**Battered Ladle**

A lead-hunt at Ravenbourne stirs a steaming bundle with a battered ladle. They ask the company to carry a message and expect no answer and he does not ask what happens after so it is worth coin.

`JOB:` Carry a sealed message to the Ravenbourne road paid in coin

`lint:` clean

## 6 · raid · a small, everyday job · 41w
**Violet Shrine Lane**

Gatehouse steward leans from the morning gate and presses a grievance asking the company to take a stranger followed home. He already knows which lane and the stranger keeps touching the violet shrine and this is a petty matter worth coin

`JOB:` Remove the stranger from the lane paid in coin

`lint:` ambiguous-closer:steward/stranger — closer opens "He"

## 7 · contract · a serious matter · 41w
**New Marking Iron**

Hawwell foster-mother binds a calf before dawn and asks that calves be marked so her niece may claim it. The marking iron is new and she clutches a carved trinket and smiles and this is worth little beyond the trinket's joy.

`JOB:` Mark the calves for salvage rights and coin

`lint:` clean

## 8 · escort · a small, everyday job · 35w
**Landing Watch**

Boatwarden stands on the bank smoking and asks for a watch because their oath binds them. The boat sits at the landing with its cargo removed and an anvil set where the last crate lay.

`JOB:` Guard the boat at the landing for salvage rights and coin

`lint:` clean

## 9 · hunt · a grave affair · 49w
**Shed Tools**

A shipmaster leans on the quay, counting names into a cramped ledger. She wants the company to find her husband and bring him home with his reputation intact. She has already moved his tools out of the shed and will insist on salvage rights if he is not returned.

`JOB:` Search the ford for her husband paid in coin and salvage rights

`lint:` account-book

## 10 · investigate · a small, everyday job · 48w
**Warden Stone Moved**

Forest warden stands at the ridgeline and asks the company to settle a boundary to preserve the wardenship's honor. The warden-stone has been moved recently and the grass beneath it is still green, and the warden has already given up this claim, worth mostly coin and little glory.

`JOB:` Settle disputed boundary at ridge and collect coin.

`lint:` clean

## 11 · lead-hunt · a serious matter · 33w
**Smudged Chart**

Elmholt sergeant studies a smudged chart and asks the mine reopened to feed the town. The last crew's tools are still down there and the chart names rival causes that both hold truth.

`JOB:` Reopen Elmholt mine and recover tools for coin

`lint:` clean

## 12 · raid · a small, everyday job · 45w
**Forest Lockbox**

A tenant farmer kneels at Yarbourne gate and confesses. He says the sealed chest will keep the village from drought and the key is with a man he will not name and the lock must be opened without the key which is worth the pay.

`JOB:` Open a locked chest for salvage rights and coin

`lint:` ambiguous-closer:tenant/farmer — closer opens "He"

## 13 · contract · a serious matter · 34w
**Dowry Chest**

Merchant's daughter stands by the bed and insists the company recover her dowry. The chest it came in still sits in her room and the magistrate claims kinship over it which makes this dangerous.

`JOB:` Recover dowry chest from magistrate for salvage rights and coin.

`lint:` clean

## 14 · escort · a small, everyday job · 37w
**Short Rope Well**

Warden of Yarstead kneels beside a stone well. They ask that the well be capped to protect village rites and preserve the warden's standing and the rope has been cut off short and this is worth coin.

`JOB:` Cap a forest well and receive coin

`lint:` clean

## 15 · hunt · a grave affair · 44w
**Barrow Lamp**

Tracker from Woldgill stands on the lane holding a lamp. They want the lamp carried to the barrow to reclaim a family name. He stops at the field gate and waits and this is a thing he has done before and not learned from.

`JOB:` Escort tracker to the barrow paid in salvage rights and coin

`lint:` clean

## 16 · investigate · a small, everyday job · 42w
**Harrowhollow Woodpile**

Charcoal-master of Harrowhollow kneels at the woodpile to keep an old bargain intact. He points to the far pile and says which end to start, and a carved carp bone bracelet lies on the topmost log worth only salvage rights and coin.

`JOB:` Search the woodpile for hidden goods for salvage rights and coin

`lint:` stem-collision:charcoal-master ~ charcoal / charcoal-master ~ master

## 17 · lead-hunt · a small, everyday job · 32w
**Oakmere Hound**

Huntwarden of Oakmere straps on boots and studies the trail. They ask the company to keep a hound from the hunt, the hound belongs to someone else, and this is worth coin.

`JOB:` Keep a hound from the hunt paid in coin

`lint:` clean

## 18 · raid · a grave affair · 47w
**Spoil Heap Pit**

River-warden at Nethergill stands on the ford and points downstream. They ask the pit filled to keep the crossing dignified and safe. The spoil heap beside it is smaller than the hole and the bottom drops into dark water and that makes this worth every hand sent.

`JOB:` Fill the pit before rains; payment in salvage-rights and coin

`lint:` two-places:river/ford + Nethergill · stem-collision:river-warden ~ river / river-warden ~ warden

## 19 · contract · a small, everyday job · 36w
**Bramworth Bridge Watch**

A ferryman polishes Bramworth Bridge planks while he says he protects honoured travellers. A painted toll board hangs from the rail and he will accept secret coin for silence, this is a low risk paid watch.

`JOB:` Guard Bramworth Bridge and report, paid in coin

`lint:` clean

## 20 · escort · a small, everyday job · 41w
**Churchyard Watch**

Dewbrook curate kneels beneath the yew and asks the company to watch the churchyard because the parish trusts their discretion. A candlelit lantern hangs from the lychgate and his own man holds the other key, a task barely worth the coin.

`JOB:` Watch Dewbrook churchyard for salvage rights and coin

`lint:` clean

## 21 · hunt · a serious matter · 41w
**Darned Staff Crossing**

The hunter at Dewcroft props a lamp and says the crossing must be kept lit. A heavy pouch of coin sits nameless on the table while a man with a darned staff waits at the crossing, worth the company's guarded attention.

`JOB:` Keep the crossing lamp lit, paid in coin

`lint:` clean

## 22 · investigate · a small, everyday job · 31w
**Shipmaster's List**

A shipmaster brags at Ashhollow's old elf road and asks silence to protect his reputation. The folded list rests in his hand and the name to be struck is his namesake

`JOB:` Keep a name off a registry. Paid in coin

`lint:` two-places:road + Ashhollow

## 23 · lead-hunt · a serious matter · 55w
**Gravestone Tally**

Toll-keeper at Hawstead sorts coins into small, neat piles now. He asks the company to count the tolls for a day to prove his scrupulous records while he stands where he cannot see the road beside a mossed gravestone he uses for tallies and his habit has become a compulsion and this is delicate work.

`JOB:` Count a day's tolls and report back paid in coin

`lint:` two-places:road + Hawstead · stem-collision:toll-keeper ~ keeper

## 24 · raid · a serious matter · 37w
**Apothecary's Cellar Count**

An apothecary friend stands at the gate with a weathered list and asks the cellar be counted to protect their stock. The cellar's traps hang unset and the friend waits for an apprentice who will not come.

`JOB:` Count rats in apothecary cellar and report. Paid in coin.

`lint:` clean
