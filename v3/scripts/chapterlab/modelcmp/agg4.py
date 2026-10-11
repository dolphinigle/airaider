#!/usr/bin/env python3
"""Unblind and aggregate the writer comparison: per model × kind group — strict follow (every part 'yes'),
read 1-10, breaks per text, mean rank, first-place share; pairwise vs gpt with bootstrap CIs over items
(each item = mean of its two judges); judge agreement."""
import json, os, glob, random, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
key = json.load(open(os.path.join(HERE, 'key4.json')))
M = ['gpt', 'luna', 'haiku', 'sonnet']
GROUP = {'plan': 'plan', 'card_first': 'card', 'card_later': 'card', 'card_finale': 'card', 'rep_moved': 'report', 'rep_fail': 'report', 'rep_finale': 'report'}
per = {}   # item id -> list of judge records {model: {...}}
for f in sorted(glob.glob(os.path.join(HERE, 'judged4', '*.json'))):
    p = os.path.basename(f)[:-5]
    try: d = json.load(open(f))
    except Exception as e: print('bad', f, e); continue
    for it in d.get('items', []):
        k = key.get(f"{p}:{it.get('item')}")
        if not k: continue
        rec = {}
        rank = it.get('rank') or []
        for L, m in k['letters'].items():
            x = it.get(L) or {}
            fol = x.get('follow') or {}
            vals = list(fol.values())
            rec[m] = {'strict': bool(vals) and all(v == 'yes' for v in vals), 'partial': sum(v == 'partial' for v in vals), 'no': sum(v == 'no' for v in vals),
                      'parts': len(vals), 'read': x.get('read'), 'breaks': len(x.get('breaks') or []), 'rank': (rank.index(L) + 1) if L in rank else None,
                      'fol': fol, 'brk': x.get('breaks') or []}
        per.setdefault(k['id'], []).append({'kind': k['kind'], 'p': p, 'rec': rec, 'first': k['letters'].get(rank[0]) if rank else None})

def mean(a): a = [x for x in a if x is not None]; return sum(a) / len(a) if a else float('nan')
def item_val(recs, m, f): return mean([f(r['rec'][m]) for r in recs if m in r['rec']])
def boot(diffs, n=4000):
    rng = random.Random(1); diffs = [d for d in diffs if d == d]
    if not diffs: return (float('nan'),) * 3
    bs = sorted(mean([rng.choice(diffs) for _ in diffs]) for _ in range(n))
    return mean(diffs), bs[int(n * .025)], bs[int(n * .975)]

out = []
for grp in ['plan', 'card', 'report', 'all']:
    ids = [i for i, rs in per.items() if grp == 'all' or GROUP[rs[0]['kind']] == grp]
    if not ids: continue
    out.append(f'\n### {grp} ({len(ids)} items, {sum(len(per[i]) for i in ids)} judgings)\n')
    out.append('| model | strict follow | parts partial / no | read (1-10) | breaks per text | mean rank | ranked first |')
    out.append('|---|---|---|---|---|---|---|')
    for m in M:
        recs = [r['rec'][m] for i in ids for r in per[i] if m in r['rec']]
        firsts = sum(r['first'] == m for i in ids for r in per[i]); nj = sum(len(per[i]) for i in ids)
        out.append(f"| {m} | {100 * mean([r['strict'] for r in recs]):.0f}% | {sum(r['partial'] for r in recs)} / {sum(r['no'] for r in recs)} | "
                   f"{mean([r['read'] for r in recs]):.2f} | {mean([r['breaks'] for r in recs]):.2f} | {mean([r['rank'] for r in recs]):.2f} | {100 * firsts / nj:.0f}% |")
    for m in ['luna', 'haiku', 'sonnet']:
        for lab, f in [('strict follow', lambda r: float(r['strict'])), ('read', lambda r: r['read']), ('rank (lower = better)', lambda r: r['rank'])]:
            diffs = [item_val(per[i], m, f) - item_val(per[i], 'gpt', f) for i in ids]
            d, lo, hi = boot(diffs)
            sig = ' **sig**' if (lo > 0 or hi < 0) else ''
            scale = 100 if lab == 'strict follow' else 1
            out.append(f"- {m} − gpt, {lab}: {d * scale:+.2f} [{lo * scale:+.2f}, {hi * scale:+.2f}]{sig}")
# agreement: same first place in set a and set b
agree = [len({r['first'] for r in rs}) == 1 for rs in per.values() if len(rs) == 2]
out.append(f'\nJudge agreement on first place (two judges, different letter orders): {100 * mean(agree):.0f}% of {len(agree)} items (chance 25%).')
# most common breaks per model
for m in M:
    brk = [b for rs in per.values() for r in rs if m in r['rec'] for b in r['rec'][m]['brk']]
    out.append(f'\n{m} breaks ({len(brk)}), sample: ' + ' | '.join(brk[:14]))
open(os.path.join(HERE, 'RESULT4.md'), 'w').write('\n'.join(out) + '\n')
print('\n'.join(out))
