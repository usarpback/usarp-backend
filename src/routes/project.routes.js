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
ProjectRoutes.get("/projects", ProjectController.listProjects);
ProjectRoutes.post("/project/:id/addMember", ProjectController.addProjectMember);
ProjectRoutes.delete("/project/:id/removeMember/:memberid", ProjectController.deleteProjectMember);
ProjectRoutes.get("/project/:id/members", ProjectController.getAllProjectMembers);
ProjectRoutes.put("/project/:id/members/:memberId", ProjectController.updateProjectMemberRole);

module.exports = ProjectRoutes;
