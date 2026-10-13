#!/usr/bin/env python3
"""Build site data files from course/content/*.json.

Outputs (all plain JS so the site also works when opened from file://):
  data/toc.js            course map (modules > chapters > controls/videos)
  data/text/<key>.js     textbook content per module
  data/video/<seg>.js    one small file per video segment (fast first load)
  data/quiz.js           quizzes
Durations come from audio/manifest.json when audio has been generated.
"""
import json, os, re, sys, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'content')
DATA = os.path.join(ROOT, 'data')
ORDER = ['intro', 'is1', 'is2', 'is5', 'is6', 'pp', 'dp', 'audit']

def load(key):
    with open(os.path.join(CONTENT, key + '.json'), encoding='utf-8') as f:
        return json.load(f)

def js(path, prefix, obj, suffix=');\n'):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(prefix + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + suffix)

def spoken(text):
    return re.sub(r'\*\*', '', text).strip()

def line_hash(who, text):
    return hashlib.sha1((who + '|' + spoken(text)).encode('utf-8')).hexdigest()[:12]

def estimate(text):
    return round(max(2.0, len(spoken(text)) * 0.235), 2)

def main():
    manifest = {}
    mp = os.path.join(ROOT, 'audio', 'manifest.json')
    if os.path.exists(mp):
        manifest = json.load(open(mp, encoding='utf-8'))
    toc, missing, seen_ids = [], [], set()
    total_lines = total_dur = 0
    for key in ORDER:
        p = os.path.join(CONTENT, key + '.json')
        if not os.path.exists(p):
            missing.append(key); continue
        d = load(key)
        js(os.path.join(DATA, 'text', key + '.js'), 'COURSE_DATA(' + json.dumps(key) + ',', {k: d[k] for k in ('key', 'module', 'chapters')})
        vids_by_ch = {}
        for seg in d.get('video', []):
            assert seg['id'] not in seen_ids, 'duplicate segment id ' + seg['id']
            seen_ids.add(seg['id'])
            mseg = manifest.get(seg['id'], {})
            lines = []
            for i, L in enumerate(seg['lines']):
                h = line_hash(L['who'], L['text'])
                m = mseg.get(str(i))
                dur = m['d'] if m and m.get('h') == h and m.get('engine') in ('edge', 'azure', 'kokoro11') else estimate(L['text'])
                o = {'who': L['who'], 'emo': L.get('emo', ''), 'text': L['text'], 'd': dur}
                # 只有用微軟台灣語音（雲哲／曉雨）錄製且文字相符的句子才標記為有錄音
                if m and m.get('h') == h and m.get('engine') in ('edge', 'azure', 'kokoro11') and os.path.exists(os.path.join(ROOT, 'audio', seg['id'], f'{i:03d}.mp3')):
                    o['a'] = 1
                if L.get('slide'): o['slide'] = L['slide']
                lines.append(o)
            dur = round(sum(x['d'] for x in lines) + 0.35 * len(lines))
            total_lines += len(lines); total_dur += dur
            js(os.path.join(DATA, 'video', seg['id'] + '.js'), 'VSEG(', {'id': seg['id'], 'title': seg['title'], 'chapter': seg['chapter'], 'lines': lines})
            vids_by_ch.setdefault(seg['chapter'], []).append({'id': seg['id'], 'title': seg['title'], 'n': len(lines), 'dur': dur})
        chapters = []
        for c in d['chapters']:
            chapters.append({'id': c['id'], 'title': c['title'], 'title_en': c.get('title_en', ''),
                             'controls': [{'id': x['id'], 'title': x['title']} for x in c.get('controls', [])],
                             'videos': vids_by_ch.get(c['id'], [])})
        orphan = set(vids_by_ch) - {c['id'] for c in d['chapters']}
        if orphan: print('WARN orphan video chapters', key, orphan)
        toc.append({'key': key, 'module': d['module'], 'chapters': chapters})
    js(os.path.join(DATA, 'toc.js'), 'window.TOC=', toc, ';\n')
    qp = os.path.join(CONTENT, 'quiz.json')
    if os.path.exists(qp):
        js(os.path.join(DATA, 'quiz.js'), 'window.QUIZ=', json.load(open(qp, encoding='utf-8')), ';\n')
    nctl = sum(len(c['controls']) for m in toc for c in m['chapters'])
    print(f'modules={len(toc)} controls={nctl} segments={len(seen_ids)} lines={total_lines} video≈{total_dur/3600:.2f}h missing={missing}')

if __name__ == '__main__':
    main()
