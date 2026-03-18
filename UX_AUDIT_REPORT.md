# UI/UX Audit Report - Teamera.net
# UI/UX Audit Report — Teamera.net
> Perspective: Senior UX Designer | Date: March 2026

---

## OVERVIEW

This document identifies every broken flow, inconsistent page, problematic component, and styling issue found across the Teamera frontend. Each issue includes a structured human prompt you can give directly to a developer or AI agent to fix it.

---

## SECTION 1 — BROKEN USER FLOWS

### FLOW-01 · Auth → Onboarding → Profile is Disconnected

**What is wrong:**
After signup, `OnboardingModal` collects role, skills, experience, location, and bio. But `Profile.jsx` fetches data fresh from the backend on mount and re-initializes `formData` — overwriting onboarding data if the backend hasn't persisted it yet. New users land on an empty-looking profile even after completing onboarding.

**Affected files:** `OnboardingModal.jsx`, `Profile.jsx`, `AuthContext.jsx`

**Fix Prompt:**
```
In Profile.jsx, the fetchUserProfile useEffect re-initializes formData from the backend on every mount.
If the backend returns an empty or partial profile (new user), the onboarding data saved to localStorage
via AuthContext is lost visually. Fix this by merging backend data with the locally stored user object:
prefer backend data where it exists, but fall back to localStorage user fields for any empty backend fields.
Also ensure that after OnboardingModal calls updateProfile(), the AuthContext user state is updated immediately
so Profile.jsx reflects the new data without requiring a page refresh.
```

---

### FLOW-02 · Applying to a Project Closes the Modal Immediately

**What is wrong:**
In `ProjectModal.jsx`, after submitting an application, a 2-second toast shows then `onClose()` is called — closing the entire project modal and sending the user back to the projects list. The user loses context of which project they were viewing with no confirmation screen or "view application" link.

**Affected files:** `ProjectModal.jsx`

**Fix Prompt:**
```
In ProjectModal.jsx, handleApplicationSubmit calls onClose() after a 2-second toast delay.
This forcefully closes the modal and removes the user from the project context. Fix this by:
1. After the toast, close only the application form overlay (setShowApplicationForm(false)) — do NOT call onClose().
2. Show a persistent success state inside the positions tab: "Your application was sent. We will notify you when the owner responds."
3. Add a "View My Applications" link that navigates to /dashboard with state { tab: 'applications', subTab: 'sent' }.
4. Only call onClose() if the user explicitly clicks the X button or clicks outside the modal.
```

---

### FLOW-03 · Accepting an Application Auto-Opens CollaborationSpace Without Warning

**What is wrong:**
In `Dashboard.jsx`, accepting an application automatically opens `CollaborationSpace` after a delay via `pendingCollabProjectId`. The user has no control — if they are reviewing other applications, the collaboration modal pops up unexpectedly and interrupts their workflow.

**Affected files:** `Dashboard.jsx`

**Fix Prompt:**
```
In Dashboard.jsx, the handleAcceptApplication function sets pendingCollabProjectId which triggers a useEffect
that automatically opens CollaborationSpace. This is a jarring, uncontrolled UX pattern. Fix this by:
1. After accepting, show a toast: "Application accepted. [Open Collaboration Space]" where the bracketed text is a clickable button.
2. Remove the automatic pendingCollabProjectId -> CollaborationSpace trigger entirely.
3. Let the user choose when to open CollaborationSpace by clicking the toast action or a "Collaborate" button on the project card.
```

---

### FLOW-04 · No Route Protection — Unauthenticated Users Can Access Dashboard and Profile

**What is wrong:**
`/dashboard` and `/profile` are accessible without authentication. `Profile.jsx` handles this with a manual `if (!user)` check that renders plain text. `Dashboard.jsx` has no guard at all — it renders with null user data and shows broken empty states.

**Affected files:** `App.jsx`, `Dashboard.jsx`, `Profile.jsx`

**Fix Prompt:**
```
Create a ProtectedRoute wrapper component in frontend/components/ProtectedRoute.jsx.
It should check useAuth().user — if null, redirect to "/" and trigger the AuthModal by calling
setShowAuthModal(true) from AuthContext. Wrap the /dashboard and /profile routes in App.jsx
with this ProtectedRoute. Remove the manual if (!user) check from Profile.jsx and Dashboard.jsx.
```

---

### FLOW-05 · CollaborationSpace Has No Visible Entry Point in Main Navigation

**What is wrong:**
`CollaborationSpace` is only accessible via: (a) a hidden `onCollaborationClick` prop not shown in the desktop nav, (b) auto-opening after accepting an application, or (c) from Dashboard. There is no discoverable way for a team member to open their workspace from the main navigation.

**Affected files:** `Navbar.jsx`, `Navbar.css`

