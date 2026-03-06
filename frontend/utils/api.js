// API utility for making requests to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET request
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create and export a singleton instance
const api = new ApiClient(API_BASE_URL);

// Export API endpoints for easy access
export const endpoints = {
  // User endpoints
  users: {
    login: '/api/users/login',
    verifyEmail: '/api/users/verify-email',
    getAll: '/api/users',
    getById: (id) => `/api/users/${id}`,
    getProfile: (id) => `/api/users/${id}/profile`,
    getProjects: (id) => `/api/users/${id}/projects`,
    create: '/api/users',
    update: (id) => `/api/users/${id}`,
    updateProfile: (id) => `/api/users/${id}/profile`,
    delete: (id) => `/api/users/${id}`,
  },
  // Project endpoints
  projects: {
    getAll: '/api/projects',
    getById: (id) => `/api/projects/${id}`,
    create: '/api/projects',
    update: (id) => `/api/projects/${id}`,
    delete: (id) => `/api/projects/${id}`,
    getUserProjects: (userId) => `/api/projects/user/${userId}`,
    updateStage: (id) => `/api/projects/${id}/stage`,
    addTeamMember: (id) => `/api/projects/${id}/team`,
    removeTeamMember: (id, userId) => `/api/projects/${id}/team/${userId}`,
  },
  // Dashboard endpoints
  dashboard: {
    get: (userId) => `/api/dashboard/${userId}`,
    getStats: (userId) => `/api/dashboard/${userId}/stats`,
    getBookmarks: (userId) => `/api/dashboard/${userId}/bookmarks`,
    getApplications: (userId) => `/api/dashboard/${userId}/applications`,
    addBookmark: (userId) => `/api/dashboard/${userId}/bookmarks`,
    removeBookmark: (userId, projectId) => `/api/dashboard/${userId}/bookmarks/${projectId}`,
    addApplication: (userId) => `/api/dashboard/${userId}/applications`,
    updateApplicationStatus: (userId, applicationId) => `/api/dashboard/${userId}/applications/${applicationId}`,
  },
  // Contact endpoint
  contact: '/api/contact',
  // Health check
  health: '/health',
};

export default api;
export { API_BASE_URL };
