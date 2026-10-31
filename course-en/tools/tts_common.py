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

# Pronunciation helpers for English speech
KEEP_WORDS = {'ISO', 'NIST', 'RAID', 'SAML', 'WAN', 'LAN', 'NAS', 'CAD', 'ERP', 'OEM'}
SAY = {'TISAX': 'Tee-sax', 'GDPR': 'G D P R', 'IoT': 'I o T', 'SaaS': 'sass', 'MES': 'M E S', 'SOC': 'sock'}

def _acronym(m):
    w = m.group(0)
    if w in SAY: return SAY[w]
    if w in KEEP_WORDS: return w
    return ' '.join(w)

def tts_text(t):
    t = spoken(t)
    t = re.sub(r'ISO\s?(\d{5})', lambda m: 'ISO ' + ' '.join(m.group(1)), t)      # ISO 27001 -> ISO 2 7 0 0 1
    t = re.sub(r'\bAL([123])\b', r'A L \1', t)
    t = re.sub(r'\b(?:TISAX|GDPR|IoT|SaaS)\b', lambda m: SAY[m.group(0)], t)
    t = re.sub(r'\b[A-Z]{2,5}s?\b', lambda m: _acronym(re.match(r'[A-Z]+', m.group(0))) + ('s' if m.group(0).endswith('s') and not m.group(0).isupper() else ''), t)
    t = t.replace('～', ', ').replace('—', ', ').replace('/', ' or ')
    return re.sub(r'\s+', ' ', t).strip()

def out_path(seg, i):
    return os.path.join(AUDIO, seg, f'{i:03d}.mp3')
