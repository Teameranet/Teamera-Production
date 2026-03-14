# Dashboard Application Management System - Complete Database Schema

## System Flow Overview

```
User Registration → Profile Setup → Browse Projects → Apply to Project → 
Application Review → Status Update → Dashboard Tracking → Notifications
```

---

## Collection 1: `users`

### Purpose
Core user data for authentication, profile, and identity management.

### Schema Structure
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  avatar: String,
  bio: String,
  title: String,
  role: String, // "user", "admin", "moderator", "founder", "professional", "investor", "student"
  status: String, // "active", "inactive", "suspended"
  skills: [{
    name: String,
    level: String // "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"
  }],
  location: String,
  githubUrl: String,
  linkedinUrl: String,
  portfolioUrl: String,
  experiences: [{
    id: Number,
    title: String,
    company: String,
    period: String,
    description: String,
    technologies: [String]
  }],
  education: [{
    degree: String,
    institution: String,
    period: String,
    details: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1, status: 1 })
db.users.createIndex({ "skills.name": 1 })
```


---

## Collection 2: `projects`

### Purpose
Store project information, team composition, and open positions.

### Schema Structure
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId, // Reference to User
  title: String,
  description: String,
  stage: String, // "Ideation Stage", "Idea Validation", "MVP Development", "Beta Testing", "Market Ready", "Scaling"
  industry: String,
  teamMembers: [{
    id: ObjectId, // Reference to User
    name: String,
    role: String,
    avatar: String,
    email: String,
    applicantColor: String
  }],
  openPositions: [{
    role: String,
    skills: [String],
    isPaid: Boolean
  }],
  funding: String,
  timeline: String,
  applications: Number, // Counter for total applications
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
db.projects.createIndex({ title: "text", description: "text" })
db.projects.createIndex({ ownerId: 1 })
db.projects.createIndex({ stage: 1 })
db.projects.createIndex({ industry: 1 })
```

---

## Collection 3: `dashboards`

### Purpose
User-specific dashboard data including bookmarks, applications, and statistics.

