import re,sys,collections
for f in sys.argv[1:]:
    t=open(f).read()
    cards=re.findall(r'^\*\*(.+?)\*\*\n\n(.*?)\n\n`JOB:`',t,re.S|re.M)
    if not cards: continue
    ws=[len(c[1].split()) for c in cards]
    ws.sort()
    you=sum(1 for c in cards if re.search(r'\b(you|your)\b',c[1],re.I))
    q=sum(1 for c in cards if '"' in c[1])
    # opener bigram
    op=collections.Counter(' '.join(c[1].split()[:2]).lower() for c in cards)
    # most common 3-word phrase across cards
    ph=collections.Counter()
    for c in cards:
        w=re.findall(r"[a-z']+",c[1].lower())
        for i in range(len(w)-2): ph[' '.join(w[i:i+3])]+=1
    top=[f"{k}×{v}" for k,v in ph.most_common(6) if v>2]
    print(f"{f.split('_out_')[-1][:-3]:>5} n={len(cards)} med={ws[len(ws)//2]}w p10={ws[len(ws)//10]} p90={ws[int(len(ws)*.9)]} you={you*100//len(cards)}% quote={q*100//len(cards)}% | topopen={op.most_common(2)} | {' · '.join(top)}")
