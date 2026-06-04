// The GUI. Presentation only — every action delegates to the shared GameEngine via
// the store. Reads use the engine's view methods (questView, eligibleMercs, …).
import { useState } from 'react';
import { useGame } from './store.js';
import type { Quest, CharacterCard, Lead } from '../core/types.js';
import type { AICallRecord } from '../core/ai.js';
import { tagLabel, tagName } from '../core/tags.js';
import { ROOM_TYPES, buildableRoomTypes, excavateCost, digFloorCost, roomPrestige, comfortFor } from '../core/fort.js';

function useEng() { useGame((s) => s.tick); return useGame((s) => s.eng); }

const conceptTags = (m: CharacterCard) =>
  m.tags.filter((t) => !t.id.startsWith('gender:') && !t.id.startsWith('race:'));

function TagChips({ m, max = 5 }: { m: CharacterCard; max?: number }) {
  return (
    <span className="chips">
      {conceptTags(m).slice(0, max).map((t) => (
        <span key={t.id} className={`chip ${t.id.split(':')[0]}`}>{tagLabel(t.id, t.tier)}</span>
      ))}
    </span>
  );
}

function TopBar({ view, setView }: { view: string; setView: (v: string) => void }) {
  const eng = useEng();
  const endDay = useGame((s) => s.endDay);
  const provider = useGame((s) => s.provider);
  const aiCount = useGame((s) => s.aiLog.length);
  if (!eng) return null;
  const anyFilled = eng.activeQuests().some((q) => q.slots.some((s) => s.filledBy));
  return (
    <header className="topbar">
      <div className="brand">AIRAIDER <span className="sub">cycle {eng.cycle}</span></div>
      <div className="stats">
        <span className="gold">{eng.gold}g</span>
        <span>prestige {eng.globalPrestige()}</span>
        <span>scout T{eng.leadTier()}</span>
        <span>dungeon {eng.captiveCapacity()}</span>
        <span className={`prov ${provider}`}>{provider === 'openai' ? '● live AI' : '○ offline mock'}</span>
      </div>
      <nav className="tabs">
        <button className={view === 'game' ? 'on' : ''} onClick={() => setView('game')}>Game</button>
        <button className={view === 'log' ? 'on' : ''} onClick={() => setView('log')}>AI Log {aiCount > 0 && <b>{aiCount}</b>}</button>
      </nav>
      <button className="endday" disabled={!anyFilled} onClick={() => void endDay()}>End the Day ▶</button>
    </header>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const pursue = useGame((s) => s.pursue);
  const eng = useEng();
  const tag = lead.chain.kind === 'continues' ? `↪ ${lead.title}`
    : lead.chain.kind === 'starts-new' ? '✦ new saga'
    : lead.chain.kind === 'personal' ? `★ ${lead.title}` : '';
  return (
    <div className={`lead ${lead.rarity}`}>
      <div className="lead-top">
        <span className={`rarity ${lead.rarity}`}>{lead.rarity}</span>
        <span className="arch">{lead.archetype}</span>
        <span className="lvl">L{lead.level}</span>
      </div>
      <div className="lead-loc">{lead.location}</div>
      {tag && <div className="lead-chain">{tag}</div>}
      <button disabled={!eng || eng.freeMercs().length === 0} onClick={() => void pursue(lead.id)}>Pursue</button>
    </div>
  );
}

function Slot({ quest, index }: { quest: Quest; index: number }) {
  const eng = useEng();
  const assign = useGame((s) => s.assign);
  const unassign = useGame((s) => s.unassign);
  if (!eng) return null;
  const slot = quest.slots[index];
  const eligible = eng.eligibleMercs(quest, index);
  const filled = slot.filledBy ? eng.state.cards[slot.filledBy] as CharacterCard : null;
  const fav = slot.tested.favored.map((t) => tagName(t)).join(' / ');
  return (
    <div className="slot">
      <div className="slot-test">tests <b>{slot.tested.attribute}</b>{fav && <> · favors <i>{fav}</i></>}
        {slot.requirement.kind === 'must-have' && <> · <span className="req">needs {tagName(slot.requirement.tag)}</span></>}
        {slot.requirement.kind === 'must-be' && <> · <span className="req">must be {eng.state.cards[slot.requirement.cardId]?.name ?? 'them'}</span></>}
      </div>
      {filled
        ? <div className="slot-filled"><span>{filled.name}</span><button onClick={() => unassign(quest.id, index)}>✕</button></div>
        : <select defaultValue="" onChange={(e) => e.target.value && assign(quest.id, index, e.target.value)}>
            <option value="">— assign merc —</option>
            {eligible.map((m) => <option key={m.id} value={m.id}>{m.name} (L{m.level})</option>)}
          </select>}
    </div>
  );
}

function Branch({ quest, group }: { quest: Quest; group: import('../core/types.js').ApproachGroup }) {
  const eng = useEng();
  const assign = useGame((s) => s.assign);
  const unassign = useGame((s) => s.unassign);
  if (!eng) return null;
  const i = group.slotIndices[0];
  const slot = quest.slots[i];
  const filled = slot.filledBy ? eng.state.cards[slot.filledBy] as CharacterCard : null;
  const eligible = eng.eligibleMercs(quest, i);
  const kindWord = group.rewardKind === 'recruit' ? 'they join you' : group.rewardKind === 'captive' ? 'caged as a captive' : 'sold for gold';
  return (
    <div className={`branch ${filled ? 'chosen' : ''}`}>
      <div className="branch-top"><b>{group.label}</b> <span className="kind">→ {kindWord}</span><span className="bthr">tests {slot.tested.attribute} · thr {group.threshold}</span></div>
      {filled
        ? <div className="slot-filled"><span>{filled.name}</span><button onClick={() => unassign(quest.id, i)}>✕</button></div>
        : <select defaultValue="" onChange={(e) => e.target.value && assign(quest.id, i, e.target.value)}>
            <option value="">— send merc (picks this approach) —</option>
            {eligible.map((m) => <option key={m.id} value={m.id}>{m.name} (L{m.level})</option>)}
          </select>}
    </div>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const eng = useEng();
  if (!eng) return null;
  const v = eng.questView(quest);
  const o = v.odds;
  return (
    <div className={`quest ${quest.chainId ? 'chain' : ''}`}>
      <div className="quest-head">
        {quest.chainId && <span className="beat">{quest.finale ? 'FINALE' : `beat ${quest.beat}`}</span>}
        <b>{quest.title}</b>
        <span className="qmeta">{quest.rarity} L{quest.level}</span>
      </div>
      <p className="situation">{quest.situation}</p>
      <p className="job"><b>Job:</b> {quest.job}</p>
      {quest.groups
        ? <div className="branches"><div className="branchhdr">Choose ONE approach:</div>{quest.groups.map((g) => <Branch key={g.id} quest={quest} group={g} />)}</div>
        : <div className="slots">{quest.slots.map((_, i) => <Slot key={i} quest={quest} index={i} />)}</div>}
      <div className="odds">
        <span className="bar"><i className="s" style={{ flex: o.success }} /><i className="p" style={{ flex: o.partial }} /><i className="f" style={{ flex: o.failure }} /></span>
        <span className="oddtext">{(o.success * 100) | 0}% / {(o.partial * 100) | 0}% / {(o.failure * 100) | 0}% · {v.coins} coins vs {quest.threshold}</span>
      </div>
    </div>
  );
}

function Roster() {
  const eng = useEng();
  const act = useGame((s) => s.act);
  if (!eng) return null;
  return (
    <div className="panel">
      <h3>Roster</h3>
      {eng.mercs().map((m) => (
        <div key={m.id} className={`merc ${eng.freeMercs().includes(m) ? '' : 'out'}`}>
          <div className="merc-name">{m.name} <span className="lvl">L{m.level} · cap {eng.levelCap(m.id)}</span>{m.injuries.length > 0 && <span className="hurt"> ✚</span>}</div>
          <TagChips m={m} />
          {m.injuries.length > 0 && <button className="mini" onClick={() => act((e) => e.healInjury(m.id))}>heal</button>}
        </div>
      ))}
      {eng.captives().length > 0 && <h3>Captives</h3>}
      {eng.captives().map((c) => (
        <div key={c.id} className="merc captive">
          <div className="merc-name">{c.name}</div>
          <TagChips m={c} />
          <div className="row">
            <button className="mini" onClick={() => act((e) => e.recruitCaptive(c.id))}>recruit</button>
            <button className="mini" onClick={() => act((e) => e.ransomCaptive(c.id))}>ransom</button>
          </div>
        </div>
      ))}
      {eng.liabilities().map((l) => (
        <div key={l.id} className="liab">
          {l.name} ({l.value}g) <button className="mini" onClick={() => act((e) => e.clearLiability(l.id))}>clear</button>
        </div>
      ))}
    </div>
  );
}

// ---- Fort: the 2D vertical cross-section (docs/FORT.md §1) -------------------
function FortCellBox({ idx }: { idx: number }) {
  const eng = useEng();
  const act = useGame((s) => s.act);
  if (!eng) return null;
  const cell = eng.state.cells.find((c) => c.idx === idx)!;
  const room = cell.roomId ? eng.state.rooms[cell.roomId] : null;
  if (!room) {
    const buildable = buildableRoomTypes(eng.state);
    return (
      <div className="cell empty">
        <span className="cidx">#{cell.idx}</span>
        <select defaultValue="" onChange={(e) => e.target.value && act((eng2) => eng2.buildRoom(cell.idx, e.target.value))}>
          <option value="">build…</option>
          {buildable.map((t) => <option key={t.key} value={t.key}>{t.name} ({t.cost}g)</option>)}
        </select>
      </div>
    );
  }
  const type = ROOM_TYPES[room.type];
  const prest = type.pool === 'comfort' ? (room.ownerMercId ? comfortFor(eng.state, room.ownerMercId) : 0) : roomPrestige(eng.state, room);
  const owner = room.ownerMercId ? eng.state.cards[room.ownerMercId] as CharacterCard : null;
  const slots = type.occupantSlots + type.itemSlots;
  return (
    <div className={`cell built ${type.bucket}`}>
      <div className="cell-name">{type.name}</div>
      <div className="cell-meta">
        {type.gate && <span className="gate">{type.gate.kind} {type.gate.value}</span>}
        {type.pool !== 'none' && <span className="prest">{type.pool === 'comfort' ? 'comfort' : 'prestige'} {prest}</span>}
      </div>
      {type.pool === 'comfort' && (
        <select defaultValue={room.ownerMercId ?? ''} onChange={(e) => act((en) => en.setBedroomOwner(room.id, e.target.value))}>
          <option value="">— owner —</option>
          {eng.mercs().map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      {slots > 0 && (
        <div className="displays">
          {room.displayCardIds.map((id) => <span key={id} className="chip">{eng.state.cards[id]?.name ?? id}</span>)}
          {room.displayCardIds.length < slots && (
            <select defaultValue="" onChange={(e) => e.target.value && act((en) => en.placeDisplay(room.id, e.target.value))}>
              <option value="">+ place {type.pool === 'comfort' ? 'item/captive' : 'occupant'}</option>
              {[...eng.captives(), ...(owner ? [owner] : [])].map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

function Fort() {
  const eng = useEng();
  const act = useGame((s) => s.act);
  if (!eng) return null;
  const cells = eng.state.cells;
  const floors = [...new Set(cells.map((c) => c.floor))].sort((a, b) => b - a); // top floor first
  const minCol = Math.min(...cells.map((c) => c.col));
  const maxCol = Math.max(...cells.map((c) => c.col));
  const cols = Array.from({ length: maxCol - minCol + 1 }, (_, i) => minCol + i);
  const at = (floor: number, col: number) => cells.find((c) => c.floor === floor && c.col === col);

  return (
    <div className="panel fortpanel">
      <h3>Fort <span className="dim">— cross-section · gold builds space</span></h3>
      <div className="digrow"><button className="mini" onClick={() => act((e) => e.digFloor(1))}>↑ dig floor (−{digFloorCost(eng.state)}g)</button></div>
      <div className="xsection">
        {floors.map((floor) => (
          <div key={floor} className={`floorrow ${floor === 0 ? 'ground' : ''}`}>
            <button className="exc" title="excavate left" onClick={() => act((e) => e.excavate(floor, -1))}>＋</button>
            <div className="cellsrow">
              {cols.map((col) => {
                const c = at(floor, col);
                return c ? <FortCellBox key={col} idx={c.idx} /> : <div key={col} className="cell void" />;
              })}
            </div>
            <button className="exc" title="excavate right" onClick={() => act((e) => e.excavate(floor, 1))}>＋</button>
          </div>
        ))}
      </div>
      <div className="digrow"><button className="mini" onClick={() => act((e) => e.digFloor(-1))}>↓ dig cellar (−{digFloorCost(eng.state)}g)</button></div>
      <div className="hint">excavate (＋) ±{excavateCost(eng.state, 0)}g · theme rooms → prestige → unlock more room types · bedroom comfort → owner's level cap</div>
    </div>
  );
}

// ---- AI Log page ------------------------------------------------------------
function LogEntry({ rec }: { rec: AICallRecord }) {
  const [open, setOpen] = useState(false);
  let pretty = rec.response;
  try { pretty = JSON.stringify(JSON.parse(rec.response), null, 2); } catch { /* leave raw */ }
  return (
    <div className="logentry">
      <button className="loghead" onClick={() => setOpen(!open)}>
        <span className="logn">#{rec.n}</span>
        <span className="logkind">{rec.kind}</span>
        <span className="logtok">{rec.promptTokens}↑ {rec.completionTokens}↓{rec.cachedTokens ? ` · ${rec.cachedTokens} cached` : ''}</span>
        <span className="logtoggle">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="logbody">
          <div className="logsec"><h4>system</h4><pre>{rec.system}</pre></div>
          <div className="logsec"><h4>user</h4><pre>{rec.user}</pre></div>
          <div className="logsec"><h4>response</h4><pre className="resp">{pretty}</pre></div>
        </div>
      )}
    </div>
  );
}

function AILog() {
  const log = useGame((s) => s.aiLog);
  const provider = useGame((s) => s.provider);
  const totals = log.reduce((a, r) => ({ in: a.in + (r.promptTokens ?? 0), out: a.out + (r.completionTokens ?? 0) }), { in: 0, out: 0 });
  return (
    <div className="logpage">
      <div className="logsum">
        {provider === 'mock'
          ? <span className="dim">Offline mock narrator — no real prompts. Set OPENAI_API_KEY in ../.env and restart to see live calls.</span>
          : <span>{log.length} calls · {totals.in} prompt tokens · {totals.out} completion tokens</span>}
      </div>
      {[...log].reverse().map((rec) => <LogEntry key={rec.n} rec={rec} />)}
      {log.length === 0 && provider === 'openai' && <p className="dim">No AI calls yet — pursue a lead or end the day.</p>}
    </div>
  );
}

function ResultsModal() {
  const results = useGame((s) => s.results);
  const dismiss = useGame((s) => s.dismissResults);
  if (!results) return null;
  return (
    <div className="modal-bg" onClick={dismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>The day's reckoning</h2>
        {results.length === 0 && <p className="dim">No company went out today.</p>}
        {results.map((r) => (
          <div key={r.questId} className={`result ${r.outcome}`}>
            <p className="before">{r.beforeText}</p>
            <div className="verdict">{r.outcome.toUpperCase()} <span className="dim">({r.heads}/{r.threshold} heads)</span></div>
            <p className="after">{r.afterText}</p>
            {r.delivered.length > 0 && <p className="delivered">→ {r.delivered.join(', ')}</p>}
            {r.chainDone && <p className="saga">✦ the saga concludes.</p>}
          </div>
        ))}
        <button className="endday" onClick={dismiss}>Continue</button>
      </div>
    </div>
  );
}

function Busy() {
  const busy = useGame((s) => s.busy);
  if (!busy) return null;
  return <div className="busy"><div className="spinner" /> {busy}</div>;
}

export function App() {
  const eng = useEng();
  const error = useGame((s) => s.error);
  const [view, setView] = useState('game');
  if (!eng) return <div className="boot"><div className="spinner" /> mustering the company…</div>;
  return (
    <div className="app">
      <TopBar view={view} setView={setView} />
      {error && <div className="error">{error}</div>}
      {view === 'log' ? <AILog /> : (
        <div className="board">
          <section className="col leads">
            <h3>Lead Board</h3>
            {eng.leads().map((l) => <LeadCard key={l.id} lead={l} />)}
          </section>
          <section className="col quests">
            <h3>Quests <span className="dim">— assign your mercs, then End the Day</span></h3>
            {eng.activeQuests().length === 0 && <p className="dim">Pursue a lead to open a quest.</p>}
            {eng.activeQuests().map((q) => <QuestCard key={q.id} quest={q} />)}
          </section>
          <section className="col side">
            <Roster />
            <Fort />
          </section>
        </div>
      )}
      <ResultsModal />
      <Busy />
    </div>
  );
}
