const { Model, DataTypes } = require("sequelize");
const { parse, isValid, format } = require("date-fns");
const { validateDateTimeInFuture } = require("../helpers/dateAndTime");

class Brainstorming extends Model {
  static associate(models) {
    this.belongsToMany(models.UserStories, {
      through: "brainstorming_userstories",
      foreignKey: "brainstormingId",
      otherKey: "userStoryId",
      as: "userStories",
    });

    this.belongsTo(models.User, {
      foreignKey: "creatorId",
      targetKey: "id",
      onDelete: "CASCADE",
    });

    this.belongsToMany(models.User, {
      through: 'BrainstormingUserRole',
      foreignKey: 'brainstormingId',
      otherKey: 'userId',
      as: 'users',
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
        brainstormingTitle: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'Brainstorming title' field cannot be empty",
            },
            notEmpty: {
              msg: "The 'Brainstorming title' field cannot be empty",
            },
            is: {
              args: /^[\p{L}0-9!@#$%^&*ç()_\-+=[\]{}\\|:;'"<> ]+$/iu,
              msg: "The brainstorming title contains invalid characters",
            },
          },
          set(value) {
            this.setDataValue("brainstormingTitle", value.trim());
          },
        },
        projectId: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'Project' field cannot be empty",
            },
            notEmpty: {
              msg: "The 'Project' field cannot be empty",
            },
          },
        },
        brainstormingDate: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'Brainstorming date' field cannot be empty",
            },
            notEmpty: {
              msg: "The 'Brainstorming date' field cannot be empty",
            },
            isValidDate(value) {
              const parsedDate = parse(value, "dd/MM/yyyy", new Date());
              if (
                !isValid(parsedDate) ||
                format(parsedDate, "dd/MM/yyyy") !== value
              ) {
                throw new Error(
                  "The 'Brainstorming date' field must be a valid date and in the format DD/MM/AAAA.",
                );
              }
            },
          },
        },
        brainstormingTime: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'Brainstorming time' cannot be empty",
            },
            notEmpty: {
              msg: "The 'Brainstorming time' cannot be empty",
            },
            isValidTime(value) {
              const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
              if (!timeRegex.test(value)) {
                throw new Error(
                  "The 'Brainstorming time' field must be in the format HH:MM and represent a valid time.",
                );
              }
            },
          },
        },
        status: {
          type: DataTypes.ENUM('Novo', 'Bloqueado', 'Concluído/Encerrado'),
          allowNull: true,
          defaultValue: 'Novo',
          validate: {
            isIn: {
              args: [['Novo', 'Bloqueado', 'Concluído/Encerrado']],
              msg: "Status must be one of 'Novo', 'Bloqueado' or 'Concluído/Encerrado'.",
            },
          },
        },
      },
      {
        sequelize,
        modelName: "Brainstorming",
        tableName: "brainstormings",
        hooks: {
          beforeValidate(brainstorming) {
            validateDateTimeInFuture(
              brainstorming.brainstormingDate,
              brainstorming.brainstormingTime,
            );
          },
          beforeUpdate: async (brainstorming, options) => {
            if (!brainstorming.changed || !brainstorming.changed("projectId")) return;
            const existing = await sequelize.models.Brainstorming.findByPk(brainstorming.id);
            if (!existing) return;
            if (["Bloqueado", "Concluído/Encerrado"].includes(existing.status)) {
              throw new Error("Não é possível associar um projeto a um brainstorming com status 'Bloqueado' ou 'Concluído/Encerrado'.");
            }
          },
        },
      },
    );
  }
}

module.exports = Brainstorming;
