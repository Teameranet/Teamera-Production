# Teamera Net Backend

A complete Node.js + Express + MongoDB backend for the Teamera Net collaborative platform.

## Features

- **Authentication & Authorization**: JWT-based auth with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.io for live updates
- **API**: RESTful API with comprehensive endpoints
- **Security**: Helmet, CORS, rate limiting, input validation
- **Models**: User, Project, Hackathon, Message with relationships

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT Authentication
- bcryptjs
- Express Validator
- Helmet
- CORS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/Teamera-net
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/Teamera-net

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/Teamera-net` as MONGODB_URI

#### Option B: MongoDB Atlas (Recommended)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace the connection string in your `.env` file

### 4. Start the Server

```bash
# Development mode with auto-restart
npm run dev:server

# Production mode
npm run server
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `DELETE /api/auth/account` - Delete user account

### Users
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/projects` - Get user's projects

### Projects
- `GET /api/projects` - Get all projects (paginated)
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/join` - Join project
- `POST /api/projects/:id/leave` - Leave project
- `POST /api/projects/:id/members` - Add project member
- `DELETE /api/projects/:id/members/:userId` - Remove project member
- `PUT /api/projects/:id/members/:userId` - Update member role

### Hackathons
- `GET /api/hackathons` - Get all hackathons (paginated)
- `GET /api/hackathons/upcoming` - Get upcoming hackathons
- `GET /api/hackathons/:id` - Get hackathon by ID
- `POST /api/hackathons` - Create hackathon
- `PUT /api/hackathons/:id` - Update hackathon
- `DELETE /api/hackathons/:id` - Delete hackathon
- `POST /api/hackathons/:id/register` - Register for hackathon
- `POST /api/hackathons/:id/unregister` - Unregister from hackathon

### Messages
- `POST /api/projects/:projectId/messages` - Send message
- `GET /api/projects/:projectId/messages` - Get project messages
- `PUT /api/messages/:messageId` - Update message
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/:messageId/reactions` - Add reaction
- `DELETE /api/messages/:messageId/reactions` - Remove reaction

### Contact
- `POST /api/contact` - Submit contact form

## Real-time Features

The backend includes Socket.io for real-time communication:

- **Project Rooms**: Join/leave project-specific rooms
- **Live Messaging**: Real-time message delivery
- **Typing Indicators**: Show when users are typing
- **Project Updates**: Live project change notifications

## Database Models

### User
- Basic profile information
- Skills and bio
- Authentication data
- Project relationships

### Project
- Project details and metadata
- Member management
- Status and visibility settings
- Technology stack

### Hackathon
- Event information
- Registration management
- Participant tracking
- Prize information

### Message
- Project-based messaging
- Reply functionality
- Reactions system
- Soft deletion

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Express-validator middleware
- **Rate Limiting**: Prevent abuse
- **CORS**: Configured for frontend
- **Helmet**: Security headers
- **Data Sanitization**: Clean user inputs

## Error Handling

- Comprehensive error responses
- Validation error messages
- Database error handling
- Authentication error handling
- Rate limiting responses

## Development

### Project Structure
```
backend/
├── config/
│   └── database.js
├── models/
│   ├── User.js
│   ├── Project.js
│   ├── Hackathon.js
│   └── Message.js
├── middleware/
│   ├── auth.js
│   └── validation.js
├── api/
│   ├── controllers/
│   ├── routes/
│   └── services/
├── utils/
│   └── helpers.js
├── server.js
└── config.env
```

### Scripts
- `npm run server` - Start production server
- `npm run dev:server` - Start development server with nodemon

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT_SECRET
3. Configure MongoDB Atlas
4. Set up proper CORS origins
5. Configure rate limiting
6. Use environment variables for all secrets

## Health Check

Visit `http://localhost:5000/health` to check server status.

## API Documentation

Visit `http://localhost:5000/api` for complete API endpoint documentation.

## Deploy on Vercel (Serverless)

This section explains how to deploy the Node/Express + MongoDB backend to Vercel using Serverless Functions.

### Prerequisites
- Use MongoDB Atlas and copy your connection string (recommended for production). Ensure your cluster allows connections from Vercel by whitelisting IPs or using u201cAllow access from anywhereu201d for testing.
- Prepare environment variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `NODE_ENV=production`, `FRONTEND_URL` (your deployed frontend domain), `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`.
- Update CORS to allow your Vercel frontend domain (e.g., `https://your-frontend.vercel.app`).

### Prepare Express for Serverless
To run Express on Vercel Serverless Functions, export the Express app without calling `app.listen` inside the function:

