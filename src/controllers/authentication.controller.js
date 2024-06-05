const UserModel = require("../models/user.model");
const { ValidationError } = require("sequelize");
const { addMinutes, isAfter } = require("date-fns");

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
      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        return response.status(400).json({
          message: "Validation errors",
          errors: validationErrors,
        });
      }
      return response.status(500).json({ message: "Internal server error" });
    }
  },
  async signin(request, response) {
    const { email, password } = request.body;
    try {
      const user = await UserModel.findOne({
        where: { email },
      });

      if (!user) {
        return response
          .status(400)
          .json({ message: "Invalid email and/or password" });
      }

      if (user.lockUntil && isAfter(new Date(), user.lockUntil)) {
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();
      } else if (user.lockUntil) {
        return response.status(403).json({
          message: "Account is locked. Please try again in 10 minutes.",
        });
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= 3) {
          user.lockUntil = addMinutes(new Date(), 10);
        }
        await user.save();
        return response
          .status(400)
          .json({ message: "Invalid email and/or password" });
      }

      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      const token = user.generateToken();
      return response.status(200).json({ token });
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
