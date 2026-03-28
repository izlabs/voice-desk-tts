import { PiperTTS, TextSplitterStream } from '../lib/piper-tts-i18n.js';
import { resolveModelAssetBase } from '../config.js';
import { WORKER_EVENT, isWorkerBootstrap, isWorkerPreview } from './worker-protocol.js';

let activeSynthesizer = null;

function toSpeakerId(rawVoice) {
  return typeof rawVoice === 'number' ? rawVoice : parseInt(rawVoice, 10) || 0;
}

function toLengthScale(speed) {
  return 1.0 / (speed || 1.0);
}

function createTextQueue(text) {
  const queue = new TextSplitterStream();
  queue.push(text);
  queue.close();
  return queue;
}

function postWorkerError(error) {
  console.error('Worker failed:', error);
  self.postMessage({ status: WORKER_EVENT.error, data: error.message });
}

async function bootSynthesizer(languageCode, modelKey, modelRecord = null) {
  const assetBase = resolveModelAssetBase(modelRecord?.local_folder || languageCode);
  const modelPath = modelRecord?.model_url || `${assetBase}${modelKey}.onnx`;
  const configPath = modelRecord?.config_url || `${assetBase}${modelKey}.onnx.json`;

  activeSynthesizer = await PiperTTS.from_pretrained(modelPath, configPath);
  self.postMessage({
    status: WORKER_EVENT.ready,
    voices: activeSynthesizer.getSpeakers(),
  });
}

async function emitPreview(text, voice, speed) {
  const stream = activeSynthesizer.stream(createTextQueue(text), {
    speakerId: toSpeakerId(voice),
    lengthScale: toLengthScale(speed),
  });

  for await (const { audio } of stream) {
    self.postMessage({ status: WORKER_EVENT.preview, audio: audio.toBlob() });
    break;
  }
}

async function runSynthesis(text, voice, speed) {
  const audioParts = [];
  const stream = activeSynthesizer.stream(createTextQueue(text), {
    speakerId: toSpeakerId(voice),
    lengthScale: toLengthScale(speed),
  });

  for await (const { text: spokenText, audio } of stream) {
    self.postMessage({
      status: WORKER_EVENT.stream,
      chunk: {
        audio: audio.toBlob(),
        text: spokenText,
      },
    });
    audioParts.push(audio);
  }

  if (!audioParts.length) {
    self.postMessage({ status: WORKER_EVENT.complete, audio: null });
    return;
  }

  const mergedAudio = stitchAudioParts(audioParts);
  self.postMessage({ status: WORKER_EVENT.complete, audio: mergedAudio.toBlob() });
}

function stitchAudioParts(audioParts) {
  const sampleRate = audioParts[0].sampling_rate;
  const totalLength = audioParts.reduce((sum, part) => sum + part.audio.length, 0);
  let waveform = new Float32Array(totalLength);
  let cursor = 0;

  for (const part of audioParts) {
    waveform.set(part.audio, cursor);
    cursor += part.audio.length;
  }

  normalizePeak(waveform, 0.9);
  waveform = trimSilence(waveform, 0.002, Math.floor(sampleRate * 0.02));

  return new audioParts[0].constructor(waveform, sampleRate);
}

self.addEventListener('message', async ({ data }) => {
  const { type, text, voice, speed, lang, model, modelSpec } = data;

  try {
    if (isWorkerBootstrap(type)) {
      await bootSynthesizer(lang, model, modelSpec);
      return;
    }

    if (!activeSynthesizer) {
      throw new Error('Synthesizer is not ready yet.');
    }

    if (isWorkerPreview(type)) {
      await emitPreview(text, voice, speed);
      return;
    }

    await runSynthesis(text, voice, speed);
  } catch (error) {
    postWorkerError(error);
  }
});

function normalizePeak(f32, target = 0.9) {
  if (!f32?.length) return;
  let max = 1e-9;
  for (let i = 0; i < f32.length; i++) max = Math.max(max, Math.abs(f32[i]));
  const gain = Math.min(4, target / max);
  if (gain < 1) {
    for (let i = 0; i < f32.length; i++) f32[i] *= gain;
  }
}

function trimSilence(f32, thresh = 0.002, minSamples = 480) {
  let start = 0;
  let end = f32.length - 1;
  while (start < end && Math.abs(f32[start]) < thresh) start++;
  while (end > start && Math.abs(f32[end]) < thresh) end--;
  start = Math.max(0, start - minSamples);
  end = Math.min(f32.length, end + minSamples);
  return f32.slice(start, end);
}
