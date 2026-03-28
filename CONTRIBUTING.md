# Contributing

Thanks for contributing to `Voice Desk TTS`.

## Project focus

Voice Desk TTS is a browser-first Piper TTS workspace. Contributions are most useful when they improve one of these areas:

- React UI and UX for the TTS workflow
- browser runtime stability and model-loading reliability
- Piper catalog sync, metadata tooling, and local model management
- documentation, release prep, and deployment polish
- Colab workflow and training guide quality

Please open an issue or discussion first if a change would:

- expand the project back into a mixed ASR and TTS product
- add large unrelated demo bundles or dataset packs to the repository
- present experimental browser support as if it were production-stable

## Local workflow

```bash
npm install
npm run lint
npm run build
```

## Pull request checklist

Before opening a PR, please make sure your contribution:

- keeps the repository aligned with its TTS-first product scope
- documents browser limitations honestly
- preserves attribution and licensing boundaries
- avoids bundling third-party models or datasets unless redistribution rights are clear
- keeps public-facing docs concise, accurate, and product-focused

## Licensing and third-party assets

The root web app is Apache-2.0, but models, datasets, checkpoints, and generated voice assets may be governed by separate terms.

Please read [ATTRIBUTION.md](./ATTRIBUTION.md) before contributing anything that touches third-party assets or training data.
