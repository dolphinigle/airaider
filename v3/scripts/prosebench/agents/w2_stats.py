#!/usr/bin/env python3
"""w2 — measure a runprompt .md batch on the SAME metrics as the 347 job-like Sultan's rites.
Usage: python3 w2_stats.py out.md [out2.md ...]
Corpus reference figures are hard-coded from research/sultans_en/config_merged.json.gz."""
import re,sys,statistics as st,collections

REF = dict(words_med=28, words_p25=19, words_p75=45, sent_le2=59, sent_le3=79, wps=13.0,
           you=74.6, you_first=53.3, you_last=57.6, qmark=14.7, q_last=10.4, ellipsis=35.4,
           dash=30.3, speech=4.6, digit=0.0, adjrate=2.2, abstract=13.0, aside=33.0,
           last_len=13, close_flat=57.1, close_future=12.7, close_q=10.4, close_trail=8.6)

ADJ=r'\b(old|young|great|small|large|little|dark|black|white|red|golden|ancient|strange|terrible|beautiful|cruel|poor|rich|heavy|cold|warm|quiet|loud|secret|hidden|dead|final|last|first|new|good|bad|strong|weak|deep|high|low|fresh|broken|perfect|mysterious|dangerous|difficult|simple|common|noble|brutal|fierce|silent|bloody|sacred|holy|evil|wild|distant|nearby|empty|full)\b'
ABS=set('grief loyalty fate destiny hope sorrow honor honour dignity justice mercy faith courage fear anger rage love hatred despair pride shame guilt duty truth freedom power wealth greed lust'.split())
ASIDE=r'\b(but|yet|though|although|however|of course|in any case|perhaps|maybe|probably|honestly|after all|besides|anyway|apparently|allegedly|supposedly|it seems|as if|at least|not that|even so|still)\b'

def sents(t):
    t=re.sub(r'\.\.\.+','…',t)
    return [p.strip() for p in re.split(r'(?<=[.!?…])\s+|\n+',t) if p.strip()]
def wc(s): return len(re.findall(r"[A-Za-z0-9'’\-]+",s))

def parse(path):
    txt=open(path,encoding='utf-8').read()
    cards=[]
    for blk in re.split(r'\n## ',txt)[1:]:
        m=re.search(r'^\*\*(.+?)\*\*\n\n(.*?)\n\n`JOB:`(.*?)\n',blk,re.S|re.M)
        if m: cards.append(dict(title=m.group(1).strip(),s=m.group(2).strip(),job=m.group(3).strip()))
    return cards

def report(path):
    C=parse(path)
    if not C: print(path,'NO CARDS'); return
    n=len(C); W=sorted(wc(c['s']) for c in C)
    def q(a,p): a=sorted(a); return a[min(len(a)-1,int(len(a)*p))]
    def pc(f): return 100*sum(1 for c in C if f(c))/n
    S=[sents(c['s']) for c in C]
    ns=[len(x) for x in S]
    allw=sum(W)
    adj=sum(len(re.findall(ADJ,c['s'],re.I)) for c in C)
    out=[]
    def row(k,v,ref,fmt='%.1f',good=None):
        d=v-ref
        out.append('  %-22s %8s   ref %-7s  %+6.1f'%(k,fmt%v,fmt%ref,d))
    print('\n=== %s  (n=%d) ==='%(path,n))
    row('words median',st.median(W),REF['words_med'],'%.0f')
    row('words p25',q(W,.25),REF['words_p25'],'%.0f'); row('words p75',q(W,.75),REF['words_p75'],'%.0f')
    row('sentences <=2 %',100*sum(1 for x in ns if x<=2)/n,REF['sent_le2'])
    row('sentences <=3 %',100*sum(1 for x in ns if x<=3)/n,REF['sent_le3'])
    row('words/sentence',st.median([wc(c['s'])/max(1,len(s)) for c,s in zip(C,S)]),REF['wps'])
    row('last-sent words',st.median([wc(s[-1]) for s in S]),REF['last_len'],'%.0f')
    row('you/your %',pc(lambda c: re.search(r'\b(you|your)\b',c['s'],re.I)),REF['you'])
    row(' you in sent1 %',100*sum(1 for s in S if re.search(r'\b(you|your)\b',s[0],re.I))/n,REF['you_first'])
    row(' you in last %',100*sum(1 for s in S if re.search(r'\b(you|your)\b',s[-1],re.I))/n,REF['you_last'])
    row('question %',pc(lambda c: '?' in c['s']),REF['qmark'])
    row('ellipsis %',pc(lambda c: re.search(r'\.\.\.|…',c['s'])),REF['ellipsis'])
    row('dash %',pc(lambda c: re.search(r'[—–]|\s-\s',c['s'])),REF['dash'])
    row('speech %',pc(lambda c: re.search(r'["“][^"”]{6,}["”]',c['s'])),REF['speech'])
    row('digit %',pc(lambda c: re.search(r'\d',c['s'])),REF['digit'])
    row('adj per 100w',100*adj/allw,REF['adjrate'])
    row('abstract-noun %',pc(lambda c: any(w in ABS for w in re.findall(r"[a-z']+",c['s'].lower()))),REF['abstract'])
    row('aside-marker %',pc(lambda c: re.search(ASIDE,c['s'],re.I)),REF['aside'])
    print('\n'.join(out))
    # closers
    cc=collections.Counter()
    for s in S:
        L=s[-1]
        if '?' in L: k='question'
        elif re.search(r'\b(must|have to|has to|need to|needs to)\b',L,re.I): k='obligation'
        elif re.search(r'\b(will|shall|is about to|soon|tonight|today|now)\b',L,re.I): k='future'
        elif re.search(r'…|\.\.\.$',L): k='trails'
        else: k='flat'
        cc[k]+=1
    print('  closers:',' · '.join('%s %.0f%%'%(k,100*v/n) for k,v in cc.most_common()))
    # repetition: which 3-grams repeat across cards
    g=collections.Counter()
    for c in C:
        ws=re.findall(r"[a-z']+",c['s'].lower())
        for i in range(len(ws)-2): g[' '.join(ws[i:i+3])]+=1
    rep=[(k,v) for k,v in g.most_common(14) if v>=3]
    print('  repeated 3-grams (>=3):',' | '.join('%s x%d'%(k,v) for k,v in rep) or 'none')
    # opening bigrams
    ob=collections.Counter(' '.join(re.findall(r"[A-Za-z']+",s[0])[:2]).lower() for s in S)
    print('  opening bigrams:',' | '.join('%s x%d'%(k,v) for k,v in ob.most_common(8)))
    # distinct opening first-words
    fw=collections.Counter(re.findall(r"[A-Za-z']+",s[0])[0].lower() for s in S)
    print('  distinct opening words: %d/%d'%(len(fw),n))
    # title shape
    tw=[len(t['title'].split()) for t in C]
    print('  title words median %.0f  colon %.0f%%'%(st.median(tw),pc(lambda c:':' in c['title'])))

for p in sys.argv[1:]: report(p)
