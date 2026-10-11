#!/usr/bin/env python3
"""Blind packets for the writer comparison: each item = the exact prompt the writer got + three outputs
(gpt-5-mini / haiku / sonnet) under shuffled letters; two packet sets (a, b) with different letter orders so
each item is read by two judges in different orders. Also the mechanical table (validity, caps, speed, cost)."""
import json, os, random, re

HERE = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(HERE, 'items.json')))
MODELS = ['gpt', 'haiku', 'sonnet']
PER = 8

def out_of(v, m):
    if m == 'gpt':
        t = v['meta']['gpt']
        try: return json.loads(t, strict=False), t
        except Exception: return None, t
    r = v.get(m) or {}
    return r.get('json'), r.get('text', '')

def show(j, raw):
    if j is None: return f'(NOT VALID JSON — raw reply)\n{raw.strip()[:3000]}'
    return json.dumps(j, indent=1, ensure_ascii=False)

ids = sorted(items, key=lambda k: (items[k]['meta']['kind'], k))
rng = random.Random(7)
rng.shuffle(ids)
os.makedirs(os.path.join(HERE, 'packets'), exist_ok=True)
key = {}
for s, setname in enumerate(['a', 'b']):
    for p in range(0, len(ids), PER):
        chunk = ids[p:p + PER]
        lines = [f'# Packet {setname}{p // PER + 1}\n']
        for n, k in enumerate(chunk, 1):
            v = items[k]; meta = v['meta']
            order = MODELS[:]; random.Random(f'{setname}:{k}').shuffle(order)
            key[f'{setname}{p // PER + 1}:{n}'] = {'id': k, 'kind': meta['kind'], 'letters': dict(zip('ABC', order))}
            lines.append(f'\n\n========== ITEM {n} · {meta["kind"]} ==========\n')
            lines.append('--- WHAT THE WRITER WAS ASKED (system prompt) ---\n' + meta['system'].strip() + '\n')
            lines.append('--- THE DATA IT GOT (user message) ---\n' + meta['user'].strip() + '\n')
            for L, m in zip('ABC', order):
                j, raw = out_of(v, m)
                lines.append(f'--- OUTPUT {L} ---\n' + show(j, raw) + '\n')
        open(os.path.join(HERE, 'packets', f'{setname}{p // PER + 1}.md'), 'w').write('\n'.join(lines))
json.dump(key, open(os.path.join(HERE, 'key.json'), 'w'), indent=1)

# ── mechanical table ──
def caps(system):
    return {m.group(1): int(m.group(2)) for m in re.finditer(r'"(\w+)": "at most (\d+) words"', system)} | \
           {m.group(1): int(m.group(2)) for m in re.finditer(r'- (\w+): at most (\d+) words', system)}
def words(s): return len(re.findall(r"[A-Za-z0-9'’-]+", s or ''))
rows = {m: {'n': 0, 'valid': 0, 'cap_ok': 0, 'cap_n': 0, 'ms': [], 'cost': 0.0, 'think': []} for m in MODELS}
for k, v in items.items():
    c = caps(v['meta']['system'])
    for m in MODELS:
        j, raw = out_of(v, m); r = rows[m]; r['n'] += 1
        if isinstance(j, dict): r['valid'] += 1
        for f, cap in c.items():
            if isinstance(j, dict) and isinstance(j.get(f), str):
                r['cap_n'] += 1; r['cap_ok'] += words(j[f]) <= cap
        if m == 'gpt': r['ms'].append(v['meta'].get('gpt_ms') or 0); r['cost'] += v['meta'].get('gpt_cost') or 0
        else:
            x = v.get(m) or {}; r['ms'].append(x.get('ms') or 0); r['cost'] += x.get('cost') or 0; r['think'].append(x.get('think') or 0)
by_kind = {}
for k, v in items.items():
    kind = v['meta']['kind']
    for m in MODELS:
        x = v['meta'].get('gpt_ms') if m == 'gpt' else (v.get(m) or {}).get('ms')
        by_kind.setdefault(kind, {}).setdefault(m, []).append(x or 0)
med = lambda a: sorted(a)[len(a) // 2] if a else 0
out = ['| model | valid JSON | fields within word cap | median latency | list-price cost, all items |', '|---|---|---|---|---|']
for m, r in rows.items():
    out.append(f"| {m} | {r['valid']}/{r['n']} | {r['cap_ok']}/{r['cap_n']} | {med(r['ms']) / 1000:.1f} s | ${r['cost']:.3f} |")
out += ['', '| kind | ' + ' | '.join(f'{m} p50' for m in MODELS) + ' |', '|---|---|---|---|']
for kind, d in sorted(by_kind.items()):
    out.append(f'| {kind} | ' + ' | '.join(f'{med(d[m]) / 1000:.1f} s' for m in MODELS) + ' |')
open(os.path.join(HERE, 'mech.md'), 'w').write('\n'.join(out) + '\n')
print('\n'.join(out))
print(len(ids), 'items,', len(key), 'judgings in', len(os.listdir(os.path.join(HERE, 'packets'))), 'packets')
