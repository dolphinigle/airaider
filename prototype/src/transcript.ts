import type { ScenarioResolution } from './resolver.js';

const BAR = '═══════════════════════════════════════════════════════════════';

export function renderTranscript(r: ScenarioResolution): string {
  const lines: string[] = [];
  lines.push(BAR);
  lines.push(` SCENARIO: ${r.title}  [${r.archetype}]`);
  lines.push(` Target: ${r.target}`);
  lines.push(BAR);
  lines.push('');
  lines.push('PARTY:');
  for (const sc of r.slotContributions) {
    const c = r.contributions.find((x) => x.mercId === sc.mercId);
    const tagStr = sc.tagsMatched.length ? ` +tags:${sc.tagsMatched.join(',')}` : '';
    const attrStr = sc.attrUsed ? ` ${sc.attrUsed}=${sc.attrScore}` : '';
    const fatStr =
      sc.fatiguePenalty > 0
        ? ` [fatigued ${sc.fatigue}, −${sc.fatiguePenalty}]`
        : sc.fatigue > 0
        ? ` [fatigue ${sc.fatigue}]`
        : '';
    const tierStr =
      sc.tierBonus > 0 ? ` [${sc.tier}, +${sc.tierBonus}]` : '';
    const coinPlural = sc.coinsContributed === 1 ? 'coin' : 'coins';
    lines.push(
      `  • ${sc.mercId} → slot:${sc.slotId}${attrStr}${tagStr}${fatStr}${tierStr} (${sc.coinsContributed} ${coinPlural})`,
    );
    if (c) lines.push(`      "${c.line}"`);
  }
  lines.push('');
  if (r.synergy.bonusCoins > 0) {
    const pairStrs = r.synergy.pairs.map(
      (p) => `${p.mercA}+${p.mercB} share ${p.sharedTagId}`,
    );
    lines.push(`SYNERGY:   +${r.synergy.bonusCoins} (${pairStrs.join('; ')})`);
  }
  const coinPlural = r.coinsActual === 1 ? 'coin' : 'coins';
  if (r.approachLabel) {
    lines.push(`APPROACH:  ${r.approachLabel}  (${r.approachId})`);
  }
  lines.push(`COIN POOL: ${r.coinsActual} ${coinPlural} (budget ${r.baseCoinBudget})`);
  lines.push(
    `FLIP:      ${r.rollFaces.map((f) => (f === 'heads' ? 'H' : 'T')).join(' ')}   → ${r.heads}H ${r.tails}T`,
  );
  lines.push(`BAND:      ${r.band.toUpperCase()}  (${r.bandReason})`);
  lines.push('');
  lines.push('OUTCOME:');
  lines.push(`  ${r.outcomeNarrative}`);
  if (r.reputationDeltas.length > 0) {
    lines.push('');
    lines.push('REPUTATION:');
    for (const d of r.reputationDeltas) {
      const sign = d.delta > 0 ? '+' : '';
      lines.push(`  ${d.factionId}: ${sign}${d.delta}`);
    }
  }
  lines.push('');
  lines.push(`[narrated by ${r.llmName}]`);
  lines.push(BAR);
  return lines.join('\n');
}
