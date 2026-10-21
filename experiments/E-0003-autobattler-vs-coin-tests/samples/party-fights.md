# Party autobattle sample fights (partysim.mjs)

Same seed (3), same party (Brann, Atlas, Mira, Oswin) vs the Ogre; only the tactics differ.

## Simple tactics (healer heals below 50%, everyone hits the weakest)
```
PARTY Brann (warrior) · Atlas (warrior) · Mira (mage) · Oswin (healer)   TACTICS simple   vs Ogre
R1
  Atlas Sword → Ogre ○●●● 2
  Mira Firebolt → Ogre ○●●●● 3
  Brann Axe → Ogre ○●●○● 2
  Oswin Mace → Ogre ○○ 0
  Ogre → Brann 5 blocked ○●○ 1 = −4  Brann ♥♥♥♥♥♥♥♥····
R2
  Atlas Sword → Ogre ○○○● 0
  Mira Firebolt → Ogre ○●○○● 1
  Brann Axe → Ogre ○●●○● 2
  Oswin Mace → Ogre ●● 1
  Ogre → Atlas 5 blocked ○ 0 = −5  Atlas ♥♥♥♥♥·····
R3
  Atlas Sword → Ogre ○○○○ 0
  Mira Firebolt → Ogre ●●○○● 2
  Brann Axe → Ogre ●●○○○ 1
  Oswin Mace → Ogre ○● 0
  Ogre → Atlas 5 blocked ○ 0 = −5  Atlas DOWN
R4
  Mira Firebolt → Ogre ●○○○○ 0
  Brann Axe → Ogre ○○●●○ 1
  Oswin Mace → Ogre ○● 0
  Ogre → Brann 5 blocked ●●○ 2 = −3  Brann ♥♥♥♥♥·······
R5
  Mira Firebolt → Ogre ○●○●○ 1
  Brann Axe → Ogre ○○○●● 1
  Oswin Heal → Brann ●○○○○ +1  Brann ♥♥♥♥♥♥······
  Ogre → Brann 5 blocked ○○○ 0 = −5  Brann ♥···········
R6
  Mira Firebolt → Ogre ○○●○○ 0
  Brann Axe → Ogre ●○●○○ 1
  Oswin Heal → Brann ●○●○● +3  Brann ♥♥♥♥········
  Ogre → Brann 5 blocked ○●○ 1 = −4  Brann DOWN
R7
  Mira Firebolt → Ogre ●●○○● 2
  Oswin Mace → Ogre ●● 1
  Ogre → Oswin 5 blocked ○ 0 = −5  Oswin ♥♥♥·····
R8
  Mira Firebolt → Ogre ○○○●● 1
  Oswin Heal → Oswin ●○○○○ +1  Oswin ♥♥♥♥····
  Ogre → Mira 5 = −5  Mira ♥·····
R9
  Mira Firebolt → Ogre ○●○●● 2
  Oswin Heal → Mira ●●○●○ +3  Mira ♥♥♥♥··
  Ogre → Mira 5 = −5  Mira DOWN
R10
  Oswin Mace → Ogre ●○ 0
  Ogre → Oswin 5 blocked ● 1 = −4  Oswin DOWN
PARTY DOWN in 10 rounds · Brann DOWN · Atlas DOWN · Mira DOWN · Oswin DOWN
```

