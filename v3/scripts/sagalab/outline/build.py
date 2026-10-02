#!/usr/bin/env python3
"""Outline experiment: V0 (original) / V1 (engine route line) / V2 (Sonnet sequence outline) reading copies
of probe4/L_lean_sonnet. Read-only on the run; writes only under this folder.
  python3 build.py outline   -> calls Sonnet once per saga, writes outlines.json (skips sagas already done)
  python3 build.py render    -> writes V0/ V1/ V2/ folders + <V>/<slot>.md"""
import json, os, re, subprocess, sys, time, tempfile, shutil, statistics
from concurrent.futures import ThreadPoolExecutor

RUN = '/home/irvan/airaider/v3/scripts/sagalab/runs/probe4/L_lean_sonnet'
OUT = os.path.dirname(os.path.abspath(__file__))
CW = os.path.join(OUT, 'cw')          # empty cwd outside the repo
OJ = os.path.join(OUT, 'outlines.json')
SLOTS = sorted(d for d in os.listdir(RUN) if re.fullmatch(r'F\d+_\d+', d))

SYSTEM = """You write one field of a saga plan for a fantasy mercenary-company game.

A saga is a chain of jobs the player's company takes one after another, ending in a finale. Every job card shows the player a short outline of the whole chain, so they always see where the saga is going and why each job comes next.

Write that outline: one line per job, in order, the finale last.
- Each line is an order to the player: start with a verb. Say what the company does at that job and how it sets up the next one. The finale line says what the company does there.
- At most 18 words per line. Plain, everyday words.
- Call people by name only if they are marked "met"; call everyone else by their label.
- Never say what a job will find, learn or prove. The player finds that out by playing.
- No numbers, no job titles, no quotation marks.

Reply with JSON only: {"outline": ["...", "..."]}, exactly one line per job."""

def load(slot):
    p = json.load(open(f'{RUN}/{slot}/plan.json'))
    return p

def jobs_of(p):
    pl = p['plan']
    return pl['episodes'] + [pl['showdown']]

def user_msg(p):
    pl = p['plan']; pi = {c['id']: c for c in p['planInput']['cast']}
    asker = next(c for c in pl['cast'] if c.get('want'))
    opp = next(c for c in pl['cast'] if c['seat'] == 'opponent')
    a_name = pi.get(asker['id'], {}).get('name')
    a_extra = ", one of the company's own soldiers" if asker['seat'] == 'soldier' and 'soldier' not in asker['label'].lower() else ''
    a_who = f"{a_name}, {asker['label']}{a_extra}" + (" of the company" if asker['seat'] == 'soldier' and not a_extra else '') if a_name and asker.get('known') else asker['label'] + a_extra
    a_met = 'met' if asker.get('known') else 'not met'
    trade = pi.get(opp['id'], {}).get('trade') or opp.get('trade')
    o_lab = opp['label'] + (f" ({trade})" if trade and trade.lower() not in opp['label'].lower() else '')
    js = jobs_of(p)
    rows = []
    for i, e in enumerate(js, 1):
        tag = f"{i} (finale)" if i == len(js) else str(i)
        rows.append(f"{tag}. {e['title']}: {e['job'].rstrip('.')}. Why: {e['why']}")
    return (f"SAGA: {pl['title']}\n"
            f"ASKER ({a_met}): {a_who}. Wants: {asker['want']}\n"
            f"OPPONENT (not met): {o_lab}\n"
            f"JOBS ({len(js)}):\n" + '\n'.join(rows) + f"\n\nWrite {len(js)} lines, each at most 18 words.")

def extract_json(t):
    t = t.strip()
    m = re.search(r'```(?:json)?\s*(.*?)```', t, re.S)
    if m: t = m.group(1).strip()
    i, j = t.find('{'), t.rfind('}')
    if i < 0 or j < 0: return None
    try: return json.loads(t[i:j + 1], strict=False)
    except Exception: return None

def child_env():
    env = {k: v for k, v in os.environ.items() if not re.match(r'^(CLAUDE|ANTHROPIC_)', k) or k == 'CLAUDE_CONFIG_DIR'}
    env.pop('MAX_THINKING_TOKENS', None)
    env['CLAUDE_CODE_DISABLE_AUTO_MEMORY'] = '1'
    return env

def call(slot):
    p = load(slot); user = user_msg(p)
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, dir=OUT) as sf:
        sf.write(SYSTEM); sp = sf.name
    cmd = ['claude', '-p', '--model', 'sonnet', '--system-prompt-file', sp, '--tools', '', '--setting-sources', '',
           '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--exclude-dynamic-system-prompt-sections',
           '--no-session-persistence', '--output-format', 'json', '--effort', 'low']
    t0 = time.time(); d = {}; err = None
    for attempt in range(3):
        try:
            r = subprocess.run(cmd, input=user, capture_output=True, text=True, cwd=CW, timeout=400, env=child_env())
            d = json.loads(r.stdout)
            if d.get('is_error'): raise RuntimeError(str(d.get('result', ''))[:300])
            j = extract_json(d.get('result', ''))
            if not j or not isinstance(j.get('outline'), list): raise RuntimeError('no outline JSON: ' + d.get('result', '')[:200])
            err = None; break
        except Exception as e:
            err = str(e)[:300]; time.sleep(3)
    os.unlink(sp)
    mu = next(iter(d.get('modelUsage', {}).values()), {}) if d else {}
    j = extract_json(d.get('result', '')) if d else None
    return {'slot': slot, 'title': p['plan']['title'], 'n_jobs': len(jobs_of(p)),
            'outline': (j or {}).get('outline'), 'raw': d.get('result', ''), 'user': user,
            'ms': int((time.time() - t0) * 1000), 'api_ms': d.get('duration_api_ms'), 'attempts': attempt + 1,
            'cost_usd_list': d.get('total_cost_usd'), 'model': mu.get('canonicalModel') or (list(d.get('modelUsage', {}) or {}) or [None])[0],
            'in_tok': mu.get('inputTokens'), 'cache_read': mu.get('cacheReadInputTokens'), 'cache_write': mu.get('cacheCreationInputTokens'),
            'out_tok': mu.get('outputTokens'), 'error': err}

