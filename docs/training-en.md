# Training Guide (English)

This guide explains how to train or fine-tune a Piper-compatible voice, export it to ONNX, and load it into `voice-desk-tts`.

## 1. Scope

This repository now recommends the main Colab workflow under [`colab-train/voice_desk_tts_colab.ipynb`](../colab-train/voice_desk_tts_colab.ipynb) for training and fine-tuning.

The practical flow is:

1. prepare your dataset
2. train or fine-tune with Colab
3. export `.onnx` + `.onnx.json`
4. copy the model pair into the web app model folder

## 2. Recommended environment

Training is easiest on Linux or WSL2.

Recommended baseline:

- Python 3.10 or 3.11
- `espeak-ng`
- `ffmpeg`
- `git`
- `build-essential`, `cmake`, `ninja-build`
- CUDA-capable GPU if available

Practical hardware guidance:

- 8 GB VRAM can work for small fine-tunes
- 12-24 GB VRAM is much more comfortable
- CPU-only training is possible but very slow

## 3. Install the training environment

Use the bundled Colab notebook as the primary setup path:

```text
colab-train/voice_desk_tts_colab.ipynb
```

If you are reproducing the workflow manually in another environment, make sure the underlying Piper training dependencies are installed there.

## 4. Prepare your dataset

### Audio requirements

Keep the dataset consistent:

- one speaker per dataset if you want a single-speaker model
- mono audio preferred
- one sample rate for the whole dataset, typically `22050`
- low noise, low reverb, low clipping
- natural pauses are fine, but trim long silence

### Folder layout

```text
datasets/
  vi_female_01/
    audio/
      utt0001.wav
      utt0002.wav
    metadata.csv
```

### Metadata format

`metadata.csv` uses the `|` delimiter:

```text
utt0001.wav|Hello, this is sample one.
utt0002.wav|Today the weather is clear and quiet.
```

Rules:

- column 1: audio file name
- column 2: transcript

The file names must exist under `--data.audio_dir`.

### Dataset quality tips

- record with the same microphone and room whenever possible
- avoid mixing multiple speaking styles in one voice
- remove music beds and strong room echo
- normalize loudness gently, do not over-compress
- fix transcript mistakes before training

## 5. Pick the phonemization voice

List available voices:

```bash
espeak-ng --voices
```

Choose a voice that matches your language. Examples often used:

- English: `en-us`
- Vietnamese: use a Vietnamese voice available in your local `espeak-ng` build
- Indonesian: use an Indonesian voice available in your local `espeak-ng` build

Do not assume every `espeak-ng` package ships the same language list. Always check locally.

## 6. Train or fine-tune

Use the Colab notebook for the full command sequence and environment bootstrap.

Fine-tuning from an existing Piper checkpoint is still strongly recommended, and the notebook already wires that flow in.

Meaning of the key flags:

- `data.voice_name`: internal name for the run
- `data.csv_path`: transcript manifest
- `data.audio_dir`: audio directory
- `model.sample_rate`: must match your dataset
- `data.espeak_voice`: phonemizer voice
- `data.cache_dir`: cached preprocessed features
- `data.config_path`: output config JSON path
- `data.batch_size`: memory-dependent training batch size
- `ckpt_path`: optional checkpoint for fine-tuning

## 7. English-specific advice

- English usually fine-tunes well from existing `en_US` Piper checkpoints.
- Normalize abbreviations before training if your corpus contains many short forms.
- Keep punctuation realistic; Piper learns phrasing from it.

## 8. Vietnamese-specific advice

- Keep one accent per dataset. Do not mix Northern and Southern speech unless that is intentional.
- Expand dates, currencies, abbreviations, and mixed English terms consistently.
- If your transcripts contain a lot of numerals, normalize them before training.
- Avoid mixing formal and highly conversational spelling in the same corpus unless the target voice really does both.

## 9. Monitor quality during training

Check samples during training for:

- pronunciation drift
- unstable pacing
- robotic vowels
- clipped endings
- noise copied from the dataset

If output quality stalls:

- clean the dataset again
- reduce transcript errors
- lower batch size if memory is unstable
- continue from a better checkpoint instead of training from scratch

## 10. Export to ONNX

Use the export step from the Colab notebook to produce the final ONNX pair.

You need two files with the same basename:

- `vi_VN-custom-medium.onnx`
- `vi_VN-custom-medium.onnx.json`

The `.onnx.json` file is the config written earlier through `--data.config_path`.

## 11. Load the model into the web app

For local development, place the exported pair into:

```text
public/
  tts-model/
    vi/
      vi_VN-custom-medium.onnx
      vi_VN-custom-medium.onnx.json
```

The current app ships with language folders for:

- Vietnamese: `public/tts-model/vi/`
- English: `public/tts-model/en/`
- Indonesian: `public/tts-model/id/`

For production, upload the same files under the matching prefix:

- `piper/vi/`
- `piper/en/`
- `piper/id/`

If you add a new language, keep the folder name and object-storage prefix aligned with the app config.

## 12. Troubleshooting

### Model loads but speech sounds wrong

- verify sample rate
- verify transcripts match the audio exactly
- verify the correct `espeak-ng` voice was used

### Training crashes with OOM

- lower `--data.batch_size`
- use a smaller checkpoint or fewer concurrent processes

### Pronunciation is unstable

- clean punctuation and numerals
- remove bad recordings
- increase dataset consistency

### Voice identity is weak

- use more data from the same speaker
- fine-tune from a closer base checkpoint
- remove mixed-style recordings

## 13. Licensing reminder

Before publishing a trained voice:

- verify the speaker consent
- verify dataset redistribution rights
- verify checkpoint or voice-card restrictions
- keep model-specific licensing notes with the exported files
