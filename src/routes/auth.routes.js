const express = require("express");
const AuthRoutes = express.Router();
const AuthenticationController = require("../controllers/authentication.controller");

AuthRoutes.post("/auth/signin", AuthenticationController.signin);
AuthRoutes.post("/auth/signup", AuthenticationController.signup);
AuthRoutes.post("/auth/forgot_password", AuthenticationController.forgot_password);
AuthRoutes.post("/auth/reset_password/:userId/:token", AuthenticationController.reset_password);

module.exports = AuthRoutes;
