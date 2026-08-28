// Is the band a player reads on a CHAIN lead telling them the truth? leadBand() prices the bonus
// against a ONE-OFF quest (ECONOMY §7.2); a starts-new lead opens a SAGA worth far more.
import { leadBand, type Lead } from '../src/engine/quests.js';
import { rollChainShape } from '../src/engine/chains.js';
import { chainPayoff, vBase, RARITY_MULT } from '../src/engine/economy.js';

import { Rng } from '../src/engine/rng.js';
const rng = new Rng(11);
console.log('lvl rar        bonus  band shown          one-off worth   saga payoff   true ratio');
for (const [lvl, rar] of [[2,'common'],[3,'uncommon'],[4,'uncommon'],[5,'rare'],[6,'rare']] as const) {
  for (const mult of [0.3, 0.8, 1.6]) {
    const oneOff = vBase(lvl) * RARITY_MULT[rar] * 1.5;
    const bonus = Math.round(oneOff * mult);
    const l = { id:'x', rarity: rar, level: lvl, region:'forests', archetype:'investigate',
      chainInfo:{kind:'starts-new'}, expiresAtCycle:null, source:'reward', bonus } as unknown as Lead;
    const b = leadBand(l);
    const { beats } = rollChainShape(rng, rar);
    const saga = chainPayoff(beats, lvl, rar);
    console.log(`${lvl}   ${rar.padEnd(9)} ${String(bonus).padStart(5)}  ${b.stars} ${b.label.padEnd(16)} ${oneOff.toFixed(0).padStart(8)}  ${saga.toFixed(0).padStart(11)}   ${(bonus/saga).toFixed(2).padStart(9)}`);
  }
}
