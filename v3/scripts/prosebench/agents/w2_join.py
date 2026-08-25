#!/usr/bin/env python3
"""Measure THE JOIN: does the last sentence attach to nouns the card already put on the page?"""
import re,sys,collections
STOP=set('''a an the of to and in is are was were be been being it its this that these those he she they
him her them his their you your yours yourself i we our us my me for on at by with from as but or so if
not no nor then than there here what who which when where how why into out up down over under about
after before again very just now still even only all some any each every both more most other another
one two three four five six seven eight nine ten will shall would could should may might must can do
does did done has have had having get got go goes going come comes came make makes made take takes took
say says said see sees saw know knows knew think thinks thought'''.split())
def sents(t):
    t=re.sub(r'\.\.\.+','…',t)
    return [p.strip() for p in re.split(r'(?<=[.!?…])\s+|\n+',t) if p.strip()]
def content(s):
    return set(w for w in re.findall(r"[a-z][a-z'-]+", s.lower()) if w not in STOP and len(w)>2)
def stem(w):
    for suf in ("'s","s'","ing","ed","es","s"):
        if w.endswith(suf) and len(w)-len(suf)>=3: return w[:-len(suf)]
    return w
def analyse(cards,label):
    n=len(cards); attached=0; newnoun=[]; pron_ok=0; pron_tot=0
    for t in cards:
        S=sents(t)
        if len(S)<2: n-=1; continue
        prior=set(stem(w) for w in content(' '.join(S[:-1])))
        last=set(stem(w) for w in content(S[-1]))
        fresh=[w for w in last if w not in prior]
        # a last sentence ATTACHES if it shares >=1 content stem with what came before
        if last & prior: attached+=1
        newnoun.append(len(fresh))
        # pronoun in last sentence with an antecedent anywhere earlier
        m=re.match(r'^\W*(it|they|he|she|them|this|that|those)\b',S[-1],re.I)
        if m:
            pron_tot+=1
            if S[:-1]: pron_ok+=1
    import statistics as st
    print('%-34s n=%3d  last sent shares a noun with the scene: %3.0f%%   new content words in closer: median %d'
          %(label,n,100*attached/max(1,n),st.median(newnoun) if newnoun else 0))
    return 100*attached/max(1,n)
if __name__=='__main__':
    exec(open('w2_corpus_measure.py').read())
    ref=[r['t'] for r in rows]
    analyse(ref,'REFERENCE (347 job-like rites)')
    def parse(p):
        out=[]
        for blk in re.split(r'\n## ',open(p,encoding='utf-8').read())[1:]:
            m=re.search(r'^\*\*(.+?)\*\*\n\n(.*?)\n\n`JOB:`',blk,re.S|re.M)
            if m: out.append(m.group(2).strip())
        return out
    for f in sys.argv[1:]: analyse(parse(f),f)
