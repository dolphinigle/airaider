#!/usr/bin/env node
// Records tool: create numbered decision/experiment records, regenerate the index tables, check consistency.
//   node tools/rec.mjs decision "Title"      → docs/decisions/D-NNNN-slug.md
//   node tools/rec.mjs experiment "Title"    → experiments/E-NNNN-slug/README.md
//   node tools/rec.mjs index                 → rewrite the tables in docs/decisions/README.md and experiments/README.md
//   node tools/rec.mjs check                 → validate fields, links and index freshness (exit 1 on problems)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DEC = path.join(ROOT, 'docs/decisions');
const EXP = path.join(ROOT, 'experiments');
const STATUS = {
  D: ['proposed', 'accepted', 'rejected', 'superseded'],
  E: ['planned', 'running', 'done', 'abandoned'],
};
const TYPES = ['sim', 'playtest', 'lab', 'judge', 'research'];

const today = () => new Date().toISOString().slice(0, 10);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z-]+):\s*(.*?)\s*(#.*)?$/);
    if (!kv) continue;
    let v = kv[2];
    if (v.startsWith('[')) v = v.slice(1, -1).split(',').map(x => x.trim()).filter(Boolean);
    fm[kv[1]] = v;
  }
  return fm;
}

function records(kind) {
  const out = [];
  if (kind === 'D') {
    for (const f of fs.readdirSync(DEC).sort()) {
      if (!/^D-\d{4}-.*\.md$/.test(f)) continue;
      out.push({ file: f, link: f, fm: frontmatter(fs.readFileSync(path.join(DEC, f), 'utf8')) });
    }
  } else {
    for (const d of fs.readdirSync(EXP).sort()) {
      const p = path.join(EXP, d, 'README.md');
      if (!/^E-\d{4}-/.test(d) || !fs.existsSync(p)) continue;
      out.push({ file: `${d}/README.md`, link: `${d}/`, fm: frontmatter(fs.readFileSync(p, 'utf8')) });
    }
  }
  return out;
}

function nextId(kind) {
  const nums = records(kind).map(r => parseInt(r.file.slice(2, 6), 10));
  return `${kind}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`;
}

function create(kind, title) {
  if (!title) die(`usage: rec.mjs ${kind === 'D' ? 'decision' : 'experiment'} "Title"`);
  const id = nextId(kind);
  const tpl = kind === 'D' ? path.join(DEC, '_template.md') : path.join(EXP, '_template/README.md');
  const body = fs.readFileSync(tpl, 'utf8')
    .replace(/^id: .*$/m, `id: ${id}`)
    .replace(/^title: .*$/m, `title: ${title}`)
    .replace(/^date: .*$/m, `date: ${today()}`);
  let file;
  if (kind === 'D') {
    file = path.join(DEC, `${id}-${slug(title)}.md`);
  } else {
    const dir = path.join(EXP, `${id}-${slug(title)}`);
    fs.mkdirSync(dir, { recursive: true });
    file = path.join(dir, 'README.md');
  }
  fs.writeFileSync(file, body);
  index();
  console.log(path.relative(ROOT, file));
}

const cell = s => String(s ?? '').replace(/\|/g, '\\|');

function table(kind) {
  const rs = records(kind);
  if (!rs.length) return '_None yet._';
  if (kind === 'D') {
    const rows = rs.map(({ link, fm }) => {
      let st = fm.status;
      if (fm['superseded-by']) st += ` → ${fm['superseded-by']}`;
      return `| [${fm.id}](${link}) | ${cell(fm.title)} | ${st} | ${fm['decided-by']} | ${fm.date} |`;
    });
    return ['| ID | Decision | Status | By | Date |', '|---|---|---|---|---|', ...rows].join('\n');
  }
  const rows = rs.map(({ link, fm }) =>
    `| [${fm.id}](${link}) | ${cell(fm.title)} | ${fm.type} | ${fm.status} | ${cell(fm.verdict)} | ${fm.date} |`);
  return ['| ID | Experiment | Type | Status | Verdict | Date |', '|---|---|---|---|---|---|', ...rows].join('\n');
}

function rendered(kind) {
  const file = kind === 'D' ? path.join(DEC, 'README.md') : path.join(EXP, 'README.md');
  const text = fs.readFileSync(file, 'utf8');
  const next = text.replace(/<!-- index:start -->[\s\S]*<!-- index:end -->/,
    `<!-- index:start -->\n${table(kind)}\n<!-- index:end -->`);
  return { file, text, next };
}

