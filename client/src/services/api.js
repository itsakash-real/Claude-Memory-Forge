const API_BASE = '/api';

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for Gemini calls

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
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
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The AI may be under heavy load — please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  startSession: () =>
    request('/session/start', { method: 'POST', body: JSON.stringify({}) }),

  getStatus: (sessionId) =>
    request(`/session/${sessionId}/status`),

  // Submit answer → Gemini processes synchronously → returns result
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
