// In-memory map of connected SSE clients for community updates
// Each client subscribes to all community events (new posts, comments, likes, etc.)
const communityClients = new Map();

/**
 * Add a client connection for community updates
 * @param {string} userId - User ID subscribing to community updates
 * @param {Response} res - Express response object for SSE
 */
export const addCommunityClient = (userId, res) => {
  const key = (typeof userId === 'object' && userId !== null)
    ? (userId._id || userId).toString()
    : userId.toString();
  
  // Close any stale connection for this user before replacing
  const existing = communityClients.get(key);
  if (existing) {
    try { existing.end(); } catch (_) {}
  }
  
  communityClients.set(key, res);
  console.log(`[Community SSE] Client connected: ${key} | total: ${communityClients.size}`);
};

/**
 * Remove a client connection
 * @param {string} userId - User ID to disconnect
 */
export const removeCommunityClient = (userId) => {
  const key = (typeof userId === 'object' && userId !== null)
    ? (userId._id || userId).toString()
    : userId.toString();
  
  communityClients.delete(key);
  console.log(`[Community SSE] Client disconnected: ${key} | total: ${communityClients.size}`);
};

/**
 * Broadcast an event to all connected community clients
 * @param {Object} data - Event data to broadcast
 * @param {string} data.type - Event type (newPost, newComment, likeUpdate, deletePost, etc.)
 * @param {Object} data.payload - Event payload
 */
export const broadcastToCommunity = (data) => {
  let successCount = 0;
  let failCount = 0;
  
  communityClients.forEach((res, userId) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Flush if the response supports it (compression middleware adds flush)
      if (typeof res.flush === 'function') res.flush();
      successCount++;
    } catch (err) {
      console.error(`[Community SSE] Write failed for ${userId}:`, err.message);
      communityClients.delete(userId);
      failCount++;
    }
  });
  
  if (successCount > 0) {
    console.log(`[Community SSE] Broadcast ${data.type} to ${successCount} clients (${failCount} failed)`);
  }
};

/**
 * Push an event to a specific user
 * @param {string} userId - Target user ID
 * @param {Object} data - Event data
 */
export const pushToCommunityUser = (userId, data) => {
  const key = (typeof userId === 'object' && userId !== null)
    ? (userId._id || userId).toString()
    : userId.toString();
  
  const res = communityClients.get(key);
  if (res) {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
      console.log(`[Community SSE] Pushed ${data.type} to: ${key}`);
    } catch (err) {
      console.error(`[Community SSE] Write failed for ${key}:`, err.message);
      communityClients.delete(key);
    }
  }
};

/**
 * Get count of connected clients
 * @returns {number} Number of connected clients
 */
export const getCommunityClientCount = () => communityClients.size;