**Fix Prompt:**
```
In Navbar.jsx, add a "Workspace" nav link in the desktop nav menu (ul.nav-menu) that is only visible
when the user is authenticated. This link should call onCollaborationClick(). On mobile, the button
already exists in mobile-actions but is styled inconsistently — ensure it matches the other mobile
action buttons in padding, font size, and icon size. Also add it to the user dropdown menu for discoverability.
```

---

### FLOW-06 · "Forgot Password" Link is a Dead Anchor

**What is wrong:**
In `AuthModal.jsx`, the "Forgot password?" link points to `href="#"` — it does nothing. There is no password reset flow implemented anywhere in the frontend or backend.

**Affected files:** `AuthModal.jsx`

**Fix Prompt:**
```
In AuthModal.jsx, replace the <a href="#"> forgot password link with a button that:
1. Switches the modal to a "forgot password" view (add a new isResetMode state boolean).
2. In reset mode, show only an email input and a "Send Reset Link" button.
3. On submit, call POST /api/users/forgot-password with the email.
4. Show a success message: "Check your email for a reset link."
5. Add a "Back to Sign In" link to return to the login view.
If the backend endpoint does not exist yet, show a placeholder message and log a TODO comment.
```

---

### FLOW-07 · Community Page Has No Auth Gate for Posting

**What is wrong:**
The "New Post" button in `Community.jsx` is visible to all users including unauthenticated ones. Clicking it opens `CreatePostModal` regardless of auth state. Like and Comment actions also have no auth check.

**Affected files:** `Community.jsx`

**Fix Prompt:**
```
In Community.jsx, wrap the "New Post" button click handler with an auth check:
if (!user) { trigger the AuthModal instead of opening CreatePostModal }.
Add a visual indicator on the button for unauthenticated users — a lock icon or tooltip saying
"Sign in to post". Apply the same guard to the Like and Comment actions on posts.
Pass an onAuthClick prop from App.jsx to Community.jsx for this purpose.
```

---

### FLOW-08 · Hackathon Registration Has No Auth Check

**What is wrong:**
In `Hackathons.jsx`, `handleRegisterClick` and `handleJoinClick` open `HackathonRegistrationModal` regardless of whether the user is logged in. An unauthenticated user can fill out the form and submit with no user context.

**Affected files:** `Hackathons.jsx`

**Fix Prompt:**
```
In Hackathons.jsx, add an auth check in handleRegisterClick and handleJoinClick:
if (!user) { show the AuthModal instead of the registration modal }.
Pass an onAuthClick prop down from App.jsx to Hackathons.jsx.
After successful login, automatically re-open the registration modal for the hackathon the user was trying
to join by storing the pending hackathon in local state before triggering auth.
```

---

## SECTION 2 — PAGE-LEVEL ISSUES

---

### PAGE-01 · Home Page — Hero Section Has No Visual Content (Empty Right Column)

**What is wrong:**
`Home.jsx` has a `.hero-section` with `display: flex; justify-content: center` but the hero content is centered alone with no visual element on the right side. The CSS defines `.hero-visual`, `.floating-cards`, and `.floating-card` classes with animations — but none of these elements are rendered in the JSX. The right half of the hero is completely empty.

**Affected files:** `Home.jsx`, `Home.css`

**Fix Prompt:**
```
In Home.jsx, the hero section renders only .hero-content with no visual element alongside it.
The CSS already defines .hero-visual, .floating-cards, and .floating-card with float animations.
Add the visual element back to the JSX inside .hero-section after .hero-content:
  <div className="hero-visual">
    <div className="floating-cards">
      <div className="floating-card card-1"><span className="card-icon">🚀</span><span className="card-text">Launch Projects</span></div>
      <div className="floating-card card-2"><span className="card-icon">🤝</span><span className="card-text">Find Teammates</span></div>
      <div className="floating-card card-3"><span className="card-icon">🏆</span><span className="card-text">Win Hackathons</span></div>
    </div>
  </div>
Also change .hero-section in Home.css from justify-content: center to a two-column grid:
  display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
On mobile (max-width: 768px), collapse to single column.
```

---

### PAGE-02 · Projects Page — "Discover Projects" Header Overlaps with Owned Projects Section

**What is wrong:**
The `Projects.jsx` page shows a gradient header with "Discover Projects" but then immediately shows an "owned projects" section (if the user owns projects) before the main discovery grid. This creates a confusing hierarchy — the page title says "Discover" but the first content is the user's own projects. The owned section also has a toggle button that collapses it, but the toggle state is not persisted, so it resets on every render.

**Affected files:** `Projects.jsx`, `Projects.css`

