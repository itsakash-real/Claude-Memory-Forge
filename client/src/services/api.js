const API_BASE = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error(data.message || 'Too many requests. Please slow down.');
    }
    throw new Error(data.message || data.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // No more validateKey or apiKey-based startSession
  startSession: () =>
    request('/session/start', { method: 'POST', body: JSON.stringify({}) }),

  getStatus: (sessionId) =>
    request(`/session/${sessionId}/status`),

  // Submit answer → get jobId back
  submitAnswer: (sessionId, stepIndex, answer) =>
    request(`/session/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ stepIndex, answer })
    }),

  // Poll job status
  getJobStatus: (sessionId, jobId) =>
    request(`/session/${sessionId}/job/${jobId}`),

  getPreview: (sessionId) =>
    request(`/session/${sessionId}/preview`),

  getFilePreview: (sessionId, filePath) =>
    request(`/session/${sessionId}/file?path=${encodeURIComponent(filePath)}`),

  regenerateStep: (sessionId, stepIndex) =>
    request(`/session/${sessionId}/regenerate-step`, {
      method: 'POST',
      body: JSON.stringify({ stepIndex })
    }),

  getDownloadUrl: (sessionId) =>
    `${API_BASE}/session/${sessionId}/download`
};

// Helper: polls job status until completed or failed
export async function pollJobUntilDone(sessionId, jobId, { onStateChange, intervalMs = 3000 } = {}) {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const { state, result, failReason } = await api.getJobStatus(sessionId, jobId);
        if (onStateChange) onStateChange(state);

        if (state === 'completed') return resolve(result);
        if (state === 'failed') return reject(new Error(failReason || 'Job failed'));
        if (state === 'not_found') return reject(new Error('Job not found'));

        // Still waiting or active — poll again
        setTimeout(poll, intervalMs);
      } catch (err) {
        reject(err);
      }
    };
    poll();
  });
}
