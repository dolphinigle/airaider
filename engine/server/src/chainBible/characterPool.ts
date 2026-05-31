// CharacterPoolService — central registry of every character the AI knows about.
//
// All entities (mercenaries, captives, NPCs, the dead) live in ONE map.
// role distinguishes them. Promotions just change role.

import { readFileSync, writeFileSync, existsSync } from 'fs';

export type CharacterRole = 'mercenary' | 'captive' | 'npc' | 'landmark' | 'dead';

export interface PoolCharacter {
  id: string;
  name: string;
  region: string;
  role: CharacterRole;
  tags: string[];
  surface: string;
  want: string;
  need: string;
  ghost: string;
  lie: string;
  secret: string;
  arcState: string;
  introducedDay: number;
  lastSeenDay: number;
  appearedInChainIds: string[];
}

export class CharacterPool {
  private chars = new Map<string, PoolCharacter>();
  private path: string | null = null;

  load(path: string): void {
    this.path = path;
    if (!existsSync(path)) return;
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as PoolCharacter[];
    for (const c of raw) this.chars.set(c.id, c);
  }

  save(): void {
    if (!this.path) return;
    writeFileSync(this.path, JSON.stringify([...this.chars.values()], null, 2));
  }

  add(c: PoolCharacter): void {
    if (this.chars.has(c.id)) throw new Error(`duplicate character id ${c.id}`);
    this.chars.set(c.id, c);
    this.save();
  }

  get(id: string): PoolCharacter | undefined {
    return this.chars.get(id);
  }

  all(): PoolCharacter[] {
    return [...this.chars.values()];
  }

  updateArcState(id: string, newState: string, day: number, chainId: string): void {
    const c = this.chars.get(id);
    if (!c) throw new Error(`updateArcState: unknown id ${id}`);
    c.arcState = newState;
    c.lastSeenDay = day;
    if (!c.appearedInChainIds.includes(chainId)) c.appearedInChainIds.push(chainId);
    this.save();
  }

  setRole(id: string, role: CharacterRole): void {
    const c = this.chars.get(id);
    if (!c) throw new Error(`setRole: unknown id ${id}`);
    c.role = role;
    this.save();
  }

  markDead(id: string): void {
    this.setRole(id, 'dead');
  }

  promoteToMercenary(id: string): void {
    this.setRole(id, 'mercenary');
  }

  /** Stable cast prefix: fort mercenaries + landmarks. Byte-stable per session
   * IF identity is the same (arcState may still differ per chain — see §18.11). */
  cachedPrefix(region: string): PoolCharacter[] {
    return this.all().filter(
      c => (c.role === 'mercenary' || c.role === 'landmark') && c.region === region,
    );
  }

  /** Sample of region npcs/captives, sorted by most-recent-seen first. */
  regionSample(region: string, count: number, excludeIds: ReadonlySet<string> = new Set()): PoolCharacter[] {
    return this.all()
      .filter(c => c.region === region && (c.role === 'npc' || c.role === 'captive') && !excludeIds.has(c.id))
      .sort((a, b) => b.lastSeenDay - a.lastSeenDay)
      .slice(0, count);
  }
}
