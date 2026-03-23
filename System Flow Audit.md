# Teamera.net — End-to-End Flow Audit & Fix Guide
> Perspective: UI/UX Designer + System Architect
> App: Teamera.net — Team-building & startup collaboration platform
> Stack: React 18 + Context API (frontend) | Express + MongoDB (backend)

---

## TABLE OF CONTENTS

1. CORE PROBLEM (ROOT CAUSE)
2. CORRECT SYSTEM ARCHITECTURE
3. CORRECT NAVIGATION
4. CRITICAL FLOW FIXES
5. SYSTEM DESIGN FIXES
6. CORRECT USER JOURNEYS
7. FINAL SYSTEM FLOW (CLEAN)

---

## 1. CORE PROBLEM (ROOT CAUSE)

The application was built feature-by-feature without a unified information architecture decision.
This caused three systemic root failures that cascade into 20+ surface-level bugs:

### ROOT CAUSE A — No Single Source of Truth for "Where Does Each Feature Live?"
Management actions (Edit, Delete, Stage, Leave) appear on both the Profile page and the Projects
discovery page. The Dashboard is missing its primary section (My Projects). The result: users
cannot find where to manage their work, and the same action exists in 3 wrong places.

### ROOT CAUSE B — No Route Protection + No Auth Guards on Actions
/dashboard and /profile are publicly accessible with no redirect. Community posts, Hackathon
registration, and Like/Comment actions fire for unauthenticated users. The backend has a full
JWT authenticate() middleware that is never applied to any route.

### ROOT CAUSE C — Collaboration Data Is Not Shared
The entire CollaborationSpace (Chat, Tasks, Files) stores data in localStorage only. This means
team members each see their own isolated copy. The "collaboration" feature does not collaborate.
This is the single most critical product failure in the system.

### SECONDARY ROOT CAUSES
- Navbar is missing 3 items: Community link, "+ New Project" button (imported but never rendered), Dashboard in primary nav
- Profile.jsx overwrites onboarding data on mount (re-fetches from backend before it is persisted)
- NotificationContext stores JSX elements (<Users size={16}/>) in state — not serializable
- 6 hardcoded sample projects in ProjectContext mix with real user data causing wrong permission logic
- Duplicate files with spaces in names (Community - Copy.jsx) can break build tools


---

## 2. CORRECT SYSTEM ARCHITECTURE

### Information Architecture — Single Source of Truth

Every feature has exactly ONE correct home. This table is the law:

| Feature                        | Dashboard                          | Profile Page              | Projects Page     | Notes                              |
|--------------------------------|------------------------------------|---------------------------|-------------------|------------------------------------|
| Projects You Own               | Full management (Edit/Delete/Stage/Workspace) | Read-only card + Open Workspace | REMOVE | Dual presence, different intent |
| Projects You're In             | Leave + Open Workspace             | Read-only + Open Workspace | REMOVE           | Same — dual presence OK            |
| Bookmarked Projects            | View + open ProjectModal           | NO                        | NO                | Operational, not portfolio         |
| Create New Project             | "+ New Project" card in My Projects tab | NO                   | NO                | Action lives in Navbar + Dashboard |
| Applications Received          | Applications tab → Received        | NO                        | NO                | Workflow only                      |
| Applications Sent              | Applications tab → Sent            | NO                        | NO                | Workflow only                      |
| Edit / Delete Project          | Dashboard → My Projects → Owned    | NO                        | NO                | Management = Dashboard only        |
| Stage Change                   | Dashboard → My Projects → Owned    | NO                        | NO                | Management = Dashboard only        |
| Open Collaboration Space       | My Projects card button            | Projects tab card button  | NO                | Both contexts valid                |
| Bio / Skills / Experience      | NO                                 | Overview tab              | NO                | Identity only                      |
| Privacy / Notification Settings| NO                                 | Settings tab (functional) | NO                | Account settings                   |
| Community Feed                 | NO                                 | NO                        | NO                | Navbar → /community                |
| Hackathons                     | NO (future: sidebar widget)        | NO                        | NO                | Navbar → /hackathons               |

### Backend Architecture — What Is Missing

The backend has a complete authenticate() JWT middleware in backend/middleware/auth.js that is
NEVER applied to any route in backend/api/routes/index.js. Every write operation (create project,
submit application, update profile, accept/reject) is publicly callable without a token.

The backend also has no dedicated routes for:
- Chat messages (stored only in localStorage)
- Tasks (stored only in localStorage)
- Files (stored only in localStorage)

These three collections must be added to MongoDB for CollaborationSpace to function as a real
shared workspace.

### State Management Architecture — What Is Wrong

AuthContext: Correct. Persists to localStorage. Single source of truth for user.
ProjectContext: Polluted with 6 hardcoded sample projects. These mix with real data and cause
  wrong isOwner checks, wrong notification targets, and wrong application routing.
NotificationContext: Stores JSX elements (icon: <Users size={16}/>) in state. JSX is not
  serializable — cannot be persisted to backend or localStorage. Store icon type as a string key
  instead (e.g., iconType: 'users') and resolve to JSX at render time.
CollaborationSpace: All data in localStorage. Must move to backend API.


---

## 3. CORRECT NAVIGATION

### Current Navbar (Logged In) — BROKEN
```
[Logo]  [Home] [Projects] [Hackathons]                    [Bell] [Avatar]
                                                                  └── My Profile
                                                                  └── Dashboard
                                                                  └── Messages
                                                                  └── Sign Out
```
Problems: Community missing. "+ New Project" button never rendered. Dashboard only in dropdown.
"Messages" label inconsistent with "Collaboration Space" in code.

