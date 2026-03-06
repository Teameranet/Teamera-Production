import express from "express";
import helloController from "../controllers/helloController.js";
import contactController from "../controllers/contactController.js";
import userController from "../controllers/userController.js";
import dashboardController from "../controllers/dashboardController.js";
import projectController from "../controllers/projectController.js";
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
router.post("/dashboard/:userId/applications", dashboardController.addApplication);
router.put("/dashboard/:userId/applications/:applicationId", dashboardController.updateApplicationStatus);

// Project endpoints
router.get("/projects", projectController.getAllProjects);
router.get("/projects/:id", projectController.getProjectById);
router.post("/projects", projectController.createProject);
router.put("/projects/:id", projectController.updateProject);
router.delete("/projects/:id", projectController.deleteProject);
router.get("/projects/user/:userId", projectController.getUserProjects);
router.put("/projects/:id/stage", projectController.updateProjectStage);
router.post("/projects/:id/team", projectController.addTeamMember);
router.delete("/projects/:id/team/:userId", projectController.removeTeamMember);

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Clean React Architecture API",
    version: "1.0.0",
    endpoints: {
      hello: "GET /api/hello",
      contact: "POST /api/contact",
      users: {
        login: "POST /api/users/login",
        verifyEmail: "POST /api/users/verify-email",
        getAll: "GET /api/users",
        getById: "GET /api/users/:id",
        getProjects: "GET /api/users/:id/projects",
        getProfile: "GET /api/users/:id/profile",
        create: "POST /api/users",
        update: "PUT /api/users/:id",
        updateProfile: "PUT /api/users/:id/profile",
        delete: "DELETE /api/users/:id",
      },
      dashboard: {
        get: "GET /api/dashboard/:userId",
        getStats: "GET /api/dashboard/:userId/stats",
        getBookmarks: "GET /api/dashboard/:userId/bookmarks",
        getApplications: "GET /api/dashboard/:userId/applications",
        addBookmark: "POST /api/dashboard/:userId/bookmarks",
        removeBookmark: "DELETE /api/dashboard/:userId/bookmarks/:projectId",
        addApplication: "POST /api/dashboard/:userId/applications",
        updateApplicationStatus: "PUT /api/dashboard/:userId/applications/:applicationId",
      },
      projects: {
        getAll: "GET /api/projects",
        getById: "GET /api/projects/:id",
        create: "POST /api/projects",
        update: "PUT /api/projects/:id",
        delete: "DELETE /api/projects/:id",
        getUserProjects: "GET /api/projects/user/:userId",
        updateStage: "PUT /api/projects/:id/stage",
        addTeamMember: "POST /api/projects/:id/team",
        removeTeamMember: "DELETE /api/projects/:id/team/:userId",
      },
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;