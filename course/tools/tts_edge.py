#!/usr/bin/env python3
"""Regenerate all dialogue audio with Microsoft Edge neural voices (Taiwan Mandarin).

Run this on any computer with normal internet access:
  pip install edge-tts
  python tools/tts_edge.py            # all segments
  python tools/tts_edge.py --only v-is-1   # just some segments
  python tools/build.py               # refresh durations in data/

Allan  -> zh-TW-YunJheNeural  雲哲 (rate +6%, pitch -2Hz)
ARALE  -> zh-TW-HsiaoYuNeural 曉雨 (rate +10%, pitch +28Hz)
（與「資安宣導線上動畫課程」相同的聲線設定）
Lines are re-rendered when their text or the voice settings change; --force re-renders everything.
"""
import argparse, asyncio, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts_common import iter_lines, load_manifest, save_manifest, out_path

# 聲線設定沿用「資安宣導線上動畫課程」：
# Allan 講師：雲哲（台灣男聲）；ARALE 助教：曉雨（提高音調、稍快，可愛女聲）
VOICE = {'allan': ('zh-TW-YunJheNeural', '+6%', '-2Hz'),
         'arale': ('zh-TW-HsiaoYuNeural', '+10%', '+28Hz')}
SIG = {k: '|'.join(v) for k, v in VOICE.items()}

async def synth(text, who, dst):
    import edge_tts
    v, rate, pitch = VOICE[who]
    tmp = dst + '.tmp.mp3'
    await edge_tts.Communicate(text, v, rate=rate, pitch=pitch).save(tmp)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-16:TP=-1.5,apad=pad_dur=0.12',
                    '-ac', '1', '-ar', '24000', '-b:a', '48k', dst], check=True)
    os.remove(tmp)

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--jobs', type=int, default=3)
    a = ap.parse_args()
    man = load_manifest()
    def stale(seg, i, who, h):
        m = man.get(seg, {}).get(str(i), {})
        return m.get('engine') not in ('edge', 'azure') or m.get('h') != h or m.get('v') != SIG[who] or not os.path.exists(out_path(seg, i))
    todo = [x for x in iter_lines(a.only) if a.force or stale(x[0], x[1], x[2], x[4])]
    print(f'{len(todo)} lines to synthesize')
    sem = asyncio.Semaphore(a.jobs); done = 0
    async def one(seg, i, who, text, h):
        nonlocal done
        async with sem:
            dst = out_path(seg, i); os.makedirs(os.path.dirname(dst), exist_ok=True)
            for attempt in range(6):
                try:
                    await synth(text, who, dst); break
                except Exception as e:  # 網路不穩或被限流時退避重試
                    if attempt == 5: print('FAILED', seg, i, e, flush=True); return
                    await asyncio.sleep(min(30, 2 ** (attempt + 1)))
            d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst],
                                     capture_output=True, text=True).stdout.strip() or 0)
            man.setdefault(seg, {})[str(i)] = {'h': h, 'd': round(d, 2), 'engine': 'edge', 'v': SIG[who]}
            done += 1
            if done % 25 == 0:
                save_manifest(man); print(f'{done}/{len(todo)}', flush=True)
    await asyncio.gather(*(one(*x) for x in todo))
    save_manifest(man)
    print('done — now run: python tools/build.py')

if __name__ == '__main__':
    asyncio.run(main())
