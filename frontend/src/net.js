export function normalizeHost(value) {
  return String(value || '').trim()
    .replace(/^(https?|wss?):\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:8080$/, '')
    .trim();
}

export function httpBase(host) { return `http://${normalizeHost(host)}:8080`; }
export function wsUrl(host) { return `ws://${normalizeHost(host)}:8080/ws/events`; }

export async function api(host, path, method = 'GET', payload) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 5000);
  try {
    const response = await fetch(httpBase(host) + path, {
      method,
      headers: { Accept: 'application/json', ...(payload ? { 'Content-Type': 'application/json' } : {}) },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      signal: ctrl.signal,
    });
    let result = null;
    try { result = await response.json(); } catch (_) { /* endpoint vazio */ }
    if (!response.ok) throw new Error(result?.error || `Erro HTTP ${response.status}`);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