### Correct Navbar (Logged In)
```
[Logo]  [Home] [Projects] [Hackathons] [Community]   [+ New Project]  [Bell]  [Avatar]
                                                                               └── My Profile
                                                                               └── Dashboard
                                                                               └── My Workspace
                                                                               ─────────────
                                                                               └── Sign Out
```

### Correct Navbar (Logged Out)
```
[Logo]  [Home] [Projects] [Hackathons] [Community]                    [Join Teamera]
```

### Fix Instructions for Navbar.jsx

PROMPT — Fix Navbar Navigation:
```
In frontend/components/Navbar.jsx, make these 4 changes:

1. Add Community link to the desktop nav menu (after Hackathons):
   <li className="nav-item">
     <Link to="/community" className={`nav-link ${location.pathname === '/community' ? 'active' : ''}`}>
       Community
     </Link>
   </li>

2. Add the same Community link to the mobile nav menu in the same position.

3. Render the "+ New Project" button in the desktop nav (it is imported but never rendered).
   Add this BEFORE the notification bell, only when user is logged in:
   {user && (
     <button className="create-project-btn" onClick={onCreateProject}>
       <Plus size={16} />
       New Project
     </button>
   )}

4. Rename "Messages" in the user dropdown to "My Workspace" for naming consistency.

5. Remove the duplicate/conflicting CSS rules for .collaboration-btn.mobile in Navbar.css.
   Keep only one rule block for that selector.
```

### Route Protection Fix

PROMPT — Add Protected Routes:
```
Create frontend/components/ProtectedRoute.jsx:

  import { Navigate } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';

  export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/" replace />;
    return children;
  }

In frontend/App.jsx, wrap /dashboard and /profile:
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

Also: when a logged-out user clicks "Join Teamera" and successfully logs in,
redirect them to /dashboard instead of staying on the home page.
In AuthContext.jsx login() function, add:
  navigate('/dashboard');
(import useNavigate from react-router-dom inside AuthContext or pass navigate as a callback)
```


---

## 4. CRITICAL FLOW FIXES

Each fix below is a self-contained human prompt. Execute in order.

---

### FIX-01 — Dashboard: Add "My Projects" Tab (CRITICAL — Core Feature Missing)
File: frontend/pages/Dashboard.jsx, frontend/pages/Dashboard.css

```
The Dashboard is missing its most important tab: "My Projects". Add it as the default tab.

Step 1 — Change default active tab:
  const [activeTab, setActiveTab] = useState('myprojects');

Step 2 — Add "My Projects" to the tab bar (first tab):
  <button className={`tab-btn ${activeTab === 'myprojects' ? 'active' : ''}`}
    onClick={() => setActiveTab('myprojects')}>
    My Projects
  </button>

Step 3 — Add sub-tabs inside My Projects tab:
  const [myProjectsSubTab, setMyProjectsSubTab] = useState('owned');

  Render two sub-tabs: "Projects I Own" and "Projects I'm In"

Step 4 — Get user projects from ProjectContext:
  const { owned, participating } = user ? getUserProjects(user.id) : { owned: [], participating: [] };

Step 5 — Render "Projects I Own" sub-tab:
  - Show each owned project as a card
  - Each card has buttons: [Edit] [Delete] [Change Stage] [Open Workspace]
  - Include a "+ New Project" card at the end that calls onCreateProject

Step 6 — Render "Projects I'm In" sub-tab:
  - Show each participating project as a card
  - Each card has buttons: [Open Workspace] [Leave Project]

Step 7 — Move the existing Bookmarks tab to second position (not default).
Step 8 — Keep Applications tab as third position.
```

---

### FIX-02 — Dashboard: Fix Bookmarked Project Click (Opens Wrong Component)
File: frontend/pages/Dashboard.jsx

```
In Dashboard.jsx, find where bookmarked project cards are rendered and clicked.
Currently clicking a bookmarked project opens CollaborationSpace. This is wrong.

Fix: When a bookmarked project card is clicked, call setSelectedProject(project) to open
ProjectModal — the same way Projects.jsx handles project clicks.

You will need to add local state:
  const [selectedProject, setSelectedProject] = useState(null);

And render ProjectModal conditionally:
  {selectedProject && (
    <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
  )}

Remove any code that opens CollaborationSpace from a bookmark card click.
```

---

### FIX-03 — Dashboard: Fix Accept Application Auto-Opening CollaborationSpace
File: frontend/pages/Dashboard.jsx

```
In Dashboard.jsx, find the handleAcceptApplication function.
It currently sets pendingCollabProjectId which triggers a useEffect that auto-opens
CollaborationSpace without user consent.

Fix:
1. Remove the pendingCollabProjectId state and its useEffect entirely.
2. After a successful accept, show a toast with an action button:
   "Application accepted! [Open Workspace →]"
3. The "Open Workspace" link in the toast should call setShowCollaborationSpace(true)
   and setActiveCollabProject(project) only when the user clicks it.

The user must always choose when to open the workspace — never auto-open it.
```

---

### FIX-04 — Dashboard: Fix Invisible Toast Notifications
File: frontend/pages/Dashboard.jsx, frontend/pages/Dashboard.css

