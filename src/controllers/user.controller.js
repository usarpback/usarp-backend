const UserModel = require("../models/user.model");
const { ValidationError } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = {
  async getAllUsers(request, response) {
    try {
      const users = await UserModel.findAll();

      const usersWithoutPassword = users.map((user) => {
        const { password: omit, ...userWithoutPassword } = user.toJSON();
        return userWithoutPassword;
      });

      return response.status(200).json({ users: usersWithoutPassword });
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async getUserById(request, response) {
    try {
      const userId = request.userId;

      const user = await UserModel.findByPk(userId);

      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      const { password: omit, ...userWithoutPassword } = user.toJSON();

      return response.status(200).json(userWithoutPassword);
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async updateUser(request, response) {
    try {
      const userId = request.userId;

      const user = await UserModel.findByPk(userId);

      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      const updatedData = {
        fullname: request.body.fullName || user.fullName,
        email: request.body.email || user.email,
        gender: request.body.gender || user.gender,
        birthdate: request.body.birthdate || user.birthdate,
        profile: request.body.profile || user.profile,
        organization: request.body.organization || user.organization,
      };

      const updatedUser = await user.update(updatedData);

      const { password: omit, ...userWithoutPassword } = updatedUser.toJSON();

      return response.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        return response.status(400).json({
          message: "Validation errors",
          errors: validationErrors,
        });
      }
      return response.status(500).send({ message: "Internal server error" });
    }
  },

  async passwordUpdate(request, response) {
    try {
      const userId = request.userId;
      const { currentPassword, newPassword, confirmNewPassword } = request.body;

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return response
          .status(400)
          .json({ message: "All fields are required" });
      }

      if (newPassword !== confirmNewPassword) {
        return response.status(400).json({ message: "Passwords do not match" });
      }

      const user = await UserModel.findByPk(userId);

      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        return response
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return response.status(400).json({
          message: "New password cannot be the same as the old password",
        });
      }

      user.password = newPassword;
      await user.save();

      return response
        .status(200)
        .send({ message: "Password updated successfully!" });
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        return response.status(400).json({
          message: "Validation errors",
          errors: validationErrors,
        });
      }
      return response.status(500).send({ message: "Internal server error" });
    }
  },
};
