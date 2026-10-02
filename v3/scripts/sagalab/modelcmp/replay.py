#!/usr/bin/env python3
"""Replay probe1's real gpt-5-mini writer calls (same system + user, verbatim) through Claude models via the
headless `claude -p` CLI (subscription auth, no tools, no settings/MCP, no project context), for a blind
per-call writing comparison. Isolated: reads probe1, writes only into this folder."""
import json, glob, os, random, subprocess, sys, time, re, tempfile
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
P1 = '/home/irvan/airaider/v3/scripts/sagalab/runs/probe1'
CW = os.path.join(HERE, 'cw'); os.makedirs(CW, exist_ok=True)
NOMCP = os.path.join(CW, 'nomcp.json'); open(NOMCP, 'w').write('{"mcpServers":{}}')
MODELS = sys.argv[1].split(',') if len(sys.argv) > 1 else ['haiku', 'sonnet']
POOL = int(os.environ.get('POOL', '6'))

def load():
    calls = []
    for arm in ['S_labels_pitch', 'L_labels_pitch', 'H_labels_pitch', 'S_labels_first']:
        for f in sorted(glob.glob(f'{P1}/{arm}/F*/calls.jsonl')):
            saga = f.split('/')[-2]
            for i, l in enumerate(open(f)):
                d = json.loads(l)
                if not d.get('ok') or not d.get('output'): continue
                fl = d.get('flags', [])
                kind = d['purpose'] if d['purpose'] == 'plan' else (
                    'card_first' if 'first' in fl else 'card_finale' if 'finale' in fl else 'card_later') if d['purpose'] == 'card' else (
                    'rep_finale' if 'answer' in fl else 'rep_fail' if 'failure' in fl else 'rep_moved')
                calls.append({'id': f'{arm}/{saga}/{i}', 'arm': arm, 'saga': saga, 'kind': kind, 'flags': fl,
                              'effort': d.get('effort', 'low'), 'system': d['system'], 'user': d['user'], 'gpt': d['output'],
                              'gpt_ms': d.get('durationMs'), 'gpt_cost': d.get('costUsd')})
    return calls

QUOTA = {'plan': 12, 'card_first': 8, 'card_later': 16, 'card_finale': 8, 'rep_moved': 14, 'rep_fail': 6, 'rep_finale': 8}

def iter_pad(v, n=200):
    return v + [None] * (n - len(v))

def sample(calls):
    rng = random.Random(20261002)
    out = []
    for kind, n in QUOTA.items():
        pool = [c for c in calls if c['kind'] == kind]
        # spread over arms and sagas: shuffle, then take round-robin by arm
        rng.shuffle(pool)
        by = {}
        for c in pool: by.setdefault(c['arm'], []).append(c)
        inter = [x for grp in zip(*[iter_pad(v) for v in by.values()]) for x in grp if x]
        picked, seen = [], set()
        for c in inter:                      # first pass: one per saga
            if len(picked) < n and (c['arm'], c['saga']) not in seen: picked.append(c); seen.add((c['arm'], c['saga']))
        for c in inter:                      # fill if short
            if len(picked) < n and c not in picked: picked.append(c)
        out += picked
    return out

def extract_json(text):
    t = text.strip()
    m = re.search(r'```(?:json)?\s*(.*?)```', t, re.S)
    if m: t = m.group(1).strip()
    i, j = t.find('{'), t.rfind('}')
    if i < 0 or j < 0: return None
    try: return json.loads(t[i:j + 1], strict=False)
    except Exception: return None

def run(model, c):
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, dir=CW) as sf:
        sf.write(c['system']); sp = sf.name
    eff = 'medium' if c['effort'] == 'medium' else 'low'
    cmd = ['claude', '-p', '--model', model, '--system-prompt-file', sp, '--tools', '', '--setting-sources', '',
           '--strict-mcp-config', '--mcp-config', NOMCP, '--exclude-dynamic-system-prompt-sections',
           '--output-format', 'json', '--effort', eff]
    t0 = time.time()
    for attempt in range(3):
        try:
            env = dict(os.environ)
            if model == 'haiku': env['MAX_THINKING_TOKENS'] = '4000' if eff == 'medium' else '1024'   # --effort does not bound Haiku 4.5's thinking
            p = subprocess.run(cmd, input=c['user'], capture_output=True, text=True, cwd=CW, timeout=400, env=env)
            d = json.loads(p.stdout)
            if d.get('is_error'): raise RuntimeError(d.get('result', '')[:200])
            break
        except Exception as e:
            d = {'result': '', 'error': str(e)[:300]}
            time.sleep(3)
    os.unlink(sp)
    mu = next(iter(d.get('modelUsage', {}).values()), {})
    return {'text': d.get('result', ''), 'json': extract_json(d.get('result', '')), 'ms': int((time.time() - t0) * 1000),
            'api_ms': d.get('duration_api_ms'), 'in': mu.get('inputTokens'), 'out': mu.get('outputTokens'),
            'think': (d.get('usage', {}).get('output_tokens_details') or {}).get('thinking_tokens'),
            'cost': d.get('total_cost_usd'), 'model': mu.get('canonicalModel'), 'error': d.get('error')}

def main():
    items = sample(load())
    if os.environ.get('LIMIT'): items = [c for c in items if c['kind'] in ('plan','card_later')][:int(os.environ['LIMIT'])]
    path = os.path.join(HERE, 'items.json')
    done = json.load(open(path)) if os.path.exists(path) else {}
    jobs = [(m, c) for c in items for m in MODELS if not (done.get(c['id'], {}).get(m) or {}).get('json')]
    print(f'{len(items)} items, {len(jobs)} calls to make', flush=True)
    for c in items: done.setdefault(c['id'], {}).update({'meta': c})
    n = 0
    with ThreadPoolExecutor(POOL) as ex:
        futs = {ex.submit(run, m, c): (m, c) for m, c in jobs}
        for f in futs:
            m, c = futs[f]; r = f.result(); n += 1
            done[c['id']][m] = r
            if n % 10 == 0 or n == len(jobs):
                json.dump(done, open(path, 'w'), indent=1); print(f'{n}/{len(jobs)}', flush=True)
    json.dump(done, open(path, 'w'), indent=1)
    for m in MODELS:
        rs = [v[m] for v in done.values() if m in v]
        ok = [r for r in rs if r['json']]
        print(m, f'ok {len(ok)}/{len(rs)}', 'median ms', sorted(r['ms'] for r in rs)[len(rs) // 2] if rs else '-',
              'cost', round(sum(r['cost'] or 0 for r in rs), 3))

main()
