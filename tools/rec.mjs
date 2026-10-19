#!/usr/bin/env node
// Records tool: create numbered decision/experiment records, regenerate the index tables, check consistency.
//   node tools/rec.mjs decision "Title"      → docs/decisions/D-NNNN-slug.md
//   node tools/rec.mjs experiment "Title"    → experiments/E-NNNN-slug/README.md
//   node tools/rec.mjs index                 → rewrite every generated table (decisions, experiments, design, reference)
//   node tools/rec.mjs finding works|fails|open "Claim. Detail" E-0001 [D-0004 …]  → add a lesson to docs/findings.md
//   node tools/rec.mjs check                 → validate fields, links, index freshness, findings, and that the maps name every folder
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DEC = path.join(ROOT, 'docs/decisions');
const EXP = path.join(ROOT, 'experiments');
const STATUS = {
  D: ['proposed', 'accepted', 'rejected', 'superseded'],
  E: ['planned', 'running', 'done', 'abandoned'],
};
const TYPES = ['sim', 'playtest', 'lab', 'judge', 'research'];
const FINDINGS = path.join(ROOT, 'docs/findings.md');
const SECTIONS = { works: 'Works', fails: "Doesn't work", open: 'Open' };

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

// Every generated table: the file it lives in (between <!-- index:start/end --> markers) and how to build it.
const INDEXES = [
  { file: path.join(DEC, 'README.md'), build: () => table('D') },
  { file: path.join(EXP, 'README.md'), build: () => table('E') },
  { file: path.join(ROOT, 'docs/design/README.md'), build: () => pages('docs/design') },
  { file: path.join(ROOT, 'docs/reference/README.md'), build: () => pages('docs/reference') },
];

