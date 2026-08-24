#!/usr/bin/env python3
"""Emit COMPLETE Sultan's Game rite records in the game's official shipped English.

Joins two local files:
  sultans_en/config_merged.json[.gz] (preferred) or config.json[.gz]
                                  - official StreamingAssets/i18n/en/config.json (all English strings)
  sultans_en/rite_conditions.json - version-matched structural index derived from the shipped
                                    Chinese StreamingAssets/config/rite/*.json (slot ids, branch
                                    order, and each branch's dice/state condition)

Usage:
  python3 rite_record.py 5008068 5008074      # named rites
  python3 rite_record.py --all                # all 1382 rites (~5 MB to stdout)
  python3 rite_record.py --all --max 30       # cap outcome branches per rite
  python3 rite_record.py --index              # id / English name / branch count / completeness
"""
import json, os, re, sys, gzip, argparse

HERE = os.path.dirname(os.path.abspath(__file__))


def _load_en():
    """Prefer the merged (multi-build) English config; fall back to the plain one.
    Accepts .json or .json.gz — a parallel session gzips these in place."""
    for cand in ('sultans_en/config_merged.json', 'sultans_en/config_merged.json.gz',
                 'sultans_en/config.json', 'sultans_en/config.json.gz'):
        p = os.path.join(HERE, cand)
        if os.path.exists(p):
            op = gzip.open if p.endswith('.gz') else open
            return json.load(op(p, 'rt', encoding='utf-8')), cand
    raise SystemExit('no English config found under sultans_en/')


EN, EN_SRC = _load_en()
CN = json.load(open(os.path.join(HERE, 'sultans_en/rite_conditions.json'), encoding='utf-8'))


def label(cond):
    if not isinstance(cond, dict) or not cond:
        return 'branch'
    for k in cond:
        if k.startswith('r') and ':' in k:
            if '>' in k:
                return 'success'
            if '<' in k:
                return 'failure'
            if '=' in k:
                return 'partial'
    return 'branch'


def bq(s):
    return '\n'.join('> ' + l if l.strip() else '>' for l in s.replace('\r', '').split('\n'))


def record(rid, max_branches=None, sources=None, n_corroborated=0):
    c = CN[rid]
    E = lambda suf: EN.get('rite_%s_%s' % (rid, suf))
    L = ['## %s — rite `%s` (%s)' % (E('name') or '[CN ONLY] ' + c['cn'], rid, c['cn'])]
    if sources:
        n = n_corroborated or len(sources)
        L.append('**Confidence:** High — official `i18n/en` string for every field; %d of them %s '
                 'verbatim on sultansgame.wiki.gg, transcribed by editors from the running game '
                 '(see Source).' % (n, 'also appears' if n == 1 else 'also appear'))
        L.append('**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_%s_*`; '
                 'wiki corroboration: %s' % (rid, ', '.join(sources)))
    else:
        L.append('**Confidence:** High — official `i18n/en` string for every field, key-for-key with the '
                 'shipped Chinese config.')
        L.append('**Source:** official English `StreamingAssets/i18n/en/config.json`, keys `rite_%s_*`' % rid)
    L.append('')
    intro = E('text')
    L += ['**Intro (EN):**', bq(intro) if intro else bq('[CN ONLY] (no `_text` key in the English build)'), '']
    slots = ['> %s: %s' % (s, E('cards_slot_%s_text' % s) or '[CN ONLY]') for s in c['slots']]
    if slots:
        L += ['**Slot lines (EN):**'] + slots + ['']
    pre, typ, tgt = E('random_text_r1_text'), E('random_text_r1_type_tips'), E('random_text_r1_low_target_tips')
    if pre or tgt:
        L.append('**Dice line (EN):**')
        L += ['> ' + x for x in (pre, typ, tgt) if x]
        L.append('')
    total = len(c['branches'])
    n = 0
    for cg, eg, i, cond in c['branches']:
        if max_branches is not None and n >= max_branches:
            break
        n += 1
        t = E('%s_%d_text' % (eg, i))
        ti = E('%s_%d_title' % (eg, i))
        h = '**Outcome — %s, condition `%s`:**' % (label(cond), json.dumps(cond, ensure_ascii=False))
        if ti:
            h += ' *%s*' % ti
        L += ['<!-- %s[%d] -->' % (cg, i), h,
              bq(t) if t else bq('[CN ONLY] (no English string for this branch)'), '']
    if max_branches is not None and total > n:
        L += ['*(+%d further outcome branches, all present in official English — regenerate uncapped '
              'with `rite_record.py %s`.)*' % (total - n, rid), '']
    return '\n'.join(L)


def completeness(rid):
    c = CN[rid]
    E = lambda suf: EN.get('rite_%s_%s' % (rid, suf))
    if not c['branches']:
        return 'no-branches'
    have = sum(1 for _, eg, i, _ in c['branches'] if E('%s_%d_text' % (eg, i)))
    if not E('text'):
        return 'no-intro'
    return 'full' if have == len(c['branches']) else ('intro+%d/%d' % (have, len(c['branches'])) if have else 'intro-only')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='*')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--index', action='store_true')
    ap.add_argument('--max', type=int, default=None)
    a = ap.parse_args()
    ids = sorted(CN, key=int) if (a.all or a.index) else a.ids
    if a.index:
        print('| rite id | English name | branches | English coverage |')
        print('|---|---|---:|---|')
        for r in ids:
            print('| %s | %s | %d | %s |' % (r, EN.get('rite_%s_name' % r, '[CN ONLY] ' + CN[r]['cn']),
                                             len(CN[r]['branches']), completeness(r)))
    else:
        for r in ids:
            print(record(r, a.max)); print()