**Fix Prompt:**
```
In Projects.jsx, restructure the page layout:
1. Move the owned projects section to a separate tab or to the Dashboard/Profile page where it belongs.
   The Projects page should be purely for discovery.
2. If keeping owned projects on this page, add a clear visual separator and label it "Your Projects" with
   a different background color (e.g., light blue tint) to distinguish it from the discovery grid.
3. Persist the owned section toggle state in localStorage so it remembers the user's preference.
4. The empty state text in .empty-state uses color: white which is invisible against the white page background
   outside the gradient header — change it to color: #6b7280.
```

---

### PAGE-03 · Dashboard Page — Tab Navigation is Incomplete

**What is wrong:**
`Dashboard.jsx` has two tabs: "Bookmarked Projects" and "Applications". But the dashboard header shows a gradient banner with the user's name and a settings icon that does nothing (no onClick handler). The "Applications" tab has sub-tabs (Received/Sent) but the sub-tab styling is inconsistent with the main tab styling — different padding, border, and font sizes.

**Affected files:** `Dashboard.jsx`, `Dashboard.css`

**Fix Prompt:**
```
In Dashboard.jsx:
1. The settings button in the header has no onClick — either wire it to navigate('/profile?tab=settings')
   or remove it to avoid dead UI elements.
2. Standardize the sub-tab styling in .applications-tabs to match the main .dashboard-tabs:
   same padding (1rem 2rem), same font-size (1rem), same active border-bottom style.
3. Add a "Projects" tab to the dashboard that shows both owned and participating projects in one place,
   removing the need to go to the Profile page for this information.
4. The dashboard header h1 says "Dashboard" with no personalization — change it to "Welcome back, {user.name}"
   to make the page feel personal and purposeful.
```

---

### PAGE-04 · Profile Page — Achievements Tab is Commented Out with No Replacement

**What is wrong:**
In `Profile.jsx`, the "Achievements" tab button and its render function `renderAchievements()` are commented out in both the mobile nav grid and the desktop tab navigation. This leaves a visible gap in the tab count (2 tabs instead of 3) and the commented code is dead weight. The Settings tab only contains a password reset button — it's nearly empty.

**Affected files:** `Profile.jsx`, `Profile.css`

**Fix Prompt:**
```
In Profile.jsx:
1. Either implement the Achievements tab with basic content (hackathons won, projects completed, badges)
   or permanently remove all commented-out achievement code to keep the codebase clean.
2. The Settings tab currently only has a password reset button. Expand it to include:
   - Email notification preferences (toggle switches)
   - Account deletion option (with confirmation)
   - Privacy settings (profile visibility: public/private)
3. The mobile nav grid and desktop tabs are duplicated — they render the same tabs twice with different
   markup. Refactor into a single TabNav component that renders differently based on screen size using CSS.
```

---

### PAGE-05 · Hackathons Page — Leaderboard Section is Commented Out, Leaving a Visual Gap

**What is wrong:**
In `Hackathons.jsx`, the entire leaderboard section is commented out. The "Host Hackathon" button is also commented out. The page ends abruptly after the "Why Participate" benefits grid with no call-to-action or next step for the user.

**Affected files:** `Hackathons.jsx`

**Fix Prompt:**
```
In Hackathons.jsx:
1. Remove the commented-out leaderboard section entirely — dead commented code is noise.
2. Add a proper page-ending CTA section after the benefits grid:
   - If user is not logged in: "Join Teamera to participate in hackathons" with a sign-up button.
   - If user is logged in but not registered for any hackathon: "Browse upcoming hackathons above to get started."
   - If user is registered: "You are registered for X hackathon(s). Good luck!"
3. The "Host Hackathon" button is commented out — either implement it or remove the comment entirely.
   A visible commented-out button confuses developers reading the code.
```

---

### PAGE-06 · Community Page — Duplicate Files Exist (Community - Copy.jsx / Community - Copy.css)

**What is wrong:**
The `frontend/pages/` directory contains `Community - Copy.jsx` and `Community - Copy.css` alongside the real `Community.jsx` and `Community.css`. These copy files are not imported anywhere but they pollute the codebase, confuse developers, and may cause build issues with spaces in filenames.

**Affected files:** `Community - Copy.jsx`, `Community - Copy.css`, `Home - Copy.jsx`, `Home - Copy.css`

**Fix Prompt:**
```
Delete the following files from frontend/pages/:
- "Community - Copy.jsx"
- "Community - Copy.css"
- "Home - Copy.jsx"
- "Home - Copy.css"
These are leftover backup copies that serve no purpose in the codebase. Filenames with spaces can cause
issues in some build tools and CI environments. Verify none of them are imported anywhere before deleting.
```

---

## SECTION 3 — COMPONENT-LEVEL ISSUES

---

### COMP-01 · Navbar — "Community" Link is Missing from Desktop Navigation

**What is wrong:**
`App.jsx` has a `/community` route and `Community.jsx` is a full page. But `Navbar.jsx` only has three nav links: Home, Projects, Hackathons. Community is completely absent from the desktop navigation. Users can only reach it by typing the URL directly.

