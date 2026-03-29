const API_BASE = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    
    // Handle rate limiting
    if (response.status === 429) {
      throw new Error(data.message || 'Too many requests. Please slow down.');
    }
    
    throw new Error(data.message || data.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  validateKey: (apiKey) =>
    request('/validate-key', { method: 'POST', body: JSON.stringify({ apiKey }) }),

  startSession: (apiKey) =>
    request('/session/start', { method: 'POST', body: JSON.stringify({ apiKey }) }),

  getStatus: (sessionId) =>
    request(`/session/${sessionId}/status`),

  submitAnswer: (sessionId, stepIndex, answer) =>
    request(`/session/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ stepIndex, answer })
    }),

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