### Schema Structure
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User (unique)
  userName: String,
  userEmail: String,
  bookmarkedProjects: [{
    projectId: ObjectId, // Reference to Project
    bookmarkedAt: Date
  }],
  applications: [{
    applicationId: String, // Unique application identifier
   // ========================================
   // APPLICANT INFORMATION (User who applied)
  // ========================================
    applicantId: ObjectId, // Reference to User
    applicantName: String,
    applicantEmail: String,
  // ========================================
  // PROJECT OWNER INFORMATION (Who created the project)
  // ========================================
    projectOwnerId: ObjectId,  // Reference to User
    projectOwnerName: "String",
    projectOwnerEmail: "String",
 // ========================================
 // APPLICATION DETAILS
 // ========================================
    projectId: ObjectId, // Reference to Project
    projectName: String,
    position: String,
    message: String,
    skills: [String],
    status: String, // "PENDING", "ACCEPTED", "REJECTED"
    hasResume: Boolean,
    resumeUrl: String,
    appliedDate: Date
  }],
  stats: {
    totalBookmarks: Number,
    totalApplicationsReceived: Number,
    totalApplicationsSent: Number,
    pendingApplications: Number,
    acceptedApplications: Number,
    rejectedApplications: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
db.dashboards.createIndex({ userId: 1 }, { unique: true })
db.dashboards.createIndex({ "bookmarkedProjects.projectId": 1 })
db.dashboards.createIndex({ "applications.applicationId": 1 })
db.dashboards.createIndex({ "applications.status": 1 })
```


---

## Collection 4: `notifications`

### Purpose
Real-time notification system for application updates and system events.

### Schema Structure
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User (recipient)
  type: String, // "application_status", "new_application", "project_update", "team_invite", "system"
  title: String,
  message: String,
  relatedId: ObjectId, // Reference to related entity (project, application, etc.)
  relatedType: String, // "project", "application", "user"
  actionUrl: String, // URL to navigate when clicked
  isRead: Boolean,
  priority: String, // "low", "medium", "high", "urgent"
  metadata: {
    applicationId: String,
    projectId: ObjectId,
    senderId: ObjectId,
    senderName: String,
    oldStatus: String,
    newStatus: String
  },
  createdAt: Date,
  expiresAt: Date
}
```

### Indexes
```javascript
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 })
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.notifications.createIndex({ type: 1 })
```

---

## Collection 5: `messages`

### Purpose
Communication system for project collaboration and team chat.

### Schema Structure
```javascript
{
  _id: ObjectId,
  projectId: ObjectId, // Reference to Project
  senderId: ObjectId, // Reference to User
  senderName: String,
  senderAvatar: String,
  content: String,
  type: String, // "text", "file", "system", "announcement"
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  isEdited: Boolean,
  editedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date,
  reactions: [{
    userId: ObjectId,
    emoji: String,
    createdAt: Date
  }],
  replyTo: ObjectId, // Reference to another Message
  mentions: [ObjectId], // Array of User IDs mentioned
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
db.messages.createIndex({ projectId: 1, createdAt: -1 })
db.messages.createIndex({ senderId: 1 })
db.messages.createIndex({ mentions: 1 })
```


---

## Collection 6: `hackathons`

### Purpose
Manage hackathon events, registrations, and submissions.

### Schema Structure
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  organizerId: ObjectId, // Reference to User
  organizerName: String,
  startDate: Date,
  endDate: Date,
  registrationDeadline: Date,
  status: String, // "upcoming", "ongoing", "completed", "cancelled"
  category: String, // "AI/ML", "Web Development", "Mobile", "Blockchain", "IoT", "Other"
  difficulty: String, // "beginner", "intermediate", "advanced", "all-levels"
  maxParticipants: Number,
  currentParticipants: Number,
  prizes: [{
    position: String, // "1st", "2nd", "3rd", "special"
    amount: String,
    description: String
  }],
  requirements: [String],
  rules: [String],
  judges: [{
    userId: ObjectId,
    name: String,
    avatar: String,
    expertise: String
  }],
  participants: [{
    userId: ObjectId,
    name: String,
    email: String,
    teamName: String,
    registeredAt: Date
  }],
  submissions: [{
    userId: ObjectId,
    teamName: String,
    projectTitle: String,
    projectUrl: String,
    demoUrl: String,
    description: String,
    technologies: [String],
    submittedAt: Date,
    score: Number
  }],
  tags: [String],
  imageUrl: String,
  websiteUrl: String,
  discordUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
db.hackathons.createIndex({ status: 1, startDate: -1 })
db.hackathons.createIndex({ category: 1 })
db.hackathons.createIndex({ "participants.userId": 1 })
db.hackathons.createIndex({ tags: 1 })
```


---

## Example User Documents

### Example 1: Complete User Profile
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
  "name": "John Developer",
  "email": "john.dev@example.com",
  "password": "$2a$10$hashed_password_here",
  "avatar": "https://example.com/avatars/john.jpg",
  "bio": "Full-stack developer passionate about building scalable web applications",
  "title": "Senior Full Stack Developer",
  "role": "professional",
  "status": "active",
  "skills": [
    { "name": "React", "level": "EXPERT" },
    { "name": "Node.js", "level": "ADVANCED" },
    { "name": "MongoDB", "level": "ADVANCED" },
    { "name": "TypeScript", "level": "INTERMEDIATE" }
  ],
  "location": "San Francisco, CA",
  "githubUrl": "https://github.com/johndev",
  "linkedinUrl": "https://linkedin.com/in/johndev",
  "portfolioUrl": "https://johndev.com",
  "experiences": [
    {
      "id": 1,
      "title": "Senior Developer",
      "company": "Tech Corp",
      "period": "2020 - Present",
      "description": "Leading development of microservices architecture",
      "technologies": ["React", "Node.js", "Docker", "AWS"]
    }
  ],
  "education": [
    {
      "degree": "B.S. Computer Science",
      "institution": "Stanford University",
      "period": "2016 - 2020",
      "details": "Focus on Software Engineering"
    }
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-03-09T14:30:00.000Z"
}
```

### Example 2: Project with Team and Open Positions
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9e0",
  "ownerId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "title": "AI-Powered Task Manager",
  "description": "Building an intelligent task management system using machine learning to predict task priorities and deadlines",
  "stage": "MVP Development",
  "industry": "Productivity Software",
  "teamMembers": [
    {
      "id": "65f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Developer",
      "role": "Project Lead & Backend Developer",
      "avatar": "https://example.com/avatars/john.jpg",
      "email": "john.dev@example.com",
      "applicantColor": "#4F46E5"
    },
    {
      "id": "65f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Sarah Designer",
      "role": "UI/UX Designer",
      "avatar": "https://example.com/avatars/sarah.jpg",
      "email": "sarah@example.com",
      "applicantColor": "#EC4899"
    }
  ],
  "openPositions": [
    {
      "role": "Frontend Developer",
      "skills": ["React", "TypeScript", "Tailwind CSS"],
      "isPaid": false
    },
    {
      "role": "ML Engineer",
      "skills": ["Python", "TensorFlow", "Machine Learning"],
      "isPaid": true
    }
  ],
  "funding": "Bootstrapped",
  "timeline": "6 months to MVP",
  "applications": 12,
  "createdAt": "2024-02-01T09:00:00.000Z",
  "updatedAt": "2024-03-09T16:45:00.000Z"
}
```


### Example 3: Dashboard with Applications and Bookmarks
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9f0",
  "userId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "bookmarkedProjects": [
    {
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e0",
      "bookmarkedAt": "2024-03-05T11:20:00.000Z"
    },
    {
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e1",
      "bookmarkedAt": "2024-03-07T14:15:00.000Z"
    }
  ],
  "applications": [
    {
      "applicationId": "APP-2024-001",
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e2",
      "projectName": "E-commerce Platform",
      "position": "Frontend Developer",
      "applicantId": "65f8a1b2c3d4e5f6a7b8c9d2",
      "applicantName": "Jane Smith",
      "message": "I'm excited to join your team. I have 3 years of React experience.",
      "skills": ["React", "Redux", "CSS", "JavaScript"],
      "status": "PENDING",
      "hasResume": true,
      "resumeUrl": "https://example.com/resumes/jane-smith.pdf",
      "appliedDate": "2024-03-08T10:30:00.000Z"
    },
    {
      "applicationId": "APP-2024-002",
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e3",
      "projectName": "Mobile Fitness App",
      "position": "Backend Developer",
      "applicantId": "65f8a1b2c3d4e5f6a7b8c9d3",
      "applicantName": "Mike Johnson",
      "message": "I can help build scalable APIs for your fitness app.",
      "skills": ["Node.js", "Express", "MongoDB", "REST APIs"],
      "status": "ACCEPTED",
      "hasResume": false,
      "resumeUrl": "",
      "appliedDate": "2024-03-06T15:45:00.000Z"
    }
  ],
  "stats": {
    "totalBookmarks": 2,
    "totalApplicationsReceived": 2,
    "totalApplicationsSent": 5,
    "pendingApplications": 1,
    "acceptedApplications": 1,
    "rejectedApplications": 0
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-03-09T17:00:00.000Z"
}
```