**Affected files:** `Navbar.jsx`

**Fix Prompt:**
```
In Navbar.jsx, add a "Community" nav link to the desktop nav menu (ul.nav-menu) between Hackathons and the user actions:
  <li className="nav-item">
    <Link to="/community" className={`nav-link ${location.pathname === '/community' ? 'active' : ''}`}>
      Community
    </Link>
  </li>
Also add it to the mobile nav menu (ul.mobile-nav-menu) in the same position.
```

---

### COMP-02 · Navbar — "Dashboard" Link is Missing from Desktop Navigation

**What is wrong:**
The Dashboard page is a core feature but has no link in the desktop navigation. It is only accessible via the user dropdown menu. Users who don't know to look in the dropdown will never find it. The mobile menu has a dashboard button but it is styled as a plain gray button, not a nav link.

**Affected files:** `Navbar.jsx`, `Navbar.css`

**Fix Prompt:**
```
In Navbar.jsx, add a "Dashboard" link to the user dropdown menu with a LayoutDashboard or Grid icon.
It already exists as a Link in the mobile menu — ensure the desktop dropdown also has it.
In the dropdown, place it as the first item after the user header section, before Profile.
Style it consistently with the other dropdown items using the .dropdown-item class.
```

---

### COMP-03 · ProjectCard — Share Button Has No Functionality (console.log Only)

**What is wrong:**
In `ProjectCard.jsx`, the `handleShare` function only calls `console.log('Shared:', project.title)`. The share button is visible to all users but does nothing. This is a broken affordance — users click it expecting something to happen.

**Affected files:** `ProjectCard.jsx`

**Fix Prompt:**
```
In ProjectCard.jsx, implement the handleShare function using the Web Share API with a clipboard fallback:
  const handleShare = async (e) => {
    e.stopPropagation();
    const shareData = {
      title: project.title,
      text: project.description,
      url: window.location.origin + '/projects?id=' + project.id
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      // Show a brief tooltip or toast: "Link copied to clipboard"
    }
  };
Add a small tooltip or toast notification confirming the action to the user.
```

---

### COMP-04 · CreateProjectModal — Step 3 (Team Members) Adds Members by Name Only, Not by User Account

**What is wrong:**
In `CreateProjectModal.jsx`, Step 3 "Team Members" lets the founder add team members by typing a name and position. These are not linked to actual user accounts — they are just strings. This means the added "team members" have no real user identity, cannot log in and see the project in their dashboard, and cannot access CollaborationSpace.

**Affected files:** `CreateProjectModal.jsx`

**Fix Prompt:**
```
In CreateProjectModal.jsx, Step 3 (members case), replace the free-text name input with a user search:
1. Add a search input that calls GET /api/users?search={query} as the user types (debounced 300ms).
2. Show a dropdown of matching users with their name and avatar.
3. On selection, add the user object (with their real id) to formData.teamMembers.
4. Keep the position/role input as a free-text field.
5. If the API is not ready, add a TODO comment and keep the current free-text input as a fallback,
   but add a visible warning: "Note: Members added here are not linked to real accounts yet."
```

---

### COMP-05 · CollaborationSpace — Project Selector Shows All Projects, Not Just User's Projects

**What is wrong:**
In `CollaborationSpace.jsx`, `userProjects` is filtered by checking if `member.name === user?.name`. This is a fragile string comparison — if the user's display name differs by even one character (capitalization, space), they won't see their projects. It should compare by user ID.

**Affected files:** `CollaborationSpace.jsx`

**Fix Prompt:**
```
In CollaborationSpace.jsx, fix the userProjects filter:
Change:
  .filter(project => project.teamMembers.some(member => member.name === user?.name))
To:
  .filter(project => project.teamMembers.some(member => member.id === user?.id || member.email === user?.email))
This ensures the filter works correctly regardless of name formatting differences.
Also add a fallback: if userProjects is empty, show a helpful empty state with two action buttons:
"Browse Projects" (link to /projects) and "Create a Project" (triggers CreateProjectModal).
```

---

### COMP-06 · OnboardingModal — Skip Button is Commented Out

**What is wrong:**
In `OnboardingModal.jsx`, the "Skip for now" button is commented out. The modal is also missing the logo section (also commented out). Users who don't want to complete onboarding are forced to fill in all 4 steps — there is no escape except closing the browser tab. The `canProceed()` check blocks the Continue button if fields are empty, trapping the user.

**Affected files:** `OnboardingModal.jsx`

**Fix Prompt:**
```
In OnboardingModal.jsx:
1. Uncomment and restore the "Skip for now" button at the bottom of the modal.
   Style it as a subtle text link: color: #9ca3af, no background, no border.
   On click, call onClose() directly without saving any data.
2. Uncomment and restore the logo section at the top for brand consistency with AuthModal.
3. Make step 3 (bio) optional — change canProceed() for case 3 to always return true,
   and update the placeholder text to say "Optional — you can add this later."
```

