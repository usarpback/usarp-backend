const Sequelize = require("sequelize");
const config = require("../config/database");
const connection = new Sequelize(config);

const UserModel = require("../models/user.model");
const BrainstormingModel = require("../models/brainstorming.model");
const ProjectModel = require("../models/project.model");
const ProjectUserModel = require("../models/projectUser.model");
const UserStoriesModel = require("../models/userStories.model");
const BrainstormingUserStories = require("../models/brainstormingUserStories.model");

UserModel.init(connection);
BrainstormingModel.init(connection);
ProjectModel.init(connection);
ProjectUserModel.init(connection);
UserStoriesModel.init(connection);
BrainstormingUserStories.init(connection);

UserModel.associate(connection.models);
BrainstormingModel.associate(connection.models);
ProjectModel.associate(connection.models);
ProjectUserModel.associate(connection.models);
UserStoriesModel.associate(connection.models);
BrainstormingUserStories.associate(connection.models);

module.exports = {
  sequelize: connection,
  Sequelize,
  User: connection.models.User,
  Project: connection.models.Project,
  Brainstorming: connection.models.Brainstorming,
  UserStories: connection.models.UserStories,
  ProjectUser: connection.models.ProjectUser,
  BrainstormingUserStories: connection.models.BrainstormingUserStories,
};
