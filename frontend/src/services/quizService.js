// frontend/src/services/quizService.js

// const API_BASE_URL = 'https://englishvoclearner-backend.onrender.com';
const API_BASE_URL = 'http://127.0.0.1:5000';


/**
 * A small helper to throw an Error with a message from the response body if available.
 */
async function throwResponseError(response, defaultMessage) {
  let errorMsg = defaultMessage;
  try {
    // Attempt to parse JSON response
    const body = await response.json();
    if (body && body.error) {
      errorMsg = body.error;
    }
  } catch (err) {
    // If parsing fails, stick with defaultMessage
    console.error('Failed to parse error response', err);
  }
  throw new Error(errorMsg);
}

/**
 * Fetch available levels -> returns an array like ["LEVEL1","LEVEL2"].
 */
export async function getLevels() {
  const response = await fetch(`${API_BASE_URL}/api/levels`);
  if (!response.ok) {
    await throwResponseError(response, 'Failed to fetch levels');
  }
  const data = await response.json();
  return data.levels;
}

/**
 * Fetch a question for the given level -> returns { word, options }.
 */
export async function getQuestion(level, authHeaders = {}) {
  const response = await fetch(`${API_BASE_URL}/api/question/${level}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    }
  });
  if (!response.ok) {
    await throwResponseError(response, 'Failed to fetch question');
  }
  // if ok, parse and return
  return response.json();
}

/**
 * Fetch a question from user's vocabulary library -> returns { word, options }.
 */
export async function getVocabularyQuestion(authHeaders = {}) {
  const response = await fetch(`${API_BASE_URL}/api/vocabulary-question`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    }
  });
  if (!response.ok) {
    await throwResponseError(response, 'Failed to fetch vocabulary question');
  }
  // if ok, parse and return
  return response.json();
}

/**
 * Check the user's answer -> returns { correct: boolean, correctTranslation: string }.
 */
export async function checkAnswer(word, selected, level = null, authHeaders = {}) {
  const body = { word, selected };
  if (level) {
    body.level = level;
  }

  const response = await fetch(`${API_BASE_URL}/api/check-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    await throwResponseError(response, 'Failed to check answer');
  }
  return response.json();
}
