const { Model, DataTypes } = require("sequelize");

class ProjectUser extends Model {
  static associate(models) {
    this.belongsTo(models.Project, {
      foreignKey: "projectId",
      targetKey: "id",
      onDelete: "CASCADE",
    });
    this.belongsTo(models.User, {
      foreignKey: "memberEmail",
      targetKey: "email",
      onDelete: "CASCADE",
    });

    this.belongsTo(models.User, {
      foreignKey: "memberId",
      targetKey: "id",
      as: "memberDetails",
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
        memberId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        fullName: {
          type: DataTypes.STRING,
          allowNull: false,
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
  static addHookBeforeCreate(models) {
    this.addHook("beforeCreate", async (projectUser, options) => {
      if (!projectUser.fullName) {
        const user = await models.User.findByPk(projectUser.memberId);
        if (user) {
          projectUser.fullName = user.fullName;
        }
      }
    });
  }
}

module.exports = ProjectUser;
