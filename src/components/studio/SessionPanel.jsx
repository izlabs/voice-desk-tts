import React from 'react';

function summarizeText(text) {
  if (!text) return '';
  return text.length > 96 ? `${text.slice(0, 96).trim()}...` : text;
}

export function SessionPanel({
  state,
  latestHistoryEntry,
  activeVoice,
  activeModel,
  onReuseHistory,
  onDeleteHistory,
  onClearHistory,
  formatTimestamp,
}) {
  return (
    <section className="studio-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">History</p>
          <h3>Recent</h3>
        </div>
        {state.historyEntries.length ? (
          <button type="button" className="button-ghost" onClick={onClearHistory}>
            Clear all
          </button>
        ) : null}
      </div>

      <>
        <div className="session-summary">
          <div>
            <span>Model</span>
            <strong>{activeModel?.shortLabel || activeModel?.label || 'None selected'}</strong>
          </div>
          <div>
            <span>Voice</span>
            <strong>{activeVoice?.name ?? 'None'}</strong>
          </div>
          <div>
            <span>Speed</span>
            <strong>{state.speed.toFixed(2)}x</strong>
          </div>
        </div>

        <div className="panel-section">
          <div className="section-heading">
            <span>Latest</span>
            <small>{latestHistoryEntry ? formatTimestamp(latestHistoryEntry.createdAt) : 'No renders yet'}</small>
          </div>
          {state.currentAudioUrl ? (
            <audio controls src={state.currentAudioUrl} className="audio-player" />
          ) : (
            <p className="muted-copy">Generate once to pin the latest session render here.</p>
          )}
        </div>

        <div className="panel-section">
          <div className="section-heading">
            <span>Saved</span>
            <small>{state.loadingHistory ? 'Loading...' : `${state.historyEntries.length} entries`}</small>
          </div>
          <div className="history-list">
            {state.historyEntries.length ? (
              state.historyEntries.map((entry) => (
                <article key={entry.id} className="history-card">
                  <header>
                    <strong>{entry.modelLabel || entry.model}</strong>
                    <small>{formatTimestamp(entry.createdAt)}</small>
                  </header>
                  <p>{summarizeText(entry.text)}</p>
                  <div className="history-meta">
                    <span>Voice {entry.voice}</span>
                    <span>{entry.speed?.toFixed?.(2) ?? entry.speed}x</span>
                  </div>
                  <div className="history-actions">
                    <button type="button" className="button-secondary" onClick={() => onReuseHistory(entry)}>
                      Reuse
                    </button>
                    <button type="button" className="button-ghost" onClick={() => onDeleteHistory(entry.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-copy">No saved generations yet. The next render will be stored locally.</p>
            )}
          </div>
        </div>
      </>
    </section>
  );
}
