const BASE_URL = '/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return await res.json();
  } catch (err) {
    console.error('API health check failed:', err);
    return null;
  }
}

export async function getProjectTypes() {
  const res = await fetch(`${BASE_URL}/project-types`);
  if (!res.ok) throw new Error('Failed to fetch project types');
  return await res.json();
}

export async function getStudyArea() {
  const res = await fetch(`${BASE_URL}/study-area`);
  if (!res.ok) throw new Error('Failed to fetch study area');
  return await res.json();
}

export async function analyzeProject(area, acres, project) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      area,
      acres: parseFloat(acres),
      project: project.toLowerCase().replace(/ /g, '_'),
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Analysis request failed');
  }
  return await res.json();
}
