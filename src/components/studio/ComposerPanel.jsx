import React, { useEffect, useState } from 'react';

function renderModelStatusCopy(status) {
  switch (status) {
    case 'loading':
      return 'Loading model...';
    case 'error':
      return 'Model failed to load.';
    default:
      return '';
  }
}

export function ComposerPanel({ state, actions, textStats, activeVoice, availableModels, languageOptions, activeModel }) {
  const canGenerate =
    state.modelStatus === 'ready' && state.selectedModel && state.draftText.trim().length > 0;
  const showVoicePicker = state.voices.length > 1;
  const isGenerating = state.generationStatus === 'running';
  const hiddenExperimentalCount = state.availableModels.filter((model) => model.support_level === 'experimental').length;
  const [copyState, setCopyState] = useState('idle');
  const [downloadState, setDownloadState] = useState('idle');

  useEffect(() => {
    if (copyState !== 'done') return undefined;
    const timeout = window.setTimeout(() => setCopyState('idle'), 1400);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  useEffect(() => {
    if (downloadState !== 'active') return undefined;
    const timeout = window.setTimeout(() => setDownloadState('idle'), 1200);
    return () => window.clearTimeout(timeout);
  }, [downloadState]);

  const copyText = async () => {
    if (!state.draftText.trim()) return;
    try {
      await navigator.clipboard.writeText(state.draftText);
      setCopyState('done');
    } catch {
      setCopyState('idle');
    }
  };

  return (
    <section className="studio-panel studio-panel-wide">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Editor</p>
          <h3>Text</h3>
        </div>
        <div className="panel-meta">
          <span>{textStats.characters} chars</span>
          <span>{textStats.words} words</span>
        </div>
      </div>

      <div className="settings-grid">
        <label className="field-block">
          <span>Language</span>
          <div className="select-shell">
            <select value={state.language} onChange={(event) => actions.setLanguage(event.target.value)}>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="select-chevron" aria-hidden="true" />
          </div>
        </label>

        <label className="field-block">
          <span>Model</span>
          <div className="select-shell">
            <select
              value={state.selectedModel}
              onChange={(event) => actions.setSelectedModel(event.target.value)}
              aria-busy={state.modelStatus === 'loading'}
            >
              {availableModels?.length ? null : <option value="">No models found</option>}
              {availableModels?.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
            <span className="select-chevron" aria-hidden="true" />
          </div>
        </label>

        {showVoicePicker ? (
          <label className="field-block">
            <span>Voice</span>
            <div className="select-shell">
              <select
                value={state.selectedVoice}
                onChange={(event) => actions.setSelectedVoice(Number(event.target.value))}
                disabled={!state.voices.length || state.modelStatus !== 'ready'}
              >
                {state.voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
              <span className="select-chevron" aria-hidden="true" />
            </div>
          </label>
        ) : (
          <div className="field-block">
            <span>Voice</span>
            <div className="static-field">{activeVoice?.name ?? 'Default'}</div>
          </div>
        )}

        <label className="field-block">
          <span>Speed</span>
          <div className="range-wrap">
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.05"
              value={state.speed}
              onChange={(event) => actions.setSpeed(Number(event.target.value))}
            />
            <strong>{state.speed.toFixed(2)}x</strong>
          </div>
        </label>
      </div>

      {hiddenExperimentalCount ? (
        <label className="option-row">
          <input
            type="checkbox"
            checked={state.showExperimental}
            onChange={(event) => actions.setShowExperimental(event.target.checked)}
          />
          <span>Show experimental models</span>
          <small>{hiddenExperimentalCount} hidden</small>
        </label>
      ) : null}

      {renderModelStatusCopy(state.modelStatus) ? (
        <div className={`inline-status ${state.modelStatus === 'loading' ? 'is-loading' : ''}`}>
          {state.modelStatus === 'loading' ? <span className="inline-spinner" aria-hidden="true" /> : null}
          <span>{renderModelStatusCopy(state.modelStatus)}</span>
        </div>
      ) : null}

      {activeModel ? (
        <div className="helper-copy">
          {activeModel.country ? <span>{activeModel.country}</span> : null}
          {activeModel.quality ? <span>{activeModel.quality}</span> : null}
          {activeModel.is_multi_speaker ? <span>{activeModel.num_speakers} speakers</span> : null}
          {activeModel.support_level === 'experimental' ? <span>Experimental</span> : null}
        </div>
      ) : hiddenExperimentalCount && !state.showExperimental ? (
        <p className="muted-copy">This language currently has experimental models only.</p>
      ) : null}

      <label className="field-block grow">
        <span>Text</span>
        <textarea
          value={state.draftText}
          onChange={(event) => actions.setDraftText(event.target.value)}
          placeholder="Type or paste text..."
        />
      </label>

      <div className="composer-actions">
        <button
          type="button"
          className="button-primary"
          onClick={actions.generate}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating ? <span className="button-spinner" aria-hidden="true" /> : null}
          {isGenerating ? 'Generating...' : 'Generate audio'}
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={actions.previewVoice}
          disabled={state.modelStatus !== 'ready' || isGenerating}
        >
          Preview voice
        </button>
      </div>

      <div className="render-board">
        <div className="render-card">
          <div className="section-heading">
            <span>Output</span>
            <small>{activeVoice?.name ?? 'No voice selected'}</small>
          </div>
          {state.currentAudioUrl ? (
            <>
              <audio controls src={state.currentAudioUrl} className="audio-player" />
              <div className="output-actions">
                <a
                  className={`output-button ${downloadState === 'active' ? 'is-active' : ''}`}
                  href={state.currentAudioUrl}
                  download={`${activeModel?.key || state.selectedModel || 'piper'}.wav`}
                  onClick={() => setDownloadState('active')}
                >
                  {downloadState === 'active' ? 'Downloading...' : 'Download WAV'}
                </a>
                <button
                  type="button"
                  className={`output-button ${copyState === 'done' ? 'is-active' : ''}`}
                  onClick={copyText}
                >
                  {copyState === 'done' ? 'Copied' : 'Copy text'}
                </button>
              </div>
            </>
          ) : isGenerating ? (
            <div className="output-pending">
              <span className="inline-spinner" aria-hidden="true" />
              <span>Generating audio...</span>
            </div>
          ) : (
            <p className="muted-copy">Your final stitched output will appear here after generation.</p>
          )}
        </div>
      </div>
    </section>
  );
}