```
In Dashboard.jsx, the toast is rendered as:
  <div className="toast-notification">

But the CSS class .toast-notification has no background-color — it renders transparent.

Fix in Dashboard.jsx: Apply the toast type as an additional CSS class:
  <div className={`toast-notification ${toast.type}`}>

Fix in Dashboard.css: Add background colors for each type:
  .toast-notification.success { background-color: #10b981; color: white; }
  .toast-notification.error   { background-color: #ef4444; color: white; }
  .toast-notification.info    { background-color: #3b82f6; color: white; }

Also ensure the toast has: position: fixed; bottom: 24px; right: 24px; z-index: 9999;
padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
```

---

### FIX-05 — Profile: Remove Management Controls (Profile = Read-Only Portfolio)
File: frontend/pages/Profile.jsx

```
The Profile page Projects tab currently shows Edit, Delete, Leave, and Stage-change controls.
Profile is a public-facing portfolio — it must be read-only.

In Profile.jsx, find the Projects tab render section.

Remove from each project card:
  - onEdit prop / Edit button
  - onDelete prop / Delete button  
  - onLeave prop / Leave button
  - Stage change dropdown (editingProjectStage state and its handlers)

Keep only:
  - Project card display (title, description, stage, team size)
  - "Open Workspace" button that opens CollaborationSpace for that project

Also remove:
  - editingProjectStage state
  - handleStageChange function
  - setEditingProjectStage calls
  - showEditProjectModal state and CreateProjectModal rendered inside Profile

These management actions belong exclusively in Dashboard → My Projects tab.
```

---

### FIX-06 — Profile: Remove Hardcoded Fake Data
File: frontend/pages/Profile.jsx

```
In Profile.jsx, find and remove the defaultExperienceData array. It contains hardcoded fake
entries like "Senior Full Stack Developer at TechCorp Solutions". This data bleeds into the UI
for real users who have no experience entries.

Replace with an empty array default:
  const experiences = user?.experiences || [];
  const education = user?.education || [];

If the arrays are empty, show an empty state message:
  "No experience added yet. Click Edit to add your experience."

Also remove the renderAchievements() function and its commented-out tab button entirely.
Dead commented code should not exist in production files.

Fix the "Connections Helped" stat — it currently shows userProjects.participating?.length
which is semantically wrong. Change the label to "Projects Joined" or calculate it correctly.
```

---

### FIX-07 — Profile: Fix Settings Tab (Non-Functional Buttons)
File: frontend/pages/Profile.jsx

```
In Profile.jsx Settings tab, "Privacy Settings" and "Notification Settings" buttons
currently have no onClick handlers — clicking them does nothing.

For now, implement a minimal working version:
1. Add local state: const [settingsSection, setSettingsSection] = useState(null);
2. "Privacy Settings" button: onClick={() => setSettingsSection('privacy')}
3. "Notification Settings" button: onClick={() => setSettingsSection('notifications')}
4. Render a simple inline panel below the buttons when settingsSection is set:
   - Privacy: toggle for "Show my profile publicly" (save to user preferences)
   - Notifications: toggle for "Email me when someone applies to my project"
5. Add a Save button that calls updateProfile() with the new preferences.

If full implementation is out of scope, at minimum remove the buttons so they don't
appear as broken UI. Dead buttons are worse than no buttons.
```

---

### FIX-08 — ProjectModal: Fix Apply Closing Entire Modal
File: frontend/components/ProjectModal.jsx

```
In ProjectModal.jsx, find handleApplicationSubmit (or the submit handler for the apply form).
It currently calls onClose() after a 2-second timeout, which closes the entire project modal.

Fix:
1. Do NOT call onClose() after submitting an application.
2. Instead, after successful submission:
   a. Hide only the application form: setShowApplicationForm(false)
   b. Show a success message INSIDE the modal:
      "Application submitted! You can track it in Dashboard → Applications → Sent."
   c. Add a link/button: "View My Applications" that navigates to /dashboard
      with state: { tab: 'applications', subTab: 'sent' }
3. The project modal should remain open so the user can continue reading the project details.
```

---

### FIX-09 — Projects Page: Remove Owner Management Controls from Discovery Page
File: frontend/pages/Projects.jsx

```
Projects.jsx is a public discovery page. It should show all projects in a grid.
Currently it renders Edit and Delete buttons on cards the user owns, and shows a
"Your Projects" collapsible section mixed into the discovery grid.

Fix:
1. Remove the showOwnedProjects state and the collapsible "Your Projects" section entirely.
2. Remove the onEditProject and onDeleteProject props passed to ProjectCard from Projects.jsx.
3. Remove the isOwned prop from ProjectCard when rendered in Projects.jsx.
4. The Projects page should only show: search bar, filters, project grid, empty state.
5. All project management (edit, delete, stage) moves to Dashboard → My Projects tab.

Also fix the empty state visibility bug:
  In Projects.css, find .empty-state h3 and .empty-state p with color: #ffffff
  Change to: color: #1f2937 (for h3) and color: #6b7280 (for p)
```

---

### FIX-10 — Community & Hackathons: Add Auth Guards
File: frontend/pages/Community.jsx, frontend/pages/Hackathons.jsx

```
COMMUNITY (Community.jsx):
1. Find the "New Post" button onClick handler.
   Wrap it: if (!user) { onAuthClick(); return; }
   Pass onAuthClick as a prop from App.jsx to Community.

2. Find the Like button handler. Add the same auth check.

3. Find the Comment submit handler. Add the same auth check.

HACKATHONS (Hackathons.jsx):
1. Find handleRegisterClick and handleJoinClick.
   At the top of each function add:
     if (!user) { onAuthClick(); return; }
   Pass onAuthClick as a prop from App.jsx to Hackathons.

In App.jsx, update the routes:
  <Route path="/community" element={
    <Community onAuthClick={() => handleModalState(setShowAuthModal, true)} />
  } />
  <Route path="/hackathons" element={
    <Hackathons onAuthClick={() => handleModalState(setShowAuthModal, true)} />
  } />
```