---

### COMP-07 · NotificationModal — Notifications Contain JSX Icons Stored in State (Not Serializable)

**What is wrong:**
In `NotificationContext.jsx`, notification objects store `icon: <Users size={16} />` — a JSX element — directly in state. JSX elements are not serializable, which means these notifications cannot be saved to localStorage, cannot be sent over a network, and will cause issues if the state is ever persisted or serialized. This is an anti-pattern.

**Affected files:** `NotificationContext.jsx`

**Fix Prompt:**
```
In NotificationContext.jsx, replace JSX icon elements in notification objects with string type identifiers:
Change: icon: <Users size={16} />
To: iconType: 'users'

Then in NotificationModal.jsx (or wherever notifications are rendered), map iconType to the actual icon component:
  const iconMap = { users: <Users size={16} />, check: <CheckCircle size={16} />, x: <XCircle size={16} /> };
  const icon = iconMap[notification.iconType];
This makes notifications serializable and safe to store in localStorage or send to a backend.
```

---

### COMP-08 · ProfileModal — Used in Both Dashboard and Community with No Shared State

**What is wrong:**
`ProfileModal.jsx` is imported and used independently in both `Dashboard.jsx` and `Community.jsx`. Each page manages its own `selectedUser` state. If the same user's profile is viewed from different pages, there is no shared cache — the data is fetched or constructed separately each time. This is not a critical bug but creates inconsistency if profile data differs between contexts.

**Affected files:** `Dashboard.jsx`, `Community.jsx`, `ProfileModal.jsx`

**Fix Prompt:**
```
Lift the ProfileModal into App.jsx as a global modal (similar to how AuthModal and ProjectModal are handled).
Add a selectedProfileUser state and setSelectedProfileUser function to App.jsx.
Pass setSelectedProfileUser as a prop (onViewProfile) to Dashboard and Community.
Render <ProfileModal user={selectedProfileUser} onClose={() => setSelectedProfileUser(null)} />
at the App level. This ensures consistent behavior and a single source of truth for profile viewing.
```

---

## SECTION 4 — STYLING & VISUAL CONSISTENCY ISSUES

---

### STYLE-01 · Empty State Text is White on White Background (Projects Page)

**What is wrong:**
In `Projects.css`, the `.empty-state h3` and `.empty-state p` have `color: #ffffff`. The empty state renders inside `.projects-container` which has a white/light gray background (`#f8f9fa`). White text on a white background is invisible. This only looks correct when the empty state happens to render inside the gradient header area, which it does not.

**Affected files:** `Projects.css`

**Fix Prompt:**
```
In Projects.css, change the empty state text colors:
  .empty-state h3 { color: #1f2937; }  /* was #ffffff */
  .empty-state p { color: #6b7280; }   /* was #ffffff */
Also add a minimum height to .empty-state of 300px and center it properly with flexbox.
The .empty-icon emoji should be 4rem and have margin-bottom: 1rem.
```

---

### STYLE-02 · Inconsistent Border Radius Across Cards (16px vs 12px vs 8px)

**What is wrong:**
Different card components use different border radii with no design system rationale:
- `ProjectCard.css`: `border-radius: 16px`
- `Dashboard.css` stat cards: `border-radius: 12px`
- `Dashboard.css` application items: `border-radius: 12px`
- `CollaborationSpace.css` task items: `border-radius: 8px`
- `Home.css` feature cards: `border-radius: 16px`
- `Home.css` stage cards: `border-radius: 16px`

This inconsistency makes the UI feel unpolished and unintentional.

**Affected files:** `App.css`, `Dashboard.css`, `CollaborationSpace.css`

**Fix Prompt:**
```
Establish a border radius design token system in App.css:
  :root {
    --radius-sm: 8px;    /* inputs, tags, small elements */
    --radius-md: 12px;   /* cards, modals, panels */
    --radius-lg: 16px;   /* hero cards, large feature cards */
    --radius-full: 9999px; /* pills, badges, avatars */
  }
Then update all CSS files to use these variables instead of hardcoded values.
Primary cards (ProjectCard, feature cards) should use --radius-lg.
Secondary cards (stat cards, application items, task items) should use --radius-md.
Form inputs, tags, and small elements should use --radius-sm.
```

---

### STYLE-03 · Two Different Blue Color Values Used for Primary Actions

**What is wrong:**
The codebase uses two different primary blue colors inconsistently:
- `#2563eb` (Tailwind blue-600) — used in Navbar, Projects, Home, App.css
- `#4f46e5` (Tailwind indigo-600) — used in ProjectCard stage badge, Dashboard skill tags, CollaborationSpace upload button

