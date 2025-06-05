const Brainstorming = require("../models/brainstorming.model");
const Project = require("../models/project.model");
const UserStories = require("../models/userStories.model");
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
        where: { id: project, creatorId },
      });

      if (!projectExists) {
        return response.status(400).json({
          message:
            "The selected project does not exist or does not belong to the user.",
        });
      }

      if (!userStories.every((id) => typeof id === "string")) {
        return response.status(400).json({
          message: "User Stories must be an array of UUID strings.",
        });
      }

      const validUserStories = await UserStories.findAll({
        where: {
          id: userStories,
          creatorId,
          projectId: project,
        },
      });

      if (validUserStories.length !== userStories.length) {
        return response.status(400).json({
          message:
            "One or more User Stories do not exist or are not associated with the project.",
        });
      }

      const brainstorming = await Brainstorming.create({
        creatorId,
        brainstormingTitle,
        projectId: project,
        brainstormingDate,
        brainstormingTime,
      });

      for (const userStory of validUserStories) {
        userStory.brainstormingId = brainstorming.id;
        await userStory.save();
      }

      const fullBrainstorming = await Brainstorming.findOne({
        where: { id: brainstorming.id },
        include: [
          {
            model: UserStories,
            as: "userStories",
          },
        ],
      });

      return response.status(201).json(fullBrainstorming);
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

  async getAllBrainstormingsAndCount(request, response) {
    try {
      const getAllBrainstormingsAndCount = await Brainstorming.findAndCountAll({
        where: {
          creatorId: request.userId,
        },
        include: [
          {
            model: UserStories,
            as: "userStories",
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      if (getAllBrainstormingsAndCount.count === 0) {
        return response.status(404).json({
          message: "No brainstormings created by this user yet",
        });
      }

      return response.status(200).json(getAllBrainstormingsAndCount);
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
