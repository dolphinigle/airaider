import re,sys
STOP=set('''a an the of to and in is are was were be been being it its this that these those he she they
him her them his their you your yours yourself we our us for on at by with from as but or so if not no
there here what who which when where how why into out up down over under about after before again very
just now still even only all some any each every both more most other another one two three will shall
would could should may might must can do does did has have had'''.split())
NEG=r"\b(not|n't|no|never|nothing|nobody|none|refus\w+|denie\w*|won't|cannot|can't|instead|rather than|without|fail\w*)\b"
CONTR=r"\b(but|yet|though|although|however|still|only|already|even|except|unless|despite)\b"
COMP=r"\b(more|less|fewer|smaller|larger|bigger|older|newer|too|than|enough|same)\b"
def sents(t):
    t=re.sub(r'\.\.\.+','…',t)
    return [p.strip() for p in re.split(r'(?<=[.!?…])\s+|\n+',t) if p.strip()]
def stem(w):
    for s in ("'s","ing","ed","es","s"):
        if w.endswith(s) and len(w)-len(s)>=3: return w[:-len(s)]
    return w
def cw(s): return set(stem(w) for w in re.findall(r"[a-z][a-z'-]+",s.lower()) if w not in STOP and len(w)>2)
def rate(cards,label):
    ok=0;dang=0;n=0
    for t in cards:
        S=sents(t)
        if len(S)<2: continue
        n+=1
        L=S[-1]; prior=cw(' '.join(S[:-1]))
        anchored=bool(cw(L)&prior)
        turns=bool(re.search(NEG,L,re.I) or re.search(CONTR,L,re.I) or re.search(COMP,L,re.I))
        if anchored and turns: ok+=1
        if re.match(r'^\W*(it|they|this|that|those|these)\b',L,re.I) and not anchored: dang+=1
    print('%-30s n=%3d  ANCHORED+TURNS %3.0f%%   bare-pronoun opener w/o anchor %3.0f%%'%(label,n,100*ok/n,100*dang/n))
    return 100*ok/n
if __name__=='__main__':
    exec(open('w2_corpus_measure.py').read())
    rate([r['t'] for r in rows],'REFERENCE 347')
    def parse(p):
        out=[]
        for blk in re.split(r'\n## ',open(p,encoding='utf-8').read())[1:]:
            m=re.search(r'^\*\*(.+?)\*\*\n\n(.*?)\n\n`JOB:`',blk,re.S|re.M)
            if m: out.append(m.group(2).strip())
        return out
    for f in sys.argv[1:]: rate(parse(f),f)
