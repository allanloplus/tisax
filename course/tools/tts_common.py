"""Shared helpers for the TTS generators."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import ROOT, ORDER, CONTENT, line_hash, spoken

AUDIO = os.path.join(ROOT, 'audio')
MANIFEST = os.path.join(AUDIO, 'manifest.json')

def load_manifest():
    if os.path.exists(MANIFEST):
        return json.load(open(MANIFEST, encoding='utf-8'))
    return {}

def save_manifest(m):
    os.makedirs(AUDIO, exist_ok=True)
    tmp = MANIFEST + '.tmp'
    json.dump(m, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)
    os.replace(tmp, MANIFEST)

def iter_lines(only=None):
    """Yield (segment_id, index, who, text, hash) for every dialogue line."""
    for key in ORDER:
        p = os.path.join(CONTENT, key + '.json')
        if not os.path.exists(p):
            continue
        d = json.load(open(p, encoding='utf-8'))
        for seg in d.get('video', []):
            if only and not any(seg['id'].startswith(o) for o in only):
                continue
            for i, L in enumerate(seg['lines']):
                yield seg['id'], i, L['who'], tts_text(L['text']), line_hash(L['who'], L['text'])

# Pronunciation helpers: read some acronyms the way Taiwanese consultants say them
SUBS = [
    (r'(?<![A-Za-z])ISA\s?2027', 'I S A 二零二七'), (r'(?<![A-Za-z])ISA(?![A-Za-z])', 'I S A'),
    (r'ISO\s?27001', 'ISO 二七零零一'), (r'ISO\s?27002', 'ISO 二七零零二'), (r'ISO\s?27701', 'ISO 二七七零一'),
    (r'AL3', 'A L 三'), (r'AL2', 'A L 二'), (r'AL1', 'A L 一'),
    (r'～', '，'), (r'—', '，'), (r'／', '或'),
]
DIG = '零一二三四五六七八九'

def _int_zh(n):
    # 0–9999 的自然念法（例：72 -> 七十二、100 -> 一百、1500 -> 一千五百）
    if n < 10: return DIG[n]
    units = [(1000, '千'), (100, '百'), (10, '十')]
    out, zero = '', False
    for u, name in units:
        q, n = divmod(n, u)
        if q:
            if zero: out += '零'; zero = False
            out += ('' if (u == 10 and q == 1 and not out) else DIG[q]) + name
        elif out:
            zero = True
    if n:
        out += ('零' if zero else '') + DIG[n]
    return out

def _num(m):
    s = m.group(0)
    if '.' in s:                       # 控制項編號、版本：1.3.2 -> 一點三點二
        return '點'.join(''.join(DIG[int(c)] for c in part) for part in s.split('.'))
    if len(s) >= 4 or s.startswith('0'):  # 年份、標準號：2027、27001 -> 逐字念
        return ''.join(DIG[int(c)] for c in s)
    return _int_zh(int(s))

def numbers_zh(t):
    t = re.sub(r'(\d+(?:\.\d+)?)\s*%', lambda m: '百分之' + _num(re.match(r'.*', m.group(1))), t)
    return re.sub(r'\d+(?:\.\d+)*', _num, t)

def tts_text(t):
    t = spoken(t)
    for a, b in SUBS:
        t = re.sub(a, b, t)
    return numbers_zh(t)

def out_path(seg, i):
    return os.path.join(AUDIO, seg, f'{i:03d}.mp3')
