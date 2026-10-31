#!/usr/bin/env python3
"""English dialogue audio with natural native-English voices (sherpa-onnx + Kokoro multi-lang v1.0).

  pip install sherpa-onnx soundfile        # plus ffmpeg (with rubberband) on PATH
  # model: https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2
  python tools/tts_en.py --model /path/to/kokoro-multi-lang-v1_0 [--only v-is-1a]
  python tools/build.py

Only lines whose text or voice settings changed are re-rendered (audio/manifest.json).
"""
import argparse, os, subprocess, sys, tempfile, time
import soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts_common import iter_lines, load_manifest, save_manifest, out_path

# speaker id in kokoro-multi-lang-v1_0, speed, pitch factor (rubberband, 1.0 = unchanged)
VOICE = {
    'allan': {'name': 'am_michael', 'sid': 16, 'speed': 1.0, 'pitch': 1.0},
    'arale': {'name': 'af_jessica', 'sid': 4, 'speed': 1.08, 'pitch': 1.0905},  # +1.5 semitones, younger
}
SIG = {w: f"kokoro-en|{v['name']}|{v['speed']}|{v['pitch']}" for w, v in VOICE.items()}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--threads', type=int, default=os.cpu_count() or 4)
    a = ap.parse_args()
    import sherpa_onnx
    K = a.model.rstrip('/') + '/'
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=K + 'model.onnx', voices=K + 'voices.bin', tokens=K + 'tokens.txt', data_dir=K + 'espeak-ng-data',
            dict_dir=K + 'dict', lexicon=K + 'lexicon-us-en.txt,' + K + 'lexicon-zh.txt'),
        num_threads=a.threads), max_num_sentences=1))
    man = load_manifest()
    def stale(seg, i, who, h):
        m = man.get(seg, {}).get(str(i), {})
        return m.get('h') != h or m.get('v') != SIG[who] or not os.path.exists(out_path(seg, i))
    todo = [x for x in iter_lines(a.only) if stale(x[0], x[1], x[2], x[4])]
    print(f'{len(todo)} lines to synthesize', flush=True)
    t0 = time.time()
    with tempfile.TemporaryDirectory() as td:
        for n, (seg, i, who, text, h) in enumerate(todo, 1):
            v = VOICE[who]
            audio = tts.generate(text, sid=v['sid'], speed=v['speed'])
            wav = os.path.join(td, 'x.wav'); sf.write(wav, audio.samples, audio.sample_rate)
            dst = out_path(seg, i); os.makedirs(os.path.dirname(dst), exist_ok=True)
            shift = f"rubberband=pitch={v['pitch']}:formant=shifted:pitchq=quality," if v['pitch'] != 1.0 else ''
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-af',
                            shift + 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5,apad=pad_dur=0.12',
                            '-ac', '1', '-ar', '24000', '-b:a', '48k', dst], check=True)
            d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst],
                                     capture_output=True, text=True).stdout.strip() or 0)
            man.setdefault(seg, {})[str(i)] = {'h': h, 'd': round(d, 2), 'engine': 'kokoro-en', 'v': SIG[who]}
            if n % 20 == 0 or n == len(todo):
                save_manifest(man); el = time.time() - t0
                print(f'{n}/{len(todo)}  {el/60:.1f} min elapsed, eta {el/n*(len(todo)-n)/60:.1f} min', flush=True)
    save_manifest(man)

if __name__ == '__main__':
    main()