### Example 4: Notification for Application Status Change
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8ca00",
  "userId": "65f8a1b2c3d4e5f6a7b8c9d2",
  "type": "application_status",
  "title": "Application Accepted!",
  "message": "Your application for Frontend Developer position at E-commerce Platform has been accepted.",
  "relatedId": "65f8a1b2c3d4e5f6a7b8c9e2",
  "relatedType": "project",
  "actionUrl": "/dashboard/applications/APP-2024-001",
  "isRead": false,
  "priority": "high",
  "metadata": {
    "applicationId": "APP-2024-001",
    "projectId": "65f8a1b2c3d4e5f6a7b8c9e2",
    "senderId": "65f8a1b2c3d4e5f6a7b8c9d0",
    "senderName": "John Developer",
    "oldStatus": "PENDING",
    "newStatus": "ACCEPTED"
  },
  "createdAt": "2024-03-09T18:00:00.000Z",
  "expiresAt": "2024-04-09T18:00:00.000Z"
}
```


### Example 5: Project Chat Message
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8ca10",
  "projectId": "65f8a1b2c3d4e5f6a7b8c9e0",
  "senderId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "senderName": "John Developer",
  "senderAvatar": "https://example.com/avatars/john.jpg",
  "content": "Hey team! I've pushed the latest API changes. @Sarah can you review the new endpoints?",
  "type": "text",
  "attachments": [],
  "isEdited": false,
  "editedAt": null,
  "isDeleted": false,
  "deletedAt": null,
  "reactions": [
    {
      "userId": "65f8a1b2c3d4e5f6a7b8c9d1",
      "emoji": "👍",
      "createdAt": "2024-03-09T19:05:00.000Z"
    }
  ],
  "replyTo": null,
  "mentions": ["65f8a1b2c3d4e5f6a7b8c9d1"],
  "createdAt": "2024-03-09T19:00:00.000Z",
  "updatedAt": "2024-03-09T19:05:00.000Z"
}
```

