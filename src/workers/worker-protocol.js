export const WORKER_REQUEST = {
  bootstrap: 'init',
  preview: 'preview',
  synthesize: 'synthesize',
};

export const WORKER_EVENT = {
  ready: 'ready',
  stream: 'stream',
  preview: 'preview',
  complete: 'complete',
  error: 'error',
};

export function isWorkerBootstrap(messageType) {
  return messageType === WORKER_REQUEST.bootstrap;
}

export function isWorkerPreview(messageType) {
  return messageType === WORKER_REQUEST.preview;
}