These are visually similar but different enough to be noticeable. The AuthModal uses `#6366f1` (indigo-500) as its primary color, which is a third variant.

**Affected files:** `App.css`, `ProjectCard.css`, `Dashboard.css`, `AuthModal.css`, `CollaborationSpace.css`

**Fix Prompt:**
```
Standardize the primary color in App.css using CSS custom properties:
  :root {
    --color-primary: #4f46e5;        /* indigo-600 — main brand color */
    --color-primary-hover: #4338ca;  /* indigo-700 */
    --color-primary-light: #e0e7ff;  /* indigo-100 — for backgrounds */
    --color-primary-text: #4f46e5;   /* for text on white */
  }
Replace all hardcoded #2563eb, #4f46e5, and #6366f1 occurrences across all CSS files with var(--color-primary).
Update gradient definitions to use consistent start/end colors:
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
```

---

### STYLE-04 · Mobile Navbar Buttons Have Inconsistent Styling (Some Gray, Some Colored)

**What is wrong:**
In `Navbar.css`, the mobile menu has a complex set of overrides where buttons are first styled with specific colors (green for collaboration, red for logout) and then overridden back to gray (`#f3f4f6`) in a later rule block. The CSS has contradictory rules for `.collaboration-btn.mobile` — it is set to green, then overridden to gray. This creates confusion and makes the mobile menu look flat and undifferentiated.

**Affected files:** `Navbar.css`

**Fix Prompt:**
```
In Navbar.css, clean up the mobile menu button styles. Remove the contradictory override blocks.
Define a clear hierarchy for mobile action buttons:
- Navigation links (Home, Projects, etc.): plain text links, no background
- Action buttons (Notifications, Workspace): light gray background (#f3f4f6), dark gray text
- Primary action (Create Project): brand gradient background, white text
- Destructive action (Logout): light red background (#fee2e2), red text (#b91c1c)
Remove all duplicate style declarations for the same selectors.
The .collaboration-btn.mobile should have a consistent style — pick one and remove the override.
```

---

### STYLE-05 · CollaborationSpace Modal Has Fixed Width (900px) That Breaks on Tablets

**What is wrong:**
In `CollaborationSpace.css`, the `.collaboration-modal` has `width: 900px`, `min-width: 900px`, and `max-width: 900px` — all hardcoded. On tablets (768px–900px viewport), the modal is wider than the screen and causes horizontal overflow. The responsive override at `max-width: 768px` fixes mobile but leaves a gap for tablet viewports.

**Affected files:** `CollaborationSpace.css`

**Fix Prompt:**
```
In CollaborationSpace.css, replace the fixed 900px width with a responsive approach:
  .collaboration-modal {
    width: min(900px, calc(100vw - 2rem));
    min-width: unset;
    max-width: 900px;
  }
This ensures the modal never exceeds the viewport width while still targeting 900px on large screens.
Also add a tablet breakpoint at max-width: 1024px:
  @media (max-width: 1024px) {
    .collaboration-modal { width: calc(100vw - 2rem); }
  }
Remove the redundant min-width: 900px declaration entirely.
```

---

### STYLE-06 · Dashboard Application Cards Use a 3-Column Grid That Breaks on Medium Screens

**What is wrong:**
In `Dashboard.css`, `.application-item` uses `grid-template-columns: 220px 1fr 200px`. On screens between 768px and 1024px, the fixed 220px and 200px columns leave very little space for the middle column, causing text to overflow or wrap awkwardly. The responsive override at `max-width: 1024px` collapses to `grid-template-columns: 1fr` which is too aggressive — it stacks everything vertically even on tablets where a 2-column layout would work.

**Affected files:** `Dashboard.css`

**Fix Prompt:**
```
In Dashboard.css, update the application-item grid for better responsiveness:
  /* Default (desktop) */
  .application-item { grid-template-columns: 220px 1fr 200px; }

  /* Tablet */
  @media (max-width: 1024px) {
    .application-item { grid-template-columns: 1fr 180px; }
    /* applicant-info and application-details merge into first column */
  }

  /* Mobile */
  @media (max-width: 640px) {
    .application-item { grid-template-columns: 1fr; }
  }
Also add overflow: hidden and text-overflow: ellipsis to applicant name and project name
to prevent text overflow in constrained columns.
```

---

### STYLE-07 · No Loading Skeleton — Only Projects Page Has a Spinner

**What is wrong:**
Only `Projects.jsx` has a loading state (spinner + "Loading projects..." text). All other pages — Dashboard, Profile, Community, Hackathons — render immediately with empty states or null data while async operations are in progress. This creates jarring layout shifts and confusing blank screens.

**Affected files:** `Dashboard.jsx`, `Profile.jsx`, `Community.jsx`, `Hackathons.jsx`

