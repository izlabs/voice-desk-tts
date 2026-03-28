<p align="center">
  <h1 align="center">Voice Desk TTS</h1>
</p>

<p align="center"><strong>Browser-first Piper TTS workspace</strong></p>

<p align="center">
Test voices locally, preview output quickly, and export WAV files from a clean local session.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="./docs/training-en.md">Training Guide</a> &bull;
  <a href="./README.vi.md">Tiếng Việt</a>
  <a href="https://voice-desk-tts.pages.dev/">Demo</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/ONNX_Runtime-Web-005CED?style=flat-square" alt="ONNX Runtime Web" />
  <img src="https://img.shields.io/badge/Piper-ONNX-111111?style=flat-square" alt="Piper ONNX" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-lightgrey?style=flat-square" alt="Apache 2.0" />
</p>

<p align="center">
  <img src="./demo.png" alt="Voice Desk TTS main workspace" width="900" />
</p>

<p align="center">
  <img src="./demo_2.png" alt="Voice Desk TTS alternate workspace view" width="900" />
</p>

## Why this project exists

Voice Desk TTS is a focused web app for people who want to:

- run Piper voices locally in the browser
- compare voices quickly without setting up a full backend
- keep a lightweight generation history
- sync against the official Piper voice catalog
- train or fine-tune voices through the bundled Colab workflow when needed

This repository is intentionally narrower than a general speech lab. It is designed around browser TTS workflows first.

## Highlights

- React + Vite TTS workspace with a compact, tool-like UI
- Piper ONNX inference in the browser through Web Workers
- Local model discovery for Vietnamese, English, and Indonesian
- Official Piper catalog normalization into a single JSON index
- Stable vs experimental model labeling for browser realism
- Recent render archive stored locally for quick reuse
- Bundled Colab and training guides for teams that want one workspace

## What makes it useful

- compact React + Vite TTS workspace
- browser inference through Web Workers
- local model folders plus official Piper catalog support
- recent render archive for reuse and quick regression checks
- Colab-first training workflow for exporting new voices back into the app

## Demo Workflow

1. Add one or more Piper model pairs to `public/tts-model/<lang>/`.
2. Start the app with `npm run dev`.
3. Pick a language and model.
4. Enter text, generate audio, preview the result, and export WAV.

## Quick Start

### Requirements

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Add local models

Place Piper model pairs in one of these folders:

```text
public/tts-model/vi/
public/tts-model/en/
public/tts-model/id/
```

Each model requires:

- `voice-name.onnx`
- `voice-name.onnx.json`

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Model Sources

Voice Desk TTS supports two practical model sources:

- Local models stored inside `public/tts-model/<lang>/`
- Official Piper catalog entries normalized into `public/tts-model/piper-catalog.json`

The app merges both sources into one language-first experience instead of forcing separate browsing modes.

## Stable and Experimental Models

Not every Piper locale behaves the same in a browser-only runtime.

- `Stable` models are the ones currently expected to work well in the browser flow.
- `Experimental` models may load successfully but still fail during phonemization or runtime generation.

Browser support is currently strongest for:

- `vi_VN`
- `en_US`
- `id_ID`

Other official locales may appear as experimental because browser phonemization does not always match the phoneme mapping expected by a given Piper model.

## Official Piper Catalog Sync

This repository includes a sync script that normalizes the official Piper voice catalog into a single JSON file with fields such as:

- `language`
- `country`
- `voice_name`
- `quality`
- `model_url`
- `config_url`

It also separates multi-speaker models such as `en_US-libritts_r-medium`.

Run:

```bash
npm run catalog:piper
```

Output:

```text
public/tts-model/piper-catalog.json
```

You can also sync from a local source file:

```bash
node scripts/sync-piper-catalog.mjs --source ./path/to/voices.json
```

## Repository Layout

```text
voice-desk-tts/
  src/                React TTS workspace
  functions/api/      API routes for model listing and file delivery
  public/             Static assets, local TTS models, normalized Piper catalog
  scripts/            Voice download and catalog sync utilities
  docs/               Project and training documentation
  colab-train/        Colab notebook for training and fine-tuning
```

## Production Notes

The production app expects TTS model files under prefixes such as:

- `piper/vi/`
- `piper/en/`
- `piper/id/`

Adjust your deployment and storage configuration to match your hosting setup before publishing.

## Training New Voices

Training docs:

- English: [docs/training-en.md](./docs/training-en.md)
- Vietnamese: [docs/training-vi.md](./docs/training-vi.md)

Colab notebook:

- [colab-train/voice_desk_tts_colab.ipynb](./colab-train/voice_desk_tts_colab.ipynb)

Default public sample dataset used by the notebook:

- `audio_train_demo.zip`
- Release asset: `https://github.com/izlabs/voice-desk-tts-assets/releases/download/v0.1.0/audio_train_demo.zip`

Typical flow:

1. Train or fine-tune a Piper checkpoint with the Colab workflow in [`colab-train/`](./colab-train).
2. Export `.onnx` and `.onnx.json`.
3. Copy the pair into `public/tts-model/<lang>/`.
4. Start the app and test the voice locally.

## Tech Stack

- React 19
- Vite
- ONNX Runtime Web
- Piper ONNX models
- Web Workers
- Optional serverless API routes for model listing and file delivery

## Model and Dataset Responsibility

- Some bundled, referenced, or catalog-listed voice models may originate from third-party or community sources.
- You are responsible for verifying licenses, attribution requirements, redistribution rights, and commercial-use eligibility before using or publishing any model or dataset.
- If you train or fine-tune models with your own recordings or collected datasets, you are responsible for obtaining the necessary rights, consents, and legal permissions for that data and any generated voice output.

## License and Attribution

This repository has split licensing:

- Root web app code: Apache-2.0
- Colab notebooks and training guides are included for convenience
- Voice assets, checkpoints, datasets, and generated audio are not automatically covered by the root Apache license

Please read [ATTRIBUTION.md](./ATTRIBUTION.md) before redistributing voices, checkpoints, or datasets.

## Scope Notes

This repository is intended to be:

- a focused browser TTS workspace
- practical for local Piper testing
- transparent about browser limitations

It is not intended to be:

- a full Piper replacement
- a guarantee that every official Piper locale will run perfectly in the browser
- a general ASR or speech research suite

## Support the Project

If Voice Desk TTS saves you time or helps your team ship faster, you can support ongoing maintenance here:

<p align="center">
  <a href="https://paypal.me/llliz6">
    <img src="https://img.shields.io/badge/Support-PayPal-0070BA?style=for-the-badge&logo=paypal&logoColor=white" alt="Support via PayPal" />
  </a>
</p>

<p align="center">
  <img src="https://qr.sepay.vn/img?bank=VIB&acc=056028535&template=qronly&amount=&des=" alt="Voice Desk TTS bank QR" width="220" />
</p>

<p align="center">
  Scan the bank QR or use PayPal if you want to support the project.
</p>

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md).

Before a public release or major fork, review [docs/release-checklist.md](./docs/release-checklist.md).

## Languages

- English: this page
- Vietnamese: [README.vi.md](./README.vi.md)