function index() {
  for (const kind of ['D', 'E']) {
    const { file, text, next } = rendered(kind);
    if (next !== text) fs.writeFileSync(file, next);
  }
}

function check() {
  const problems = [];
  const ids = new Set();
  for (const kind of ['D', 'E']) {
    for (const { file, fm } of records(kind)) {
      if (!fm) { problems.push(`${file}: no frontmatter`); continue; }
      if (!file.startsWith(fm.id + '-')) problems.push(`${file}: id ${fm.id} does not match the file name`);
      if (ids.has(fm.id)) problems.push(`${file}: duplicate id ${fm.id}`);
      ids.add(fm.id);
      if (!STATUS[kind].includes(fm.status)) problems.push(`${file}: status "${fm.status}" not in ${STATUS[kind].join('/')}`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.date || '')) problems.push(`${file}: bad date`);
      if (!fm.title) problems.push(`${file}: no title`);
      if (kind === 'D') {
        if (!['designer', 'claude'].includes(fm['decided-by'])) problems.push(`${file}: decided-by must be designer or claude`);
        if (fm.status === 'superseded' && !fm['superseded-by']) problems.push(`${file}: superseded but no superseded-by`);
      } else {
        if (!TYPES.includes(fm.type)) problems.push(`${file}: type "${fm.type}" not in ${TYPES.join('/')}`);
        if (fm.status === 'done' && !fm.verdict) problems.push(`${file}: done but no verdict`);
      }
    }
  }
  for (const kind of ['D', 'E']) {
    for (const { file, fm } of records(kind)) {
      if (!fm) continue;
      const refs = [...(fm.supersedes || []), ...(fm.evidence || []), ...(fm.decisions || []), fm['superseded-by']].filter(Boolean);
      for (const r of refs) if (!ids.has(r)) problems.push(`${file}: refers to unknown ${r}`);
      for (const s of fm.sources || []) {
        const p = s.split(/\s/)[0];
        if (!fs.existsSync(path.join(ROOT, 'docs', p))) problems.push(`${file}: source ${p} not found under docs/`);
      }
    }
    const { file, text, next } = rendered(kind);
    if (next !== text) problems.push(`${path.relative(ROOT, file)}: index is stale (run: node tools/rec.mjs index)`);
  }
  if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
  console.log(`ok: ${ids.size} records`);
}

// SessionStart hook: print the status board and the recording rule into Claude's context.
function session() {
  const now = fs.readFileSync(path.join(ROOT, 'docs/NOW.md'), 'utf8');
  console.log(`${now}\n---\nRecord as you go, unprompted (records skill): open an experiment record BEFORE any test/sim/playtest/lab, ` +
    `write its result + verdict when it ends, write a decision record for every ruling, keep docs/NOW.md current, commit records as they change.`);
}

// Stop hook: nudge once per stop if records fail the check or sit uncommitted.
async function stopHook() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  try { if (JSON.parse(input || '{}').stop_hook_active) return; } catch {}
  const { execSync } = await import('node:child_process');
  const issues = [];
  try { execSync('node tools/rec.mjs check', { cwd: ROOT, stdio: 'pipe' }); }
  catch (e) { issues.push(String(e.stdout).trim()); }
  const dirty = execSync('git status --porcelain -- docs experiments tools', { cwd: ROOT, encoding: 'utf8' }).trim();
  if (dirty) issues.push(`uncommitted records:\n${dirty}`);
  const archive = dirty.split('\n').filter(l => / docs\/archive\/(v3|v1-v2)\//.test(l) && !l.startsWith('??'));
  if (archive.length) issues.push(`the archive is frozen; revert these edits and restate the idea in a v4 decision instead:\n${archive.join('\n')}`);
  if (issues.length) console.log(JSON.stringify({
    decision: 'block',
    reason: `Records need attention before stopping (records skill):\n${issues.join('\n')}\n` +
      `Fix and commit them, or if work is genuinely mid-flight, say so in one line and stop.`,
  }));
}

function die(msg) { console.error(msg); process.exit(2); }

const [cmd, ...rest] = process.argv.slice(2);
const title = rest.join(' ').trim();
if (cmd === 'decision') create('D', title);
else if (cmd === 'experiment') create('E', title);
else if (cmd === 'index') index();
else if (cmd === 'check') check();
else if (cmd === 'session') session();
else if (cmd === 'stop-hook') await stopHook();
else die('usage: rec.mjs decision|experiment "Title" | index | check | session | stop-hook');
