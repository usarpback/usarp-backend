const UserModel = require("../models/user.model");
const mailer = require("../config/mailer");
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
  async forgot_password(request, response) {
    const { email } = request.body;
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);

    try{
      // Find user by email address
      const user = await UserModel.findOne({
        where: {
          email,
        },
      });

      if (!user) {
        return response
          .status(400)
          .json({ message: "Invalid email" });
      }

      // Generate and return token
      const token = user.generateToken(expiresIn = '30m');
      const reset_link = `localhost:3333/auth/reset_password/${user.id}/${token}`;

      mailer.sendMail({
        to: email,
        from : 'usarpback@gmail.com',
        template: 'forgot_password',
        subject: 'Password Reset Request',
        context: { reset_link },
      })

      user.resetPasswordToken = token;
      user.resetPasswordExpires = now;
      await user.save();

      return response.status(200).json({ message: "The recovery email was sent to the user"});
    } catch(error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },
  async reset_password(request, response) {
    const { password } = request.body;
    const { token, userId } = request.params;
    const now = new Date();

    try{
      const user = await UserModel.findByPk(userId);

      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      if (token != user.resetPasswordToken) {
        return response.status(400).json({ message: "Invalid token" });
      }

      if (now > user.resetPasswordExpires) {
        return response.status(400).json({ message: "Token expired" });
      }

      user.password = password;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return response.status(200).json({ message: "The password was successfully reset"});
    } catch(error) {
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
};
