const express = require("express");
const userStoriesRoutes = express.Router();
const userStoriesController = require("../controllers/userStories.controller");

userStoriesRoutes.post(
  "/userstories/register",
  userStoriesController.registerListUserStories,
);
userStoriesRoutes.post(
  "/userstories/register",
  userStoriesController.registerUserStories,
);
userStoriesRoutes.get(
  "/userstories/:projectId/user-stories",
  userStoriesController.getUserStoriesByProject,
);

module.exports = userStoriesRoutes;
