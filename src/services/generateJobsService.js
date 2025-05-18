// src/services/generateJobFromPrompt.js

export async function generateJobFromPrompt(recruiterPrompt) {
  const response = await fetch('/api/generate-job', {  // o '/api/openia/generate-job'
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recruiterPrompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error desconocido en el servidor');
  }
  return await response.json();
}
