# Teamera Backend & API Setup Documentation

A comprehensive guide to the backend architecture and API setup for Teamera Net, organized module by module.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Module 1: Server Setup](#module-1-server-setup)
4. [Module 2: API Routes](#module-2-api-routes)
5. [Module 3: Controllers](#module-3-controllers)
   - [3.1 Contact Controller](#31-contact-controller)
   - [3.2 User Controller](#32-user-controller)
   - [3.3 Hello Controller](#33-hello-controller)
6. [Module 4: Services](#module-4-services)
   - [4.1 Contact Service](#41-contact-service)
7. [Module 5: Middleware](#module-5-middleware)
8. [Module 6: Utils/Helpers](#module-6-utilshelpers)
9. [Module 7: Models](#module-7-models)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [Environment Configuration](#environment-configuration)
12. [Running the Server](#running-the-server)
13. [Error Handling](#error-handling)
14. [Security Best Practices](#security-best-practices)

---

## Overview

The Teamera backend is built with **Node.js** and **Express.js**, following a modular MVC (Model-View-Controller) architecture. The API provides RESTful endpoints for user management, contact form handling, and project collaboration features.

### Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| CORS | Cross-Origin Resource Sharing |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| Helmet | Security headers |
| Socket.io | Real-time communication |

---

## Project Structure

```
backend/
├── api/
│   ├── controllers/
│   │   ├── contactController.js    # Contact form handling
│   │   ├── userController.js       # User CRUD operations
│   │   └── helloController.js      # Health/test endpoint
│   ├── routes/
│   │   └── index.js                # API route definitions
│   └── services/
│       └── contactService.js       # Contact business logic
├── middleware/
│   └── auth.js                     # Authentication & logging middleware
├── models/
│   └── User.js                     # User model definition
├── utils/
│   └── helpers.js                  # Utility functions
├── config/
│   └── database.js                 # Database configuration
└── server.js                       # Main server entry point
```

---

## Module 1: Server Setup

### File: `backend/server.js`

The main entry point for the backend application. It initializes Express, configures middleware, and starts the HTTP server.

### Code Structure

```javascript
import express from 'express';
import cors from 'cors';
import apiRoutes from '../api/routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;
```

### Key Components

#### 1.1 Middleware Configuration

| Middleware | Purpose |
|------------|---------|
| `cors()` | Enables Cross-Origin Resource Sharing |
| `express.json()` | Parses incoming JSON payloads |
| `express.urlencoded()` | Parses URL-encoded bodies |

```javascript
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

#### 1.2 Route Mounting

```javascript
// API Routes - All routes prefixed with /api
app.use('/api', apiRoutes);
```

#### 1.3 Health Check Endpoint

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});
```

**Endpoint:** `GET /health`  
**Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 1.4 Error Handling Middleware

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});
```

#### 1.5 Server Startup

```javascript
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API endpoints: http://localhost:${PORT}/api`);
});

export default app;
```

### Setup Instructions

1. Navigate to project root
2. Install dependencies: `npm install`
3. Start server: `npm run server` or `npm run dev:server` (with nodemon)

---

## Module 2: API Routes

### File: `backend/api/routes/index.js`

The central routing module that defines all API endpoints and connects them to their respective controllers.

### Code Structure

```javascript
import express from 'express';
import helloController from '../controllers/helloController.js';
import contactController from '../controllers/contactController.js';
import userController from '../controllers/userController.js';
import { logger } from '../../backend/middleware/auth.js';

const router = express.Router();

// Apply logging middleware to all API routes
router.use(logger);
```

### Route Definitions

#### 2.1 Hello Endpoint

```javascript
router.get('/hello', helloController.getHello);
```

#### 2.2 Contact Endpoints

```javascript
router.post('/contact', contactController.submitContact);
```

#### 2.3 User Endpoints

```javascript
// User CRUD operations
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.get('/users/:id/profile', userController.getUserProfile);
router.get('/users/:id/projects', userController.getUserProjects);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.put('/users/:id/profile', userController.updateUserProfile);
router.delete('/users/:id', userController.deleteUser);
```

#### 2.4 API Info Endpoint

```javascript
router.get('/', (req, res) => {
  res.json({
    message: 'Clean React Architecture API',
    version: '1.0.0',
    endpoints: {
      hello: 'GET /api/hello',
      contact: 'POST /api/contact',
      users: {
        getAll: 'GET /api/users',
        getById: 'GET /api/users/:id',
        getProjects: 'GET /api/users/:id/projects',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
      }
    },
    timestamp: new Date().toISOString()
  });
});
```

### Route Table Summary

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | `/api` | inline | API info |
| GET | `/api/hello` | helloController | Health test |
| POST | `/api/contact` | contactController | Submit contact form |
| GET | `/api/users` | userController | Get all users |
| GET | `/api/users/:id` | userController | Get user by ID |
| GET | `/api/users/:id/profile` | userController | Get user profile |
| GET | `/api/users/:id/projects` | userController | Get user projects |
| POST | `/api/users` | userController | Create new user |
| PUT | `/api/users/:id` | userController | Update user |
| PUT | `/api/users/:id/profile` | userController | Update user profile |
| DELETE | `/api/users/:id` | userController | Delete user |

---

## Module 3: Controllers

Controllers handle the request/response logic and coordinate between routes and services.

---

### 3.1 Contact Controller

### File: `backend/api/controllers/contactController.js`

Handles contact form submissions with input validation and sanitization.

### Dependencies

```javascript
import { successResponse, errorResponse, sanitizeInput } from '../../backend/utils/helpers.js';
import contactService from '../services/contactService.js';
```

### Methods

#### `submitContact(req, res)`

Processes contact form submissions.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I have a question..."
}
```

**Implementation:**
```javascript
const contactController = {
  submitContact: async (req, res) => {
    try {
      const { name, email, message } = req.body;

      // Validate required fields
      if (!name || !email || !message) {
        return res.status(400).json(
          errorResponse('All fields are required', 'VALIDATION_ERROR')
        );
      }

      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        message: sanitizeInput(message)
      };

      // Process contact form through service
      const result = await contactService.processContactForm(sanitizedData);

      res.status(201).json(
        successResponse(result, 'Contact form submitted successfully')
      );
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json(
        errorResponse('Failed to submit contact form', 'SUBMISSION_ERROR')
      );
    }
  }
};
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "status": "received",
    "message": "Your message has been received and will be reviewed shortly."
  },
  "message": "Contact form submitted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "All fields are required",
  "code": "VALIDATION_ERROR"
}
```

---

### 3.2 User Controller

### File: `backend/api/controllers/userController.js`

Handles all user-related CRUD operations with in-memory storage.

### Dependencies

```javascript
import User from '../../backend/models/User.js';
import { successResponse, errorResponse, asyncHandler } from '../../backend/utils/helpers.js';
```

### Data Storage

```javascript
// In-memory storage
let users = [];

// Track user's projects and participations
const userProjects = {};
```

### Methods

#### `getAllUsers(req, res)`

Retrieves all users from the system.

```javascript
getAllUsers: asyncHandler(async (req, res) => {
  const response = successResponse(users, 'Users retrieved successfully');
  res.json(response);
})
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-1",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "message": "Users retrieved successfully"
}
```

---

#### `getUserById(req, res)`

Retrieves a specific user by ID.

```javascript
getUserById: asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json(
      errorResponse('User not found', 'USER_NOT_FOUND')
    );
  }

  const response = successResponse(user, 'User retrieved successfully');
  res.json(response);
})
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "User retrieved successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

#### `getUserProjects(req, res)`

Retrieves projects owned by or participated in by a user.

```javascript
getUserProjects: asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json(
      errorResponse('User not found', 'USER_NOT_FOUND')
    );
  }

  const projects = userProjects[id] || { 
    ownedProjects: [], 
    participatingProjects: [] 
  };
  
  const response = successResponse(projects, 'User projects retrieved successfully');
  res.json(response);
})
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ownedProjects": [],
    "participatingProjects": []
  },
  "message": "User projects retrieved successfully"
}
```

---

#### `createUser(req, res)`

Creates a new user with validation.

```javascript
createUser: asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  // Validate user data
  const validation = User.validate({ name, email });
  if (!validation.isValid) {
    return res.status(400).json(
      errorResponse(validation.errors.join(', '), 'VALIDATION_ERROR')
    );
  }

  // Check if email already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json(
      errorResponse('Email already exists', 'EMAIL_EXISTS')
    );
  }

  // Create new user
  const newUser = User.create({ name, email });
  users.push(newUser);

  // Initialize empty projects for the new user
  userProjects[newUser.id] = {
    ownedProjects: [],
    participatingProjects: []
  };

  const response = successResponse(newUser, 'User created successfully');
  res.status(201).json(response);
})
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "generated-uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "User created successfully"
}
```

---

#### `updateUser(req, res)`

Updates an existing user's information.

```javascript
updateUser: asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json(
      errorResponse('User not found', 'USER_NOT_FOUND')
    );
  }

  // Validate updated data
  const validation = User.validate({ name, email });
  if (!validation.isValid) {
    return res.status(400).json(
      errorResponse(validation.errors.join(', '), 'VALIDATION_ERROR')
    );
  }

  // Check if email is taken by another user
  const emailExists = users.find(u => u.email === email && u.id !== id);
  if (emailExists) {
    return res.status(409).json(
      errorResponse('Email already exists', 'EMAIL_EXISTS')
    );
  }

  // Update user
  users[userIndex].update({ name, email });

  const response = successResponse(users[userIndex], 'User updated successfully');
  res.json(response);
})
```

---

#### `getUserProfile(req, res)`

Retrieves detailed profile information for a user.

```javascript
getUserProfile: asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json(
      errorResponse('User not found', 'USER_NOT_FOUND')
    );
  }

  const response = successResponse(user, 'User profile retrieved successfully');
  res.json(response);
})
```

---

#### `updateUserProfile(req, res)`

Updates a user's profile with additional data.

```javascript
updateUserProfile: asyncHandler(async (req, res) => {
  const { id } = req.params;
  const profileData = req.body;

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json(
      errorResponse('User not found', 'USER_NOT_FOUND')
    );
  }

  // Update user profile with new data
  users[userIndex].update(profileData);

  const response = successResponse(users[userIndex], 'Profile updated successfully');
  res.json(response);
})
```

---

#### `deleteUser(req, res)`

Deletes a user and their associated data.

```javascript
deleteUser: asyncHandler(async (req, res) => {
  const { id } = req.params;

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json(
      errorResponse('User not found', 'USER_NOT_FOUND')
    );
  }

  // Remove user from array
  const deletedUser = users.splice(userIndex, 1)[0];

  // Remove user projects
  delete userProjects[id];

  const response = successResponse(deletedUser, 'User deleted successfully');
  res.json(response);
})
```

---

#### `verifyUserByEmail(req, res)`

Verifies if a user exists by email address. Used for team member verification during project creation.

```javascript
verifyUserByEmail: asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(
      errorResponse('Email is required', 'MISSING_EMAIL')
    );
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('-password');

  if (!user) {
    return res.status(404).json(
      errorResponse('User not found with this email', 'USER_NOT_FOUND')
    );
  }

  const response = successResponse(user, 'User verified successfully');
  res.json(response);
})
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "professional",
    "title": "The Professional",
    "bio": "Full-stack developer",
    "skills": ["React", "Node.js"]
  },
  "message": "User verified successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found with this email",
  "code": "USER_NOT_FOUND"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Email is required",
  "code": "MISSING_EMAIL"
}
```

---

### 3.3 Hello Controller

### File: `backend/api/controllers/helloController.js`

A simple controller for testing API connectivity.

### Expected Implementation

```javascript
const helloController = {
  getHello: (req, res) => {
    res.json({
      success: true,
      message: 'Hello from Teamera API!',
      timestamp: new Date().toISOString()
    });
  }
};

