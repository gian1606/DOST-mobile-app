// ─── Shared API client ────────────────────────────────────────────────────────
// Holds the auth token in memory after login.
// All screens import { api } and call api.get() / api.post().

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

let _token = null;
let _user  = null;

export function setAuth(token, user) {
  _token = token;
  _user  = user;
}

export function clearAuth() {
  _token = null;
  _user  = null;
}

export function getUser() {
  return _user;
}

export function getToken() {
  return _token;
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  get:  (path)        => request('GET',  path),
  post: (path, body)  => request('POST', path, body),
};
