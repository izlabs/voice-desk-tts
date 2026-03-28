import React, { useMemo } from 'react';

import { ComposerPanel } from './components/studio/ComposerPanel.jsx';
import { SessionPanel } from './components/studio/SessionPanel.jsx';
import { useStudioController } from './hooks/useStudioController.js';

function formatTimestamp(value) {
  if (!value) return 'Just now';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return 'Recent session';
  }
}

export default function App() {
  const { state, actions, textStats, languageOptions, visibleModels } = useStudioController();

  const activeVoice = useMemo(
    () => state.voices.find((voice) => voice.id === state.selectedVoice) ?? state.voices[0] ?? null,
    [state.selectedVoice, state.voices]
  );
  const activeModel = useMemo(
    () => state.availableModels.find((model) => model.id === state.selectedModel) ?? null,
    [state.availableModels, state.selectedModel]
  );

  const latestHistoryEntry = state.historyEntries[0] ?? null;

  return (
    <div className="studio-app">
      <main className="studio-main">
        <header className="studio-topbar">
          <div className="topbar-title">
            <div>
              <p className="eyebrow">Piper TTS Web</p>
              <h1>Voice Desk TTS</h1>
            </div>
          </div>
          <div className="topbar-status">
            <div className="status-pill">
              <span className={`status-dot ${state.modelStatus}`} />
              <span>
                {state.modelStatus === 'loading'
                  ? `Loading ${activeModel?.shortLabel || activeModel?.label || 'model'}`
                  : (activeModel?.shortLabel || activeModel?.label || 'No model')}
              </span>
            </div>
            <div className="status-pill">
              <span className={`status-dot ${state.generationStatus}`} />
              <span>{state.generationStatus}</span>
            </div>
          </div>
        </header>

        {state.error ? <div className="studio-alert">{state.error}</div> : null}

        <section className="studio-shell">
          <section className="studio-grid">
            <ComposerPanel
              state={state}
              actions={actions}
              textStats={textStats}
              activeVoice={activeVoice}
              availableModels={visibleModels}
              languageOptions={languageOptions}
              activeModel={activeModel}
            />

            <aside className="workspace-sidebar">
              <SessionPanel
                state={state}
                latestHistoryEntry={latestHistoryEntry}
                activeVoice={activeVoice}
                activeModel={activeModel}
                onReuseHistory={actions.useHistoryEntry}
                onDeleteHistory={actions.deleteHistoryEntry}
                onClearHistory={actions.clearHistory}
                formatTimestamp={formatTimestamp}
              />
            </aside>
          </section>
        </section>
      </main>
    </div>
  );
}
