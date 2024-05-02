const UserModel = require("../models/user.model");

module.exports = {
  async getAllUsers(request, response) {
    try {
      const users = await UserModel.findAll();
      return response.status(200).json({ users });
    } catch (error) {
      return response.status(400).json({ error: error.message });
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
        fullname: request.body.fullname || user.fullname,
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
      return response.status(500).send({ message: error.message });
    }
  },
};
