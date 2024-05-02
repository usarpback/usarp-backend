/* eslint-disable no-unused-vars */
const jwt = require("jsonwebtoken");
const { secret } = require("../config/auth.config");

module.exports = {
  generateToken(data, expiresIn = "4h") {
    const options = {
      expiresIn,
    };
    return jwt.sign(data, secret, options);
  },

  verifyToken(token) {
    return jwt.verify(token, secret);
  },
};
