const express = require("express");
const ProjectRoutes = express.Router();
const userStoriesController = require("../controllers/userStories.controller");
const ProjectController = require("../controllers/project.controller.js");

ProjectRoutes.post("/project/create", ProjectController.createProject);
ProjectRoutes.get(
  "/project/owned-projects",
  ProjectController.getAllUserCreatedProjectsAndCounts,
);
ProjectRoutes.get("/projects-details", ProjectController.getProjectsDetails);

ProjectRoutes.get(
  "/projects/:projectId/user-stories",
  userStoriesController.getUserStoriesByProject,
);

module.exports = ProjectRoutes;
