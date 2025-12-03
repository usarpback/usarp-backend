"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("brainstorming_userstories", {
      brainstorming_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "brainstormings",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_story_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "user_stories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      checklist: {
        type: Sequelize.JSON, 
        allowNull: true,
        defaultValue: null,
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
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
    await queryInterface.dropTable("brainstorming_userstories");
  },
};