export default helloController;
```

---

## Module 4: Services

Services contain the business logic, separated from controllers for better maintainability.

---

### 4.1 Contact Service

### File: `backend/api/services/contactService.js`

Handles the business logic for contact form processing.

### Dependencies

```javascript
import { generateId, formatDate } from '../../backend/utils/helpers.js';
```

### Data Storage

```javascript
// In-memory storage for demo purposes
const contactSubmissions = [];
```

### Methods

#### `processContactForm(contactData)`

Processes and stores contact form submissions.

```javascript
processContactForm: async (contactData) => {
  try {
    // Create contact submission record
    const submission = {
      id: generateId(),
      ...contactData,
      submittedAt: new Date(),
      status: 'received'
    };

    // Store submission
    contactSubmissions.push(submission);

    console.log('New contact submission:', {
      id: submission.id,
      name: submission.name,
      email: submission.email,
      time: formatDate(submission.submittedAt)
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: submission.id,
      status: 'received',
      message: 'Your message has been received and will be reviewed shortly.'
    };
  } catch (error) {
    console.error('Contact service error:', error);
    throw new Error('Failed to process contact form');
  }
}
```

---

#### `getAllSubmissions()`

Retrieves all contact submissions (admin function).

```javascript
getAllSubmissions: async () => {
  return contactSubmissions.map(submission => ({
    ...submission,
    formattedDate: formatDate(submission.submittedAt)
  }));
}
```

---

#### `getSubmissionById(id)`

Retrieves a specific submission by ID.

```javascript
getSubmissionById: async (id) => {
  const submission = contactSubmissions.find(s => s.id === id);
  if (!submission) {
    throw new Error('Submission not found');
  }
  return {
    ...submission,
    formattedDate: formatDate(submission.submittedAt)
  };
}
```

---

## Module 5: Middleware

### File: `backend/middleware/auth.js`

Contains authentication and logging middleware functions.

### Expected Implementation

```javascript
// Logger middleware
export const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

// Authentication middleware (JWT verification)
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};
```

---

## Module 6: Utils/Helpers

### File: `backend/utils/helpers.js`

Utility functions used across the backend.

### Expected Implementation

```javascript
import { v4 as uuidv4 } from 'uuid';

