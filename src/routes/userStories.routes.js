const express = require("express");
const userStoriesRoutes = express.Router();
const userStoriesController = require("../controllers/userStories.controller");

userStoriesRoutes.post(
  "/userstories/register",
  userStoriesController.registerUserStories,
);

module.exports = userStoriesRoutes;
