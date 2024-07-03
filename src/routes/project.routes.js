const express = require("express");
const ProjectRoutes = express.Router();
const ProjectController = require("../controllers/project.controller.js");

ProjectRoutes.post("/project/create", ProjectController.createProject);
ProjectRoutes.get(
  "/project/owned-projects",
  ProjectController.getAllUserCreatedProjectsAndCounts,
);

module.exports = ProjectRoutes;
