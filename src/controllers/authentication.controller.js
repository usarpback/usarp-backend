const UserModel = require("../models/user.model");

module.exports = {
  async signup(request, response) {
    const {
      fullName,
      email,
      password,
      gender,
      birthdate,
      profile,
      organization,
    } = request.body;
    try {
      const user = await UserModel.create({
        fullName,
        email,
        password,
        gender,
        birthdate,
        profile,
        organization,
      });

      const { password: omit, ...userWithoutPassword } = user.toJSON();

      return response.status(201).json(userWithoutPassword);
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        "SequelizeDatabaseError"
      ) {
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal server error" });
    }
  },
  async signin(request, response) {
    const { email, password } = request.body;
    try {
      // Find user by email address
      const user = await UserModel.findOne({
        where: {
          email,
        },
      });

      if (!user) {
        return response
          .status(400)
          .json({ message: "Invalid email and/or password" });
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return response
          .status(400)
          .json({ message: "Invalid email and/or password" });
      }

      // Generate and return token
      const token = user.generateToken();
      return response.status(200).json({ token });
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
