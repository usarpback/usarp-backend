const { Model, DataTypes } = require("sequelize");

class UserStories extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: "creatorId",
      targetKey: "id",
      onDelete: "CASCADE",
    });

    this.belongsTo(models.Project, {
      foreignKey: "projectId",
      targetKey: "id",
      onDelete: "CASCADE",
    });

    this.belongsToMany(models.Brainstorming, {
      through: "brainstorming_userstories",
      foreignKey: "userStoryId",
      otherKey: "brainstormingId",
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
        },
        userStorieNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'User Story Number' field cannot be empty",
            },
            notEmpty: {
              msg: "The 'User Story Number' field cannot be empty",
            },
            is: {
              args: /^[a-zA-Z0-9]+$/,
              msg: "The 'User Story Number' must contain only letters (upper or lower case) and numbers",
            },
          },
        },
        userStoriesTitle: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'User Stories title' field cannot be empty",
            },
            notEmpty: {
              msg: "The 'User Stories title' field cannot be empty",
            },
            is: {
              args: /^[\p{L}0-9!@#$%^&*ç()_\-+=[\]{}\\|:;'"<> ]+$/iu,
              msg: "The user stories title contains invalid characters",
            },
          },
          set(value) {
            this.setDataValue("userStoriesTitle", value.trim());
          },
        },
        card: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            notEmpty: {
              msg: "The 'card' field cannot be empty",
            },
          },
          set(value) {
            this.setDataValue("card", value.trim());
          },
        },
        conversation: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            notEmpty: {
              msg: "The 'conversation' field cannot be empty",
            },
          },
          set(value) {
            this.setDataValue("conversation", value.trim());
          },
        },
        confirmation: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            notEmpty: {
              msg: "The 'confirmation' field cannot be empty",
            },
          },
          set(value) {
            this.setDataValue("confirmation", value.trim());
          },
        },
        status: {
          type: DataTypes.ENUM("Ativo", "Inativo", "Nova", "Bloqueado", 
                              "Associado a um brainstorming", "Associado a vários brainstormings", 
                              "Concluído/Encerrado"),
          allowNull: true,
          defaultValue: "Nova",
          validate: {
            isIn: {
              args: [["Ativo", "Inativo", "Nova", "Bloqueado", 
                      "Associado a um brainstorming", "Associado a vários brainstormings", 
                      "Concluído/Encerrado"]],
              msg: "Status must be one of the predefined values.",
            },
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
        projectId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "projects",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
      },
      {
        sequelize,
        modelName: "UserStories",
        tableName: "user_stories",
      },
    );
  }
}

module.exports = UserStories;
