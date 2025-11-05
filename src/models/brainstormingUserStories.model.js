const { Model, DataTypes } = require("sequelize");

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
}

module.exports = BrainstormingUserStories;
