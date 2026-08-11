const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchAPI(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  getNotes: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/api/notes?${q}`);
  },
  getNote: (id) => fetchAPI(`/api/notes/${id}`),
  createNote: (data) => fetchAPI('/api/notes', { method: 'POST', body: JSON.stringify(data) }),
  toggleLike: (id, liked) => fetchAPI(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify({ liked }) }),
  toggleCollect: (id, collected) => fetchAPI(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify({ collected }) }),
  addComment: (id, text) => fetchAPI(`/api/notes/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),

  getMe: () => fetchAPI('/api/users/me'),
  getMeStats: () => fetchAPI('/api/users/me/stats'),
  followUser: (id) => fetchAPI(`/api/users/${id}/follow`, { method: 'POST' }),

  getNotifications: () => fetchAPI('/api/notifications'),
  markAllRead: () => fetchAPI('/api/notifications/read-all', { method: 'POST' }),

  getChats: () => fetchAPI('/api/chats'),
  getChat: (id) => fetchAPI(`/api/chats/${id}`),
  sendMessage: (chatId, text) => fetchAPI(`/api/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),

  getCollections: () => fetchAPI('/api/collections'),
  createCollection: (data) => fetchAPI('/api/collections', { method: 'POST', body: JSON.stringify(data) }),
  toggleCollectionNote: (colId, noteId) => fetchAPI(`/api/collections/${colId}/notes`, { method: 'POST', body: JSON.stringify({ noteId }) }),

  getScheduled: () => fetchAPI('/api/scheduled'),
  createScheduled: (data) => fetchAPI('/api/scheduled', { method: 'POST', body: JSON.stringify(data) }),
  deleteScheduled: (id) => fetchAPI(`/api/scheduled/${id}`, { method: 'DELETE' }),

  getAnalytics: () => fetchAPI('/api/analytics'),
  generateCaptions: (topic, tone) => fetchAPI('/api/ai/captions', { method: 'POST', body: JSON.stringify({ topic, tone }) }),
  getTheme: () => fetchAPI('/api/theme'),
  updateTheme: (data) => fetchAPI('/api/theme', { method: 'PUT', body: JSON.stringify(data) }),
};
