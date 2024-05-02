const express = require("express");
const routes = express.Router();

const UserRoutes = require("./user.routes");
const AuthRoutes = require("./auth.routes");

const authorizationMiddleware = require("../middlewares/authentication.middleware");

routes.use(AuthRoutes);

routes.use(authorizationMiddleware);
routes.use(UserRoutes);

module.exports = routes;
