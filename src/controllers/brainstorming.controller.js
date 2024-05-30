const Brainstorming = require("../models/brainstorming.model");
const Project = require("../models/project.model");
const { ValidationError } = require("sequelize");

module.exports = {
  async createBrainstorming(request, response) {
    const {
      brainstormingTitle,
      project,
      brainstormingDate,
      brainstormingTime,
      userStories,
    } = request.body;
    const creatorId = request.userId;

    try {
      const projectExists = await Project.findOne({
        where: { id: project, creatorId: creatorId },
      });

      if (!projectExists) {
        return response.status(400).json({
          message:
            "The selected project does not exist or does not belong to the user.",
        });
      }

      const brainstorming = await Brainstorming.create({
        creatorId,
        brainstormingTitle,
        project,
        brainstormingDate,
        brainstormingTime,
        userStories,
      });

      return response.status(201).json(brainstorming);
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        return response.status(400).json({
          message: "Validation error",
          errors: validationErrors,
        });
      }
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
