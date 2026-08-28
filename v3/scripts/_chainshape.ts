// How a SAGA proportions its reward, against the one-off's archetype split.
import { Rng } from '../src/engine/rng.js';
import { newChainEconomy, beatSideLoot, type Chain } from '../src/engine/chains.js';
import { vBase, RARITY_MULT, incomeScale, type Rarity } from '../src/engine/economy.js';

const rng = new Rng(8080);
console.log('a saga at each rarity — where its value sits (level 3, party of 2, all beats succeed)\n');
for (const rarity of ['common', 'uncommon', 'rare'] as Rarity[]) {
  let payoff = 0, focal = 0, beats = 0, side = 0, bank = 0, n = 0;
  for (let i = 0; i < 4000; i++) {
    const eco = newChainEconomy(rng, 3, rarity);
    const chain = { level: 3, rarity } as Chain;
    let s = 0;
    for (let b = 0; b < eco.beats; b++) s += beatSideLoot(rng, chain);
    const earned = eco.beats * 2 * vBase(3) * RARITY_MULT[rarity] - s;   // party of 2, all success
    payoff += eco.payoff; focal += eco.focalTarget; beats += eco.beats; side += s; bank += earned; n++;
  }
  const f = (x: number) => Math.round(x / n);
  const surplus = Math.max(0, f(bank) - f(focal));
  console.log(`${rarity.padEnd(9)} beats ${(beats / n).toFixed(1)}  payoff ${String(f(payoff)).padStart(4)}  ` +
    `focal ${String(f(focal)).padStart(4)} (${Math.round(100 * focal / payoff)}% of payoff)  ` +
    `side-loot total ${String(f(side)).padStart(3)}  bank ${String(f(bank)).padStart(4)}  → surplus gold ${surplus}`);
}
console.log('\nper-beat side loot at level 3:');
for (const rarity of ['common', 'uncommon', 'rare'] as Rarity[]) {
  let t = 0; const chain = { level: 3, rarity } as Chain;
  for (let i = 0; i < 4000; i++) t += beatSideLoot(rng, chain);
  console.log(`  ${rarity.padEnd(9)} ${Math.round(t / 4000)}g per beat   (a beat's own banked earn, party of 2: ${Math.round(2 * vBase(3) * RARITY_MULT[rarity])})`);
}
console.log(`\nfor comparison a one-off at level 3 common 2-slot is worth about ${Math.round(vBase(3) * RARITY_MULT.common * 2)}`);
console.log(`incomeScale(3) = ${incomeScale(3).toFixed(2)} — gold is deflated, units are not`);
