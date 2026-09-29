const BASE = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(status, body) { super(body?.error || 'Request failed'); this.status = status; this.details = body?.details || {}; }
}

/** JSON fetch with cookies and the CSRF header the API requires. */
export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = { 'X-Requested-With': 'fetch' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + '/api' + path, { method, headers, credentials: 'include', body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError(0, { error: 'Could not reach the server. Check your connection and try again.' });
  }
  const data = (res.headers.get('content-type') || '').includes('json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
export const assetUrl = (u) => (u && u.startsWith('/uploads/') ? BASE + u : u);
