# Build US pronunciation shards (syllables + stress) from the CMU Pronouncing Dictionary.
import sys, re, os, collections
src, out = sys.argv[1], sys.argv[2]
V = {'AA','AE','AH','AO','AW','AY','EH','ER','EY','IH','IY','OW','OY','UH','UW'}
ONSETS = set()
singles = 'B CH D DH F G HH JH K L M N P R S SH T TH V W Y Z ZH'.split()
for c in singles: ONSETS.add((c,))
for c in ['P R','P L','B R','B L','T R','D R','K R','K L','G R','G L','F R','F L','TH R','SH R',
          'S P','S T','S K','S M','S N','S L','S W','S F','T W','D W','K W','G W','TH W','HH W',
          'P Y','B Y','F Y','V Y','M Y','K Y','HH Y','G Y','N Y','L Y',
          'S P R','S T R','S K R','S P L','S K W','S K Y','S P Y']:
    ONSETS.add(tuple(c.split()))
def syl(phones):
    base = [re.sub(r'\d','',p) for p in phones]
    nuc = [i for i,b in enumerate(base) if b in V]
    if not nuc: return [phones]
    bounds = [0]
    for a, b in zip(nuc, nuc[1:]):
        cons = list(range(a+1, b))
        split = b  # default: all consonants to coda
        for k in range(len(cons)+1):  # largest legal onset
            on = tuple(base[i] for i in cons[k:])
            if not on or on in ONSETS: split = cons[k] if k < len(cons) else b; break
        bounds.append(split)
    bounds.append(len(phones))
    return [phones[bounds[i]:bounds[i+1]] for i in range(len(bounds)-1)]
data = collections.OrderedDict()
with open(src, encoding='utf-8') as f:
    for line in f:
        line = line.split('#')[0].strip()
        if not line: continue
        w, *ph = line.split()
        w = re.sub(r'\(\d+\)$', '', w)
        v = data.setdefault(w, [])
        if len(v) < 2: v.append('.'.join(' '.join(s) for s in syl(ph)))
shards = collections.defaultdict(list)
for w, vs in data.items():
    k = w[0] if 'a' <= w[0] <= 'z' else '0'
    shards[k].append(w + '\t' + ';'.join(vs))
tot = 0
for k, lines in shards.items():
    t = '\n'.join(lines) + '\n'
    open(os.path.join(out, k + '.txt'), 'w', encoding='utf-8', newline='\n').write(t); tot += len(t)
print(len(data), 'words,', len(shards), 'files,', tot//1024, 'KB')
