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

## Collection 3: `applications`

### Purpose
User-centric application management system where each user has one document containing all their sent and received applications.

### Schema Structure
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User (unique, indexed)
  userName: String,
  userEmail: String,
  
  // ========================================
  // APPLICATIONS RECEIVED (For Project Owners)
  // ========================================
  applications_received: [{
    applicationId: String, // Unique application identifier
    
    // APPLICANT INFORMATION (User who applied)
    applicantId: ObjectId, // Reference to User
    applicantName: String,
    applicantEmail: String,
    applicantAvatar: String,
    applicantTitle: String,
    applicantLocation: String,
    
    // PROJECT INFORMATION
    projectId: ObjectId, // Reference to Project
    projectName: String,
    projectStage: String,
    
    // APPLICATION DETAILS
    position: String, // Role applied for
    message: String, // Cover letter/application message
    skills: [String], // Skills relevant to the position
    status: String, // "PENDING", "ACCEPTED", "REJECTED", "REMOVED", "INVITED", "QUIT"
    
    // RESUME/ATTACHMENTS
    hasResume: Boolean,
    resumeUrl: String,
    resumeFileName: String,
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number
    }],
    
    // REVIEW INFORMATION
    reviewNotes: String, // Notes from project owner
    reviewedAt: Date,
    reviewedBy: ObjectId, // Reference to User who reviewed
    rating: Number, // Optional rating (1-5)
    removedFromTeamAt: Date, // When member was removed from team (if status="REMOVED")
    removalReason: String, // Reason for removal from team
    
    // TIMESTAMPS
    appliedDate: Date,
    statusUpdatedAt: Date
  }],
  
  // ========================================
  // APPLICATIONS SENT (For Applicants)
  // ========================================
  applications_sent: [{
    applicationId: String, // Unique application identifier (same as in received)
    
    // PROJECT OWNER INFORMATION (Who created the project)
    projectOwnerId: ObjectId, // Reference to User
    projectOwnerName: String,
    projectOwnerEmail: String,
    projectOwnerAvatar: String,
    
    // PROJECT INFORMATION
    projectId: ObjectId, // Reference to Project
    projectName: String,
    projectStage: String,
    projectIndustry: String,
    
    // APPLICATION DETAILS
    position: String, // Role applied for
    message: String, // Cover letter/application message
    skills: [String], // Skills relevant to the position
    status: String, // "PENDING", "ACCEPTED", "REJECTED", "QUIT", "REMOVED", "INVITED"
    
    // RESUME/ATTACHMENTS
    hasResume: Boolean,
    resumeUrl: String,
    resumeFileName: String,
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number
    }],
    
    // REVIEW INFORMATION
    reviewNotes: String, // Feedback from project owner
    reviewedAt: Date,
    reviewedBy: ObjectId, // Reference to User who reviewed
    rejectionReason: String, // Reason for rejection (if applicable)
    removedFromTeamAt: Date, // When member was removed from team (if status="REMOVED")
    removalReason: String, // Reason for removal from team
    
    // TIMESTAMPS
    appliedDate: Date,
    statusUpdatedAt: Date,
    quitAt: Date // If user quits/leaves the project
  }],
  
  // ========================================
  // STATISTICS
  // ========================================
  stats: {
    // Received Statistics
    totalReceived: Number,
    pendingReceived: Number,
    acceptedReceived: Number,
    rejectedReceived: Number,
    removedReceived: Number, // Members removed from team
    invitedReceived: Number, // Members invited during project creation
    quitReceived: Number, // Members who quit the project
    
    // Sent Statistics
    totalSent: Number,
    pendingSent: Number,
    acceptedSent: Number,
    rejectedSent: Number,
    quitSent: Number, // User quit/left the project
    removedSent: Number, // User was removed from team
    invitedSent: Number // User was invited to join project
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
db.applications.createIndex({ userId: 1 }, { unique: true })
db.applications.createIndex({ "applications_received.applicationId": 1 })
db.applications.createIndex({ "applications_received.status": 1 })
db.applications.createIndex({ "applications_received.applicantId": 1 })
db.applications.createIndex({ "applications_received.projectId": 1 })
db.applications.createIndex({ "applications_sent.applicationId": 1 })
db.applications.createIndex({ "applications_sent.status": 1 })
db.applications.createIndex({ "applications_sent.projectId": 1 })
db.applications.createIndex({ "applications_sent.projectOwnerId": 1 })
```

### Data Synchronization Rules

**IMPORTANT:** When an application is submitted, it must be added to TWO user documents:

1. **On Application Submission:**
   - Add to `applications_sent` array in applicant's document
   - Add to `applications_received` array in project owner's document
   - Both entries share the same `applicationId`
   - Update stats in both documents
   - **Duplicate Check:** Only block if user has PENDING or ACCEPTED application for same project-position
   - **Re-application Allowed:** Users can re-apply after REJECTED, QUIT, or REMOVED status

2. **On Team Member Invitation (During Project Creation/Edit):**
   - When a user adds team members while creating or editing a project, create INVITED applications
   - Add to `applications_received` array in project owner's document with status "INVITED"
   - Add to `applications_sent` array in invited member's document with status "INVITED"
   - Both entries share the same `applicationId`
   - Update stats in both documents (increment invitedReceived and invitedSent)
   - This allows tracking of members who were directly invited vs. those who applied
   - INVITED status indicates the member was added by the project owner, not through the application process

3. **On Status Update:**
   - Update status in applicant's `applications_sent` array
   - Update status in project owner's `applications_received` array
   - Update `statusUpdatedAt` timestamp in both
   - Add review notes to both arrays
   - Update stats in both documents

4. **On Application Quit (Member Leaves):**
   - Update status to "QUIT" in applicant's `applications_sent`
   - Update status to "QUIT" in project owner's `applications_received`
   - Set `quitAt` timestamp in applicant's document
   - Update stats in both documents
   - **Re-application Allowed:** User can submit new application after quitting

5. **On Application Rejection:**
   - Update status to "REJECTED" in both `applications_sent` and `applications_received`
   - Set `reviewedAt` timestamp and `reviewNotes` in both documents
   - Update stats in both documents
   - **Re-application Allowed:** User can submit new application after rejection
   - Previous rejected application remains in history for reference

6. **On Team Member Removal:**
   - Find the accepted application for the removed member
   - Update status to "REMOVED" in both `applications_sent` and `applications_received`
   - Set `removedFromTeamAt` timestamp in both documents
   - Add `removalReason` to both documents
   - Update stats in both documents (increment removedReceived and removedSent)
   - **Re-application Allowed:** User can submit new application after being removed
   - This allows tracking of members who were accepted but later removed
   - Removed members can reapply to rejoin the project

7. **On Team Member Quit:**
   - When a user voluntarily leaves/quits a project
   - Find the accepted or invited application for the member
   - Update status to "QUIT" in both `applications_sent` and `applications_received`
   - Set `quitAt` timestamp in both documents
   - Add `quitReason` to both documents (optional)
   - Update stats in both documents (increment quitReceived and quitSent)
   - **Re-application Allowed:** User can submit new application after quitting
   - QUIT status indicates voluntary departure (different from REMOVED which is involuntary)
   - This allows tracking of members who left on their own terms

### Query Patterns

```javascript
// Get all applications received by a project owner
db.applications.findOne(
  { userId: projectOwnerId },
  { applications_received: 1, "stats.totalReceived": 1 }
)

// Get pending applications received
db.applications.findOne(
  { userId: projectOwnerId },
  { 
    applications_received: { 
      $elemMatch: { status: "PENDING" } 
    } 
  }
)

// Get all applications sent by a user
db.applications.findOne(
  { userId: applicantId },
  { applications_sent: 1, "stats.totalSent": 1 }
)

// Get specific application by applicationId (from sender's view)
db.applications.findOne(
  { 
    userId: applicantId,
    "applications_sent.applicationId": applicationId 
  },
  { 
    "applications_sent.$": 1 
  }
)

// Get specific application by applicationId (from receiver's view)
db.applications.findOne(
  { 
    userId: projectOwnerId,
    "applications_received.applicationId": applicationId 
  },
  { 
    "applications_received.$": 1 
  }
)

// Check for duplicate application - only block PENDING or ACCEPTED
db.applications.findOne({
  userId: applicantId,
  "applications_sent": {
    $elemMatch: {
      projectId: projectId,
      position: position,
      status: { $in: ["PENDING", "ACCEPTED"] }
    }
  }
})

// Note: Users CAN re-apply if previous status was REJECTED, QUIT, or REMOVED

// Get applications for a specific project
db.applications.findOne(
  { userId: projectOwnerId },
  {
    applications_received: {
      $filter: {
        input: "$applications_received",
        as: "app",
        cond: { $eq: ["$$app.projectId", projectId] }
      }
    }
  }
)
```

---

## Collection 4: `dashboards`

### Purpose
User-specific dashboard data including bookmarks and general statistics.

### Schema Structure
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User (unique, indexed)
  userName: String,
  userEmail: String,
  
  // ========================================
  // BOOKMARKED PROJECTS
  // ========================================
  bookmarkedProjects: [{
    projectId: ObjectId, // Reference to Project
    projectName: String,
    projectStage: String,
    bookmarkedAt: Date
  }],
  
  // ========================================
  // GENERAL STATISTICS
  // ========================================
  stats: {
    totalBookmarks: Number,
    totalProjects: Number, // Projects owned by user
    totalTeamMembers: Number, // Total members across all projects
    profileCompleteness: Number // Percentage (0-100)
  },
  
  // ========================================
  // QUICK ACCESS
  // ========================================
  recentActivity: [{
    type: String, // "application_sent", "application_received", "status_change", "bookmark_added", "member_added", "member_removed"
    description: String,
    relatedId: ObjectId,
    timestamp: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
db.dashboards.createIndex({ userId: 1 }, { unique: true })
db.dashboards.createIndex({ "bookmarkedProjects.projectId": 1 })
db.dashboards.createIndex({ "recentActivity.timestamp": -1 })
```


---
## Collection 5: `notifications`

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

## Collection 6: `messages`

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

## Collection 7: `hackathons`

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

### Example 3: Application Document

```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9f5",
  "userId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "userName": "John Developer",
  "userEmail": "john.dev@example.com",
  "applications_received": [
    {
      "applicationId": "APP-2024-001",
      "applicantId": "65f8a1b2c3d4e5f6a7b8c9d2",
      "applicantName": "Jane Smith",
      "applicantEmail": "jane@example.com",
      "applicantAvatar": "https://example.com/avatars/jane.jpg",
      "applicantTitle": "Frontend Developer",
      "applicantLocation": "New York, NY",
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e0",
      "projectName": "AI-Powered Task Manager",
      "projectStage": "MVP Development",
      "position": "Frontend Developer",
      "message": "I'm excited to join your team. I have 3 years of React experience.",
      "skills": ["React", "TypeScript", "Tailwind CSS", "Redux"],
      "status": "PENDING",
      "hasResume": true,
      "resumeUrl": "https://example.com/resumes/jane-smith.pdf",
      "resumeFileName": "jane-smith-resume.pdf",
      "attachments": [
        {
          "fileName": "portfolio.pdf",
          "fileUrl": "https://example.com/attachments/jane-portfolio.pdf",
          "fileType": "application/pdf",
          "fileSize": 2048576
        }
      ],
      "reviewNotes": "",
      "reviewedAt": null,
      "reviewedBy": null,
      "rating": null,
      "appliedDate": "2024-03-08T10:30:00.000Z",
      "statusUpdatedAt": "2024-03-08T10:30:00.000Z"
    },
    {
      "applicationId": "APP-2024-005",
      "applicantId": "65f8a1b2c3d4e5f6a7b8c9d5",
      "applicantName": "Mike Johnson",
      "applicantEmail": "mike@example.com",
      "applicantAvatar": "https://example.com/avatars/mike.jpg",
      "applicantTitle": "Backend Developer",
      "applicantLocation": "San Francisco, CA",
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e0",
      "projectName": "AI-Powered Task Manager",
      "projectStage": "MVP Development",
      "position": "Backend Developer",
      "message": "I can help build scalable APIs for your project.",
      "skills": ["Node.js", "Express", "MongoDB", "REST APIs"],
      "status": "ACCEPTED",
      "hasResume": true,
      "resumeUrl": "https://example.com/resumes/mike-johnson.pdf",
      "resumeFileName": "mike-johnson-resume.pdf",
      "attachments": [],
      "reviewNotes": "Great experience with Node.js. Perfect fit for our backend needs.",
      "reviewedAt": "2024-03-09T15:20:00.000Z",
      "reviewedBy": "65f8a1b2c3d4e5f6a7b8c9d0",
      "rating": 5,
      "removedFromTeamAt": null,
      "removalReason": null,
      "appliedDate": "2024-03-07T14:15:00.000Z",
      "statusUpdatedAt": "2024-03-09T15:20:00.000Z"
    },
    {
      "applicationId": "APP-2024-003",
      "applicantId": "65f8a1b2c3d4e5f6a7b8c9d6",
      "applicantName": "Tom Designer",
      "applicantEmail": "tom@example.com",
      "applicantAvatar": "https://example.com/avatars/tom.jpg",
      "applicantTitle": "UI/UX Designer",
      "applicantLocation": "Austin, TX",
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e0",
      "projectName": "AI-Powered Task Manager",
      "projectStage": "MVP Development",
      "position": "UI/UX Designer",
      "message": "I'd love to help design the user interface.",
      "skills": ["Figma", "UI Design", "UX Research", "Prototyping"],
      "status": "REMOVED",
      "hasResume": true,
      "resumeUrl": "https://example.com/resumes/tom-designer.pdf",
      "resumeFileName": "tom-designer-resume.pdf",
      "attachments": [],
      "reviewNotes": "Accepted initially but removed due to project direction change.",
      "reviewedAt": "2024-02-20T10:00:00.000Z",
      "reviewedBy": "65f8a1b2c3d4e5f6a7b8c9d0",
      "rating": 4,
      "removedFromTeamAt": "2024-03-10T14:30:00.000Z",
      "removalReason": "Project pivoted to focus on backend features, UI design role no longer needed.",
      "appliedDate": "2024-02-18T09:00:00.000Z",
      "statusUpdatedAt": "2024-03-10T14:30:00.000Z"
    }
  ],
  "applications_sent": [
    {
      "applicationId": "APP-2024-010",
      "projectOwnerId": "65f8a1b2c3d4e5f6a7b8c9d3",
      "projectOwnerName": "Sarah Wilson",
      "projectOwnerEmail": "sarah@example.com",
      "projectOwnerAvatar": "https://example.com/avatars/sarah.jpg",
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e3",
      "projectName": "E-commerce Platform",
      "projectStage": "Beta Testing",
      "projectIndustry": "E-commerce",
      "position": "Full Stack Developer",
      "message": "I'd love to contribute to your e-commerce platform.",
      "skills": ["React", "Node.js", "PostgreSQL", "AWS"],
      "status": "PENDING",
      "hasResume": true,
      "resumeUrl": "https://example.com/resumes/john-dev.pdf",
      "resumeFileName": "john-dev-resume.pdf",
      "attachments": [],
      "reviewNotes": "",
      "reviewedAt": null,
      "reviewedBy": null,
      "rejectionReason": "",
      "appliedDate": "2024-03-09T11:00:00.000Z",
      "statusUpdatedAt": "2024-03-09T11:00:00.000Z",
      "quitAt": null
    }
  ],
  "stats": {
    "totalReceived": 3,
    "pendingReceived": 1,
    "acceptedReceived": 1,
    "rejectedReceived": 0,
    "removedReceived": 1,
    "totalSent": 1,
    "pendingSent": 1,
    "acceptedSent": 0,
    "rejectedSent": 0,
    "quitSent": 0,
    "removedSent": 0
  },
  "createdAt": "2024-02-01T09:00:00.000Z",
  "updatedAt": "2024-03-09T15:20:00.000Z"
}
```

### Example 4: Dashboard with Statistics
```json
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9f0",
  "userId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "userName": "John Developer",
  "userEmail": "john.dev@example.com",
  "bookmarkedProjects": [
    {
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e1",
      "projectName": "E-commerce Platform",
      "projectStage": "Beta Testing",
      "bookmarkedAt": "2024-03-05T11:20:00.000Z"
    },
    {
      "projectId": "65f8a1b2c3d4e5f6a7b8c9e2",
      "projectName": "Mobile Fitness App",
      "projectStage": "MVP Development",
      "bookmarkedAt": "2024-03-07T14:15:00.000Z"
    }
  ],
  "stats": {
    "totalBookmarks": 2,
    "totalProjects": 3,
    "totalTeamMembers": 8,
    "profileCompleteness": 95
  },
  "recentActivity": [
    {
      "type": "application_received",
      "description": "New application for Frontend Developer position",
      "relatedId": "65f8a1b2c3d4e5f6a7b8c9f5",
      "timestamp": "2024-03-08T10:30:00.000Z"
    },
    {
      "type": "status_change",
      "description": "Application accepted for Backend Developer position",
      "relatedId": "65f8a1b2c3d4e5f6a7b8c9f6",
      "timestamp": "2024-03-07T16:20:00.000Z"
    },
    {
      "type": "member_added",
      "description": "New team member added to AI-Powered Task Manager",
      "relatedId": "65f8a1b2c3d4e5f6a7b8c9e0",
      "timestamp": "2024-03-06T09:15:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-03-09T17:00:00.000Z"
}
```

### Example 5: Notification for Application Status Change
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


### Example 6: Project Chat Message
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

### Example 7: Hackathon Event
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

1. **User Model** (`backend/models/User.js`) -  Already exists
   - Verify all fields match schema
   - Add any missing validation
   - Ensure password hashing works

2. **Project Model** (`backend/models/Project.js`) -  Already exists
   - Verify team members structure
   - Ensure open positions array is correct
   - Add text search indexes

3. **Dashboard Model** (`backend/models/Dashboard.js`) -  Already exists
   - Remove application statistics (moved to Application collection)
   - Keep bookmarkedProjects array
   - Keep general stats (totalBookmarks, totalProjects, totalTeamMembers, profileCompleteness)
   - Keep recentActivity array
   - Ensure proper indexes

4. **Application Model** (`backend/models/Application.js`) - CREATE NEW
   ```javascript
   // Define Application model with user-centric structure
   // - userId (unique) - One document per user
   // - applications_received array - Applications this user received
   // - applications_sent array - Applications this user sent
   // - stats object - Aggregated statistics
   
   // Add unique applicationId generation
   // Add indexes for userId and nested arrays
   // Add methods for:
   //   - addReceivedApplication(applicationData)
   //   - addSentApplication(applicationData)
   //   - updateApplicationStatus(applicationId, status, isReceived)
   //   - getReceivedApplications(filters)
   //   - getSentApplications(filters)
   //   - updateStats()
   // Add validation for duplicate applications
   ```

5. **Notification Model** (`backend/models/Notification.js`) - CREATE NEW
   ```javascript
   // Define notification schema with type, priority, metadata
   // Add TTL index for auto-deletion
   // Add methods for marking as read
   ```

6. **Message Model** (`backend/models/Message.js`) -  Already exists
   - Verify chat functionality
   - Add reactions and mentions support
   - Ensure proper indexing

7. **Hackathon Model** (`backend/models/Hackathon.js`) -  Already exists
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
   - addRecentActivity(userId, activityData)
   - updateDashboardStats(userId)
   - getRecentActivity(userId, limit)
   ```

2. **Application Service** (`backend/api/services/applicationService.js`) - CREATE NEW
   ```javascript
   - submitApplication(applicationData) // Adds to both user documents
   - getApplicationById(applicationId, userId, viewType) // viewType: 'sent' or 'received'
   - getReceivedApplications(userId, filters) // From applications_received array
   - getSentApplications(userId, filters) // From applications_sent array
   - getApplicationsByProject(projectOwnerId, projectId, filters)
   - updateApplicationStatus(applicationId, applicantId, projectOwnerId, status, reviewData)
   - markApplicationAsRemoved(applicationId, applicantId, projectOwnerId, removalReason)
   - checkDuplicateApplication(applicantId, projectId)
   - getApplicationStats(userId)
   - ensureApplicationDocument(userId) // Create if doesn't exist
   ```

3. **Notification Service** (`backend/api/services/notificationService.js`)
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

4. **Project Service** (`backend/api/services/projectService.js`)
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


5. **Message Service** (`backend/api/services/messageService.js`)
   ```javascript
   - sendMessage(messageData)
   - getProjectMessages(projectId, pagination)
   - editMessage(messageId, newContent, userId)
   - deleteMessage(messageId, userId)
   - addReaction(messageId, userId, emoji)
   - removeReaction(messageId, userId, emoji)
   - getUnreadMessages(userId, projectId)
   ```

6. **Hackathon Service** (`backend/api/services/hackathonService.js`)
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

1. **Dashboard Controller** (`backend/api/controllers/dashboardController.js`) -  Already exists
   - GET /api/dashboard - Get user dashboard data
   - POST /api/dashboard/bookmarks - Add bookmark
   - DELETE /api/dashboard/bookmarks/:projectId - Remove bookmark
   - GET /api/dashboard/bookmarks - Get bookmarked projects
   - GET /api/dashboard/activity - Get recent activity
   - Implement error handling
   - Add input validation

2. **Application Controller** (`backend/api/controllers/applicationController.js`) - CREATE NEW
   - POST /api/applications - Submit application
   - GET /api/applications/sent - Get applications sent by user
   - GET /api/applications/received - Get applications received by user
   - GET /api/applications/:id - Get application details
   - PATCH /api/applications/:id/status - Update application status (PENDING, ACCEPTED, REJECTED)
   - GET /api/applications/stats - Get application statistics
   - Note: REMOVED status is set automatically when team member is removed via Project Controller

3. **Notification Controller** (`backend/api/controllers/notificationController.js`)
   - GET /api/notifications - Get user notifications
   - PATCH /api/notifications/:id/read - Mark as read
   - PATCH /api/notifications/read-all - Mark all as read
   - DELETE /api/notifications/:id - Delete notification
   - GET /api/notifications/unread-count - Get unread count

4. **Project Controller** (`backend/api/controllers/projectController.js`) -  Already exists
   - Verify all CRUD operations
   - Add team management endpoints
   - Update to work with separate applications collection

5. **Message Controller** (`backend/api/controllers/messageController.js`)
   - POST /api/projects/:projectId/messages - Send message
   - GET /api/projects/:projectId/messages - Get messages
   - PATCH /api/messages/:id - Edit message
   - DELETE /api/messages/:id - Delete message
   - POST /api/messages/:id/reactions - Add reaction

6. **Hackathon Controller** (`backend/api/controllers/hackathonController.js`)
   - POST /api/hackathons - Create hackathon
   - GET /api/hackathons - List hackathons
   - GET /api/hackathons/:id - Get hackathon details
   - POST /api/hackathons/:id/register - Register participant
   - POST /api/hackathons/:id/submit - Submit project

### Step 4: API Routes

**Create/Update Route Files:**

1. **Dashboard Routes** (`backend/api/routes/dashboardRoutes.js`)
2. **Application Routes** (`backend/api/routes/applicationRoutes.js`) - CREATE NEW
3. **Notification Routes** (`backend/api/routes/notificationRoutes.js`)
4. **Project Routes** (`backend/api/routes/projectRoutes.js`)
5. **Message Routes** (`backend/api/routes/messageRoutes.js`)
6. **Hackathon Routes** (`backend/api/routes/hackathonRoutes.js`)

**Register all routes in** `backend/server.js`

### Step 5: Middleware

1. **Authentication Middleware** (`backend/middleware/auth.js`) -  Already exists
   - Verify JWT token validation
   - Add role-based access control

2. **Validation Middleware** (`backend/middleware/validation.js`) -  Already exists
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

1. **Auth Context** (`frontend/context/AuthContext.jsx`) -  Already exists
   - Verify login/logout/register functions
   - Add token management
   - Add user state management

2. **Project Context** (`frontend/context/ProjectContext.jsx`) -  Already exists
   -  Project CRUD operations implemented
   -  Application management implemented (fetchApplications, acceptApplication, rejectApplication)
   -  Team management implemented
   -  Bookmark management implemented
   -  Helper functions: getReceivedApplications, getSentApplications

3. **Notification Context** (`frontend/context/NotificationContext.jsx`) -  Already exists
   -  Real-time notification updates
   -  Unread count tracking
   -  Notification actions (addAcceptanceNotification, addRejectionNotification)

4. **Dashboard Context** - NOT NEEDED
   - Dashboard functionality integrated into ProjectContext
   - Bookmarks managed via ProjectContext
   - Applications managed via ProjectContext

5. **Message Context** - FUTURE ENHANCEMENT
   ```javascript
   - Manage chat messages
   - Handle real-time updates
   - Track unread messages
   ```

### Step 2: Core Components

**Create/Update Component Files:**

1. **Dashboard Components:** -  IMPLEMENTED IN Dashboard.jsx
   -  Dashboard tabs (Bookmarks/Applications)
   -  Application tabs (Received/Sent)
   -  Bookmarked projects grid
   -  Application list with status badges
   -  Toast notifications
   -  Empty states

2. **Application Components:** -  INTEGRATED IN Dashboard.jsx
   -  Application item display (inline in Dashboard)
   -  Application status badges (PENDING/ACCEPTED/REJECTED/QUIT/REMOVED/INVITED)
   -  Application actions (Accept/Reject/View Profile/Download Resume)
   -  Applicant info display with UserAvatar
   -  Skills display
   -  Relative time formatting

3. **Project Components:** -  Already exist
   -  `ProjectCard.jsx` - Displays project cards
   -  `ProjectModal.jsx` - Project details modal
   -  `CreateProjectModal.jsx` - Create new projects
   -  `CollaborationSpace.jsx` - Team collaboration with tabs (Team/Chat/Tasks/Files)

4. **User Components:** -  Already exist
   -  `UserAvatar.jsx` - User avatar display
   -  `ProfileModal.jsx` - User profile modal

5. **Notification Components:** -  Already exist
   -  `NotificationModal.jsx` - Notification center

6. **Chat/Message Components:** -  IMPLEMENTED
   -  `ChatTab.jsx` - Chat interface in CollaborationSpace
   -  `TeamTab.jsx` - Team management in CollaborationSpace
   -  `TasksTab.jsx` - Task management in CollaborationSpace
   -  `FilesTab.jsx` - File sharing in CollaborationSpace

7. **Hackathon Components:**
   -  `HackathonCard.jsx` - Already exists
   -  `HackathonRegistrationModal.jsx` - Already exists


### Step 3: Pages

**Create/Update Page Files:**

1. **Dashboard Page** (`frontend/pages/Dashboard.jsx`) -  FULLY IMPLEMENTED
   -  Two main tabs: Bookmarks and Applications
   -  Bookmarks tab: Displays bookmarked projects using ProjectCard
   -  Applications tab with sub-tabs:
     -  Received: Shows applications_received (user as project owner)
     -  Sent: Shows applications_sent (user as applicant)
   -  Application management:
     -  Accept/Reject actions for PENDING applications
     -  View applicant profile
     -  Download resume
     -  Status badges (PENDING/ACCEPTED/REJECTED/QUIT/REMOVED/INVITED)
   -  Integration with Application collection schema:
     -  Uses getReceivedApplications() and getSentApplications()
     -  Displays applicant info (name, title, avatar, location)
     -  Shows project info (name, stage, position)
     -  Displays application details (message, skills, resume)
     -  Shows review info (notes, dates, status)
   -  Toast notifications for actions
   -  Opens CollaborationSpace on accept
   -  Navigation from notifications (via location.state)
   -  Empty states for no bookmarks/applications
   -  Loading states

2. **Applications Page** - NOT NEEDED
   - All application management is in Dashboard.jsx
   - Dashboard provides complete application workflow

3. **Projects Page** (`frontend/pages/Projects.jsx`) -  Already exists
   -  Project browsing and filtering
   -  Bookmark feature
   -  Application submission

4. **Profile Page** (`frontend/pages/Profile.jsx`) -  Already exists
   - User profile display and editing

5. **Hackathons Page** (`frontend/pages/Hackathons.jsx`) -  Already exists
   - Hackathon browsing and registration

6. **Community Page** (`frontend/pages/Community.jsx`) -  Already exists
   - Community features

7. **Home Page** (`frontend/pages/Home.jsx`) -  Already exists
   - Landing page

### Step 4: API Integration

**Update API Utility** (`frontend/utils/api.js`) -  Already exists

 IMPLEMENTED API functions:

```javascript
// Dashboard APIs -  IMPLEMENTED
export const getDashboardData = () => api.get('/dashboard')
export const addBookmark = (projectId) => api.post('/dashboard/bookmarks', { projectId })
export const removeBookmark = (projectId) => api.delete(`/dashboard/bookmarks/${projectId}`)

// Application APIs -  IMPLEMENTED
export const submitApplication = (data) => api.post('/applications', data)
export const getApplications = (filters) => api.get('/applications', { params: filters })
export const updateApplicationStatus = (id, status, notes) => 
  api.patch(`/applications/${id}/status`, { status, notes })

// Notification APIs -  IMPLEMENTED
export const getNotifications = () => api.get('/notifications')
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => api.patch('/notifications/read-all')
export const getUnreadCount = () => api.get('/notifications/unread-count')

// User APIs -  IMPLEMENTED
export const getUserProfile = (userId) => api.get(`/users/${userId}/profile`)

// Project APIs -  IMPLEMENTED
export const getProjects = (filters) => api.get('/projects', { params: filters })
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.patch(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)

// Message APIs - FUTURE ENHANCEMENT
export const sendMessage = (projectId, content) => 
  api.post(`/projects/${projectId}/messages`, { content })
export const getMessages = (projectId) => api.get(`/projects/${projectId}/messages`)
export const addReaction = (messageId, emoji) => 
  api.post(`/messages/${messageId}/reactions`, { emoji })

// Hackathon APIs -  IMPLEMENTED
export const getHackathons = (filters) => api.get('/hackathons', { params: filters })
export const registerForHackathon = (id, data) => 
  api.post(`/hackathons/${id}/register`, data)
export const submitHackathonProject = (id, data) => 
  api.post(`/hackathons/${id}/submit`, data)
```

---

## FRONTEND IMPLEMENTATION STATUS

### Dashboard.jsx - COMPLETE IMPLEMENTATION 

**File Location:** `frontend/pages/Dashboard.jsx`

**Key Features Implemented:**

1. **Application Collection Integration** 
   - Fully aligned with Application schema from SYSTEM_FLOW_DATABASE_SCHEMA.md
   - Comprehensive inline documentation of schema structure
   - Proper handling of applications_received and applications_sent arrays
   - Correct status enums: PENDING, ACCEPTED, REJECTED, QUIT, REMOVED, INVITED

2. **Two Main Tabs** 
   - Bookmarks Tab: Displays bookmarked projects
   - Applications Tab: Full application management

3. **Applications Tab Features** 
   - Sub-tabs: Received (as project owner) and Sent (as applicant)
   - Real-time application counts
   - Status-based filtering
   - Accept/Reject workflow for PENDING applications

4. **Application Display** 
   - Applicant information (name, title, avatar, location)
   - Project information (name, stage, position)
   - Application details (message, skills, resume)
   - Status badges with icons
   - Relative time display ("2 days ago")

5. **Application Actions** 
   - Accept Application → Adds to team → Opens CollaborationSpace
   - Reject Application → Updates status → Sends notification
   - View Profile → Fetches full user profile from API
   - Download Resume → Opens resume URL

6. **Notifications Integration** 
   - Sends acceptance notifications to applicants
   - Sends rejection notifications to applicants
   - Toast notifications for user feedback
   - Navigation from notification clicks (via location.state)

7. **State Management** 
   - Uses ProjectContext for applications, projects, bookmarks
   - Uses AuthContext for user authentication
   - Uses NotificationContext for notifications
   - Proper loading states
   - Error handling

8. **User Experience** 
   - Empty states for no bookmarks/applications
   - Loading indicators
   - Toast notifications for actions
   - Smooth tab transitions
   - Responsive design

9. **Data Flow** 
   - Fetches applications on tab switch
   - Refreshes data after accept/reject
   - Handles pending collaboration space opening
   - Proper error handling and fallbacks

10. **Profile Modal Integration** 
    - Opens ProfileModal for applicant profiles
    - Fetches full user data from API
    - Fallback to application data if API fails
    - Shows current user profile for sent applications

**Code Quality:**
- Comprehensive inline comments
- Clear function names
- Proper error handling
- Console logging for debugging
- Clean component structure

**Schema Alignment:**
The Dashboard.jsx file includes detailed comments at the top documenting the Application collection structure:
- applications_received array structure
- applications_sent array structure
- All field names and types
- Status enums
- Nested objects (attachments, review info)

This ensures developers understand the data structure when working with the component.


---

## Phase 3: Data Flow & Integration

### Application Submission Flow

1. **User browses projects** → Projects Page
2. **User clicks "Apply"** → Opens ApplicationForm
3. **User fills form** → Validates input
4. **Submit application** → POST /api/applications
5. **Backend processes application:**
   - Generates unique `applicationId`
   - Adds to applicant's `applications_sent` array
   - Adds to project owner's `applications_received` array
   - Updates stats in both user documents
6. **Backend creates notification** → Notifies project owner
7. **Frontend updates UI** → Shows success message
8. **Dashboard updates** → Shows new application in both dashboards

### Application Review Flow

1. **Project owner views applications** → GET /api/applications/received
2. **Owner reviews application** → Opens ApplicationReviewPanel
3. **Owner accepts/rejects** → PATCH /api/applications/:id/status
4. **Backend updates status in BOTH user documents:**
   - Updates in project owner's `applications_received` array
   - Updates in applicant's `applications_sent` array
   - Updates stats in both documents
5. **Backend creates notification** → Notifies applicant
6. **Frontend updates UI** → Shows updated status
7. **Stats recalculated** → Dashboard stats updated for both users

### Re-application Flow (After Rejection)

**Scenario:** User was rejected and wants to apply again

1. **User views project** → Sees open positions
2. **User clicks "Apply"** → Opens application form
3. **User submits application** → POST /api/applications/submit
4. **Backend checks for duplicates:**
   - Looks for PENDING or ACCEPTED applications only
   - Ignores REJECTED, QUIT, and REMOVED applications
   - If no active application found → Allows submission
5. **New application created:**
   - New unique `applicationId` generated
   - Added to both user documents (applications_sent and applications_received)
   - Previous rejected application remains in history
   - Status: PENDING
6. **Project owner notified** → Receives notification about new application
7. **Dashboard updated** → New application appears in both dashboards

**Benefits:**
- Users get second chances after improving skills/experience
- Project owners can reconsider candidates
- Removed team members can reapply to rejoin
- Full application history maintained for reference
- No data loss - all previous applications preserved

**Business Rules:**
- ✅ Can re-apply after: REJECTED, QUIT, REMOVED
- ❌ Cannot re-apply if: PENDING (already applied), ACCEPTED (already on team)
- Each application gets unique applicationId
- Previous applications remain in database for analytics

### Re-application Flow (After Team Removal)

**Scenario:** User was accepted, joined team, but was later removed

1. **User was on team** → Status: ACCEPTED
2. **Project owner removes user** → Status changes to REMOVED
   - `removedFromTeamAt` timestamp set
   - `removalReason` recorded
   - User removed from project.teamMembers array
3. **User views project again** → Sees open positions
4. **User clicks "Apply"** → Opens application form
5. **User submits new application** → POST /api/applications/submit
6. **Backend checks for duplicates:**
   - Finds REMOVED application (not blocking)
   - Allows new application submission
7. **New application created:**
   - New unique `applicationId` generated
   - Added to both user documents
   - Previous REMOVED application remains in history
   - Status: PENDING
8. **Project owner notified** → Receives notification
   - Can see user's previous history
   - Can review removal reason
   - Can decide to give second chance
9. **Dashboard updated** → New application appears

**Use Cases:**
- User left due to time constraints, now available again
- Misunderstanding resolved, user wants to rejoin
- User improved skills/behavior, wants another chance
- Project needs changed, removed role is needed again

**Benefits:**
- Flexible team management
- Second chances for both parties
- Complete audit trail of member history
- Project owners maintain full control

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
3. **User ↔ Applications**: One-to-One (each user has one application document with arrays)
4. **Application Document**: Contains both sent and received applications for a user
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
db.projects.createIndex({ "teamMembers.id": 1 })
db.projects.createIndex({ "teamMembers.status": 1 })
db.projects.createIndex({ "teamHistory.memberId": 1 })
db.projects.createIndex({ "teamHistory.timestamp": -1 })

// Applications
db.applications.createIndex({ userId: 1 }, { unique: true })
db.applications.createIndex({ "applications_received.applicationId": 1 })
db.applications.createIndex({ "applications_received.status": 1 })
db.applications.createIndex({ "applications_received.applicantId": 1 })
db.applications.createIndex({ "applications_received.projectId": 1 })
db.applications.createIndex({ "applications_sent.applicationId": 1 })
db.applications.createIndex({ "applications_sent.status": 1 })
db.applications.createIndex({ "applications_sent.projectId": 1 })
db.applications.createIndex({ "applications_sent.projectOwnerId": 1 })

// Dashboards
db.dashboards.createIndex({ userId: 1 }, { unique: true })
db.dashboards.createIndex({ "bookmarkedProjects.projectId": 1 })
db.dashboards.createIndex({ "recentActivity.timestamp": -1 })

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

// Get user's application document
Application.findOne({ userId })

// Get applications received by project owner
Application.findOne(
  { userId: projectOwnerId },
  { applications_received: 1, "stats.totalReceived": 1 }
)

// Get pending applications received
Application.aggregate([
  { $match: { userId: projectOwnerId } },
  { $unwind: "$applications_received" },
  { $match: { "applications_received.status": "PENDING" } },
  { $sort: { "applications_received.appliedDate": -1 } }
])

// Get applications sent by user
Application.findOne(
  { userId: applicantId },
  { applications_sent: 1, "stats.totalSent": 1 }
)

// Get specific application by applicationId (from sender's view)
Application.findOne(
  { 
    userId: applicantId,
    "applications_sent.applicationId": applicationId 
  },
  { "applications_sent.$": 1 }
)

// Get specific application by applicationId (from receiver's view)
Application.findOne(
  { 
    userId: projectOwnerId,
    "applications_received.applicationId": applicationId 
  },
  { "applications_received.$": 1 }
)

// Check for duplicate application
Application.findOne({
  userId: applicantId,
  "applications_sent": {
    $elemMatch: {
      projectId: projectId,
      status: { $ne: "QUIT" }
    }
  }
})

// Get applications for a specific project
Application.aggregate([
  { $match: { userId: projectOwnerId } },
  { $unwind: "$applications_received" },
  { $match: { "applications_received.projectId": projectId } },
  { $sort: { "applications_received.appliedDate": -1 } }
])

// Update application status in both arrays
Application.updateOne(
  { 
    userId: projectOwnerId,
    "applications_received.applicationId": applicationId 
  },
  { 
    $set: { 
      "applications_received.$.status": "ACCEPTED",
      "applications_received.$.statusUpdatedAt": new Date(),
      "applications_received.$.reviewNotes": "Great fit!"
    }
  }
)

Application.updateOne(
  { 
    userId: applicantId,
    "applications_sent.applicationId": applicationId 
  },
  { 
    $set: { 
      "applications_sent.$.status": "ACCEPTED",
      "applications_sent.$.statusUpdatedAt": new Date(),
      "applications_sent.$.reviewNotes": "Great fit!"
    }
  }
)

// Get project with team members and history
Project.findById(projectId)
  .populate('ownerId', 'name email avatar')
  .populate('teamMembers.id', 'name email avatar skills')
  .populate('teamHistory.memberId', 'name email avatar')
  .populate('teamHistory.performedBy', 'name email')

// Get active team members only
Project.findById(projectId)
  .populate({
    path: 'teamMembers.id',
    match: { status: 'active' },
    select: 'name email avatar skills'
  })

// Get team history for a specific member
Project.findOne(
  { _id: projectId },
  { teamHistory: { $elemMatch: { memberId: memberId } } }
)

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
