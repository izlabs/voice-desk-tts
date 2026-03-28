const MODEL_PUBLIC_ROOT = 'tts-model';
const MODEL_API_PREFIX = '/api/model/piper';
const MODEL_LISTING_PREFIX = '/api/piper';

const LANGUAGE_DEFAULTS = {
  en: [],
  id: [],
};

const DEFAULT_MODEL_KEYS = {
  vi: null,
  en: 'Libritts_r',
  id: 'Indo_goreng',
};

export function isProductionRuntime() {
  return Boolean(import.meta.env.PROD);
}

export function resolveModelAssetBase(languageFolder) {
  if (isProductionRuntime()) {
    return `${MODEL_API_PREFIX}/${languageFolder}/`;
  }

  return `${import.meta.env.BASE_URL}${MODEL_PUBLIC_ROOT}/${languageFolder}/`;
}

export function resolveModelListEndpoint(languageFolder) {
  return `${MODEL_LISTING_PREFIX}/${languageFolder}/models`;
}

export const FALLBACK_LANGUAGE_MODELS = LANGUAGE_DEFAULTS;
export const DEFAULT_MODEL_KEYS_BY_LANGUAGE = DEFAULT_MODEL_KEYS;

// Compatibility exports kept temporarily while the surrounding app is being renamed.
export const getModelBaseUrl = resolveModelAssetBase;
export const getModelsListUrl = resolveModelListEndpoint;
export const DEFAULT_LANG_MODELS = FALLBACK_LANGUAGE_MODELS;
export const DEFAULT_MODEL = DEFAULT_MODEL_KEYS_BY_LANGUAGE;