---

### FIX-11 — Onboarding: Restore "Skip for Now" Button
File: frontend/components/OnboardingModal.jsx

```
In OnboardingModal.jsx, the "Skip for now" button is commented out.
Users are trapped in the modal with no exit path.

Restore the skip button on every step except the last:
  {currentStep < steps.length - 1 && (
    <button className="skip-btn" onClick={onClose}>
      Skip for now
    </button>
  )}

On the last step, change the label to "Complete Later" with the same onClose handler.

Also ensure that when onClose is called from skip, the modal closes cleanly without
calling handleComplete() or making any API calls.
```

---

### FIX-12 — CollaborationSpace: Fix Member Filter (Fragile Name Matching)
File: frontend/components/CollaborationSpace.jsx

```
In CollaborationSpace.jsx, the user project filter uses:
  project.teamMembers.some(member => member.name === user?.name)

This breaks if a user changes their name, has a duplicate name, or has whitespace differences.

Fix: Filter by user ID instead of name:
  project.teamMembers.some(member =>
    member.id === user?.id || member.id === user?._id
  )

Also fix the isOwner check:
  Current: member.name === user?.name && (member.role === 'Founder' || member.role === 'OWNER')
  Fix:     (member.id === user?.id || member.id === user?._id) && 
           (member.role === 'Founder' || member.role === 'OWNER')

Apply the same ID-based check to isAdmin.
```

---

### FIX-13 — CollaborationSpace: Fix Fixed Width Breaking Tablets
File: frontend/components/CollaborationSpace.css

```
In CollaborationSpace.css, find the rule with:
  width: 900px;
  min-width: 900px;

Replace with:
  width: min(900px, calc(100vw - 2rem));
  min-width: 0;
  max-width: 900px;

This allows the modal to shrink on tablet viewports (768px–900px) instead of overflowing.
```

---

### FIX-14 — NotificationContext: Fix Non-Serializable JSX in State
File: frontend/context/NotificationContext.jsx

```
NotificationContext stores icon: <Users size={16} /> (a JSX element) directly in state.
JSX elements are not serializable — they cannot be persisted to localStorage or sent to a backend.

Fix: Replace JSX icon values with string keys:
  Instead of: icon: <Users size={16} />
  Use:        iconType: 'users'

Then in NotificationModal.jsx where notifications are rendered, resolve the icon at render time:
  const iconMap = {
    users: <Users size={16} />,
    check: <CheckCircle size={16} />,
    x: <XCircle size={16} />,
  };
  // In render: {iconMap[notification.iconType]}

Apply this change to all addApplicationNotification, addAcceptanceNotification,
and addRejectionNotification calls in NotificationContext.jsx.
Also remove the import of Users, CheckCircle, XCircle from NotificationContext.jsx
and move them to NotificationModal.jsx where they are actually rendered.
```

---

### FIX-15 — ProjectContext: Remove Hardcoded Sample Projects
File: frontend/context/ProjectContext.jsx

```
ProjectContext initializes with 6 hardcoded sample projects (EcoTrack, HealthAI, etc.).
These mix with real MongoDB data and cause:
  - Wrong isOwner checks (sample project ownerId !== real user id)
  - Notifications sent to wrong users
  - Applications attached to fake projects

Fix:
1. Remove all hardcoded sample project arrays from ProjectContext.jsx.
2. The projects state should initialize as empty: const [projects, setProjects] = useState([]);
3. All project data must come exclusively from the backend API fetch in useEffect.
4. If the backend returns no projects, show an empty state on the Projects page.

If sample data is needed for development/demo, use a separate seed script in the backend
(backend/utils/seed.js) that inserts real MongoDB documents — never hardcode in frontend state.
```

---

### FIX-16 — Backend: Apply JWT Auth Middleware to Protected Routes
File: backend/api/routes/index.js

```
The backend has a complete authenticate() middleware in backend/middleware/auth.js
but it is NEVER applied to any route. All write operations are publicly accessible.

Import authenticate at the top of routes/index.js:
  import { logger, authenticate } from '../../middleware/auth.js';

Apply authenticate middleware to all write/protected routes:
  router.post('/projects', authenticate, projectController.createProject);
  router.put('/projects/:id', authenticate, projectController.updateProject);
  router.delete('/projects/:id', authenticate, projectController.deleteProject);
  router.post('/projects/:id/team', authenticate, projectController.addTeamMember);
  router.delete('/projects/:id/team/:userId', authenticate, projectController.removeTeamMember);
  router.post('/applications/submit', authenticate, dashboardController.submitApplication);
  router.patch('/applications/:applicationId/status', authenticate, dashboardController.updateApplicationStatus);
  router.delete('/applications/:applicationId/withdraw', authenticate, dashboardController.withdrawApplication);
  router.put('/users/:id', authenticate, userController.updateUser);
  router.put('/users/:id/profile', authenticate, userController.updateUserProfile);
  router.delete('/users/:id', authenticate, userController.deleteUser);

Read-only public routes (GET /projects, GET /users, GET /hackathons) do NOT need authenticate.

Also: In frontend API calls that hit protected routes, pass the JWT token in the Authorization header:
  headers: { 'Authorization': `Bearer ${token}` }
  The token is returned on login and should be stored in AuthContext (not just localStorage).
```

---

