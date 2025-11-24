"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_stories", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_storie_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_stories_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      card: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      conversation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      confirmation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("Ativo", "Inativo", "Nova", "Bloqueado", 
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
      creator_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("user_stories");
  },
};
