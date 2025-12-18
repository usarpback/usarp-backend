const Brainstorming = require("../models/brainstorming.model");
const Project = require("../models/project.model");
const UserStories = require("../models/userStories.model");
const BrainstormingUserRole = require('../models/brainstormingUserRole.model');
const User = require('../models/user.model');
const Note = require('../models/notes.model');
const { ValidationError } = require("sequelize");
const BrainstormingUserStories = require("../models/brainstormingUserStories.model");
const crypto = require("crypto");
const { title } = require("process");

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

  async updateBrainstormingChecklist(request, response) {
    try {
      const { brainstormingId } = request.params;
      const requestingUserId = request.userId;
      const { checklistData } = request.body;

      const brainstorming = await Brainstorming.findByPk(brainstormingId);

      if (!brainstorming) {
        return response.status(404).json({ message: 'Brainstorming não encontrado.' });
      }

      const userrole = await BrainstormingUserRole.findOne({
        where: { brainstormingId, userId: requestingUserId },
      });

      if (!userrole || userrole.role !== 'Moderador') {
        return response.status(403).json({ message: 'Apenas moderadores podem atualizar o checklist.' });
      }

      if (!checklistData) {
        return response.status(400).json({ message: 'Payload inválido. Envie `checklistData`.' });
      }

      const updates = Array.isArray(checklistData)
        ? checklistData
        : Object.keys(checklistData || {}).map((k) => ({ userStoryId: k, checklist: checklistData[k] }));

      if (!Array.isArray(updates) || updates.length === 0) {
        return response.status(400).json({ message: 'Formato de `checklistData` inválido ou vazio.' });
      }

      const sequelize = BrainstormingUserStories.sequelize;
      const results = [];
      const recommendedCards = {};

      await sequelize.transaction(async (t) => {
        for (const item of updates) {
          if (!item.userStoryId) {
            results.push({ userStoryId: null, updated: false, reason: 'userStoryId ausente' });
            continue;
          }

          const [count] = await BrainstormingUserStories.update(
            { checklist: item.checklist },
            { where: { brainstormingId, userStoryId: item.userStoryId }, transaction: t },
          );

          if (count === 0) {
            results.push({ userStoryId: item.userStoryId, updated: false, reason: 'Associação não encontrada' });
          } 
          if (count > 0) {
            results.push({ userStoryId: item.userStoryId, updated: true });
            const cards = await BrainstormingUserStories.generateRecommendedCards(item.checklist);
            recommendedCards[item.userStoryId] = cards;
          }
        }
      });

      return response.status(200).json({ 
                  message: 'Checklist e recomendações geradas com sucesso.', 
                  results, 
                  recommendedCards 
      });    
      } catch (error) {
      return response.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  async startBrainstormingSession(request, response) {
    const { brainstormingId } = request.params;
    const requestingUserId = request.userId;
    try {

      const brainstorming = await Brainstorming.findByPk(brainstormingId);
      if (!brainstorming) {
        return response.status(404).json({ message: 'Brainstorming não encontrado.' });
      }
      
      const project = await Project.findByPk(brainstorming.projectId);
      if (!project || project.status !== 'Ativo' && project.status !== 'Novo') { 
          return response.status(403).json({ message: "O projeto associado não está ativo. Não é possível iniciar a sessão." });
      }

      const userrole = await BrainstormingUserRole.findOne({
        where: { brainstormingId, userId: requestingUserId },
      });

      if (!userrole || userrole.role !== 'Moderador') {
        return response.status(403).json({ message: 'Apenas moderadores podem iniciar a sessão de brainstorming.' });
      }

      const sessionData = await BrainstormingUserStories.findAll({
            where: { brainstormingId },
            include: [{ 
                model: UserStories, 
                attributes: ['id', 'userStorieNumber', 'userStoriesTitle', 'card', 'conversation', 'confirmation']
            }],
            attributes: ['userStoryId', 'checklist', 'order'] 
        });

      sessionStorage.sort((a,b) => {
        const storyA = a.order || Number.MAX_SAFE_INTEGER;
        const storyB = b.order || Number.MAX_SAFE_INTEGER;
        
        if(a.order !== null && b.order !== null){
          return a.order-b.order;
        }

        if (a.order !== null) return -1;
        
        if (b.order !== null) return 1;

        const getNumber = (str) => {
            const match = str.match(/\d+/);
            return match ? parseInt(match[0], 10) : Infinity;
        };

        const numA = getNumber(storyA.userStorieNumber);
        const numB = getNumber(storyB.userStorieNumber);

        if (numA !== numB) {
            return numA - numB; 
        }

        return storyA.userStorieNumber.localeCompare(storyB.userStorieNumber);
      })
        
      const formattedSession = sessionData.map(data => {
          const us = data.UserStory.toJSON(); 
          return {
              userStoryId: data.userStoryId,
              userStorieNumber: us.userStorieNumber,
              userStoriesTitle: us.userStoriesTitle,
              card: us.card,
              conversation: us.conversation,
              confirmation: us.confirmation,
              checklist: data.checklist, 
              order: data.order
          };
      });

      return response.status(200).json({
          message: "Sessão iniciada com sucesso. Quadro de brainstorming carregado.",
          brainstormingId: brainstorming.id,
          sessionData: formattedSession,
      });

    } catch (error) {
        console.error("Erro ao iniciar a sessão de brainstorming:", error.message);
        return response.status(500).json({ message: "Internal server error" });
    }
  },

  async createNote(request, response) {
    try {
      const { brainstormingId, userStoryId, cardCode } = request.params;
      const { text } = request.body;
      const userId = request.userId;

      if (!text) {
        return response.status(400).json({ message: "texto é obrigatório" });
      }

      const role = await BrainstormingUserRole.findOne({
        where: { userId, brainstormingId, roleInBrainstorming: "Moderador" },
      });

      if (!role) {
        return response.status(403).json({ message: "Apenas moderadores podem criar anotações" });
      }

      const existing = await Note.findOne({
        where: { brainstormingId, userStoryId, cardCode },
      });

      if (existing) {
        return response.status(409).json({ message: "Já existe anotação para esta carta" });
      }

      const note = await Note.create({
        brainstormingId,
        userStoryId,
        cardCode,
        text,
        authorId: userId,
      });

      return response.status(201).json(note);
    } catch {
      return response.status(500).json({ message: "Internal server error" });
    }
  },

  async updateNote (request, response) {
    try{
      const { brainstormingId, userStoryId, cardCode } = request.params;
      const { text } = request.body;
      const userId = request.userId;

    if (!text) {
      return response.status(400).json({ message: "texto é obrigatório" });
    }

    const role = await BrainstormingUserRole.findOne({
      where: { userId, brainstormingId, roleInBrainstorming: "Moderador" },
    });

    if (!role) {
      return response.status(403).json({ message: "Apenas moderadores podem editar anotações" });
    }

    const note = await Note.findOne({
      where: { brainstormingId, userStoryId, cardCode },
    });
    if (!note) {
      return response.status(404).json({ message: "Anotação não encontrada para esta carta" });
    }

    await note.update({ text });

    return response.status(200).json(note);
    } catch {
      return response.status(500).json({ message: "Internal server error"});
    }
  },

  async getNote (request, response) {
    try{
      const { brainstormingId, userStoryId, cardCode } = request.params;
      const userId = request.userId;

      const role = await BrainstormingUserRole.findOne({
        where: { userId, brainstormingId },
      });

      if (!role){
        return response.status(403).json({ message: "Apenas membros do brainstorming podem vizualizar anotações"});
      }

      const note = await Note.findOne({
        where: { brainstormingId, userStoryId, cardCode },
      });

      return response.status(200).json(note);
    } catch {
      return response.status(500).json({ message: "Internal server error"});  
    }
  },
  async updateBrainstormingUserStoryOrder(request, response) {
    const { brainstormingId } = request.params;
    const { orderedUserStoriesID } = request.body;
    const requestingUserId = request.userId;
    
    try {

      const userRole = await BrainstormingUserRole.findOne({
        where: { brainstormingId, userId: requestingUserId },
      });

      if (!userRole || userRole.role !== 'Moderador') {
        return response.status(403).json({ message: "Apenas moderadores podem alterar a ordem das histórias." });
      }
      
      if (orderedUserStoriesID.length > 3){
        return response.status(403).json({message: "O sistema permite a ordenação manual de no máximo 3 histórias por vez."})
      }
      const linkedStories = await BrainstormingUserStories.findAll({
        where: { brainstormingId },
        attributes: ['userStoryId']
      });

      if (linkedStories.length === 0) {
        return response.status(400).json({ 
            message: "Não existem histórias vinculadas a esta sessão. Selecione histórias antes de ordenar." 
        });
      }

      const linkedIds = linkedStories.map(s => s.userStoryId);

      const allIdsAreValid = orderedUserStoriesID.every(id => linkedIds.includes(id));

      if (!allIdsAreValid) {
        return response.status(400).json({ 
            message: "Uma ou mais histórias enviadas não estão vinculadas a esta sessão de brainstorming." 
        });
      }
      const sequelize = BrainstormingUserStories.sequelize;
      await sequelize.transaction(async (t) => {
        await BrainstormingUserStories.update(
          { order: null },
          { where: {brainstormingId}, transaction: t }
        );

        for (let i = 0; i < orderedUserStoriesID.length; i++) {
          const userStoryId = orderedUserStoriesID[i];
          await BrainstormingUserStories.update(
            { order: i + 1 },
            { where: { brainstormingId, userStoryId }, transaction: t }
          );
        }
      })

      return response.status(200).json({ message: "Ordem das histórias de usuário atualizada com sucesso." });

    }catch (error) {
        return response.status(500).json({ message: "Erro ao ordenar histórias.", error: error.message });
    }
  },
  async createOrGetShareLink (request, response) {
    try {
      const { brainstormingId } = request.params;
      const { roleOnacess } = request.body;
      const userId = request.userId;

      const brainstorming = await Brainstorming.findByPk(brainstormingId);
      if (!brainstorming) {
        return response.status(404).json({ message: "Brainstorming não encontrado"});
      }

      const role = await BrainstormingUserRole.findOne({
        where: { userId, brainstormingId, roleInBrainstorming: "Moderador" },
      });

      if (!role) {
        return response.status(403).json({ message: "Apenas moderadores podem gerar o link de compartilhamento"});
      }

      if (roleOnacess) {
        if (!["Moderador", "Participante"].includes(roleOnacess)) {
          return response.status(400).json({ message: "Papel inválido"})
        }
        brainstorming.shareRoleOnAcess = roleOnacess;
      }

      if (!brainstorming.shareToken) {
        brainstorming.shareToken = crypto.randomBytes(24).toString("hex");
      }

      await brainstorming.save();

      const baseUrl = process.env.FRONTEND_BASE_URL || "https://app.usarp.com";
      const shareUrl = `${baseUrl}/brainstorming/shared/${brainstorming.shareToken}`;

      return response.status(200).json({
        brainstormingId: brainstorming.id,
        title: brainstorming.brainstormingTitle,
        roleOnacess: brainstorming.shareRoleOnAcess,
        shareUrl,
      })
    } catch (error) {
      return response.status(500).json({ message: "Internal server error"});
    }
  },

  async resolveShareLink (request, response) {
    try {
      const { token } = request.params;
      const brainstorming = await brainstorming.findOne({
        where: { shareToken: token },
        attributes: ["id","brainstormingTittle", "shareRoleOnAcess"],
      });
      
      if (!brainstorming) {
        return response.status(404).json({ message: "Link inváldo ou brainstorming não encontrado"});
      }

      return response.status(200).json({
        brainstormingId: brainstorming.id,
        title: brainstorming.brainstormingTitle,
        roleOnacess: brainstorming.shareRoleOnAcess,
      });

    } catch (error) {
      return response.status(500).json({ message: "Internal server error"});
    }
  },

  async accessSharedBrainstorming(request, response) {
    try {
      const { token } = request.params;
      const { name, email } = request.body;

      if (!name || !email) {
        return response.status(400).json({
          message: "Nome e e-mail são obrigatórios para acessar o brainstorming",
        });
      }

      const brainstorming = await Brainstorming.findOne({
        where: { shareToken: token },
      });

      if (!brainstorming) {
        return response.status(404).json({ message: "Link inválido ou brainstorming não encontrado" });
      }

      let user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          fullName: name,
          email,
          gender: "Prefiro não informar",
          birthdate: "01/01/2000",
          profile: "Profissional da Indústria",
          organization: "Convidado",
          password: "Temp123!",
        });
      } else if (!user.fullName) {
        await user.update({ fullName: name });
      }

      const roleToApply = brainstorming.shareRoleOnAccess;

      const [userRole, created] = await BrainstormingUserRole.findOrCreate({
        where: {
          userId: user.id,
          brainstormingId: brainstorming.id,
        },
        defaults: {
          roleInBrainstorming: roleToApply,
        },
      });

      if (!created && userRole.roleInBrainstorming !== roleToApply) {
        await userRole.update({ roleInBrainstorming: roleToApply });
      }

      return response.status(200).json({
        message: "Acesso concedido ao brainstorming",
        brainstormingId: brainstorming.id,
        userId: user.id,
        roleInBrainstorming: roleToApply,
      });
    } catch (error) {
      return response.status(500).json({ message: "Internal server error" });
    }
  },
};