def do_outline():
    os.makedirs(CW, exist_ok=True)
    done = json.load(open(OJ))['sagas'] if os.path.exists(OJ) else {}
    todo = [s for s in SLOTS if not (done.get(s) or {}).get('outline')]
    print(len(todo), 'calls', flush=True)
    with ThreadPoolExecutor(int(os.environ.get('POOL', '6'))) as ex:
        for r in ex.map(call, todo):
            done[r['slot']] = r
            print(r['slot'], r['ms'], r['cost_usd_list'], r['error'] or '', flush=True)
    rs = [done[s] for s in SLOTS if s in done]
    ms = [r['ms'] for r in rs]
    summ = {'model': rs[0].get('model'), 'effort': 'low', 'system': SYSTEM, 'calls': len(rs),
            'ok': sum(1 for r in rs if r['outline']),
            'latency_ms': {'median': statistics.median(ms), 'mean': round(statistics.mean(ms)), 'min': min(ms), 'max': max(ms)},
            'api_ms_median': statistics.median([r['api_ms'] or 0 for r in rs]),
            'cost_usd_list_total': round(sum(r['cost_usd_list'] or 0 for r in rs), 4),
            'cost_usd_list_per_saga': round(sum(r['cost_usd_list'] or 0 for r in rs) / len(rs), 4),
            'out_tok_median': statistics.median([r['out_tok'] or 0 for r in rs])}
    json.dump({'summary': summ, 'sagas': {s: done[s] for s in SLOTS if s in done}}, open(OJ, 'w'), indent=1, ensure_ascii=False)
    print(json.dumps(summ, indent=1)[:600])

# ---------- rendering ----------
def states(p, k):
    """job states before card k (1-based attempt): {n: won|lost|skipped}, current n, retry?"""
    L = p['lines']; st = {}
    for i in range(k - 1):
        l, nx = L[i], L[i + 1]
        if l['outcome'] in ('success', 'partial'): st[l['n']] = 'won'
        elif l['outcome'] == 'failure' and nx['n'] != l['n']:
            st[l['n']] = 'lost'
            for m in range(l['n'] + 1, nx['n']): st[m] = 'skipped'
    cur = L[k - 1]['n']
    retry = k > 1 and L[k - 2]['n'] == cur
    return st, cur, retry

MARK = {'won': '✓', 'lost': '✗'}

def route_line(p, k):
    js = jobs_of(p); st, cur, retry = states(p, k); parts = []
    for n, e in enumerate(js, 1):
        s = st.get(n)
        if s == 'skipped': continue
        t = e['title'] + (' (finale)' if n == len(js) else '')
        if n == cur: parts.append(f"▶ {t}" + (' · another try' if retry else ''))
        elif s in MARK: parts.append(f"{MARK[s]} {t}")
        else: parts.append(t)
    return 'Route: ' + ' → '.join(parts)

def outline_block(p, k, outline):
    js = jobs_of(p); st, cur, retry = states(p, k); rows = ['The road ahead:']
    for n, line in enumerate(outline, 1):
        line = line.strip()
        s = st.get(n)
        pre = ('Finale: ' if n == len(js) else '')
        if n == cur: m = '▶'; pre += ('Another try: ' if retry else '')
        elif s in MARK: m = MARK[s]
        elif s == 'skipped': m = '–'; pre += 'Skipped: '
        else: m = ' '
        rows.append(f"{m} {n}. {pre}{line}")
    return '\n'.join(rows)

def insert_after_header(text, block):
    head, _, rest = text.partition('\n')
    return f"{head}\n{block}\n{rest}" if block else text

def do_render():
    O = json.load(open(OJ))['sagas']
    for V in ('V0', 'V1', 'V2'):
        shutil.rmtree(os.path.join(OUT, V), ignore_errors=True)
    for slot in SLOTS:
        p = load(slot); src = f'{RUN}/{slot}'
        order = [x.strip() for x in open(f'{src}/order.txt') if x.strip()]
        outline = O[slot]['outline']
        assert len(outline) == len(jobs_of(p)), (slot, len(outline))
        for V in ('V0', 'V1', 'V2'):
            dst = os.path.join(OUT, V, slot); os.makedirs(dst, exist_ok=True)
            shutil.copy(f'{src}/order.txt', dst)
            whole = []
            for f in order:
                txt = open(f'{src}/{f}').read()
                m = re.fullmatch(r'card_(\d+)\.md', f)
                if m and V != 'V0':
                    k = int(m.group(1))
                    txt = insert_after_header(txt, route_line(p, k) if V == 'V1' else outline_block(p, k, outline))
                open(os.path.join(dst, f), 'w').write(txt)
                if re.fullmatch(r'(card|report)_\d+\.md', f):      # what the judge reads (judge_gpt.ts readingOrder/whole)
                    whole.append(f'--- {f} ---\n{txt.strip()}')
            open(os.path.join(OUT, V, f'{slot}.md'), 'w').write('\n\n'.join(whole) + '\n')
    print('rendered', len(SLOTS), 'sagas x 3 versions')

if __name__ == '__main__':
    {'outline': do_outline, 'render': do_render}[sys.argv[1]]()
