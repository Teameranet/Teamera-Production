// In-memory map of userId (string) -> SSE response object
const clients = new Map();

export const addClient = (userId, res) => {
  const key = (typeof userId === 'object' && userId !== null)
    ? (userId._id || userId).toString()
    : userId.toString();
  // Close any stale connection for this user before replacing
  const existing = clients.get(key);
  if (existing) {
    try { existing.end(); } catch (_) {}
  }
  clients.set(key, res);
  console.log(`[SSE] Client connected: ${key} | total: ${clients.size}`);
};

export const removeClient = (userId) => {
  const key = (typeof userId === 'object' && userId !== null)
    ? (userId._id || userId).toString()
    : userId.toString();
  clients.delete(key);
  console.log(`[SSE] Client disconnected: ${key} | total: ${clients.size}`);
};

export const pushToUser = (userId, data) => {
  // Guard: if userId is an object (e.g. populated Mongoose doc), extract _id
  const key = (typeof userId === 'object' && userId !== null)
    ? (userId._id || userId).toString()
    : userId.toString();
  const res = clients.get(key);
  if (res) {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Flush if the response supports it (compression middleware adds flush)
      if (typeof res.flush === 'function') res.flush();
      console.log(`[SSE] Pushed notification to: ${key}`);
    } catch (err) {
      console.error(`[SSE] Write failed for ${key}:`, err.message);
      clients.delete(key);
    }
  } else {
    console.log(`[SSE] No connected client for: ${key}`);
  }
};
