const { verifyToken } = require("../helpers/token.helpers");

module.exports = async (request, response, next) => {
  const { authorization } = request.headers;

  if (!authorization) {
    return response.status(401).json({ message: "Token not provided" });
  }

  const [, token] = authorization.split(" ");

  try {
    const decoded = verifyToken(token);
    request.userId = decoded.id;
    return next();
  } catch (error) {
    return response.status(401).json({ message: "Token invalid" });
  }
};
