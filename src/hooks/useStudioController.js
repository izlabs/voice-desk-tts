import { startTransition, useDeferredValue, useEffect, useReducer, useRef, useState } from 'react';

import { getSampleText } from '../data/sample-texts.js';
import { clearRenderArchive, listRenderSessions, persistRenderSession, removeRenderSession } from '../utils/history-store.js';
import { WORKER_EVENT, WORKER_REQUEST } from '../workers/worker-protocol.js';
import { buildLanguageOptions, fetchPiperCatalog, getDefaultDraft, loadModelRecords } from '../utils/piper-catalog.js';

const defaultDrafts = {
  vi: getSampleText('vi_VN'),
  en: getSampleText('en_US'),
  id: getSampleText('id_ID'),
};

const localLanguageOptions = [
  { value: 'vi_VN', label: 'Vietnamese (Vietnam)' },
  { value: 'en_US', label: 'English (United States)' },
  { value: 'id_ID', label: 'Indonesian (Indonesia)' },
];

const initialState = {
  language: 'vi_VN',
  draftText: defaultDrafts.vi,
  speed: 1,
  selectedModel: '',
  selectedVoice: 0,
  availableModels: [],
  voices: [],
  modelStatus: 'idle',
  generationStatus: 'idle',
  error: '',
  chunks: [],
  currentAudioBlob: null,
  currentAudioUrl: '',
  historyEntries: [],
  loadingHistory: true,
  showExperimental: true,
};

function studioReducer(state, action) {
  switch (action.type) {
    case 'set-language':
      if (action.language === state.language) {
        return state;
      }
      return {
        ...state,
        language: action.language,
        selectedModel: '',
        selectedVoice: 0,
        availableModels: [],
        voices: [],
        modelStatus: 'idle',
        generationStatus: 'idle',
        chunks: [],
        currentAudioBlob: null,
        currentAudioUrl: '',
        error: '',
        draftText: getSampleText(action.language) || getDefaultDraft(action.language, defaultDrafts),
      };
    case 'set-draft-text':
      return { ...state, draftText: action.text };
    case 'set-speed':
      return { ...state, speed: action.speed };
    case 'set-selected-model':
      return {
        ...state,
        selectedModel: action.model,
        selectedVoice: 0,
        voices: [],
        modelStatus: action.model ? 'loading' : 'idle',
        generationStatus: 'idle',
        chunks: [],
        currentAudioBlob: null,
        currentAudioUrl: '',
        error: '',
      };
    case 'set-selected-voice':
      return { ...state, selectedVoice: action.voice };
    case 'set-show-experimental':
      return { ...state, showExperimental: action.value };
    case 'set-models':
      return {
        ...state,
        availableModels: action.models,
        selectedModel: action.models.some((model) => model.id === state.selectedModel)
          ? state.selectedModel
          : (action.models[0]?.id ?? ''),
      };
    case 'set-model-status':
      return { ...state, modelStatus: action.status };
    case 'set-model-ready':
      return {
        ...state,
        modelStatus: 'ready',
        voices: action.voices,
        selectedVoice: action.voices.some((voice) => voice.id === state.selectedVoice)
          ? state.selectedVoice
          : (action.voices[0]?.id ?? 0),
        error: '',
      };
    case 'set-error':
      return {
        ...state,
        error: action.error,
        modelStatus: action.scope === 'model' ? 'error' : state.modelStatus,
        generationStatus: action.scope === 'generation' ? 'error' : state.generationStatus,
      };
    case 'generation-start':
      return {
        ...state,
        generationStatus: 'running',
        error: '',
        chunks: [],
        currentAudioBlob: null,
        currentAudioUrl: '',
      };
    case 'generation-chunk':
      return { ...state, chunks: [...state.chunks, action.chunk] };
    case 'generation-complete':
      return {
        ...state,
        generationStatus: 'ready',
        currentAudioBlob: action.audioBlob,
        currentAudioUrl: action.audioUrl,
      };
    case 'set-history':
      return { ...state, historyEntries: action.entries, loadingHistory: false };
    case 'set-loading-history':
      return { ...state, loadingHistory: action.value };
    default:
      return state;
  }
}

