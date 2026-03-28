# Contributing

Thanks for considering a contribution to `Voice Desk TTS`.

## Project focus

This repository is centered on a browser-first Piper TTS workspace.

Good contribution areas:

- React UI and UX improvements for the TTS workspace
- Piper model loading and browser runtime stability
- Piper catalog sync and metadata tooling
- documentation, release prep, and deployment polish
- training guides and Colab workflow improvements

Please discuss first if the change would:

- expand the main app into a mixed ASR + TTS product again
- add large unrelated demo bundles or sample packs into the repo
- present experimental browser support as if it were stable

## Local workflow

```bash
npm install
npm run lint
npm run build
```

## Before opening a PR

- keep the repo scoped to TTS-first product goals
- document browser limitations honestly
- preserve attribution and license boundaries
- avoid adding third-party model files unless redistribution rights are clear

## Licensing

The root web app is Apache-2.0.

Read [ATTRIBUTION.md](./ATTRIBUTION.md) before contributing anything that touches models, datasets, checkpoints, or generated voice assets.
