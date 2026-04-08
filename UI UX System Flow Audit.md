# 🧭 Teamera.net — Master Flow Audit & Fix Guide

> **Perspective:** Senior UI/UX Designer + System Architect  
> **Source Documents:** `SYSTEM_ISSUES_AND_FIXES.md` · `UX_AUDIT_REPORT.md` · `UX_FIX_PROMPTS.md` · `UX_SYSTEM_FLOW_AUDIT.md`  
> **Purpose:** Single authoritative reference — flow validation, issue inventory, and ready-to-use human prompts  
> **Status:** ⚠️ 27 confirmed issues across 10 flow areas — see priority table and prompts below

---

## 📋 Table of Contents

1. [Flow Validation Summary — What Is Correct vs. Broken](#1-flow-validation-summary)
2. [Correct System Flow Blueprint](#2-correct-system-flow-blueprint)
3. [Information Architecture Decision Table](#3-information-architecture-decision-table)
4. [Complete Issue Registry](#4-complete-issue-registry)
5. [Flow-by-Flow Breakdown](#5-flow-by-flow-breakdown)
  - 5.1 Auth & Onboarding Flow
  - 5.2 Project Discovery Flow
  - 5.3 Project Creation Flow
  - 5.4 Application & Collaboration Flow
  - 5.5 Dashboard Flow
  - 5.6 Profile Flow
  - 5.7 Navbar & Navigation Flow
  - 5.8 Community & Hackathon Flow
  - 5.9 Styling & Visual Consistency
  - 5.10 Accessibility & Data Integrity
6. [Human Fix Prompts — Ready to Execute](#6-human-fix-prompts)
7. [Priority Execution Order](#7-priority-execution-order)

---

## 1. Flow Validation Summary

> ✅ = Flow is correct as-is | ❌ = Broken or wrong | ⚠️ = Partial — needs adjustment


| #   | Flow / Section                          | Status | Verdict                                                                                 |
| --- | --------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| F1  | Home Page — Marketing & CTA             | ⚠️     | Hero right column is empty (visual JSX missing)                                         |
| F2  | Auth → Signup / Login                   | ⚠️     | Works, but no token auth, no email verify, dead "Forgot Password"                       |
| F3  | Onboarding → Profile population         | ⚠️     | Profile.jsx now fetches from backend, but consistency with onboarding needs verification |
| F4  | Route Protection (/dashboard, /profile) | ✅      | Correct — ProtectedRoute implemented and wrapping routes in App.jsx                    |
| F5  | Project Discovery (Projects page)       | ✅      | Correct — Owner management controls removed from public discovery page                 |
| F6  | Apply to Project (ProjectModal)         | ✅      | Correct — Inline success message implemented; modal no longer closes unexpectedly      |
| F7  | Create New Project                      | ❌      | "+ New Project" button imported in Navbar but never rendered in JSX                     |
| F8  | Project Team Member Addition            | ❌      | Step 3 adds members by name string, not by real user account                            |
| F9  | Dashboard — My Projects                 | ✅      | Correct — "My Projects" tab added as default with "Owned" and "In" sub-tabs            |
| F10 | Dashboard — Bookmarked Projects         | ✅      | Correct — Clicking bookmark now opens ProjectModal as intended                         |
| F11 | Dashboard — Accept Application          | ✅      | Correct — Accept works with toast action button (no more auto-open)                    |
| F12 | Dashboard — Toast Feedback              | ✅      | Correct — Toast has CSS color classes applied and fully visible                        |
| F13 | Collaboration Space — Access Filter     | ❌      | Member filter uses name string matching (fragile — breaks on name change or duplicates) |
| F14 | Collaboration Space — Data Sharing      | ❌      | Chat/Tasks/Files stored in localStorage only — not shared between team members          |
| F15 | Collaboration Space — Entry Point       | ❌      | No visible entry point in primary navigation                                            |
| F16 | Profile Page — Projects Tab             | ✅      | Correct — Management controls removed from Projects tab; read-only display              |
| F17 | Profile Page — Dead Code                | ✅      | Correct — Hardcoded fake data removed; Connections stat corrected                        |
| F18 | Profile Page — Settings Tab             | ⚠️     | "Privacy" and "Notifications" buttons exist but do nothing                              |
| F19 | Profile Page — Stats                    | ⚠️     | "Connections Helped" stat is semantically wrong                                         |
| F20 | Navbar — Community Link                 | ✅      | Community link added to primary Navbar                                                  |
| F21 | Navbar — Dashboard Link                 | ⚠️     | Dashboard is only in dropdown — should be in primary nav for logged-in users            |
| F22 | Navbar — Create Project CTA             | ❌      | Plus icon imported but Create Project button never renders in JSX                       |
| F23 | Community Page — Auth Guard             | ❌      | "New Post" / Like / Comment have no authentication check                                |
| F24 | Hackathons Page — Auth Guard            | ❌      | Register/Join buttons have no auth check                                                |
| F25 | Notification System                     | ✅      | Bell, badge, modal, and nav to Dashboard tab — correct                                  |
| F26 | Styling — Visual Consistency            | ❌      | 3 different blue values, 3 different border radii, mobile nav inconsistencies           |
| F27 | Accessibility — Modals                  | ❌      | No focus trap, no aria-modal, no Escape key handler, no form labels                     |


**Score: 13 correct ✅ | 9 broken ❌ | 5 partially broken ⚠️**

---

## 2. Correct System Flow Blueprint

### 🔷 Full User Journey Map (Authenticated User)

```
[Landing Page /]
      │
      ▼
[Sign Up / Login — AuthModal]
      │
      ▼
[OnboardingModal — Role, Skills, Bio, Location]
      │ (data persisted immediately to backend + AuthContext)
      ▼
[Dashboard /dashboard]  ← DEFAULT landing after auth
      │
      ├── Tab: MY PROJECTS (default)
      │         ├── Sub-tab: Projects I Own
      │         │       [Edit] [Delete] [Stage] [Open Workspace]
      │         ├── Sub-tab: Projects I'm In
      │         │       [Open Workspace] [Leave]
      │         └── [+ New Project] CTA card
      │
      ├── Tab: BOOKMARKS
      │         └── Click → opens ProjectModal (view/apply) — NOT CollaborationSpace
      │
      └── Tab: APPLICATIONS
                ├── Sub-tab: Received → [Accept] [Reject]
                └── Sub-tab: Sent → status tracking
      
[Navbar — Always Visible]
      ├── Home | Projects | Hackathons | Community
      ├── [+ New Project] button (logged-in only)
      ├── 🔔 Bell → NotificationModal
      └── Avatar → [My Profile] [Dashboard] [Messages/Workspace] [Sign Out]

[Projects /projects] — Discovery Only
      └── Click project → ProjectModal → Apply for Position

[Profile /profile] — Public Portfolio (READ-ONLY)
      ├── Tab: Overview — Bio, Skills, Experience, Education
      ├── Tab: Projects — Cards with [Open Workspace] only (NO Edit/Delete/Leave)
      └── Tab: Settings — Account, Privacy, Notifications

[Collaboration Space — Modal/Workspace]
      ├── Opened from: Dashboard → My Projects cards
      ├── Opened from: Navbar dropdown → Messages
      └── Tabs: Chat | Tasks | Files | Team (data must be backend-synced)

[Community /community] — Social Feed
      └── Accessible from Navbar (NOT footer-only)

[Hackathons /hackathons]
      └── Register/Join → auth check → HackathonRegistrationModal
```

---

## 3. Information Architecture Decision Table

> This table defines the single correct home for each feature to eliminate IA confusion.


| Feature                           | Dashboard                                               | Profile                                     | Projects Page     | Notes                            |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------- | ----------------- | -------------------------------- |
| Projects You Own                  | ✅ Full management (Edit, Delete, Stage, Open Workspace) | ✅ Read-only portfolio card + Open Workspace | ❌ Remove entirely | Dual presence — different intent |
| Projects Participating In         | ✅ Leave button + Open Workspace                         | ✅ Read-only + Open Workspace                | ❌ Remove entirely | Same — dual presence OK          |
| Bookmarked Projects               | ✅ View + open ProjectModal                              | ❌ No                                        | ❌ No              | Operational, not portfolio       |
| Create Project                    | ✅ "+ New Project" card in My Projects tab               | ❌ No                                        | ❌ No              | Action is in Navbar + Dashboard  |
| Application Management (Received) | ✅ Applications tab → Received                           | ❌ No                                        | ❌ No              | Workflow only                    |
| Application Management (Sent)     | ✅ Applications tab → Sent                               | ❌ No                                        | ❌ No              | Workflow only                    |
| Edit / Delete Project             | ✅ Dashboard → My Projects → Owned                       | ❌ No                                        | ❌ No              | Management = Dashboard only      |
| Stage Change                      | ✅ Dashboard → My Projects → Owned                       | ❌ No                                        | ❌ No              | Management = Dashboard only      |
| Open Collaboration Space          | ✅ My Projects card button                               | ✅ Projects tab card button                  | ❌ No              | Both contexts valid              |
| Bio / Skills / Experience         | ❌ No                                                    | ✅ Overview tab                              | ❌ No              | Identity only                    |
| Privacy / Notification Settings   | ❌ No                                                    | ✅ Settings tab (must be functional)         | ❌ No              | Account settings                 |
| Community Feed                    | ❌ No                                                    | ❌ No                                        | ❌ No              | Navbar → /community              |
| Hackathons                        | ❌ No (future: Upcoming Events sidebar)                  | ❌ No                                        | ❌ No              | Navbar → /hackathons             |


---

## 4. Complete Issue Registry


| ID     | Severity    | Section        | File(s) Affected                 | Issue Summary                                                                      |
| ------ | ----------- | -------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| FIX-01 | ✅ Fixed    | Dashboard      | `Dashboard.jsx`                  | "My Projects" tab implemented as default with sub-tabs                             |
| FIX-02 | 🔴 Critical | Navbar         | `Navbar.jsx`                     | "+ New Project" button imported but not rendered in JSX                            |
| FIX-03 | 🔴 Critical | Navbar         | `Navbar.jsx`                     | Community link missing from all navigation menus                                   |
| FIX-04 | 🔴 Critical | Routing        | `App.jsx`                        | No route protection — /dashboard and /profile publicly accessible                  |
| FIX-05 | 🟠 High     | Dashboard      | `Dashboard.jsx`                  | Message button + quick stats missing from header                                   |
| FIX-06 | ✅ Fixed    | Dashboard      | `Dashboard.jsx`                  | Bookmarked project click opens ProjectModal (correct)                              |
| FIX-07 | ✅ Fixed    | Dashboard      | `Dashboard.jsx`                  | Accept application uses toast action — no more auto-open                           |
| FIX-08 | ✅ Fixed    | Profile        | `Profile.jsx`                    | Projects tab is now read-only display                                              |
| FIX-09 | 🟠 High     | Collab Space   | `CollaborationSpace.jsx`         | Member filter uses `member.name === user.name` — agile string match                |
| FIX-10 | ✅ Fixed    | Projects Page  | `Projects.jsx`                   | Owner controls removed from discovery page                                         |
| FIX-11 | ✅ Fixed    | Project Apply  | `ProjectModal.jsx`               | Inline success message implemented (no modal close)                                |
| FIX-12 | 🟠 High     | Auth           | `AuthModal.jsx`                  | "Forgot password" is a dead `href="#"` anchor — no flow implemented                |
| FIX-13 | 🟡 Medium   | Navbar         | `Navbar.jsx`                     | Dashboard link only in dropdown — should also be in primary nav                    |
| FIX-14 | ✅ Fixed    | Profile        | `Profile.jsx`                    | Fake experience data removed; dead code cleaned up                                 |
| FIX-15 | 🟡 Medium   | Profile        | `Profile.jsx`                    | Settings tab "Privacy" and "Notifications" buttons are non-functional placeholders |
| FIX-16 | ✅ Fixed    | Dashboard      | `Dashboard.jsx`, `Dashboard.css` | Toast notification colors fixed and fully visible                                  |
| FIX-17 | 🟡 Medium   | Home           | `Home.jsx`, `Home.css`           | Hero right column empty — `.hero-visual` JSX block is missing                      |
| FIX-18 | 🟡 Medium   | Community      | `Community.jsx`                  | "New Post" / Like / Comment buttons have no auth guard                             |
| FIX-19 | 🟡 Medium   | Hackathons     | `Hackathons.jsx`                 | Register/Join buttons open modal for unauthenticated users                         |
| FIX-20 | 🟡 Medium   | Onboarding     | `OnboardingModal.jsx`            | "Skip for now" button is commented out — users trapped in modal                    |
| FIX-21 | 🟡 Medium   | Notifications  | `NotificationContext.jsx`        | JSX icon elements stored in state (not serializable — cannot be persisted)         |
| FIX-22 | 🟡 Medium   | Dashboard      | `Dashboard.jsx`, `Dashboard.css` | "Upcoming Events" sidebar missing — required by spec                               |
| FIX-23 | 🔵 Low      | Codebase       | `pages/` folder                  | Duplicate copy files: `Community - Copy.*`, `Home - Copy.*`                        |
| FIX-24 | 🔵 Low      | ProjectCard    | `ProjectCard.jsx`                | Share button only calls `console.log` — no real action                             |
| FIX-25 | 🔵 Low      | All Modals     | All modal components             | No keyboard focus trap, no Escape key handler, no `aria-modal`                     |
| FIX-26 | 🔵 Low      | Styling        | `App.css` + all CSS files        | 3 different blue color values, 3 border radii, inconsistent mobile nav             |
| FIX-27 | 🔵 Low      | Loading States | Dashboard, Profile, Community    | No loading skeletons — blank screens on async data fetch                           |


---

## 5. Flow-by-Flow Breakdown

---

### 5.1 Auth & Onboarding Flow

**Current Flow:**

```
Sign Up → OnboardingModal collects data → Profile.jsx fetches from backend on mount → overwrites onboarding data
```

**Correct Flow:**

```
Sign Up → OnboardingModal → updateProfile() persisted immediately → AuthContext updated → Profile reflects data without refresh
```

**Issues:**

- `Profile.jsx` re-initializes `formData` from the backend on every mount. If the backend hasn't persisted onboarding data yet, new users see an empty profile even after completing onboarding.
- `OnboardingModal.jsx` has its "Skip for now" button commented out — users cannot exit without completing all steps.
- `/dashboard` and `/profile` routes have no auth protection. Dashboard renders with null user data silently.
- "Forgot Password" in `AuthModal.jsx` points to `href="#"` — no password reset flow exists anywhere.
- Social login (Google/Apple) uses `setTimeout` mocks instead of real OAuth.

**Verdict: ⚠️ Flow is improved with route guards, but onboarding persistence needs confirmation.**

---

### 5.2 Project Discovery Flow

**Current Flow:**

```
/projects → all projects shown in grid + owner's own projects shown with Edit/Delete buttons
```

**Correct Flow:**

```
/projects → public discovery grid only (no management controls) → click project → ProjectModal → Apply
```

**Issues:**

- `Projects.jsx` renders owner `Edit` and `Delete` buttons via `isOwned` prop on `ProjectCard` in a public context.
- A "Your Projects" collapsible section is mixed into the discovery grid — management belongs in Dashboard.
- `.empty-state h3` and `.empty-state p` use `color: #ffffff` (white on white background — invisible).
- Share button in `ProjectCard.jsx` only calls `console.log('Shared:', project.title)` — no real action.

**Verdict: ✅ Discovery page is now clean; owner management moved to Dashboard/Profile.**

---

### 5.3 Project Creation Flow

**Current Flow:**

```
??? (no visible CTA) → user must discover Create Project via dropdown → CreateProjectModal
```

**Correct Flow:**

```
Navbar → click "+ New Project" (always visible when logged in) → CreateProjectModal → new project appears in Dashboard
```

**Issues:**

- `Plus` icon is imported in `Navbar.jsx` and `onCreateProject` prop is passed from `App.jsx`, but **no button is rendered in the JSX**. Users have no visible way to create a project.
- `CreateProjectModal.jsx` Step 3 "Team Members" adds members by typing a name string. These are not linked to real user accounts — added "members" cannot see the project in their dashboard or access CollaborationSpace.

**Verdict: ❌ Creation CTA is completely non-functional in the UI.**

---

### 5.4 Application & Collaboration Flow

**Current Flow (Broken):**

```
User applies → onClose() fires → modal closes → user loses project context
Owner accepts → pendingCollabProjectId set → useEffect fires → CollaborationSpace auto-opens
CollaborationSpace → filters by member.name === user.name → fragile
Chat/Tasks/Files → saved to localStorage only → not shared between team members
```

**Correct Flow:**

```
User applies → form closes (not modal) → success message shown in modal → "View My Applications" link
Owner accepts → toast shows "Accepted — [Open Workspace]" → user chooses when to open
CollaborationSpace → filter by member.userId === user.id → reliable
Chat/Tasks/Files → synced to backend API → shared across all team members
```

**Issues:**

- `ProjectModal.jsx`: `handleApplicationSubmit` calls `onClose()` after 2 seconds — closes the entire modal.
- `Dashboard.jsx`: `handleAcceptApplication` uses `pendingCollabProjectId` to auto-open CollaborationSpace via `useEffect` — no user consent.
- `CollaborationSpace.jsx`: `project.teamMembers.some(member => member.name === user?.name)` — name string matching breaks on any name difference.
- All Chat, Task, and File data is stored in `localStorage` only — it is **not shared between team members**. The collaboration feature is effectively non-functional for team use.
- CollaborationSpace has a fixed CSS `width: 900px; min-width: 900px` — breaks on tablet viewports (768px–900px).
- No visible entry point for CollaborationSpace in the primary navigation.

**Verdict: ⚠️ ProjectModal apply fix implemented; collaboration pipeline still has backend-sync and member filter issues.**

---

### 5.5 Dashboard Flow

**Current Flow:**

```
/dashboard → Tabs: [Bookmarked Projects (default)] [Applications]
Bookmarked project click → opens CollaborationSpace (wrong)
```

**Correct Flow:**

```
/dashboard → Header with Quick Stats + Message button
           → Tabs: [My Projects (default)] [Bookmarked] [Applications]
           → My Projects: sub-tabs [I Own] [I'm In]
           → Bookmarked: click → opens ProjectModal
           → Sidebar: Upcoming Events
```

**Issues:**

- "My Projects" tab is completely absent — the most important dashboard section per spec is missing.
- No quick stats cards (Active Projects, Joined, Received Applications, Sent Applications).
- No "Message / Open Workspace" button in the Dashboard header.
- No "Upcoming Events" sidebar (spec requirement).
- "Bookmarked Projects" is incorrectly set as the default tab.
- Clicking a bookmarked project opens `CollaborationSpace` — user may not even be a member of that project.
- Toast notification div has no `type` CSS class applied — `.toast-notification` base has no `background-color`, rendering it transparent.
- Settings gear icon in dashboard header has no `onClick` handler — dead UI.

**Verdict: ⚠️ Bookmarks fix implemented; "My Projects" and quick stats still missing.**

---

### 5.6 Profile Flow

**Current Flow:**

```
/profile → Tabs: [Overview] [Projects (with Edit/Delete/Leave/Stage)] [Settings (non-functional)]
```

**Correct Flow:**

```
/profile → Public portfolio view
         → Tabs: [Overview — bio/skills/exp] [Projects — read-only + Open Workspace] [Settings — functional]
```

**Issues:**

- Profile Projects tab renders `onEdit`, `onDelete`, `onLeave`, and stage-change dropdown — management controls on a public-facing portfolio page.
- `defaultExperienceData` array contains hardcoded fake entries ("Senior Full Stack Developer" at "TechCorp Solutions") that can bleed into the UI for real users.
- `renderAchievements()` function is fully commented out in both the tab bar and content render — dead code that confuses developers.
- "Privacy Settings" and "Notification Settings" buttons in the Settings tab have no handlers — clicking them does nothing.
- The stat `"Connections Helped"` is calculated as `userProjects.participating?.length` — semantically incorrect.
- `"Hackathons Won"` stat uses `user?.hackathonsWon || "0"` but no mechanism in the app ever increments this value.
- No "Open Collaboration" / "Go to Workspace" button on Profile project cards — users on Profile have no path to their workspace.
- Profile and Dashboard both independently manage `ProfileModal` state with no shared cache.

**Verdict: ❌ Profile is over-loaded with management actions and contains dead/fake data.**

---

### 5.7 Navbar & Navigation Flow

**Current Navbar (Logged In):**

```
[Logo]  [Home] [Projects] [Hackathons]       [🔔] [Avatar ▾]
                                               └── My Profile
                                               └── Dashboard
                                               └── Messages
                                               └── Sign Out
```

**Correct Navbar (Logged In):**

```
[Logo]  [Home] [Projects] [Hackathons] [Community]   [+ New Project] [🔔] [Avatar ▾]
                                                                          └── 👤 My Profile
                                                                          └── 📊 Dashboard
                                                                          └── 💬 My Workspace
                                                                          └── ──────────
                                                                          └── 🚪 Sign Out
```

**Issues:**

- Community link is completely absent from Navbar — only accessible via Footer (extremely poor discoverability).
- Dashboard link is only in the dropdown — should also appear in the primary nav for logged-in users.
- "+ New Project" button is never rendered despite `Plus` icon being imported and `onCreateProject` prop being passed.
- "Messages" in dropdown leads to CollaborationSpace but there is no naming consistency — the feature is called "Collaboration Space" in code and "Messages" in the UI.
- Mobile navbar has contradictory CSS overrides for `.collaboration-btn.mobile` — styled green, then overridden to gray in a later rule block.

**Verdict: ⚠️ Community link added; Dashboard and Create Project CTA still missing from primary nav.**

---

### 5.8 Community & Hackathon Flow

**Community:**

- Page exists and works, but is only reachable via the Footer — a link below the fold on every page.
- "New Post" button opens `CreatePostModal` regardless of auth state.
- Like and Comment actions have no authentication check.

**Hackathons:**

- `handleRegisterClick` and `handleJoinClick` open `HackathonRegistrationModal` for unauthenticated users — no `user` check.
- The entire leaderboard section is commented out, leaving an abrupt page ending.
- "Host Hackathon" button is commented out — dead comment in JSX.
- No call-to-action at the bottom of the page for logged-out users.

**Verdict: ❌ Both pages lack auth guards for primary actions.**

---

### 5.9 Styling & Visual Consistency


| Issue                          | Detail                                                            | Fix                                               |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------- |
| 3 different primary blues      | `#2563eb`, `#4f46e5`, `#6366f1` used interchangeably              | Define `--color-primary: #4f46e5` in `:root`      |
| 3 different border radii       | 8px, 12px, 16px with no system                                    | Define `--radius-sm/md/lg` design tokens          |
| Empty state invisible          | `color: white` on white background in Projects.css                | Change to `#1f2937` / `#6b7280`                   |
| CollaborationSpace fixed width | `width: 900px; min-width: 900px` breaks tablets                   | Change to `width: min(900px, calc(100vw - 2rem))` |
| Dashboard app cards            | `grid-template-columns: 220px 1fr 200px` breaks on medium screens | Add tablet breakpoint at 1024px                   |
| No loading skeletons           | Only Projects page has a spinner                                  | Create reusable `LoadingSkeleton.jsx`             |
| Toast always transparent       | Base `.toast-notification` has no `background-color`              | Apply `toast.type` as CSS class                   |
| Mobile nav contradictions      | `.collaboration-btn.mobile` styled twice with conflicting rules   | Remove duplicate/override rules                   |


---

### 5.10 Accessibility & Data Integrity

**Accessibility:**

- All modals (`AuthModal`, `ProjectModal`, `CreateProjectModal`, `CollaborationSpace`, `OnboardingModal`) have no focus trap — keyboard users can Tab past them into background content.
- No `role="dialog"` or `aria-modal="true"` on any modal overlay div.
- No `<label>` elements on `CreateProjectModal` form inputs — WCAG 2.1 SC 1.3.1 failure.
- Icon-only buttons (bookmark, share, edit, delete, close) have no `aria-label`.

**Data Integrity:**

- `NotificationContext.jsx` stores `icon: <Users size={16} />` (JSX elements) in state — not serializable, cannot be persisted or sent to a backend.
- `ProjectContext.jsx` initializes with 6 hardcoded sample projects mixed with real user data — causes incorrect permission logic and notification behavior in production.
- All collaboration data (chat, tasks, files) lives in `localStorage` only — cleared on browser wipe and never shared between team members.
- `frontend/pages/` folder contains `Community - Copy.jsx`, `Community - Copy.css`, `Home - Copy.jsx`, `Home - Copy.css` — leftover files that pollute the codebase and can break build tools (spaces in filenames).

---

## 6. Human Fix Prompts

> Copy each prompt below exactly as written and give it to an AI coding assistant or developer.  
> Execute them in priority order (see Section 7). Each prompt is self-contained.

---

### ✅ PROMPT-01 — Add Route Protection (COMPLETED)

**Files:** `frontend/App.jsx`, `frontend/components/ProtectedRoute.jsx` (new)

```
Create a new file at frontend/components/ProtectedRoute.jsx.

It should be a React component that:
1. Calls useAuth() from AuthContext to get the current user.
2. If user is null/undefined, immediately redirect to "/" using useNavigate().
3. If user exists, render the children (or <Outlet /> if using React Router v6 nested routes).

Code:
  import { Navigate } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';
  export default function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/" replace />;
    return children;
  }

Then in frontend/App.jsx, wrap the /dashboard and /profile routes:
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

Remove the manual `if (!user)` return check from Profile.jsx (line that renders plain text).
Remove any similar manual checks from Dashboard.jsx.
```

---

###  PROMPT-02 — Add "My Projects" Tab to Dashboard as Default Tab

**Files:** `frontend/pages/Dashboard.jsx`, `frontend/pages/Dashboard.css`

```
In frontend/pages/Dashboard.jsx, add a "My Projects" tab as the first and default tab.

Step 1 — Change the default active tab:
  const [activeTab, setActiveTab] = useState('myprojects');

Step 2 — Add a sub-tab state for My Projects:
  const [myProjectsSubTab, setMyProjectsSubTab] = useState('owned');

Step 3 — At the top of the component, import getUserProjects from ProjectContext and derive user projects:
  const userProjects = user ? getUserProjects(user.id) : { owned: [], participating: [] };

Step 4 — Add "My Projects" as the first tab button in the .dashboard-tabs div:
  <button
    className={`tab-btn ${activeTab === 'myprojects' ? 'active' : ''}`}
    onClick={() => setActiveTab('myprojects')}
  >
    My Projects
  </button>

Step 5 — Add the tab content block before the existing bookmarks block:
  {activeTab === 'myprojects' && (
    <div className="myprojects-content">
      <div className="myprojects-subtabs">
        <button
          className={`subtab-btn ${myProjectsSubTab === 'owned' ? 'active' : ''}`}
          onClick={() => setMyProjectsSubTab('owned')}
        >
          Projects I Own ({userProjects.owned.length})
        </button>
        <button
          className={`subtab-btn ${myProjectsSubTab === 'participating' ? 'active' : ''}`}
          onClick={() => setMyProjectsSubTab('participating')}
        >
          Projects I'm In ({userProjects.participating.length})
        </button>
      </div>

      {myProjectsSubTab === 'owned' && (
        <div className="projects-grid">
          {userProjects.owned.length === 0 ? (
            <div className="empty-state">
              <p>You haven't created any projects yet.</p>
              <button onClick={() => setShowCreateProject(true)}>+ Create Your First Project</button>
            </div>
          ) : (
            userProjects.owned.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                isOwned={true}
                onEdit={() => handleEditProject(project)}
                onDelete={() => handleDeleteProject(project.id)}
                onClick={() => { setActiveCollabProject(project); setShowCollaborationSpace(true); }}
              />
            ))
          )}
        </div>
      )}

      {myProjectsSubTab === 'participating' && (
        <div className="projects-grid">
          {userProjects.participating.length === 0 ? (
            <div className="empty-state">
              <p>You haven't joined any projects yet.</p>
              <a href="/projects">Browse Projects to Apply →</a>
            </div>
          ) : (
            userProjects.participating.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                isParticipating={true}
                onLeave={() => handleLeaveProject(project.id)}
                onClick={() => { setActiveCollabProject(project); setShowCollaborationSpace(true); }}
              />
            ))
          )}
        </div>
      )}
    </div>
  )}

Step 6 — Add showCreateProject state and import CreateProjectModal if not already done:
  const [showCreateProject, setShowCreateProject] = useState(false);
  // render: {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}

Step 7 — In Dashboard.css, add styles:
  .myprojects-subtabs { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
  .subtab-btn { padding: 0.5rem 1.25rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 0.875rem; }
  .subtab-btn.active { border-color: #4f46e5; color: #4f46e5; background: #eef2ff; }
  keep same colour button for Remove Pocition , Member , Skills  button modern saas product
```

---

### 🔴 PROMPT-03 — Render "+ New Project" Button in Navbar

**Files:** `frontend/components/Navbar.jsx`, `frontend/components/Navbar.css`

```
In frontend/components/Navbar.jsx, the onCreateProject prop is received and the Plus icon is imported,
but no button is rendered in the JSX. Fix this:

In the .desktop-actions div, add the button BEFORE the notification bell:
  {user && (
    <button className="create-project-btn" onClick={onCreateProject}>
      <Plus size={16} />
      New Project
    </button>
  )}

In the mobile authenticated section, also add:
  {user && (
    <button
      className="mobile-create-btn"
      onClick={() => { onCreateProject(); setShowMobileMenu(false); }}
    >
      <Plus size={20} />
      New Project
    </button>
  )}

In Navbar.css, add styles for the desktop button:
  .create-project-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .create-project-btn:hover { opacity: 0.9; }
```

---

### ✅ PROMPT-04 — Add Community Link (COMPLETED)

**Files:** `frontend/components/Navbar.jsx`

```
In frontend/components/Navbar.jsx:

1. In the desktop nav <ul className="nav-menu desktop-menu">, add after Hackathons:
  <li className="nav-item">
    <Link
      to="/community"
      className={`nav-link ${location.pathname === '/community' ? 'active' : ''}`}
    >
      Community
    </Link>
  </li>

2. In the mobile nav <ul className="mobile-nav-menu">, also add:
  <li>
    <Link
      to="/community"
      className={location.pathname === '/community' ? 'active' : ''}
      onClick={() => setShowMobileMenu(false)}
    >
      Community
    </Link>
  </li>

Community should remain in the Footer as well — just add it to the Navbar too for proper discoverability.
```

---

### ✅ PROMPT-05 — Fix Application Submit (COMPLETED)

**Files:** `frontend/components/ProjectModal.jsx`

```
In frontend/components/ProjectModal.jsx, inside handleApplicationSubmit:

Current (WRONG): After 2-second toast delay, calls onClose() — closes entire modal.

Fix:
1. After the toast delay, call setShowApplicationForm(false) instead of onClose().
   Do NOT call onClose() here.
2. Show a persistent inline success message inside the positions tab:
  <div className="application-success-banner">
    ✅ Your application was submitted! You'll receive a notification when the owner responds.
    <a href="/dashboard">View My Applications →</a>
  </div>
3. Only call onClose() when the user explicitly clicks the X button or the overlay backdrop.
4. Update the state to track application sent: const [applicationSent, setApplicationSent] = useState(false).
   Show the success banner when applicationSent === true.
```

---

###  PROMPT-06 — Fix Accept Application — Remove Auto-Open of CollaborationSpace

**Files:** `frontend/pages/Dashboard.jsx`

```
In frontend/pages/Dashboard.jsx, find the handleAcceptApplication function and the useEffect
that watches pendingCollabProjectId.

Current (WRONG): 
  useEffect that auto-opens CollaborationSpace after accept.

Fix:
1. Remove the pendingCollabProjectId state variable entirely.
2. Remove the useEffect that auto-opens CollaborationSpace.
3. After a successful accept in handleAcceptApplication, show this toast:
  setToast({
    show: true,
    message: `Application accepted! Open Collaboration Space?`,
    type: 'success',
    actionLabel: 'Open Workspace',
    actionFn: () => { setActiveCollabProject(acceptedProject); setShowCollaborationSpace(true); }
  });
4. Update the toast render in JSX to show an action button if actionFn is provided:
  {toast.show && (
    <div className={`toast-notification ${toast.type}`}>
      <span>{toast.message}</span>
      {toast.actionFn && (
        <button className="toast-action-btn" onClick={toast.actionFn}>{toast.actionLabel}</button>
      )}
    </div>
  )}
5. The user now chooses when to open their workspace — no forced navigation.
```

---

### ✅ PROMPT-07 — Bookmarks Click Fix (COMPLETED)

**Files:** `frontend/pages/Dashboard.jsx`

```
In frontend/pages/Dashboard.jsx, find the "bookmarks" tab content where ProjectCard onClick
currently opens CollaborationSpace.

Change:
  onClick={(project) => {
    setActiveCollabProject(project);
    setShowCollaborationSpace(true);
  }}

To:
  onClick={(project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  }}

Add state variables if not present:
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

Import ProjectModal: import ProjectModal from '../components/ProjectModal';

Add modal render at the bottom of the component (before the closing return tag):
  {showProjectModal && selectedProject && (
    <ProjectModal
      project={selectedProject}
      onClose={() => { setShowProjectModal(false); setSelectedProject(null); }}
    />
  )}

Bookmarked projects are projects the user is watching/interested in — they should view
details and apply, not open a collaboration workspace they're not a member of.
```

---

### 🟠 PROMPT-08 — Make Profile Projects Tab Read-Only (Remove All Management Buttons)

**Files:** `frontend/pages/Profile.jsx`

```
In frontend/pages/Profile.jsx, inside the renderProjects() function:

1. For "Projects You Own" section, remove these props from ProjectCard:
   - isOwned={true}
   - onEdit={handleEditProject}
   - onDelete={handleDeleteProject}
   Replace with a single "Open Collaboration" button:
   <button onClick={() => handleOpenCollaboration(project)} className="collab-btn">
     Open Workspace
   </button>

2. For "Projects You're Participating In" section, remove:
   - isParticipating={true}
   - onLeave={handleLeaveProject}
   Replace with:
   <button onClick={() => handleOpenCollaboration(project)} className="collab-btn">
     Open Workspace
   </button>

3. Add the handleOpenCollaboration function:
   const handleOpenCollaboration = (project) => {
     // Store project in sessionStorage so Dashboard can auto-open it
     sessionStorage.setItem('pendingCollabProject', JSON.stringify(project));
     navigate('/dashboard');
   };

4. Add a note below the section title:
   <p className="management-note">
     To edit, delete, or manage projects, go to your <a href="/dashboard">Dashboard</a>.
   </p>

5. Remove the now-unused functions: handleEditProject, handleDeleteProject, handleLeaveProject,
   handleStageChange, editingProjectStage state, setEditingProjectStage.
   These management actions belong in Dashboard only.
```

---

### 🟠 PROMPT-09 — Fix CollaborationSpace Member Filter to Use ID Matching

**Files:** `frontend/components/CollaborationSpace.jsx`

```
In frontend/components/CollaborationSpace.jsx, find the userProjects filter:

Current (FRAGILE):
  const userProjects = projects.filter(project =>
    project.teamMembers.some(member => member.name === user?.name)
  );

Change to ID-based matching:
  const userProjects = projects.filter(project =>
    project.teamMembers.some(member => {
      const memberId = member.userId || member.id || member._id;
      const userId = user?.id || user?._id;
      return memberId && userId && String(memberId) === String(userId);
    })
  );

Also update the isOwner check (if present) to use ID:
  const isOwner = activeProject?.ownerId === (user?.id || user?._id);

Add an empty state when userProjects is empty:
  if (userProjects.length === 0) {
    return (
      <div className="collab-empty-state">
        <h3>You're not a member of any projects yet.</h3>
        <a href="/projects">Browse Projects</a>
      </div>
    );
  }
```

---

### ✅ PROMPT-10 — Remove Owner Controls (COMPLETED)

**Files:** `frontend/pages/Projects.jsx`

```
In frontend/pages/Projects.jsx:

1. Remove the showOwnedProjects state and the "Your Projects" collapsible section entirely.
   This section belongs in Dashboard → My Projects tab.

2. When rendering <ProjectCard> in the main discovery grid, do NOT pass these props:
   - isOwned
   - onEdit
   - onDelete
   - isParticipating
   - onLeave
   Only pass: project={project} and onClick={() => handleProjectClick(project)}

3. Remove the handleDeleteProject and handleEditProject functions from Projects.jsx.

4. Remove the Edit and Trash2 imports from lucide-react in Projects.jsx if no longer used.

5. The Projects page should be a clean public discovery interface — all project management
   lives in the Dashboard only.
```

---

### 🟠 PROMPT-11 — Add Dashboard Link to Primary Navbar for Logged-In Users

**Files:** `frontend/components/Navbar.jsx`

```
In frontend/components/Navbar.jsx:

In the desktop nav <ul className="nav-menu desktop-menu">, add after Hackathons (and after Community):
  {user && (
    <li className="nav-item">
      <Link
        to="/dashboard"
        className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
      >
        Dashboard
      </Link>
    </li>
  )}

In the mobile nav, also add:
  {user && (
    <li>
      <Link
        to="/dashboard"
        className={location.pathname === '/dashboard' ? 'active' : ''}
        onClick={() => setShowMobileMenu(false)}
      >
        Dashboard
      </Link>
    </li>
  )}

It can also remain in the dropdown — redundancy is fine for discoverability.
```

---

### 🟠 PROMPT-12 — Implement "Forgot Password" Flow in AuthModal

**Files:** `frontend/components/AuthModal.jsx`

```
In frontend/components/AuthModal.jsx:

1. Add a new state: const [isResetMode, setIsResetMode] = useState(false);
2. Add a reset email state: const [resetEmail, setResetEmail] = useState('');
3. Add a reset success state: const [resetSent, setResetSent] = useState(false);

4. Replace the dead <a href="#"> forgot password link with:
   <button type="button" className="forgot-password-btn" onClick={() => setIsResetMode(true)}>
     Forgot password?
   </button>

5. When isResetMode is true, render a new view instead of the login form:
   <div className="reset-view">
     <h2>Reset Your Password</h2>
     {!resetSent ? (
       <>
         <p>Enter your email and we'll send you a reset link.</p>
         <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Your email" />
         <button onClick={handleSendReset}>Send Reset Link</button>
         <button onClick={() => setIsResetMode(false)}>← Back to Sign In</button>
       </>
     ) : (
       <p>✅ Check your inbox for a reset link. It may take a few minutes.</p>
     )}
   </div>

6. Add handleSendReset:
   const handleSendReset = async () => {
     try {
       await fetch('/api/users/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail }) });
       setResetSent(true);
     } catch (err) {
       // TODO: backend endpoint POST /api/users/forgot-password not yet implemented
       setResetSent(true); // show success anyway until backend is ready
     }
   };
```

---

### 🟠 PROMPT-13 — Add Message Button + Quick Stats to Dashboard Header

**Files:** `frontend/pages/Dashboard.jsx`, `frontend/pages/Dashboard.css`

```
In frontend/pages/Dashboard.jsx:

1. In the .dashboard-header div, add a "Messages" button on the right side:
   <button className="message-header-btn" onClick={() => setShowCollaborationSpace(true)}>
     <MessageSquare size={18} />
     Messages
   </button>
   Import MessageSquare from 'lucide-react'.

2. After the header, add a quick stats row BEFORE the tab buttons:
   const owned = userProjects.owned.length;
   const participating = userProjects.participating.length;
   const received = getReceivedApplications(user.id)?.length || 0;
   const sent = getSentApplications(user.id)?.length || 0;

   <div className="dashboard-stats-row">
     <div className="stat-card"><span className="stat-number">{owned}</span><span className="stat-label">Projects Owned</span></div>
     <div className="stat-card"><span className="stat-number">{participating}</span><span className="stat-label">Projects Joined</span></div>
     <div className="stat-card"><span className="stat-number">{received}</span><span className="stat-label">Applications Received</span></div>
     <div className="stat-card"><span className="stat-number">{sent}</span><span className="stat-label">Applications Sent</span></div>
   </div>

3. In Dashboard.css:
   .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
   .message-header-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: white; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; font-weight: 600; }
   .message-header-btn:hover { border-color: #4f46e5; color: #4f46e5; }
   .dashboard-stats-row { display: flex; gap: 1rem; margin: 1.5rem 0; flex-wrap: wrap; }
   .stat-card { flex: 1; min-width: 140px; padding: 1.25rem; background: white; border-radius: 12px; border: 1px solid #f0f0f0; text-align: center; }
   .stat-number { display: block; font-size: 2rem; font-weight: 800; color: #1f2937; }
   .stat-label { font-size: 0.75rem; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
```

---

### 🟡 PROMPT-14 — Fix Toast Notification Visibility

**Files:** `frontend/pages/Dashboard.jsx`, `frontend/pages/Dashboard.css`

```
In frontend/pages/Dashboard.jsx:

1. Update the toast state to include a type field:
   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

2. When showing toasts, always pass a type:
   setToast({ show: true, message: 'Application accepted!', type: 'success' });
   setToast({ show: true, message: 'Application rejected.', type: 'error' });

3. In the JSX, apply the type as a CSS class:
   <div className={`toast-notification ${toast.type}`}>
     {toast.message}
   </div>

In Dashboard.css, add a base fallback background:
   .toast-notification {
     position: fixed;
     bottom: 2rem;
     right: 2rem;
     padding: 1rem 1.5rem;
     border-radius: 10px;
     font-weight: 600;
     color: white;
     background-color: #1f2937; /* fallback */
     z-index: 9999;
   }
   .toast-notification.success { background-color: #16a34a; }
   .toast-notification.error { background-color: #dc2626; }
   .toast-notification.info { background-color: #2563eb; }
```

---

### 🟡 PROMPT-15 — Fix Hero Section — Add Missing Visual Column

**Files:** `frontend/pages/Home.jsx`, `frontend/pages/Home.css`

```
In frontend/pages/Home.jsx, the hero section only renders .hero-content with no visual element.
The CSS already defines .hero-visual, .floating-cards, and .floating-card. Add the JSX:

After the closing tag of .hero-content, add:
  <div className="hero-visual">
    <div className="floating-cards">
      <div className="floating-card card-1">
        <span className="card-icon">🚀</span>
        <span className="card-text">Launch Projects</span>
      </div>
      <div className="floating-card card-2">
        <span className="card-icon">🤝</span>
        <span className="card-text">Find Teammates</span>
      </div>
      <div className="floating-card card-3">
        <span className="card-icon">🏆</span>
        <span className="card-text">Win Hackathons</span>
      </div>
    </div>
  </div>

In Home.css, change .hero-section from justify-content: center to a two-column grid:
  .hero-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
  }
  @media (max-width: 768px) {
    .hero-section { grid-template-columns: 1fr; }
    .hero-visual { display: none; }
  }
```

---

### 🟡 PROMPT-16 — Clean Up Dead Code in Profile.jsx

**Files:** `frontend/pages/Profile.jsx`

```
In frontend/pages/Profile.jsx, remove the following dead code:

1. Find and DELETE the entire defaultExperienceData constant array (the one with
   "Senior Full Stack Developer" at "TechCorp Solutions" and "Full Stack Developer" at "StartupXYZ").
   This fake/demo data should never appear for real users.

2. In the experience section, replace any fallback to defaultExperienceData with an empty state:
   If formData.experience is empty or undefined, show:
     <div className="empty-state">
       <p>No experience added yet.</p>
       {isOwnProfile && <button onClick={() => setIsEditing(true)}>+ Add Experience</button>}
     </div>

3. Find and DELETE the renderAchievements() function entirely (it is already commented out in tabs).

4. Remove the commented-out "Achievements" tab button from both:
   - The mobile nav grid section
   - The desktop tab navigation section

5. Remove the Award import from lucide-react if it is only used in the now-deleted renderAchievements code.

6. Fix the "Connections Helped" stat — rename it to "Projects Joined":
   { label: "Projects Joined", value: userProjects.participating?.length?.toString() || "0" }
```

---

### 🟡 PROMPT-17 — Fix Settings Tab — Replace Placeholder Buttons

**Files:** `frontend/pages/Profile.jsx`

```
In frontend/pages/Profile.jsx, inside renderSettings():

1. Find "Privacy Settings" → "Manage Privacy" button.
   Replace the non-functional button with a functional toggle:
   <div className="settings-group">
     <label className="settings-label">Profile Visibility</label>
     <div className="toggle-group">
       <button
         className={`toggle-btn ${formData.profileVisibility === 'public' ? 'active' : ''}`}
         onClick={() => setFormData(prev => ({ ...prev, profileVisibility: 'public' }))}
       >Public</button>
       <button
         className={`toggle-btn ${formData.profileVisibility === 'private' ? 'active' : ''}`}
         onClick={() => setFormData(prev => ({ ...prev, profileVisibility: 'private' }))}
       >Private</button>
     </div>
   </div>

2. Find "Notification Settings" → "Manage Notifications" button.
   Replace with checkbox toggles:
   <div className="settings-group">
     <label className="settings-label">Email Notifications</label>
     <label className="checkbox-label">
       <input type="checkbox" checked={formData.notifyOnApplications ?? true}
         onChange={e => setFormData(prev => ({ ...prev, notifyOnApplications: e.target.checked }))} />
       New applications received
     </label>
     <label className="checkbox-label">
       <input type="checkbox" checked={formData.notifyOnAcceptance ?? true}
         onChange={e => setFormData(prev => ({ ...prev, notifyOnAcceptance: e.target.checked }))} />
       Application acceptance updates
     </label>
   </div>

3. Make sure these preferences are saved when the user clicks "Save Profile".
4. Add profileVisibility and notifyOnApplications, notifyOnAcceptance to the formData initial state.
```

---

### 🟡 PROMPT-18 — Add Auth Guards to Community and Hackathons Pages

**Files:** `frontend/pages/Community.jsx`, `frontend/pages/Hackathons.jsx`

```
In frontend/pages/Community.jsx:

1. Find the "New Post" button click handler. Add an auth check:
   const handleNewPost = () => {
     if (!user) { onAuthClick(); return; }
     setShowCreatePost(true);
   };
   Replace the current onClick with onClick={handleNewPost}.

2. Find the Like button handler. Add the same check:
   const handleLike = (postId) => {
     if (!user) { onAuthClick(); return; }
     // existing like logic
   };

3. Find the Comment button handler. Add the same check:
   const handleComment = (postId) => {
     if (!user) { onAuthClick(); return; }
     // existing comment logic
   };

4. Pass onAuthClick as a prop from App.jsx to Community.jsx.

---

In frontend/pages/Hackathons.jsx:

1. In handleRegisterClick and handleJoinClick, add:
   if (!user) {
     sessionStorage.setItem('pendingHackathon', JSON.stringify(hackathon));
     onAuthClick();
     return;
   }

2. After login, check sessionStorage for pendingHackathon and auto-open the registration modal.

3. Pass onAuthClick as a prop from App.jsx to Hackathons.jsx.
```

---

### 🟡 PROMPT-19 — Restore Skip Button in OnboardingModal

**Files:** `frontend/components/OnboardingModal.jsx`

```
In frontend/components/OnboardingModal.jsx:

1. Find the commented-out "Skip for now" button at the bottom of the modal and uncomment it.

2. Style it as a subtle text link — not a primary button:
   <button
     type="button"
     className="skip-btn"
     onClick={onClose}
     style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem', marginTop: '0.5rem' }}
   >
     Skip for now
   </button>

3. Make Step 3 (bio) optional — update canProceed() for case 3 to return true always:
   case 3: return true; // bio is optional

4. Update Step 3 bio input placeholder to say: "Tell people about yourself (optional — you can add this later)"

5. Uncomment and restore the logo section at the top if it was commented out, for brand consistency with AuthModal.
```

---

### 🟡 PROMPT-20 — Fix Non-Serializable Icons in NotificationContext

**Files:** `frontend/context/NotificationContext.jsx`, `frontend/components/NotificationModal.jsx`

```
In frontend/context/NotificationContext.jsx:

Find all notification objects that store JSX elements in the icon field, e.g.:
  icon: <Users size={16} />

Replace all JSX icon values with string type identifiers:
  iconType: 'users'
  iconType: 'check'
  iconType: 'x'
  iconType: 'bell'
  iconType: 'star'

Remove all JSX icon imports from NotificationContext.jsx (they belong in the view layer only).

---

In frontend/components/NotificationModal.jsx (or wherever notifications are rendered):

Add an icon map at the top:
  import { Users, CheckCircle, XCircle, Bell, Star } from 'lucide-react';
  const iconMap = {
    users: <Users size={16} />,
    check: <CheckCircle size={16} />,
    x: <XCircle size={16} />,
    bell: <Bell size={16} />,
    star: <Star size={16} />,
  };

Then render: const icon = iconMap[notification.iconType] || iconMap['bell'];

This makes all notifications serializable — safe to save to localStorage or send to a backend API.
```

---

### 🟡 PROMPT-21 — Add Upcoming Events Sidebar to Dashboard

**Files:** `frontend/pages/Dashboard.jsx`, `frontend/pages/Dashboard.css`

```
In frontend/pages/Dashboard.jsx:

1. Wrap the main dashboard content in a two-column layout:
   <div className="dashboard-layout">
     <div className="dashboard-main">
       {/* existing tabs */}
     </div>
     <aside className="dashboard-sidebar">
       <UpcomingEventsSidebar />
     </aside>
   </div>

2. Create an inline UpcomingEventsSidebar or extract to a separate component:
   function UpcomingEventsSidebar() {
     const { hackathons } = useProjects();
     const upcoming = hackathons
       .filter(h => new Date(h.date) >= new Date())
       .sort((a, b) => new Date(a.date) - new Date(b.date))
       .slice(0, 4);
     return (
       <div className="upcoming-events-sidebar">
         <h3>Upcoming Events</h3>
         {upcoming.length === 0 ? (
           <p className="no-events">No upcoming events. <a href="/hackathons">Browse Hackathons →</a></p>
         ) : (
           upcoming.map(event => (
             <div key={event.id} className="event-item">
               <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
               <p className="event-title">{event.title}</p>
               <span className="event-type-badge">{event.type || 'Hackathon'}</span>
             </div>
           ))
         )}
         <a href="/hackathons" className="view-all-link">View All Hackathons →</a>
       </div>
     );
   }

3. In Dashboard.css:
   .dashboard-layout { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; align-items: start; }
   @media (max-width: 1024px) { .dashboard-layout { grid-template-columns: 1fr; } }
   .upcoming-events-sidebar { background: white; border-radius: 16px; padding: 1.5rem; border: 1px solid #f0f0f0; }
   .upcoming-events-sidebar h3 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; }
   .event-item { padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }
   .event-date { font-size: 0.75rem; color: #9ca3af; }
   .event-title { font-size: 0.875rem; font-weight: 600; margin: 0.25rem 0; }
   .event-type-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; background: #eef2ff; color: #4f46e5; border-radius: 99px; }
```

---

### 🔵 PROMPT-22 — Delete Duplicate Copy Files from Pages Folder

**Files:** `frontend/pages/` folder

```
Delete the following files from frontend/pages/:
  - "Community - Copy.jsx"
  - "Community - Copy.css"
  - "Home - Copy.jsx"
  - "Home - Copy.css"

Before deleting, verify none of these are imported anywhere by running a search:
  grep -r "Community - Copy" ./frontend
  grep -r "Home - Copy" ./frontend

If no imports are found, delete all four files. They are leftover backup copies with spaces
in their filenames that can cause issues in some build tools and CI/CD environments.
```

---

### 🔵 PROMPT-23 — Implement Share Button in ProjectCard

**Files:** `frontend/components/ProjectCard.jsx`

```
In frontend/components/ProjectCard.jsx, replace the handleShare function:

Current (does nothing):
  const handleShare = () => console.log('Shared:', project.title);

Replace with:
  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/projects?id=${project.id || project._id}`;
    const shareData = {
      title: project.title,
      text: project.description?.slice(0, 100),
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // Show brief confirmation — you can use a local state tooltip:
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {
      // User cancelled or clipboard not available
    }
  };

Add state: const [shareCopied, setShareCopied] = useState(false);

Update the share button render to show feedback:
  <button onClick={handleShare} className="action-btn share-btn" aria-label="Share project">
    {shareCopied ? '✓ Copied!' : <Share2 size={16} />}
  </button>
```

---

### 🔵 PROMPT-24 — Add Keyboard Focus Trap and ARIA to All Modals

**Files:** All modal components (`AuthModal.jsx`, `ProjectModal.jsx`, `CreateProjectModal.jsx`, `CollaborationSpace.jsx`, `OnboardingModal.jsx`)

```
For each modal component, add the following:

1. Escape key handler — add this useEffect:
   useEffect(() => {
     const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
     document.addEventListener('keydown', handleKeyDown);
     return () => document.removeEventListener('keydown', handleKeyDown);
   }, [onClose]);

2. ARIA attributes on the modal container:
   <div
     className="[modal-class-name]"
     role="dialog"
     aria-modal="true"
     aria-labelledby="modal-title"
   >
     <h2 id="modal-title">[Modal Title]</h2>

3. aria-label on all icon-only buttons:
   <button aria-label="Close modal" onClick={onClose}>✕</button>
   <button aria-label="Bookmark project" onClick={handleBookmark}><Bookmark /></button>
   <button aria-label="Share project" onClick={handleShare}><Share2 /></button>

4. For CreateProjectModal.jsx specifically — add visible <label> elements to all form inputs:
   <div className="form-group">
     <label htmlFor="project-title">Project Title *</label>
     <input id="project-title" type="text" ... />
   </div>
   Labels should have: font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem;
```

---

### 🔵 PROMPT-25 — Standardize Design Tokens (Colors + Border Radii)

**Files:** `frontend/styles/App.css` (or root CSS file), all CSS files

```
In your root CSS file (App.css or index.css), add CSS custom properties in :root:

  :root {
    /* Brand Colors */
    --color-primary: #4f46e5;
    --color-primary-hover: #4338ca;
    --color-primary-light: #eef2ff;
    --color-primary-text: #4f46e5;
    --color-danger: #dc2626;
    --color-success: #16a34a;
    --color-warning: #d97706;

    /* Border Radius Scale */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-full: 9999px;

    /* Spacing Scale (optional) */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
  }

Then do a project-wide find-and-replace:
  - Replace all #2563eb, #4f46e5, #6366f1 with var(--color-primary)
  - Replace border-radius: 16px on primary cards with var(--radius-lg)
  - Replace border-radius: 12px on secondary cards with var(--radius-md)
  - Replace border-radius: 8px on inputs/small elements with var(--radius-sm)

Also in CollaborationSpace.css, fix the fixed modal width:
  .collaboration-modal {
    width: min(900px, calc(100vw - 2rem));
    min-width: unset;
    max-width: 900px;
  }
  @media (max-width: 1024px) {
    .collaboration-modal { width: calc(100vw - 2rem); }
  }
```

---

### 🔵 PROMPT-26 — Create Reusable LoadingSkeleton Component

**Files:** `frontend/components/LoadingSkeleton.jsx` (new), `Dashboard.jsx`, `Profile.jsx`, `Community.jsx`, `Hackathons.jsx`

```
Create frontend/components/LoadingSkeleton.jsx:

  import './LoadingSkeleton.css';
  export default function LoadingSkeleton({ type = 'card', count = 3 }) {
    return (
      <div className={`skeleton-container skeleton-${type}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-item">
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-line wide" />
              <div className="skeleton skeleton-line medium" />
              <div className="skeleton skeleton-line narrow" />
            </div>
          </div>
        ))}
      </div>
    );
  }

Create frontend/components/LoadingSkeleton.css:
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  .skeleton-item { display: flex; gap: 1rem; padding: 1rem; }
  .skeleton-avatar { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; }
  .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
  .skeleton-line { height: 14px; }
  .skeleton-line.wide { width: 80%; }
  .skeleton-line.medium { width: 60%; }
  .skeleton-line.narrow { width: 40%; }

Use it in Dashboard.jsx, Profile.jsx, Community.jsx, and Hackathons.jsx:
  if (loading) return <LoadingSkeleton type="card" count={4} />;
```

---

## 7. Priority Execution Order

> Execute fixes in this exact order to avoid compounding issues. Each fix builds on the previous.


| Order | Prompt    | ID        | Severity | Why This Order                                                        |
| ----- | --------- | --------- | -------- | --------------------------------------------------------------------- |
| 1     | PROMPT-01 | FIX-04    | 🔴       | Route protection must come first — security baseline                  |
| 2     | PROMPT-02 | FIX-01    | 🔴       | My Projects is the core missing feature — everything references it    |
| 3     | PROMPT-03 | FIX-02    | 🔴       | Create Project button — users need a way to add projects to Dashboard |
| 4     | PROMPT-04 | FIX-03    | 🔴       | Community discoverability — basic navigation must be complete         |
| 5     | PROMPT-05 | FIX-11    | 🟠       | Fix apply-to-project modal close — blocks user application flow       |
| 6     | PROMPT-06 | FIX-07    | 🟠       | Fix auto-open CollaborationSpace — jarring UX on accept               |
| 7     | PROMPT-07 | FIX-06    | 🟠       | Fix bookmark click — currently opens wrong feature                    |
| 8     | PROMPT-08 | FIX-08    | 🟠       | Make Profile read-only — cleans up management IA                      |
| 9     | PROMPT-09 | FIX-09    | 🟠       | Fix ColabSpace ID filter — member access is fragile                   |
| 10    | PROMPT-10 | FIX-10    | 🟠       | Remove management from Projects page — public page cleanup            |
| 11    | PROMPT-11 | FIX-13    | 🟠       | Add Dashboard to primary nav — discoverability                        |
| 12    | PROMPT-12 | FIX-12    | 🟠       | Implement Forgot Password — broken auth flow                          |
| 13    | PROMPT-13 | FIX-05    | 🟠       | Dashboard header stats + Message button — spec compliance             |
| 14    | PROMPT-14 | FIX-16    | 🟡       | Fix toast visibility — quick win, invisible feedback fixed            |
| 15    | PROMPT-15 | FIX-17    | 🟡       | Fix hero section — empty visual column                                |
| 16    | PROMPT-16 | FIX-14    | 🟡       | Remove dead code in Profile — fake data cleanup                       |
| 17    | PROMPT-17 | FIX-15    | 🟡       | Fix Settings tab — non-functional buttons                             |
| 18    | PROMPT-18 | FIX-18/19 | 🟡       | Auth guards on Community + Hackathons                                 |
| 19    | PROMPT-19 | FIX-20    | 🟡       | Restore Onboarding skip button                                        |
| 20    | PROMPT-20 | FIX-21    | 🟡       | Fix notification icon serialization                                   |
| 21    | PROMPT-21 | FIX-22    | 🟡       | Add Upcoming Events sidebar                                           |
| 22    | PROMPT-22 | FIX-23    | 🔵       | Delete duplicate copy files — quick cleanup                           |
| 23    | PROMPT-23 | FIX-24    | 🔵       | Implement Share button                                                |
| 24    | PROMPT-24 | FIX-25    | 🔵       | Accessibility — focus trap + ARIA                                     |
| 25    | PROMPT-25 | FIX-26    | 🔵       | Design tokens — color + radius system                                 |
| 26    | PROMPT-26 | FIX-27    | 🔵       | Loading skeletons                                                     |


---

## 📊 Summary by Numbers


| Severity                                | Count  | % of Total |
| --------------------------------------- | ------ | ---------- |
| 🔴 Critical — Breaks core functionality | 4      | 15%        |
| 🟠 High — Breaks expected UX            | 8      | 30%        |
| 🟡 Medium — Confusing or incomplete UX  | 9      | 33%        |
| 🔵 Low — Polish and code quality        | 6      | 22%        |
| **Total**                               | **27** | **100%**   |


**Estimated total effort:**

- 🔴 Critical (4 fixes): ~2–3 days
- 🟠 High (8 fixes): ~4–6 days
- 🟡 Medium (9 fixes): ~3–4 days
- 🔵 Low (6 fixes): ~2–3 days
- **Total: ~11–16 developer days**

---

*Document generated from consolidated audit of: `SYSTEM_ISSUES_AND_FIXES.md`, `UX_AUDIT_REPORT.md`, `UX_FIX_PROMPTS.md`, `UX_SYSTEM_FLOW_AUDIT.md`*  
*Teamera.net — Master Flow & Fix Guide*

```

Now let me save this file:
```