export function useStudioController() {
  const [state, dispatch] = useReducer(studioReducer, initialState);
  const [catalog, setCatalog] = useState(null);
  const [languageOptions, setLanguageOptions] = useState(localLanguageOptions);
  const workerRef = useRef(null);
  const chunkUrlsRef = useRef([]);
  const audioUrlRef = useRef('');
  const deferredText = useDeferredValue(state.draftText);
  const visibleModels = state.showExperimental
    ? state.availableModels
    : state.availableModels.filter((model) => model.support_level !== 'experimental');

  useEffect(() => {
    let cancelled = false;

    fetchPiperCatalog()
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);
        setLanguageOptions(buildLanguageOptions(data));
      })
      .catch((error) => {
        console.error('Failed to load Piper catalog', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let active = true;
    listRenderSessions()
      .then((entries) => {
        if (!active) return;
        startTransition(() => {
          dispatch({ type: 'set-history', entries });
        });
      })
      .catch((error) => {
        console.error('Failed to load history', error);
        if (active) dispatch({ type: 'set-loading-history', value: false });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'set-model-status', status: 'loading' });

    loadModelRecords(state.language, catalog)
      .then((models) => {
        if (cancelled) return;
        dispatch({ type: 'set-models', models });
        dispatch({ type: 'set-model-status', status: models.length ? 'loading' : 'idle' });
      })
      .catch((error) => {
        if (cancelled) return;
        dispatch({ type: 'set-model-status', status: 'error' });
        dispatch({ type: 'set-error', error: error.message, scope: 'model' });
      });

    return () => {
      cancelled = true;
    };
  }, [state.language, catalog]);

  useEffect(() => {
    if (!visibleModels.length) {
      if (state.selectedModel) {
        dispatch({ type: 'set-selected-model', model: '' });
      }
      return;
    }

    const currentVisible = visibleModels.some((model) => model.id === state.selectedModel);
    if (!currentVisible) {
      dispatch({ type: 'set-selected-model', model: visibleModels[0].id });
    }
  }, [visibleModels, state.selectedModel]);

  useEffect(() => {
    if (!state.selectedModel) return undefined;

    const activeModel = state.availableModels.find((model) => model.id === state.selectedModel);
    if (!activeModel) return undefined;

    dispatch({ type: 'set-model-status', status: 'loading' });

    const worker = new Worker(
      new URL(
        state.language.startsWith('vi') ? '../workers/tts-worker.js' : '../workers/tts-worker-i18n.js',
        import.meta.url
      ),
      { type: 'module' }
    );

    if (workerRef.current) {
      workerRef.current.terminate();
    }
    workerRef.current = worker;

    const handleMessage = ({ data }) => {
      switch (data.status) {
        case WORKER_EVENT.ready:
          dispatch({ type: 'set-model-ready', voices: data.voices || [{ id: 0, name: 'Voice 1' }] });
          break;
        case WORKER_EVENT.stream: {
          const audioUrl = URL.createObjectURL(data.chunk.audio);
          chunkUrlsRef.current.push(audioUrl);
          dispatch({
            type: 'generation-chunk',
            chunk: {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              text: data.chunk.text,
              audioUrl,
            },
          });
          break;
        }
        case WORKER_EVENT.complete: {
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
          }
          const audioUrl = data.audio ? URL.createObjectURL(data.audio) : '';
          audioUrlRef.current = audioUrl;
          dispatch({ type: 'generation-complete', audioBlob: data.audio || null, audioUrl });
          if (data.audio) {
            persistRenderSession({
              text: state.draftText,
              model: state.selectedModel,
              modelLabel: activeModel.shortLabel || activeModel.label || activeModel.key,
              voice: state.selectedVoice,
              speed: state.speed,
              lang: state.language,
              audio: data.audio,
            })
              .then(() => listRenderSessions())
              .then((entries) => {
                startTransition(() => {
                  dispatch({ type: 'set-history', entries });
                });
              })
              .catch((error) => console.error('History save failed', error));
          }
          break;
        }
        case WORKER_EVENT.preview:
          if (data.audio) {
            const previewUrl = URL.createObjectURL(data.audio);
            const audio = new Audio(previewUrl);
            audio.play().finally(() => {
              setTimeout(() => URL.revokeObjectURL(previewUrl), 1500);
            });
          }
          break;
        case WORKER_EVENT.error:
          dispatch({ type: 'set-error', error: data.data || 'Unknown generation error', scope: 'generation' });
          break;
        default:
          break;
      }
    };

    const handleError = (event) => {
      dispatch({ type: 'set-error', error: event.message || 'Worker crashed', scope: 'model' });
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    if (state.language.startsWith('vi')) {
      worker.postMessage({ type: WORKER_REQUEST.bootstrap, model: activeModel.key, modelSpec: activeModel });
    } else {
      worker.postMessage({
        type: WORKER_REQUEST.bootstrap,
        lang: state.language,
        model: activeModel.key,
        modelSpec: activeModel,
      });
    }

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.terminate();
    };
  }, [state.language, state.selectedModel, state.availableModels]);

  useEffect(() => () => {
    workerRef.current?.terminate();
    chunkUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const actions = {
    setLanguage: (language) => dispatch({ type: 'set-language', language }),
    setDraftText: (text) => dispatch({ type: 'set-draft-text', text }),
    setSpeed: (speed) => dispatch({ type: 'set-speed', speed }),
    setSelectedModel: (model) => dispatch({ type: 'set-selected-model', model }),
    setSelectedVoice: (voice) => dispatch({ type: 'set-selected-voice', voice }),
    setShowExperimental: (value) => dispatch({ type: 'set-show-experimental', value }),
    generate: () => {
      if (!workerRef.current || !state.selectedModel || !state.draftText.trim()) return;
      chunkUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      chunkUrlsRef.current = [];
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = '';
      }
      dispatch({ type: 'generation-start' });
      workerRef.current.postMessage({
        text: state.draftText,
        voice: state.selectedVoice,
        speed: state.speed,
      });
    },
    previewVoice: () => {
      if (!workerRef.current || !state.selectedModel) return;
      workerRef.current.postMessage({
        type: WORKER_REQUEST.preview,
        text: state.draftText.trim() || getSampleText(state.language) || getDefaultDraft(state.language, defaultDrafts),
        voice: state.selectedVoice,
        speed: state.speed,
      });
    },
    useHistoryEntry: (entry) => {
      const nextLanguage = entry.lang || 'vi_VN';
      if (nextLanguage !== state.language) {
        dispatch({ type: 'set-language', language: nextLanguage });
      }
      dispatch({ type: 'set-draft-text', text: entry.text || '' });
      dispatch({ type: 'set-speed', speed: entry.speed || 1 });
      dispatch({ type: 'set-selected-model', model: entry.model || '' });
      dispatch({ type: 'set-selected-voice', voice: entry.voice || 0 });
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const audioUrl = entry.audio ? URL.createObjectURL(entry.audio) : '';
      audioUrlRef.current = audioUrl;
      dispatch({ type: 'generation-complete', audioBlob: entry.audio || null, audioUrl });
    },
    deleteHistoryEntry: async (id) => {
      await removeRenderSession(id);
      const entries = await listRenderSessions();
      startTransition(() => {
        dispatch({ type: 'set-history', entries });
      });
    },
    clearHistory: async () => {
      await clearRenderArchive();
      startTransition(() => {
        dispatch({ type: 'set-history', entries: [] });
      });
    },
  };

  return {
    state,
    actions,
    languageOptions,
    visibleModels,
    textStats: {
      characters: deferredText.length,
      words: deferredText.trim() ? deferredText.trim().split(/\s+/).length : 0,
    },
  };
}
