const { Model, DataTypes } = require("sequelize");
const { USARP_CARD_MAPPING } = require('../config/usarpCardMapping'); 

class BrainstormingUserStories extends Model {
  static associate(models) {
    this.belongsTo(models.Brainstorming, {
      foreignKey: "brainstormingId",
      targetKey: "id",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    this.belongsTo(models.UserStories, {
      foreignKey: "userStoryId",
      targetKey: "id",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  }

  static init(sequelize) {
    return super.init(
      {
        brainstormingId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "brainstorming_id",
          references: {
            model: "brainstormings",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        userStoryId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "user_story_id",
          references: {
            model: "user_stories",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        checklist: {
          type: DataTypes.JSON, 
          allowNull: true,
          defaultValue: null,
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: "Define a posição da US na fila de execução do brainstorming (1, 2, 3...)"
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "updated_at",
        },
      },
      {
        sequelize,
        modelName: "BrainstormingUserStories",
        tableName: "brainstorming_userstories",
        underscored: true,
        hooks: {

          afterCreate: async (record, options) => {
            const UserStories = sequelize.models.UserStories;
            if (!UserStories) return;

            const count = await sequelize.models.BrainstormingUserStories.count({
                where: { userStoryId: record.userStoryId },
                transaction: options.transaction
            });

            let newStatus;
            if (count === 1) {
                newStatus = 'Associada a um brainstorming'; 
            } else if (count > 1) {
                newStatus = 'Associada a vários brainstormings'; 
            } else {
                return;
            }

            await UserStories.update(
                { status: newStatus },
                { where: { id: record.userStoryId }, transaction: options.transaction }
            );
          },

          beforeCreate: async (record, options) => {
            const Brainstorming = sequelize.models.Brainstorming;
            if (!Brainstorming) return;
            const brainstorming = await Brainstorming.findByPk(record.brainstormingId);
            if (!brainstorming) {
              throw new Error("Brainstorming not found for association.");
            }
            if (["Bloqueado", "Concluído/Encerrado"].includes(brainstorming.status)) {
              throw new Error("Não é possível associar histórias de usuário a um brainstorming com status 'Bloqueado' ou 'Concluído/Encerrado'.");
            }
          },
          
          beforeBulkCreate: async (records, options) => {
            const Brainstorming = sequelize.models.Brainstorming;
            if (!Brainstorming) return;
            const brainstormingIds = Array.from(new Set(records.map(r => r.brainstormingId)));
            const brainstormings = await Brainstorming.findAll({ where: { id: brainstormingIds } });
            const map = new Map(brainstormings.map(b => [b.id, b]));
            for (const rec of records) {
              const b = map.get(rec.brainstormingId);
              if (!b) {
                throw new Error(`Brainstorming with id '${rec.brainstormingId}' not found for association.`);
              }
              if (["Bloqueado", "Concluído/Encerrado"].includes(b.status)) {
                throw new Error("Não é possível associar histórias de usuário a um brainstorming com status 'Bloqueado' ou 'Concluído/Encerrado'.");
              }
            }
          }
        },
      },
    );
  }

  /**
   * Gera as cartas recomendadas (US027) com base nas seleções do checklist (US026).
   * @param {object} checklistData - O objeto JSON salvo no campo 'checklist' (ex: { "Feedback do sistema": ["Sessão Expirada"], ... })
   * @returns {Array<object>} Um array de cartas recomendadas, ordenadas por mecanismo.
   */
  static generateRecommendedCards(checklistData) {
    const ORDERED_MECHANISMS = [
      'Feedback do sistema',
      'Personalização do sistema',
      'Controle e suporte ao usuário',
      'Entrada de dados do usuário',
    ];

    const recommendedCards = [];

    ORDERED_MECHANISMS.forEach((mechanism) => {
      const selectedSubItems = checklistData && checklistData[mechanism];

      if (selectedSubItems && selectedSubItems.length > 0) {
        recommendedCards.push({
          type: 'MECANISMO_HEADER',
          name: mechanism,
          cards: [],
        });

        const currentGroup = recommendedCards[recommendedCards.length - 1].cards;
        selectedSubItems.forEach((subItem) => {
          const subItemKey = subItem && typeof subItem === 'string' ? subItem.trim() : subItem;
          const cardsToAppend = USARP_CARD_MAPPING[mechanism] && USARP_CARD_MAPPING[mechanism][subItemKey];

          if (cardsToAppend && Array.isArray(cardsToAppend)) {
            currentGroup.push(...cardsToAppend);
          }
        });
      }
    });

    return recommendedCards;
  }
}


module.exports = BrainstormingUserStories;
