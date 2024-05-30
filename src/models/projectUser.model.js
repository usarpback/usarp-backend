const { Model, DataTypes } = require("sequelize");

class ProjectUser extends Model {
  static associate(models) {
    this.belongsTo(models.Project, {
      foreignKey: "projectId",
      targetKey: "id",
    });
    this.belongsTo(models.User, {
      foreignKey: "memberEmail",
      targetKey: "email",
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
        memberEmail: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'member email' field cannot be empty",
            },
            notEmpty: {
              msg: "The 'member email' field cannot be empty",
            },
            isEmail: {
              msg: "The member email must be a valid email address",
            },
            is: {
              args: /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              msg: "The member email contains invalid characters or format",
            },
          },
          references: {
            model: "users",
            key: "email",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        roleInProject: {
          type: DataTypes.ENUM("Moderador", "Participante"),
          allowNull: false,
          validate: {
            isIn: {
              args: [["Moderador", "Participante"]],
              msg: "The role in the project must be either 'Moderador' or 'Participante'",
            },
            notNull: {
              msg: "The 'Role in the project' field cannot be empty",
            },
            notEmpty: {
              msg: "The 'Role in the project' field cannot be empty",
            },
          },
        },
      },
      {
        sequelize,
        modelName: "ProjectUser",
        tableName: "project_user",
      },
    );
  }
}

module.exports = ProjectUser;
