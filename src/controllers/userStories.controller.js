const UserStories = require("../models/userStories.model");
const { ValidationError } = require("sequelize");

module.exports = {
  async registerUserStories(request, response) {
    const {
      userStorieNumber,
      userStoriesTitle,
      card,
      conversation,
      confirmation,
      projectId = null,
      brainstormingId = null,
    } = request.body;
    const creatorId = request.userId;

    try {
      const userStories = await UserStories.create({
        userStorieNumber,
        userStoriesTitle,
        card,
        conversation,
        confirmation,
        creatorId,
        projectId: projectId || null,
        brainstormingId: brainstormingId || null,
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
