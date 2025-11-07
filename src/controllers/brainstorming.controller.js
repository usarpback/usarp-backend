const Brainstorming = require("../models/brainstorming.model");
const Project = require("../models/project.model");
const UserStories = require("../models/userStories.model");
const BrainstormingUserRole = require('../models/brainstormingUserRole.model');
const User = require('../models/user.model')
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

      if (!Array.isArray(userStories) || userStories.length === 0) {
        return response.status(400).json({
          message:
            "The 'userStories' array must contain at least one valid UUID.",
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

      // Atribui ao criador o papel de moderador
      await BrainstormingUserRole.create({
        brainstormingId: Brainstorming.id,
        userId: creatorId,
        role: 'Moderador',
      });

      await brainstorming.addUserStories(validUserStories);

      const fullBrainstorming = await Brainstorming.findOne({
        where: { id: brainstorming.id },
        include: [
          {
            model: UserStories,
            as: "userStories",
            through: { attributes: [] },
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
        distinct: true,
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

  async getAllUserBrainstormingsList(request, response) {
    const { page = 1, limit = 20 } = request.query;
    const offset = (page - 1) * limit;

    const pageAsInt = parseInt(page, 10);
    const limitAsInt = parseInt(limit, 10);

    try{

      if (isNaN(pageAsInt) || isNaN(limitAsInt) || pageAsInt <= 0 || limitAsInt <= 0) {
        return response.status(400).json({ message: "Parâmetros de paginação inválidos." });
      }

      const { count, rows } = await Brainstorming.findAndCountAll({
        where: {
          creatorId: request.userId,
        },

        attributes: ['id', 'brainstormingTitle', 'createdAt', 'brainstormingTime'],
        
        order: [['createdAt', 'DESC']],
        limit: limitAsInt,
        offset,
      });

      if (count === 0) {
        return response.status(404).json({
          message: "Brainstorming not found or does not belong to the user.",
        });
      }
      
      const totalPages = Math.ceil(count / limitAsInt);

      return response.status(200).json({
        totalItems: count,
        totalPages,
        currentPage: pageAsInt,
        brainstormings: rows,
      });

    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async getAllUserBrainstormingsGrid(request, response) {
    const { page = 1, limit = 20 } = request.query;
    const offset = (page - 1) * limit;

    const pageAsInt = parseInt(page, 10);
    const limitAsInt = parseInt(limit, 10);

    try {

      if (isNaN(pageAsInt) || isNaN(limitAsInt) || pageAsInt <= 0 || limitAsInt <= 0) {
        return response.status(400).json({ message: "Parâmetros de paginação inválidos." });
      }

      const { count, rows } = await Brainstorming.findAndCountAll({
        where: {
          creatorId: request.userId,
        },

        include: [
          {
            model: UserStories,
            as: "userStories",
            through: { attributes: [] },
          },
          {
            model: Project,
            as: "project",
            attributes: ['id', 'projectName'],
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: limitAsInt,
        offset,
      });

      if (count === 0) {
        return response.status(404).json({
          message: "Brainstorming not found or does not belong to the user.",
        });
      }

      const totalPages = Math.ceil(count / limitAsInt);

      return response.status(200).json({
        totalItems: count,
        totalPages,
        currentPage: pageAsInt,
        brainstormings: rows,
      });
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async deleteBrainstorming(request, response) {
    const { brainstormingId } = request.params;
    const creatorId = request.userId;

    try {
      const brainstorming = await Brainstorming.findOne({
        where: { id: brainstormingId, creatorId },
        include: [
          {
            model: UserStories,
            as: "userStories",
            attributes: ["id", "userStoriesTitle"],
            through: { attributes: [] },
          },
          {
            model: Project,
            as: "project",
            attributes: ["id", "projectName"],
          },
        ],
      });

      if (!brainstorming) {
        return response.status(404).json({
          message: "Brainstorming not found or does not belong to the user.",
        });
      }

      const hasProject = Boolean(
        brainstorming.projectId || (brainstorming.project && brainstorming.project.id),
      );
      const hasUserStories = Array.isArray(brainstorming.userStories) && brainstorming.userStories.length > 0;

      if (hasProject || hasUserStories) {
        const associations = {
          project: null,
          userStories: [],
        };

        if (hasProject) {
          associations.project = brainstorming.project
            ? { id: brainstorming.project.id, projectName: brainstorming.project.projectName }
            : { id: brainstorming.projectId };
        }

        if (hasUserStories) {
          associations.userStories = brainstorming.userStories.map((us) => ({
            id: us.id,
            title: us.userStoriesTitle,
          }));
        }

        return response.status(400).json({
          message:
            "Não é possível excluir permanentemente este brainstorming porque ele possui associações com projeto e/ou histórias de usuário.",
          associations,
        });
      }

      await brainstorming.destroy();

      return response.status(200).json({ message: "Brainstorming deleted successfully." });
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async updateBrainstormingStatus(request, response) {
    const { brainstormingId } = request.params;
    const { status } = request.body;
    const creatorId = request.userId;

    const allowedStatuses = ['Novo', 'Bloqueado', 'Concluído/Encerrado'];

    try {
      if (!allowedStatuses.includes(status)) {
        return response.status(400).json({ message: 'Status inválido.' });
      }

      const brainstorming = await Brainstorming.findOne({
        where: { id: brainstormingId, creatorId },
        include: [
          {
            model: UserStories,
            as: 'userStories',
            through: { attributes: [] },
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'projectName'],
          },
        ],
      });

      if (!brainstorming) {
        return response.status(404).json({ message: 'Brainstorming not found or does not belong to the user.' });
      }

      const hasProject = Boolean(
        brainstorming.projectId || (brainstorming.project && brainstorming.project.id),
      );
      const hasUserStories = Array.isArray(brainstorming.userStories) && brainstorming.userStories.length > 0;

      if (!hasProject || !hasUserStories) {
        return response.status(400).json({
          message: 'Só é possível atribuir status a brainstormings que possuam vínculo com um projeto e histórias de usuário.',
        });
      }

      brainstorming.status = status;
      await brainstorming.save();

      return response.status(200).json({ message: 'Status atualizado com sucesso.', brainstorming });
    } catch (error) {
      return response.status(500).json({ message: 'Internal server error' });
    }
  },

  async helpBrainstormingStatus(request, response) {
    try {
      const statuses = [
        {
          status: 'Novo',
          description:
            'Brainstorming recém-criado. Pode não possuir vínculo com projeto e/ou histórias de usuário e pode ser editado.',
        },
        {
          status: 'Bloqueado',
          description:
            'Brainstorming com impedimentos ou dependências que precisam ser resolvidas antes de prosseguir.',
        },
        {
          status: 'Concluído/Encerrado',
          description:
            'Brainstorming finalizado. A sessão foi encerrada e não deve ser alterada em fluxo normal.',
        },
      ];

      return response.status(200).json({ statuses });
    } catch (error) {
      return response.status(500).json({ message: 'Internal server error' });
    }
  },

  async assignRole (request, response) {
    try {
        const { brainstormingId, userId, role } = request.body;
        const requestinguserId = request.userId;

        if (!brainstormingId || !userId || !role) {
          return response.status(400).json({ message: 'brainstormingId, userId e role são obrigatórios.' });
        }

        if (!['Moderador', 'Participante'].includes(role)) {
          return response.status(400).json({ message: 'Papel inválido. Use Moderador ou Participante.' });
        }

        const isModerator = await BrainstormingUserRole.findOne({
          where: {
            brainstormingId,
            userId: requestinguserId,
            role: 'Moderador',
          },
        });

        if (!isModerator) {
          return response.status(403).json({ message: 'Apenas moderadores podem atribuir papeis'});
        }

        const brainstorming = await Brainstorming.findByPk(brainstormingId);
        const user = await User.findByPk(userId);

        if (!brainstorming) {
          return response.status(404).json({ message: 'Brainstorming não encontrado.' });
        }

        if (!user) {
          return response.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Inserir ou atualizar o papel
        await BrainstormingUserRole.upsert({
          brainstormingId,
          userId,
          role,
        });

      return response.status(200).json({ message: `Papel ${role} atribuído com sucesso.` });

    } catch (error) {
      return response.status(500).json({ message: 'Internal server error' });
    }
  },
};
