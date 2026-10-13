#!/usr/bin/env python3
"""Offline TTS with sherpa-onnx + Kokoro multi-lang v1.1 (zh/en).

  pip install sherpa-onnx soundfile
  # model: https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2
  python tools/tts_kokoro.py --model /path/to/kokoro-multi-lang-v1_1 [--only v-is-1]

Only lines whose text changed (hash in audio/manifest.json) are regenerated.
Voices (Kokoro v1.1 Chinese speakers, chosen for a young, cheerful sound):
  Allan -> sid 95 (young bright male), speed 1.08
  ARALE -> sid 41 (young lively girl), speed 1.12
For Microsoft Taiwan voices use tools/tts_edge.py instead.
"""
import argparse, os, subprocess, sys, tempfile, time
import soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts_common import iter_lines, load_manifest, save_manifest, out_path

SID = {'allan': 95, 'arale': 41}
SPEED = {'allan': 1.08, 'arale': 1.12}
SIG = {w: f'kokoro11|{SID[w]}|{SPEED[w]}' for w in SID}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--threads', type=int, default=os.cpu_count() or 4)
    a = ap.parse_args()
    import sherpa_onnx
    M = a.model.rstrip('/') + '/'
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=M + 'model.onnx', voices=M + 'voices.bin', tokens=M + 'tokens.txt',
                data_dir=M + 'espeak-ng-data', dict_dir=M + 'dict',
                lexicon=M + 'lexicon-us-en.txt,' + M + 'lexicon-zh.txt'),
            num_threads=a.threads),
        rule_fsts=M + 'phone-zh.fst,' + M + 'date-zh.fst,' + M + 'number-zh.fst',
        max_num_sentences=1)
    tts = sherpa_onnx.OfflineTts(cfg)
    man = load_manifest()
    todo = [x for x in iter_lines(a.only) if man.get(x[0], {}).get(str(x[1]), {}).get('h') != x[4] or man.get(x[0], {}).get(str(x[1]), {}).get('v') != SIG[x[2]] or not os.path.exists(out_path(x[0], x[1]))]
    print(f'{len(todo)} lines to synthesize', flush=True)
    t0 = time.time()
    with tempfile.TemporaryDirectory() as td:
        for n, (seg, i, who, text, h) in enumerate(todo, 1):
            audio = tts.generate(text, sid=SID[who], speed=SPEED[who])
            wav = os.path.join(td, 'x.wav')
            sf.write(wav, audio.samples, audio.sample_rate)
            dst = out_path(seg, i); os.makedirs(os.path.dirname(dst), exist_ok=True)
            # trim silence at edges, normalize loudness, mono 48 kbps mp3 (small = fast start)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-af',
                            'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5,apad=pad_dur=0.12',
                            '-ac', '1', '-ar', '24000', '-b:a', '48k', dst], check=True)
            d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst],
                                     capture_output=True, text=True).stdout.strip() or 0)
            man.setdefault(seg, {})[str(i)] = {'h': h, 'd': round(d, 2), 'engine': 'kokoro11', 'v': SIG[who]}
            if n % 20 == 0 or n == len(todo):
                save_manifest(man)
                el = time.time() - t0
                print(f'{n}/{len(todo)}  {el/60:.1f} min elapsed, eta {el/n*(len(todo)-n)/60:.1f} min', flush=True)
    save_manifest(man)

if __name__ == '__main__':
    main()
