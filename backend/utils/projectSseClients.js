// Global SSE clients for project list updates (all connected users)
const clients = new Set();

export const addProjectListClient = (res) => {
  clients.add(res);
  console.log(`[Projects SSE] Client connected | total: ${clients.size}`);
};

export const removeProjectListClient = (res) => {
  clients.delete(res);
  console.log(`[Projects SSE] Client disconnected | total: ${clients.size}`);
};

export const broadcastProjectUpdate = (data) => {
  if (clients.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
      if (typeof res.flush === 'function') res.flush();
    } catch (err) {
      console.error(`[Projects SSE] Write failed:`, err.message);
      clients.delete(res);
    }
  }
};
