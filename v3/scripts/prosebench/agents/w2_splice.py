#!/usr/bin/env python3
"""JOIN TEST. Half the cards keep their own last sentence; half get the NEXT card's last sentence
spliced on. A load-bearing closer makes the splice obvious; a decorative one does not."""
import re,sys,random
def sents(t):
    t=re.sub(r'\.\.\.+','…',t)
    return [p.strip() for p in re.split(r'(?<=[.!?…])\s+|\n+',t) if p.strip()]
def parse(p):
    out=[]
    for blk in re.split(r'\n## ',open(p,encoding='utf-8').read())[1:]:
        m=re.search(r'^\*\*(.+?)\*\*\n\n(.*?)\n\n`JOB:`',blk,re.S|re.M)
        if m: out.append(m.group(2).strip().replace('\n',' '))
    return out
def build(files,outmd,outkey,seedn):
    items=[]
    for f in files:
        C=[c for c in parse(f) if len(sents(c))>=2]
        for i,c in enumerate(C):
            S=sents(c); donor=sents(C[(i+1)%len(C)])
            items.append(dict(src=f,intact=' '.join(S),spliced=' '.join(S[:-1]+[donor[-1]])))
    random.seed(seedn); random.shuffle(items)
    rows=[]
    for j,it in enumerate(items):
        kind='INTACT' if j%2==0 else 'SPLICED'
        rows.append((it['src'],kind,it[ 'intact' if kind=='INTACT' else 'spliced']))
    random.seed(seedn+1); random.shuffle(rows)
    with open(outmd,'w') as f:
        f.write('# %d cards\n\n'%len(rows))
        for i,(s,k,t) in enumerate(rows,1): f.write('## %d\n%s\n\n'%(i,t))
    open(outkey,'w').write('\n'.join('%d %s %s'%(i,k,s) for i,(s,k,t) in enumerate(rows,1)))
    print(outmd,len(rows))
if __name__=='__main__':
    build(sys.argv[1:3],'w2_splice_set.md','w2_splice_key.txt',5)
