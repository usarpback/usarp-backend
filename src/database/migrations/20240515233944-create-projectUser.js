"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("project_user", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      project_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: "projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      member_email: {
        allowNull: false,
        type: Sequelize.STRING,
        references: {
          model: "users",
          key: "email",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role_in_project: {
        allowNull: false,
        type: Sequelize.ENUM("Moderador", "Participante"),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("project_user");
  },
};