### Example 6: Hackathon Event
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8ca20",
  "title": "AI Innovation Hackathon 2024",
  "description": "48-hour hackathon focused on building innovative AI solutions for real-world problems",
  "organizerId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "organizerName": "Tech Community Hub",
  "startDate": "2024-04-15T09:00:00.000Z",
  "endDate": "2024-04-17T18:00:00.000Z",
  "registrationDeadline": "2024-04-10T23:59:59.000Z",
  "status": "upcoming",
  "category": "AI/ML",
  "difficulty": "all-levels",
  "maxParticipants": 200,
  "currentParticipants": 87,
  "prizes": [
    {
      "position": "1st",
      "amount": "$5,000",
      "description": "Grand Prize + Mentorship"
    },
    {
      "position": "2nd",
      "amount": "$3,000",
      "description": "Runner-up Prize"
    },
    {
      "position": "3rd",
      "amount": "$1,000",
      "description": "Third Place"
    }
  ],
  "requirements": [
    "Team size: 2-5 members",
    "Must use AI/ML in solution",
    "Open source submission required"
  ],
  "rules": [
    "All code must be written during the hackathon",
    "Teams must present their project",
    "Follow code of conduct"
  ],
  "judges": [
    {
      "userId": "65f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Dr. Emily Chen",
      "avatar": "https://example.com/avatars/emily.jpg",
      "expertise": "Machine Learning"
    }
  ],
  "participants": [
    {
      "userId": "65f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "teamName": "AI Innovators",
      "registeredAt": "2024-03-05T12:00:00.000Z"
    }
  ],
  "submissions": [],
  "tags": ["AI", "Machine Learning", "Innovation", "Startup"],
  "imageUrl": "https://example.com/hackathons/ai-2024.jpg",
  "websiteUrl": "https://aihackathon2024.com",
  "discordUrl": "https://discord.gg/aihack2024",
  "createdAt": "2024-02-15T10:00:00.000Z",
  "updatedAt": "2024-03-09T20:00:00.000Z"
}
```


---

## System Flow Implementation Prompt

### Complete Dashboard Application Management System

**Objective:** Build a full-featured dashboard application management system with user profiles, project management, application tracking, real-time notifications, team collaboration, and hackathon features.

---

## Phase 1: Backend Implementation

### Step 1: Database Models Setup

**Create/Update Mongoose Models:**

1. **User Model** (`backend/models/User.js`) - ✅ Already exists
   - Verify all fields match schema
   - Add any missing validation
   - Ensure password hashing works

2. **Project Model** (`backend/models/Project.js`) - ✅ Already exists
   - Verify team members structure
   - Ensure open positions array is correct
   - Add text search indexes

3. **Dashboard Model** (`backend/models/Dashboard.js`) - ✅ Already exists
   - Verify applications array structure
   - Ensure stats calculation method works
   - Add proper indexes

4. **Notification Model** (`backend/models/Notification.js`) - CREATE NEW
   ```javascript
   // Define notification schema with type, priority, metadata
   // Add TTL index for auto-deletion
   // Add methods for marking as read
   ```

5. **Message Model** (`backend/models/Message.js`) - ✅ Already exists
   - Verify chat functionality
   - Add reactions and mentions support
   - Ensure proper indexing

6. **Hackathon Model** (`backend/models/Hackathon.js`) - ✅ Already exists
   - Verify participants and submissions arrays
   - Add status management
   - Ensure proper date handling

### Step 2: Services Layer

**Create Service Files:**

1. **Dashboard Service** (`backend/api/services/dashboardService.js`)
   ```javascript
   - getDashboardData(userId)
   - addBookmark(userId, projectId)
   - removeBookmark(userId, projectId)
   - getBookmarkedProjects(userId)
   - submitApplication(applicationData)
   - getApplications(userId, filters)
   - updateApplicationStatus(applicationId, status, reviewNotes)
   - withdrawApplication(applicationId, userId)
   - getApplicationStats(userId)
   - updateDashboardStats(userId)
   ```

2. **Notification Service** (`backend/api/services/notificationService.js`)
   ```javascript
   - createNotification(notificationData)
   - getUserNotifications(userId, filters)
   - markAsRead(notificationId, userId)
   - markAllAsRead(userId)
   - deleteNotification(notificationId, userId)
   - getUnreadCount(userId)
   - sendApplicationStatusNotification(application, oldStatus, newStatus)
   - sendNewApplicationNotification(projectOwner, application)
   ```

3. **Project Service** (`backend/api/services/projectService.js`)
   ```javascript
   - createProject(projectData)
   - getProjects(filters, pagination)
   - getProjectById(projectId)
   - updateProject(projectId, updateData)
   - deleteProject(projectId, userId)
   - addTeamMember(projectId, memberData)
   - removeTeamMember(projectId, memberId)
   - getProjectApplications(projectId)
   - searchProjects(query, filters)
   ```


4. **Message Service** (`backend/api/services/messageService.js`)
   ```javascript
   - sendMessage(messageData)
   - getProjectMessages(projectId, pagination)
   - editMessage(messageId, newContent, userId)
   - deleteMessage(messageId, userId)
   - addReaction(messageId, userId, emoji)
   - removeReaction(messageId, userId, emoji)
   - getUnreadMessages(userId, projectId)
   ```

5. **Hackathon Service** (`backend/api/services/hackathonService.js`)
   ```javascript
   - createHackathon(hackathonData)
   - getHackathons(filters, pagination)
   - getHackathonById(hackathonId)
   - updateHackathon(hackathonId, updateData)
   - registerParticipant(hackathonId, userData)
   - submitProject(hackathonId, submissionData)
   - getParticipants(hackathonId)
   - getSubmissions(hackathonId)
   ```

### Step 3: Controllers Layer

**Create Controller Files:**

1. **Dashboard Controller** (`backend/api/controllers/dashboardController.js`) - ✅ Already exists
   - Add missing endpoints
   - Implement error handling
   - Add input validation

2. **Notification Controller** (`backend/api/controllers/notificationController.js`)
   - GET /api/notifications - Get user notifications
   - PATCH /api/notifications/:id/read - Mark as read
   - PATCH /api/notifications/read-all - Mark all as read
   - DELETE /api/notifications/:id - Delete notification
   - GET /api/notifications/unread-count - Get unread count

3. **Project Controller** (`backend/api/controllers/projectController.js`) - ✅ Already exists
   - Verify all CRUD operations
   - Add application management endpoints
   - Add team management endpoints

4. **Message Controller** (`backend/api/controllers/messageController.js`)
   - POST /api/projects/:projectId/messages - Send message
   - GET /api/projects/:projectId/messages - Get messages
   - PATCH /api/messages/:id - Edit message
   - DELETE /api/messages/:id - Delete message
   - POST /api/messages/:id/reactions - Add reaction

5. **Hackathon Controller** (`backend/api/controllers/hackathonController.js`)
   - POST /api/hackathons - Create hackathon
   - GET /api/hackathons - List hackathons
   - GET /api/hackathons/:id - Get hackathon details
   - POST /api/hackathons/:id/register - Register participant
   - POST /api/hackathons/:id/submit - Submit project

### Step 4: API Routes

**Create/Update Route Files:**

1. **Dashboard Routes** (`backend/api/routes/dashboardRoutes.js`)
2. **Notification Routes** (`backend/api/routes/notificationRoutes.js`)
3. **Project Routes** (`backend/api/routes/projectRoutes.js`)
4. **Message Routes** (`backend/api/routes/messageRoutes.js`)
5. **Hackathon Routes** (`backend/api/routes/hackathonRoutes.js`)

**Register all routes in** `backend/server.js`

### Step 5: Middleware

1. **Authentication Middleware** (`backend/middleware/auth.js`) - ✅ Already exists
   - Verify JWT token validation
   - Add role-based access control

2. **Validation Middleware** (`backend/middleware/validation.js`) - ✅ Already exists
   - Add validation schemas for all endpoints
   - Sanitize user input

3. **Error Handling Middleware** (`backend/middleware/errorHandler.js`)
   - Centralized error handling
   - Proper error responses
   - Logging


---

## Phase 2: Frontend Implementation

### Step 1: Context Providers

**Create/Update Context Files:**

1. **Auth Context** (`frontend/context/AuthContext.jsx`) - ✅ Already exists
   - Verify login/logout/register functions
   - Add token management
   - Add user state management

2. **Project Context** (`frontend/context/ProjectContext.jsx`) - ✅ Already exists
   - Add project CRUD operations
   - Add application management
   - Add team management

3. **Notification Context** (`frontend/context/NotificationContext.jsx`) - ✅ Already exists
   - Add real-time notification updates
   - Add unread count tracking
   - Add notification actions

4. **Dashboard Context** (`frontend/context/DashboardContext.jsx`) - CREATE NEW
   ```javascript
   - Manage dashboard state
   - Handle bookmarks
   - Track applications
   - Update statistics
   ```

5. **Message Context** (`frontend/context/MessageContext.jsx`) - CREATE NEW
   ```javascript
   - Manage chat messages
   - Handle real-time updates
   - Track unread messages
   ```

### Step 2: Core Components

**Create/Update Component Files:**

1. **Dashboard Components:**
   - `DashboardStats.jsx` - Display statistics cards
   - `RecentApplications.jsx` - Show recent applications
   - `BookmarkedProjects.jsx` - Display bookmarked projects
   - `QuickActions.jsx` - Quick action buttons

2. **Application Components:**
   - `ApplicationForm.jsx` - Application submission form
   - `ApplicationCard.jsx` - Single application display
   - `ApplicationList.jsx` - List with filters
   - `ApplicationModal.jsx` - Detailed view/edit
   - `ApplicationStatusBadge.jsx` - Status indicator
   - `ApplicationReviewPanel.jsx` - For project owners

3. **Project Components:** - ✅ Most already exist
   - Verify `ProjectCard.jsx`
   - Verify `ProjectModal.jsx`
   - Add `ProjectApplications.jsx` - View applications
   - Add `TeamManagement.jsx` - Manage team members

4. **Notification Components:**
   - `NotificationBell.jsx` - Bell icon with count
   - `NotificationDropdown.jsx` - Dropdown list
   - `NotificationItem.jsx` - Single notification
   - `NotificationCenter.jsx` - Full notification page

5. **Chat/Message Components:**
   - `ChatWindow.jsx` - Main chat interface
   - `MessageList.jsx` - List of messages
   - `MessageInput.jsx` - Input with attachments
   - `MessageItem.jsx` - Single message display
   - `MessageReactions.jsx` - Reaction picker

6. **Hackathon Components:**
   - `HackathonCard.jsx` - ✅ Already exists
   - `HackathonDetails.jsx` - Detailed view
   - `HackathonRegistration.jsx` - Registration form
   - `HackathonSubmission.jsx` - Project submission
   - `ParticipantsList.jsx` - Show participants


### Step 3: Pages

**Create/Update Page Files:**

1. **Dashboard Page** (`frontend/pages/Dashboard.jsx`) - ✅ Already exists
   - Add statistics section
   - Add recent applications
   - Add bookmarked projects
   - Add quick actions

2. **Applications Page** (`frontend/pages/Applications.jsx`) - CREATE NEW
   - Full application management
   - Filters (status, date, project)
   - Search functionality
   - Pagination

3. **Projects Page** (`frontend/pages/Projects.jsx`) - ✅ Already exists
   - Add application functionality
   - Add bookmark feature
   - Improve filtering

4. **Profile Page** (`frontend/pages/Profile.jsx`) - ✅ Already exists
   - Add application history
   - Add project history
   - Add statistics

5. **Hackathons Page** (`frontend/pages/Hackathons.jsx`) - ✅ Already exists
   - Add registration flow
   - Add submission flow
   - Add participant view

6. **Project Detail Page** (`frontend/pages/ProjectDetail.jsx`) - CREATE NEW
   - Full project information
   - Team members
   - Chat/collaboration space
   - Application form
   - For owners: application management

### Step 4: API Integration

**Update API Utility** (`frontend/utils/api.js`) - ✅ Already exists

Add API functions:

```javascript
// Dashboard APIs
export const getDashboardData = () => api.get('/dashboard')
export const addBookmark = (projectId) => api.post('/dashboard/bookmarks', { projectId })
export const removeBookmark = (projectId) => api.delete(`/dashboard/bookmarks/${projectId}`)

