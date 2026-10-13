#!/usr/bin/env python3
"""用「ISO27001 實體安全動畫課」的講師／助教原聲當範本，以 ZipVoice 聲音複製產生全部對話語音。

  Allan 講師：tools/voice_prompts/allan_prompt.wav（雲哲原聲片段）
  ARALE 助教：tools/voice_prompts/arale_prompt2.wav（曉雨原聲片段），不做後製，用高品質模型（fp32、8 步）

  pip install sherpa-onnx soundfile
  # 模型（k2-fsa/sherpa-onnx GitHub releases，放在同一個資料夾）：
  #   sherpa-onnx-zipvoice-distill-int8-zh-en-emilia/（Allan；含 lexicon.txt）
  #   sherpa-onnx-zipvoice-distill-zh-en-emilia/（ARALE 高品質 fp32）
  #   vocos_24khz.onnx
  python tools/tts_clone.py --models /path/to/models_dir [--only v-is-1a]
  python tools/build.py
"""
import argparse, os, subprocess, sys, tempfile, time
import soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts_common import iter_lines, load_manifest, save_manifest, out_path

HERE = os.path.dirname(os.path.abspath(__file__))
PROMPT = {
    'allan': ('先看這張全景圖。實體安全這個屬性，我把它分成兩大塊：左邊是區域安全，右邊是設備安全。', 'allan_prompt.wav'),
    'arale': ('哇哈哈，大家好！我是助教阿拉蕾！今天要跟 Allan 老師一起去機房大冒險喔！', 'arale_prompt2.wav'),
}
SPEED = {'allan': 1.0, 'arale': 1.0}
PITCH = {'allan': 1.0, 'arale': 1.0}
# 模型品質：(使用的模型, 運算步數)
QUALITY = {'allan': ('int8', 4), 'arale': ('fp32', 8)}
SIG = {'allan': f'clone2|{PROMPT["allan"][1]}|1.0|1.0',
       'arale': f'clone3|{PROMPT["arale"][1]}|1.0|1.0|fp32x8'}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--models', required=True, help='folder containing sherpa-onnx-zipvoice-distill-int8-zh-en-emilia/ and vocos_24khz.onnx')
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--threads', type=int, default=os.cpu_count() or 4)
    a = ap.parse_args()
    import sherpa_onnx
    M = a.models.rstrip('/') + '/'; Z = M + 'sherpa-onnx-zipvoice-distill-int8-zh-en-emilia/'
    F = M + 'sherpa-onnx-zipvoice-distill-zh-en-emilia/'
    def load(kind):
        enc, dec = (Z + 'encoder.int8.onnx', Z + 'decoder.int8.onnx') if kind == 'int8' else (F + 'text_encoder.onnx', F + 'fm_decoder.onnx')
        return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            zipvoice=sherpa_onnx.OfflineTtsZipvoiceModelConfig(
                tokens=Z + 'tokens.txt', encoder=enc, decoder=dec, vocoder=M + 'vocos_24khz.onnx',
                data_dir=Z + 'espeak-ng-data', lexicon=Z + 'lexicon.txt'),
            num_threads=a.threads)))
    engines = {}
    prompts = {}
    for w, (txt, f) in PROMPT.items():
        x, sr = sf.read(os.path.join(HERE, 'voice_prompts', f), dtype='float32')
        prompts[w] = (txt, x.tolist(), sr)
    man = load_manifest()
    def stale(seg, i, who, h):
        m = man.get(seg, {}).get(str(i), {})
        return m.get('h') != h or m.get('v') != SIG[who] or not os.path.exists(out_path(seg, i))
    todo = [x for x in iter_lines(a.only) if stale(x[0], x[1], x[2], x[4])]
    print(f'{len(todo)} lines to synthesize', flush=True)
    t0 = time.time()
    with tempfile.TemporaryDirectory() as td:
        for n, (seg, i, who, text, h) in enumerate(todo, 1):
            pt, ps, psr = prompts[who]
            kind, steps = QUALITY[who]
            if kind not in engines: engines[kind] = load(kind)
            audio = engines[kind].generate(text, pt, ps, psr, SPEED[who], steps)
            wav = os.path.join(td, 'x.wav'); sf.write(wav, audio.samples, audio.sample_rate)
            dst = out_path(seg, i); os.makedirs(os.path.dirname(dst), exist_ok=True)
            shift = f'asetrate={audio.sample_rate}*{PITCH[who]},aresample=24000,atempo={1 / PITCH[who]:.4f},' if PITCH[who] != 1.0 else ''
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-af',
                            shift + 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5,apad=pad_dur=0.12',
                            '-ac', '1', '-ar', '24000', '-b:a', '48k', dst], check=True)
            d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst],
                                     capture_output=True, text=True).stdout.strip() or 0)
            man.setdefault(seg, {})[str(i)] = {'h': h, 'd': round(d, 2), 'engine': 'clone', 'v': SIG[who]}
            if n % 20 == 0 or n == len(todo):
                save_manifest(man); el = time.time() - t0
                print(f'{n}/{len(todo)}  {el/60:.1f} min elapsed, eta {el/n*(len(todo)-n)/60:.1f} min', flush=True)
    save_manifest(man)

if __name__ == '__main__':
    main()
