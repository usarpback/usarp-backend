const Brainstorming = require("../models/brainstorming.model");

module.exports = {
  async createBrainstorming(request, response) {
    const {
      creatorId,
      brainstormingTitle,
      project,
      brainstormingDate,
      brainstormingTime,
      userStories,
    } = request.body;
    try {
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
      if (
        error.name === "SequelizeValidationError" ||
        "SequelizeDatabaseError"
      ) {
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