// Application APIs
export const submitApplication = (data) => api.post('/applications', data)
export const getApplications = (filters) => api.get('/applications', { params: filters })
export const updateApplicationStatus = (id, status, notes) => 
  api.patch(`/applications/${id}/status`, { status, notes })
export const withdrawApplication = (id) => api.delete(`/applications/${id}`)

// Notification APIs
export const getNotifications = () => api.get('/notifications')
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => api.patch('/notifications/read-all')
export const getUnreadCount = () => api.get('/notifications/unread-count')

// Message APIs
export const sendMessage = (projectId, content) => 
  api.post(`/projects/${projectId}/messages`, { content })
export const getMessages = (projectId) => api.get(`/projects/${projectId}/messages`)
export const addReaction = (messageId, emoji) => 
  api.post(`/messages/${messageId}/reactions`, { emoji })

// Hackathon APIs
export const getHackathons = (filters) => api.get('/hackathons', { params: filters })
export const registerForHackathon = (id, data) => 
  api.post(`/hackathons/${id}/register`, data)
export const submitHackathonProject = (id, data) => 
  api.post(`/hackathons/${id}/submit`, data)
```


---

## Phase 3: Data Flow & Integration

### Application Submission Flow

1. **User browses projects** → Projects Page
2. **User clicks "Apply"** → Opens ApplicationForm
3. **User fills form** → Validates input
4. **Submit application** → POST /api/applications
5. **Backend creates application** → Saves to Dashboard collection
6. **Backend creates notification** → Notifies project owner
7. **Frontend updates UI** → Shows success message
8. **Dashboard updates** → Shows new application

### Application Review Flow

1. **Project owner views applications** → GET /api/projects/:id/applications
2. **Owner reviews application** → Opens ApplicationReviewPanel
3. **Owner accepts/rejects** → PATCH /api/applications/:id/status
4. **Backend updates status** → Updates Dashboard collection
5. **Backend creates notification** → Notifies applicant
6. **Frontend updates UI** → Shows updated status
7. **Stats recalculated** → Dashboard stats updated

### Real-time Notification Flow

1. **Event occurs** (application status change, new message, etc.)
2. **Backend creates notification** → Saves to Notification collection
3. **WebSocket/Polling updates** → Frontend receives notification
4. **NotificationContext updates** → Unread count increases
5. **UI updates** → Bell icon shows badge
6. **User clicks notification** → Marks as read, navigates to related page

### Chat/Collaboration Flow

1. **User opens project** → Loads CollaborationSpace
2. **User switches to Chat tab** → GET /api/projects/:id/messages
3. **Messages displayed** → MessageList component
4. **User types message** → MessageInput component
5. **User sends message** → POST /api/projects/:id/messages
6. **Backend saves message** → Message collection
7. **Real-time update** → All team members see message
8. **Mentions trigger notifications** → Mentioned users notified

---

## Phase 4: MongoDB Data Storage

### Database Connection

Ensure MongoDB is properly configured in `backend/config/database.js`:

```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### Environment Variables

