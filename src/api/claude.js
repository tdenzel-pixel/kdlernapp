const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function summarizeImages(base64Images, subject) {
  const response = await fetch(`${API_URL}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: base64Images.map((img) => ({
        data: img.data,
        mediaType: img.mediaType,
      })),
      subject,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API-Fehler: ${response.status}`);
  }

  const data = await response.json();
  return data.summary;
}
