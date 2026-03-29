export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || null
    });
  }

  if (err.name === 'GeminiError') {
    return res.status(502).json({
      error: 'AI Service Error',
      message: 'Failed to process with Gemini API. Please check your API key and try again.',
      details: err.message
    });
  }

  if (err.name === 'SessionNotFound') {
    return res.status(404).json({
      error: 'Session Not Found',
      message: 'The session has expired or does not exist. Please start a new session.'
    });
  }

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}