Add to `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/dashboard_app
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dashboard_app

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
PORT=5000
```

### Data Relationships

1. **User ↔ Projects**: One-to-Many (user owns multiple projects)
2. **User ↔ Dashboard**: One-to-One (each user has one dashboard)
3. **Project ↔ Applications**: One-to-Many (project receives multiple applications)
4. **User ↔ Applications**: One-to-Many (user submits multiple applications)
5. **User ↔ Notifications**: One-to-Many (user receives multiple notifications)
6. **Project ↔ Messages**: One-to-Many (project has multiple messages)
7. **Hackathon ↔ Participants**: Many-to-Many (via participants array)


### Query Optimization

**Essential Indexes:**

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1, status: 1 })
db.users.createIndex({ "skills.name": 1 })

// Projects
db.projects.createIndex({ title: "text", description: "text" })
db.projects.createIndex({ ownerId: 1 })
db.projects.createIndex({ stage: 1, industry: 1 })

// Dashboards
db.dashboards.createIndex({ userId: 1 }, { unique: true })
db.dashboards.createIndex({ "applications.status": 1 })
db.dashboards.createIndex({ "applications.projectId": 1 })

// Notifications
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 })
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Messages
db.messages.createIndex({ projectId: 1, createdAt: -1 })
db.messages.createIndex({ senderId: 1 })