### FIX-17 — Collaboration Data: Move Chat/Tasks/Files to Backend
File: backend/api/routes/index.js, backend/models/ (new files), frontend/components/tabs/

```
This is the most critical product fix. Chat, Tasks, and Files are stored in localStorage only.
Team members each see their own isolated copy. The collaboration feature does not collaborate.

Step 1 — Create backend models:
  backend/models/Message.js already exists — verify it has: projectId, senderId, senderName, content, createdAt
  Create backend/models/Task.js: { projectId, title, description, assigneeId, assigneeName, dueDate, priority, status, createdBy, createdAt }
  Create backend/models/ProjectFile.js: { projectId, fileName, fileSize, fileType, uploadedBy, uploadedAt, fileUrl }

Step 2 — Add routes in routes/index.js:
  router.get('/projects/:id/messages', authenticate, messagesController.getMessages);
  router.post('/projects/:id/messages', authenticate, messagesController.sendMessage);
  router.get('/projects/:id/tasks', authenticate, tasksController.getTasks);
  router.post('/projects/:id/tasks', authenticate, tasksController.createTask);
  router.patch('/projects/:id/tasks/:taskId', authenticate, tasksController.updateTask);
  router.get('/projects/:id/files', authenticate, filesController.getFiles);
  router.post('/projects/:id/files', authenticate, filesController.uploadFile);

Step 3 — Update ChatTab.jsx, TasksTab.jsx, FilesTab.jsx to fetch from API instead of localStorage.
  Replace all localStorage.getItem/setItem calls with fetch() calls to the new endpoints.
  Add loading states while data fetches.

Step 4 — For real-time chat, consider adding Socket.io to the backend server.
  This is optional for MVP — polling every 5 seconds is acceptable as a first step.
```

---

### FIX-18 — Delete Duplicate/Copy Files
File: frontend/pages/

```
Delete these files — they are leftover copies that pollute the codebase:
  frontend/pages/Community - Copy.jsx
  frontend/pages/Community - Copy.css
  frontend/pages/Home - Copy.jsx
  frontend/pages/Home - Copy.css

Files with spaces in their names can break certain build tools and import resolvers.
Verify no file imports these copy files before deleting.
```


---

## 5. SYSTEM DESIGN FIXES

### Design Token Standardization

PROMPT — Fix Visual Inconsistency (3 Blues, 3 Border Radii):
```
In frontend/styles/App.css, add CSS custom properties at the :root level:

:root {
  /* ═══════════════════════════════════════════════════════════
     COLOR SYSTEM — Single Source of Truth
     ═══════════════════════════════════════════════════════════ */
  
  /* Primary Brand Colors */
  --color-primary:        #4f46e5;  /* Indigo-600 — main brand color */
  --color-primary-hover:  #4338ca;  /* Indigo-700 — hover state */
  --color-primary-light:  #6366f1;  /* Indigo-500 — lighter variant */
  --color-primary-bg:     #eef2ff;  /* Indigo-50 — background tint */
  
  /* Gradient System */
  --gradient-primary: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  --gradient-header:  linear-gradient(to right, #6366f1, #8b5cf6);
  
  /* Semantic Colors */
  --color-success:        #10b981;  /* Green-500 */
  --color-success-bg:     #d1fae5;  /* Green-100 */
  --color-danger:         #ef4444;  /* Red-500 */
  --color-danger-bg:      #fee2e2;  /* Red-100 */
  --color-warning:        #f59e0b;  /* Amber-500 */
  --color-warning-bg:     #fef3c7;  /* Amber-100 */
  --color-info:           #3b82f6;  /* Blue-500 */
  --color-info-bg:        #dbeafe;  /* Blue-100 */
  
  /* Text Colors */
  --color-text-primary:   #111827;  /* Gray-900 — headings */
  --color-text-secondary: #6b7280;  /* Gray-500 — body text */
  --color-text-tertiary:  #9ca3af;  /* Gray-400 — muted text */
  
  /* Background Colors */
  --color-bg-primary:     #ffffff;  /* White — cards, modals */
  --color-bg-secondary:   #f9fafb;  /* Gray-50 — page background */
  --color-bg-tertiary:    #f3f4f6;  /* Gray-100 — input backgrounds */
  
  /* Border Colors */
  --color-border-light:   #f3f4f6;  /* Gray-100 — subtle borders */
  --color-border:         #e5e7eb;  /* Gray-200 — default borders */
  --color-border-dark:    #d1d5db;  /* Gray-300 — strong borders */
  
  /* ═══════════════════════════════════════════════════════════
     BORDER RADIUS SYSTEM
     ═══════════════════════════════════════════════════════════ */
  --radius-xs:  4px;   /* Tiny — tags, badges */
  --radius-sm:  8px;   /* Small — buttons, inputs */
  --radius-md:  12px;  /* Medium — cards, most components */
  --radius-lg:  16px;  /* Large — modals, major sections */
  --radius-xl:  20px;  /* Extra large — hero sections */
  --radius-full: 9999px; /* Fully rounded — pills, avatars */
  
  /* ═══════════════════════════════════════════════════════════
     SPACING SCALE
     ═══════════════════════════════════════════════════════════ */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   32px;
  --space-2xl:  48px;
  --space-3xl:  64px;
  
  /* ═══════════════════════════════════════════════════════════
     SHADOW SYSTEM
     ═══════════════════════════════════════════════════════════ */
  --shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md:  0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl:  0 20px 25px rgba(0, 0, 0, 0.15);
}

Then do a GLOBAL find-and-replace across ALL CSS files:

COLOR REPLACEMENTS:
  Find: #2563eb  → Replace: var(--color-primary)
  Find: #6366f1  → Replace: var(--color-primary-light)
  Find: #4f46e5  → Replace: var(--color-primary)
  Find: #10b981  → Replace: var(--color-success)
  Find: #ef4444  → Replace: var(--color-danger)
  Find: #f59e0b  → Replace: var(--color-warning)
  Find: #3b82f6  → Replace: var(--color-info)
  Find: #6b7280  → Replace: var(--color-text-secondary)
  Find: #9ca3af  → Replace: var(--color-text-tertiary)
  Find: #f9fafb  → Replace: var(--color-bg-secondary)
  Find: #f3f4f6  → Replace: var(--color-bg-tertiary)
  Find: #e5e7eb  → Replace: var(--color-border)

BORDER RADIUS REPLACEMENTS:
  Find: border-radius: 6px   → Replace: border-radius: var(--radius-sm)
  Find: border-radius: 8px   → Replace: border-radius: var(--radius-sm)
  Find: border-radius: 10px  → Replace: border-radius: var(--radius-md)
  Find: border-radius: 12px  → Replace: border-radius: var(--radius-md)
  Find: border-radius: 16px  → Replace: border-radius: var(--radius-lg)
  Find: border-radius: 20px  → Replace: border-radius: var(--radius-xl)

GRADIENT REPLACEMENTS:
  Find: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)
    → Replace: var(--gradient-primary)
  Find: linear-gradient(to right, #6366f1, #8b5cf6)
    → Replace: var(--gradient-header)

After replacement, verify in browser that all colors render correctly.
```

