const { Model, DataTypes } = require("sequelize");

class BrainstormingProject extends Model {
  static associate(models) {
    this.belongsTo(models.Project, {
      foreignKey: "projectId",
      targetKey: "id",
      onDelete: "CASCADE",
    });
    this.belongsTo(models.Brainstorming, {
      foreignKey: "brainstormingId",
      targetKey: "id",
      onDelete: "CASCADE",
    });
  }
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        projectId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: "projects",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        brainstormingId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: "brainstormings",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
      },
      {
        sequelize,
        modelName: "BrainstormingProject",
        tableName: "brainstorming_project",
      },
    );
  }
}

module.exports = BrainstormingProject;
