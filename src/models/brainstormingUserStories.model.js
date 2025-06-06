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
      },
    );
  }
}

module.exports = BrainstormingUserStories;
