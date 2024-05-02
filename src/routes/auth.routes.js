const express = require("express");
const AuthRoutes = express.Router();
const AuthenticationController = require("../controllers/authentication.controller");

AuthRoutes.post("/auth/signin", AuthenticationController.signin);
AuthRoutes.post("/auth/signup", AuthenticationController.signup);

module.exports = AuthRoutes;
