const { Model, DataTypes } = require("sequelize");

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
              msg: "The brainstorming title  field cannot be empty",
            },
            notEmpty: {
              msg: "The brainstorming title field cannot be empty",
            },
          },
        },
        project: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The project field cannot be empty",
            },
            notEmpty: {
              msg: "The project field cannot be empty",
            },
          },
        },
        brainstormingDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The brainstorming date field cannot be empty",
            },
            notEmpty: {
              msg: "The brainstorming date field cannot be empty",
            },
          },
        },
        brainstormingTime: {
          type: DataTypes.TIME,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The brainstorming time cannot be empty",
            },
            notEmpty: {
              msg: "The brainstorming time cannot be empty",
            },
          },
        },
        userStories: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: "The user stories field cannot be empty",
            },
            notEmpty: {
              msg: "The user stories field cannot be empty",
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
