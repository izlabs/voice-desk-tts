# Release Checklist

## Identity and positioning

- [x] Decide on the public product name: `Voice Desk TTS`
- [x] Decide on the repository/package slug: `voice-desk-tts`
- [ ] Make README, package description, HTML metadata, screenshots, and deployment copy use the same identity
- [ ] Confirm the repo is intentionally positioned as a focused TTS workspace, not a generic Piper mirror

## Repository hygiene

- [ ] Review repository history before publishing
- [ ] Make sure the worktree is clean before the release commit
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Smoke-test TTS with at least one local model
- [ ] Confirm no private `.env` values, internal domains, or local paths remain

## Scope control

- [ ] Confirm the app is intentionally TTS-only in code, docs, and deployment config
- [ ] Confirm ASR, demo assets, and other removed legacy pieces are not referenced anywhere public-facing
- [ ] Confirm stable vs experimental model support is documented honestly

## Model and catalog checks

- [ ] Run `npm run catalog:piper`
- [ ] Review the generated `public/tts-model/piper-catalog.json`
- [ ] Verify which locales are marked stable vs experimental
- [ ] Verify trained voice licenses before uploading model files

## License and attribution

- [ ] Confirm `LICENSE` and attribution notes are preserved
- [ ] Confirm `ATTRIBUTION.md` matches actual upstream sources and boundaries
- [ ] Confirm redistribution rights for any bundled voices, checkpoints, datasets, or demo audio
- [ ] Confirm the Apache-2.0 root app license is not presented as covering third-party model assets, datasets, or generated voices

## Deployment

- [ ] Replace placeholder bucket names, domains, and deployment secrets
- [ ] Verify deployment configuration is ready for public release
- [ ] Confirm Pages Functions routes match current production behavior

## Documentation

- [ ] Review English docs
- [ ] Review Vietnamese docs
- [ ] Add current screenshots or GIFs of the React TTS workspace
- [ ] Confirm quick-start steps match the actual current app
