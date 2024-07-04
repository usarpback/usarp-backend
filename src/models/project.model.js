const { Model, DataTypes } = require("sequelize");

class Project extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: "creatorId",
      as: "creator",
      onDelete: "CASCADE",
    });

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
            len(value) {
              if (value && value.trim().length < 5) {
                throw new Error(
                  "The project name must be at least 5 characters long",
                );
              }
            },
            containsInvalidCharacters(value) {
              if (
                value &&
                value.trim().length > 5 &&
                !/^[\p{L}0-9!@#$%^&*ç()_\-+=\[\]{}\\|:;'"<> ]+$/iu.test(value)
              ) {
                throw new Error("The project name contains invalid characters");
              }
            },
          },
          set(value) {
            this.setDataValue("projectName", value.trim());
          },
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            len(value) {
              if (value && value.trim().length < 5) {
                throw new Error(
                  "The description must be at least 5 characters long",
                );
              }
            },
            containsInvalidCharacters(value) {
              if (
                value &&
                value.trim().length > 5 &&
                !/^[\p{L}0-9!@#$%^&*ç()_\-+=\[\]{}\\|:;'"<> ]+$/iu.test(value)
              ) {
                throw new Error("The description contains invalid characters");
              }
            },
          },
          set(value) {
            this.setDataValue("description", value.trim());
          },
        },
        creatorId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
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
