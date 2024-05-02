const Sequelize = require("sequelize");
const config = require("../config/database");
const connection = new Sequelize(config);

const UserModel = require("../models/user.model");

UserModel.init(connection);

module.exports = connection;