**Fix Prompt:**
```
Create a reusable LoadingSkeleton component in frontend/components/LoadingSkeleton.jsx.
It should render animated gray placeholder blocks (CSS shimmer animation) that match the shape
of the content being loaded. Use it in:
- Dashboard.jsx: skeleton for application cards while applications load
- Profile.jsx: skeleton for the profile banner and stats while user data fetches
- Community.jsx: skeleton for post cards while posts load
- Hackathons.jsx: skeleton for hackathon cards while hackathons load

CSS shimmer animation:
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
```

---

### STYLE-08 · Toast Notifications Have No Color Class Applied (Always Transparent)

**What is wrong:**
In `Dashboard.css`, `.toast-notification.success` has `background-color: #4ade80` and `.toast-notification.error` has `background-color: #f87171`. But in `Dashboard.jsx`, the toast is rendered as `<div className="toast-notification">` with no success or error class applied. The base `.toast-notification` has no background-color defined, so the toast renders as a transparent box with invisible text.

**Affected files:** `Dashboard.jsx`, `Dashboard.css`

**Fix Prompt:**
```
In Dashboard.jsx, update the toast state to include a type field and apply it as a CSS class:
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

When showing the toast, set the type:
  setToast({ show: true, message: 'Application accepted', type: 'success' });
  setToast({ show: true, message: 'Application rejected', type: 'error' });

In the JSX, apply the type as a class:
  <div className={`toast-notification ${toast.type}`}>

Also add a default background to .toast-notification in Dashboard.css as a fallback:
  .toast-notification { background-color: #1f2937; color: white; }
```

---

## SECTION 5 — ACCESSIBILITY & INTERACTION ISSUES

---

### A11Y-01 · Modals Are Not Keyboard Accessible (No Focus Trap)

**What is wrong:**
All modals (`AuthModal`, `ProjectModal`, `CreateProjectModal`, `CollaborationSpace`, `OnboardingModal`) open without trapping keyboard focus inside them. A keyboard user can Tab past the modal into the background content. There is also no `Escape` key handler on most modals to close them.

**Affected files:** All modal components

**Fix Prompt:**
```
For each modal component, implement a focus trap:
1. On modal open, move focus to the first focusable element inside the modal.
2. On Tab key press, cycle focus only within the modal's focusable elements.
3. On Shift+Tab, cycle backwards.
4. On Escape key press, call onClose().

Use this pattern in a useEffect inside each modal:
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

For full focus trapping, consider using the 'focus-trap-react' npm package or implement
a custom hook that queries all focusable elements within the modal ref.
```

---

### A11Y-02 · Modal Overlays Have No aria-modal or role="dialog" Attributes

**What is wrong:**
All modal overlays are plain `<div>` elements with no ARIA attributes. Screen readers cannot identify them as dialogs, cannot announce the modal title, and cannot inform users that background content is inert.

**Affected files:** All modal components

**Fix Prompt:**
```
For each modal component, add ARIA attributes to the modal container div:
  <div
    className="auth-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title-id"
  >
    <h2 id="modal-title-id">Sign in to your account</h2>
    ...
  </div>

Also add aria-label to icon-only buttons (bookmark, share, edit, delete, close):
  <button aria-label="Bookmark project" className="action-btn bookmark-btn">
    <Bookmark size={16} />
  </button>
```

---

### A11Y-03 · Form Inputs in CreateProjectModal Have No Labels

**What is wrong:**
In `CreateProjectModal.jsx`, most form inputs use only `placeholder` text as their label. When the user starts typing, the placeholder disappears and there is no visible label to remind them what the field is for. This is a WCAG 2.1 failure (Success Criterion 1.3.1 — Info and Relationships).

**Affected files:** `CreateProjectModal.jsx`, `CreateProjectModal.css`

**Fix Prompt:**
```
In CreateProjectModal.jsx, add visible <label> elements for every input field.
Each label should be associated with its input via htmlFor/id:
  <div className="form-group">
    <label htmlFor="project-title">Project Title *</label>
    <input id="project-title" type="text" ... />
  </div>

For the team requirements step, add labels to position role inputs:
  <label htmlFor={`position-role-${index}`}>Position Title</label>
  <input id={`position-role-${index}`} ... />

Style labels consistently: font-size: 0.875rem, font-weight: 600, color: #374151, margin-bottom: 0.25rem.
```

---

## SECTION 6 — DATA & STATE ISSUES AFFECTING UX

---

### DATA-01 · All Collaboration Data is Stored in localStorage Only

**What is wrong:**
Chat messages, tasks, and files in `CollaborationSpace` are stored exclusively in `localStorage`. This means:
- Data is lost when the user clears their browser
- Data is not shared between team members (each person sees only their own localStorage)
- The collaboration feature is effectively non-functional for actual team use

**Affected files:** `ChatTab.jsx`, `TasksTab.jsx`, `FilesTab.jsx`