// Generate unique ID
export const generateId = () => {
  return uuidv4();
};

// Format date to readable string
export const formatDate = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Success response formatter
export const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    data,
    message
  };
};

// Error response formatter
export const errorResponse = (error, code = 'ERROR') => {
  return {
    success: false,
    error,
    code
  };
};

// Async handler wrapper to catch errors
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

---

## Module 7: Models

### File: `backend/models/User.js`

Defines the User model structure and validation.

### Expected Implementation

```javascript
import { generateId } from '../utils/helpers.js';

class User {
  constructor({ id, name, email, avatar, bio, skills, createdAt, updatedAt }) {
    this.id = id || generateId();
    this.name = name;
    this.email = email;
    this.avatar = avatar || null;
    this.bio = bio || '';
    this.skills = skills || [];
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // Update user data
  update(data) {
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        this[key] = data[key];
      }
    });
    this.updatedAt = new Date();
    return this;
  }

  // Static method to create a new user
  static create(data) {
    return new User(data);
  }

  // Static method to validate user data
  static validate({ name, email }) {
    const errors = [];

    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!email || !User.isValidEmail(email)) {
      errors.push('Valid email is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email validation helper
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default User;
```

---

## API Endpoints Reference

### Quick Reference Table

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/health` | GET | Server health check | No |
| `/api` | GET | API information | No |
| `/api/hello` | GET | Test endpoint | No |
| `/api/contact` | POST | Submit contact form | No |
| `/api/users/login` | POST | User login | No |
| `/api/users/verify-email` | POST | Verify user by email | No |
| `/api/users` | GET | List all users | No |
| `/api/users/:id` | GET | Get user by ID | No |
| `/api/users/:id/profile` | GET | Get user profile | No |
| `/api/users/:id/projects` | GET | Get user projects | No |
| `/api/users` | POST | Create new user | No |
| `/api/users/:id` | PUT | Update user | No |
| `/api/users/:id/profile` | PUT | Update user profile | No |
| `/api/users/:id` | DELETE | Delete user | No |

---

## Environment Configuration

### File: `.env`

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (for MongoDB integration)
MONGODB_URI=mongodb://localhost:27017/teamera-net

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Environment Variables Description

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port number | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

---

## Running the Server

### Development Mode

```bash
# With auto-restart (nodemon)
npm run dev:server
```

### Production Mode

```bash
npm run server
```

### Verification

After starting the server, verify it's running:

1. **Health Check:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **API Info:**
   ```bash
   curl http://localhost:5000/api
   ```

### Expected Console Output

```
🚀 Server running on port 5000
📍 Health check: http://localhost:5000/health
🔌 API endpoints: http://localhost:5000/api
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET/PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (e.g., email exists) |
| 500 | Internal Server Error | Server-side errors |

