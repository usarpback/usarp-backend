const express = require("express");
const ProjectRoutes = express.Router();
const ProjectController = require("../controllers/project.controller.js");

ProjectRoutes.post("/project/create", ProjectController.createProject);

module.exports = ProjectRoutes;
