#!/usr/bin/env python3
"""用微軟官方 Azure 語音服務產生對話語音（與 Edge 相同的台灣國語神經語音）。

  Allan 講師 -> zh-TW-YunJheNeural 雲哲（語速 +6%、音調 -2Hz）
  ARALE 助教 -> zh-TW-HsiaoYuNeural 曉雨（語速 +10%、音調 +28Hz）
  （聲線設定與「資安宣導線上動畫課程」相同，與 tools/tts_edge.py 共用 VOICE）

準備：Azure 入口網站建立「語音服務（Speech）」資源（免費 F0 每月 50 萬字即足夠），取得金鑰與區域。

  export AZURE_SPEECH_KEY=xxxxxxxx
  export AZURE_SPEECH_REGION=eastasia        # 你的資源所在區域
  python tools/tts_azure.py                  # 只錄尚未錄製／文字或聲線有變動的句子
  python tools/build.py

雲端環境需允許連線 <region>.tts.speech.microsoft.com。
在 Claude 雲端環境中也可不設 AZURE_SPEECH_KEY，改用「網路密鑰」自動帶入 Ocp-Apim-Subscription-Key 標頭：
  python tools/tts_azure.py --region eastasia
"""
import argparse, os, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
from xml.sax.saxutils import escape
import urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts_common import iter_lines, load_manifest, save_manifest, out_path
from tts_edge import VOICE, SIG

def ssml(text, who):
    v, rate, pitch = VOICE[who]
    return (f"<speak version='1.0' xml:lang='zh-TW' xmlns='http://www.w3.org/2001/10/synthesis'>"
            f"<voice name='{v}'><prosody rate='{rate}' pitch='{pitch}'>{escape(text)}</prosody></voice></speak>")

def synth(key, region, text, who, dst):
    req = urllib.request.Request(
        f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
        data=ssml(text, who).encode('utf-8'), method='POST',
        headers=dict({'Content-Type': 'application/ssml+xml',
                      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'isa2027-course'},
                     **({'Ocp-Apim-Subscription-Key': key} if key else {})))
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            if data:
                tmp = dst + '.tmp.mp3'
                open(tmp, 'wb').write(data)
                subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-16:TP=-1.5,apad=pad_dur=0.12',
                                '-ac', '1', '-ar', '24000', '-b:a', '48k', dst], check=True)
                os.remove(tmp)
                return True
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                raise SystemExit(f'Azure 拒絕（HTTP {e.code}）：請確認金鑰與區域是否正確')
            time.sleep(min(30, 2 ** (attempt + 1)))  # 429 限流或暫時錯誤
        except Exception:
            time.sleep(min(30, 2 ** (attempt + 1)))
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--jobs', type=int, default=4)
    ap.add_argument('--region')
    a = ap.parse_args()
    ap_region = a.region or os.environ.get('AZURE_SPEECH_REGION')
    key, region = os.environ.get('AZURE_SPEECH_KEY'), ap_region
    if not region:
        raise SystemExit('請以 --region 或 AZURE_SPEECH_REGION 指定 Azure 區域（例如 eastasia）')
    # 未設定 AZURE_SPEECH_KEY 時，假設由雲端環境的「網路密鑰」自動帶入 Ocp-Apim-Subscription-Key
    man = load_manifest()
    def stale(seg, i, who, h):
        m = man.get(seg, {}).get(str(i), {})
        return m.get('engine') not in ('edge', 'azure') or m.get('h') != h or m.get('v') != SIG[who] or not os.path.exists(out_path(seg, i))
    todo = [x for x in iter_lines(a.only) if a.force or stale(x[0], x[1], x[2], x[4])]
    print(f'{len(todo)} lines to synthesize', flush=True)
    done = failed = 0
    def one(x):
        seg, i, who, text, h = x
        dst = out_path(seg, i); os.makedirs(os.path.dirname(dst), exist_ok=True)
        if not synth(key, region, text, who, dst):
            return x, None
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst],
                                 capture_output=True, text=True).stdout.strip() or 0)
        return x, d
    with ThreadPoolExecutor(a.jobs) as ex:
        for (seg, i, who, text, h), d in ex.map(one, todo):
            if d is None:
                failed += 1; print('FAILED', seg, i, flush=True); continue
            man.setdefault(seg, {})[str(i)] = {'h': h, 'd': round(d, 2), 'engine': 'azure', 'v': SIG[who]}
            done += 1
            if done % 50 == 0:
                save_manifest(man); print(f'{done}/{len(todo)}', flush=True)
    save_manifest(man)
    print(f'done {done}, failed {failed} — now run: python tools/build.py')

if __name__ == '__main__':
    main()