**Fix Prompt:**
```
This is a backend integration task. For each collaboration tab:

ChatTab.jsx: Replace localStorage with WebSocket or polling to GET /api/projects/:id/messages
and POST /api/projects/:id/messages. Show a "Messages are stored locally only" banner until
the backend is connected.

TasksTab.jsx: Replace localStorage with GET /api/projects/:id/tasks and POST/PATCH/DELETE endpoints.

FilesTab.jsx: Replace localStorage with GET /api/projects/:id/files and POST (multipart) for uploads.

Until the backend is ready, add a visible yellow warning banner at the top of CollaborationSpace:
"Collaboration data is currently stored locally in your browser and is not shared with your team.
Backend sync coming soon."
```

---

### DATA-02 · Sample/Hardcoded Data Mixed with Real Data in ProjectContext

**What is wrong:**
`ProjectContext.jsx` initializes with 6 hardcoded sample projects, 2 sample hackathons, and 2 sample applications. When a real user logs in and creates projects, their projects are mixed with the sample data. The sample data also has hardcoded `ownerId` values that don't match real users, causing notification and permission logic to behave incorrectly.

**Affected files:** `ProjectContext.jsx`

**Fix Prompt:**
```
In ProjectContext.jsx, remove all hardcoded sample projects, hackathons, and applications from the
initial state. Replace them with API calls:
- On mount, fetch projects from GET /api/projects
- On mount, fetch hackathons from GET /api/hackathons
- On mount, fetch applications for the current user from GET /api/applications?userId={user.id}

If the API is not ready, keep the sample data but wrap it in a condition:
  const isDev = import.meta.env.DEV;
  const [projects, setProjects] = useState(isDev ? sampleProjects : []);

This way, sample data only appears in development and never in production.
```

---

## SECTION 7 — QUICK WINS SUMMARY

The following are small, high-impact fixes that can be done in under 30 minutes each:

| # | Issue | File | Fix |
|---|-------|------|-----|
| Q1 | "Community" missing from desktop nav | `Navbar.jsx` | Add `<Link to="/community">Community</Link>` to nav-menu |
| Q2 | Empty state text invisible (white on white) | `Projects.css` | Change `.empty-state h3/p` color to `#1f2937` / `#6b7280` |
| Q3 | Toast has no background color | `Dashboard.jsx` | Add `toast.type` as CSS class to toast div |
| Q4 | Share button does nothing | `ProjectCard.jsx` | Implement clipboard copy with Web Share API fallback |
| Q5 | Duplicate copy files in pages/ | `pages/` folder | Delete `Community - Copy.*` and `Home - Copy.*` |
| Q6 | Forgot password is dead link | `AuthModal.jsx` | Replace `<a href="#">` with a button that shows reset view |
| Q7 | CollaborationSpace fixed 900px width | `CollaborationSpace.css` | Change to `width: min(900px, calc(100vw - 2rem))` |
| Q8 | Skip button missing from Onboarding | `OnboardingModal.jsx` | Uncomment the skip button |
| Q9 | Settings button in Dashboard header does nothing | `Dashboard.jsx` | Wire to `navigate('/profile?tab=settings')` or remove |
| Q10 | Hackathon register has no auth check | `Hackathons.jsx` | Add `if (!user) { onAuthClick(); return; }` guard |

---

## SECTION 8 — PRIORITY ORDER FOR FIXES

### P0 — Critical (Breaks Core Functionality)
1. FLOW-04 · No route protection on Dashboard and Profile
2. DATA-01 · Collaboration data not shared between users
3. FLOW-02 · Application submission closes the modal unexpectedly
4. STYLE-08 · Toast notifications are invisible (no background)

### P1 — High (Breaks Expected UX)
5. FLOW-01 · Onboarding data lost on Profile page
6. FLOW-03 · CollaborationSpace auto-opens without user consent
7. COMP-01 · Community missing from desktop navigation
8. FLOW-06 · Forgot password is a dead link
9. FLOW-07 · Community post button has no auth check
10. STYLE-01 · Empty state text invisible on Projects page

### P2 — Medium (Inconsistent or Confusing UX)
11. FLOW-05 · CollaborationSpace has no visible nav entry point
12. PAGE-02 · Owned projects mixed into discovery page
13. COMP-03 · Share button does nothing
14. STYLE-03 · Two different primary blue colors used
15. STYLE-05 · CollaborationSpace fixed width breaks on tablets
16. A11Y-01 · No keyboard focus trap in modals

### P3 — Low (Polish and Code Quality)
17. PAGE-06 · Duplicate copy files in pages/
18. COMP-07 · JSX icons stored in notification state
19. STYLE-02 · Inconsistent border radius values
20. DATA-02 · Sample data mixed with real data in production

---

*End of UI/UX Audit Report — Teamera.net**