### Error Codes Reference

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `USER_NOT_FOUND` | Requested user doesn't exist |
| `EMAIL_EXISTS` | Email already registered |
| `SUBMISSION_ERROR` | Contact form submission failed |
| `NO_TOKEN` | Authentication token missing |
| `INVALID_TOKEN` | Authentication token invalid |
| `FORBIDDEN` | Access denied |

---

## Security Best Practices

### 1. Input Validation

Always validate and sanitize user inputs:

```javascript
const sanitizedData = {
  name: sanitizeInput(name),
  email: sanitizeInput(email),
  message: sanitizeInput(message)
};
```

### 2. CORS Configuration

Configure CORS properly for production:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. Security Headers (Helmet)

```javascript
import helmet from 'helmet';
app.use(helmet());
```

### 4. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

### 5. Password Hashing

```javascript
import bcrypt from 'bcryptjs';

// Hash password before storing
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password during login
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
```

### 6. Environment Variables

Never commit `.env` files to version control. Use `.env.example` as a template:

```bash
# Add to .gitignore
.env
.env.local
```

---

## Deployment

### Vercel Deployment (Serverless)

1. **Create serverless wrapper:**

```javascript
// api/index.js
import serverless from 'serverless-http';
import app from '../backend/server.js';

export default serverless(app);
```

