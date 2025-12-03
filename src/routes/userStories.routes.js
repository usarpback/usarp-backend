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
userStoriesRoutes.put(
  "/userstories/:id",
  userStoriesController.updateUserStories,
);
userStoriesRoutes.get(
  "/userstories/statusHelp",
  userStoriesController.helpUserStoriesStatus,
);

userStoriesRoutes.delete(
  "/userstories/:id",
  userStoriesController.deleteUserStories,
);

userStoriesRoutes.get(
  "/projects/:projectId/user-stories",
  userStoriesController.listUserStories,
);

module.exports = userStoriesRoutes;
