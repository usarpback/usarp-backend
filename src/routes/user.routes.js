const express = require("express");
const UserRoutes = express.Router();
const UserController = require("../controllers/user.controller");
const upload = require("../middlewares/upload.middleware")

UserRoutes.get("/users", UserController.getAllUsers);
UserRoutes.get("/user", UserController.getUserById);
UserRoutes.put("/user/update", UserController.updateUser);
UserRoutes.put("/user/password-update", UserController.passwordUpdate);
UserRoutes.delete("/user/delete", UserController.deleteAccount);
UserRoutes.post("/user/avatar", upload.single("avatar"), UserController.uploadAvatar);

module.exports = UserRoutes;
