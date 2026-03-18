const API_BASE = import.meta.env.VITE_API_URL ?? 'https://edutech.raidotaxi.in';
// const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export { API_BASE };

export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
