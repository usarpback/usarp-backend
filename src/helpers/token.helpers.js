const jwt = require("jsonwebtoken");
const { secret } = require("../config/auth.config");

module.exports = {
  generateToken(data, expiresIn = "5d") {
    const options = {
      expiresIn,
    };
    return jwt.sign(data, secret, options);
  },

  verifyToken(token) {
    return jwt.verify(token, secret);
  },
};
