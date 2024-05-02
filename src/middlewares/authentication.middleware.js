const { verifyToken } = require("../helpers/token.helpers");

module.exports = async (request, response, next) => {
  try {
    const { authorization } = request.headers;

    if (!authorization) {
      return response.status(401).json({ message: "Token not provided" });
    }

    const [, token] = authorization.split(" ");

    const decoded = verifyToken(token);
    request.userId = decoded.id;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || "TokenExpiredError") {
      return response.status(401).json({ message: "Invalid token" });
    }
    return response.status(500).json({ message: "Internal server error" });
  }
};
