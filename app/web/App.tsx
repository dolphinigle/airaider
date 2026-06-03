// The GUI. Presentation only — every action delegates to the shared GameEngine via
// the store. Reads use the engine's view methods (questView, eligibleMercs, …).
import { useGame } from './store.js';
import type { Quest, CharacterCard, Lead } from '../core/types.js';
import { tagLabel, tagName } from '../core/tags.js';
import { ROOM_TYPES, buildableRoomTypes } from '../core/fort.js';

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

function TopBar() {
  const eng = useEng();
  const endDay = useGame((s) => s.endDay);
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
      </div>
      <button className="endday" disabled={!anyFilled} onClick={() => void endDay()}>End the Day ▶</button>
    </header>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const pursue = useGame((s) => s.pursue);
  const eng = useEng();
  const tag = lead.chain.kind === 'continues' ? `↪ ${lead.title}` : lead.chain.kind === 'starts-new' ? '✦ new saga' : '';
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
      <div className="slots">{quest.slots.map((_, i) => <Slot key={i} quest={quest} index={i} />)}</div>
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
          <div className="merc-name">{m.name} <span className="lvl">L{m.level}</span>{m.injuries.length > 0 && <span className="hurt"> ✚</span>}</div>
          <TagChips m={m} />
          {m.injuries.length > 0 && <button className="mini" onClick={() => act((e) => e.healInjury(m.id))}>heal</button>}
        </div>
      ))}
      {eng.captives().length > 0 && <h3>Dungeon</h3>}
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

function Fort() {
  const eng = useEng();
  const act = useGame((s) => s.act);
  if (!eng) return null;
  const cells = [...eng.state.cells].sort((a, b) => b.floor - a.floor || a.col - b.col);
  const buildable = buildableRoomTypes(eng.state);
  return (
    <div className="panel">
      <h3>Fort</h3>
      <div className="fort">
        {cells.map((c) => {
          const room = c.roomId ? eng.state.rooms[c.roomId] : null;
          return (
            <div key={c.idx} className={`cell ${room ? 'built' : 'empty'}`}>
              <span className="cidx">#{c.idx}</span>
              {room ? ROOM_TYPES[room.type]?.name : (
                <select defaultValue="" onChange={(e) => e.target.value && act((eng2) => eng2.buildRoom(c.idx, e.target.value))}>
                  <option value="">build…</option>
                  {buildable.map((t) => <option key={t.key} value={t.key}>{t.name} ({t.cost}g)</option>)}
                </select>
              )}
            </div>
          );
        })}
      </div>
      <div className="row">
        <button className="mini" onClick={() => act((e) => e.excavate(0, 1))}>excavate →</button>
        <button className="mini" onClick={() => act((e) => e.digFloor(-1))}>dig down</button>
      </div>
      <div className="hint">build theme rooms (kitchen/chapel/library) → prestige → unlocks more rooms</div>
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
  if (!eng) return <div className="boot"><div className="spinner" /> mustering the company…</div>;
  return (
    <div className="app">
      <TopBar />
      {error && <div className="error">{error}</div>}
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
      <ResultsModal />
      <Busy />
    </div>
  );
}
