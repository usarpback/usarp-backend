const UserStories = require("../models/userStories.model");
const Project = require("../models/project.model");
const { ValidationError } = require("sequelize");

module.exports = {
  async registerUserStories(request, response) {
    const {
      userStorieNumber,
      userStoriesTitle,
      card,
      conversation,
      confirmation,
      projectId,
    } = request.body;
    const creatorId = request.userId;

    if (!projectId) {
      return response.status(400).json({
        message:
          "The 'projectId' field is required and must reference an existing project.",
      });
    }

    const projectExists = await Project.findByPk(projectId);
    if (!projectExists) {
      return response.status(400).json({
        message: `No project found with id '${projectId}'.`,
      });
    }

    if (!userStorieNumber || !userStoriesTitle) {
      return response.status(400).json({
        message:
          "The fields 'userStorieNumber' and 'userStoriesTitle' are required and cannot be empty.",
      });
    }

    try {
      const userStories = await UserStories.create({
        userStorieNumber,
        userStoriesTitle,
        card,
        conversation,
        confirmation,
        creatorId,
        projectId,
      });

      return response.status(201).json(userStories);
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        return response.status(400).json({
          message: "Validation error",
          errors: validationErrors,
        });
      } else if (error.message) {
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