## Tuned tactics (healer always heals)
```
PARTY Brann (warrior) · Atlas (warrior) · Mira (mage) · Oswin (healer)   TACTICS custom   vs Ogre
R1
  Atlas Sword → Ogre ○●●● 2
  Mira Firebolt → Ogre ○●●●● 3
  Brann Axe → Ogre ○●●○● 2
  Oswin Heal → Brann ○○●○● +2  Brann ♥♥♥♥♥♥♥♥♥♥♥♥
  Ogre → Atlas 5 blocked ○ 0 = −5  Atlas ♥♥♥♥♥·····
R2
  Atlas Sword → Ogre ○○●○ 0
  Mira Firebolt → Ogre ●○○●○ 1
  Brann Axe → Ogre ●●○●● 3
  Oswin Heal → Atlas ●○○○○ +1  Atlas ♥♥♥♥♥♥····
  Ogre → Atlas 5 blocked ○ 0 = −5  Atlas ♥·········
R3
  Atlas Sword → Ogre ●●○○● 2 (GRUFF +1)
  Mira Firebolt → Ogre ●●○○○ 1
  Brann Axe → Ogre ○●○○● 1
  Oswin Heal → Atlas ○○○○○ +0  Atlas ♥·········
  Ogre → Atlas 5 blocked ● 1 = −4  Atlas DOWN
R4
  Mira Firebolt → Ogre ●○○●○ 1
  Brann Axe → Ogre ●●○○● 2
  Oswin Heal → Brann ○●○○○ +1  Brann ♥♥♥♥♥♥♥♥♥♥♥♥
  Ogre → Brann 5 blocked ●●● 3 = −2  Brann ♥♥♥♥♥♥♥♥♥♥··
R5
  Mira Firebolt → Ogre ○○○○○ 0
  Brann Axe → Ogre ○○○○○ 0
  Oswin Heal → Brann ●○○●○ +2  Brann ♥♥♥♥♥♥♥♥♥♥♥♥
  Ogre → Brann 5 blocked ○○● 1 = −4  Brann ♥♥♥♥♥♥♥♥····
R6
  Mira Firebolt → Ogre ○●○●● 2
  Brann Axe → Ogre ○●○●● 2
  Oswin Heal → Brann ○○●●● +3  Brann ♥♥♥♥♥♥♥♥♥♥♥·
  Ogre → Brann 5 blocked ○○○ 0 = −5  Brann ♥♥♥♥♥♥······
R7
  Mira Firebolt → Ogre ○●●●○ 2
  Brann Axe → Ogre ○○○●○ 0
  Oswin Heal → Brann ●○●●● +4  Brann ♥♥♥♥♥♥♥♥♥♥··
  Ogre → Brann 5 blocked ○●○ 1 = −4  Brann ♥♥♥♥♥♥······
R8
  Mira Firebolt → Ogre ●●○●● 3
  Brann Axe → Ogre ●○●●● 3
  Oswin Heal → Brann ●○○○● +2  Brann ♥♥♥♥♥♥♥♥····
  Ogre → Brann 5 blocked ●●● 3 = −2  Brann ♥♥♥♥♥♥······
R9
  Mira Firebolt → Ogre ●●●●○ 3
  Brann Axe → Ogre ●●○○○ 1
  Oswin Heal → Brann ●●●●○ +4  Brann ♥♥♥♥♥♥♥♥♥♥··
  Ogre → Brann 5 blocked ●●○ 2 = −3  Brann ♥♥♥♥♥♥♥·····
R10
  Mira Firebolt → Ogre ●○●○○ 1
  Brann Axe → Ogre ●○●●● 3
  Oswin Heal → Brann ●○○○○ +1  Brann ♥♥♥♥♥♥♥♥····
  Ogre → Brann 5 blocked ○○○ 0 = −5  Brann ♥♥♥·········
R11
  Mira Firebolt → Ogre ○●○○○ 0
  Brann Axe → Ogre ●●○●○ 2
  Oswin Heal → Brann ○●○○● +2  Brann ♥♥♥♥♥·······
  Ogre → Brann 5 blocked ○○● 1 = −4  Brann ♥···········
R12
  Mira Firebolt → Ogre ○●○●● 2  OGRE FALLS
WON, AT A COST in 12 rounds · Brann 1/12 · Atlas DOWN · Mira 6/6 · Oswin 8/8
```

