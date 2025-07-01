const express = require("express");
const ProjectRoutes = express.Router();
const ProjectController = require("../controllers/project.controller.js");

ProjectRoutes.post("/project/create", ProjectController.createProject);
ProjectRoutes.put("/project/update/:id", ProjectController.updateProject);
ProjectRoutes.get(
  "/project/owned-projects",
  ProjectController.getAllUserCreatedProjectsAndCounts,
);
ProjectRoutes.get("/projects-details", ProjectController.getProjectsDetails);

module.exports = ProjectRoutes;
