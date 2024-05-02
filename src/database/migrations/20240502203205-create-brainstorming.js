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
      brainstorming_title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      project: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      brainstorming_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      brainstorming_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      user_stories: {
        type: Sequelize.STRING(255),
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