## Cult (foe healer): brute party cannot reach the priest
```
PARTY Brann (warrior) · Atlas (warrior) · Kael (warrior) · Oswin (healer)   TACTICS simple   vs Cultist 1, Cultist 2, Blood Priest
R1
  Atlas Sword → Cultist 1 ○●●● 2
  Kael Spear → Cultist 1 ●○●○ 1
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ○○○●○ 0
  Cultist 1 → Kael 2 blocked ○○ 0 = −2  Kael ♥♥♥♥♥♥♥♥♥··
  Cultist 2 → Atlas 2 blocked ● 1 = −1  Atlas ♥♥♥♥♥♥♥♥♥·
  Oswin Mace → Cultist 1 ○○ 0
R2
  Atlas Sword → Cultist 1 ○●●○ 1
  Kael Spear → Cultist 1 ●○○● 1
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ●●●○○ 2
  Cultist 1 → Brann 2 blocked ○●● 2 = −0  Brann ♥♥♥♥♥♥♥♥♥♥♥♥
  Cultist 2 → Atlas 2 blocked ● 1 = −1  Atlas ♥♥♥♥♥♥♥♥··
  Oswin Mace → Cultist 1 ○● 0
R3
  Atlas Sword → Cultist 1 ○●○○ 0
  Kael Spear → Cultist 1 ○●●○ 1
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ●●○○● 2
  Cultist 1 → Atlas 2 blocked ○ 0 = −2  Atlas ♥♥♥♥♥♥····
  Cultist 2 → Kael 2 blocked ○○ 0 = −2  Kael ♥♥♥♥♥♥♥····
  Oswin Mace → Cultist 1 ●○ 0
R4
  Atlas Sword → Cultist 1 ●●○● 2
  Kael Spear → Cultist 1 ●○○○ 0
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ●●○○○ 1
  Cultist 1 → Brann 2 blocked ○○● 1 = −1  Brann ♥♥♥♥♥♥♥♥♥♥♥·
  Cultist 2 → Kael 2 blocked ○● 1 = −1  Kael ♥♥♥♥♥♥·····
  Oswin Mace → Cultist 1 ○● 0
R5
  Atlas Sword → Cultist 1 ○○●● 1
  Kael Spear → Cultist 1 ●●●○ 2
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ●○○○● 1
  Cultist 1 → Atlas 2 blocked ○ 0 = −2  Atlas ♥♥♥♥······
  Cultist 2 → Kael 2 blocked ●○ 1 = −1  Kael ♥♥♥♥♥······
  Oswin Heal → Atlas ○○○○○ +0  Atlas ♥♥♥♥······
R6
  Atlas Sword → Cultist 1 ●○○●● 2 (GRUFF +1)
  Kael Spear → Cultist 1 ○●○○ 0
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ●○●○○ 1
  Cultist 1 → Brann 2 blocked ○●○ 1 = −1  Brann ♥♥♥♥♥♥♥♥♥♥··
  Cultist 2 → Atlas 2 blocked ○ 0 = −2  Atlas ♥♥········
  Oswin Heal → Atlas ●○●●○ +3  Atlas ♥♥♥♥♥·····
R7
  Atlas Sword → Cultist 1 ○●●○ 1
  Kael Spear → Cultist 1 ●○●● 2
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ○●○●○ 1
  Cultist 1 → Kael 2 blocked ○○ 0 = −2  Kael ♥♥♥········
  Cultist 2 → Atlas 2 blocked ● 1 = −1  Atlas ♥♥♥♥······
  Oswin Heal → Kael ○○●●● +3  Kael ♥♥♥♥♥♥·····
R8
  Atlas Sword → Cultist 1 ○○○●○ 0 (GRUFF +1)
  Kael Spear → Cultist 1 ○○●● 1
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ○●●○○ 1
  Cultist 1 → Atlas 2 blocked ○ 0 = −2  Atlas ♥♥········
  Cultist 2 → Atlas 2 blocked ○ 0 = −2  Atlas DOWN
  Oswin Mace → Cultist 1 ●● 1
R9
  Kael Spear → Cultist 1 ○●●● 2
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ●○○●○ 1
  Cultist 1 → Brann 2 blocked ○○● 1 = −1  Brann ♥♥♥♥♥♥♥♥♥···
  Cultist 2 → Brann 2 blocked ○○○ 0 = −2  Brann ♥♥♥♥♥♥♥·····
  Oswin Mace → Cultist 1 ●● 1
R10
  Kael Spear → Cultist 1 ○○○○ 0
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ○○○○○ 0
  Cultist 1 → Kael 2 blocked ●○ 1 = −1  Kael ♥♥♥♥♥······
  Cultist 2 → Kael 2 blocked ○○ 0 = −2  Kael ♥♥♥········
  Oswin Heal → Kael ○○●○○ +1  Kael ♥♥♥♥·······
R11
  Kael Spear → Cultist 1 ○○●● 1
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ○●●○○ 1
  Cultist 1 → Kael 2 blocked ●● 2 = −0  Kael ♥♥♥♥·······
  Cultist 2 → Brann 2 blocked ○○○ 0 = −2  Brann ♥♥♥♥♥·······
  Oswin Heal → Kael ○○○○○ +0  Kael ♥♥♥♥·······
R12
  Kael Spear → Cultist 1 ○●○○ 0
  Blood Priest mends Cultist 1 +3
  Brann Axe → Cultist 1 ●●●●● 4
  Cultist 1 → Brann 2 blocked ●○○ 1 = −1  Brann ♥♥♥♥········
  Cultist 2 → Brann 2 blocked ○●○ 1 = −1  Brann ♥♥♥·········
  Oswin Heal → Brann ●●○○● +3  Brann ♥♥♥♥♥♥······
STALEMATE: THE PARTY FALLS BACK in 12 rounds · Brann 6/12 · Atlas DOWN · Kael 4/11 · Oswin 8/8
```
