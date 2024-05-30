const { Model, DataTypes } = require("sequelize");
const { parse, isValid, format } = require("date-fns");

class Brainstorming extends Model {
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
        },
        brainstormingTitle: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'Brainstorming title'  field cannot be empty",
            },
            notEmpty: {
              msg: "The 'Brainstorming title' field cannot be empty",
            },
            is: {
              args: /^[\p{L}0-9!@#$%^&*ç()_\-+=\[\]{}\\|:;'"<> ]+$/iu,
              msg: "The brainstorming title contains invalid characters",
            },
          },
        },
        project: {
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
        userStories: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The 'User stories' field cannot be empty",
            },
            notEmpty: {
              msg: "The 'User stories' field cannot be empty",
            },
          },
        },
      },
      {
        sequelize,
        modelName: "Brainstorming",
        tableName: "brainstormings",
      },
    );
  }
}

module.exports = Brainstorming;