2. **Configure `vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" }
  ]
}
```

3. **Set environment variables in Vercel Dashboard**

4. **Deploy:**
```bash
npx vercel --prod
```

---

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Get all users
curl http://localhost:5000/api/users

# Create user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Update user
curl -X PUT http://localhost:5000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"John Updated","email":"john.updated@example.com"}'

# Delete user
curl -X DELETE http://localhost:5000/api/users/USER_ID

# Submit contact form
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","message":"Hello!"}'
```

### Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:5000`
3. Test each endpoint with appropriate headers and body

---

## Future Enhancements

### Planned Modules

1. **Authentication Module**
   - JWT-based authentication
   - Login/Register endpoints
   - Password reset functionality

2. **Project Module**
   - Project CRUD operations
   - Team management
   - Application handling

3. **Hackathon Module**
   - Event management
   - Registration system
   - Leaderboards

4. **Messaging Module**
   - Real-time chat with Socket.io
   - Project-based channels
   - File sharing

5. **Database Integration**
   - MongoDB with Mongoose
   - Supabase PostgreSQL
   - Prisma ORM

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT in `.env` or kill existing process |
| CORS errors | Check FRONTEND_URL in `.env` |
| Module not found | Run `npm install` |
| Database connection failed | Verify connection string in `.env` |

### Debug Mode

Enable detailed logging:

```javascript
// Set in .env
NODE_ENV=development
DEBUG=true
```

---

## Changelog

### Version 1.0.0
- Initial backend setup with Express.js
- User CRUD operations
- Contact form handling
- Basic middleware (CORS, JSON parsing)
- Health check endpoint
- Error handling

---

## Support

For issues or questions:
- Check existing documentation
- Review error logs
- Open an issue on GitHub

---

*Last Updated: 2024*