1) Create a reusable app module (e.g., `backend/app.js`) that exports the Express instance (middleware, routes, etc.).
2) Keep `backend/server.js` for local development (it imports the app and calls `app.listen` when running locally).
3) Create a serverless function entry (e.g., `api/index.js`) that wraps the app with `serverless-http` and exports a handler.

Example structure (indicative):

```js
// backend/app.js
const express = require('express');
const app = express();
// ... your middleware, routes, and configurations ...
module.exports = app;
```

```js
// backend/server.js (local dev)
const app = require('./app');
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

```js
// api/index.js (Vercel serverless function)
const serverless = require('serverless-http');
const app = require('../backend/app');
module.exports = serverless(app);
```

Install the adapter:

```bash
npm install serverless-http
```

### vercel.json configuration
Add routing so all `/api/*` requests hit the serverless function and set a reasonable timeout:

```json
{
  "version": 2,
  "builds": [{ "src": "api/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/api/(.*)", "dest": "/api/index.js" }],
  "functions": { "api/index.js": { "maxDuration": 30 } }
}
```

### Environment Variables on Vercel
- In Vercel Dashboard: Project u2192 Settings u2192 Environment Variables.
- Add: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `NODE_ENV=production`, `FRONTEND_URL`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`.
- Redeploy to apply changes.

### Deploy Steps
- Via CLI:
  - First deployment: `npx vercel --yes`
  - Production deployment: `npx vercel --prod --yes`
- Or import the repository in Vercel Dashboard and deploy from there.

### Update Frontend API Base URL
- Point your frontend to: `https://<your-project>.vercel.app/api`.
- Example: `fetch('https://<your-project>.vercel.app/api/projects')`.

### Health Check
- After deploying, verify with: `https://<your-project>.vercel.app/api/health` (or your health endpoint under `/api`).

### Real-time & WebSockets
- Vercel Serverless Functions are not ideal for long-lived WebSocket connections (Socket.io). Consider:
  - Hosting realtime services on Render, Railway, Fly.io, or a dedicated VM.
  - Using Vercel WebSockets (beta) if available, or third-party providers like Ably/Pusher.

### Common Pitfalls & Tips
- Cold starts: Minimize per-request heavy initialization.
- Database connections: Create and cache the Mongoose connection outside the handler so invocations reuse it.
- Timeouts: Keep handlers fast; use queues/background workers for long tasks and set `functions.maxDuration` appropriately.
- File uploads: Use cloud storage (e.g., S3) and pre-signed URLs instead of handling large uploads in serverless.
- CORS: Ensure `FRONTEND_URL` matches your deployed domain.

With this setup, your API will be available at `https://<your-project>.vercel.app/api/*`, and your frontend can interact with it securely using MongoDB Atlas.

---------------------------------------------------------------------
## Integrate the MongoDB According System Flow & Connect Frontend & Backend with MongoDB
- Connection URI: mongodb+srv://Teamera:<db_password>@teamera.aqye1n4.mongodb.net/?appName=Teamera
- username : Teamera
- password: Teamera@1245
- Install the node moduled in backend folder
- On termineal in backend folder if I run "npm run dev:server" run the server 
- on Frontend if i run "npm run dev" run frontend

## ✅ SETUP COMPLETED

### MongoDB Connection Status
✅ MongoDB Atlas Connected Successfully
- Host: ac-nxtyl9z-shard-00-00.aqye1n4.mongodb.net
- Database: test
- Connection String: mongodb+srv://Teamera:Teamera%401245@teamera.aqye1n4.mongodb.net/?appName=Teamera

### Quick Start Guide

#### 1. Backend Setup (Already Completed)
```bash
cd backend
npm install
npm run dev:server
```

The backend server will start on http://localhost:5000

#### 2. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```

The frontend will start on http://localhost:5173

### What Was Configured

1. ✅ MongoDB Atlas connection with proper URI encoding
2. ✅ Mongoose models created:
   - User (with authentication)
   - Project
   - Hackathon
   - Message
3. ✅ Database configuration with connection handling
4. ✅ Environment variables properly set up
5. ✅ CORS configured for frontend-backend communication
6. ✅ Vite proxy configured for API calls

### Environment Files Created

- `backend/.env` - Backend environment variables (MongoDB URI, JWT secret, etc.)
- `backend/package.json` - Backend dependencies
- `.env` - Root environment variables

### API Endpoints Available

The backend is now ready to handle requests at:
- Health Check: http://localhost:5000/health
- API Base: http://localhost:5000/api

### Testing the Connection

You can test the MongoDB connection by:
1. Visiting http://localhost:5000/health
2. The response should show "MongoDB Connected"

### Next Steps

The system is now fully integrated and ready for development. You can:
- Create API endpoints for your models
- Test authentication flows
- Build frontend components that interact with the backend
- Add more features to your application


