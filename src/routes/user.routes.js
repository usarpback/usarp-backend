const express = require("express");
const UserRoutes = express.Router();
const UserController = require("../controllers/user.controller");

UserRoutes.get("/users", UserController.getAllUsers);
UserRoutes.get("/user", UserController.getUserById);
UserRoutes.put("/user/update", UserController.updateUser);

module.exports = UserRoutes;
