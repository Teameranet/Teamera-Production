// In-memory map of projectId -> Set of SSE response objects
const projectClients = new Map();

export const addChatClient = (projectId, res) => {
  const key = projectId.toString();
  if (!projectClients.has(key)) projectClients.set(key, new Set());
  projectClients.get(key).add(res);
  console.log(`[Chat SSE] Client joined project: ${key} | total in room: ${projectClients.get(key).size}`);
};

export const removeChatClient = (projectId, res) => {
  const key = projectId.toString();
  const room = projectClients.get(key);
  if (room) {
    room.delete(res);
    if (room.size === 0) projectClients.delete(key);
  }
  console.log(`[Chat SSE] Client left project: ${key}`);
};

export const broadcastToProject = (projectId, data) => {
  const key = projectId.toString();
  const room = projectClients.get(key);
  if (!room || room.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of room) {
    try {
      res.write(payload);
      if (typeof res.flush === 'function') res.flush();
    } catch (err) {
      console.error(`[Chat SSE] Write failed:`, err.message);
      room.delete(res);
    }
  }
};
