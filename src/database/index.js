const Sequelize = require("sequelize");
const config = require("../config/database");
const connection = new Sequelize(config);

const UserModel = require("../models/user.model");
const BrainstormingModel = require("../models/brainstorming.model");

UserModel.init(connection);
BrainstormingModel.init(connection);

module.exports = connection;
