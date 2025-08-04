const UserStories = require("../models/userStories.model");
const ProjectUser = require("../models/projectUser.model");
const Project = require("../models/project.model");
const paginate = require("../helpers/paginate");
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

  async registerListUserStories(request, response) {
    // 1. Desestruturar a nova estrutura do corpo da requisição
    const { projectId, userStories } = request.body;
    const creatorId = request.userId;

    // Validações iniciais
    if (!projectId) {
      return response.status(400).json({
        message:
          "The 'projectId' field is required and must reference an existing project.",
      });
    }

    if (!Array.isArray(userStories) || userStories.length === 0) {
      return response.status(400).json({
        message:
          "The 'userStories' field is required and must be a non-empty array.",
      });
    }

    try {
      const projectExists = await Project.findByPk(projectId);
      if (!projectExists) {
        return response.status(404).json({
          message: `No project found with id '${projectId}'.`,
        });
      }

      // 2. Preparar os dados para a inserção em massa
      // Adiciona o creatorId e o projectId a cada história de usuário
      const storiesToCreate = userStories.map((story) => {
        // Validação para cada item da lista
        if (!story.userStorieNumber || !story.userStoriesTitle) {
          throw new Error(
            "All stories must have 'userStorieNumber' and 'userStoriesTitle'.",
          );
        }

        return {
          ...story, // Inclui todos os campos de uma história: userStorieNumber, userStoriesTitle, etc.
          creatorId,
          projectId,
        };
      });

      // 3. Usar bulkCreate para inserir todas as histórias de uma vez
      const createdStories = await UserStories.bulkCreate(storiesToCreate);

      return response.status(201).json(createdStories);
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        return response.status(400).json({
          message: "Validation error",
          errors: validationErrors,
        });
      } else if (error.message) {
        // Captura o erro lançado pela validação manual no map
        return response.status(400).json({ message: error.message });
      }
      console.error(error); // Log do erro para depuração
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async getUserStoriesByProject(request, response) {
    const { projectId } = request.params;
    const page = parseInt(request.query.page, 10) || 1;
    const pageSize = parseInt(request.query.pageSize, 10) || 10;
    const sort = (request.query.sort || "asc").toLowerCase();
    const userId = request.userId;

    if (!["asc", "desc"].includes(sort)) {
      return response.status(400).json({
        message: "Invalid sort parameter; must be 'asc' or 'desc'.",
      });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return response
        .status(404)
        .json({ message: `Project with id '${projectId}' not found.` });
    }

    const isMember = await ProjectUser.findOne({
      where: { projectId, memberId: userId },
    });
    if (!isMember && project.creatorId !== userId) {
      return response.status(403).json({
        message: "You do not have permission to view those user stories.",
      });
    }

    try {
      const { data, meta } = await paginate(UserStories, page, pageSize, {
        where: { projectId },
        order: [["userStorieNumber", sort.toUpperCase()]],
        attributes: [
          "id",
          "userStorieNumber",
          "userStoriesTitle",
          "status",
          "createdAt",
        ],
      });

      if (data.length === 0) {
        return response.status(404).json({
          message: "No user stories found for this project.",
        });
      }

      return response.status(200).json({
        projectId,
        sort,
        userStories: data,
        pagination: meta,
      });
    } catch (err) {
      console.error(err);
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
