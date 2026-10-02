
### plan (12 items, 24 judgings)

| model | strict follow | parts partial / no | read (1-10) | breaks per text | mean rank | ranked first |
|---|---|---|---|---|---|---|
| gpt | 0% | 41 / 30 | 3.71 | 5.12 | 2.67 | 0% |
| haiku | 0% | 50 / 18 | 4.08 | 6.33 | 2.33 | 0% |
| sonnet | 38% | 15 / 0 | 7.83 | 2.38 | 1.00 | 100% |
- haiku − gpt, strict follow: +0.00 [+0.00, +0.00]
- haiku − gpt, read: +0.38 [-0.21, +0.96]
- haiku − gpt, rank (lower = better): -0.33 [-0.75, +0.08]
- sonnet − gpt, strict follow: +37.50 [+12.50, +66.67] **sig**
- sonnet − gpt, read: +4.12 [+3.79, +4.50] **sig**
- sonnet − gpt, rank (lower = better): -1.67 [-1.88, -1.46] **sig**

### card (32 items, 64 judgings)

| model | strict follow | parts partial / no | read (1-10) | breaks per text | mean rank | ranked first |
|---|---|---|---|---|---|---|
| gpt | 38% | 44 / 2 | 5.45 | 2.58 | 2.55 | 6% |
| haiku | 48% | 41 / 2 | 6.52 | 2.55 | 2.16 | 22% |
| sonnet | 78% | 14 / 0 | 7.36 | 1.08 | 1.30 | 72% |
- haiku − gpt, strict follow: +10.94 [-12.50, +34.38]
- haiku − gpt, read: +1.06 [+0.62, +1.53] **sig**
- haiku − gpt, rank (lower = better): -0.39 [-0.83, +0.05]
- sonnet − gpt, strict follow: +40.62 [+21.88, +59.38] **sig**
- sonnet − gpt, read: +1.91 [+1.53, +2.28] **sig**
- sonnet − gpt, rank (lower = better): -1.25 [-1.50, -0.95] **sig**

### report (28 items, 56 judgings)

| model | strict follow | parts partial / no | read (1-10) | breaks per text | mean rank | ranked first |
|---|---|---|---|---|---|---|
| gpt | 16% | 61 / 1 | 5.09 | 3.27 | 2.62 | 5% |
| haiku | 54% | 35 / 0 | 6.23 | 3.07 | 2.16 | 12% |
| sonnet | 89% | 7 / 0 | 7.55 | 1.79 | 1.21 | 82% |
- haiku − gpt, strict follow: +37.50 [+16.07, +58.93] **sig**
- haiku − gpt, read: +1.14 [+0.55, +1.70] **sig**
- haiku − gpt, rank (lower = better): -0.46 [-0.80, -0.07] **sig**
- sonnet − gpt, strict follow: +73.21 [+58.93, +85.71] **sig**
- sonnet − gpt, read: +2.46 [+2.05, +2.86] **sig**
- sonnet − gpt, rank (lower = better): -1.41 [-1.66, -1.11] **sig**

### all (72 items, 144 judgings)

| model | strict follow | parts partial / no | read (1-10) | breaks per text | mean rank | ranked first |
|---|---|---|---|---|---|---|
| gpt | 23% | 146 / 33 | 5.02 | 3.27 | 2.60 | 5% |
| haiku | 42% | 126 / 20 | 6.00 | 3.38 | 2.19 | 15% |
| sonnet | 76% | 36 / 0 | 7.51 | 1.57 | 1.22 | 81% |
- haiku − gpt, strict follow: +19.44 [+5.56, +33.33] **sig**
- haiku − gpt, read: +0.98 [+0.66, +1.31] **sig**
- haiku − gpt, rank (lower = better): -0.41 [-0.67, -0.16] **sig**
- sonnet − gpt, strict follow: +52.78 [+40.97, +64.58] **sig**
- sonnet − gpt, read: +2.49 [+2.20, +2.79] **sig**
- sonnet − gpt, rank (lower = better): -1.38 [-1.54, -1.21] **sig**

Judge agreement on first place (two judges, different letter orders): 92% of 72 items (chance 33%).

gpt breaks (471), sample: Belardirwe introduced without her label | answer only half-revealed ('widow's deed now stood beyond creditors') | pastes data phrase 'Creditors' captain and men' | before hints at the ledger's worth | Belardirwe introduced without her label | pastes data phrase 'Creditors' captain and men' | answer only hinted ('widow's deed now stood beyond creditors'), not plainly revealed | garbled 'pointed the safe paths and the ledger's worth' | summary says the widow's tenancy, data say Indure's livelihood | cast ids in job text | wins paste the kind label ('someone is found') | a number ('two hired constables') | settles is a conditional reading, not a done fact | pitch near-pastes the seed

haiku breaks (487), sample: Indure lodges the ledger; data say the company did | summary contradicts after on who lodged the ledger | deed reveal tangled with ledger causality | repeats card's threat to bind the widow | Indure lodges the ledger, data says the company did | before repeats the card (shackles and writs, bind the widow) | id 'c84' shown in pitch and question | pitch states no first job and no armed opposition | pitch reveals the answer (shields her brother) | pitch near-pastes the seed | c84's house moves Marlmarch to Duncroft | ep2 trouble is fear, not armed people | question is yes/no and answer guessable | id 'c84' in the pitch and the question

sonnet breaks (226), sample: answer (widow's elven deed) never revealed | summary over 25 words (27) | answer (the widow's elven deed) never revealed | summary over 25 words (27) | answer self-contradicts (buries own brother yet takes him for Gaddan) | drops the seed's betrothal thread | drops the seed's betrothed and marriage | answer contradicts itself (buries her own brother yet 'took him for the peddler') | answer revealed in episodes 2-3 before the showdown | answer revealed at ep2/ep3, not the showdown | logic snag: the stone moves toward her door yet the hunter blames the woodcutter | repeats the card's hanged-man scrap | before repeats the card's hanged-man paper | number in pitch ('Three kilns')