### Loading States

PROMPT — Add Loading Skeletons:
```
Create frontend/components/LoadingSkeleton.jsx:

  export default function LoadingSkeleton({ type = 'card', count = 3 }) {
    const items = Array.from({ length: count });
    if (type === 'card') {
      return (
        <div className="skeleton-grid">
          {items.map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line wide" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
            </div>
          ))}
        </div>
      );
    }
    return <div className="skeleton-line" />;
  }

Add CSS in a LoadingSkeleton.css file:
  .skeleton-line { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; height: 16px; margin: 8px 0; }
  .skeleton-line.wide { width: 100%; }
  .skeleton-line.medium { width: 70%; }
  .skeleton-line.short { width: 40%; }
  .skeleton-card { padding: 16px; border: 1px solid #e5e7eb; border-radius: 10px; }
  .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

Use <LoadingSkeleton type="card" count={6} /> in Projects.jsx, Dashboard.jsx, and Community.jsx
while data is loading instead of showing blank screens.
```

### Accessibility Fixes

PROMPT — Fix Modal Accessibility:
```
Apply these changes to ALL modal components:
  AuthModal.jsx, OnboardingModal.jsx, ProjectModal.jsx, CreateProjectModal.jsx,
  CollaborationSpace.jsx, NotificationModal.jsx, HackathonRegistrationModal.jsx

1. Add role="dialog" and aria-modal="true" to the modal container div.
2. Add aria-labelledby pointing to the modal title's id.
3. Add Escape key handler:
     useEffect(() => {
       const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
       document.addEventListener('keydown', handleEsc);
       return () => document.removeEventListener('keydown', handleEsc);
     }, [onClose]);
4. Add <label> elements to all form inputs in CreateProjectModal.jsx.
5. Add aria-label to all icon-only buttons (bookmark, share, edit, delete, close X buttons).
   Example: <button aria-label="Close modal" onClick={onClose}><X size={20} /></button>
```

---

## 6. CORRECT USER JOURNEYS

### Journey 1 — New User Registration & Onboarding

```
STEP 1: User lands on / (Home page)
  → Sees hero section with "Start Building Today" CTA
  → Clicks CTA → AuthModal opens

STEP 2: AuthModal — Sign Up tab
  → Fills: Full Name, Email, Password, Confirm Password
  → Checks "I agree to Terms"
  → Clicks "Create Account"
  → POST /api/users → user created in MongoDB
  → JWT token returned, stored in AuthContext
  → AuthModal closes

STEP 3: OnboardingModal opens automatically (for new users only)
  → Step 1: Select role (Founder / Professional / Investor / Student)
  → Step 2: Select skills (multi-select)
  → Step 3: Experience level + Location
  → Step 4: Bio + review summary
  → Click "Complete Profile" → PUT /api/users/:id/profile
  → AuthContext updated with complete profile data
  → OnboardingModal closes
  → User redirected to /dashboard

WHAT MUST BE TRUE AFTER THIS JOURNEY:
  ✓ User exists in MongoDB with role, skills, bio, location
  ✓ AuthContext has the complete user object
  ✓ localStorage has the complete user object
  ✓ Profile page shows the onboarding data immediately (no blank fields)
  ✓ Dashboard shows "My Projects" tab with empty state + "+ New Project" card
```

### Journey 2 — Project Creation & Team Building

