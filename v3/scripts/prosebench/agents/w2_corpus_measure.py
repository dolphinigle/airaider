import gzip,json,re,collections
d=json.load(gzip.open('/home/irvan/airaider/v3/scripts/prosebench/research/sultans_en/config_merged.json.gz','rt',encoding='utf-8'))
rc=json.load(open('/home/irvan/airaider/v3/scripts/prosebench/research/sultans_en/rite_conditions.json'))
rites=collections.defaultdict(dict)
pat=re.compile(r'^rite_(\d+)_(.*)$')
for k,v in d.items():
    m=pat.match(k)
    if m: rites[m.group(1)][m.group(2)]=v
DICE=re.compile(r'^!?r\d+:')
def has_dice(rid):
    for b in rc.get(rid,{}).get('branches',[]):
        cond=b[3] if len(b)>3 else {}
        if isinstance(cond,dict):
            for k in cond:
                if DICE.match(k): return True
    return False
def wc(s): return len(re.findall(r"[A-Za-z0-9'’\-]+", s))
def cn(s): return bool(re.search(r'[一-鿿]', s))
def slots(f):
    out=[]
    for k in sorted(f, key=lambda x:(len(x),x)):
        m=re.match(r'^cards_slot_s(\d+)_text$',k)
        if m: out.append((int(m.group(1)),f[k]))
    return [t for _,t in sorted(out)]
def outcomes(f):
    out=[]
    for k,v in f.items():
        if re.match(r'^settlement(_extre)?_\d+_text$',k): out.append((k,v))
    return sorted(out)
def build(pred):
    res=[]
    for rid,f in rites.items():
        t=(f.get('text') or '').strip()
        if not t or cn(t): continue
        sl=slots(f)
        if pred(rid,f,sl):
            res.append({'id':rid,'name':f.get('name',''),'text':t,'slots':sl,'out':outcomes(f),'nb':len(rc.get(rid,{}).get('branches',[]))})
    return res
JOB=build(lambda rid,f,sl: len(sl)>=2 and has_dice(rid))
ALL=build(lambda rid,f,sl: True)

import re, statistics as st, collections
seen=set(); J=[]
for j in JOB:
    if j['text'] in seen: continue
    seen.add(j['text']); J.append(j)
print('deduped job-like:', len(J))

def norm(t):
    t=t.replace('\r',' ')
    return t
def sents(t):
    t=re.sub(r'\.\.\.+','…',t)
    t=t.replace('……','…').replace('…','…')
    parts=re.split(r'(?<=[.!?…])\s+|\n+', t)
    return [p.strip() for p in parts if p.strip()]
def wc(s): return len(re.findall(r"[A-Za-z0-9'’\-]+", s))

rows=[]
for j in J:
    t=norm(j['text']); S=sents(t)
    rows.append(dict(id=j['id'],name=j['name'],t=t,S=S,w=wc(t),ns=len(S)))
W=sorted(r['w'] for r in rows)
def q(a,p): a=sorted(a); return a[min(len(a)-1,int(len(a)*p))]
print('WORDS  median %d  p10 %d p25 %d p50 %d p75 %d p90 %d'%(st.median(W),q(W,.1),q(W,.25),q(W,.5),q(W,.75),q(W,.9)))
NS=[r['ns'] for r in rows]
print('SENTENCES hist:', sorted(collections.Counter(NS).items()))
print('  <=2 sentences: %.0f%%   <=3: %.0f%%'%(100*sum(1 for x in NS if x<=2)/len(NS),100*sum(1 for x in NS if x<=3)/len(NS)))
WPS=[r['w']/r['ns'] for r in rows]
print('WORDS/SENTENCE median %.1f  p25 %.1f p75 %.1f'%(st.median(WPS),q(WPS,.25),q(WPS,.75)))
# per-sentence length by position
for i in range(4):
    v=[wc(r['S'][i]) for r in rows if len(r['S'])>i]
    if v: print('  sent%d len median %d (n=%d)'%(i+1,st.median(v),len(v)))
lastw=[wc(r['S'][-1]) for r in rows]
print('  LAST sentence len median %d  p25 %d p75 %d'%(st.median(lastw),q(lastw,.25),q(lastw,.75)))

def pct(f, sub=rows): 
    n=sum(1 for r in sub if f(r)); return n, 100*n/len(sub)
tests = {
 'you/your anywhere': lambda r: re.search(r'\b(you|your|yours|yourself)\b', r['t'], re.I),
 '  ...in FIRST sentence': lambda r: re.search(r'\b(you|your)\b', r['S'][0], re.I),
 '  ...in LAST sentence': lambda r: re.search(r'\b(you|your)\b', r['S'][-1], re.I),
 'question mark': lambda r: '?' in r['t'],
 '  question in LAST sentence': lambda r: '?' in r['S'][-1],
 'ellipsis': lambda r: re.search(r'\.\.\.|…', r['t']),
 'em/en dash': lambda r: re.search(r'[—–]|\s-\s', r['t']),
 'double-quoted speech': lambda r: re.search(r'["“][^"”]{6,}["”]', r['t']),
 'scare quote (short)': lambda r: re.search(r'["“][^"”]{1,20}["”]', r['t']) and not re.search(r'["“][^"”]{25,}["”]', r['t']),
 'semicolon': lambda r: ';' in r['t'],
 'colon': lambda r: ':' in r['t'],
 'exclamation': lambda r: '!' in r['t'],
 'digit': lambda r: re.search(r'\d', r['t']),
 'capitalised name (heuristic)': lambda r: re.search(r'(?<![.!?…]\s)(?<!^)\b[A-Z][a-z]{2,}\b', r['t']),
 'multi-paragraph': lambda r: '\n' in r['t'],
}
print('\n--- FEATURE RATES (n=%d) ---'%len(rows))
for k,f in tests.items():
    n,p=pct(f); print('  %-30s %4d  %5.1f%%'%(k,n,p))
