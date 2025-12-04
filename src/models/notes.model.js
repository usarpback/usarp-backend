const { Model, DataTypes } = require("sequelize");

class Note extends Model {
  static associate(models) {
    this.belongsTo(models.Brainstorming, {
      foreignKey: "brainstormingId",
      onDelete: "CASCADE",
    });
    this.belongsTo(models.UserStories, {
      foreignKey: "userStoryId",
      onDelete: "CASCADE",
    });
    this.belongsTo(models.User, {
      foreignKey: "authorId",
      onDelete: "CASCADE",
    });
  }

  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        brainstormingId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        userStoryId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        cardCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        text: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        authorId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "Note",
        tableName: "notes",
      }
    );
  }
}

module.exports = Note;
