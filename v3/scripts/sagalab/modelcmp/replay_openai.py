#!/usr/bin/env python3
"""Replay the same 72 writer calls (verbatim system + user) through an OpenAI model; effort as gpt-5-mini had
(plan medium, card/report low). Stores into items.json under the model key. Key from /home/irvan/airaider/.env."""
import json, os, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL, KEYNAME = sys.argv[1], sys.argv[2]          # e.g. gpt-6-luna luna
PRICE = {'gpt-6-luna': (0.10, 0.01, 0.50), 'gpt-5.6-luna': (0.20, 0.02, 1.20)}[MODEL]
KEY = next(l.split('=', 1)[1].strip().strip('"') for l in open('/home/irvan/airaider/.env') if l.startswith('OPENAI_API_KEY='))
items = json.load(open(os.path.join(HERE, 'items.json')))
def run(k):
    m = items[k]['meta']
    body = {'model': MODEL, 'messages': [{'role': 'system', 'content': m['system']}, {'role': 'user', 'content': m['user']}],
            'response_format': {'type': 'json_object'}, 'reasoning_effort': 'medium' if m['effort'] == 'medium' else 'low'}
    for attempt in range(3):
        t = time.time()
        try:
            req = urllib.request.Request('https://api.openai.com/v1/chat/completions', data=json.dumps(body).encode(),
                                         headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
            r = json.load(urllib.request.urlopen(req, timeout=300))
            txt = r['choices'][0]['message']['content']; u = r['usage']
            cached = (u.get('prompt_tokens_details') or {}).get('cached_tokens', 0)
            cost = ((u['prompt_tokens'] - cached) * PRICE[0] + cached * PRICE[1] + u['completion_tokens'] * PRICE[2]) / 1e6
            try: j = json.loads(txt, strict=False)
            except Exception: j = None
            return k, {'text': txt, 'json': j, 'ms': int((time.time() - t) * 1000), 'in': u['prompt_tokens'], 'out': u['completion_tokens'],
                       'think': (u.get('completion_tokens_details') or {}).get('reasoning_tokens'), 'cost': cost, 'model': MODEL}
        except Exception as e:
            err = e.read().decode()[:300] if isinstance(e, urllib.error.HTTPError) else str(e)[:300]
            time.sleep(3)
    return k, {'text': '', 'json': None, 'error': err, 'model': MODEL, 'ms': 0, 'cost': 0}
todo = [k for k in items if not (items[k].get(KEYNAME) or {}).get('json')]
with ThreadPoolExecutor(8) as ex:
    for k, r in ex.map(run, todo): items[k][KEYNAME] = r
json.dump(items, open(os.path.join(HERE, 'items.json'), 'w'), indent=1)
rs = [v[KEYNAME] for v in items.values()]
print(MODEL, 'ok', sum(1 for r in rs if r['json']), '/', len(rs), 'median ms', sorted(r['ms'] for r in rs)[len(rs)//2],
      'cost $%.4f' % sum(r['cost'] for r in rs), 'errors', [r.get('error') for r in rs if r.get('error')][:2])
