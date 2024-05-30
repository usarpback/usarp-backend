"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("brainstormings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("UUID()"),
        allowNull: false,
        primaryKey: true,
      },
      creator_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      brainstorming_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      project: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      brainstorming_date: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      brainstorming_time: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_stories: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("brainstormings");
  },
};
