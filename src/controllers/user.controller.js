const UserModel = require("../models/user.model");
const { ValidationError } = require("sequelize");

module.exports = {
  async getAllUsers(request, response) {
    try {
      const users = await UserModel.findAll();
      return response.status(200).json({ users });
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
        password: request.body.password || user.password,
        gender: request.body.gender || user.gender,
        birthdate: request.body.birthdate || user.birthdate,
        profile: request.body.profile || user.profile,
        organization: request.body.organization || user.organization,
      };

      const updatedUser = await user.update(updatedData);

      const { password: omit, ...userWithoutPassword } = updatedUser.toJSON();

      return response.status(200).json(userWithoutPassword);
    } catch (error) {
      console.log(error);
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
