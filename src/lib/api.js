import { auth } from './firebase'

/**
 * Wrapper around fetch that automatically adds Firebase ID token.
 * Use this for all calls to /api/* routes from the frontend.
 */
export async function apiFetch(path, options = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const token = await user.getIdToken()

  const resp = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await resp.json()
  if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`)
  return data
}

export const api = {
  submitTeam:    (body) => apiFetch('/api/team/submit',    { method: 'POST', body }),
  joinContest:   (body) => apiFetch('/api/contest/join',   { method: 'POST', body }),
  createContest: (body) => apiFetch('/api/contest/create', { method: 'POST', body }),
}

