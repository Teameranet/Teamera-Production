import express from "express";
import helloController from "../controllers/helloController.js";
import contactController from "../controllers/contactController.js";
import userController from "../controllers/userController.js";
import dashboardController from "../controllers/dashboardController.js";
import projectController from "../controllers/projectController.js";
import { streamNotifications, getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../controllers/notificationController.js";
import { logger } from "../../middleware/auth.js";
import { validateRegistration } from "../../middleware/validation.js";

const router = express.Router();

// Apply logging middleware to all API routes
router.use(logger);

// Hello endpoint
router.get("/hello", helloController.getHello);

// Contact endpoints
router.post("/contact", contactController.submitContact);

// User endpoints
router.post("/users/login", userController.loginUser);
router.post("/users/verify-email", userController.verifyUserByEmail);
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.get("/users/:id/profile", userController.getUserProfile);
router.get("/users/:id/projects", userController.getUserProjects);
router.post("/users", validateRegistration, userController.createUser);
router.put("/users/:id", userController.updateUser);
router.put("/users/:id/profile", userController.updateUserProfile);
router.delete("/users/:id", userController.deleteUser);

// Dashboard endpoints
router.get("/dashboard/:userId", dashboardController.getDashboard);
router.get("/dashboard/:userId/stats", dashboardController.getDashboardStats);
router.get("/dashboard/:userId/bookmarks", dashboardController.getBookmarkedProjects);
router.get("/dashboard/:userId/applications", dashboardController.getApplications);
router.post("/dashboard/:userId/bookmarks", dashboardController.addBookmark);
router.delete("/dashboard/:userId/bookmarks/:projectId", dashboardController.removeBookmark);

// Application endpoints
router.post("/applications/submit", dashboardController.submitApplication);
router.patch("/applications/:applicationId/status", dashboardController.updateApplicationStatus);
router.get("/applications/project/:projectId", dashboardController.getProjectApplications);
router.get("/applications/check", dashboardController.checkUserApplication);
router.get("/applications/invitations", dashboardController.getProjectInvitations);

// Notification endpoints — stream MUST be before /:userId to avoid param collision
router.get("/notifications/:userId/stream", streamNotifications);
router.get("/notifications/:userId", getNotifications);
router.patch("/notifications/:notificationId/read", markAsRead);
router.patch("/notifications/:userId/read-all", markAllAsRead);
router.delete("/notifications/:notificationId", deleteNotification);

// Project endpoints
router.get("/projects", projectController.getAllProjects);
router.post("/projects", projectController.createProject);
router.get("/projects/user/:userId", projectController.getUserProjects);
router.post("/projects/:id/apply", projectController.incrementApplicationCount);
router.put("/projects/:id/stage", projectController.updateProjectStage);
router.post("/projects/:id/team", projectController.addTeamMember);
router.delete("/projects/:id/team/:userId", projectController.removeTeamMember);
router.get("/projects/:id", projectController.getProjectById);
router.put("/projects/:id", projectController.updateProject);
router.delete("/projects/:id", projectController.deleteProject);

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Clean React Architecture API",
    version: "1.0.0",
    endpoints: {
      hello: "GET /api/hello",
      contact: "POST /api/contact",
      users: "GET /api/users",
      dashboard: "GET /api/dashboard/:userId",
      applications: "POST /api/applications/submit",
      notifications: "GET /api/notifications/:userId",
      projects: "GET /api/projects",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
