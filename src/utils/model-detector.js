import { resolveModelListEndpoint } from '../config.js';

function normalizeVoiceIndex(payload) {
  if (payload?.error) {
    throw new Error(payload.message || payload.error);
  }

  if (!Array.isArray(payload?.models)) {
    return [];
  }

  return payload.models;
}

export async function readVietnameseVoiceIndex() {
  const response = await fetch(resolveModelListEndpoint('vi'));

  if (!response.ok) {
    throw new Error(`Failed to fetch voice index: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return normalizeVoiceIndex(payload);
}

// Compatibility export while the rest of the app migrates to the new naming.
export async function fetchAvailableModels() {
  try {
    return await readVietnameseVoiceIndex();
  } catch (error) {
    console.error('Error fetching available models:', error);
    throw error;
  }
}
