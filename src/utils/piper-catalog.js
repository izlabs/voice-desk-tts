import { resolveModelListEndpoint } from '../config.js';
import { readVietnameseVoiceIndex } from './model-detector.js';

const LOCAL_LANGUAGE_MAP = {
  vi_VN: { folder: 'vi', language: 'Vietnamese', country: 'Vietnam' },
  en_US: { folder: 'en', language: 'English', country: 'United States' },
  id_ID: { folder: 'id', language: 'Indonesian', country: 'Indonesia' },
};

const STABLE_LANGUAGE_CODES = new Set(['vi_VN', 'en_US', 'id_ID']);

export async function fetchPiperCatalog() {
  const response = await fetch(`${import.meta.env.BASE_URL}tts-model/piper-catalog.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Piper catalog: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function buildLanguageOptions(catalog) {
  const mergedOptions = (catalog?.models || [])
    .map((entry) => ({
      value: entry.language_code,
      label: `${entry.language} (${entry.country})`,
    }))
    .filter((entry, index, entries) => entries.findIndex((item) => item.value === entry.value) === index);

  Object.entries(LOCAL_LANGUAGE_MAP).forEach(([locale, meta]) => {
    if (!mergedOptions.some((option) => option.value === locale)) {
      mergedOptions.push({ value: locale, label: `${meta.language} (${meta.country})` });
    }
  });

  return mergedOptions.sort((left, right) => {
    if (left.value === 'vi_VN') return -1;
    if (right.value === 'vi_VN') return 1;
    return left.label.localeCompare(right.label);
  });
}

function buildLocalRecords(languageCode, modelNames) {
  const localMeta = LOCAL_LANGUAGE_MAP[languageCode];
  if (!localMeta) return [];

  return modelNames.map((modelName) => ({
    id: `local:${languageCode}:${modelName}`,
    key: modelName,
    label: modelName,
    shortLabel: modelName,
    source: 'local',
    support_level: 'stable',
    language_code: languageCode,
    voice_name: modelName,
    quality: '',
    country: localMeta.country,
    model_url: '',
    config_url: '',
    is_multi_speaker: false,
    local_folder: localMeta.folder,
  }));
}

function buildOfficialRecords(language, catalog) {
  return (catalog?.models || [])
    .filter((entry) => entry.language_code === language)
    .map((entry) => ({
      id: `official:${entry.key}`,
      key: entry.key,
      label: `${entry.voice_name} - ${entry.quality} - ${entry.country}`,
      shortLabel: `${entry.voice_name} (${entry.country})`,
      source: 'official',
      support_level: STABLE_LANGUAGE_CODES.has(entry.language_code) ? 'stable' : 'experimental',
      language_code: entry.language_code,
      voice_name: entry.voice_name,
      quality: entry.quality,
      country: entry.country,
      model_url: entry.model_url,
      config_url: entry.config_url,
      is_multi_speaker: entry.is_multi_speaker,
      num_speakers: entry.num_speakers,
    }));
}

export async function loadModelRecords(language, catalog) {
  const localMeta = LOCAL_LANGUAGE_MAP[language];
  let localRecords = [];

  if (localMeta?.folder === 'vi') {
    localRecords = buildLocalRecords(language, await readVietnameseVoiceIndex());
  } else if (localMeta?.folder) {
    const response = await fetch(resolveModelListEndpoint(localMeta.folder));
    if (!response.ok) {
      throw new Error(`Failed to fetch models for ${language}`);
    }
    const data = await response.json();
    localRecords = buildLocalRecords(language, data.models || []);
  }

  const officialRecords = buildOfficialRecords(language, catalog);
  return [...localRecords, ...officialRecords];
}

export function getDefaultDraft(language, drafts) {
  const family = language.split(/[_-]/)[0];
  return drafts[language] ?? drafts[family] ?? drafts.vi;
}
