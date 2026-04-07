const express = require("express");
const routes = express.Router();

const UserRoutes = require("./user.routes");
const AuthRoutes = require("./auth.routes");
const BrainstormingRoutes = require("./brainstorming.routes");
const ProjectRoutes = require("./project.routes");
const userStoriesRoutes = require("./userStories.routes");

const authorizationMiddleware = require("../middlewares/authentication.middleware");

routes.use(AuthRoutes);

routes.use(authorizationMiddleware);
routes.use(UserRoutes);
routes.use(BrainstormingRoutes);
routes.use(ProjectRoutes);
routes.use(userStoriesRoutes);

module.exports = routes;
