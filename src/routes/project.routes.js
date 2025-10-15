const express = require("express");
const ProjectRoutes = express.Router();
const ProjectController = require("../controllers/project.controller.js");

ProjectRoutes.post("/project/create", ProjectController.createProject);
ProjectRoutes.get(
  "/project/owned-projects",
  ProjectController.getAllUserCreatedProjectsAndCounts,
);
ProjectRoutes.get("/projects-details", ProjectController.getProjectsDetails);
ProjectRoutes.delete("/project/:id", ProjectController.deleteProject);
ProjectRoutes.put("/project/:id", ProjectController.updateProject);

module.exports = ProjectRoutes;
