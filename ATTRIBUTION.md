# Attribution and License Notes

Voice Desk TTS builds on the Piper ecosystem and a public fork lineage that included `nghitts`.

The current repository has been reshaped into a React-based, TTS-only workspace. Even so, upstream notices and redistribution boundaries should remain clear.

## License scope

- Repository root web app code is distributed under the Apache License 2.0. See [LICENSE](./LICENSE).
- Colab notebooks and training guides are included as workflow documentation and helper tooling.
- Official Piper voice files, checkpoints, datasets, and generated voice assets are not covered by the root Apache license.

## Upstream projects and sources

- Piper TTS
- ONNX Runtime Web
- React
- Vite
- Official Piper voice catalog from `rhasspy/piper-voices`

## Redistribution reminder

This repository mainly ships code, metadata, and workflow documentation. If you add voices, checkpoints, datasets, or generated audio:

- verify that you have redistribution rights
- preserve upstream license notices where required
- keep dataset and speaker-consent restrictions with exported files
- do not assume Apache-2.0 from the app also covers trained voices or third-party assets
