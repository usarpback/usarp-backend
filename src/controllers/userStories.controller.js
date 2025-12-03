const UserStories = require("../models/userStories.model");
const ProjectUser = require("../models/projectUser.model");
const Project = require("../models/project.model");
const BrainstormingUserStories = require("../models/brainstormingUserStories.model");
const paginate = require("../helpers/paginate");
const { ValidationError } = require("sequelize");
const mailer = require("../config/mailer");

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

  async putOpenUserStories(request, response) {
    const { id } = request.params;

    try {
      const userId = request.userId;
      const userStorie = await UserStories.findByPk(id);
      if (!userStorie) {
        return response
          .status(404)
          .json({ message: `User story with id '${id}' not found.` });
      }

      if(userStorie.confirmation === null || userStorie.confirmation === '') {
        return response.status(400).json({ message: "Cannot open a user story without confirmation." });
      }
      

      const project = await Project.findByPk(userStorie.projectId);
      if (!project) {
        return response.status(404).json({
          message: `No project found with id '${userStorie.projectId}'.`,
        });
      }

      const projectUser = await ProjectUser.findOne({
        where: { projectId: userStorie.projectId, memberId: userId },
      });
      if (!projectUser && project.creatorId !== userId) {
        return response.status(403).json({
          message: "You do not have permission to open this user story.",
        });
      }

      return response.status(200).json(userStorie);
    } catch (err) {
      console.error(err);
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async updateUserStories(request, response) {
    const { id } = request.params;
    const userId = request.userId;

    try {
      const userStorie = await UserStories.findByPk(id);
      if (!userStorie) {
        return response
          .status(404)
          .json({ message: `User story with id '${id}' not found.` });
      }

      const projectMembership = await ProjectUser.findOne({
        where: { projectId: userStorie.projectId, memberId: userId },
      });

      const isCreator = userStorie.creatorId === userId;
      const isModerator = projectMembership && projectMembership.roleInProject === "Moderador";

      if (!isCreator && !isModerator) {
        return response.status(403).json({
          message:
            "Você não tem permissão para atualizar esta história. Apenas o criador da história ou moderadores do projeto podem editar.",
        });
      }
      const project = await Project.findByPk(userStorie.projectId);
      if (!project) {
        return response.status(400).json({ message: "O projeto associado a esta história não existe." });
      }

      const {
        userStorieNumber,
        userStoriesTitle,
        card,
        conversation,
        confirmation,
        status,
      } = request.body;

      const updatedData = {
        userStorieNumber: userStorieNumber ?? userStorie.userStorieNumber,
        userStoriesTitle: userStoriesTitle ?? userStorie.userStoriesTitle,
        card: card !== undefined ? card : userStorie.card,
        conversation: conversation !== undefined ? conversation : userStorie.conversation,
        confirmation: confirmation !== undefined ? confirmation : userStorie.confirmation,
        status: status ?? userStorie.status,
      };
      if (!updatedData.userStorieNumber || !updatedData.userStoriesTitle) {
        return response.status(400).json({
          message: "The fields 'User Story Number' and 'User Story Title' are required."
        });
      }
      try {
        const updated = await userStorie.update(updatedData);

        const projectMembers = await ProjectUser.findAll({
          where: { projectId: userStorie.projectId },
          attributes: ["memberEmail", "fullName"],
        });

        const updater = (projectMembership && projectMembership.fullName) || request.userFullName || request.userEmail || "Um usuário";

        for (const member of projectMembers) {
          try {
            await mailer.sendMail({
              to: member.memberEmail,
              from: "mailusarp@gmail.com",
              template: "userstory_updated",
              subject: "User Story Updated - USARP Tool",
              context: {
                memberName: member.fullName,
                userStorieNumber: updated.userStorieNumber,
                userStoriesTitle: updated.userStoriesTitle,
                updatedBy: updater,
              },
            });
          } catch (emailError) {
            console.error(
              `Erro ao enviar email para ${member.memberEmail}:`,
              emailError && emailError.message ? emailError.message : emailError,
            );
          }
        }

        return response.status(200).json(updated);
      } catch (error) {
        if (error instanceof ValidationError) {
          const validationErrors = error.errors.map((err) => err.message);
          return response.status(400).json({
            message: "Validation error",
            errors: validationErrors,
          });
        }
        if (error.message) {
          return response.status(400).json({ message: error.message });
        }
        console.error(error);
        return response.status(500).json({ message: "Internal server error" });
      }
    } catch (err) {
      console.error(err);
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async deleteUserStories(request, response) {
    const { id } = request.params;
    const userId = request.userId;

    try {
      const userStorie = await UserStories.findByPk(id);
      if (!userStorie) {
        return response
          .status(404)
          .json({ message: `User story with id '${id}' not found.` });
      }

      const projectMembership = await ProjectUser.findOne({
        where: { projectId: userStorie.projectId, memberId: userId },
      });

      const isCreator = userStorie.creatorId === userId;
      const isModerator = projectMembership && projectMembership.roleInProject === "Moderador";

      if (!isCreator && !isModerator) {
        return response.status(403).json({
          message:
            "You do not have permission to delete this user story. Only the creator or project moderators can delete it.",
        });
      }
            
      const associations = await BrainstormingUserStories.count({
          where: { userStoryId: id },
      });

      if (associations > 0) {
          return response.status(403).json({
              message: `A exclusão não é permitida. Esta História de Usuário possui ${associations} vínculo(s) ativo(s) com sessão(ões) de brainstorming. Remova o vínculo primeiro.`,
              hasActiveBrainstormingLink: true
          });
      }

      await userStorie.destroy();
      return response
        .status(200)
        .json({ message: "User story deleted successfully." });
    } catch (err) {
      console.error(err);
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async helpUserStoriesStatus(request, response) {
    try {
        const statuses = [
            {
                status: 'Nova',
                description:
                    'Status inicial. A História de Usuário foi cadastrada, mas ainda não foi associada a nenhum brainstorming.', 
            },
            {
                status: 'Associada a um brainstorming',
                description:
                    'A História de Usuário está vinculada a uma única sessão de brainstorming e está pronta para ser refinada.', 
            },
            {
                status: 'Associada a vários brainstormings',
                description:
                    'A História de Usuário está vinculada a duas ou mais sessões de brainstorming.', 
            },
            {
                status: 'Bloqueado',
                description:
                    'A História de Usuário está com impedimentos de prosseguimento e não pode ser associada a novos brainstormings.', 
            },
            {
                status: 'Concluída',
                description:
                    'A História de Usuário teve sua especificação finalizada e validada. Pode ser reaberta caso haja problemas (US018).',
            },
        ];

        return response.status(200).json({ statuses });
    } catch (error) {
        return response.status(500).json({ message: 'Internal server error' });
    }
  },

  async listUserStories(request, response){
    try {
      const { projectId } = request.params;
      const userId = request.userId;

      const member = await ProjectUser.findOne({
        where: { projectId, memberId: userId, status: "Ativo"},
      });

      if (!member) {
        return response.status(403).json({ message: "You are not a member of this project"});
      }

      const stories = await userStories.findAll({
        where: { projectId },
        order: [["userStorieNumber", "ASC"]],
        attributes: ["id", "userStorieNumber", "userStoriesTitle", "status"],
      });

      return response.status(200).json(stories);

    }  catch (error){
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