```
STEP 1: Logged-in user clicks "+ New Project" in Navbar
  → CreateProjectModal opens

STEP 2: CreateProjectModal — multi-step form
  → Step 1: Title, Description, Industry, Stage
  → Step 2: Open Positions (role, required skills, paid/unpaid)
  → Step 3: Team Members (invite by email — links to real user accounts)
  → Click "Create Project" → POST /api/projects
  → Project created in MongoDB with ownerId = current user's id
  → CreateProjectModal closes

STEP 3: User goes to Dashboard → My Projects → "Projects I Own"
  → New project card appears
  → Card shows: [Edit] [Delete] [Change Stage] [Open Workspace] buttons

STEP 4: User clicks "Open Workspace"
  → CollaborationSpace opens with this project pre-selected
  → Chat, Tasks, Files, Team tabs available

WHAT MUST BE TRUE AFTER THIS JOURNEY:
  ✓ Project appears in Dashboard → My Projects → Owned
  ✓ Project appears in /projects discovery page (public)
  ✓ Project does NOT show Edit/Delete on the public /projects page
  ✓ CollaborationSpace filters projects by user.id (not user.name)
```

### Journey 3 — Project Discovery & Application

```
STEP 1: User (logged in or not) browses /projects
  → Sees grid of all projects
  → Uses search/filter to narrow results
  → Clicks a project card → ProjectModal opens

STEP 2: ProjectModal — Overview tab
  → Reads project description, stage, team, open positions
  → Clicks "Apply for [Position]"
  → If NOT logged in → AuthModal opens first, then returns to apply flow

STEP 3: Application form (inside ProjectModal — does NOT close modal)
  → Fills: cover message, optional resume upload
  → Clicks "Submit Application"
  → POST /api/applications/submit
  → Application stored in Dashboard model for both applicant and project owner
  → Success message shown INSIDE the modal: "Application submitted!"
  → Link: "Track in Dashboard → Applications → Sent"
  → ProjectModal stays open (user can keep reading)

STEP 4: Project owner receives notification
  → Bell icon shows unread badge
  → Clicks bell → NotificationModal
  → Sees "New application for [Project Name] from [Applicant]"
  → Clicks notification → navigates to /dashboard with tab=applications, subTab=received

STEP 5: Owner reviews application in Dashboard → Applications → Received
  → Sees applicant name, skills, message
  → Clicks "Accept" → PATCH /api/applications/:id/status { status: 'accepted' }
  → Toast: "Application accepted! [Open Workspace →]"
  → Owner clicks "Open Workspace" in toast → CollaborationSpace opens
  → Applicant receives "Accepted" notification

WHAT MUST BE TRUE AFTER THIS JOURNEY:
  ✓ ProjectModal stays open after applying
  ✓ Application appears in applicant's Dashboard → Applications → Sent
  ✓ Application appears in owner's Dashboard → Applications → Received
  ✓ CollaborationSpace does NOT auto-open — user must click to open
  ✓ Accepted applicant appears in project teamMembers in MongoDB
```

### Journey 4 — Team Collaboration

```
STEP 1: Team member opens CollaborationSpace
  → Via Navbar dropdown → "My Workspace"
  → OR via Dashboard → My Projects card → "Open Workspace"
  → OR via Profile → Projects tab → "Open Workspace"

STEP 2: Project selector dropdown
  → Shows only projects where user is a team member (filtered by user.id)
  → User selects a project

STEP 3: Chat tab
  → Fetches messages from GET /api/projects/:id/messages
  → User types message → POST /api/projects/:id/messages
  → All team members see the same messages (backend-synced)

STEP 4: Tasks tab
  → Fetches tasks from GET /api/projects/:id/tasks
  → Owner/Admin creates task → POST /api/projects/:id/tasks
  → Assigns to team member by userId
  → All team members see the same task board

STEP 5: Files tab
  → Fetches files from GET /api/projects/:id/files
  → User uploads file → POST /api/projects/:id/files
  → All team members can download

STEP 6: Team tab
  → Shows all team members with roles
  → Owner can invite new members (by email)
  → Non-owner members see "Leave Project" button

WHAT MUST BE TRUE AFTER THIS JOURNEY:
  ✓ Chat messages visible to ALL team members (not just the sender)
  ✓ Tasks visible to ALL team members
  ✓ Files visible to ALL team members
  ✓ Data persists after browser refresh
  ✓ localStorage is NOT used for any collaboration data
```

### Journey 5 — Profile as Public Portfolio

```
STEP 1: User navigates to /profile
  → Sees their public portfolio view

STEP 2: Overview tab (default)
  → Bio, title, location, social links
  → Skills with proficiency levels
  → Experience timeline
  → Education

STEP 3: Projects tab
  → Read-only project cards (no Edit/Delete/Leave/Stage controls)
  → Each card has ONE action: "Open Workspace" button
  → Clicking "Open Workspace" opens CollaborationSpace for that project

STEP 4: Settings tab
  → Edit profile fields (name, bio, title, location, social links)
  → Privacy settings (show/hide profile publicly)
  → Notification preferences
  → Password change
  → All settings save via PUT /api/users/:id/profile

WHAT MUST BE TRUE AFTER THIS JOURNEY:
  ✓ No management controls (Edit/Delete/Stage) on Profile
  ✓ No hardcoded fake experience data
  ✓ Settings tab buttons are functional
  ✓ Profile data matches what was set in Onboarding
```

---

## 7. FINAL SYSTEM FLOW (CLEAN)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TEAMERA.NET                                  │
│                    Clean System Flow v2.0                            │
└─────────────────────────────────────────────────────────────────────┘

[/] Home Page
  ├── Hero CTA → AuthModal (if not logged in)
  ├── Hero CTA → /projects (if logged in)
  └── Features, Personas, Stages sections

[AuthModal]
  ├── Login → POST /api/users/login → JWT → AuthContext → /dashboard
  └── Sign Up → POST /api/users → JWT → OnboardingModal → /dashboard