// A page's title is its H1; its summary is the first plain paragraph line after it.
function pages(rel) {
  const dir = path.join(ROOT, rel);
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.md') && e.name !== 'README.md' ? [path.join(d, e.name)] : []);
  const rows = walk(dir).sort().map(f => {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const title = (lines.find(l => l.startsWith('# ')) || path.basename(f)).replace(/^# /, '');
    const summary = lines.slice(lines.findIndex(l => l.startsWith('# ')) + 1)
      .find(l => l.trim() && !/^(#|\||```|---|<!--)/.test(l)) || '';
    const link = path.relative(dir, f);
    return `| [${cell(title)}](${link}) | ${cell(summary.replace(/^>\s*/, '').slice(0, 160))} |`;
  });
  return rows.length ? ['| Page | Summary |', '|---|---|', ...rows].join('\n') : '_None yet._';
}

function rendered({ file, build }) {
  const text = fs.readFileSync(file, 'utf8');
  const next = text.replace(/<!-- index:start -->[\s\S]*<!-- index:end -->/,
    `<!-- index:start -->\n${build()}\n<!-- index:end -->`);
  return { file, text, next };
}

function index() {
  for (const ix of INDEXES) {
    const { file, text, next } = rendered(ix);
    if (next !== text) fs.writeFileSync(file, next);
  }
}

// The findings ledger: what works, what doesn't, what's still open. Each lesson is one bullet citing its evidence.
function findings() {
  const out = {};
  let sec = null;
  for (const line of fs.readFileSync(FINDINGS, 'utf8').split('\n')) {
    const h = line.match(/^## (.*)$/);
    if (h) { sec = Object.values(SECTIONS).includes(h[1]) ? h[1] : null; if (sec) out[sec] = []; continue; }
    if (sec && line.startsWith('- ')) out[sec].push(line);
  }
  return out;
}

function addFinding(kind, args) {
  const ids = args.filter(a => /^[DE]-\d{4}$/.test(a));
  const claim = args.filter(a => !ids.includes(a)).join(' ').trim();
  if (!SECTIONS[kind] || !claim || !ids.length) die('usage: rec.mjs finding works|fails|open "Claim. Detail" E-0001 [D-0004 …]');
  const lines = fs.readFileSync(FINDINGS, 'utf8').split('\n');
  const start = lines.indexOf(`## ${SECTIONS[kind]}`);
  let end = start + 1;
  while (end < lines.length && !lines[end].startsWith('## ')) end++;
  while (end > start + 1 && !lines[end - 1].trim()) end--;
  const [first, ...rest] = claim.split(/(?<=\.)\s+/);
  const bullet = `- **${first}**${rest.length ? ' ' + rest.join(' ') : ''} (${ids.join(', ')})`;
  const body = lines.slice(start + 1, end).filter(l => !/^_.*_$/.test(l.trim()));
  lines.splice(start + 1, end - start - 1, ...(body.length ? body : ['']), bullet);
  fs.writeFileSync(FINDINGS, lines.join('\n'));
  console.log(`docs/findings.md ← ${SECTIONS[kind]}: ${bullet}`);
}

function findingProblems(ids, exps) {
  const problems = [];
  const f = findings();
  for (const name of Object.values(SECTIONS)) if (!f[name]) problems.push(`docs/findings.md: missing section "## ${name}"`);
  const cited = new Set();
  for (const [name, bullets] of Object.entries(f))
    for (const b of bullets) {
      const refs = b.match(/\b[DE]-\d{4}\b/g) || [];
      if (!refs.length) problems.push(`docs/findings.md (${name}): cite the evidence (E-…/D-…): ${b.slice(0, 60)}`);
      for (const r of refs) { cited.add(r); if (!ids.has(r)) problems.push(`docs/findings.md: refers to unknown ${r}`); }
    }
  for (const { fm } of exps)
    if (fm && ['done', 'abandoned'].includes(fm.status) && !cited.has(fm.id))
      problems.push(`${fm.id} is ${fm.status} but docs/findings.md has no lesson citing it (what worked, what didn't?)`);
  return problems;
}

// The maps must name every folder: docs/README.md every folder in docs/, README.md every top-level folder.
function mapProblems() {
  const problems = [];
  const docsMap = fs.readFileSync(path.join(ROOT, 'docs/README.md'), 'utf8');
  for (const e of fs.readdirSync(path.join(ROOT, 'docs'), { withFileTypes: true }))
    if (e.isDirectory() && !docsMap.includes(`${e.name}/`)) problems.push(`docs/${e.name}/ is not on the map in docs/README.md`);
  const rootMap = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const files = execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' }).split('\n');
  const tops = new Set(files.filter(f => f.includes('/') && !f.startsWith('.')).map(f => f.split('/')[0]));
  for (const d of tops) if (!rootMap.includes(`${d}/`)) problems.push(`${d}/ is not listed in README.md`);
  return problems;
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
  }
  for (const ix of INDEXES) {
    const { file, text, next } = rendered(ix);
    if (next !== text) problems.push(`${path.relative(ROOT, file)}: index is stale (run: node tools/rec.mjs index)`);
  }
  problems.push(...findingProblems(ids, records('E')));
  problems.push(...mapProblems());
  if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
  console.log(`ok: ${ids.size} records`);
}

// SessionStart hook: print the status board, the lessons so far, and the recording rule into Claude's context.
function session() {
  const now = fs.readFileSync(path.join(ROOT, 'docs/NOW.md'), 'utf8');
  const lessons = Object.entries(findings()).map(([name, b]) => `${name}:\n${b.join('\n') || '- (none yet)'}`).join('\n');
  console.log(`${now}\n---\nLessons so far (docs/findings.md):\n${lessons}\n---\nRecord as you go, unprompted (records skill): open an experiment record BEFORE any test/sim/playtest/lab, ` +
    `write its result + verdict when it ends, put every lesson (works / doesn't / open) in docs/findings.md, write a decision record for every ruling, keep docs/NOW.md current, commit records as they change.`);
}

// Stop hook: nudge once per stop if records fail the check or sit uncommitted.
async function stopHook() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  try { if (JSON.parse(input || '{}').stop_hook_active) return; } catch {}
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
else if (cmd === 'finding') addFinding(rest[0], rest.slice(1));
else if (cmd === 'index') index();
else if (cmd === 'check') check();
else if (cmd === 'session') session();
else if (cmd === 'stop-hook') await stopHook();
else die('usage: rec.mjs decision|experiment "Title" | finding works|fails|open "Claim" E-… | index | check | session | stop-hook');
