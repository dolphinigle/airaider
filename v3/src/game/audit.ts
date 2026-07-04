// State-consistency auditor — the dogfooding tripwire. Checks every structural
// invariant the design implies; any violation is a bug, full stop.

import type { Game } from './game.js';
import { cardType, stackKind, type Card } from '../engine/cards.js';
import { ROOM_TYPE } from '../engine/fort.js';
import { hasTag, CONCEPT, validateTags } from '../engine/tags.js';

export function auditGame(g: Game): string[] {
  const errs: string[] = [];
  const st = g.state;
  const byId = new Map(st.cards.map(c => [c.id, c]));

  // ---- numbers sane ---------------------------------------------------------------
  const numOk = (n: number) => Number.isFinite(n);
  if (!numOk(g.gold()) || g.gold() < 0) errs.push(`gold invalid: ${g.gold()}`);
  if (!numOk(g.prestige()) || g.prestige() < 0) errs.push(`prestige invalid: ${g.prestige()}`);

  // ---- card ↔ slot bijection --------------------------------------------------------
  const slotOwners = new Map<string, string>(); // cardId -> "room:id#i" / "quest:id#i"
  for (const room of st.fort.rooms) {
    room.slots.forEach((cid, i) => {
      if (!cid) return;
      const key = `${cid}`;
      const where = `room:${room.id}#${i}`;
      if (slotOwners.has(key)) errs.push(`card ${cid} in TWO slots: ${slotOwners.get(key)} + ${where}`);
      slotOwners.set(key, where);
      const card = byId.get(cid);
      if (!card) { errs.push(`room slot ${where} references missing card ${cid}`); return }
      const loc = card.location;
      if (loc.kind !== 'room' || loc.roomId !== room.id || loc.slot !== i)
        errs.push(`card ${cid} slotted at ${where} but location says ${JSON.stringify(loc)}`);
    });
  }
  for (const q of st.quests) {
    q.slots.forEach((s, i) => {
      if (!s.filledBy) return;
      const where = `quest:${q.id}#${i}`;
      if (slotOwners.has(s.filledBy)) errs.push(`card ${s.filledBy} in TWO slots: ${slotOwners.get(s.filledBy)} + ${where}`);
      slotOwners.set(s.filledBy, where);
      const card = byId.get(s.filledBy);
      if (!card) { errs.push(`${where} references missing card`); return }
      if (card.location.kind !== 'quest' || card.location.questId !== q.id)
        errs.push(`card ${s.filledBy} assigned at ${where} but location says ${JSON.stringify(card.location)}`);
      if (card.character?.role !== 'merc') errs.push(`${where}: non-merc ${card.id} on a quest`);
    });
  }
  // reverse: location claims a slot → the slot must agree
  for (const c of st.cards) {
    if (c.location.kind === 'room') {
      const room = st.fort.rooms.find(r => r.id === (c.location as { roomId: string }).roomId);
      if (!room) errs.push(`card ${c.id} located in missing room ${JSON.stringify(c.location)}`);
      else if (room.slots[(c.location as { slot: number }).slot] !== c.id)
        errs.push(`card ${c.id} claims ${JSON.stringify(c.location)} but slot holds ${room.slots[(c.location as { slot: number }).slot]}`);
    }
    if (c.location.kind === 'quest') {
      const q = st.quests.find(x => x.id === (c.location as { questId: string }).questId);
      if (!q) errs.push(`card ${c.id} (${c.name}) located on missing quest ${JSON.stringify(c.location)}`);
      else if (q.slots[(c.location as { slot: number }).slot]?.filledBy !== c.id)
        errs.push(`card ${c.id} claims quest slot but the slot disagrees`);
    }
  }

  // ---- card integrity -----------------------------------------------------------------
  const seenIds = new Set<string>();
  for (const c of st.cards) {
    if (seenIds.has(c.id)) errs.push(`duplicate card id ${c.id}`);
    seenIds.add(c.id);
    if (!numOk(c.value)) errs.push(`card ${c.id} value NaN`);
    const v = validateTags(c.tags);
    if (v.length) errs.push(`card ${c.id} (${c.name}) invalid tags: ${v.join('; ')}`);
    const t = cardType(c);
    if (t === 'character') {
      if (!c.character) errs.push(`character card ${c.id} missing character data`);
      else {
        for (const a of ['str', 'dex', 'int', 'cha', 'con'] as const) {
          if (!numOk(c.character.attrs[a]) || c.character.attrs[a] < 0) errs.push(`card ${c.id} attr ${a} invalid`);
        }
        if (c.character.injuryTiers < 0 || !numOk(c.character.injuryTiers)) errs.push(`card ${c.id} injury invalid`);
        if (c.character.level < 1) errs.push(`card ${c.id} level < 1`);
      }
    }
    if (t === 'stackable' && (c.qty === undefined || c.qty < 0)) errs.push(`stackable ${c.id} qty invalid: ${c.qty}`);
    if (t !== 'character' && c.character) errs.push(`non-character ${c.id} carries character data`);
  }

  // ---- staged lists ---------------------------------------------------------------------
  for (const [list, name] of [[st.tavern, 'tavern'], [st.holding, 'holding']] as const) {
    for (const sgd of list) {
      const c = byId.get(sgd.cardId);
      if (!c) { errs.push(`${name} references missing card ${sgd.cardId}`); continue }
      if (c.location.kind !== 'held' || c.location.state !== 'staged')
        errs.push(`${name} card ${sgd.cardId} not in staged state: ${JSON.stringify(c.location)}`);
    }
  }
  // breaking entries point at rack-slotted captives
  for (const b of st.breaking) {
    const c = byId.get(b.cardId);
    if (!c) { errs.push(`breaking references missing card ${b.cardId}`); continue }
    if (c.location.kind !== 'room' || c.location.roomId !== b.roomId)
      errs.push(`breaking card ${b.cardId} not on its rack: ${JSON.stringify(c.location)}`);
    if (hasTag(c.tags, 'obedient')) errs.push(`breaking card ${b.cardId} already obedient`);
  }

  // ---- rooms ---------------------------------------------------------------------------
  const cellSeen = new Set<string>();
  for (const r of st.fort.rooms) {
    const rt = ROOM_TYPE[r.type];
    if (!rt) { errs.push(`room ${r.id} has unknown type ${r.type}`); continue }
    const key = `${r.cell.floor}:${r.cell.col}`;
    if (cellSeen.has(key)) errs.push(`two rooms in cell ${key}`);
    cellSeen.add(key);
    if (!st.fort.cells.some(c => c.floor === r.cell.floor && c.col === r.cell.col))
      errs.push(`room ${r.id} sits in unexcavated cell ${key}`);
    if (rt.species === 'gate' && r.slots.length > 0) errs.push(`pure gate ${r.id} has slots`);
    for (const w of r.wants) {
      if (!CONCEPT[w.match] && !['type', 'gender', 'race', 'personality', 'background', 'body', 'skill', 'standing', 'form', 'style', 'rtrait', 'enchantment', 'kind', 'status'].includes(w.match))
        errs.push(`room ${r.id} wants unknown concept/group '${w.match}'`);
    }
    if (r.ownerId && r.ownerId !== 'you' && !byId.get(r.ownerId)) errs.push(`bedroom ${r.id} owned by missing card ${r.ownerId}`);
  }

  // ---- quests & chains ---------------------------------------------------------------------
  for (const q of st.quests) {
    if (q.state !== 'open') errs.push(`resolved quest ${q.id} still in state.quests`);
    if (q.chainId && !st.chains.some(c => c.id === q.chainId)) errs.push(`quest ${q.id} references missing chain`);
    if (q.approaches) {
      for (const s of q.slots) if (!s.groupId) errs.push(`branched quest ${q.id} has ungrouped slot`);
    }
  }
  for (const ch of st.chains) {
    if (!numOk(ch.bank) || ch.bank < 0) errs.push(`chain ${ch.id} bank invalid: ${ch.bank}`);
    if ((ch.state === 'active' || ch.state === 'finale-pending') && !byId.get(ch.focalId))
      errs.push(`live chain ${ch.id} focal ${ch.focalId} missing from cards`);
  }

  // ---- leads -----------------------------------------------------------------------------
  for (const l of st.leads) {
    if (l.chainInfo.kind === 'continues' && !st.chains.some(c => c.id === (l.chainInfo as { chainId: string }).chainId))
      errs.push(`continuation lead ${l.id} references missing chain`);
  }

  // ---- lore -------------------------------------------------------------------------------
  for (const e of st.lore.edges) {
    if (!st.lore.nodes[e.from] || !st.lore.nodes[e.to]) errs.push(`lore edge ${e.id} endpoint missing`);
    if (!numOk(e.salience) || e.salience < 0 || e.salience > 1) errs.push(`lore edge ${e.id} salience invalid`);
  }

  return errs;
}

/** throw-on-violation wrapper for harness use */
export function assertAudit(g: Game, context: string): void {
  const errs = auditGame(g);
  if (errs.length) throw new Error(`AUDIT FAILED (${context}):\n  ${errs.slice(0, 12).join('\n  ')}${errs.length > 12 ? `\n  …+${errs.length - 12} more` : ''}`);
}
