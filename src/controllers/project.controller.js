const {
  sequelize,
  Sequelize,
  User,
  Project,
  Brainstorming,
  UserStories,
  ProjectUser,
} = require("../database");
const { ValidationError } = require("sequelize");
const { Op } = require("sequelize");

module.exports = {
  async createProject(request, response) {
    const { projectName, description, projectTeam } = request.body;
    const creatorId = request.userId;

    const t = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      const project = await Project.create(
        { projectName, description, creatorId },
        { transaction: t },
      );

      const creator = await User.findOne({
        where: { id: creatorId },
        attributes: ["id", "fullName", "email", "organization"],
      });

      if (!creator) {
        await t.rollback();
        return response.status(400).json({
          message: `Creator with id '${creatorId}' not found.`,
        });
      }

      const teamMembers = [];

      let creatorAdded = false;

      for (const member of projectTeam) {
        const { email, roleInProject } = member;

        const user = await User.findOne({ where: { email } });

        if (!user) {
          await t.rollback();
          return response.status(400).json({
            message: `User with email '${email}' not found.`,
          });
        }

        const existingMember = await ProjectUser.findOne({
          where: { memberEmail: email, projectId: project.id },
          transaction: t,
        });

        if (existingMember) {
          await t.rollback();
          return response.status(400).json({
            message: `Email address '${email}' has already been invited to the project. Please enter a different email.`,
          });
        }

        await ProjectUser.create(
          {
            projectId: project.id,
            memberId: user.id,
            fullName: user.fullName,
            memberEmail: email,
            roleInProject,
          },
          { transaction: t },
        );

        teamMembers.push({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          roleInProject,
        });

        if (email === creator.email) {
          creatorAdded = true;
        }
      }

      if (!creatorAdded) {
        await ProjectUser.create(
          {
            projectId: project.id,
            memberId: creator.id,
            fullName: creator.fullName,
            memberEmail: creator.email,
            roleInProject: "Moderador",
          },
          { transaction: t },
        );
        teamMembers.push({
          id: creator.id,
          fullName: creator.fullName,
          email: creator.email,
          roleInProject: "Moderador",
        });
      }

      await t.commit();

      const projectResponse = project.toJSON();
      delete projectResponse.creatorId;

      return response.status(201).json({
        project: projectResponse,
        creator: creator.toJSON(),
        projectTeam: teamMembers,
      });
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }

      if (error instanceof ValidationError) {
        const validationErrors = error.errors.map((err) => err.message);
        return response.status(400).json({
          message: "Validation error",
          errors: validationErrors,
        });
      }
      return response.status(500).json({ message: error.message });
    }
  },

  async updateProject(request, response) {
    try {
      const { id } = request.params;
      const updateData = request.body;
      console.log("-----------------------------------------");
      console.log("id", id);
      console.log("Update Data:", updateData);

      // Verificar se o id do projeto foi fornecido
      if (!id) {
        return response.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      // Buscar o projeto existente
      const existingProject = await Project.findByPk(id); // Use findByPk em vez de findById

      if (!existingProject) {
        return response.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      // Verificar se o usuário tem permissão para atualizar
      if (existingProject.creatorId !== request.userId) {
        return response.status(403).json({
          success: false,
          message: "Not authorized to update this project",
        });
      }

      // Iniciar uma transação para garantir consistência
      const t = await sequelize.transaction();

      try {
        // 1. Atualizar os dados básicos do projeto
        const { projectTeam, ...projectData } = updateData;

        await existingProject.update(
          {
            ...projectData,
            updatedAt: new Date(),
          },
          { transaction: t },
        );

        // 2. Atualizar os membros da equipe, se fornecido
        if (projectTeam && Array.isArray(projectTeam)) {
          // Opcional: Remover membros atuais da equipe (exceto o criador)
          await ProjectUser.destroy({
            where: {
              projectId: id,
              memberId: { [Op.ne]: existingProject.creatorId },
            },
            transaction: t,
          });

          // Adicionar novos membros
          for (const member of projectTeam) {
            const { email, roleInProject } = member;

            // Evitar duplicação ao encontrar o usuário
            const user = await User.findOne({
              where: { email },
              transaction: t,
            });

            if (!user) {
              await t.rollback();
              return response.status(400).json({
                message: `User with email '${email}' not found.`,
              });
            }

            // Verificar se já existe na equipe
            const existingMember = await ProjectUser.findOne({
              where: {
                memberEmail: email,
                projectId: id,
              },
              transaction: t,
            });

            // Se não existe, adiciona
            if (!existingMember) {
              await ProjectUser.create(
                {
                  projectId: id,
                  memberId: user.id,
                  fullName: user.fullName,
                  memberEmail: email,
                  roleInProject,
                },
                { transaction: t },
              );
            } else {
              // Se existe, atualiza o papel
              await existingMember.update(
                { roleInProject },
                { transaction: t },
              );
            }
          }
        }

        await t.commit();

        // Buscar o projeto atualizado com membros da equipe
        const updatedProject = await Project.findByPk(id);
        const projectTeamMembers = await ProjectUser.findAll({
          where: { projectId: id },
          attributes: ["memberId", "fullName", "memberEmail", "roleInProject"],
        });

        response.status(200).json({
          success: true,
          message: "Project updated successfully",
          data: {
            ...updatedProject.toJSON(),
            projectTeam: projectTeamMembers.map((member) => ({
              memberId: member.memberId,
              fullName: member.fullName,
              email: member.memberEmail,
              roleInProject: member.roleInProject,
            })),
          },
        });
      } catch (innerError) {
        await t.rollback();
        throw innerError; // Repassa para o catch externo
      }
    } catch (error) {
      console.error("Error updating project:", error);
      response.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  async getAllUserCreatedProjectsAndCounts(request, response) {
    try {
      // Extrai parâmetros de paginação, filtros e ordenação da query string
      const {
        offset,
        limit,
        id: filterId,
        status,
        projectName,
        orderBy,
        orderDirection,
      } = request.query;

      // Define valores padrão para offset e limit
      const offsetValue = offset ? parseInt(offset, 10) : 0;
      const limitValue = limit ? parseInt(limit, 10) : 10;

      // Monta o filtro para a consulta: sempre restringe aos projetos criados pelo usuário
      const projectFilter = {
        creatorId: request.userId,
        ...(filterId ? { id: filterId } : {}),
        ...(status ? { status } : {}),
        ...(projectName
          ? { projectName: { [Op.like]: `%${projectName}%` } }
          : {}),
      };

      // Configura a ordenação se for solicitado e se for por campos válidos
      let orderClause;
      if (orderBy && (orderBy === "createdAt" || orderBy === "updatedAt")) {
        orderClause = [
          [
            orderBy,
            orderDirection && orderDirection.toUpperCase() === "DESC"
              ? "DESC"
              : "ASC",
          ],
        ];
      }

      // Consulta os projetos com paginação, filtros e ordenação
      const projects = await Project.findAndCountAll({
        where: projectFilter,
        offset: offsetValue,
        limit: limitValue,
        order: orderClause,
      });

      if (projects.count === 0) {
        return response
          .status(404)
          .json({ message: "No user-created projects yet" });
      }

      // Formata os projetos enriquecendo com dados do criador e equipe
      const formattedProjects = await Promise.all(
        projects.rows.map(async (project) => {
          const projectData = project.toJSON();

          const creator = await User.findOne({
            where: { id: project.creatorId },
            attributes: ["id", "fullName", "email", "organization"],
          });

          if (!creator) {
            throw new Error(
              `Creator with id '${project.creatorId}' not found.`,
            );
          }
          projectData.creator = creator.toJSON();

          const projectUsers = await ProjectUser.findAll({
            where: { projectId: project.id }, // Use projectId em vez de id
            attributes: [
              "memberId",
              "fullName",
              "memberEmail",
              "roleInProject",
            ],
          });

          projectData.projectTeam = projectUsers.map((member) => ({
            memberId: member.memberId,
            fullName: member.fullName,
            email: member.memberEmail,
            roleInProject: member.roleInProject,
          }));

          // Remove o campo creatorId antes de retornar
          const { creatorId, ...projectWithoutCreatorId } = projectData;
          return projectWithoutCreatorId;
        }),
      );

      // Retorna os projetos formatados juntamente com as informações de paginação
      return response.status(200).json({
        count: projects.count,
        pagination: {
          offset: offsetValue,
          limit: limitValue,
        },
        projects: formattedProjects,
      });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async getProjectsDetails(request, response) {
    try {
      const userEmail = request.userEmail;

      // Busca os ids associados ao usuário
      const projectMemberships = await ProjectUser.findAll({
        where: { memberEmail: userEmail },
        attributes: ["id"],
      });

      const ids = projectMemberships.map(
        (membership) => membership.id,
      );

      // Extrai os parâmetros de paginação, filtro e ordenação da query string
      const {
        offset,
        limit,
        id: filterId,
        status,
        projectName,
        orderBy,
        orderDirection,
      } = request.query;

      const offsetValue = offset ? parseInt(offset, 10) : 0;
      const limitValue = limit ? parseInt(limit, 10) : 10;

      // Monta a condição "where" para os filtros
      const projectFilter = {
        // Garante que os projetos pesquisados estão entre os ids do usuário
        id: { [Op.in]: ids },
        ...(filterId ? { id: filterId } : {}),
        ...(status ? { status } : {}),
        ...(projectName
          ? { projectName: { [Op.like]: `%${projectName}%` } }
          : {}),
      };

      // Configura a ordenação, permitindo apenas "createdAt" ou "updatedAt"
      const order = [];
      if (orderBy && (orderBy === "createdAt" || orderBy === "updatedAt")) {
        order.push([
          orderBy,
          orderDirection && orderDirection.toUpperCase() === "DESC"
            ? "DESC"
            : "ASC",
        ]);
      }

      // Realiza a consulta e também obtém o total para paginação
      const { rows: projects, count: total } = await Project.findAndCountAll({
        where: projectFilter,
        offset: offsetValue,
        limit: limitValue,
        order: order.length > 0 ? order : undefined,
      });

      // Formata os projetos conforme a lógica já existente
      const formattedProjects = await Promise.all(
        projects.map(async (project) => {
          const projectData = project.toJSON();

          const creator = await User.findOne({
            where: { id: project.creatorId },
            attributes: ["id", "fullName", "email", "organization"],
          });

          if (!creator) {
            throw new Error(
              `Creator with id '${project.creatorId}' not found.`,
            );
          }

          const brainstormings = await Brainstorming.findAll({
            where: { projectId: project.id },
            include: [
              {
                model: UserStories,
                as: "userStories",
                through: { attributes: [] },
              },
            ],
          });

          const brainstormingsWithUserStoryCount = brainstormings.map((b) => {
            const bData = b.toJSON();
            bData.userStoriesCount = bData.userStories?.length || 0;
            delete bData.userStories;
            return bData;
          });

          const totalUserStoriesCount = brainstormings.reduce(
            (acc, b) => acc + (b.userStories?.length || 0),
            0,
          );

          const projectUsers = await ProjectUser.findAll({
            where: { projectId: project.id },
            attributes: [
              "memberId",
              "fullName",
              "memberEmail",
              "roleInProject",
            ],
          });

          projectData.creator = creator.toJSON();
          projectData.projectTeam = projectUsers.map((member) => ({
            memberId: member.memberId,
            fullName: member.fullName,
            email: member.memberEmail,
            roleInProject: member.roleInProject,
          }));

          projectData.brainstormingsCount = brainstormings.length;
          projectData.userStoriesCount = totalUserStoriesCount;
          projectData.brainstormings = brainstormingsWithUserStoryCount;

          const { creatorId, ...projectWithoutCreatorId } = projectData;

          return projectWithoutCreatorId;
        }),
      );

      return response.status(200).json({
        projects: formattedProjects,
        pagination: {
          offset: offsetValue,
          limit: limitValue,
          total,
        },
      });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};
