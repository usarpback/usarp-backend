const Sequelize = require("sequelize");
const config = require("../config/database");
const connection = new Sequelize(config);

const UserModel = require("../models/user.model");
const BrainstormingModel = require("../models/brainstorming.model");
const ProjectModel = require("../models/project.model");
const ProjectUserModel = require("../models/projectUser.model");

UserModel.init(connection);
BrainstormingModel.init(connection);
ProjectModel.init(connection);
ProjectUserModel.init(connection);

module.exports = connection;