[OnboardingModal] (new users only)
  └── 4 steps → PUT /api/users/:id/profile → AuthContext updated → /dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NAVBAR (always visible)
  ├── Logo → /
  ├── Home → /
  ├── Projects → /projects
  ├── Hackathons → /hackathons
  ├── Community → /community
  ├── [+ New Project] (logged in only) → CreateProjectModal
  ├── Bell → NotificationModal → click notification → /dashboard?tab=applications
  └── Avatar (logged in)
        ├── My Profile → /profile
        ├── Dashboard → /dashboard
        ├── My Workspace → CollaborationSpace
        └── Sign Out → / (clear auth)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[/projects] — Public Discovery (NO auth required to browse)
  ├── Search + Filters (Industry, Stage, Skills)
  ├── Project Grid → click card → ProjectModal
  └── ProjectModal
        ├── Overview: description, team, positions
        ├── Apply button → auth check → Application form (stays in modal)
        └── Success: "Applied! Track in Dashboard → Applications → Sent"

[/hackathons] — Public browse, auth required to register
  ├── Tabs: Upcoming | Live Now | Past
  ├── Register/Join → auth check → HackathonRegistrationModal
  └── Leaderboard (future)

[/community] — Public browse, auth required to post/like/comment
  ├── Post feed with categories
  ├── New Post → auth check → CreatePostModal
  └── Like/Comment → auth check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[/dashboard] — PROTECTED (redirect to / if not logged in)
  │
  ├── Tab: MY PROJECTS (default tab)
  │     ├── Sub-tab: Projects I Own
  │     │     ├── Project cards: [Edit] [Delete] [Stage] [Open Workspace]
  │     │     └── "+ New Project" card → CreateProjectModal
  │     └── Sub-tab: Projects I'm In
  │           └── Project cards: [Open Workspace] [Leave]
  │
  ├── Tab: BOOKMARKS
  │     └── Project cards → click → ProjectModal (NOT CollaborationSpace)
  │
  └── Tab: APPLICATIONS
        ├── Sub-tab: Received
        │     └── Applicant cards: [Accept] [Reject]
        │           Accept → toast with [Open Workspace] link (NOT auto-open)
        └── Sub-tab: Sent
              └── Application cards with status (Pending/Accepted/Rejected)

[/profile] — PROTECTED (redirect to / if not logged in)
  │
  ├── Tab: OVERVIEW (default)
  │     └── Bio, Skills, Experience, Education (read-only display)
  │
  ├── Tab: PROJECTS
  │     └── Project cards (read-only) + [Open Workspace] button only
  │
  └── Tab: SETTINGS
        └── Edit profile, Privacy, Notifications, Password change

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CollaborationSpace] — Modal/Overlay (accessible from Navbar, Dashboard, Profile)
  ├── Project selector (shows only user's projects, filtered by user.id)
  ├── Tab: CHAT    → GET/POST /api/projects/:id/messages (backend-synced)
  ├── Tab: TASKS   → GET/POST /api/projects/:id/tasks   (backend-synced)
  ├── Tab: FILES   → GET/POST /api/projects/:id/files   (backend-synced)
  └── Tab: TEAM    → team members list, invite (owner), leave (member)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BACKEND API (Express + MongoDB)
  ├── Public routes (no auth):
  │     GET  /api/projects
  │     GET  /api/projects/:id
  │     GET  /api/users/:id/profile
  │     POST /api/users (register)
  │     POST /api/users/login
  │
  └── Protected routes (JWT required):
        POST   /api/projects
        PUT    /api/projects/:id
        DELETE /api/projects/:id
        POST   /api/applications/submit
        PATCH  /api/applications/:id/status
        PUT    /api/users/:id/profile
        GET/POST /api/projects/:id/messages
        GET/POST /api/projects/:id/tasks
        GET/POST /api/projects/:id/files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIORITY EXECUTION ORDER

P1 — CRITICAL (breaks core product):
  FIX-01  Add "My Projects" tab to Dashboard
  FIX-02  Fix Bookmarked project click (opens ProjectModal not CollaborationSpace)
  FIX-03  Fix Accept Application auto-opening CollaborationSpace
  FIX-08  Fix ProjectModal apply closing entire modal
  FIX-15  Remove hardcoded sample projects from ProjectContext
  FIX-17  Move Chat/Tasks/Files to backend (collaboration actually collaborates)

P2 — HIGH (broken navigation and auth):
  FIX-Navbar  Add Community link + render "+ New Project" button
  FIX-Routes  Add ProtectedRoute for /dashboard and /profile
  FIX-09  Fix Projects page (remove owner controls from discovery)
  FIX-05  Fix Profile Projects tab (remove management controls)
  FIX-10  Add auth guards to Community and Hackathons actions
  FIX-16  Apply JWT authenticate middleware to backend protected routes

P3 — MEDIUM (UX polish and data integrity):
  FIX-04  Fix invisible toast notifications
  FIX-06  Fix Profile hardcoded fake data
  FIX-07  Fix Profile Settings tab non-functional buttons
  FIX-11  Restore OnboardingModal "Skip for now" button
  FIX-12  Fix CollaborationSpace member filter (ID not name)
  FIX-13  Fix CollaborationSpace fixed width on tablets
  FIX-14  Fix NotificationContext non-serializable JSX in state

P4 — LOW (cleanup and polish):
  FIX-18  Delete duplicate copy files
  Design tokens (CSS variables for colors and border radii)
  Loading skeletons
  Modal accessibility (aria-modal, focus trap, Escape key)
```

---

*Generated by: UI/UX + System Architecture Audit — Teamera.net — March 2026*
