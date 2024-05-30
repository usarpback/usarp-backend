const { Model, DataTypes } = require("sequelize");

class Project extends Model {
  static associate(models) {
    this.belongsToMany(models.User, {
      through: "ProjectUser",
      foreignKey: "projectId",
      as: "members",
    });

    this.belongsToMany(models.Project, {
      through: "BrainstormingProject",
      foreignKey: "projectId",
      as: "brainstormings",
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
          unique: true,
        },
        projectName: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            notNull: {
              msg: "The project name field cannot be empty",
            },
            notEmpty: {
              msg: "The project name field cannot be empty",
            },
            len: {
              args: [5],
              msg: "The project name must be at least 5 characters long",
            },
            is: {
              args: /^[\p{L}0-9!@#$%^&*ç()_\-+=\[\]{}\\|:;'"<> ]+$/iu,
              msg: "The project name contains invalid characters",
            },
          },
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            len: {
              args: [5],
              msg: "The description must be at least 5 characters long",
            },
            is: {
              args: /^[\p{L}0-9!@#$%^&*ç()_\-+=\[\]{}\\|:;'"<> ]+$/iu,
              msg: "The description contains invalid characters",
            },
          },
        },
        creatorId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("Novo", "Excluído", "Mais antigo"),
          allowNull: true,
          defaultValue: "Novo",
          validate: {
            isIn: {
              args: [["Novo", "Excluído", "Mais antigo"]],
              msg: "Status must be 'Novo', 'Excluído' or 'Mais antigo'.",
            },
          },
        },
      },
      {
        sequelize,
        modelName: "Project",
        tableName: "projects",
      },
    );
  }
}

module.exports = Project;