// Hackathons
db.hackathons.createIndex({ status: 1, startDate: -1 })
db.hackathons.createIndex({ "participants.userId": 1 })
```

### Common Queries

```javascript
// Get user's dashboard with populated data
Dashboard.findOne({ userId })
  .populate('bookmarkedProjects.projectId')
  .populate('applications.applicantId', 'name email avatar')

// Get project with applications
Project.findById(projectId)
  .populate('ownerId', 'name email avatar')
  .populate('teamMembers.id', 'name email avatar skills')

// Get unread notifications
Notification.find({ userId, isRead: false })
  .sort({ createdAt: -1 })
  .limit(20)

// Search projects
Project.find({
  $text: { $search: searchQuery },
  stage: { $in: selectedStages },
  industry: { $in: selectedIndustries }
})
.sort({ score: { $meta: "textScore" } })
.limit(20)

// Get project messages with pagination
Message.find({ projectId, isDeleted: false })
  .populate('senderId', 'name avatar')
  .sort({ createdAt: -1 })
  .skip(page * limit)
  .limit(limit)
```

---

## Phase 5: Testing & Validation

### Backend Testing

**Test each endpoint:**

- [ ] User registration and authentication
- [ ] Project CRUD operations
- [ ] Application submission and management
- [ ] Notification creation and retrieval
- [ ] Message sending and retrieval
- [ ] Hackathon registration and submission
- [ ] Dashboard data aggregation
- [ ] Bookmark functionality

**Use tools:**
- Postman/Insomnia for API testing
- Jest for unit tests
- Supertest for integration tests

### Frontend Testing

**Test each feature:**

- [ ] User can register and login
- [ ] User can create and edit projects
- [ ] User can apply to projects
- [ ] User can bookmark projects
- [ ] User receives notifications
- [ ] User can send messages
- [ ] User can register for hackathons
- [ ] Dashboard displays correct data
- [ ] Filters and search work properly

### Data Validation

**Ensure:**

- [ ] All required fields are validated
- [ ] Email format is correct
- [ ] Passwords are hashed
- [ ] User input is sanitized
- [ ] File uploads are validated
- [ ] Date ranges are valid
- [ ] Duplicate applications prevented
- [ ] Authorization checks work


---

## Phase 6: Advanced Features

### Real-time Updates (Optional)

**Implement WebSocket for:**

1. **Real-time notifications**
   - Use Socket.io
   - Emit events on notification creation
   - Update UI without refresh

2. **Live chat**
   - Real-time message delivery
   - Typing indicators
   - Online status

3. **Application status updates**
   - Instant status changes
   - Live dashboard updates

**Implementation:**

```javascript
// Backend: backend/socket.js
import { Server } from 'socket.io';

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-project', (projectId) => {
      socket.join(`project-${projectId}`);
    });

    socket.on('send-message', (data) => {
      io.to(`project-${data.projectId}`).emit('new-message', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

// Frontend: Use socket.io-client
import io from 'socket.io-client';
const socket = io(API_URL);
```

### Email Notifications (Optional)

**Send emails for:**
- Application status changes
- New applications received
- Team invitations
- Hackathon reminders

**Use:** Nodemailer, SendGrid, or AWS SES

### File Upload (Optional)

**For:**
- Resume uploads
- Project attachments
- Chat file sharing
- Hackathon submissions

**Use:** Multer + AWS S3 or Cloudinary

### Analytics Dashboard (Optional)

**Track:**
- Application conversion rates
- Popular projects
- User engagement
- Hackathon participation

---

## Security Considerations

### Authentication & Authorization

- [ ] JWT tokens with expiration
- [ ] Refresh token mechanism
- [ ] Role-based access control
- [ ] Password strength requirements
- [ ] Rate limiting on auth endpoints

### Data Protection

- [ ] Input sanitization (prevent XSS)
- [ ] SQL/NoSQL injection prevention
- [ ] CORS configuration
- [ ] Helmet.js for security headers
- [ ] Environment variables for secrets

### API Security

- [ ] Rate limiting (express-rate-limit)
- [ ] Request validation
- [ ] Error handling (don't expose internals)
- [ ] HTTPS in production
- [ ] API versioning

---

## Deployment Checklist

### Backend Deployment

- [ ] Set up MongoDB Atlas or production database
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline
- [ ] Deploy to Heroku/AWS/DigitalOcean
- [ ] Configure domain and SSL
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Configure logging

### Frontend Deployment

- [ ] Build production bundle
- [ ] Deploy to Vercel/Netlify/AWS
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Enable HTTPS
- [ ] Configure CDN
- [ ] Set up analytics

### Database Backup

- [ ] Automated backups
- [ ] Backup retention policy
- [ ] Disaster recovery plan
- [ ] Data migration scripts

---

## Performance Optimization

### Backend

- [ ] Database query optimization
- [ ] Implement caching (Redis)
- [ ] Pagination for large datasets
- [ ] Lazy loading for relationships
- [ ] Compression middleware
- [ ] Connection pooling

### Frontend

- [ ] Code splitting
- [ ] Lazy loading components
- [ ] Image optimization
- [ ] Memoization (React.memo, useMemo)
- [ ] Virtual scrolling for long lists
- [ ] Service worker for offline support

---

## Monitoring & Maintenance

### Logging

- [ ] Application logs (Winston, Morgan)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User activity logs

### Metrics

- [ ] API response times
- [ ] Database query performance
- [ ] Error rates
- [ ] User engagement metrics
- [ ] System resource usage

### Regular Maintenance

- [ ] Database cleanup (old notifications)
- [ ] Log rotation
- [ ] Security updates
- [ ] Dependency updates
- [ ] Performance audits

---

## Documentation

### API Documentation

- [ ] Use Swagger/OpenAPI
- [ ] Document all endpoints
- [ ] Include request/response examples
- [ ] Authentication requirements
- [ ] Error codes and messages

### Code Documentation

- [ ] JSDoc comments
- [ ] README files
- [ ] Architecture diagrams
- [ ] Setup instructions
- [ ] Contribution guidelines

---

## Success Metrics

### User Engagement

- Daily/Monthly active users
- Application submission rate
- Project creation rate
- Message activity
- Hackathon participation

### System Performance

- API response time < 200ms
- Database query time < 100ms
- Page load time < 2s
- Uptime > 99.9%
- Error rate < 0.1%

### Business Metrics

- User retention rate
- Application acceptance rate
- Project completion rate
- User satisfaction score
- Platform growth rate

---

## Next Steps

1. Set up development environment
2. Initialize MongoDB database
3. Create all models with proper validation
4. Build backend API endpoints
5. Test API with Postman
6. Create frontend components
7. Integrate frontend with backend
8. Implement real-time features
9. Add security measures
10. Test thoroughly
11. Deploy to production
12. Monitor and iterate

---

**End of Documentation**
