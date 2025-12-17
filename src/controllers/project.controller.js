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
const mailer = require("../config/mailer");


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
            where: { projectId: project.id },
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

      // Busca os projectIds associados ao usuário
      const projectMemberships = await ProjectUser.findAll({
        where: { memberEmail: userEmail },
        attributes: ["projectId"],
      });

      const projectIds = projectMemberships.map(
        (membership) => membership.projectId,
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
        // Garante que os projetos pesquisados estão entre os projectIds do usuário
        id: { [Op.in]: projectIds },
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

  async deleteProject(request, response) {
    const { id: projectId } = request.params;
    const userId = request.userId;

    const t = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      const project = await Project.findByPk(projectId);
      if (!project) {
        await t.rollback();
        return response.status(404).json({ message: "Projeto não encontrado"});
      }
      if (project.creatorId !== userId) {
        await t.rollback();
        return response.status(403).json({ message: "Apenas o criador pode excluir o projeto"});
      }

      const brainstormings = await Brainstorming.findAll({where: {projectId}, transaction: t});

      if (brainstormings.length > 0) {
        await t.rollback();
        return response.status(400).json({ message: "Não é possivel remover projeto, pois há brainstorms associadas. Remova primeiro as brainstorms.", hasBrainstormings : true,
        })
      }

      const projectUsers = await ProjectUser.findAll({
        where: { projectId },
        attributes: ["memberEmail", "fullName"],
        transaction: t
      });

      await UserStories.destroy({ where: { projectId }, transaction: t});
      await ProjectUser.destroy({ where: { projectId }, transaction: t});
      await Project.destroy({ where: { projectId }, transaction: t});

      for (const member of projectUsers) {
        try {
          await mailer.sendMail({
            to: member.memberEmail,
            from: "mailusarp@gmail.com",
            template: "project_deleted",
            subject: "Project deleted - USARP TOOL",
            context: {
              memberName: member.fullName,
              projectName: project.projectName
            }
          })
        } catch (emailError) {
          console.error(`Error to invite mail for ${member.memberEmail}:`, emailError.message);
        }
      }
      await t.commit();
      return response.status(200).json({ message: "Projeto excluido com sucesso."});
    } catch (error) {
      if (!t.finished) await t.rollback();
      return response.status(500).json({ message: error.message});
    }
  },

  async updateProject(request, response) {
    try {
      const projectId = request.params.id;
      const project = await Project.findByPk(projectId);
      const { projectName, description, status } = request.body;

      if (!project) {
        return response.status(404).json({ message: "Projeto não encontrado" });
      }

      if (project.creatorId !== request.userId) {
        return response
          .status(403)
          .json({ message: "Somente o criador do projeto pode atualizar o projeto" });
      }

      const [updated] = await Project.update(
        { projectName, description, status },
        { where: { id: projectId } }
      );

      if (projectName && projectName !== project.projectName) {
        const projectMembers = await ProjectUser.findAll({
          where: { projectId },
          attributes: ["memberEmail", "fullName"]
        });

        const creator = await User.findOne({
          where: { id: request.userId },
          attributes: ["fullName"]
        });

        for (const member of projectMembers) {
          try {
            await mailer.sendMail({
              to: member.memberEmail,
              from: "mailusarp@gmail.com",
              template: "project_name_change",
              subject: "Projeto Atualizado - USARP Tool",
              context: {
                memberName: member.fullName,
                oldProjectName: project.projectName,
                newProjectName: projectName,
                projectDescription: description || project.description,
                projectStatus: status || project.status,
                creatorName: creator.fullName
              }
            });
          } catch (emailError) {
            console.error(`Erro ao enviar email para ${member.memberEmail}:`, emailError.message);
          }
        }
      }

      if (!updated) {
        return response.status(404).json({ message: "Projeto não encontrado" });
      }

      return response.status(200).json({ message: "Projeto atualizado com sucesso" });
    } catch (error) {
      console.error(error);
      if (error instanceof ValidationError) {
        const validationErrors = error.errors ? error.errors.map((err) => err.message) : [error.message];
        return response.status(400).json({ message: "Validation error", errors: validationErrors });
      }
      return response.status(500).json({ message: error.message });
    }
  },

  async getAllProjectMembers(request, response) {
    try {
      const projectId = request.params.id;

      const projectMembers = await ProjectUser.findAll({
        where: { projectId },
        attributes: ["fullName", "memberEmail", "roleInProject", "organization", "profile", "memberId", "status"],
      });

      return response.status(200).json({ members: projectMembers });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: error.message });
    }
  },

  async deleteProjectMember(request, response) {
    try {
      const projectId = request.params.id;
      const memberId = request.body.memberId || request.params.memberId;
      const userId = request.userId;

      const project = await Project.findByPk(projectId);

      if (!project) {
        return response.status(404).json({ message: "Projeto não encontrado" });
      }
      
      if (project.creatorId !== userId) {
        return response.status(403).json({ message: "Apenas o criador do projeto pode remover membros" });
      }

      const deleted = await ProjectUser.destroy({
        where: { projectId, memberId },
      });

      if (!deleted) {
        return response.status(404).json({ message: "Membro do projeto não encontrado" });
      }

      return response.status(200).json({ message: "Membro do projeto removido com sucesso" });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: error.message });
    }
  },

  async addProjectMember(request, response) {
    try {
      const projectId = request.params.id;
      const { memberEmail } = request.body;
      const userId = request.userId;

      const project = await Project.findByPk(projectId);
      const requesterMembership = await ProjectUser.findOne({
        where: { projectId, memberId: userId },
      });
      if (!project) {
        return response.status(404).json({ message: "Projeto não encontrado" });
      }

      if (project.creatorId !== userId && requesterMembership.roleInProject === "Participante") {
        return response.status(403).json({ message: "Apenas o criador ou moderador do projeto pode adicionar membros" });
      }

      const user = await User.findOne({ where: { email: memberEmail } });

      if (!user) {
        const projectLinkCreateAccount = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/signup`;

        const finalRolePending = requesterMembership && requesterMembership.roleInProject ? requesterMembership.roleInProject : "Participante";

        await ProjectUser.create({
          projectId,
          memberId: null,
          fullName: null,
          memberEmail,
          roleInProject: finalRolePending,
          status: "Pendente",
        });

        try {
          const inviter = await User.findOne({ where: { id: userId }, attributes: ["fullName", "email"] });
          const inviterName = inviter && inviter.fullName ? inviter.fullName : request.userEmail || "Um usuário";

          await mailer.sendMail({
            to: memberEmail,
            from: "mailusarp@gmail.com",
            template: "project_invite_pending",
            subject: "Você foi convidado para um projeto - USARP Tool",
            context: {
              memberName: null,
              projectName: project.projectName,
              inviterName,
              projectLink: projectLinkCreateAccount,
            },
          });
        } catch (emailError) {
          console.error(`Erro ao enviar e-mail de convite para ${memberEmail}:`, emailError && emailError.message ? emailError.message : emailError);
        }

        return response.status(201).json({ message: "Convite enviado (usuário não cadastrado)", projectLinkCreateAccount });
      }

      const existingMember = await ProjectUser.findOne({ where: { memberEmail, projectId } });

      if (existingMember) {
        return response.status(400).json({ message: "Usuário já é membro do projeto" });
      }

      const finalRole = requesterMembership && requesterMembership.roleInProject ? requesterMembership.roleInProject : "Participante";
      if (finalRole !== "Participante") {
        return response.status(400).json({ message: "Função inválida. Apenas 'Participante' pode ser atribuída via convite." });
      }

      const userCreateProject = await ProjectUser.create({
        projectId,
        memberId: user.id,
        fullName: user.fullName,
        memberEmail,
        roleInProject: finalRole,
        status: "Ativo",
      });

      if (userCreateProject) {

          const inviter = await User.findOne({ where: { id: userId }, attributes: ["fullName", "email"] });
          const inviterName = inviter && inviter.fullName ? inviter.fullName : request.userEmail || "Um usuário";
          const projectLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${projectId}`;
          // Deixei a variável FRONTEND_URL no .env apontando para a URL do frontend (ex: 'http://localhost:3000')

          try {
            await mailer.sendMail({
              to: memberEmail,
              from: "mailusarp@gmail.com",
              template: "project_invite",
              subject: "Você foi convidado para um projeto - USARP Tool",
              context: {
                memberName: user.fullName,
                projectName: project.projectName,
                inviterName,
                projectLink
              },
            });
          } catch (emailError) {
            console.error(`Erro ao enviar e-mail de convite para ${memberEmail}:`, emailError && emailError.message ? emailError.message : emailError);
          }
        }

      return response.status(201).json({ message: "Membro adicionado ao projeto com sucesso" });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: error.message });
    }
  },

  async updateProjectMemberRole(request, response) {
    try {
      const id = request.params.id;
      const memberIdUser = request.params.memberId; 
      const { roleInProject } = request.body;
      const userId = request.userId; 

      const project = await Project.findByPk(id);
      if (!project) {
        return response.status(404).json({ message: "Projeto não encontrado" });
      }

      const requesterRelation = await ProjectUser.findOne({
        where: { projectId: id, memberId: userId },
      });

      const isOwner = project.creatorId === userId;
      const isModerator = requesterRelation && requesterRelation.roleInProject === "Moderador";

      if (!isOwner && !isModerator) {
        return response.status(403).json({ 
            message: "Permissão negada. Apenas o Proprietário ou Moderadores podem alterar permissões." 
        });
      }

      if (isModerator) {
        if (memberIdUser === userId) {
             return response.status(403).json({ message: "Moderadores não podem alterar a própria permissão." });
        }
        if (memberIdUser === project.creatorId) {
             return response.status(403).json({ message: "Moderadores não podem alterar a permissão do Proprietário do projeto." });
        }
      }

      const projectMember = await ProjectUser.findOne({ 
        where: { projectId: id, memberId: memberIdUser } 
      });

      if (!projectMember) {
        return response.status(404).json({ message: "Membro do projeto não encontrado" });
      }

      projectMember.roleInProject = roleInProject;
      await projectMember.save();

      return response.status(200).json({ message: "Função do membro atualizada com sucesso" });

    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: error.message });
    }
},

  async listProjects (request, response) {
    try {
      const userEmail = request.userEmail;
      const userId = request.userId

      const projectMemberships = await ProjectUser.findAll({
        where: { memberEmail: userEmail },
        attributes: ["projectId"]
      })
      const creatorProjects = await Project.findAll({
        where: { creatorId: userId},
        attributes: ["id"]
      })

      const memberProjectsIds = projectMemberships.map(
        membership => membership.projectId
      );
      const creatorProjectsIds = creatorProjects.map(
        projects => projects.id
      )
      const allProjectsIds = Array.from(new Set([...memberProjectsIds, ...creatorProjectsIds]))

      const {
        offset,
        limit,
        status,
        projectName,
        orderBy,
        orderDirection,
      } = request.query;

      const offsetValue = offset ? parseInt(offset, 10) : 0;
      const limitValue = limit ? parseInt(limit, 10): 10;

      const projectFilter = {
      id: { [Op.in]: allProjectsIds },
      ...(status ? { status } : {}),
      ...(projectName ? { projectName: { [Op.like]: `%${projectName}%` } } : {}),
    };

    const order = [];
    if (orderBy && (orderBy === 'createdAt' || orderBy === 'updatedAt')){
      order.push([
        orderBy,
        orderDirection && orderDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      ])
    }

    const { rows: projects, count: total} = await Project.findAndCountAll({
      where: projectFilter,
      offset: offsetValue,
      limit: limitValue,
      order: order.length > 0 ? order : undefined,
    })

    const formattedProjects = await Promise.all(projects.map(async (project)=>{
      const projectData = project.toJSON();
      return {
        projectName: projectData.projectName,
        creatorName: projectData.creator.fullName,
        createdAt: projectData.createdAt,
        canEdit: projectData.creatorId === userId,
        canDelete: projectData.creatorId === userId,
      };
    }));

    return response.status(200).json({
      projects: formattedProjects,
      pagination: {
        offset: offsetValue,
        limit: limitValue,
        total,
      }});

    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: error.message});
    }
  },
};
