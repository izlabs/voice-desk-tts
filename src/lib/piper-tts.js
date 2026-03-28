import { processTextForTTS, chunkText, loadConfig, isDebugEnabled } from '../utils/text-cleaner.js';

function mergeClausePhonemes(sourceText, rawPhonemes) {
  if (typeof rawPhonemes === 'string') {
    return rawPhonemes;
  }

  if (rawPhonemes && typeof rawPhonemes === 'object' && !Array.isArray(rawPhonemes)) {
    const maybeText = rawPhonemes.text || rawPhonemes.phonemes;
    return typeof maybeText === 'string' ? maybeText : String(maybeText ?? rawPhonemes);
  }

  if (!Array.isArray(rawPhonemes)) {
    return String(rawPhonemes ?? '');
  }

  const separators = Array.from(sourceText.matchAll(/[,;:]/g), (match) => match[0]);
  let mergedText = '';
  let separatorIndex = 0;

  for (const part of rawPhonemes) {
    if (!part) continue;
    const normalizedPart = String(part).trim();
    if (!normalizedPart) continue;

    if (mergedText) {
      const separator = separators[separatorIndex] || ',';
      mergedText += `${separator} `;
      separatorIndex += 1;
    }

    mergedText += normalizedPart;
  }

  return mergedText;
}

function resolveSymbolId(symbolMap, symbol) {
  const rawValue = symbolMap[symbol];
  return Array.isArray(rawValue) ? rawValue[0] : rawValue;
}

export class SpeechTaskQueue {
  constructor() {
    this.queue = [];
    this.closed = false;
  }

  async splitText(text) {
    const processedText = await processTextForTTS(text);
    return chunkText(processedText);
  }

  async push(text) {
    const chunks = (await this.splitText(text)) || [text];
    this.queue.push(...chunks);
  }

  close() {
    this.closed = true;
  }

  async *[Symbol.asyncIterator]() {
    for (const chunk of this.queue) {
      yield chunk;
    }
  }
}

export class WaveBlobAudio {
  constructor(audio, samplingRate) {
    this.audio = audio;
    this.sampling_rate = samplingRate;
  }

  get length() {
    return this.audio.length;
  }

  toBlob() {
    return new Blob([this.encodeWav(this.audio, this.sampling_rate)], { type: 'audio/wav' });
  }

  encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    for (let index = 0, offset = 44; index < samples.length; index++, offset += 2) {
      const sample = Math.max(-1, Math.min(1, samples[index]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return buffer;
  }

  writeString(view, offset, value) {
    for (let index = 0; index < value.length; index++) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }
}

export class BrowserPiperRuntime {
  constructor(voiceConfig = null, inferenceSession = null) {
    this.voiceConfig = voiceConfig;
    this.session = inferenceSession;
  }

  static async create(modelPath, configPath) {
    const ort = await import('onnxruntime-web');
    const { cachedFetch } = await import('../utils/model-cache.js');

    ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}onnx-runtime/`;

    const [modelResponse, configResponse] = await Promise.all([
      cachedFetch(modelPath),
      cachedFetch(configPath),
    ]);

    const [modelBuffer, voiceConfig] = await Promise.all([
      modelResponse.arrayBuffer(),
      configResponse.json(),
    ]);

    const session = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: [{ name: 'wasm', simd: true }],
    });

    return new BrowserPiperRuntime(voiceConfig, session);
  }

  static async from_pretrained(modelPath, configPath) {
    return BrowserPiperRuntime.create(modelPath, configPath);
  }

  async createPhonemeTimeline(text) {
    const config = await loadConfig();

    if (isDebugEnabled(config)) {
      console.log(`[RUNTIME] Input text: ${JSON.stringify(text)}`);
    }

    if (this.voiceConfig.phoneme_type === 'text') {
      return [Array.from(text.normalize('NFD'))];
    }

    const { phonemize } = await import('phonemizer');
    const espeakVoice = this.voiceConfig.espeak?.voice || 'en-us';
    const rawPhonemes = await phonemize(text, espeakVoice);
    const merged = mergeClausePhonemes(text, rawPhonemes)
      .replace(/\(en\)/g, '')
      .replace(/\(vi\)/g, '')
      .trim();

    const timeline = merged ? [Array.from(merged.normalize('NFD'))] : [];

    if (isDebugEnabled(config)) {
      console.log(`[RUNTIME] Phoneme timeline: ${JSON.stringify(timeline)}`);
    }

    return timeline;
  }

  async collectPhonemeIds(phonemeTimeline) {
    if (!this.voiceConfig?.phoneme_id_map) {
      throw new Error('Phoneme ID map not available');
    }

    const config = await loadConfig();
    const symbolMap = this.voiceConfig.phoneme_id_map;
    const beginToken = resolveSymbolId(symbolMap, '^');
    const endToken = resolveSymbolId(symbolMap, '$');
    const padToken = resolveSymbolId(symbolMap, '_');

    const ids = [];
    let matchedCount = 0;

    for (const sentence of phonemeTimeline) {
      if (beginToken !== undefined) ids.push(beginToken);
      if (padToken !== undefined) ids.push(padToken);

      for (const symbol of sentence) {
        if (!(symbol in symbolMap)) continue;
        const symbolId = resolveSymbolId(symbolMap, symbol);
        if (symbolId === undefined) continue;
        ids.push(symbolId);
        if (padToken !== undefined) ids.push(padToken);
        matchedCount += 1;
      }

      if (endToken !== undefined) ids.push(endToken);
    }

    if (isDebugEnabled(config)) {
      console.log(`[RUNTIME] Phoneme id length: ${ids.length}`);
    }

    if (!matchedCount || !ids.length) {
      throw new Error('This model could not phonemize the current text in the browser.');
    }

    return ids;
  }

  async buildInputs(text, options = {}) {
    const { speakerId = 0, lengthScale = 1.0, noiseScale = 0.667, noiseWScale = 0.8 } = options;
    const timeline = await this.createPhonemeTimeline(text);
    const phonemeIds = await this.collectPhonemeIds(timeline);
    const ort = await import('onnxruntime-web');

    const inputs = {
      input: new ort.Tensor('int64', new BigInt64Array(phonemeIds.map((id) => BigInt(id))), [1, phonemeIds.length]),
      input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(phonemeIds.length)]), [1]),
      scales: new ort.Tensor('float32', Float32Array.from([noiseScale, lengthScale, noiseWScale]), [3]),
    };

    if (this.voiceConfig.num_speakers > 1) {
      inputs.sid = new ort.Tensor('int64', BigInt64Array.from([BigInt(speakerId)]), [1]);
    }

    return inputs;
  }

  async *stream(textStreamer, options = {}) {
    for await (const text of textStreamer) {
      if (!text.trim()) continue;

      try {
        const inputs = await this.buildInputs(text, options);
        const results = await this.session.run(inputs);
        const output = results.output;

        yield {
          text,
          audio: new WaveBlobAudio(new Float32Array(output.data), this.voiceConfig.audio.sample_rate),
        };
      } catch (error) {
        console.error('Error generating audio:', error);
        yield {
          text,
          audio: new WaveBlobAudio(new Float32Array(22050), 22050),
        };
      }
    }
  }

  getAvailableVoices() {
    if (!this.voiceConfig || this.voiceConfig.num_speakers <= 1) {
      return [{ id: 0, name: 'Voice 1' }];
    }

    return Object.entries(this.voiceConfig.speaker_id_map || {})
      .sort(([, left], [, right]) => left - right)
      .map(([originalId, id]) => ({
        id,
        name: `Voice ${id + 1}`,
        originalId,
      }));
  }

  getSpeakers() {
    return this.getAvailableVoices();
  }

  async textToPhonemes(text) {
    return this.createPhonemeTimeline(text);
  }

  async phonemesToIds(textPhonemes) {
    return this.collectPhonemeIds(textPhonemes);
  }
}

export {
  SpeechTaskQueue as TextSplitterStream,
  WaveBlobAudio as RawAudio,
  BrowserPiperRuntime as PiperTTS,
};
